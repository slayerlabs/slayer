import fs from "node:fs";
import { validateRun } from "../lib/run-schema.js";
import { putRun, usingBlob } from "../lib/store.js";
const file = process.argv[2];
if (!file) { console.error("usage: publish-run.mjs <run.json>"); process.exit(2); }
const run = JSON.parse(fs.readFileSync(file, "utf-8"));
const { ok, errors } = validateRun(run);
if (!ok) { console.error("invalid run/v1:\n - " + errors.join("\n - ")); process.exit(1); }
if (!usingBlob()) { console.error("BLOB_READ_WRITE_TOKEN not set — refusing to publish"); process.exit(1); }
const { url } = await putRun(run);
console.log("published", run.id, "->", url);
