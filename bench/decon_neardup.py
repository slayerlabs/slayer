#!/usr/bin/env python3
"""Decon near-dup: warstwa diakrytyków nad decon_audit.

decon_audit.py łapie kontaminację dosłowną: wspólny ciąg >= N słów (verbatim).
Przepuszcza za to przecieki bez polskich znaków (zażółć -> zazolc).

Ten skrypt dokłada tier diacritics — n-gram słów po sprowadzeniu polskich znaków
do ASCII (stdlib), korzystając z tych samych źródeł ewaluacyjnych co decon_audit
(EVAL_SOURCES + pełny LLMzSzŁ).

Near-dup MinHash/Jaccard jest w #36 (decon_audit) — tu tylko diakrytyki.

Dla każdego skanowanego pliku raport pokazuje też verbatim_raw (to, co złapałby
decon_audit), żeby było widać, ile trafień leży POZA warstwą dosłowną.

Usage:
  python3 bench/decon_neardup.py <plik.jsonl> [...]                 # diacritics scan
  python3 bench/decon_neardup.py --all                              # artefakty gen (GEN_DEFAULT)
  python3 bench/decon_neardup.py <plik> --tests fixtures/eval.jsonl # własne źródła evalu
Opcje: --ngram 8 --report public/results/decon_neardup.json
       --manifest <plik.jsonl> --strip --strip-diacritics --no-llmzszl

--strip usuwa tylko trafienia verbatim (raw). --strip-diacritics wymaga jawnej zgody
na wycinanie tieru diakrytyków (over-collapse: łoś->los, sąd->sad, być->byc, różne->rozne).

CPU-only, stdlib — bez zewnętrznych zależności.
"""
import argparse
import glob
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import decon_audit as da  # noqa: E402  (reużycie EVAL_SOURCES/words/iter_texts/shingles)

# Sprowadzenie polskich diakrytyków do ASCII (jak w slayer-eval-kit/decon/core.py).
_PL_FOLD = str.maketrans({
    "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n",
    "ó": "o", "ś": "s", "ź": "z", "ż": "z",
})

_DIACRITICS_STRIP_WARN = (
    "[neardup] !!! --strip-diacritics: tier diakrytyków może over-collapsować "
    "rozne leksemy (los/sad/byc/rozne) — uzywaj swiadomie"
)


def words_fold(s):
    """Tokeny jak da.words(), ale z diakrytykami zwiniętymi do ASCII."""
    return [w.translate(_PL_FOLD) for w in da.words(s)]


def fold_shingles(text, n):
    """Zbiór folded n-gramów słów; sub-n itemy poza tierem (domena MinHasha #36)."""
    return set(da.shingles(words_fold(text), n))


def eval_sources(tests_override, use_llmzszl):
    """Lista źródeł ewaluacyjnych: override z CLI albo EVAL_SOURCES (+ LLMzSzŁ)."""
    if tests_override:
        return list(tests_override)
    srcs = list(da.EVAL_SOURCES)
    if use_llmzszl:
        srcs.append(da.llmzszl_test_path())
    return srcs


def build_indexes(sources, n):
    """Buduje raw_idx (verbatim baseline) i fold_idx (tier diacritics)."""
    raw_idx, fold_idx, per_src = set(), set(), {}
    for src in sources:
        if not os.path.exists(src):
            per_src[src] = "BRAK"
            print(f"[neardup] !!! BRAK źródła ewaluacyjnego: {src} (pokrycie NIEPEŁNE)")
            continue
        before = len(fold_idx)
        for t in da.iter_texts(src):
            raw_idx.update(da.shingles(da.words(t), n))
            fold_idx.update(fold_shingles(t, n))
        per_src[src] = len(fold_idx) - before
    return raw_idx, fold_idx, per_src


def audit_file(path, raw_idx, fold_idx, n, manifest_rows):
    total = verbatim_raw = diacritics = neardup = 0
    samples, rows = [], []
    for ln in open(path, encoding="utf-8"):
        ln = ln.rstrip("\n")
        if not ln.strip():
            continue
        total += 1
        try:
            texts = da.texts_of(json.loads(ln))
        except json.JSONDecodeError:
            texts = [ln]

        raw_hit = fold_hit = False
        for t in texts:
            if not raw_hit and (set(da.shingles(da.words(t), n)) & raw_idx):
                raw_hit = True
            if not fold_hit and (fold_shingles(t, n) & fold_idx):
                fold_hit = True

        verbatim_raw += raw_hit
        diacritics += fold_hit
        if fold_hit:
            neardup += 1
            if fold_hit and raw_hit:
                typ, score = "verbatim_also_raw", 1.0
            else:
                typ, score = "diacritics", 1.0
            manifest_rows.append({"file": path, "line": total, "type": typ,
                                  "score": score, "eval_src": None})
            if len(samples) < 5:
                samples.append({"line": total, "type": typ, "score": score, "eval_src": None})
        rows.append((ln, raw_hit, fold_hit))

    summary = {
        "file": path, "records": total,
        "verbatim_raw_hits": verbatim_raw,
        "diacritics_hits": diacritics,
        "neardup_hits": neardup,
        "neardup_beyond_verbatim": neardup - verbatim_raw,
        "rate_pct": round(neardup / max(total, 1) * 100, 3),
        "samples": samples,
    }
    return summary, rows


def should_strip(raw_hit, fold_hit, strip, strip_diacritics):
    if strip and raw_hit:
        return True
    if strip_diacritics and fold_hit:
        return True
    return False


def main():
    ap = argparse.ArgumentParser(description="near-dup decon (tier diacritics) na bazie EVAL_SOURCES z decon_audit")
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--all", action="store_true", help="skanuj GEN_DEFAULT z decon_audit")
    ap.add_argument("--tests", nargs="*", default=None, help="własne źródła evalu (zamiast EVAL_SOURCES)")
    ap.add_argument("--no-llmzszl", action="store_true", help="nie pobieraj pełnego LLMzSzŁ z HF")
    ap.add_argument("--ngram", type=int, default=8)
    ap.add_argument("--report", default="public/results/decon_neardup.json")
    ap.add_argument("--manifest", default=None, help="zapis listy trafień (jsonl) do wycięcia")
    ap.add_argument("--strip", action="store_true",
                    help="zapisz <plik>.clean.jsonl bez trafień verbatim (raw)")
    ap.add_argument("--strip-diacritics", action="store_true",
                    help="wycinaj też tier diakrytyków (wymaga świadomej zgody na over-collapse)")
    a = ap.parse_args()

    if a.strip_diacritics:
        print(_DIACRITICS_STRIP_WARN)

    paths = list(a.paths)
    if a.all or not paths:
        for pat in da.GEN_DEFAULT:
            paths.extend(sorted(glob.glob(pat)))
    paths = [p for p in dict.fromkeys(paths)
             if os.path.exists(p) and not p.endswith(".verdicts.jsonl")]
    if not paths:
        print("[neardup] brak plików do skanu (podaj ścieżki albo --all)")
        raise SystemExit(2)

    sources = eval_sources(a.tests, use_llmzszl=not a.no_llmzszl)
    raw_idx, fold_idx, per_src = build_indexes(sources, a.ngram)

    print(f"[neardup] folded {a.ngram}-gramy: {len(fold_idx)} | raw: {len(raw_idx)}")
    for s, c in per_src.items():
        print(f"  {s}: {c}")

    manifest_rows, results = [], []
    for p in paths:
        r, rows = audit_file(p, raw_idx, fold_idx, a.ngram, manifest_rows)
        flag = "CZYSTY" if r["neardup_hits"] == 0 else \
            f"!!! near-dup {r['neardup_hits']} (poza verbatim: {r['neardup_beyond_verbatim']}, " \
            f"diakrytyki: {r['diacritics_hits']})"
        print(f"[neardup] {p}: {r['records']} rekordów -> {flag}")
        for s in r["samples"]:
            print(f"    linia {s['line']} [{s['type']}] score={s['score']}")
        results.append(r)
        if (a.strip or a.strip_diacritics) and any(
                should_strip(raw, fold, a.strip, a.strip_diacritics) for _, raw, fold in rows):
            clean = p.rsplit(".jsonl", 1)[0] + ".clean.jsonl"
            with open(clean, "w", encoding="utf-8") as f:
                for ln, raw_hit, fold_hit in rows:
                    if not should_strip(raw_hit, fold_hit, a.strip, a.strip_diacritics):
                        f.write(ln + "\n")
            kept = sum(1 for _, raw_hit, fold_hit in rows
                       if not should_strip(raw_hit, fold_hit, a.strip, a.strip_diacritics))
            print(f"    -> czysty plik: {clean} ({kept}/{r['records']})")

    report = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "tool": "decon_neardup",
              "ngram": a.ngram, "eval_sources": per_src, "results": results}
    os.makedirs(os.path.dirname(a.report) or ".", exist_ok=True)
    json.dump(report, open(a.report, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"[neardup] raport -> {a.report}")
    if a.manifest and manifest_rows:
        os.makedirs(os.path.dirname(a.manifest) or ".", exist_ok=True)
        with open(a.manifest, "w", encoding="utf-8") as f:
            for row in manifest_rows:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
        print(f"[neardup] manifest -> {a.manifest} ({len(manifest_rows)} trafień)")

    raise SystemExit(1 if any(r["neardup_hits"] for r in results) else 0)


if __name__ == "__main__":
    main()
