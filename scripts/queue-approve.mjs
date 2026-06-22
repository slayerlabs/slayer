#!/usr/bin/env node
// scripts/queue-approve.mjs — move a submission from queue to approved.
// Usage: queue-approve.mjs <id>
import { moveSubmission } from "../lib/store.js";

const id = process.argv[2];
if (!id) { console.error("usage: queue-approve.mjs <id>"); process.exit(2); }
try {
  const obj = await moveSubmission("queue", "approved", id);
  console.log("approved", obj.id);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
