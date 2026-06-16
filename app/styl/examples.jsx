"use client";
import { useEffect, useState } from "react";

// Kolory dotów listy błędów = ta sama paleta co legenda i podświetlenia <mark>.
const DOT = {
  err: "#fb4d68",
  tmpl: "#e8b54a",
  calq: "#66a3d1",
  ph: "#d98c63",
};

const muted = { color: "var(--sl-dim)", fontStyle: "italic" };
const body = { color: "var(--sl-mut)", fontSize: 14.5, lineHeight: 1.66, wordBreak: "break-word" };
const bodyLead = { color: "var(--sl-ink)", fontSize: 15, lineHeight: 1.6, wordBreak: "break-word" };

export default function StyleExamples() {
  const [examples, setExamples] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch("/results/style_demo.json?ts=" + Date.now())
      .then((r) => r.json())
      .then((d) => setExamples(d.examples || []))
      .catch(() => setErr(true));
  }, []);

  if (err)
    return <p className="sl-lede" style={{ marginTop: 22 }}>Nie&nbsp;udało się wczytać przykładów.</p>;
  if (!examples)
    return (
      <p style={{ marginTop: 22, color: "var(--sl-dim)", fontFamily: "var(--sl-mono)", fontSize: 13, letterSpacing: ".04em" }}>
        wczytuję przykłady…
      </p>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 22 }}>
      {examples.map((e, i) => (
        <article className="sl-art" key={i}>
          {/* pola *_html pochodzą z results/style_demo.json (kurowane ręcznie) — renderujemy je jako HTML */}
          <div className="sl-clbl">▸ zadanie {String(i + 1).padStart(2, "0")}</div>
          <p style={{ color: "var(--sl-ink)", fontSize: 15, lineHeight: 1.55, margin: "0 0 4px" }}>
            <span dangerouslySetInnerHTML={{ __html: e.prompt }} />
          </p>

          {e.en_html ? (
            <div style={{ marginTop: 14 }}>
              <div className="sl-eye" style={{ display: "block", marginBottom: 6 }}>oryginał EN, z&nbsp;którego base kalkuje szablon</div>
              <div style={{ ...muted, fontSize: 13.5, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: e.en_html }} />
            </div>
          ) : null}

          <div className="sl-cols" style={{ marginTop: 18 }}>
            <div className="sl-col">
              <div className="sl-clbl">base · Qwen3.5-27B · z&nbsp;błędami</div>
              <div style={body} dangerouslySetInnerHTML={{ __html: e.base_html }} />
            </div>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">v1 · fine-tuned · natywny polski</div>
              <div style={bodyLead} dangerouslySetInnerHTML={{ __html: e.ep3_html }} />
            </div>
          </div>

          {e.errors && e.errors.length ? (
            <div style={{ marginTop: 18 }}>
              <div className="sl-eye" style={{ display: "block", marginBottom: 10 }}>
                błędy zaznaczone ręcznie ({e.errors.length})
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {e.errors.map((er, j) => (
                  <li key={j} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5, color: "var(--sl-mut)" }}>
                    <span style={{ flex: "0 0 auto", width: 8, height: 8, marginTop: 6, background: DOT[er.k] || DOT.err }} />
                    <span>
                      <code className="sl-kbd">{er.q}</code> → <span dangerouslySetInnerHTML={{ __html: er.fix }} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
