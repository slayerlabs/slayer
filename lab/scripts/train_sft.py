#!/usr/bin/env python3
"""QLoRA SFT dla bazy Qwen3 -> polski instruct (Faza 2 planu).
Dziala na pojedynczym 24GB GPU (RTX 3090) dla modelu ~7-9B w 4-bit.
Wymaga: transformers>=4.44, trl>=0.11, peft>=0.12, bitsandbytes, datasets, accelerate.
Dane: jsonl w formacie chat: {"messages":[{"role":"user","content":...},{"role":"assistant","content":...}]}
"""
import argparse, torch
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig
from trl import SFTTrainer, SFTConfig

def parse():
    p = argparse.ArgumentParser()
    p.add_argument("--model", default="Qwen/Qwen3-8B", help="baza; podmien na Qwen3.5-9B gdy dostepna")
    p.add_argument("--data", default="data/sft_pl.jsonl")
    p.add_argument("--out", default="out/slayer-9b-sft")
    p.add_argument("--epochs", type=float, default=2.0)
    p.add_argument("--bsz", type=int, default=1)
    p.add_argument("--grad_accum", type=int, default=16)
    p.add_argument("--lr", type=float, default=1e-4)
    p.add_argument("--maxlen", type=int, default=2048)
    p.add_argument("--lora_r", type=int, default=16)
    return p.parse_args()

def main():
    a = parse()
    bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                             bnb_4bit_compute_dtype=torch.bfloat16, bnb_4bit_use_double_quant=True)
    tok = AutoTokenizer.from_pretrained(a.model, trust_remote_code=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    model = AutoModelForCausalLM.from_pretrained(
        a.model, quantization_config=bnb, torch_dtype=torch.bfloat16,
        device_map="auto", trust_remote_code=True)
    model.config.use_cache = False
    peft = LoraConfig(
        r=a.lora_r, lora_alpha=a.lora_r * 2, lora_dropout=0.05, bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"])
    ds = load_dataset("json", data_files=a.data, split="train")
    # Renderuj format chat ({"messages":[...]}) do pola "text" przed SFT.
    # Robust miedzy wersjami trl (0.14 nie zawsze auto-wykrywa konwersacje).
    if "messages" in ds.column_names:
        ds = ds.map(lambda r: {"text": tok.apply_chat_template(r["messages"], tokenize=False)},
                    remove_columns=ds.column_names)
    cfg = SFTConfig(
        output_dir=a.out, dataset_text_field="text", num_train_epochs=a.epochs,
        per_device_train_batch_size=a.bsz, gradient_accumulation_steps=a.grad_accum,
        learning_rate=a.lr, lr_scheduler_type="cosine", warmup_ratio=0.03,
        logging_steps=10, save_steps=200, bf16=True, max_seq_length=a.maxlen,
        gradient_checkpointing=True, gradient_checkpointing_kwargs={"use_reentrant": False},
        optim="paged_adamw_8bit", packing=True, report_to="none")
    trainer = SFTTrainer(model=model, args=cfg, train_dataset=ds,
                         peft_config=peft, processing_class=tok)
    trainer.train()
    trainer.save_model(a.out)
    tok.save_pretrained(a.out)
    print("OK ->", a.out)

if __name__ == "__main__":
    main()
