# Slayer — jawny manifest danych (V4)

**Zasada nadrzędna:** każdy shard (i docelowo każdy przykład) musi odpowiadać na pytanie
**„jaką kompetencję chronię albo poprawiam?"**. Jeśli nie umiemy wskazać `skill` + `eval_proxy`,
przykład nie wchodzi do miksu. To jest różnica między *skill-transfer* (uczymy umiejętności
z rozłącznych źródeł) a *benchmaxxingiem* (trenujemy na itemach benchu).

Manifest maszynowy: [`bench/dataset_manifest.json`](bench/dataset_manifest.json). Tabela poniżej = ludzka kopia.

## Schema (pola na shard)

| pole | znaczenie |
|---|---|
| `shard_id` | stabilny identyfikator shardu |
| `skill` | jaką kompetencję uczy/chroni (np. NLI-calibration, sentiment, math-reasoning) |
| `eval_proxy` | który benchmark to mierzy (CDSC-E, PolEmo, GSM8K…) — łącznik do macierzy |
| `source_family` | skąd dane (style-distill, self-replay-base, synthetic-teacher, human-PL, wiki/legal…) — **musi być rozłączne od evala** |
| `language` | pl / en / pl+en |
| `domain` | tematyka (general, legal-admin, exams, reviews, news…) |
| `label_prior` | docelowy rozkład etykiet (np. NLI 75/18/7) — wierność realnemu priorowi, nie uniform |
| `format` | postać I/O (single-label / explained / JSON / chat / cot) — dywersyfikacja przeciw artefaktom metody |
| `contamination_status` | clean (decon vs train+dev+test) / suspect / banned |
| `target_weight` | udział w miksie (∝ ważność × luka w macierzy) |
| `regression_guard` | przed czym broni: który spadek ma blokować release |

## Manifest V4 (planowane + istniejące shardy)

| shard_id | skill | eval_proxy | source_family | lang | domain | label_prior | format | contam | weight | regression_guard |
|---|---|---|---|---|---|---|---|---|---|---|
| `style_pl_sft` | polszczyzna/naturalność, sentyment | PolEmo, judge-style | style-distill (open judge) | pl | general | n/d (gen) | chat / explained | clean | 0.18 | naturalność, PolEmo nie spada |
| `hard_neutral_nli` | NLI-calibration (neutralność) | CDSC-E | synthetic-teacher (deepseek) + open judge | pl | general/captions | 75 neutral / 18 ent / 7 contra | single-label | clean | 0.08 | CDSC-E neutral-recall ≥ base−3pp |
| `task_preservation_nlu` | formaty zadań NLU (TAK/NIE, MCQ, klasy) | PSC, DYK, PPC, 8tags, Belebele | self-replay-base + synthetic-PL | pl | mixed | wg zadania | single-label / letter | clean | 0.12 | brak zawału na KLEJ-binary/MCQ |
| `ner_pl` | rozpoznawanie nazw własnych | NKJP-NER | synthetic-PL + human-PL | pl | news/general | wg klas NER | single-label | clean | 0.04 | NKJP nie spada |
| `toxicity_pl` | wykrywanie hejtu + hard-negatywy | CBD | synthetic-PL (hard neg) | pl | social | ~realny CBD | single-label | clean | 0.04 | CBD ≥ base−2pp (nie nad-/pod-triggeruje) |
| `reasoning_cot_pl` | rozumowanie wieloskokowe + egzaminy | LLMzSzŁ, PES | synthetic-teacher CoT (izomorf.) | pl | exams/legal | n/d | cot | clean | 0.14 | LLMzSzŁ ↑ (cel) |
| `reasoning_cot_en` | rozumowanie/matma EN | ARC, MMLU, GSM8K | curated CoT (open) | en | general/math | n/d | cot | clean | 0.10 | ARC/MMLU/GSM8K ≥ base−2pp |
| `en_retention` | retencja angielskiego/instrukcji | ARC, MMLU, Belebele-EN | tulu3 (open) | en | general | n/d | chat | clean | 0.10 | EN nie degraduje przy PL tuningu |
| `replay_base` | anti-forgetting zachowań bazy | (wszystkie, drift) | self-replay-base (własne wyjścia) | pl+en | broad | n/d | chat | clean | 0.16 | KL-do-bazy mały; brak driftu osobowości |
| `knowledge_pl` | wiedza długiego ogona o Polsce | LLMzSzŁ, PES, PoQuAD | wiki/legal + EntiGraph (po filtrze wierności) | pl | legal-admin/encyc | n/d | qa / cpt | suspect→clean | 0.04 | tylko po filtrze faithfulness; PoQuAD-faithfulness |

> Wagi sumują się ~1.0; korygowane po każdej iteracji wg macierzy (pusta/czerwona kolumna → ↑ waga shardu, który ją chroni).

## Banned (świadomie poza miksem)

| co | dlaczego |
|---|---|
| KLEJ train/dev/test (oficjalne splity) | benchmaxxing / kontaminacja — patrz reguła V4 |
| jakikolwiek shard `contamination_status: banned` | overlap n-gram/atom z którymkolwiek split benchu |
| dane z Anthropic/OpenAI jako źródło/filtr | provenance: „not distilled" musi być szczelne |

## Pętla (jak manifest steruje budową danych)

1. Zmierz pełną macierz (`bench/bench_matrix.py`).
2. Znajdź kolumny z regresją / bez progresu.
3. Podnieś `target_weight` shardu, którego `eval_proxy` = ta kolumna; albo dodaj nowy shard z rozłącznego `source_family`.
4. Dekontaminuj, sprawdź `label_prior`, dorzuć `format`-diversity.
5. Trenuj → zmierz → powtórz. `regression_guard` każdego shardu = bramka release.
