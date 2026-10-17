#!/usr/bin/env bash
# Ewaluacja na Open PL LLM Leaderboard tasks (Faza 0/1/5).
# Uzywa EleutherAI lm-evaluation-harness + definicji zadan PL ze SpeakLeash.
set -euo pipefail
MODEL="${1:-out/slayer-9b-sft}"
TASKS="${2:-polish_belebele_mc,polish_polqa_open_book,polish_poquad_open_book,polish_pes,polish_8tags,polish_polemo2_in}"
# 1) zainstaluj harness + zadania PL:
#    pip install lm-eval
#    git clone https://github.com/speakleash/lm-evaluation-harness-pl  # zadania polish_*
# 2) odpal 5-shot, tak jak leaderboard:
lm_eval --model hf \
  --model_args "pretrained=${MODEL},dtype=bfloat16,trust_remote_code=True" \
  --tasks "${TASKS}" \
  --num_fewshot 5 \
  --batch_size auto \
  --output_path "results/$(basename "${MODEL}").json"
echo "Wynik -> results/$(basename "${MODEL}").json"
# UWAGA: to jest publiczny benchmark. Walidacje 'epsilon lepszy' rob na PRYWATNYM held-out (data/heldout_*).
