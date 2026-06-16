import fs from "node:fs";
import path from "node:path";

// Read at build → fully static HTML (crawlable). Pipeline pushes experiments.json → Vercel rebuild.
function loadExperiments() {
  try {
    const p = path.join(process.cwd(), "public/results/experiments.json");
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return { experiments: [], updated: "—" };
  }
}

export const metadata = {
  title: "Log eksperymentów | Slayer",
  description:
    "Uczciwy log eksperymentów Slayer: każdy model, co trenowane, na czym, z jakim wynikiem. Kontaminacja benchmarkowa oznaczona jawnie.",
};

const SRCLABEL = {
  style: "styl",
  klej_train_split: "KLEJ train",
  klej_synth: "KLEJ synth",
  replay: "replay",
  distill_pl: "destylacja PL",
  aya_pl: "Aya-PL",
  oasst_pl: "OASST-PL",
  en_retention: "EN retencja",
};

const imgBorder = { border: "1px solid var(--sl-line)" };
const monoLabel = {
  fontFamily: "var(--sl-mono)",
  fontSize: 10,
  letterSpacing: ".05em",
  textTransform: "uppercase",
  color: "var(--sl-dim)",
};
const fnLink = {
  fontFamily: "var(--sl-mono)",
  fontSize: 11,
  letterSpacing: ".05em",
  textTransform: "uppercase",
  color: "var(--sl-acc)",
};

function Divider({ children }) {
  return (
    <div className="sl-eye" style={{ marginTop: 22, display: "block" }}>
      {children}
    </div>
  );
}

function Card({ x, no }) {
  const clean = x.status === "clean";
  const ev = x.eval || {};
  const links = [
    x.hf ? (
      <a key="m" style={fnLink} href={`https://huggingface.co/${x.hf}`} rel="noopener">
        model ↗
      </a>
    ) : null,
    x.data_hf ? (
      <a key="d" style={fnLink} href={`https://huggingface.co/datasets/${x.data_hf}`} rel="noopener">
        dane ↗
      </a>
    ) : null,
    x.log ? (
      <a key="l" style={fnLink} href={x.log} rel="noopener">
        log ↗
      </a>
    ) : null,
    x.wandb ? (
      <a key="w" style={fnLink} href={x.wandb} rel="noopener">
        W&amp;B ↗
      </a>
    ) : null,
  ].filter(Boolean);

  return (
    <article className="sl-art" style={{ marginTop: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div className="sl-eye">
            {no} · {x.date}
          </div>
          <h2 className="sl-h2" style={{ marginTop: 12, fontSize: "clamp(20px,2.4vw,26px)" }}>
            {x.name}
          </h2>
          <div style={{ marginTop: 12 }}>
            {clean ? (
              <span className="sl-status sl-ok">czysty</span>
            ) : (
              <span className="sl-chip sl-warn">kontaminacja</span>
            )}
          </div>
        </div>
        {ev.macro != null && (
          <div style={{ textAlign: "right", flex: "0 0 auto" }}>
            <div className="sl-num sl-acc">{ev.macro}</div>
            <div className="sl-art-meta" style={{ marginTop: 8 }}>
              macro
              {ev.base_macro != null ? (
                <>
                  {" "}
                  · base {ev.base_macro} (Δ {(ev.macro - ev.base_macro).toFixed(1)})
                </>
              ) : (
                ""
              )}
            </div>
          </div>
        )}
      </div>

      <div className="sl-art-meta" style={{ marginTop: 18, lineHeight: 1.9 }}>
        baza <b style={{ color: "var(--sl-mut)" }}>{x.base}</b> &nbsp;·&nbsp; metoda{" "}
        <b style={{ color: "var(--sl-mut)" }}>{x.method}</b> &nbsp;·&nbsp;{" "}
        <b style={{ color: "var(--sl-mut)" }}>{(x.n_examples || 0).toLocaleString("pl")}</b> przykładów
        {ev.harness ? (
          <>
            {" "}
            &nbsp;·&nbsp; harness <b style={{ color: "var(--sl-mut)" }}>{ev.harness}</b>
          </>
        ) : null}
      </div>

      <Divider>skład danych</Divider>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {Object.entries(x.data || {}).map(([k, v]) => {
          const contam = k === "klej_train_split" || k === "klej_synth";
          return (
            <span key={k} className={"sl-chip" + (contam ? " sl-warn" : " sl-mute")}>
              {SRCLABEL[k] || k} {v}
            </span>
          );
        })}
      </div>

      {(x.dataset_desc || x.data_hf) && (
        <>
          <Divider>dataset</Divider>
          <div style={{ marginTop: 10 }}>
            {x.data_hf ? (
              <a
                className="sl-chip"
                style={{ textDecoration: "none" }}
                href={`https://huggingface.co/datasets/${x.data_hf}`}
                rel="noopener"
              >
                🤗 {x.data_hf} ↗
              </a>
            ) : null}
            {x.dataset_desc ? (
              <p className="sl-lede" style={{ fontSize: 14.5, marginTop: 10 }}>
                {x.dataset_desc}
              </p>
            ) : null}
          </div>
        </>
      )}

      {x.train_cfg && (
        <>
          <Divider>hiperparametry</Divider>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {Object.entries(x.train_cfg).map(([k, v]) => (
              <span key={k} className="sl-chip sl-mute">
                {k}: {String(v)}
              </span>
            ))}
          </div>
        </>
      )}

      {x.plot ? (
        <>
          <Divider>krzywa loss</Divider>
          <img
            src={x.plot}
            alt={`loss curve ${x.name}`}
            loading="lazy"
            style={{ ...imgBorder, width: "100%", maxWidth: 640, display: "block", marginTop: 10 }}
          />
        </>
      ) : null}

      {Array.isArray(x.plots) && x.plots.length ? (
        <>
          <Divider>wykresy</Divider>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
              gap: 12,
              marginTop: 10,
            }}
          >
            {x.plots.map((p, i) => (
              <figure key={i} style={{ margin: 0 }}>
                <img
                  src={p.src}
                  alt={p.cap || x.name}
                  loading="lazy"
                  style={{ ...imgBorder, width: "100%", display: "block", background: "#f6f3ec" }}
                />
                {p.cap ? (
                  <figcaption style={{ ...monoLabel, marginTop: 6, lineHeight: 1.4 }}>{p.cap}</figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </>
      ) : null}

      {x.early_stop ? (
        <p style={{ ...monoLabel, color: "var(--sl-acc)", marginTop: 14 }}>⏹ {x.early_stop}</p>
      ) : null}

      {x.log_note ? <p style={{ ...monoLabel, marginTop: 12, lineHeight: 1.6 }}>{x.log_note}</p> : null}

      {ev.tasks && (
        <>
          <Divider>eval (held-out)</Divider>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 22px", marginTop: 10 }}>
            {Object.entries(ev.tasks).map(([k, v]) => (
              <div key={k} style={{ flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ ...monoLabel, marginBottom: 4 }}>{k}</div>
                <div className="sl-lede" style={{ fontSize: 14.5, color: "var(--sl-ink)" }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {x.note ? (
        <div className="sl-note" style={{ marginTop: 22 }}>
          {x.note}
        </div>
      ) : null}

      {links.length ? (
        <div className="sl-fn" style={{ display: "flex", gap: 18, marginTop: 18 }}>
          {links}
        </div>
      ) : null}
    </article>
  );
}

export default function Eksperymenty() {
  const d = loadExperiments();
  const xs = (d?.experiments || [])
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-code"><b>eksperymenty</b><span>/ benchmarki</span></div>
            <div>
              <div className="sl-eye">log — co · na&nbsp;czym · z&nbsp;jakim wynikiem</div>
              <h1 className="sl-h1">
                Log <span className="sl-acc">eksperymentów</span>
              </h1>
              <p className="sl-lede">
                Każdy model jest tu z&nbsp;pełnym składem danych i&nbsp;wynikiem. Trening na&nbsp;train-splicie
                benchmarku oznaczamy <b>kontaminacją</b> — bo zawyża wynik i&nbsp;jest nieporównywalny z&nbsp;modelami
                liczonymi 5-shot. Realne twierdzenie stawiamy wyłącznie na&nbsp;<b>oficjalnym 5-shot leaderboardzie
                i&nbsp;MT-Bench-PL</b>.
              </p>
              <div style={{ ...monoLabel, marginTop: 22 }}>
                zaktualizowano {d?.updated || "—"} · {xs.length} eksperymentów
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">{xs.length}</div>
            <div>
              <div className="sl-eye">artefakty</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>
                Bieg po&nbsp;biegu, <span className="sl-acc">z&nbsp;rodowodem.</span>
              </h2>
              <p className="sl-lede" style={{ marginTop: 12 }}>
                Skład danych, hiperparametry, krzywe loss i&nbsp;eval held-out dla każdego runu. Bez wyników
                na&nbsp;słowo.
              </p>
            </div>
          </div>

          {xs.length ? (
            xs.map((x, i) => (
              <Card key={x.name + x.date} x={x} no={String(xs.length - i).padStart(2, "0")} />
            ))
          ) : (
            <p className="sl-lede" style={{ marginTop: 22 }}>
              brak eksperymentów
            </p>
          )}

          <p style={{ ...monoLabel, textAlign: "center", marginTop: 30 }}>
            {xs.length} eksperymentów · log auto-aktualizowany przez pipeline (pipeline/run_daily.py)
          </p>
        </div>
      </section>
    </main>
  );
}
