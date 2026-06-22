#!/usr/bin/env node
// scripts/queue-claim.mjs — claim an approved submission (move approved -> running).
// Usage: queue-claim.mjs <id>
// Exit 0: claimed. Exit 3: not approved / lost race.
import { getSubmission, moveSubmission } from "../lib/store.js";

const id = process.argv[2];
if (!id) { console.error("usage: queue-claim.mjs <id>"); process.exit(2); }
const exists = await getSubmission("approved", id);
if (!exists) {
  console.error(`${id} not in approved (not approved or lost race)`);
  process.exit(3);
}
try {
  const obj = await moveSubmission("approved", "running", id);
  console.log("claimed", obj.id);
} catch (e) {
  console.error(e.message);
  process.exit(3);
}
