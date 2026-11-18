"""Generator syntetycznych prawniczych MCQ z tekstu Konstytucji RP (slayer#8) — dane treningowe.

Jednostka (artykuł bez ustępów albo ustęp z punktami) -> teacher (deepseek-v4-pro, OpenRouter)
pisze 1 pytanie jednokrotnego wyboru A–C w stylu KSSiP/aplikacji + dosłowny cytat rozstrzygający.
Każde pytanie przechodzi filtry (pierwszy niespełniony = powód odrzucenia):

  format    — poprawny JSON, 3 różne niepuste opcje, brak "wszystkie/żadna z powyższych".
  quote     — `cytat` występuje dosłownie (po normalizacji białych znaków) w przepisie.
  bench     — podobieństwo (Jaccard trigramów słów) do pytań benchmarków < progu.
  basal     — Basal (Fabryka) rozwiązuje na ślepo z tekstem artykułu: musi trafić klucz
              z pewnością >= progu (kalibracja: 99.7% trafności przy 0.9).
  qwen      — Qwen3.5-27B (OpenRouter) potwierdza, że klucz jest jedyną poprawną (kalibracja:
              0/389 przepuszczonych złych kluczy).
  dup       — końcowy dedup wśród zaakceptowanych (ten sam próg Jaccarda).
  length    — końcowy rebalans: jeśli poprawna jest najdłuższą opcją w więcej niż
              `--longest-max` pytań (domyślnie 1/3 = losowo; egzaminy aplikacyjne: 29%), odrzuca
              te o największej przewadze długości poprawnej nad najdłuższym dystraktorem.
              Parafraza wydłuża poprawną (k.c.: 46% najdłuższa), a sztywny próg przekrzywiałby
              rozkład w drugą stronę na aktach, gdzie biasu nie ma.

Zaakceptowane mają też `checks.closed_book_*`: Basal bez przepisu. Trafienie z wysoką pewnością =
pytanie łatwe / wiedza z pamięci — sygnał do filtrowania trudności (np. pod RLVR), nie filtr.

Poprawna odpowiedź jest przestawiana na pozycję (i mod 3), więc litery są zbalansowane.
Artykuły cytowane przez benchmarki z `--exclude-year` (domyślnie 2026, ukryta część) są pomijane.
`legal_basis` pochodzi z jednostki źródłowej, nie od modelu.

Wynik w OUT/: accepted.jsonl, rejected.jsonl (z powodem), STATS.md. Wznawialne po `id`.

Usage:
  gen_legal_mcq.py --units U.jsonl --bench kssip=K.jsonl --bench aplikacje=A.jsonl --out DIR \
      [--limit N] [--exclude-year 2026] [--conf 0.9] [--jaccard 0.5] [--longest-max 0.333]
      [--env-file .env]
"""

import argparse
import json
import os
import random
import re
import sys
import threading
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

from judge_calibration import (
    MAX_PARALLEL,
    OPENROUTER,
    BasalJudge,
    ChatJudge,
    FatalApiError,
    Item,
    load_env_file,
    post_json,
)
from legal_cites import Cite, coverage, load_units

TEACHER = "deepseek/deepseek-v4-pro"
PREFIX = "Zgodnie z Konstytucją Rzeczypospolitej Polskiej,"
BANNED = re.compile(r"wszystkie\s+(powyższe|odpowiedzi)|żadn\w+\s+z\s+powyższych|\b[ABC]\s+i\s+[ABC]\b",
                    re.I)

STYLE_EXAMPLES = (
    "Zgodnie z Kodeksem postępowania cywilnego, wyrok zaoczny doręcza się:\n"
    "A. stronom z urzędu,\nB. stronom tylko na wniosek,\n"
    "C. powodowi tylko na wniosek, a pozwanemu z urzędu.\n\n"
    "Zgodnie z Kodeksem rodzinnym i opiekuńczym, krewnymi w linii bocznej są osoby:\n"
    "A. z których jedna pochodzi od drugiej,\n"
    "B. które pochodzą od wspólnego przodka, a nie są krewnymi w linii prostej,\n"
    "C. które są krewnymi drugiego małżonka."
)
TEACHER_SYS = ("Jesteś autorem testów na egzaminy wstępne na aplikacje prawnicze i do KSSiP. "
               "Układasz pytania jednokrotnego wyboru wyłącznie na podstawie podanego przepisu "
               "prawa. Zwracasz wyłącznie JSON.")
TEACHER_RULES = """Ułóż jedno pytanie o PRZEPIS DOCELOWY. Zasady:
- pytanie zaczyna się od "{prefix}" i kończy dwukropkiem; opcje są dokończeniem zdania, \
z małej litery, dwie pierwsze kończą się przecinkiem, ostatnia kropką;
- dokładnie 3 opcje i dokładnie jedna zgodna z przepisem docelowym; dystraktory wiarygodne \
(np. inny organ, inny termin, inna większość, inna kompetencja), ale sprzeczne z przepisem;
- poprawną odpowiedź sformułuj własnymi słowami (parafraza zachowująca dokładny sens) — NIE \
kopiuj w opcjach fragmentów przepisu; dystraktory pisz tym samym stylem i o podobnej długości;
- bez opcji typu "wszystkie powyższe", "żadna z powyższych", "A i B";
- pytanie musi dać się rozstrzygnąć samym przepisem docelowym;
- "cytat" to dosłowny fragment przepisu docelowego (znak w znak), który rozstrzyga odpowiedź.
Zwróć WYŁĄCZNIE JSON: {{"pytanie": "...", "opcje": ["...", "...", "..."], "poprawna": 0, \
"cytat": "..."}} gdzie "poprawna" to indeks 0–2."""


@dataclass(frozen=True)
class Config:
    """Parametry przebiegu."""

    conf: float
    jaccard: float
    teacher: str


@dataclass(frozen=True)
class GenUnit:
    """Jednostka, z której generujemy: przepis docelowy + pełny artykuł jako kontekst."""

    id: str
    index: int
    cite: str
    text: str
    article_text: str
    eli: str
    state: str
    prefix: str = PREFIX
    source: str = "konstytucja-rp (pl.wikisource, ELI-checked)"


# ---------- jednostki ----------


def load_code_units(path: str, exclude_bases: set[str]) -> list[GenUnit]:
    """Jednostki z build_code_units.py (kodeksy); pomija artykuły o wykluczonym numerze bazowym."""
    with open(path, encoding="utf-8") as f:
        rows = [json.loads(line) for line in f if line.strip()]
    rows = [r for r in rows if _base(r["article"]) not in exclude_bases]
    return [GenUnit(id=r["id"], index=i, cite=r["cite"], text=r["text"],
                    article_text=r["article_text"], eli=r["eli"], state=r["state"],
                    prefix=r["prefix"], source=f"{r['act']} tekst jednolity {r['eli']} "
                    "(api.sejm.gov.pl/eli, PDF)") for i, r in enumerate(rows)]


def _base(article: str) -> str:
    """Numer bazowy artykułu: `449¹` -> `449`, `577a` -> `577a`."""
    return re.match(r"\d+[a-z]?", article).group()


def excluded_code_articles(bench_rows: list[dict], year: int, act: str) -> set[str]:
    """Numery bazowe artykułów `act` cytowanych w benchmarkach z danego roku (nadmiarowo:
    cały wpis legal_basis z tym aktem, wszystkie `art. N` w nim)."""
    act_re = re.compile(r"(?<![\w.])" + re.escape(act) + r"(?![a-z])")
    out = set()
    for r in bench_rows:
        lb = r.get("legal_basis") or ""
        if r.get("year") == year and act_re.search(lb):
            out |= set(re.findall(r"art\.\s*(\d+[a-z]?)", lb))
    return out


def is_code_units(path: str) -> bool:
    with open(path, encoding="utf-8") as f:
        return "article_text" in json.loads(f.readline())

def generation_units(units_path: str, exclude_articles: set[int]) -> list[GenUnit]:
    """Artykuły bez ustępów + ustępy (z punktami), poza wykluczonymi artykułami."""
    units = load_units(units_path)
    with_ust = {k.art for k in units if k.ust is not None}
    keys = [k for k in units if k.pkt is None and k.art not in exclude_articles
            and (k.ust is not None or k.art not in with_ust)]
    out = []
    for i, k in enumerate(keys):
        u, art = units[k], units[Cite(k.art, None, None)]
        out.append(GenUnit(id=_slug(u["cite"]), index=i, cite=u["cite"], text=u["text"],
                           article_text=f"Art. {k.art}.\n{art['text']}", eli=u["eli"],
                           state=u["state"]))
    return out


def _slug(cite: str) -> str:
    return re.sub(r"[^0-9a-z]+", "_", cite.lower()).strip("_")


def _read_benches(specs: list[str]) -> list[dict]:
    rows = []
    for spec in specs:
        _, path = spec.split("=", 1)
        with open(path, encoding="utf-8") as f:
            rows += [json.loads(line) for line in f if line.strip()]
    return rows


def excluded_articles(units_path: str, bench_rows: list[dict], year: int) -> set[int]:
    """Artykuły Konstytucji cytowane przez pytania benchmarków z danego roku."""
    fresh = [r for r in bench_rows if r.get("year") == year]
    return coverage(load_units(units_path), fresh)["articles"]


# ---------- podobieństwo ----------

def _norm(text: str) -> str:
    text = re.sub(r"zgodnie z [^,]{3,90},", " ", text.lower())
    return re.sub(r"[^\w]+", " ", text).strip()


def trigrams(text: str) -> frozenset[tuple[str, ...]]:
    w = _norm(text).split()
    return frozenset(zip(w, w[1:], w[2:], strict=False))


class SimilarityIndex:
    """Indeks trigramów słów: maksymalny Jaccard kandydata względem zbioru tekstów."""

    def __init__(self, texts: list[str]) -> None:
        self.sets: list[frozenset] = []
        self.inv: dict[tuple[str, ...], list[int]] = {}
        for t in texts:
            self.add(t)

    def add(self, text: str) -> None:
        s = trigrams(text)
        for g in s:
            self.inv.setdefault(g, []).append(len(self.sets))
        self.sets.append(s)

    def max_jaccard(self, text: str) -> float:
        s = trigrams(text)
        if not s:
            return 0.0
        hits = Counter(i for g in s for i in self.inv.get(g, ()))
        return max((n / len(s | self.sets[i]) for i, n in hits.items()), default=0.0)


def mcq_text(question: str, options: list[str] | tuple[str, ...]) -> str:
    return question + " " + " ".join(options)


# ---------- teacher + filtry ----------

def teacher_prompt(unit: GenUnit) -> str:
    return (f"Przykłady stylu (z innych aktów):\n{STYLE_EXAMPLES}\n\n"
            f"CAŁY ARTYKUŁ (kontekst):\n{unit.article_text}\n\n"
            f"PRZEPIS DOCELOWY ({unit.cite}):\n{unit.text}\n\n"
            + TEACHER_RULES.format(prefix=unit.prefix))


def ask_teacher(unit: GenUnit, cfg: Config) -> str:
    body = {"model": cfg.teacher, "temperature": 0.7, "max_tokens": 700,
            "reasoning": {"enabled": False},
            "messages": [{"role": "system", "content": TEACHER_SYS},
                         {"role": "user", "content": teacher_prompt(unit)}]}
    resp = post_json(f"{OPENROUTER}/chat/completions", os.environ["OPENROUTER_API_KEY"], body)
    return resp["choices"][0]["message"].get("content") or ""


def parse_candidate(raw: str) -> dict | None:
    m = re.search(r"\{.*\}", re.sub(r"<think>.*?</think>", " ", raw, flags=re.S), flags=re.S)
    if not m:
        return None
    try:
        q = json.loads(m.group(0))
    except json.JSONDecodeError:
        return None
    return q if isinstance(q, dict) else None


def format_problem(q: dict | None) -> str | None:
    """Powód odrzucenia formatu albo None."""
    if q is None:
        return "format: brak JSON"
    opts, idx, stem = q.get("opcje"), q.get("poprawna"), q.get("pytanie")
    if not isinstance(stem, str) or len(stem.strip()) < 20:
        return "format: pytanie"
    if not (isinstance(opts, list) and len(opts) == 3 and all(isinstance(o, str) and o.strip()
                                                               for o in opts)):
        return "format: opcje"
    if len({_norm(o) for o in opts}) != 3:
        return "format: powtórzone opcje"
    if not isinstance(idx, int) or isinstance(idx, bool) or not 0 <= idx <= 2:
        return "format: poprawna"
    if BANNED.search(stem + " " + " ".join(opts)):
        return "format: zakazana opcja"
    return None


def _squash(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().strip("„”\"'").rstrip(".,;:").lower()


def quote_ok(q: dict, unit: GenUnit) -> bool:
    quote = q.get("cytat")
    return isinstance(quote, str) and len(_squash(quote)) >= 10 and \
        _squash(quote) in _squash(unit.text)


def exam_punctuation(opts: list[str]) -> list[str]:
    """Styl arkuszy: dwie pierwsze opcje kończą się przecinkiem, ostatnia kropką."""
    bare = [re.sub(r"[\s,.;]+$", "", o.strip()) for o in opts]
    return [o + ("." if i == len(bare) - 1 else ",") for i, o in enumerate(bare)]


def place_answer(q: dict, target: int) -> tuple[list[str], int]:
    """Przestawia poprawną opcję na pozycję `target`, dystraktory w dotychczasowej kolejności."""
    opts = [o.strip() for o in q["opcje"]]
    correct = opts.pop(q["poprawna"])
    opts.insert(target, correct)
    return exam_punctuation(opts), target


# ---------- przebieg jednej jednostki ----------

@dataclass
class Pipeline:
    """Sędziowie + indeks benchmarków współdzielone między wątkami."""

    cfg: Config
    bench: SimilarityIndex
    basal: BasalJudge
    qwen: ChatJudge

    def process(self, unit: GenUnit) -> dict:
        raw = ask_teacher(unit, self.cfg)
        q = parse_candidate(raw)
        base = {"id": unit.id, "legal_basis": unit.cite, "raw": raw[:1500]}
        problem = format_problem(q)
        if problem:
            return {**base, "rejected": problem}
        if not quote_ok(q, unit):
            return {**base, "rejected": "quote: cytat nie występuje w przepisie", "candidate": q}
        opts, ans = place_answer(q, unit.index % 3)
        sim = self.bench.max_jaccard(mcq_text(q["pytanie"], opts))
        if sim >= self.cfg.jaccard:
            return {**base, "rejected": f"bench: Jaccard {sim:.2f}", "candidate": q}
        item = Item(id=unit.id, source="gen", year=0, question=q["pytanie"].strip(),
                    options=tuple(opts), answer=ans, context=unit.article_text)
        return self._judge(unit, item, q, {**base, "bench_jaccard": round(sim, 3)})

    def _judge(self, unit: GenUnit, item: Item, q: dict, base: dict) -> dict:
        b = self.basal.ask(item, "solve")
        checks = {"basal_choice": b.value, "basal_conf": round(b.confidence or 0, 4)}
        if b.value != "ABC"[item.answer] or (b.confidence or 0) < self.cfg.conf:
            return {**base, "rejected": "basal: nie potwierdził klucza", "candidate": q, **checks}
        v = self.qwen.ask(item, "verify_true")
        checks["qwen_verify"] = v.value
        if v.value != "TAK":
            return {**base, "rejected": "qwen: odrzucił klucz", "candidate": q, **checks}
        closed = self.basal.ask(item, "closed")  # sygnał trudności, nie filtr
        checks["closed_book_correct"] = closed.value == "ABC"[item.answer]
        checks["closed_book_conf"] = round(closed.confidence or 0, 4)
        return accepted_record(unit, item, q, {**checks, "bench_jaccard": base["bench_jaccard"],
                                               "teacher": self.cfg.teacher})


def accepted_record(unit: GenUnit, item: Item, q: dict, checks: dict) -> dict:
    teacher = checks.pop("teacher")
    return {"id": unit.id, "question": item.question, "options": list(item.options),
            "answer": "ABC"[item.answer], "answer_idx": item.answer,
            "legal_basis": unit.cite, "quote": q["cytat"].strip(), "eli": unit.eli,
            "legal_state": unit.state, "source": unit.source,
            "generator": {"script": "bench/gen_legal_mcq.py", "teacher": teacher,
                          "solver": "basal-2.0-max", "verifier": "qwen/qwen3.5-27b"},
            "checks": checks}


# ---------- orkiestracja ----------

def _done_ids(out_dir: str) -> set[str]:
    done = set()
    for name in ("accepted.jsonl", "rejected.jsonl"):
        path = os.path.join(out_dir, name)
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                done |= {json.loads(line)["id"] for line in f if line.strip()}
    return done


def run(pipe: Pipeline, units: list[GenUnit], out_dir: str) -> None:
    done = _done_ids(out_dir)
    todo = [u for u in units if u.id not in done]
    print(f"jednostek do zrobienia: {len(todo)} (gotowe: {len(done)})", flush=True)
    lock, stop = threading.Lock(), threading.Event()
    files = {k: open(os.path.join(out_dir, f"{k}.jsonl"), "a", encoding="utf-8")  # noqa: SIM115
             for k in ("accepted", "rejected")}

    def one(unit: GenUnit) -> None:
        if stop.is_set():
            return
        try:
            rec = pipe.process(unit)
        except FatalApiError:
            stop.set()
            raise
        with lock:
            f = files["rejected" if "rejected" in rec else "accepted"]
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            f.flush()

    try:
        with ThreadPoolExecutor(MAX_PARALLEL) as pool:
            for fut in [pool.submit(one, u) for u in todo]:
                fut.result()
    finally:
        for f in files.values():
            f.close()


def dedup_accepted(out_dir: str, threshold: float) -> tuple[int, int]:
    """Usuwa bliskie duplikaty wśród zaakceptowanych (zostaje pierwszy); przenosi je do rejected."""
    path = os.path.join(out_dir, "accepted.jsonl")
    if not os.path.exists(path):
        return 0, 0
    with open(path, encoding="utf-8") as f:
        recs = [json.loads(line) for line in f if line.strip()]
    index, keep, dups = SimilarityIndex([]), [], []
    for r in recs:
        text = mcq_text(r["question"], r["options"])
        target = dups if index.max_jaccard(text) >= threshold else keep
        target.append(r)
        if target is keep:
            index.add(text)
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(json.dumps(r, ensure_ascii=False) + "\n" for r in keep)
    with open(os.path.join(out_dir, "rejected.jsonl"), "a", encoding="utf-8") as f:
        f.writelines(json.dumps({**r, "rejected": "dup: duplikat w zbiorze"}, ensure_ascii=False)
                     + "\n" for r in dups)
    return len(keep), len(dups)


def length_ratio(rec: dict) -> float:
    """Długość poprawnej / najdłuższy dystraktor (bez końcowej interpunkcji)."""
    opts = [o.rstrip(",.") for o in rec["options"]]
    correct = opts.pop(rec["answer_idx"])
    return len(correct) / max(max(len(o) for o in opts), 1)


def balance_length(out_dir: str, longest_max: float) -> tuple[int, int]:
    """Ogranicza udział pytań z najdłuższą poprawną do `longest_max`; nadmiar -> rejected."""
    path = os.path.join(out_dir, "accepted.jsonl")
    recs = _read_jsonl(path)
    longest = sorted((r for r in recs if length_ratio(r) > 1), key=length_ratio, reverse=True)
    # najmniejsze d takie, że (L - d) / (n - d) <= longest_max
    n, total_long, drop = len(recs), len(longest), 0
    while total_long - drop > longest_max * (n - drop) and drop < total_long:
        drop += 1
    dropped = {id(r) for r in longest[:drop]}
    keep = [r for r in recs if id(r) not in dropped]
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(json.dumps(r, ensure_ascii=False) + "\n" for r in keep)
    with open(os.path.join(out_dir, "rejected.jsonl"), "a", encoding="utf-8") as f:
        f.writelines(json.dumps({**r, "rejected": f"length: poprawna najdłuższa x{length_ratio(r):.2f}"},
                                ensure_ascii=False) + "\n" for r in longest[:drop])
    return len(keep), drop


def stats(out_dir: str) -> str:
    acc = _read_jsonl(os.path.join(out_dir, "accepted.jsonl"))
    rej = _read_jsonl(os.path.join(out_dir, "rejected.jsonl"))
    total = len(acc) + len(rej)
    reasons = Counter(r["rejected"].split(":")[0] for r in rej)
    letters = Counter(r["answer"] for r in acc)
    longest = sum(length_ratio(r) > 1 for r in acc)
    lines = ["# gen_legal_mcq — statystyki", "",
             f"- jednostek przetworzonych: {total}",
             f"- zaakceptowane: {len(acc)} ({len(acc) / max(total, 1) * 100:.1f}%)",
             f"- litery A/B/C: {letters['A']}/{letters['B']}/{letters['C']}",
             f"- poprawna najdłuższą opcją: {longest} ({longest / max(len(acc), 1) * 100:.1f}%)",
             "", "| powód odrzucenia | liczba |", "|---|---|"]
    lines += [f"| {k} | {v} |" for k, v in reasons.most_common()]
    return "\n".join(lines) + "\n"


def _read_jsonl(path: str) -> list[dict]:
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def select_units(path: str, bench_rows: list[dict], year: int) -> tuple[list[GenUnit], set]:
    """Jednostki do generacji minus artykuły cytowane w benchmarkach z roku `year`."""
    if not is_code_units(path):
        excl = excluded_articles(path, bench_rows, year)
        return generation_units(path, excl), excl
    with open(path, encoding="utf-8") as f:
        act = json.loads(f.readline())["act"]
    excl = excluded_code_articles(bench_rows, year, act)
    valid = {_base(r) for r in _code_articles(path)}
    # Klucze egzaminów spłaszczają indeks górny ("art. 2233" = art. 223³): numer spoza aktu
    # mapujemy na najdłuższy istniejący prefiks (223) i wykluczamy cały artykuł bazowy.
    excl = {n if n in valid else next((n[:k] for k in (-1, -2) if n[:k] in valid), n)
            for n in excl}
    return load_code_units(path, excl), excl


def _code_articles(path: str) -> list[str]:
    with open(path, encoding="utf-8") as f:
        return [json.loads(line)["article"] for line in f if line.strip()]


def _args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--units", required=True)
    ap.add_argument("--bench", action="append", required=True, help="NAME=path.jsonl")
    ap.add_argument("--out", required=True)
    ap.add_argument("--limit", type=int, default=0, help="tylko pierwsze N jednostek (pilot)")
    ap.add_argument("--sample", type=int, default=0, help="losowe N jednostek (seed 2026)")
    ap.add_argument("--exclude-year", type=int, default=2026)
    ap.add_argument("--conf", type=float, default=0.9)
    ap.add_argument("--jaccard", type=float, default=0.5)
    ap.add_argument("--teacher", default=TEACHER)
    ap.add_argument("--longest-max", type=float, default=1 / 3,
                    help="maks. udział pytań z najdłuższą poprawną opcją (rebalans)")
    ap.add_argument("--env-file")
    return ap.parse_args()


def main() -> None:
    a = _args()
    load_env_file(a.env_file)
    bench_rows = _read_benches(a.bench)
    units, excl = select_units(a.units, bench_rows, a.exclude_year)
    units = units[: a.limit] if a.limit else units
    if a.sample:
        units = sorted(random.Random(2026).sample(units, min(a.sample, len(units))),
                       key=lambda u: u.index)
    print(f"wykluczone artykuły ({a.exclude_year}): {sorted(excl)}; jednostek: {len(units)}")
    os.makedirs(a.out, exist_ok=True)
    pipe = Pipeline(Config(a.conf, a.jaccard, a.teacher),
                    SimilarityIndex([mcq_text(r["question"], r["options"]) for r in bench_rows]),
                    BasalJudge(os.environ["FABRYKA_API_KEY"]),
                    ChatJudge(OPENROUTER, os.environ["OPENROUTER_API_KEY"], "qwen/qwen3.5-27b",
                              {"reasoning": {"enabled": False}}))
    try:
        run(pipe, units, a.out)
    except FatalApiError as e:
        print(f"STOP: API odrzuca zapytania — {e}\nNapisz do Kacpra o zwiększenie limitów.",
              file=sys.stderr)
    kept, dups = dedup_accepted(a.out, a.jaccard)
    print(f"dedup: zostaje {kept}, duplikatów {dups}")
    kept, longer = balance_length(a.out, a.longest_max)
    print(f"rebalans długości: zostaje {kept}, odrzuconych {longer}")
    text = stats(a.out)
    with open(os.path.join(a.out, "STATS.md"), "w", encoding="utf-8") as f:
        f.write(text)
    print(text)


if __name__ == "__main__":
    main()
