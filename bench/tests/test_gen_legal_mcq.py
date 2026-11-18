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


def test_place_answer_moves_correct_option() -> None:
    for target in range(3):
        opts, ans = g.place_answer(GOOD, target)
        assert ans == target and opts[target] == "Narodu," and len(opts) == 3


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
    assert ok["legal_basis"] == unit.cite and ok["checks"]["basal_conf"] == 0.95
    low = _pipe(Verdict("B", 0.5, ""), Verdict("TAK", None, ""), GOOD).process(unit)
    assert low["rejected"].startswith("basal")
    nie = _pipe(Verdict("B", 0.95, ""), Verdict("NIE", None, ""), GOOD).process(unit)
    assert nie["rejected"].startswith("qwen")
    bad_q = _pipe(Verdict("B", 0.95, ""), Verdict("TAK", None, ""),
                  {**GOOD, "cytat": "czegoś tu nie ma w przepisie"}).process(unit)
    assert bad_q["rejected"].startswith("quote")


def test_dedup_accepted_moves_near_duplicates() -> None:
    rec = {"id": "a", "question": GOOD["pytanie"], "options": GOOD["opcje"], "answer": "A"}
    with tempfile.TemporaryDirectory() as d:
        with open(os.path.join(d, "accepted.jsonl"), "w", encoding="utf-8") as f:
            for i in range(2):
                f.write(json.dumps({**rec, "id": f"u{i}"}, ensure_ascii=False) + "\n")
        assert g.dedup_accepted(d, 0.5) == (1, 1)
        stats = g.stats(d)
    assert "zaakceptowane: 1 (50.0%)" in stats and "| dup | 1 |" in stats


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
    print("OK")
