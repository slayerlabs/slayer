# Benchmark Runner — Phase 3 Implementation Plan (GPU runner) — DRAFT FOR REVIEW (rev 2)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.
>
> ⚠️ **DO NOT IMPLEMENT YET.** Awaiting human review of §Decisions. Several are gated on GPU provisioning (@Michał Warda).

**Goal:** A worker that turns an approved model submission into a published `run/v1` — pull from the Blob queue, run the **Open PL LLM Leaderboard** suite (+ EN regression guards) on GPU, map results to `run/v1`, publish via the existing Node CLI, resolve the queue item.

**Architecture:** Python eval (the speakleash Open PL LLM Leaderboard task set, run through lm-evaluation-harness on vLLM) for the GPU work; the existing Node CLIs for all Blob I/O. A single-instance orchestrator ties them: `claim → eval → map → publish → resolve`. Reuses Phase 2's `run/v1` schema, validators, and `publish-run.mjs`.

**Tech Stack:** Python 3.11 (`uv`), `lm-eval` + the **vendored Open PL LLM Leaderboard task YAMLs**, `vllm`; the repo's `bench/` conventions; `pytest`; Node CLIs from Phase 2 for Blob.

---

## Decisions (RECOMMENDATION picked — please confirm/redirect each)

- **D1 — Harness = lm-evaluation-harness + the speakleash Open PL LLM Leaderboard task set (vendored).** *Why:* `image.png` is literally "Open PL benchmark" — those numbers came from this suite, not stock lm-eval. The PL tasks (`polemo2_in/out`, `cbd`, `psc`, `dyk`, `ppc`, `8tags`, `klej_ner`, `belebele`, `polqa`, `poquad`) are **not** in upstream lm-eval; they live in the Open PL LLM Leaderboard's task definitions. **Action:** vendor those task YAMLs into `bench/runner/tasks/` pinned to a specific upstream commit, and run lm-eval with `--include_path bench/runner/tasks`. **Alternative:** depend on the speakleash fork directly (drift risk). *Recommend vendor+pin.* ⚑ **needs your nod** that the Open PL LLM Leaderboard is the canonical suite (it matches the demo).
- **D2 — Inference backend: vLLM, bf16.** lm-eval `--model vllm --model_args pretrained=...`. *Recommend bf16 for the default tier; FP8/AWQ deferred (quantization changes numbers → would need a separate suite version).* See D6 for the realistic size cap.
- **D3 — Execution host: the H100 box (`lem`), runner as a single polling worker.** **Needs @Michał Warda:** confirm box, a persistent HF cache disk with a quota/GC, and how the worker gets `BLOB_READ_WRITE_TOKEN` + `NEXT_PUBLIC_BLOB_BASE` (these must be in the worker's subprocess env). *Recommend lem.* ⚑
- **D4 — Trigger: cron, but single-instance via `flock`.** A full suite run far exceeds any sane poll interval, so overlapping ticks WILL double-claim without a lock. Cron entry: `flock -n /tmp/bench-runner.lock python -m bench.runner.worker || true`, every 10 min. *Recommend flock + 10-min cron.*
- **D5 — Blob I/O from Python: shell out to Node CLIs**, with explicit env + exit-code handling. Add `scripts/queue-list.mjs`, `scripts/queue-claim.mjs`, `scripts/queue-resolve.mjs`; reuse `publish-run.mjs`. Python passes `env={**os.environ, ...}`, uses `check=True`, and maps exit codes (token-missing/usage → abort tick WITHOUT consuming the item; validation-fail → mark `failed`). *Recommend Node CLIs.*
- **D6 — GPU gated by approval + a REALISTIC size cap.** Submissions land `status:"queued"`; only `status:"approved"` items are claimed. **Approval moves the item to an immutable `runner/approved/<id>.json` key the public submit route cannot write** (closes the post-approval TOCTOU). Size cap: **≤14B bf16 is headroom-safe on one 80GB H100; up to ~27B only with tuned `gpu_memory_utilization`+`max_model_len` (set in the suite config)**. The cap from the model card is advisory (a card can lie) — the real guard is catching vLLM OOM at load and marking the item `failed`, never hanging the cron. *Recommend ≤14B default tier, OOM-as-failed.* ⚑ **needs your nod** on the cap.
- **D7 — Decon is training-time provenance, NOT an eval-worker step.** Decon is a property of the run that produced an adapter (the training pipeline already checks training-data vs eval via `bench/decon_audit.py`); re-running it at eval time proves nothing and the worker doesn't have the mix. So: the runner does **no** decon. For our candidates, an optional `decon_ref` (hash/verdict from the training run) may be passed in as provenance; external models carry nothing. *Recommend dropping decon from the runner.* (Resolves the prior "decon gate is theater" finding.)
- **D8 — Suite = Open PL LLM Leaderboard tasks, with an explicit per-task protocol map.** Protocol coverage is **asymmetric**: classification tasks have a multiple-choice (loglikelihood `acc`) variant AND a generative (`_regex`, `exact_match`) variant; some tasks have only one. The suite config enumerates, per task, which of `gen`/`mcq` exist; a missing protocol is `null` (NOT `broken`) and is excluded from that protocol's aggregate. EN guards (`mmlu` group→`acc`, `arc_challenge`→`acc`, `gsm8k`→`exact_match`, `belebele` eng→`acc`) carry a **per-task metric** (not assumed `acc`). *Recommend per-task protocol+metric map.* ⚑ **needs your nod** on which exact tasks are in v1 (draft list in Task 1).

**Comparability note (was M6):** the published demo runs (`qwen3.5-9b`, `bielik-11b-v3`) were placeholders. Real runs must NOT silently overwrite the base anchor in place, because every board row's Δ/guard is read against `qwen3.5-9b`. **Recommend:** the first real run is an explicit, version-gated re-baseline — publish the real Qwen base, then real candidates, as a deliberate cutover; if the real per-task protocol set differs from the demo, bump the suite to `open-pl-v1.1` and don't cross-compare. Flagged for your call.

---

## Global Constraints

- `run/v1` is the contract (Phase 2 `lib/run-schema.js`); runner output MUST pass `validateRun`. Do not change field names; do not add undocumented fields. A missing protocol on a task is `gen:null`/`mcq:null` with `status:"ok"` (already valid — the demo's `polqa` has `gen:null`). `decon_ref`, if used, must be added to the design-spec schema as an explicit optional field first (no smuggling).
- All Blob writes go through the Node CLIs (carry `allowOverwrite`+`cacheControlMaxAge:60`). The runner never calls the Blob SDK directly.
- **Single-worker invariant:** exactly one worker runs at a time (flock). The worker re-reads an item and aborts the claim if `status != approved` (defense beyond the lock).
- Python tests: `pytest`. Pure transforms are unit-tested **against a REAL captured lm-eval JSON** (Task 0), not a hand-guessed shape. GPU execution is integration-only.
- One harness, one sampling, pinned per suite version (comparability rule from the design spec).
- Provenance mandatory on every `run/v1`: `artifact.host`, `date`, `suite`.

---

## File Structure

- `bench/runner/tasks/` (vendor) — pinned Open PL LLM Leaderboard task YAMLs (+ a `PINNED_COMMIT` note). Used via `--include_path`.
- `bench/runner/suite_open_pl_v1.yaml` (create) — per task: `{id, gen: {task, metric}|null, mcq: {task, metric}|null}`; guards: `{id, task, metric}`; `n_shot`, vLLM `gpu_memory_utilization`/`max_model_len`, param cap.
- `bench/runner/suite_cfg.py` (create) — `load_suite_cfg`, `validate_suite_cfg`.
- `bench/runner/lm_eval_to_run.py` (create) — **pure** `to_run_v1(lm_results, suite_cfg, meta) -> run_v1`. Handles 4 states per task: ok+both, ok+gen-only, ok+mcq-only, broken (task present-but-errored/zero). Missing protocol → null, excluded from that protocol's aggregate, task stays `ok`.
- `bench/runner/run_one.py` (create) — orchestrator for ONE model: resolve → `_invoke_lm_eval` (vLLM) → `to_run_v1` → write `run.json` → `node scripts/publish-run.mjs`. Catches OOM → returns failure.
- `bench/runner/worker.py` (create) — single-pass tick: `queue-list --status approved` → size-cap precheck → `queue-claim` (re-read guard) → `run_one` → `queue-resolve done|failed`; disk precheck + HF-cache GC.
- `scripts/queue-list.mjs`, `scripts/queue-claim.mjs`, `scripts/queue-resolve.mjs` (create) — Node CLIs (token-guarded). `queue-claim` moves `runner/queue/<id>` → `runner/approved/`→`running` per D6.
- Modify: `app/api/runner/submit/route.js` — validate `base ∈ listRunIds()` and `suite` ∈ allowed set; reject otherwise (B4).
- Modify: `lib/store.js` — queue/approved helpers (`listQueue(status)`, `getSubmission`, `setSubmissionStatus`, `archiveSubmission`).
- Modify: design-spec `BENCHMARK_RUNNER_DESIGN.md` — add optional `decon_ref` to run/v1 schema IF D7's provenance ref is kept.
- Tests: `tests/runner/test_suite_cfg.py`, `tests/runner/test_lm_eval_to_run.py`, `tests/runner/test_worker.py`; extend `test/store.test.mjs`.

---

## Task 0: Capture a REAL lm-eval result fixture (prerequisite for Task 2)

**Files:** Create `tests/runner/fixtures/lm_eval_sample.json` (committed), `bench/runner/tasks/` (vendored YAMLs + PINNED_COMMIT).

Gated on D1/D3. This MUST happen before Task 2 so the transform is tested against reality, not a guess.

- [ ] **Step 1:** On `lem` (or any GPU), install `lm-eval`+`vllm`; vendor the Open PL LLM Leaderboard task YAMLs into `bench/runner/tasks/`, record the upstream commit.
- [ ] **Step 2:** Dry-run a tiny slice: one MC task, one `_regex` task, one EN guard, `--limit 4 --num_fewshot 5 --model vllm --model_args pretrained=Qwen/Qwen2.5-7B --output_path out/`. Capture the real `results` JSON; trim to a representative fixture (include the `metric,filter,none` key forms, and an `mmlu` group-aggregate entry). Commit it.
- [ ] **Step 3:** Record, in `suite_open_pl_v1.yaml` comments, the exact task names + metric keys observed for each D8 task and its protocol coverage. Commit.

---

## Task 1: Suite config + loader/validator

**Files:** Create `bench/runner/suite_open_pl_v1.yaml`, `bench/runner/suite_cfg.py`; Test `tests/runner/test_suite_cfg.py`.

**Interfaces:** `load_suite_cfg(path)->dict`; `validate_suite_cfg(cfg)->(ok, errors)`.

YAML shape (filled from Task 0's observations):
```yaml
id: open-pl-v1
n_shot: 5
vllm: { gpu_memory_utilization: 0.9, max_model_len: 4096 }
param_cap_b: 14
tasks:
  - { id: polemo2_in, gen: {task: polemo2_in_regex, metric: exact_match}, mcq: {task: polemo2_in, metric: acc} }
  - { id: klej_ner,   gen: {task: klej_ner_regex,  metric: exact_match}, mcq: null }
  # ... (exact names from Task 0)
guards:
  - { id: mmlu, task: mmlu, metric: acc }
  - { id: gsm8k, task: gsm8k, metric: exact_match }
```

- [ ] Steps: write failing test (valid loads; missing `id`/`tasks` fails; each task has ≥1 of gen/mcq; guard has a `metric`) → run FAIL → implement loader+validator+YAML → run PASS → commit.

---

## Task 2: lm-eval → run/v1 pure transform

**Files:** Create `bench/runner/lm_eval_to_run.py`; Test `tests/runner/test_lm_eval_to_run.py` (uses **Task 0's real fixture**).

**Interfaces:** `to_run_v1(lm_results, suite_cfg, meta) -> dict`, output passes `validateRun`.

Test matrix (the 4 states, from M-findings):
- ok+both → gen and mcq populated.
- ok+gen-only (mcq cfg null) → `mcq:null`, task `status:"ok"`, excluded from mcq aggregate.
- ok+mcq-only → symmetric.
- broken (cfg present but lm-eval entry missing/errored) → `0.0` + `status:"broken"`, excluded from BOTH aggregates; counted out of `working_tasks`.
- aggregate gen = mean of gen over tasks where gen != null AND status==ok (1dp); same mcq; `working_tasks` = tasks with status==ok.
- guards built per-task with their own metric; `mmlu` read from the group-aggregate key.

- [ ] Steps: write failing test against the real fixture asserting full run/v1 incl. the 4 states + a re-implementation of validateRun essentials → FAIL → implement → PASS → commit.

---

## Task 3: Queue/approved CLIs + store helpers

**Files:** Create `scripts/queue-list.mjs`, `scripts/queue-claim.mjs`, `scripts/queue-resolve.mjs`; Modify `lib/store.js`; Test extend `test/store.test.mjs`.

**Interfaces:**
- `lib/store.js`: `listQueue(status?)`, `getSubmission(id)`, `setSubmissionStatus(id,status)`, `archiveSubmission(id)` (→ `runner/done/`). fs + blob branches, mirroring Phase 2 patterns.
- `queue-claim.mjs <id>`: re-read; if `status==="approved"`, set `running` and return ok; else exit nonzero (lost the race / not approved).
- `queue-resolve.mjs <id> done|failed`: `done` → archive to `runner/done/`; `failed` → set `failed`.

- [ ] Steps: extend store test (fs fallback: list-by-status, claim-guard rejects non-approved, archive) → FAIL → implement helpers + CLIs → PASS → commit.

---

## Task 4: Submit-route hardening (B4)

**Files:** Modify `app/api/runner/submit/route.js`; Test create `test/submit-route-validation.test.mjs` (extends the Phase-2 route test).

- Validate `base`: must be in `await listRunIds()`. Validate `suite`: must be in an allowed set (`["open-pl-v1"]`). Reject with 400 otherwise. Keep `status` server-set (callers still can't set it).

- [ ] Steps: write failing test (bogus `base`/`suite` → 400; valid → 201) → FAIL → implement → PASS → build → commit.

---

## Task 5: Orchestrator `run_one.py`

**Files:** Create `bench/runner/run_one.py`; Test `tests/runner/test_run_one.py` (monkeypatch `_invoke_lm_eval` + the publish subprocess).

- `run_one(model, suite_id, meta_overrides) -> run_v1`; CLI. `_invoke_lm_eval` shells `lm_eval --model vllm --include_path bench/runner/tasks ...`, parses `--output_path` JSON. Catches a vLLM OOM/load error → raises `RunnerOOM` (worker maps to `failed`). Publishes via `subprocess.run(["node","scripts/publish-run.mjs",f], check=True, env={**os.environ,...})`; non-zero publish → raise (don't claim success).

- [ ] Steps: failing test (fixture eval → valid run/v1, publish called once with env, OOM path raises) → FAIL → implement → PASS → commit.

---

## Task 6: Worker loop + cron (flock, disk, OOM)

**Files:** Create `bench/runner/worker.py`; Test `tests/runner/test_worker.py`; doc the cron + runbook.

- `tick()`: `node queue-list --status approved --json` → for the first item: param-cap precheck (from model card; advisory) + disk precheck → `node queue-claim <id>` (abort tick if it exits nonzero — lost race) → `run_one` → on success `queue-resolve done`, on `RunnerOOM`/error `queue-resolve failed`. HF-cache GC if disk low.
- Cron: `flock -n /tmp/bench-runner.lock python -m bench.runner.worker || true` every 10 min.

- [ ] Steps: failing test (mock CLIs: one approved item; claim succeeds → run_one called → resolve done; a second tick where claim exits nonzero → run_one NOT called) → FAIL → implement → PASS → commit. Then document cron+runbook (no secrets).

---

## Task 7: GPU integration + first real re-baseline (NOT unit-testable — on `lem`)

Gated on D1/D3/D6/D8 + GPU. Setup, not TDD:
- [ ] Full run on base `Qwen3.5-9B` → publish as the real base anchor (explicit, version-gated re-baseline per the comparability note) → confirm `/runner` shows real numbers, `demo` false.
- [ ] Full run on `Bielik-11B-v3` → confirm real EN-guard behavior.
- [ ] Enable cron + the approval CLI; submit→approve→run one external model end-to-end.

---

## Out of scope (Phase 4)
Tier-A private/targeted diagnostics + verdict/"keeper" narrative; FP8/quantized + >27B tiers (separate suite version); auto-approval.

---

## Self-Review
- **Review fixes applied:** D1 now vendors the Open PL Leaderboard tasks (B1); per-task protocol map + null≠broken (B2); flock single-worker + re-read claim (B3); submit-route base/suite validation + immutable `runner/approved/` (B4); `decon` dropped from the runner, optional documented `decon_ref` only (M1/M2); realistic ≤14B cap + vLLM params + OOM-as-failed (M3); subprocess env+exit-code mapping (M4); real captured fixture in Task 0 before the transform, mmlu group key (M5); explicit version-gated re-baseline instead of in-place demo overwrite (M6); guard per-task metric incl. gsm8k exact_match (m5); archive-to-`runner/done/` resolved (m4); disk precheck+GC (m2); OOM-as-failed advisory cap (m3).
- **Open items for the human (⚑):** D1 (Open PL Leaderboard is the canonical suite), D3 (GPU/host via Michał), D6 (size cap value), D8 (exact v1 task list), and the re-baseline cutover call.
- **Testability:** Tasks 1–6 unit-tested (transform against a REAL fixture); Task 7 integration-only.
