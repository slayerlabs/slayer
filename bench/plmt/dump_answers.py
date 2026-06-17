#!/usr/bin/env python3
"""Zrzut do ręcznego oglądu: <pełna informacja o pytaniu> + <odpowiedzi WSZYSTKICH
modeli/seedów> pod spodem, żeby łatwo wyłapać które itemy są skażone (instruction-
following / overgeneration / formatowanie). 0 wywołań LLM — czyta cache z runs/.

Wyjście: slayer-data/plmt/answers_by_question.md (gitignored — zawiera treść eval).

    python3 bench/plmt/dump_answers.py
"""
import glob
import json
import os

HERE = os.path.dirname(__file__)
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
DATA = os.path.join(REPO, "slayer-data", "plmt", "polish_morph_tests_v02.json")
RUNS = os.path.join(REPO, "slayer-data", "plmt", "runs")
OUT = os.path.join(REPO, "slayer-data", "plmt", "answers_by_question.md")
MODELS = ["bielik", "qwen35_instruct", "qwen36", "gemma4"]
SEEDS = (42, 43, 44, 45, 46)


def flat(s):
    """Wieloliniowa odpowiedź -> jedna linia (łatwiej skanować wzrokiem)."""
    return " / ".join(ln.strip() for ln in (s or "").splitlines() if ln.strip()) or "(puste)"


def main():
    tests = json.load(open(DATA, encoding="utf-8"))["tests"]
    resp = {}  # id -> {(model, seed): result}
    for f in glob.glob(os.path.join(RUNS, "results_*.json")):
        d = json.load(open(f, encoding="utf-8"))
        for r in d["results"]:
            resp.setdefault(r["id"], {})[(d["model"], d["seed"])] = r

    out = [
        f"# PL-MT — pytania + odpowiedzi wszystkich modeli",
        f"{len(tests)} itemów × {len(MODELS)} modele × {len(SEEDS)} seedów. "
        "Legenda: ✓ pass / ✗ fail · `[D]` trafiony dystraktor. 0 wywołań LLM (cache z runs/).",
    ]
    for t in tests:
        out.append("\n---\n")
        out.append(f"## {t['id']} · L{t.get('level', '?')} · {t['category']}")
        out.append(f"**prompt:** {t['prompt']}\n")
        out.append(f"- expected: `{t['expected']}`")
        out.append(f"- acceptable: `{t.get('acceptable')}`")
        if t.get("acceptable_all"):
            out.append(f"- acceptable_all (AND): `{t['acceptable_all']}`")
        out.append(f"- distractor: `{t.get('distractor', [])}`")
        if t.get("note"):
            out.append(f"- note: {t['note']}")
        if t.get("is_generative"):
            out.append("- is_generative: **true**")
        out.append("\n**odpowiedzi:**")
        out.append("```")
        for m in MODELS:
            for s in SEEDS:
                r = resp.get(t["id"], {}).get((m, s))
                if not r:
                    continue
                mark = "✓" if r["passed"] else "✗"
                dh = " [D]" if r.get("hit_distractor") else ""
                out.append(f"{mark} {m:16} s{s}{dh}  {flat(r['response'])}")
        out.append("```")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    print(f"zapisano: {OUT} · {len(tests)} itemów")


if __name__ == "__main__":
    main()
