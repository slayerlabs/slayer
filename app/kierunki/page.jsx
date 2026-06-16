export const metadata = {
  title: "Kierunki modelu | Slayer",
  description:
    "Lista kierunków dla modelu: prawniczy, medyczny, agentowy, administracja, RAG, edukacyjny i więcej. Gdzie polski model ma realny moat.",
};

export default function Kierunki() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">12</div>
            <div>
              <div className="sl-eye">pomysły do decyzji</div>
              <h1 className="sl-h1" style={{ marginTop: 12 }}>Jakim modelem <span className="sl-acc">ma być Slayer?</span></h1>
              <p className="sl-lede" style={{ marginTop: 18 }}>Polski model 11–14B wygrywa tam, gdzie ma <b>moat</b>: polskie dane, których nie&nbsp;ma globalna konkurencja. Ocena moatu jest wstępna — weryfikujemy ją&nbsp;pomiarem na&nbsp;<a href="/leaderboard">leaderboardzie</a>.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-note" style={{ marginBottom: 30 }}>
            <div className="sl-clbl">◆ decyzja (Faza 0)</div>
            <p><b>baza = Qwen3.5-9B</b> — wg <a href="/leaderboard">leaderboardu</a> bije Bielika 8:1, w&nbsp;tym na&nbsp;większości osi polskich. Bielik wygrywa tylko <b>LLMzSzŁ</b> (egzaminy państwowe/zawodowe). Stąd kierunek: <b>specjalizacja prawno-urzędowa</b> na&nbsp;bazie Qwen — celowana w&nbsp;LLMzSzŁ i&nbsp;przepisy. <a href="/datasety">dane pod LLMzSzŁ →</a></p>
          </div>

          <div className="sl-mast">
            <div className="sl-mast-no">01</div>
            <div>
              <div className="sl-eye">wąska wiedza · wysoki moat</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Specjalizacje <span className="sl-acc">domenowe.</span></h2>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-block">
              <div className="sl-clbl">▸ prawniczy</div>
              <span className="sl-chip">moat wysoki</span>
              <h3 className="sl-h2" style={{ fontSize: 17, margin: "10px 0 7px" }}>Prawniczy</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Analiza umów, pisma, orzecznictwo, przepisy (KC/KPC/KK).</p>
              <p className="sl-fn">dane — ISAP, SAOS, wzory pism &nbsp;·&nbsp; eval — legal QA + reasoning</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ medyczny</div>
              <span className="sl-chip">moat wysoki</span>
              <h3 className="sl-h2" style={{ fontSize: 17, margin: "10px 0 7px" }}>Medyczny</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Wsparcie kliniczne, PES/LEK, streszczanie dokumentacji.</p>
              <p className="sl-fn">dane — egzaminy PES/LEK, ChPL &nbsp;·&nbsp; eval — PES leaderboard</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ finansowo-podatkowy</div>
              <span className="sl-chip">moat wysoki</span>
              <h3 className="sl-h2" style={{ fontSize: 17, margin: "10px 0 7px" }}>Finansowo-podatkowy</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Interpretacje podatkowe, faktury, JPK, KPiR.</p>
              <p className="sl-fn">dane — interpretacje KIS, ustawy &nbsp;·&nbsp; eval — QA + dokładność liczb</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ administracja publiczna</div>
              <span className="sl-chip">moat wysoki</span>
              <h3 className="sl-h2" style={{ fontSize: 17, margin: "10px 0 7px" }}>Administracja publiczna</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>ZUS, US, urzędy, wnioski. Przekład „urzędowego&rdquo; na&nbsp;ludzki.</p>
              <p className="sl-fn">dane — gov.pl, druki, ePUAP &nbsp;·&nbsp; eval — benchmark biurokracji</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">02</div>
            <div>
              <div className="sl-eye">przekrojowe · moat niższy</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Zdolności <span className="sl-acc">horyzontalne.</span></h2>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ agentowy / tool-use</div>
              <span className="sl-chip sl-warn">moat średni</span>
              <h3 className="sl-h2" style={{ fontSize: 17, margin: "10px 0 7px" }}>Agentowy / tool-use</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Function calling, planowanie, orkiestracja, RAG po&nbsp;polsku.</p>
              <p className="sl-fn">eval — tool-use + instrukcyjność</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ rag / enterprise</div>
              <span className="sl-chip sl-warn">moat średni</span>
              <h3 className="sl-h2" style={{ fontSize: 17, margin: "10px 0 7px" }}>RAG / enterprise</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Odpowiedzi z&nbsp;firmowych dokumentów z&nbsp;cytatem, on-prem.</p>
              <p className="sl-fn">eval — rozumienie tekstu + faithfulness</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ tłumaczeniowy</div>
              <span className="sl-chip sl-warn">moat średni</span>
              <h3 className="sl-h2" style={{ fontSize: 17, margin: "10px 0 7px" }}>Tłumaczeniowy PL↔</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Tłumaczenia wysokiej jakości — oś, gdzie polskie modele są&nbsp;mocne.</p>
              <p className="sl-fn">eval — FLORES-200 (BLEU/chrF)</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ coding</div>
              <span className="sl-chip sl-mute">moat niski</span>
              <h3 className="sl-h2" style={{ fontSize: 17, margin: "10px 0 7px" }}>Coding po polsku</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Asystent dev z&nbsp;polskim kontekstem, code review, docs.</p>
              <p className="sl-fn">eval — code + EN regresja</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">03</div>
            <div>
              <div className="sl-eye">szeroki zasięg</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Profil ogólny <span className="sl-acc">i obsługa.</span></h2>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ flagowy ogólny pl</div>
              <span className="sl-chip sl-warn">moat średni</span>
              <h3 className="sl-h2" style={{ fontSize: 17, margin: "10px 0 7px" }}>Flagowy ogólny PL</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Naturalny styl, idiomy, rejestry, wiedza kulturowa.</p>
              <p className="sl-fn">eval — Open PL LLM (agregat)</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ edukacyjny</div>
              <span className="sl-chip sl-warn">moat średni</span>
              <h3 className="sl-h2" style={{ fontSize: 17, margin: "10px 0 7px" }}>Edukacyjny</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Korepetytor pod podstawę programową, matura, ósmoklasista.</p>
              <p className="sl-fn">eval — QA przedmiotowe + reasoning</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ obsługa klienta</div>
              <span className="sl-chip sl-mute">moat niski</span>
              <h3 className="sl-h2" style={{ fontSize: 17, margin: "10px 0 7px" }}>Obsługa klienta</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Centrum obsługi: ton, deeskalacja, polityki firmowe.</p>
              <p className="sl-fn">eval — instrukcyjność + ton</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ guard / moderacja</div>
              <span className="sl-chip sl-warn">moat średni</span>
              <h3 className="sl-h2" style={{ fontSize: 17, margin: "10px 0 7px" }}>Guard / moderacja</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Mały model-strażnik: moderacja, ryzyka, bezpieczeństwo po&nbsp;polsku.</p>
              <p className="sl-fn">eval — klasyfikacja (P/R)</p>
            </div>
          </div>

          <div className="sl-note" style={{ marginTop: 26 }}>
            <div className="sl-clbl">▸ jak wybieramy</div>
            <p>Najlepszy stosunek moatu danych do&nbsp;kosztu w&nbsp;budżecie 15–20k zł. Masz pomysł albo use case? <a href="/zespol" style={{ fontWeight: 500 }}>Dołącz / zgłoś →</a></p>
          </div>
        </div>
      </section>
    </main>
  );
}
