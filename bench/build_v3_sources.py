#!/usr/bin/env python3
"""Slayer v3 — warstwy 2 i 3 miksu (V3_DATA_PLAN build order, kroki 1-2).

Warstwa Human-PL:
  --aya    CohereLabs/aya_dataset, language=Polish (ludzkie, apache-2.0)
  --oasst  OpenAssistant/oasst2, pary user->assistant lang=pl (apache-2.0)
Warstwa EN retention:
  --tulu   allenai/tulu-3-sft-mixture (odc-by), streaming + reservoir,
           tylko źródła reasoning/code/IF, cap per źródło

Wspólne gwarancje: dedup vs runs/test_atoms.txt (anty-kontaminacja KLEJ/belebele),
filtr nadużycia myślników (AI-tell), granice długości, format messages + source.

Usage:
  python3 bench/build_v3_sources.py --aya --oasst --tulu
  python3 bench/build_v3_sources.py --tulu --tulu-n 800
"""
import argparse
import hashlib
import json
import os
import random
import re

OUTDIR = "slayer-data/v3"
ATOMS_F = "runs/test_atoms.txt"


def norm(s):
    return " ".join(str(s).lower().split())


def load_atoms():
    if not os.path.exists(ATOMS_F):
        return []
    atoms = [t.strip() for t in open(ATOMS_F, encoding="utf-8")]
    return [t for t in atoms if 20 <= len(t) <= 200]


def dash_rate(text):
    words = max(len(text.split()), 1)
    return (text.count("—") + text.count("–")) / words * 100


PL_RE = re.compile(r"[ąćęłńóśźż]", re.I)


def ok_pl(user, assistant):
    if not (10 <= len(user) <= 4000 and 20 <= len(assistant) <= 6000):
        return False
    if not PL_RE.search(user + assistant):
        return False
    if dash_rate(assistant) > 1.5:
        return False
    return True


def write_out(rows, path):
    os.makedirs(OUTDIR, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"  -> {path}: {len(rows)}")


def guard(rows, atoms, seen):
    kept, contam, dup = [], 0, 0
    for r in rows:
        txt = norm(r["messages"][0]["content"] + " " + r["messages"][1]["content"])
        h = hashlib.sha1(norm(r["messages"][0]["content"]).encode()).hexdigest()
        if h in seen:
            dup += 1
            continue
        if any(at in txt for at in atoms):
            contam += 1
            continue
        seen.add(h)
        kept.append(r)
    print(f"  guard: kept {len(kept)}, contam {contam}, dup {dup}")
    return kept


def build_aya(atoms, seen):
    from datasets import load_dataset
    print("[aya] CohereLabs/aya_dataset, language=Polish")
    ds = load_dataset("CohereLabs/aya_dataset", split="train")
    rows = []
    for ex in ds:
        if ex.get("language") != "Polish":
            continue
        u, a = (ex.get("inputs") or "").strip(), (ex.get("targets") or "").strip()
        if not ok_pl(u, a):
            continue
        rows.append({"messages": [{"role": "user", "content": u},
                                  {"role": "assistant", "content": a}],
                     "source": "aya_pl_human"})
    rows = guard(rows, atoms, seen)
    write_out(rows, f"{OUTDIR}/human_pl_aya.jsonl")
    return rows


def build_oasst(atoms, seen):
    from datasets import load_dataset
    print("[oasst] OpenAssistant/oasst2, pary pl->pl")
    msgs = {}
    for split in ("train", "validation"):
        for m in load_dataset("OpenAssistant/oasst2", split=split):
            msgs[m["message_id"]] = m
    rows = []
    for m in msgs.values():
        if m["role"] != "assistant" or m.get("lang") != "pl":
            continue
        if m.get("rank") not in (0, None):  # tylko najlepsza odpowiedź w wątku
            continue
        parent = msgs.get(m.get("parent_id"))
        if not parent or parent["role"] != "prompter" or parent.get("lang") != "pl":
            continue
        u, a = parent["text"].strip(), m["text"].strip()
        if not ok_pl(u, a):
            continue
        rows.append({"messages": [{"role": "user", "content": u},
                                  {"role": "assistant", "content": a}],
                     "source": "oasst2_pl_human"})
    rows = guard(rows, atoms, seen)
    write_out(rows, f"{OUTDIR}/human_pl_oasst2.jsonl")
    return rows


# Tulu 3: bierzemy podzbiory reasoning/code/IF (nazwy źródeł w polu "source")
TULU_WANT = ("math", "numina", "code", "if", "precise", "flan", "wildchat-reason")


def build_tulu(atoms, seen, target, scan):
    from datasets import load_dataset
    print(f"[tulu] allenai/tulu-3-sft-mixture streaming, target {target}, scan {scan}")
    ds = load_dataset("allenai/tulu-3-sft-mixture", split="train", streaming=True)
    # zbiór jest pogrupowany po źródle; bez shuffle pierwsze N wierszy to jeden podzbiór
    ds = ds.shuffle(seed=42, buffer_size=10_000)
    rng = random.Random(42)
    pool = []
    for i, ex in enumerate(ds):
        if i >= scan:
            break
        src = (ex.get("source") or "").lower()
        if not any(w in src for w in TULU_WANT):
            continue
        ms = ex.get("messages") or []
        if len(ms) < 2 or ms[0]["role"] != "user":
            continue
        u = ms[0]["content"].strip()
        a = next((m["content"].strip() for m in ms[1:] if m["role"] == "assistant"), "")
        if not (10 <= len(u) <= 4000 and 20 <= len(a) <= 6000):
            continue
        row = {"messages": [{"role": "user", "content": u},
                            {"role": "assistant", "content": a}],
               "source": "tulu3_" + src.split("/")[-1][:40]}
        # reservoir
        if len(pool) < target * 3:
            pool.append(row)
        else:
            j = rng.randrange(i + 1)
            if j < target * 3:
                pool[j % (target * 3)] = row
    # cap per źródło, żeby jeden podzbiór nie zdominował
    by = {}
    rng.shuffle(pool)
    rows = []
    cap = max(target // 8, 40)
    for r in pool:
        if by.get(r["source"], 0) >= cap:
            continue
        by[r["source"]] = by.get(r["source"], 0) + 1
        rows.append(r)
        if len(rows) >= target:
            break
    rows = guard(rows, atoms, seen)
    write_out(rows, f"{OUTDIR}/en_retention_tulu3.jsonl")
    print("  per źródło:", json.dumps(by, indent=None)[:400])
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--aya", action="store_true")
    ap.add_argument("--oasst", action="store_true")
    ap.add_argument("--tulu", action="store_true")
    ap.add_argument("--tulu-n", type=int, default=800)
    ap.add_argument("--tulu-scan", type=int, default=150000)
    a = ap.parse_args()
    atoms = load_atoms()
    print(f"[v3] atomów test do dedupu: {len(atoms)}")
    seen = set()
    if a.aya:
        build_aya(atoms, seen)
    if a.oasst:
        build_oasst(atoms, seen)
    if a.tulu:
        build_tulu(atoms, seen, a.tulu_n, a.tulu_scan)


if __name__ == "__main__":
    main()
