#!/usr/bin/env python3
"""Samowystarczalny test near-dup (MinHash/Jaccard) z decon_audit.

Bez sieci i bez slayer-data - ćwiczy czysty rdzeń algorytmu na danych w pamięci.
Uruchom: python3 bench/test_decon_neardup.py  (exit 0 = OK, 1 = FAIL)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from decon_audit import (  # noqa: E402
    NearDupIndex, estimate_jaccard, make_perms, minhash_signature, shingles, words,
)

FAILS = []


def check(cond, msg):
    print(("  OK  " if cond else "  FAIL") + " " + msg)
    if not cond:
        FAILS.append(msg)


print("[test] rdzeń MinHash")
perms = make_perms(128)
a = words("stolica polski to warszawa a najdluzsza rzeka w kraju to wisla")
sa = minhash_signature(a, 4, perms)
check(estimate_jaccard(sa, sa) == 1.0, "identyczny tekst -> Jaccard == 1.0")

b = words("zupelnie inny temat o pogodzie i gorach na poludniu europy")
sb = minhash_signature(b, 4, perms)
check(estimate_jaccard(sa, sb) < 0.2, "niezwiązany tekst -> Jaccard < 0.2")

print("[test] retrieval LSH (próg 0.6)")
idx = NearDupIndex(k=4, perms=128, bands=32, threshold=0.6)
idx.add(a, "eval_fixture", "stolica polski...")
idx.add(b, "eval_fixture", "zupelnie inny...")

# near-dup: ten sam tekst + doklejony ogon (wysoki Jaccard, ale > 8-gram run też by złapał)
near = words("stolica polski to warszawa a najdluzsza rzeka w kraju to wisla a wisla wpada do baltyku")
hit = idx.query(near)
check(hit is not None and hit[1] >= 0.6, f"near-dup (dopisany ogon) złapany: {hit}")

# czysty, niezwiązany tekst -> brak trafienia
clean = words("przepis na ciasto wymaga maki cukru jajek i odrobiny cierpliwosci w kuchni")
check(idx.query(clean) is None, "niezwiązany tekst -> brak near-dup")

print("[test] komplementarność: verbatim 8-gram ślepy na krótki item, near-dup łapie")
short_eval = words("ile to jest dwa razy dwa")          # 6 słów
verbatim_shingles = list(shingles(short_eval, 8))         # n=8 -> brak shingli
check(len(verbatim_shingles) == 0, "8-gram nie tworzy żadnego shingla dla 6-słownego itemu")

short_idx = NearDupIndex(k=4, perms=128, bands=32, threshold=0.7)
short_idx.add(short_eval, "eval_fixture", "ile to jest dwa razy dwa")
copy_hit = short_idx.query(words("ile to jest dwa razy dwa"))
check(copy_hit is not None, "near-dup łapie kopię krótkiego itemu, której verbatim nie widzi")

print()
if FAILS:
    print(f"[test] FAIL: {len(FAILS)} asercji nie przeszło")
    raise SystemExit(1)
print("[test] OK: wszystkie asercje przeszły")
