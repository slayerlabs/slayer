#!/usr/bin/env python3
"""Smoke-test loaderów MCQ z bench_mcq: ładuje próbkę każdego zarejestrowanego
benchmarku i sprawdza poprawność, zanim pójdzie do pomiaru.

Łapie klasę błędów strukturalnych mapowania:
  - gold poza zakresem opcji, gold nie-int/bool, puste pytanie, < 2 opcji,
    pusta opcja -> "gold poza zakresem opcji" itp.,
  - uszkodzone kodowanie tekstu zbioru PL (mojibake, np. ż->Ī, ś->Ğ) ->
    heurystyka mojibake (warning).

Per benchmark sprawdza, że każdy item ma: niepuste pytanie, >= 2 niepuste opcje,
gold typu int w zakresie [0, len(opcji)). Dla zbiorów PL dodatkowo sygnalizuje
podejrzenie mojibake (warning, nie błąd). Diagnostyczny, uruchamiany on-demand
(loadery pobierają zbiory z HF).

UWAGA - czego NIE łapie: błędu mapowania gold, który jest "w zakresie" ale
semantycznie zły (gold wskazuje złą opcję). Tak właśnie wyglądał historyczny bug
INCLUDE-44: loader miał własny filtr 0<=gold<4, więc odrzucone (answer=0 -> -1)
i przesunięte goldy zostawały w zakresie -> walidator strukturalny by je
przepuścił. Realny sygnał tej klasy to wysoki odsetek odrzuconych wierszy albo
accuracy poniżej losowego (domena bench_mcq, nie tego skryptu). Ten walidator
łapie gołą postać klasy (gold poza zakresem) i mojibake, nie zamaskowane wariacje.

Usage:
  python3 bench/check_mcq_loaders.py [N] [bench ...]   # N itemów na benchmark (domyślnie 30)
  python3 bench/check_mcq_loaders.py 50 include arc     # wybrane benchmarki
Kod wyjścia: 1 gdy którykolwiek benchmark ma błędy strukturalne lub nie ładuje.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Znaki typowe dla źle zdekodowanego polskiego (legacy enc), nieobecne w poprawnym
# polskim tekście. Heurystyka - rozszerzalna; służy tylko do ostrzeżenia.
MOJIBAKE_SUSPECTS = set("ĪĞĉċčĝğŀ�")
PL_DIACRITICS = set("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ")


def check_item(it):
    """Lista błędów strukturalnych itemu (pusta = OK). Czysta funkcja, bez sieci."""
    errs = []
    q, opts, gold = it.get("q"), it.get("options"), it.get("gold")
    if not isinstance(q, str) or not q.strip():
        errs.append("puste pytanie")
    if not isinstance(opts, list) or len(opts) < 2:
        errs.append(f"<2 opcje ({len(opts) if isinstance(opts, list) else 'brak listy'})")
    elif any(not isinstance(o, str) or not str(o).strip() for o in opts):
        errs.append("pusta opcja")
    if not isinstance(gold, int) or isinstance(gold, bool):
        errs.append(f"gold nie-int ({gold!r})")
    elif isinstance(opts, list) and not (0 <= gold < len(opts)):
        errs.append(f"gold poza zakresem opcji ({gold} / {len(opts)})")
    return errs


def mojibake_warning(items, lang):
    """Heurystyka mojibake dla zbiorów PL: zwraca komunikat ostrzeżenia albo ''."""
    if lang != "pl" or not items:
        return ""
    qs = [str(it.get("q", "")) for it in items]
    susp = sum(1 for q in qs if any(c in MOJIBAKE_SUSPECTS for c in q)) / len(qs)
    diac = sum(1 for q in qs if any(c in PL_DIACRITICS for c in q)) / len(qs)
    if susp > 0.2:
        return f"podejrzenie mojibake: ~{susp*100:.0f}% itemów ma znaki uszkodzonego kodowania"
    if diac < 0.1:
        return f"podejrzanie mało polskich znaków diakrytycznych ({diac*100:.0f}% itemów) - zły zbiór/kodowanie?"
    return ""


def check_loader(name, loader, lang, n, seed):
    """Ładuje próbkę i waliduje. Zwraca (ok, n_items, errors[], warning)."""
    try:
        items = loader(n, seed)
    except Exception as e:
        return False, 0, [f"ŁADOWANIE PADŁO: {str(e)[:140]}"], ""
    if not items:
        return False, 0, ["0 itemów"], ""
    errs = [(i, check_item(it)) for i, it in enumerate(items)]
    errs = [(i, e) for i, e in errs if e]
    return (not errs), len(items), errs, mojibake_warning(items, lang)


def main():
    from bench_mcq import BENCHES
    n = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 30
    which = [a for a in sys.argv[1:] if not a.isdigit()] or list(BENCHES)
    seed = 42
    fail = 0
    for name in which:
        if name not in BENCHES:
            print(f"[check] {name}: NIEZNANY benchmark (dostępne: {', '.join(BENCHES)})")
            fail += 1
            continue
        loader, lang = BENCHES[name]
        ok, cnt, errs, warn = check_loader(name, loader, lang, n, seed)
        status = "OK" if ok else f"!!! {len(errs)} itemów z błędami"
        wtxt = f" | UWAGA: {warn}" if warn else ""
        print(f"[check] {name} ({lang}): {cnt} itemów -> {status}{wtxt}")
        for i, e in errs[:3]:
            print(f"    item {i}: {', '.join(e)}")
        if not ok:
            fail += 1
    print(f"\n[check] {'WSZYSTKO OK' if not fail else f'{fail} benchmarków z problemami'}")
    raise SystemExit(1 if fail else 0)


if __name__ == "__main__":
    main()
