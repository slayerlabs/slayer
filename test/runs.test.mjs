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
