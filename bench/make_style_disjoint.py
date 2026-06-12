#!/usr/bin/env python3
"""Reprodukcja style_pl_sft_v3_openjudge_disjoint.jsonl (lineage gap z audytu v3).

Z style_pl_sft_v3_openjudge.jsonl usuwa rekordy, których prompt LUB odpowiedź
pokrywa się 8-gramem słów z DOWOLNYM tekstem style/holdout_v1.jsonl (styl-eval
held-out). Historycznie: 588 - 85 identycznych promptów = 503 (DATA_LINEAGE);
sprawdzenie odpowiedzi (2026-06-12) zdjęło 1 więcej -> 502.

Wynik to ARTEFAKT TRENINGOWY: rekordy odchudzone do {id, task, source, verified,
messages} — pola meta/checks (notatki sędziego itp.) cytują teksty okołoewaluacyjne
i fałszywie alarmują decon; pełne lineage zostaje w pliku źródłowym _openjudge.

Usage: python3 bench/make_style_disjoint.py [--check]
  --check  nie zapisuje, tylko porównuje wynik z istniejącym plikiem disjoint
"""
import argparse
import json
import re
import unicodedata

SRC = "slayer-data/style/style_pl_sft_v3_openjudge.jsonl"
HOLDOUT = "slayer-data/style/holdout_v1.jsonl"
OUT = "slayer-data/style/style_pl_sft_v3_openjudge_disjoint.jsonl"
NGRAM = 8

WORD_RE = re.compile(r"[a-ząćęłńóśźż0-9]+")


def words(s):
    return WORD_RE.findall(unicodedata.normalize("NFC", str(s).lower()))


def shingles(ws, n=NGRAM):
    return {" ".join(ws[i:i + n]) for i in range(len(ws) - n + 1)}


def prompt_of(r):
    return r["messages"][0]["content"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()

    idx, exact = set(), set()
    for ln in open(HOLDOUT, encoding="utf-8"):
        r = json.loads(ln)
        ws = words(prompt_of(r))
        exact.add(" ".join(ws))  # prompty < NGRAM słów nie mają shingli — łapiemy exact
        def walk(o):  # indeks ze WSZYSTKICH stringów holdoutu (prompt, referencje, meta)
            if isinstance(o, str):
                idx.update(shingles(words(o)))
            elif isinstance(o, dict):
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)
        walk(r)
    print(f"[disjoint] indeks holdout: {len(idx)} {NGRAM}-gramów + {len(exact)} exact")

    kept, dropped = [], 0
    for ln in open(SRC, encoding="utf-8"):
        r = json.loads(ln)
        ws = words(prompt_of(r))
        trained_txt = words(" ".join(m["content"] for m in r["messages"]))
        if " ".join(ws) in exact or shingles(trained_txt) & idx:
            dropped += 1
            continue
        slim = {k: r[k] for k in ("id", "task", "source", "verified", "messages") if k in r}
        kept.append(json.dumps(slim, ensure_ascii=False))
    print(f"[disjoint] {SRC}: kept {len(kept)}, dropped {dropped}")

    if a.check:
        try:
            existing = [l.rstrip("\n") for l in open(OUT, encoding="utf-8")]
        except FileNotFoundError:
            print(f"[disjoint] --check: {OUT} nie istnieje")
            raise SystemExit(1)
        same = existing == kept
        print(f"[disjoint] --check vs {OUT}: istniejący {len(existing)}, "
              f"odtworzony {len(kept)}, identyczne: {same}")
        raise SystemExit(0 if same else 1)

    with open(OUT, "w", encoding="utf-8") as f:
        for ln in kept:
            f.write(ln + "\n")
    print(f"[disjoint] -> {OUT}")


if __name__ == "__main__":
    main()
