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


# ── Suite config validation ──────────────────────────────────────────────


class TestSuiteConfigValidation:
    """Invalid suite config raises RunnerConfigError, not a raw KeyError."""

    def test_invalid_cfg_raises_config_error(self, tmp_path):
        """A structurally invalid cfg (missing 'id', 'tasks', 'n_shot') -> RunnerConfigError."""
        import yaml

        bad_cfg = {"wrong_key": "oops"}
        path = tmp_path / "suite_bad.yaml"
        path.write_text(yaml.dump(bad_cfg), encoding="utf-8")

        with pytest.raises(RunnerConfigError, match="invalid suite config"):
            run_one(
                "Qwen/Qwen2.5-0.5B-Instruct",
                "bad",
                local=True,
                suite_path=str(path),
            )

    def test_missing_tasks_raises_config_error(self, tmp_path):
        """A cfg with id and n_shot but no tasks -> RunnerConfigError."""
        import yaml

        bad_cfg = {"id": "test", "n_shot": 5}
        path = tmp_path / "suite_no_tasks.yaml"
        path.write_text(yaml.dump(bad_cfg), encoding="utf-8")

        with pytest.raises(RunnerConfigError, match="tasks"):
            run_one(
                "Qwen/Qwen2.5-0.5B-Instruct",
                "no-tasks",
                local=True,
                suite_path=str(path),
            )


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


# ── vLLM tuning in model_args ────────────────────────────────────────────


class TestVllmTuning:
    """When backend=='vllm', _invoke_lm_eval folds suite_cfg['vllm'] into --model_args."""

    def test_vllm_model_args_includes_tuning(self, monkeypatch, tmp_path):
        """The --model_args string must contain vllm tuning params."""
        import bench.runner.run_one as mod

        suite_cfg_with_vllm: dict[str, Any] = {
            **SUITE_CFG,
            "vllm": {
                "gpu_memory_utilization": 0.7,
                "max_model_len": 2048,
            },
        }

        captured_cmds: list[list[str]] = []

        def fake_subprocess_run(cmd, **kwargs):
            captured_cmds.append(cmd)
            # Write a fake results JSON so _invoke_lm_eval can find it
            results_dir = None
            for i, arg in enumerate(cmd):
                if arg == "--output_path" and i + 1 < len(cmd):
                    results_dir = cmd[i + 1]
                    break
            if results_dir:
                import os
                model_dir = os.path.join(results_dir, "fake_model")
                os.makedirs(model_dir, exist_ok=True)
                with open(os.path.join(model_dir, "results_001.json"), "w") as f:
                    json.dump(FAKE_LM_RESULTS, f)
            return subprocess.CompletedProcess(args=cmd, returncode=0, stdout="", stderr="")

        monkeypatch.setattr(mod.subprocess, "run", fake_subprocess_run)

        result = mod._invoke_lm_eval(
            "Qwen/Qwen2.5-0.5B-Instruct",
            suite_cfg_with_vllm,
            backend="vllm",
        )

        assert len(captured_cmds) == 1
        cmd = captured_cmds[0]
        model_args_idx = cmd.index("--model_args") + 1
        model_args = cmd[model_args_idx]
        assert "pretrained=Qwen/Qwen2.5-0.5B-Instruct" in model_args
        assert "gpu_memory_utilization=0.7" in model_args
        assert "max_model_len=2048" in model_args

    def test_non_vllm_backend_no_extra_args(self, monkeypatch, tmp_path):
        """Non-vllm backend should NOT include vllm tuning even if present in cfg."""
        import bench.runner.run_one as mod

        suite_cfg_with_vllm: dict[str, Any] = {
            **SUITE_CFG,
            "vllm": {
                "gpu_memory_utilization": 0.7,
                "max_model_len": 2048,
            },
        }

        captured_cmds: list[list[str]] = []

        def fake_subprocess_run(cmd, **kwargs):
            captured_cmds.append(cmd)
            results_dir = None
            for i, arg in enumerate(cmd):
                if arg == "--output_path" and i + 1 < len(cmd):
                    results_dir = cmd[i + 1]
                    break
            if results_dir:
                import os
                model_dir = os.path.join(results_dir, "fake_model")
                os.makedirs(model_dir, exist_ok=True)
                with open(os.path.join(model_dir, "results_001.json"), "w") as f:
                    json.dump(FAKE_LM_RESULTS, f)
            return subprocess.CompletedProcess(args=cmd, returncode=0, stdout="", stderr="")

        monkeypatch.setattr(mod.subprocess, "run", fake_subprocess_run)

        result = mod._invoke_lm_eval(
            "Qwen/Qwen2.5-0.5B-Instruct",
            suite_cfg_with_vllm,
            backend="hf",
        )

        assert len(captured_cmds) == 1
        cmd = captured_cmds[0]
        model_args_idx = cmd.index("--model_args") + 1
        model_args = cmd[model_args_idx]
        assert model_args == "pretrained=Qwen/Qwen2.5-0.5B-Instruct"


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
