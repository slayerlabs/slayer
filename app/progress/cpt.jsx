"use client";
import { useEffect, useState } from "react";

const fmtTokens = (n) => {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(n >= 10_000_000_000 ? 0 : 2).replace(/\.00$/, "") + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 100_000_000 ? 0 : 1).replace(/\.0$/, "") + "M";
  return Math.round(n).toLocaleString("pl");
};

const FALLBACK = {
  goal: "CPT 2B high-quality tokens",
  target_tokens: 2_000_000_000,
  accepted_tokens: 10_000_000,
  accepted_documents: 92_000,
  updated_at: "2026-06-13",
  stage: "collection",
  token_budget: [
    { name: "Polski korpus domenowy", target_tokens: 1_000_000_000, accepted_tokens: 10_000_000, description: "Prawo, administracja, edukacja, gospodarka lokalna, dokumenty publiczne i dlugi ogon polskiej wiedzy." },
    { name: "Ogolny polski wysokiej jakosci", target_tokens: 500_000_000, accepted_tokens: 0, description: "Ksiazki, artykuly, poradniki, Wikipedia/encyklopedie po dedupie, materialy edukacyjne." },
    { name: "Replay europejski/angielski", target_tokens: 200_000_000, accepted_tokens: 0, description: "Retencja ogolnych kompetencji i ograniczenie zapominania." },
    { name: "Kod i dokumentacja", target_tokens: 200_000_000, accepted_tokens: 0, description: "Dokumentacja techniczna, kod, API, narzedzia i teksty strukturalne." },
    { name: "Math/reasoning/fakty weryfikowalne", target_tokens: 100_000_000, accepted_tokens: 0, description: "Material pod pozniejsze RLVR/GRPO i sanity-check reasoning." },
  ],
  next_milestones: [
    { tokens: 50_000_000, label: "pierwszy audyt miksu" },
    { tokens: 250_000_000, label: "maly CPT signal run" },
    { tokens: 1_000_000_000, label: "decyzja o pelnym 2B runie" },
    { tokens: 2_000_000_000, label: "CPT 2B ready" },
  ],
};

export default function CptProgress() {
  const [data, setData] = useState(FALLBACK);

  useEffect(() => {
    fetch("/results/cpt_progress.json?ts=" + Date.now())
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const target = data?.target_tokens || 2_000_000_000;
  const accepted = data?.accepted_tokens || 0;
  const pct = Math.min(100, (accepted / target) * 100);
  const remaining = Math.max(0, target - accepted);

  return (
    <div className="sl-art">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div className="sl-eye">qwen3.5-9b-base · high quality data</div>
          <h2 className="sl-h2" style={{ marginTop: 12 }}>{data?.goal || "CPT 2B high-quality tokens"}</h2>
        </div>
        <span className="sl-status sl-run">{data?.stage || "collection"}</span>
      </div>

      <div className="sl-bar">
        <div className="sl-bar-fill" style={{ width: pct + "%" }}></div>
        <span className="sl-bar-pct">{pct.toFixed(2)}%</span>
      </div>

      <div className="sl-band" style={{ marginTop: 18, gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="sl-stat"><div className="sl-num sl-acc">{fmtTokens(accepted)}</div><div className="sl-slbl">zaakceptowane tokeny</div></div>
        <div className="sl-stat"><div className="sl-num">{fmtTokens(target)}</div><div className="sl-slbl">cel smoke CPT</div></div>
        <div className="sl-stat"><div className="sl-num">{fmtTokens(remaining)}</div><div className="sl-slbl">brakuje</div></div>
        <div className="sl-stat"><div className="sl-num">{data?.accepted_documents ? data.accepted_documents.toLocaleString("pl") : "—"}</div><div className="sl-slbl">dokumenty seed</div></div>
      </div>

      <div className="sl-cols" style={{ marginTop: 18, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
        {(data?.token_budget || []).map((b) => {
          const bpct = Math.min(100, ((b.accepted_tokens || 0) / (b.target_tokens || 1)) * 100);
          return (
            <div className="sl-col" key={b.name}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", marginBottom: 10 }}>
                <div className="sl-pname" style={{ marginTop: 0, fontSize: 14 }}>{b.name}</div>
                <span className="sl-tele" style={{ marginTop: 0, whiteSpace: "nowrap" }}>{fmtTokens(b.accepted_tokens || 0)} / {fmtTokens(b.target_tokens || 0)}</span>
              </div>
              <div className="sl-bar" style={{ height: 8 }}>
                <div className="sl-bar-fill" style={{ width: bpct + "%" }}></div>
              </div>
              <p className="sl-lede" style={{ marginTop: 10, fontSize: 14, maxWidth: "none" }}>{b.description}</p>
            </div>
          );
        })}
      </div>

      <div className="sl-cols" style={{ marginTop: 18, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))" }}>
        {(data?.next_milestones || []).map((m) => {
          const done = accepted >= m.tokens;
          return (
            <div className="sl-col" key={m.tokens}>
              <div className="sl-clbl" style={{ marginBottom: 8 }}>{fmtTokens(m.tokens)}</div>
              {done
                ? <span className="sl-status sl-done">{m.label}</span>
                : <div className="sl-pname" style={{ marginTop: 0, fontSize: 14, color: "var(--sl-mut)" }}>{m.label}</div>}
            </div>
          );
        })}
      </div>

      <p className="sl-fn">
        Bramka wejścia: licencja, language ID, boilerplate removal, exact/near dedup, PII policy, contamination check, quality score i&nbsp;split holdout. Stan: {data?.updated_at || "—"}.
      </p>
    </div>
  );
}
