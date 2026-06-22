// test/store.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Helper: set up a temp dir as FS_ROOT with no blob token, and return a fresh store import.
async function withFsStore(fn) {
  const saved = { tok: process.env.BLOB_READ_WRITE_TOKEN, dir: process.env.RUNNER_RESULTS_DIR };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "store-"));
  try {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.RUNNER_RESULTS_DIR = dir;
    // Each test needs a fresh import to pick up the env change.
    const q = `../lib/store.js?t=${Date.now()}-${Math.random()}`;
    const store = await import(q);
    assert.equal(store.usingBlob(), false);
    await fn(store, dir);
  } finally {
    if (saved.tok === undefined) delete process.env.BLOB_READ_WRITE_TOKEN; else process.env.BLOB_READ_WRITE_TOKEN = saved.tok;
    if (saved.dir === undefined) delete process.env.RUNNER_RESULTS_DIR; else process.env.RUNNER_RESULTS_DIR = saved.dir;
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("fs fallback reads runs and suites; getRun(missing) -> null", async () => {
  await withFsStore(async (store, dir) => {
    fs.mkdirSync(path.join(dir, "runs"), { recursive: true });
    fs.mkdirSync(path.join(dir, "suites"), { recursive: true });
    fs.writeFileSync(path.join(dir, "runs", "a.json"), JSON.stringify({ id: "a" }));
    fs.writeFileSync(path.join(dir, "suites", "s.json"), JSON.stringify({ id: "s" }));
    assert.deepEqual(await store.listRunIds(), ["a"]);
    assert.equal((await store.getRun("a")).id, "a");
    assert.equal((await store.getSuite("s")).id, "s");
    assert.equal(await store.getRun("missing"), null);
  });
});

test("putJson fs-writes and getRun reads it back", async () => {
  await withFsStore(async (store, dir) => {
    const run = { id: "test-run", schema: "run/v1", data: 42 };
    await store.putRun(run);
    // File should exist on disk
    const onDisk = JSON.parse(fs.readFileSync(path.join(dir, "runs", "test-run.json"), "utf-8"));
    assert.equal(onDisk.id, "test-run");
    assert.equal(onDisk.data, 42);
    // getRun should read it back
    const fetched = await store.getRun("test-run");
    assert.equal(fetched.id, "test-run");
    assert.equal(fetched.data, 42);
  });
});

test("delBlob removes a file in fs mode", async () => {
  await withFsStore(async (store, dir) => {
    // Write a file first
    await store.putRun({ id: "del-me" });
    assert.notEqual(await store.getRun("del-me"), null);
    // Delete it
    await store.delBlob("runner/runs/del-me.json");
    assert.equal(await store.getRun("del-me"), null);
    // Deleting a non-existent file should not throw
    await store.delBlob("runner/runs/nonexistent.json");
  });
});

test("enqueueSubmission fs-writes to queue dir", async () => {
  await withFsStore(async (store, dir) => {
    const sub = { id: "sub-1", schema: "submission/v1" };
    await store.enqueueSubmission(sub);
    const onDisk = JSON.parse(fs.readFileSync(path.join(dir, "queue", "sub-1.json"), "utf-8"));
    assert.equal(onDisk.id, "sub-1");
    // listSubmissions should see it
    const ids = await store.listSubmissions("queue");
    assert.deepEqual(ids, ["sub-1"]);
    // getSubmission should read it
    const fetched = await store.getSubmission("queue", "sub-1");
    assert.equal(fetched.id, "sub-1");
  });
});

test("moveSubmission: queue -> approved writes approved + deletes queue copy", async () => {
  await withFsStore(async (store, dir) => {
    const sub = { id: "sub-move", schema: "submission/v1", hfModel: "org/model" };
    await store.enqueueSubmission(sub);
    // Move queue -> approved
    const moved = await store.moveSubmission("queue", "approved", "sub-move");
    assert.equal(moved.id, "sub-move");
    assert.equal(moved.hfModel, "org/model");
    // Approved copy exists
    const approved = await store.getSubmission("approved", "sub-move");
    assert.equal(approved.id, "sub-move");
    // Queue copy gone
    const queued = await store.getSubmission("queue", "sub-move");
    assert.equal(queued, null);
  });
});

test("moveSubmission throws if source is missing", async () => {
  await withFsStore(async (store) => {
    await assert.rejects(
      () => store.moveSubmission("queue", "approved", "nonexistent"),
      /not found in queue/,
    );
  });
});

test("full claim-stage flow: queue -> approved -> running -> done", async () => {
  await withFsStore(async (store) => {
    const sub = { id: "flow-1", schema: "submission/v1" };
    await store.enqueueSubmission(sub);
    // approve
    await store.moveSubmission("queue", "approved", "flow-1");
    assert.equal(await store.getSubmission("queue", "flow-1"), null);
    assert.notEqual(await store.getSubmission("approved", "flow-1"), null);
    // claim (approved -> running)
    await store.moveSubmission("approved", "running", "flow-1");
    assert.equal(await store.getSubmission("approved", "flow-1"), null);
    assert.notEqual(await store.getSubmission("running", "flow-1"), null);
    // resolve done
    await store.moveSubmission("running", "done", "flow-1");
    assert.equal(await store.getSubmission("running", "flow-1"), null);
    assert.notEqual(await store.getSubmission("done", "flow-1"), null);
  });
});

test("listSubmissions returns empty for non-existent stage dir", async () => {
  await withFsStore(async (store) => {
    const ids = await store.listSubmissions("approved");
    assert.deepEqual(ids, []);
  });
});

test("moveSubmission to failed stage works", async () => {
  await withFsStore(async (store) => {
    await store.enqueueSubmission({ id: "fail-1", schema: "submission/v1" });
    await store.moveSubmission("queue", "approved", "fail-1");
    await store.moveSubmission("approved", "running", "fail-1");
    await store.moveSubmission("running", "failed", "fail-1");
    assert.equal(await store.getSubmission("running", "fail-1"), null);
    assert.notEqual(await store.getSubmission("failed", "fail-1"), null);
  });
});
