const SLUG = /^[a-z0-9][a-z0-9._-]*$/;
const HF = /^[\w.-]+\/[\w.-]+$/;

export function validateRun(o) {
  const e = [];
  if (!o || typeof o !== "object") return { ok: false, errors: ["not an object"] };
  if (o.schema !== "run/v1") e.push("schema must be 'run/v1'");
  if (typeof o.id !== "string" || !SLUG.test(o.id)) e.push("id must be a slug");
  if (!o.model || typeof o.model.name !== "string") e.push("model.name required");
  if (typeof o.suite !== "string") e.push("suite required");
  if (typeof o.base !== "string") e.push("base required");
  if (typeof o.date !== "string") e.push("date required");
  if (!Array.isArray(o.tasks)) e.push("tasks must be an array");
  else o.tasks.forEach((t, i) => {
    if (typeof t.id !== "string") e.push(`tasks[${i}].id required`);
    if (!("gen" in t) || !("mcq" in t)) e.push(`tasks[${i}] needs gen and mcq`);
    if (!["ok", "broken", "pending"].includes(t.status)) e.push(`tasks[${i}].status invalid`);
  });
  if (!o.aggregate || !("gen" in o.aggregate) || !("mcq" in o.aggregate)) e.push("aggregate needs gen and mcq");
  return { ok: e.length === 0, errors: e };
}

export function validateSubmission(o) {
  const e = [];
  if (!o || typeof o !== "object") return { ok: false, errors: ["not an object"] };
  if (o.schema !== "submission/v1") e.push("schema must be 'submission/v1'");
  if (typeof o.id !== "string" || !SLUG.test(o.id)) e.push("id must be a slug");
  if (typeof o.hfModel !== "string" || !HF.test(o.hfModel)) e.push("hfModel must be org/name");
  return { ok: e.length === 0, errors: e };
}
