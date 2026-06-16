export const metadata = {
  title: "Zasady projektu | Slayer",
  description: "Zasady organizacyjne Slayer: autorstwo Kacper Wikieł, początkowy model BDFL, reguły decyzji i udział kontrybutorów.",
};

export default function Rules() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-code"><b>rules</b><span>/ protokół</span></div>
            <div>
              <div className="sl-eye">zasady · zarządzanie · autorstwo</div>
              <h1 className="sl-h1" style={{ marginTop: 12 }}>Zasady <span className="sl-acc">projektu</span></h1>
              <p className="sl-lede" style={{ marginTop: 18 }}>Slayer zaczyna jako otwarty warsztat badawczy: publikujemy metody, pomiary i&nbsp;część artefaktów tak, by społeczność mogła je weryfikować i&nbsp;rozwijać. Otwartość dotyczy standardu pracy badawczej, nie deklaracji nonprofit. Slayer może w&nbsp;przyszłości działać jako organizacja komercyjna, jeśli będzie to najlepszy sposób finansowania compute, utrzymania zespołu i&nbsp;wdrażania polskich modeli w&nbsp;praktyce.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">autorstwo · struktura początkowa</div>
          <div className="sl-cols" style={{ marginTop: 18 }}>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ autorstwo</div>
              <h3 className="sl-h2" style={{ marginBottom: 10 }}>Slayer jest projektem autorstwa Kacpra Wikieła.</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}><b>Kacper Wikieł</b> jest inicjatorem, autorem kierunku i&nbsp;osobą odpowiedzialną za początkową strukturę projektu: zakres badań, standard publikacji, ton marki, priorytety techniczne i&nbsp;decyzje o&nbsp;tym, co trafia do oficjalnego Slayera.</p>
              <p className="sl-lede" style={{ fontSize: 14.5, marginTop: 12 }}>Kontrybucje są mile widziane, ale oficjalna linia projektu musi pozostać spójna: dobry smak, twardy pomiar, jawny koszt i&nbsp;brak benchmaxxingu. Wkład społeczności nie wyklucza przyszłej struktury for-profit.</p>
            </div>
            <div className="sl-col sl-col-block sl-feat">
              <div className="sl-clbl">▸ struktura początkowa</div>
              <h3 className="sl-h2" style={{ marginBottom: 10 }}>Benevolent Dictator For Life.</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Początkowy model organizacyjny Slayera to <b>BDFL</b>, czyli <b>Benevolent Dictator For Life</b> — model znany z&nbsp;wczesnej historii Pythona. W&nbsp;praktyce oznacza to, że Kacper Wikieł ma ostatnie słowo w&nbsp;sprawach kierunku, jakości, publikacji, nazwy, marki i&nbsp;konfliktów decyzyjnych.</p>
              <p className="sl-lede" style={{ fontSize: 14.5, marginTop: 12 }}>To nie jest zamknięcie projektu. To mechanizm utrzymania spójności, dopóki Slayer nie ma dojrzałego governance, stałych maintainerów i&nbsp;jasnych procesów rozstrzygania sporów.</p>
            </div>
          </div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">01</div>
            <div>
              <div className="sl-eye">reguły pracy · obowiązują od startu</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Reguły <span className="sl-acc">pracy.</span></h2>
            </div>
          </div>
          <div className="sl-entries" style={{ marginTop: 22 }}>
            <div className="sl-entry"><div className="sl-no">01</div><div><h3>Jedna oficjalna linia</h3><p>Każdy może eksperymentować, forkować i&nbsp;proponować zmiany. Oficjalny Slayer zachowuje jednak jedną linię decyzyjną i&nbsp;jedną odpowiedzialność redakcyjną.</p></div></div>
            <div className="sl-entry"><div className="sl-no">02</div><div><h3>Merit, nie hałas</h3><p>Decyzje techniczne zapadają na podstawie artefaktów: kodu, danych, pomiarów, kosztu, replikowalności i&nbsp;jakości odpowiedzi. Sama opinia nie wystarcza.</p></div></div>
            <div className="sl-entry"><div className="sl-no">03</div><div><h3>Wkład daje głos</h3><p>Realni kontrybutorzy mają wpływ na plan działania i&nbsp;priorytety. Wpływ rośnie z&nbsp;odpowiedzialnością za dowożone rzeczy, a&nbsp;nie z&nbsp;deklaracjami.</p></div></div>
            <div className="sl-entry"><div className="sl-no">04</div><div><h3>Spory domykamy</h3><p>Jeśli dyskusja nie prowadzi do decyzji, BDFL domyka temat. Celem jest ruch projektu, nie nieskończona debata.</p></div></div>
            <div className="sl-entry"><div className="sl-no">05</div><div><h3>Governance może dorosnąć</h3><p>Gdy projekt będzie miał stabilnych maintainerów, regularnych kontrybutorów i&nbsp;większą powierzchnię odpowiedzialności, struktura może przejść w&nbsp;bardziej formalny model. Do tego czasu obowiązuje BDFL.</p></div></div>
          </div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner" style={{ maxWidth: 760, marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
          <div className="sl-eye" style={{ display: "block" }}>prosty kontrakt</div>
          <h2 className="sl-h2" style={{ margin: "12px 0 14px" }}>Pracujemy publicznie. <span className="sl-acc">Decydujemy spójnie.</span></h2>
          <p className="sl-lede" style={{ margin: "0 auto 24px" }}>Jeśli chcesz dołożyć kod, dane, ewaluację albo compute, wejście jest otwarte. Jeśli chcesz zmienić kierunek projektu, przynieś dowód.</p>
          <div className="sl-cta" style={{ justifyContent: "center" }}>
            <a className="sl-btn sl-btn-p" href="/zespol">dołącz do projektu →</a>
            <a className="sl-btn sl-btn-s" href="/team">zespół</a>
          </div>
        </div>
      </section>
    </main>
  );
}
