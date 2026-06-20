// Pure path/url helpers for the Blob layout. No I/O.
export const runPath = (id) => `runner/runs/${id}.json`;
export const suitePath = (id) => `runner/suites/${id}.json`;
export const queuePath = (id) => `runner/queue/${id}.json`;
export const idFromPath = (p) => p.replace(/^runner\/[^/]+\//, "").replace(/\.json$/, "");
export function publicUrl(pathname, base = process.env.NEXT_PUBLIC_BLOB_BASE) {
  if (!base) throw new Error("NEXT_PUBLIC_BLOB_BASE is not set");
  return `${base.replace(/\/$/, "")}/${pathname}`;
}
