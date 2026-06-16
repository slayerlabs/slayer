"""A5 — testy CLI anotacji human-gold (bench/plgen/anno_cli.py). BEZ sieci.

Uruchom z katalogu repo:  uv run pytest bench/plgen/tests/test_anno_cli.py -q

Strategia: zbuduj fałszywe generacje w tmp RUNS, monkeypatch common.GOLD/RUNS/DATA
na tmp, scenariuszowy input() -> sprawdź kształt gold, etykiety, wznowienie,
ślepotę, stratyfikację i export. NIC nie pisze do prawdziwego slayer-data.
"""
import json
import os

import pytest

from bench.plgen import anno_cli, common

HERE = os.path.dirname(__file__)
DEV = os.path.join(HERE, "..", "testdata", "dev_prompts.jsonl")
MODEL_NAMES = ("bielik", "qwen35_instruct", "gemma4")


def _write_runs(runs_dir, prompts, models=MODEL_NAMES, seeds=(42, 43)):
    """Zbuduj fałszywe pliki generacji gen_{model}_s{seed}.jsonl (kształt A2)."""
    os.makedirs(runs_dir, exist_ok=True)
    for model in models:
        for seed in seeds:
            path = os.path.join(runs_dir, f"gen_{model}_s{seed}.jsonl")
            with open(path, "w", encoding="utf-8") as f:
                for p in prompts:
                    # treść neutralna — koduje (model,seed) BEZ nazwy modelu,
                    # by test ślepoty był prawdziwy (prawdziwe odpowiedzi nie
                    # zawierają nazwy modelu); identyfikujemy item po znaczniku.
                    mi = MODEL_NAMES.index(model)
                    ans = f"Wzorcowa wypowiedz [m{mi}|s{seed}|{p['id']}] po polsku."
                    f.write(json.dumps(
                        {"id": p["id"], "domena": p["domena"], "model": model,
                         "seed": seed, "ans": ans,
                         "n_tokens": common.count_tokens(ans),
                         "len_target": p["len_target"]}, ensure_ascii=False) + "\n")


@pytest.fixture
def env(tmp_path, monkeypatch):
    """tmp GOLD/RUNS/DATA + zbudowa generacji. Zwraca obiekt z polami ścieżek."""
    runs = tmp_path / "runs"
    gold = tmp_path / "gold_v1.jsonl"
    monkeypatch.setattr(common, "RUNS", str(runs))
    monkeypatch.setattr(common, "GOLD", str(gold))
    monkeypatch.setattr(common, "DATA", DEV)
    # OFFLINE: domyślnie udawaj brak Stanza (nie ładuj ciężkiego torch/modelu).
    # Testy potrzebujące Stanza nadpisują to własnym stubem.
    monkeypatch.setattr(anno_cli, "ensure_stanza",
                        lambda: (_ for _ in ()).throw(RuntimeError("offline: stanza off")))
    prompts = common.load_prompts(DEV)
    _write_runs(str(runs), prompts)

    class E:
        pass
    e = E()
    e.runs, e.gold, e.prompts = str(runs), str(gold), prompts
    e.mp = anno_cli.map_path(str(gold))
    return e


def _scripted(answers):
    """Zwraca funkcję input() podającą kolejno elementy z `answers`."""
    it = iter(answers)

    def fake_input(_prompt=""):
        return next(it)
    return fake_input


# --- sampling ---------------------------------------------------------------
def test_sample_count(env):
    rows = anno_cli.load_runs()
    out = anno_cli.sample(rows, 12, seed=1)
    assert len(out) == 12


def test_sample_stratified_proportions(env):
    rows = anno_cli.load_runs()
    # liczność per domena w pełnym zbiorze
    from collections import Counter
    full = Counter(r["domena"] for r in rows)
    n = 12
    out = anno_cli.sample(rows, n, stratify="domena", seed=3)
    assert len(out) == n
    got = Counter(r["domena"] for r in out)
    # każda domena obecna proporcjonalnie (± largest-remainder zaokrąglenie)
    for dom, cnt in full.items():
        expected = n * cnt / len(rows)
        assert abs(got[dom] - expected) <= 1, (dom, got[dom], expected)


def test_sample_n_ge_total_returns_all(env):
    rows = anno_cli.load_runs()
    out = anno_cli.sample(rows, 10_000, seed=1)
    assert len(out) == len(rows)


# --- blindness --------------------------------------------------------------
def test_render_item_is_blind(env):
    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 5, seed=7)
    pmap = {p["id"]: p for p in env.prompts}
    for i, r in enumerate(chosen):
        view = anno_cli.render_item(pmap[r["id"]], r["ans"], i, len(chosen))
        # NIE może ujawnić tożsamości modelu ani klucza
        for name in MODEL_NAMES:
            assert name not in view, f"render ujawnia model '{name}': {view!r}"
    # mapowanie (prywatny side-file) trzyma model — ale to nie widok anotatora
    anno_cli.write_mapping(chosen, env.mp)
    mapping = anno_cli.read_mapping(env.mp)
    assert all("model" in m for m in mapping)


def test_mapping_in_separate_private_file(env):
    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 4, seed=2)
    anno_cli.write_mapping(chosen, env.mp)
    assert os.path.exists(env.mp)
    assert env.mp != env.gold
    # plik gold jeszcze nie istnieje / nie zawiera tożsamości modelu w widoku sesji
    assert not os.path.exists(env.gold)


# --- annotacja: kształt gold + etykiety ------------------------------------
def test_annotate_writes_shaped_gold(env):
    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 3, seed=5)
    anno_cli.write_mapping(chosen, env.mp)

    # 3 itemy: (4, pass), skip-na-naturalnosci, (2, fail, z notką)
    script = [
        "4", "pass", "",          # item 1
        "s",                        # item 2: skip na naturalnosci
        "2", "fail", "kalka jezykowa",  # item 3
    ]
    written = anno_cli.annotate("kuba", inp=_scripted(script), out=lambda *a, **k: None)
    assert written == 2

    gold = anno_cli.read_gold(env.gold)
    assert len(gold) == 2
    for g in gold:
        assert set(g) == set(anno_cli.GOLD_KEYS)
        assert g["annotator"] == "kuba"
        assert g["werdykt"] in anno_cli.WERDYKTY
        assert 1 <= g["naturalnosc"] <= 5
    by_wer = {g["werdykt"]: g for g in gold}
    assert by_wer["pass"]["naturalnosc"] == 4
    assert by_wer["fail"]["naturalnosc"] == 2
    assert by_wer["fail"]["note"] == "kalka jezykowa"


def test_annotate_stores_exact_ans_and_sha(env):
    """Gold SAMOWYSTARCZALNY: rekord niesie DOKŁADNY tekst odpowiedzi + jego sha."""
    import hashlib

    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 1, seed=5)
    anno_cli.write_mapping(chosen, env.mp)
    m = anno_cli.read_mapping(env.mp)[0]
    # dokładny tekst pokazany anotatorowi (z pliku gen, po (id,model,seed))
    expected_ans = {(r["id"], r["model"], r["seed"]): r["ans"]
                    for r in rows}[(m["id"], m["model"], m["seed"])]

    written = anno_cli.annotate("kuba", inp=_scripted(["4", "pass", ""]),
                                out=lambda *a, **k: None)
    assert written == 1
    g = anno_cli.read_gold(env.gold)[0]
    assert g["ans"] == expected_ans
    assert g["ans_sha"] == hashlib.sha256(expected_ans.encode("utf-8")).hexdigest()[:12]


def test_audit_la_stores_exact_ans_and_sha(env, audit_path, monkeypatch):
    """Rekord audytu Warstwy A też niesie dokładny tekst + sha."""
    import hashlib

    monkeypatch.setattr(anno_cli.grammar_check, "ensure_lt", lambda *a, **k: None)
    monkeypatch.setattr(anno_cli, "ensure_stanza", lambda: (lambda t: []))
    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 1, seed=5)
    anno_cli.write_mapping(chosen, env.mp)
    m = anno_cli.read_mapping(env.mp)[0]
    expected_ans = {(r["id"], r["model"], r["seed"]): r["ans"]
                    for r in rows}[(m["id"], m["model"], m["seed"])]

    written = anno_cli.audit_layer_a("kuba", inp=_scripted(["0", "0"]),
                                     out=lambda *a, **k: None)
    assert written == 1
    rec = anno_cli.read_audit()[0]
    assert rec["ans"] == expected_ans
    assert rec["ans_sha"] == hashlib.sha256(expected_ans.encode("utf-8")).hexdigest()[:12]


def test_invalid_input_reprompts(env):
    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 1, seed=5)
    anno_cli.write_mapping(chosen, env.mp)
    # śmieci -> ponowne pytanie, potem poprawne
    script = ["9", "x", "3", "blah", "mixed", "notka"]
    written = anno_cli.annotate("a", inp=_scripted(script), out=lambda *a, **k: None)
    assert written == 1
    g = anno_cli.read_gold(env.gold)[0]
    assert g["naturalnosc"] == 3 and g["werdykt"] == "mixed"


# --- wznowienie -------------------------------------------------------------
def test_resume_skips_annotated(env):
    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 3, seed=9)
    anno_cli.write_mapping(chosen, env.mp)

    # pierwszy przebieg: zanotuj 2 z 3, ostatni skip
    s1 = ["5", "pass", "", "5", "pass", "", "s"]
    w1 = anno_cli.annotate("a", inp=_scripted(s1), out=lambda *a, **k: None)
    assert w1 == 2

    # drugi przebieg: zostaje 1 nieoceniony (ten ze skipa) -> tylko on do zrobienia
    s2 = ["1", "fail", ""]
    w2 = anno_cli.annotate("a", inp=_scripted(s2), out=lambda *a, **k: None)
    assert w2 == 1
    assert len(anno_cli.read_gold(env.gold)) == 3

    # trzeci przebieg: nic do roboty
    w3 = anno_cli.annotate("a", inp=_scripted([]), out=lambda *a, **k: None)
    assert w3 == 0


# --- export -----------------------------------------------------------------
def test_export_joins_back_model_seed(env, tmp_path):
    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 2, seed=11)
    anno_cli.write_mapping(chosen, env.mp)
    anno_cli.annotate("kuba", inp=_scripted(["4", "pass", "", "3", "mixed", ""]),
                      out=lambda *a, **k: None)

    out_path = str(tmp_path / "export.jsonl")
    joined = anno_cli.export(out_path=out_path)
    assert len(joined) == 2
    mapping = anno_cli.read_mapping(env.mp)
    valid = {(m["id"], m["model"], m["seed"]): m["anno_id"] for m in mapping}
    for j in joined:
        key = (j["id"], j["model"], j["seed"])
        assert key in valid, "export nie łączy się z mapowaniem"
        assert j["anno_id"] == valid[key]
        assert j["model"] in MODEL_NAMES and j["seed"] in (42, 43)
    # zapisany plik istnieje i parsuje
    assert len(open(out_path, encoding="utf-8").readlines()) == 2


# --- main(): sampling przy braku mapowania, wznowienie przy istniejącym -----
def test_main_samples_then_resumes(env, monkeypatch):
    # 1. brak mapowania -> sampling + anotacja (1 item)
    monkeypatch.setattr(anno_cli, "input", _scripted(["4", "pass", ""]), raising=False)
    anno_cli.main(["--n", "1", "--annotator", "kuba"])
    assert os.path.exists(env.mp)
    assert len(anno_cli.read_gold(env.gold)) == 1

    # 2. ponowny main: mapowanie istnieje -> wznowienie, nic nowego
    anno_cli.main(["--annotator", "kuba"])
    assert len(anno_cli.read_gold(env.gold)) == 1


# --- LanguageTool inline marking (OFFLINE: matche syntetyczne) --------------
def _m(offset, length, rid="X", cat="GRAMMAR", msg="błąd"):
    """Zbuduj syntetyczny match LT (kształt grammar_check.check())."""
    return {"offset": offset, "length": length, "message": msg,
            "rule": {"id": rid, "category": {"id": cat}}}


def test_mark_issues_single_span():
    ans = "Idę z mamą do sklep."
    # zaznacz 'sklep' (offset 14, len 5)
    marked, issues = anno_cli.mark_issues(ans, [_m(14, 5, rid="PREP_CASUS", cat="SYNTAX",
                                                   msg="zły przypadek")])
    assert "«sklep»" in marked
    # oryginalny tekst poza spanem nietknięty
    assert marked.startswith("Idę z mamą do «sklep»")
    assert len(issues) == 1
    assert issues[0].startswith("1. [morphosyntax/PREP_CASUS] zły przypadek")


def test_mark_issues_two_non_overlapping():
    ans = "abc def ghi"  # offsety: abc=0..3, def=4..7, ghi=8..11
    marked, issues = anno_cli.mark_issues(ans, [_m(0, 3, rid="R1"), _m(8, 3, rid="R2")])
    assert marked == "«abc»¹ def «ghi»²"
    assert len(issues) == 2
    assert issues[0].startswith("1. [") and "R1" in issues[0]
    assert issues[1].startswith("2. [") and "R2" in issues[1]


def test_mark_issues_out_of_order_and_adjacent():
    ans = "abcdef"
    # podane w ZŁEJ kolejności + przylegające: 'cd' (2..4) i 'ab' (0..2)
    marked, issues = anno_cli.mark_issues(ans, [_m(2, 2, rid="SECOND"), _m(0, 2, rid="FIRST")])
    # numeracja wg kolejności tekstowej: ab=1, cd=2
    assert marked == "«ab»¹«cd»²ef"
    assert "FIRST" in issues[0] and issues[0].startswith("1.")
    assert "SECOND" in issues[1] and issues[1].startswith("2.")


def test_mark_issues_overlap_skipped():
    ans = "abcdef"
    # nakładające się: 0..4 i 2..6 -> bierzemy outer (0..4), drugi pominięty
    marked, issues = anno_cli.mark_issues(ans, [_m(0, 4, rid="OUTER"), _m(2, 4, rid="INNER")])
    assert marked == "«abcd»¹ef"
    assert len(issues) == 1 and "OUTER" in issues[0]


def test_mark_issues_no_matches():
    marked, issues = anno_cli.mark_issues("czysty tekst", [])
    assert marked == "czysty tekst"
    assert issues == []


def test_lt_section_unavailable_returns_notice():
    sec = anno_cli.lt_section("jakiś tekst", None)
    assert "pominięto" in sec
    # brak markerów, bo LT niedostępny
    assert "«" not in sec


def test_render_item_lt_block_is_blind(env):
    pi = env.prompts[0]
    lt = anno_cli.lt_section("Wzorcowa wypowiedz po polsku.", None)
    view = anno_cli.render_item(pi, "Wzorcowa wypowiedz po polsku.", 0, 1, lt=lt)
    for name in MODEL_NAMES:
        assert name not in view
    # oryginalna ODPOWIEDŹ nadal widoczna obok sekcji LT
    assert "ODPOWIEDŹ:" in view
    assert "LT:" in view


def test_annotate_degrades_when_lt_unavailable(env, monkeypatch):
    """ensure_lt/check rzucają -> anotacja działa, gold zapisany, bez crasha."""
    def boom(*a, **k):
        raise RuntimeError("docker down")
    monkeypatch.setattr(anno_cli.grammar_check, "ensure_lt", boom)
    monkeypatch.setattr(anno_cli.grammar_check, "check", boom)

    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 1, seed=5)
    anno_cli.write_mapping(chosen, env.mp)
    msgs = []
    written = anno_cli.annotate("a", inp=_scripted(["4", "pass", ""]),
                                out=lambda *a, **k: msgs.append(" ".join(str(x) for x in a)))
    assert written == 1
    g = anno_cli.read_gold(env.gold)[0]
    # schemat gold NIEzmieniony — żadnych pól LT w rekordzie
    assert set(g) == set(anno_cli.GOLD_KEYS)
    # poinformowano o niedostępności LT
    assert any("niedostępny" in m for m in msgs)


def test_annotate_shows_lt_when_available(env, monkeypatch):
    """Stub ensure_lt/check (BEZ sieci): sekcja LT pojawia się w widoku itemu."""
    monkeypatch.setattr(anno_cli.grammar_check, "ensure_lt", lambda *a, **k: "http://stub")
    # zwróć jeden syntetyczny match na słowie 'Wzorcowa' (offset 0, len 8)
    monkeypatch.setattr(anno_cli.grammar_check, "check",
                        lambda text, base: [_m(0, 8, rid="STUB_RULE", msg="testowy błąd")])
    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 1, seed=5)
    anno_cli.write_mapping(chosen, env.mp)
    views = []
    anno_cli.annotate("a", inp=_scripted(["4", "pass", ""]),
                      out=lambda *a, **k: views.append(" ".join(str(x) for x in a)))
    blob = "\n".join(views)
    assert "TRAFIENIA LT:" in blob
    assert "STUB_RULE" in blob
    assert "«Wzorcowa»" in blob


# --- Stanza inline marking (OFFLINE: znaleziska syntetyczne) ----------------
def test_stanza_section_marks_contiguous_fragment():
    ans = "Mam ten książkę na stole."
    marked, issues = anno_cli.stanza_section(
        ans, [("zgoda-przym-rzecz-rodzaj", "ten książkę")])
    assert "⟦ten książkę⟧" in marked
    assert marked.startswith("Mam ⟦ten książkę⟧")
    # marker Stanza ODMIENNY od LT
    assert "«" not in marked
    assert len(issues) == 1
    assert issues[0] == "[Stanza/zgoda-przym-rzecz-rodzaj] ten książkę"


def test_stanza_section_noncontiguous_only_listed():
    ans = "Jan napisał list i wysłać go."
    marked, issues = anno_cli.stanza_section(
        ans, [("aspekt-czas-przeszly", "Jan…wysłać")])
    # niecięgły fragment (z '…') -> brak markera, tekst nietknięty
    assert marked == ans
    assert "⟦" not in marked
    assert issues == ["[Stanza/aspekt-czas-przeszly] Jan…wysłać"]


def test_stanza_section_missing_fragment_does_not_crash():
    ans = "Zupełnie inny tekst."
    marked, issues = anno_cli.stanza_section(
        ans, [("toponim", "do Tychy")])  # nie występuje dosłownie
    assert marked == ans  # nic nie zaznaczono, brak wyjątku
    assert issues == ["[Stanza/toponim] do Tychy"]


def test_stanza_section_no_findings():
    marked, issues = anno_cli.stanza_section("czysty tekst", [])
    assert marked == "czysty tekst"
    assert issues == []


def test_layer_a_section_combines_lt_and_stanza():
    ans = "Mam ten książkę."
    sec, n_lt, n_st = anno_cli.layer_a_section(
        ans, None, lambda t: [("zgoda-przym-rzecz-rodzaj", "ten książkę")])
    assert "WARSTWA A (LT + Stanza)" in sec
    assert "pominięto" in sec  # LT niedostępny
    assert "⟦ten książkę⟧" in sec
    assert n_lt == 0 and n_st == 1


# --- audyt Warstwy A (--audit-la) -------------------------------------------
@pytest.fixture
def audit_path(tmp_path, monkeypatch):
    p = str(tmp_path / "layer_a_audit.jsonl")
    monkeypatch.setattr(anno_cli, "LAYER_A_AUDIT", p)
    return p


def test_audit_la_writes_shaped_record(env, audit_path, monkeypatch):
    """FP/FN zebrane, la_flagged auto-policzone, rekord w OSOBNYM pliku."""
    # LT/Stanza dostępne (stubbowane offline)
    monkeypatch.setattr(anno_cli.grammar_check, "ensure_lt", lambda *a, **k: "http://stub")
    monkeypatch.setattr(anno_cli.grammar_check, "check",
                        lambda text, base: [_m(0, 8, rid="R")])  # 1 flaga LT
    monkeypatch.setattr(anno_cli, "ensure_stanza",
                        lambda: (lambda t: [("zgoda-przym-rzecz-rodzaj", "x")]))  # 1 Stanza

    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 1, seed=5)
    anno_cli.write_mapping(chosen, env.mp)
    # FP=1, FN=2
    written = anno_cli.audit_layer_a("kuba", inp=_scripted(["1", "2"]),
                                     out=lambda *a, **k: None)
    assert written == 1
    audit = anno_cli.read_audit()
    assert len(audit) == 1
    rec = audit[0]
    assert set(rec) == set(anno_cli.AUDIT_KEYS)
    assert rec["la_flagged"] == 2  # 1 LT + 1 Stanza
    assert rec["la_fp"] == 1 and rec["la_fn"] == 2
    assert rec["annotator"] == "kuba"
    # gold werdyktów NIE dotknięty
    assert not os.path.exists(env.gold)


def test_audit_la_enter_is_zero_and_skip(env, audit_path, monkeypatch):
    monkeypatch.setattr(anno_cli.grammar_check, "ensure_lt", lambda *a, **k: None)
    monkeypatch.setattr(anno_cli, "ensure_stanza", lambda: (lambda t: []))
    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 2, seed=5)
    anno_cli.write_mapping(chosen, env.mp)
    # item1: Enter/Enter (FP=0,FN=0); item2: skip na FP
    written = anno_cli.audit_layer_a("a", inp=_scripted(["", "", "s"]),
                                     out=lambda *a, **k: None)
    assert written == 1
    rec = anno_cli.read_audit()[0]
    assert rec["la_fp"] == 0 and rec["la_fn"] == 0 and rec["la_flagged"] == 0


def test_audit_la_resume_skips_audited(env, audit_path, monkeypatch):
    monkeypatch.setattr(anno_cli.grammar_check, "ensure_lt", lambda *a, **k: None)
    monkeypatch.setattr(anno_cli, "ensure_stanza", lambda: (lambda t: []))
    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 3, seed=9)
    anno_cli.write_mapping(chosen, env.mp)

    w1 = anno_cli.audit_layer_a("a", inp=_scripted(["0", "0", "1", "0", "s"]),
                                out=lambda *a, **k: None)
    assert w1 == 2  # 2 zapisane, 3. skip
    w2 = anno_cli.audit_layer_a("a", inp=_scripted(["0", "0"]),
                                out=lambda *a, **k: None)
    assert w2 == 1  # został 1 do zrobienia
    assert len(anno_cli.read_audit()) == 3
    w3 = anno_cli.audit_layer_a("a", inp=_scripted([]), out=lambda *a, **k: None)
    assert w3 == 0


def test_audit_la_graceful_when_layer_a_unavailable(env, audit_path, monkeypatch):
    """ensure_lt i ensure_stanza rzucają -> audyt działa, la_flagged=0, bez crasha."""
    def boom(*a, **k):
        raise RuntimeError("down")
    monkeypatch.setattr(anno_cli.grammar_check, "ensure_lt", boom)
    monkeypatch.setattr(anno_cli, "ensure_stanza", boom)

    rows = anno_cli.load_runs()
    chosen = anno_cli.sample(rows, 1, seed=5)
    anno_cli.write_mapping(chosen, env.mp)
    msgs = []
    written = anno_cli.audit_layer_a("a", inp=_scripted(["0", "0"]),
                                     out=lambda *a, **k: msgs.append(" ".join(str(x) for x in a)))
    assert written == 1
    rec = anno_cli.read_audit()[0]
    assert set(rec) == set(anno_cli.AUDIT_KEYS)
    assert rec["la_flagged"] == 0
    assert any("niedostępn" in m for m in msgs)


def test_gold_schema_self_contained():
    """Schemat gold: oryginalne pola + `ans`/`ans_sha` (gold samowystarczalny)."""
    assert anno_cli.GOLD_KEYS == ("id", "model", "seed", "naturalnosc",
                                  "werdykt", "note", "annotator", "ans", "ans_sha")


def test_audit_schema_self_contained():
    """Schemat audytu Warstwy A: oryginalne pola + `ans`/`ans_sha`."""
    assert anno_cli.AUDIT_KEYS == ("id", "model", "seed", "la_flagged", "la_fp",
                                   "la_fn", "annotator", "ans", "ans_sha")
