"use client";
import { useEffect, useState } from "react";

const NB = "Bielik-11B-v3.0-Instruct";
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

  const b = d?.tally?.[NB] ?? 0;
  const q = d?.tally?.[NQ] ?? 0;
  const bs = d?.benchmarks || [];

  return (
    <>
      <p className="sl-tele" style={{ marginTop: 16 }}>{d ? "aktualizacja: " + (d.generated_at || "—") + " · źródło: simp (RTX 3090)" : "wczytuję…"}</p>

      <div className="sl-art" style={{ marginTop: 14 }}>
        <div className="sl-band" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
          <div className="sl-stat" style={{ textAlign: "center" }}>
            <span className="sl-sidx">punkt odniesienia</span>
            <div className="sl-num" style={{ color: b >= q && b > 0 ? "var(--sl-acc)" : undefined }}>{b}</div>
            <div className="sl-slbl">Bielik-11B-v3</div>
          </div>
          <div className="sl-stat" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="sl-num" style={{ color: "var(--sl-dim)" }}>:</span>
          </div>
          <div className="sl-stat" style={{ textAlign: "center" }}>
            <span className="sl-sidx">challenger</span>
            <div className="sl-num" style={{ color: q > b ? "var(--sl-acc)" : undefined }}>{q}</div>
            <div className="sl-slbl">Qwen3.5-9B</div>
          </div>
        </div>
        <div className="sl-art-meta" style={{ textAlign: "center", marginTop: 16 }}>{d ? <><b style={{ color: "var(--sl-ink)" }}>{b} : {q}</b> po {bs.length} benchmarkach</> : "—"}</div>
      </div>

      <div style={{ marginTop: 28 }}>
        {err && <div style={{ padding: 40, textAlign: "center" }} className="sl-tele">brak danych — odśwież</div>}
        {d && !bs.length && <div style={{ padding: 40, textAlign: "center" }} className="sl-tele">kolejka wystartowała — pierwsze wyniki za kilkanaście minut</div>}
        {bs.length > 0 && (
          <table className="sl-tbl">
            <thead><tr><th>Benchmark</th><th className="sl-c">Bielik-11B-v3</th><th className="sl-c">Qwen3.5-9B</th><th className="sl-c">Wynik</th></tr></thead>
            <tbody>
              {bs.map((p) => {
                const vb = val(p, NB), vq = val(p, NQ);
                const wb = p.winner === NB && p.margin > 0, wq = p.winner === NQ && p.margin > 0;
                const runs = p.runs > 1 ? ` · ${p.runs} runów` : "";
                const sub = (k) => (p.mean_across_runs?.[k] && p.runs > 1 ? <span className="sl-tele" style={{ display: "block" }}>śr {p.mean_across_runs[k]}</span> : null);
                return (
                  <tr key={p.benchmark}>
                    <td className="sl-dn">{LABEL[p.benchmark] || p.benchmark}<div className="sl-fn" style={{ marginTop: 4 }}>{p.metric || ""} · n={p.n}{runs}</div></td>
                    <td className={"sl-s " + (wb ? "sl-win" : "")}>{vb ?? "—"}{sub(NB)}</td>
                    <td className={"sl-s " + (wq ? "sl-win" : "")}>{vq ?? "—"}{sub(NQ)}</td>
                    <td className="sl-s">
                      {vb != null && vq != null
                        ? wb ? <span className="sl-chip">▲ Bielik +{p.margin}</span>
                          : wq ? <span className="sl-chip">Qwen +{p.margin}</span>
                          : <span className="sl-chip sl-mute">remis</span>
                        : <span className="sl-status sl-run">w toku</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="sl-lede" style={{ marginTop: 18, fontSize: 13 }}>
        {d ? <>Metryka per benchmark: accuracy (MCQ), trafność sędziego-LLM (PoQuAD), chrF (FLORES). Polski rdzeń + kontrola regresji EN. Wszystko publiczne, deterministyczne, liczone czysto. <a href="/benchmarks">metodologia →</a></> : null}
      </p>

      <div style={{ marginTop: "clamp(44px,6vw,70px)" }}>
        <div className="sl-eye">macierz</div>
        <h2 className="sl-h2" style={{ marginTop: 10 }}>Benchmarki × modele</h2>
        <p className="sl-lede" style={{ marginTop: 10, fontSize: 13 }}>sekcje rozdzielone per protokół — liczb między sekcjami nie porównujemy</p>
        {matrix === null && <p className="sl-tele" style={{ marginTop: 16 }}>wczytuję macierz…</p>}
        {matrix === false && <p className="sl-tele" style={{ marginTop: 16 }}>brak macierzy (results/matrix.json)</p>}
        {matrix && (
          <div>
            {(matrix.sections || []).map((s) => (
              <div key={s.title} style={{ margin: "32px 0" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                  <div className="sl-clbl" style={{ margin: 0 }}>{s.title}</div>
                  <span className="sl-tele">{s.protocol}</span>
                </div>
                <table className="sl-tbl">
                  <thead><tr><th>benchmark</th>{s.cols.map((c) => <th key={c} className="sl-c">{c}</th>)}</tr></thead>
                  <tbody>
                    {s.rows.map((r) => {
                      const max = Math.max(...r.vals.filter((x) => x != null));
                      return (
                        <tr key={r.name}>
                          <td className="sl-dn">{r.name}</td>
                          {r.vals.map((x, i) => (
                            <td key={i} className={"sl-s " + (x != null && x === max ? "sl-win" : "")}>
                              {x != null ? x : <span className="sl-chip sl-mute">wkrótce</span>}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {s.note ? <p className="sl-fn" style={{ margin: "10px 2px 0" }}>{s.note}</p> : null}
              </div>
            ))}
            <p className="sl-fn">stan: {matrix.updated} · crimson = najlepszy w wierszu (w obrębie protokołu)</p>
          </div>
        )}
      </div>
    </>
  );
}
