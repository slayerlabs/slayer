#!/usr/bin/env node
// scripts/publish-run.mjs — validate and publish a run/v1 JSON file.
// Usage: publish-run.mjs <run.json> [--local]
// --local: skip the blob token guard, fs-write via putRun (no Blob needed).
import fs from "node:fs";
import { validateRun } from "../lib/run-schema.js";
import { putRun, usingBlob } from "../lib/store.js";

const args = process.argv.slice(2);
const local = args.includes("--local");
const file = args.find((a) => a !== "--local");
if (!file) { console.error("usage: publish-run.mjs <run.json> [--local]"); process.exit(2); }
const run = JSON.parse(fs.readFileSync(file, "utf-8"));
const { ok, errors } = validateRun(run);
if (!ok) { console.error("invalid run/v1:\n - " + errors.join("\n - ")); process.exit(1); }
if (!local && !usingBlob()) { console.error("BLOB_READ_WRITE_TOKEN not set — refusing to publish (use --local for fs mode)"); process.exit(1); }
const { url } = await putRun(run);
console.log("published", run.id, "->", url);
