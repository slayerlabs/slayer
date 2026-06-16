#!/usr/bin/env python3
"""PL-GEN — CLI do anotacji human-gold (A5).

Native speaker ocenia ~30-50 generacji modeli, by zbudować zbiór gold, który
waliduje panel sędziów (precision/recall) i daje sufit ludzki. Anotacja jest
ŚLEPA: anotator NIE widzi, który model wyprodukował tekst.

Przepływ:
  1. sample(): czyta generacje z common.RUNS (gen_{model}_s{seed}.jsonl), losuje
     ~N itemów (opcjonalnie stratyfikując po 'domena'), w losowej kolejności, i
     zapisuje mapowanie anno_id -> (model, seed, id) do OSOBNEGO prywatnego pliku
     (map_path), żeby wyświetlana sesja pozostała ślepa.
  2. annotate(): prosty REPL na input() — pokazuje prompt + rubrykę + odpowiedź
     (BEZ tożsamości modelu), zbiera naturalnosc 1-5 + werdykt pass/mixed/fail
     (etykiety jak w panelu sędziów), pozwala na skip i notkę. Zapis append-only
     do common.GOLD -> wznowienie pomija już zanotowane itemy.
  3. export(): łączy gold z mapowaniem -> rekordy z model/seed (dla validate_judges).

Stdlib only, bez curses. Pisze tylko do common.GOLD i map_path.

Usage:
  python bench/plgen/anno_cli.py --n 40 --stratify domena --annotator kuba
  python bench/plgen/anno_cli.py --export            # wypisz/zapisz połączony gold
"""
import argparse
import glob
import json
import os
import random
import re
import sys

_REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

from bench.plgen import common  # noqa: E402
from bench.plgen import grammar_check  # noqa: E402  (reużyte: ensure_lt/check/bucket_for/score_doc)

WERDYKTY = ("pass", "mixed", "fail")  # etykiety zgodne z panelem sędziów (Layer B)

# pola rekordu gold (jeden na zanotowany item)
GOLD_KEYS = ("id", "model", "seed", "naturalnosc", "werdykt", "note", "annotator")

# kształt rekordu mapowania (prywatny side-file, trzyma tożsamość modelu):
#   {"anno_id": int, "model": str, "seed": int, "id": str}
_RUN_RE = re.compile(r"gen_(?P<model>.+)_s(?P<seed>\d+)\.jsonl$")


def map_path(gold=None):
    """Ścieżka prywatnego pliku mapowania (obok GOLD): gold_v1 -> gold_v1.map.jsonl."""
    g = gold or common.GOLD
    return os.path.splitext(g)[0] + ".map.jsonl"


# ---------------------------------------------------------------------------
# wczytanie generacji
# ---------------------------------------------------------------------------
def load_runs(runs=None):
    """Wczytaj wszystkie generacje z RUNS (gen_{model}_s{seed}.jsonl). Lista dictów.

    Model/seed bierzemy z pól w rekordzie (A2 je zapisuje); nazwa pliku to tylko
    wskazówka. Pomija puste odpowiedzi (nie ma czego oceniać)."""
    rdir = runs or common.RUNS
    rows = []
    # uwaga: pomijamy *.stream.jsonl (diag) — mają ten sam prefix gen_ i podwoiłyby itemy
    paths = [p for p in glob.glob(os.path.join(rdir, "gen_*_s*.jsonl"))
             if not p.endswith(".stream.jsonl")]
    for path in sorted(paths):
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                r = json.loads(line)
                if not (r.get("ans") or "").strip():
                    continue
                rows.append(r)
    return rows


# ---------------------------------------------------------------------------
# sampling
# ---------------------------------------------------------------------------
def sample(rows, n, stratify=None, seed=0):
    """Wylosuj ~n itemów do anotacji, w losowej kolejności.

    stratify='domena' -> dobierz proporcjonalnie po 'domena' (largest-remainder),
    by każda domena była reprezentowana mniej więcej proporcjonalnie. None -> zwykły
    los. Zwraca listę rekordów generacji (podzbiór `rows`), potasowaną."""
    rng = random.Random(seed)
    if n >= len(rows):
        chosen = list(rows)
        rng.shuffle(chosen)
        return chosen

    if not stratify:
        return rng.sample(rows, n)

    # grupy wg klucza stratyfikacji
    groups = {}
    for r in rows:
        groups.setdefault(r.get(stratify), []).append(r)

    total = len(rows)
    # alokacja proporcjonalna metodą largest-remainder, by suma == n
    raw = {k: n * len(v) / total for k, v in groups.items()}
    alloc = {k: int(v) for k, v in raw.items()}
    rem = n - sum(alloc.values())
    # rozdaj resztę po największych ułamkach
    for k in sorted(groups, key=lambda k: raw[k] - alloc[k], reverse=True)[:rem]:
        alloc[k] += 1

    chosen = []
    for k, members in groups.items():
        take = min(alloc.get(k, 0), len(members))
        chosen.extend(rng.sample(members, take))
    rng.shuffle(chosen)
    return chosen


def write_mapping(chosen, path):
    """Zapisz prywatne mapowanie anno_id -> (model, seed, id). Nadpisuje plik."""
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for i, r in enumerate(chosen):
            f.write(json.dumps(
                {"anno_id": i, "model": r["model"], "seed": r["seed"], "id": r["id"]},
                ensure_ascii=False) + "\n")


def read_mapping(path):
    """Wczytaj mapowanie. Zwraca listę dictów (anno_id w kolejności rosnącej)."""
    if not os.path.exists(path):
        return []
    rows = [json.loads(l) for l in open(path, encoding="utf-8") if l.strip()]
    return sorted(rows, key=lambda m: m["anno_id"])


# ---------------------------------------------------------------------------
# gold I/O (append-only)
# ---------------------------------------------------------------------------
def read_gold(gold=None):
    """Wczytaj rekordy gold. Lista dictów; [] gdy brak pliku."""
    p = gold or common.GOLD
    if not os.path.exists(p):
        return []
    return [json.loads(l) for l in open(p, encoding="utf-8") if l.strip()]


def _annotated_keys(gold_rows):
    """Zbiór (id, model, seed) już zanotowanych — do wznowienia."""
    return {(g["id"], g["model"], g["seed"]) for g in gold_rows}


def append_gold(rec, gold=None):
    """Dopisz JEDEN rekord gold (append-only -> crash nie gubi pracy)."""
    p = gold or common.GOLD
    os.makedirs(os.path.dirname(os.path.abspath(p)) or ".", exist_ok=True)
    with open(p, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")


# ---------------------------------------------------------------------------
# render (ŚLEPY) + REPL
# ---------------------------------------------------------------------------
_SENT_FINAL = '.!?":)]»…'


def is_truncated(ans):
    """Heurystyka: odpowiedź nie kończy się znakiem końca zdania -> ucięta limitem tokenów."""
    a = (ans or "").rstrip()
    return bool(a) and a[-1] not in _SENT_FINAL


# ---------------------------------------------------------------------------
# LanguageTool — inline-marking matchy (funkcja czysta) + sekcja widoku
# ---------------------------------------------------------------------------
# Marker spanu: «…»ⁿ — dolny indeks linkuje fragment z numerowaną listą issue.
# (Czysty unicode; działa w każdym terminalu UTF-8, nie koliduje z polszczyzną.)
_SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹"


def _sup(n):
    """Liczba -> dolny/górny indeks unicode (np. 12 -> '¹²')."""
    return "".join(_SUPERSCRIPT[int(d)] for d in str(n))


def mark_issues(ans, matches):
    """Czysta funkcja: oznacz w `ans` każdy span wskazany przez matchy LT i zbuduj listę.

    Zwraca (marked_text, issue_lines):
      marked_text — `ans` z każdym flagowanym fragmentem owiniętym jako «fragment»ⁿ,
                    gdzie n to numer issue (1-based, w kolejności występowania w tekście);
      issue_lines — lista stringów "n. [bucket/rule.id] message" w tej samej kolejności.

    match: dict z 'offset', 'length' (oraz 'rule.id', 'rule.category.id', 'message')
    jak zwraca grammar_check.check(). Wstawiamy markery od KOŃCA do POCZĄTKU, więc
    offsety wcześniejszych spanów się nie przesuwają. Nakładające/zawarte spany
    pomijamy (bierzemy pierwszy, „outer", po sortowaniu wg offsetu) — proste i sensowne.
    """
    text = ans or ""
    n = len(text)
    # znormalizuj + odfiltruj matchy poza zakresem / o zerowej długości
    spans = []
    for m in matches or []:
        off = m.get("offset")
        ln = m.get("length")
        if not isinstance(off, int) or not isinstance(ln, int):
            continue
        if off < 0 or ln <= 0 or off >= n:
            continue
        end = min(off + ln, n)
        spans.append((off, end, m))
    # kolejność występowania w tekście (offset, potem dłuższy span pierwszy)
    spans.sort(key=lambda s: (s[0], -(s[1] - s[0])))
    # odrzuć nakładające się: kolejny span musi zaczynać się za końcem poprzedniego
    chosen = []
    last_end = -1
    for off, end, m in spans:
        if off < last_end:
            continue  # overlap / zawarty -> pomiń
        chosen.append((off, end, m))
        last_end = end

    issue_lines = []
    # marker wstawiamy od końca, żeby nie psuć offsetów wcześniejszych spanów
    marked = text
    for num, (off, end, m) in enumerate(reversed(chosen), start=1):
        idx = len(chosen) - num + 1  # numer issue w kolejności tekstowej (1-based)
        frag = marked[off:end]
        marked = marked[:off] + f"«{frag}»{_sup(idx)}" + marked[end:]
    for i, (off, end, m) in enumerate(chosen, start=1):
        rule = m.get("rule", {}) or {}
        rid = rule.get("id") or "?"
        msg = (m.get("message") or "").strip()
        bucket = grammar_check.bucket_for(m)
        issue_lines.append(f"{i}. [{bucket}/{rid}] {msg}")
    return marked, issue_lines


# ---------------------------------------------------------------------------
# Stanza (Warstwa A) — best-effort inline-marking findings (funkcja czysta) + load
# ---------------------------------------------------------------------------
# Marker spanu Stanza: ⟦…⟧ — ODMIENNY od LT («…»), by anotator rozróżnił warstwy.
# check_text() zwraca listę (klasa, fragment); fragmenty bywają NIECIĄGŁE ("Jan…wysłać"),
# wtedy tylko listujemy (brak offsetów -> nie zaznaczamy inline).
_STANZA_GAP = "…"  # separator we fragmentach niecięgłych (z _spike_stanza)


def stanza_section(ans, findings):
    """Czysta funkcja: złóż sekcję Stanza — tekst z markerami ⟦…⟧ + lista trafień.

    findings: lista (klasa, fragment) jak zwraca _spike_stanza.check_text().
    Zwraca (marked_text, issue_lines):
      marked_text — `ans`, gdzie KAŻDY ciągły fragment (bez '…') jest owinięty ⟦fragment⟧
                    przy PIERWSZYM wystąpieniu (substring-search). Fragmenty niecięgłe
                    (z '…') lub niewystępujące dosłownie zostawiają tekst bez zmian.
      issue_lines — lista "[Stanza/<klasa>] <fragment>" w kolejności znalezisk.

    Nie rzuca, gdy fragment nie występuje dosłownie — po prostu go nie zaznacza.
    Zaznaczamy od KOŃCA znalezionych pozycji, by nie psuć offsetów wcześniejszych."""
    text = ans or ""
    issue_lines = [f"[Stanza/{klasa}] {frag}" for klasa, frag in (findings or [])]
    # zbierz pozycje dla ciągłych fragmentów (pierwsze wystąpienie, bez nakładania)
    spans = []
    occupied = []  # (start, end) już zajętych zakresów -> unikaj podwójnego markera
    for _klasa, frag in (findings or []):
        if not frag or _STANZA_GAP in frag:
            continue  # niecięgły -> tylko lista
        idx = text.find(frag)
        if idx < 0:
            continue  # brak dosłownego dopasowania -> nie zaznaczaj, nie crashuj
        end = idx + len(frag)
        if any(idx < oe and os < end for os, oe in occupied):
            continue  # nakłada się z już zaznaczonym -> pomiń
        occupied.append((idx, end))
        spans.append((idx, end))
    marked = text
    for idx, end in sorted(spans, reverse=True):
        marked = marked[:idx] + f"⟦{marked[idx:end]}⟧" + marked[end:]
    return marked, issue_lines


# leniwe wczytanie Stanza raz na sesję; None => niedostępne/pominięte.
# NIE importujemy torch/stanza na poziomie modułu (ciężkie, opcjonalne).
def ensure_stanza():
    """Załaduj checker Stanza raz; zwróć funkcję check_text. Rzuca, gdy niedostępny.

    Import LENIWY (torch/stanza ~ ciężkie) — i wywołanie nlp() rozgrzewa model,
    by pierwszy item nie czekał. Wołający łapie wyjątek i pomija sekcję Stanza."""
    from bench.plgen._spike_stanza import check_text, nlp
    nlp()  # rozgrzej model (rzuci tu, jeśli torch/model niedostępny)
    return check_text


def layer_a_section(ans, lt_base, stanza_check):
    """Złóż WSPÓLNY panel WARSTWY A (LT + Stanza) dla itemu. ŚLEPY (zero tożsamości).

    lt_base: base_url LT (lub None). stanza_check: funkcja check_text (lub None).
    Zwraca (sekcja_str, n_lt_matches, n_stanza_findings) — liczby do audytu la_flagged.
    Nigdy nie rzuca: błąd którejkolwiek warstwy -> notka, druga warstwa działa dalej."""
    # --- LT ---
    lt = lt_section(ans, lt_base)  # już bezpieczne (notka przy błędzie)
    n_lt = 0
    if lt_base:
        try:
            n_lt = len(grammar_check.check(ans, lt_base))
        except Exception:  # noqa: BLE001 — score liczony tylko do audytu
            n_lt = 0
    # --- Stanza ---
    if stanza_check is None:
        stanza_block = "Stanza: pominięto (model niedostępny).\n"
        n_st = 0
    else:
        try:
            findings = stanza_check(ans)
        except Exception as e:  # noqa: BLE001 — degradacja: pokaż item bez Stanza
            stanza_block = f"Stanza: pominięto (błąd sprawdzania: {e}).\n"
            n_st = 0
        else:
            marked, issues = stanza_section(ans, findings)
            n_st = len(issues)
            if not issues:
                stanza_block = "Stanza: brak trafień.\n"
            else:
                stanza_block = ("ODPOWIEDŹ (oznaczona przez Stanza):\n" + marked
                                + "\n\nTRAFIENIA Stanza:\n" + "\n".join(issues) + "\n")
    section = (
        "WARSTWA A (LT + Stanza)\n"
        f"{'·' * 70}\n"
        f"-- LT --\n{lt}"
        f"-- Stanza --\n{stanza_block}"
    )
    return section, n_lt, n_st


def _score_line(matches, n_tokens):
    """Jednolinijkowy podgląd per-bucket: counts + errors/100tok dla każdego bucketu.

    Liczone z listy matchy (jedno wywołanie check() na item), zgodnie z logiką
    grammar_check.score_doc (bucket_for + normalizacja na 100 tokenów)."""
    counts = {b: 0 for b in grammar_check.BUCKETS}
    for m in matches:
        counts[grammar_check.bucket_for(m)] += 1
    parts = []
    for b in grammar_check.BUCKETS:
        c = counts[b]
        p = (100.0 * c / n_tokens) if n_tokens else 0.0
        parts.append(f"{b}={c} ({p:.1f}/100tok)")
    flag = "  [za krótki: poza agregatem]" if n_tokens < grammar_check.MIN_TOKENS else ""
    return f"LT: {'  '.join(parts)}  | tok={n_tokens}{flag}"


def lt_section(ans, base_url):
    """Złóż sekcję LT dla itemu: linia score + tekst z markerami + numerowana lista issue.

    base_url=None lub błąd check() -> zwróć jednolinijkową notkę o pominięciu
    (nigdy nie rzuca; anotacja ma działać dalej). Tekst oryginalny zostaje widoczny w
    render_item — tutaj pokazujemy WERSJĘ OZNACZONĄ (zaznaczone trafienia LT).

    Jedno wywołanie check() na item (reuse matchy do markerów i score line)."""
    if not base_url:
        return "LT: pominięto (LanguageTool niedostępny).\n"
    try:
        matches = grammar_check.check(ans, base_url)
    except Exception as e:  # noqa: BLE001 — degradacja: pokaż item bez LT, nie zabijaj sesji
        return f"LT: pominięto (błąd sprawdzania: {e}).\n"
    marked, issues = mark_issues(ans, matches)
    head = _score_line(matches, common.count_tokens(ans))
    if not issues:
        return f"{head}\nLT: brak trafień (wg reguł LT — pamiętaj o niskim recall dla PL).\n"
    body = "ODPOWIEDŹ (oznaczona przez LT):\n" + marked + "\n\nTRAFIENIA LT:\n" + "\n".join(issues)
    return f"{head}\n{body}\n"


def render_item(prompt_item, ans, idx, total, lt=None):
    """Złóż ślepy widok itemu: zadanie + rubryka + odpowiedź. ZERO tożsamości modelu.

    prompt_item: dict ze schematu promptów (id/domena/prompt/rubryka/...).
    ans: tekst odpowiedzi modelu. lt: gotowa sekcja LanguageTool (string) lub None.
    Zwraca string do wyświetlenia. Gdy tekst wygląda na ucięty limitem tokenów -> banner:
    oceniaj TYLKO język obecnego tekstu, nie karz za brak końca.

    LT (jeśli podany) jest CZYSTO informacyjny dla anotatora — pokazuje, co LanguageTool
    złapał (a co przeoczył). NIE wpływa na rekord gold ani nie ujawnia tożsamości modelu."""
    banner = ("\n⚠  TEKST PRAWDOPODOBNIE UCIĘTY (limit tokenów) — oceniaj WYŁĄCZNIE poprawność\n"
              "   językową obecnego fragmentu; NIE karz za brak zakończenia (to artefakt harnessu).\n"
              if is_truncated(ans) else "")
    lt_block = f"{'-' * 70}\n{lt}" if lt else ""
    return (
        f"\n{'=' * 70}\n"
        f"Item {idx + 1}/{total}  [domena: {prompt_item['domena']}]\n"
        f"{'-' * 70}\n"
        f"ZADANIE:\n{prompt_item['prompt']}\n\n"
        f"RUBRYKA:\n{prompt_item['rubryka']}\n"
        f"{'-' * 70}\n"
        f"ODPOWIEDŹ:\n{ans}\n"
        f"{banner}"
        f"{lt_block}"
        f"{'=' * 70}\n"
    )


def _prompt_naturalnosc(inp):
    while True:
        s = inp("naturalnosc (1-5, 's'=skip): ").strip().lower()
        if s in ("s", "skip"):
            return None
        if s in ("1", "2", "3", "4", "5"):
            return int(s)
        print("  podaj 1-5 albo 's'.")


def _prompt_werdykt(inp):
    while True:
        s = inp(f"werdykt ({'/'.join(WERDYKTY)}, 's'=skip): ").strip().lower()
        if s in ("s", "skip"):
            return None
        if s in WERDYKTY:
            return s
        print(f"  podaj jedno z: {', '.join(WERDYKTY)}.")


def annotate(annotator, gold=None, mp=None, prompts_path=None,
             inp=None, out=print):
    """REPL anotacji. Czyta mapowanie + prompty, pokazuje ślepe itemy, dopisuje gold.

    Wznowienie: itemy już w gold (po (id,model,seed)) są pomijane. Zwraca liczbę
    nowo zanotowanych rekordów."""
    inp = inp or input  # rozwiązywane leniwie -> łatwy monkeypatch w testach
    gold = gold or common.GOLD
    mpath = mp or map_path(gold)
    mapping = read_mapping(mpath)
    if not mapping:
        raise SystemExit(f"brak mapowania ({mpath}) — najpierw uruchom sampling (--n).")

    prompts = {p["id"]: p for p in common.load_prompts(prompts_path or common.DATA)}
    answers = {(r["id"], r["model"], r["seed"]): r["ans"] for r in load_runs()}

    done = _annotated_keys(read_gold(gold))
    todo = [m for m in mapping if (m["id"], m["model"], m["seed"]) not in done]
    if not todo:
        out("Wszystko zanotowane — nic do zrobienia.")
        return 0

    out(f"Do zanotowania: {len(todo)} (pominięto {len(mapping) - len(todo)} już zrobionych). "
        f"Etykiety werdyktu: {', '.join(WERDYKTY)}.")

    # LanguageTool wstaje LENIWIE raz na sesję; base_url reużywany dla każdego itemu.
    # Niedostępny docker/LT -> base=None, sekcja LT pomijana (anotacja działa dalej).
    lt_base = None
    try:
        lt_base = grammar_check.ensure_lt()
        out("[anno] LanguageTool aktywny — pokazuję per-item co LT łapie (info dla anotatora).")
    except Exception as e:  # noqa: BLE001 — brak dockera/LT nie blokuje anotacji
        out(f"[anno] LanguageTool niedostępny ({e}) — anotuję bez podglądu LT.")

    # Stanza (Warstwa A) wstaje LENIWIE raz na sesję (model ~10-20s). Niedostępny
    # torch/model -> stanza_check=None, sekcja Stanza pomijana (anotacja działa dalej).
    stanza_check = None
    try:
        stanza_check = ensure_stanza()
        out("[anno] Stanza aktywna — pokazuję per-item co Stanza łapie (info dla anotatora).")
    except Exception as e:  # noqa: BLE001 — brak torch/modelu nie blokuje anotacji
        out(f"[anno] Stanza niedostępna ({e}) — anotuję bez podglądu Stanza.")

    written = 0
    for i, m in enumerate(todo):
        pi = prompts.get(m["id"])
        ans = answers.get((m["id"], m["model"], m["seed"]))
        if pi is None or ans is None:
            out(f"  (pomijam anno_id={m['anno_id']}: brak promptu/odpowiedzi)")
            continue
        section, _n_lt, _n_st = layer_a_section(ans, lt_base, stanza_check)
        out(render_item(pi, ans, i, len(todo), lt=section))

        nat = _prompt_naturalnosc(inp)
        if nat is None:
            out("  -> skip")
            continue
        wer = _prompt_werdykt(inp)
        if wer is None:
            out("  -> skip")
            continue
        note = inp("notka (Enter=brak): ").strip()

        rec = {"id": m["id"], "model": m["model"], "seed": m["seed"],
               "naturalnosc": nat, "werdykt": wer, "note": note,
               "annotator": annotator}
        append_gold(rec, gold)  # append-only: zapis po każdym itemie
        written += 1
    out(f"Zapisano {written} nowych rekordów -> {gold}")
    return written


# ---------------------------------------------------------------------------
# export — gold połączony z mapowaniem (dla validate_judges)
# ---------------------------------------------------------------------------
def export(gold=None, mp=None, out_path=None):
    """Zwróć gold połączony z mapowaniem (model/seed/id + oceny).

    Gold już niesie id/model/seed (z mapowania w trakcie anotacji), więc 'join'
    to głównie weryfikacja spójności i dołożenie anno_id z mapowania. Zwraca listę
    dictów. Jeśli out_path podany -> zapisuje też JSONL."""
    gold = gold or common.GOLD
    rows = read_gold(gold)
    mapping = {(m["id"], m["model"], m["seed"]): m for m in read_mapping(mp or map_path(gold))}
    joined = []
    for g in rows:
        m = mapping.get((g["id"], g["model"], g["seed"]))
        rec = dict(g)
        rec["anno_id"] = m["anno_id"] if m else None
        joined.append(rec)
    if out_path:
        os.makedirs(os.path.dirname(os.path.abspath(out_path)) or ".", exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            for r in joined:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
    return joined


# ---------------------------------------------------------------------------
# Tryb audytu WARSTWY A — FP/FN per item (OSOBNY plik, NIE dotyka gold)
# ---------------------------------------------------------------------------
# Osobny plik audytu (append-only), obok runów. NIE jest to gold werdyktów.
LAYER_A_AUDIT = os.path.join("slayer-data", "plgen", "runs", "layer_a_audit.jsonl")

# pola rekordu audytu (jeden na zaudytowany item)
AUDIT_KEYS = ("id", "model", "seed", "la_flagged", "la_fp", "la_fn", "annotator")


def read_audit(path=None):
    """Wczytaj rekordy audytu Warstwy A. Lista dictów; [] gdy brak pliku."""
    p = path or LAYER_A_AUDIT
    if not os.path.exists(p):
        return []
    return [json.loads(l) for l in open(p, encoding="utf-8") if l.strip()]


def append_audit(rec, path=None):
    """Dopisz JEDEN rekord audytu (append-only -> crash nie gubi pracy)."""
    p = path or LAYER_A_AUDIT
    os.makedirs(os.path.dirname(os.path.abspath(p)) or ".", exist_ok=True)
    with open(p, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")


def _audited_keys(audit_rows):
    """Zbiór (id, model, seed) już zaudytowanych — do wznowienia."""
    return {(a["id"], a["model"], a["seed"]) for a in audit_rows}


def _prompt_count(inp, label):
    """Zapytaj o liczbę całkowitą >=0 (Enter=0, 's'=skip -> None)."""
    while True:
        s = inp(f"{label} (Enter=0, 's'=skip): ").strip().lower()
        if s == "":
            return 0
        if s in ("s", "skip"):
            return None
        if s.isdigit():
            return int(s)
        print("  podaj liczbę całkowitą >=0, Enter=0 albo 's'.")


def audit_layer_a(annotator, gold=None, mp=None, prompts_path=None,
                  audit_path=None, inp=None, out=print):
    """Tryb audytu Warstwy A (LT+Stanza): per item zbierz FP/FN, zapisz OSOBNO.

    Iteruje WSZYSTKIE itemy z mapowania (niezależnie od gold werdyktów). Dla każdego
    pokazuje ślepy widok + panel Warstwy A, pyta o FP/FN (Enter=0, 's'=skip) i auto-
    zapisuje la_flagged (liczba flag LT + Stanza). Append-only do audit_path; wznowienie
    pomija itemy już zaudytowane po (id,model,seed). Zwraca liczbę nowych rekordów."""
    inp = inp or input
    gold = gold or common.GOLD
    mpath = mp or map_path(gold)
    apath = audit_path or LAYER_A_AUDIT
    mapping = read_mapping(mpath)
    if not mapping:
        raise SystemExit(f"brak mapowania ({mpath}) — najpierw uruchom sampling (--n).")

    prompts = {p["id"]: p for p in common.load_prompts(prompts_path or common.DATA)}
    answers = {(r["id"], r["model"], r["seed"]): r["ans"] for r in load_runs()}

    done = _audited_keys(read_audit(apath))
    todo = [m for m in mapping if (m["id"], m["model"], m["seed"]) not in done]
    if not todo:
        out("Wszystko zaudytowane (Warstwa A) — nic do zrobienia.")
        return 0
    out(f"Audyt Warstwy A: {len(todo)} (pominięto {len(mapping) - len(todo)} już zrobionych).")

    lt_base = None
    try:
        lt_base = grammar_check.ensure_lt()
        out("[audit] LanguageTool aktywny.")
    except Exception as e:  # noqa: BLE001
        out(f"[audit] LanguageTool niedostępny ({e}) — audyt bez LT.")
    stanza_check = None
    try:
        stanza_check = ensure_stanza()
        out("[audit] Stanza aktywna.")
    except Exception as e:  # noqa: BLE001
        out(f"[audit] Stanza niedostępna ({e}) — audyt bez Stanza.")

    written = 0
    for i, m in enumerate(todo):
        pi = prompts.get(m["id"])
        ans = answers.get((m["id"], m["model"], m["seed"]))
        if pi is None or ans is None:
            out(f"  (pomijam anno_id={m['anno_id']}: brak promptu/odpowiedzi)")
            continue
        section, n_lt, n_st = layer_a_section(ans, lt_base, stanza_check)
        la_flagged = n_lt + n_st
        out(render_item(pi, ans, i, len(todo), lt=section))
        out(f"Flagi Warstwy A pokazane: {la_flagged} (LT={n_lt} + Stanza={n_st}).")

        fp = _prompt_count(inp, "FP — ile flag Warstwy A to NIE-błędy")
        if fp is None:
            out("  -> skip")
            continue
        fn = _prompt_count(inp, "FN — ile prawdziwych błędów Warstwa A PRZEGAPIŁA")
        if fn is None:
            out("  -> skip")
            continue

        rec = {"id": m["id"], "model": m["model"], "seed": m["seed"],
               "la_flagged": la_flagged, "la_fp": fp, "la_fn": fn,
               "annotator": annotator}
        append_audit(rec, apath)  # append-only: zapis po każdym itemie
        written += 1
    out(f"Zapisano {written} nowych rekordów audytu -> {apath}")
    return written


def main(argv=None):
    ap = argparse.ArgumentParser(description="PL-GEN human-gold annotation CLI (A5)")
    ap.add_argument("--n", type=int, default=40, help="ile itemów wylosować do anotacji")
    ap.add_argument("--stratify", default=None, help="klucz stratyfikacji (np. 'domena')")
    ap.add_argument("--annotator", default=os.environ.get("USER", "anon"),
                    help="identyfikator anotatora (zapisany w gold)")
    ap.add_argument("--seed", type=int, default=0, help="seed losowania próbki")
    ap.add_argument("--data", default=None, help="ścieżka promptów (domyślnie common.DATA)")
    ap.add_argument("--export", action="store_true",
                    help="tryb eksportu: wypisz połączony gold (z model/seed)")
    ap.add_argument("--audit-la", action="store_true", dest="audit_la",
                    help="tryb audytu Warstwy A (LT+Stanza): FP/FN per item -> osobny plik")
    a = ap.parse_args(argv)

    if a.export:
        joined = export()
        print(json.dumps(joined, ensure_ascii=False, indent=2))
        print(f"# {len(joined)} rekordów gold (połączonych z mapowaniem)", file=sys.stderr)
        return

    mpath = map_path()
    # sampling tylko gdy brak mapowania — inaczej wznawiamy istniejącą sesję (blind, append-only)
    if not os.path.exists(mpath):
        rows = load_runs()
        if not rows:
            raise SystemExit(f"brak generacji w {common.RUNS} — najpierw uruchom A2 (gen).")
        chosen = sample(rows, a.n, stratify=a.stratify, seed=a.seed)
        write_mapping(chosen, mpath)
        print(f"[anno] wylosowano {len(chosen)} itemów -> mapowanie {mpath}")
    else:
        print(f"[anno] wznawiam sesję z istniejącego mapowania {mpath}")

    if a.audit_la:
        audit_layer_a(a.annotator, prompts_path=a.data)
    else:
        annotate(a.annotator, prompts_path=a.data)


if __name__ == "__main__":
    main()
