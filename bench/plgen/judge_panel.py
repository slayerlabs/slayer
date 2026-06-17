#!/usr/bin/env python3
"""PL-GEN — Layer B: ślepy panel sędziów (A3).

Oś jakości NIEZALEŻNA OD RODZINY modeli ocenianych — łata słabość PolNative
(jeden sędzia z rodziny Qwen). Panel >=3 otwartowagowych sędziów, NIE-Qwen i
niezależnych od podmiotów (Bielik, Qwen, Gemma -> więc BEZ Gemmy w panelu),
ocenia każdą generację względem `rubryka` promptu, zwraca strukturalny werdykt,
agreguje między sędziami i liczy zgodę międzysędziowską (IJA = Krippendorff alpha,
nominalna, czysty Python).

ŚLEPO: prompt sędziego NIGDY nie ujawnia, który podmiot wygenerował odpowiedź.
Greedy (temp 0), reasoning wyłączony (common.ask to robi). Parse JSON odporny na
ucięcie (regex fallback) — wzorzec z bench/polnative_eval.py:judge_verdict.

Reużywa common.ask / http_json / strip_think / _or_key — bez duplikacji HTTP.
Tylko stdlib (+ math) na IJA.

Usage (samodzielnie; A4 podepnie to do orchestratora):
  python bench/plgen/judge_panel.py --runs slayer-data/plgen/runs/gen_bielik_s42.jsonl \\
      --prompts slayer-data/plgen/prompts_v1.jsonl [--workers 8]
"""
import argparse
import json
import math
import os
import re
import sys
import threading
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor

# uruchamiane też jako goły skrypt -> dodaj root repo do sys.path
_REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

from bench.plgen import common  # noqa: E402

# werdykt -> wynik (jak w polnative: pass=1, mixed=0.5, fail=0)
WER = {"pass": 1.0, "mixed": 0.5, "fail": 0.0}

# --- PANEL (config-driven; (name, backend, tag)) ---
# WALIDOWANY, WYSYŁANY SĘDZIA (2026-06-16): pojedynczy DeepSeek-V4-Pro w trybie
# `guided`. Walidacja vs human gold (docs/PLGEN_JUDGE_NOTES.md, validate_judges.py):
# 56% exact / 100% ±1-class — otwartowagowy, dyskryminuje, niezawodny. Wybrany jako
# JEDYNY publikowany sędzia (escape z zamkniętego-Gemini i z rubber-stampingu).
#
# UWAGA: pojedynczy sędzia -> IJA (Krippendorff α) jest N/A/degeneracyjne (alpha
# liczona tylko na jednostkach o >=2 ocenach; z 1 sędzim żadna jednostka nie ma
# pary -> krippendorff_alpha zwraca umowne 1.0). Nie interpretować IJA przy 1 sędzim.
PANEL = [
    ("DeepSeek-V4-Pro", "openrouter", "deepseek/deepseek-v4-pro"),
]

# --- DIAGNOSTIC / PARKED — otwarty panel 3-sędziowski (NIE wysyłany) ---
# Llama/Mistral/Command-A: anglocentryczni, NIE-DOWYKRYWAJĄ subtelnych błędów
# polszczyzny i rubber-stampują (holistic: 198/200 pass). Walidacja guided vs human
# gold: Llama 15% exact (wciąż rubber-stamp -> DROP); Mistral 55% (drugi po DeepSeek).
# Zachowane jako wiedza/diagnostyka — NIE używać jako publikowanego sędziego.
# Tagi OpenRouter POTWIERDZONE przez GET /api/v1/models (2026-06-14):
#   meta-llama/llama-3.3-70b-instruct  -> "Meta: Llama 3.3 70B Instruct"
#   mistralai/mistral-large-2512       -> "Mistral: Mistral Large 3 2512" (pinned)
#   cohere/command-a                   -> "Cohere: Command A"
# _PANEL_PARKED = [
#     ("Llama-3.3-70B-Instruct", "openrouter", "meta-llama/llama-3.3-70b-instruct"),
#     ("Mistral-Large", "openrouter", "mistralai/mistral-large-2512"),
#     ("Command-A", "openrouter", "cohere/command-a"),
# ]

JUDGE_SYS = (
    "Oceniasz JAKOŚĆ JĘZYKOWĄ odpowiedzi w benchmarku naturalnej, poprawnej "
    "polszczyzny w dłuższym tekście. Dostajesz: ZADANIE, RUBRYKĘ oceny i ODPOWIEDŹ "
    "(autor nieznany — oceniasz ślepo, wyłącznie tekst). Stosujesz rubrykę ŚCIŚLE: "
    "oceniasz poprawność gramatyczną, rekcję, zgodę, naturalność i rejestr — NIE "
    "wiedzę faktograficzną. Zwróć WYŁĄCZNIE JSON, bez komentarza: "
    '{"werdykt": "pass"|"mixed"|"fail", "naturalnosc": 1-5, "powod": "...krótko..."}'
)

# --- STRICT: protokół "wylicz błędy NAJPIERW, werdykt POTEM" ---
# Diagnoza A-judge: sędziowie holistyczni rubber-stampują (198/200 pass, nat ~5/5,
# zero dyskryminacji). Hipoteza: holistyczny prompt pozwala sędziemu "machnąć ręką".
# STRICT wymusza ENGAGEMENT: sędzia musi NAJPIERW wyliczyć każdy błąd jako tablicę
# JSON, a DOPIERO POTEM przypisać werdykt po liczbie błędów -> trudniej rozdać same
# 'pass'. Próg: pass=0 błędów, mixed=1-2 drobne, fail=>=3 lub błąd rażący.
JUDGE_SYS_STRICT = (
    "Jesteś surowym korektorem języka polskiego w benchmarku poprawnej polszczyzny. "
    "Dostajesz: ZADANIE, RUBRYKĘ i ODPOWIEDŹ (autor nieznany — oceniasz ślepo). "
    "PROTOKÓŁ: (1) NAJPIERW przeczytaj odpowiedź zdanie po zdaniu i WYLICZ każdy "
    "błąd językowy jako tablicę JSON 'bledy', każdy błąd: "
    '{"fragment": "...", "typ": "fleksja|skladnia|rekcja|ortografia|kalka|styl|interpunkcja", "poprawka": "..."}. '
    "Szukaj realnych błędów: błędna rekcja, niezgoda, zła fleksja, ortografia, kalki "
    "językowe/AI-styl, nienaturalny styl, interpunkcja. NIE oceniasz wiedzy "
    "faktograficznej. (2) DOPIERO POTEM, na podstawie liczby błędów, przypisz "
    "werdykt: pass = 0 błędów; mixed = 1-2 drobne; fail = >=3 błędy LUB choć jeden "
    "rażący. (3) Oceń naturalnosc 1-5. Zwróć WYŁĄCZNIE jeden obiekt JSON, bez "
    "komentarza, bez markdown: "
    '{"bledy": [...], "werdykt": "pass"|"mixed"|"fail", "naturalnosc": 1-5, "powod": "...krótko..."}'
)

TEMP = 0.0          # greedy
MAX_TOKENS = 300    # werdykt jest krótki
ANS_CLIP = 4000     # PL-GEN to długie teksty; nie tnij za agresywnie


def build_judge_prompt(item, ans):
    """Prompt sędziego dla pojedynczego itemu. ŚLEPY — bez nazwy podmiotu.

    Wymusza format JSON również w wiadomości użytkownika: modele trzymają się
    formatu z ostatniej instrukcji bliżej niż z samego systemu (obserwacja A3 —
    sam JUDGE_SYS nie wystarczał, sędziowie zwracali prozę 'Ocena: pass').
    """
    return (f"ZADANIE: {item['prompt']}\n"
            f"RUBRYKA: {item['rubryka']}\n"
            f"ODPOWIEDŹ DO OCENY:\n{ans[:ANS_CLIP]}\n\n"
            "Zwróć WYŁĄCZNIE jeden obiekt JSON, bez żadnego tekstu przed ani po, "
            "bez markdown: "
            '{"werdykt": "pass"|"mixed"|"fail", "naturalnosc": <1-5>, "powod": "...krótko..."}')


def build_judge_prompt_strict(item, ans):
    """Prompt sędziego — tryb STRICT (wylicz błędy najpierw, werdykt potem).

    ŚLEPY (bez nazwy podmiotu). Powtarza protokół w wiadomości użytkownika, bo
    modele trzymają się ostatniej instrukcji bliżej (obserwacja A3). Parser i tak
    wyciąga werdykt/naturalnosc; pole 'bledy' jest dodatkiem (ignorowane przez agreg.).
    """
    return (f"ZADANIE: {item['prompt']}\n"
            f"RUBRYKA: {item['rubryka']}\n"
            f"ODPOWIEDŹ DO OCENY:\n{ans[:ANS_CLIP]}\n\n"
            "Najpierw WYLICZ każdy błąd językowy w tablicy 'bledy' "
            '({"fragment","typ","poprawka"}), POTEM przypisz werdykt po liczbie '
            "błędów (pass=0, mixed=1-2 drobne, fail=>=3 lub błąd rażący) i naturalnosc "
            "1-5. Zwróć WYŁĄCZNIE jeden obiekt JSON, bez tekstu przed ani po, bez "
            'markdown: {"bledy": [...], "werdykt": "pass"|"mixed"|"fail", '
            '"naturalnosc": <1-5>, "powod": "...krótko..."}')


# --- GUIDED: zakotwiczenie per-item na `phenomena` (najwyższa dźwignia) ---
# Diagnoza (docs/PLGEN_JUDGE_NOTES.md): holistyczny sędzia rubber-stampuje, bo
# dostaje WYŁĄCZNIE generyczną prozę "czy to dobra polszczyzna?" — bez kotwicy.
# STRICT (wylicz błędy) na słabym, anglocentrycznym sędzim nie wytwarza
# kompetencji: bez celu sędzia albo nic nie znajduje, albo zgaduje "mixed" — stąd
# kolaps do jednolitego "mixed" (zero spreadu).
#
# Dlaczego PolNative DZIAŁA (bench/polnative_eval.py:judge_verdict): sędzia
# dostaje GOLD + KONKRETNĄ rubrykę per item — to zadanie SPRAWDZANIA wg kotwicy,
# nie otwartej oceny. PL-GEN jest emergentny, więc nie ma jednego GOLD-a — ale
# KAŻDY prompt niesie listę `phenomena` (np. ["szukać+D","swój vs jego"]) celowo
# wstrzykniętą do zadania. To NASZA kotwica: wstrzykujemy te zjawiska wprost i
# każemy sędziemu sprawdzić KAŻDE z osobna — zamieniamy mglistą ocenę holistyczną
# w celowany check w stylu PolNative. Plus: anty-leniency (modele ZNANE z subtelnych
# błędów PL), krótka taksonomia błędów, progi pass/mixed/fail, oraz IGNORUJ ucięcie
# (część odpowiedzi obcina budżet tokenów — artefakt harnessu, NIE błąd modelu).
JUDGE_SYS_GUIDED = (
    "Jesteś surowym korektorem i lektorem języka polskiego w benchmarku poprawnej "
    "polszczyzny. To benchmark, w którym oceniane modele są ZNANE z popełniania "
    "SUBTELNYCH błędów polszczyzny (błędna rekcja przypadka, brak zgody "
    "liczby/rodzaju/przypadka, zła fleksja/odmiana, kalki językowe i sztuczny "
    "'AI-styl', nienaturalna składnia, interpunkcja). Twoim zadaniem jest AKTYWNIE "
    "je TROPIĆ — NIE bądź pobłażliwy, nie rozdawaj 'pass' z grzeczności. "
    "Dostajesz: ZADANIE, listę ZJAWISK które to zadanie celowo testuje, RUBRYKĘ i "
    "ODPOWIEDŹ (autor nieznany — oceniasz ślepo, wyłącznie tekst). "
    "PROTOKÓŁ: (1) Dla KAŻDEGO zjawiska z listy ZJAWISKA sprawdź, czy odpowiedź je "
    "realizuje poprawnie; zgłoś KAŻDE naruszenie. (2) Poza listą wychwyć też inne "
    "realne błędy językowe (taksonomia: fleksja, skladnia, rekcja, zgoda, "
    "ortografia, kalka, styl, interpunkcja). Każdy błąd jako element tablicy 'bledy': "
    '{"fragment": "...", "typ": "...", "poprawka": "..."}. '
    "NIE oceniasz wiedzy faktograficznej — tylko język. "
    "WAŻNE: odpowiedź bywa UCIĘTA przez limit tokenów (artefakt harnessu). Oceniaj "
    "WYŁĄCZNIE polszczyznę tekstu, który JEST — NIE karz za brak zakończenia, "
    "niedokończone zdanie na końcu ani niekompletność. "
    "(3) Przypisz werdykt po liczbie błędów: pass = 0 błędów (w tym wszystkie "
    "zjawiska poprawne); mixed = 1-2 drobne błędy; fail = >=3 błędy LUB choć jeden "
    "rażący LUB naruszenie któregokolwiek z testowanych zjawisk. (4) Oceń "
    "naturalnosc 1-5 (5 = w pełni naturalna, rodzima polszczyzna; 1 = sztuczna/"
    "kalkowana/błędna). Zwróć WYŁĄCZNIE jeden obiekt JSON, bez komentarza, bez "
    'markdown: {"bledy": [...], "werdykt": "pass"|"mixed"|"fail", '
    '"naturalnosc": 1-5, "powod": "...krótko..."}'
)

# Krótki przykład kalibracyjny (jeden, by nie rozdmuchać tokenów): pokazuje
# OCZEKIWANY poziom czujności — drobny błąd rekcji = wykryty, werdykt mixed.
_GUIDED_CALIB = (
    "PRZYKŁAD KALIBRACJI (wzorzec czujności, nie oceniaj go):\n"
    "  Fragment: \"Poszukuję doświadczonego specjalisty, który pomoże mi "
    "rozwiązać ten problem i udzieli mi porada.\"\n"
    "  -> bledy: [{\"fragment\":\"udzieli mi porada\",\"typ\":\"rekcja\","
    "\"poprawka\":\"udzieli mi porady\"}]; werdykt: \"mixed\"; naturalnosc: 4 "
    "(jeden błąd rekcji dopełniacza; reszta poprawna).\n"
)


def build_judge_prompt_guided(item, ans):
    """Prompt sędziego — tryb GUIDED (zakotwiczenie na `phenomena`).

    ŚLEPY (bez nazwy podmiotu). Wstrzykuje listę `phenomena` z itemu jako konkretną
    kotwicę: sędzia ma sprawdzić KAŻDE zjawisko i zgłosić każde naruszenie — to
    zamienia mglistą ocenę holistyczną w celowany check w stylu PolNative.

    Brak/pusta lista `phenomena` jest obsługiwana łagodnie: degraduje do
    "brak wskazanych zjawisk — oceń ogólną poprawność", więc tryb działa też na
    promptach bez kotwicy (item['phenomena'] może być []). Powtarza protokół w
    user-message, bo modele trzymają się ostatniej instrukcji bliżej (obserwacja A3).
    Parser wyciąga werdykt/naturalnosc; pole 'bledy' jest dodatkiem (ignorowane).
    """
    phens = item.get("phenomena") or []
    if phens:
        zjawiska = "; ".join(str(p) for p in phens)
        anchor = (
            f"ZJAWISKA, które to zadanie celowo testuje (SPRAWDŹ KAŻDE w odpowiedzi "
            f"i zgłoś każde naruszenie): {zjawiska}\n")
        krok = ("Najpierw sprawdź KAŻDE z wymienionych ZJAWISK, potem wychwyć inne "
                "błędy językowe; wszystkie wpisz do tablicy 'bledy' "
                '({"fragment","typ","poprawka"}).')
    else:
        anchor = ("ZJAWISKA: (brak wskazanych — oceń ogólną poprawność i naturalność "
                  "polszczyzny)\n")
        krok = ("Wychwyć wszystkie realne błędy językowe i wpisz je do tablicy "
                "'bledy' ({\"fragment\",\"typ\",\"poprawka\"}).")
    return (f"ZADANIE: {item['prompt']}\n"
            f"{anchor}"
            f"RUBRYKA: {item['rubryka']}\n"
            f"{_GUIDED_CALIB}"
            f"ODPOWIEDŹ DO OCENY (może być ucięta — NIE karz za brak zakończenia):\n"
            f"{ans[:ANS_CLIP]}\n\n"
            f"{krok} POTEM przypisz werdykt po liczbie błędów (pass=0; mixed=1-2 "
            "drobne; fail=>=3, błąd rażący lub naruszenie testowanego zjawiska) i "
            "naturalnosc 1-5. Zwróć WYŁĄCZNIE jeden obiekt JSON, bez tekstu przed "
            'ani po, bez markdown: {"bledy": [...], "werdykt": '
            '"pass"|"mixed"|"fail", "naturalnosc": <1-5>, "powod": "...krótko..."}')


# rubryka -> (system_prompt, user_prompt_builder). Domyślnie 'holistic' = stan A3.
_RUBRIC = {
    "holistic": (JUDGE_SYS, build_judge_prompt),
    "strict": (JUDGE_SYS_STRICT, build_judge_prompt_strict),
    "guided": (JUDGE_SYS_GUIDED, build_judge_prompt_guided),
}


def _parse_verdict(c):
    """Parsuj odpowiedź sędziego -> (werdykt, naturalnosc, powod).

    Odporny: pełny JSON; fallback regexem dla ucięcia/śmieci (wzorzec z
    polnative_eval.judge_verdict). Niepoprawny werdykt/naturalnosc -> None.
    """
    c = c or ""
    m = re.search(r"\{.*\}", c, re.S)
    if m:
        try:
            j = json.loads(m.group(0))
            w = j.get("werdykt") if j.get("werdykt") in WER else None
            nat = _clean_nat(j.get("naturalnosc"))
            return w, nat, j.get("powod", "")
        except Exception:
            pass
    # fallback: JSON ucięty/niedomknięty — wyciągnij werdykt i naturalnosc regexem
    mw = re.search(r'"werdykt"\s*:\s*"(pass|mixed|fail)"', c)
    mn = re.search(r'"naturalnosc"\s*:\s*([0-9]+(?:\.[0-9]+)?)', c)
    if mw:
        return mw.group(1), _clean_nat(mn.group(1) if mn else None), "powod ucięty/odzyskany"
    return None, None, "sędzia: nieparsowalny werdykt: " + c[:120]


def _clean_nat(v):
    """naturalnosc -> float w [1,5] albo None (nie psuj średniej)."""
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f if 1.0 <= f <= 5.0 else None


def judge_one(judge, item, ans, mode="guided"):
    """Jeden sędzia ocenia jedną odpowiedź. Zwraca (werdykt, naturalnosc, powod).

    judge: (name, backend, tag). Greedy (temp 0), reasoning off (common.ask).
    Pusta odpowiedź podmiotu = artefakt harnessu -> fail bez wołania sieci.
    Parse error -> (None, None, powód).

    mode: "guided" (DOMYŚLNIE — wysyłany sędzia: zakotwiczenie na `phenomena` +
    anty-leniency + ignoruj ucięcie), "holistic" (stan A3, parked/diagnostyka)
    albo "strict" (wylicz błędy najpierw). Tryb wybiera (system_prompt, user_prompt) z _RUBRIC.
    _parse_verdict obsługuje wszystkie — pole 'bledy' (strict/guided) jest ignorowane.
    """
    _, backend, tag = judge
    if not (ans or "").strip():
        return "fail", None, "pusta odpowiedź (artefakt harnessu, liczony osobno)"
    sys_prompt, build = _RUBRIC[mode]
    prompt = build(item, ans)
    # STRICT/GUIDED każą wyliczyć WSZYSTKIE błędy -> dłuższa odpowiedź; większy budżet.
    n_pred = 1200 if mode in ("strict", "guided") else MAX_TOKENS
    c = common.ask(backend, tag, TEMP, prompt, num_predict=n_pred, system=sys_prompt)
    return _parse_verdict(c)


def _majority_verdict(verdicts):
    """Głos większościowy na werdykcie (z [pass|mixed|fail], None pominięte).

    Remis lub brak głosów -> 'mixed' (zachowawczo, jak środek skali).
    """
    votes = [v for v in verdicts if v in WER]
    if not votes:
        return "mixed"
    cnt = Counter(votes)
    top = cnt.most_common()
    if len(top) > 1 and top[0][1] == top[1][1]:
        return "mixed"
    return top[0][0]


def _mean(xs):
    xs = [x for x in xs if x is not None]
    return sum(xs) / len(xs) if xs else None


def panel_score(panel, items, answers, workers=8, stream_path=None, mode="guided"):
    """Odpal cały panel po wszystkich itemach; agreguj + IJA.

    panel: lista (name, backend, tag). Placeholderowi sędziowie są pomijani.
    items: lista dictów (schemat common.PROMPT_KEYS). answers: lista str (równolegle).
    Zwraca dict {"judges":[...], "items":[per-item...], "aggregate":{...}}.

    stream_path (opcjonalny, debug): gdy podany, każdy werdykt sędziego jest
    dopisywany na bieżąco (flush) jako linia JSON {"id","judge","werdykt",
    "naturalnosc","powod"} — diagnostyka, by widzieć postęp przed końcem.
    None = brak streamu (zachowanie wsteczne). Stream żyje TYLKO pod common.RUNS.

    Per-item (dla A4):
      {"id","domena","judges":[{"judge","werdykt","naturalnosc","powod"}...],
       "panel_werdykt","panel_score","mean_naturalnosc"}
    Aggregate:
      {"panel_score_mean"(0-100),"naturalnosc_mean","ija_alpha",
       "n_items","n_scored","n_empty","per_domena":{dom:{panel_score,naturalnosc}}}
    """
    judges = [j for j in panel if not common.is_placeholder(j[2])]
    if len(judges) < 3:
        print(f"[judge_panel] UWAGA: tylko {len(judges)} działających sędziów "
              f"(< 3); placeholdery pominięte.")

    # macierz zadań: (judge_idx, item_idx). Greedy + niezależne -> wątki ok.
    tasks = [(ji, ii) for ji in range(len(judges)) for ii in range(len(items))]

    # diag stream: dopisuj werdykt gdy gotowy (flush). Lock — wątki piszą równolegle.
    stream_f, stream_lock = None, None
    if stream_path:
        os.makedirs(os.path.dirname(stream_path) or ".", exist_ok=True)
        stream_f = open(stream_path, "w", encoding="utf-8")
        stream_lock = threading.Lock()

    def run(t):
        ji, ii = t
        w, nat, powod = judge_one(judges[ji], items[ii], answers[ii], mode=mode)
        if stream_f is not None:
            rec = {"id": items[ii]["id"], "judge": judges[ji][0],
                   "werdykt": w, "naturalnosc": nat, "powod": powod}
            with stream_lock:
                stream_f.write(json.dumps(rec, ensure_ascii=False) + "\n")
                stream_f.flush()
        return (ji, ii, w, nat, powod)

    try:
        with ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
            raw = list(ex.map(run, tasks))
    finally:
        if stream_f is not None:
            stream_f.close()

    # zbierz per item
    cells = defaultdict(dict)  # item_idx -> {judge_idx: (w, nat, powod)}
    for ji, ii, w, nat, powod in raw:
        cells[ii][ji] = (w, nat, powod)

    per_items = []
    # macierz etykiet do IJA: wiersz = sędzia, kolumna = item
    label_matrix = [[None] * len(items) for _ in judges]
    for ii, item in enumerate(items):
        jrows = []
        verdicts, nats = [], []
        for ji, judge in enumerate(judges):
            w, nat, powod = cells[ii].get(ji, (None, None, "brak"))
            jrows.append({"judge": judge[0], "werdykt": w,
                          "naturalnosc": nat, "powod": powod})
            verdicts.append(w)
            nats.append(nat)
            label_matrix[ji][ii] = w
        pw = _majority_verdict(verdicts)
        per_items.append({
            "id": item["id"], "domena": item.get("domena", ""),
            "judges": jrows,
            "panel_werdykt": pw,
            "panel_score": WER[pw],
            "mean_naturalnosc": _mean(nats),
        })

    # puste odpowiedzi (artefakt harnessu) -> Layer B liczy je jako fail, Layer A je
    # dropuje (too_short) -> denominatory różne; surfaceujemy n_empty by asymetria była
    # audytowalna (patrz judge_one: pusta odp. -> fail bez wołania sieci).
    n_empty = sum(1 for ans in answers if not (ans or "").strip())

    # agregaty dataset-level (sub-score'y osobno, nie uśredniane między osiami)
    scored = [p for p in per_items if any(j["werdykt"] in WER for j in p["judges"])]
    ps = [p["panel_score"] for p in scored]
    nat_all = [p["mean_naturalnosc"] for p in scored if p["mean_naturalnosc"] is not None]

    by_dom_ps = defaultdict(list)
    by_dom_nat = defaultdict(list)
    for p in scored:
        by_dom_ps[p["domena"]].append(p["panel_score"])
        if p["mean_naturalnosc"] is not None:
            by_dom_nat[p["domena"]].append(p["mean_naturalnosc"])

    aggregate = {
        "panel_score_mean": round(100 * _mean(ps), 1) if ps else None,
        "naturalnosc_mean": round(_mean(nat_all), 3) if nat_all else None,
        "ija_alpha": round(krippendorff_alpha(label_matrix), 4),
        "n_items": len(items),
        "n_scored": len(scored),
        "n_empty": n_empty,
        "per_domena": {
            d: {"panel_score": round(100 * _mean(by_dom_ps[d]), 1),
                "naturalnosc": round(_mean(by_dom_nat[d]), 3) if by_dom_nat[d] else None}
            for d in sorted(by_dom_ps)
        },
    }
    return {"judges": [j[0] for j in judges], "items": per_items, "aggregate": aggregate}


# ============================================================================
# IJA — Krippendorff's alpha (nominal), czysty Python (stdlib + math)
# ============================================================================
def krippendorff_alpha(label_matrix):
    """Krippendorff's alpha dla danych NOMINALNYCH.

    label_matrix: lista wierszy (po jednym na sędziego), każdy wiersz to lista
    etykiet per item (kolumna). None = brak oceny (pomijany). Alpha liczona na
    jednostkach z >=2 ocenami.

    Zwraca: 1.0 = pełna zgoda, ~0 = na poziomie losowym, <0 = systematyczny
    brak zgody. Gdy brak wariancji w danych (wszystko jedna wartość) -> 1.0.

    Wzór (coincidence matrix), nominalna funkcja różnicy delta=0 dla równych,
    1 dla różnych:
        alpha = 1 - (n-1) * Do / De
    gdzie n = łączna liczba sparowanych ocen, Do/De z macierzy koincydencji.
    """
    n_judges = len(label_matrix)
    n_items = len(label_matrix[0]) if label_matrix else 0

    # macierz koincydencji: dla każdej jednostki o m>=2 ocenach dodaj
    # 1/(m-1) za każdą uporządkowaną parę (c,k) ocen w tej jednostce.
    coincidence = defaultdict(float)  # (c, k) -> waga
    n_total = 0.0  # suma marginalna (liczba sparowanych ocen)
    for ii in range(n_items):
        vals = [label_matrix[ji][ii] for ji in range(n_judges)
                if label_matrix[ji][ii] is not None]
        m = len(vals)
        if m < 2:
            continue  # jednostka bez pary nie wchodzi do alpha
        # każda UPORZĄDKOWANA para różnych pozycji (i!=j) waży 1/(m-1)
        for i in range(m):
            for j in range(m):
                if i == j:
                    continue  # ta sama ocena z samą sobą: pomiń
                coincidence[(vals[i], vals[j])] += 1.0 / (m - 1)
        n_total += m

    if n_total == 0:
        return 1.0  # brak parowalnych danych -> umownie pełna zgoda

    # marginesy n_c = suma po k coincidence[(c,k)]
    n_c = defaultdict(float)
    for (c, k), w in coincidence.items():
        n_c[c] += w

    values = list(n_c.keys())
    if len(values) <= 1:
        return 1.0  # tylko jedna wartość w całości -> brak możliwego sporu -> zgoda

    # Do = suma po c!=k coincidence[(c,k)]  (niezgodne pary)
    Do = sum(w for (c, k), w in coincidence.items() if c != k)
    # De = (1/(n-1)) * suma po c!=k n_c*n_k
    De = 0.0
    for c in values:
        for k in values:
            if c != k:
                De += n_c[c] * n_c[k]
    De /= (n_total - 1)

    if De == 0:
        return 1.0  # brak oczekiwanego sporu (degeneracja) -> zgoda
    return 1.0 - Do / De


# ============================================================================
# CLI — score jednego pliku RUNS względem promptów (hook dla A4)
# ============================================================================
def score_runs_file(runs_path, prompts_path, panel=None, workers=8, mode="guided"):
    """Oceń jeden plik generacji (gen_*.jsonl) panelem. Zwraca wynik panel_score.

    runs_path: jsonl z polami {id, ans, domena, ...} (z bench_plgen.generate).
    prompts_path: jsonl promptów (common.load_prompts) — dostarcza rubryki.
    """
    panel = panel or PANEL
    prompts = {p["id"]: p for p in common.load_prompts(prompts_path)}
    items, answers = [], []
    with open(runs_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            pid = row["id"]
            if pid not in prompts:
                print(f"[judge_panel] UWAGA: brak promptu dla {pid} -> pomijam")
                continue
            items.append(prompts[pid])
            answers.append(row.get("ans", ""))
    return panel_score(panel, items, answers, workers=workers, mode=mode)


def main():
    ap = argparse.ArgumentParser(description="PL-GEN Layer B — panel sędziów")
    ap.add_argument("--runs", required=True, help="plik gen_*.jsonl (z bench_plgen)")
    ap.add_argument("--prompts", default=None, help="prompty (domyślnie common.DATA)")
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--out", default=None, help="zapisz JSON wyniku (opcjonalnie)")
    a = ap.parse_args()
    if not common._or_key():
        raise SystemExit("BRAK klucza: OPENROUTER_API_KEY albo ~/.openrouter_key")
    prompts_path = a.prompts or common.DATA
    res = score_runs_file(a.runs, prompts_path, workers=a.workers)
    agg = res["aggregate"]
    print(f"[judge_panel] sędziowie: {res['judges']}")
    print(f"[judge_panel] panel_score={agg['panel_score_mean']} "
          f"naturalnosc={agg['naturalnosc_mean']} IJA(alpha)={agg['ija_alpha']} "
          f"(n_scored={agg['n_scored']}/{agg['n_items']})")
    if a.out:
        # TYLKO agregaty (+ skład panelu) — NIE per-item werdykty/powody, by --out
        # pod public/ nie wyciekło detalu. Per-item detal idzie wyłącznie ścieżką RUNS.
        json.dump({"judges": res["judges"], "aggregate": agg},
                  open(a.out, "w"), ensure_ascii=False, indent=2)
        print(f"[judge_panel] -> {a.out} (tylko agregaty)")


if __name__ == "__main__":
    main()
