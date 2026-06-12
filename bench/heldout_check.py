#!/usr/bin/env python3
"""Held-out sanity check — czy NOWY prywatny held-out jest faktycznie świeży
(nie pokrywa się z miksem treningowym).

To ODWROTNY kierunek niż decon_audit.py:
  - decon_audit:   indeks = zbiory EWALUACYJNE,   kandydat = pliki TRENINGOWE
                   (pytanie: czy trening zawiera verbatim z evala?)
  - heldout_check: indeks = miks TRENINGOWY,       kandydat = pliki HELD-OUT
                   (pytanie: czy świeży held-out nie przeciekł już do treningu?)

Workflow przyjęcia nowego held-outu (świeże arkusze CKE/OKE/PES, roczniki spoza
publicznych datasetów):
  1. Wrzuć plik do slayer-data/heldout/<egzamin>_<rocznik>.jsonl
     (slayer-data/ jest w .gitignore → treść zostaje PRYWATNA, nie idzie do
     publicznego repo; zgodnie z zasadą datasets = repo prywatne, legal).
  2. python3 bench/heldout_check.py            # audyt vs miks treningowy
       0.0% overlap  -> held-out czysty, można używać do pomiaru
       >0%           -> te pozycje już są w treningu; wytnij je (--strip) albo
                        weź nowszy rocznik
  3. Po akceptacji DOPISZ ścieżkę do EVAL_SOURCES w bench/decon_audit.py, żeby
     standardowa bramka pilnowała, że PRZYSZŁY trening nie wciągnie tego held-outu.

Reguła alarmu (poza tym skryptem): publiczny bench rośnie, a held-out płaski/spada
=> flaga benchmaxxingu.

Usage:
  python3 bench/heldout_check.py                       # audyt slayer-data/heldout/*.jsonl
  python3 bench/heldout_check.py <plik.jsonl> [...]     # konkretne pliki
  python3 bench/heldout_check.py --strip                # + zapis <plik>.clean.jsonl (bez pozycji z treningu)
Opcje: --ngram 8 --report results/heldout_check.json
"""
import argparse
import glob
import json
import os
import time

# reużycie prymitywów silnika dekontaminacji (ten sam tokenizer/shingling)
from decon_audit import words, shingles, iter_texts, texts_of, GEN_DEFAULT

HELDOUT_DEFAULT = ["slayer-data/heldout/*.jsonl"]


def build_train_index(n):
    """Indeks n-gramów z PLIKÓW TRENINGOWYCH (to samo źródło co wchodzi do treningu)."""
    idx = set()
    per_src = {}
    files = []
    for pat in GEN_DEFAULT:
        files.extend(sorted(glob.glob(pat)))
    files = list(dict.fromkeys(files))
    if not files:
        print("[heldout] !!! BRAK plików treningowych (GEN_DEFAULT) — indeks pusty, "
              "audyt bezwartościowy")
    for src in files:
        before = len(idx)
        for t in iter_texts(src):
            idx.update(shingles(words(t), n))
        per_src[src] = len(idx) - before
    return idx, per_src


def audit_heldout(path, idx, n, strip):
    rows, hits = [], []
    total = 0
    for ln in open(path, encoding="utf-8"):
        ln = ln.rstrip("\n")
        if not ln.strip():
            continue
        total += 1
        try:
            obj = json.loads(ln)
            cand_texts = texts_of(obj)
        except json.JSONDecodeError:
            cand_texts = [ln]
        matched = None
        for t in cand_texts:
            for sh in shingles(words(t), n):
                if sh in idx:
                    matched = sh
                    break
            if matched:
                break
        rows.append((ln, bool(matched)))
        if matched:
            hits.append({"line": total, "span": matched})
    if strip and hits:
        clean = path.rsplit(".jsonl", 1)[0] + ".clean.jsonl"
        with open(clean, "w", encoding="utf-8") as f:
            for ln, bad in rows:
                if not bad:
                    f.write(ln + "\n")
        print(f"    -> czysty held-out: {clean} ({total - len(hits)}/{total})")
    return {"file": path, "records": total, "overlap_hits": len(hits),
            "overlap_pct": round(len(hits) / max(total, 1) * 100, 3),
            "samples": hits[:5]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--ngram", type=int, default=8)
    ap.add_argument("--strip", action="store_true")
    ap.add_argument("--report", default="results/heldout_check.json")
    a = ap.parse_args()

    paths = a.paths or []
    if not paths:
        for pat in HELDOUT_DEFAULT:
            paths.extend(sorted(glob.glob(pat)))
    paths = [p for p in dict.fromkeys(paths) if os.path.exists(p)]
    if not paths:
        print("[heldout] brak plików held-out (slayer-data/heldout/*.jsonl). "
              "Wrzuć świeże arkusze i odpal ponownie.")
        raise SystemExit(0)

    idx, per_src = build_train_index(a.ngram)
    print(f"[heldout] indeks treningu: {len(idx)} {a.ngram}-gramów z {len(per_src)} plików")

    results = []
    for p in paths:
        r = audit_heldout(p, idx, a.ngram, a.strip)
        flag = "ŚWIEŻY (0% overlap)" if r["overlap_hits"] == 0 \
            else f"!!! {r['overlap_hits']} pokryć z treningiem ({r['overlap_pct']}%)"
        print(f"[heldout] {p}: {r['records']} rekordów -> {flag}")
        for s in r["samples"]:
            print(f"    linia {s['line']}: \"{s['span'][:90]}\"")
        results.append(r)

    report = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "ngram": a.ngram,
              "index_size": len(idx), "train_sources": per_src, "results": results}
    os.makedirs(os.path.dirname(a.report), exist_ok=True)
    json.dump(report, open(a.report, "w"), ensure_ascii=False, indent=2)
    print(f"[heldout] raport -> {a.report}")
    dirty = [r for r in results if r["overlap_hits"]]
    raise SystemExit(1 if dirty else 0)


if __name__ == "__main__":
    main()
