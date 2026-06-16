"use client";
import { useEffect, useRef, useState } from "react";

const NB = "Bielik-11B-v3.0-Instruct";
const NQ = "Qwen3.5-9B";
const KEYL = { belebele: "Belebele (PL)", llmzszl: "LLMzSzŁ (full)", pes: "PES (medyczny, full)", poquad: "PoQuAD + sędzia", flores: "FLORES-200", include: "INCLUDE-44 (PL)", belebele_en: "Belebele (EN)", arc: "ARC-C (EN)", mmlu: "MMLU (EN)", gsm8k: "GSM8K (EN)" };
const STL = { done: "gotowe", running: "liczę…", queued: "w kolejce", fail: "błąd" };

const fmt = (s) => {
  s = Math.max(0, Math.round(s));
  if (s >= 3600) return Math.floor(s / 3600) + "h " + Math.round((s % 3600) / 60) + "m";
  if (s >= 60) return Math.floor(s / 60) + "m " + (s % 60) + "s";
  return s + "s";
};

export default function Console() {
  const [D, setD] = useState(null);
  const [fail, setFail] = useState(false);
  const atRef = useRef(0);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const load = () =>
      fetch("/results/status.json?ts=" + Date.now())
        .then((r) => r.json())
        .then((d) => { setD(d); atRef.current = Date.now() / 1000; setFail(false); })
        .catch(() => setFail(true));
    load();
    const t1 = setInterval(load, 15000);
    const t2 = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const srv = () => (D ? D.now_ts + (Date.now() / 1000 - atRef.current) : 0);
  const c = D?.current;
  const running = c && c.total;
  const pct = running ? Math.min(100, (c.done / c.total) * 100) : 0;
  const eta = running && c.eta_secs != null ? c.eta_secs - (srv() - D.now_ts) : null;
  const dl = D?.deadline_ts ? D.deadline_ts - srv() : null;
  const fa = D?.faza_a;
  const oeta = fa && fa.eta_secs != null ? fa.eta_secs - (srv() - D.now_ts) : null;
  const R = D?.results || [];

  return (
    <>
      <style>{`@media(max-width:780px){.sl-pgrid{grid-template-columns:1fr!important}}`}</style>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div className="sl-eye">pomiar — autonomiczna kolejka · simp / RTX 3090</div>
          <h2 className="sl-h2" style={{ marginTop: 12 }}>Konsola pomiaru</h2>
        </div>
        <span className="sl-status sl-run">{fail ? "brak danych" : D ? D.phase || "—" : "łączenie…"}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "clamp(20px,3vw,28px)" }} className="sl-pgrid">
        <div className="sl-art">
          <div className="sl-clbl">▸ aktualny benchmark</div>
          <div className="sl-h2" style={{ fontSize: "clamp(20px,2.6vw,26px)", marginBottom: 12 }}>{running ? c.label : D ? ((D.phase || "").includes("zakończ") ? "kolejka zakończona " : "przygotowanie…") : "—"}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 16px" }}>
            {running && c.model ? <span className="sl-chip sl-on">{c.model}</span> : null}
            {running && c.stage ? <span className="sl-chip sl-mute">{c.stage}</span> : null}
          </div>
          <div className="sl-bar">
            <div className="sl-bar-fill" style={{ width: pct + "%" }}></div>
            <span className="sl-bar-pct">{running ? pct.toFixed(0) + "%" : ""}</span>
          </div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="sl-num">{running ? c.done.toLocaleString("pl") : "—"}</span>
            <span className="sl-tele" style={{ marginTop: 0 }}>{running ? "/ " + c.total.toLocaleString("pl") + " pytań" : ""}</span>
          </div>
          <div className="sl-band" style={{ marginTop: 18, gridTemplateColumns: "repeat(2,1fr)" }}>
            <div className="sl-stat"><div className="sl-num sl-acc">{eta != null ? "≈ " + fmt(eta) : "—"}</div><div className="sl-slbl">ETA benchmarku</div></div>
            <div className="sl-stat"><div className="sl-num">{(running && c.rate_per_s) || "—"}</div><div className="sl-slbl">pyt/s</div></div>
          </div>
        </div>
        <div className="sl-art">
          <div className="sl-clbl">▸ wynik zbiorczy</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 14, margin: "10px 0 6px" }}>
            <span className="sl-num sl-acc">{D?.tally?.[NB] ?? 0}</span>
            <span className="sl-num" style={{ color: "var(--sl-dim)" }}>:</span>
            <span className="sl-num">{D?.tally?.[NQ] ?? 0}</span>
          </div>
          <div className="sl-tele" style={{ textAlign: "center", marginTop: 0 }}>Bielik-11B-v3 · Qwen3.5-9B</div>
          <div className="sl-band" style={{ marginTop: 18, gridTemplateColumns: "repeat(2,1fr)" }}>
            <div className="sl-stat"><div className="sl-num">{D?.benchmarks_done ?? 0}</div><div className="sl-slbl">benchmarków</div></div>
            <div className="sl-stat"><div className="sl-num sl-acc">{dl != null ? fmt(dl) : "—"}</div><div className="sl-slbl">do końca kolejki</div></div>
          </div>
        </div>
      </div>

      <div className="sl-art" style={{ marginTop: "clamp(20px,3vw,28px)" }}>
        <div className="sl-clbl">▸ postęp całości — faza A</div>
        <div className="sl-bar">
          <div className="sl-bar-fill" style={{ width: (fa ? fa.overall_pct : 0) + "%" }}></div>
          <span className="sl-bar-pct">{fa ? fa.overall_pct + "%" : ""}</span>
        </div>
        <div className="sl-band" style={{ marginTop: 18, gridTemplateColumns: "repeat(3,1fr)" }}>
          <div className="sl-stat"><div className="sl-num">{fa ? fa.done_jobs + " / " + fa.total_jobs : "—"}</div><div className="sl-slbl">ukończone</div></div>
          <div className="sl-stat"><div className="sl-num sl-acc">{oeta != null ? "≈ " + fmt(oeta) : "—"}</div><div className="sl-slbl">ETA fazy A</div></div>
          <div className="sl-stat"><div className="sl-num">{fa?.projected_done_ts ? new Date(fa.projected_done_ts * 1000).toLocaleTimeString("pl", { hour: "2-digit", minute: "2-digit" }) : "—"}</div><div className="sl-slbl">przewidywany koniec</div></div>
        </div>
      </div>

      <div className="sl-art" style={{ marginTop: "clamp(20px,3vw,28px)" }}>
        <div className="sl-clbl">▸ wyniki — ukończone benchmarki</div>
        {!R.length ? (
          <p className="sl-tele">pierwsze wyniki po&nbsp;ukończeniu benchmarków…</p>
        ) : (
          <table className="sl-tbl">
            <thead><tr><th>Benchmark</th><th className="sl-c">Bielik-11B-v3</th><th className="sl-c">Qwen3.5-9B</th><th className="sl-c">Wynik</th></tr></thead>
            <tbody>
              {R.map((r) => {
                const wb = r.winner === NB && r.margin > 0, wq = r.winner === NQ && r.margin > 0;
                const u = r.unit === "chrF" ? "" : "%";
                return (
                  <tr key={r.label}>
                    <td className="sl-dn">{r.label}<div className="sl-fn" style={{ marginTop: 4 }}>{(r.metric || "").replace(" (MCQ, exact letter)", "")} · n={r.n}{r.runs > 1 ? " · " + r.runs + " runów" : ""}</div></td>
                    <td className={"sl-s " + (wb ? "sl-win" : "")}>{r.bielik != null ? r.bielik + u : "—"}</td>
                    <td className={"sl-s " + (wq ? "sl-win" : "")}>{r.qwen != null ? r.qwen + u : "—"}</td>
                    <td className="sl-s">{r.bielik != null && r.qwen != null ? (wb ? <span className="sl-chip">▲ Bielik +{r.margin}</span> : wq ? <span className="sl-chip sl-mute">Qwen +{r.margin}</span> : <span className="sl-chip sl-mute">remis</span>) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="sl-art" style={{ marginTop: "clamp(20px,3vw,28px)" }}>
        <div className="sl-clbl">▸ pipeline — faza A</div>
        <div className="sl-steps sl-flat" style={{ marginTop: 4 }}>
          {(D?.jobs_faza_a || []).map((j) => {
            const stateClass = { done: "sl-done", running: "sl-run", queued: "sl-queued", fail: "sl-fail" }[j.state] || "";
            return (
              <div key={j.key || j.label} className="sl-step">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                  <span className={"sl-status " + stateClass}>{KEYL[j.key] || j.label}</span>
                  <span className={"sl-status " + stateClass}>{STL[j.state] || j.state}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="sl-fn" style={{ textAlign: "center", marginTop: 18 }}>
        {D ? "prawdziwe wartości · źródło: simp · stan z " + (D.now || "—") + " · publikacja co ~60 s" : "—"}
      </p>
    </>
  );
}
