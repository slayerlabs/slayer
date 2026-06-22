#!/usr/bin/env node
// scripts/queue-list.mjs — list submission IDs in a given stage.
// Usage: queue-list.mjs <stage> [--json]
import { listSubmissions } from "../lib/store.js";

const stage = process.argv[2];
const json = process.argv.includes("--json");
if (!stage || !["queue", "approved", "running", "done", "failed"].includes(stage)) {
  console.error("usage: queue-list.mjs <queue|approved|running|done|failed> [--json]");
  process.exit(2);
}
const ids = await listSubmissions(stage);
if (json) {
  console.log(JSON.stringify(ids));
} else {
  if (ids.length === 0) console.log(`(no submissions in ${stage})`);
  else ids.forEach((id) => console.log(id));
}
