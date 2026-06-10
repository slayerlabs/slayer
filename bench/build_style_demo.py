#!/usr/bin/env python3
"""Buduje results/style_demo.json dla strony /styl (de-translationese, v1).

Łączy results/v1_analiza/cmp_angl.json [prompt, pl_base, ep3] z en_base.json
[prompt, en_ans, en_prompt]. EN jest opcjonalny (tylko część promptów go ma).
Strona /styl podświetla issues client-side — tu tylko czyste dane.

Usage: python3 bench/build_style_demo.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "results", "v1_analiza")
OUT = os.path.join(ROOT, "results", "style_demo.json")

cmp = json.load(open(os.path.join(SRC, "cmp_angl.json"), encoding="utf-8"))
en = {r[0]: r[1] for r in json.load(open(os.path.join(SRC, "en_base.json"), encoding="utf-8"))}

# kolejność: najpierw te z wersją EN (najmocniejszy dowód translationese), reszta po nich
examples = []
for prompt, pl_base, ep3 in cmp:
    examples.append({
        "prompt": prompt.strip(),
        "en": (en.get(prompt) or "").strip() or None,
        "pl_base": pl_base.strip(),
        "ep3": ep3.strip(),
    })
examples.sort(key=lambda e: (e["en"] is None,))  # te z EN pierwsze

data = {
    "updated": "2026-06-10",
    "model": "Qwen3.5-27B (base) vs slayer-style ep3 (v1)",
    "thesis": "Domyślny 'polski' bazy to angielska STRUKTURA z polskimi słowami "
              "(translationese): 'Here are a few options' = 'Oto kilka propozycji', "
              "Option 1 = Opcja 1, [Boss's Name] = [Imię]. Styl-tuning v1 łamie szablon "
              "i pisze natywną polszczyznę.",
    "n": len(examples),
    "examples": examples,
}
json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"zapisano {OUT} — {len(examples)} przykładów, {sum(e['en'] is not None for e in examples)} z EN")
