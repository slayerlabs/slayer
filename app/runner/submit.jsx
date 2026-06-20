"use client";
import { useState } from "react";

const css = `
  .rsub{border:1px solid var(--line);border-radius:10px;background:linear-gradient(180deg,var(--panel),var(--bg2));padding:18px;margin:24px 0}
  .rsub form{display:flex;gap:10px;flex-wrap:wrap}
  .rsub input{flex:1;min-width:240px;padding:11px 13px;font-family:var(--mono);font-size:.86rem;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--ink)}
  .rsub button{padding:11px 18px;font-family:var(--mono);font-size:.82rem;font-weight:600;border:1px solid var(--line);border-radius:8px;background:var(--panel2);color:var(--dim);cursor:pointer;white-space:nowrap}
  .rsub button:disabled{cursor:not-allowed;opacity:.6}
  .rsub .rnote{margin:12px 0 0;font-family:var(--mono);font-size:.74rem;color:var(--mut)}
  .rsub .rnote a{color:var(--acc)}
`;

export default function Submit() {
  const [v, setV] = useState("");
  const [trap, setTrap] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function go(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/runner/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hfModel: v, trap }),
      });
      const j = await r.json();
      setMsg(
        r.ok
          ? `zgłoszono: ${j.id}${j.queued === false ? " (store offline)" : ""}`
          : j.error || "błąd"
      );
    } catch {
      setMsg("błąd sieci");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rsub">
      <style>{css}</style>
      <form onSubmit={go}>
        <input
          type="text"
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="np. speakleash/Bielik-11B-v3.0-Instruct"
          aria-label="model HuggingFace"
        />
        {/* honeypot: hidden from humans, bots fill it */}
        <input
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
        />
        <button type="submit" disabled={busy || !v}>
          {busy ? "…" : "uruchom →"}
        </button>
        {msg && (
          <span
            className="mono dim"
            style={{ flexBasis: "100%", fontSize: ".74rem" }}
          >
            {msg}
          </span>
        )}
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
