#!/usr/bin/env python3
"""Dump normalized text atoms from all benchmark TEST splits → contamination dedup for build_mix / distillation.
Loads the RAW test datasets directly and recursively extracts every string ≥20 chars. Run when test sets change."""
import os, argparse
from datasets import load_dataset

# task -> (hf_id, config_or_None, split)
SRC = {
    "psc":        ("allegro/klej-psc", None, "test"),
    "ppc":        ("sdadas/ppc", None, "test"),
    "dyk":        ("allegro/klej-dyk", None, "test"),
    "8tags":      ("sdadas/8tags", None, "test"),
    "polemo2_in": ("allegro/klej-polemo2-in", None, "test"),
    "nkjp_ner":   ("allegro/klej-nkjp-ner", None, "test"),
    "cdsc_e":     ("allegro/klej-cdsc-e", None, "test"),
    "cdsc_r":     ("allegro/klej-cdsc-r", None, "test"),
    "cbd":        ("allegro/klej-cbd", None, "test"),
    "ar":         ("allegro/klej-allegro-reviews", None, "test"),
    "belebele":   ("facebook/belebele", "pol_Latn", "test"),
}

def norm(s):
    return " ".join(str(s).lower().split())

def walk(o, out):
    if isinstance(o, str):
        if len(o) >= 20:
            out.add(norm(o))
    elif isinstance(o, dict):
        for v in o.values(): walk(v, out)
    elif isinstance(o, (list, tuple)):
        for v in o: walk(v, out)

ap = argparse.ArgumentParser()
ap.add_argument("--tasks", default=",".join(SRC))
ap.add_argument("--out", default="runs/test_atoms.txt")
a = ap.parse_args()

atoms = set()
failed = []
for t in a.tasks.split(","):
    if t not in SRC:
        print(f"[atoms] {t}: unknown, skip"); continue
    hf, cfg, split = SRC[t]
    try:
        ds = load_dataset(hf, cfg, split=split) if cfg else load_dataset(hf, split=split)
        before = len(atoms)
        for row in ds:
            walk(row, atoms)
        print(f"[atoms] {t}: +{len(atoms)-before} (total {len(atoms)})")
    except Exception as e:
        failed.append(t)
        print(f"[atoms] {t} FAILED: {str(e)[:80]}")

if failed:
    # częściowy plik atomów = cicho osłabiona gwarancja dedupu w CAŁYM pipeline -> nie zapisujemy
    raise SystemExit(f"[atoms] PRZERWANO: nie pobrano {failed} — NIE zapisuję częściowego {a.out}. "
                     f"Napraw pobieranie albo zawęź --tasks świadomie.")
os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
open(a.out, "w").write("\n".join(sorted(atoms)))
print(f"[atoms] wrote {len(atoms)} test atoms -> {a.out}")
