#!/usr/bin/env python3
"""PL-GEN — dedup promptów vs PolNative (A6).

TRAIN POLICY: eval_only.
  Prompty PL-GEN (slayer-data/plgen/prompts_v1.jsonl) ORAZ ich parafrazy NIGDY nie
  wchodzą do treningu. Bramka przyszłego treningu: prompts_v1.jsonl jest wpisany w
  EVAL_SOURCES w bench/decon_audit.py, więc standardowy audyt dekontaminacji
  wychwyci verbatim z PL-GEN w danych treningowych. Przy każdym buildzie miksu
  należy dodatkowo deduplikować vs datasets/data/polnative/ (PL-GEN ma być topicznie
  ROZŁĄCZNY z PolNative — patrz PLGEN_PLAN.md "Overlap with PolNative").

Ten skrypt robi drugą część: porównuje prompty PL-GEN z promptami PolNative i
zgłasza pokrycia (exact + wysokie pokrycie n-gramowe, ten sam silnik shinglingu co
decon_audit). Kierunek: indeks = PolNative, kandydaci = prompty PL-GEN.

Degraduje łagodnie: brak pliku PL-GEN (Track B jeszcze go nie wyprodukował) albo
brak pliku PolNative -> pusty wynik + jasny komunikat, BEZ wyjątku.

Usage:
  python3 bench/plgen/decon_plgen.py                       # domyślne ścieżki
  python3 bench/plgen/decon_plgen.py <plgen.jsonl> <polnative.jsonl>
Opcje: --ngram 8
Exit 1 jeśli są pokrycia (do CI/bramki), 0 jeśli czysto/brak plików.
"""
import argparse
import json
import os
import sys

# reużycie tego samego tokenizera/shinglingu co decon_audit (stdlib-only, bez nowych zależności)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from bench.decon_audit import words, shingles  # noqa: E402
from bench.plgen import common  # noqa: E402

# domyślne ścieżki (master PolNative w repo datasets, obok slayer)
DEFAULT_PLGEN = common.DATA
DEFAULT_POLNATIVE = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "datasets", "data", "polnative",
    "polnative_v1.jsonl"))


def _prompts(path):
    """Pola 'prompt' z JSONL (PolNative i PL-GEN dzielą ten klucz). [] gdy brak pliku."""
    if not path or not os.path.exists(path):
        return []
    out = []
    for ln in open(path, encoding="utf-8"):
        ln = ln.strip()
        if not ln or ln.startswith("#") or ln.startswith("//"):
            continue
        try:
            obj = json.loads(ln)
        except json.JSONDecodeError:
            continue
        p = obj.get("prompt")
        if isinstance(p, str) and p.strip():
            out.append((obj.get("id", "?"), p))
    return out


def check(plgen_path=DEFAULT_PLGEN, polnative_path=DEFAULT_POLNATIVE, ngram=8):
    """Zgłoś prompty PL-GEN pokrywające się z promptami PolNative.

    Zwraca: {"hits": [{"plgen_id","polnative_id","span"}...],
             "plgen_n", "polnative_n", "plgen_missing", "polnative_missing"}.
    Pokrycie = wspólny exact prompt LUB wspólny span >= `ngram` słów.
    """
    plgen_missing = not (plgen_path and os.path.exists(plgen_path))
    polnative_missing = not (polnative_path and os.path.exists(polnative_path))
    pol = _prompts(polnative_path)
    plg = _prompts(plgen_path)

    # indeks: shingle -> id PolNative; oraz mapa exact-prompt -> id
    idx = {}
    exact = {}
    for pid, p in pol:
        exact.setdefault(" ".join(words(p)), pid)
        for sh in shingles(words(p), ngram):
            idx.setdefault(sh, pid)

    hits = []
    for gid, p in plg:
        ws = words(p)
        key = " ".join(ws)
        if key in exact:
            hits.append({"plgen_id": gid, "polnative_id": exact[key],
                         "span": "<exact prompt>"})
            continue
        for sh in shingles(ws, ngram):
            if sh in idx:
                hits.append({"plgen_id": gid, "polnative_id": idx[sh], "span": sh})
                break
    return {"hits": hits, "plgen_n": len(plg), "polnative_n": len(pol),
            "plgen_missing": plgen_missing, "polnative_missing": polnative_missing}


def main():
    ap = argparse.ArgumentParser(description="PL-GEN dedup vs PolNative")
    ap.add_argument("plgen", nargs="?", default=DEFAULT_PLGEN)
    ap.add_argument("polnative", nargs="?", default=DEFAULT_POLNATIVE)
    ap.add_argument("--ngram", type=int, default=8)
    a = ap.parse_args()

    res = check(a.plgen, a.polnative, a.ngram)
    if res["plgen_missing"]:
        print(f"[plgen-decon] BRAK promptów PL-GEN ({a.plgen}) — Track B jeszcze ich "
              f"nie wyprodukował. Nic do sprawdzenia (OK).")
        raise SystemExit(0)
    if res["polnative_missing"]:
        print(f"[plgen-decon] BRAK PolNative ({a.polnative}) — dedup pominięty.")
        raise SystemExit(0)
    print(f"[plgen-decon] PL-GEN: {res['plgen_n']} promptów vs PolNative: "
          f"{res['polnative_n']} | ngram={a.ngram}")
    if not res["hits"]:
        print("[plgen-decon] CZYSTY — 0 pokryć z PolNative (topicznie rozłączne).")
        raise SystemExit(0)
    print(f"[plgen-decon] !!! {len(res['hits'])} pokryć z PolNative:")
    for h in res["hits"][:20]:
        print(f"    PL-GEN {h['plgen_id']} ~ PolNative {h['polnative_id']}: "
              f"\"{h['span'][:90]}\"")
    raise SystemExit(1)


if __name__ == "__main__":
    main()
