"""Single-model orchestrator: load config, run lm-eval, transform, publish.

run_one(model, suite_id, ...) -> run/v1 dict

CLI: python -m bench.runner.run_one --model ... --suite ... [--backend hf]
     [--limit N] [--local] [--adapter X] [--host X] [--base X]
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path
from typing import Any

from bench.runner.lm_eval_to_run import to_run_v1
from bench.runner.suite_cfg import load_suite_cfg, validate_suite_cfg

# ── Exceptions ────────────────────────────────────────────────────────────


class RunnerError(Exception):
    """Base exception for the benchmark runner."""


class RunnerOOM(RunnerError):
    """CUDA / torch out-of-memory during eval."""


class RunnerBadRun(RunnerError):
    """The run/v1 failed validation (publish rejected it)."""


class RunnerConfigError(RunnerError):
    """Configuration error: missing token, bad CLI usage, etc."""


# ── lm-eval invocation (monkeypatched in tests) ──────────────────────────

_OOM_PATTERNS = re.compile(
    r"CUDA out of memory|torch\.OutOfMemoryError|OutOfMemoryError",
    re.IGNORECASE,
)


def _invoke_lm_eval(
    model: str,
    suite_cfg: dict[str, Any],
    *,
    backend: str = "hf",
    limit: int | None = None,
) -> dict[str, Any]:
    """Build and run the lm-eval command, return the parsed results JSON.

    Raises RunnerOOM if stderr indicates a CUDA/torch OOM.
    """
    # Collect task names from the suite config
    task_names: list[str] = []
    for t in suite_cfg["tasks"]:
        if t.get("gen") is not None:
            task_names.append(t["gen"]["task"])
        if t.get("mcq") is not None:
            task_names.append(t["mcq"]["task"])
    for g in suite_cfg.get("guards", []):
        task_names.append(g["task"])

    with tempfile.TemporaryDirectory(prefix="lm_eval_") as tmpdir:
        # Build --model_args: always includes pretrained=<model>.
        # For vllm backend, fold in vllm tuning dict from suite config
        # (e.g. gpu_memory_utilization=0.7,max_model_len=2048).
        model_args_parts = [f"pretrained={model}"]
        if backend == "vllm":
            vllm_cfg = suite_cfg.get("vllm", {})
            for k, v in vllm_cfg.items():
                model_args_parts.append(f"{k}={v}")
        model_args = ",".join(model_args_parts)

        cmd = [
            "lm_eval",
            "--model", backend,
            "--model_args", model_args,
            "--include_path", "bench/runner/tasks",
            "--tasks", ",".join(task_names),
            "--num_fewshot", str(suite_cfg.get("n_shot", 0)),
            "--output_path", tmpdir,
        ]
        if limit is not None:
            cmd += ["--limit", str(limit)]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
        )

        # Check for OOM in stderr before checking return code
        if result.stderr and _OOM_PATTERNS.search(result.stderr):
            raise RunnerOOM(f"OOM during eval of {model}: {result.stderr[:500]}")

        if result.returncode != 0:
            raise RunnerError(
                f"lm_eval exited {result.returncode}: {result.stderr[:500]}"
            )

        # Find the results JSON written by lm-eval
        # lm-eval writes to <output_path>/<model_name>/results_*.json
        results_dir = Path(tmpdir)
        json_files = list(results_dir.rglob("results_*.json"))
        if not json_files:
            raise RunnerError(
                f"lm_eval produced no results JSON in {tmpdir}"
            )

        with open(json_files[0], "r", encoding="utf-8") as f:
            return json.load(f)


# ── Meta builder ─────────────────────────────────────────────────────────


def _slugify(s: str) -> str:
    """Turn a model name like 'Qwen/Qwen2.5-0.5B-Instruct' into a slug."""
    s = s.lower()
    s = re.sub(r"[^a-z0-9._-]", "-", s)
    s = re.sub(r"-+", "-", s)
    s = s.strip("-")
    return s


def _build_meta(
    model: str,
    suite_id: str,
    meta_overrides: dict[str, Any] | None = None,
    *,
    backend: str = "hf",
) -> dict[str, Any]:
    """Build the meta dict for to_run_v1.

    Fields from meta_overrides take precedence over defaults.
    """
    overrides = meta_overrides or {}

    model_id = overrides.get("id") or _slugify(model)

    meta: dict[str, Any] = {
        "id": model_id,
        "model": {
            "name": model,
        },
        "base": overrides.get("base", "qwen3.5-9b"),
        "suite": suite_id,
        "date": overrides.get("date", date.today().isoformat()),
        "artifact": {
            "adapter": overrides.get("adapter", ""),
            "host": overrides.get("host", ""),
        },
    }

    return meta


# ── Publish ───────────────────────────────────────────────────────────────


def _publish(run_v1: dict[str, Any], *, local: bool = False) -> None:
    """Publish run/v1 via the Node CLI.

    Exit code mapping:
      2          -> RunnerConfigError (usage error)
      1 + token  -> RunnerConfigError (BLOB_READ_WRITE_TOKEN missing)
      1 (other)  -> RunnerBadRun (validation failure)
    """
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False, prefix="run_"
    ) as f:
        json.dump(run_v1, f)
        json_path = f.name

    try:
        cmd = ["node", "scripts/publish-run.mjs"]
        if local:
            cmd.append("--local")
        cmd.append(json_path)

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            env={**os.environ},
        )

        if result.returncode == 0:
            return

        stderr = result.stderr or ""

        if result.returncode == 2:
            raise RunnerConfigError(
                f"publish-run usage error (exit 2): {stderr}"
            )

        if "BLOB_READ_WRITE_TOKEN" in stderr:
            raise RunnerConfigError(
                f"publish-run token missing: {stderr}"
            )

        # Exit 1 without token message = validation failure
        raise RunnerBadRun(
            f"publish-run validation failed (exit {result.returncode}): {stderr}"
        )
    finally:
        try:
            os.unlink(json_path)
        except OSError:
            pass


# ── Orchestrator ──────────────────────────────────────────────────────────


def run_one(
    model: str,
    suite_id: str,
    *,
    meta: dict[str, Any] | None = None,
    backend: str = "hf",
    limit: int | None = None,
    local: bool = False,
    suite_path: str | None = None,
) -> dict[str, Any]:
    """Run a single model through the benchmark suite and publish results.

    Steps:
      1. Load suite config.
      2. Invoke lm-eval (or the monkeypatched stand-in).
      3. Transform results to run/v1.
      4. Publish via Node CLI.
      5. Return the run/v1 dict.
    """
    # 1. Load suite config
    cfg_path = suite_path or f"bench/runner/suite_{suite_id}.yaml"
    suite_cfg = load_suite_cfg(cfg_path)

    # 1b. Validate suite config
    ok, errors = validate_suite_cfg(suite_cfg)
    if not ok:
        raise RunnerConfigError(
            f"invalid suite config ({cfg_path}): {'; '.join(errors)}"
        )

    # 2. Invoke lm-eval
    lm_results = _invoke_lm_eval(model, suite_cfg, backend=backend, limit=limit)

    # 3. Build meta and transform
    built_meta = _build_meta(model, suite_id, meta, backend=backend)
    run_v1 = to_run_v1(lm_results, suite_cfg, built_meta)

    # 4. Publish
    _publish(run_v1, local=local)

    # 5. Return
    return run_v1


# ── CLI ───────────────────────────────────────────────────────────────────


def _cli() -> None:
    parser = argparse.ArgumentParser(
        description="Run a single model through the benchmark suite."
    )
    parser.add_argument("--model", required=True, help="HF model id")
    parser.add_argument("--suite", required=True, help="Suite id (e.g. open-pl-v1)")
    parser.add_argument("--backend", default="hf", help="lm-eval backend (default: hf)")
    parser.add_argument("--limit", type=int, default=None, help="Sample limit per task")
    parser.add_argument("--local", action="store_true", help="Publish locally (fs, no Blob)")
    parser.add_argument("--adapter", default=None, help="Adapter name for artifact metadata")
    parser.add_argument("--host", default=None, help="Host name for artifact metadata")
    parser.add_argument("--base", default=None, help="Base model override (default: qwen3.5-9b)")

    args = parser.parse_args()

    meta_overrides: dict[str, Any] = {}
    if args.adapter:
        meta_overrides["adapter"] = args.adapter
    if args.host:
        meta_overrides["host"] = args.host
    if args.base:
        meta_overrides["base"] = args.base

    result = run_one(
        args.model,
        args.suite,
        meta=meta_overrides if meta_overrides else None,
        backend=args.backend,
        limit=args.limit,
        local=args.local,
    )

    print(f"run id: {result['id']}")
    print(f"suite:  {result['suite']}")
    print(f"tasks:  {len(result['tasks'])}")


if __name__ == "__main__":
    _cli()
