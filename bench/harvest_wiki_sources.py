#!/usr/bin/env python3
"""Harvest źródeł: artykuły PL-focus z Wikipedii PL zapisane LOKALNIE (persystencja źródeł).

Jeden przebieg streamingu pełnego dumpu; zostają artykuły przechodzące ten sam filtr
PL_PAT co entigraph_augment. Wyjście: title + akapity (300-2000 znaków), do budowy
grafu encji (entigraph_hops.py) i przyszłych generacji bez ponownego streamowania.

Out: slayer-data/knowledge/sources/wiki_pl_focus.jsonl  {"title","paras":[...]}
Usage: python3 bench/harvest_wiki_sources.py [--max-articles 0]
"""
import argparse
import json
import os
import re
import time

PL_PAT = re.compile(
    r"\b(Polsk|Polak|Rzeczypospolit|Rzeczpospolit|wojewódz|powiat|gmin[aiy]|Sejm|Senat RP|"
    r"ustaw[aiy]|kodeks|Warszaw|Krak[oó]w|Gda[ńn]sk|Wroc[łl]aw|Pozna[ńn]|[ŁL][oó]d[źz]|Szczecin|"
    r"Lublin|Katowic|Bia[łl]ystok|Mazowsz|Ma[łl]opolsk|Wielkopolsk|Pomorz|[ŚS]l[ąa]sk|Podlasi|"
    r"Podkarpaci|Kaszub|G[oó]ral|Mazur|Warmi|Kujaw|piastows|jagiello[ńn]s|PRL|Solidarno[śs][ćc])",
    re.I)
OUT = "slayer-data/knowledge/sources/wiki_pl_focus.jsonl"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-articles", type=int, default=0)
    a = ap.parse_args()
    from datasets import load_dataset
    ds = load_dataset("wikimedia/wikipedia", "20231101.pl", split="train", streaming=True)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    kept, scanned, t0 = 0, 0, time.time()
    with open(OUT, "w", encoding="utf-8") as f:
        for r in ds:
            scanned += 1
            txt = (r.get("text") or "").strip()
            title = r.get("title", "")
            if not PL_PAT.search(title + " " + txt[:800]):
                continue
            paras = [p.strip() for p in txt.split("\n") if 300 <= len(p.strip()) <= 2000]
            if not paras:
                continue
            f.write(json.dumps({"title": title, "paras": paras[:6]}, ensure_ascii=False) + "\n")
            kept += 1
            if kept % 5000 == 0:
                print(f"  {kept} art. PL-focus / {scanned} przeskanowanych ({scanned/(time.time()-t0):.0f}/s)", flush=True)
            if a.max_articles and kept >= a.max_articles:
                break
    print(f"DONE: {kept} artykułów PL-focus / {scanned} przeskanowanych -> {OUT}", flush=True)


if __name__ == "__main__":
    main()
