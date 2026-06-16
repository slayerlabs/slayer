"use client";
import { useEffect, useState } from "react";

const META = {
  bielik: { name: "Bielik-11B-v3", tag: "punkt odniesienia", params: "11B" },
  qwen27b: { name: "Qwen3.5-27B", tag: "nasza baza", params: "27B" },
  qwen27b_local: { name: "Qwen3.5-27B", tag: "nasza baza", params: "27B" },
  slayer: { name: "Slayer-27B v3", tag: "nasz model", params: "27B" },
  slayer_v3: { name: "Slayer-27B v3", tag: "nasz model", params: "27B" },
  qwen9b: { name: "Qwen3.5-9B", tag: "", params: "9B" },
};
const meta = (k) => META[k] || { name: k, tag: "", params: "—" };

export default function PolNativeBoard() {
  const [d, setD] = useState(null);
  useEffect(() => {
    fetch("/results/polnative_v1.json?ts=" + Date.now())
      .then((r) => r.json())
      .then(setD)
      .catch(() => setD(false));
  }, []);
  if (d === false || (d && !d.results)) return null;

  const rows = d
    ? Object.entries(d.results)
        .map(([k, m]) => ({ k, ...meta(k), score: m.score.all, auto: m.score["tryb:auto"], judge: m.score["tryb:judge"] }))
        .sort((a, b) => b.score - a.score)
    : [];
  const max = rows.length ? Math.max(...rows.map((r) => r.score)) : 100;

  return (
    <div style={{ marginTop: "clamp(36px,6vw,56px)" }}>
      <style>{`
        .pnb-bar{display:block;height:6px;background:var(--sl-line);min-width:140px}
        .pnb-bar i{display:block;height:100%}
        @media(max-width:680px){.pnb-bar-cell{display:none}}
      `}</style>
      <div className="sl-eye">polnative · nasz benchmark</div>
      <h2 className="sl-h2" style={{ marginTop: 10 }}>Natywność <span className="sl-acc">polszczyzny.</span></h2>
      <p className="sl-lede" style={{ marginTop: 12 }}>Czy model pisze po polsku jak rodzimy użytkownik: fleksja, składnia, leksyka,
      frazeologia, literatura, realia, kalibracja, styl. 111 itemów, sędzia otwarty. Mierzy to,
      czego nie łapią benchmarki MCQ.</p>
      <p className="sl-lede" style={{ marginTop: 8, fontSize: 14.5 }}><span className="sl-status sl-ok">eval_only · czysto</span></p>

      {!d && <p className="sl-tele" style={{ marginTop: 18 }}>wczytuję…</p>}
      {d && (
        <table className="sl-tbl" style={{ marginTop: 18 }}>
          <thead><tr><th>model</th><th className="pnb-bar-cell"></th><th className="sl-c">wynik</th><th className="sl-c">auto · sędzia</th></tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const color = r.k.startsWith("slayer") ? "var(--good)" : i === 0 ? "var(--sl-acc)" : "var(--sl-dim)";
              const winner = i === 0 || r.k.startsWith("slayer");
              return (
                <tr key={r.k}>
                  <td className="sl-dn">
                    {r.name} {i === 0 && <span className="sl-acc">🥇</span>}
                    <div className="sl-fn" style={{ marginTop: 4 }}>{r.tag} · {r.params}</div>
                  </td>
                  <td className="pnb-bar-cell"><span className="pnb-bar"><i style={{ width: (r.score / max) * 100 + "%", background: color }} /></span></td>
                  <td className={"sl-s " + (winner ? "sl-win" : "")} style={{ fontSize: 18, fontWeight: 600 }}>{r.score.toFixed(1)}</td>
                  <td className="sl-s">{r.auto?.toFixed(0)} · {r.judge?.toFixed(0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="sl-fn" style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <span>skala 0–100 · pass=1, mixed=0.5, fail=0</span>
        <a href="/results/polnative_v1_report.html" target="_blank" rel="noopener" style={{ color: "var(--sl-acc)" }}>wizualny raport →</a>
        <a href="/results/polnative_strategy.html" target="_blank" rel="noopener" style={{ color: "var(--sl-acc)" }}>strategia SFT/CPT →</a>
      </p>
    </div>
  );
}
