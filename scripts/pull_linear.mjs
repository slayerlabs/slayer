#!/usr/bin/env node
// Pull issues from Linear (team SLA) -> public/results/zadania.json in the shape
// app/zadania/board.jsx expects. Read-only mirror. No write-back.
//
// Run:  LINEAR_API_KEY=lin_api_... node scripts/pull_linear.mjs
// Build: hooked into `npm run build` (skips gracefully if no key / Linear down).
//
// Label conventions it understands (case-insensitive, optional):
//   tier:p | tier:s | tier:z        -> poziom (początkujący / średnio / zaawansowane)
//   eval dane kod trening infra strona -> tagi (others ignored)
// No tier label -> falls back to estimate buckets (<=2 p, <=5 s, else z), else p.

import { writeFile, mkdir } from "node:fs/promises";

const KEY = process.env.LINEAR_API_KEY;
const TEAM = process.env.LINEAR_TEAM || "SLA";
const OUT = new URL("../public/results/zadania.json", import.meta.url);

if (!KEY) {
  console.error("pull_linear: no LINEAR_API_KEY — skipping (board falls back to demo data).");
  process.exit(0); // ponytail: never fail the build over a missing key
}

const QUERY = `query Issues($key:String!,$after:String){
  issues(first:100, after:$after, includeArchived:false, filter:{ team:{ key:{ eq:$key } } }){
    pageInfo{ hasNextPage endCursor }
    nodes{
      number identifier title description estimate updatedAt
      state{ name type }
      assignee{ id name displayName }
      labels{ nodes{ name } }
      inverseRelations{ nodes{ type issue{ number } } }
    }
  }
}`;

async function gql(after) {
  const r = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: KEY },
    body: JSON.stringify({ query: QUERY, variables: { key: TEAM, after } }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data.issues;
}

const TAGS = new Set(["eval", "dane", "kod", "trening", "infra", "strona"]);
const PALETTE = ["#C15F3C", "#B07D2E", "#4F6E9A", "#7D5C9C", "#B24A33", "#C08A3E", "#3F8A82", "#6F8A3C", "#7E6BA6", "#4E8260"];
const RUNG = { 1: "Kontrybutor", 2: "Badacz", 3: "Maintainer" };

const initials = (name) => {
  const w = (name || "?").split(/[^a-zA-Z0-9]+/).filter(Boolean);
  return ((w[0]?.[0] || "?") + (w[1]?.[0] || w[0]?.[1] || "")).toUpperCase();
};

const levelOf = (labels, estimate) => {
  for (const l of labels) {
    const m = l.toLowerCase().match(/^tier[:\-/ ]?\s*([psz])\b/);
    if (m) return m[1];
    if (/początk/i.test(l)) return "p";
    if (/średnio|sredni/i.test(l)) return "s";
    if (/zaawans/i.test(l)) return "z";
  }
  if (estimate != null) return estimate <= 2 ? "p" : estimate <= 5 ? "s" : "z";
  return "p";
};

const statusOf = (state, hasAssignee) => {
  const name = (state?.name || "").toLowerCase();
  const type = state?.type;
  if (type === "completed") return "done";
  if (/review|przegl/.test(name)) return "review";
  if (type === "started") return "w-toku";
  return hasAssignee ? "wziete" : "wolne";
};

const PROGRESS = { wolne: 0, wziete: 0, "w-toku": 50, review: 95, done: 100 };

const relTime = (iso) => {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.round(ms / 3.6e6);
  if (h < 1) return "przed chwilą";
  if (h < 24) return h + " godz. temu";
  const d = Math.round(h / 24);
  return d === 1 ? "wczoraj" : d + " dni temu";
};

const ACTION = { done: "domknął zadanie", review: "zgłosił do review", "w-toku": "pracuje nad", wziete: "wziął na siebie", wolne: "otworzył" };

async function main() {
  let nodes = [], after = null;
  do {
    const page = await gql(after);
    nodes = nodes.concat(page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);

  nodes = nodes.filter((n) => n.state?.type !== "canceled");
  const have = new Set(nodes.map((n) => n.number));

  const people = {};
  const personId = (u) => {
    if (!u) return null;
    const id = u.id;
    if (!people[id]) {
      const idx = Object.keys(people).length;
      people[id] = { nick: u.displayName || u.name, initials: initials(u.displayName || u.name), color: PALETTE[idx % PALETTE.length], rung: 1, rungLabel: RUNG[1] };
    }
    return id;
  };

  const tasks = nodes.map((n) => {
    const labels = (n.labels?.nodes || []).map((l) => l.name);
    const assignee = personId(n.assignee);
    const status = statusOf(n.state, !!assignee);
    const level = levelOf(labels, n.estimate);
    const tags = labels.map((l) => l.toLowerCase()).filter((l) => TAGS.has(l));
    const deps = (n.inverseRelations?.nodes || []).filter((r) => r.type === "blocks" && r.issue && have.has(r.issue.number)).map((r) => r.issue.number);
    return {
      id: "i" + n.number, num: n.number, linear: n.identifier, title: n.title,
      level, tags, status, assignee,
      effort: n.estimate != null ? n.estimate + " pkt" : "—",
      progress: PROGRESS[status], dod: (n.description || "").split("\n")[0].slice(0, 280) || "Brak opisu w Linear.",
      deps, _updated: n.updatedAt,
    };
  });

  // bump people who carry a maintainer-tier task
  for (const t of tasks) if (t.level === "z" && t.assignee && people[t.assignee].rung < 2) people[t.assignee].rung = 2;

  const feed = [...tasks]
    .filter((t) => t.assignee)
    .sort((a, b) => new Date(b._updated) - new Date(a._updated))
    .slice(0, 6)
    .map((t) => ({ who: people[t.assignee].nick, a: t.assignee, action: ACTION[t.status], tid: t.id, time: relTime(t._updated) }));

  for (const t of tasks) delete t._updated;

  await mkdir(new URL("../public/results/", import.meta.url), { recursive: true });
  await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), team: TEAM, people, tasks, feed }, null, 2));
  console.error(`pull_linear: wrote ${tasks.length} tasks, ${Object.keys(people).length} people.`);
}

main().catch((e) => {
  console.error("pull_linear: failed —", e.message, "(board falls back to demo data).");
  process.exit(0); // never fail the build
});
