"""Suite config loader and validator for the benchmark runner.

load_suite_cfg(path)         -> dict   (yaml.safe_load)
validate_suite_cfg(cfg)      -> (ok: bool, errors: list[str])
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


def load_suite_cfg(path: str | Path) -> dict:
    """Load a suite config YAML and return the parsed dict.

    Raises FileNotFoundError if *path* does not exist.
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(path)
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


# ── validation ───────────────────────────────────────────────────────────


def validate_suite_cfg(cfg: dict[str, Any]) -> tuple[bool, list[str]]:
    """Validate a suite config dict.

    Returns ``(ok, errors)`` where *ok* is True when *errors* is empty.
    """
    errors: list[str] = []

    # --- top-level id ---
    _check_id(cfg, errors)

    # --- n_shot ---
    _check_n_shot(cfg, errors)

    # --- tasks ---
    _check_tasks(cfg, errors)

    # --- guards (optional) ---
    _check_guards(cfg, errors)

    return (len(errors) == 0, errors)


# ── private helpers ──────────────────────────────────────────────────────


def _check_id(cfg: dict, errors: list[str]) -> None:
    sid = cfg.get("id")
    if sid is None:
        errors.append("'id' is required")
        return
    if not isinstance(sid, str) or not sid:
        errors.append("'id' must be a non-empty string")


def _check_n_shot(cfg: dict, errors: list[str]) -> None:
    if "n_shot" not in cfg:
        errors.append("'n_shot' is required")
        return
    if not isinstance(cfg["n_shot"], int):
        errors.append("'n_shot' must be an int")


def _check_tasks(cfg: dict, errors: list[str]) -> None:
    tasks = cfg.get("tasks")
    if tasks is None:
        errors.append("'tasks' is required")
        return
    if not isinstance(tasks, list) or len(tasks) == 0:
        errors.append("'tasks' must be a non-empty list")
        return

    for i, t in enumerate(tasks):
        prefix = f"tasks[{i}]"
        # task id
        tid = t.get("id")
        if not isinstance(tid, str) or not tid:
            errors.append(f"{prefix}: 'id' must be a non-empty string")

        gen = t.get("gen")
        mcq = t.get("mcq")

        # at least one protocol must be non-null
        if gen is None and mcq is None:
            errors.append(
                f"{prefix}: at least one of 'gen'/'mcq' must be non-null"
            )

        # validate each non-null protocol dict
        if gen is not None:
            _check_protocol_dict(gen, f"{prefix}.gen", errors)
        if mcq is not None:
            _check_protocol_dict(mcq, f"{prefix}.mcq", errors)


def _check_protocol_dict(d: Any, prefix: str, errors: list[str]) -> None:
    if not isinstance(d, dict):
        errors.append(f"{prefix}: must be a dict")
        return
    if not isinstance(d.get("task"), str) or not d.get("task"):
        errors.append(f"{prefix}: 'task' must be a non-empty string")
    if not isinstance(d.get("metric"), str) or not d.get("metric"):
        errors.append(f"{prefix}: 'metric' must be a non-empty string")


def _check_guards(cfg: dict, errors: list[str]) -> None:
    guards = cfg.get("guards")
    if guards is None:
        return  # guards are optional
    if not isinstance(guards, list):
        errors.append("'guards' must be a list")
        return

    for i, g in enumerate(guards):
        prefix = f"guards[{i}]"
        if not isinstance(g, dict):
            errors.append(f"{prefix}: must be a dict")
            continue
        if not isinstance(g.get("task"), str) or not g.get("task"):
            errors.append(f"{prefix}: 'task' must be a non-empty string")
        if not isinstance(g.get("metric"), str) or not g.get("metric"):
            errors.append(f"{prefix}: 'metric' must be a non-empty string")
        # limit is optional but must be int if present
        if "limit" in g and not isinstance(g["limit"], int):
            errors.append(f"{prefix}: 'limit' must be an int")
