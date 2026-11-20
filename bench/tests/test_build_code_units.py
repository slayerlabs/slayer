"""Testy offline dla build_code_units (slayer#8): parser tekstu jednolitego kodeksu.

Syntetyczny fragment `pdftotext -layout` z przypadkami spotkanymi w 10 kodeksach: nagłówki
stron, wycentrowane nagłówki działów, przypisy w kolumnie 0, punkty w kolumnie 0, znaczniki
przypisów doklejone do numeru artykułu, indeksy górne, dzielenie wyrazów, dwie wersje artykułu.
Uruchamialne przez `pytest` albo wprost.
"""
import os
import sys

BENCH_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BENCH_DIR not in sys.path:
    sys.path.insert(0, BENCH_DIR)

import build_code_units as b  # noqa: E402

RAW = """                      DZIENNIK USTAW
                                      O B W IE S Z CZ E N I E
                                                     z dnia 27 maja 2026 r.
     1. Ogłasza się jednolity tekst ustawy, z uwzględnieniem stanu praw-
nego na dzień 19 maja 2026 r. oraz zmian wprowadzonych:
1)   ustawą z dnia 5 sierpnia 2025 r.
                                                 Załącznik do obwieszczenia
                                                         Kodeks cywilny1)
                                                         KSIĘGA PIERWSZA
     Art. 1.2) 3) Kodeks niniejszy reguluje stosunki cywilnoprawne.
     Art. 2. (uchylony)
     Art. 3. § 1. Kto spełnia świadczenie, odpo-
wiada za szkodę.
    § 2. W szczególności dotyczy to:
1)   rzeczy ruchomych,
2)   praw majątkowych.
1)   Niniejsza ustawa w zakresie swojej regulacji wdraża dyrektywę.
Dziennik Ustaw                                                   –2–                    Poz. 795

                                                            TYTUŁ II
     Art. 4[1].6) Z chwilą urodzenia dziecko może żądać naprawienia szkód.
     Art. 5. Obecne brzmienie przepisu o terminie trzech lat.
6)   W tym brzmieniu obowiązuje do wejścia w życie zmiany, o której mowa w odnośniku 7.
Dziennik Ustaw                                                   –3–                    Poz. 795
     Art. 5. Przyszłe brzmienie przepisu o terminie sześciu lat.
     Art. 6. (utracił moc)
"""
META = {"act": "k.c.", "eli": "DU/2026/795", "prefix": "Zgodnie z Kodeksem cywilnym,",
        "state": "s"}


def _units() -> list[dict]:
    out = []
    for num, lines in b.articles(b.body_lines(RAW)):
        out += b.units_for_article(num, lines, META)
    return out


def test_legal_state_handles_hyphenated_phrase() -> None:
    assert b.legal_state(RAW) == "stan prawny na dzień 19 maja 2026 r."
    assert b.legal_state("z dnia 7 grudnia 2023 r. bez stanu") == \
        "stan prawny wg obwieszczenia z dnia 7 grudnia 2023 r."


def test_body_drops_headers_footnotes_and_headings_but_keeps_points() -> None:
    body = "\n".join(b.body_lines(RAW))
    for junk in ("Dziennik Ustaw", "Niniejsza ustawa", "W tym brzmieniu", "TYTUŁ", "KSIĘGA"):
        assert junk not in body
    assert "1)   rzeczy ruchomych," in body and "2)   praw majątkowych." in body


def test_article_heads_strip_footnote_markers_and_superscripts() -> None:
    cites = {u["cite"]: u["text"] for u in _units()}
    assert cites["art. 1 k.c."] == "Kodeks niniejszy reguluje stosunki cywilnoprawne."
    assert cites["art. 4¹ k.c."].startswith("Z chwilą urodzenia")


def test_paragraph_units_join_hyphenation_and_keep_points() -> None:
    cites = {u["cite"]: u for u in _units()}
    assert cites["art. 3 § 1 k.c."]["text"] == "Kto spełnia świadczenie, odpowiada za szkodę."
    p2 = cites["art. 3 § 2 k.c."]
    assert p2["text"] == "W szczególności dotyczy to:\n1) rzeczy ruchomych,\n2) praw majątkowych."
    assert p2["article_text"].startswith("Art. 3.\n§ 1.")
    assert "art. 2 k.c." not in cites and "art. 6 k.c." not in cites  # uchylony / utracił moc


def test_build_keeps_current_version_and_reports_coverage(monkeypatch: object = None) -> None:
    orig = b.pdf_text
    b.pdf_text = lambda path: RAW
    try:
        units, info = b.build("x.pdf", "k.c.", "DU/2026/795", "Zgodnie z Kodeksem cywilnym,")
    finally:
        b.pdf_text = orig
    art5 = [u for u in units if u["article"] == "5"]
    assert len(art5) == 1 and "trzech lat" in art5[0]["text"]
    assert info["skipped_later_versions"] == 1 and info["missing_live_articles"] == []
    assert info["state"] == "tekst jednolity DU/2026/795 (stan prawny na dzień 19 maja 2026 r.)"
    assert len({u["id"] for u in units}) == len(units)


def test_leak_guard_skips_unit_with_footnote_text() -> None:
    lines = ["§ 1. Treść właściwa.", "§ 2. Coś (Dz. Urz. UE L 218 z 14.08.2013, str. 8)."]
    cites = [u["cite"] for u in b.units_for_article("7", lines, META)]
    assert cites == ["art. 7 § 1 k.c."]


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
    print("OK")
