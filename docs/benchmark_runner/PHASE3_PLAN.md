# Benchmark Runner — Phase 3 Implementation Plan (GPU runner) — DRAFT FOR REVIEW

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.
>
> ⚠️ **DO NOT IMPLEMENT YET.** This plan is awaiting human review of the flagged decisions (§Decisions). Several are gated on GPU provisioning (@Michał Warda) and a harness choice.

**Goal:** A worker that turns a queued model submission into a published `run/v1` — pull from the Blob queue, run the Open PL Suite (+ EN guards) on GPU, map results to `run/v1`, publish via the existing CLI, mark the queue item done.

**Architecture:** Python eval (lm-eval-harness on vLLM) for the GPU work; the existing Node CLIs for all Blob I/O (so the runner never reimplements Blob). A thin orchestrator ties them: `claim → eval → map → publish → resolve`. Reuses Phase 2's `run/v1` schema, validators, and `publish-run.mjs`.

**Tech Stack:** Python 3.11 (`uv`, matches the repo), `lm-eval` (EleutherAI lm-evaluation-harness), `vllm`, the repo's existing `bench/` Python conventions; Node CLIs from Phase 2 for Blob.

---

## Decisions (RECOMMENDATION picked — please confirm/redirect each)

These shape the whole plan. I've chosen a recommendation for each; flagging for your review.

- **D1 — Harness: lm-evaluation-harness (EleutherAI).** *Why:* the `image.png` report (5-shot, generative `exact_match` + MCQ `acc` per KLEJ task) is exactly lm-eval's shape; it has the Polish tasks (polemo2, cbd, klej_ner, belebele, polqa, poquad…) and both protocols built-in. The in-house ollama `bench/` scripts give one generative number on a *different* battery and can't produce the two-protocol comparable suite. **Alternative:** extend the ollama scripts (more bespoke code, no MCQ/loglikelihood). *Recommend lm-eval.*
- **D2 — Inference backend: vLLM.** *Why:* serves arbitrary HF base models (Bielik, Qwen variants, submissions) fast with batching; lm-eval has a first-class `vllm` model type. **Alternative:** HF `transformers` (slower) or ollama (GGUF Q4 only — quantization confounds comparability). *Recommend vLLM, full precision (bf16).*
- **D3 — Execution host: the existing H100 box (`lem`), runner as a polling worker.** *Why:* `image.png` provenance already says `lem (H100)`; reuse it. **Needs @Michał Warda** to confirm the box, persistent disk for HF cache, and how the worker gets `BLOB_READ_WRITE_TOKEN` + `NEXT_PUBLIC_BLOB_BASE`. *Recommend lem; flag for Michał.*
- **D4 — Trigger: cron polling of the queue (every ~5 min).** *Why:* simplest; submit endpoint already just writes to `runner/queue/`. **Alternative:** webhook from the API (new infra). *Recommend cron poll.*
- **D5 — Blob I/O from the Python runner: shell out to Node CLIs.** Add `scripts/queue-list.mjs` + `scripts/queue-resolve.mjs`; reuse `publish-run.mjs`. *Why:* one Blob implementation (JS), Python stays Blob-agnostic. **Alternative:** Vercel Blob REST API from Python (second impl to maintain). *Recommend Node CLIs.*
- **D6 — GPU is gated by approval, not open submission.** A submission lands `status:"queued"`; the runner only claims items marked `status:"approved"`. Approval = an allowlist or a one-liner admin CLI. Plus a **param-size cap** (e.g. ≤ 32B at bf16 on one H100) checked before claim. *Why:* open submissions = anyone burns scarce GPU. **Alternative:** auto-run everything (simpler, abusable). *Recommend approval gate + size cap.*
- **D7 — Decon gate applies only to *our* candidates.** Runs with a known training set (our adapters) go through `bench/decon_audit.py` before publish; external base models / submissions get `decon: "n/a (external)"` in `run/v1`. *Why:* we can't inspect an external model's training data. *Recommend conditional decon.*
- **D8 — Open PL Suite v1 membership (content decision).** v1 = the 9 working KLEJ tasks from `image.png` (psc, belebele, dyk, polemo2_in, polemo2_out, cbd, 8tags, ppc, klej_ner) with both protocols where lm-eval provides them, + the polqa reranking-MC, + EN guards (mmlu, arc, gsm8k, belebele_en). **The broken `polqa_closed_book` / `polqa_open_book` / `poquad_open_book` (0.0 ⚠ in the image) are EXCLUDED from v1** until their lm-eval task wiring is fixed (revisit in v2). *Recommend this set; flag the exclusion.*

---

## Global Constraints

- `run/v1` is the contract (Phase 2 `lib/run-schema.js`); the runner MUST produce output that passes `validateRun`. Do not change field names.
- All Blob writes go through `scripts/publish-run.mjs` (carries `allowOverwrite`+`cacheControlMaxAge:60`). The runner never calls the Blob SDK directly.
- Python tests: `pytest` (repo already uses it — `.pytest_cache` present). Pure-transform logic is unit-tested; GPU/harness execution is NOT unit-tested (integration smoke only, on the GPU host).
- No two-model assumptions: the runner evaluates ONE model per invocation and writes one `run/v1`; comparison/Δ stays in the front (Phase 1/2).
- Provenance is mandatory: every produced `run/v1` sets `artifact.host`, `date`, `suite`, and (for our candidates) `artifact.adapter`.
- One harness, one sampling, pinned per suite version — comparability rule from the design spec.

---

## File Structure

- `bench/runner/suite_open_pl_v1.yaml` (create) — suite→lm-eval mapping: per task, the lm-eval task name(s) + metric for `gen` and `mcq`, the EN guard tasks, n-shot, sampling. The single source the adapter reads.
- `bench/runner/lm_eval_to_run.py` (create) — **pure** transform: `(lm_eval_results: dict, suite_cfg: dict, meta: dict) -> run_v1: dict`. Computes per-task gen/mcq, marks broken (missing/zero+error), aggregates over working tasks, builds guards. The testable heart.
- `bench/runner/run_one.py` (create) — orchestrator for ONE model: resolve model → invoke lm-eval (vLLM) for suite + guards → `lm_eval_to_run` → write `run.json` → call `node scripts/publish-run.mjs`. CLI: `python -m bench.runner.run_one --model <hf|adapter> --suite open-pl-v1 [--ours --train <mix>]`.
- `bench/runner/worker.py` (create) — poll loop: `node scripts/queue-list.mjs --status approved` → size-cap check → `run_one` → `node scripts/queue-resolve.mjs <id> done|failed`. Cron entrypoint.
- `bench/runner/decon_gate.py` (create) — thin wrapper calling `bench/decon_audit.py` for `--ours` runs; returns pass/fail + summary embedded in `run/v1`.
- `scripts/queue-list.mjs`, `scripts/queue-resolve.mjs` (create) — Node CLIs: list queue items (optionally by status), and set an item's status / delete it.
- `tests/runner/test_lm_eval_to_run.py`, `tests/runner/test_suite_cfg.py` (create) — pytest for the pure transform + suite config validity.

---

## Task 1: Suite→lm-eval mapping config + loader

**Files:**
- Create: `bench/runner/suite_open_pl_v1.yaml`, `bench/runner/suite_cfg.py` (loader + `validate_suite_cfg`)
- Test: `tests/runner/test_suite_cfg.py`

**Interfaces:**
- Produces: `load_suite_cfg(path) -> dict`; `validate_suite_cfg(cfg) -> (ok, errors)`.
- The YAML shape (the contract the adapter relies on):
```yaml
id: open-pl-v1
n_shot: 5
sampling: { temperature: 0.0 }
tasks:                       # board tasks (PL suite)
  - { id: psc,        gen: polish_psc_gen,    mcq: polish_psc_mc }
  - { id: belebele,   gen: belebele_pol_gen,  mcq: belebele_pol_mc }
  # ... (exact lm-eval task names TBD by D1 confirmation + a dry-run)
guards:                      # EN regression guards
  - { id: mmlu, task: mmlu,  metric: acc }
  - { id: arc,  task: arc_challenge, metric: acc }
```

- [ ] **Step 1:** Write `tests/runner/test_suite_cfg.py` asserting: a valid cfg loads; a cfg missing `id`/`tasks` fails `validate_suite_cfg`; every task has at least one of `gen`/`mcq`.
- [ ] **Step 2:** Run `pytest tests/runner/test_suite_cfg.py` → FAIL (module missing).
- [ ] **Step 3:** Write `suite_cfg.py` (`yaml.safe_load` + the validator) and a first-cut `suite_open_pl_v1.yaml`. *Note: the exact lm-eval task names are filled after the D1 dry-run (Task 6); use placeholders that the validator accepts structurally.*
- [ ] **Step 4:** Run pytest → PASS.
- [ ] **Step 5:** Commit.

---

## Task 2: lm-eval → run/v1 pure transform (the heart)

**Files:**
- Create: `bench/runner/lm_eval_to_run.py`
- Test: `tests/runner/test_lm_eval_to_run.py`

**Interfaces:**
- Consumes: suite cfg (Task 1).
- Produces: `to_run_v1(lm_results, suite_cfg, meta) -> dict` where `meta = {id, model_name, params, org, kind, base, host, adapter, demo, decon}`. Output passes Phase 2 `validateRun` (mirror the rules in pytest).

Behavior to test (with a hand-built `lm_results` fixture mimicking lm-eval's `{"results": {"task": {"metric,none": 0.0}}}`):
- Maps each suite task's `gen`/`mcq` lm-eval task+metric → `tasks[].gen` / `.mcq` (×100, 1dp).
- A task whose lm-eval entry is missing → `status:"broken"`, value `0.0`, excluded from aggregate.
- `aggregate.gen` = mean of non-null `gen` over `status=="ok"` tasks (1dp); same for mcq; `working_tasks` = count.
- `guards[]` built from the guard tasks.
- `meta` populates provenance + `decon`.

- [ ] **Step 1:** Write `tests/runner/test_lm_eval_to_run.py` with a fixture lm_results (3 ok tasks, 1 missing→broken, 2 guards) and assert the full run/v1 (per-task values, broken handling, aggregate over working only, guards, provenance). Include an assertion that re-implements the `validateRun` essentials (schema/id/tasks/aggregate) so the output is contract-valid.
- [ ] **Step 2:** Run pytest → FAIL.
- [ ] **Step 3:** Implement `to_run_v1`.
- [ ] **Step 4:** Run pytest → PASS.
- [ ] **Step 5:** Commit.

---

## Task 3: Queue CLIs (Node, Blob I/O)

**Files:**
- Create: `scripts/queue-list.mjs`, `scripts/queue-resolve.mjs`
- Modify: `lib/store.js` (add `listQueue(status?)`, `getSubmission(id)`, `setSubmissionStatus(id, status)`, `deleteSubmission(id)`)
- Test: extend `test/store.test.mjs` (fs-fallback for the queue helpers)

**Interfaces:**
- `node scripts/queue-list.mjs [--status approved] [--json]` → prints submission ids (or JSON).
- `node scripts/queue-resolve.mjs <id> <done|failed|approved|running>` → updates status (or deletes on `done`, per D5/D6 — decide: keep a `runner/done/` archive vs delete; *recommend archive to `runner/done/` for audit*).

- [ ] **Step 1:** Extend `test/store.test.mjs` for the fs-fallback queue helpers (list by status, get, set status, archive). FAIL.
- [ ] **Step 2:** Implement the `lib/store.js` helpers (fs branch + blob branch, mirroring Phase 2 patterns: deterministic reads, `putJson` writes).
- [ ] **Step 3:** Implement the two CLIs (thin wrappers, token-guarded like `publish-run.mjs`).
- [ ] **Step 4:** Run `node --test test/store.test.mjs` → PASS; smoke the CLIs in dev (no token → graceful message).
- [ ] **Step 5:** Commit.

---

## Task 4: Orchestrator `run_one.py` (single model → published run)

**Files:**
- Create: `bench/runner/run_one.py`
- Test: `tests/runner/test_run_one.py` (mock the lm-eval call + the node publish subprocess; assert the wiring + that `--ours` triggers decon)

**Interfaces:**
- Consumes: `suite_cfg`, `to_run_v1`, `decon_gate`.
- `run_one(model, suite_id, ours=False, train=None, host=None) -> run_v1` and a CLI. lm-eval invocation is a function (`_invoke_lm_eval`) that's monkeypatched in tests; only the orchestration is unit-tested. GPU execution is integration (Task 6).

- [ ] **Step 1:** Write `tests/runner/test_run_one.py`: monkeypatch `_invoke_lm_eval` to return a fixture, monkeypatch the publish subprocess; assert it builds valid run/v1, calls publish once, and (with `ours=True`) calls the decon gate and embeds its result. FAIL.
- [ ] **Step 2:** Implement `run_one.py` (orchestration only; `_invoke_lm_eval` shells `lm_eval --model vllm ...`).
- [ ] **Step 3:** pytest → PASS.
- [ ] **Step 4:** Commit.

---

## Task 5: Decon gate wrapper + worker loop

**Files:**
- Create: `bench/runner/decon_gate.py`, `bench/runner/worker.py`
- Test: `tests/runner/test_worker.py` (mock subprocess calls to the queue CLIs + `run_one`)

**Interfaces:**
- `decon_gate.run(train_mix) -> {passed: bool, summary: dict}` (wraps `bench/decon_audit.py`).
- `worker.tick()` → list approved, size-cap filter, claim (`running`), `run_one`, resolve (`done`/`failed`). One pass; cron calls it.

- [ ] **Step 1:** Write `tests/runner/test_worker.py`: mock `queue-list` to return one approved id over the size cap (skipped) and one under (processed); assert `run_one` called once and `queue-resolve … done` called. FAIL.
- [ ] **Step 2:** Implement `decon_gate.py` + `worker.py`.
- [ ] **Step 3:** pytest → PASS.
- [ ] **Step 4:** Commit.

---

## Task 6: GPU integration + suite finalization (NOT unit-testable — on `lem`)

**Files:**
- Modify: `bench/runner/suite_open_pl_v1.yaml` (fill exact lm-eval task names), `docs/benchmark_runner/BENCHMARK_RUNNER.md` (runner section), `pipeline/` cron entry, `.env.example` (HF cache, runner vars)

Gated on D1/D3 confirmation + GPU access. Steps are setup, not TDD:

- [ ] **Step 1:** On `lem`: `uv` env with `lm-eval`, `vllm`; verify a 1-task dry run (`lm_eval --model vllm --model_args pretrained=Qwen/... --tasks polemo2_in --num_fewshot 5 --limit 4`).
- [ ] **Step 2:** Resolve the real lm-eval task names for every D8 suite task + guards; fill `suite_open_pl_v1.yaml`; re-run `validate_suite_cfg`.
- [ ] **Step 3:** Full run on base `Qwen3.5-9B` → publish → confirm it replaces the placeholder demo run on `/runner` (real numbers, `demo` false). Repeat for Bielik (replaces its placeholder; confirm the EN guard reflects reality).
- [ ] **Step 4:** Wire the cron (`worker.tick` every 5 min) + the approval CLI; document the operator runbook.
- [ ] **Step 5:** Commit config + docs (no secrets).

---

## Out of scope (Phase 4)
Tier-A private/targeted diagnostics + the verdict/"keeper" narrative; private results store; multi-GPU / >32B models; auto-approval policy.

---

## Self-Review
- **Coverage:** queue→eval→publish→resolve (Tasks 3–5), run/v1 production (Task 2), suite contract (Task 1), GPU bring-up + suite finalization (Task 6), decon for our candidates (D7/Task 5), approval+size gate (D6/Task 5). Phase-4 deferred.
- **Testability:** the pure transform + orchestration wiring + queue helpers are unit-tested; GPU execution is integration-only (honest — can't TDD a GPU eval in CI).
- **Open decisions:** all 8 flagged in §Decisions with a recommendation; D1/D3/D8 are the load-bearing ones (harness, host, suite membership) and block Task 6.
- **Placeholders:** the only deliberate one is the exact lm-eval task names in `suite_open_pl_v1.yaml`, resolved in Task 6 Step 2 after a dry run — flagged, not hidden.
