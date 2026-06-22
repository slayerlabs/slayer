# fixture is synthetic; confirm against a real lm-eval capture on first GPU run (Task 4).
"""Tests for bench.runner.lm_eval_to_run — the pure transform from lm-eval results → run/v1.

Covers the 5 cases mandated by Phase 3 Task 5:
  1. ok + both protocols (gen + mcq resolved)
  2. ok + gen-only  (cfg mcq is None)
  3. ok + mcq-only  (cfg gen is None)
  4. fully broken   (both configured + both missing → 0.0 + status "broken")
  5. partial        (gen configured + missing, mcq resolved → gen None, status ok)

Also covers: aggregates, working_tasks, guard limited:true, and a re-implementation
of validateRun essentials.
"""

from __future__ import annotations

import re
from typing import Any

import pytest

from bench.runner.lm_eval_to_run import to_run_v1


# ── Synthetic fixture ───────────────────────────────────────────────────

SUITE_CFG: dict[str, Any] = {
    "id": "open-pl-v1",
    "n_shot": 5,
    "tasks": [
        # Case 1: ok + both protocols resolved
        {
            "id": "polemo2_in",
            "gen": {"task": "polemo2_in_regex", "metric": "exact_match"},
            "mcq": {"task": "polemo2_in", "metric": "acc"},
        },
        # Case 2: ok + gen-only (mcq is None in cfg)
        {
            "id": "klej_ner",
            "gen": {"task": "klej_ner_regex", "metric": "exact_match"},
            "mcq": None,
        },
        # Case 3: ok + mcq-only (gen is None in cfg)
        {
            "id": "belebele_pol",
            "gen": None,
            "mcq": {"task": "belebele_pol", "metric": "acc"},
        },
        # Case 4: fully broken — both configured, both missing from results
        {
            "id": "polqa_closed_book",
            "gen": {"task": "polqa_closed_book_regex", "metric": "exact_match"},
            "mcq": {"task": "polqa_closed_book", "metric": "acc"},
        },
        # Case 5: partial — gen configured+missing, mcq resolved
        {
            "id": "psc",
            "gen": {"task": "psc_regex", "metric": "exact_match"},
            "mcq": {"task": "psc", "metric": "acc"},
        },
    ],
    "guards": [
        # mmlu — uses group aggregate key
        {"id": "mmlu", "task": "mmlu", "metric": "acc", "limit": 200},
        # gsm8k — uses flexible-extract filter form
        {"id": "gsm8k", "task": "gsm8k", "metric": "exact_match", "limit": 200},
    ],
}

# lm-eval results — metric keys use the "<metric>,<filter>,none" pattern.
# mmlu group aggregate is at results["mmlu"]["acc,none"].
LM_RESULTS: dict[str, Any] = {
    "results": {
        # Case 1: polemo2_in — both tasks present
        "polemo2_in_regex": {
            "exact_match,none": 0.867,   # → 86.7
            "alias": "polemo2_in_regex",
        },
        "polemo2_in": {
            "acc,none": 0.848,           # → 84.8
            "acc_stderr,none": 0.012,
        },
        # Case 2: klej_ner — gen only
        "klej_ner_regex": {
            "exact_match,none": 0.547,   # → 54.7
        },
        # Case 3: belebele_pol — mcq only
        "belebele_pol": {
            "acc,none": 0.896,           # → 89.6
        },
        # Case 4: polqa_closed_book — NEITHER task present in results
        # (polqa_closed_book_regex and polqa_closed_book both absent)

        # Case 5: psc — mcq present, gen task MISSING from results
        # psc_regex is absent → gen unresolved; psc is present → mcq resolved
        "psc": {
            "acc,none": 0.912,           # → 91.2
        },

        # Guards
        "mmlu": {
            "acc,none": 0.768,           # group aggregate → 76.8
        },
        "gsm8k": {
            # flexible-extract filter form: "exact_match,flexible-extract,none"
            "exact_match,flexible-extract,none": 0.909,  # → 90.9
        },
    },
}

META: dict[str, Any] = {
    "id": "test-model-v1",
    "model": {"name": "Test Model", "params": "9B", "org": "test", "kind": "adapter"},
    "base": "qwen3.5-9b",
    "suite": "open-pl-v1",
    "date": "2026-06-19",
    "artifact": {"adapter": "test_adapter_v1", "host": "lem (H100)"},
}


# ── validateRun essentials (re-implemented from lib/run-schema.js) ──────

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9._-]*$")


def validate_run(o: dict[str, Any]) -> tuple[bool, list[str]]:
    """Python re-implementation of the essential validateRun checks."""
    errors: list[str] = []
    if not isinstance(o, dict):
        return (False, ["not an object"])

    if o.get("schema") != "run/v1":
        errors.append("schema must be 'run/v1'")
    if not isinstance(o.get("id"), str) or not SLUG_RE.match(o["id"]):
        errors.append("id must be a slug")
    if not o.get("model") or not isinstance(o["model"].get("name"), str):
        errors.append("model.name required")
    if not isinstance(o.get("suite"), str):
        errors.append("suite required")
    if not isinstance(o.get("base"), str):
        errors.append("base required")
    if not isinstance(o.get("date"), str):
        errors.append("date required")

    tasks = o.get("tasks")
    if not isinstance(tasks, list):
        errors.append("tasks must be an array")
    else:
        for i, t in enumerate(tasks):
            if not isinstance(t.get("id"), str):
                errors.append(f"tasks[{i}].id required")
            if "gen" not in t or "mcq" not in t:
                errors.append(f"tasks[{i}] needs gen and mcq")
            if t.get("status") not in ("ok", "broken", "pending"):
                errors.append(f"tasks[{i}].status invalid")

    agg = o.get("aggregate")
    if not agg or "gen" not in agg or "mcq" not in agg:
        errors.append("aggregate needs gen and mcq")

    return (len(errors) == 0, errors)


# ── Helpers ─────────────────────────────────────────────────────────────

@pytest.fixture()
def run_v1() -> dict[str, Any]:
    """Build the run/v1 from the synthetic fixture."""
    return to_run_v1(LM_RESULTS, SUITE_CFG, META)


# ── Schema / structural tests ──────────────────────────────────────────

class TestValidateRun:
    """The output must pass the JS validateRun essentials."""

    def test_passes_validate_run(self, run_v1: dict) -> None:
        ok, errors = validate_run(run_v1)
        assert ok, f"validateRun failed: {errors}"

    def test_schema_field(self, run_v1: dict) -> None:
        assert run_v1["schema"] == "run/v1"

    def test_top_level_fields(self, run_v1: dict) -> None:
        assert run_v1["id"] == "test-model-v1"
        assert run_v1["model"]["name"] == "Test Model"
        assert run_v1["suite"] == "open-pl-v1"
        assert run_v1["base"] == "qwen3.5-9b"
        assert run_v1["date"] == "2026-06-19"
        assert run_v1["artifact"]["adapter"] == "test_adapter_v1"

    def test_task_count(self, run_v1: dict) -> None:
        assert len(run_v1["tasks"]) == 5


# ── Per-task 4-state logic ──────────────────────────────────────────────

class TestTaskStates:
    """Test the 5 cases for the per-task 4-state logic."""

    def _task(self, run_v1: dict, task_id: str) -> dict:
        for t in run_v1["tasks"]:
            if t["id"] == task_id:
                return t
        raise KeyError(f"task {task_id!r} not found in run")

    # Case 1: ok + both protocols resolved
    def test_ok_both(self, run_v1: dict) -> None:
        t = self._task(run_v1, "polemo2_in")
        assert t["status"] == "ok"
        assert t["gen"] == 86.7
        assert t["mcq"] == 84.8

    # Case 2: ok + gen-only (cfg mcq is None → mcq emitted as None)
    def test_ok_gen_only(self, run_v1: dict) -> None:
        t = self._task(run_v1, "klej_ner")
        assert t["status"] == "ok"
        assert t["gen"] == 54.7
        assert t["mcq"] is None

    # Case 3: ok + mcq-only (cfg gen is None → gen emitted as None)
    def test_ok_mcq_only(self, run_v1: dict) -> None:
        t = self._task(run_v1, "belebele_pol")
        assert t["status"] == "ok"
        assert t["gen"] is None
        assert t["mcq"] == 89.6

    # Case 4: fully broken — both configured, both missing → 0.0, status broken
    def test_broken(self, run_v1: dict) -> None:
        t = self._task(run_v1, "polqa_closed_book")
        assert t["status"] == "broken"
        assert t["gen"] == 0.0
        assert t["mcq"] == 0.0

    # Case 5: partial — gen configured+missing, mcq resolved
    #   gen → None (partial unresolved), status ok
    def test_partial(self, run_v1: dict) -> None:
        t = self._task(run_v1, "psc")
        assert t["status"] == "ok"
        assert t["gen"] is None
        assert t["mcq"] == 91.2


# ── Aggregates ──────────────────────────────────────────────────────────

class TestAggregates:
    """Aggregates only include ok tasks with non-None values."""

    def test_working_tasks(self, run_v1: dict) -> None:
        # 5 tasks total, 1 broken → 4 ok → working_tasks = 4
        assert run_v1["aggregate"]["working_tasks"] == 4

    def test_aggregate_gen(self, run_v1: dict) -> None:
        # ok tasks with gen not None: polemo2_in (86.7), klej_ner (54.7)
        # belebele_pol gen=None (excluded), psc gen=None (excluded)
        expected = round((86.7 + 54.7) / 2, 1)  # 70.7
        assert run_v1["aggregate"]["gen"] == expected

    def test_aggregate_mcq(self, run_v1: dict) -> None:
        # ok tasks with mcq not None: polemo2_in (84.8), belebele_pol (89.6), psc (91.2)
        # klej_ner mcq=None (excluded)
        expected = round((84.8 + 89.6 + 91.2) / 3, 1)  # 88.5
        assert run_v1["aggregate"]["mcq"] == expected


# ── Guards ──────────────────────────────────────────────────────────────

class TestGuards:

    def test_guard_count(self, run_v1: dict) -> None:
        assert len(run_v1["guards"]) == 2

    def test_mmlu_guard(self, run_v1: dict) -> None:
        g = next(g for g in run_v1["guards"] if g["id"] == "mmlu")
        assert g["gen"] == 76.8
        assert g["status"] == "ok"
        assert g["limited"] is True

    def test_gsm8k_guard(self, run_v1: dict) -> None:
        """gsm8k uses exact_match,flexible-extract,none — tests multi-segment metric key."""
        g = next(g for g in run_v1["guards"] if g["id"] == "gsm8k")
        assert g["gen"] == 90.9
        assert g["status"] == "ok"
        assert g["limited"] is True

    def test_guard_labels(self, run_v1: dict) -> None:
        g = next(g for g in run_v1["guards"] if g["id"] == "mmlu")
        assert g["label"] == "mmlu"


# ── Task labels ─────────────────────────────────────────────────────────

class TestLabels:

    def test_default_label_is_id(self, run_v1: dict) -> None:
        """label defaults to task id."""
        for t in run_v1["tasks"]:
            assert t["label"] == t["id"]


# ── Demo flag ───────────────────────────────────────────────────────────

class TestDemo:

    def test_no_demo_by_default(self, run_v1: dict) -> None:
        assert "demo" not in run_v1

    def test_demo_when_set(self) -> None:
        meta_with_demo = {**META, "demo": True}
        result = to_run_v1(LM_RESULTS, SUITE_CFG, meta_with_demo)
        assert result["demo"] is True

    def test_demo_false(self) -> None:
        meta_with_demo = {**META, "demo": False}
        result = to_run_v1(LM_RESULTS, SUITE_CFG, meta_with_demo)
        assert result["demo"] is False


# ── Edge: broken guard ──────────────────────────────────────────────────

class TestBrokenGuard:

    def test_broken_guard(self) -> None:
        """A guard whose task is missing from results → status broken, gen null."""
        cfg = {
            **SUITE_CFG,
            "guards": [{"id": "missing_guard", "task": "nonexistent_task", "metric": "acc", "limit": 100}],
        }
        result = to_run_v1(LM_RESULTS, cfg, META)
        g = result["guards"][0]
        assert g["status"] == "broken"
        assert g["gen"] is None
        assert g["limited"] is True
