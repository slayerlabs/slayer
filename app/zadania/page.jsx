import fs from "node:fs";
import path from "node:path";
import Board from "./board";

export const metadata = {
  title: "Zadania — od początkującego do zaawansowanego | Slayer",
  description: "Zadania dla kontrybutorów: od prostych (odpal benchmark, czyść dane) po zaawansowane (GRPO/RLVR, trening odmowy, tokenizer PL).",
};

// Read the Linear mirror at build time so the page renders real data with no
// client-side flash. Falls back to the board's demo data if the file is absent.
function loadData() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/results/zadania.json"), "utf8"));
    return j && Array.isArray(j.tasks) && j.tasks.length ? j : null;
  } catch {
    return null;
  }
}

export default function Zadania() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <Board initial={loadData()} />
    </>
  );
}
