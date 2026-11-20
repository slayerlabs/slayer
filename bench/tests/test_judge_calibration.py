"""Testy offline dla legal_cites + judge_calibration (slayer#8). Bez sieci i bez kluczy API.

Uruchamialne przez `pytest` albo wprost: `python3 bench/tests/test_judge_calibration.py`.
"""
import json
import os
import sys
import tempfile

BENCH_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BENCH_DIR not in sys.path:
    sys.path.insert(0, BENCH_DIR)

import judge_calibration as jc  # noqa: E402
from legal_cites import Cite, article_context, coverage, parse_konst_cites  # noqa: E402

UNITS = {
    Cite(227, None, None): {"text": "1. Bank centralny...\n3. Prezes NBP powołuje Sejm."},
    Cite(227, 3, None): {"text": "Prezes NBP powołuje Sejm."},
    Cite(146, None, None): {"text": "4. Rada Ministrów w szczególności: 3) koordynuje..."},
    Cite(146, 4, None): {"text": "Rada Ministrów w szczególności:"},
    Cite(146, 4, 3): {"text": "koordynuje i kontroluje prace organów administracji rządowej,"},
}


def _item(**kw: object) -> jc.Item:
    base = {"id": "kssip:2015_ogolna:1", "source": "kssip", "year": 2015, "question": "Kto?",
            "options": ("Senat", "Sejm", "Prezydent"), "answer": 1, "context": "Art. 227."}
    return jc.Item(**{**base, **kw})


def test_parse_standard_and_variants() -> None:
    assert parse_konst_cites("art. 227 ust. 3 Konstytucji RP") == [Cite(227, 3, None)]
    assert parse_konst_cites("art. 146 ust. 4 pkt 3 Konstytucji Rzeczypospolitej Polskiej") == [
        Cite(146, 4, 3)]
    assert parse_konst_cites("art. 192 w zw. z art. 189 Konstytucji RP") == [
        Cite(192, None, None), Cite(189, None, None)]


def test_parse_ocr_missing_ust_number_falls_back_to_article() -> None:
    assert parse_konst_cites("art. 235 ust. Konstytucji RP") == [Cite(235, None, None)]


def test_parse_rejects_other_acts() -> None:
    assert parse_konst_cites("art. 10 ust. 2 ustawy o organizacji i trybie postępowania "
                             "przed Trybunałem Konstytucyjnym") == []
    assert parse_konst_cites("art. 43 § 2b k.k.") == []
    assert parse_konst_cites(None) == []


def test_article_context_and_missing_article() -> None:
    ctx = article_context(UNITS, [Cite(227, 3, None)])
    assert ctx.startswith("Art. 227.\n") and "Sejm" in ctx
    assert article_context(UNITS, [Cite(999, None, None)]) is None
    assert article_context(UNITS, []) is None


def test_coverage_uses_most_specific_unit() -> None:
    rows = [{"legal_basis": "art. 146 ust. 4 pkt 3 Konstytucji RP"},
            {"legal_basis": "art. 227 ust. 9 Konstytucji RP"}]  # ust. 9 nie istnieje → artykuł
    cov = coverage(UNITS, rows)
    assert cov["articles"] == {146, 227}
    assert cov["units"] == {Cite(146, 4, 3), Cite(227, None, None)}


def test_bad_key_is_wrong_and_deterministic() -> None:
    item = _item()
    assert jc.bad_key(item) != item.answer
    assert jc.bad_key(item) == jc.bad_key(_item())
    assert {jc.bad_key(_item(id=f"x:{i}")) for i in range(50)} == {0, 2}


def test_render_modes() -> None:
    item = _item()
    assert "Przepis:" in jc.render(item, "solve")
    assert "Przepis:" not in jc.render(item, "closed")
    assert "Wskazana odpowiedź: B" in jc.render(item, "verify_true")
    assert f"Wskazana odpowiedź: {'ABC'[jc.bad_key(item)]}" in jc.render(item, "verify_bad")


def test_counterfactual_swaps_provision_and_key() -> None:
    item = _item(question="Zgodnie z Konstytucją RP, Prezesa NBP powołuje:",
                 context="Art. 227.\n3. Prezesa NBP powołuje Sejm na wniosek Prezydenta.",
                 options=("Senat,", "Sejm,", "Trybunał."))
    cf = jc.counterfactual(item)
    assert cf is not None and cf.answer == jc.bad_key(item) != item.answer
    new = jc._norm_option(item.options[cf.answer])
    assert f"powołuje {new} na wniosek" in cf.context and "Sejm" not in cf.context
    assert cf.question.startswith("Zgodnie z podanym przepisem,")


def test_counterfactual_skips_when_not_verbatim_or_ambiguous() -> None:
    assert jc.counterfactual(_item(context="Art. 1. Nic o tym.")) is None
    both = "Art. 227. Sejm i Senat oraz Prezydent."
    assert jc.counterfactual(_item(context=both)) is None


def test_parse_value() -> None:
    assert jc.parse_value("\nB. Sejm", "solve", "ABC") == "B"
    assert jc.parse_value("<think>A? nie</think> C", "solve", "ABC") == "C"
    assert jc.parse_value("D", "solve", "ABC") is None
    assert jc.parse_value("Nie.", "verify_bad", "ABC") == "NIE"
    assert jc.parse_value("tak", "verify_true", "ABC") == "TAK"


def test_report_splits_fresh_and_thresholds() -> None:
    recs = [
        {"judge": "basal", "mode": "solve", "year": 2026, "expected": "A", "got": "A",
         "confidence": 0.99},
        {"judge": "basal", "mode": "solve", "year": 2015, "expected": "A", "got": "B",
         "confidence": 0.6},
        {"judge": "qwen", "mode": "verify_bad", "year": 2015, "expected": "NIE", "got": None,
         "confidence": None},
    ]
    with tempfile.TemporaryDirectory() as d:
        path = os.path.join(d, "calls.jsonl")
        with open(path, "w", encoding="utf-8") as f:
            f.writelines(json.dumps(r) + "\n" for r in recs)
        text = jc.report(path)
    assert "| basal | solve | 50.0% (1/2) | 100.0% (1/1) | 0.0% (0/1) | 0 |" in text
    assert "| qwen | verify_bad | 0.0% (0/1) | – | 0.0% (0/1) | 1 |" in text
    assert "| 0.9 | 1/2 | 100.0% (1/1) |" in text


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
    print("OK")
