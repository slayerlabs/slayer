"use client";
import { useEffect, useState } from "react";

const NB = "Bielik-11B-v3.0-Instruct";
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
  const wb = d?.tally?.[NB] ?? 0, wq = d?.tally?.[NQ] ?? 0;
  return (
    <div className="sl-art">
      <div className="sl-band" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <div className="sl-stat" style={{ textAlign: "center" }}>
          <span className="sl-sidx">punkt odniesienia</span>
          <div className="sl-num" style={{ color: wb >= wq && wb > 0 ? "var(--sl-acc)" : undefined }}>{d ? wb : "·"}</div>
          <div className="sl-slbl">Bielik-11B-v3</div>
        </div>
        <div className="sl-stat" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="sl-num" style={{ color: "var(--sl-dim)" }}>:</span>
        </div>
        <div className="sl-stat" style={{ textAlign: "center" }}>
          <span className="sl-sidx">challenger</span>
          <div className="sl-num" style={{ color: wq > wb ? "var(--sl-acc)" : undefined }}>{d ? wq : "·"}</div>
          <div className="sl-slbl">Qwen3.5-9B</div>
        </div>
      </div>
      <div className="sl-art-meta" style={{ textAlign: "center", marginTop: 16 }}>{d ? <><b style={{ color: "var(--sl-ink)" }}>{wb} : {wq}</b> po {(d.benchmarks || []).length} benchmarkach (live · {d.generated_at || ""})</> : "—"}</div>
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
    <div style={{ overflowX: "auto" }}>
      <table className="sl-tbl">
        <thead><tr><th>Benchmark</th><th className="sl-c">Bielik-11B-v3</th><th className="sl-c">Qwen3.5-9B</th><th className="sl-c">Wynik</th></tr></thead>
        <tbody>
          {ROWS.map((row) => {
            const b = by[row.id];
            const vb = b ? val(b, NB) : null, vq = b ? val(b, NQ) : null;
            const u = row.id === "flores" ? "" : "%";
            const xb = b && b.winner === NB && b.margin > 0, xq = b && b.winner === NQ && b.margin > 0;
            return (
              <tr key={row.id}>
                <td className="sl-dn"><a href={row.href} rel="noopener">{row.name}</a><div className="sl-fn" style={{ marginTop: 4 }}>{row.desc}</div></td>
                <td className={"sl-s " + (xb ? "sl-win" : "")}>
                  {b ? (vb != null ? vb + u : "—") : <span className="sl-tele">…</span>}
                </td>
                <td className={"sl-s " + (xq ? "sl-win" : "")}>
                  {b ? (vq != null ? vq + u : "—") : <span className="sl-tele">…</span>}
                </td>
                <td className="sl-s">
                  {b
                    ? xb ? <span className="sl-chip">▲ Bielik +{b.margin}</span>
                      : xq ? <span className="sl-chip">Qwen +{b.margin}</span>
                      : <span className="sl-chip sl-mute">remis</span>
                    : <span className="sl-status sl-run">w toku</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
