"""A4 — testy scoringu + agregacji w bench/plgen/bench_plgen.py. BEZ docker, BEZ sieci.

Uruchom z katalogu repo:  uv run pytest bench/plgen/tests/test_aggregate.py -q

Strategia:
- score(): monkeypatch grammar_check.score_docs + judge_panel.panel_score na kanoniczne
  wyjścia, ensure_lt -> stub (zero docker). Sprawdź kształt pliku scored per (model,seed)
  i idempotencję (drugi przebieg pomija istniejący plik).
- aggregate(): zbuduj fałszywe pliki scored (>=2 seedy) -> sprawdź że JSON ma właściwy
  kształt, że Layer A i Layer B są OSOBNE (brak wspólnej średniej), że wariancja
  międzyseedowa policzona poprawnie ze >=2 seedów, że per_domena jest obecne, oraz że
  sekcja matrix ma cols/rows[].vals z len(vals)==len(cols) i obsługą null.
"""
import json
import os
import statistics

import pytest

from bench.plgen import bench_plgen, common


HERE = os.path.dirname(__file__)
DEV = os.path.join(HERE, "..", "testdata", "dev_prompts.jsonl")


# --- kanoniczne wyjścia warstw (kształt jak w realnych modułach) ---
def _fake_layer_a(mean_morph, mean_spell, mean_style, per_dom=None):
    return {
        "mean_errors_per_100tok": {
            "morphosyntax": mean_morph, "spelling": mean_spell,
            "style": mean_style, "other": 0.0,
        },
        "total_counts": {"morphosyntax": 1, "spelling": 1, "style": 1, "other": 0},
        "total_tokens": 1000,
        "n_docs": 10, "n_scored": 10, "n_too_short": 0,
        "per_domena": per_dom or {},
    }


def _fake_layer_b(panel_score, naturalnosc, ija, per_dom=None, n_empty=0):
    return {
        "panel_score_mean": panel_score,
        "naturalnosc_mean": naturalnosc,
        "ija_alpha": ija,
        "n_items": 10, "n_scored": 10, "n_empty": n_empty,
        "per_domena": per_dom or {},
    }


@pytest.fixture
def runs_dir(tmp_path, monkeypatch):
    d = tmp_path / "runs"
    d.mkdir()
    monkeypatch.setattr(bench_plgen.common, "RUNS", str(d))
    return str(d)


@pytest.fixture
def out_path(tmp_path, monkeypatch):
    p = tmp_path / "out" / "plgen_v1.json"
    monkeypatch.setattr(bench_plgen.common, "OUT", str(p))
    return str(p)


def _write_gen(runs_dir, model, seed, rows):
    """Zapisz fałszywy plik generacji gen_{model}_s{seed}.jsonl."""
    p = os.path.join(runs_dir, f"gen_{model}_s{seed}.jsonl")
    with open(p, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    return p


def _write_scored(runs_dir, model, seed, layer_a, layer_b):
    """Zapisz fałszywy plik scored (jak emituje score())."""
    p = bench_plgen.scored_path(model, seed)
    with open(p, "w", encoding="utf-8") as f:
        json.dump({"model": model, "seed": seed,
                   "layer_a": layer_a, "layer_b": layer_b}, f, ensure_ascii=False)
    return p


# ============================================================================
# score() — kształt pliku scored + idempotencja
# ============================================================================
def test_score_writes_scored_file_no_docker_no_net(runs_dir, monkeypatch):
    rows = [{"id": "dev_001", "domena": "rekcja", "model": "bielik", "seed": 42,
             "ans": "x" * 50, "n_tokens": 50, "len_target": 120}]
    _write_gen(runs_dir, "bielik", 42, rows)

    # zero docker / zero sieci
    monkeypatch.setattr(bench_plgen.grammar_check, "ensure_lt",
                        lambda *a, **k: "http://stub:8010")
    monkeypatch.setattr(bench_plgen.grammar_check, "score_docs",
                        lambda texts, base_url: _fake_layer_a(1.0, 0.5, 0.2))
    monkeypatch.setattr(bench_plgen.judge_panel, "panel_score",
                        lambda panel, items, answers, workers=8, stream_path=None:
                        {"aggregate": _fake_layer_b(80.0, 4.2, 0.6), "judges": ["A", "B", "C"]})

    bench_plgen.score({"bielik": common.MODELS["bielik"]}, [42], prompts_path=DEV)

    sp = bench_plgen.scored_path("bielik", 42)
    assert os.path.exists(sp)
    obj = json.load(open(sp, encoding="utf-8"))
    assert obj["model"] == "bielik" and obj["seed"] == 42
    assert obj["layer_a"]["mean_errors_per_100tok"]["morphosyntax"] == 1.0
    assert obj["layer_b"]["panel_score_mean"] == 80.0


def test_score_idempotent_skips_existing(runs_dir, monkeypatch):
    rows = [{"id": "dev_001", "domena": "rekcja", "model": "bielik", "seed": 42,
             "ans": "x" * 50, "n_tokens": 50, "len_target": 120}]
    _write_gen(runs_dir, "bielik", 42, rows)
    monkeypatch.setattr(bench_plgen.grammar_check, "ensure_lt", lambda *a, **k: "http://stub")

    calls = {"a": 0, "b": 0}

    def la(texts, base_url):
        calls["a"] += 1
        return _fake_layer_a(1.0, 0.5, 0.2)

    def lb(panel, items, answers, workers=8, stream_path=None):
        calls["b"] += 1
        return {"aggregate": _fake_layer_b(80.0, 4.2, 0.6), "judges": ["A"]}

    monkeypatch.setattr(bench_plgen.grammar_check, "score_docs", la)
    monkeypatch.setattr(bench_plgen.judge_panel, "panel_score", lb)

    bench_plgen.score({"bielik": common.MODELS["bielik"]}, [42], prompts_path=DEV)
    first = dict(calls)
    assert first["a"] >= 1 and first["b"] == 1  # overall + per-domena na Layer A; 1x panel
    # drugi przebieg: plik scored istnieje -> 0 nowych wywołań warstw
    bench_plgen.score({"bielik": common.MODELS["bielik"]}, [42], prompts_path=DEV)
    assert calls == first, "score nie pominął istniejącego pliku scored"


# ============================================================================
# aggregate() — kształt, rozdzielność warstw, wariancja, per_domena
# ============================================================================
def _seed_scored(runs_dir, model, seeds_data):
    """seeds_data: list of (seed, layer_a, layer_b)."""
    for seed, la, lb in seeds_data:
        _write_scored(runs_dir, model, seed, la, lb)


def test_aggregate_shape_and_layers_separate(runs_dir, out_path):
    pd_a = {"rekcja": {"morphosyntax": 1.0, "spelling": 0.0, "style": 0.0, "other": 0.0}}
    pd_b = {"rekcja": {"panel_score": 80.0, "naturalnosc": 4.0}}
    _seed_scored(runs_dir, "bielik", [
        (42, _fake_layer_a(1.0, 0.5, 0.2, pd_a), _fake_layer_b(80.0, 4.0, 0.6, pd_b)),
        (43, _fake_layer_a(3.0, 1.5, 0.6, pd_a), _fake_layer_b(70.0, 3.0, 0.5, pd_b)),
    ])

    rep = bench_plgen.aggregate({"bielik": common.MODELS["bielik"]}, [42, 43])

    assert rep["bench"] == "plgen_v1"
    assert rep["lt_image"] == "erikvl87/languagetool:6.5"
    m = rep["results"]["bielik"]

    # WARSTWY OSOBNE: layer_a i layer_b to oddzielne sekcje, brak wspólnej średniej
    assert "layer_a" in m and "layer_b" in m
    assert "combined" not in m and "overall" not in m
    # layer_a nie zawiera pól panelu i odwrotnie
    assert "panel_score_mean" not in m["layer_a"]
    assert "errors_per_100tok" not in m["layer_b"] and "morphosyntax" not in m["layer_b"]

    # Layer A: średnia po seedach per bucket + wariancja
    la = m["layer_a"]
    assert la["mean_errors_per_100tok"]["morphosyntax"] == pytest.approx(2.0)  # (1+3)/2
    assert la["mean_errors_per_100tok"]["spelling"] == pytest.approx(1.0)      # (0.5+1.5)/2
    # wariancja międzyseedowa (statistics.variance, próbkowa) z [1.0, 3.0] = 2.0
    assert la["var_errors_per_100tok"]["morphosyntax"] == pytest.approx(
        statistics.variance([1.0, 3.0]))
    assert la["n_seeds"] == 2

    # Layer B: panel/naturalnosc + wariancja
    lb = m["layer_b"]
    assert lb["panel_score_mean"] == pytest.approx(75.0)       # (80+70)/2
    assert lb["naturalnosc_mean"] == pytest.approx(3.5)        # (4+3)/2
    assert lb["panel_score_var"] == pytest.approx(statistics.variance([80.0, 70.0]))
    assert lb["ija_alpha_mean"] == pytest.approx(0.55)

    # per_domena obecne w obu warstwach
    assert "rekcja" in m["layer_a"]["per_domena"]
    assert "rekcja" in m["layer_b"]["per_domena"]


def test_aggregate_propagates_n_empty(runs_dir, out_path):
    # n_empty (puste odpowiedzi) sumowane po seedach i widoczne w plgen_v1.json
    _seed_scored(runs_dir, "bielik", [
        (42, _fake_layer_a(1.0, 0.0, 0.0), _fake_layer_b(80.0, 4.0, 0.6, n_empty=2)),
        (43, _fake_layer_a(1.0, 0.0, 0.0), _fake_layer_b(70.0, 3.0, 0.5, n_empty=3)),
    ])
    rep = bench_plgen.aggregate({"bielik": common.MODELS["bielik"]}, [42, 43])
    assert rep["results"]["bielik"]["layer_b"]["n_empty"] == 5
    # i faktycznie zapisane do OUT
    saved = json.load(open(out_path, encoding="utf-8"))
    assert saved["results"]["bielik"]["layer_b"]["n_empty"] == 5


def test_aggregate_variance_from_three_seeds(runs_dir, out_path):
    vals = [1.0, 2.0, 6.0]
    _seed_scored(runs_dir, "bielik", [
        (s, _fake_layer_a(v, 0.0, 0.0), _fake_layer_b(50.0 + v, 3.0, 0.5))
        for s, v in zip([42, 43, 44], vals)
    ])
    rep = bench_plgen.aggregate({"bielik": common.MODELS["bielik"]}, [42, 43, 44])
    la = rep["results"]["bielik"]["layer_a"]
    assert la["n_seeds"] == 3
    assert la["mean_errors_per_100tok"]["morphosyntax"] == pytest.approx(statistics.mean(vals))
    assert la["var_errors_per_100tok"]["morphosyntax"] == pytest.approx(statistics.variance(vals))


def test_aggregate_merge_does_not_clobber(runs_dir, out_path):
    # istniejący OUT z innym modelem -> nie wolno nadpisać
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    json.dump({"bench": "plgen_v1", "results": {"gemma4": {"layer_a": {"PRESERVED": 1}}}},
              open(out_path, "w"))
    _seed_scored(runs_dir, "bielik", [
        (42, _fake_layer_a(1.0, 0.0, 0.0), _fake_layer_b(80.0, 4.0, 0.6)),
    ])
    rep = bench_plgen.aggregate({"bielik": common.MODELS["bielik"]}, [42])
    saved = json.load(open(out_path, encoding="utf-8"))
    assert "gemma4" in saved["results"], "merge skasował istniejący model"
    assert saved["results"]["gemma4"]["layer_a"]["PRESERVED"] == 1
    assert "bielik" in saved["results"]


# ============================================================================
# sekcja matrix — kształt dashboardu
# ============================================================================
def test_matrix_section_shape(runs_dir, out_path, tmp_path, monkeypatch):
    sec_path = tmp_path / "out" / "plgen_matrix_section.json"
    monkeypatch.setattr(bench_plgen, "MATRIX_SECTION_OUT", str(sec_path))

    pd_a = {"rekcja": {"morphosyntax": 1.0, "spelling": 0.0, "style": 0.0, "other": 0.0}}
    pd_b = {"rekcja": {"panel_score": 80.0, "naturalnosc": 4.0}}
    # dwa modele -> dwie kolumny; jeden tylko z layer_a, by sprawdzić null
    _seed_scored(runs_dir, "bielik", [
        (42, _fake_layer_a(2.0, 1.0, 0.5, pd_a), _fake_layer_b(80.0, 4.0, 0.6, pd_b)),
    ])
    _seed_scored(runs_dir, "gemma4", [
        (42, _fake_layer_a(3.0, 1.5, 0.7, pd_a), _fake_layer_b(70.0, 3.5, 0.5, pd_b)),
    ])

    rep = bench_plgen.aggregate(
        {"bielik": common.MODELS["bielik"], "gemma4": common.MODELS["gemma4"]}, [42])
    sec = bench_plgen.matrix_section(rep)

    assert sec["official_for"] == "plgen"
    assert isinstance(sec["protocol"], str) and sec["protocol"]
    assert isinstance(sec["note"], str) and sec["note"]
    assert len(sec["cols"]) == 2
    assert sec["rows"], "brak wierszy"
    for r in sec["rows"]:
        assert "name" in r and "vals" in r
        assert len(r["vals"]) == len(sec["cols"]), f"len(vals)!=len(cols) w {r['name']}"

    # rozdzielne wiersze: jest wiersz LT i wiersz sędziów (po nazwie)
    names = " ".join(r["name"] for r in sec["rows"]).lower()
    assert "lt" in names or "błąd" in names or "morfo" in names
    assert "sędz" in names or "naturaln" in names

    # plik sekcji zapisany
    assert os.path.exists(sec_path)
    on_disk = json.load(open(sec_path, encoding="utf-8"))
    assert on_disk["cols"] == sec["cols"]


def test_matrix_section_null_for_missing(runs_dir, out_path, monkeypatch):
    monkeypatch.setattr(bench_plgen, "MATRIX_SECTION_OUT", str(runs_dir) + "/sec.json")
    # bielik bez per_domena 'liczebniki', więc per-domena row dla liczebniki -> null gdzieś
    _seed_scored(runs_dir, "bielik", [
        (42, _fake_layer_a(2.0, 1.0, 0.5,
                           {"rekcja": {"morphosyntax": 1.0, "spelling": 0.0,
                                       "style": 0.0, "other": 0.0}}),
         _fake_layer_b(80.0, 4.0, 0.6, {"rekcja": {"panel_score": 80.0, "naturalnosc": 4.0}})),
    ])
    _seed_scored(runs_dir, "gemma4", [
        (42, _fake_layer_a(3.0, 1.5, 0.7,
                           {"liczebniki": {"morphosyntax": 2.0, "spelling": 0.0,
                                           "style": 0.0, "other": 0.0}}),
         _fake_layer_b(70.0, 3.5, 0.5, {"liczebniki": {"panel_score": 60.0, "naturalnosc": 3.0}})),
    ])
    rep = bench_plgen.aggregate(
        {"bielik": common.MODELS["bielik"], "gemma4": common.MODELS["gemma4"]}, [42])
    sec = bench_plgen.matrix_section(rep)
    # gdzieś w wierszach per-domena musi być None (model bez tej domeny)
    has_null = any(any(v is None for v in r["vals"]) for r in sec["rows"])
    assert has_null, "oczekiwano null dla brakującej domeny w którymś modelu"
