# Benchmark Runner — Phase 2 Implementation Plan (results store + submission backend)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move benchmark runs off git and onto Vercel Blob, so the GPU runner (later) can publish results without a code commit/rebuild, and add a submission endpoint that records "wrzuć model" requests.

**Architecture:** Split the existing `lib/runs.js` into pure compute (`lib/runs.js`) + a pluggable source (`lib/store.js`). The source reads from Vercel Blob in production (env `BLOB_READ_WRITE_TOKEN` present) and falls back to local `public/results/` files in dev. Pages become ISR (`revalidate`) so new runs appear without redeploy. A `scripts/publish-run.mjs` CLI uploads a `run/v1` JSON to Blob; an API route records submissions as `queued` run stubs.

**Tech Stack:** Next.js 15 (App Router, server components, ISR), `@vercel/blob` (already a dependency), `node:test` + `node:assert` for unit tests (no new test deps), `node --test`.

## Global Constraints

- Node test runner only: `node --test` with `node:test`/`node:assert`. No vitest/jest. (ponytail: stdlib.)
- No new runtime dependencies beyond `@vercel/blob` (already in `package.json`).
- Pure JS (no TypeScript) — match the existing app.
- `run/v1` schema is the contract (see `docs/benchmark_runner/BENCHMARK_RUNNER_DESIGN.md`); do not change field names.
- Open-suite results are PUBLIC (`access: 'public'`). Private/Tier-A runs are out of scope for this phase.
- Blob writes require `BLOB_READ_WRITE_TOKEN` (server-only secret, never `NEXT_PUBLIC_`).
- Blob layout: `runner/runs/<id>.json`, `runner/suites/<id>.json`. `addRandomSuffix: false` for stable, idempotent paths.
- Dev fallback: when `BLOB_READ_WRITE_TOKEN` is unset, the store reads the committed files in `public/results/runs/` and `public/results/suites/` exactly as today (so local dev and the current PR preview keep working with zero config).

---

## File Structure

- `lib/runs.js` (modify) — **pure** functions only: `delta`, `boardRows(runs)`, `rankByGen`, `guardStatus`, `taskRows`, `pickBase`. Takes data as args; no `fs`, no I/O.
- `lib/store.js` (create) — the source: `listRuns()`, `getRun(id)`, `getSuite(id)`, `putRun(run)`. Chooses Blob vs fs by env. Async.
- `lib/run-schema.js` (create) — `validateRun(obj)` returning `{ ok, errors }`; the one validator shared by publish + submit.
- `app/runner/page.jsx` (modify) — `async` server component, `export const revalidate = 300`, awaits `store.listRuns()` then pure `boardRows`.
- `app/runner/[id]/page.jsx` (modify) — `async`, `revalidate = 300`, awaits `store.getRun`/`getSuite`; `generateStaticParams` lists from the store.
- `app/api/runner/submit/route.js` (create) — POST handler: validate body, write a `queued` run stub via `store.putRun`, return `{ id }`.
- `scripts/publish-run.mjs` (create) — CLI: `node scripts/publish-run.mjs <path-to-run.json>` → validate → `store.putRun`.
- `test/runs.test.mjs` (create) — unit tests for `lib/runs.js` pure fns.
- `test/run-schema.test.mjs` (create) — unit tests for the validator.
- `test/store.test.mjs` (create) — unit tests for the fs-fallback path of `store` (using a temp dir).

---

## Task 1: Extract pure compute into `lib/runs.js`

**Files:**
- Modify: `lib/runs.js` (remove `fs`/`path` and the `loadRun`/`loadSuite`/`listRunIds`/`allRuns`/`baseOf` I/O fns; keep pure compute, make `boardRows`/`taskRows` take data args)
- Test: `test/runs.test.mjs`

**Interfaces:**
- Produces:
  - `delta(val, baseVal) -> number|null`
  - `pickBase(run, runsById) -> run|null` (null if run is its own base or base missing)
  - `boardRows(runs) -> [{ run, base, gen, mcq, dGen, dMcq, guard }]` (guard: `'ok'|'fail'|'na'`)
  - `rankByGen(rows) -> rows` (gen desc, nulls last)
  - `guardStatus(run, base, eps=1.0) -> 'ok'|'fail'|'na'`
  - `taskRows(run, base) -> [{ ...task, dGen, dMcq }]`

- [ ] **Step 1: Write the failing test**

```js
// test/runs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { delta, boardRows, rankByGen, guardStatus, taskRows, pickBase } from "../lib/runs.js";

const base = { id: "b", base: "b", aggregate: { gen: 79.7, mcq: 76.6 },
  guards: [{ id: "mmlu", gen: 77.1 }] };
const cand = { id: "c", base: "b", aggregate: { gen: 80.8, mcq: 79.1 },
  guards: [{ id: "mmlu", gen: 76.8 }],
  tasks: [{ id: "psc", gen: 96.9, mcq: 91.2, status: "ok" }] };
const bielik = { id: "k", base: "b", aggregate: { gen: 81.6, mcq: 78.3 },
  guards: [{ id: "mmlu", gen: 64.0 }] };

test("delta rounds to 1dp and is null-safe", () => {
  assert.equal(delta(80.8, 79.7), 1.1);
  assert.equal(delta(80.8, null), null);
});

test("boardRows computes Δ vs base and guard light", () => {
  const rows = boardRows([base, cand, bielik]);
  const c = rows.find((r) => r.run.id === "c");
  assert.equal(c.dGen, 1.1);
  assert.equal(c.guard, "ok");
  const k = rows.find((r) => r.run.id === "k");
  assert.equal(k.guard, "fail"); // mmlu 64.0 < 77.1 - 1.0
});

test("rankByGen sorts desc, nulls last", () => {
  const rows = rankByGen(boardRows([base, cand, bielik]));
  assert.deepEqual(rows.map((r) => r.run.id), ["k", "c", "b"]);
});

test("taskRows adds per-protocol Δ vs base", () => {
  const withBaseTask = { ...base, tasks: [{ id: "psc", gen: 95.1, mcq: 90.0 }] };
  const r = taskRows(cand, withBaseTask);
  assert.equal(r[0].dGen, 1.8);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/runs.test.mjs`
Expected: FAIL — `boardRows`/`pickBase` signatures don't match yet (current `boardRows` reads `fs`).

- [ ] **Step 3: Rewrite `lib/runs.js` as pure compute**

```js
// lib/runs.js — pure compute for the Benchmark Runner. No I/O. See lib/store.js for the source.
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
      guard: guardStatus(run, base, run.guard_eps),
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
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/runs.js test/runs.test.mjs
git commit -m "benchmark-runner: extract pure compute in lib/runs.js + tests"
```

---

## Task 2: The store with fs fallback (`lib/store.js`)

**Files:**
- Create: `lib/store.js`
- Test: `test/store.test.mjs`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces (all async):
  - `listRuns() -> Promise<run[]>`
  - `getRun(id) -> Promise<run|null>`
  - `getSuite(id) -> Promise<suite|null>`
  - `listRunIds() -> Promise<string[]>`
  - `usingBlob() -> boolean` (true iff `BLOB_READ_WRITE_TOKEN` set)

This task implements ONLY the fs-fallback branch. Task 3 adds the Blob branch.

- [ ] **Step 1: Write the failing test**

```js
// test/store.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

test("fs fallback reads runs and suites from a results dir", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "store-"));
  fs.mkdirSync(path.join(dir, "runs"), { recursive: true });
  fs.mkdirSync(path.join(dir, "suites"), { recursive: true });
  fs.writeFileSync(path.join(dir, "runs", "a.json"), JSON.stringify({ id: "a" }));
  fs.writeFileSync(path.join(dir, "suites", "s.json"), JSON.stringify({ id: "s" }));
  delete process.env.BLOB_READ_WRITE_TOKEN;
  process.env.RUNNER_RESULTS_DIR = dir; // test override for the results root
  const store = await import("../lib/store.js?fresh=" + Date.now());
  assert.equal(store.usingBlob(), false);
  assert.deepEqual(await store.listRunIds(), ["a"]);
  assert.equal((await store.getRun("a")).id, "a");
  assert.equal((await store.getSuite("s")).id, "s");
  assert.equal(await store.getRun("missing"), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/store.test.mjs`
Expected: FAIL — `lib/store.js` does not exist.

- [ ] **Step 3: Implement `lib/store.js` (fs branch only)**

```js
// lib/store.js — source for runs/suites. Blob in prod (BLOB_READ_WRITE_TOKEN), fs in dev.
import fs from "node:fs/promises";
import path from "node:path";

const FS_ROOT = () =>
  process.env.RUNNER_RESULTS_DIR || path.join(process.cwd(), "public/results");

export function usingBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function fsReadJson(p) {
  try { return JSON.parse(await fs.readFile(p, "utf-8")); }
  catch { return null; }
}

export async function listRunIds() {
  if (usingBlob()) return blobListRunIds();
  try {
    const files = await fs.readdir(path.join(FS_ROOT(), "runs"));
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
  } catch { return []; }
}

export async function getRun(id) {
  if (usingBlob()) return blobGetJson(`runner/runs/${id}.json`);
  return fsReadJson(path.join(FS_ROOT(), "runs", `${id}.json`));
}

export async function getSuite(id) {
  if (usingBlob()) return blobGetJson(`runner/suites/${id}.json`);
  return fsReadJson(path.join(FS_ROOT(), "suites", `${id}.json`));
}

export async function listRuns() {
  const ids = await listRunIds();
  const runs = await Promise.all(ids.map(getRun));
  return runs.filter(Boolean);
}

// --- Blob branch: implemented in Task 3 ---
async function blobListRunIds() { throw new Error("blob source not implemented yet"); }
async function blobGetJson(_pathname) { throw new Error("blob source not implemented yet"); }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/store.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/store.js test/store.test.mjs
git commit -m "benchmark-runner: store with fs fallback + tests"
```

---

## Task 3: Blob source branch in `lib/store.js`

**Files:**
- Modify: `lib/store.js` (implement `blobListRunIds`, `blobGetJson`, add `putRun`)

**Interfaces:**
- Consumes: `listRuns`/`getRun`/`getSuite` from Task 2.
- Produces: `putRun(run) -> Promise<{ url }>` (writes `runner/runs/<run.id>.json`, public, no random suffix).

Blob reads use the SDK `list`/`fetch`; this can't be unit-tested without a token, so verification is an env-gated integration check, not `node:test`.

- [ ] **Step 1: Implement the Blob branch**

```js
// add imports at top of lib/store.js:
import { list, put } from "@vercel/blob";

// replace the two stubs:
async function blobListRunIds() {
  const { blobs } = await list({ prefix: "runner/runs/", token: process.env.BLOB_READ_WRITE_TOKEN });
  return blobs
    .map((b) => b.pathname.replace(/^runner\/runs\//, "").replace(/\.json$/, ""))
    .filter(Boolean)
    .sort();
}

async function blobGetJson(pathname) {
  const { blobs } = await list({ prefix: pathname, token: process.env.BLOB_READ_WRITE_TOKEN });
  const hit = blobs.find((b) => b.pathname === pathname);
  if (!hit) return null;
  const res = await fetch(hit.url, { cache: "no-store" });
  return res.ok ? res.json() : null;
}

export async function putRun(run) {
  return put(`runner/runs/${run.id}.json`, JSON.stringify(run), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}
```

- [ ] **Step 2: Env-gated integration check (manual; only if a token is available)**

Run (with a real token):
```bash
BLOB_READ_WRITE_TOKEN=*** node -e "import('./lib/store.js').then(async s => { \
  await s.putRun({ id: 'smoke', base: 'smoke', aggregate: { gen: 1, mcq: 2 } }); \
  console.log(await s.getRun('smoke')); })"
```
Expected: prints `{ id: 'smoke', ... }`. If no token is available, skip and note it — the fs branch (Task 2) stays the tested path.

- [ ] **Step 3: Commit**

```bash
git add lib/store.js
git commit -m "benchmark-runner: blob source branch (list/get/put)"
```

---

## Task 4: Wire pages to the store with ISR

**Files:**
- Modify: `app/runner/page.jsx`, `app/runner/[id]/page.jsx`

**Interfaces:**
- Consumes: `store.listRuns`, `store.getRun`, `store.getSuite`, `store.listRunIds`; pure `boardRows`, `rankByGen`, `taskRows`, `pickBase` from `lib/runs.js`.

- [ ] **Step 1: Update the board page**

```jsx
// app/runner/page.jsx — replace the data lines
import { listRuns } from "../../lib/store";
import { boardRows, rankByGen } from "../../lib/runs";
// ...
export const revalidate = 300; // ISR: new runs appear within 5 min, no redeploy
export default async function Page() {
  const rows = rankByGen(boardRows(await listRuns()));
  // ...unchanged JSX...
}
```

- [ ] **Step 2: Update the run page**

```jsx
// app/runner/[id]/page.jsx — replace imports + data resolution
import { listRunIds, getRun, getSuite } from "../../../lib/store";
import { taskRows } from "../../../lib/runs";

export const revalidate = 300;
export async function generateStaticParams() {
  return (await listRunIds()).map((id) => ({ id }));
}
export default async function Page({ params }) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) notFound();
  const base = run.base && run.base !== run.id ? await getRun(run.base) : null;
  const suite = await getSuite(run.suite);
  const rows = taskRows(run, base);
  // ...unchanged JSX (replace the old baseOf/loadSuite calls)...
}
```

- [ ] **Step 3: Build to verify both routes prerender**

Run: `rm -rf .next && node_modules/.bin/next build`
Expected: build exits 0; `/runner` and `/runner/[id]` listed; 3 run pages prerendered (fs fallback, since no token locally).

- [ ] **Step 4: Commit**

```bash
git add app/runner/page.jsx "app/runner/[id]/page.jsx"
git commit -m "benchmark-runner: pages read from store + ISR"
```

---

## Task 5: `run/v1` validator + publish CLI

**Files:**
- Create: `lib/run-schema.js`, `scripts/publish-run.mjs`
- Test: `test/run-schema.test.mjs`

**Interfaces:**
- Produces: `validateRun(obj) -> { ok: boolean, errors: string[] }`.

- [ ] **Step 1: Write the failing test**

```js
// test/run-schema.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRun } from "../lib/run-schema.js";

const good = {
  schema: "run/v1", id: "x", model: { name: "X" }, suite: "open-pl-v1", base: "x",
  date: "2026-06-20", tasks: [{ id: "psc", gen: 1, mcq: 2, status: "ok" }],
  guards: [], aggregate: { gen: 1, mcq: 2, working_tasks: 1 },
};

test("accepts a well-formed run", () => {
  assert.equal(validateRun(good).ok, true);
});
test("rejects missing id and bad schema tag", () => {
  assert.equal(validateRun({ ...good, id: "" }).ok, false);
  assert.equal(validateRun({ ...good, schema: "nope" }).ok, false);
});
test("rejects a task missing required fields", () => {
  const bad = { ...good, tasks: [{ gen: 1 }] };
  assert.equal(validateRun(bad).ok, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/run-schema.test.mjs`
Expected: FAIL — `lib/run-schema.js` missing.

- [ ] **Step 3: Implement the validator**

```js
// lib/run-schema.js — minimal run/v1 validator (no deps).
export function validateRun(o) {
  const e = [];
  const id = /^[a-z0-9][a-z0-9._-]*$/;
  if (!o || typeof o !== "object") return { ok: false, errors: ["not an object"] };
  if (o.schema !== "run/v1") e.push("schema must be 'run/v1'");
  if (typeof o.id !== "string" || !id.test(o.id)) e.push("id must be a slug");
  if (!o.model || typeof o.model.name !== "string") e.push("model.name required");
  if (typeof o.suite !== "string") e.push("suite required");
  if (typeof o.base !== "string") e.push("base required");
  if (typeof o.date !== "string") e.push("date required");
  if (!Array.isArray(o.tasks)) e.push("tasks must be an array");
  else o.tasks.forEach((t, i) => {
    if (typeof t.id !== "string") e.push(`tasks[${i}].id required`);
    if (!("gen" in t) || !("mcq" in t)) e.push(`tasks[${i}] needs gen and mcq (number|null)`);
    if (!["ok", "broken", "pending"].includes(t.status)) e.push(`tasks[${i}].status invalid`);
  });
  if (!o.aggregate || !("gen" in o.aggregate) || !("mcq" in o.aggregate))
    e.push("aggregate needs gen and mcq");
  return { ok: e.length === 0, errors: e };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/run-schema.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Implement the publish CLI**

```js
// scripts/publish-run.mjs — node scripts/publish-run.mjs <path-to-run.json>
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

- [ ] **Step 6: Verify the CLI rejects bad input (no token needed)**

Run: `node scripts/publish-run.mjs public/results/runs/qwen3.5-9b.json`
Expected: prints `BLOB_READ_WRITE_TOKEN not set — refusing to publish` and exits 1 (validation passed, publish guarded).

- [ ] **Step 7: Commit**

```bash
git add lib/run-schema.js scripts/publish-run.mjs test/run-schema.test.mjs
git commit -m "benchmark-runner: run/v1 validator + publish CLI"
```

---

## Task 6: Submission API route

**Files:**
- Create: `app/api/runner/submit/route.js`

**Interfaces:**
- Consumes: `validateRun` (Task 5), `putRun` (Task 3).
- Produces: `POST /api/runner/submit` body `{ hfModel: string, base?: string, suite?: string }` → `201 { id }` or `400 { error }`.

This records a submission as a `queued` run stub (no scores yet). The GPU runner (Phase 3) later fills it in.

- [ ] **Step 1: Implement the route**

```js
// app/api/runner/submit/route.js
import { putRun, usingBlob } from "../../../../lib/store";
import { validateRun } from "../../../../lib/run-schema";

const HF = /^[\w.-]+\/[\w.-]+$/; // org/name

function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad json" }, { status: 400 }); }
  if (body?.trap) return Response.json({ id: "ok" }, { status: 201 }); // honeypot
  const hfModel = String(body?.hfModel || "").trim();
  if (!HF.test(hfModel)) return Response.json({ error: "hfModel must be org/name" }, { status: 400 });
  const id = `sub-${slug(hfModel)}-${Date.now().toString(36)}`;
  const run = {
    schema: "run/v1", id,
    model: { name: hfModel, params: null, org: hfModel.split("/")[0], kind: "submitted" },
    artifact: { adapter: null, host: null },
    suite: String(body?.suite || "open-pl-v1"),
    base: String(body?.base || "qwen3.5-9b"),
    date: new Date().toISOString().slice(0, 10),
    status: "queued", tasks: [], guards: [],
    aggregate: { gen: null, mcq: null, working_tasks: 0 },
  };
  const { ok, errors } = validateRun(run);
  if (!ok) return Response.json({ error: errors.join("; ") }, { status: 400 });
  if (!usingBlob()) return Response.json({ id, queued: false, note: "store offline (dev)" }, { status: 201 });
  await putRun(run);
  return Response.json({ id, queued: true }, { status: 201 });
}
```

- [ ] **Step 2: Build to verify the route compiles**

Run: `rm -rf .next && node_modules/.bin/next build`
Expected: exit 0; `ƒ /api/runner/submit` appears in the route list.

- [ ] **Step 3: Commit**

```bash
git add app/api/runner/submit/route.js
git commit -m "benchmark-runner: submission endpoint (queued run stub)"
```

---

## Task 7: Wire the submit form to the endpoint

**Files:**
- Modify: `app/runner/submit.jsx`

**Interfaces:**
- Consumes: `POST /api/runner/submit`.

- [ ] **Step 1: Make the form POST and show a result**

```jsx
// app/runner/submit.jsx — enable the form (keep the Discord note as fallback)
"use client";
import { useState } from "react";
export default function Submit() {
  const [v, setV] = useState(""); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  async function go(e) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/runner/submit", { method: "POST",
        headers: { "content-type": "application/json" }, body: JSON.stringify({ hfModel: v }) });
      const j = await r.json();
      setMsg(r.ok ? `zgłoszono: ${j.id}${j.queued ? "" : " (store offline)"}` : (j.error || "błąd"));
    } catch { setMsg("błąd sieci"); } finally { setBusy(false); }
  }
  // ...existing panel markup, but onSubmit={go}, input value/onChange bound to v,
  //    button disabled={busy || !v}, render {msg} below...
}
```

- [ ] **Step 2: Build + manual check**

Run: `node_modules/.bin/next build` then `next start`, POST a bad model:
```bash
curl -s -XPOST localhost:3000/api/runner/submit -H 'content-type: application/json' -d '{"hfModel":"nope"}'
```
Expected: `{"error":"hfModel must be org/name"}` (400). A valid `org/name` returns `201 { id, queued:false }` locally (no token).

- [ ] **Step 3: Commit**

```bash
git add app/runner/submit.jsx
git commit -m "benchmark-runner: wire submit form to endpoint"
```

---

## Task 8: Migrate seed runs to Blob + docs

**Files:**
- Modify: `docs/benchmark_runner/BENCHMARK_RUNNER.md` (Storage section), `.env.example` (create if absent)

- [ ] **Step 1: One-time seed upload (when a Blob store + token exist)**

```bash
for f in public/results/runs/*.json; do BLOB_READ_WRITE_TOKEN=*** node scripts/publish-run.mjs "$f"; done
for f in public/results/suites/*.json; do : ; done   # suites: add a publish-suite step or upload via dashboard
```
Note: keep the committed `public/results/runs/*.json` as the dev-fallback seed; Blob becomes the source of truth in prod once `BLOB_READ_WRITE_TOKEN` is set on Vercel.

- [ ] **Step 2: Document env + storage**

Add to `.env.example`:
```
# Vercel Blob (results store). Unset locally -> falls back to public/results files.
BLOB_READ_WRITE_TOKEN=
```
Add a short "Storage" paragraph to `BENCHMARK_RUNNER.md`: Blob layout, fs fallback, ISR window, public-only.

- [ ] **Step 3: Commit**

```bash
git add docs/benchmark_runner/BENCHMARK_RUNNER.md .env.example
git commit -m "benchmark-runner: document Blob storage + env"
```

---

## Phase 3 (next plan, not this one): GPU runner

Out of scope here — gated on external inputs, gets its own plan once these are decided:

- **Open decision — harness:** which single harness runs the suite (lm-eval-harness with PL tasks vs the in-house ollama scripts). Determines how `run/v1` is produced and the exact `open-pl-v1` task membership.
- **Open decision — GPU access:** provisioning via @Michał Warda; where the runner executes; how it authenticates to Blob (`BLOB_READ_WRITE_TOKEN`).
- **Scope:** consume `queued` submissions → run decon gate → run suite + EN guards → assemble `run/v1` → `putRun` → ISR surfaces it. Reuses `lib/run-schema.js` and `scripts/publish-run.mjs` from this phase.
- **Tier-A / private:** private benchmark results land in a private store; only aggregates ever cross into the public one. Separate, later.

---

## Self-Review

- **Spec coverage:** Blob store (Tasks 2–3), decouple-from-git/ISR (Task 4), public-only (Global Constraints + Task 3 `access:'public'`), submission (Tasks 6–7), publish path replacing git-commit (Task 5), dev fallback (Task 2). GPU runner explicitly deferred. ✓
- **Placeholder scan:** no TBD/TODO in implementable tasks; every code step shows real code. Phase 3 is labelled out-of-scope, not a placeholder task. ✓
- **Type consistency:** `boardRows`/`taskRows`/`guardStatus`/`pickBase` signatures match between `lib/runs.js` (Task 1), tests (Task 1), and page usage (Task 4). `validateRun -> {ok,errors}` consistent across Tasks 5–7. `putRun -> {url}` consistent Tasks 3, 5. `usingBlob()` used in Tasks 2, 5, 6. ✓
