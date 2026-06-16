"""M4 — testy walidacji sędziów (bench/plgen/validate_judges.py). BEZ sieci.

Kluczowy kontrakt: gold jest SAMOWYSTARCZALNY. Gdy rekord gold niesie `ans`,
sędzia ocenia DOKŁADNIE ten zapamiętany tekst (nie re-read z pliku gen, który
mógł zostać nadpisany regeneracją). Fallback na plik gen tylko dla legacy goldu.

Strategia: tmp RUNS/GOLD/DATA, stub `common._or_key` (offline) i spy na
`judge_panel.judge_one`, który zapamiętuje tekst podany sędziemu.
"""
import json
import os

import pytest

from bench.plgen import anno_cli, common, judge_panel, validate_judges

HERE = os.path.dirname(__file__)
DEV = os.path.join(HERE, "..", "testdata", "dev_prompts.jsonl")


@pytest.fixture
def env(tmp_path, monkeypatch):
    """tmp RUNS/GOLD/DATA + offline (_or_key stub). Zwraca obiekt ze ścieżkami."""
    runs = tmp_path / "runs"
    gold = tmp_path / "gold_v1.jsonl"
    runs.mkdir()
    monkeypatch.setattr(common, "RUNS", str(runs))
    monkeypatch.setattr(common, "GOLD", str(gold))
    monkeypatch.setattr(common, "DATA", DEV)
    # walidacja przebudowuje ścieżki z common.RUNS na imporcie -> nadpisz po monkeypatch
    monkeypatch.setattr(validate_judges, "VAL_DIR", str(runs / "validate"))
    monkeypatch.setattr(validate_judges, "LT_SCORES", str(runs / "lt_scores.jsonl"))
    # OFFLINE: udawaj, że klucz OpenRouter jest (żaden request nie poleci — judge_one stub)
    monkeypatch.setattr(common, "_or_key", lambda: "stub-key")

    prompts = common.load_prompts(DEV)
    pid = prompts[0]["id"]

    class E:
        pass
    e = E()
    e.runs, e.gold, e.prompts, e.pid = str(runs), str(gold), prompts, pid
    e.mp = anno_cli.map_path(str(gold))
    return e


def _write_gen(env, model="bielik", seed=42, ans="Tekst z PLIKU gen (re-read)."):
    """Zapisz jeden plik generacji gen_{model}_s{seed}.jsonl (kształt A2)."""
    path = os.path.join(env.runs, f"gen_{model}_s{seed}.jsonl")
    with open(path, "w", encoding="utf-8") as f:
        f.write(json.dumps({"id": env.pid, "domena": env.prompts[0]["domena"],
                            "model": model, "seed": seed, "ans": ans,
                            "n_tokens": common.count_tokens(ans)},
                           ensure_ascii=False) + "\n")
    return (env.pid, model, seed)


def _mapping(env, key):
    anno_cli.write_mapping([{"id": key[0], "model": key[1], "seed": key[2]}], env.mp)


def _spy(captured):
    """Spy zastępujący judge_panel.judge_one — zapamiętuje (key, ans)."""
    def judge_one(judge, item, ans, mode="guided"):
        captured.append(ans)
        return "pass", 4, "ok"
    return judge_one


def test_validate_judges_gold_ans_when_present(env, monkeypatch):
    """Gold niesie `ans` -> sędzia dostaje DOKŁADNIE tekst gold, nie re-read z gen."""
    key = _write_gen(env, ans="Tekst z PLIKU gen (re-read) — NIE ten.")
    _mapping(env, key)
    gold_ans = "DOKŁADNY tekst oceniony przez człowieka (gold)."
    anno_cli.append_gold(
        {"id": key[0], "model": key[1], "seed": key[2], "naturalnosc": 4,
         "werdykt": "pass", "note": "", "annotator": "kuba",
         "ans": gold_ans, "ans_sha": anno_cli._ans_sha(gold_ans)}, env.gold)

    captured = []
    monkeypatch.setattr(judge_panel, "judge_one", _spy(captured))
    # jeden sędzia wystarczy (test offline, deterministyczny)
    monkeypatch.setattr(validate_judges, "JUDGES",
                        [("StubJudge", "openrouter", "stub/stub")])
    monkeypatch.setattr(validate_judges.sys, "argv", ["validate_judges.py"])
    validate_judges.main()

    assert captured, "sędzia nie dostał żadnego itemu"
    assert all(a == gold_ans for a in captured), \
        f"sędzia ocenił nie-gold tekst: {captured!r}"


def test_validate_judges_falls_back_to_gen_for_legacy_gold(env, monkeypatch):
    """Legacy gold bez `ans` -> sędzia ocenia tekst z bieżącego pliku gen (fallback)."""
    gen_ans = "Tekst z PLIKU gen (legacy fallback)."
    key = _write_gen(env, ans=gen_ans)
    _mapping(env, key)
    # legacy: rekord gold BEZ pola `ans`
    anno_cli.append_gold(
        {"id": key[0], "model": key[1], "seed": key[2], "naturalnosc": 4,
         "werdykt": "pass", "note": "", "annotator": "kuba"}, env.gold)

    captured = []
    monkeypatch.setattr(judge_panel, "judge_one", _spy(captured))
    monkeypatch.setattr(validate_judges, "JUDGES",
                        [("StubJudge", "openrouter", "stub/stub")])
    monkeypatch.setattr(validate_judges.sys, "argv", ["validate_judges.py"])
    validate_judges.main()

    assert captured == [gen_ans], f"fallback nie użył tekstu z gen: {captured!r}"
