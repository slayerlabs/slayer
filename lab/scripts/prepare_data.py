#!/usr/bin/env python3
"""Przygotowanie danych SFT PL (Faza 2). Trzy zrodla, lacza sie do chat-jsonl.
1) gotowe polskie zbiory instrukcyjne (HF),
2) syntetyka generowana frontierem (DeepSeek - jak Bielik) z polityki jakosci,
3) format zadan leaderboardu (MCQ/QA) BEZ kopiowania zbiorow testowych (anty-kontaminacja).
Wyjscie: data/sft_pl.jsonl  ({"messages":[{role,content}...]})
"""
import json, argparse, os

SYS = "Jestes pomocnym polskim asystentem. Odpowiadaj rzeczowo i po polsku."

def to_chat(instruction, output, system=SYS):
    return {"messages": [
        {"role": "system", "content": system},
        {"role": "user", "content": instruction},
        {"role": "assistant", "content": output}]}

def from_hf(name, split, instr_key, out_key, limit=None):
    from datasets import load_dataset
    ds = load_dataset(name, split=split)
    n = 0
    for r in ds:
        if instr_key in r and out_key in r and r[instr_key] and r[out_key]:
            yield to_chat(str(r[instr_key]), str(r[out_key])); n += 1
            if limit and n >= limit: break

def synth_deepseek_stub(prompts_path):
    """Szkielet: wygeneruj odpowiedzi PL frontierem wg ustalonej polityki jakosci.
    Tu tylko interfejs - podlacz wlasny klient (DeepSeek/inny) i politykę z dialektyki kursu."""
    if not os.path.exists(prompts_path):
        return
    for line in open(prompts_path, encoding="utf-8"):
        q = line.strip()
        if not q:
            continue
        # answer = call_frontier(q, policy=QUALITY_POLICY)   # <-- podlacz
        # yield to_chat(q, answer)
        pass

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="data/sft_pl.jsonl")
    ap.add_argument("--max_per_source", type=int, default=20000)
    a = ap.parse_args()
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    n = 0
    with open(a.out, "w", encoding="utf-8") as f:
        # przyklad zrodla HF (podmien na realne PL instrukcyjne zbiory):
        SOURCES = [
            # (nazwa_hf, split, klucz_instrukcji, klucz_odpowiedzi)
            # ("klej/...", "train", "text", "target"),
        ]
        for name, split, ik, ok in SOURCES:
            try:
                for ex in from_hf(name, split, ik, ok, a.max_per_source):
                    f.write(json.dumps(ex, ensure_ascii=False) + "\n"); n += 1
            except Exception as e:
                print(f"[skip] {name}: {e}")
        for ex in (synth_deepseek_stub("data/seed_prompts.txt") or []):
            f.write(json.dumps(ex, ensure_ascii=False) + "\n"); n += 1
    print(f"Zapisano {n} przykladow -> {a.out}")
    if n == 0:
        print("UWAGA: 0 przykladow. Uzupelnij SOURCES i/lub seed_prompts.txt.")

if __name__ == "__main__":
    main()
