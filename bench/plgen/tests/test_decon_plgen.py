"""A6 — testy dekontaminacji PL-GEN: dedup vs PolNative + bramka eval_only.

Uruchom z katalogu repo:  uv run pytest bench/plgen/tests/test_decon_plgen.py -q

Wszystkie fixtury to pliki tmp — NIE zależymy od prawdziwego (jeszcze
nieistniejącego) slayer-data/plgen/prompts_v1.jsonl.
"""
import json

from bench.plgen import decon_plgen


def _write_jsonl(path, rows):
    path.write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n",
                    encoding="utf-8")
    return str(path)


def test_flags_exact_duplicate(tmp_path):
    pol = _write_jsonl(tmp_path / "pol.jsonl", [
        {"id": "p01", "prompt": "Napisz reklamację do sklepu o zepsuty piekarnik."},
    ])
    plg = _write_jsonl(tmp_path / "plg.jsonl", [
        {"id": "plg_001", "prompt": "Napisz reklamację do sklepu o zepsuty piekarnik.",
         "domena": "x", "rubryka": "y", "phenomena": [], "len_target": 200},
    ])
    res = decon_plgen.check(plg, pol, ngram=8)
    assert res["hits"], "exact duplicate should be flagged"
    assert res["hits"][0]["plgen_id"] == "plg_001"


def test_flags_near_duplicate_shared_ngram(tmp_path):
    base = ("Wyobraź sobie że jesteś przewodnikiem po starym mieście i "
            "oprowadzasz grupę turystów po rynku oraz okolicznych zaułkach")
    pol = _write_jsonl(tmp_path / "pol.jsonl", [
        {"id": "p01", "prompt": base + " w deszczowy poranek."},
    ])
    plg = _write_jsonl(tmp_path / "plg.jsonl", [
        {"id": "plg_002", "prompt": "Inny początek, ale potem: " + base + " późnym wieczorem.",
         "domena": "x", "rubryka": "y", "phenomena": [], "len_target": 200},
    ])
    res = decon_plgen.check(plg, pol, ngram=8)
    assert res["hits"], "near duplicate (shared long n-gram) should be flagged"
    assert res["hits"][0]["plgen_id"] == "plg_002"


def test_passes_distinct_prompt(tmp_path):
    pol = _write_jsonl(tmp_path / "pol.jsonl", [
        {"id": "p01", "prompt": "Dokończ przysłowie: Gdyby kózka nie skakała."},
    ])
    plg = _write_jsonl(tmp_path / "plg.jsonl", [
        {"id": "plg_003", "prompt": "Opisz swoje wymarzone wakacje nad jeziorem w górach.",
         "domena": "x", "rubryka": "y", "phenomena": [], "len_target": 200},
    ])
    res = decon_plgen.check(plg, pol, ngram=8)
    assert not res["hits"], "clearly distinct prompt must not be flagged"


def test_missing_plgen_file_is_graceful(tmp_path):
    pol = _write_jsonl(tmp_path / "pol.jsonl", [
        {"id": "p01", "prompt": "cokolwiek tutaj."},
    ])
    missing = str(tmp_path / "does_not_exist.jsonl")
    res = decon_plgen.check(missing, pol, ngram=8)
    assert res["hits"] == []
    assert res["plgen_missing"] is True


def test_missing_polnative_file_is_graceful(tmp_path):
    plg = _write_jsonl(tmp_path / "plg.jsonl", [
        {"id": "plg_001", "prompt": "cokolwiek.", "domena": "x", "rubryka": "y",
         "phenomena": [], "len_target": 200},
    ])
    res = decon_plgen.check(plg, str(tmp_path / "no_pol.jsonl"), ngram=8)
    assert res["hits"] == []


def test_eval_sources_registered():
    """Bramka eval_only: prompty PL-GEN muszą być w EVAL_SOURCES decon_audit."""
    import importlib
    import sys
    import os
    bench = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if bench not in sys.path:
        sys.path.insert(0, bench)
    decon_audit = importlib.import_module("decon_audit")
    from bench.plgen import common
    assert common.DATA in decon_audit.EVAL_SOURCES
