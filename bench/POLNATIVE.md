# PolNative v1 — natywność polszczyzny

> **Nazwa.** Pierwotnie „PLCC" (od pliku probe'a); przemianowany 2026-06-13, bo PLCC to istniejący
> benchmark sdadasa (OPI): *Polish Linguistic and Cultural Competency*, 600 pytań, arXiv:2503.00995,
> leaderboard `hf.co/spaces/sdadas/plcc`. Tamten mierzy wiedzę/kompetencję głównie pytaniami
> zamkniętymi; PolNative mierzy GENERATYWNĄ natywność (formy w użyciu, kalki, AI-tells, kalibracja),
> czego tamten nie dotyka. Karta zewnętrznego PLCC: `cards/plcc.md` w repo benchmarks.

## Co mierzy
Poprawną polszczyznę i „polskość" generacji: fleksję (wołacz, liczebniki zbiorowe, odmiana
nazwisk/toponimów), składnię i rekcję, ortografię, leksykę (pleonazmy, paronimy), frazeologię,
atrybucję literacką, realia/tradycje, kalibrację wiedzy lokalnej (czy model fabrykuje), EQ
i naturalność (kalki, AI-style). To są dokładnie osie, na których wykładają się modele trenowane
głównie na angielskim — sygnał do wymiarowania style-SFT i CPT.

## Dataset
- 111 itemów (70 auto / 41 judge), własny, dwuźródłowy:
  - `probe_v1` (31): ręcznie osądzony probe qwen3.6-35b-a3b (prompt + werdykt + failure_reason),
    znormalizowany do formatu benchmarku; surowy probe: `slayer-data/polnative/probe_qwen36_raw.jsonl`
    (zarazem referencyjny run baseline'u).
  - `seed_v1` (80): itemy autorskie per domena, pisane i ADWERSARYJNIE weryfikowane przez
    niezależne agenty (norma na poziomie poradni PWN; normy wariantywne odrzucane; auto-checki
    testowane na false-positive z echa promptu i false-negative z parafraz; 2 itemy kalibracyjne
    odrzucone w weryfikacji za fałszywe założenia — patrz `authored_v1.json:dropped`).
- Domeny (n): fleksja 18, literatura 16, składnia 12, frazeologia 11, ortografia 11, leksyka 10,
  realia 9, EQ 8, naturalność 7, kalibracja 5, rejestr 4.
- Plik: `slayer-data/polnative/polnative_v1.jsonl`; źródło prawdy i asembler (`make_polnative_v1.py`)
  w PRYWATNYM repo `slayerlabs/datasets` (`data/polnative/`) — itemy nie mogą trafić do publicznego
  gita (web-scrape → pretrain → benchmark martwy).

## Metryka i protokół
- Metryka decyzyjna: **PolNative overall 0-100** (pass=1, mixed=0.5, fail=0); pomocnicze: per domena,
  per tryb (auto/judge).
- Tryby: `auto` — deterministyczne grupy substringów/regexów (AND grup, OR alternatyw, lowercase,
  `cs` dla itemów o wielkich literach); `judge` — otwarty sędzia **Qwen3.5-122B** z rubryką
  pass/mixed/fail per item.
- Generacja: każdy model na rekomendowanym samplingu wydawcy (Qwen 0.7, Bielik 0.2) — bez „naprawiania".

## Skrypt
```bash
ssh -N -L 11435:127.0.0.1:11434 simp &      # tunel do ollama, jeśli trzeba
python3 bench/polnative_eval.py --models bielik,qwen27b
```
Agregaty → `public/results/polnative_v1.json`; detal per item tylko do gitignorowanego
`slayer-data/polnative/runs/` (debug artefaktów harnessu, nie do oglądania itemów).

## Train policy
`eval_only`. Itemy ani parafrazy nie wchodzą do żadnego treningu (style-SFT, CPT, replay).
Prompty z probe'a pokrywają się tematycznie z domenami style-SFT — przy budowie mixów sprawdzać
dedup vs `data/polnative/` (decon).

## Wyniki referencyjne
Pełny run v1, 2026-06-13 (n=111, sędzia Qwen3.5-122B, 0 pustych / 0 błędów sędziego):

| model | overall | auto | judge | najmocniejsze | najsłabsze |
|---|---|---|---|---|---|
| Bielik-11B-v3 (Q4, temp 0.2) | **79.7** | 91.4 | 59.8 | frazeologia 100, realia 100, literatura 90.6 | kalibracja 30.0, EQ 56.2 |
| Qwen3.5-27B (OR, temp 0.7) | **58.6** | 60.7 | 54.9 | realia 88.9, leksyka 85.0 | literatura 15.6, naturalność 42.9, kalibracja 40.0 |

Delta Bielik−Qwen: +21.1 overall; literatura **+75.0**, frazeologia +31.8, fleksja +27.7,
rejestr +25.0. Qwen lepszy w: leksyka (+15.0), kalibracja (+10.0), EQ (+6.3).
Obie rodziny słabe w domenach sędziowanych (judge 59.8 vs 54.9): styl konwersacyjny
i kalibracja to ziemia niczyja — okazja dla Slayera.
- Snapshot wcześniejszy (ręczny przegląd probe_v1, n=31): qwen3.6-35b-a3b ≈ **43.5/100**.

## Znane pułapki / debug
- **Echo promptu**: model cytuje zadanie, więc substring z `musi` obecny w prompcie = false
  positive; walidator w `make_polnative_v1.py` to flaguje przy składaniu.
- **Puste odpowiedzi** = artefakt harnessu (thinking mode / template), nie wynik — pole
  `empty_answers` w raporcie.
- Kalibracja: itemy łowią fabrykacje (np. „oficjalny hymn województwa" nie istnieje); sędzia
  nie weryfikuje faktów, stosuje rubrykę „pewna konkretna odpowiedź bez zastrzeżeń = fail".
- Itemy `judge` o stylu (EQ/naturalność) karzą bullet-listy i coaching w rozmowie — celowo
  (probe: to był główny AI-tell).

## Decyzja treningowa
Niski wynik per domena wymiaruje robotę: fleksja/składnia/ortografia → style-SFT z twardymi
przykładami form; literatura/realia/kalibracja → EntiGraph CPT (wiedza); EQ/naturalność →
kuracja stylu (LIMA, de-translationese). Overall = metryka „polskości" do porównań
slayer vs base vs Bielik między wersjami.
