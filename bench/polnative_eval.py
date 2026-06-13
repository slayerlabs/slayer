#!/usr/bin/env python3
"""PolNative v1 — benchmark poprawnej polszczyzny i polskości (eval).

Itemy: slayer-data/polnative/polnative_v1.jsonl (eval_only, NIE trenować; składane przez
make_polnative_v1.py w prywatnym repo slayer-datasets — itemy nie wchodzą do publicznego gita).

Dwa tryby scoringu:
  auto  — deterministyczny check substringów/regexów (grupy AND, alternatywy OR,
          matching lowercase na całym outputcie; "re:" = regex; cs = case-sensitive)
  judge — otwarty sędzia (Qwen3.5-122B) z rubryką per item, werdykt pass/mixed/fail

Wynik itemu: pass=1.0, mixed=0.5, fail=0.0. Auto: pełne trafienie = pass,
>=połowa grup = mixed, mniej = fail. CZYSTOŚĆ: raport = tylko agregaty
(overall, per domena, per tryb); detal per item ląduje wyłącznie w gitignorowanym
slayer-data/polnative/runs/ do debugowania artefaktów harnessu (puste odpowiedzi itp.).

Sampling: każdy model na swoim rekomendowanym (Qwen 0.7, Bielik 0.2) — to nie handicap.

Usage:
  ssh -N -L 11435:127.0.0.1:11434 simp &   # tunel, jeśli ollama na simp
  python3 bench/polnative_eval.py --models bielik,qwen27b [--workers 8]
"""
import argparse
import json
import os
import re
import time
import unicodedata
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

DATA = "slayer-data/polnative/polnative_v1.jsonl"
RUNS = "slayer-data/polnative/runs"
OUT = "public/results/polnative_v1.json"
OLLAMA = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11435")
OR_KEY = os.environ.get("OPENROUTER_API_KEY") or (
    open(os.path.expanduser("~/.openrouter_key")).read().strip()
    if os.path.exists(os.path.expanduser("~/.openrouter_key")) else "")
JUDGE = "qwen/qwen3.5-122b-a10b"

# (backend, tag, temperatura rekomendowana przez wydawcę)
MODELS = {
    "bielik": ("ollama", "hf.co/speakleash/Bielik-11B-v3.0-Instruct-GGUF:Q4_K_M", 0.2),
    "qwen9b": ("ollama", "qwen3.5:9b", 0.7),
    "qwen27b": ("openrouter", "qwen/qwen3.5-27b", 0.7),
    "slayer": ("ollama", "slayer-27b", 0.7),
}
SYS = "Jesteś pomocnym asystentem. Odpowiadasz po polsku, naturalnie i poprawnie."

WER = {"pass": 1.0, "mixed": 0.5, "fail": 0.0}


def http_json(url, body, headers, timeout=180, tries=3):
    import urllib.request
    for a in range(tries):
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers)
            return json.loads(urllib.request.urlopen(req, timeout=timeout).read())
        except Exception as e:
            if a == tries - 1:
                print("  err:", str(e)[:70]); return None
            time.sleep(2 * (a + 1))


def ask(backend, tag, temp, q):
    if backend == "ollama":
        d = http_json(f"{OLLAMA}/api/chat",
                      {"model": tag, "stream": False, "think": False,
                       "options": {"temperature": temp, "num_predict": 700},
                       "messages": [{"role": "system", "content": SYS}, {"role": "user", "content": q}]},
                      {"Content-Type": "application/json"}, timeout=240)
        ans = (d or {}).get("message", {}).get("content", "")
    else:
        d = http_json("https://openrouter.ai/api/v1/chat/completions",
                      {"model": tag, "temperature": temp, "max_tokens": 700,
                       "reasoning": {"enabled": False},
                       "messages": [{"role": "system", "content": SYS}, {"role": "user", "content": q}]},
                      {"Content-Type": "application/json", "Authorization": "Bearer " + OR_KEY})
        ans = ((d or {}).get("choices") or [{}])[0].get("message", {}).get("content") or ""
    return re.sub(r"<think>.*?</think>", " ", ans, flags=re.S).strip()


def norm(s):
    s = unicodedata.normalize("NFC", s)
    s = s.replace("»", '"').replace("«", '"').replace("„", '"').replace("”", '"')
    s = s.replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", s)


def auto_verdict(it, ans):
    cs = it["auto"].get("cs", False)
    hay = norm(ans) if cs else norm(ans).lower()
    groups = it["auto"]["musi"]
    hits = 0
    for g in groups:
        ok = False
        for alt in g:
            if alt.startswith("re:"):
                if re.search(alt[3:], hay, 0 if cs else re.I):
                    ok = True; break
            else:
                if (alt if cs else alt.lower()) in hay:
                    ok = True; break
        hits += ok
    if hits == len(groups):
        return "pass"
    return "mixed" if hits >= len(groups) / 2 else "fail"


JSYS = ("Oceniasz odpowiedź modelu w benchmarku poprawnej polszczyzny. Dostajesz: zadanie, "
        "wzorzec (gold), rubrykę i odpowiedź modelu. Stosujesz rubrykę ŚCIŚLE. "
        "Zwróć WYŁĄCZNIE JSON: {\"werdykt\": \"pass\"|\"mixed\"|\"fail\", \"powod\": \"...krótko...\"}")


def judge_verdict(it, ans):
    if not ans.strip():
        return "fail", "pusta odpowiedź (artefakt harnessu, liczony osobno)"
    d = http_json("https://openrouter.ai/api/v1/chat/completions",
                  {"model": JUDGE, "temperature": 0.0, "max_tokens": 300,
                   "reasoning": {"enabled": False},
                   "messages": [{"role": "system", "content": JSYS},
                                {"role": "user", "content":
                                 f"ZADANIE: {it['prompt']}\nGOLD: {it['gold']}\nRUBRYKA: {it['rubryka']}\n"
                                 f"ODPOWIEDŹ MODELU: {ans[:1500]}"}]},
                  {"Content-Type": "application/json", "Authorization": "Bearer " + OR_KEY})
    c = ((d or {}).get("choices") or [{}])[0].get("message", {}).get("content") or ""
    m = re.search(r"\{.*\}", c, re.S)
    try:
        j = json.loads(m.group(0))
        return (j["werdykt"] if j.get("werdykt") in WER else None), j.get("powod", "")
    except Exception:
        # fallback: JSON ucięty/niedomknięty — wyciągnij sam werdykt regexem
        m2 = re.search(r'"werdykt"\s*:\s*"(pass|mixed|fail)"', c)
        if m2:
            return m2.group(1), "powod ucięty"
        return None, "sędzia: nieparsowalny werdykt: " + c[:120]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", default="bielik,qwen27b")
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--limit", type=int, default=0, help="debug: tylko N pierwszych itemów")
    a = ap.parse_args()
    if not OR_KEY:
        raise SystemExit("BRAK klucza: OPENROUTER_API_KEY albo ~/.openrouter_key (potrzebny do sędziego)")

    items = [json.loads(l) for l in open(DATA, encoding="utf-8")]
    if a.limit:
        items = items[:a.limit]
    print(f"[polnative] {len(items)} itemów ({sum(1 for i in items if i['tryb']=='auto')} auto / "
          f"{sum(1 for i in items if i['tryb']=='judge')} judge)")

    os.makedirs(RUNS, exist_ok=True)
    results = {}
    for name in a.models.split(","):
        backend, tag, temp = MODELS[name]
        print(f"[{name}] generuję ({backend}: {tag}, temp={temp})…")
        workers = a.workers if backend == "openrouter" else 2  # ollama: nie zalewać 3090
        with ThreadPoolExecutor(max_workers=workers) as ex:
            answers = list(ex.map(lambda it: ask(backend, tag, temp, it["prompt"]), items))

        print(f"[{name}] scoruję…")
        def score(pair):
            it, ans = pair
            if it["tryb"] == "auto":
                return auto_verdict(it, ans), ""
            return judge_verdict(it, ans)
        with ThreadPoolExecutor(max_workers=12) as ex:
            verdicts = list(ex.map(score, zip(items, answers)))

        # detal tylko do gitignorowanego runs/ (debug harnessu; itemów nie oglądamy do decyzji)
        run_f = f"{RUNS}/{name}.jsonl"
        with open(run_f, "w", encoding="utf-8") as f:
            for it, ans, (v, why) in zip(items, answers, verdicts):
                f.write(json.dumps({"id": it["id"], "domena": it["domena"], "tryb": it["tryb"],
                                    "ans": ans, "werdykt": v, "powod": why}, ensure_ascii=False) + "\n")

        by = defaultdict(list)
        for it, (v, _) in zip(items, verdicts):
            if v is None:
                continue
            s = WER[v]
            by["all"].append(s)
            by["dom:" + it["domena"]].append(s)
            by["tryb:" + it["tryb"]].append(s)
        agg = {k: round(100 * sum(v) / len(v), 1) for k, v in sorted(by.items()) if v}
        empty = sum(1 for x in answers if not x.strip())
        unjudged = sum(1 for v, _ in verdicts if v is None)
        results[name] = {"backend": backend, "tag": tag, "temp": temp, "score": agg,
                         "n": len(items), "n_scored": len(by["all"]),
                         "empty_answers": empty, "judge_errors": unjudged}
        flag = f" | PUSTE: {empty} (artefakt harnessu!)" if empty else ""
        print(f"[{name}] PolNative: {agg.get('all')} (auto {agg.get('tryb:auto')}, judge {agg.get('tryb:judge')}){flag}")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    # merguj z istniejącym raportem (runy per model nie nadpisują się nawzajem)
    if os.path.exists(OUT):
        try:
            results = {**json.load(open(OUT, encoding="utf-8")).get("results", {}), **results}
        except Exception:
            pass
    json.dump({"bench": "polnative_v1", "data": DATA, "n": len(items), "judge": JUDGE,
               "skala": "pass=1, mixed=0.5, fail=0; wynik 0-100",
               "note": "eval_only; itemy w prywatnym repo slayer-datasets, nie trenować",
               "results": results}, open(OUT, "w"), ensure_ascii=False, indent=2)
    print(f"[polnative] agregaty -> {OUT}")


if __name__ == "__main__":
    main()
