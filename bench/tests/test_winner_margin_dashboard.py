"""Regresja dla #40: leaderboard z jednym modelem nie może wywalać dashboardu.

Pokrywa dwie warstwy fiksa:
  * `_bench_common.winner_margin` — brak IndexError przy <2 modelach, poprawny
    margines względem runner-upa przy 3+ modelach,
  * `make_dashboard.main` — generuje SUMMARY.txt i dashboard.html (zamiast
    KeyError: 'winner') na realnym kształcie produkcyjnym, gdzie payload nie ma
    pól winner/margin.

Bez zależności od ciężkich bibliotek benchów ani od GPU/sieci. Uruchamialny
zarówno przez `pytest`, jak i wprost: `python3 bench/tests/test_winner_margin_dashboard.py`.
"""
import json
import os
import sys
import tempfile

BENCH_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BENCH_DIR not in sys.path:
    sys.path.insert(0, BENCH_DIR)

from _bench_common import winner_margin  # noqa: E402
import make_dashboard  # noqa: E402


def test_winner_margin_empty():
    assert winner_margin([], "accuracy") == {}


def test_winner_margin_single_model_no_indexerror():
    # przyczyna #40: jeden model w results -> wcześniej results[1] => IndexError
    one = [{"display_name": "Qwen3.5-9B", "accuracy": 55.0}]
    assert winner_margin(one, "accuracy") == {}


def test_winner_margin_two_models():
    res = [{"display_name": "Bielik-11B-v3.0-Instruct", "accuracy": 60.0},
           {"display_name": "Qwen3.5-9B", "accuracy": 57.5}]
    assert winner_margin(res, "accuracy") == {"winner": "Bielik-11B-v3.0-Instruct", "margin": 2.5}


def test_winner_margin_three_models_uses_runner_up():
    # margines liczony zwycięzca - drugi w kolejności, niezależnie od porządku listy
    res = [{"display_name": "C", "accuracy": 40.0},
           {"display_name": "A", "accuracy": 80.0},
           {"display_name": "B", "accuracy": 75.0}]
    assert winner_margin(res, "accuracy") == {"winner": "A", "margin": 5.0}


def _run_dashboard_with(payloads):
    """Uruchamia make_dashboard.main() na tymczasowym katalogu z podanymi payloadami.
    Zwraca (summary_text, html_text)."""
    tmp = tempfile.mkdtemp(prefix="slayer_dash_")
    for i, p in enumerate(payloads):
        with open(os.path.join(tmp, f"{p['benchmark']}_n{p['n']}_s{i}.json"), "w", encoding="utf-8") as fh:
            json.dump(p, fh, ensure_ascii=False)
    old_out = make_dashboard.OUT
    make_dashboard.OUT = tmp
    try:
        make_dashboard.main()
        summary = open(os.path.join(tmp, "SUMMARY.txt"), encoding="utf-8").read()
        html = open(os.path.join(tmp, "dashboard.html"), encoding="utf-8").read()
    finally:
        make_dashboard.OUT = old_out
    return summary, html


def test_dashboard_single_model_does_not_crash():
    # dokładnie stan produkcji: jeden model, payload bez winner/margin
    payload = {"benchmark": "pes", "metric": "accuracy (MCQ, exact letter)", "n": 100,
               "seed": 42, "models": [{"display_name": "Qwen3.5-9B", "accuracy": 55.0}]}
    summary, html = _run_dashboard_with([payload])
    # zwycięzca nieokreślony -> '-' zamiast wyjątku
    assert "-" in summary
    assert "PES" in summary
    assert "Qwen3.5-9B" in html  # wynik modelu nadal renderowany


def test_dashboard_two_models_shows_winner():
    payload = {"benchmark": "pes", "metric": "accuracy (MCQ, exact letter)", "n": 100, "seed": 42,
               "models": [{"display_name": "Bielik-11B-v3.0-Instruct", "accuracy": 60.0},
                          {"display_name": "Qwen3.5-9B", "accuracy": 57.5}],
               "winner": "Bielik-11B-v3.0-Instruct", "margin": 2.5}
    summary, html = _run_dashboard_with([payload])
    assert "Bielik-11B-v3" in summary and "+2.5" in summary
    assert "+2.5" in html


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"  PASS  {fn.__name__}")
    print(f"\n{len(fns)} testów OK")
