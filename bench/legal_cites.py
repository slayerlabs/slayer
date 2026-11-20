"""Cytowania Konstytucji RP w polu `legal_basis` pytań egzaminacyjnych.

Parsuje napisy typu "art. 227 ust. 3 Konstytucji RP" / "art. 192 w zw. z art. 189
Konstytucji Rzeczypospolitej Polskiej" na krotki (artykuł, ustęp, punkt) i podpina
tekst przepisu z `konstytucja_units.jsonl` (analysis/legal_gen/out).

Tylko biblioteka standardowa. Uruchomione wprost liczy pokrycie: ile artykułów /
jednostek Konstytucji cytują benchmarki (KSSiP, aplikacje), osobno dla egzaminów
z danego roku — wejście do decyzji o wycinaniu jednostek z danych treningowych.

Usage: legal_cites.py UNITS.jsonl NAME=BENCH.jsonl [NAME=BENCH.jsonl ...] [--year 2026]
"""

import argparse
import json
import re
from collections import defaultdict
from typing import NamedTuple

_KONST = re.compile(r"Konstytucj")
# Inne akty, które też zawierają słowo "Konstytucyjny"/"Konstytucji" — pomijamy cały wpis,
# bo numer artykułu dotyczy wtedy ustawy, a nie Konstytucji.
_OTHER_ACT = re.compile(r"ustaw[aąyie]|Trybunał\w*\s+(?:\d+\s+)?Konstytucyjn|\bk\.[a-z]", re.I)
_ART = re.compile(r"art\.\s*(\d+)(?:\s*ust\.\s*(\d+)?)?(?:\s*pkt\s*(\d+))?")


class Cite(NamedTuple):
    """Jedno cytowanie: artykuł, opcjonalnie ustęp i punkt."""

    art: int
    ust: int | None
    pkt: int | None


def parse_konst_cites(legal_basis: str | None) -> list[Cite]:
    """Cytowania Konstytucji z napisu `legal_basis`; pusta lista, gdy to nie Konstytucja.

    "ust." bez numeru (błąd OCR w arkuszu) degraduje się do cytowania całego artykułu.
    """
    if not legal_basis or not _KONST.search(legal_basis) or _OTHER_ACT.search(legal_basis):
        return []
    cites = []
    for m in _ART.finditer(legal_basis):
        ust = int(m.group(2)) if m.group(2) else None
        pkt = int(m.group(3)) if m.group(3) and ust is not None else None
        cites.append(Cite(int(m.group(1)), ust, pkt))
    return cites


def load_units(path: str) -> dict[Cite, dict]:
    """Jednostki Konstytucji (artykuł / ustęp / punkt) po kluczu Cite."""
    units = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            u = json.loads(line)
            units[Cite(u["article"], u["ust"], u["pkt"])] = u
    return units


def most_specific(units: dict[Cite, dict], cite: Cite) -> Cite | None:
    """Najdokładniejsza istniejąca jednostka dla cytowania (punkt → ustęp → artykuł)."""
    for key in (cite, Cite(cite.art, cite.ust, None), Cite(cite.art, None, None)):
        if key in units:
            return key
    return None


def article_context(units: dict[Cite, dict], cites: list[Cite]) -> str | None:
    """Pełny tekst wszystkich cytowanych artykułów; None, gdy któregoś brak w korpusie."""
    parts = []
    for art in dict.fromkeys(c.art for c in cites):
        unit = units.get(Cite(art, None, None))
        if unit is None:
            return None
        parts.append(f"Art. {art}.\n{unit['text']}")
    return "\n\n".join(parts) if parts else None


def coverage(units: dict[Cite, dict], rows: list[dict]) -> dict[str, set]:
    """Zbiory cytowanych artykułów i jednostek (najdokładniejszych) dla listy pytań."""
    arts, unit_keys, unresolved = set(), set(), set()
    for r in rows:
        for c in parse_konst_cites(r.get("legal_basis")):
            key = most_specific(units, c)
            if key is None:
                unresolved.add(c)
                continue
            arts.add(c.art)
            unit_keys.add(key)
    return {"articles": arts, "units": unit_keys, "unresolved": unresolved}


def _read_jsonl(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def _print_coverage(label: str, cov: dict[str, set], n_arts: int, n_units: int) -> None:
    print(f"{label}: {len(cov['articles'])}/{n_arts} artykułów, "
          f"{len(cov['units'])}/{n_units} jednostek, nierozwiązane: {len(cov['unresolved'])}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("units")
    ap.add_argument("benches", nargs="+", help="NAME=path.jsonl")
    ap.add_argument("--year", type=int, default=2026, help="osobne pokrycie dla tego roku")
    a = ap.parse_args()
    units = load_units(a.units)
    n_arts = sum(1 for k in units if k.ust is None and k.pkt is None)
    every: list[dict] = []
    by_year: dict[int, list[dict]] = defaultdict(list)
    for spec in a.benches:
        name, path = spec.split("=", 1)
        rows = _read_jsonl(path)
        n_konst = sum(1 for r in rows if parse_konst_cites(r.get("legal_basis")))
        print(f"{name}: {len(rows)} pytań, z Konstytucji: {n_konst}")
        _print_coverage(f"  {name}", coverage(units, rows), n_arts, len(units))
        every += rows
        for r in rows:
            by_year[r.get("year")].append(r)
    _print_coverage("RAZEM", coverage(units, every), n_arts, len(units))
    _print_coverage(f"tylko {a.year}", coverage(units, by_year[a.year]), n_arts, len(units))


if __name__ == "__main__":
    main()
