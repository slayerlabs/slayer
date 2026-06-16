import SubmitForm from "./form";

export const metadata = {
  title: "Zgłoś benchmark | Slayer",
  description: "Formularz zgłaszania nowego benchmarku do katalogu Slayer — walidacja, podgląd JSON i gotowy pull request na GitHubie.",
};

export default function NowyBenchmark() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-code"><b>bench-explorer/nowy</b><span>/ benchmarki</span></div>
            <div>
              <div className="sl-eye">zgłoszenie · nowy benchmark · review przez PR</div>
              <h1 className="sl-h1">Zgłoś benchmark <span className="sl-acc">do&nbsp;katalogu</span></h1>
              <p className="sl-lede" style={{ marginTop: 14 }}>
                Wypełnij pola, podgląd JSON aktualizuje się na&nbsp;żywo. Zgłoszenie trafia jako plik do{" "}
                <code>public/data/submissions/</code> przez pull request; review odbywa się w&nbsp;PR. Zasada „benchmark&nbsp;= blocklista i&nbsp;miara&rdquo; obowiązuje:
                zgłaszamy tylko zbiory z&nbsp;publicznie dostępnym test-setem (inaczej trafi do <a href="/closed-benchmarks">zamkniętych</a>).
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sl-sec">
        <div className="sl-inner">
          <SubmitForm />
        </div>
      </section>
    </main>
  );
}
