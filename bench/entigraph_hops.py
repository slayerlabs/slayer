#!/usr/bin/env python3
"""EntiGraph-hops — wiedza kompozycyjna ze ścieżek 2-hopowych w grafie encji.

Graf: węzeł = tytuł artykułu (encja), krawędź A->B gdy tekst artykułu A wzmiankuje
tytuł B (co-mention, z lokalnych źródeł wiki_pl_focus.jsonl). Ścieżka A->B->C daje
parę ugruntowanych fragmentów (A o B, B o C); teacher pisze: (1) akapit pomostowy
łączący A z C przez B, (2) 2-hopowe QA. Model uczy się składać fakty, nie tylko je
odtwarzać. Twarde zasady: tekst WYŁĄCZNIE z podanych fragmentów, guard vs atomy
testowe, provenance ścieżki przy każdym doku.

Out: slayer-data/knowledge/entigraph_hops.jsonl
Usage: python3 bench/entigraph_hops.py --target-docs 2000 [--seed 42]
Env: GEN_MODEL (default deepseek-v4-flash), GEN_WORKERS (default 64)
"""
import argparse
import json
import os
import random
import re
import time
import unicodedata
import urllib.request
from collections import defaultdict
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait

SRC = "slayer-data/knowledge/sources/wiki_pl_focus.jsonl"
OUT = "slayer-data/knowledge/entigraph_hops.jsonl"
ATOMS_F = "runs/test_atoms.txt"
API = "https://openrouter.ai/api/v1/chat/completions"
TEACHER = os.environ.get("GEN_MODEL", "deepseek/deepseek-v4-flash")
WORKERS = int(os.environ.get("GEN_WORKERS", "64"))
KEY = open(os.path.expanduser("~/.openrouter_key")).read().strip()

_norm = lambda s: " ".join(str(s).lower().split())
_atoms = []
if os.path.exists(ATOMS_F):
    _atoms = [t.strip() for t in open(ATOMS_F, encoding="utf-8")]
    _atoms = [t for t in _atoms if 20 <= len(t) <= 200]


def contaminated(s):
    n = _norm(s)
    return any(a in n for a in _atoms)


def chat(sysp, usr, maxt=1200, temp=0.6):
    body = {"model": TEACHER, "temperature": temp, "max_tokens": maxt, "reasoning": {"enabled": False},
            "messages": [{"role": "system", "content": sysp}, {"role": "user", "content": usr}]}
    req = urllib.request.Request(API, data=json.dumps(body).encode(),
                                 headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
    for a in range(4):
        try:
            c = json.loads(urllib.request.urlopen(req, timeout=180).read())["choices"][0]["message"]["content"]
            return re.sub(r"<think>.*?</think>", "", c or "", flags=re.S).strip()
        except Exception:
            if a == 3:
                return ""
            time.sleep(2 * (a + 1))


BRIDGE_SYS = ("Jesteś autorem rzetelnych polskich tekstów encyklopedycznych. Dostajesz dwa fragmenty: "
              "FRAGMENT 1 (artykuł o A, wzmiankuje B) i FRAGMENT 2 (artykuł o B, wzmiankuje C). "
              "Napisz zwięzły akapit łączący A z C poprzez B, używając WYŁĄCZNIE faktów z fragmentów. "
              "Nie zmyślaj, nie dodawaj wiedzy spoza fragmentów. Naturalna polszczyzna, bez markdownu.")
HOPQA_SYS = ("Na podstawie WYŁĄCZNIE dwóch fragmentów ułóż 3 pytania wielokrokowe, których odpowiedź "
             "wymaga POŁĄCZENIA faktu z fragmentu 1 i faktu z fragmentu 2 (przez wspólną encję), wraz "
             "z wyczerpującymi odpowiedziami. Pytania samodzielne (pełne nazwy, bez 'fragment/tekst'). "
             "Format: 'Pytanie: ...\\nOdpowiedź: ...' Nie zmyślaj.")


def norm_title(t):
    return unicodedata.normalize("NFC", t.strip().lower())


def build_graph(min_mentions=1):
    """A->B gdy akapit artykułu A zawiera tytuł B (>=4 znaki, bez nawiasów)."""
    arts = {}
    for ln in open(SRC, encoding="utf-8"):
        r = json.loads(ln)
        arts[r["title"]] = r["paras"]
    titles = {norm_title(t): t for t in arts
              if 4 <= len(t) <= 60 and "(" not in t and t.count(" ") <= 5}
    # indeks: pierwsze słowo tytułu -> tytuły (przyspieszenie wyszukiwania)
    by_first = defaultdict(list)
    for nt, t in titles.items():
        by_first[nt.split()[0]].append((nt, t))
    edges = defaultdict(dict)  # A -> {B: (para_idx, mention)}
    for a_title, paras in arts.items():
        for i, p in enumerate(paras):
            np_ = _norm(p)
            words = set(np_.split())
            for w in words:
                for nt, b_title in by_first.get(w, ()):
                    if b_title == a_title or nt not in np_:
                        continue
                    if b_title not in edges[a_title]:
                        edges[a_title][b_title] = i
    return arts, edges


def sample_paths(arts, edges, n, rng):
    paths = []
    a_list = [a for a in edges if len(edges[a]) >= 1]
    tries = 0
    seen = set()
    while len(paths) < n and tries < n * 60:
        tries += 1
        a = rng.choice(a_list)
        b = rng.choice(list(edges[a]))
        if b not in edges or not edges[b]:
            continue
        c = rng.choice(list(edges[b]))
        if c == a or (a, b, c) in seen:
            continue
        seen.add((a, b, c))
        f1 = arts[a][edges[a][b]]
        f2 = arts[b][edges[b][c]]
        if contaminated(f1) or contaminated(f2):
            continue
        paths.append((a, b, c, f1, f2))
    return paths


def explode(path):
    a, b, c, f1, f2 = path
    usr = (f"A = {a}; B = {b}; C = {c}\n\nFRAGMENT 1 (z artykułu „{a}”):\n{f1}\n\n"
           f"FRAGMENT 2 (z artykułu „{b}”):\n{f2}")
    out = []
    t = chat(BRIDGE_SYS, usr, maxt=700)
    if len(t) > 80:
        out.append((t, "bridge"))
    t = chat(HOPQA_SYS, usr, maxt=1100)
    if len(t) > 80:
        out.append((t, "hop_qa"))
    return [{"text": t, "kind": k, "path": [a, b, c], "gen_model": TEACHER}
            for t, k in out if not contaminated(t)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--target-docs", type=int, default=2000)
    ap.add_argument("--seed", type=int, default=42)
    a = ap.parse_args()
    rng = random.Random(a.seed)

    print("[hops] buduję graf co-mention...", flush=True)
    arts, edges = build_graph()
    n_edges = sum(len(v) for v in edges.values())
    print(f"[hops] artykułów: {len(arts)}, węzłów z krawędziami: {len(edges)}, krawędzi: {n_edges}", flush=True)

    done = 0
    if os.path.exists(OUT):
        done = sum(1 for _ in open(OUT))
        print(f"[hops] resume: {done} doków", flush=True)
    need_paths = max((a.target_docs - done) // 2 + 10, 0)
    paths = sample_paths(arts, edges, need_paths, rng)
    print(f"[hops] ścieżek 2-hop do przerobienia: {len(paths)}", flush=True)

    ndoc, t0 = done, time.time()
    with open(OUT, "a", encoding="utf-8") as f, ThreadPoolExecutor(max_workers=WORKERS) as ex:
        pending = set()
        it = iter(paths)
        exhausted = False
        while ndoc < a.target_docs and (pending or not exhausted):
            while not exhausted and len(pending) < WORKERS:
                try:
                    pending.add(ex.submit(explode, next(it)))
                except StopIteration:
                    exhausted = True
                    break
            if not pending:
                break
            dn, pending = wait(pending, return_when=FIRST_COMPLETED)
            for fut in dn:
                try:
                    docs = fut.result()
                except Exception:
                    continue
                for d in docs:
                    f.write(json.dumps(d, ensure_ascii=False) + "\n")
                    ndoc += 1
            f.flush()
            if ndoc % 200 < 4:
                print(f"  {ndoc}/{a.target_docs} doków ({(ndoc-done)/max(time.time()-t0,1):.1f}/s)", flush=True)
    print(f"[hops] DONE {ndoc} doków -> {OUT}", flush=True)


if __name__ == "__main__":
    main()
