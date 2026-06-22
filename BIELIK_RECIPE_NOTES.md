# Bielik — recon competitora (notatki) + jak go pobić

Źródło: prezentacja Remigiusz Kinas (SpeakLeash, Head of AI @ Grupa NEUCA), „Droga do polskiego modelu językowego" (PLGrid, 66 slajdów).

## Receptura Bielika (fakty)

**Baza + pretrening (ich moat):**
- Bielik 7B v0.1: continued pretraining Mistral 7B, framework **ALLaMo**, ctx 4096, 36 mld tok × 2 epoki, 256× GH200, 9h.
- Bielik 11B v2: up-scaling Mistral 7B v0.2 → 11B + pretrening, **NVIDIA Megatron**, ctx 32768 (×8), **198 mld tok (~96 mln dok) × 2 epoki**, 256× GH200, 8 dni.
- v3 (w trakcie): up-scaling Mistral+Qwen, 1.5/3.5/11/24B, 300–500 mld tok.

**SFT — skala, nie LIMA:** v2.0 = 16 mln instrukcji ×2 epoki; v2.1 = 20 mln ×1. Metody: **weighted CE loss, adaptive LR, masking, packing** (ALLaMo). 128× GH200.

**Alignment — DPO to główna dźwignia PL:** SFT sam +8% PL; **SFT+DPO +16% PL** (EN +6%). DPOP, v2.1 = 61k par ×2, v2.2 = 72k ×3. v3 → 300k par.

**Pipeline danych preferencyjnych (do adopcji):**
perturbacja + nowe instrukcje → dedup (**LSH / Cosine / MiniHash**, kombinacje E1/E2/E3) → generacja (ręczna + syntetyczna LLM) → **ocena metamodelem (GPT4o 0-10, Llama-70B, Mistral-123B)** → **filtr: odrzuć gdy A=B, distance(A,B)<2, max(A,B)<5** → czyszczenie (spacje wiodące, format, błędy API) → inspekcja ręczna → RLHF → ORPO / DPO-P / PPO → walidacja. Pary chosen/rejected scorowane 0-10 (Label Studio).

**Pipeline danych pretreningu:** czyszczenie heurystyczne (naprawa/anonimizacja) → dedup → klasyfikator tematyczny (41 mln dok) → klasyfikator jakości (HIGH/MID/LOW + próg pewności + **recykling: napraw słaby tekst Bielikiem → re-ocena → jeśli lepszy, do treningu**) → tokenizacja. Dane syntetyczne z wiki per kategoria.

**Ewaluacja:** Bielik 11B v2.3 — MT-Bench-PL **8.56** (poziom Gemma-2-27B 8.62, Qwen2-72B 8.78), EQ-Bench 70.86, CPTUB 3.77. Metody: auto + LLM-judge + human.

**Inne:** Sójka = osobny model-guard (bezpieczeństwo). Helios @ Cyfronet (36 PFLOPS, 440× GH200).

## Gdzie są ich dane (czy da się pobrać)

- **Korpus Spichlerz (źródło pretreningu): TAK** — przez pakiet `speakleash` (NIE HF):
  ```bash
  pip install speakleash
  ```
  ```python
  from speakleash import Speakleash
  sl = Speakleash("./datasets")
  for d in sl.datasets: print(d.name, round(d.characters/1024/1024), "MB")
  wiki = sl.get("plwiki").data        # iterowalne dokumenty
  ```
  ~1000+ zbiorów, ~2.8 TB polskiego tekstu (900 mln dok, 123 mld słów). Licencja pakietu MIT, licencje per-zbiór różne. Dashboard: https://speakleash.org/dashboard/ · przykłady: github.com/speakleash/speakleash-examples
- **Instrukcje SFT (16–20 mln) i preferencje DPO (72k): NIE** — w dużej części syntetyczne + kurowane, NIE wydane jako paczka. Na HF `speakleash` jest model Bielik + nieliczne zbiory (np. `speakleash/PES-2018-2022`). Czyli: surowy korpus ściągasz, ale **mix instrukcyjny/preferencyjny Bielika trzeba odbudować samemu** (z korpusu + własna generacja/filtr).

## Jak pobić Bielika (strategia Slayera)

**Przewaga strukturalna:** startujemy z **Qwen3.5-27B** (mocna baza) — Bielik musiał wstrzykiwać polski do słabej bazy (Mistral) przez 198 mld-token CPT. My tego nie powtarzamy.

**Już prawdopodobnie wygrywamy** (potwierdzić proxy-pomiarem): wiedza/rozumowanie/egzaminy — LLMzSzŁ base 63.5 / v3 66.8 vs Bielik 56.0.

**Trzy ruchy, które realnie biją:**
1. **DPO-P** (dźwignia #1, jej nie pociągnęliśmy) — adoptuj ich pipeline preferencji, ale **sędzia OTWARTY** (Qwen3.5/deepseek), nie GPT4o (utrzymać „not distilled").
2. **Skala SFT z pokryciem** — dziesiątki tys. zróżnicowanych wg [`DATASET_MANIFEST.md`](DATASET_MANIFEST.md) (każda kolumna macierzy pokryta), nie 2k. Styl = mały kurowany (LIMA), pokrycie = duży zróżnicowany.
3. **Polski styl jako wyróżnik** — mocna baza + DPO + kuracja (zero kalki/myślników) → MT-Bench-PL.

**Czego NIE robić teraz:** nie replikować 198 mld-token CPT — nasza baza już niesie wiedzę. CPT (EntiGraph) dopiero jeśli proxy pokaże realną lukę długiego ogona PL.

## ⚠️ Krytyczne: Open PL LLM Leaderboard NIE jest reprodukowalny

Mimo nazwy nie jest „open" w sensie powtarzalności — **nie używamy go jako naszego benchmarku**. Budujemy **własny PROXY** replikujący ich metodologię (22 zadania, 5-shot: polemo2, 8tags, belebele, dyk, ppc, psc, cbd, klej-ner, polqa, poquad…), uruchamiany u nas, z dekontaminacją i pełnym protokołem. „Pobicie Bielika" deklarujemy na NASZYM proxy + MT-Bench-PL/EQ-Bench, nie na cudzej zamkniętej tablicy.

**Proxy = bench PRYWATNY (wewnątrz organizacji).** Itemy NIE są publiczne — publikujemy tylko agregaty + metodologię. To anti-kontaminacja: publiczne itemy wyciekłyby do treningów i bench by się zepsuł. Implementacja/itemy → prywatne repo (jak PolNative, datasety); strona publiczna = liczby + protokół.

## Kolejność
1. **Proxy 5-shot Open-PL-like** (22 zadania) base + v3 vs Bielik — własny, transparentny.
2. **MT-Bench-PL + EQ-Bench** do macierzy (judge otwarty).
3. **DPO-P** na otwarto-sędziowanych preferencjach.
4. **Skala SFT** wg manifestu.
5. CPT — tylko jeśli (1) pokaże lukę wiedzy.
