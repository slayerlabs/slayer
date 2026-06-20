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
