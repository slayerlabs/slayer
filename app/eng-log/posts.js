// Engineering log — notatki z treningu Slayera.
// Nowy wpis = nowy obiekt na POCZĄTKU tablicy. Body w markdown-lite:
// "## " nagłówek, "- " lista, ``` blok kodu, **bold**, `code`, [tekst](url), puste linie dzielą akapity.
// Numer wpisu (LOG 001…) liczy się z pozycji w tablicy: najstarszy = 001.

export const AUTHOR = "Kacper Wikieł";

export function entryNo(index) {
  // index w tablicy POSTS (0 = najnowszy) -> numer logu (najstarszy = 001)
  return String(POSTS.length - index).padStart(3, "0");
}

export const POSTS = [
  {
    slug: "v4-faza0-pomiar-i-kalibracja",
    date: "2026-06-14",
    title: "V4 Faza 0: regresja CDSC-E była głównie artefaktem pomiaru, a kalibracja λ to pułapka małej próbki",
    tags: ["v4", "faza0", "likelihood", "kalibracja", "EN-retention", "gate"],
    lead:
      "Domknięcie wątku z v3. Po policzeniu wszystkiego na H100: katastrofalny spadek CDSC-E był w ~3/4 artefaktem trybu pomiaru (generacja + parser), a nie uszkodzeniem wag. v3 to realny zysk na celu (LLMzSzŁ +3.3, makro KLEJ płaskie). Próba naprawy przez merge wag λ=0.3 wyglądała świetnie na n=200 i wywróciła się na n=400 — oddała cały zysk. Wnioski: mierzyć likelihood, decydować na n≥400, prawdziwy fix to trening anti-collapse, nie mieszanie wag.",
    body: `
## Wniosek w jednym zdaniu

v3 cały czas był realnie lepszym modelem na celu; popsuł go **sposób pomiaru**, a fałszywie „naprawiła" go **mała próbka**. Prawdziwa poprawa kalibracji wymaga treningu, nie post-hoc mieszania wag.

## 1. CDSC-E: -22.5 w generacji, tylko -6.0 w likelihood

Ten sam model, dwa sposoby liczenia. Generacja = model pisze odpowiedź, parser ją wyłuskuje. Likelihood = scoringujemy log-prawdopodobieństwo każdej etykiety i bierzemy argmax (bez generacji, bez parsera).

\`\`\`
CDSC-E  n=200  seed 42
                  base     v3       Δ
generacja         87.0    64.5    -22.5
likelihood        87.5    81.5     -6.0
\`\`\`

Około 3/4 spadku to styl i gadatliwość po SFT plus kruchy parser: zwracał pierwszą napotkaną etykietę z listy, więc rozgadana odpowiedź wzmiankująca kilka relacji była systematycznie odczytywana na niekorzyść \`neutralna\`. To nie jest uszkodzenie wag, tylko warstwa odczytu. **Wniosek operacyjny: zadania klasyfikacyjne mierzymy likelihood, nie generacją.**

## 2. v3 to realny improvement — i nie ma szerokiej regresji

\`\`\`
LLMzSzŁ  likelihood  n=400
  base Qwen3.5-27B   63.5
  Slayer v3          66.8   (+3.3)
\`\`\`

Pełny KLEJ (generacja) potwierdza brak szerokiej regresji — makro płaskie, a sentyment wręcz w górę:

\`\`\`
task            base    v3      Δ
polemo2_in      79.5   88.5   +9.0
polemo2_out     68.0   75.5   +7.5   (OOD)
psc/ppc/dyk/8tags        +1.0..+1.5
belebele/cbd/nkjp/ar     -0.5..-2.0
cdsc_e (gen)    75.0   57.0  -18.0   (artefakt, p. sekcja 1)
MACRO           77.4   77.3   -0.1
\`\`\`

Jedyny duży spadek to izolowany, mierzalny cdsc_e. Reszta płasko lub w górę.

## 3. Kalibracja λ-merge: pułapka małej próbki

Pomysł: zmaterializować \`base + λ·(v3 − base)\`, żeby odzyskać CDSC bez utraty celu (interpolacja wag, DoRA-safe — bo czysty λ-scaling adaptera DoRA nie wraca do bazy przy λ=0).

Sweep bf16 **n=200** wyglądał jak Pareto-win:

\`\`\`
λ      CDSC-E   LLMzSzŁ
0.0     84.0     62.5
0.30    82.0     66.5   <- niby najlepszy
0.50    78.5     68.0
\`\`\`

Zmaterializowaliśmy \`slayer-v4-cal-l030\` (λ=0.30) i puściliśmy twardy rerun na protokole referencyjnym **n=400**. To wywróciło wniosek:

\`\`\`
                LLMzSzŁ n=400   CDSC-E
base                  63.5       87.5
cal λ=0.30            63.5       83.5   <- oddał CAŁY zysk celu
v3 (λ=1.0)            66.8       81.5
\`\`\`

n=200 skłamało: λ=0.30 dawało 66.5, a na n=400 to 63.5 = baza. Przy niskim λ koszt CDSC rośnie szybciej niż zysk LLMzSzŁ, więc nie ma czystego punktu gate-clean. **Wnioski: decyzje o release tylko na n≥400; post-hoc merge nie zastępuje treningu.**

## 4. Reguła danych V4

Zero benchmark train splitów jako paliwa treningowego — także KLEJ train. v2 „wygrana" na KLEJ okazała się artefaktem train-splitów i została odrzucona. v3 jest czysty (distill / styl / EN-retention, ~2.2k przykładów, kuracja nie wolumen).

## 5. Co liczymy teraz

Przekrojowy screen no-regression **base vs v3 vs cal-l030**: KLEJ ×12 (likelihood) + LLMzSzŁ + **EN-retention (ARC-C, MMLU, Belebele-EN, GSM8K)** — żeby potwierdzić, że polski tuning nie psuje angielskiego i rozumowania. Zrobiony jako jeden runner (model z HF / katalogu / docelowo GGUF), sampling n=100 dla szybkości, zapis przyrostowy + watchdog na boxie, żeby przeżył 6h bez nadzoru.

## Wnioski na przyszłość (efektywność)

- **Likelihood do klasyfikacji.** Generacja zaniża i dokłada artefakty parsera.
- **n≥400 do decyzji**, n=100 tylko jako szybki screen regresji; przy małym n nie wybieramy checkpointów.
- **Batching / vLLM = 5–10×.** Teraz pomiar jest unbatched (H100 na ~33% util).
- **Prawdziwy fix kalibracji to trening anti-collapse** (q/v only, niższy lr, hard-neutral NLI + KL-to-base), nie mieszanie wag.
- **Od początku: jeden proces + idempotentny resume + watchdog** — inaczej traci się godziny na crashu.
`,
  },
  {
    slug: "v3-cdsc-e-regresja",
    date: "2026-06-13",
    title: "Slayer v3 poprawił LLMzSzŁ, ale uderzył w CDSC-E. To jest czerwona flaga",
    tags: ["v3", "regresja", "KLEJ", "NLI", "gate"],
    lead:
      "Pierwszy czysty trening v3 dał mocny sygnał na LLMzSzŁ: 66.8 vs 63.5 dla gołej bazy Qwen3.5-27B. Ale po poprawieniu kierunku promptu CDSC-E spadł z 87.0 do 64.5. To nie jest kosmetyka metryki, tylko realna regresja NLI do zbadania przed jakimkolwiek finalnym claimem.",
    body: `
## Co zmierzyliśmy

Po treningu v3 na H100 zrobiliśmy dwa typy szybkich bramek:

- **LLMzSzŁ likelihood n=400 seed 42:** base Qwen3.5-27B **63.5**, Slayer v3 **66.8**. Zysk: **+3.3 pp**.
- **KLEJ sample n=200/task:** makro prawie płaskie, base **77.36**, Slayer v3 **77.27**.
- Pierwszy pomiar CDSC-E na starym promptcie pokazał **75.0 → 57.0**, ale prompt miał prawdopodobnie odwrócony kierunek wynikania.
- Po poprawce kierunku promptu na oficjalny sens **b entails a / a wynika z b**, czysty rerun pokazał **87.0 → 64.5**.

To oznacza około **174/200 poprawnych odpowiedzi przed treningiem** i około **129/200 po treningu** na tej samej bramce. Skala spadku jest za duża, żeby traktować to jako szum.

## Autopsja: rozkład predykcji

Na tej samej próbce \`n=200\` rozkłady wyglądają tak:

\`\`\`
gold:
neutralna       147
wynikanie        40
sprzeczność      13

base pred:
neutralna       143
wynikanie        29
sprzeczność      28

v3 pred:
neutralna        86
wynikanie        50
sprzeczność      64
\`\`\`

To jest właściwa diagnoza: **v3 mocno zaniża neutralność**. Problem nie polega na tym, że model nagle nie rozumie etykiet \`wynikanie\` i \`sprzeczność\`; przeciwnie, rozpoznaje złote \`sprzeczność\` bezbłędnie i poprawia \`wynikanie\` z 29/40 do 35/40. Regresja idzie prawie cała przez złote \`neutralna\`: base trafia 132/147 neutralnych par, a v3 tylko 81/147.

Macierz:

\`\`\`
base, gold -> pred
              wynikanie  sprzeczność  neutralna
wynikanie            29            0         11
sprzeczność           0           13          0
neutralna             0           15        132

v3, gold -> pred
              wynikanie  sprzeczność  neutralna
wynikanie            35            0          5
sprzeczność           0           13          0
neutralna            15           51         81
\`\`\`

W praktyce: adapter zrobił model bardziej stanowczy. Zamiast mówić \`neutralna\`, za często dopowiada relację, szczególnie \`sprzeczność\`.

## Co to jest CDSC-E

CDSC-E to polskie zadanie NLI/entailment z KLEJ, oparte o pary podpisów obrazów. Model dostaje \`sentence_A\` i \`sentence_B\`, a wyjściem jest \`entailment_judgment\`: \`entailment\`, \`contradiction\` albo \`neutral\`.

Kluczowy detal definicji: dokumentacja opisuje relację jako **b entails a** / **a wynika z b**. Innymi słowy: jeśli zachodzi sytuacja opisana przez zdanie B, to uznajemy, że zachodzi też sytuacja opisana przez zdanie A.

W naszych polskich etykietach:

- \`wynikanie\` — drugie zdanie wynika z pierwszego;
- \`sprzeczność\` — zdania sobie przeczą;
- \`neutralna\` — nie ma ani pewnego wynikania, ani sprzeczności.

To jest dokładnie ten rodzaj zdolności, którego potrzebujemy w zastosowaniach prawno-urzędowych: nie dopowiadać faktów, nie mylić sugestii z wynikiem, nie robić z neutralnej pary zdaniowej twardego wniosku.

## Błąd w pierwszym promptcie

Pierwszy harness pytał model: \`Czy B wynika z A?\`. To była najpewniej odwrotność oficjalnej definicji \`b entails a\` / \`a wynika z b\`.

Po poprawce prompt pyta: \`Czy A wynika z B?\`. Na tej wersji base wzrósł do **87.0**, a v3 do **64.5**. To znaczy, że poprawny prompt naprawia absolutną interpretację benchmarku, ale nie usuwa regresji po adapterze.

## Hipoteza robocza

Najbardziej prawdopodobne wyjaśnienie: v3 nauczył model lepszego stylu / formatu odpowiedzi i trochę mocniej pcha go do stanowczych decyzji, ale przy okazji pogorszył kalibrację NLI. Szczególnie podejrzany jest rozkład etykiet w danych syntetycznych: jeśli trening pokazuje za dużo par typu \`wynikanie\` albo \`sprzeczność\`, model może przestać wybierać \`neutralna\` wtedy, gdy powinien.

To trzeba sprawdzić, nie zgadywać. Sama liczba 64.5 mówi, że jest problem; nie mówi jeszcze, czy winny jest prior etykiet, parser odpowiedzi, prompt, konkretna warstwa danych, czy katastroficzne zapominanie w wąskiej umiejętności.

## Co sprawdzić przed kolejnym wydaniem

1. Rerun CDSC-E na pełnym teście, tym samym seedem i poprawionym promptem.
2. Odpalić małą ablacją: base, v3, checkpoint-240, checkpoint-246, ewentualnie v3b jeśli dokończony.
3. Przejrzeć dane treningowe pod kątem fałszywego priora: za mało \`neutralna\`, za dużo twardych etykiet.
4. Jeśli problem potwierdzi się, zrobić v3c z NLI-retention albo usunąć/naprawić warstwę danych, która uczy złego priora.

## Decyzja

**Nie traktujemy v3 jako finalnego modelu tylko dlatego, że LLMzSzŁ wzrósł.** LLMzSzŁ jest ważny, ale CDSC-E jest ważną regresją logiczną. Dla Slayera bramka musi być Pareto: styl i LLMzSzŁ w górę, bez rozwalenia NLI/EN/long-context.

Najkrótszy opis stanu: **v3 jest ciekawym checkpointem badawczym, nie zamkniętym release'em.**

## Artefakty

- Adapter: \`ssh slayer:~/slayer-out/qwen-v3-dora\`
- Najlepszy checkpoint według eval loss: \`checkpoint-240\`
- LLMzSzŁ: \`ssh slayer:~/slayer-train/eval_v3/llmzszl_likelihood_Qwen__Qwen3.5-27B_n400_s42_answer_none.json\`
- KLEJ full-gate, stary prompt: \`ssh slayer:~/slayer-train/eval_v3/klej_v3.json\`
- CDSC-E fixed prompt, base: \`ssh slayer:~/slayer-train/eval_cdsc_fixed/klej_base_cdsc_e_fixed.json\`
- CDSC-E fixed prompt, v3: \`ssh slayer:~/slayer-train/eval_cdsc_fixed/klej_v3_cdsc_e_fixed_clean.json\`
- CDSC-E confusion matrix: \`ssh slayer:~/slayer-train/eval_cdsc_fixed/cdsc_confusion_n200_s42.json\`
`,
  },
  {
    slug: "munin-nie-zrobil-cpt",
    date: "2026-06-13",
    title: "Munin 1.0 nie zrobił CPT. Receptura wyciekła w nazwie katalogu",
    tags: ["recon", "post-training", "CPT", "qwen3.5"],
    lead:
      "Danish Foundation Models wypuścili Munina na Qwen3.5-9B-Base, czyli na bazie z tej samej rodziny, w którą celuje nasz plan CPT. Release note nie zdradza nic. Ale w repo modelu leży plik prime_rl_finalized.json, a w nim pełna ścieżka runu treningowego. Nazwa katalogu to cała receptura.",
    body: `
## Co znaleźliśmy

W repo \`danish-foundation-models/munin-qwen3.5-9B\` na HF leży plik \`prime_rl_finalized.json\` z polem \`source_step_dir\`:

\`\`\`
qwen3_5-9b-base-official-apertus-wildchat-ifbench-when2call-agentic-code-danish-v1
-4n-prime-cp1-ac-fla-bs64-mbs1-lr1e4-warmup50-steps1521
\`\`\`

Rozbiór tej nazwy mówi więcej niż release note:

- **Munin 1.0 to NIE jest CPT.** Katalog \`post/outputs\`, framework prime-rl, 1521 kroków przy batchu 64 to około 97k przykładów, rzędu 0.3-0.8B tokenów. Czysty, krótki post-training (SFT) na **Qwen3.5-9B-Base**. CPT na korpusie DynaWord robili tylko w paperze, na modelach 1B.
- **Chat template zbudowali sami na bazie** (w repo: \`tokenizer_build_manifest.json\`, \`chat_template.jinja\`, EOS \`<|im_end|>\`). Nie wzięli instructa Qwena.
- **Mix SFT wprost z nazwy runu:** apertus (otwarte dane instrukcyjne Swiss AI) + wildchat + ifbench (instruction following) + when2call (tool calling) + agentic-code + danish-v1 (ich warstwa narodowa).
- **Hiperparametry:** 4 nody (LUMI), bs 64, mbs 1, LR 1e-4, warmup 50, 1521 kroków.
- Smaczek operacyjny: \`dropped_extra_tensors: 333\`, czyli wycinanie wieży multimodalnej z Qwen3.5. Ta sama klasa zabaw co nasze łatanie GGUF (blk.64 / nextn).

## Ile za to zapłacili

Wyniki vs goła baza (EuroEval, z ich pełnego raportu):

- duński: NLI **+11.8**, knowledge +1.7, reading comprehension +1.1
- duński w dół: word-in-context −4.5, instruction following −3.7, common sense −2.4
- angielski: **MMLU-Pro −19.8** (80.6 → 60.9), RULER 32k −12.6, GSM8K −2.6

Zysk narodowy jest realny, ale replay (apertus + wildchat + code) nie uratował trudnych zdolności ogólnych. Przy LR 1e-4 na pełnym SFT wygląda to na przepalenie.

## Co z tego bierzemy dla Slayera

1. **Walidacja sekwencji SFT-first.** Narodowy projekt z superkomputerem pod ręką też zaczął od post-trainingu na mocnej bazie, nie od drogiego CPT. Nasza kolejność v3 (styl SFT teraz, CPT wiedzy jako następna faza) dostała zewnętrzne potwierdzenie.
2. **LR ma znaczenie.** Ich 1e-4 kosztowało 20 punktów MMLU-Pro. Nasz QLoRA z niższym efektywnym LR jest z natury łagodniejszy, ale bramka en-regression zostaje obowiązkowa przy każdym runie.
3. **Brakuje nam checku long-context.** RULER 32k −12.6 to kategoria regresji, której w ogóle nie mierzymy. Do dodania przy v3.
4. **Lista mixów retention do podejrzenia:** apertus-SFT, wildchat, ifbench, when2call, agentic-code. Tool calling w mixie narodowego modelu to też sygnał, czego oczekuje rynek.

## Źródła

[munin-qwen3.5-9B](https://huggingface.co/danish-foundation-models/munin-qwen3.5-9B) · [release note](https://foundationmodels.dk/news/2026/06/11/munin-10-release-note.html) · [pełne wyniki](https://foundationmodels.dk/news/results/munin-10-full-results.html) · [prime-rl](https://github.com/PrimeIntellect-ai/prime-rl) · [Dynaword paper](https://arxiv.org/pdf/2508.02271)
`,
  },
];
