"use client";
import { useEffect, useState } from "react";

const NQ = "Qwen3.5-9B";
const PRIMARY = { poquad: "judged_accuracy", llmzszl: "accuracy", belebele: "accuracy", pes: "accuracy", flores: "chrf_overall", include: "accuracy", belebele_en: "accuracy", mmlu: "accuracy", arc: "accuracy", gsm8k: "accuracy" };
const LABEL = { llmzszl: "LLMzSzŁ", pes: "PES (medyczny)", include: "INCLUDE-44 (PL)", belebele: "Belebele (PL)", poquad: "PoQuAD", flores: "FLORES-200 (PL↔EN)", belebele_en: "Belebele (EN)", arc: "ARC-C (EN)", mmlu: "MMLU (EN)", gsm8k: "GSM8K (EN)" };

const val = (p, n) => {
  const k = PRIMARY[p.benchmark] || "accuracy";
  const m = (p.models || []).find((x) => x.display_name === n);
  return m ? m[k] : null;
};

export default function LeaderboardLive() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(false);
  const [matrix, setMatrix] = useState(null);

  useEffect(() => {
    const load = () =>
      fetch("/results/leaderboard.json?ts=" + Date.now())
        .then((r) => r.json())
        .then((x) => { setD(x); setErr(false); })
        .catch(() => setErr(true));
    load();
    const t = setInterval(load, 45000);
    fetch("/results/matrix.json?ts=" + Date.now())
      .then((r) => r.json())
      .then(setMatrix)
      .catch(() => setMatrix(false));
    return () => clearInterval(t);
  }, []);

  const bs = d?.benchmarks || [];

  return (
    <>
      <p className="upd">{d ? "// aktualizacja: " + (d.generated_at || "—") + " · źródło: simp (RTX 3090)" : "wczytuję…"}</p>
      <div className="board">
        <div className="team"><div className="tg">model</div><div className="nm">Qwen3.5-9B</div></div>
        <div className="cnt">
          <span className="q" style={{ color: "var(--acc)" }}>{bs.length}</span>
        </div>
        <div className="team"><div className="tg">benchmarki</div><div className="nm">suita zewnętrzna</div></div>
        <div className="bfoot">{d ? <><b>{bs.length}</b> benchmarków zmierzonych</> : "—"}</div>
      </div>

      <div>
        {err && <div className="tbl"><div style={{ padding: 40, textAlign: "center" }} className="muted mono">brak danych — odśwież</div></div>}
        {d && !bs.length && <div className="tbl"><div style={{ padding: 40, textAlign: "center" }} className="muted mono">kolejka wystartowała — pierwsze wyniki za kilkanaście minut</div></div>}
        {bs.length > 0 && (
          <div className="tbl">
            <table>
              <thead><tr><th>Benchmark</th><th className="c">Qwen3.5-9B</th></tr></thead>
              <tbody>
                {bs.map((p) => {
                  const vq = val(p, NQ);
                  const runs = p.runs > 1 ? ` · ${p.runs} runów` : "";
                  const sub = (k) => (p.mean_across_runs?.[k] && p.runs > 1 ? <span className="sub">śr {p.mean_across_runs[k]}</span> : null);
                  return (
                    <tr key={p.benchmark}>
                      <td><div className="dn">{LABEL[p.benchmark] || p.benchmark}</div><div className="ds">{p.metric || ""} · n={p.n}{runs}</div></td>
                      <td className="s">{vq ?? "—"}{sub(NQ)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="note">
        <p className="muted" style={{ margin: 0, fontSize: ".9rem" }}>
          {d ? <>Metryka per benchmark: accuracy (MCQ), trafność sędziego-LLM (PoQuAD), chrF (FLORES). Polski rdzeń + kontrola regresji EN. Wszystko publiczne, deterministyczne, liczone czysto. <a href="/benchmarks" style={{ color: "var(--acc)" }}>metodologia →</a></> : null}
        </p>
      </div>

      <div style={{ marginTop: "clamp(44px,6vw,70px)" }}>
        <div className="ghead"><h2>Macierz: benchmarki × modele</h2><span className="c">sekcje rozdzielone per protokół — liczb między sekcjami nie porównujemy</span></div>
        {matrix === null && <div className="muted mono">wczytuję macierz…</div>}
        {matrix === false && <div className="muted mono">brak macierzy (results/matrix.json)</div>}
        {matrix && (
          <div>
            {(matrix.sections || []).map((s) => (
              <div key={s.title} style={{ margin: "26px 0" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontFamily: "var(--serif)", fontWeight: 400, fontSize: "1.3rem" }}>{s.title}</h3>
                  <span className="mono dim" style={{ fontSize: ".7rem", letterSpacing: ".04em" }}>{s.protocol}</span>
                </div>
                <div className="tbl">
                  <table>
                    <thead><tr><th>benchmark</th>{s.cols.map((c) => <th key={c} className="c">{c}</th>)}</tr></thead>
                    <tbody>
                      {s.rows.map((r) => {
                        const max = Math.max(...r.vals.filter((x) => x != null));
                        return (
                          <tr key={r.name}>
                            <td><div className="dn">{r.name}</div></td>
                            {r.vals.map((x, i) => (
                              <td key={i} className={"s " + (x != null && x === max ? "win" : "")}>
                                {x != null ? x : <span className="dim">wkrótce</span>}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {s.note ? <p className="muted" style={{ fontSize: ".84rem", margin: "8px 2px 0" }}>{s.note}</p> : null}
              </div>
            ))}
            <p className="mono dim" style={{ fontSize: ".7rem" }}>stan: {matrix.updated} · złote pole = najlepszy w wierszu (w obrębie protokołu)</p>
          </div>
        )}
      </div>
    </>
  );
}
