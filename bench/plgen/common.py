#!/usr/bin/env python3
"""PL-GEN — wspólny moduł (A0).

Minimalna baza dla Layer A (grammar_check), generacji (bench_plgen) i panelu
sędziów (judge_panel). Styl skopiowany z bench/polnative_eval.py — ten sam
http_json / ask / MODELS / koperta wyniku. NIE rozbudowywać spekulacyjnie.

Bez wywołań sieciowych przy imporcie. ollama: http://127.0.0.1:11434/api/chat
(think=False). openrouter: klucz z env OPENROUTER_API_KEY lub ~/.openrouter_key,
reasoning wyłączony. <think>...</think> jest strippowane z odpowiedzi.
"""

import json
import os
import re
import time

# --- ścieżki (dane prywatne pod slayer-data/, gitignored; master w repo datasets) ---
DATA = "slayer-data/plgen/prompts_v1.jsonl"  # zamrożone prompty (eval_only)
GOLD = "slayer-data/plgen/gold_v1.jsonl"  # gold od człowieka (1-5 + pass/fail)
RUNS = "slayer-data/plgen/runs"  # detal per item, do debugu — nie do decyzji
OUT = "public/results/plgen_v1.json"  # tylko agregaty -> ręcznie do matrix.json

OLLAMA = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")


def _or_key():
    """Klucz OpenRouter: env albo ~/.openrouter_key. Leniwie — dopiero gdy trzeba."""
    k = os.environ.get("OPENROUTER_API_KEY")
    if k:
        return k.strip()
    p = os.path.expanduser("~/.openrouter_key")
    return open(p).read().strip() if os.path.exists(p) else ""


def _gemini_key():
    """Klucz Gemini: env GEMINI_API_KEY albo ~/.gemini_key. Leniwie."""
    k = os.environ.get("GEMINI_API_KEY")
    if k:
        return k.strip()
    p = os.path.expanduser("~/.gemini_key")
    return open(p).read().strip() if os.path.exists(p) else ""


# --- modele oceniane (task.md #7), każdy na temp. rekomendowanej przez wydawcę ---
# (backend, tag, publisher_temp). Modele 27B/31B NIE są pulled lokalnie -> idą
# przez OpenRouter. Tylko Bielik-11B-v3 jest lokalny (ollama, pulled 2026-06-14).
#
# Tagi OpenRouter POTWIERDZONE przez GET /api/v1/models (2026-06-14):
#   qwen/qwen3.5-27b      -> "Qwen: Qwen3.5-27B"   (POTWIERDZONY)
#   qwen/qwen3.6-27b      -> "Qwen: Qwen3.6 27B"   (POTWIERDZONY)
#   google/gemma-4-31b-it -> "Google: Gemma 4 31B" (POTWIERDZONY)
# UWAGA: OpenRouter wystawia tylko JEDEN id qwen3.5-27b (brak osobnego wariantu
# -base / -instruct). 'qwen35_instruct' mapujemy na potwierdzony qwen/qwen3.5-27b.
# Rozróżnienie base-vs-instruct ZARZUCONE: brak dostępnego źródła wersji bazowej
# (żaden provider nie wystawia qwen3.5-27b -base) -> uruchamiamy 4 dostępne podmioty.
MODELS = {
    # POTWIERDZONY tag (pulled lokalnie)
    "bielik": ("ollama", "hf.co/speakleash/Bielik-11B-v3.0-Instruct-GGUF:Q4_K_M", 0.2),
    "qwen35_instruct": ("openrouter", "qwen/qwen3.5-27b", 0.7),  # POTWIERDZONY
    "qwen36": ("openrouter", "qwen/qwen3.6-27b", 0.7),  # POTWIERDZONY
    "gemma4": ("openrouter", "google/gemma-4-31b-it", 1.0),  # POTWIERDZONY
}

SYS = "Jesteś pomocnym asystentem. Odpowiadasz po polsku, naturalnie i poprawnie."


def is_placeholder(tag):
    """Tag modelu/sędziego bez realnego źródła (TODO) -> pomijany w gen/score/panelu."""
    return "__PLACEHOLDER" in tag


def http_json(url, body, headers, timeout=180, tries=3):
    import urllib.request

    for a in range(tries):
        try:
            req = urllib.request.Request(
                url, data=json.dumps(body).encode(), headers=headers
            )
            return json.loads(urllib.request.urlopen(req, timeout=timeout).read())
        except Exception as e:
            if a == tries - 1:
                print("  err:", str(e)[:70])
                return None
            time.sleep(2 * (a + 1))


def strip_think(s):
    return re.sub(r"<think>.*?</think>", " ", s or "", flags=re.S).strip()


def ask(backend, tag, temp, prompt, num_predict=700, seed=None, system=None, num_ctx=None):
    """Zadaj prompt modelowi. Zwraca tekst (po strip_think). Brak klucza/sieci -> ''.

    seed (opcjonalny): dla reprodukowalności. ollama -> options.seed; openrouter ->
    pole 'seed' w body (działa tam, gdzie backend to wspiera). None = pomiń.

    system (opcjonalny): nadpisuje systemowy prompt. None -> generyczny SYS (generacja).
    Panel sędziów podaje swój JUDGE_SYS, żeby model OCENIAŁ, a nie odpowiadał na zadanie.

    num_ctx (opcjonalny): rozmiar okna kontekstu. ollama -> options.num_ctx (mniejszy
    ctx = mniejszy KV cache = model mieści się na GPU bez offloadu na CPU; nasze prompty
    ~40 tok, wyjścia ~300 tok). openrouter ignoruje (provider sam zarządza). None = pomiń.
    """
    sys_msg = system or SYS
    if backend == "ollama":
        opts = {"temperature": temp, "num_predict": num_predict}
        if seed is not None:
            opts["seed"] = seed
        if num_ctx is not None:
            opts["num_ctx"] = num_ctx
        d = http_json(
            f"{OLLAMA}/api/chat",
            {
                "model": tag,
                "stream": False,
                "think": False,
                "options": opts,
                "messages": [
                    {"role": "system", "content": sys_msg},
                    {"role": "user", "content": prompt},
                ],
            },
            {"Content-Type": "application/json"},
            timeout=300,
        )
        ans = (d or {}).get("message", {}).get("content", "")
    elif backend == "gemini":
        # UWAGA: Gemini to model ZAMKNIĘTY (closed-weight). W Slayerze obowiązuje
        # reguła "sędzia musi być otwartowagowy", więc Gemini wolno użyć WYŁĄCZNIE
        # jako DIAGNOSTYCZNY/sufitowy punkt odniesienia (ile błędów wyłapuje silny
        # sędzia) — NIGDY jako opublikowany scorer i NIGDY w domyślnym PANEL-u.
        # Endpoint OpenAI-compatible: model id bez prefiksu "models/", Bearer key.
        # Gemini 3.1 Pro to model "myślący": część budżetu max_tokens idzie na
        # reasoning (completion_tokens=0, finish_reason=length przy małym budżecie)
        # -> dajemy hojny budżet, nie mniej niż ~2000 tokenów.
        body = {
            "model": tag,
            "temperature": temp,
            "max_tokens": max(num_predict, 2048),
            "messages": [
                {"role": "system", "content": sys_msg},
                {"role": "user", "content": prompt},
            ],
        }
        d = http_json(
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            body,
            {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + _gemini_key(),
            },
        )
        ans = ((d or {}).get("choices") or [{}])[0].get("message", {}).get(
            "content"
        ) or ""
    else:
        body = {
            "model": tag,
            "temperature": temp,
            "max_tokens": num_predict,
            "reasoning": {"enabled": False},
            "messages": [
                {"role": "system", "content": sys_msg},
                {"role": "user", "content": prompt},
            ],
        }
        if seed is not None:
            body["seed"] = seed
        d = http_json(
            "https://openrouter.ai/api/v1/chat/completions",
            body,
            {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + _or_key(),
            },
        )
        ans = ((d or {}).get("choices") or [{}])[0].get("message", {}).get(
            "content"
        ) or ""
    return strip_think(ans)


# --- schemat promptu (zgodny z PLGEN_PLAN.md) ---
# {"id","domena","prompt","rubryka","phenomena":[...],"len_target":int}
PROMPT_KEYS = ("id", "domena", "prompt", "rubryka", "phenomena", "len_target")


def load_prompts(path):
    """Wczytaj JSONL z promptami; waliduje wymagane klucze. Zwraca listę dictów."""
    items = []
    with open(path, encoding="utf-8") as f:
        for ln, line in enumerate(f, 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            it = json.loads(line)
            miss = [k for k in PROMPT_KEYS if k not in it]
            if miss:
                raise ValueError(f"{path}:{ln} brak kluczy: {miss}")
            if not isinstance(it["phenomena"], list):
                raise ValueError(f"{path}:{ln} 'phenomena' musi być listą")
            if not isinstance(it["len_target"], int):
                raise ValueError(f"{path}:{ln} 'len_target' musi być int")
            items.append(it)
    return items


_TOK_RE = re.compile(r"\w+", re.UNICODE)


def count_tokens(text):
    """Prosty licznik tokenów (regex \\w+) do normalizacji długości.

    Leniwie: bez tokenizera. Wystarczy do errors/100tok i guardu min. długości.
    """
    return len(_TOK_RE.findall(text or ""))
