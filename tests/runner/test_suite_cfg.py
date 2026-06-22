"""Tests for bench.runner.suite_cfg — loader + validator."""

from pathlib import Path

import pytest

from bench.runner.suite_cfg import load_suite_cfg, validate_suite_cfg

SUITE_YAML = Path(__file__).resolve().parents[2] / "bench" / "runner" / "suite_open_pl_v1.yaml"


# ── helpers ──────────────────────────────────────────────────────────────


def _minimal_valid_cfg() -> dict:
    """Smallest cfg that passes validation."""
    return {
        "id": "test-suite",
        "n_shot": 5,
        "tasks": [
            {
                "id": "t1",
                "gen": {"task": "t1_regex", "metric": "exact_match"},
                "mcq": None,
            }
        ],
    }


# ── load_suite_cfg ───────────────────────────────────────────────────────


class TestLoadSuiteCfg:
    def test_loads_yaml_file(self, tmp_path: Path):
        p = tmp_path / "suite.yaml"
        p.write_text("id: my-suite\ntasks: []\nn_shot: 0\n")
        cfg = load_suite_cfg(p)
        assert cfg["id"] == "my-suite"

    def test_missing_file_raises(self, tmp_path: Path):
        with pytest.raises(FileNotFoundError):
            load_suite_cfg(tmp_path / "nope.yaml")


# ── validate_suite_cfg — happy path ─────────────────────────────────────


class TestValidateSuiteCfgHappy:
    def test_minimal_valid(self):
        ok, errors = validate_suite_cfg(_minimal_valid_cfg())
        assert ok is True
        assert errors == []

    def test_task_with_both_gen_and_mcq(self):
        cfg = _minimal_valid_cfg()
        cfg["tasks"][0]["mcq"] = {"task": "t1", "metric": "acc"}
        ok, errors = validate_suite_cfg(cfg)
        assert ok is True
        assert errors == []

    def test_task_with_only_mcq(self):
        cfg = _minimal_valid_cfg()
        cfg["tasks"][0]["gen"] = None
        cfg["tasks"][0]["mcq"] = {"task": "t1", "metric": "acc"}
        ok, errors = validate_suite_cfg(cfg)
        assert ok is True
        assert errors == []

    def test_guards_valid(self):
        cfg = _minimal_valid_cfg()
        cfg["guards"] = [
            {"id": "mmlu", "task": "mmlu", "metric": "acc", "limit": 200},
            {"id": "gsm8k", "task": "gsm8k", "metric": "exact_match"},
        ]
        ok, errors = validate_suite_cfg(cfg)
        assert ok is True
        assert errors == []


# ── validate_suite_cfg — failures ────────────────────────────────────────


class TestValidateSuiteCfgFailures:
    def test_missing_id(self):
        cfg = _minimal_valid_cfg()
        del cfg["id"]
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("id" in e for e in errors)

    def test_empty_id(self):
        cfg = _minimal_valid_cfg()
        cfg["id"] = ""
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("id" in e for e in errors)

    def test_non_string_id(self):
        cfg = _minimal_valid_cfg()
        cfg["id"] = 42
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("id" in e for e in errors)

    def test_missing_tasks(self):
        cfg = _minimal_valid_cfg()
        del cfg["tasks"]
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("tasks" in e.lower() for e in errors)

    def test_empty_tasks(self):
        cfg = _minimal_valid_cfg()
        cfg["tasks"] = []
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("tasks" in e.lower() for e in errors)

    def test_task_missing_id(self):
        cfg = _minimal_valid_cfg()
        del cfg["tasks"][0]["id"]
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("id" in e for e in errors)

    def test_task_both_gen_and_mcq_null(self):
        cfg = _minimal_valid_cfg()
        cfg["tasks"][0]["gen"] = None
        cfg["tasks"][0]["mcq"] = None
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("gen" in e or "mcq" in e for e in errors)

    def test_task_gen_missing_task_key(self):
        cfg = _minimal_valid_cfg()
        cfg["tasks"][0]["gen"] = {"metric": "exact_match"}
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("task" in e for e in errors)

    def test_task_gen_missing_metric_key(self):
        cfg = _minimal_valid_cfg()
        cfg["tasks"][0]["gen"] = {"task": "t1_regex"}
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("metric" in e for e in errors)

    def test_task_mcq_missing_task_key(self):
        cfg = _minimal_valid_cfg()
        cfg["tasks"][0]["mcq"] = {"metric": "acc"}
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("task" in e for e in errors)

    def test_task_mcq_missing_metric_key(self):
        cfg = _minimal_valid_cfg()
        cfg["tasks"][0]["mcq"] = {"task": "t1"}
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("metric" in e for e in errors)

    def test_n_shot_missing(self):
        cfg = _minimal_valid_cfg()
        del cfg["n_shot"]
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("n_shot" in e for e in errors)

    def test_n_shot_not_int(self):
        cfg = _minimal_valid_cfg()
        cfg["n_shot"] = "five"
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("n_shot" in e for e in errors)

    def test_guard_missing_task(self):
        cfg = _minimal_valid_cfg()
        cfg["guards"] = [{"id": "mmlu", "metric": "acc"}]
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("task" in e for e in errors)

    def test_guard_missing_metric(self):
        cfg = _minimal_valid_cfg()
        cfg["guards"] = [{"id": "mmlu", "task": "mmlu"}]
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("metric" in e for e in errors)

    def test_guard_limit_not_int(self):
        cfg = _minimal_valid_cfg()
        cfg["guards"] = [
            {"id": "mmlu", "task": "mmlu", "metric": "acc", "limit": "two hundred"}
        ]
        ok, errors = validate_suite_cfg(cfg)
        assert ok is False
        assert any("limit" in e for e in errors)


# ── shipped YAML ─────────────────────────────────────────────────────────


class TestShippedYaml:
    def test_suite_open_pl_v1_loads(self):
        cfg = load_suite_cfg(SUITE_YAML)
        assert cfg["id"] == "open-pl-v1"

    def test_suite_open_pl_v1_validates(self):
        cfg = load_suite_cfg(SUITE_YAML)
        ok, errors = validate_suite_cfg(cfg)
        assert ok is True, f"validation errors: {errors}"
