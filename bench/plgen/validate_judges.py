#!/usr/bin/env python3
"""PL-GEN — walidacja sędziów vs złoto ludzkie (M4, diagnostyka).

Cel: na ZBIORZE GOLD (próbka z anno_cli) uruchom KAŻDEGO sędziego OSOBNO, połącz
z oceną człowieka i wynikami LanguageTool, i zapisz jeden bogaty plik analityczny
(per item: odpowiedź modelu, gold człowieka, werdykt każdego sędziego, LT) — żeby
porównać, gdzie sędziowie zgadzają się / rozjeżdżają z człowiekiem.

Sędziowie (KAŻDY OSOBNO; tryb --mode, domyślnie 'guided'):
  Llama-3.3-70B, Mistral-Large, Qwen3.5-122B (sędzia PolNative), DeepSeek-V4-Pro.
  UWAGA: Qwen-122B to rodzina Qwen, a Gemini/DeepSeek-pro bywają zamknięte/koszt —
  TO TEST DIAGNOSTYCZNY (jak gold), NIE wybór opublikowanego sędziego.

Wejście:
  - mapowanie gold:  anno_cli.map_path()  (id, model, seed, anno_id)  [40 itemów]
  - gold człowieka:  common.GOLD          (werdykt, naturalnosc, note) [tyle, ile zanotowano]
  - generacje:       common.RUNS/gen_*    (ans) — przez anno_cli.load_runs()
  - prompty:         common.DATA          (domena, rubryka, phenomena)
  - LT (opcjonalnie): common.RUNS/lt_scores.jsonl  (per100 buckets) — join JEŚLI istnieje

Wynik (gitignored, detal — NIE publiczny):
  - {RUNS}/validate/judge_{judge}.jsonl   — cache werdyktów per sędzia (re-run = za darmo)
  - {RUNS}/validate/analysis.jsonl        — bogaty plik per item (do analizy)
  - na stdout: tabela zgodności sędzia↔człowiek (na itemach z goldem).

Usage:
  python3 bench/plgen/validate_judges.py [--mode guided] [--workers 8] [--limit N]
"""
import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor

_REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

from bench.plgen import common, anno_cli, judge_panel  # noqa: E402

# sędziowie do testu (KAŻDY OSOBNO). Tagi potwierdzone GET /api/v1/models (2026-06-16).
JUDGES = [
    ("Llama-3.3-70B", "openrouter", "meta-llama/llama-3.3-70b-instruct"),
    ("Mistral-Large", "openrouter", "mistralai/mistral-large-2512"),
    ("Qwen3.5-122B", "openrouter", "qwen/qwen3.5-122b-a10b"),   # sędzia PolNative (rodzina Qwen!)
    ("DeepSeek-V4-Pro", "openrouter", "deepseek/deepseek-v4-pro"),
]

VAL_DIR = os.path.join(common.RUNS, "validate")
LT_SCORES = os.path.join(common.RUNS, "lt_scores.jsonl")
_SENT_FINAL = '.!?":)]»…'


def _truncated(ans):
    a = (ans or "").rstrip()
    return bool(a) and a[-1] not in _SENT_FINAL


def _safe(name):
    return re.sub(r"[^A-Za-z0-9_.-]", "_", name)


def _load_lt():
    """LT per100 per (id,model,seed) z lt_scores.jsonl — {} jeśli brak (join opcjonalny)."""
    out = {}
    if os.path.exists(LT_SCORES):
        for l in open(LT_SCORES, encoding="utf-8"):
            l = l.strip()
            if not l:
                continue
            r = json.loads(l)
            out[(r["id"], r["model"], r["seed"])] = r
    return out


def run_judge(judge, items_keys, items, answers, workers, mode):
    """Odpal jednego sędziego po itemach. Cache do judge_{name}.jsonl (idempotentnie)."""
    name = judge[0]
    cache = os.path.join(VAL_DIR, f"judge_{_safe(name)}.jsonl")
    done = {}
    if os.path.exists(cache):
        for l in open(cache, encoding="utf-8"):
            if l.strip():
                r = json.loads(l)
                done[(r["id"], r["model"], r["seed"])] = r
    todo = [k for k in items_keys if k not in done]
    print(f"[{name}] {len(done)} z cache, {len(todo)} do oceny (mode={mode})", flush=True)

    def one(k):
        it, ans = items[k], answers[k]
        w, nat, powod = judge_panel.judge_one(judge, it, ans, mode=mode)
        return {"id": k[0], "model": k[1], "seed": k[2],
                "werdykt": w, "naturalnosc": nat, "powod": powod}

    if todo:
        os.makedirs(VAL_DIR, exist_ok=True)
        with open(cache, "a", encoding="utf-8") as f, \
                ThreadPoolExecutor(max_workers=workers) as ex:
            for i, rec in enumerate(ex.map(one, todo), 1):
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
                f.flush()
                done[(rec["id"], rec["model"], rec["seed"])] = rec
                if i % 10 == 0 or i == len(todo):
                    print(f"[{name}] {i}/{len(todo)}", flush=True)
    return done


def main():
    ap = argparse.ArgumentParser(description="PL-GEN walidacja sędziów vs gold")
    ap.add_argument("--mode", default="guided", choices=list(judge_panel._RUBRIC))
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--limit", type=int, default=0, help="tylko N pierwszych itemów gold (debug)")
    a = ap.parse_args()
    if not common._or_key():
        raise SystemExit("BRAK klucza OpenRouter (~/.openrouter_key)")

    mapping = anno_cli.read_mapping(anno_cli.map_path())
    if not mapping:
        raise SystemExit("brak mapowania gold — najpierw anno_cli sampling")
    keys = [(m["id"], m["model"], m["seed"]) for m in mapping]
    if a.limit:
        keys = keys[:a.limit]

    prompts = {p["id"]: p for p in common.load_prompts(common.DATA)}
    answers_all = {(r["id"], r["model"], r["seed"]): r for r in anno_cli.load_runs()}
    gold = {(g["id"], g["model"], g["seed"]): g for g in anno_cli.read_gold()}
    lt = _load_lt()

    items = {k: prompts[k[0]] for k in keys if k[0] in prompts}
    # Gold jest SAMOWYSTARCZALNY: gdy rekord gold niesie `ans`, sędzia ocenia DOKŁADNIE
    # ten tekst, który widział człowiek (generacje temp>0 są nieodtwarzalne, a plik gen
    # mógł zostać nadpisany). Fallback na bieżący plik gen tylko dla legacy goldu bez `ans`.
    answers = {}
    for k in keys:
        g = gold.get(k)
        if g is not None and g.get("ans") is not None:
            answers[k] = g["ans"]
        elif k in answers_all:
            answers[k] = answers_all[k]["ans"]
    keys = [k for k in keys if k in items and k in answers]
    print(f"[validate] {len(keys)} itemów gold | z goldem człowieka: "
          f"{sum(1 for k in keys if k in gold)} | LT: {'jest' if lt else 'BRAK (join pominięty)'}")

    # odpal każdego sędziego osobno (z cache)
    judge_recs = {j[0]: run_judge(j, keys, items, answers, a.workers, a.mode) for j in JUDGES}

    # złóż bogaty plik analityczny
    os.makedirs(VAL_DIR, exist_ok=True)
    out_path = os.path.join(VAL_DIR, "analysis.jsonl")
    with open(out_path, "w", encoding="utf-8") as f:
        for k in keys:
            it = items[k]
            g = gold.get(k)
            ltr = lt.get(k)
            row = {
                "id": k[0], "domena": it.get("domena"), "model": k[1], "seed": k[2],
                "phenomena": it.get("phenomena"),
                "truncated": _truncated(answers[k]),
                "n_tokens": common.count_tokens(answers[k]),
                "answer": answers[k],
                "human_werdykt": g.get("werdykt") if g else None,
                "human_naturalnosc": g.get("naturalnosc") if g else None,
                "human_note": g.get("note") if g else None,
                "lt_per100": ltr.get("per100") if ltr else None,
                "judges": {jn: {kk: recs[k].get(kk) for kk in ("werdykt", "naturalnosc", "powod")}
                           for jn, recs in judge_recs.items() if k in recs},
            }
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"[validate] analiza -> {out_path}")

    # podsumowanie: zgodność sędzia↔człowiek na itemach z goldem
    scored = [k for k in keys if k in gold]
    print(f"\n=== zgodność z człowiekiem (n={len(scored)} itemów z goldem, mode={a.mode}) ===")
    print(f"{'judge':16} {'exact%':>7} {'±1cls%':>7} {'verdykt dist (p/m/f)':>22} {'nat_mean':>9}")
    order = {"pass": 0, "mixed": 1, "fail": 2}
    hum_dist = Counter(gold[k]["werdykt"] for k in scored)
    for jn, recs in judge_recs.items():
        exact = adj = n = 0
        dist = Counter()
        nats = []
        for k in scored:
            jw = recs.get(k, {}).get("werdykt")
            if jw is None:
                continue
            n += 1
            dist[jw] += 1
            nv = recs[k].get("naturalnosc")
            if nv is not None:
                nats.append(nv)
            hw = gold[k]["werdykt"]
            if jw == hw:
                exact += 1
            if abs(order.get(jw, 1) - order.get(hw, 1)) <= 1:
                adj += 1
        nm = round(sum(nats) / len(nats), 2) if nats else None
        d = f"{dist.get('pass',0)}/{dist.get('mixed',0)}/{dist.get('fail',0)}"
        print(f"{jn:16} {100*exact/n if n else 0:6.1f}% {100*adj/n if n else 0:6.1f}% "
              f"{d:>22} {str(nm):>9}")
    hd = f"{hum_dist.get('pass', 0)}/{hum_dist.get('mixed', 0)}/{hum_dist.get('fail', 0)}"
    print(f"{'CZŁOWIEK':16} {'—':>7} {'—':>7} {hd:>22}")


if __name__ == "__main__":
    main()
