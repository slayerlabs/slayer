# slayer/lab — scaffold treningowo-ewaluacyjny

Wykonawcza wersja planu "jak pobic Bielika-11B-v3". To jest szkielet do uruchomienia
na waszym GPU (RTX 3090 / klaster), nie gotowy model. Liczby pojawiaja sie po treningu,
nie w tym README (zadnej tezy bez dowodu).

## Kolejnosc (mapuje na fazy planu)
0. **Baseline + eval**  `bash scripts/eval_pl.sh Qwen/Qwen3-8B`  (zmierz baze)
1. **Dane SFT**         `python scripts/prepare_data.py`  (uzupelnij SOURCES / seed_prompts.txt)
2. **SFT (QLoRA)**      `python scripts/train_sft.py --model Qwen/Qwen3-8B --data data/sft_pl.jsonl`
3. **GRPO/RLVR MCQ**    `python scripts/grpo_mcq.py --model out/slayer-9b-sft --data data/mcq_pl.jsonl`
4. **Eval finalna**     `bash scripts/eval_pl.sh out/slayer-9b-grpo`
5. **Held-out**         odpal na PRYWATNYM zestawie (data/heldout_*.jsonl) — dowod bez benchmaxxingu

## Sprzet
- 1x 24GB (3090) wystarcza na QLoRA 9B w nf4 + gradient checkpointing + paged_adamw_8bit.
- Pelny CPT pominiety swiadomie (patrz plan): baza Qwen juz niesie polski.

## Anty-benchmaxxing
- `eval_pl.sh` mierzy PUBLICZNY leaderboard (kierunek, nie dowod).
- Walidacje "epsilon lepszy" rob wylacznie na prywatnym held-out wolnym od wyciekow.

## Status
Scaffold v0. API bibliotek (trl/peft) bywa ruchome — przypnijcie wersje z requirements.txt.
Smoke-test: uruchom train_sft.py na malym modelu (np. Qwen/Qwen3-0.6B) i 50 przykladach,
zeby potwierdzic ze pipeline przechodzi end-to-end, zanim puscicie 9B.
