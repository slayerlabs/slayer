#!/usr/bin/env python3
"""Sharding JSONL po rozmiarze (granica na pełnych liniach, default 20MB).

Usage: python3 bench/shard_jsonl.py <in.jsonl> [--mb 20] [--out-dir DIR]
Tworzy <name>.part-000.jsonl, ... i <name>.manifest.json (liczby linii, sha1 per shard).
Odtworzenie: cat name.part-*.jsonl > name.jsonl
"""
import argparse
import hashlib
import json
import os

ap = argparse.ArgumentParser()
ap.add_argument("inp")
ap.add_argument("--mb", type=float, default=20.0)
ap.add_argument("--out-dir", default="")
a = ap.parse_args()

limit = int(a.mb * 1024 * 1024)
base = os.path.basename(a.inp).rsplit(".jsonl", 1)[0]
outdir = a.out_dir or os.path.dirname(a.inp) or "."
os.makedirs(outdir, exist_ok=True)

shards, cur, size, lines = [], None, 0, 0
idx = -1


def open_next():
    global cur, size, idx, lines
    if cur:
        cur.close()
        shards[-1]["lines"] = lines
        shards[-1]["sha1"] = hashlib.sha1(open(shards[-1]["path"], "rb").read()).hexdigest()
    idx += 1
    path = os.path.join(outdir, f"{base}.part-{idx:03d}.jsonl")
    shards.append({"path": path})
    size = 0
    lines = 0
    cur = open(path, "w", encoding="utf-8")


open_next()
for ln in open(a.inp, encoding="utf-8"):
    b = len(ln.encode("utf-8"))
    if size + b > limit and size > 0:
        open_next()
    cur.write(ln)
    size += b
    lines += 1
cur.close()
shards[-1]["lines"] = lines
shards[-1]["sha1"] = hashlib.sha1(open(shards[-1]["path"], "rb").read()).hexdigest()

for s in shards:
    s["path"] = os.path.basename(s["path"])
    s["mb"] = round(os.path.getsize(os.path.join(outdir, s["path"])) / 1e6, 2)
man = os.path.join(outdir, f"{base}.manifest.json")
json.dump({"source": os.path.basename(a.inp), "shards": shards,
           "total_lines": sum(s["lines"] for s in shards)}, open(man, "w"), indent=2)
print(f"{len(shards)} shardów -> {outdir}/{base}.part-*.jsonl + manifest")
for s in shards:
    print(f"  {s['path']}: {s['mb']}MB, {s['lines']} linii")
