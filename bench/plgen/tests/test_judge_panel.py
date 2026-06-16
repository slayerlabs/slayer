"""A3 — testy panelu sędziów (judge_panel). BEZ sieci.

Uruchom z katalogu repo:  uv run pytest bench/plgen/tests/test_judge_panel.py -q

Strategia: monkeypatch common.ask -> kanoniczny JSON sędziego (per sędzia),
sprawdź: panel odpytuje wszystkich sędziów; głosowanie większościowe na werdykcie;
średnia naturalnosc; mapowanie pass/mixed/fail -> 1/0.5/0. Osobno: odporny parse
(JSON ucięty/śmieci) i blind (prompt sędziego nie ujawnia modelu-podmiotu). IJA na
ręcznie zbudowanych macierzach etykiet o znanej zgodzie.
"""
import json
import math
import os

import pytest

from bench.plgen import judge_panel as jp


# --- helpery: kanoniczne odpowiedzi sędziów ---
def _verdict_json(werdykt, naturalnosc, powod="ok"):
    return json.dumps({"werdykt": werdykt, "naturalnosc": naturalnosc, "powod": powod},
                      ensure_ascii=False)


def _item(i=1):
    return {"id": f"plg_{i:03d}", "domena": "rekcja",
            "prompt": "Napisz reklamację do sklepu (ok. 200 słów).",
            "rubryka": "Oceń rekcję dopełniacza i naturalność. pass/mixed/fail.",
            "phenomena": ["szukać+D"], "len_target": 200}


# ============================================================================
# judge_one — parse + mapowanie
# ============================================================================
def test_judge_one_parses_clean_json(monkeypatch):
    monkeypatch.setattr(jp.common, "ask",
                        lambda *a, **k: _verdict_json("pass", 5, "świetnie"))
    judge = ("Llama", "openrouter", "meta-llama/llama-3.3-70b-instruct")
    w, nat, powod = jp.judge_one(judge, _item(), "Szanowni Państwo, ...")
    assert w == "pass"
    assert nat == 5
    assert powod == "świetnie"


def test_judge_one_empty_answer_is_fail(monkeypatch):
    # pusta odpowiedź modelu = artefakt harnessu -> fail bez wołania sieci
    called = {"n": 0}
    monkeypatch.setattr(jp.common, "ask",
                        lambda *a, **k: (called.__setitem__("n", called["n"] + 1), "")[1])
    judge = ("Llama", "openrouter", "x")
    w, nat, powod = jp.judge_one(judge, _item(), "   ")
    assert w == "fail"
    assert nat is None or isinstance(nat, (int, float))
    assert called["n"] == 0, "pusta odpowiedź nie powinna wołać sędziego"


def test_judge_one_truncated_json_fallback(monkeypatch):
    # JSON ucięty (brak domknięcia) -> regex wyciąga werdykt
    monkeypatch.setattr(jp.common, "ask",
                        lambda *a, **k: '{"werdykt": "mixed", "naturalnosc": 3, "powo')
    w, nat, powod = jp.judge_one(("J", "b", "t"), _item(), "ans")
    assert w == "mixed"
    # naturalnosc też da się wyciągnąć regexem z ucięcia
    assert nat == 3


def test_judge_one_garbage_returns_none(monkeypatch):
    monkeypatch.setattr(jp.common, "ask", lambda *a, **k: "kompletny bełkot bez json")
    w, nat, powod = jp.judge_one(("J", "b", "t"), _item(), "ans")
    assert w is None
    assert nat is None


def test_judge_one_bad_verdict_label_is_none(monkeypatch):
    # werdykt spoza pass/mixed/fail -> None (nie liczony)
    monkeypatch.setattr(jp.common, "ask",
                        lambda *a, **k: _verdict_json("doskonały", 4))
    w, nat, powod = jp.judge_one(("J", "b", "t"), _item(), "ans")
    assert w is None


def test_judge_one_naturalnosc_clamped(monkeypatch):
    # spoza 1-5 -> odrzucone do None (nie psuje średniej)
    monkeypatch.setattr(jp.common, "ask",
                        lambda *a, **k: _verdict_json("pass", 9))
    w, nat, powod = jp.judge_one(("J", "b", "t"), _item(), "ans")
    assert w == "pass"
    assert nat is None


# ============================================================================
# blind — prompt sędziego nie ujawnia modelu-podmiotu
# ============================================================================
def test_judge_prompt_is_blind():
    it = _item()
    ans = "Jakaś odpowiedź modelu po polsku."
    p = jp.build_judge_prompt(it, ans)
    # żadna nazwa/klucz podmiotu nie może wyciec do promptu sędziego
    haystack = (p + jp.JUDGE_SYS).lower()
    for subj in ("bielik", "qwen", "gemma", "qwen35_instruct", "qwen35_base",
                 "qwen36", "gemma4", "slayer"):
        assert subj not in haystack, f"prompt sędziego ujawnia podmiot: {subj}"
    # ale zawiera zadanie, rubrykę i odpowiedź
    assert it["prompt"] in p
    assert it["rubryka"] in p
    assert ans in p


def test_judge_one_does_not_pass_model_name(monkeypatch):
    seen = {}

    def spy(backend, tag, temp, prompt, **k):
        seen["prompt"] = prompt
        return _verdict_json("pass", 5)

    monkeypatch.setattr(jp.common, "ask", spy)
    jp.judge_one(("Llama", "openrouter", "meta-llama/llama-3.3-70b-instruct"),
                 _item(), "Odpowiedź podmiotu.")
    low = seen["prompt"].lower()
    for subj in ("bielik", "qwen", "gemma", "slayer"):
        assert subj not in low


# ============================================================================
# regresja: sędzia MUSI dostać JUDGE_SYS jako system prompt, nie generyczny SYS
# (bug A3: common.ask hardkodował SYS -> sędzia odpowiadał na zadanie zamiast
#  oceniać -> wszystkie werdykty None, n_scored=0). Mock samej ask to ukrywał.
# ============================================================================
def test_judge_one_passes_judge_sys(monkeypatch):
    seen = {}

    def spy(backend, tag, temp, prompt, num_predict=None, seed=None, system=None):
        seen["system"] = system
        return _verdict_json("pass", 5)

    monkeypatch.setattr(jp.common, "ask", spy)
    jp.judge_one(("Llama", "openrouter", "meta-llama/llama-3.3-70b-instruct"),
                 _item(), "Odpowiedź podmiotu.")
    # domyślny tryb = guided -> sędzia dostaje JUDGE_SYS_GUIDED, NIE generyczny SYS
    assert seen["system"] == jp.JUDGE_SYS_GUIDED, "sędzia musi dostać JUDGE_SYS_GUIDED"
    assert seen["system"] != jp.common.SYS, "sędzia NIE może dostać generycznego SYS"


def test_judge_sys_reaches_model_not_generic_sys(monkeypatch):
    # zapisuje WSZYSTKIE argumenty (pozycyjne + kw) i weryfikuje, że system=JUDGE_SYS_GUIDED
    calls = []
    monkeypatch.setattr(jp.common, "ask",
                        lambda *a, **k: (calls.append((a, k)),
                                         _verdict_json("pass", 4))[1])
    jp.judge_one(("J", "openrouter", "t"), _item(), "ans")
    assert len(calls) == 1
    args, kwargs = calls[0]
    assert kwargs.get("system") == jp.JUDGE_SYS_GUIDED
    # wysyłany system prompt niesie rolę sędziego + instrukcję JSON werdyktu
    assert "werdykt" in jp.JUDGE_SYS_GUIDED
    assert "naturalnosc" in jp.JUDGE_SYS_GUIDED


# ============================================================================
# tryb rubryki: strict vs holistic (oś dyskryminacji sędziego)
# ============================================================================
def test_judge_one_strict_uses_strict_sys(monkeypatch):
    seen = {}

    def spy(backend, tag, temp, prompt, num_predict=None, seed=None, system=None):
        seen["system"] = system
        seen["prompt"] = prompt
        return _verdict_json("fail", 2)

    monkeypatch.setattr(jp.common, "ask", spy)
    jp.judge_one(("J", "openrouter", "t"), _item(), "ans", mode="strict")
    assert seen["system"] == jp.JUDGE_SYS_STRICT
    assert seen["system"] != jp.JUDGE_SYS
    # protokół STRICT wymusza wyliczenie błędów w tablicy 'bledy'
    assert "bledy" in seen["prompt"]


def test_judge_one_default_mode_is_guided(monkeypatch):
    # WYSYŁANY tryb: brak mode= -> guided (JUDGE_SYS_GUIDED, protokół 'bledy')
    seen = {}

    def spy(backend, tag, temp, prompt, num_predict=None, seed=None, system=None):
        seen["system"] = system
        seen["prompt"] = prompt
        return _verdict_json("pass", 5)

    monkeypatch.setattr(jp.common, "ask", spy)
    jp.judge_one(("J", "openrouter", "t"), _item(), "ans")  # bez mode=
    assert seen["system"] == jp.JUDGE_SYS_GUIDED
    assert "bledy" in seen["prompt"]


def test_judge_one_explicit_holistic_still_works(monkeypatch):
    # holistic nadal dostępny (parked/diagnostyka), ale NIE jest domyślny
    seen = {}
    monkeypatch.setattr(jp.common, "ask",
                        lambda *a, **k: (seen.update(system=k.get("system")),
                                         _verdict_json("pass", 5))[1])
    jp.judge_one(("J", "openrouter", "t"), _item(), "ans", mode="holistic")
    assert seen["system"] == jp.JUDGE_SYS


def test_strict_parses_object_with_bledy_field(monkeypatch):
    # STRICT zwraca {bledy:[...], werdykt, naturalnosc, powod}; parser i tak wyciąga
    strict_json = json.dumps({
        "bledy": [{"fragment": "poszukuję narzędzie", "typ": "rekcja",
                   "poprawka": "poszukuję narzędzia"}],
        "werdykt": "mixed", "naturalnosc": 4, "powod": "1 błąd rekcji",
    }, ensure_ascii=False)
    monkeypatch.setattr(jp.common, "ask", lambda *a, **k: strict_json)
    w, nat, powod = jp.judge_one(("J", "b", "t"), _item(), "ans", mode="strict")
    assert w == "mixed"
    assert nat == 4


def test_panel_score_threads_mode_strict(monkeypatch):
    seen = {"systems": []}

    def spy(backend, tag, temp, prompt, num_predict=None, seed=None, system=None):
        seen["systems"].append(system)
        return _verdict_json("fail", 2)

    monkeypatch.setattr(jp.common, "ask", spy)
    jp.panel_score(_panel(), [_item(1)], ["odp"], workers=1, mode="strict")
    assert seen["systems"], "panel musiał zawołać sędziów"
    assert all(s == jp.JUDGE_SYS_STRICT for s in seen["systems"])


# ============================================================================
# tryb GUIDED: zakotwiczenie na `phenomena` (kotwica w stylu PolNative)
# ============================================================================
def test_judge_one_guided_uses_guided_sys(monkeypatch):
    seen = {}

    def spy(backend, tag, temp, prompt, num_predict=None, seed=None, system=None):
        seen["system"] = system
        seen["prompt"] = prompt
        return _verdict_json("fail", 2)

    monkeypatch.setattr(jp.common, "ask", spy)
    jp.judge_one(("J", "openrouter", "t"), _item(), "ans", mode="guided")
    assert seen["system"] == jp.JUDGE_SYS_GUIDED
    assert seen["system"] != jp.JUDGE_SYS
    assert seen["system"] != jp.JUDGE_SYS_STRICT
    # protokół GUIDED wymusza wyliczenie błędów w tablicy 'bledy'
    assert "bledy" in seen["prompt"]


def test_guided_prompt_injects_phenomena():
    # najwyższa dźwignia: konkretne zjawiska z itemu MUSZĄ trafić do promptu sędziego
    it = _item()
    it["phenomena"] = ["szukać+D", "swój vs jego"]
    p = jp.build_judge_prompt_guided(it, "Jakaś odpowiedź po polsku.")
    for phen in it["phenomena"]:
        assert phen in p, f"prompt GUIDED musi zawierać zjawisko: {phen}"
    # i każe je sprawdzić
    assert "SPRAWD" in p.upper()


def test_guided_prompt_is_blind():
    it = _item()
    it["phenomena"] = ["szukać+D"]
    ans = "Jakaś odpowiedź modelu po polsku."
    p = jp.build_judge_prompt_guided(it, ans)
    haystack = (p + jp.JUDGE_SYS_GUIDED).lower()
    for subj in ("bielik", "qwen", "gemma", "gemma4", "slayer"):
        assert subj not in haystack, f"prompt GUIDED ujawnia podmiot: {subj}"
    assert it["prompt"] in p
    assert it["rubryka"] in p
    assert ans in p


def test_guided_prompt_handles_empty_phenomena():
    # brak/pusta lista phenomena -> łagodna degradacja (bez wyjątku)
    it = _item()
    it["phenomena"] = []
    p = jp.build_judge_prompt_guided(it, "ans")
    assert it["prompt"] in p
    assert "bledy" in p
    # i przypadek braku klucza w ogóle
    it2 = dict(it)
    del it2["phenomena"]
    p2 = jp.build_judge_prompt_guided(it2, "ans")
    assert it2["prompt"] in p2


def test_guided_prompt_ignores_truncation():
    # wymóg: instrukcja by NIE karać za ucięcie/niekompletność
    it = _item()
    p = (jp.build_judge_prompt_guided(it, "ans") + jp.JUDGE_SYS_GUIDED).lower()
    assert "uci" in p, "GUIDED musi instruować, by ignorować ucięcie tekstu"


def test_guided_parses_object_with_bledy_field(monkeypatch):
    guided_json = json.dumps({
        "bledy": [{"fragment": "udzieli mi porada", "typ": "rekcja",
                   "poprawka": "udzieli mi porady"}],
        "werdykt": "mixed", "naturalnosc": 4, "powod": "1 błąd rekcji",
    }, ensure_ascii=False)
    monkeypatch.setattr(jp.common, "ask", lambda *a, **k: guided_json)
    w, nat, powod = jp.judge_one(("J", "b", "t"), _item(), "ans", mode="guided")
    assert w == "mixed"
    assert nat == 4


def test_guided_sys_carries_anti_leniency_and_taxonomy():
    s = jp.JUDGE_SYS_GUIDED.lower()
    assert "werdykt" in jp.JUDGE_SYS_GUIDED
    assert "naturalnosc" in jp.JUDGE_SYS_GUIDED
    assert "rekcja" in s  # taksonomia błędów
    assert "pass" in jp.JUDGE_SYS_GUIDED and "fail" in jp.JUDGE_SYS_GUIDED


def test_panel_score_threads_mode_guided(monkeypatch):
    seen = {"systems": []}

    def spy(backend, tag, temp, prompt, num_predict=None, seed=None, system=None):
        seen["systems"].append(system)
        return _verdict_json("fail", 2)

    monkeypatch.setattr(jp.common, "ask", spy)
    jp.panel_score(_panel(), [_item(1)], ["odp"], workers=1, mode="guided")
    assert seen["systems"], "panel musiał zawołać sędziów"
    assert all(s == jp.JUDGE_SYS_GUIDED for s in seen["systems"])


def test_holistic_strict_unchanged_by_guided():
    # regresja: dodanie GUIDED nie tknęło holistic/strict
    assert jp._RUBRIC["holistic"] == (jp.JUDGE_SYS, jp.build_judge_prompt)
    assert jp._RUBRIC["strict"] == (jp.JUDGE_SYS_STRICT, jp.build_judge_prompt_strict)
    # holistic NADAL nie wstrzykuje phenomena ani 'bledy'
    it = _item()
    it["phenomena"] = ["szukać+D"]
    ph = jp.build_judge_prompt(it, "ans")
    assert "szukać+D" not in ph
    assert "bledy" not in ph


# ============================================================================
# panel_score + aggregation
# ============================================================================
def _panel():
    return [("J1", "b", "t1"), ("J2", "b", "t2"), ("J3", "b", "t3")]


def test_panel_runs_all_judges(monkeypatch):
    # każdy sędzia głosuje pass; po jednym itemie -> 3 werdykty
    monkeypatch.setattr(jp.common, "ask", lambda *a, **k: _verdict_json("pass", 4))
    items = [_item(1)]
    answers = ["odp"]
    res = jp.panel_score(_panel(), items, answers, workers=2)
    per = res["items"][0]
    assert len(per["judges"]) == 3
    assert all(j["werdykt"] == "pass" for j in per["judges"])


def test_panel_stream_path_one_line_per_verdict(monkeypatch, tmp_path):
    # diag: stream_path dostaje jedną linię na (sędzia × item), z polami werdyktu
    monkeypatch.setattr(jp.common, "ask", lambda *a, **k: _verdict_json("pass", 4))
    items = [_item(1), _item(2)]
    answers = ["odp1", "odp2"]
    sp = str(tmp_path / "sub" / "judge_x_s42.stream.jsonl")  # mkdir parent też testujemy
    res = jp.panel_score(_panel(), items, answers, workers=2, stream_path=sp)

    assert os.path.exists(sp)
    rows = [json.loads(l) for l in open(sp, encoding="utf-8") if l.strip()]
    assert len(rows) == 3 * 2, "po jednej linii na (sędzia × item)"
    for r in rows:
        assert set(r) == {"id", "judge", "werdykt", "naturalnosc", "powod"}
        assert r["werdykt"] == "pass"
    # każdy item oceniony przez każdego z 3 sędziów
    from collections import Counter
    by_judge = Counter(r["judge"] for r in rows)
    assert by_judge == Counter({"J1": 2, "J2": 2, "J3": 2})
    # stream nie zmienia kontraktu zwrotu
    assert len(res["items"]) == 2


def test_panel_stream_path_default_none_backward_compat(monkeypatch, tmp_path):
    # brak stream_path -> żaden plik nie powstaje, zachowanie wsteczne
    monkeypatch.setattr(jp.common, "ask", lambda *a, **k: _verdict_json("pass", 4))
    before = set(os.listdir(tmp_path))
    res = jp.panel_score(_panel(), [_item(1)], ["odp"], workers=1)
    assert set(os.listdir(tmp_path)) == before
    assert res["items"][0]["panel_werdykt"] == "pass"


def test_majority_vote_and_mean_naturalnosc(monkeypatch):
    # J1=pass(5) J2=pass(3) J3=fail(1) -> większość pass; nat = (5+3+1)/3
    by_tag = {"t1": _verdict_json("pass", 5), "t2": _verdict_json("pass", 3),
              "t3": _verdict_json("fail", 1)}
    monkeypatch.setattr(jp.common, "ask",
                        lambda backend, tag, temp, prompt, **k: by_tag[tag])
    res = jp.panel_score(_panel(), [_item(1)], ["odp"], workers=1)
    per = res["items"][0]
    assert per["panel_werdykt"] == "pass"
    assert abs(per["mean_naturalnosc"] - 3.0) < 1e-9
    # mapowanie werdyktu panelu na skalę 1/0.5/0
    assert per["panel_score"] == 1.0


def test_majority_tie_breaks_to_mixed(monkeypatch):
    # pass vs fail po jednym (trzeci nieparsowalny) -> remis -> mixed (zachowawczo)
    by_tag = {"t1": _verdict_json("pass", 5), "t2": _verdict_json("fail", 1),
              "t3": "śmieci"}
    monkeypatch.setattr(jp.common, "ask",
                        lambda backend, tag, temp, prompt, **k: by_tag[tag])
    res = jp.panel_score(_panel(), [_item(1)], ["odp"], workers=1)
    per = res["items"][0]
    assert per["panel_werdykt"] == "mixed"
    assert per["panel_score"] == 0.5


def test_verdict_score_mapping(monkeypatch):
    assert jp.WER["pass"] == 1.0
    assert jp.WER["mixed"] == 0.5
    assert jp.WER["fail"] == 0.0


def test_dataset_level_means(monkeypatch):
    # 2 itemy: item0 wszyscy pass(4); item1 wszyscy fail(2)
    def ask(backend, tag, temp, prompt, **k):
        # rozpoznaj item po treści odpowiedzi zaszytej w promptcie
        if "ITEM1" in prompt:
            return _verdict_json("fail", 2)
        return _verdict_json("pass", 4)

    monkeypatch.setattr(jp.common, "ask", ask)
    items = [_item(1), _item(2)]
    answers = ["odp ITEM0", "odp ITEM1"]
    res = jp.panel_score(_panel(), items, answers, workers=1)
    agg = res["aggregate"]
    # mean panel_score = (1.0 + 0.0)/2 = 0.5 -> 50.0 (skala 0-100)
    assert abs(agg["panel_score_mean"] - 50.0) < 1e-9
    # mean naturalnosc = (4 + 2)/2 = 3.0
    assert abs(agg["naturalnosc_mean"] - 3.0) < 1e-9


def test_aggregate_counts_n_empty(monkeypatch):
    # puste odpowiedzi (artefakt harnessu) -> fail w Layer B, ale liczone osobno
    # jako n_empty (Layer A dropuje je jako too_short -> asymetria audytowalna)
    monkeypatch.setattr(jp.common, "ask", lambda *a, **k: _verdict_json("pass", 4))
    items = [_item(1), _item(2), _item(3)]
    answers = ["niepusta odpowiedź", "", "   "]  # 2 puste (pusta + same spacje)
    res = jp.panel_score(_panel(), items, answers, workers=1)
    assert res["aggregate"]["n_empty"] == 2


# ============================================================================
# IJA — Krippendorff's alpha (nominal) na znanych macierzach
# ============================================================================
def test_alpha_perfect_agreement():
    # 3 sędziów, 4 itemy, wszyscy identycznie -> alpha == 1.0
    labels = [
        ["pass", "fail", "mixed", "pass"],
        ["pass", "fail", "mixed", "pass"],
        ["pass", "fail", "mixed", "pass"],
    ]
    a = jp.krippendorff_alpha(labels)
    assert abs(a - 1.0) < 1e-9


def test_alpha_total_disagreement_is_negative():
    # systematyczny brak zgody na każdym itemie -> alpha < 0 (gorzej niż losowo)
    labels = [
        ["pass", "pass", "pass", "pass"],
        ["fail", "fail", "fail", "fail"],
    ]
    a = jp.krippendorff_alpha(labels)
    assert a < 0.0


def test_alpha_no_disagreement_within_items_constant():
    # jeden item, pełna zgoda -> brak wariancji wewnątrz -> alpha == 1.0
    labels = [["pass"], ["pass"], ["pass"]]
    assert abs(jp.krippendorff_alpha(labels) - 1.0) < 1e-9


def test_alpha_partial_between_zero_and_one():
    # częściowa zgoda -> 0 < alpha < 1
    labels = [
        ["pass", "pass", "fail", "mixed"],
        ["pass", "mixed", "fail", "mixed"],
        ["pass", "pass", "fail", "fail"],
    ]
    a = jp.krippendorff_alpha(labels)
    assert 0.0 < a < 1.0


def test_alpha_handles_missing_labels():
    # None (sędzia nie sparsował) jest pomijany — nie wywala metryki
    labels = [
        ["pass", "fail", None],
        ["pass", "fail", "mixed"],
        ["pass", None, "mixed"],
    ]
    a = jp.krippendorff_alpha(labels)
    assert -1.0 <= a <= 1.0


def test_panel_reports_ija(monkeypatch):
    # wszyscy zgodni -> agregat zawiera IJA bliskie 1
    monkeypatch.setattr(jp.common, "ask", lambda *a, **k: _verdict_json("pass", 5))
    res = jp.panel_score(_panel(), [_item(1), _item(2)], ["a", "b"], workers=1)
    assert "ija_alpha" in res["aggregate"]
    assert abs(res["aggregate"]["ija_alpha"] - 1.0) < 1e-9


# ============================================================================
# panel WYSYŁANY: pojedynczy DeepSeek-V4-Pro, guided (walidowany vs human gold)
# ============================================================================
def test_shipped_panel_is_single_deepseek():
    working = [m for m in jp.PANEL if "__PLACEHOLDER" not in m[2]]
    assert len(working) == 1, "wysyłany panel to JEDEN sędzia (DeepSeek-V4-Pro)"
    name, backend, tag = working[0]
    assert backend == "openrouter"
    assert "deepseek" in tag.lower(), f"wysyłany sędzia to DeepSeek: {tag}"
    for name, backend, tag in jp.PANEL:
        low = (name + tag).lower()
        assert "qwen" not in low, f"sędzia nie może być z rodziny Qwen: {name}"
        assert "gemma" not in low, f"Gemma jest podmiotem, nie sędzią: {name}"
        assert "bielik" not in low, f"Bielik jest podmiotem: {name}"


def test_panel_skips_synthetic_placeholder(monkeypatch):
    # PLLuM usunięty z domyślnego panelu, ale skip placeholdera musi zostać pokryty:
    # syntetyczny placeholderowy sędzia (nie z domyślnego PANEL) jest pomijany.
    from bench.plgen import common
    assert common.is_placeholder("vendor/pllum__PLACEHOLDER")
    monkeypatch.setattr(jp.common, "ask", lambda *a, **k: _verdict_json("pass", 4))
    panel = _panel() + [("PLLuM", "openrouter", "vendor/pllum__PLACEHOLDER")]
    res = jp.panel_score(panel, [_item(1)], ["odp"], workers=1)
    # placeholderowy sędzia odsiany -> tylko 3 realni w wyniku
    assert res["judges"] == ["J1", "J2", "J3"]
    assert "PLLuM" not in res["judges"]
