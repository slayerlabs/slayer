// test/publish-run-local.test.mjs — verify --local flag fs-writes a run
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

test("publish-run.mjs --local writes run to FS_ROOT/runs/<id>.json", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pub-local-"));
  const runFile = path.join(dir, "input.json");
  const run = {
    schema: "run/v1",
    id: "local-test-run",
    model: { name: "test-model", hf: "org/test-model" },
    suite: "open-pl-v1",
    base: "qwen3.5-9b",
    date: "2025-01-01",
    tasks: [
      { id: "t1", gen: 0.5, mcq: 0.6, status: "ok" },
    ],
    aggregate: { gen: 0.5, mcq: 0.6 },
  };
  fs.writeFileSync(runFile, JSON.stringify(run));

  const resultsDir = path.join(dir, "results");
  try {
    execFileSync("node", ["scripts/publish-run.mjs", runFile, "--local"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        RUNNER_RESULTS_DIR: resultsDir,
        BLOB_READ_WRITE_TOKEN: "",  // ensure blob is OFF
        NEXT_PUBLIC_BLOB_BASE: "",
      },
      stdio: "pipe",
    });

    const outPath = path.join(resultsDir, "runs", "local-test-run.json");
    assert.ok(fs.existsSync(outPath), "run file should exist on disk");
    const written = JSON.parse(fs.readFileSync(outPath, "utf-8"));
    assert.equal(written.id, "local-test-run");
    assert.equal(written.schema, "run/v1");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("publish-run.mjs without --local and without token exits 1", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pub-notok-"));
  const runFile = path.join(dir, "input.json");
  const run = {
    schema: "run/v1",
    id: "no-token-run",
    model: { name: "test-model", hf: "org/test-model" },
    suite: "open-pl-v1",
    base: "qwen3.5-9b",
    date: "2025-01-01",
    tasks: [{ id: "t1", gen: 0.5, mcq: 0.6, status: "ok" }],
    aggregate: { gen: 0.5, mcq: 0.6 },
  };
  fs.writeFileSync(runFile, JSON.stringify(run));
  try {
    execFileSync("node", ["scripts/publish-run.mjs", runFile], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BLOB_READ_WRITE_TOKEN: "",
        NEXT_PUBLIC_BLOB_BASE: "",
      },
      stdio: "pipe",
    });
    assert.fail("should have exited non-zero");
  } catch (e) {
    assert.equal(e.status, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
