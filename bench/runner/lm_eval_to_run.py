"""Pure transform: lm-eval results + suite config + meta → run/v1 dict.

to_run_v1(lm_results, suite_cfg, meta) -> dict

No I/O, no GPU — only data mapping.  The output must pass ``validateRun``
(lib/run-schema.js).
"""

from __future__ import annotations

from typing import Any


def to_run_v1(
    lm_results: dict[str, Any],
    suite_cfg: dict[str, Any],
    meta: dict[str, Any],
) -> dict[str, Any]:
    """Build a ``run/v1`` dict from lm-eval output + suite config + metadata.

    Parameters
    ----------
    lm_results:
        ``{"results": {"<task>": {"<metric>,<filter>,none": float, ...}, ...}}``.
    suite_cfg:
        ``{tasks: [{id, gen, mcq}], guards: [{id, task, metric, limit?}], ...}``.
    meta:
        ``{id, model:{name,params,org,kind}, base, suite, date, artifact:{adapter,host}, demo?}``.
    """
    results = lm_results.get("results", {})

    tasks = [
        _build_task(t, results) for t in suite_cfg["tasks"]
    ]

    guards = [
        _build_guard(g, results) for g in suite_cfg.get("guards", [])
    ]

    aggregate = _build_aggregate(tasks)

    run: dict[str, Any] = {
        "schema": "run/v1",
        "id": meta["id"],
        "model": meta["model"],
        "artifact": meta["artifact"],
        "suite": meta["suite"],
        "base": meta["base"],
        "date": meta["date"],
        "tasks": tasks,
        "guards": guards,
        "aggregate": aggregate,
    }

    if "demo" in meta:
        run["demo"] = meta["demo"]

    return run


# ── metric resolution ───────────────────────────────────────────────────


def _resolve_metric(
    results: dict[str, Any],
    task_name: str,
    metric_name: str,
) -> float | None:
    """Look up a metric value from lm-eval results.

    The lm-eval key format is ``"<metric>,<filter>,none"`` or ``"<metric>,none"``.
    We find the key whose part before the first comma equals *metric_name*.

    Returns the value * 100, rounded to 1 decimal place, or ``None`` if the
    task or metric key is not found.
    """
    task_results = results.get(task_name)
    if task_results is None:
        return None

    for key, value in task_results.items():
        # Extract the metric name: everything before the first comma.
        parts = key.split(",", 1)
        if parts[0] == metric_name:
            return round(value * 100, 1)

    return None


# ── per-task 4-state logic ──────────────────────────────────────────────


def _build_task(
    cfg_task: dict[str, Any],
    results: dict[str, Any],
) -> dict[str, Any]:
    """Build a single task entry using the 4-state logic.

    For each protocol p in {gen, mcq}:
      - cfg[p] is None  → emit None  (unconfigured)
      - cfg[p] set + resolved   → emit number
      - cfg[p] set + unresolved → tentatively unresolved

    A task is **broken** iff it has >= 1 configured protocol AND every
    configured protocol is unresolved.  In that case, configured protocols
    become 0.0, status "broken".

    Otherwise status "ok": configured+resolved → number,
    configured+unresolved (partial) → None, unconfigured → None.
    """
    gen_cfg = cfg_task.get("gen")
    mcq_cfg = cfg_task.get("mcq")

    # Resolve each configured protocol
    gen_val: float | None = None
    mcq_val: float | None = None
    gen_resolved = False
    mcq_resolved = False
    gen_configured = gen_cfg is not None
    mcq_configured = mcq_cfg is not None

    if gen_configured:
        gen_val = _resolve_metric(results, gen_cfg["task"], gen_cfg["metric"])
        gen_resolved = gen_val is not None

    if mcq_configured:
        mcq_val = _resolve_metric(results, mcq_cfg["task"], mcq_cfg["metric"])
        mcq_resolved = mcq_val is not None

    # Determine if broken: all configured protocols unresolved
    configured_count = int(gen_configured) + int(mcq_configured)
    resolved_count = int(gen_resolved) + int(mcq_resolved)

    if configured_count > 0 and resolved_count == 0:
        # Broken: every configured protocol is unresolved → 0.0
        status = "broken"
        if gen_configured:
            gen_val = 0.0
        if mcq_configured:
            mcq_val = 0.0
    else:
        # ok: resolved → number, unresolved (partial) → None, unconfigured → None
        status = "ok"
        # gen_val / mcq_val are already correct:
        #   configured+resolved → number
        #   configured+unresolved → None  (gen_val is still None from above)
        #   unconfigured → None  (gen_val is still None from init)

    return {
        "id": cfg_task["id"],
        "label": cfg_task.get("label", cfg_task["id"]),
        "gen": gen_val,
        "mcq": mcq_val,
        "status": status,
    }


# ── guards ──────────────────────────────────────────────────────────────


def _build_guard(
    guard_cfg: dict[str, Any],
    results: dict[str, Any],
) -> dict[str, Any]:
    """Build a guard entry.  Guards carry ``limited: True``."""
    value = _resolve_metric(results, guard_cfg["task"], guard_cfg["metric"])

    return {
        "id": guard_cfg["id"],
        "label": guard_cfg.get("label", guard_cfg["id"]),
        "gen": value,
        "status": "ok" if value is not None else "broken",
        "limited": True,
    }


# ── aggregate ───────────────────────────────────────────────────────────


def _build_aggregate(tasks: list[dict[str, Any]]) -> dict[str, Any]:
    """Compute aggregates over ok tasks with non-None protocol values."""
    gen_vals: list[float] = []
    mcq_vals: list[float] = []
    working = 0

    for t in tasks:
        if t["status"] != "ok":
            continue
        working += 1
        if t["gen"] is not None:
            gen_vals.append(t["gen"])
        if t["mcq"] is not None:
            mcq_vals.append(t["mcq"])

    return {
        "gen": round(sum(gen_vals) / len(gen_vals), 1) if gen_vals else None,
        "mcq": round(sum(mcq_vals) / len(mcq_vals), 1) if mcq_vals else None,
        "working_tasks": working,
    }
