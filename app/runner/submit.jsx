"use client";
import { useState } from "react";

// Dummy submit form — placeholder until the GPU runner / submission API lands.
// Client component because server components can't carry an onSubmit handler.
const css = `
  .rsub{border:1px solid var(--line);border-radius:10px;background:linear-gradient(180deg,var(--panel),var(--bg2));padding:18px;margin:24px 0}
  .rsub form{display:flex;gap:10px;flex-wrap:wrap}
  .rsub input{flex:1;min-width:240px;padding:11px 13px;font-family:var(--mono);font-size:.86rem;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--ink)}
  .rsub button{padding:11px 18px;font-family:var(--mono);font-size:.82rem;font-weight:600;border:1px solid var(--line);border-radius:8px;background:var(--panel2);color:var(--dim);cursor:not-allowed;white-space:nowrap}
  .rsub .rnote{margin:12px 0 0;font-family:var(--mono);font-size:.74rem;color:var(--mut)}
  .rsub .rnote a{color:var(--acc)}
`;

export default function Submit() {
  const [v, setV] = useState("");
  return (
    <div className="rsub">
      <style>{css}</style>
      <form onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="np. speakleash/Bielik-11B-v3.0-Instruct"
        />
        <button type="submit" disabled title="runner GPU jeszcze nie podłączony">
          uruchom →
        </button>
      </form>
      <p className="rnote">
        // runner GPU w drodze — na razie zgłoś model na{" "}
        <a href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">
          Discordzie
        </a>
      </p>
    </div>
  );
}
