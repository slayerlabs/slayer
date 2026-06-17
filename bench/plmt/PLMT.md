# PL-MT — karta benchmarku

**Polish morphology — elicytowana kompetencja fleksyjna.** Krótkie probe'y sprawdzające, czy model
produkuje **realne polskie formy**, czy halucynuje formy morfologicznie „poprawne", ale nieistniejące.
Komplementarny do PL-GEN (ten mierzy *emergentne wykonanie* w długim tekście) — razem wymiarują
**lukę wiedza–wykonanie**.

Autorka benchmarku i taksonomii poziomów: **@lizzy-606** (v0.1). Rozszerzenie o pole `level`,
losową kolejność, scoring po granicy słowa + AND-match, orkiestrację i agregację: ext.

## Co mierzy — poziomy kodują MECHANIZM błędu

Płaski wynik („46/71") nie mówi *gdzie* model pada. Pole `level` (1–7) porządkuje pytania wg tego,
**jak bardzo model może być pewny błędnej odpowiedzi** — wynik per poziom to diagnostyka, nie ranking.

| L | mechanizm |
|---|---|
| 1 | Regularne formy wysokiej frekwencji — kalk / zły paradygmat |
| 2 | Alternacje fonologiczne — forma regularna zamiast alternowanej |
| 3 | Supletywizm — forma regularna od złego rdzenia |
| 4 | Synkretyzm — zbyt pewna odpowiedź na wieloznaczną formę |
| 5 | Liczebniki zbiorowe — zastąpienie kategorii (zbiorowy → główny) |
| 6 | Aspekt i konsekwencje składniowe |
| 7 | Pozycja klityki *się* — obcy szyk zamiast polskiego |

## Scoring

- **Dopasowanie po granicy słowa** (`(?<!\w)…(?!\w)`), nie podciąg — `lepiej` nie zalicza `najlepiej`,
  `duże` nie podświetla się w `dużej`. Naprawia false-PASS/false-distractor z v0.1.
- **AND-match** (`acceptable_all`) dla pytań „wymień wszystkie przypadki": liczy się **komplet nazw**
  niezależnie od szyku/spójnika (`i` vs `oraz`) — inaczej `acceptable` goni frazowanie każdego modelu.
- **Losowa kolejność W OBRĘBIE poziomu** (seed), kolejność poziomów stała — model nie gra pozycją.
- **Early stopping wyłączony domyślnie** — pełny przebieg (poziomy NIE są monotoniczne w trudności:
  modele bywają 1.00 na L7 i 0.00 na L4).

## Protokół

- **Modele (4):** te same co PL-GEN — `bielik` (lokalny ollama) · `qwen35_instruct` · `qwen36` ·
  `gemma4` (OpenRouter), każdy na temperaturze wydawcy (`common.MODELS`).
- **Seedy:** 5 (42–46); seed steruje samplingiem modelu **i** kolejnością w obrębie poziomu.
- **Cache:** odpowiedzi per `(model,seed)` lądują w gitignorowanym `slayer-data/plmt/runs/`. Zmiana golda
  → **re-scoring bez LLM**; tylko nowe `id` wymagają zapytania.

## Dane (eval_only)

Zadania są **prywatne** — nie trafiają do publicznego repo. Master: `datasets/data/eval/plmt/`
(`slayerlabs/datasets`). Lokalna kopia czytana przez ewaluator: `slayer-data/plmt/...` (gitignored).
Zarejestrowane w `bench/decon_audit.py:EVAL_SOURCES` (dekontaminacja pokrywa też ten zestaw).
Szczegóły per item i opis poziomów (`benchmark_poziomy_trudnosci.md`) — w repo datasets.

## Wyniki referencyjne (4 modele × 5 seedów, pass-rate per poziom, mean±std)

| model | L1 | L2 | L3 | L4 | L5 | L6 | L7 | all items | avg levels |
|---|---|---|---|---|---|---|---|---|---|
| gemma4 | 0.91 | 0.95 | 0.93 | 0.33 | 0.43 | 0.64 | 1.00 | **0.80** | **0.74** |
| bielik | 0.72 | 0.80 | 0.91 | 0.40 | 0.62 | 0.72 | 0.62 | **0.73** | **0.68** |
| qwen35_instruct | 0.82 | 0.82 | 0.78 | 0.00 | 0.14 | 0.52 | 1.00 | **0.66** | **0.58** |
| qwen36 | 0.83 | 0.81 | 0.80 | 0.00 | 0.06 | 0.44 | 0.80 | **0.62** | **0.53** |

Ranking zgodny z PL-GEN (gemma4 > Bielik > Qwen3.5 > Qwen3.6). Diagnostyka, którą daje podział na poziomy:
**Bielik** (model polski) prowadzi na L3/L5 i jest jedynym modelem >0 na synkretyzmie rzeczownikowym (L4) —
jego luka to L1/L7, nie trudna morfologia. `all items` = mikro-średnia (ważona liczbą itemów),
`avg levels` = makro-średnia (każdy mechanizm równo).

## Jak uruchomić

```bash
# pełna siatka 4 modele × 5 seedów + agregat (qwen/gemma OpenRouter, bielik lokalny ollama)
python3 bench/plmt/evaluator_v2.py --models bielik,qwen35_instruct,qwen36,gemma4 --seeds 42,43,44,45,46
# tylko agregat z zapisanych wyników (0 LLM):
python3 bench/plmt/evaluator_v2.py --models ... --seeds ... --aggregate-only
# samokontrola dopasowania:
python3 bench/plmt/evaluator_v2.py --selftest
```

## Znane pułapki (uczciwie)

- **L4 mała próba** (3 itemy) — pojedynczy item to ±0.33; ±std per seed jest mały, ale n-itemów też.
- **`SYNCRETISM_003` generatywny** (dwa zdania) — auto-scoring przybliżony, zalecane ręczne sprawdzenie.
- **`acceptable_all`** to prosty AND podciągów — „to NIE mianownik lecz…" (oba słowa, zła intencja)
  przeszłoby; rzadkie, akceptowalny sufit.
