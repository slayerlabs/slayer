// Pure compute for the Benchmark Runner. No I/O. Source is lib/store.js.
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
