import { test } from "node:test";
import assert from "node:assert/strict";

// Ensure dev path (no real Blob writes).
delete process.env.BLOB_READ_WRITE_TOKEN;

const { POST } = await import("../app/api/runner/submit/route.js");

function mkReq(body, ip) {
  return new Request("http://x/api/runner/submit", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

test("bogus base returns 400", async () => {
  const res = await POST(mkReq({ hfModel: "a/b", base: "bogus" }, "10.1.0.1"));
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.match(json.error, /invalid base/);
});

test("bogus suite returns 400", async () => {
  const res = await POST(mkReq({ hfModel: "a/b", suite: "bogus" }, "10.1.0.2"));
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.match(json.error, /invalid suite/);
});

test("valid base + suite returns 201", async () => {
  const res = await POST(
    mkReq({ hfModel: "a/b", base: "qwen3.5-9b", suite: "open-pl-v1" }, "10.1.0.3"),
  );
  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.id, "sub-a--b");
});

test("defaults (no base/suite) returns 201", async () => {
  const res = await POST(mkReq({ hfModel: "a/b" }, "10.1.0.4"));
  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.id, "sub-a--b");
});
