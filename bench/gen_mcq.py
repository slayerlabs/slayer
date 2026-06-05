#!/usr/bin/env python3
"""Generator syntetycznych polskich MCQ (Faza 2 — dane treningowe).

Źródło: polska Wikipedia (streaming) — niezależne od test-splitu LLMzSzŁ.
Autor: Hermes 35B (qwen3.5-35b-a3b @ :8088). Weryfikator: druga przebieg (TAK/NIE),
odrzuca pytania niepoprawne / nieugruntowane. Wynik: JSONL gotowy do SFT.

Usage: gen_mcq.py [N] [out.jsonl]   (N = ile zweryfikowanych MCQ chcemy)
"""
import json, re, sys, time, os, urllib.request

API = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.environ.get("GEN_MODEL", "deepseek/deepseek-v4-flash")
KEY = os.environ.get("OPENROUTER_API_KEY") or (open(os.path.expanduser("~/.openrouter_key")).read().strip()
        if os.path.exists(os.path.expanduser("~/.openrouter_key")) else "")
N = int(sys.argv[1]) if len(sys.argv) > 1 else 50
OUT = sys.argv[2] if len(sys.argv) > 2 else "slayer-data/mcq_synth.jsonl"

GEN_SYS = ("Jesteś autorem polskich testów egzaminacyjnych. Na podstawie WYŁĄCZNIE podanego fragmentu "
           "ułóż jedno rzeczowe pytanie wielokrotnego wyboru z 4 odpowiedziami (A–D), dokładnie jedną poprawną "
           "wynikającą z fragmentu; dystraktory wiarygodne, ale błędne. Nie odwołuj się do „tekstu/fragmentu” "
           "w treści pytania. Zwróć WYŁĄCZNIE JSON: "
           '{"pytanie":"...","opcje":["...","...","...","..."],"poprawna":0,"uzasadnienie":"..."} '
           "gdzie poprawna to indeks 0–3.")
VER_SYS = ("Oceniasz pytanie wielokrotnego wyboru. Czy wskazana odpowiedź jest jednoznacznie poprawna i wynika "
           "z fragmentu, a pozostałe są błędne, i pytanie jest sensowne? Odpowiedz jednym słowem: TAK albo NIE.")

def chat(sysp, usr, maxt=600):
    body = {"model": MODEL, "temperature": 0.4, "max_tokens": maxt,
            "reasoning": {"enabled": False},
            "messages": [{"role": "system", "content": sysp}, {"role": "user", "content": usr}]}
    req = urllib.request.Request(API, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json",
                                          "Authorization": "Bearer " + KEY,
                                          "HTTP-Referer": "https://slayer.fabryka.ai", "X-Title": "Slayer"})
    for a in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.loads(r.read())["choices"][0]["message"]["content"]
        except Exception as e:
            if a == 3: return ""
            time.sleep(3)

def parse_json(s):
    s = re.sub(r"<think>.*?</think>", " ", s, flags=re.S)
    m = re.search(r"\{.*\}", s, flags=re.S)
    if not m: return None
    try: return json.loads(m.group(0))
    except Exception: return None

def valid(q):
    if not isinstance(q, dict): return False
    o = q.get("opcje"); p = q.get("poprawna")
    return (isinstance(q.get("pytanie"), str) and len(q["pytanie"]) > 8
            and isinstance(o, list) and len(o) == 4 and all(isinstance(x, str) and x for x in o)
            and isinstance(p, int) and 0 <= p < 4)

def passages():
    from datasets import load_dataset
    ds = load_dataset("wikimedia/wikipedia", "20231101.pl", split="train", streaming=True)
    for r in ds:
        txt = (r.get("text") or "").strip()
        # weź pierwszy sensowny akapit (rzeczowy, nie stub)
        for para in txt.split("\n"):
            para = para.strip()
            if 400 <= len(para) <= 1400:
                yield para, r.get("title", "")
                break

def main():
    if not KEY:
        print("BRAK klucza: ustaw OPENROUTER_API_KEY albo ~/.openrouter_key", flush=True); sys.exit(1)
    os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)
    kept = tried = 0; t0 = time.time()
    with open(OUT, "w", encoding="utf-8") as f:
        for para, title in passages():
            if kept >= N: break
            tried += 1
            q = parse_json(chat(GEN_SYS, f"Fragment ({title}):\n{para}"))
            if not valid(q): continue
            letter = "ABCD"[q["poprawna"]]
            ver = chat(VER_SYS, f"Pytanie: {q['pytanie']}\nOpcje: " +
                       " ; ".join(f"{c}. {o}" for c, o in zip("ABCD", q["opcje"])) +
                       f"\nWskazana poprawna: {letter}\nFragment: {para}", maxt=8).strip().upper()
            if not ver.startswith("TAK"): continue
            rec = {"question": q["pytanie"], "options": q["opcje"], "answer": q["poprawna"],
                   "explanation": q.get("uzasadnienie", ""), "source": "wikipedia-pl", "title": title}
            f.write(json.dumps(rec, ensure_ascii=False) + "\n"); f.flush()
            kept += 1
            if kept % 10 == 0:
                print(f"  {kept}/{N} (z {tried} prób, {kept/tried*100:.0f}% accept, {time.time()-t0:.0f}s)", flush=True)
    print(f"DONE: {kept} zweryfikowanych MCQ -> {OUT}  ({tried} prób, {time.time()-t0:.0f}s)", flush=True)

if __name__ == "__main__":
    main()
