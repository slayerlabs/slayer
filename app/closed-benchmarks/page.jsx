export const metadata = {
  title: "Benchmarki zamknięte | Slayer",
  description:
    "Benchmarki z niepublicznymi zbiorami testowymi — EQ-Bench, CPTUB, PLCC. Nie mierzymy ich, bo nie da się ich odtworzyć ani zweryfikować na otwartych danych.",
};

export default function ClosedBenchmarks() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">03</div>
            <div>
              <div className="sl-eye">poza zakresem pomiaru</div>
              <h1 className="sl-h1" style={{ marginTop: 10 }}>Benchmarki <span className="sl-acc">zamknięte</span></h1>
              <p className="sl-lede" style={{ marginTop: 12 }}>Tych benchmarków <b>nie mierzymy</b> — ich zbiory testowe nie&nbsp;są publicznie dostępne, więc nie&nbsp;da się ich odtworzyć ani&nbsp;uczciwie zweryfikować. Listujemy je&nbsp;jawnie. Pomiary publiczne: <a href="/leaderboard">leaderboard</a>.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">trzy benchmarki bez otwartych danych</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Czego nie&nbsp;da się <span className="sl-acc">zmierzyć i&nbsp;czemu.</span></h2>

          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ zamknięty</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Polish EQ-Bench</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Inteligencja emocjonalna.</p>
              <p className="sl-lede" style={{ fontSize: 14.5 }}><b>Dlaczego nie&nbsp;mierzymy:</b> brak publicznego zbioru pytań: zamknięty leaderboard, zestaw testowy held-out. Nie&nbsp;odtworzymy wyniku.</p>
              <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span className="sl-chip">EQ score</span>
                <span className="sl-chip">PL</span>
                <span className="sl-chip sl-mute">zbiór: niepubliczny</span>
              </div>
            </div>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ zamknięty</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>CPTUB</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Pragmatyka, implikatury, podchwytliwe pytania.</p>
              <p className="sl-lede" style={{ fontSize: 14.5 }}><b>Dlaczego nie&nbsp;mierzymy:</b> istnieje jako przestrzeń-leaderboard, ale&nbsp;bez pobieralnego datasetu. Nie&nbsp;powtórzymy ewaluacji na&nbsp;równych warunkach.</p>
              <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span className="sl-chip">accuracy</span>
                <span className="sl-chip">PL</span>
                <span className="sl-chip"><a href="https://huggingface.co/spaces/speakleash/cptu_bench" rel="noopener">leaderboard</a></span>
              </div>
            </div>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ zamknięty</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>PLCC</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Kompetencja kulturowo-językowa.</p>
              <p className="sl-lede" style={{ fontSize: 14.5 }}><b>Dlaczego nie&nbsp;mierzymy:</b> publiczne są jedynie <b>przykłady</b>; pełny zestaw 600 pytań trzymany prywatnie (anty-kontaminacja). Bez całości brak rzetelnego wyniku.</p>
              <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span className="sl-chip">accuracy</span>
                <span className="sl-chip">PL</span>
                <span className="sl-chip"><a href="https://huggingface.co/spaces/sdadas/plcc" rel="noopener">leaderboard</a></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">04</div>
            <div>
              <div className="sl-eye">zasada</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Mierzymy tylko to, <span className="sl-acc">co odtwarzalne.</span></h2>
            </div>
          </div>

          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-block">
              <div className="sl-clbl">▸ odtwarzalność ponad zasięg</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Jeśli nie&nbsp;możemy pobrać zbioru i&nbsp;powtórzyć runu, benchmark nie&nbsp;trafia na&nbsp;tablicę.</p>
            </div>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ równe warunki</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Porównanie ma&nbsp;sens tylko, gdy oba modele przechodzą identyczny, jawny test.</p>
            </div>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ otwarci na zmianę</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Gdy któryś zbiór zostanie udostępniony — przenosimy go&nbsp;na <a href="/leaderboard">leaderboard</a> i&nbsp;mierzymy.</p>
            </div>
          </div>

          <div className="sl-note" style={{ marginTop: 26 }}>
            <div className="sl-clbl">▸ masz dostęp do tych danych?</div>
            <p>Jeśli możesz legalnie udostępnić zbiór testowy lub&nbsp;harness, <a href="/zespol" style={{ fontWeight: 500 }}>odezwij się →</a></p>
          </div>
        </div>
      </section>
    </main>
  );
}
