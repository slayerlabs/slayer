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

## Status: ZWALIDOWANE (smoke-test 2026-06-20 na aisrv, RTX 3090)
Pelny pipeline przeszedl end-to-end: QLoRA SFT na Qwen/Qwen3-0.6B, 51 przykladow PL,
3 epoki, 31s na jednym 3090. Loss 3.39 -> 0.59. Adapter zapisany, generacja PL poprawna
(np. "Jaka jest stolica Polski?" -> "Stolica Polski jest Warszawa.").

Smoke (powtarzalny):
```
python scripts/train_sft.py --model Qwen/Qwen3-0.6B --data data/sft_pl.jsonl \
  --out out/smoke-0.6b --epochs 3 --maxlen 512 --grad_accum 4
```

Pulapki srodowiska (wyszly w praniu na boxie z torch 2.4.1):
1. systemowy Pillow bez `Image.Resampling` -> `pip install -U pillow`.
2. transformers 5.x w sciezce bnb 4-bit wola `model.set_submodule` (torch>=2.5);
   na torch 2.4 uzyj transformers 4.51.3 (4.46 nie zna 'qwen3').
3. trl 0.14 nie zawsze auto-wykrywa `messages` -> train_sft.py pre-renderuje
   chat template do pola `text` (juz w kodzie).

Nastepny krok: ten sam pipeline na bazie 9B w 4-bit (miesci sie w 24GB) + realne dane SFT.
