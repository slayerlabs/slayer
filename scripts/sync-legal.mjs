import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const source = process.env.FABRYKA_LEGAL_SNAPSHOT
  || path.resolve(process.cwd(), "../fabryka-legal/dist/slayer/legal-content.json");
const target = path.resolve(process.cwd(), "legal/generated/legal-content.json");
const snapshot = JSON.parse(await readFile(source, "utf8"));

if (snapshot.schema_version !== 1 || snapshot.product !== "slayer" || !snapshot.documents) {
  throw new Error("Invalid Fabryka Legal snapshot");
}

await mkdir(path.dirname(target), { recursive: true });
await copyFile(source, target);
console.log(`Synced ${Object.keys(snapshot.documents).length} legal documents from ${source}`);
