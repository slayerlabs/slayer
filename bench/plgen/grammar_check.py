#!/usr/bin/env python3
"""PL-GEN Layer A — gramatyka „w biegu" przez self-hostowany LanguageTool (A1).

Deterministyczny szkielet metryki: liczymy błędy morfoskładniowe (i pochodne)
na 100 tokenów w swobodnym, długim tekście modelu. To oś „błędy w naturze",
komplementarna do PolNative (który sprawdza wymuszone formy na krótkich probach).

LanguageTool jest precyzyjny, a nie czuły (niski recall dla polskiego) — wynik
to DOLNA GRANICA gęstości błędów. To celowe: backbone ma nie dawać false-positivów.

Środowisko (zweryfikowane): obraz przypięty `erikvl87/languagetool:6.5`,
  docker run -d --name plgen-lt -p 8010:8010 erikvl87/languagetool:6.5
endpoint: POST http://127.0.0.1:8010/v2/check  (form-encoded language=pl-PL&text=...)
odpowiedź JSON: matches[] z rule.id, rule.category.id, offset, length, message.

Bez heavy deps — stdlib (urllib), spójnie z common.py. Reużywa common.count_tokens.

CLI:  python bench/plgen/grammar_check.py <plik.jsonl>
  Linie to {"ans": "..."} (klucz 'ans' lub 'text'), albo zwykły tekst per linia.
"""
import json
import subprocess
import sys
import time
import urllib.parse
import urllib.request

# import jak w testach/conftest: root repo na sys.path -> 'from bench.plgen ...'
try:
    from bench.plgen.common import count_tokens
except ImportError:  # uruchomienie bezpośrednie: dołóż root repo do ścieżki
    import os
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    from bench.plgen.common import count_tokens

# --- konfiguracja przypiętego LanguageTool (reprodukowalność) ---
LT_IMAGE = "erikvl87/languagetool:6.5"   # PRZYPIĘTY tag
LT_CONTAINER = "plgen-lt"
LT_PORT = 8010

# --- guard min. długości (anti-gaming) ---
# Krótki, mdły tekst trywialnie „wygrywa" metrykę (0 błędów na 5 słów).
# Poniżej progu dokument jest oznaczany too_short i NIE wchodzi do agregatów.
MIN_TOKENS = 40

# --- MAPOWANIE rule/category -> bucket -------------------------------------
# Zaobserwowane na żywym LT 6.5 / pl-PL (sondy 2026-06-14/16, 200 odpowiedzi
# 4 modeli). LT ma niski recall dla zgody (np. „Widzę ten książkę", „Dwa kobiety"
# NIE są łapane — potwierdzona sonda recall: 3/10 klasycznych błędów morfo), ale
# to co łapie, klasyfikujemy tu deterministycznie. Najpierw rule.id (najprecyzyjniej),
# potem category.id, na końcu fallback 'other'.
#
# REALNE rule.id zaobserwowane (TEXT -> rule.id | category.id):
#   "Idę z mamą do sklep"          -> PREP_CASUS           | SYNTAX   (przyimek+przypadek)
#   "On pisze list do brat."        -> PREP_CASUS           | SYNTAX
#   "Ona poszedł do domu."          -> DISAGREEMENT_VERB_PPRON | SYNTAX (zgoda czas.+zaimek)
#   "To jest bardziej lepsze..."    -> BARDZIEJ_COMP        | SYNTAX   (stopniowanie)
#   "napewno" / "wogóle" / "Idziem" -> MORFOLOGIK_RULE_PL_PL| TYPOS    (literówka/pisownia)
#   "Poszłem do domu."              -> PL_SIMPLE_REPLACE    | PRAWDOPODOBNE_LITEROWKI
#   "W dniu dzisiejszym"            -> DZIEN_DZISIEJSZY     | REDUNDANCY
#   "...największy największy..."   -> WORD_REPEAT_RULE     | MISC      -> 'other'
#
# --- SZUM TYPOGRAFICZNY (wyłączany na poziomie API, NIE liczony) ------------
# Sonda na 200 odpowiedziach: 1119/1705 (66%) matchy lądowało w 'other', niemal
# w całości to typografia/formatowanie markdown, a NIE błędy polszczyzny modelu:
#   BRAK_SPACJI/BRAK_SPACJI_NAWIAS/WHITESPACE_RULE -> markdown („**Składniki:** -")
#   DYWIZ            -> dywiz „-" zamiast pauzy „–" (typografia)
#   PL_UNPAIRED_BRACKETS -> polskie cudzysłowy „..." (typografia)
#   NIETYPOWA_KOMBINACJA_DUZYCH_I_MALYCH_LITER -> #hashtagi, camelCase nicków/nazw
#   POZA_TYM/BOWIEM_ZAS/SKROTY_Z_KROPKA/ZDANIA_ZLOZONE/BRAK_PRZECINKA_* -> stylistyka
#     interpunkcji / szyku (preferencje, nie błędy gramatyki)
# Wyłączamy je przez disabledRules/disabledCategories w /v2/check, dzięki czemu
# bucket 'other' staje się sensowny (realne „inne" błędy gramatyczne), a nie
# miara ilości markdownu. Schemat 4 bucketów zachowany.
DISABLED_CATEGORIES = (
    "TYPOGRAPHY",   # DYWIZ, BRAK_SPACJI*, WHITESPACE_RULE, COMMA_PARENTHESIS_WHITESPACE
    "CASING",       # NIETYPOWA_KOMBINACJA... (#hashtagi, camelCase), UPPERCASE_SENTENCE_START
)
DISABLED_RULES = (
    "PL_UNPAIRED_BRACKETS",   # cudzysłowy „..."
    "POZA_TYM",               # preferencja przecinka po wtrąceniu
    "BOWIEM_ZAS",             # szyk „Ale/Lecz" na początku zdania
    "ZDANIA_ZLOZONE",         # preferencja interpunkcji w zdaniu złożonym
    "SIE_SENT_END",           # „się" na końcu zdania (szyk)
    "SKROTY_Z_KROPKA",        # kropka po skrócie
    "BRAK_PRZECINKA_SPOJNIK_PROSTY",
    "BRAK_PRZECINKA_TEN_CO",
    "BRAK_PRZECINKA_JESLI",
    "DODATKOWO",              # przecinek po wyrażeniu wprowadzającym
)

# category.id -> bucket (sygnał stabilny między wersjami LT; po szumie typograf.)
CATEGORY_BUCKET = {
    # morfoskładnia: zgoda, przypadek, rodzaj, gramatyka
    "GRAMMAR": "morphosyntax",
    "SYNTAX": "morphosyntax",          # PREP_CASUS, *_UNIFY, PCON_VERB, ZAIMKI_*
    "COMPOUNDING": "morphosyntax",     # pisownia łączna/rozdzielna (zjawisko gram.)
    # pisownia / literówki
    "TYPOS": "spelling",               # MORFOLOGIK_RULE_PL_PL
    "PRAWDOPODOBNE_LITEROWKI": "spelling",  # PL_SIMPLE_REPLACE
    "SPELLING": "spelling",            # NIE_RZECZOWNIK i pokrewne
    # styl
    "STYLE": "style",                  # POSIADAC_MIEC, W_NAWIAZANIU_DO
    "REDUNDANCY": "style",             # pleonazmy: DZIEN_DZISIEJSZY, OKRES_CZASU
    "PLAIN_ENGLISH": "style",
    "WORDINESS": "style",
    "CREATIVE_WRITING": "style",
    # SEMANTICS, NUMBERS, PUNCTUATION, MISC, WORD_ORDER, PHONETICS -> 'other'
}

# heurystyka po rule.id (gdy category nie wystarcza) — fragmenty w nazwie reguły.
# Sprawdzane PRZED category, bo rule.id jest najprecyzyjniejszy (np. CASING
# UPPERCASE_SENTENCE_START to realny błąd zdania, choć cała kat. CASING to szum).
RULEID_KEYWORDS = (
    ("morphosyntax", ("AGREEMENT", "DISAGREEMENT", "REKCJA", "CASUS", "CASE",
                      "GENDER", "ZGODA", "PREP_", "_COMP", "_UNIFY", "NIEZGODNO",
                      "PCON", "ZAIMK")),
    ("spelling", ("MORFOLOGIK", "SPELL", "LITEROWK", "TYPO")),
    ("style", ("REDUNDAN", "PLEONA", "STYL", "WORDINESS")),
)

BUCKETS = ("morphosyntax", "spelling", "style", "other")


def bucket_for(match):
    """Zwróć bucket dla jednego matcha LT. rule.id heurystyka -> category.id -> other."""
    rule = match.get("rule", {})
    rid = (rule.get("id") or "").upper()
    for bucket, keys in RULEID_KEYWORDS:
        if any(k in rid for k in keys):
            return bucket
    cat = (rule.get("category") or {}).get("id", "")
    return CATEGORY_BUCKET.get(cat, "other")


# --- klient LanguageTool ----------------------------------------------------
def _lt_alive(base_url, timeout=2):
    try:
        urllib.request.urlopen(base_url + "/v2/languages", timeout=timeout).read()
        return True
    except Exception:
        return False


def ensure_lt(port=LT_PORT):
    """Zapewnij działający LanguageTool; zwróć base_url.

    Leniwie: najpierw sprawdź czy już odpowiada. Jeśli nie — reużyj istniejący
    kontener plgen-lt (start) albo uruchom przypięty obraz. Czekaj aż wstanie.
    """
    base = f"http://127.0.0.1:{port}"
    if _lt_alive(base):
        return base
    # spróbuj wystartować istniejący kontener; jak nie ma — docker run
    started = subprocess.run(
        ["docker", "start", LT_CONTAINER],
        capture_output=True, text=True).returncode == 0
    if not started:
        subprocess.run(
            ["docker", "run", "-d", "--name", LT_CONTAINER,
             "-p", f"{port}:8010", LT_IMAGE],
            capture_output=True, text=True, check=True)
    for _ in range(60):  # do 60 s na rozgrzanie JVM
        if _lt_alive(base):
            return base
        time.sleep(1)
    raise RuntimeError(f"LanguageTool nie wstał na {base}")


def check(text, base_url):
    """POST /v2/check (form-encoded, pl-PL). Zwraca listę matches[] (może być pusta).

    Wyłącza szum typograficzny/interpunkcyjny (disabledCategories/disabledRules),
    żeby liczyć błędy POLSZCZYZNY, a nie formatowania markdown / pauz / cudzysłowów.
    """
    params = {
        "language": "pl-PL",
        "text": text or "",
        "disabledCategories": ",".join(DISABLED_CATEGORIES),
        "disabledRules": ",".join(DISABLED_RULES),
    }
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(base_url + "/v2/check", data=data,
                                 headers={"Content-Type": "application/x-www-form-urlencoded"})
    resp = json.loads(urllib.request.urlopen(req, timeout=60).read())
    return resp.get("matches", [])


# --- scoring ----------------------------------------------------------------
def score_doc(text, base_url):
    """Oceń jeden dokument. Zwraca dict z surowymi licznikami i errors/100tok.

    Klucze: counts{bucket:int}, n_tokens, errors_per_100tok{bucket:float},
    n_matches, too_short(bool).
    """
    n_tokens = count_tokens(text)
    too_short = n_tokens < MIN_TOKENS
    matches = check(text, base_url)
    counts = {b: 0 for b in BUCKETS}
    for m in matches:
        counts[bucket_for(m)] += 1
    # normalizacja na 100 tokenów; przy 0 tokenów -> 0.0 (unik dzielenia przez 0)
    per100 = {b: (100.0 * counts[b] / n_tokens if n_tokens else 0.0) for b in BUCKETS}
    return {
        "counts": counts,
        "n_tokens": n_tokens,
        "n_matches": len(matches),
        "errors_per_100tok": per100,
        "too_short": too_short,
    }


def score_docs(texts, base_url):
    """Agreguj wiele dokumentów. Dokumenty too_short są pomijane w średnich.

    Zwraca TYLKO agregaty: mean_errors_per_100tok{bucket}, total_counts{bucket},
    total_tokens, n_docs, n_scored, n_too_short.
    """
    scored = [score_doc(t, base_url) for t in texts]
    used = [s for s in scored if not s["too_short"]]
    totals = {b: sum(s["counts"][b] for s in used) for b in BUCKETS}
    total_tokens = sum(s["n_tokens"] for s in used)
    mean = {b: (sum(s["errors_per_100tok"][b] for s in used) / len(used) if used else 0.0)
            for b in BUCKETS}
    return {
        "mean_errors_per_100tok": mean,
        "total_counts": totals,
        "total_tokens": total_tokens,
        "n_docs": len(scored),
        "n_scored": len(used),
        "n_too_short": len(scored) - len(used),
    }


# --- CLI --------------------------------------------------------------------
def _read_texts(path):
    """Wczytaj teksty: {"ans":..} / {"text":..} JSONL, albo zwykły tekst per linia."""
    out = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                out.append(obj.get("ans") or obj.get("text") or "")
            except json.JSONDecodeError:
                out.append(line)
    return out


def main(argv):
    if len(argv) != 2:
        print("użycie: python bench/plgen/grammar_check.py <plik.jsonl>", file=sys.stderr)
        return 2
    base = ensure_lt()
    texts = _read_texts(argv[1])
    agg = score_docs(texts, base)
    print(json.dumps(agg, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
