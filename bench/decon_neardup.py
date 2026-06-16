#!/usr/bin/env python3
"""Decon near-dup: warstwa near-duplicate nad decon_audit.

decon_audit.py łapie kontaminację dosłowną: wspólny ciąg >= N słów (verbatim).
Przepuszcza za to przecieki, które nie są dosłowne:
  - ta sama treść bez polskich znaków (zażółć -> zazolc),
  - lekko przeredagowany / przepisany item (kilka słów zmienionych albo wstawionych).

Ten skrypt dokłada dwa tańsze tiery, korzystając z tych samych źródeł
ewaluacyjnych co decon_audit (EVAL_SOURCES + pełny LLMzSzŁ):

  diacritics : n-gram słów po sprowadzeniu polskich znaków do ASCII (stdlib),
  minhash    : near-dup całych dokumentów (Jaccard, opcjonalnie datasketch).

Dla każdego skanowanego pliku raport pokazuje też verbatim_raw (to, co złapałby
decon_audit), żeby było widać, ile near-dupów leży POZA warstwą dosłowną.

Usage:
  python3 bench/decon_neardup.py <plik.jsonl> [...]                 # diacritics
  python3 bench/decon_neardup.py <plik.jsonl> --minhash             # + MinHash
  python3 bench/decon_neardup.py --all                              # artefakty gen (GEN_DEFAULT)
  python3 bench/decon_neardup.py <plik> --tests fixtures/eval.jsonl # własne źródła evalu
Opcje: --ngram 8 --shingle 5 --minhash-threshold 0.8 --report results/decon_neardup.json
       --manifest <plik.jsonl> --strip --no-llmzszl

CPU-only. Domyślne zachowanie bez --minhash nie wymaga żadnych zależności.
Jeśli zespół woli, logika mieści się w decon_audit.py jako flagi --fold-diacritics/--minhash.
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


def words_fold(s):
    """Tokeny jak da.words(), ale z diakrytykami zwiniętymi do ASCII."""
    return [w.translate(_PL_FOLD) for w in da.words(s)]


def fold_shingles(text, n):
    """Zbiór folded n-gramów słów; dla tekstów < n zwraca jeden n-gram (cały tekst)."""
    toks = words_fold(text)
    sh = set(da.shingles(toks, n))
    if not sh and toks:
        sh = {" ".join(toks)}
    return sh


def eval_sources(tests_override, use_llmzszl):
    """Lista źródeł ewaluacyjnych: override z CLI albo EVAL_SOURCES (+ LLMzSzŁ)."""
    if tests_override:
        return list(tests_override)
    srcs = list(da.EVAL_SOURCES)
    if use_llmzszl:
        srcs.append(da.llmzszl_test_path())
    return srcs


def _make_minhash(text, shingle, num_perm):
    from datasketch import MinHash
    mh = MinHash(num_perm=num_perm)
    for s in fold_shingles(text, shingle):
        mh.update(s.encode("utf-8"))
    return mh


def build_indexes(sources, n, want_minhash, shingle, threshold, num_perm, max_items):
    """Buduje równolegle:
      - raw_idx   : zbiór n-gramów bez foldingu (verbatim baseline = decon_audit),
      - fold_idx  : zbiór n-gramów po foldingu diakrytyków (tier diacritics),
      - minhash   : (lsh, mh_by_item, item_refs) albo None (tier minhash).
    Granularność MinHasha = pojedynczy tekst zwracany przez da.iter_texts."""
    raw_idx, fold_idx, per_src = set(), set(), {}
    lsh = mh_by_item = item_refs = None
    if want_minhash:
        from datasketch import MinHashLSH
        lsh = MinHashLSH(threshold=threshold, num_perm=num_perm)
        mh_by_item, item_refs = {}, []

    item_no = 0
    for src in sources:
        if not os.path.exists(src):
            per_src[src] = "BRAK"
            print(f"[neardup] !!! BRAK źródła ewaluacyjnego: {src} (pokrycie NIEPEŁNE)")
            continue
        before = len(fold_idx)
        for t in da.iter_texts(src):
            raw_idx.update(da.shingles(da.words(t), n))
            fold_idx.update(da.shingles(words_fold(t), n))
            if want_minhash and (max_items <= 0 or item_no < max_items):
                key = str(item_no)
                mh = _make_minhash(t, shingle, num_perm)
                lsh.insert(key, mh)
                mh_by_item[key] = mh  # reużywany do liczenia Jaccarda przy skanie
                item_refs.append((src, t[:120]))
                item_no += 1
        per_src[src] = len(fold_idx) - before

    minhash = (lsh, mh_by_item, item_refs) if want_minhash else None
    return raw_idx, fold_idx, per_src, minhash


def audit_file(path, raw_idx, fold_idx, n, minhash, shingle, threshold, num_perm, manifest_rows):
    lsh, mh_by_item, item_refs = minhash if minhash else (None, None, None)
    use_mh = minhash is not None

    total = verbatim_raw = diacritics = minhash_hits = neardup = 0
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

        raw_hit = fold_hit = mh_hit = False
        mh_score, mh_ref = 0.0, None
        for t in texts:
            if not raw_hit and (set(da.shingles(da.words(t), n)) & raw_idx):
                raw_hit = True
            if not fold_hit and (fold_shingles(t, n) & fold_idx):
                fold_hit = True
            if use_mh:
                q = _make_minhash(t, shingle, num_perm)
                for cand in lsh.query(q):
                    j = float(q.jaccard(mh_by_item[cand]))
                    if j >= threshold and j > mh_score:
                        mh_hit, mh_score, mh_ref = True, j, item_refs[int(cand)][0]

        verbatim_raw += raw_hit
        diacritics += fold_hit
        minhash_hits += mh_hit

        if fold_hit or mh_hit:
            neardup += 1
            if fold_hit and raw_hit:
                typ, score, ref = "verbatim_also_raw", 1.0, None
            elif fold_hit:
                typ, score, ref = "diacritics", 1.0, None
            else:
                typ, score, ref = "minhash", round(mh_score, 4), mh_ref
            manifest_rows.append({"file": path, "line": total, "type": typ,
                                  "score": score, "eval_src": ref})
            rows.append((ln, True))
            if len(samples) < 5:
                samples.append({"line": total, "type": typ, "score": score, "eval_src": ref})
        else:
            rows.append((ln, False))

    summary = {
        "file": path, "records": total,
        "verbatim_raw_hits": verbatim_raw,
        "diacritics_hits": diacritics,
        "minhash_hits": minhash_hits,
        "neardup_hits": neardup,
        "neardup_beyond_verbatim": neardup - verbatim_raw,
        "rate_pct": round(neardup / max(total, 1) * 100, 3),
        "samples": samples,
    }
    return summary, rows


def main():
    ap = argparse.ArgumentParser(description="near-dup decon na bazie EVAL_SOURCES z decon_audit")
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--all", action="store_true", help="skanuj GEN_DEFAULT z decon_audit")
    ap.add_argument("--tests", nargs="*", default=None, help="własne źródła evalu (zamiast EVAL_SOURCES)")
    ap.add_argument("--no-llmzszl", action="store_true", help="nie pobieraj pełnego LLMzSzŁ z HF")
    ap.add_argument("--ngram", type=int, default=8)
    ap.add_argument("--minhash", action="store_true", help="włącz tier MinHash (wymaga datasketch)")
    ap.add_argument("--shingle", type=int, default=5, help="rozmiar shingla tokenów dla MinHash")
    ap.add_argument("--minhash-threshold", type=float, default=0.8)
    ap.add_argument("--num-perm", type=int, default=128)
    ap.add_argument("--max-eval-items", type=int, default=0, help="limit itemów evalu w MinHash (0 = bez limitu)")
    ap.add_argument("--report", default="results/decon_neardup.json")
    ap.add_argument("--manifest", default=None, help="zapis listy trafień (jsonl) do wycięcia")
    ap.add_argument("--strip", action="store_true", help="zapisz <plik>.clean.jsonl bez near-dupów")
    a = ap.parse_args()

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
    raw_idx, fold_idx, per_src, minhash = build_indexes(
        sources, a.ngram, a.minhash, a.shingle, a.minhash_threshold, a.num_perm, a.max_eval_items)

    print(f"[neardup] folded {a.ngram}-gramy: {len(fold_idx)} | raw: {len(raw_idx)} "
          f"| minhash: {'on' if a.minhash else 'off'} (k={a.shingle}, t={a.minhash_threshold})")
    for s, c in per_src.items():
        print(f"  {s}: {c}")

    manifest_rows, results = [], []
    for p in paths:
        r, rows = audit_file(p, raw_idx, fold_idx, a.ngram, minhash,
                             a.shingle, a.minhash_threshold, a.num_perm, manifest_rows)
        flag = "CZYSTY" if r["neardup_hits"] == 0 else \
            f"!!! near-dup {r['neardup_hits']} (poza verbatim: {r['neardup_beyond_verbatim']}, " \
            f"diakrytyki: {r['diacritics_hits']}, minhash: {r['minhash_hits']})"
        print(f"[neardup] {p}: {r['records']} rekordów -> {flag}")
        for s in r["samples"]:
            print(f"    linia {s['line']} [{s['type']}] score={s['score']}")
        results.append(r)
        if a.strip and any(bad for _, bad in rows):
            clean = p.rsplit(".jsonl", 1)[0] + ".clean.jsonl"
            with open(clean, "w", encoding="utf-8") as f:
                for ln, bad in rows:
                    if not bad:
                        f.write(ln + "\n")
            kept = sum(1 for _, bad in rows if not bad)
            print(f"    -> czysty plik: {clean} ({kept}/{r['records']})")

    report = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "tool": "decon_neardup",
              "ngram": a.ngram, "shingle": a.shingle, "minhash": a.minhash,
              "minhash_threshold": a.minhash_threshold,
              "eval_sources": per_src, "results": results}
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
