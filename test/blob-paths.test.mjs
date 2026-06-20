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
