// app/api/runner/submit/route.js
import { enqueueSubmission, usingBlob } from "../../../../lib/store.js";
import { validateSubmission } from "../../../../lib/run-schema.js";

const HF = /^[\w.-]+\/[\w.-]+$/;
const MAX_BODY = 2048; // bytes
const COOLDOWN_MS = 20_000;
// ponytail: per-instance in-memory cooldown; mirrors signup_server. Swap for KV if it must be global.
const seen = new Map();
// Collision-free id: slash is the only char in an HF name outside the SLUG set; map it to "--".
// (slug()-style collapsing made model.v2 / model-v2 / model_v2 all collide.)
const subId = (hf) => "sub-" + hf.toLowerCase().replace(/\//g, "--");

export async function POST(req) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
  const now = Date.now();
  if (seen.has(ip) && now - seen.get(ip) < COOLDOWN_MS)
    return Response.json({ error: "zwolnij — spróbuj za chwilę" }, { status: 429 });
  seen.set(ip, now);

  // Don't trust content-length (absent on chunked / spoofable). Read text with a hard byte ceiling.
  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf-8") > MAX_BODY) return Response.json({ error: "body too large" }, { status: 413 });

  let body;
  try { body = JSON.parse(raw); } catch { return Response.json({ error: "bad json" }, { status: 400 }); }
  if (body?.trap) return Response.json({ id: "ok" }, { status: 201 }); // honeypot

  const hfModel = String(body?.hfModel || "").trim();
  if (!HF.test(hfModel)) return Response.json({ error: "hfModel must be org/name" }, { status: 400 });

  const sub = {
    schema: "submission/v1", id: subId(hfModel), hfModel,
    base: String(body?.base || "qwen3.5-9b"), suite: String(body?.suite || "open-pl-v1"),
    status: "queued", requested_at: new Date().toISOString(),
  };
  const { ok, errors } = validateSubmission(sub);
  if (!ok) return Response.json({ error: errors.join("; ") }, { status: 400 });

  if (!usingBlob()) return Response.json({ id: sub.id, queued: false, note: "store offline (dev)" }, { status: 201 });
  await enqueueSubmission(sub);
  return Response.json({ id: sub.id, queued: true }, { status: 201 });
}
