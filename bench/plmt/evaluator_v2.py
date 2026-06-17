"""
Polish Morphology Evaluator v2
==============================
Rozszerzenie evaluator.py (lizzy-606) o poziomy trudności, losową kolejność
w obrębie poziomu, oraz orkiestrację wielu modeli × wielu seedów.

Backendy modeli i lista 4 modeli ocenianych są współdzielone z PL-GEN
(`bench.plgen.common`): ten sam adapter ollama / OpenRouter, te same tagi
i temperatury wydawcy. Klucze MODELS: bielik, qwen35_instruct, qwen36, gemma4.

Najważniejsze zmiany vs v0.1:
  * dopasowanie odpowiedzi po GRANICY SŁOWA — 'lepiej' nie zalicza 'najlepiej',
    'duże' nie podświetla się fałszywie w 'dużej' (poprzednio substring → false PASS).
  * early stopping WYŁĄCZONY domyślnie (kwiscion chce pełny przebieg).
  * losowa kolejność pytań W OBRĘBIE poziomu (seed), kolejność poziomów stała —
    LLM nie gra pozycją (lizzy: "kolejność w obrębie jednego zadania daj losową").
  * raport per poziom; agregat per (model, poziom) z mean±std po seedach.

Użycie:
    # pojedynczy przebieg
    python bench/plmt/evaluator_v2.py --model qwen35_instruct --seed 42

    # siatka: 4 modele × 5 seedów + agregat (cross-seed, cross-model)
    python bench/plmt/evaluator_v2.py \
        --models bielik,qwen35_instruct,qwen36,gemma4 --seeds 42,43,44,45,46

    # tylko agregat z już zapisanych wyników
    python bench/plmt/evaluator_v2.py --models qwen35_instruct --seeds 42,43,44,45,46 --aggregate-only

    python bench/plmt/evaluator_v2.py --dry-run
    python bench/plmt/evaluator_v2.py --selftest
"""

import argparse
import json
import os
import random
import re
import statistics
import sys
from datetime import datetime

# uruchamiane jako goły skrypt -> dodaj root repo, by zaimportować bench.plgen.common
_REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)
from bench.plgen import common  # noqa: E402

# Dane eval (eval_only) NIE są w publicznym repo slayer — master w prywatnym repo
# datasets (data/eval/plmt/), lokalna kopia w gitignorowanym slayer-data/plmt/.
# Zarejestrowane w bench/decon_audit.py:EVAL_SOURCES. Wzorzec jak common.DATA w PL-GEN.
DEFAULT_FILE = os.path.join(_REPO, "slayer-data", "plmt", "polish_morph_tests_v02.json")
RUNS_DIR = os.path.join(_REPO, "slayer-data", "plmt", "runs")

# System prompt morfologiczny (krótkie formy, bez wyjaśnień) — inny niż generacyjny
# common.SYS, bo to elicytacja kompetencji, nie swobodna generacja.
MORPH_SYS = (
    "Jesteś ekspertem od gramatyki polskiej. Odpowiadaj krótko i precyzyjnie — "
    "tylko forma lub formy, bez wyjaśnień, chyba że pytanie wprost prosi o uzasadnienie."
)


# ─── Dopasowanie odpowiedzi ──────────────────────────────────────────────────

def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().rstrip(".").lower())


def contains_form(form: str, response_norm: str) -> bool:
    """True gdy `form` występuje w odpowiedzi jako całe słowo/fraza.

    Granica słowa (lookaround na \\w) zamiast substring: 'lepiej' NIE zalicza
    'najlepiej', 'duże' NIE trafia w 'dużej'. Spacje we frazie -> \\s+.
    """
    f = normalize(form)
    if not f:
        return False
    pat = re.escape(f).replace(r"\ ", " ").replace(" ", r"\s+")
    return re.search(rf"(?<!\w){pat}(?!\w)", response_norm) is not None


def check_answer(response: str, test: dict) -> dict:
    r = normalize(response)
    distractors = test.get("distractor", [])
    # AND-match dla pytań "wymień wszystkie przypadki": liczy się KOMPLET nazw,
    # niezależnie od szyku/spójnika ('i' vs 'oraz') — inaczej acceptable goni frazowanie
    # każdego modelu z osobna. ponytail: prosty AND podciągów; "to NIE mianownik lecz..."
    # (oba słowa, zła intencja) przeszłoby — rzadkie, akceptowalny sufit.
    req = test.get("acceptable_all")
    if req and all(contains_form(f, r) for f in req):
        hit = [d for d in distractors if contains_form(d, r)]
        return {"passed": True, "matched_form": " + ".join(req),
                "hit_distractor": bool(hit), "distractors_hit": hit}
    for form in test["acceptable"]:
        if contains_form(form, r):
            hit = [d for d in distractors
                   if contains_form(d, r) and normalize(d) != normalize(form)]
            return {"passed": True, "matched_form": form,
                    "hit_distractor": bool(hit), "distractors_hit": hit}
    hit = [d for d in distractors if contains_form(d, r)]
    return {"passed": False, "matched_form": None,
            "hit_distractor": bool(hit), "distractors_hit": hit}


# ─── Ładowanie i kolejność testów ────────────────────────────────────────────

def load_tests(path, category_filter=None, level_filter=None):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    tests = data["tests"]
    if category_filter:
        tests = [t for t in tests if t["category"] == category_filter]
    if level_filter:
        tests = [t for t in tests if t.get("level") in level_filter]
    return tests, data.get("level_descriptions", {})


def order_tests(tests, seed):
    """Stała kolejność POZIOMÓW, losowa kolejność W OBRĘBIE poziomu (seeded).

    Early stopping zależy od narastających poziomów -> poziomy nie są tasowane.
    Tasowanie wewnątrz poziomu odbiera modelowi możliwość grania pozycją.
    """
    rng = random.Random(seed)
    by_level = {}
    for t in tests:
        by_level.setdefault(t.get("level", 0), []).append(t)
    ordered = []
    for lvl in sorted(by_level):
        group = by_level[lvl][:]
        rng.shuffle(group)
        ordered.extend(group)
    return ordered


# ─── Zapytanie do modelu (przez common.ask) ──────────────────────────────────

def query_model(prompt, model, seed):
    if model not in common.MODELS:
        sys.exit(f"Nieznany model '{model}'. Dostępne: {', '.join(common.MODELS)}")
    backend, tag, temp = common.MODELS[model]
    return common.ask(backend, tag, temp, prompt, num_predict=256,
                      seed=seed, system=MORPH_SYS)


# ─── Przebieg ────────────────────────────────────────────────────────────────

def _score(test, response, lvl):
    res = check_answer(response, test)
    res.update(category=test["category"], level=lvl, id=test["id"], response=response)
    return res


def run_tests(tests, model, seed, early_stop_n, verbose, skip_generative, workers=8):
    """Zwraca (results, stopped_at_level).

    Bez early-stop (domyślnie) wątkujemy po testach — bottleneckiem jest round-trip
    do OpenRouter, nie CPU. Z early-stop musimy iść sekwencyjnie (zależność od kolejności).
    """
    tests = [t for t in tests if not (skip_generative and t.get("is_generative"))]
    if not early_stop_n and workers > 1:
        return _run_parallel(tests, model, seed, verbose, workers)

    results = []
    current_level = None
    consecutive_fails = 0
    stopped_at = None

    for test in tests:
        lvl = test.get("level", 0)
        if lvl != current_level:
            current_level = lvl
            consecutive_fails = 0

        response = query_model(test["prompt"], model, seed)
        res = _score(test, response, lvl)
        results.append(res)
        print_result(test, response, res, verbose)

        if not res["passed"]:
            consecutive_fails += 1
            if early_stop_n and consecutive_fails >= early_stop_n:
                stopped_at = lvl
                print(f"\n  ⚠ {consecutive_fails} kolejne faile na poziomie {lvl} — early stop.")
                break
        else:
            consecutive_fails = 0
    return results, stopped_at


def _run_parallel(tests, model, seed, verbose, workers):
    from concurrent.futures import ThreadPoolExecutor, as_completed
    results = [None] * len(tests)

    def one(i, test):
        response = query_model(test["prompt"], model, seed)
        return i, test, response, _score(test, response, test.get("level", 0))

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(one, i, t) for i, t in enumerate(tests)]
        for f in as_completed(futs):
            i, test, response, res = f.result()
            results[i] = res
            print_result(test, response, res, verbose)
    return results, None


# ─── Wyświetlanie ────────────────────────────────────────────────────────────

def print_result(test, response, result, verbose=False):
    status = "✓" if result["passed"] else "✗"
    level_tag = f"[L{test.get('level', '?')}]"
    warn = " [DYSTRAKTOR!]" if result["hit_distractor"] and not result["passed"] else ""
    print(f"\n{status} {level_tag} [{test['id']}] {test['category']}")
    if verbose or not result["passed"]:
        print(f"  Pytanie:    {test['prompt']}")
        print(f"  Oczekiwane: {test['expected']}")
        print(f"  Odpowiedź:  {response.strip()}")
    if result["passed"]:
        print(f"  Forma: '{result['matched_form']}' ✓")
    else:
        print(f"  Brak oczekiwanej formy{warn}")
        if result["distractors_hit"]:
            print(f"  Trafione dystraktory: {result['distractors_hit']}")
    if verbose and test.get("note"):
        print(f"  Uwaga: {test['note']}")


def level_breakdown(results):
    """{level: {'passed':int,'total':int,'distractor':int}}"""
    out = {}
    for r in results:
        lvl = r.get("level", 0)
        b = out.setdefault(lvl, {"passed": 0, "total": 0, "distractor": 0})
        b["total"] += 1
        b["passed"] += int(r["passed"])
        b["distractor"] += int(r["hit_distractor"] and not r["passed"])
    return out


def print_summary(results, model, seed, level_descriptions, stopped_at=None):
    total = len(results)
    passed = sum(r["passed"] for r in results)
    distractor_hits = sum(r["hit_distractor"] and not r["passed"] for r in results)
    print("\n" + "═" * 64)
    print(f"  Model: {model}  seed: {seed}")
    print(f"  Wynik: {passed}/{total} ({100 * passed / total:.0f}%)" if total else "  brak testów")
    print(f"  Błędy z dystraktorami: {distractor_hits}")
    if stopped_at:
        print(f"  ⚠ Early stop na poziomie {stopped_at} — dalsze poziomy pominięte")
    print("\n  Per poziom:")
    for lvl, b in sorted(level_breakdown(results).items()):
        p, t = b["passed"], b["total"]
        bar = "█" * p + "░" * (t - p)
        desc = level_descriptions.get(str(lvl), "").split(" — ")[0]
        mark = " ← STOP" if lvl == stopped_at else ""
        print(f"    L{lvl} {bar} {p}/{t}  {desc}{mark}")
    print("═" * 64)
    return passed, total


# ─── Zapis / wczytanie wyników ────────────────────────────────────────────────

def result_path(model, seed):
    safe = re.sub(r"[^\w]", "_", model)
    return os.path.join(RUNS_DIR, f"results_{safe}_s{seed}.json")


def save_results(results, model, seed, stopped_at, path=None):
    os.makedirs(RUNS_DIR, exist_ok=True)
    path = path or result_path(model, seed)
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"model": model, "seed": seed,
                   "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
                   "early_stop_at_level": stopped_at, "results": results},
                  f, ensure_ascii=False, indent=2)
    print(f"\n  Wyniki zapisane: {path}")
    return path


# ─── Agregat cross-seed / cross-model ─────────────────────────────────────────

def aggregate(models, seeds, level_descriptions):
    """Tabela model × poziom: pass-rate mean±std po seedach + częste faile."""
    print("\n" + "█" * 64)
    print("  AGREGAT — pass-rate per poziom (mean±std po seedach)")
    print("█" * 64)

    all_levels = set()
    per_model = {}  # model -> {level -> [rate_seed1, rate_seed2, ...]}
    fail_counts = {}  # model -> {test_id -> n_fail}

    for model in models:
        per_model[model] = {}
        fail_counts[model] = {}
        for seed in seeds:
            p = result_path(model, seed)
            if not os.path.exists(p):
                print(f"  (brak {p} — pomijam)")
                continue
            data = json.load(open(p, encoding="utf-8"))
            for lvl, b in level_breakdown(data["results"]).items():
                all_levels.add(lvl)
                per_model[model].setdefault(lvl, []).append(b["passed"] / b["total"])
            for r in data["results"]:
                if not r["passed"]:
                    fail_counts[model][r["id"]] = fail_counts[model].get(r["id"], 0) + 1

    levels = sorted(all_levels)
    header = "  model".ljust(22) + "".join(f"L{l}".rjust(11) for l in levels)
    print("\n" + header)
    print("  " + "─" * (len(header) - 2))
    for model in models:
        row = f"  {model}".ljust(22)
        for lvl in levels:
            rates = per_model[model].get(lvl, [])
            if not rates:
                row += "—".rjust(11)
            else:
                m = statistics.mean(rates)
                s = statistics.stdev(rates) if len(rates) > 1 else 0.0
                row += f"{m:.2f}±{s:.2f}".rjust(11)
        print(row)

    print("\n  Legenda poziomów:")
    for lvl in levels:
        print(f"    L{lvl}: {level_descriptions.get(str(lvl), '')}")

    print("\n  Najczęstsze faile (id: faile/przebiegi):")
    for model in models:
        n_runs = sum(os.path.exists(result_path(model, s)) for s in seeds)
        if not n_runs:
            continue
        top = sorted(fail_counts[model].items(), key=lambda kv: -kv[1])[:8]
        items = ", ".join(f"{tid}:{n}/{n_runs}" for tid, n in top)
        print(f"    {model}: {items}")
    print("█" * 64)


# ─── Dry-run ─────────────────────────────────────────────────────────────────

def dry_run(tests, level_descriptions, seed):
    for t in order_tests(tests, seed):
        lvl = t.get("level", 0)
        print(f"[L{lvl}] [{t['id']}] {t['category']}")
        print(f"    Pytanie:    {t['prompt']}")
        print(f"    Oczekiwane: {t['expected']}")
        if t.get("distractor"):
            print(f"    Dystraktory: {', '.join(t['distractor'])}")


# ─── Self-test dopasowania ───────────────────────────────────────────────────

def selftest():
    # granica słowa: forma poprawna nie zalicza się jako podciąg dłuższej, błędnej
    assert not contains_form("lepiej", normalize("Najlepiej brzmi to tak"))
    assert contains_form("lepiej", normalize("Forma to lepiej."))
    assert not contains_form("duże", normalize("dużej"))
    assert contains_form("duże", normalize("duże okna"))
    # fraza ze spacją
    assert contains_form("nie boję się", normalize("Mówimy: nie boję się tego"))
    assert not contains_form("nie boję się", normalize("nie się boję"))
    # distractor będący podciągiem poprawnej nie podświetla się
    t = {"acceptable": ["dużej"], "distractor": ["duże"]}
    r = check_answer("dużej", t)
    assert r["passed"] and not r["hit_distractor"], r
    # superlatyw jako błąd: nie zalicza, trafia dystraktor
    t = {"acceptable": ["lepiej"], "distractor": ["najlepiej"]}
    r = check_answer("najlepiej", t)
    assert not r["passed"] and r["hit_distractor"], r
    # AND-match: komplet nazw niezależnie od szyku/spójnika; brak jednej -> fail
    t = {"acceptable": [], "acceptable_all": ["mianownik", "dopełniacz"], "distractor": []}
    assert check_answer("Mianownik liczba mnoga oraz dopełniacz liczba mnoga", t)["passed"]
    assert not check_answer("To dopełniacz liczby pojedynczej", t)["passed"]
    print("selftest OK")


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Polish Morphology Evaluator v2")
    ap.add_argument("--model", default="qwen35_instruct", help="pojedynczy model (klucz common.MODELS)")
    ap.add_argument("--models", default=None, help="siatka modeli, np. bielik,qwen35_instruct,qwen36,gemma4")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--seeds", default=None, help="siatka seedów, np. 42,43,44,45,46")
    ap.add_argument("--levels", default=None, help="filtr poziomów, np. 1,2,3")
    ap.add_argument("--tests", default=None, help="filtr kategorii, np. NUM_COLL")
    ap.add_argument("--file", default=DEFAULT_FILE)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--skip-generative", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--force", action="store_true", help="nadpisz istniejące wyniki (domyślnie pomija)")
    ap.add_argument("--aggregate-only", action="store_true", help="tylko agregat z zapisanych plików")
    ap.add_argument("--workers", type=int, default=8, help="równoległe zapytania (bez early-stop)")
    ap.add_argument("--early-stop", type=int, default=0, metavar="N",
                    help="przerwij po N kolejnych failach na poziomie (0 = wyłączone, domyślnie)")
    args = ap.parse_args()

    if args.selftest:
        selftest()
        return

    models = args.models.split(",") if args.models else [args.model]
    seeds = [int(s) for s in args.seeds.split(",")] if args.seeds else [args.seed]
    level_filter = [int(x) for x in args.levels.split(",")] if args.levels else None

    tests, level_descriptions = load_tests(args.file, args.tests, level_filter)

    if args.dry_run:
        dry_run(tests, level_descriptions, seeds[0])
        return

    if args.aggregate_only:
        aggregate(models, seeds, level_descriptions)
        return

    for model in models:
        for seed in seeds:
            path = result_path(model, seed)
            ordered = order_tests(tests, seed)

            # Cache odpowiedzi z poprzedniego biegu: zmiana golda -> re-scoring bez LLM;
            # tylko NOWE id (nowe pytania) wymagają realnego zapytania. --force = od zera.
            cached = {}
            if os.path.exists(path) and not args.force:
                for r in json.load(open(path, encoding="utf-8"))["results"]:
                    cached[r["id"]] = r.get("response", "")

            missing = [t for t in ordered if t["id"] not in cached]
            stopped_at = None
            if missing:
                print(f"\n→ {model} s{seed}: {len(missing)} nowych pytań do wygenerowania"
                      f" ({len(cached)} z cache)")
                # bielik = lokalna ollama (jeden GPU serializuje) -> mniej workerów
                workers = 2 if common.MODELS.get(model, (None,))[0] == "ollama" else args.workers
                new, stopped_at = run_tests(
                    missing, model, seed, args.early_stop, args.verbose,
                    args.skip_generative, workers)
                for r in new:
                    cached[r["id"]] = r["response"]
            else:
                print(f"\n→ {model} s{seed}: wszystkie odpowiedzi w cache — tylko re-scoring (0 LLM)")

            # Re-score CAŁOŚCI względem aktualnego datasetu (acceptable/level mogły się zmienić)
            results = [_score(t, cached[t["id"]], t.get("level", 0))
                       for t in ordered if t["id"] in cached]
            print_summary(results, model, seed, level_descriptions, stopped_at)
            save_results(results, model, seed, stopped_at, path)

    if len(models) * len(seeds) > 1:
        aggregate(models, seeds, level_descriptions)


if __name__ == "__main__":
    main()
