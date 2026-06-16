"use client";
import { useEffect, useState } from "react";

const fmtTok = (n) => {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(n % 1_000_000_000 ? 1 : 0).replace(/\.0$/, "") + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return String(Math.round(n));
};
const MIES = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.getDate() + " " + MIES[d.getMonth()];
};

const FALLBACK = {
  target_tokens: 2_000_000_000,
  history: [
    { date: "2026-06-11", accepted_tokens: 0, event: "start zbiórki" },
    { date: "2026-06-13", accepted_tokens: 10_000_000, event: "seed corpus" },
  ],
};

const MILESTONES = [
  { tokens: 50_000_000, label: "50M · audyt miksu" },
  { tokens: 250_000_000, label: "250M · signal run" },
  { tokens: 1_000_000_000, label: "1B · decyzja o pełnym runie" },
  { tokens: 2_000_000_000, label: "2B · CPT ready" },
];

// skala log: 1M (podłoga) -> 2B; wartości poniżej podłogi siadają na osi
const FLOOR = 1_000_000;

export default function CptHistory() {
  const [data, setData] = useState(FALLBACK);

  useEffect(() => {
    fetch("/results/cpt_progress_history.json?ts=" + Date.now())
      .then((r) => r.json())
      .then((d) => d && Array.isArray(d.history) && d.history.length && setData(d))
      .catch(() => {});
  }, []);

  const target = data.target_tokens || 2_000_000_000;
  const rows = [...data.history].sort((a, b) => (a.date < b.date ? -1 : 1));
  const last = rows[rows.length - 1];
  const pct = (100 * (last?.accepted_tokens || 0)) / target;

  // tempo: okno do 7 dni wstecz od ostatniego punktu
  const tLast = Date.parse(last.date);
  const winStart = rows.filter((r) => tLast - Date.parse(r.date) <= 7 * 86400e3 && r !== last);
  const ref = winStart.length ? winStart[0] : rows.length > 1 ? rows[rows.length - 2] : null;
  let rate = null; // tok/dzień
  if (ref) {
    const days = Math.max(1, (tLast - Date.parse(ref.date)) / 86400e3);
    rate = (last.accepted_tokens - ref.accepted_tokens) / days;
  }
  const daysLeft = rate > 0 ? (target - last.accepted_tokens) / rate : null;
  const eta = daysLeft && daysLeft < 1825 ? new Date(tLast + daysLeft * 86400e3) : null;

  // geometria
  const W = 920, H = 300, L = 14, R = 150, T = 18, B = 34;
  const x0 = Date.parse(rows[0].date);
  const x1 = Math.max(Date.now(), tLast) + 2 * 86400e3;
  const X = (iso) => L + ((Date.parse(iso) - x0) / Math.max(x1 - x0, 86400e3)) * (W - L - R);
  const lgF = Math.log10(FLOOR), lgT = Math.log10(target);
  const Y = (tok) => {
    const v = Math.max(tok, FLOOR);
    return T + (1 - (Math.log10(v) - lgF) / (lgT - lgF)) * (H - T - B);
  };

  const pts = rows.map((r) => [X(r.date), Y(r.accepted_tokens)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L ${pts[pts.length - 1][0].toFixed(1)} ${H - B} L ${pts[0][0].toFixed(1)} ${H - B} Z`;

  // ticki dat: pierwszy, ostatni snapshot, dziś
  const ticks = [...new Set([rows[0].date, last.date])];

  return (
    <div className="sl-art">
      <style>{`
        .hx-head{display:flex;align-items:baseline;gap:22px;flex-wrap:wrap;margin-bottom:14px}
        .hx-pct{font-family:var(--sl-sans);font-weight:600;letter-spacing:-.035em;line-height:.85;font-size:clamp(40px,6vw,60px);color:var(--sl-acc)}
        .hx-kv{font-family:var(--sl-mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--sl-dim)}
        .hx-kv b{display:block;font-family:var(--sl-sans);font-size:18px;color:var(--sl-ink);font-weight:600;margin-top:6px;text-transform:none;letter-spacing:-.01em}
        .hx-svg{width:100%;height:auto;display:block}
        .hx-ml{font-family:var(--sl-mono);font-size:10.5px;fill:var(--sl-dim)}
        .hx-tick{font-family:var(--sl-mono);font-size:10.5px;fill:var(--sl-dim)}
        .hx-ev{font-family:var(--sl-mono);font-size:10px;fill:var(--sl-mut)}
      `}</style>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div className="sl-eye">droga&nbsp;do 2B — postęp&nbsp;w czasie</div>
        <span className="sl-status sl-run">aktualizacja przy&nbsp;każdym przyjętym pakiecie</span>
      </div>
      <div className="hx-head">
        <div className="hx-pct">{pct < 10 ? pct.toFixed(2) : pct.toFixed(1)}%</div>
        <div className="hx-kv">zebrane<b>{fmtTok(last.accepted_tokens)} / {fmtTok(target)}</b></div>
        <div className="hx-kv">tempo<b>{rate > 0 ? fmtTok(rate) + "/dzień" : "—"}</b></div>
        <div className="hx-kv">2B przy&nbsp;tym tempie<b>{eta ? fmtDate(eta.toISOString().slice(0, 10)) + " " + eta.getFullYear() : "—"}</b></div>
      </div>

      <svg className="hx-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Postęp zbiórki tokenów CPT w czasie, skala logarytmiczna">
        {/* szczeble: kamienie milowe na skali log */}
        {MILESTONES.map((m) => {
          const y = Y(m.tokens);
          const done = last.accepted_tokens >= m.tokens;
          return (
            <g key={m.tokens}>
              <line x1={L} x2={W - R + 8} y1={y} y2={y}
                stroke={done ? "var(--sl-acc)" : "var(--sl-line)"} strokeOpacity={done ? ".55" : ".7"}
                strokeDasharray={done ? "" : "3 5"} />
              <text className="hx-ml" x={W - R + 14} y={y + 3.5}
                fill={done ? "var(--sl-acc)" : "var(--sl-dim)"}>{m.label}</text>
            </g>
          );
        })}

        {/* oś czasu */}
        <line x1={L} x2={W - R + 8} y1={H - B} y2={H - B} stroke="var(--sl-line)" />
        {ticks.map((d) => (
          <text key={d} className="hx-tick" x={X(d)} y={H - B + 16} textAnchor="middle">{fmtDate(d)}</text>
        ))}

        {/* przebieg */}
        <path d={area} fill="var(--sl-acc-soft)" />
        <path d={line} fill="none" stroke="var(--sl-acc)" strokeWidth="2" strokeLinejoin="round" />

        {/* punkty + eventy */}
        {rows.map((r, i) => {
          const [px, py] = pts[i];
          const isLast = i === rows.length - 1;
          return (
            <g key={r.date}>
              <circle cx={px} cy={py} r={isLast ? 4.5 : 3}
                fill={isLast ? "var(--sl-acc)" : "var(--sl-bg)"} stroke="var(--sl-acc)" strokeWidth="1.5">
                <title>{`${fmtDate(r.date)} — ${fmtTok(r.accepted_tokens)} tok${r.event ? " · " + r.event : ""}`}</title>
              </circle>
              {r.event && (
                <text className="hx-ev" x={px + 7} y={py - 8}>{r.event}</text>
              )}
            </g>
          );
        })}
      </svg>

      <p className="sl-fn">Skala logarytmiczna (1M → 2B): na&nbsp;starcie każdy pakiet widać, a&nbsp;szczeble 50M / 250M / 1B / 2B
        pokazują, ile drabiny zostało. Licznik rośnie wyłącznie o&nbsp;dokumenty, które przeszły bramki jakości
        (dedup, filtr, decon) — surowe pobrania nie&nbsp;są wliczane.</p>
    </div>
  );
}
