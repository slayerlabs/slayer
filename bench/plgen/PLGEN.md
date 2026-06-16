# PL-GEN — karta benchmarku

**Polish free-generation language quality.** Mierzy, czy model pisze **naturalną, poprawną polszczyznę
w dłuższym, swobodnym tekście** — jakość *emergentna* w produkcji, nie znajomość pojedynczych form.
Komplementarny do PolNative (ten mierzy *elicytowaną kompetencję* krótkimi probe'ami); razem wymiarują
**lukę wiedza–wykonanie** (knowing–doing gap).

## Co mierzy — dwie warstwy, raportowane OSOBNO (NIGDY uśredniane razem)

Uśrednianie warstw ukrywa, która oś się ruszyła. Raport trzyma je w rozłącznych poddrzewach
(`layer_a` / `layer_b`) i osobnych wierszach matrycy.

### Warstwa A — LanguageTool (`grammar_check.py`)

Gęstość błędów w generacji: **błędy / 100 tokenów**, w kubełkach `morphosyntax` (zgoda/przypadek/
rodzaj/rekcja) · `spelling` (morfologik/literówki) · `style` (pleonazmy, kalki urzędowe). LT self-hostowany
w **przypiętym obrazie `erikvl87/languagetool:6.5`** (port 8010, `POST /v2/check`, `language=pl-PL`); szum
typograficzny (cudzysłowy, spacje, myślniki) wyłączony, by liczyć błędy języka, nie formatowania.

**Uczciwie: to dolne ograniczenie, oś nastawiona na precyzję.** Recall LT-PL na klasycznej morfoskładni
to **~29% (6/21 na naszym probe)** i **żaden lever konfiguracji LT tego nie rusza** (`level=picky` — no-op;
ngram/confusion-set dla polskiego po prostu nie istnieje — brak korpusu). Architektoniczne ograniczenie:
LT łapie głównie ortografię i kilka wzorców zgody; podręcznikowe „Widzę ten książkę" przechodzą. Niskich
liczników NIE traktować jako „czysto" — to robota Warstwy B.

> **Prototyp (PARKED):** deterministyczny checker zgody na **Stanza-pl** podniósł recall do **15/21** na
> probe (0/12 FP na czystych zdaniach), ale na realnym tekście dawał zbyt dużo false-positive i sygnał per
> dokument był szumny (silne modele 27B+ robią ~1 błąd/dok) → **odłożony**. Kod: `_spike_stanza.py`
> (używany przez `anno_cli --audit-la`). Podniesienie czułości Warstwy A to **następny punkt pracy**.

### Warstwa B — sędzia (`judge_panel.py`)

**Pojedynczy sędzia: `DeepSeek-V4-Pro`** (open-weight, mocna polszczyzna; OpenRouter,
`deepseek/deepseek-v4-pro`, temp 0, dekodowanie zachłanne) w trybie **`guided`**. Sędzia ocenia odpowiedź
względem `phenomena` itemu (zakotwiczenie fenomenologiczne) w roli **rygorystycznego korektora** i zwraca
JSON `{werdykt: pass|mixed|fail, naturalnosc: 1-5, powod}`. Agregacja: `panel_score` 0–100
(pass=1/mixed=0.5/fail=0), średnia `naturalnosc`. Ślepota: prompt sędziego nigdy nie zawiera nazwy
modelu-podmiotu.

**Dlaczego pojedynczy DeepSeek w trybie `guided`, a nie otwarty panel 3 sędziów.** Otwarty panel
(Llama-3.3-70B / Mistral-Large / Command-A) **niedowykrywał polskich błędów i rubber-stampował** (holistic:
198/200 pass — brak dyskryminacji). Tryb `guided` (prompt zakotwiczony na fenomenach + rygorystyczny
korektor + ignorowanie ucięć harnessu) naprawił to dla zdolnych sędziów. Walidacja **vs złoto ludzkie
(n=20)**:

| sędzia | exact | ±1-klasa | werdykt |
|---|---|---|---|
| Llama-3.3-70B | 15% | 70% | wciąż rubber-stampuje → DROP |
| Mistral-Large | 55% | 100% | dyskryminuje (drugi wybór) |
| Qwen3.5-122B | 59% | 100% | najlepszy exact, ale parse-`None` + ryzyko Qwen-vs-Qwen |
| **DeepSeek-V4-Pro** | **56%** | **100%** | **open-weight, dyskryminuje, zgodny z regułą → WYSYŁANY** |

DeepSeek nigdy nie odwraca pass↔fail względem człowieka (±1-klasa = 100%); pozostała luka to kalibracja
„mixed", nie kierunek. **IJA (Krippendorff α) — N/A przy pojedynczym sędzim** (brak drugiego głosu).

## Protokół

- **Prompty:** ~193 held-out, **długie** (wypowiedź 150–400 słów), stratyfikowane po 10 domenach
  (rekcja, liczebniki, zaimki/`swój`, wołacz, toponimy/nazwiska, aspekt, ortografia, kalki, rejestr,
  zgoda długodystansowa). `eval_only`. Prywatne w `slayer-data/plgen/prompts_v1.jsonl`; do publicznego gita
  nie trafiają.
- **Generacja:** każdy model na samplingu rekomendowanym przez wydawcę (bez „naprawiania"); długość
  normalizowana (błędy/100 tok); **guard minimalnej długości** (`MIN_TOKENS=40`) przeciw graniu krótkim,
  mdłym tekstem.
- **Oceniane modele (4):** gemma-4-31B-it · Bielik-11B-v3 · Qwen3.5-27B instruct · Qwen3.6-27B.
- **Wynik publiczny:** tylko agregaty → `public/results/plgen_v1.json`; sekcja `plgen` ręcznie wklejana do
  `public/results/matrix.json`. Detal per item wyłącznie w gitignorowanym `slayer-data/plgen/runs/`.

## Polityka treningowa

`eval_only` — itemy ani parafrazy nie wchodzą do żadnego treningu (style-SFT, CPT, replay).
`prompts_v1.jsonl` zarejestrowany w `bench/decon_audit.py:EVAL_SOURCES`. Dedup tematyczny vs PolNative:
`bench/plgen/decon_plgen.py` (vs `datasets/data/polnative/polnative_v1.jsonl`).

## Pochodzenie / ujawnienie (Slayer: jawność receptury)

Prompty **autorowane przez Gemini 3.1 Pro** (jednorazowy artefakt wejściowy; warstwa oceniająca pozostaje
otwarta → zgodne z zasadą czystości, która wiąże *pomiar*), weryfikowane adwersaryjnie przez niezależnego
agenta, zatwierdzone przez człowieka. Złoto ludzkie (`anno_cli.py`, ślepe) waliduje sędziego
(`validate_judges.py`).

## Komplementarność z PolNative (triangulacja)

PolNative = *elicytowana kompetencja* (krótkie probe'y, „czy umie formę"); PL-GEN = *emergentne wykonanie*
(długi tekst, „czy pisze czysto"). Model wysoki na PolNative `fleksja` przy wysokim LT-error-rate /
niskim `panel_score` w PL-GEN = „umie, ale nie robi". Raport zestawia obie osie per model.

## Wyniki referencyjne

**Pełny zbiór 193 promptów, pojedynczy seed (s42)**, sędzia = DeepSeek-V4-Pro `guided`.
Warstwa A (bł./100 tok per kubełek) i Warstwa B (`panel_score` 0–100, `naturalność` 1–5) — osobno.

| model | LT morpho ↓ | LT spelling ↓ | LT style ↓ | panel_score 0–100 ↑ | naturalność 1–5 ↑ |
|---|---|---|---|---|---|
| gemma-4-31B-it | 0.050 | 0.929 | 0.030 | **32.4** | 3.75 |
| Bielik-11B-v3 | 0.061 | 0.716 | 0.023 | 29.6 | 3.51 |
| Qwen3.5-27B instr | 0.082 | 0.869 | 0.028 | 13.5 | 3.05 |
| Qwen3.6-27B | 0.111 | 1.476 | 0.030 | 6.7 | 2.70 |

Sędzia jest **rygorystyczny** (niskie bezwzględne `panel_score`); sygnałem jest **rozrzut** (6.7–32.4),
nie poziom — gemma-4 ≈ Bielik na czele, Qwen wyraźnie niżej. Warstwa A płaska (dolne ograniczenie) —
zgodnie z projektem. (Generacja num_predict=1024, truncation ~34%; ten sam ranking co bieg referencyjny 50/domena.)

## Koszt biegu

**~$3.64** za pełny bieg 193 (772 wywołania DeepSeek `guided` + generacja OpenRouter). Raportowany jako
wynik (zasada „koszt to wynik").

## Znane pułapki (uczciwie)

- **Pojedynczy seed (s42)** — nie planowane 3 ziarna; wariancja generacji niezmierzona (→ SLA-15).
- **Sędzia walidowany na n=20** złota ludzkiego — mały arbiter; kalibracja „mixed" do dostrojenia.
- **Warstwa A = dolne ograniczenie o niskim recall** (~29% morfoskładnia) — nie ranking modeli na gramatyce.
- **Determinizm best-effort** — DeepSeek przez OpenRouter (temp 0, przypięty model id); upstream nie
  gwarantuje powtarzalności. IJA α N/A przy jednym sędzim.

## Co dalej

- **Czułość Warstwy A** — odciąć false-positive Stanzy albo wpiąć neuralny polski detektor GEC.
- **Pełny bieg** 193 held-out × 3 ziarna.
- **Rozszerzyć złoto ludzkie** (poza n=20).
- Ewentualnie **dodać drugiego sędziego** dla IJA (α).

## Jak uruchomić

```bash
# generacja + scoring (Warstwa A potrzebuje dockera z LT; ensure_lt() startuje go sam)
python3 bench/plgen/bench_plgen.py --stage all --seeds 42      # gen→score→aggregate
# tylko etapy:
python3 bench/plgen/bench_plgen.py --stage gen   --models bielik,qwen35_instruct
python3 bench/plgen/bench_plgen.py --stage score                # sędzia: DeepSeek-V4-Pro, tryb guided (domyślnie)
python3 bench/plgen/bench_plgen.py --stage aggregate            # -> public/results/plgen_v1.json
# walidacja sędziego vs złoto ludzkie:
python3 bench/plgen/validate_judges.py
# złoto ludzkie (ślepe) + audyt Warstwy A:
python3 bench/plgen/anno_cli.py --n 40 --stratify domena --annotator <kto>
# dekontaminacja po zamrożeniu promptów:
python3 bench/plgen/decon_plgen.py
```
