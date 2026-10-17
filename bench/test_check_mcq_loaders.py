#!/usr/bin/env python3
"""Samowystarczalny test walidatora loaderów MCQ. Bez sieci i bez HF - ćwiczy
czystą logikę (check_item, mojibake_warning, check_loader) na danych w pamięci.
Uruchom: python3 bench/test_check_mcq_loaders.py  (exit 0 = OK, 1 = FAIL)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from check_mcq_loaders import check_item, check_loader, mojibake_warning  # noqa: E402

FAILS = []


def check(cond, msg):
    print(("  OK  " if cond else "  FAIL") + " " + msg)
    if not cond:
        FAILS.append(msg)


GOOD = {"q": "Ile to dwa razy dwa?", "options": ["3", "4", "5", "6"], "gold": 1, "cat": "x"}

print("[test] check_item")
check(check_item(GOOD) == [], "poprawny item -> brak błędów")
check(check_item({**GOOD, "gold": 4}) != [], "gold poza zakresem (4 / 4 opcje) -> błąd")
check(check_item({**GOOD, "gold": -1}) != [], "gold ujemny -> błąd")
check(check_item({**GOOD, "gold": "1"}) != [], "gold nie-int -> błąd")
check(check_item({**GOOD, "gold": True}) != [], "gold bool (True) -> błąd (nie liczy jak 1)")
check(check_item({**GOOD, "q": "   "}) != [], "puste pytanie -> błąd")
check(check_item({**GOOD, "options": ["jedna"]}) != [], "<2 opcje -> błąd")
check(check_item({**GOOD, "options": ["a", "  "]}) != [], "pusta opcja -> błąd")

print("[test] mojibake_warning")
clean_pl = [{"q": "Jeżeli stawka wynosi 4 zł/m2, ile wyniesie należność za ścianę?"}] * 5
moj_pl = [{"q": "JeĪeli stawka wynosi 4 zá/m2, ile wyniesie naleĪnoĞü za Ğcianę?"}] * 5
no_diac_pl = [{"q": "Prosty tekst bez zadnych polskich znakow w ogole"}] * 5
check(mojibake_warning(clean_pl, "pl") == "", "czysty polski -> brak ostrzeżenia")
check(mojibake_warning(moj_pl, "pl") != "", "mojibake (Ī/á/Ğ) -> ostrzeżenie")
check(mojibake_warning(moj_pl, "en") == "", "lang=en -> heurystyka PL nieaktywna")
check(mojibake_warning(no_diac_pl, "pl") != "", "PL bez diakrytyków -> ostrzeżenie (podejrzane)")

print("[test] check_loader (z atrapami loaderów)")
ok, cnt, errs, warn = check_loader("fake_ok", lambda n, s: [GOOD] * n, "en", 5, 42)
check(ok and cnt == 5 and not errs, "loader poprawny -> ok, brak błędów")
ok, *_ = check_loader("fake_badgold", lambda n, s: [{**GOOD, "gold": 9}] * n, "en", 5, 42)
check(not ok, "loader z gold poza zakresem -> not ok (zlapane)")
def _boom(n, s):
    raise RuntimeError("boom")
ok, _, errs, _ = check_loader("fake_raise", _boom, "en", 5, 42)
check(not ok and bool(errs) and "ŁADOWANIE PADŁO" in errs[0], "loader rzucający wyjątek -> not ok (komunikat o ładowaniu)")
ok, _, errs, _ = check_loader("fake_empty", lambda n, s: [], "en", 5, 42)
check(not ok, "loader zwracający [] -> not ok")

print()
if FAILS:
    print(f"[test] FAIL: {len(FAILS)} asercji nie przeszło")
    raise SystemExit(1)
print("[test] OK: wszystkie asercje przeszły")
