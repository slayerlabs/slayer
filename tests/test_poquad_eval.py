"""Regresja dla #54: score() nie może rzucać ZeroDivisionError przy pustej próbce.

Test jest hermetyczny - stubuje huggingface_hub i nie dotyka ollamy/sieci.
Dla pustego sample pętla po pytaniach nie wykonuje się, więc ask()/model
nie są w ogóle używane; liczy się tylko agregacja overall_EM/overall_F1.

Uruchomienie: `pytest tests/` albo `python3 tests/test_poquad_eval.py`.
"""
import importlib.util
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _load_poquad_eval():
    # stub ciężkiej zależności, żeby import był bezsieciowy
    sys.modules.setdefault(
        "huggingface_hub", types.SimpleNamespace(hf_hub_download=lambda *a, **k: None)
    )
    spec = importlib.util.spec_from_file_location("poquad_eval", ROOT / "poquad_eval.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_score_empty_sample_no_zerodivision():
    pe = _load_poquad_eval()
    res = pe.score("dummy-model", [])
    assert res["n"] == 0
    assert res["overall_EM"] is None
    assert res["overall_F1"] is None


if __name__ == "__main__":
    test_score_empty_sample_no_zerodivision()
    print("OK: score() na pustej próbce nie rzuca ZeroDivisionError")
