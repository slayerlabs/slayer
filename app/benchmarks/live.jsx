"use client";
import { useEffect, useState } from "react";

const NQ = "Qwen3.5-9B";
const PRIMARY = { poquad: "judged_accuracy", llmzszl: "accuracy", belebele: "accuracy", pes: "accuracy", flores: "chrf_overall" };

const ROWS = [
  { id: "llmzszl", href: "https://huggingface.co/datasets/amu-cai/llmzszl-dataset", name: "LLMzSzŁ", desc: "egzaminy państwowe CKE · accuracy MCQ" },
  { id: "pes", href: "https://huggingface.co/datasets/speakleash/PES-2018-2022", name: "PES (medyczny)", desc: "egzaminy specjalizacyjne · accuracy" },
  { id: "poquad", href: "https://huggingface.co/datasets/clarin-pl/poquad", name: "PoQuAD", desc: "grounding / refusal · trafność (sędzia-LLM)" },
  { id: "belebele", href: "https://huggingface.co/datasets/facebook/belebele", name: "Belebele (PL)", desc: "reading comprehension · accuracy MCQ" },
  { id: "flores", href: "https://huggingface.co/datasets/openlanguagedata/flores_plus", name: "FLORES-200 (PL)", desc: "tłumaczenie PL↔ · chrF" },
];

const val = (b, n) => {
  const k = PRIMARY[b.benchmark] || "accuracy";
  const m = (b.models || []).find((x) => x.display_name === n);
  return m ? m[k] : null;
};

export function ScoreBoard() {
  const [d, setD] = useState(null);
  useEffect(() => {
    const load = () =>
      fetch("/results/leaderboard.json?ts=" + Date.now())
        .then((r) => r.json())
        .then(setD)
        .catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);
  const n = (d?.benchmarks || []).length;
  return (
    <div className="board">
      <div className="team"><div className="tg">model</div><div className="nm">Qwen3.5-9B</div></div>
      <div className="cnt">
        <span className="q" style={{ color: "var(--acc)" }}>{d ? n : "·"}</span>
      </div>
      <div className="team"><div className="tg">benchmarki</div><div className="nm">suita zewnętrzna</div></div>
      <div className="bfoot">{d ? <><b>{n}</b> benchmarków zmierzonych (live · {d.generated_at || ""})</> : "—"}</div>
    </div>
  );
}

export function StartingFive() {
  const [by, setBy] = useState({});
  useEffect(() => {
    const load = () =>
      fetch("/results/leaderboard.json?ts=" + Date.now())
        .then((r) => r.json())
        .then((d) => {
          const m = {};
          (d.benchmarks || []).forEach((b) => (m[b.benchmark] = b));
          setBy(m);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="tbl">
      <table>
        <thead><tr><th>Benchmark</th><th className="c">Qwen3.5-9B</th></tr></thead>
        <tbody>
          {ROWS.map((row) => {
            const b = by[row.id];
            const vq = b ? val(b, NQ) : null;
            const u = row.id === "flores" ? "" : "%";
            return (
              <tr key={row.id}>
                <td><div className="dn"><a href={row.href} rel="noopener">{row.name}</a></div><div className="ds">{row.desc}</div></td>
                <td className="score col-q">
                  {b ? (vq != null ? vq + u : "—") : <span className="muted mono">…</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
