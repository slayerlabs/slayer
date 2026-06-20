// Server-only data layer for the Benchmark Runner (open-suite report).
// Spec: docs/benchmark_runner/BENCHMARK_RUNNER_DESIGN.md. Runs are static JSON in public/results/runs/.
// Δ is derived against the run named by each run's `base`. Read at build time.
import fs from "node:fs";
import path from "node:path";

const RUNS_DIR = path.join(process.cwd(), "public/results/runs");
const SUITES_DIR = path.join(process.cwd(), "public/results/suites");

export function listRunIds() {
  try {
    return fs
      .readdirSync(RUNS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

export function loadRun(id) {
  try {
    return JSON.parse(fs.readFileSync(path.join(RUNS_DIR, `${id}.json`), "utf-8"));
  } catch {
    return null;
  }
}

export function loadSuite(suiteId) {
  try {
    return JSON.parse(fs.readFileSync(path.join(SUITES_DIR, `${suiteId}.json`), "utf-8"));
  } catch {
    return null;
  }
}

export function allRuns() {
  return listRunIds()
    .map(loadRun)
    .filter(Boolean);
}

// null-safe delta in percentage points, rounded to 1 dp. null if either side missing.
export function delta(val, baseVal) {
  if (val == null || baseVal == null) return null;
  return Math.round((val - baseVal) * 10) / 10;
}

// One board row per run: aggregates + Δ vs its base run + guard light.
// Returns { run, base, gen, mcq, dGen, dMcq, guard } where guard is 'ok' | 'fail' | 'na'.
export function boardRows() {
  const runs = allRuns();
  const byId = Object.fromEntries(runs.map((r) => [r.id, r]));
  return runs.map((run) => {
    const base = run.base && run.base !== run.id ? byId[run.base] : null;
    const gen = run.aggregate?.gen ?? null;
    const mcq = run.aggregate?.mcq ?? null;
    return {
      run,
      base,
      gen,
      mcq,
      dGen: base ? delta(gen, base.aggregate?.gen ?? null) : null,
      dMcq: base ? delta(mcq, base.aggregate?.mcq ?? null) : null,
      guard: guardStatus(run, base, run.guard_eps),
    };
  });
}

// Default board order: generative aggregate desc, runs with no gen score sink to the bottom.
export function rankByGen(rows) {
  return [...rows].sort((a, b) => (b.gen ?? -Infinity) - (a.gen ?? -Infinity));
}

// Overall guard light for a run: 'fail' if any guard dropped > eps below base, 'na' if no guards.
export function guardStatus(run, base, eps = 1.0) {
  const guards = run.guards || [];
  if (!guards.length) return "na";
  if (!base) return "ok"; // no base to regress against yet
  const baseById = Object.fromEntries((base.guards || []).map((g) => [g.id, g]));
  for (const g of guards) {
    const b = baseById[g.id];
    if (g.gen == null || !b || b.gen == null) continue;
    if (g.gen < b.gen - eps) return "fail";
  }
  return "ok";
}

// Per-task rows for the run page: task + candidate gen/mcq + Δ vs base per protocol.
// Pass the run and (optionally) its resolved base run.
export function taskRows(run, base) {
  const baseTasks = Object.fromEntries((base?.tasks || []).map((t) => [t.id, t]));
  return (run.tasks || []).map((t) => {
    const b = baseTasks[t.id];
    return {
      ...t,
      dGen: b ? delta(t.gen, b.gen) : null,
      dMcq: b ? delta(t.mcq, b.mcq) : null,
    };
  });
}

// Resolve the base run object for a given run (null if it is its own base / missing).
export function baseOf(run) {
  if (!run?.base || run.base === run.id) return null;
  return loadRun(run.base);
}
