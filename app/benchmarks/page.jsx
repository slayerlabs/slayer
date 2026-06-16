import { ScoreBoard, StartingFive } from "./live";

export const metadata = {
  title: "Benchmarki — metodologia | Slayer",
  description:
    "Metodologia pomiaru: piątka startowa (LLMzSzŁ, PES, PoQuAD, Belebele, FLORES) + kontrola regresji EN. Publiczne, deterministyczne, liczone czysto — bez benchmaxxingu.",
};

export default function Benchmarks() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-code"><b>benchmarks</b><span>/ benchmarki</span></div>
            <div>
              <div className="sl-eye">metodologia · piątka startowa</div>
              <h1 className="sl-h1">Jak <span className="sl-acc">mierzymy</span>, żeby wynik znaczył</h1>
              <p className="sl-lede">Publiczne zbiory, deterministycznie, przez lm-eval-harness. „Wyżej&nbsp;= lepiej&quot;. Wszystko liczone czysto: <b>bez inspekcji itemów, bez benchmaxxingu</b>. Pełna tablica na&nbsp;żywo: <a href="/leaderboard">/leaderboard</a>.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye" style={{ marginBottom: 16 }}>tabela wyników · live · wyniki z&nbsp;leaderboard.json</div>
          <ScoreBoard />

          <div className="sl-eye" style={{ marginTop: 44 }}>live · wyniki z&nbsp;leaderboard.json</div>
          <h2 className="sl-h2" style={{ marginTop: 10, marginBottom: 22 }}>Piątka <span className="sl-acc">startowa.</span></h2>
          <StartingFive />
          <p className="sl-fn" style={{ marginTop: 12 }}>Pełna lista 10 benchmarków (z&nbsp;kontrolą regresji EN): <a href="/leaderboard" style={{ color: "var(--sl-acc)" }}>/leaderboard</a> · zamknięte: <a href="/closed-benchmarks" style={{ color: "var(--sl-acc)" }}>/closed-benchmarks</a></p>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">01</div>
            <div>
              <div className="sl-eye">czego nauczył nas V4</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Zasady <span className="sl-acc">pomiaru.</span></h2>
            </div>
          </div>
          <div className="sl-entries" style={{ marginTop: 22 }}>
            <div className="sl-entry"><div className="sl-no">01</div><div><h3>Równe warunki — ten sam harness</h3><p>Identyczny tryb, few-shot, szablon promptu i&nbsp;seed dla wszystkich modeli.</p></div></div>
            <div className="sl-entry"><div className="sl-no">02</div><div><h3>Metoda per zadanie — likelihood vs generacja</h3><p>NLI/MCQ scoringujemy <b>likelihood</b> (log-prob etykiet), binarne i&nbsp;sentyment <b>generacją</b>. Zła metoda daje fałszywą regresję: CDSC-E to&nbsp;−22.5 w&nbsp;generacji, ale tylko −6.0 w&nbsp;likelihood.</p></div></div>
            <div className="sl-entry"><div className="sl-no">03</div><div><h3>Próbka — decyzje na n≥400</h3><p>Mały n&nbsp;potrafi skłamać (kalibracja, która na&nbsp;n=200 dawała +3, na&nbsp;n=400 = 0). n=100 tylko jako szybki screen, nigdy do&nbsp;release.</p></div></div>
            <div className="sl-entry"><div className="sl-no">04</div><div><h3>Czystość — tylko agregaty</h3><p>Bez inspekcji itemów, zero benchmaxxingu. Dane treningowe ze&nbsp;źródeł <b>rozłącznych</b> od&nbsp;evala — skill-transfer, nie zapamiętywanie pytań.</p></div></div>
            <div className="sl-entry"><div className="sl-no">05</div><div><h3>Dekontaminacja — vs train+dev+test</h3><p>Każdy shard sprawdzany n-gramowo i&nbsp;atom-overlapem przeciw wszystkim splitom — także <b>train</b>. Train-split jako paliwo = kontaminacja.</p></div></div>
            <div className="sl-entry"><div className="sl-no">06</div><div><h3>Regresja — bramki + Pareto</h3><p>Per-zadanie progi (CDSC-E ≤−3pp, parser=0), EN-retencja (ARC/MMLU/GSM8K) pilnuje angielskiego. Release wybiera Pareto-front, nie jeden score.</p></div></div>
          </div>
          <div className="sl-note" style={{ marginTop: 26 }}>
            <div className="sl-clbl">▸ best-of per zadanie</div>
            <p>Dla każdego zadania jedna, właściwa metoda — ta sama dla wszystkich modeli, żeby Δ&nbsp;było porównywalne. Pełna macierz base vs v3 vs v4 × benchmarki (kolor = Δ): <a href="/eksperymenty" style={{ color: "var(--sl-acc)" }}>/eksperymenty</a>. Projektowanie danych pod brak regresji prowadzi jawny manifest <code>skill → eval_proxy → źródło → waga → regression_guard</code>.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
