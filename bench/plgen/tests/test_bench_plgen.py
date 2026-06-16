"""A2 — testy generacji w bench/plgen/bench_plgen.py. BEZ sieci.

Uruchom z katalogu repo:  uv run pytest bench/plgen/tests/test_bench_plgen.py -q

Strategia: monkeypatch common.ask -> deterministyczny fake, generuj do tmp RUNS,
sprawdź kształt plików, idempotencję i pomijanie placeholdera. Opcjonalny live
smoke (ollama, qwen3.5:9b) jest osobno i skippowalny.
"""
import json
import os

import pytest

from bench.plgen import bench_plgen, common

HERE = os.path.dirname(__file__)
DEV = os.path.join(HERE, "..", "testdata", "dev_prompts.jsonl")


def _fake_ask(backend, tag, temp, prompt, num_predict=700, seed=None, num_ctx=None):
    # deterministyczny: koduje wejście, by dało się sprawdzić że trafia do pliku
    return f"ODP[{backend}|{tag}|s={seed}] {prompt[:20]}"


@pytest.fixture
def prompts():
    return common.load_prompts(DEV)


@pytest.fixture
def runs_dir(tmp_path, monkeypatch):
    d = tmp_path / "runs"
    monkeypatch.setattr(bench_plgen.common, "RUNS", str(d))
    return str(d)


def test_generate_writes_shaped_files(prompts, runs_dir, monkeypatch):
    monkeypatch.setattr(bench_plgen.common, "ask", _fake_ask)
    models = {"bielik": ("ollama", "some-tag", 0.2)}
    bench_plgen.generate(models, prompts, seeds=[42, 43], workers=2)

    for seed in (42, 43):
        f = os.path.join(runs_dir, f"gen_bielik_s{seed}.jsonl")
        assert os.path.exists(f), f"brak pliku {f}"
        rows = [json.loads(l) for l in open(f, encoding="utf-8")]
        assert len(rows) == len(prompts)
        for it, row in zip(prompts, rows):
            assert row["id"] == it["id"]
            assert row["domena"] == it["domena"]
            assert row["model"] == "bielik"
            assert row["seed"] == seed
            assert row["len_target"] == it["len_target"]
            assert row["ans"] == _fake_ask("ollama", "some-tag", 0.2, it["prompt"], seed=seed)
            assert row["n_tokens"] == common.count_tokens(row["ans"])


def test_idempotent_skips_existing(prompts, runs_dir, monkeypatch):
    calls = {"n": 0}

    def counting_ask(*a, **k):
        calls["n"] += 1
        return _fake_ask(*a, **k)

    monkeypatch.setattr(bench_plgen.common, "ask", counting_ask)
    models = {"bielik": ("ollama", "some-tag", 0.2)}

    bench_plgen.generate(models, prompts, seeds=[42], workers=2)
    first = calls["n"]
    assert first == len(prompts)

    # drugi przebieg: plik istnieje -> 0 nowych wywołań
    bench_plgen.generate(models, prompts, seeds=[42], workers=2)
    assert calls["n"] == first, "powtórny generate nie pominął istniejącego (model,seed)"


def test_placeholder_model_skipped(prompts, runs_dir, monkeypatch, capsys):
    # SYNTETYCZNY placeholder (nie klucz z MODELS) — ćwiczy is_placeholder/skip path.
    # Realne MODELS nie mają już placeholderów, ale skip musi zostać pokryty defensywnie.
    monkeypatch.setattr(bench_plgen.common, "ask", _fake_ask)
    models = {
        "synthetic_ph": ("openrouter", "vendor/model__PLACEHOLDER", 0.7),
        "qwen35_instruct": ("openrouter", "qwen/qwen3.5-27b", 0.7),
    }
    bench_plgen.generate(models, prompts, seeds=[42], workers=2)

    assert not os.path.exists(os.path.join(runs_dir, "gen_synthetic_ph_s42.jsonl"))
    assert os.path.exists(os.path.join(runs_dir, "gen_qwen35_instruct_s42.jsonl"))
    out = capsys.readouterr().out.lower()
    assert "placeholder" in out or "pomijam" in out or "skip" in out


def test_seed_passed_to_ask(prompts, runs_dir, monkeypatch):
    seen = []

    def spy_ask(backend, tag, temp, prompt, num_predict=700, seed=None, num_ctx=None):
        seen.append(seed)
        return _fake_ask(backend, tag, temp, prompt, num_predict, seed)

    monkeypatch.setattr(bench_plgen.common, "ask", spy_ask)
    bench_plgen.generate({"bielik": ("ollama", "t", 0.2)}, prompts[:1], seeds=[44], workers=1)
    assert seen == [44]


def test_select_per_domena_first_n(prompts):
    # dev fixture: rekcja x3, liczebniki x3, kalki x2, rejestr x2 (kolejność wymieszana)
    sel = bench_plgen.select_per_domena(prompts, 2)
    from collections import Counter
    cnt = Counter(p["domena"] for p in sel)
    assert cnt["rekcja"] == 2 and cnt["liczebniki"] == 2
    assert cnt["kalki"] == 2 and cnt["rejestr"] == 2
    # pierwsze 2 itemy KAŻDEJ domeny po pierwotnej kolejności
    ids = [p["id"] for p in sel]
    assert ids == ["dev_001", "dev_002", "dev_003", "dev_004",
                   "dev_005", "dev_006", "dev_007", "dev_008"]
    # N=1: dokładnie po jednym pierwszym z każdej domeny
    sel1 = bench_plgen.select_per_domena(prompts, 1)
    assert [p["id"] for p in sel1] == ["dev_001", "dev_003", "dev_005", "dev_007"]
    # zachowana stratyfikacja: wynik jest podzbiorem oryginalnej kolejności
    orig_idx = {p["id"]: i for i, p in enumerate(prompts)}
    sel_idx = [orig_idx[p["id"]] for p in sel]
    assert sel_idx == sorted(sel_idx)


def test_num_ctx_passed_to_ask_for_ollama(prompts, runs_dir, monkeypatch):
    seen = []

    def spy_ask(backend, tag, temp, prompt, num_predict=700, seed=None, num_ctx=None):
        seen.append({"backend": backend, "num_ctx": num_ctx, "num_predict": num_predict})
        return _fake_ask(backend, tag, temp, prompt, num_predict, seed, num_ctx)

    monkeypatch.setattr(bench_plgen.common, "ask", spy_ask)
    bench_plgen.generate({"bielik": ("ollama", "t", 0.2)}, prompts[:2], seeds=[42],
                         workers=1, num_ctx=2048, num_predict=400)
    assert seen, "ask nie zawołane"
    for s in seen:
        assert s["backend"] == "ollama"
        assert s["num_ctx"] == 2048
        assert s["num_predict"] == 400


def test_num_ctx_openrouter_branch_ignores(monkeypatch):
    # openrouter branch w common.ask nie wkłada num_ctx do body — sprawdź na http_json
    captured = {}

    def fake_http(url, body, headers, timeout=180, tries=3):
        captured["url"] = url
        captured["body"] = body
        return {"choices": [{"message": {"content": "ok"}}]}

    monkeypatch.setattr(common, "http_json", fake_http)
    monkeypatch.setattr(common, "_or_key", lambda: "k")
    out = common.ask("openrouter", "vendor/m", 0.7, "prompt", num_predict=400, num_ctx=2048)
    assert out == "ok"
    assert "openrouter.ai" in captured["url"]
    assert "num_ctx" not in captured["body"]
    assert "options" not in captured["body"]


def test_num_ctx_ollama_branch_sets_option(monkeypatch):
    captured = {}

    def fake_http(url, body, headers, timeout=180, tries=3):
        captured["body"] = body
        return {"message": {"content": "ok"}}

    monkeypatch.setattr(common, "http_json", fake_http)
    common.ask("ollama", "tag", 0.2, "prompt", num_predict=400, num_ctx=2048)
    assert captured["body"]["options"]["num_ctx"] == 2048
    # None -> brak num_ctx (zachowanie wsteczne)
    captured.clear()
    common.ask("ollama", "tag", 0.2, "prompt", num_predict=400)
    assert "num_ctx" not in captured["body"]["options"]


def test_diag_generation_stream(prompts, runs_dir, monkeypatch):
    monkeypatch.setattr(bench_plgen.common, "ask", _fake_ask)
    models = {"bielik": ("ollama", "some-tag", 0.2)}
    bench_plgen.generate(models, prompts, seeds=[42], workers=1, diag=True)

    canonical = os.path.join(runs_dir, "gen_bielik_s42.jsonl")
    stream = os.path.join(runs_dir, "gen_bielik_s42.stream.jsonl")
    assert os.path.exists(canonical), "kanoniczny atomowy gen plik musi istnieć"
    assert os.path.exists(stream), "diag stream plik musi powstać"

    canon_rows = [json.loads(l) for l in open(canonical, encoding="utf-8") if l.strip()]
    stream_rows = [json.loads(l) for l in open(stream, encoding="utf-8") if l.strip()]
    assert len(stream_rows) == len(prompts), "po jednej linii na ukończony item"
    assert len(canon_rows) == len(prompts)
    # ten sam kształt rekordu
    assert {r["id"] for r in stream_rows} == {r["id"] for r in canon_rows}
    for r in stream_rows:
        assert set(r) >= {"id", "domena", "model", "seed", "ans", "n_tokens", "len_target"}


def test_diag_off_no_stream(prompts, runs_dir, monkeypatch):
    monkeypatch.setattr(bench_plgen.common, "ask", _fake_ask)
    bench_plgen.generate({"bielik": ("ollama", "t", 0.2)}, prompts[:2], seeds=[42],
                         workers=1, diag=False)
    assert not os.path.exists(os.path.join(runs_dir, "gen_bielik_s42.stream.jsonl"))
    assert os.path.exists(os.path.join(runs_dir, "gen_bielik_s42.jsonl"))


# --- opcjonalny live smoke: ollama qwen3.5:9b, 1 prompt. Skippowalny. ---
@pytest.mark.skipif(
    os.environ.get("PLGEN_LIVE") != "1",
    reason="live smoke wyłączony (ustaw PLGEN_LIVE=1 by uruchomić; wymaga ollama + qwen3.5:9b)",
)
def test_live_ollama_smoke(tmp_path, monkeypatch, prompts):
    monkeypatch.setattr(bench_plgen.common, "RUNS", str(tmp_path / "runs"))
    models = {"qwen9b": ("ollama", "qwen3.5:9b", 0.7)}
    bench_plgen.generate(models, prompts[:1], seeds=[42], workers=1)
    f = tmp_path / "runs" / "gen_qwen9b_s42.jsonl"
    rows = [json.loads(l) for l in open(f, encoding="utf-8")]
    assert len(rows) == 1
    assert rows[0]["ans"].strip(), "live: pusta odpowiedź"
    assert rows[0]["n_tokens"] > 0
