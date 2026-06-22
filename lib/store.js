// lib/store.js — source for runs/suites/submissions. Blob in prod, fs in dev.
import fsp from "node:fs/promises";
import path from "node:path";
import { runPath, suitePath, queuePath, stagePath, idFromPath, publicUrl } from "./blob-paths.js";

const FS_ROOT = () => process.env.RUNNER_RESULTS_DIR || path.join(process.cwd(), "public/results");
// Blob requires BOTH: the write token AND the public base URL used for O(1) reads.
// Keying off the token alone would silently serve an empty board when the base is unset.
export function usingBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.NEXT_PUBLIC_BLOB_BASE);
}

async function fsJson(p) { try { return JSON.parse(await fsp.readFile(p, "utf-8")); } catch { return null; } }
async function urlJson(pathname) {
  try {
    // cache:"no-store" bypasses Next's data cache; the 60s blob Cache-Control (see wopts) keeps the CDN fresh.
    const res = await fetch(publicUrl(pathname), { cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

export async function listRunIds() {
  if (usingBlob()) {
    const { list } = await import("@vercel/blob"); // lazy: keep the fs path (and its unit test) stdlib-only
    const { blobs } = await list({ prefix: "runner/runs/", token: process.env.BLOB_READ_WRITE_TOKEN });
    return blobs.map((b) => idFromPath(b.pathname)).filter(Boolean).sort();
  }
  try {
    const files = await fsp.readdir(path.join(FS_ROOT(), "runs"));
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
  } catch { return []; }
}
export async function getRun(id) {
  return usingBlob() ? urlJson(runPath(id)) : fsJson(path.join(FS_ROOT(), "runs", `${id}.json`));
}
export async function getSuite(id) {
  return usingBlob() ? urlJson(suitePath(id)) : fsJson(path.join(FS_ROOT(), "suites", `${id}.json`));
}
export async function listRuns() {
  const ids = await listRunIds();
  return (await Promise.all(ids.map(getRun))).filter(Boolean);
}

// cacheControlMaxAge: 60 — without it the public URL is cached by the Blob CDN for 1 month,
// so overwrites (the whole point of allowOverwrite) + the GPU runner's publish→ISR loop never surface.
const wopts = () => ({ access: "public", addRandomSuffix: false, allowOverwrite: true,
  cacheControlMaxAge: 60, contentType: "application/json", token: process.env.BLOB_READ_WRITE_TOKEN });

async function putJson(pathname, obj) {
  if (usingBlob()) {
    const { put } = await import("@vercel/blob");
    return put(pathname, JSON.stringify(obj), wopts());
  }
  // fs branch: write JSON under FS_ROOT, mkdir -p as needed.
  const dest = path.join(FS_ROOT(), pathname.replace(/^runner\//, ""));
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.writeFile(dest, JSON.stringify(obj, null, 2));
  return { url: dest };
}

/** Delete a blob pathname (blob `del` when usingBlob, else fs `unlink` under FS_ROOT). */
export async function delBlob(pathname) {
  if (usingBlob()) {
    const { del } = await import("@vercel/blob");
    return del(publicUrl(pathname), { token: process.env.BLOB_READ_WRITE_TOKEN });
  }
  const target = path.join(FS_ROOT(), pathname.replace(/^runner\//, ""));
  try { await fsp.unlink(target); } catch (e) { if (e.code !== "ENOENT") throw e; }
}

export async function putRun(run) { return putJson(runPath(run.id), run); }
export async function putSuite(suite) { return putJson(suitePath(suite.id), suite); }
export async function enqueueSubmission(sub) { return putJson(queuePath(sub.id), sub); }

// --- Submission lifecycle helpers (prefix-based stages) ---

/** List submission IDs in a given stage. */
export async function listSubmissions(stage) {
  const prefix = `runner/${stage}/`;
  if (usingBlob()) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix, token: process.env.BLOB_READ_WRITE_TOKEN });
    return blobs.map((b) => idFromPath(b.pathname)).filter(Boolean).sort();
  }
  try {
    const dir = path.join(FS_ROOT(), stage);
    const files = await fsp.readdir(dir);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
  } catch { return []; }
}

/** Get a submission from a given stage. Returns the parsed object or null. */
export async function getSubmission(stage, id) {
  const pathname = stagePath(stage, id);
  return usingBlob() ? urlJson(pathname) : fsJson(path.join(FS_ROOT(), stage, `${id}.json`));
}

/** Move a submission between stages: put to dest, then delete src. Returns the moved object. Throws if src missing. */
export async function moveSubmission(fromStage, toStage, id) {
  const obj = await getSubmission(fromStage, id);
  if (!obj) throw new Error(`submission ${id} not found in ${fromStage}`);
  await putJson(stagePath(toStage, id), obj);
  await delBlob(stagePath(fromStage, id));
  return obj;
}
