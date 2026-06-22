#!/usr/bin/env node
// scripts/queue-get.mjs — get a single submission from a stage.
// Usage: queue-get.mjs <stage> <id>
// Prints JSON to stdout. Exits 1 if not found.
import { getSubmission } from "../lib/store.js";

const stage = process.argv[2];
const id = process.argv[3];
if (!stage || !id) {
  console.error("usage: queue-get.mjs <stage> <id>");
  process.exit(2);
}
const sub = await getSubmission(stage, id);
if (sub == null) {
  process.exit(1);
}
console.log(JSON.stringify(sub));
