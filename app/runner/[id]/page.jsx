import { notFound } from "next/navigation";
import { listRunIds, loadRun, baseOf, taskRows, loadSuite } from "../../../lib/runs";

export function generateStaticParams() {
  return listRunIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const run = loadRun(id);
  if (!run) return {};
  return { title: `${run.model.name} | Benchmark Runner | Slayer` };
}

const css = `
  .crumb{font-family:var(--mono);font-size:.74rem;letter-spacing:.08em}.crumb a{color:var(--acc);text-decoration:none}
  .stamp{border:1px solid var(--line2);border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01)),var(--panel);padding:18px 22px;margin:14px 0 24px}
  .stamp-row{display:flex;justify-content:space-between;align-items:baseline;gap:14px;flex-wrap:wrap;font-family:var(--mono);font-size:.7rem;letter-spacing:.14em;color:var(--dim)}
  .stamp-row .id{color:var(--acc)}
  .stamp h1{font-family:var(--serif);font-weight:400;font-size:clamp(1.5rem,3.4vw,2.2rem);letter-spacing:-.015em;line-height:1.15;margin:10px 0 2px;color:var(--ink)}
  .stamp-rule{border:0;border-top:1px solid var(--line2);margin:12px 0}
  .stamp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px 26px;font-family:var(--mono);font-size:.74rem}
  .stamp-grid .k{display:block;font-size:.64rem;letter-spacing:.14em;color:var(--dim);margin-bottom:3px}
  .stamp-grid .v{color:var(--txt)}

  .hl{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:0 0 14px}
  @media(max-width:560px){.hl{grid-template-columns:1fr}}
  .agg{border:1px solid var(--line);border-radius:var(--rad);background:#fff;padding:18px 20px;box-shadow:0 12px 34px rgba(35,36,48,.06)}
  .agg .k{font-family:var(--mono);font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
  .agg .big{font-family:var(--mono);font-weight:600;font-size:clamp(1.9rem,5vw,2.6rem);line-height:1.1;color:var(--ink);margin:6px 0 4px}
  .agg .d{font-family:var(--mono);font-size:.8rem}
  .d.up{color:var(--acc)}.d.down{color:#c0564a}.d.flat{color:var(--dim)}
  .hl-note{font-family:var(--mono);font-size:.7rem;letter-spacing:.04em;color:var(--dim);margin:0 0 22px}

  .guard{display:inline-block;font-family:var(--mono);font-size:.74rem;font-weight:600;padding:5px 12px;border-radius:5px;letter-spacing:.04em}
  .guard.ok{color:var(--acc);background:var(--acc-soft);border:1px solid rgba(90,99,192,.3)}
  .guard.fail{color:#c0564a;background:rgba(192,86,74,.08);border:1px solid rgba(192,86,74,.32)}
  .guard.na{color:var(--dim);background:var(--panel2);border:1px solid var(--line2)}
  .gstrip{margin:0 0 30px}

  .tag-st{display:inline-block;margin-left:8px;font-family:var(--mono);font-size:.6rem;letter-spacing:.06em;text-transform:uppercase;padding:1px 6px;border-radius:3px;vertical-align:middle}
  .tag-st.broken{color:#c0564a;background:rgba(192,86,74,.08);border:1px solid rgba(192,86,74,.3)}
  .tag-st.pending{color:var(--dim);background:var(--panel2);border:1px solid var(--line2)}
  .warn{color:#c0564a;font-weight:600}
  td.s .dcell{display:block;font-family:var(--mono);font-size:.72rem;font-weight:400;margin-top:3px}

  .sec-h{font-family:var(--mono);font-weight:600;font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;color:var(--acc);margin:0 0 12px}
`;

// "+x.x" / "−x.x" with up/down/flat class; "—" for null.
function deltaSpan(d, label) {
  if (d == null) return <span className="d flat">—</span>;
  const cls = d > 0 ? "up" : d < 0 ? "down" : "flat";
  const sign = d > 0 ? "+" : d < 0 ? "−" : "±";
  const txt = `${sign}${Math.abs(d).toFixed(1)}${label ? " " + label : ""}`;
  return <span className={"d " + cls}>{txt}</span>;
}

export default async function Page({ params }) {
  const { id } = await params;
  const run = loadRun(id);
  if (!run) notFound();

  const base = baseOf(run);
  const suite = loadSuite(run.suite);
  const rows = taskRows(run, base);

  const baseGen = base?.aggregate?.gen ?? null;
  const baseMcq = base?.aggregate?.mcq ?? null;
  const baseHasAgg = baseGen != null || baseMcq != null;
  const aggGen = run.aggregate?.gen ?? null;
  const aggMcq = run.aggregate?.mcq ?? null;

  const guards = run.guards || [];
  const guardFail = guards.some((g) => g.status === "fail");
  const broken = (run.tasks || []).filter((t) => t.status === "broken");

  const headDelta = (val, baseVal) => {
    if (!base) return <span className="d flat">model bazowy — Δ = 0</span>;
    if (!baseHasAgg) return <span className="d flat">baza nie przeszła harnessa — brak Δ</span>;
    if (val == null || baseVal == null) return <span className="d flat">—</span>;
    return deltaSpan(Math.round((val - baseVal) * 10) / 10, "vs baza");
  };

  const fmtNum = (n) => (n == null ? "—" : n.toFixed(1));

  return (
    <div className="sec page-top">
      <style>{css}</style>
      <div className="inner">
        <span className="crumb"><a href="/runner">← benchmark runner</a></span>

        {/* Provenance header */}
        <div className="stamp">
          <div className="stamp-row">
            <span className="id">SLAYER PROTOCOL · RAPORT RUN</span>
            <span className="id">{run.id}</span>
          </div>
          <h1>{run.model.name}</h1>
          <hr className="stamp-rule" />
          <div className="stamp-grid">
            <div><span className="k">ADAPTER</span><span className="v">{run.artifact?.adapter || "—"}</span></div>
            <div><span className="k">HOST</span><span className="v">{run.artifact?.host || "—"}</span></div>
            <div><span className="k">DATA</span><span className="v">{run.date}</span></div>
            <div><span className="k">SUITE</span><span className="v">{suite ? `${suite.label} · ${suite.status}` : run.suite}</span></div>
          </div>
        </div>

        {/* Headline aggregates */}
        <div className="hl">
          <div className="agg">
            <div className="k">Generatywny (exact_match)</div>
            <div className="big">{fmtNum(aggGen)}</div>
            {headDelta(aggGen, baseGen)}
          </div>
          <div className="agg">
            <div className="k">MCQ (acc)</div>
            <div className="big">{fmtNum(aggMcq)}</div>
            {headDelta(aggMcq, baseMcq)}
          </div>
        </div>
        <p className="hl-note">// dwa niezależne protokoły — generatywny i MCQ nie są porównywalne między sobą</p>

        {/* EN guard strip */}
        <div className="gstrip">
          {guards.length === 0 ? (
            <span className="guard na">guardy EN: brak (wkrótce)</span>
          ) : guardFail ? (
            <span className="guard fail">EN regresja: SPADEK</span>
          ) : (
            <span className="guard ok">EN regresja: OK</span>
          )}
        </div>

        {/* Per-task table */}
        <h2 className="sec-h">Wyniki per zadanie</h2>
        <div className="tbl">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th className="c">Generatywny</th>
                <th className="c">Δ</th>
                <th className="c">MCQ</th>
                <th className="c">Δ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const isBroken = t.status === "broken";
                return (
                  <tr key={t.id}>
                    <td>
                      <span className="dn">{t.label}</span>
                      {t.status !== "ok" && (
                        <span className={"tag-st " + t.status}>{t.status}</span>
                      )}
                    </td>
                    <td className="s">
                      {isBroken
                        ? <>{fmtNum(t.gen)} <span className="warn">⚠</span></>
                        : (t.gen == null ? "—" : t.gen.toFixed(1))}
                    </td>
                    <td className="s"><span className="dcell">{deltaSpan(t.dGen)}</span></td>
                    <td className="s">
                      {isBroken
                        ? <>{fmtNum(t.mcq)} <span className="warn">⚠</span></>
                        : (t.mcq == null ? "—" : t.mcq.toFixed(1))}
                    </td>
                    <td className="s"><span className="dcell">{deltaSpan(t.dMcq)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Broken-tasks callout */}
        {broken.length > 0 && (
          <div className="note">
            <p>
              <b>{run.aggregate?.working_tasks ?? "—"} działających zadań</b> w agregacie.
              {" "}Zepsute ({broken.length}): {broken.map((t) => t.label).join(", ")}.
              {" "}Zadania ze statusem <span className="warn">⚠</span> renderują się jawnie (0.0),
              ale są wyłączone z agregatu — transparentność jest cechą, nie błędem.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
