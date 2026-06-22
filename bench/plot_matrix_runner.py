#!/usr/bin/env python3
"""4-column matrix from a SINGLE protocol: bench_runner full mode, identical n.

Unlike bench_matrix.py (which mixes loglik/gen sources per task), this reads the
four r_*.json files straight from bench_runner so every cell is apples-to-apples
(same harness, same n, same decode). That is the only honest cross-model picture.

    python3 bench/plot_matrix_runner.py --dir /tmp/slayer_runner --out ~/Desktop/slayer_matrix.png

Expects in --dir: r_base.json r_v3.json r_cal030.json r_bielik.json
(any missing -> that column is blank, graceful).
"""
import os, json, argparse
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

MODELS = [("base", "base Qwen3.5-27B"), ("v3", "v3 (DoRA)"),
          ("cal030", "v4 cal λ0.3"), ("bielik", "Bielik-11B")]
# (result-key, display)
TASKS = [
    ("pl:llmzszl", "LLMzSzŁ"),
    ("klej:cdsc_e", "CDSC-E (NLI)"),
    ("klej:psc", "PSC"), ("klej:ppc", "PPC"), ("klej:dyk", "DYK"),
    ("klej:belebele", "Belebele-PL"), ("klej:8tags", "8tags"),
    ("klej:polemo2_in", "PolEmo-in"), ("klej:polemo2_out", "PolEmo-out"),
    ("klej:nkjp_ner", "NKJP-NER"), ("klej:cbd", "CBD"), ("klej:ar", "AllegroRev"),
    ("en:arc", "ARC-C"), ("en:mmlu", "MMLU"),
    ("en:belebele_en", "Belebele-EN"), ("en:gsm8k", "GSM8K"),
]

def load(p):
    try: return json.load(open(p))
    except Exception: return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default="/tmp/slayer_runner")
    ap.add_argument("--out", default=os.path.expanduser("~/Desktop/slayer_matrix.png"))
    a = ap.parse_args()

    R = {tag: load(f"{a.dir}/r_{tag}.json") for tag, _ in MODELS}
    n_seen = set()
    def get(tag, key):
        d = R.get(tag)
        if not d: return None
        v = d.get("results", {}).get(key)
        if v and "score" in v and "error" not in v:
            if v.get("n"): n_seen.add(v["n"])
            return v["score"]
        return None

    grid = {k: {tag: get(tag, k) for tag, _ in MODELS} for k, _ in TASKS}

    BG="#f6f3ec"; INK="#1b1a16"; MUT="#6e685b"
    plt.rcParams.update({"font.family":"monospace",
                         "font.monospace":["IBM Plex Mono","DejaVu Sans Mono","monospace"]})
    M=len(MODELS); N=len(TASKS)
    delta=np.full((N,M),np.nan); annot=[["" for _ in range(M)] for _ in range(N)]
    for i,(k,_) in enumerate(TASKS):
        bs=grid[k]["base"]
        for j,(tag,_) in enumerate(MODELS):
            s=grid[k][tag]
            if s is None: continue
            annot[i][j]=f"{s:.0f}" if k!="klej:cdsc_r" else f"{s:.2f}"
            if tag=="base": delta[i][j]=0.0
            elif bs is not None: delta[i][j]=s-bs
    fig,ax=plt.subplots(figsize=(7.6,0.46*N+1.8),dpi=160)
    fig.patch.set_facecolor(BG); ax.set_facecolor(BG)
    vmax=8
    ax.imshow(delta,cmap="RdYlGn",vmin=-vmax,vmax=vmax,aspect="auto")
    ax.set_xticks(range(M)); ax.set_xticklabels([m[1] for m in MODELS],fontsize=9,color=INK)
    ax.set_yticks(range(N)); ax.set_yticklabels([d for _,d in TASKS],fontsize=9,color=INK)
    for i in range(N):
        for j in range(M):
            if annot[i][j]:
                ax.text(j,i,annot[i][j],ha="center",va="center",fontsize=8.5,color=INK)
    ns = "/".join(str(x) for x in sorted(n_seen)) if n_seen else "?"
    ax.set_title("Slayer — benchmarki (kolor = Δ vs base, liczba = wynik)",
                 color=INK,fontsize=12,pad=12,loc="left")
    fig.text(0.01,0.005,
             f"jeden protokół: bench_runner full, n={ns} · screening (release = n>=400) · "
             f"psc/dyk/cbd = artefakt scoringu likelihood (TAK=1/NIE=2 tok), gsm8k = uciety thinking — nie wiedza",
             color=MUT,fontsize=7)
    fig.tight_layout()
    os.makedirs(os.path.dirname(a.out) or ".",exist_ok=True)
    fig.savefig(a.out,facecolor=BG,bbox_inches="tight")
    print(f"-> {a.out}  (n={ns})")
    # also dump a quick text table
    print(f"\n{'task':16}"+"".join(f"{m[0]:>9}" for m in MODELS))
    for k,disp in TASKS:
        print(f"{disp:16}"+"".join(
            (f"{grid[k][m[0]]:>9.0f}" if grid[k][m[0]] is not None else f"{'·':>9}")
            for m in MODELS))

if __name__=="__main__":
    main()
