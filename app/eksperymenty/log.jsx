// Server component (no "use client"): rendered statically at build so crawlers get full HTML.
const SRCLABEL = { style: "styl", klej_train_split: "KLEJ train", klej_synth: "KLEJ synth", replay: "replay", distill_pl: "destylacja PL", aya_pl: "Aya-PL", oasst_pl: "OASST-PL", en_retention: "EN retencja" };

// (Usunięty inline-SVG Chart — krzywe loss są teraz wyłącznie matplotlib PNG via x.plot.)

function Card({ x }) {
  const clean = x.status === "clean";
  const ev = x.eval || {};
  const links = [
    x.hf ? <a key="m" href={`https://huggingface.co/${x.hf}`} rel="noopener">model ↗</a> : null,
    x.data_hf ? <a key="d" href={`https://huggingface.co/datasets/${x.data_hf}`} rel="noopener">dane ↗</a> : null,
    x.log ? <a key="l" href={x.log} rel="noopener">log ↗</a> : null,
    x.wandb ? <a key="w" href={x.wandb} rel="noopener">W&amp;B ↗</a> : null,
  ].filter(Boolean);
  return (
    <div className="xp">
      <div className="xp-top">
        <span className="xp-date">{x.date}</span>
        <span className="xp-name">{x.name}</span>
        {clean ? <span className="badge clean">CZYSTY</span> : <span className="badge contaminated">KONTAMINACJA</span>}
        {ev.macro != null && (
          <div className="xp-macro">{ev.macro}<span className="d"> macro{ev.base_macro != null ? ` · base ${ev.base_macro} (Δ ${(ev.macro - ev.base_macro).toFixed(1)})` : ""}</span></div>
        )}
      </div>
      <div className="xp-bd">
        <div className="meta">
          <span>baza <b>{x.base}</b></span>
          <span>metoda <b>{x.method}</b></span>
          <span><b>{(x.n_examples || 0).toLocaleString("pl")}</b> przykładów</span>
          {ev.harness ? <span>harness <b>{ev.harness}</b></span> : null}
        </div>
        <div className="secline">skład danych</div>
        <div className="chips">
          {Object.entries(x.data || {}).map(([k, v]) => {
            const contam = k === "klej_train_split" || k === "klej_synth";
            return <span key={k} className={"chip " + (contam ? "contam" : "")}>{SRCLABEL[k] || k} {v}</span>;
          })}
        </div>
        {(x.dataset_desc || x.data_hf) && (
          <>
            <div className="secline">dataset</div>
            <div className="dataset">
              {x.data_hf ? <a className="dspill" href={`https://huggingface.co/datasets/${x.data_hf}`} rel="noopener">🤗 {x.data_hf} ↗</a> : null}
              {x.dataset_desc ? <div className="dsdesc">{x.dataset_desc}</div> : null}
            </div>
          </>
        )}
        {x.train_cfg && (
          <>
            <div className="secline">hiperparametry</div>
            <div className="chips">{Object.entries(x.train_cfg).map(([k, v]) => <span key={k} className="chip">{k}: {String(v)}</span>)}</div>
          </>
        )}
        {x.plot ? (
          <>
            <div className="secline">krzywa loss</div>
            <img className="lossimg" src={x.plot} alt={`loss curve ${x.name}`} loading="lazy" />
          </>
        ) : null}
        {Array.isArray(x.plots) && x.plots.length ? (
          <>
            <div className="secline">wykresy</div>
            <div className="gallery">
              {x.plots.map((p, i) => (
                <figure key={i} className="gfig">
                  <img className="gimg" src={p.src} alt={p.cap || x.name} loading="lazy" />
                  {p.cap ? <figcaption>{p.cap}</figcaption> : null}
                </figure>
              ))}
            </div>
          </>
        ) : null}
        {x.early_stop ? <div className="xp-es">⏹ {x.early_stop}</div> : null}
        {x.log_note ? <div className="muted mono" style={{ fontSize: ".72rem" }}>{x.log_note}</div> : null}
        {ev.tasks && (
          <>
            <div className="secline">eval (held-out)</div>
            <div className="tasks">
              {Object.entries(ev.tasks).map(([k, v]) => <div key={k} className="t"><div className="k">{k}</div><div className="v">{v}</div></div>)}
            </div>
          </>
        )}
        <div className="xp-note">{x.note}</div>
        {links.length ? <div className="xp-links">{links}</div> : null}
      </div>
    </div>
  );
}

export default function ExperimentLog({ d }) {
  const xs = (d?.experiments || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div><span className="kick"><span className="ac">LOG</span> — eksperymenty · co · na czym · z jakim wynikiem</span><h1>Log eksperymentów</h1></div>
        <span className="live"><span className="d"></span><span>{"zaktualizowano " + (d?.updated || "—")}</span></span>
      </div>

      <div className="banner">
        <b>Uczciwa zasada:</b> każdy model jest tu z pełnym składem danych i wynikiem. Trening na train-splicie
        benchmarku oznaczamy <b style={{ color: "#C1121F" }}>KONTAMINACJA</b> — bo zawyża wynik i jest nieporównywalny
        z modelami liczonymi 5-shot. Iterujemy na otwartych benchmarkach i prywatnych proxy setach; zamknięty leaderboard
        może być tylko końcowym zewnętrznym sprawdzeniem, nie gate'em treningowym.
      </div>

      <div className="log">
        {xs.length ? xs.map((x) => <Card key={x.name + x.date} x={x} />) : <div className="muted mono">brak eksperymentów</div>}
      </div>

      <p className="muted mono" style={{ textAlign: "center", fontSize: ".78rem", marginTop: 22 }}>
        {xs.length + " eksperymentów · log auto-aktualizowany przez pipeline (pipeline/run_daily.py)"}
      </p>
    </>
  );
}
