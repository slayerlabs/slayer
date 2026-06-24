"""Tests for the LEK loader (`load_lek`) in bench/bench_mcq.py.

Offline by default: `load_lek` iterates `for r in ds`, so a list of dicts stands in for
the HF Dataset; we monkeypatch `datasets.load_dataset` to feed synthetic rows. The single
test that hits the real HuggingFace dataset is gated behind RUN_HF_TESTS=1.
"""
import os

import bench_mcq
import pytest

LEK_REPO = "amu-cai/medical-exams-LEK-PL-2008-2024"
FULL = "Pytanie testowe:\nA. opcja a\nB. opcja b\nC. opcja c\nD. opcja d\nE. opcja e"


def _row(answer, question=FULL, edition="2011_wiosna"):
    return {"answer": answer, "question_w_options": question, "edition": edition}


@pytest.fixture
def feed_rows(monkeypatch):
    """Install synthetic rows as the HF dataset that load_lek reads."""
    def _install(rows):
        def fake_load_dataset(*args, **kwargs):
            assert args[0] == LEK_REPO and kwargs.get("split") == "train"
            return rows
        monkeypatch.setattr("datasets.load_dataset", fake_load_dataset)
    return _install


def test_gold_letter_to_index_mapping(feed_rows):
    # edition encodes the expected letter so gold is checkable despite shuffling.
    feed_rows([_row(letter, edition=letter) for letter in "ABCDE"])
    items = bench_mcq.load_lek(0, 42)
    assert len(items) == 5
    assert all("ABCDE"[it["gold"]] == it["cat"] for it in items)


def test_letter_normalization(feed_rows):
    feed_rows([_row(" a ", edition="A"), _row("b", edition="B"), _row("C\n", edition="C")])
    items = bench_mcq.load_lek(0, 42)
    assert {it["cat"]: it["gold"] for it in items} == {"A": 0, "B": 1, "C": 2}


def test_drops_invalid_labels(feed_rows):
    feed_rows([_row("A"), _row("F"), _row("1"), _row(""), _row(None), _row("E")])
    items = bench_mcq.load_lek(0, 42)
    assert sorted(it["gold"] for it in items) == [0, 4]


def test_drops_multicharacter_labels(feed_rows):
    feed_rows([_row("A"), _row("AA"), _row("A."), _row("E ")])
    items = bench_mcq.load_lek(0, 42)
    assert sorted(it["gold"] for it in items) == [0, 4]


def test_drops_empty_questions(feed_rows):
    feed_rows([_row("A", question=""), _row("B", question=None), _row("C", question=FULL)])
    items = bench_mcq.load_lek(0, 42)
    assert len(items) == 1 and items[0]["gold"] == 2


def test_drops_whitespace_only_questions(feed_rows):
    feed_rows([_row("A", question=" \n\t "), _row("B", question=FULL)])
    items = bench_mcq.load_lek(0, 42)
    assert len(items) == 1
    assert items[0]["gold"] == 1


def test_missing_edition_uses_unknown_category(feed_rows):
    feed_rows([{"answer": "A", "question_w_options": FULL}])
    items = bench_mcq.load_lek(0, 42)
    assert len(items) == 1
    assert items[0]["cat"] == "?"


def test_item_contract(feed_rows):
    feed_rows([_row(letter) for letter in "ABCDE"])
    for it in bench_mcq.load_lek(0, 42):
        assert isinstance(it["q"], str) and it["q"].strip()
        assert it["options"] is None and it["noptions"] == 5
        assert isinstance(it["gold"], int) and 0 <= it["gold"] < 5
        assert isinstance(it["cat"], str) and it["cat"]


def test_sampling_respects_n(feed_rows):
    feed_rows([_row("A", edition=f"ed_{i % 5}") for i in range(200)])
    assert 0 < len(bench_mcq.load_lek(20, 42)) <= 20


def test_returns_full_set_when_n_zero(feed_rows):
    feed_rows([_row("A") for _ in range(37)])
    assert len(bench_mcq.load_lek(0, 42)) == 37


def test_returns_full_set_when_n_exceeds_available(feed_rows):
    feed_rows([_row("A") for _ in range(13)])
    assert len(bench_mcq.load_lek(50, 42)) == 13


def test_sampling_does_not_mutate_source_rows(feed_rows):
    rows = [_row("ABCDE"[i % 5], edition=f"ed_{i}") for i in range(50)]
    before = [dict(row) for row in rows]
    feed_rows(rows)
    bench_mcq.load_lek(0, 42)
    assert rows == before


def test_seed_is_deterministic(feed_rows):
    rows = [_row("ABCDE"[i % 5], edition=f"ed_{i % 7}") for i in range(300)]
    feed_rows(rows)
    a = bench_mcq.load_lek(25, 123)
    feed_rows(rows)
    b = bench_mcq.load_lek(25, 123)
    assert [(it["cat"], it["gold"]) for it in a] == [(it["cat"], it["gold"]) for it in b]


def test_registered_in_benches():
    assert bench_mcq.BENCHES["lek"] == (bench_mcq.load_lek, "pl")


@pytest.mark.skipif(not os.environ.get("RUN_HF_TESTS"),
                    reason="set RUN_HF_TESTS=1 to hit the HuggingFace Hub")
def test_live_lek_loads_full_set():
    items = bench_mcq.load_lek(0, 42)
    assert len(items) == 4312
    assert all(it["options"] is None and it["noptions"] == 5 for it in items)
    assert all(it["q"] and it["q"].strip() and 0 <= it["gold"] < 5 for it in items)
    counts = {g: 0 for g in range(5)}
    for it in items:
        counts[it["gold"]] += 1
    assert counts == {0: 773, 1: 847, 2: 918, 3: 896, 4: 878}
