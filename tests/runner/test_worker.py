"""Tests for bench.runner.worker — the poll-loop worker.

Monkeypatches all subprocess/GPU seams: _queue_list, _get_submission,
_claim, _resolve, and run_one.  No real subprocess, no GPU.
"""

from __future__ import annotations

import pytest

from bench.runner.run_one import RunnerBadRun, RunnerConfigError, RunnerError, RunnerOOM


# ── Helpers ──────────────────────────────────────────────────────────────

FAKE_SUBMISSION = {
    "id": "abc123",
    "hfModel": "Qwen/Qwen2.5-0.5B-Instruct",
    "base": "qwen3.5-9b",
    "suite": "open-pl-v1",
}


@pytest.fixture()
def worker_mod():
    """Import the worker module (deferred so monkeypatching works)."""
    import bench.runner.worker as mod
    return mod


@pytest.fixture()
def patch_seams(monkeypatch, worker_mod):
    """Patch all external seams on the worker module.

    Returns a dict of call-tracking lists so tests can assert what was called.
    """
    calls: dict[str, list] = {
        "queue_list": [],
        "get_submission": [],
        "claim": [],
        "resolve": [],
        "run_one": [],
    }

    def fake_queue_list(stage):
        calls["queue_list"].append(stage)
        return ["abc123"]

    def fake_get_submission(stage, sub_id):
        calls["get_submission"].append((stage, sub_id))
        return dict(FAKE_SUBMISSION)

    def fake_claim(sub_id):
        calls["claim"].append(sub_id)
        return 0  # success

    def fake_resolve(sub_id, outcome):
        calls["resolve"].append((sub_id, outcome))

    def fake_run_one(model, suite_id, *, meta=None, backend="vllm", local=False):
        calls["run_one"].append((model, suite_id))
        return {"schema": "run/v1", "id": "abc123"}

    monkeypatch.setattr(worker_mod, "_queue_list", fake_queue_list)
    monkeypatch.setattr(worker_mod, "_get_submission", fake_get_submission)
    monkeypatch.setattr(worker_mod, "_claim", fake_claim)
    monkeypatch.setattr(worker_mod, "_resolve", fake_resolve)
    monkeypatch.setattr(worker_mod, "_run_one", fake_run_one)

    return calls


# ── Tests ────────────────────────────────────────────────────────────────


class TestHappyPath:
    """One approved item, claim succeeds, run_one returns ok."""

    def test_resolve_called_with_done(self, worker_mod, patch_seams):
        worker_mod.tick()
        assert ("abc123", "done") in patch_seams["resolve"]

    def test_run_one_called_once(self, worker_mod, patch_seams):
        worker_mod.tick()
        assert len(patch_seams["run_one"]) == 1
        assert patch_seams["run_one"][0] == (
            "Qwen/Qwen2.5-0.5B-Instruct",
            "open-pl-v1",
        )

    def test_claim_called(self, worker_mod, patch_seams):
        worker_mod.tick()
        assert "abc123" in patch_seams["claim"]


class TestLostRace:
    """Claim returns exit code 3 (lost race) — run_one must NOT be called."""

    def test_run_one_not_called(self, worker_mod, patch_seams, monkeypatch):
        monkeypatch.setattr(worker_mod, "_claim", lambda sub_id: 3)
        worker_mod.tick()
        assert len(patch_seams["run_one"]) == 0

    def test_resolve_not_called(self, worker_mod, patch_seams, monkeypatch):
        monkeypatch.setattr(worker_mod, "_claim", lambda sub_id: 3)
        worker_mod.tick()
        assert len(patch_seams["resolve"]) == 0


class TestRunnerOOM:
    """run_one raises RunnerOOM — resolve with 'failed'."""

    def test_resolve_failed(self, worker_mod, patch_seams, monkeypatch):
        def raise_oom(*a, **kw):
            raise RunnerOOM("CUDA out of memory")

        monkeypatch.setattr(worker_mod, "_run_one", raise_oom)
        worker_mod.tick()
        assert ("abc123", "failed") in patch_seams["resolve"]


class TestRunnerBadRun:
    """run_one raises RunnerBadRun — resolve with 'failed'."""

    def test_resolve_failed(self, worker_mod, patch_seams, monkeypatch):
        def raise_bad(*a, **kw):
            raise RunnerBadRun("validation failed")

        monkeypatch.setattr(worker_mod, "_run_one", raise_bad)
        worker_mod.tick()
        assert ("abc123", "failed") in patch_seams["resolve"]


class TestRunnerConfigError:
    """run_one raises RunnerConfigError — do NOT resolve (don't lose the item)."""

    def test_resolve_not_called(self, worker_mod, patch_seams, monkeypatch):
        def raise_cfg(*a, **kw):
            raise RunnerConfigError("token missing")

        monkeypatch.setattr(worker_mod, "_run_one", raise_cfg)
        worker_mod.tick()
        assert len(patch_seams["resolve"]) == 0


class TestBareRunnerError:
    """run_one raises the BASE RunnerError (not a subclass) — resolve with 'failed', not orphaned."""

    def test_resolve_failed(self, worker_mod, patch_seams, monkeypatch):
        def raise_base(*a, **kw):
            raise RunnerError("lm_eval exited 1: unknown error")

        monkeypatch.setattr(worker_mod, "_run_one", raise_base)
        worker_mod.tick()
        assert ("abc123", "failed") in patch_seams["resolve"]

    def test_does_not_crash(self, worker_mod, patch_seams, monkeypatch):
        """tick() must return normally — no unhandled exception."""
        def raise_base(*a, **kw):
            raise RunnerError("lm_eval produced no results JSON")

        monkeypatch.setattr(worker_mod, "_run_one", raise_base)
        # Should not raise
        worker_mod.tick()
        assert len(patch_seams["resolve"]) == 1


class TestEmptyQueue:
    """Empty approved list — nothing called."""

    def test_nothing_called(self, worker_mod, patch_seams, monkeypatch):
        monkeypatch.setattr(worker_mod, "_queue_list", lambda stage: [])
        worker_mod.tick()
        assert len(patch_seams["claim"]) == 0
        assert len(patch_seams["run_one"]) == 0
        assert len(patch_seams["resolve"]) == 0
