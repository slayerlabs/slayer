"""Tests for bench.runner.run_one — the single-model orchestrator.

Monkeypatches _invoke_lm_eval (returns synthetic lm-eval results) and
subprocess.run (for the publish CLI).  No GPU, no Node.
"""

from __future__ import annotations

import json
import subprocess
from typing import Any
from unittest.mock import MagicMock

import pytest

from bench.runner.run_one import (
    RunnerBadRun,
    RunnerConfigError,
    RunnerError,
    RunnerOOM,
    run_one,
    _invoke_lm_eval,
)


# ── Synthetic fixtures ────────────────────────────────────────────────────

SUITE_CFG: dict[str, Any] = {
    "id": "open-pl-v1",
    "n_shot": 5,
    "tasks": [
        {
            "id": "polemo2_in",
            "gen": {"task": "polemo2_in_regex", "metric": "exact_match"},
            "mcq": {"task": "polemo2_in", "metric": "acc"},
        },
    ],
    "guards": [
        {"id": "mmlu", "task": "mmlu", "metric": "acc", "limit": 200},
    ],
}

FAKE_LM_RESULTS: dict[str, Any] = {
    "results": {
        "polemo2_in_regex": {"exact_match,none": 0.867},
        "polemo2_in": {"acc,none": 0.848},
        "mmlu": {"acc,none": 0.768},
    },
}


# ── Helpers ───────────────────────────────────────────────────────────────


@pytest.fixture()
def _patch_invoke(monkeypatch: pytest.MonkeyPatch, tmp_path):
    """Monkeypatch _invoke_lm_eval to return FAKE_LM_RESULTS (no GPU)."""
    import bench.runner.run_one as mod

    monkeypatch.setattr(
        mod,
        "_invoke_lm_eval",
        lambda model, suite_cfg, backend="hf", limit=None: FAKE_LM_RESULTS,
    )


@pytest.fixture()
def suite_yaml(tmp_path) -> str:
    """Write the minimal suite cfg to a temp YAML file and return the path."""
    import yaml

    path = tmp_path / "suite_open_pl_v1.yaml"
    path.write_text(yaml.dump(SUITE_CFG), encoding="utf-8")
    return str(path)


@pytest.fixture()
def _patch_publish(monkeypatch: pytest.MonkeyPatch):
    """Monkeypatch subprocess.run so the publish CLI is never actually called.

    Returns a mock whose call args can be inspected.
    """
    import bench.runner.run_one as mod

    mock = MagicMock(return_value=subprocess.CompletedProcess(args=[], returncode=0))
    monkeypatch.setattr(mod.subprocess, "run", mock)
    return mock


# ── Exception hierarchy ──────────────────────────────────────────────────


class TestExceptions:
    def test_runner_oom_is_runner_error(self):
        assert issubclass(RunnerOOM, RunnerError)

    def test_runner_bad_run_is_runner_error(self):
        assert issubclass(RunnerBadRun, RunnerError)

    def test_runner_config_error_is_runner_error(self):
        assert issubclass(RunnerConfigError, RunnerError)


# ── Happy path ───────────────────────────────────────────────────────────


class TestHappyPath:
    @pytest.fixture(autouse=True)
    def setup(self, _patch_invoke, _patch_publish, suite_yaml, monkeypatch):
        self.publish_mock = _patch_publish
        self.suite_yaml = suite_yaml

    def test_returns_run_v1(self):
        result = run_one(
            "Qwen/Qwen2.5-0.5B-Instruct",
            "open-pl-v1",
            local=True,
            suite_path=self.suite_yaml,
        )
        assert result["schema"] == "run/v1"
        assert isinstance(result["id"], str)
        assert result["suite"] == "open-pl-v1"
        assert result["base"] == "qwen3.5-9b"
        assert len(result["tasks"]) == 1
        assert result["tasks"][0]["id"] == "polemo2_in"

    def test_publish_invoked_once(self):
        run_one(
            "Qwen/Qwen2.5-0.5B-Instruct",
            "open-pl-v1",
            local=True,
            suite_path=self.suite_yaml,
        )
        assert self.publish_mock.call_count == 1

    def test_local_flag_in_publish_argv(self):
        run_one(
            "Qwen/Qwen2.5-0.5B-Instruct",
            "open-pl-v1",
            local=True,
            suite_path=self.suite_yaml,
        )
        call_args = self.publish_mock.call_args
        argv = call_args[0][0]  # first positional arg is the command list
        assert "--local" in argv

    def test_no_local_flag_when_not_local(self):
        run_one(
            "Qwen/Qwen2.5-0.5B-Instruct",
            "open-pl-v1",
            local=False,
            suite_path=self.suite_yaml,
        )
        call_args = self.publish_mock.call_args
        argv = call_args[0][0]
        assert "--local" not in argv

    def test_meta_override(self):
        result = run_one(
            "Qwen/Qwen2.5-0.5B-Instruct",
            "open-pl-v1",
            meta={"id": "custom-id", "base": "bielik-11b-v3"},
            local=True,
            suite_path=self.suite_yaml,
        )
        assert result["id"] == "custom-id"
        assert result["base"] == "bielik-11b-v3"

    def test_model_name_in_result(self):
        result = run_one(
            "Qwen/Qwen2.5-0.5B-Instruct",
            "open-pl-v1",
            local=True,
            suite_path=self.suite_yaml,
        )
        assert result["model"]["name"] == "Qwen/Qwen2.5-0.5B-Instruct"

    def test_date_is_set(self):
        result = run_one(
            "Qwen/Qwen2.5-0.5B-Instruct",
            "open-pl-v1",
            local=True,
            suite_path=self.suite_yaml,
        )
        assert isinstance(result["date"], str)
        # Date should look like YYYY-MM-DD
        assert len(result["date"]) == 10


# ── OOM propagation ──────────────────────────────────────────────────────


class TestOOM:
    def test_invoke_oom_propagates(self, monkeypatch, suite_yaml):
        import bench.runner.run_one as mod

        def raise_oom(*args, **kwargs):
            raise RunnerOOM("CUDA out of memory")

        monkeypatch.setattr(mod, "_invoke_lm_eval", raise_oom)

        with pytest.raises(RunnerOOM, match="CUDA out of memory"):
            run_one(
                "Qwen/Qwen2.5-0.5B-Instruct",
                "open-pl-v1",
                local=True,
                suite_path=suite_yaml,
            )


# ── Publish error mapping ────────────────────────────────────────────────


class TestPublishErrors:
    @pytest.fixture(autouse=True)
    def setup(self, _patch_invoke, suite_yaml):
        self.suite_yaml = suite_yaml

    def test_publish_exit_2_raises_config_error(self, monkeypatch):
        """Exit code 2 (usage error) -> RunnerConfigError."""
        import bench.runner.run_one as mod

        mock = MagicMock(
            return_value=subprocess.CompletedProcess(
                args=[], returncode=2, stderr="usage: publish-run.mjs <run.json>"
            )
        )
        monkeypatch.setattr(mod.subprocess, "run", mock)

        with pytest.raises(RunnerConfigError):
            run_one(
                "Qwen/Qwen2.5-0.5B-Instruct",
                "open-pl-v1",
                local=True,
                suite_path=self.suite_yaml,
            )

    def test_publish_token_missing_raises_config_error(self, monkeypatch):
        """Exit code 1 + stderr mentioning BLOB_READ_WRITE_TOKEN -> RunnerConfigError."""
        import bench.runner.run_one as mod

        mock = MagicMock(
            return_value=subprocess.CompletedProcess(
                args=[],
                returncode=1,
                stderr="BLOB_READ_WRITE_TOKEN not set — refusing to publish",
            )
        )
        monkeypatch.setattr(mod.subprocess, "run", mock)

        with pytest.raises(RunnerConfigError):
            run_one(
                "Qwen/Qwen2.5-0.5B-Instruct",
                "open-pl-v1",
                local=False,
                suite_path=self.suite_yaml,
            )

    def test_publish_exit_1_validation_raises_bad_run(self, monkeypatch):
        """Exit code 1 without token message -> RunnerBadRun (validation failure)."""
        import bench.runner.run_one as mod

        mock = MagicMock(
            return_value=subprocess.CompletedProcess(
                args=[],
                returncode=1,
                stderr="invalid run/v1:\n - tasks must be an array",
            )
        )
        monkeypatch.setattr(mod.subprocess, "run", mock)

        with pytest.raises(RunnerBadRun):
            run_one(
                "Qwen/Qwen2.5-0.5B-Instruct",
                "open-pl-v1",
                local=True,
                suite_path=self.suite_yaml,
            )
