#!/usr/bin/env python3
"""EntiGraph-style synthetic augmentation for the Slayer v2 knowledge-adapter (Stanford 2024).

Take a small source corpus (Polish Wikipedia), and for each chunk: extract entities, then generate
DIVERSE grounded synthetic text — entity-relation statements, paraphrases, summaries, QA — that
re-expresses the chunk's knowledge many ways. The union is a much larger synthetic corpus whose
closed-book-QA value scales ~log-linearly with synthetic tokens (EntiGraph). Output = plain-text
docs for QLoRA continued-pretraining (the knowledge adapter), NOT chat/SFT.

Provenance: generation by the OPEN teacher (deepseek-v4-pro, MIT). No Anthropic/OpenAI. No per-item
judge (this is unsupervised CPT text; faithfulness is enforced by grounding the prompt in the source).

Usage: entigraph_augment.py [target_M_tokens] [out.jsonl]
Env: OPENROUTER_API_KEY/~/.openrouter_key; GEN_MODEL, GEN_WORKERS.
"""
import json, re, sys, os, time
from concurrent.futures import ThreadPoolExecutor
import urllib.request

API = "https://openrouter.ai/api/v1/chat/completions"
TEACHER = os.environ.get("GEN_MODEL", "deepseek/deepseek-v4-pro")
KEY = os.environ.get("OPENROUTER_API_KEY") or (open(os.path.expanduser("~/.openrouter_key")).read().strip()
        if os.path.exists(os.path.expanduser("~/.openrouter_key")) else "")
WORKERS = int(os.environ.get("GEN_WORKERS", "10"))
TARGET_TOKENS = (float(sys.argv[1]) if len(sys.argv) > 1 else 5.0) * 1_000_000   # default 5M (smoke)
OUT = sys.argv[2] if len(sys.argv) > 2 else "slayer-data/knowledge/entigraph_pl.jsonl"
approx_tokens = lambda s: max(1, len(s) // 4)   # ~4 chars/token (PL)

def chat(sysp, usr, maxt=1200, temp=0.7):
    body = {"model": TEACHER, "temperature": temp, "max_tokens": maxt, "reasoning": {"enabled": False},
            "messages": [{"role": "system", "content": sysp}, {"role": "user", "content": usr}]}
    req = urllib.request.Request(API, data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json", "Authorization": "Bearer " + KEY,
                     "HTTP-Referer": "https://slayer.fabryka.ai", "X-Title": "Slayer-EntiGraph"})
    for a in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return re.sub(r"<think>.*?</think>", "", json.loads(r.read())["choices"][0]["message"]["content"], flags=re.S).strip()
        except Exception:
            if a == 3: return ""
            time.sleep(3)

ENT_SYS = ("Wypisz najważniejsze encje (osoby, miejsca, organizacje, pojęcia, daty, wydarzenia) z podanego "
           "fragmentu. Zwróć WYŁĄCZNIE listę 4–8 encji oddzielonych średnikami, bez numeracji.")
REL_SYS = ("Jesteś autorem rzetelnych polskich tekstów encyklopedycznych. Na podstawie WYŁĄCZNIE podanego "
           "fragmentu napisz zwięzły, faktograficznie wierny akapit wyjaśniający związek między wskazanymi "
           "encjami. Nie zmyślaj; jeśli fragment nie opisuje związku, opisz każdą encję osobno na podstawie fragmentu.")
PARA_SYS = ("Przeredaguj poniższy fragment na nowo WŁASNYMI słowami, zachowując wszystkie fakty i nazwy. "
            "Naturalna współczesna polszczyzna, bez kalk, bez markdownu. Zwróć tylko przeredagowany tekst.")
SUM_SYS = ("Streść poniższy fragment w 2–4 zdaniach, zachowując kluczowe fakty i nazwy. Zwróć tylko streszczenie.")
QA_SYS = ("Na podstawie WYŁĄCZNIE fragmentu ułóż 3 pytania i wyczerpujące odpowiedzi (wiedza zamknięta). "
          "Format: 'Pytanie: ...\\nOdpowiedź: ...' — każda para w nowej linii. Nie zmyślaj.")

ATOMS_F = "runs/test_atoms.txt"
_atoms = []
if os.path.exists(ATOMS_F):
    _atoms = [t.strip() for t in open(ATOMS_F, encoding="utf-8")]
    _atoms = [t for t in _atoms if 20 <= len(t) <= 200]
_norm = lambda s: " ".join(str(s).lower().split())
def contaminated(s):
    n = _norm(s)
    return any(a in n for a in _atoms)

# PL_FOCUS=1 -> tylko artykuły o Polsce (długi ogon: regionalia, prawo, kultura, historia PL)
PL_FOCUS = os.environ.get("PL_FOCUS", "") == "1"
PL_PAT = re.compile(
    r"\b(Polsk|Polak|Rzeczypospolit|Rzeczpospolit|wojewódz|powiat|gmin[aiy]|Sejm|Senat RP|"
    r"ustaw[aiy]|kodeks|Warszaw|Krak[oó]w|Gda[ńn]sk|Wroc[łl]aw|Pozna[ńn]|[ŁL][oó]d[źz]|Szczecin|"
    r"Lublin|Katowic|Bia[łl]ystok|Mazowsz|Ma[łl]opolsk|Wielkopolsk|Pomorz|[ŚS]l[ąa]sk|Podlasi|"
    r"Podkarpaci|Kaszub|G[oó]ral|Mazur|Warmi|Kujaw|piastows|jagiello[ńn]s|PRL|Solidarno[śs][ćc])",
    re.I)

SRC_FILE = os.environ.get("SRC_FILE", "")  # lokalny korpus JSONL {"text","title"} zamiast Wikipedii

def passages(skip_titles=()):
    if SRC_FILE:
        for ln in open(SRC_FILE, encoding="utf-8"):
            try: r = json.loads(ln)
            except Exception: continue
            txt, title = (r.get("text") or "").strip(), r.get("title", "")
            if title in skip_titles or not (300 <= len(txt) <= 2000) or contaminated(txt):
                continue
            yield txt, title
        return
    from datasets import load_dataset
    ds = load_dataset("wikimedia/wikipedia", "20231101.pl", split="train", streaming=True)
    for r in ds:
        txt = (r.get("text") or "").strip()
        title = r.get("title", "")
        if title in skip_titles:
            continue
        if PL_FOCUS and not PL_PAT.search(title + " " + txt[:800]):
            continue
        # take a few substantial paragraphs per article
        paras = [p.strip() for p in txt.split("\n") if 400 <= len(p.strip()) <= 1800]
        for p in paras[:3]:
            if contaminated(p):  # źródło pokrywa się z testem -> wypada
                continue
            yield p, title

def explode(item):
    """One source chunk -> several grounded synthetic docs (the EntiGraph step)."""
    para, title = item
    out = []
    ents = [e.strip() for e in re.split(r"[;\n]", chat(ENT_SYS, f"Fragment ({title}):\n{para}", maxt=200)) if e.strip()][:8]
    # entity-relation statements over a few entity pairs
    import itertools
    pairs = list(itertools.combinations(ents, 2))[:4]
    for e1, e2 in pairs:
        t = chat(REL_SYS, f"Fragment ({title}):\n{para}\n\nEncje: {e1}; {e2}")
        if len(t) > 60: out.append((t, "relation"))
    # paraphrase, summary, QA
    for sysp, kind, mt in [(PARA_SYS, "paraphrase", 900), (SUM_SYS, "summary", 300), (QA_SYS, "qa", 900)]:
        t = chat(sysp, f"Fragment ({title}):\n{para}", maxt=mt)
        if len(t) > 40: out.append((t, kind))
    return [{"text": t, "kind": k, "source_title": title, "gen_model": TEACHER}
            for t, k in out if not contaminated(t)]

def main():
    if not KEY: print("BRAK klucza OpenRouter"); sys.exit(1)
    os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)
    from collections import Counter
    kinds = Counter(); tok = 0; ndoc = 0; done_titles = set()
    if os.path.exists(OUT):  # resume: doliczamy istniejące, pomijamy przerobione artykuły
        for ln in open(OUT, encoding="utf-8"):
            try: d = json.loads(ln)
            except Exception: continue
            tok += approx_tokens(d.get("text", "")); ndoc += 1
            kinds[d.get("kind", "?")] += 1; done_titles.add(d.get("source_title", ""))
        print(f"  resume: {ndoc} docs / ~{tok/1e6:.2f}M tok / {len(done_titles)} artykułów", flush=True)
    src = passages(done_titles); t0 = time.time()
    print(f"EntiGraph augment -> target ~{TARGET_TOKENS/1e6:.0f}M tokens | teacher={TEACHER} | {WORKERS} workers", flush=True)
    with open(OUT, "a", encoding="utf-8") as f, ThreadPoolExecutor(max_workers=WORKERS) as ex:
        while tok < TARGET_TOKENS:
            batch = []
            for _ in range(WORKERS):
                try: batch.append(next(src))
                except StopIteration: break
            if not batch: break
            for docs in ex.map(explode, batch):
                for d in docs:
                    f.write(json.dumps(d, ensure_ascii=False) + "\n"); f.flush()
                    tok += approx_tokens(d["text"]); ndoc += 1; kinds[d["kind"]] += 1
            if ndoc and ndoc % 50 < WORKERS:
                rate = tok / max(time.time()-t0, 1)
                print(f"  ~{tok/1e6:.2f}M tok / {ndoc} docs ({rate:.0f} tok/s, {time.time()-t0:.0f}s) {dict(kinds)}", flush=True)
    print(f"\nDONE ~{tok/1e6:.2f}M tokens, {ndoc} synthetic docs -> {OUT}", flush=True)
    print(f"  kinds: {dict(kinds)}", flush=True)

if __name__ == "__main__":
    main()
