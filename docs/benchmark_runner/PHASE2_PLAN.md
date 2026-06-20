# Benchmark Runner — Phase 2 Implementation Plan (results store + submission backend)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move benchmark runs off git and onto Vercel Blob, so the GPU runner (later) can publish results without a code commit/rebuild, and add a submission endpoint that records "wrzuć model" requests safely.

**Architecture:** Split the existing `lib/runs.js` into pure compute (`lib/runs.js`) + a pluggable source (`lib/store.js`) + pure path/url helpers (`lib/blob-paths.js`). The source reads from Vercel Blob in production (env `BLOB_READ_WRITE_TOKEN` present) and falls back to local `public/results/` files in dev. Individual reads use a **deterministic public URL** (`NEXT_PUBLIC_BLOB_BASE`) — no per-read `list`. Pages become ISR (`revalidate`) with `dynamicParams` so new runs appear without redeploy. Submissions are a **separate `submission/v1` shape** written under a `runner/queue/` prefix (never the public board), with IP cooldown + size cap + deterministic-id dedup.

**Tech Stack:** Next.js 15 (App Router, server components, ISR), `@vercel/blob` v2 (already a dependency), `node:test` + `node:assert` (no new test deps), `node --test`.

## Global Constraints

- Node test runner only: `node --test` with `node:test`/`node:assert`. No vitest/jest. (ponytail: stdlib.)
- No new runtime dependencies beyond `@vercel/blob` (already in `package.json`).
- Pure JS (no TypeScript) — match the existing app.
- `run/v1` schema is the contract (see `BENCHMARK_RUNNER_DESIGN.md`); do not change its field names. Submissions use a **separate** `submission/v1` shape — they are NOT run/v1, so queued items never reach the board.
- Open-suite results are PUBLIC (`access: 'public'`). Private/Tier-A runs are out of scope for this phase.
- Blob writes require `BLOB_READ_WRITE_TOKEN` (server-only secret, never `NEXT_PUBLIC_`). Reads of public blobs use `NEXT_PUBLIC_BLOB_BASE` (the store's public base URL, e.g. `https://<id>.public.blob.vercel-storage.com`) and need no token.
- All writes use `addRandomSuffix: false` + `allowOverwrite: true` → stable, idempotent paths (re-publishing a run overwrites it; the GPU runner depends on this).
- Blob layout: `runner/runs/<id>.json` (public board), `runner/suites/<id>.json` (public), `runner/queue/<id>.json` (submissions, NOT shown on the board).
- Dev fallback: when `BLOB_READ_WRITE_TOKEN` is unset, the store reads `public/results/runs/` and `public/results/suites/` exactly as today (local dev + the current PR preview keep working with zero config).

---

## File Structure

- `lib/runs.js` (modify) — **pure** compute only: `delta`, `pickBase`, `boardRows(runs)`, `rankByGen`, `guardStatus`, `taskRows`. Takes data; no I/O.
- `lib/blob-paths.js` (create) — **pure** helpers: `runPath(id)`, `suitePath(id)`, `queuePath(id)`, `idFromPath(pathname)`, `publicUrl(pathname)`. Unit-tested.
- `lib/store.js` (create) — the source: `listRunIds`, `getRun`, `getSuite`, `listRuns`, `putRun`, `putSuite`, `enqueueSubmission`, `usingBlob`. Blob vs fs by env. Async.
- `lib/run-schema.js` (create) — `validateRun(obj)` and `validateSubmission(obj)` → `{ ok, errors }`. Shared by publish + submit.
- `app/runner/page.jsx` (modify) — `async` server component, `revalidate = 300`, awaits `store.listRuns()` then pure `boardRows`.
- `app/runner/[id]/page.jsx` (modify) — `async`; `revalidate = 300`; `dynamicParams = true`; `generateStaticParams` + `generateMetadata` (async) + `Page` all read from the store.
- `app/api/runner/submit/route.js` (create) — POST: validate, cooldown, size cap, write `submission/v1` to `runner/queue/`.
- `scripts/publish-run.mjs` (create) — `node scripts/publish-run.mjs <run.json>` → validate → `putRun`.
- `scripts/publish-suite.mjs` (create) — `node scripts/publish-suite.mjs <suite.json>` → `putSuite`.
- `test/runs.test.mjs`, `test/blob-paths.test.mjs`, `test/run-schema.test.mjs`, `test/store.test.mjs` (create).

---

## Task 1: Extract pure compute into `lib/runs.js`

**Files:**
- Modify: `lib/runs.js` (remove all `fs`/`path` I/O; keep pure compute; `boardRows`/`taskRows` take data args)
- Test: `test/runs.test.mjs`

**Interfaces:**
- Produces:
  - `delta(val, baseVal) -> number|null`
  - `pickBase(run, runsById) -> run|null`
  - `boardRows(runs) -> [{ run, base, gen, mcq, dGen, dMcq, guard }]` (guard: `'ok'|'fail'|'na'`)
  - `rankByGen(rows) -> rows`
  - `guardStatus(run, base, eps=1.0) -> 'ok'|'fail'|'na'`
  - `taskRows(run, base) -> [{ ...task, dGen, dMcq }]`

Note: `guard_eps` is a **suite** constant (1.0), not a run field — the old code passed `run.guard_eps` (always undefined). This task drops that dead arg and relies on the documented default `eps=1.0`.

- [ ] **Step 1: Write the failing test**

```js
// test/runs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { delta, boardRows, rankByGen, taskRows } from "../lib/runs.js";

const base = { id: "b", base: "b", aggregate: { gen: 79.7, mcq: 76.6 }, guards: [{ id: "mmlu", gen: 77.1 }] };
const cand = { id: "c", base: "b", aggregate: { gen: 80.8, mcq: 79.1 }, guards: [{ id: "mmlu", gen: 76.8 }],
  tasks: [{ id: "psc", gen: 96.9, mcq: 91.2, status: "ok" }] };
const bielik = { id: "k", base: "b", aggregate: { gen: 81.6, mcq: 78.3 }, guards: [{ id: "mmlu", gen: 64.0 }] };

test("delta rounds to 1dp and is null-safe", () => {
  assert.equal(delta(80.8, 79.7), 1.1);
  assert.equal(delta(80.8, null), null);
});
test("boardRows computes Δ vs base and guard light", () => {
  const rows = boardRows([base, cand, bielik]);
  assert.equal(rows.find((r) => r.run.id === "c").dGen, 1.1);
  assert.equal(rows.find((r) => r.run.id === "c").guard, "ok");
  assert.equal(rows.find((r) => r.run.id === "k").guard, "fail"); // 64.0 < 77.1 - 1.0
});
test("rankByGen sorts desc, nulls last", () => {
  const rows = rankByGen(boardRows([base, cand, bielik]));
  assert.deepEqual(rows.map((r) => r.run.id), ["k", "c", "b"]);
});
test("queued run with null aggregate sinks and survives", () => {
  const q = { id: "q", base: "b", aggregate: { gen: null, mcq: null } };
  const rows = rankByGen(boardRows([base, cand, q]));
  assert.equal(rows[rows.length - 1].run.id, "q");
  assert.equal(rows.find((r) => r.run.id === "q").dGen, null);
});
test("taskRows adds per-protocol Δ vs base", () => {
  const wb = { ...base, tasks: [{ id: "psc", gen: 95.1, mcq: 90.0 }] };
  assert.equal(taskRows(cand, wb)[0].dGen, 1.8);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/runs.test.mjs`
Expected: FAIL — current `boardRows` reads `fs`, signatures don't match.

- [ ] **Step 3: Rewrite `lib/runs.js` as pure compute**

```js
// lib/runs.js — pure compute for the Benchmark Runner. No I/O. Source is lib/store.js.
export function delta(val, baseVal) {
  if (val == null || baseVal == null) return null;
  return Math.round((val - baseVal) * 10) / 10;
}
export function pickBase(run, runsById) {
  if (!run?.base || run.base === run.id) return null;
  return runsById[run.base] || null;
}
export function guardStatus(run, base, eps = 1.0) {
  const guards = run.guards || [];
  if (!guards.length) return "na";
  if (!base) return "ok";
  const baseById = Object.fromEntries((base.guards || []).map((g) => [g.id, g]));
  for (const g of guards) {
    const b = baseById[g.id];
    if (g.gen == null || !b || b.gen == null) continue;
    if (g.gen < b.gen - eps) return "fail";
  }
  return "ok";
}
export function boardRows(runs) {
  const byId = Object.fromEntries(runs.map((r) => [r.id, r]));
  return runs.map((run) => {
    const base = pickBase(run, byId);
    const gen = run.aggregate?.gen ?? null;
    const mcq = run.aggregate?.mcq ?? null;
    return {
      run, base, gen, mcq,
      dGen: base ? delta(gen, base.aggregate?.gen ?? null) : null,
      dMcq: base ? delta(mcq, base.aggregate?.mcq ?? null) : null,
      guard: guardStatus(run, base),
    };
  });
}
export function rankByGen(rows) {
  return [...rows].sort((a, b) => (b.gen ?? -Infinity) - (a.gen ?? -Infinity));
}
export function taskRows(run, base) {
  const baseTasks = Object.fromEntries((base?.tasks || []).map((t) => [t.id, t]));
  return (run.tasks || []).map((t) => {
    const b = baseTasks[t.id];
    return { ...t, dGen: b ? delta(t.gen, b.gen) : null, dMcq: b ? delta(t.mcq, b.mcq) : null };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/runs.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/runs.js test/runs.test.mjs
git commit -m "benchmark-runner: extract pure compute in lib/runs.js + tests"
```

---

## Task 2: Pure blob path/url helpers

**Files:**
- Create: `lib/blob-paths.js`
- Test: `test/blob-paths.test.mjs`

**Interfaces:**
- Produces (all pure):
  - `runPath(id) -> "runner/runs/<id>.json"`
  - `suitePath(id) -> "runner/suites/<id>.json"`
  - `queuePath(id) -> "runner/queue/<id>.json"`
  - `idFromPath(pathname) -> "<id>"` (strips any `runner/<kind>/` prefix and `.json`)
  - `publicUrl(pathname, base = process.env.NEXT_PUBLIC_BLOB_BASE) -> string` (joins base + "/" + pathname; throws if base missing)

- [ ] **Step 1: Write the failing test**

```js
// test/blob-paths.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { runPath, suitePath, queuePath, idFromPath, publicUrl } from "../lib/blob-paths.js";

test("path builders", () => {
  assert.equal(runPath("qwen3.5-9b"), "runner/runs/qwen3.5-9b.json");
  assert.equal(suitePath("open-pl-v1"), "runner/suites/open-pl-v1.json");
  assert.equal(queuePath("sub-x"), "runner/queue/sub-x.json");
});
test("idFromPath strips prefix + extension", () => {
  assert.equal(idFromPath("runner/runs/qwen3.5-9b.json"), "qwen3.5-9b");
  assert.equal(idFromPath("runner/suites/open-pl-v1.json"), "open-pl-v1");
});
test("publicUrl joins base, throws without base", () => {
  assert.equal(publicUrl("runner/runs/x.json", "https://b.example.com"), "https://b.example.com/runner/runs/x.json");
  assert.throws(() => publicUrl("runner/runs/x.json", undefined));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/blob-paths.test.mjs`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```js
// lib/blob-paths.js — pure path/url helpers for the Blob layout. No I/O.
export const runPath = (id) => `runner/runs/${id}.json`;
export const suitePath = (id) => `runner/suites/${id}.json`;
export const queuePath = (id) => `runner/queue/${id}.json`;
export const idFromPath = (p) => p.replace(/^runner\/[^/]+\//, "").replace(/\.json$/, "");
export function publicUrl(pathname, base = process.env.NEXT_PUBLIC_BLOB_BASE) {
  if (!base) throw new Error("NEXT_PUBLIC_BLOB_BASE is not set");
  return `${base.replace(/\/$/, "")}/${pathname}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/blob-paths.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/blob-paths.js test/blob-paths.test.mjs
git commit -m "benchmark-runner: pure blob path/url helpers + tests"
```

---

## Task 3: The store (fs fallback + Blob) `lib/store.js`

**Files:**
- Create: `lib/store.js`
- Test: `test/store.test.mjs`

**Interfaces:**
- Consumes: `lib/blob-paths.js` (Task 2).
- Produces (all async unless noted):
  - `usingBlob() -> boolean` (sync; true iff `BLOB_READ_WRITE_TOKEN` set)
  - `listRunIds() -> string[]`
  - `getRun(id) -> run|null`
  - `getSuite(id) -> suite|null`
  - `listRuns() -> run[]`
  - `putRun(run) -> { url }`
  - `putSuite(suite) -> { url }`
  - `enqueueSubmission(sub) -> { url }`

Design: individual reads use `publicUrl()` + `fetch` (O(1), null on 404, no token). Only `listRunIds` uses Blob `list` (needs token, runs server-side at build/ISR). Writes use `put(..., { access:'public', addRandomSuffix:false, allowOverwrite:true, token })`. The fs branch is the unit-tested path; the Blob branch's pure parts (path mapping) are covered by Task 2.

- [ ] **Step 1: Write the failing test (fs branch, with env restore)**

```js
// test/store.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

test("fs fallback reads runs and suites; getRun(missing) -> null", async () => {
  const saved = { tok: process.env.BLOB_READ_WRITE_TOKEN, dir: process.env.RUNNER_RESULTS_DIR };
  try {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "store-"));
    fs.mkdirSync(path.join(dir, "runs"), { recursive: true });
    fs.mkdirSync(path.join(dir, "suites"), { recursive: true });
    fs.writeFileSync(path.join(dir, "runs", "a.json"), JSON.stringify({ id: "a" }));
    fs.writeFileSync(path.join(dir, "suites", "s.json"), JSON.stringify({ id: "s" }));
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.RUNNER_RESULTS_DIR = dir;
    const store = await import("../lib/store.js");
    assert.equal(store.usingBlob(), false);
    assert.deepEqual(await store.listRunIds(), ["a"]);
    assert.equal((await store.getRun("a")).id, "a");
    assert.equal((await store.getSuite("s")).id, "s");
    assert.equal(await store.getRun("missing"), null);
  } finally {
    if (saved.tok === undefined) delete process.env.BLOB_READ_WRITE_TOKEN; else process.env.BLOB_READ_WRITE_TOKEN = saved.tok;
    if (saved.dir === undefined) delete process.env.RUNNER_RESULTS_DIR; else process.env.RUNNER_RESULTS_DIR = saved.dir;
  }
});
```

(The store reads env lazily inside each function, so a single import is fine — no cache-buster needed.)

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/store.test.mjs`
Expected: FAIL — `lib/store.js` missing.

- [ ] **Step 3: Implement `lib/store.js`**

```js
// lib/store.js — source for runs/suites/submissions. Blob in prod, fs in dev.
import fsp from "node:fs/promises";
import path from "node:path";
import { list, put } from "@vercel/blob";
import { runPath, suitePath, queuePath, idFromPath, publicUrl } from "./blob-paths.js";

const FS_ROOT = () => process.env.RUNNER_RESULTS_DIR || path.join(process.cwd(), "public/results");
export function usingBlob() { return Boolean(process.env.BLOB_READ_WRITE_TOKEN); }

async function fsJson(p) { try { return JSON.parse(await fsp.readFile(p, "utf-8")); } catch { return null; } }
async function urlJson(pathname) {
  try {
    const res = await fetch(publicUrl(pathname), { cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

export async function listRunIds() {
  if (usingBlob()) {
    const { blobs } = await list({ prefix: "runner/runs/", token: process.env.BLOB_READ_WRITE_TOKEN });
    return blobs.map((b) => idFromPath(b.pathname)).filter(Boolean).sort();
  }
  try {
    const files = await fsp.readdir(path.join(FS_ROOT(), "runs"));
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
  } catch { return []; }
}
export async function getRun(id) {
  return usingBlob() ? urlJson(runPath(id)) : fsJson(path.join(FS_ROOT(), "runs", `${id}.json`));
}
export async function getSuite(id) {
  return usingBlob() ? urlJson(suitePath(id)) : fsJson(path.join(FS_ROOT(), "suites", `${id}.json`));
}
export async function listRuns() {
  const ids = await listRunIds();
  return (await Promise.all(ids.map(getRun))).filter(Boolean);
}

const wopts = () => ({ access: "public", addRandomSuffix: false, allowOverwrite: true,
  contentType: "application/json", token: process.env.BLOB_READ_WRITE_TOKEN });
export async function putRun(run) { return put(runPath(run.id), JSON.stringify(run), wopts()); }
export async function putSuite(suite) { return put(suitePath(suite.id), JSON.stringify(suite), wopts()); }
export async function enqueueSubmission(sub) { return put(queuePath(sub.id), JSON.stringify(sub), wopts()); }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/store.test.mjs`
Expected: PASS.

- [ ] **Step 5: Env-gated integration smoke (manual; only if a Blob token + base exist)**

```bash
BLOB_READ_WRITE_TOKEN=*** NEXT_PUBLIC_BLOB_BASE=https://<id>.public.blob.vercel-storage.com \
node -e "import('./lib/store.js').then(async s => { \
  await s.putRun({ schema:'run/v1', id:'smoke', base:'smoke', aggregate:{gen:1,mcq:2} }); \
  await s.putRun({ schema:'run/v1', id:'smoke', base:'smoke', aggregate:{gen:3,mcq:4} }); /* overwrite must NOT throw */ \
  console.log(await s.getRun('smoke')); })"
```
Expected: prints the second version (`gen:3`); the repeat `putRun` does not throw (proves `allowOverwrite`). If no token, skip and note it.

- [ ] **Step 6: Commit**

```bash
git add lib/store.js test/store.test.mjs
git commit -m "benchmark-runner: store (fs fallback + blob, deterministic reads, overwrite)"
```

---

## Task 4: Wire pages to the store with ISR + dynamicParams

**Files:**
- Modify: `app/runner/page.jsx` (board), `app/runner/[id]/page.jsx` (report — `generateStaticParams`, `generateMetadata`, `Page`)

**Interfaces:**
- Consumes: `store.listRuns`, `store.getRun`, `store.getSuite`, `store.listRunIds`; pure `boardRows`, `rankByGen`, `taskRows`.

Removed symbols from `lib/runs.js` (no longer exist): `loadRun`, `loadSuite`, `listRunIds`, `allRuns`, `baseOf`. Every call site moves to `lib/store.js`. The run page has THREE such call sites: `generateStaticParams`, `generateMetadata`, and `Page` — all three must change.

- [ ] **Step 1: Update the board page**

```jsx
// app/runner/page.jsx — change imports + make Page async; JSX body unchanged.
import Submit from "./submit";
import { boardRows, rankByGen } from "../../lib/runs";
import { listRuns } from "../../lib/store";
// keep: export const metadata = {...}; const css = `...`; Delta(), Guard()
export const revalidate = 300; // ISR: board re-reads Blob within 5 min, no redeploy
export default async function Page() {
  const rows = rankByGen(boardRows(await listRuns()));
  // ...the entire existing return(...) JSX is unchanged; it already maps over `rows`...
}
```

- [ ] **Step 2: Update the run page (all three data functions)**

```jsx
// app/runner/[id]/page.jsx — top of file
import { notFound } from "next/navigation";
import { taskRows } from "../../../lib/runs";
import { getRun, getSuite, listRunIds } from "../../../lib/store";

export const revalidate = 300;
export const dynamicParams = true; // a run id not seen at build is rendered on-demand (ISR)

export async function generateStaticParams() {
  return (await listRunIds()).map((id) => ({ id })); // build-time seed only; new ids served on-demand
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) return {};
  return { title: `${run.model.name} | Benchmark Runner | Slayer` };
}

export default async function Page({ params }) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) notFound();
  const base = run.base && run.base !== run.id ? await getRun(run.base) : null;
  const suite = await getSuite(run.suite);
  const rows = taskRows(run, base);
  // ...the rest of the existing component body is unchanged (it uses run, base, suite, rows)...
}
```

Note: at build with no Blob token (local/PR preview), `generateStaticParams` returns the 3 fs runs. On Vercel with a token but an empty store (before the seed upload in Task 8), it returns `[]` and every page is served on-demand once data exists — acceptable, and why Task 8 seeds the store before the board is expected to be populated.

- [ ] **Step 3: Build to verify both routes prerender (fs branch)**

Run: `rm -rf .next && node_modules/.bin/next build`
Expected: exit 0; `/runner` + `/runner/[id]` listed; 3 run pages prerendered.

- [ ] **Step 4: Commit**

```bash
git add app/runner/page.jsx "app/runner/[id]/page.jsx"
git commit -m "benchmark-runner: pages read from store, ISR + dynamicParams"
```

---

## Task 5: `run/v1` + `submission/v1` validators + publish CLIs

**Files:**
- Create: `lib/run-schema.js`, `scripts/publish-run.mjs`, `scripts/publish-suite.mjs`
- Test: `test/run-schema.test.mjs`

**Interfaces:**
- Produces:
  - `validateRun(obj) -> { ok, errors[] }`
  - `validateSubmission(obj) -> { ok, errors[] }`

- [ ] **Step 1: Write the failing test (incl. a REAL seed file)**

```js
// test/run-schema.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateRun, validateSubmission } from "../lib/run-schema.js";

const good = { schema: "run/v1", id: "x", model: { name: "X" }, suite: "open-pl-v1", base: "x",
  date: "2026-06-20", tasks: [{ id: "psc", gen: 1, mcq: 2, status: "ok" }],
  guards: [], aggregate: { gen: 1, mcq: 2, working_tasks: 1 } };

test("accepts a well-formed run", () => assert.equal(validateRun(good).ok, true));
test("accepts the real seed file", () => {
  const seed = JSON.parse(fs.readFileSync("public/results/runs/qwen3.5-9b.json", "utf-8"));
  assert.equal(validateRun(seed).ok, true);
});
test("rejects bad id / schema / task", () => {
  assert.equal(validateRun({ ...good, id: "" }).ok, false);
  assert.equal(validateRun({ ...good, schema: "nope" }).ok, false);
  assert.equal(validateRun({ ...good, tasks: [{ gen: 1 }] }).ok, false);
});
test("submission validator: org/name required", () => {
  assert.equal(validateSubmission({ schema: "submission/v1", id: "s", hfModel: "speakleash/Bielik", base: "qwen3.5-9b", suite: "open-pl-v1" }).ok, true);
  assert.equal(validateSubmission({ schema: "submission/v1", id: "s", hfModel: "nope" }).ok, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/run-schema.test.mjs`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement validators**

```js
// lib/run-schema.js — minimal validators, no deps.
const SLUG = /^[a-z0-9][a-z0-9._-]*$/;
const HF = /^[\w.-]+\/[\w.-]+$/;

export function validateRun(o) {
  const e = [];
  if (!o || typeof o !== "object") return { ok: false, errors: ["not an object"] };
  if (o.schema !== "run/v1") e.push("schema must be 'run/v1'");
  if (typeof o.id !== "string" || !SLUG.test(o.id)) e.push("id must be a slug");
  if (!o.model || typeof o.model.name !== "string") e.push("model.name required");
  if (typeof o.suite !== "string") e.push("suite required");
  if (typeof o.base !== "string") e.push("base required");
  if (typeof o.date !== "string") e.push("date required");
  if (!Array.isArray(o.tasks)) e.push("tasks must be an array");
  else o.tasks.forEach((t, i) => {
    if (typeof t.id !== "string") e.push(`tasks[${i}].id required`);
    if (!("gen" in t) || !("mcq" in t)) e.push(`tasks[${i}] needs gen and mcq`);
    if (!["ok", "broken", "pending"].includes(t.status)) e.push(`tasks[${i}].status invalid`);
  });
  if (!o.aggregate || !("gen" in o.aggregate) || !("mcq" in o.aggregate)) e.push("aggregate needs gen and mcq");
  return { ok: e.length === 0, errors: e };
}

export function validateSubmission(o) {
  const e = [];
  if (!o || typeof o !== "object") return { ok: false, errors: ["not an object"] };
  if (o.schema !== "submission/v1") e.push("schema must be 'submission/v1'");
  if (typeof o.id !== "string" || !SLUG.test(o.id)) e.push("id must be a slug");
  if (typeof o.hfModel !== "string" || !HF.test(o.hfModel)) e.push("hfModel must be org/name");
  return { ok: e.length === 0, errors: e };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/run-schema.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Implement publish CLIs**

```js
// scripts/publish-run.mjs — node scripts/publish-run.mjs <run.json>
import fs from "node:fs";
import { validateRun } from "../lib/run-schema.js";
import { putRun, usingBlob } from "../lib/store.js";
const file = process.argv[2];
if (!file) { console.error("usage: publish-run.mjs <run.json>"); process.exit(2); }
const run = JSON.parse(fs.readFileSync(file, "utf-8"));
const { ok, errors } = validateRun(run);
if (!ok) { console.error("invalid run/v1:\n - " + errors.join("\n - ")); process.exit(1); }
if (!usingBlob()) { console.error("BLOB_READ_WRITE_TOKEN not set — refusing to publish"); process.exit(1); }
const { url } = await putRun(run);
console.log("published", run.id, "->", url);
```

```js
// scripts/publish-suite.mjs — node scripts/publish-suite.mjs <suite.json>
import fs from "node:fs";
import { putSuite, usingBlob } from "../lib/store.js";
const file = process.argv[2];
if (!file) { console.error("usage: publish-suite.mjs <suite.json>"); process.exit(2); }
const suite = JSON.parse(fs.readFileSync(file, "utf-8"));
if (typeof suite.id !== "string") { console.error("suite.id required"); process.exit(1); }
if (!usingBlob()) { console.error("BLOB_READ_WRITE_TOKEN not set — refusing to publish"); process.exit(1); }
const { url } = await putSuite(suite);
console.log("published suite", suite.id, "->", url);
```

- [ ] **Step 6: Verify the run CLI validates then guards on token (no token needed)**

Run: `node scripts/publish-run.mjs public/results/runs/qwen3.5-9b.json`
Expected: prints `BLOB_READ_WRITE_TOKEN not set — refusing to publish`, exit 1 (validation passed first).

- [ ] **Step 7: Commit**

```bash
git add lib/run-schema.js scripts/publish-run.mjs scripts/publish-suite.mjs test/run-schema.test.mjs
git commit -m "benchmark-runner: run/v1 + submission validators + publish CLIs"
```

---

## Task 6: Submission API route (queue prefix, abuse controls, dedup)

**Files:**
- Create: `app/api/runner/submit/route.js`

**Interfaces:**
- Consumes: `validateSubmission` (Task 5), `enqueueSubmission` (Task 3).
- Produces: `POST /api/runner/submit` body `{ hfModel, base?, suite?, trap? }` → `201 { id }` | `400 { error }` | `429 { error }`.

Submissions are `submission/v1` written under `runner/queue/<id>.json` — they NEVER enter `runner/runs/`, so the public board is unaffected. The id is deterministic (`sub-<slug(hfModel)>`) so resubmitting the same model overwrites (dedup), not multiplies.

- [ ] **Step 1: Implement the route**

```js
// app/api/runner/submit/route.js
import { enqueueSubmission, usingBlob } from "../../../../lib/store";
import { validateSubmission } from "../../../../lib/run-schema";

const HF = /^[\w.-]+\/[\w.-]+$/;
const MAX_BODY = 2048; // bytes
const COOLDOWN_MS = 20_000;
// ponytail: per-instance in-memory cooldown; mirrors signup_server. Swap for KV if it must be global.
const seen = new Map();
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function POST(req) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
  const now = Date.now();
  if (seen.has(ip) && now - seen.get(ip) < COOLDOWN_MS)
    return Response.json({ error: "zwolnij — spróbuj za chwilę" }, { status: 429 });

  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY) return Response.json({ error: "body too large" }, { status: 413 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad json" }, { status: 400 }); }
  if (body?.trap) return Response.json({ id: "ok" }, { status: 201 }); // honeypot

  const hfModel = String(body?.hfModel || "").trim();
  if (!HF.test(hfModel)) return Response.json({ error: "hfModel must be org/name" }, { status: 400 });

  const sub = {
    schema: "submission/v1", id: `sub-${slug(hfModel)}`, hfModel,
    base: String(body?.base || "qwen3.5-9b"), suite: String(body?.suite || "open-pl-v1"),
    status: "queued", requested_at: new Date().toISOString(),
  };
  const { ok, errors } = validateSubmission(sub);
  if (!ok) return Response.json({ error: errors.join("; ") }, { status: 400 });

  seen.set(ip, now);
  if (!usingBlob()) return Response.json({ id: sub.id, queued: false, note: "store offline (dev)" }, { status: 201 });
  await enqueueSubmission(sub);
  return Response.json({ id: sub.id, queued: true }, { status: 201 });
}
```

- [ ] **Step 2: Build to verify the route compiles**

Run: `rm -rf .next && node_modules/.bin/next build`
Expected: exit 0; `ƒ /api/runner/submit` appears.

- [ ] **Step 3: Manual check (after `next start`)**

```bash
curl -s -XPOST localhost:3000/api/runner/submit -H 'content-type: application/json' -d '{"hfModel":"nope"}'   # -> 400
curl -s -XPOST localhost:3000/api/runner/submit -H 'content-type: application/json' -d '{"hfModel":"speakleash/Bielik-11B"}'  # -> 201 {id:"sub-speakleash-bielik-11b", queued:false}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/runner/submit/route.js
git commit -m "benchmark-runner: submission endpoint (queue prefix, cooldown, dedup)"
```

---

## Task 7: Wire the submit form to the endpoint (with honeypot)

**Files:**
- Modify: `app/runner/submit.jsx`

- [ ] **Step 1: Make the form POST, include the hidden honeypot, show result**

```jsx
// app/runner/submit.jsx
"use client";
import { useState } from "react";
export default function Submit() {
  const [v, setV] = useState(""); const [trap, setTrap] = useState(""); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  async function go(e) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/runner/submit", { method: "POST",
        headers: { "content-type": "application/json" }, body: JSON.stringify({ hfModel: v, trap }) });
      const j = await r.json();
      setMsg(r.ok ? `zgłoszono: ${j.id}${j.queued === false ? " (store offline)" : ""}` : (j.error || "błąd"));
    } catch { setMsg("błąd sieci"); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={go} /* keep existing panel styling */>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="np. speakleash/Bielik-11B-v3.0-Instruct" aria-label="model HuggingFace" />
      {/* honeypot: hidden from humans, bots fill it */}
      <input value={trap} onChange={(e) => setTrap(e.target.value)} name="company" tabIndex={-1} autoComplete="off"
        aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
      <button type="submit" disabled={busy || !v}>{busy ? "…" : "uruchom →"}</button>
      {msg && <span className="mono dim" style={{ flexBasis: "100%", fontSize: ".74rem" }}>{msg}</span>}
      {/* keep the Discord fallback note */}
    </form>
  );
}
```

- [ ] **Step 2: Build + manual check**

Run: `node_modules/.bin/next build` then `next start`; submit a valid `org/name` → shows `zgłoszono: sub-...`.

- [ ] **Step 3: Commit**

```bash
git add app/runner/submit.jsx
git commit -m "benchmark-runner: wire submit form to endpoint (+ honeypot)"
```

---

## Task 8: Seed Blob + docs (ordering matters)

**Files:**
- Create: `.env.example`
- Modify: `docs/benchmark_runner/BENCHMARK_RUNNER.md` (Storage section)

**Ordering rule:** seed the store BEFORE the board is expected to be populated on Vercel. Either run the seed with the token locally first, or accept that the board is empty until the seed runs (every page is on-demand via `dynamicParams`).

- [ ] **Step 1: Seed runs + suites to Blob (when a store + token exist)**

```bash
export BLOB_READ_WRITE_TOKEN=***
for f in public/results/suites/*.json; do node scripts/publish-suite.mjs "$f"; done
for f in public/results/runs/*.json;   do node scripts/publish-run.mjs   "$f"; done
```
Keep the committed `public/results/{runs,suites}/*.json` as the dev-fallback seed; Blob becomes prod source-of-truth once `BLOB_READ_WRITE_TOKEN` + `NEXT_PUBLIC_BLOB_BASE` are set on Vercel.

- [ ] **Step 2: Document env + storage**

`.env.example`:
```
# Vercel Blob results store. Unset locally -> falls back to public/results files.
BLOB_READ_WRITE_TOKEN=
# Public base URL of the Blob store (for O(1) reads). e.g. https://<id>.public.blob.vercel-storage.com
NEXT_PUBLIC_BLOB_BASE=
```
Add a "Storage" paragraph to `BENCHMARK_RUNNER.md`: Blob layout (`runner/runs|suites|queue`), fs fallback, deterministic public-URL reads, `list` only for enumeration, 5-min ISR window, public-only, submissions live in `runner/queue/` and never hit the board.

- [ ] **Step 3: Commit**

```bash
git add .env.example docs/benchmark_runner/BENCHMARK_RUNNER.md
git commit -m "benchmark-runner: seed Blob + document storage/env"
```

---

## Phase 3 (next plan, not this one): GPU runner

Out of scope here — gated on external inputs, gets its own plan once decided:

- **Open decision — harness:** which single harness runs the suite (lm-eval-harness with PL tasks vs in-house ollama scripts). Determines how `run/v1` is produced and the exact `open-pl-v1` task membership.
- **Open decision — GPU access:** provisioning via @Michał Warda; where the runner executes; how it gets `BLOB_READ_WRITE_TOKEN`.
- **Scope:** poll `runner/queue/` → run decon gate → run suite + EN guards → assemble `run/v1` → `putRun` → delete the queue item → ISR surfaces it. Reuses `lib/run-schema.js` + `scripts/publish-run.mjs`.
- **Tier-A / private:** private results land in a private store; only aggregates ever cross into the public one. Separate, later.

---

## Self-Review

- **Spec coverage:** Blob store + deterministic reads (Tasks 2–3), decouple/ISR/dynamicParams (Task 4), public-only + queue isolation (Global Constraints, Tasks 3/6), submission with abuse controls + dedup (Tasks 5–7), publish path incl. **suites** (Tasks 5, 8), dev fallback (Task 3), GPU runner deferred. ✓
- **Placeholder scan:** every code step shows real code; no TBD/TODO; Phase 3 labelled out-of-scope. ✓
- **Type consistency:** `boardRows/taskRows/guardStatus/pickBase` consistent (Task 1 ↔ tests ↔ Task 4). `validateRun/validateSubmission -> {ok,errors}` (Tasks 5–7). `putRun/putSuite/enqueueSubmission -> {url}` (Tasks 3, 5, 6, 8). `usingBlob()` (Tasks 3, 5, 6). Blob path helpers (Task 2 ↔ Task 3). ✓
- **Review fixes applied:** `allowOverwrite:true` (F1); deterministic-URL reads, no `list`-per-read, no `head`-miss assumption (F2/F3); `dynamicParams` + documented seed behavior (F4); suites published (F5); queue prefix + cooldown + size cap + dedup id (F6/F8); `submission/v1` separate from run/v1 (F7); `generateMetadata` rewritten + removed-symbol call sites enumerated (F9); env-restore + no cache-buster in store test (F10); pure path helpers unit-tested (F11); dead `run.guard_eps` dropped (F12); real-seed validation test (F13); honeypot hidden input added (F15); seed-before-enable ordering documented (F16). ✓
