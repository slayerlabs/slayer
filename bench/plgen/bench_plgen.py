#!/usr/bin/env python3
"""PL-GEN — orchestrator (A2: GENERACJA).

Etap `gen`: dla każdego modelu ocenianego z common.MODELS generuje wypowiedzi
na zbiorze promptów, dla 3 seedów (domyślnie 42,43,44), na temperaturze
rekomendowanej przez wydawcę (zaszytej w MODELS), z zapisem długości do
normalizacji. Surowe generacje per item lecą do gitignorowanego common.RUNS.
Idempotentnie: pomija (model,seed), którego plik już istnieje.

Scoring/agregacja (A4) DOPISYWANE PÓŹNIEJ do tego pliku — patrz `SEAM (A4)`
niżej oraz subkomenda `--stage`. A2 NIE implementuje scoringu.

Usage (A2):
  python bench/plgen/bench_plgen.py --models bielik,qwen35_instruct --n 0 --seeds 42,43,44
  # --n 0 = wszystkie prompty; domyślnie common.DATA, fallback do dev fixture.
"""
import argparse
import json
import os
import statistics
import sys
import threading
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

# uruchamiane też jako goły skrypt (python bench/plgen/bench_plgen.py) -> dodaj root repo
_REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

from bench.plgen import common  # noqa: E402
from bench.plgen import grammar_check  # noqa: E402
from bench.plgen import judge_panel  # noqa: E402

DEFAULT_SEEDS = [42, 43, 44]
NUM_PREDICT = 400  # budżet generacji (wyjścia ~200 słów/~300 tok; 400 z zapasem mieści GPU)
NUM_CTX = 2048     # okno kontekstu ollama (prompty ~40 tok); mały KV cache = model GPU-resident
PROGRESS_EVERY = 20  # co ile ukończonych itemów emitować linię postępu (+ zawsze ostatni)

# dev fixture — fallback gdy brak prywatnego common.DATA
DEV_FIXTURE = os.path.join(os.path.dirname(__file__), "testdata", "dev_prompts.jsonl")


def run_path(model, seed):
    """Ścieżka pliku surowych generacji dla (model,seed). A4 czyta stąd."""
    return os.path.join(common.RUNS, f"gen_{model}_s{seed}.jsonl")


def gen_stream_path(model, seed):
    """Ścieżka pliku diagnostycznego streamu generacji (debug, pod common.RUNS)."""
    return os.path.join(common.RUNS, f"gen_{model}_s{seed}.stream.jsonl")


def generate(models, prompts, seeds=None, workers=8, num_predict=None, num_ctx=None,
             ollama_workers=1, diag=False):
    """Generuj wypowiedzi: dla każdego (model × seed) wołaj common.ask per prompt.

    models: dict name -> (backend, tag, temp) (podzbiór common.MODELS).
    prompts: lista dictów (schemat common.PROMPT_KEYS).
    Idempotentnie: jeśli plik run_path(model,seed) istnieje -> pomiń tę parę.
    Placeholderowy tag (__PLACEHOLDER) -> pomiń model z ostrzeżeniem.

    num_predict/num_ctx: budżety przekazywane do common.ask (None -> moduł NUM_PREDICT/
    NUM_CTX). ollama używa num_ctx (mniejszy KV cache = model GPU-resident); openrouter
    ignoruje num_ctx.

    ollama_workers: cap równoległości dla ollama (domyślnie 1 — przy częściowym
    offloadzie na CPU równoległe żądania kontendują o warstwy CPU + VRAM KV i NIE
    przyspieszają; 1 worker trzyma model GPU-resident). openrouter = pełne workers.

    diag (debug): gdy True, każdy ukończony item jest dopisywany na bieżąco (flush)
    do gitignorowanego gen_*.stream.jsonl (taki sam kształt rekordu jak plik
    finalny). Kanoniczny atomowy gen_*.jsonl nadal pisany na końcu (kontrakt score()).
    """
    seeds = seeds or DEFAULT_SEEDS
    num_predict = NUM_PREDICT if num_predict is None else num_predict
    num_ctx = NUM_CTX if num_ctx is None else num_ctx
    os.makedirs(common.RUNS, exist_ok=True)

    for name, (backend, tag, temp) in models.items():
        if common.is_placeholder(tag):
            print(f"[{name}] POMIJAM — tag to placeholder ({tag}); brak źródła modelu. "
                  f"(patrz MODELS/TODO w common.py)")
            continue

        # ollama: 1 worker (partial-CPU-offload GPU — parallel kontenduje, nie przyspiesza,
        # trzymamy model GPU-resident). openrouter: pełne workers.
        w = workers if backend == "openrouter" else min(workers, ollama_workers)
        for seed in seeds:
            out = run_path(name, seed)
            if os.path.exists(out):
                print(f"[{name} s{seed}] istnieje -> pomijam ({out})")
                continue
            total = len(prompts)
            print(f"[{name} s{seed}] generuję ({backend}: {tag}, temp={temp}, "
                  f"workers={w}, n={total})…")

            # diag stream: świeży plik (usuń stary), dopisuj item gdy gotowy (flush)
            stream_f, stream_lock = None, None
            if diag:
                sp = gen_stream_path(name, seed)
                stream_f = open(sp, "w", encoding="utf-8")
                stream_lock = threading.Lock()
                print(f"[{name} s{seed}] diag stream -> {sp}", flush=True)

            def one(idx, it):
                ans = common.ask(backend, tag, temp, it["prompt"],
                                 num_predict=num_predict, seed=seed, num_ctx=num_ctx)
                return idx, {"id": it["id"], "domena": it["domena"], "model": name,
                             "seed": seed, "ans": ans, "n_tokens": common.count_tokens(ans),
                             "len_target": it["len_target"]}

            # per-item postęp: as_completed (kolejność ukończenia != wejściowa),
            # więc wynik składamy po idx by zachować pierwotny porządek/kształt.
            rows = [None] * total
            t0 = time.time()
            done = 0
            lock = threading.Lock()
            try:
                with ThreadPoolExecutor(max_workers=w) as ex:
                    futs = [ex.submit(one, i, it) for i, it in enumerate(prompts)]
                    for fut in as_completed(futs):
                        idx, row = fut.result()
                        rows[idx] = row
                        if stream_f is not None:
                            with stream_lock:
                                stream_f.write(json.dumps(row, ensure_ascii=False) + "\n")
                                stream_f.flush()
                        with lock:
                            done += 1
                            d = done
                        if d % PROGRESS_EVERY == 0 or d == total:
                            print(f"[{name} s{seed}] infer {d}/{total} "
                                  f"({int(time.time() - t0)}s)", flush=True)
            finally:
                if stream_f is not None:
                    stream_f.close()

            # zapis atomowy: tmp -> rename, by przerwany przebieg nie udawał gotowego
            tmp = out + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                for r in rows:
                    f.write(json.dumps(r, ensure_ascii=False) + "\n")
            os.replace(tmp, out)
            empty = sum(1 for r in rows if not r["ans"].strip())
            flag = f" | PUSTE: {empty} (artefakt harnessu!)" if empty else ""
            print(f"[{name} s{seed}] zapisano {len(rows)} -> {out}{flag}")


def select_per_domena(prompts, n):
    """Wybierz pierwsze N itemów KAŻDEJ domeny, zachowując pierwotną kolejność/stratyfikację.

    Iterujemy prompty w oryginalnym porządku i bierzemy item, dopóki jego domena nie
    przekroczyła limitu N. Dzięki temu kolejność wynikowa = podzbiór oryginalnej.
    """
    seen = defaultdict(int)
    out = []
    for it in prompts:
        d = it.get("domena", "")
        if seen[d] < n:
            seen[d] += 1
            out.append(it)
    return out


def load_dataset(path=None):
    """Wczytaj prompty: common.DATA lub fallback do dev fixture (z notką)."""
    p = path or common.DATA
    if not os.path.exists(p):
        print(f"[plgen] UWAGA: brak {p} -> fallback do dev fixture {DEV_FIXTURE}")
        p = DEV_FIXTURE
    return common.load_prompts(p), p


# ============================================================================
# SEAM (A4) — scoring / agregacja.
#
# score(): czyta surowe generacje z run_path(model, seed), odpala Layer A
# (grammar_check.score_docs) + Layer B (judge_panel.panel_score), zapisuje
# per-(model,seed) plik scored do common.RUNS (gitignored, detal). Idempotentnie.
#
# aggregate(): czyta pliki scored, uśrednia po seedach (z wariancją międzyseedową),
# emituje WYŁĄCZNIE agregaty do common.OUT (plgen_v1.json). Sub-score'y warstw
# trzymane OSOBNO — NIGDY nie uśredniamy LT (Layer A) z sędziami (Layer B).
#
# matrix_section(): składa gotową-do-wklejenia sekcję do public/results/matrix.json
# (kształt dashboardu: cols/rows[].name+vals/note/official_for/protocol).
# Człowiek wkleja ją ręcznie (zgodnie z planem) — NIE edytujemy matrix.json.
# ============================================================================

# gotowa-do-wklejenia sekcja matrix (NIE auto-edytujemy matrix.json — człowiek wkleja)
MATRIX_SECTION_OUT = "public/results/plgen_matrix_section.json"

# bucket'y Layer A raportowane osobno (other agregujemy, ale w matrix pokazujemy 3 główne)
_LA_BUCKETS = ("morphosyntax", "spelling", "style", "other")
_LA_MAIN = ("morphosyntax", "spelling", "style")

# nazwy wyświetlane modeli w matrix.json (dopasowane do istniejących, gdzie się da)
MODEL_DISPLAY = {
    "bielik": "Bielik-11B-v3",
    "qwen35_instruct": "Qwen3.5-27B (instr)",
    "qwen36": "Qwen3.6-27B",
    "gemma4": "Gemma-4-31B-it",
}

# czytelne polskie nazwy domen w wierszach per-domena (fallback: surowy klucz)
DOMENA_DISPLAY = {
    "rekcja": "rekcja", "liczebniki": "liczebniki", "kalki": "kalki/AI-style",
    "rejestr": "rejestr", "zgoda": "zgoda", "wolacz": "wołacz", "toponimy": "toponimy",
    "aspekt": "aspekt", "ortografia": "ortografia", "spojnosc": "spójność",
}


def scored_path(model, seed):
    """Ścieżka pliku z werdyktami obu warstw dla (model,seed). Pod common.RUNS (gitignored)."""
    return os.path.join(common.RUNS, f"scored_{model}_s{seed}.json")


def judge_stream_path(model, seed):
    """Ścieżka pliku diagnostycznego streamu werdyktów sędziów (debug, pod common.RUNS)."""
    return os.path.join(common.RUNS, f"judge_{model}_s{seed}.stream.jsonl")


def _read_runs(path):
    """Wczytaj plik generacji gen_*.jsonl -> lista wierszy (id, domena, ans, ...)."""
    rows = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def _layer_a_with_domains(rows, base_url):
    """Layer A: score_docs na całości + per-domena (grupujemy po 'domena').

    Liczymy per-domena tutaj (nie modyfikując grammar_check): osobne wywołanie
    score_docs na tekstach każdej domeny -> mean_errors_per_100tok per bucket.
    """
    texts = [r.get("ans", "") for r in rows]
    overall = grammar_check.score_docs(texts, base_url)

    by_dom = defaultdict(list)
    for r in rows:
        by_dom[r.get("domena", "")].append(r.get("ans", ""))
    per_domena = {
        dom: grammar_check.score_docs(ts, base_url)["mean_errors_per_100tok"]
        for dom, ts in sorted(by_dom.items())
    }
    overall["per_domena"] = per_domena
    return overall


def score(models, seeds, prompts_path=None, workers=8, judges=None, diag=False):
    """Etap `score`: dla każdej (model,seed) odpal Layer A + Layer B, zapisz scored.

    Idempotentnie: jeśli scored_path(model,seed) istnieje -> pomiń (model,seed)
    (nie wołamy LT ani sędziów). Layer A wymaga kontenera LT -> ensure_lt()
    (leniwie, dopiero gdy faktycznie jest co liczyć).

    diag (debug): gdy True, werdykty sędziów lecą na bieżąco (flush) do
    gitignorowanego judge_*.stream.jsonl (przez panel_score(stream_path=...)).
    """
    prompts_path = prompts_path or common.DATA
    os.makedirs(common.RUNS, exist_ok=True)

    # placeholdery (brak źródła modelu) generate() pomija -> tu też, bez szumu „brak generacji"
    models = {n: v for n, v in models.items() if not common.is_placeholder(v[1])}

    # czy w ogóle jest coś do policzenia? (ensure_lt dopiero wtedy — zero docker bez potrzeby)
    todo = [(name, seed) for name in models for seed in seeds
            if os.path.exists(run_path(name, seed)) and not os.path.exists(scored_path(name, seed))]
    if not todo:
        for name in models:
            for seed in seeds:
                if os.path.exists(scored_path(name, seed)):
                    print(f"[{name} s{seed}] scored istnieje -> pomijam")
                elif not os.path.exists(run_path(name, seed)):
                    print(f"[{name} s{seed}] brak generacji {run_path(name, seed)} -> pomijam")
        return

    base_url = grammar_check.ensure_lt()  # Layer A: kontener LT (pinned)
    prompts = {p["id"]: p for p in common.load_prompts(prompts_path)}

    # panel sędziów: domyślnie pełny judge_panel.PANEL; --judges zawęża po nazwie
    panel_list = judge_panel.PANEL
    if judges:
        panel_list = [j for j in judge_panel.PANEL if j[0] in judges]
        if not panel_list:
            raise SystemExit(f"żaden sędzia nie pasuje do {judges}; "
                             f"dostępni: {[j[0] for j in judge_panel.PANEL]}")
    print(f"[plgen] panel sędziów: {[j[0] for j in panel_list]}")

    for name in models:
        for seed in seeds:
            gp = run_path(name, seed)
            sp = scored_path(name, seed)
            if os.path.exists(sp):
                print(f"[{name} s{seed}] scored istnieje -> pomijam ({sp})")
                continue
            if not os.path.exists(gp):
                print(f"[{name} s{seed}] brak generacji {gp} -> pomijam")
                continue
            rows = _read_runs(gp)
            print(f"[{name} s{seed}] Layer A (LT) + Layer B (panel) na {len(rows)} dok…")

            layer_a = _layer_a_with_domains(rows, base_url)

            items, answers = [], []
            for r in rows:
                pid = r["id"]
                if pid in prompts:
                    items.append(prompts[pid])
                    answers.append(r.get("ans", ""))

            # Postęp sędziów: panel_score wykonuje pracę per-item wewnętrznie
            # (ThreadPoolExecutor.map), a jej publiczne API nie daje callbacku per-item
            # -> emitujemy gruboziarniście wokół wywołania (0/total i total/total).
            # total = sędziowie × itemy (tyle ocen liczy panel_score).
            n_judges = sum(1 for j in panel_list if not common.is_placeholder(j[2]))
            judge_total = n_judges * len(items)
            jt0 = time.time()
            print(f"[{name} s{seed}] judge 0/{judge_total} (0s)", flush=True)
            jsp = judge_stream_path(name, seed) if diag else None
            if jsp:
                print(f"[{name} s{seed}] diag judge stream -> {jsp}", flush=True)
            # mode= nieprzekazany -> domyślny tryb panel_score = "guided"
            # (wysyłany sędzia DeepSeek-V4-Pro w trybie guided; patrz judge_panel.PANEL).
            panel = judge_panel.panel_score(panel_list, items, answers,
                                            workers=workers, stream_path=jsp)
            print(f"[{name} s{seed}] judge {judge_total}/{judge_total} "
                  f"({int(time.time() - jt0)}s)", flush=True)
            layer_b = panel["aggregate"]

            tmp = sp + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump({"model": name, "seed": seed, "judges": panel.get("judges", []),
                           "layer_a": layer_a, "layer_b": layer_b}, f, ensure_ascii=False)
            os.replace(tmp, sp)
            print(f"[{name} s{seed}] scored -> {sp} "
                  f"(LT morpho/100tok={layer_a['mean_errors_per_100tok']['morphosyntax']:.2f}, "
                  f"panel={layer_b.get('panel_score_mean')})")


def _mean_var(xs):
    """(mean, sample_variance) z listy liczb (None pomijane). var=None gdy <2 wartości."""
    xs = [x for x in xs if x is not None]
    if not xs:
        return None, None
    mean = round(statistics.mean(xs), 4)
    var = round(statistics.variance(xs), 4) if len(xs) > 1 else None
    return mean, var


def _agg_model(scored):
    """Zagreguj listę plików scored jednego modelu po seedach. Warstwy OSOBNO.

    Zwraca {"layer_a":{...}, "layer_b":{...}, "n_seeds":int}.
    """
    n = len(scored)

    # --- Layer A: per bucket mean + var po seedach ---
    a_mean, a_var = {}, {}
    for b in _LA_BUCKETS:
        vals = [s["layer_a"]["mean_errors_per_100tok"].get(b) for s in scored]
        m, v = _mean_var(vals)
        a_mean[b] = m
        a_var[b] = v

    # Layer A per-domena: mean po seedach, per bucket
    a_doms = sorted({d for s in scored for d in s["layer_a"].get("per_domena", {})})
    a_per_domena = {}
    for d in a_doms:
        a_per_domena[d] = {}
        for b in _LA_BUCKETS:
            vals = [s["layer_a"].get("per_domena", {}).get(d, {}).get(b)
                    for s in scored if d in s["layer_a"].get("per_domena", {})]
            m, _ = _mean_var(vals)
            a_per_domena[d][b] = m

    layer_a = {
        "mean_errors_per_100tok": a_mean,
        "var_errors_per_100tok": a_var,
        "per_domena": a_per_domena,
        "n_seeds": n,
    }

    # --- Layer B: panel_score / naturalnosc / ija mean + var po seedach ---
    ps_mean, ps_var = _mean_var([s["layer_b"].get("panel_score_mean") for s in scored])
    nat_mean, nat_var = _mean_var([s["layer_b"].get("naturalnosc_mean") for s in scored])
    ija_mean, ija_var = _mean_var([s["layer_b"].get("ija_alpha") for s in scored])

    b_doms = sorted({d for s in scored for d in s["layer_b"].get("per_domena", {})})
    b_per_domena = {}
    for d in b_doms:
        pvals = [s["layer_b"]["per_domena"].get(d, {}).get("panel_score")
                 for s in scored if d in s["layer_b"].get("per_domena", {})]
        nvals = [s["layer_b"]["per_domena"].get(d, {}).get("naturalnosc")
                 for s in scored if d in s["layer_b"].get("per_domena", {})]
        pm, _ = _mean_var(pvals)
        nm, _ = _mean_var(nvals)
        b_per_domena[d] = {"panel_score": pm, "naturalnosc": nm}

    # n_empty: suma pustych odpowiedzi po seedach (Layer B liczy je jako fail, Layer A
    # je dropuje jako too_short -> denominatory różne; surfaceujemy, by było audytowalne)
    n_empty = sum(s["layer_b"].get("n_empty", 0) for s in scored)

    layer_b = {
        "panel_score_mean": ps_mean, "panel_score_var": ps_var,
        "naturalnosc_mean": nat_mean, "naturalnosc_var": nat_var,
        "ija_alpha_mean": ija_mean, "ija_alpha_var": ija_var,
        "n_empty": n_empty,
        "per_domena": b_per_domena,
        "n_seeds": n,
    }
    return {"layer_a": layer_a, "layer_b": layer_b, "n_seeds": n}


def aggregate(models, seeds, write=True):
    """Etap `aggregate`: zbierz pliki scored, uśrednij po seedach, emituj plgen_v1.json.

    Sub-score'y warstw OSOBNO (Layer A LT vs Layer B sędziowie — nigdy nie uśredniane).
    Koperta jak polnative; merge-don't-clobber po modelu z istniejącym OUT.
    Zwraca pełny raport (dict). Brak plików scored dla modelu -> model pominięty.
    """
    results = {}
    judges_seen = []
    # placeholdery pomijamy (generate/score też je pomijają) -> bez szumu „brak scored"
    models = {n: v for n, v in models.items() if not common.is_placeholder(v[1])}
    for name in models:
        scored = []
        for seed in seeds:
            sp = scored_path(name, seed)
            if os.path.exists(sp):
                obj = json.load(open(sp, encoding="utf-8"))
                scored.append(obj)
                for j in obj.get("judges", []):
                    if j not in judges_seen:
                        judges_seen.append(j)
        if not scored:
            print(f"[{name}] brak plików scored -> pomijam")
            continue
        results[name] = _agg_model(scored)

    report = {
        "bench": "plgen_v1",
        "judges": judges_seen or [j[0] for j in judge_panel.PANEL
                                  if not common.is_placeholder(j[2])],
        "lt_image": grammar_check.LT_IMAGE,
        "skala": ("Layer A: błędy/100tok per bucket (↓ lepiej); "
                  "Layer B: panel_score 0-100 (↑), naturalność 1-5 (↑); "
                  "warstwy raportowane OSOBNO, nigdy nieuśredniane"),
        "note": ("eval_only; prompty w prywatnym repo slayer-datasets, nie trenować. "
                 "Tylko agregaty (po 3 seedach, z wariancją międzyseedową); detal per item "
                 "wyłącznie w gitignorowanym slayer-data/plgen/runs/."),
        "results": results,
    }

    if write:
        os.makedirs(os.path.dirname(common.OUT), exist_ok=True)
        if os.path.exists(common.OUT):
            try:
                prev = json.load(open(common.OUT, encoding="utf-8")).get("results", {})
                report["results"] = {**prev, **results}  # merge-don't-clobber po modelu
            except Exception:
                pass
        with open(common.OUT, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"[plgen] agregaty -> {common.OUT}")
    return report


def _fmt(v, nd=2):
    return round(v, nd) if isinstance(v, (int, float)) else None


def matrix_section(report):
    """Złóż gotową-do-wklejenia sekcję matrix.json z raportu aggregate().

    Kształt dashboardu (app/leaderboard/live.jsx): title/official_for/protocol/
    cols/rows[].name+vals/note. cols = nazwy wyświetlane modeli; wiersze warstw
    OSOBNO (LT per bucket + sędziowie), plus per-domena. vals=null gdzie brak.
    """
    res = report.get("results", {})
    model_names = list(res.keys())
    cols = [MODEL_DISPLAY.get(m, m) for m in model_names]

    rows = []

    def row(name, fn):
        rows.append({"name": name, "vals": [fn(res[m]) for m in model_names]})

    # --- Layer A (LanguageTool) — błędy/100tok, ↓ lepiej ---
    bucket_label = {"morphosyntax": "morfoskładnia", "spelling": "ortografia",
                    "style": "styl"}
    for b in _LA_MAIN:
        row(f"LT {bucket_label[b]} (bł./100tok, ↓)",
            lambda m, b=b: _fmt(m["layer_a"]["mean_errors_per_100tok"].get(b)))

    # --- Layer B (panel sędziów) — OSOBNO, nie mieszać z LT ---
    row("Sędziowie panel (pass-rate 0-100, ↑)",
        lambda m: _fmt(m["layer_b"].get("panel_score_mean"), 1))
    row("Sędziowie naturalność 1-5",
        lambda m: _fmt(m["layer_b"].get("naturalnosc_mean"), 2))
    row("Sędziowie IJA (Krippendorff α)",
        lambda m: _fmt(m["layer_b"].get("ija_alpha_mean"), 3))

    # --- per-domena (osobno per warstwa) ---
    a_doms = sorted({d for m in res.values() for d in m["layer_a"].get("per_domena", {})})
    for d in a_doms:
        dn = DOMENA_DISPLAY.get(d, d)
        row(f"LT {dn} morfoskładnia (bł./100tok, ↓)",
            lambda m, d=d: _fmt(m["layer_a"].get("per_domena", {}).get(d, {}).get("morphosyntax")))

    b_doms = sorted({d for m in res.values() for d in m["layer_b"].get("per_domena", {})})
    for d in b_doms:
        dn = DOMENA_DISPLAY.get(d, d)
        row(f"Sędziowie {dn} (0-100, ↑)",
            lambda m, d=d: _fmt(m["layer_b"].get("per_domena", {}).get(d, {}).get("panel_score"), 1))

    judges_str = ", ".join(report.get("judges", [])) or "DeepSeek-V4-Pro"
    section = {
        "title": "PL-GEN — długi tekst: LanguageTool + sędzia (DeepSeek)",
        "official_for": "plgen",
        "protocol": ("free-generation PL (bieg referencyjny: 1 seed s42, podzbiór 50/domena — "
                     f"pełne 193×3 TODO); Layer A = self-hosted LanguageTool ({report.get('lt_image')}) "
                     "błędy/100tok per bucket (dolne ograniczenie, niski recall); Layer B = ślepy "
                     f"sędzia {judges_str} (guided, temp 0), panel_score 0-100 + naturalność 1-5. "
                     "Sub-score'y OSOBNE — nie uśredniać między warstwami ani z innymi sekcjami. "
                     "IJA N/A przy 1 sędzim."),
        "cols": cols,
        "rows": rows,
        "note": ("Layer A (LT, ↓ lepiej) i Layer B (sędzia, ↑ lepiej) to ODDZIELNE osie — "
                 "złote pole dashboardu liczy max w wierszu, więc dla wierszy LT (↓) ignoruj "
                 "podświetlenie. Bieg referencyjny: 1 seed (s42), podzbiór 50/domena. eval_only."),
    }

    os.makedirs(os.path.dirname(MATRIX_SECTION_OUT) or ".", exist_ok=True)
    with open(MATRIX_SECTION_OUT, "w", encoding="utf-8") as f:
        json.dump(section, f, ensure_ascii=False, indent=2)
    print(f"[plgen] sekcja matrix (do ręcznego wklejenia) -> {MATRIX_SECTION_OUT}")
    print(json.dumps(section, ensure_ascii=False, indent=2))
    return section


def main():
    ap = argparse.ArgumentParser(description="PL-GEN orchestrator")
    ap.add_argument("--stage", default="gen", choices=["gen", "score", "aggregate", "all"],
                    help="etap: gen | score | aggregate | all (gen->score->aggregate)")
    ap.add_argument("--models", default=",".join(common.MODELS),
                    help="lista nazw z common.MODELS po przecinku")
    ap.add_argument("--seeds", default=",".join(map(str, DEFAULT_SEEDS)),
                    help="seedy po przecinku (domyślnie 42,43,44)")
    ap.add_argument("--n", type=int, default=0, help="0 = wszystkie prompty; N = pierwsze N")
    ap.add_argument("--per-domena", type=int, default=0,
                    help="0 = off; N = pierwsze N itemów KAŻDEJ domeny (ma pierwszeństwo przed --n)")
    ap.add_argument("--workers", type=int, default=8, help="openrouter; ollama dławione do --ollama-workers")
    ap.add_argument("--ollama-workers", type=int, default=1,
                    help="cap równoległości ollama (domyślnie 1: partial-CPU-offload GPU nie skaluje równolegle)")
    ap.add_argument("--num-predict", type=int, default=NUM_PREDICT,
                    help=f"budżet tokenów generacji (domyślnie {NUM_PREDICT})")
    ap.add_argument("--num-ctx", type=int, default=NUM_CTX,
                    help=f"okno kontekstu ollama (domyślnie {NUM_CTX}; mały KV cache = model GPU-resident)")
    ap.add_argument("--diag", action="store_true",
                    help="streamuj na bieżąco (flush) gen/judge do gitignorowanego common.RUNS (debug)")
    ap.add_argument("--data", default=None, help="ścieżka do promptów (domyślnie common.DATA)")
    ap.add_argument("--judges", default=None,
                    help="podzbiór sędziów po nazwie (np. 'Llama-3.3-70B-Instruct'); domyślnie pełny panel")
    a = ap.parse_args()

    models = {}
    for name in [x for x in a.models.split(",") if x]:
        if name not in common.MODELS:
            raise SystemExit(f"nieznany model: {name} (dostępne: {', '.join(common.MODELS)})")
        models[name] = common.MODELS[name]
    seeds = [int(s) for s in a.seeds.split(",") if s]

    prompts, used = load_dataset(a.data)
    # --per-domena ma pierwszeństwo przed --n (stratyfikacja per domena); inaczej --n
    if a.per_domena:
        prompts = select_per_domena(prompts, a.per_domena)
    elif a.n:
        prompts = prompts[:a.n]
    breakdown = Counter(p.get("domena", "") for p in prompts)
    print(f"[plgen] {len(prompts)} promptów z {used}; modele={list(models)}; seedy={seeds}")
    print(f"[plgen] per-domena: {dict(sorted(breakdown.items()))}")

    if a.stage in ("gen", "all"):
        generate(models, prompts, seeds=seeds, workers=a.workers,
                 num_predict=a.num_predict, num_ctx=a.num_ctx,
                 ollama_workers=a.ollama_workers, diag=a.diag)
    if a.stage in ("score", "all"):
        judges = [j for j in a.judges.split(",") if j] if a.judges else None
        score(models, seeds, prompts_path=used, workers=a.workers, judges=judges, diag=a.diag)
    if a.stage in ("aggregate", "all"):
        report = aggregate(models, seeds)
        matrix_section(report)


if __name__ == "__main__":
    main()
