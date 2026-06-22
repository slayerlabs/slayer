# Cron: flock -n /tmp/bench-runner.lock python -m bench.runner.worker || true
"""Worker poll-loop for the benchmark runner queue.

tick() is one poll pass — a cron job calls it every 10 minutes behind
flock to enforce the single-instance invariant.

Lifecycle: queue-list approved → claim → run_one → resolve done|failed.
"""

from __future__ import annotations

import json
import logging
import subprocess
from pathlib import Path

from bench.runner.run_one import (
    RunnerBadRun,
    RunnerConfigError,
    RunnerError,
    RunnerOOM,
    run_one,
)

log = logging.getLogger(__name__)

# ── Subprocess seams (monkeypatched in tests) ───────────────────────────


def _queue_list(stage: str) -> list[str]:
    """Shell out to `node scripts/queue-list.mjs <stage> --json`, return list of IDs."""
    result = subprocess.run(
        ["node", "scripts/queue-list.mjs", stage, "--json"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        log.error("queue-list %s failed (exit %d): %s", stage, result.returncode, result.stderr)
        return []
    try:
        ids = json.loads(result.stdout)
        return ids if isinstance(ids, list) else []
    except (json.JSONDecodeError, TypeError):
        log.error("queue-list %s returned invalid JSON: %s", stage, result.stdout[:200])
        return []


def _get_submission(stage: str, sub_id: str) -> dict | None:
    """Fetch a single submission by shelling out to `node scripts/queue-get.mjs <stage> <id>`."""
    result = subprocess.run(
        ["node", "scripts/queue-get.mjs", stage, sub_id],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        log.error("get_submission(%s, %s) failed (exit %d): %s", stage, sub_id, result.returncode, result.stderr)
        return None
    try:
        return json.loads(result.stdout)
    except (json.JSONDecodeError, TypeError):
        log.error("get_submission(%s, %s) invalid JSON: %s", stage, sub_id, result.stdout[:200])
        return None


def _claim(sub_id: str) -> int:
    """Shell out to `node scripts/queue-claim.mjs <id>`. Return exit code (0=claimed, 3=lost race)."""
    result = subprocess.run(
        ["node", "scripts/queue-claim.mjs", sub_id],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        log.warning("claim %s exit %d: %s", sub_id, result.returncode, result.stderr.strip())
    return result.returncode


def _resolve(sub_id: str, outcome: str) -> None:
    """Shell out to `node scripts/queue-resolve.mjs <id> done|failed`."""
    result = subprocess.run(
        ["node", "scripts/queue-resolve.mjs", sub_id, outcome],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        log.error("resolve %s %s failed (exit %d): %s", sub_id, outcome, result.returncode, result.stderr)


# ── Advisory prechecks (stubs — log only, never reject) ─────────────────


def _param_cap_ok(hf_model: str) -> bool:
    """Advisory parameter-count precheck. Returns True (stub). OOM at load is the real guard."""
    log.info("param_cap_ok(%s): stub — always True", hf_model)
    return True


def _disk_ok() -> bool:
    """Advisory disk-space precheck. Returns True (stub)."""
    log.info("disk_ok: stub — always True")
    return True


# ── Wrapper around run_one (seam for monkeypatching) ────────────────────


def _run_one(model: str, suite_id: str, *, meta: dict | None = None,
             backend: str = "vllm", local: bool = False) -> dict:
    """Thin wrapper around run_one — exists as a monkeypatchable seam."""
    return run_one(model, suite_id, meta=meta, backend=backend, local=local)


# ── tick (one poll pass) ────────────────────────────────────────────────


def tick() -> None:
    """One poll pass: pick the first approved item, claim it, run, resolve."""
    ids = _queue_list("approved")
    if not ids:
        log.info("no approved submissions")
        return

    sub_id = ids[0]
    log.info("processing submission %s", sub_id)

    # Fetch submission details
    submission = _get_submission("approved", sub_id)
    if submission is None:
        log.error("could not read submission %s", sub_id)
        return

    hf_model = submission.get("hfModel", "")
    base = submission.get("base", "qwen3.5-9b")
    suite = submission.get("suite", "open-pl-v1")

    # Advisory prechecks (log only, never reject)
    _param_cap_ok(hf_model)
    _disk_ok()

    # Claim
    rc = _claim(sub_id)
    if rc != 0:
        log.warning("lost race / not approved for %s (exit %d)", sub_id, rc)
        return

    # Run
    try:
        _run_one(
            hf_model,
            suite,
            meta={"base": base},
            backend="vllm",
            local=False,
        )
        _resolve(sub_id, "done")
        log.info("resolved %s → done", sub_id)
    except RunnerConfigError as exc:
        # Do NOT resolve — don't lose the item on a misconfig
        log.error("config error for %s (not resolving): %s", sub_id, exc)
    except RunnerError as exc:
        # Catches RunnerOOM, RunnerBadRun, AND bare RunnerError
        # (e.g. lm-eval nonzero exit, missing results JSON).
        log.error("run failed for %s: %s", sub_id, exc)
        _resolve(sub_id, "failed")


# ── CLI entry point ─────────────────────────────────────────────────────


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    tick()
