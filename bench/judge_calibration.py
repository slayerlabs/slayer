"""Kalibracja sędziów dla generatora prawniczych MCQ (slayer#8).

Zanim zaufamy sędziemu przy filtrowaniu syntetycznych pytań, mierzymy go na prawdziwych
pytaniach egzaminacyjnych z Konstytucji RP (KSSiP + aplikacje), których klucz jest znany.

Tryby (każde pytanie x każdy sędzia):
  solve       — sędzia widzi przepis + pytanie + opcje, bez klucza; wybiera literę.
  closed      — to samo bez przepisu. Wysoka trafność = model odpowiada z pamięci,
                więc wynik `solve` może być zawyżony kontaminacją (porównaj rok 2026).
  verify_true — sędzia ocenia, czy wskazany (prawdziwy) klucz jest jedyną poprawną odpowiedzią.
  verify_bad  — to samo z celowo zepsutym kluczem; każde TAK to przepuszczone złe pytanie.
  counterfactual — jak solve, ale w przepisie treść poprawnej opcji podmieniona na dystraktor
                (tylko pytania, gdzie opcja występuje w przepisie dosłownie). Trafność = sędzia
                idzie za tekstem, a nie za pamięcią.

Sędziowie: `bielik` (Fabryka, chat), `basal` (Fabryka, /v1/systemone — wybór z
prawdopodobieństwami), `qwen` (OpenRouter, qwen/qwen3.5-27b). Klucze z env albo `--env-file`:
FABRYKA_API_KEY, OPENROUTER_API_KEY.

Wyniki wywołań lądują w OUT/calls.jsonl (wznawialne — gotowe wywołania są pomijane),
raport w OUT/REPORT.md.

Usage:
  judge_calibration.py --units U.jsonl --bench kssip=K.jsonl --bench aplikacje=A.jsonl \
      --out DIR [--judges bielik,basal,qwen] [--modes solve,closed,verify_true,verify_bad] \
      [--limit N] [--env-file .env]
"""

import argparse
import hashlib
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, replace

from legal_cites import article_context, load_units, parse_konst_cites

FABRYKA = "https://fabryka.ai/v1"
OPENROUTER = "https://openrouter.ai/api/v1"
MODES = ("solve", "closed", "verify_true", "verify_bad", "counterfactual")
MAX_PARALLEL = 8  # Fabryka: max 8 generowań naraz (ograniczenie GPU)
FATAL_HTTP = {401, 402, 403, 429}

SOLVE_SYS = ("Jesteś egzaminatorem prawa. Odpowiadasz na pytanie jednokrotnego wyboru. "
             "Odpowiedz WYŁĄCZNIE literą poprawnej odpowiedzi, bez żadnego innego tekstu.")
VERIFY_SYS = ("Jesteś egzaminatorem prawa. Sprawdzasz klucz odpowiedzi do pytania jednokrotnego "
              "wyboru. Odpowiedz WYŁĄCZNIE słowem TAK albo NIE.")


class FatalApiError(RuntimeError):
    """Klucz odrzucony / limit — przerywamy cały przebieg zamiast młotkować API."""


@dataclass(frozen=True)
class Item:
    """Pytanie egzaminacyjne z podpiętym tekstem przepisu."""

    id: str
    source: str
    year: int
    question: str
    options: tuple[str, ...]
    answer: int
    context: str


@dataclass(frozen=True)
class Verdict:
    """Odpowiedź sędziego: litera albo TAK/NIE, opcjonalna pewność (Basal)."""

    value: str | None
    confidence: float | None
    raw: str


# ---------- dane ----------

def load_items(units_path: str, benches: list[str]) -> list[Item]:
    """Pytania z Konstytucji, których wszystkie cytowane artykuły są w korpusie."""
    units = load_units(units_path)
    items = []
    for spec in benches:
        name, path = spec.split("=", 1)
        with open(path, encoding="utf-8") as f:
            for line in f:
                item = _to_item(name, json.loads(line), units)
                if item is not None:
                    items.append(item)
    return items


def _to_item(source: str, r: dict, units: dict) -> Item | None:
    context = article_context(units, parse_konst_cites(r.get("legal_basis")))
    if context is None or not str(r.get("question", "")).strip():
        return None
    exam = r.get("exam_id") or f"{r.get('year')}_{r.get('track')}"
    return Item(id=f"{source}:{exam}:{r['q_no']}", source=source, year=int(r["year"]),
                question=r["question"].strip(), options=tuple(r["options"]),
                answer=int(r["answer_idx"]), context=context)


def letters(item: Item) -> str:
    return "ABCDE"[: len(item.options)]


def bad_key(item: Item) -> int:
    """Deterministycznie wybrany błędny indeks (stały między przebiegami)."""
    wrong = [i for i in range(len(item.options)) if i != item.answer]
    h = int(hashlib.sha256(item.id.encode()).hexdigest(), 16)
    return wrong[h % len(wrong)]


_KONST_PREFIX = re.compile(r"Zgodnie z Konstytucj\w+ (?:RP|Rzeczypospolitej Polskiej)")


def _norm_option(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().rstrip(",.;")


def counterfactual(item: Item) -> Item | None:
    """Przepis z podmienioną treścią poprawnej opcji na błędną (`bad_key`).

    Sędzia, który czyta przepis, musi teraz wskazać dawny dystraktor; sędzia odpowiadający
    z pamięci wskaże dawny klucz. None, gdy poprawnej opcji nie ma dosłownie w przepisie
    albo dystraktor już w nim występuje (podmiana byłaby niejednoznaczna).
    """
    wrong = bad_key(item)
    good, bad = _norm_option(item.options[item.answer]), _norm_option(item.options[wrong])
    ctx = item.context.lower()
    if len(good) < 3 or good.lower() not in ctx or bad.lower() in ctx:
        return None
    new_ctx = re.sub(re.escape(good), lambda _: bad, item.context, flags=re.I)
    question = _KONST_PREFIX.sub("Zgodnie z podanym przepisem", item.question)
    return replace(item, context=new_ctx, question=question, answer=wrong)


def claimed_key(item: Item, mode: str) -> int | None:
    return {"verify_true": item.answer, "verify_bad": bad_key(item)}.get(mode)


def render(item: Item, mode: str) -> str:
    """Treść user-promptu dla sędziów czatowych."""
    opts = "\n".join(f"{c}. {o}" for c, o in zip(letters(item), item.options, strict=True))
    head = "" if mode == "closed" else f"Przepis:\n{item.context}\n\n"
    body = f"{head}Pytanie: {item.question}\n{opts}\n"
    key = claimed_key(item, mode)
    if key is None:
        return body + "\nOdpowiedź (sama litera):"
    return (body + f"\nWskazana odpowiedź: {letters(item)[key]}\n"
            "Czy wskazana odpowiedź jest jedyną poprawną odpowiedzią zgodnie z przepisem? "
            "Odpowiedz TAK albo NIE.")


# ---------- HTTP ----------

def post_json(url: str, key: str, body: dict) -> dict:
    """POST z 3 ponowieniami na błędy przejściowe; FatalApiError na odrzucenie klucza."""
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={
        "Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code in FATAL_HTTP:
                raise FatalApiError(f"HTTP {e.code} z {url}: {e.read()[:300]!r}") from e
            if attempt == 3 or e.code < 500:
                raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == 3:
                raise
        time.sleep(2 * (attempt + 1))
    raise RuntimeError("unreachable")


# ---------- sędziowie ----------

def parse_value(text: str, mode: str, allowed: str) -> str | None:
    """Pierwsza litera odpowiedzi albo TAK/NIE z odpowiedzi tekstowej."""
    text = re.sub(r"<think>.*?</think>", " ", text, flags=re.S).upper()
    pat = r"\b(TAK|NIE)\b" if mode.startswith("verify") else rf"\b([{allowed}])\b"
    m = re.search(pat, text)
    return m.group(1) if m else None


class ChatJudge:
    """Sędzia przez OpenAI-compatible /chat/completions (Bielik na Fabryce, Qwen na OpenRouter)."""

    def __init__(self, base: str, key: str, model: str, extra: dict | None = None) -> None:
        self.url, self.key, self.model, self.extra = f"{base}/chat/completions", key, model, extra

    def ask(self, item: Item, mode: str) -> Verdict:
        sys_prompt = VERIFY_SYS if mode.startswith("verify") else SOLVE_SYS
        body = {"model": self.model, "temperature": 0, "max_tokens": 16, **(self.extra or {}),
                "messages": [{"role": "system", "content": sys_prompt},
                             {"role": "user", "content": render(item, mode)}]}
        text = post_json(self.url, self.key, body)["choices"][0]["message"].get("content") or ""
        return Verdict(parse_value(text, mode, letters(item)), None, text.strip()[:200])


class BasalJudge:
    """Sędzia przez Fabryka /v1/systemone: wybór z rozkładem prawdopodobieństwa, 0 tokenów."""

    def __init__(self, key: str) -> None:
        self.url, self.key = f"{FABRYKA}/systemone", key

    def ask(self, item: Item, mode: str) -> Verdict:
        state = {"pytanie": item.question}
        if mode != "closed":
            state = {"przepis": item.context, **state}
        key = claimed_key(item, mode)
        if key is None:
            criteria = dict(zip(letters(item), item.options, strict=True))
            instr = "Wybierz jedyną poprawną odpowiedź na pytanie."
        else:
            state["opcje"] = dict(zip(letters(item), item.options, strict=True))
            state["wskazana_odpowiedz"] = letters(item)[key]
            criteria = {"TAK": "wskazana odpowiedź jest jedyną poprawną zgodnie z przepisem",
                        "NIE": "wskazana odpowiedź jest błędna albo nie jedyna poprawna"}
            instr = "Oceń, czy wskazana odpowiedź jest poprawna."
        body = {"model": "basal-2.0-max", "state": state,
                "questions": {"odp": {"type": "choice", "instructions": instr,
                                      "criteria": criteria}}}
        ans = post_json(self.url, self.key, body)["answers"]["odp"]
        return Verdict(ans["choice"], float(ans["confidence"]), json.dumps(ans["probabilities"]))


def make_judges(names: list[str]) -> dict[str, ChatJudge | BasalJudge]:
    factories = {
        "bielik": lambda: ChatJudge(FABRYKA, os.environ["FABRYKA_API_KEY"], "bielik-11b-v3.1"),
        "basal": lambda: BasalJudge(os.environ["FABRYKA_API_KEY"]),
        "qwen": lambda: ChatJudge(OPENROUTER, os.environ["OPENROUTER_API_KEY"],
                                  "qwen/qwen3.5-27b", {"reasoning": {"enabled": False}}),
    }
    return {n: factories[n]() for n in names}


# ---------- przebieg ----------

def expected(item: Item, mode: str) -> str:
    if mode == "verify_true":
        return "TAK"
    if mode == "verify_bad":
        return "NIE"
    return letters(item)[item.answer]


def load_done(path: str) -> set[tuple[str, str, str]]:
    if not os.path.exists(path):
        return set()
    with open(path, encoding="utf-8") as f:
        return {(r["judge"], r["mode"], r["item"]) for r in map(json.loads, f)}


def _mode_items(items: list[Item], mode: str) -> list[Item]:
    """Pytania dla trybu; `counterfactual` dostaje wersje z podmienionym przepisem."""
    if mode != "counterfactual":
        return items
    return [cf for cf in map(counterfactual, items) if cf is not None]


def run(judges: dict, items: list[Item], modes: list[str], calls_path: str) -> None:
    """Wszystkie brakujące wywołania, max MAX_PARALLEL naraz; zapis po każdym."""
    done = load_done(calls_path)
    todo = [(j, m, it) for j in judges for m in modes for it in _mode_items(items, m)
            if (j, m, it.id) not in done]
    print(f"do zrobienia: {len(todo)} wywołań (pominięte gotowe: {len(done)})", flush=True)
    lock, stop = threading.Lock(), threading.Event()
    with open(calls_path, "a", encoding="utf-8") as out:
        def one(task: tuple[str, str, Item]) -> None:
            if stop.is_set():
                return
            name, mode, item = task
            try:
                v = judges[name].ask(item, mode)
            except FatalApiError:
                stop.set()
                raise
            rec = {"judge": name, "mode": mode, "item": item.id, "source": item.source,
                   "year": item.year, "expected": expected(item, mode), "got": v.value,
                   "confidence": v.confidence, "raw": v.raw}
            with lock:
                out.write(json.dumps(rec, ensure_ascii=False) + "\n")
                out.flush()
        with ThreadPoolExecutor(MAX_PARALLEL) as pool:
            for fut in [pool.submit(one, t) for t in todo]:
                fut.result()


# ---------- raport ----------

def _rate(recs: list[dict], hit: str | None = None) -> str:
    if not recs:
        return "–"
    ok = sum(1 for r in recs if r["got"] == (hit or r["expected"]))
    return f"{ok / len(recs) * 100:.1f}% ({ok}/{len(recs)})"


def report(calls_path: str) -> str:
    """Tabela per sędzia x tryb, z podziałem na rok 2026 (świeży) i starsze."""
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    with open(calls_path, encoding="utf-8") as f:
        for r in map(json.loads, f):
            groups[(r["judge"], r["mode"])].append(r)
    lines = ["# Kalibracja sędziów — Konstytucja RP (KSSiP + aplikacje)", "",
             "Trafność = odpowiedź zgodna z oczekiwaną (litera klucza / TAK dla prawdziwego "
             "klucza / NIE dla zepsutego). `verify_bad` = 100% minus odsetek przepuszczonych "
             "złych kluczy. `brak` = sędzia nie podał parsowalnej odpowiedzi.", "",
             "| sędzia | tryb | wszystkie | 2026 | ≤2025 | brak |", "|---|---|---|---|---|---|"]
    for (judge, mode), recs in sorted(groups.items()):
        fresh = [r for r in recs if r["year"] >= 2026]
        old = [r for r in recs if r["year"] < 2026]
        missing = sum(1 for r in recs if r["got"] is None)
        lines.append(f"| {judge} | {mode} | {_rate(recs)} | {_rate(fresh)} | {_rate(old)} "
                     f"| {missing} |")
    lines += ["", *_threshold_lines(groups)]
    return "\n".join(lines) + "\n"


def _threshold_lines(groups: dict[tuple[str, str], list[dict]]) -> list[str]:
    """Dla sędziów z pewnością: trafność i pokrycie przy progach pewności (tryb solve)."""
    out = []
    for (judge, mode), recs in sorted(groups.items()):
        scored = [r for r in recs if r["confidence"] is not None]
        if mode != "solve" or not scored:
            continue
        out += [f"## {judge} / solve — próg pewności", "", "| próg | pokrycie | trafność |",
                "|---|---|---|"]
        for t in (0.5, 0.7, 0.8, 0.9, 0.95):
            kept = [r for r in scored if r["confidence"] >= t]
            out.append(f"| {t} | {len(kept)}/{len(scored)} | {_rate(kept)} |")
        out.append("")
    return out


def load_env_file(path: str | None) -> None:
    """Minimalny loader .env (KEY=VALUE); nie nadpisuje już ustawionych zmiennych."""
    if not path:
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            k, sep, v = line.strip().partition("=")
            if sep and not k.startswith("#"):
                os.environ.setdefault(k.strip(), v.strip().strip("'\""))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--units", required=True)
    ap.add_argument("--bench", action="append", required=True, help="NAME=path.jsonl")
    ap.add_argument("--out", required=True)
    ap.add_argument("--judges", default="bielik,basal,qwen")
    ap.add_argument("--modes", default=",".join(MODES))
    ap.add_argument("--limit", type=int, default=0, help="tylko pierwsze N pytań (smoke)")
    ap.add_argument("--env-file")
    a = ap.parse_args()
    load_env_file(a.env_file)
    items = load_items(a.units, a.bench)
    items = items[: a.limit] if a.limit else items
    print(f"pytań z rozwiązanym przepisem: {len(items)}", flush=True)
    os.makedirs(a.out, exist_ok=True)
    calls = os.path.join(a.out, "calls.jsonl")
    try:
        run(make_judges(a.judges.split(",")), items, a.modes.split(","), calls)
    except FatalApiError as e:
        print(f"STOP: API odrzuca zapytania — {e}\nNapisz do Kacpra o zwiększenie limitów.",
              file=sys.stderr)
    if os.path.exists(calls):
        text = report(calls)
        with open(os.path.join(a.out, "REPORT.md"), "w", encoding="utf-8") as f:
            f.write(text)
        print(text)


if __name__ == "__main__":
    main()
