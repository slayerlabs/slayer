"""Testy offline dla gen_legal_mcq (slayer#8). Bez sieci i bez kluczy API.

Uruchamialne przez `pytest` albo wprost: `python3 bench/tests/test_gen_legal_mcq.py`.
"""
import json
import os
import sys
import tempfile

BENCH_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BENCH_DIR not in sys.path:
    sys.path.insert(0, BENCH_DIR)

import gen_legal_mcq as g  # noqa: E402
from judge_calibration import Verdict  # noqa: E402

UNITS = [
    {"article": 3, "ust": None, "pkt": None, "cite": "art. 3 Konstytucji RP",
     "text": "Rzeczpospolita Polska jest państwem jednolitym."},
    {"article": 4, "ust": None, "pkt": None, "cite": "art. 4 Konstytucji RP",
     "text": "1. Władza zwierzchnia należy do Narodu.\n2. Naród sprawuje władzę bezpośrednio."},
    {"article": 4, "ust": 1, "pkt": None, "cite": "art. 4 ust. 1 Konstytucji RP",
     "text": "Władza zwierzchnia należy do Narodu."},
    {"article": 4, "ust": 2, "pkt": None, "cite": "art. 4 ust. 2 Konstytucji RP",
     "text": "Naród sprawuje władzę bezpośrednio."},
    {"article": 9, "ust": None, "pkt": None, "cite": "art. 9 Konstytucji RP",
     "text": "Rzeczpospolita Polska przestrzega wiążącego ją prawa międzynarodowego."},
]
GOOD = {"pytanie": "Zgodnie z Konstytucją Rzeczypospolitej Polskiej, władza zwierzchnia należy do:",
        "opcje": ["Narodu,", "Sejmu,", "Prezydenta."], "poprawna": 0,
        "cytat": "Władza zwierzchnia należy do Narodu"}


def _units_file(d: str) -> str:
    path = os.path.join(d, "units.jsonl")
    with open(path, "w", encoding="utf-8") as f:
        for u in UNITS:
            f.write(json.dumps({**u, "eli": "DU/1997/483", "state": "s"}, ensure_ascii=False)
                    + "\n")
    return path


def _unit(text: str = "Władza zwierzchnia należy do Narodu.") -> g.GenUnit:
    return g.GenUnit(id="art_4_ust_1", index=4, cite="art. 4 ust. 1 Konstytucji RP", text=text,
                     article_text="Art. 4.\n" + text, eli="DU/1997/483", state="s")


def test_generation_units_leaf_selection_and_exclusion() -> None:
    with tempfile.TemporaryDirectory() as d:
        cites = [u.cite for u in g.generation_units(_units_file(d), set())]
        assert cites == ["art. 3 Konstytucji RP", "art. 4 ust. 1 Konstytucji RP",
                         "art. 4 ust. 2 Konstytucji RP", "art. 9 Konstytucji RP"]
        units = g.generation_units(_units_file(d), {4})
    assert [u.cite for u in units] == ["art. 3 Konstytucji RP", "art. 9 Konstytucji RP"]
    assert units[0].article_text.startswith("Art. 3.\n")


def test_excluded_articles_only_from_given_year() -> None:
    rows = [{"year": 2026, "legal_basis": "art. 4 ust. 1 Konstytucji RP"},
            {"year": 2025, "legal_basis": "art. 9 Konstytucji RP"}]
    with tempfile.TemporaryDirectory() as d:
        assert g.excluded_articles(_units_file(d), rows, 2026) == {4}


def test_format_problem() -> None:
    assert g.format_problem(GOOD) is None
    assert g.format_problem(None) == "format: brak JSON"
    assert g.format_problem({**GOOD, "opcje": ["a,", "b."]}) == "format: opcje"
    assert g.format_problem({**GOOD, "opcje": ["Sejmu,", "sejmu.", "Senatu."]}) == \
        "format: powtórzone opcje"
    assert g.format_problem({**GOOD, "poprawna": 3}) == "format: poprawna"
    assert g.format_problem({**GOOD, "poprawna": True}) == "format: poprawna"
    assert g.format_problem({**GOOD, "opcje": ["Narodu,", "Sejmu,", "wszystkie powyższe."]}) == \
        "format: zakazana opcja"


def test_quote_must_be_verbatim() -> None:
    assert g.quote_ok(GOOD, _unit())
    assert g.quote_ok({**GOOD, "cytat": "„władza  zwierzchnia\nnależy do Narodu.”"}, _unit())
    assert not g.quote_ok({**GOOD, "cytat": "Władza należy do Sejmu"}, _unit())
    assert not g.quote_ok({**GOOD, "cytat": "Narodu"}, _unit())  # za krótki


def test_place_answer_moves_correct_option_and_fixes_punctuation() -> None:
    for target in range(3):
        opts, ans = g.place_answer(GOOD, target)
        assert ans == target and opts[target].rstrip(",.") == "Narodu" and len(opts) == 3
        assert [o[-1] for o in opts] == [",", ",", "."]


def test_exam_punctuation() -> None:
    assert g.exam_punctuation(["a.", "b", "c ,"]) == ["a,", "b,", "c."]
    assert g.exam_punctuation(["art. 103-107", "x;", "y"]) == ["art. 103-107,", "x,", "y."]


def test_similarity_index() -> None:
    idx = g.SimilarityIndex([g.mcq_text(GOOD["pytanie"], GOOD["opcje"])])
    same = g.mcq_text("Zgodnie z Konstytucją RP, władza zwierzchnia należy do:", GOOD["opcje"])
    assert idx.max_jaccard(same) == 1.0  # prefiks z Konstytucją jest ignorowany
    assert idx.max_jaccard("Kto powołuje Prezesa NBP na sześć lat") == 0.0


class _FakeJudge:
    def __init__(self, solve: Verdict, other: Verdict) -> None:
        self.solve, self.other = solve, other

    def ask(self, item: object, mode: str) -> Verdict:
        return self.solve if mode == "solve" else self.other


def _pipe(basal: Verdict, qwen: Verdict, raw: dict) -> g.Pipeline:
    pipe = g.Pipeline(g.Config(0.9, 0.5, "t"), g.SimilarityIndex([]),
                      _FakeJudge(basal, Verdict("A", 0.99, "")), _FakeJudge(qwen, qwen))
    g.ask_teacher = lambda unit, cfg: json.dumps(raw, ensure_ascii=False)
    return pipe


def test_pipeline_accepts_and_rejects() -> None:
    unit = _unit()  # index 4 -> poprawna na pozycji 4 % 3 = 1 (B)
    ok = _pipe(Verdict("B", 0.95, ""), Verdict("TAK", None, ""), GOOD).process(unit)
    assert "rejected" not in ok and ok["answer"] == "B" and ok["options"][1] == "Narodu,"
    assert ok["options"][2].endswith(".")
    assert ok["legal_basis"] == unit.cite and ok["checks"]["basal_conf"] == 0.95
    low = _pipe(Verdict("B", 0.5, ""), Verdict("TAK", None, ""), GOOD).process(unit)
    assert low["rejected"].startswith("basal")
    nie = _pipe(Verdict("B", 0.95, ""), Verdict("NIE", None, ""), GOOD).process(unit)
    assert nie["rejected"].startswith("qwen")
    bad_q = _pipe(Verdict("B", 0.95, ""), Verdict("TAK", None, ""),
                  {**GOOD, "cytat": "czegoś tu nie ma w przepisie"}).process(unit)
    assert bad_q["rejected"].startswith("quote")


class _FakeDistractor:
    def __init__(self, value: str | None) -> None:
        self.value, self.seen = value, []

    def ask(self, item: object) -> str | None:
        self.seen.append(item)
        return self.value


def test_distractor_filter_rejects_tak_and_empty_and_keeps_nie() -> None:
    unit = _unit()
    verdicts = (Verdict("B", 0.95, ""), Verdict("TAK", None, ""))
    for value, rejected in (("NIE", None), ("TAK", "distractor: druga prawdziwa opcja"),
                            (None, "distractor: brak odpowiedzi")):
        pipe = _pipe(*verdicts, GOOD)
        pipe.distractor = _FakeDistractor(value)
        rec = pipe.process(unit)
        assert rec.get("rejected") == rejected
        assert rec.get("checks", rec).get("distractor") == value
    assert rec["candidate"] == GOOD
    kept = _pipe(*verdicts, GOOD)
    kept.distractor = _FakeDistractor("NIE")
    assert kept.process(unit)["generator"]["distractor_check"] is True
    assert _pipe(*verdicts, GOOD).process(unit)["generator"]["distractor_check"] is False


def test_distractor_prompt_names_key_and_other_options() -> None:
    item = g.Item(id="x", source="gen", year=0, question="Pytanie:", options=("a,", "b,", "c."),
                  answer=1, context="Art. 4.\nTreść.")
    text = g.distractor_prompt(item)
    assert "Klucz: B." in text and "pozostałych opcji (A, C)" in text
    assert text.startswith("Przepis (cały artykuł):\nArt. 4.") and text.endswith("TAK albo NIE.")


def test_dedup_accepted_moves_near_duplicates() -> None:
    rec = {"id": "a", "question": GOOD["pytanie"], "options": GOOD["opcje"], "answer": "A",
           "answer_idx": 0}
    with tempfile.TemporaryDirectory() as d:
        with open(os.path.join(d, "accepted.jsonl"), "w", encoding="utf-8") as f:
            for i in range(2):
                f.write(json.dumps({**rec, "id": f"u{i}"}, ensure_ascii=False) + "\n")
        assert g.dedup_accepted(d, 0.5) == (1, 1)
        stats = g.stats(d)
    assert "zaakceptowane: 1 (50.0%)" in stats and "| dup | 1 |" in stats


def test_length_rank_is_balanced_and_independent_of_letter() -> None:
    pairs = {(i % 3, g.length_rank(i)) for i in range(9)}
    assert len(pairs) == 9  # każda litera z każdą docelową długością
    unit = g.GenUnit(**{**_unit().__dict__, "index": 6})
    assert "poprawna odpowiedź ma być najdłuższą" in g.teacher_prompt(unit)


def test_balance_length_drops_largest_advantage_first() -> None:
    def rec(i: int, correct: str) -> dict:
        return {"id": f"u{i}", "question": "q", "options": [correct + ",", "bbbb,", "cccc."],
                "answer": "A", "answer_idx": 0}
    recs = [rec(0, "a" * 12), rec(1, "a" * 6), rec(2, "a" * 5), rec(3, "aa"), rec(4, "aaa")]
    assert g.length_ratio(recs[0]) == 3.0 and g.length_ratio(recs[3]) == 0.5
    with tempfile.TemporaryDirectory() as d:
        with open(os.path.join(d, "accepted.jsonl"), "w", encoding="utf-8") as f:
            f.writelines(json.dumps(r) + "\n" for r in recs)
        assert g.balance_length(d, 1 / 3) == (3, 2)  # 3/5 najdłuższe -> 1/3
        kept = [r["id"] for r in g._read_jsonl(os.path.join(d, "accepted.jsonl"))]
        assert kept == ["u2", "u3", "u4"]
        assert g.balance_length(d, 1 / 3) == (3, 0)  # idempotentne
        assert "poprawna najdłuższą opcją: 1 (33.3%)" in g.stats(d)


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
    print("OK")
