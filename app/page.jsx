import { BenchCount, MeasureNote } from "./home-live";

export const metadata = {
  title: "Slayer — applied research lab dla polskich modeli",
  description:
    "Slayer to niezależne applied research lab dla polskich modeli językowych: protokoły ewaluacji, lineage danych, recepty treningowe i jawne koszty. Dobry smak plus twardy pomiar.",
};

export default function Home() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-hero-grid">
            <div>
              <div className="sl-eye sl-rv">good taste · applied research lab · polskie modele</div>
              <h1 className="sl-h1 sl-rv sl-d1">Protokół dla <span className="sl-acc">polskiej inteligencji.</span></h1>
              <p className="sl-lede sl-rv sl-d2">Badamy modele językowe jak rzemiosło — smak, pomiar, koszt, ślady danych. Zostawiamy <b>artefakty</b>, które da się odtworzyć.</p>
              <div className="sl-cta sl-rv sl-d3">
                <a className="sl-btn sl-btn-p" href="/benchmarks">otwórz protokoły →</a>
                <a className="sl-btn sl-btn-s" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">wejście do labu ↗</a>
              </div>
            </div>
            <div className="sl-art sl-rv sl-d4">
              <div className="sl-eye">slayer-7b · polnative v1</div>
              <div className="sl-tele">run <b>7f3a9c2</b> · seed <b>1337</b> · n=<b>111</b> · lang/pl</div>
              <output className="sl-art-num">0.82</output>
              <div className="sl-art-meta">render exact-match · SOTA-PL <span className="sl-acc">+0.03</span> vs bielik-7b</div>
              <div className="sl-art-bars">
                <span className="sl-art-bar sl-art-bar-win" style={{ width: "82%" }} />
                <span className="sl-art-bar" style={{ width: "64%" }} />
                <span className="sl-art-bar" style={{ width: "74%" }} />
              </div>
              <a className="sl-tele-link" href="/benchmarks">↗ pełna karta /benchmarks</a>
            </div>
          </div>
        </div>
      </section>

      <div className="sl-inner">
        <div className="sl-band sl-rv sl-d4">
          <div className="sl-stat"><BenchCount /><div className="sl-slbl">osi ewaluacji</div></div>
          <div className="sl-stat"><div className="sl-num">24<span className="sl-acc">k</span></div><div className="sl-slbl">rekordów z rodowodem</div></div>
          <div className="sl-stat"><div className="sl-num">100<span className="sl-acc">%</span></div><div className="sl-slbl">claimów z held-out</div></div>
          <div className="sl-stat"><div className="sl-num">~18<span className="sl-acc">k</span></div><div className="sl-slbl">zł — koszt w wyniku</div></div>
        </div>
      </div>

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">księga pomiarów</div>
          <div className="sl-cols" style={{ marginTop: 18 }}>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ ostatnie artefakty</div>
              <ul className="sl-list">
                <li><a href="/eksperymenty">slayer-style-27b — smak bez amnezji <sup>1</sup></a></li>
                <li><a href="/datasety">datasety — dane + karty + lineage <sup>2</sup></a></li>
                <li><a href="/benchmarks">benchmarks — karty 10 osi pomiaru</a></li>
                <li><a href="https://arena.fabryka.ai" rel="noopener" target="_blank">arena — ślepe porównania PL ↗</a></li>
              </ul>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">◆ stan</div>
              <MeasureNote />
              <p className="sl-fn">1 — LLMzSzŁ 65.0 vs baza 58.5 (likelihood, n=400) &nbsp; 2 — miksy 1:1 · disclosure kontaminacji v2</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">01 / komnaty</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Cztery drzwi, <span className="sl-acc">jeden warsztat.</span></h2>
          <p className="sl-lede" style={{ marginTop: 12 }}>Każdy obszar ma własny protokół, artefakty i ślady. Bez ozdobnych deklaracji, bez wyników na słowo.</p>
          <div className="sl-bento" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-block sl-feat">
              <div className="sl-clbl">▸ ewaluacja · flagowy tor</div>
              <a href="/benchmarks"><h3 className="sl-h2" style={{ marginBottom: 8 }}>Czysty pomiar polszczyzny</h3></a>
              <p className="sl-lede" style={{ fontSize: 13 }}>Karty benchmarków: co mierzy każda oś, jaka metryka decyduje, gdzie pułapka. Likelihood i generacja rozdzielone, stały seed, tylko agregaty.</p>
              <p className="sl-fn">artefakt — harness + karty 10 osi (LLMzSzŁ, KLEJ, PoQuAD…)</p>
              <span className="sl-chip" style={{ marginTop: "auto", alignSelf: "flex-start" }}>10 osi pomiaru</span>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ dane</div>
              <a href="/datasety"><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Kuracja zamiast masy</h3></a>
              <p className="sl-lede" style={{ fontSize: 13 }}>Małe, świetne zbiory biją duże i brudne. Pełny lineage każdego miksu, dekontaminacja względem ewaluacji, provenance per rekord.</p>
              <p className="sl-fn">artefakt — karty datasetów + miksy 1:1 z lineage</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ trening</div>
              <a href="/trening"><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Recepty, które przechodzą próg</h3></a>
              <p className="sl-lede" style={{ fontSize: 13 }}>QLoRA SFT, preferencje (DPO/ORPO), RL na weryfikowalnych nagrodach. Każdy run z gate&apos;ami regresji.</p>
              <p className="sl-fn">artefakt — cooking recipe + training log + decyzje</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ styl</div>
              <a href="/kierunki"><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Naturalna polszczyzna</h3></a>
              <p className="sl-lede" style={{ fontSize: 13 }}>Model ma pisać jak ktoś, kto ma ucho: bez kalek, bez asystenckiej waty, z natywną fleksją. Mierzone twardo i otwartym sędzią.</p>
              <p className="sl-fn">artefakt — style-SFT 1.6k przykładów + eval stylu held-out</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">02 / reguły przejścia</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Co wpuszczamy <span className="sl-acc">do twierdzeń.</span></h2>
          <p className="sl-lede" style={{ marginTop: 12, marginBottom: 8 }}>Rygor ewaluacyjny jest częścią smaku. Te reguły obowiązują w każdym runie.</p>
          <div className="sl-entries">
            <div className="sl-entry"><div className="sl-no">01</div><div><h3>Held-out albo nic</h3><p>Publiczne twierdzenia wyłącznie z danych, których model nie widział, mierzone tym samym protokołem co baseline&apos;y. Wynik na zadaniu trenowanym oznaczamy jako trenowany i nie liczymy do claimów.</p></div></div>
            <div className="sl-entry"><div className="sl-no">02</div><div><h3>Agregaty, nie itemy</h3><p>Analizujemy accuracy per kategoria, domena, rok. Nie oglądamy pojedynczych pytań i nie piszemy na ich podstawie danych treningowych. Pliki ewaluacji wchodzą do pipeline&apos;u wyłącznie jako wejście dekontaminacji.</p></div></div>
            <div className="sl-entry"><div className="sl-no">03</div><div><h3>Lineage i disclosure</h3><p>Każdy model ma audytowalną listę: co weszło do treningu, skąd, z jaką licencją. Gdy popełniliśmy błąd (skażony miks v2), <b>opublikowaliśmy go z pełnym disclosure</b> zamiast chować.</p></div></div>
            <div className="sl-entry"><div className="sl-no">04</div><div><h3>Otwarci sędziowie</h3><p>Tam, gdzie ocenia LLM, sędzią jest model o otwartych wagach, z podanym promptem i wersją. Zamknięte API nie filtrują danych i nie wystawiają ocen, na których stoi wynik.</p></div></div>
            <div className="sl-entry"><div className="sl-no">05</div><div><h3>Koszt jest wynikiem</h3><p>Budżet, sprzęt i czas każdego runu są częścią publikacji. Teza kosztowa (konkurencyjny model za ~15–20k zł) jest falsyfikowalna jak każda inna.</p></div></div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">03 / wejścia</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Wybierz <span className="sl-acc">ślad.</span></h2>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ pomiary</div>
              <ul className="sl-list">
                <li><a href="/leaderboard">Ewaluacje na żywo →</a></li>
                <li><a href="/eksperymenty">Eksperymenty (log runów) →</a></li>
                <li><a href="/benchmarks">Benchmarki (metoda) →</a></li>
              </ul>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ budowa</div>
              <ul className="sl-list">
                <li><a href="/datasety">Datasety (lineage) →</a></li>
                <li><a href="/trening">Trening (recepty) →</a></li>
                <li><a href="/zespol">Zespół (dołącz) →</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">04 / kontekst</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Bez teatru <span className="sl-acc">zwycięstwa.</span></h2>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ ekosystem</div>
              <p className="sl-lede" style={{ fontSize: 13 }}>Bielik (SpeakLeash) to ważny punkt odniesienia i wzór otwartego raportowania. Nasz wkład jest komplementarny: niezależna replikacja, tańsza ścieżka treningu i publiczny warsztat pomiarowy.</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ baza i licencja</div>
              <p className="sl-lede" style={{ fontSize: 13 }}>Budujemy na Qwen3.5-27B (Apache 2.0): pochodne można trenować, wydawać i komercjalizować otwarcie. 9B służy do tanich iteracji. Trening i hosting w Polsce, receptura jawna.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner" style={{ maxWidth: 760, marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
          <div className="sl-eye" style={{ display: "block" }}>dołącz</div>
          <h2 className="sl-h2" style={{ margin: "12px 0 14px" }}>Wejdź, jeśli chcesz <span className="sl-acc">mierzyć.</span></h2>
          <p className="sl-lede" style={{ margin: "0 auto 24px" }}>Kontrybutorzy, naukowcy, firmy z use case&apos;ami i fundatorzy compute. Publiczny zapis: od razu widać, kto już jest.</p>
          <div className="sl-cta" style={{ justifyContent: "center" }}>
            <a className="sl-btn sl-btn-p" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">wejście do labu ↗</a>
            <a className="sl-btn sl-btn-s" href="/zespol">zapisz się</a>
          </div>
        </div>
      </section>
    </main>
  );
}
