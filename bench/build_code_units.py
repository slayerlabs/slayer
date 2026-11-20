"""Jednostki generacji z tekstu jednolitego kodeksu (PDF z api.sejm.gov.pl/eli) — slayer#8.

Wejście: PDF obwieszczenia z tekstem jednolitym (born-digital, bez OCR). `pdftotext -layout`
-> czyszczenie (nagłówki stron "Dziennik Ustaw –N– Poz. X", bloki przypisów, wycentrowane
nagłówki KSIĘGA/TYTUŁ/DZIAŁ/Rozdział, znaczniki przypisów doklejone do słów, dzielenie wyrazów)
-> artykuły -> jednostki: każdy § osobno, artykuł bez § w całości. Artykuły i § "(uchylony)"
są pomijane. Indeksy górne `449[1]` -> `449¹`.

Wyjście: JSONL gotowy dla gen_legal_mcq.py (pola: id, act, article, para, cite, text,
article_text, eli, state, prefix).

Usage: build_code_units.py PDF --act k.c. --eli DU/2026/795 --prefix "Zgodnie z Kodeksem
       cywilnym," --out units.jsonl
"""

import argparse
import json
import re
import subprocess
from collections.abc import Iterator

SUP = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")
PAGE_HEADER = re.compile(r"^\f?\s*Dziennik Ustaw\s+–\s*\d+\s*–\s+Poz\.\s*\d+\s*$")
# Przypis: kolumna 0, "N)" + typowa formuła. Punkty treści też stoją w kolumnie 0 ("1) co do..."),
# więc samo "N)" nie wystarcza — formuły zebrane z 10 kodeksów (k.c., k.p.c., k.k., k.p.k., k.s.h.,
# k.p.a., k.r.o., k.p., k.w., u.s.p.).
FOOTNOTE_START = re.compile(
    r"^\d{1,3}\)\s+(?:W brzmieniu|W tym brzmieniu|Dodan|Zdanie |Ze zmian|Zmian[ay] |Przez art"
    r"|Utraci|Ustawa utraci|Z dniem|Oznaczeni|Obecnie|Uznan|Niniejsz|Uchylon\w* przez"
    r"|Wprowadzenie do|Rozdział dodany|Dział dodany|Wejdzie w|Tytuł (?:rozdziału|działu)"
    r"|Obowiązuje do|Na podstawie|Artykuł \d)")
ART_HEAD = re.compile(r"^\s{0,12}Art\.\s+(\d+[a-z]?(?:\[\d+\])?)\.(?:\d{1,3}\)(?:\s\d{1,3}\))*(?=\s))?\s*(.*)$")
PARA_HEAD = re.compile(r"^\s*§\s*(\d+[a-z]?(?:\[\d+\])?)\.(?:\d{1,3}\)(?=\s))?\s*(.*)$", re.S)
FOOTNOTE_MARK = re.compile(r"(?<=[^\s\d(§])\d{1,3}\)(?=[\s.,;:]|$)")
STATE_DATE = re.compile(r"stanu prawnego na dzień\s+(\d{1,2}\s+\w+\s+\d{4})\s*r\.")
NOTICE_DATE = re.compile(r"z dnia\s+(\d{1,2}\s+\w+\s+\d{4})\s*r\.")
# Ślady przypisu w treści jednostki (np. przypis przechodzący przez stronę) -> jednostka pomijana.
LEAK = re.compile(r"Dz\. Urz\. UE|Dodan\w* przez art\.|W brzmieniu ustalonym|Utracił moc z dniem")
CENTERED = 15  # wcięcie, od którego linia jest wycentrowanym nagłówkiem


def sup(token: str) -> str:
    """`449[1]` -> `449¹`."""
    return re.sub(r"\[(\d+)\]", lambda m: m.group(1).translate(SUP), token)


def pdf_text(path: str) -> str:
    return subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True, text=True,
                          check=True).stdout


def legal_state(raw: str) -> str:
    """Data stanu prawnego z obwieszczenia; brak -> data samego obwieszczenia."""
    flat = re.sub(r"\s+", " ", re.sub(r"(?<=\w)-\s*\n\s*(?=\w)", "", raw[:6000]))
    m = STATE_DATE.search(flat)
    if m:
        return f"stan prawny na dzień {m.group(1)} r."
    n = NOTICE_DATE.search(flat)
    return f"stan prawny wg obwieszczenia z dnia {n.group(1)} r." if n else "stan prawny: nieustalony"


def body_lines(raw: str) -> list[str]:
    """Linie treści załącznika: bez nagłówków stron, przypisów i wycentrowanych nagłówków."""
    lines = raw.split("\n")
    start = next(i for i, ln in enumerate(lines) if ART_HEAD.match(ln) and ART_HEAD.match(ln).group(1) == "1")
    out, in_footnote = [], False
    for ln in lines[start:]:
        if PAGE_HEADER.match(ln):
            in_footnote = False
            continue
        if FOOTNOTE_START.match(ln):
            in_footnote = True
        if in_footnote or not ln.strip():
            continue
        if len(ln) - len(ln.lstrip()) >= CENTERED:
            continue
        out.append(ln)
    return out


def articles(lines: list[str]) -> Iterator[tuple[str, list[str]]]:
    """(numer artykułu, linie artykułu) w kolejności tekstu."""
    num, buf = None, []
    for ln in lines:
        m = ART_HEAD.match(ln)
        if m:
            if num is not None:
                yield num, buf
            num, buf = m.group(1), [m.group(2)]
        elif num is not None:
            buf.append(ln)
    if num is not None:
        yield num, buf


def join_lines(lines: list[str]) -> str:
    """Skleja linie: dzielenie wyrazów, punkty i § od nowej linii, reszta spacją."""
    text = ""
    for ln in (re.sub(r"\s+", " ", x).strip() for x in lines):
        if not ln:
            continue
        if text.endswith("-") and re.match(r"[a-ząćęłńóśźż]", ln) and re.search(r"\w-$", text):
            text = text[:-1] + ln
        elif re.match(r"^(§\s*\d|\d+[a-z]?(?:\[\d+\])?\)|[a-z]\)|–\s)", ln):
            text += "\n" + ln
        else:
            text += (" " if text else "") + ln
    return sup(FOOTNOTE_MARK.sub("", text)).strip()


def split_paragraphs(text: str) -> list[tuple[str | None, str]]:
    """[(numer §, tekst)]; artykuł bez § -> [(None, cały tekst)]."""
    parts = re.split(r"(?:^|\n)(?=§\s*\d)", text)
    paras = [PARA_HEAD.match(p.strip()) for p in parts if p.strip()]
    if not paras or not all(paras):
        return [(None, text)]
    return [(sup(m.group(1)), m.group(2).strip()) for m in paras]


def is_repealed(text: str) -> bool:
    return bool(re.fullmatch(r"\(?(uchylony|uchylona|pominięty|utracił moc)\)?\.?", text.strip(),
                             flags=re.I))


def units_for_article(num: str, lines: list[str], meta: dict) -> list[dict]:
    text = join_lines(lines)
    art = sup(num)
    if is_repealed(text):
        return []
    article_text = f"Art. {art}.\n{text}"[:6000]
    out = []
    for para, ptext in split_paragraphs(text):
        if is_repealed(ptext) or len(ptext) < 15 or LEAK.search(ptext):
            continue
        cite = f"art. {art}" + (f" § {para}" if para else "") + f" {meta['act']}"
        out.append({"id": re.sub(r"[^0-9a-z¹²³⁴⁵⁶⁷⁸⁹⁰]+", "_", cite.lower()).strip("_"),
                    "act": meta["act"], "article": art, "para": para, "cite": cite,
                    "text": ptext, "article_text": article_text, "eli": meta["eli"],
                    "state": meta["state"], "prefix": meta["prefix"]})
    return out


def build(pdf: str, act: str, eli: str, prefix: str) -> tuple[list[dict], dict]:
    raw = pdf_text(pdf)
    meta = {"act": act, "eli": eli, "prefix": prefix,
            "state": f"tekst jednolity {eli} ({legal_state(raw)})"}
    arts = list(articles(body_lines(raw)))
    units, seen_art, seen_cite, future = [], set(), set(), 0
    for num, lines in arts:
        # Tekst jednolity bywa z dwiema wersjami przepisu ("W tym brzmieniu obowiązuje do wejścia
        # w życie zmiany…"): pierwsze wystąpienie = obecne brzmienie, kolejne = przyszłe — pomijamy
        # cały powtórzony artykuł oraz powtórzony § w obrębie artykułu.
        if num in seen_art:
            future += 1
            continue
        seen_art.add(num)
        for u in units_for_article(num, lines, meta):
            if u["cite"] in seen_cite:
                future += 1
                continue
            seen_cite.add(u["cite"])
            units.append(u)
    missing = missing_articles(raw, units)
    return units, {"articles": len(arts), "units": len(units),
                   "skipped_later_versions": future, "missing_live_articles": missing,
                   "state": meta["state"]}


def missing_articles(raw: str, units: list[dict]) -> list[str]:
    """Kontrola pokrycia: obowiązujące nagłówki `Art. N.` w treści bez żadnej jednostki."""
    body = raw[raw.find("Załącznik do obwieszczenia"):]
    heads = re.findall(r"^\s{0,12}Art\.\s+(\d+[a-z]?(?:\[\d+\])?)\.(?:\d{1,3}\))?\s*(.*)$", body,
                       flags=re.M)
    live = {sup(n) for n, rest in heads if not re.match(r"\((uchylon|utraci|pominię)", rest)}
    got = {u["article"] for u in units}
    return sorted(live - got, key=lambda x: (int(re.match(r"\d+", x).group()), x))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("pdf")
    ap.add_argument("--act", required=True)
    ap.add_argument("--eli", required=True)
    ap.add_argument("--prefix", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    units, info = build(a.pdf, a.act, a.eli, a.prefix)
    with open(a.out, "w", encoding="utf-8") as f:
        f.writelines(json.dumps(u, ensure_ascii=False) + "\n" for u in units)
    print(json.dumps(info, ensure_ascii=False))


if __name__ == "__main__":
    main()
