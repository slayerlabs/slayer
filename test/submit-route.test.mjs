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

test("valid submission returns 201 with correct id", async () => {
  const res = await POST(mkReq({ hfModel: "speakleash/Bielik-11B" }, "10.0.0.1"));
  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.id, "sub-speakleash--bielik-11b");
});

test("invalid hfModel returns 400", async () => {
  const res = await POST(mkReq({ hfModel: "nope" }, "10.0.0.2"));
  assert.equal(res.status, 400);
});

test("honeypot field returns 201 silently", async () => {
  const res = await POST(mkReq({ hfModel: "a/b", trap: "x" }, "10.0.0.3"));
  assert.equal(res.status, 201);
});

test("invalid request arms cooldown for subsequent valid request", async () => {
  const ip = "10.0.0.4";
  // First: invalid body → 400
  const r1 = await POST(mkReq({ hfModel: "nope" }, ip));
  assert.equal(r1.status, 400, "first request should be 400 (bad hfModel)");
  // Second: valid body from same IP → must be 429 (cooldown armed by invalid req)
  const r2 = await POST(mkReq({ hfModel: "speakleash/Bielik-11B" }, ip));
  assert.equal(r2.status, 429, "second request from same IP should be rate-limited");
});
