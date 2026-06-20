import fs from "node:fs";
import { putSuite, usingBlob } from "../lib/store.js";
const file = process.argv[2];
if (!file) { console.error("usage: publish-suite.mjs <suite.json>"); process.exit(2); }
const suite = JSON.parse(fs.readFileSync(file, "utf-8"));
if (typeof suite.id !== "string") { console.error("suite.id required"); process.exit(1); }
if (!usingBlob()) { console.error("BLOB_READ_WRITE_TOKEN not set — refusing to publish"); process.exit(1); }
const { url } = await putSuite(suite);
console.log("published suite", suite.id, "->", url);
