import Board from "./board";

export const metadata = {
  title: "Zadania — od początkującego do zaawansowanego | Slayer",
  description: "Zadania dla kontrybutorów: od prostych (odpal benchmark, czyść dane) po zaawansowane (GRPO/RLVR, trening odmowy, tokenizer PL).",
};

export default function Zadania() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <Board />
    </>
  );
}
