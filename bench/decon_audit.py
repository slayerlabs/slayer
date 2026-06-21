#!/usr/bin/env python3
"""Decon audit — silnik wykrywania verbatim/near-verbatim z testów w danych generowanych.

Buduje indeks n-gramów słów (domyślnie 8) ze WSZYSTKICH zbiorów ewaluacyjnych:
  - runs/test_atoms.txt                       (KLEJ + belebele test)
  - PEŁNY test LLMzSzŁ (amu-cai/llmzszl-dataset, auto-pobranie z HF; fallback:
    lokalna próbka slayer-data/llmzszl_R_eval.jsonl z GŁOŚNYM ostrzeżeniem)
  - slayer-data/polknowledge/bench.jsonl      (PolKnowledge held-out)
  - slayer-data/knowledge/probe_v1.jsonl      (knowledge probe Q+gold)
  - slayer-data/mcq_heldout.jsonl, mcq_test.jsonl
  - slayer-data/style/holdout_v1.jsonl        (held-out prompty stylu)
i skanuje wskazane pliki wygenerowane. Trafienie = wspólny ciąg >= N słów z evalem
(verbatim span). Raport: liczba trafień per plik + przykładowe spany (to jest
sankcjonowane użycie plików testowych: wejście dekontaminacji, nie trening).

Dodatkowo egzekwuje exclusion list sondy wiedzy
(slayer-data/knowledge/probe_v1.excluded_hashes.txt): rekord, którego pole "text"
ma sha1 z listy, jest trafieniem (typ probe_excluded) — te doki QA NIE mogą wejść
do CPT, inaczej sonda mierzy pamięć itemu zamiast wiedzy.

Opcjonalny pass --near-dup dokłada wykrywanie near-duplicate (MinHash/Jaccard):
verbatim n-gram łapie tylko DOKŁADNY wspólny ciąg >= N słów, więc mija itemy
krótsze niż N oraz lekko przeredagowane kopie. MinHash + LSH daje uzupełniający,
rekord-do-rekordu sygnał podobieństwa (pure-python, bez ciężkich zależności).

Usage:
  python3 bench/decon_audit.py <plik.jsonl> [...]            # audyt verbatim, raport
  python3 bench/decon_audit.py <plik.jsonl> --strip          # + zapis <plik>.clean.jsonl
  python3 bench/decon_audit.py <plik.jsonl> --near-dup       # + pass MinHash/Jaccard
  python3 bench/decon_audit.py --all                         # audyt wszystkich artefaktów gen
Opcje: --ngram 8 --report results/decon_audit.json
       --near-dup --jaccard 0.7 --minhash-k 4 --perms 128 --bands 32
Raport bieżący jest nadpisywany, ale każdy przebieg dopisuje się też do
results/decon_audit_history.jsonl (trwały ślad audytu).
"""
import argparse
import glob
import hashlib
import json
import os
import random
import re
import time
import unicodedata
from collections import defaultdict

EVAL_SOURCES = [
    "runs/test_atoms.txt",
    "slayer-data/polknowledge/bench.jsonl",
    "slayer-data/knowledge/probe_v1.jsonl",
    "slayer-data/mcq_heldout.jsonl",
    "slayer-data/mcq_test.jsonl",
    "slayer-data/style/holdout_v1.jsonl",
]
LLMZSZL_FALLBACK = "slayer-data/llmzszl_R_eval.jsonl"
EXCL_HASHES_F = "slayer-data/knowledge/probe_v1.excluded_hashes.txt"
GEN_DEFAULT = [
    "slayer-data/distill/*.jsonl",
    "slayer-data/external/*.jsonl",
    "slayer-data/knowledge/entigraph_*.jsonl",
    "slayer-data/mcq/mcq_synth_v3.jsonl",
    "slayer-data/mcq/mcq_train.jsonl",
    "slayer-data/mcq/agri_train.jsonl",
    "slayer-data/v3/*.jsonl",
    "slayer-data/style/style_pl_sft_v3_openjudge.jsonl",
    "slayer-data/style/style_pl_sft_v3_openjudge_disjoint.jsonl",
]


def llmzszl_test_path():
    """Pełny test LLMzSzŁ z HF (ten sam plik, na którym liczy bench_llmzszl_likelihood)."""
    try:
        from huggingface_hub import hf_hub_download
        return hf_hub_download("amu-cai/llmzszl-dataset", "llmzszl-test.jsonl",
                               repo_type="dataset")
    except Exception as e:
        print(f"[decon] !!! NIE POBRANO pełnego LLMzSzŁ ({str(e)[:60]}) — "
              f"fallback na próbkę {LLMZSZL_FALLBACK} (POKRYCIE NIEPEŁNE)")
        return LLMZSZL_FALLBACK

WORD_RE = re.compile(r"[a-ząćęłńóśźż0-9]+")


def words(s):
    s = unicodedata.normalize("NFC", str(s).lower())
    return WORD_RE.findall(s)


def texts_of(obj):
    """Wszystkie stringi z rekordu JSONL (dowolny schemat)."""
    out = []
    if isinstance(obj, str):
        out.append(obj)
    elif isinstance(obj, dict):
        for v in obj.values():
            out.extend(texts_of(v))
    elif isinstance(obj, list):
        for v in obj:
            out.extend(texts_of(v))
    return out


def iter_texts(path):
    if path.endswith(".txt"):
        for ln in open(path, encoding="utf-8"):
            if ln.strip():
                yield ln.strip()
        return
    for ln in open(path, encoding="utf-8"):
        try:
            obj = json.loads(ln)
        except json.JSONDecodeError:
            continue
        for t in texts_of(obj):
            yield t


def shingles(ws, n):
    for i in range(len(ws) - n + 1):
        yield " ".join(ws[i:i + n])


# --- near-duplicate (MinHash / Jaccard) -------------------------------------
# Verbatim n-gram (powyżej) wykrywa tylko DOKŁADNY wspólny ciąg >= N słów. Mija:
#   - itemy krótsze niż N słów (zero n-gramów -> niewidoczne dla indeksu),
#   - lekko przeredagowane kopie (zmiana paru słów rozbija każdy długi ciąg).
# MinHash + LSH daje uzupełniający, rekord-do-rekordu sygnał podobieństwa
# (estymata Jaccarda na shingle'ach słów), skalowalny przez banding.
# Koszt: O(N * perms * shingli) pure-python, jednowątkowo (~1.3 ms / 60-słowny
# rekord). OK za flagą opt-in; przy dużych korpusach gen rozważ podział pracy.
# Banding (bands/rows) jest sprzężony z progiem: domyślne perms=128/bands=32
# (rows=4) dają recall ~0.9998 przy --jaccard 0.7; przy niższym progu zwiększ
# --bands, inaczej część near-dup nie trafi do kandydatów (patrz ostrzeżenie).

_MH_PRIME = (1 << 61) - 1  # prime Mersenne'a, mieści 64-bit hashe


def make_perms(perms, seed=1234):
    """Deterministyczne współczynniki permutacji (a*h + b) mod prime."""
    rng = random.Random(seed)
    return [(rng.randrange(1, _MH_PRIME), rng.randrange(0, _MH_PRIME))
            for _ in range(perms)]


def _shingle_hash(sh):
    return int.from_bytes(hashlib.blake2b(sh.encode("utf-8"), digest_size=8).digest(),
                          "little")


def minhash_signature(ws, k, perms_ab):
    """Sygnatura MinHash z k-słownych shingli (fallback: całe zdanie, gdy < k słów).

    sh nigdy nie jest puste (fallback na całe zdanie), więc hs zawsze ma >= 1 element.
    Teksty < k słów dają trywialną sygnaturę (Jaccard 1.0 między sobą) - chronione
    guardami len(ws) >= k przy budowie indeksu i w audycie, więc nie generują
    fałszywych near-dup.
    """
    sh = set(shingles(ws, k)) or {" ".join(ws)}
    hs = [_shingle_hash(s) for s in sh]
    return tuple(min((a * h + b) % _MH_PRIME for h in hs) for (a, b) in perms_ab)


def estimate_jaccard(sa, sb):
    """Udział zgodnych pozycji sygnatur = nieobciążona estymata Jaccarda."""
    if not sa:
        return 0.0
    return sum(1 for x, y in zip(sa, sb) if x == y) / len(sa)


def lsh_keys(sig, bands):
    """Podział sygnatury na pasma (banding LSH); kandydat = wspólne pasmo."""
    rows = len(sig) // bands
    return [(b, sig[b * rows:(b + 1) * rows]) for b in range(bands)]


class NearDupIndex:
    """Indeks LSH nad rekordami ewaluacyjnymi; query zwraca najlepszy near-dup >= próg."""

    def __init__(self, k=4, perms=128, bands=32, threshold=0.7, seed=1234):
        if perms % bands:
            raise ValueError(f"perms ({perms}) musi być podzielne przez bands ({bands})")
        if threshold < 0.65:
            print(f"[decon] !!! near-dup próg Jaccard={threshold} < 0.65: banding LSH "
                  f"(bands={bands}, rows={perms // bands}) ma tu obniżony recall - część "
                  f"near-dup może nie trafić do kandydatów. Zwiększ --bands dla wyższego "
                  f"recall przy niskim progu.", flush=True)
        self.k, self.bands, self.threshold = k, bands, threshold
        self.perms_ab = make_perms(perms, seed)
        self.sigs = {}
        self.meta = {}
        self.buckets = defaultdict(set)
        self._rid = 0

    def add(self, ws, src, sample):
        sig = minhash_signature(ws, self.k, self.perms_ab)
        rid = self._rid
        self._rid += 1
        self.sigs[rid] = sig
        self.meta[rid] = (src, sample)
        for key in lsh_keys(sig, self.bands):
            self.buckets[key].add(rid)

    def query(self, ws):
        sig = minhash_signature(ws, self.k, self.perms_ab)
        cand = set()
        for key in lsh_keys(sig, self.bands):
            cand |= self.buckets.get(key, set())
        best = None
        for rid in cand:
            j = estimate_jaccard(sig, self.sigs[rid])
            if j >= self.threshold and (best is None or j > best[1]):
                best = (rid, j)
        return best  # (rid, jaccard) albo None

    def __len__(self):
        return self._rid


def build_neardup_index(k, perms, bands, threshold):
    ndx = NearDupIndex(k=k, perms=perms, bands=bands, threshold=threshold)
    per_src = {}
    for src in EVAL_SOURCES + [llmzszl_test_path()]:
        if not os.path.exists(src):
            per_src[src] = "BRAK"
            continue
        c = 0
        for t in iter_texts(src):
            ws = words(t)
            if len(ws) >= k:
                ndx.add(ws, src, t[:120])
                c += 1
        per_src[src] = c
    return ndx, per_src


def build_index(n):
    idx = set()
    per_src = {}
    for src in EVAL_SOURCES + [llmzszl_test_path()]:
        if not os.path.exists(src):
            per_src[src] = "BRAK"
            print(f"[decon] !!! BRAK źródła ewaluacyjnego: {src} — pokrycie NIEPEŁNE")
            continue
        before = len(idx)
        for t in iter_texts(src):
            ws = words(t)
            idx.update(shingles(ws, n))
        per_src[src] = len(idx) - before
    return idx, per_src


def load_excluded_hashes():
    """Hashe doków QA z sondy wiedzy — zakaz wejścia do treningu (CPT)."""
    if not os.path.exists(EXCL_HASHES_F):
        print(f"[decon] uwaga: brak {EXCL_HASHES_F} (sonda nie zbudowana?) — "
              f"egzekucja exclusion list pominięta")
        return set()
    return {h.strip() for h in open(EXCL_HASHES_F) if h.strip()}


def audit_file(path, idx, n, strip, excl_hashes, ndup=None):
    rows, hits = [], []
    total = 0
    for ln in open(path, encoding="utf-8"):
        ln = ln.rstrip("\n")
        if not ln.strip():
            continue
        total += 1
        try:
            obj = json.loads(ln)
        except json.JSONDecodeError:
            # niesparsowalna linia NIE przechodzi bez skanu — skanujemy surowy tekst
            ws = words(ln)
            matched = next((sh for sh in shingles(ws, n) if sh in idx), None)
            rows.append((ln, bool(matched)))
            if matched:
                hits.append({"line": total, "span": matched, "type": "ngram_rawline"})
            continue
        matched, mtype = None, "ngram"
        txt = obj.get("text") if isinstance(obj, dict) else None
        if excl_hashes and isinstance(txt, str) \
                and hashlib.sha1(txt.encode()).hexdigest() in excl_hashes:
            matched, mtype = "<dok QA z exclusion list sondy>", "probe_excluded"
        if not matched:
            for t in texts_of(obj):
                ws = words(t)
                for sh in shingles(ws, n):
                    if sh in idx:
                        matched = sh
                        break
                if matched:
                    break
        if not matched and ndup is not None:
            for t in texts_of(obj):
                ws = words(t)
                if len(ws) < ndup.k:
                    continue
                hit = ndup.query(ws)
                if hit:
                    rid, j = hit
                    matched = f"<near-dup {j:.2f} vs {ndup.meta[rid][0]}: {ndup.meta[rid][1]}>"
                    mtype = "neardup_jaccard"
                    break
        rows.append((ln, bool(matched)))
        if matched:
            hits.append({"line": total, "span": matched, "type": mtype})
    if strip and hits:
        clean = path.rsplit(".jsonl", 1)[0] + ".clean.jsonl"
        with open(clean, "w", encoding="utf-8") as f:
            for ln, bad in rows:
                if not bad:
                    f.write(ln + "\n")
        print(f"    -> czysty plik: {clean} ({total - len(hits)}/{total})")
    neardup = sum(1 for h in hits if h["type"] == "neardup_jaccard")
    return {"file": path, "records": total, "verbatim_hits": len(hits) - neardup,
            "neardup_hits": neardup, "hits": len(hits),
            "rate_pct": round(len(hits) / max(total, 1) * 100, 3),
            "samples": hits[:5]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--ngram", type=int, default=8)
    ap.add_argument("--strip", action="store_true")
    ap.add_argument("--report", default="public/results/decon_audit.json")
    ap.add_argument("--near-dup", action="store_true",
                    help="dodatkowy pass near-duplicate (MinHash/Jaccard) obok verbatim")
    ap.add_argument("--jaccard", type=float, default=0.7,
                    help="próg Jaccarda dla near-dup; sprzężony z --bands (niższy próg "
                         "wymaga więcej bands dla recall, < 0.65 ostrzega)")
    ap.add_argument("--minhash-k", type=int, default=4, help="rozmiar shingla (słowa) dla MinHash")
    ap.add_argument("--perms", type=int, default=128, help="liczba permutacji MinHash")
    ap.add_argument("--bands", type=int, default=32, help="pasma LSH (perms %% bands == 0)")
    a = ap.parse_args()

    paths = a.paths or []
    if a.all or not paths:
        for pat in GEN_DEFAULT:
            paths.extend(sorted(glob.glob(pat)))
    paths = [p for p in dict.fromkeys(paths)
             if os.path.exists(p) and not p.endswith(".verdicts.jsonl")]

    idx, per_src = build_index(a.ngram)
    excl_hashes = load_excluded_hashes()
    print(f"[decon] indeks: {len(idx)} {a.ngram}-gramów z evali | exclusion hashes: {len(excl_hashes)}")
    for s, c in per_src.items():
        print(f"  {s}: {c}")

    ndup = None
    if a.near_dup:
        ndup, nd_src = build_neardup_index(a.minhash_k, a.perms, a.bands, a.jaccard)
        print(f"[decon] near-dup: {len(ndup)} rekordów eval | MinHash k={a.minhash_k} "
              f"perms={a.perms} bands={a.bands} próg Jaccard={a.jaccard}")

    results = []
    for p in paths:
        r = audit_file(p, idx, a.ngram, a.strip, excl_hashes, ndup)
        if r["hits"] == 0:
            flag = "CZYSTY"
        else:
            flag = f"!!! {r['hits']} trafień ({r['rate_pct']}%) [verbatim={r['verbatim_hits']} near-dup={r['neardup_hits']}]"
        print(f"[decon] {p}: {r['records']} rekordów -> {flag}")
        for s in r["samples"]:
            print(f"    linia {s['line']} [{s.get('type', 'ngram')}]: \"{s['span'][:90]}\"")
        results.append(r)

    report = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "ngram": a.ngram,
              "index_size": len(idx), "excl_hashes": len(excl_hashes),
              "near_dup": ({"k": a.minhash_k, "perms": a.perms, "bands": a.bands,
                            "jaccard": a.jaccard, "eval_records": len(ndup)}
                           if ndup is not None else None),
              "eval_sources": per_src, "results": results}
    os.makedirs(os.path.dirname(a.report), exist_ok=True)
    json.dump(report, open(a.report, "w"), ensure_ascii=False, indent=2)
    os.makedirs("results", exist_ok=True)
    with open("results/decon_audit_history.jsonl", "a", encoding="utf-8") as hf:
        hf.write(json.dumps(report, ensure_ascii=False) + "\n")
    print(f"[decon] raport -> {a.report} (+ historia: results/decon_audit_history.jsonl)")
    bad = [r for r in results if r["hits"]]
    raise SystemExit(1 if bad else 0)


if __name__ == "__main__":
    main()
