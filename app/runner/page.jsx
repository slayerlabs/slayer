import Submit from "./submit";
import { boardRows, rankByGen } from "../../lib/runs";

export const metadata = {
  title: "Benchmark Runner | Slayer",
  description:
    "Wrzuć model, dostań wyniki — porównanie modeli na benchmarkach z publicznymi datasetami.",
};

const css = `
  .rtop{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap}
  .rtop h1{margin:10px 0 0;font-family:var(--serif);font-size:clamp(1.9rem,4.4vw,3rem);font-weight:400;letter-spacing:-.015em}
  .gdot{display:inline-block;width:9px;height:9px;border-radius:50%}
  .gdot.ok{background:#3a9a6b}
  .gdot.fail{background:#c0564a}
`;

// Δ in pp: green up, red down, dim zero. Nothing if null.
function Delta({ d }) {
  if (d == null) return null;
  const z = d === 0;
  const color = z ? "var(--dim)" : d > 0 ? "var(--acc)" : "#c0564a";
  const sign = d > 0 ? "+" : d < 0 ? "−" : "";
  return (
    <span className="sub" style={{ color }}>
      {sign}
      {Math.abs(d).toFixed(1)}
    </span>
  );
}

function Guard({ s }) {
  if (s === "na") return <span className="dim mono">—</span>;
  return <span className={"gdot " + s} title={s === "ok" ? "guardy OK" : "regresja EN"} />;
}

export default function Page() {
  const rows = rankByGen(boardRows());
  return (
    <div className="sec page-top">
      <style>{css}</style>
      <div className="inner">
        <div className="rtop">
          <div>
            <span className="kick">
              <span className="ac">BENCHMARK RUNNER</span> — modele × Open PL Suite
            </span>
            <h1>Wrzuć model, dostań wyniki</h1>
          </div>
          <span className="live"><span className="d"></span>PROTOTYP</span>
        </div>

        <Submit />

        <div className="tbl">
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th className="c">Generatywny</th>
                <th className="c">MCQ</th>
                <th className="c">Guardy</th>
                <th>Data</th>
                <th>Suite</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const m = row.run.model || {};
                const sub = [m.params, m.kind].filter(Boolean).join(" · ");
                const adapter = row.run.artifact?.adapter;
                return (
                  <tr key={row.run.id}>
                    <td>
                      <div className="dn">
                        <a href={"/runner/" + row.run.id}>{m.name}</a>
                      </div>
                      <div className="ds">
                        {sub}
                        {adapter ? " · " + adapter : ""}
                      </div>
                    </td>
                    <td className="s">
                      {row.gen ?? "—"}
                      <Delta d={row.dGen} />
                    </td>
                    <td className="s">
                      {row.mcq ?? "—"}
                      <Delta d={row.dMcq} />
                    </td>
                    <td className="s">
                      <Guard s={row.guard} />
                    </td>
                    <td className="mono dim">{row.run.date}</td>
                    <td className="mono dim">{row.run.suite}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="note">
          <p className="muted" style={{ margin: 0, fontSize: ".9rem" }}>
            Tylko benchmarki na publicznych datasetach. Ranking wg agregatu generatywnego
            (oficjalna miara jakości), Δ liczone vs Qwen3.5-9B. Dwa protokoły — generatywny
            (exact_match) i MCQ (acc) — są niezależne i nieporównywalne między sobą.{" "}
            <a href="/benchmarks" style={{ color: "var(--acc)" }}>metodologia →</a>
            <br />
            <span className="mono dim" style={{ fontSize: ".74rem" }}>
              ⚠ Liczby bazy (Qwen3.5-9B) i Bielika oraz guardów EN to dane poglądowe — placeholder
              do czasu realnego runu na GPU. Liczby kandydata pochodzą z realnego pomiaru.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
