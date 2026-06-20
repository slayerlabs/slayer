# Benchmark Runner — Phase 3 Implementation Plan (GPU runner) — DRAFT FOR REVIEW (rev 3)

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
- **D5 — Blob I/O from Python: shell out to Node CLIs**, with explicit env + exit-code handling. Add `scripts/queue-list.mjs`, `scripts/queue-approve.mjs`, `scripts/queue-claim.mjs`, `scripts/queue-resolve.mjs`; reuse `publish-run.mjs`. Python passes `env={**os.environ, ...}`, uses `check=True`, and maps exit codes (token-missing/usage → abort tick WITHOUT consuming the item; validation-fail → mark `failed`). *Recommend Node CLIs.*
- **D6 — GPU gated by approval + a REALISTIC size cap.** **State is the PREFIX an item lives in** (see §Lifecycle), not a mutable status field — this is what actually closes the TOCTOU: the public submit route can only ever write `runner/queue/`, so an approved item (in `runner/approved/`) is unreachable by public traffic even on a deterministic-id re-submit. Only items in `runner/approved/` are claimed. Size cap: **≤14B bf16 is headroom-safe on one 80GB H100; up to ~27B only with tuned `gpu_memory_utilization`+`max_model_len` (in the suite config)**. The model-card param count is advisory (a card can lie) — the real guard is catching vLLM OOM at load and resolving the item `failed`, never hanging the cron. *Recommend ≤14B default tier, OOM-as-failed.* ⚑ **needs your nod** on the cap.
- **D7 — Decon is training-time provenance, NOT an eval-worker step.** Decon is a property of the run that produced an adapter (the training pipeline already checks training-data vs eval via `bench/decon_audit.py`); re-running it at eval time proves nothing and the worker doesn't have the mix. So: the runner does **no** decon. For our candidates, an optional `decon_ref` (hash/verdict from the training run) may be passed in as provenance; external models carry nothing. *Recommend dropping decon from the runner.* (Resolves the prior "decon gate is theater" finding.)
- **D8 — Suite = Open PL LLM Leaderboard tasks, with an explicit per-task protocol map.** Protocol coverage is **asymmetric**: classification tasks have a multiple-choice (loglikelihood `acc`) variant AND a generative (`_regex`, `exact_match`) variant; some tasks have only one. The suite config enumerates, per task, which of `gen`/`mcq` exist; a missing protocol is `null` (NOT `broken`) and is excluded from that protocol's aggregate. EN guards (`mmlu` group→`acc`, `arc_challenge`→`acc`, `gsm8k`→`exact_match`, `belebele` eng→`acc`) carry a **per-task metric** (a cfg-side read key; the emitted run/v1 guard object stays a single `gen` number + `status`). Guards are **tripwires, not leaderboard numbers**: run them with `--limit` (e.g. 200) so a full 57-subtask MMLU doesn't dominate every eval's wall-clock; the run/v1 marks guards `limited:true`. *Recommend per-task protocol+metric map + limited-sample guards.* ⚑ **needs your nod** on which exact tasks are in v1 (draft list in Task 3) and the guard `--limit`.

**Comparability note (was M6):** the published demo runs (`qwen3.5-9b`, `bielik-11b-v3`) are placeholders. Because every board row's Δ/guard is read against the base anchor `qwen3.5-9b`, the real cutover must be **atomic and batched**, not an in-place overwrite that leaves a window of real-base-vs-demo-candidate. **Recommend:** one cutover step (Task 8) that deletes the demo runs and publishes the real base + real models together; if the real per-task protocol set differs from the demo, bump the suite to `open-pl-v1.1` and treat it as a fresh board. Flagged for your call.

---

## Lifecycle (submission state = prefix; closes the TOCTOU)

A submission's state IS the Blob prefix it lives under — there is no mutable `status` field to race on, and the public route can write only `runner/queue/`.

```
public POST ─► runner/queue/<id>      (submission/v1; only the submit route writes here)
  admin     ─► runner/approved/<id>   (queue-approve: copy + delete queue copy)
  worker    ─► runner/running/<id>    (queue-claim: copy from approved + delete approved)
  worker    ─► runner/done/<id>       (queue-resolve done: + publish run/v1 to runner/runs/)
            └► runner/failed/<id>     (queue-resolve failed: OOM / eval error)
```

- Every transition is a **move = put(dest) then del(src)** (put before del for crash-safety; a crash leaves a harmless duplicate, never a lost item).
- The worker claims **only** from `runner/approved/`; a deterministic-id re-submit lands a fresh `runner/queue/<id>` and never touches the approved/running copy (documented idempotency).
- `submission/v1` shape stays `{schema, id, hfModel, base, suite, requested_at}` — **no status field**. The lifecycle is documented in `BENCHMARK_RUNNER_DESIGN.md` (added in Task 1), with the legal prefix transitions.

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
- `lib/store.js` (modify) — add `delBlob(pathname)` (blob `del` + fs `unlink`); `listSubmissions(stage)`, `getSubmission(stage,id)`, `moveSubmission(fromStage,toStage,id)` (= put dest + `delBlob` src) over the prefixes `queue|approved|running|done|failed`.
- `scripts/queue-list.mjs <stage>`, `scripts/queue-approve.mjs <id>`, `scripts/queue-claim.mjs <id>`, `scripts/queue-resolve.mjs <id> done|failed` (create) — token-guarded CLIs over `moveSubmission`. `queue-claim` succeeds only if `approved/<id>` exists (moves it to `running/`).
- `app/api/runner/submit/route.js` (modify) — validate `base` against a **static allowlist** and `suite` against `["open-pl-v1"]`; reject 400 otherwise. (No live `listRunIds()` on the public path.)
- `BENCHMARK_RUNNER_DESIGN.md` (modify) — document the submission/v1 prefix lifecycle + legal transitions; add optional `decon_ref` to the run/v1 schema only if D7's ref is kept.
- `bench/runner/tasks/` (vendor) — pinned Open PL Leaderboard task YAMLs (+ `PINNED_COMMIT`), used via `--include_path`.
- `bench/runner/suite_open_pl_v1.yaml` (create) — per task `{id, gen:{task,metric}|null, mcq:{task,metric}|null}`; guards `{id, task, metric, limit}`; `n_shot`, vLLM `gpu_memory_utilization`/`max_model_len`, `param_cap_b`.
- `bench/runner/suite_cfg.py`, `lm_eval_to_run.py`, `run_one.py`, `worker.py` (create) — config loader, pure transform, orchestrator, worker.
- Tests: `test/store.test.mjs` (extend), `test/submit-route-validation.test.mjs`, `tests/runner/test_suite_cfg.py`, `tests/runner/test_lm_eval_to_run.py`, `tests/runner/test_run_one.py`, `tests/runner/test_worker.py`.

**Build order (B5 — GPU is the long pole only for Tasks 4–8):** Tasks 1–3 have **zero GPU/fixture dependency** and proceed immediately. Task 4 (real fixture + vendored tasks) needs GPU and gates Tasks 5–8.

---

## Task 1: Submission lifecycle — store helpers + queue CLIs (GPU-free)

**Files:** Modify `lib/store.js`; Create `scripts/queue-list.mjs`, `scripts/queue-approve.mjs`, `scripts/queue-claim.mjs`, `scripts/queue-resolve.mjs`; Modify `BENCHMARK_RUNNER_DESIGN.md` (lifecycle doc); Test extend `test/store.test.mjs`.

**Interfaces:**
- `delBlob(pathname)`; `listSubmissions(stage)`; `getSubmission(stage,id)`; `moveSubmission(from,to,id)` (put dest then delBlob src).
- `queue-approve.mjs <id>`: `moveSubmission("queue","approved",id)`.
- `queue-claim.mjs <id>`: if `getSubmission("approved",id)` exists → `moveSubmission("approved","running",id)`, exit 0; else exit 3 (not approved / lost race).
- `queue-resolve.mjs <id> done|failed`: `moveSubmission("running", that, id)`.

- [ ] Steps: extend `test/store.test.mjs` (fs fallback: a queued item; approve moves queue→approved + deletes queue copy; claim from approved succeeds and from a non-approved id exits nonzero; resolve moves running→done) → FAIL → implement `delBlob`/`listSubmissions`/`getSubmission`/`moveSubmission` (fs + blob branches) + the 4 CLIs + the lifecycle section in the design doc → `node --test test/store.test.mjs` PASS → commit.

---

## Task 2: Submit-route hardening (GPU-free)

**Files:** Modify `app/api/runner/submit/route.js`; Test `test/submit-route-validation.test.mjs`.

- Add `const ALLOWED_BASE = ["qwen3.5-9b"]; const ALLOWED_SUITE = ["open-pl-v1"];`. Reject 400 if `base`/`suite` (when provided) aren't in the allowlists. Keep everything else (cooldown, honeypot, byte-cap, dedup id, queue-only write).

- [ ] Steps: failing test (bogus `base` → 400; bogus `suite` → 400; valid → 201) → FAIL → implement → PASS → `next build` exit 0 → commit.

---

## Task 3: Suite config + loader/validator (GPU-free; provisional YAML)

**Files:** Create `bench/runner/suite_open_pl_v1.yaml` (provisional task names, backfilled in Task 4), `bench/runner/suite_cfg.py`; Test `tests/runner/test_suite_cfg.py`.

**Interfaces:** `load_suite_cfg(path)->dict`; `validate_suite_cfg(cfg)->(ok, errors)`.

YAML shape:
```yaml
id: open-pl-v1
n_shot: 5
vllm: { gpu_memory_utilization: 0.9, max_model_len: 4096 }
param_cap_b: 14
tasks:
  - { id: polemo2_in, gen: {task: polemo2_in_regex, metric: exact_match}, mcq: {task: polemo2_in, metric: acc} }
  - { id: klej_ner,   gen: {task: klej_ner_regex,  metric: exact_match}, mcq: null }
  # exact names backfilled from Task 4's dry-run
guards:
  - { id: mmlu,  task: mmlu,          metric: acc,         limit: 200 }
  - { id: gsm8k, task: gsm8k,         metric: exact_match, limit: 200 }
```

- [ ] Steps: failing test (valid loads; missing `id`/`tasks` fails; each task has ≥1 of gen/mcq; each guard has `task`+`metric`) → FAIL → implement loader+validator+provisional YAML → PASS → commit.

---

## Task 4: Capture a REAL lm-eval fixture + vendor tasks (GPU — long pole)

**Files:** Vendor `bench/runner/tasks/` (+ `PINNED_COMMIT`); Create `tests/runner/fixtures/lm_eval_sample.json`; backfill `suite_open_pl_v1.yaml`.

Gated on D1/D3 + GPU. Must precede Task 5.

- [ ] **Step 1:** Install `lm-eval`+`vllm`; vendor the Open PL Leaderboard task YAMLs, record the upstream commit.
- [ ] **Step 2:** Dry-run a slice (one MC task, one `_regex`, one EN guard) `--limit 4 --num_fewshot 5 --model vllm --model_args pretrained=Qwen/Qwen2.5-7B --include_path bench/runner/tasks --output_path out/`. Capture the real `results` JSON → trim to a fixture that includes the `metric,filter,none` key forms and an `mmlu` group-aggregate entry. Commit.
- [ ] **Step 3:** Backfill the exact task names + metric keys + per-task protocol coverage into `suite_open_pl_v1.yaml`; re-run `validate_suite_cfg`. Commit.

---

## Task 5: lm-eval → run/v1 pure transform (needs Task 4 fixture)

**Files:** Create `bench/runner/lm_eval_to_run.py`; Test `tests/runner/test_lm_eval_to_run.py` (uses the **real** fixture).

**Interfaces:** `to_run_v1(lm_results, suite_cfg, meta) -> dict`; output passes `validateRun`.

Distinguishing the 4 states (the ambiguity flagged in review): the **cfg** decides intent, the **results** decide presence. For protocol p∈{gen,mcq}: if `cfg[p] is None` → emit `null` (intentionally absent). If `cfg[p]` set but its lm-eval entry is missing/errored → task `status:"broken"`, value `0.0`. If set and present → the value. A task is `broken` iff *every configured* protocol is missing; otherwise `ok` (a present protocol + an absent-by-cfg protocol is still `ok`). Test all 4 + assert emitted task `status ∈ {"ok","broken"}` only, and aggregates exclude null/broken; `mmlu` read from the group key; guards carry `limited:true`.

- [ ] Steps: failing test against the real fixture (4 states, aggregates, guards, validateRun essentials) → FAIL → implement → PASS → commit.

---

## Task 6: Orchestrator `run_one.py` (needs Tasks 3, 5)

**Files:** Create `bench/runner/run_one.py`; Test `tests/runner/test_run_one.py` (monkeypatch `_invoke_lm_eval` + the publish subprocess).

- `run_one(model, suite_id, meta) -> run_v1` + CLI. `_invoke_lm_eval` shells `lm_eval --model vllm --include_path bench/runner/tasks ...`, parses `--output_path` JSON; vLLM OOM/load error → raise `RunnerOOM`. Publish via `subprocess.run(["node","scripts/publish-run.mjs",f], check=True, env={**os.environ,...})`; map exit codes (token-missing/usage=2 → raise `RunnerConfigError`, NOT a model failure; validation-fail → raise `RunnerBadRun`).

- [ ] Steps: failing test (fixture → valid run/v1; publish called once with env; OOM→RunnerOOM; publish-exit-2→RunnerConfigError) → FAIL → implement → PASS → commit.

---

## Task 7: Worker loop + cron (needs Tasks 1, 6)

**Files:** Create `bench/runner/worker.py`; Test `tests/runner/test_worker.py`; doc cron + runbook.

- `tick()`: `node queue-list approved --json` → first item: advisory param-card precheck (logs only, never rejects — OOM is the real guard) + disk precheck → `node queue-claim <id>` (abort tick if exit≠0 — lost race) → `run_one` → success `queue-resolve done`; `RunnerOOM`/`RunnerBadRun` → `queue-resolve failed`; `RunnerConfigError` → abort tick WITHOUT resolving (don't lose the item on a misconfig). HF-cache GC if disk low.
- Cron: `flock -n /tmp/bench-runner.lock python -m bench.runner.worker || true` (every 10 min).

- [ ] Steps: failing test (mock CLIs: approved item → claim ok → run_one → resolve done; claim exit≠0 → run_one NOT called; RunnerConfigError → no resolve call) → FAIL → implement → PASS → document cron+runbook → commit.

---

## Task 8: GPU integration + atomic re-baseline cutover (NOT unit-testable — on `lem`)

Gated on D1/D3/D6/D8 + GPU. Setup, not TDD:
- [ ] Real runs for the base + bake-off models (`Qwen3.5-9B`, `Bielik-11B-v3`, …) computed offline first.
- [ ] **Atomic cutover:** in one batch, delete the demo runs and publish the real ones together (no window of real-base vs demo-candidate). If the real per-task protocol set differs from the demo, publish under `open-pl-v1.1` and treat as a fresh board. Confirm `/runner` shows real numbers, `demo` false, guards reflect reality.
- [ ] Enable the flock cron; run submit→approve→claim→done end-to-end on one external model.

---

## Out of scope (Phase 4)
Tier-A private/targeted diagnostics + verdict/"keeper" narrative; FP8/quantized + >27B tiers (separate suite version); auto-approval.

---

## Self-Review
- **Review fixes applied:** D1 now vendors the Open PL Leaderboard tasks (B1); per-task protocol map + null≠broken (B2); flock single-worker + re-read claim (B3); submit-route base/suite validation + immutable `runner/approved/` (B4); `decon` dropped from the runner, optional documented `decon_ref` only (M1/M2); realistic ≤14B cap + vLLM params + OOM-as-failed (M3); subprocess env+exit-code mapping (M4); real captured fixture in Task 0 before the transform, mmlu group key (M5); explicit version-gated re-baseline instead of in-place demo overwrite (M6); guard per-task metric incl. gsm8k exact_match (m5); archive-to-`runner/done/` resolved (m4); disk precheck+GC (m2); OOM-as-failed advisory cap (m3).
- **Second-pass fixes applied (rev 3):** prefix-based lifecycle closes the TOCTOU (public writes only `runner/queue/`) with an explicit `queue-approve` CLI + `delBlob`/`moveSubmission` primitives (B1/B2); submit-route uses a static base/suite allowlist, no live Blob `list` on the public path (B3); guards are limited-sample tripwires, not full MMLU (B4); GPU-free Tasks 1–3 reordered ahead of the GPU long-pole, Task 4 gates 5–8 (B5); submission/v1 lifecycle documented in the design spec, no mutable status field (B6); the 4-state transform disambiguates cfg-intent vs results-presence (B-followup); atomic batched re-baseline instead of in-place overwrite (B7/M6).
- **Open items for the human (⚑):** D1 (Open PL Leaderboard is the canonical suite), D3 (GPU/host via Michał), D6 (size cap value + guard `--limit`), D8 (exact v1 task list), and the re-baseline cutover call.
- **Testability:** Tasks 1–3 + 5–7 unit-tested (transform against a REAL fixture from Task 4); Tasks 4 and 8 are GPU integration-only.
