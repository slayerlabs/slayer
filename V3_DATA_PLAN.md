# Slayer v3 — Clean Data Plan

**Principle:** NO benchmark train splits in training. Benchmarks = held-out eval only.
Public claim made **solely on official 5-shot Open PL LLM Leaderboard + MT-Bench-PL** (same measure as Bielik).
See [`DATA_LINEAGE.md`](DATA_LINEAGE.md) for why v2 was contaminated and is not a defensible claim.

## Inventory verdict (verified on HF, 2026-06)

| layer | source | license | status |
|---|---|---|---|
| EN retention | `allenai/tulu-3-sft-mixture` (939k) | odc-by | ✅ ready |
| EN retention | `allenai/Dolci-Instruct-SFT` (Olmo 3, 2.15M) | odc-by | ✅ ready |
| Human PL | `CohereLabs/aya_collection` PL subset | apache-2.0 | ✅ **native PL only** (skip NLLB-translated → translationese) |
| Human PL | `OpenAssistant/oasst2` PL threads | apache-2.0 | ✅ ready |
| Human PL | PLLuM organic instructions | — | ❌ **NOT released** (CYFRAGOVPL published models only, 0 dataset repos) |

**Consequence:** open human-PL is thin (Aya-PL + OASST-PL only) → **distillation must carry v3.**
EN-retention is fully solved (both odc-by, commercial-OK) → no forgetting risk.

**PLLuM: DROPPED entirely.** Two reasons: (1) the instruction data was never released (models only), and
(2) model quality is reportedly weak — so distilling from it would mean learning from a weaker teacher.
No PLLuM data, no PLLuM distillation. Teacher stays **deepseek-v4-pro**.

**Bielik as teacher: DROPPED too (2026-06-12).** Same logic as PLLuM: weak teacher. Open judge found
`fakty: powazne` in 50.6% of raw Bielik-11B distill outputs; 78% of the sampled layer was long-tail
factual QA. The 10k corpus is retained in `slayer-data/external/` purely as a **Bielik-knowledge
benchmark/analysis asset** (see README there), never as training data.

## Target mix (buildable today)

| layer | share | what |
|---|---|---|
| **Distillation** | ~60% | diverse PL prompts (law/code/writing/QA/reasoning) → answers **generated in PL from scratch** (deepseek-v4-pro teacher + open Qwen3.5 judge). NO translation. NO Bielik (weak teacher, dropped). |
| **Human PL** | ~15% | Aya-PL (native templated) + OASST2-PL + our re-judged style (`style_pl_sft_v3*`) |
| **EN retention** | ~20% | Tulu 3 / Dolci subset (reasoning, code, IF) |
| **DPO** | ~5% / post-SFT | on-policy pairs from our own model, teacher-judged (`style_pl_pref_v2` as seed) |

## Provenance rules (carry from v1/v2)
- Teacher = **deepseek-v4-pro** (MIT); judge = **open Qwen3.5** (Apache). No Anthropic/OpenAI anywhere — not even as judge. (see `teacher-decision`)
- Generate PL from scratch, never translate EN→PL.
- No em-dash / półpauza overuse (AI-tell). (see `no-dash-overuse`)
- Quality over volume — ~1–1.5k excellent per sub-source beats bulk (LIMA). (see `data-quality-over-quantity`)
- Atom-level dedup of ALL training data vs every benchmark test split (reuse `build_klej_sft.py` dedup).

## Build order
1. **Layer 2 (ready data)** — pull + filter native Aya-PL + OASST2-PL slices. *(cheap, do first)*
2. **Layer 3** — sample EN-retention subset from Tulu 3 / Dolci (cap ~20% of final mix).
3. **Layer 1 (engine)** — expand distillation: PL prompt bank by domain → teacher gen → open-judge filter.
4. **Assemble + dedup vs all test splits → SFT → held-out dev gate (eval-loss) → 5-shot leaderboard + MT-Bench-PL.**
5. **DPO** pass last.

## Success criteria
- 5-shot leaderboard macro ↑ **and** MT-Bench-PL ↑ **together** (rules out benchmaxxing).
- No EN-capability regression (MMLU/GSM8K retention check).
