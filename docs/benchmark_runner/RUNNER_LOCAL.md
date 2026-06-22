# Running the Benchmark Runner locally (no GPU cluster, no Blob)

Goal: eval a small model on your own GPU (e.g. RTX 2000 Ada 8 GB) → see it on `/runner`, entirely on local files. The GPU box is just an eval executor; everything else is Node + fs.

## What's already built (Phase 3)
- `bench/runner/suite_cfg.py` — loads/validates `bench/runner/suite_open_pl_v1.yaml`.
- `bench/runner/lm_eval_to_run.py` — maps lm-eval results → `run/v1`.
- `bench/runner/run_one.py` — orchestrator: eval → map → publish.
- `scripts/publish-run.mjs --local` — fs-writes `public/results/runs/<id>.json` (no token).
- Queue lifecycle (`scripts/queue-*.mjs`) + `bench/runner/worker.py` — all fs-capable locally.

## One-time setup
1. Python eval deps (in the repo venv): `uv pip install lm-eval vllm` (or `lm-eval` alone — the `hf` backend is enough on 8 GB).
2. **Vendor the Polish tasks** (they're NOT in stock lm-eval — they're the speakleash Open PL LLM Leaderboard set). Clone that task source and copy its task YAMLs into `bench/runner/tasks/`, noting the commit in `bench/runner/tasks/PINNED_COMMIT`. lm-eval picks them up via `--include_path bench/runner/tasks`.
3. Backfill the real task names + metric keys into `bench/runner/suite_open_pl_v1.yaml` (the shipped one is provisional). The first dry-run (below) shows you the exact `results` keys.

## Run an eval (8 GB-friendly)
```bash
# tiny model, hf backend, a few items per task
.venv/bin/python -m bench.runner.run_one \
  --model Qwen/Qwen2.5-0.5B-Instruct \
  --suite open-pl-v1 --backend hf --limit 8 --local
```
This runs lm-eval → maps to `run/v1` → publishes with `--local` to `public/results/runs/`.

(vLLM instead of hf: `--backend vllm` — on 8 GB add `gpu_memory_utilization: 0.7`, `max_model_len: 2048` in the suite YAML's `vllm:` block; the `hf` backend avoids vLLM's KV pre-allocation and is simpler at this size.)

## See it
```bash
npm install        # first time
npm run dev        # http://localhost:3000/runner  (reads public/results/ via fs fallback)
```
Your run appears on the board and its `/runner/<id>` report.

## Exercise the queue end-to-end (still local, fs)
```bash
# 1. submit (or POST /api/runner/submit) writes runner/queue/<id> under public/results/
node scripts/queue-list.mjs queue
node scripts/queue-approve.mjs <id>      # queue -> approved
.venv/bin/python -m bench.runner.worker  # claims approved -> runs run_one -> resolves done
```

## Notes
- No `BLOB_READ_WRITE_TOKEN` / `NEXT_PUBLIC_BLOB_BASE` needed locally — the store falls back to `public/results/` for both reads and writes.
- The transform's test fixture is synthetic; your first real run is the moment to confirm the lm-eval metric-key forms match (`acc,none`, `exact_match,flexible-extract,none`, the `mmlu` group key) and fix `lm_eval_to_run.py` if upstream differs.
- Don't commit local run files you don't want on the real board; `public/results/runs/*.json` is git-tracked.
