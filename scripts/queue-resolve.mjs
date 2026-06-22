#!/usr/bin/env node
// scripts/queue-resolve.mjs — resolve a running submission (move running -> done|failed).
// Usage: queue-resolve.mjs <id> done|failed
import { moveSubmission } from "../lib/store.js";

const id = process.argv[2];
const target = process.argv[3];
if (!id || !["done", "failed"].includes(target)) {
  console.error("usage: queue-resolve.mjs <id> done|failed");
  process.exit(2);
}
try {
  const obj = await moveSubmission("running", target, id);
  console.log("resolved", obj.id, "->", target);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
