#!/usr/bin/env python3
"""GRPO/RLVR z weryfikowalna nagroda MCQ (Faza 3 planu).
Nagroda = 1.0 gdy wyciagnieta litera odpowiedzi == gold, inaczej 0.0.
To dokladnie ten 'verifiable reward' pod leaderboard, ktory jest w wiekszosci MCQ.
Wymaga: trl>=0.11 (GRPOTrainer), peft, bitsandbytes, datasets.
Dane: jsonl {"prompt": "<pytanie + opcje A-D>", "answer": "B"}
"""
import argparse, re, torch
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig
from trl import GRPOConfig, GRPOTrainer

LETTER = re.compile(r"\b([ABCD])\b")

def make_reward(answers_by_prompt):
    def reward(completions, prompts=None, **kw):
        out = []
        for comp, prm in zip(completions, prompts):
            text = comp if isinstance(comp, str) else comp[-1]["content"]
            m = list(LETTER.finditer(text.upper()))
            pred = m[-1].group(1) if m else None          # ostatnia litera = finalna odpowiedz
            gold = answers_by_prompt.get(prm)
            out.append(1.0 if pred == gold else 0.0)
        return out
    return reward

def parse():
    p = argparse.ArgumentParser()
    p.add_argument("--model", default="out/slayer-9b-sft", help="zacznij od modelu po SFT")
    p.add_argument("--data", default="data/mcq_pl.jsonl")
    p.add_argument("--out", default="out/slayer-9b-grpo")
    p.add_argument("--gen", type=int, default=8, help="generacje na prompt (grupa GRPO)")
    return p.parse_args()

def main():
    a = parse()
    raw = load_dataset("json", data_files=a.data, split="train")
    answers = {r["prompt"]: r["answer"].strip().upper() for r in raw}
    ds = raw.remove_columns([c for c in raw.column_names if c != "prompt"])
    bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                             bnb_4bit_compute_dtype=torch.bfloat16, bnb_4bit_use_double_quant=True)
    tok = AutoTokenizer.from_pretrained(a.model, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        a.model, quantization_config=bnb, torch_dtype=torch.bfloat16,
        device_map="auto", trust_remote_code=True)
    peft = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, bias="none",
                      task_type="CAUSAL_LM",
                      target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"])
    cfg = GRPOConfig(output_dir=a.out, num_generations=a.gen, per_device_train_batch_size=a.gen,
                     gradient_accumulation_steps=4, learning_rate=5e-6, max_prompt_length=1024,
                     max_completion_length=512, bf16=True, logging_steps=10, save_steps=200,
                     report_to="none")
    trainer = GRPOTrainer(model=model, reward_funcs=make_reward(answers), args=cfg,
                          train_dataset=ds, peft_config=peft, processing_class=tok)
    trainer.train()
    trainer.save_model(a.out)
    print("OK ->", a.out)

if __name__ == "__main__":
    main()
