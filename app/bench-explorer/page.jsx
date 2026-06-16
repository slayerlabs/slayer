import Explorer from "./explorer";

export const metadata = {
  title: "Benchmarki — przeglądarka i zgłoszenia | Slayer",
  description: "Przeglądarka benchmarków Slayer: filtrowanie po typie zadania, kategorii, metryce, modelu i tagach. Eksport CSV, zgłaszanie nowych benchmarków przez PR.",
};

export default function BenchExplorer() {
  return (
    <main className="sl">
      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-code"><b>bench-explorer</b><span>/ benchmarki</span></div>
            <div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div className="sl-eye">benchmarki · katalog · filtrowanie · zgłoszenia</div>
                  <h1 className="sl-h1" style={{ marginTop: 12 }}>Przeglądarka <span className="sl-acc">benchmarków</span></h1>
                </div>
                <a className="sl-btn sl-btn-p" href="/bench-explorer/nowy">+ zgłoś benchmark</a>
              </div>
              <p className="sl-lede" style={{ maxWidth: "72ch", marginTop: 16 }}>
                Jedno źródło prawdy: <code>data/benchmarks.json</code>. Wyniki modeli pochodzą z{" "}
                <a href="/leaderboard">leaderboardu</a> (złączenie po&nbsp;id).
                Zgłoszenia przechodzą review jako pull request: status <b>draft</b> do&nbsp;czasu weryfikacji.
              </p>
            </div>
          </div>
          <Explorer />
        </div>
      </section>
    </main>
  );
}
