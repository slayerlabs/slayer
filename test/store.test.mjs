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
