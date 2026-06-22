import { ScoreBoard, StartingFive } from "./live";

export const metadata = {
  title: "Benchmarki — metodologia | Slayer",
  description:
    "Metodologia pomiaru: piątka startowa (LLMzSzŁ, PES, PoQuAD, Belebele, FLORES) + kontrola regresji EN. Publiczne, deterministyczne, liczone czysto — bez benchmaxxingu.",
};

const css = `
    .board{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:clamp(16px,5vw,44px);margin:8px 0 4px;padding:24px clamp(16px,4vw,30px);border:1px solid var(--line);border-radius:10px;background:var(--panel);box-shadow:0 10px 30px rgba(0,0,0,.28)}
    .team{text-align:center}.team .tg{font-family:var(--mono);font-size:.66rem;letter-spacing:.08em;text-transform:uppercase;color:var(--dim)}.team .nm{font-weight:600;font-size:clamp(1rem,2.2vw,1.35rem);margin-top:5px}
    .cnt{display:flex;align-items:baseline;gap:14px;font-family:var(--serif);font-weight:400;font-size:clamp(2.6rem,9vw,4.2rem)}
    .cnt .b{color:var(--acc)}.cnt .q{color:var(--mut)}.cnt .d{color:var(--dim)}
    .bfoot{grid-column:1/-1;border-top:1px solid var(--line2);margin-top:16px;padding-top:14px;text-align:center;font-family:var(--mono);font-size:.78rem;color:var(--mut)}.bfoot b{color:var(--acc)}
    td.score{text-align:center;font-family:var(--mono);font-weight:600;font-size:1.1rem;color:var(--mut);white-space:nowrap}
    td.verdict{text-align:center}
    @media(max-width:760px){.board{grid-template-columns:1fr;gap:14px}}
`;

export default function Benchmarks() {
  return (
    <>
      <style>{css}</style>
      <section className="phero"><div className="inner">
        <span className="kick">metodologia · piątka startowa</span>
        <h1>Jak <em>mierzymy</em>, żeby wynik znaczył</h1>
        <p>Publiczne zbiory, deterministycznie, przez lm-eval-harness. „Wyżej = lepiej&quot;. Wszystko liczone czysto: <strong style={{ color: "var(--txt)" }}>bez inspekcji itemów, bez benchmaxxingu</strong>. Pełna tablica na żywo: <a href="/leaderboard">/leaderboard</a>.</p>
      </div></section>

      <section className="sec tight"><div className="inner">
        <ScoreBoard />

        <div className="ghead" style={{ marginTop: 34 }}><h2>Piątka startowa</h2><span className="c">live · wyniki z leaderboard.json</span></div>
        <StartingFive />
        <p className="muted" style={{ marginTop: 10, fontSize: ".9rem" }}>Pełna lista 10 benchmarków (z kontrolą regresji EN): <a href="/leaderboard" style={{ color: "var(--acc)" }}>/leaderboard</a> · zamknięte: <a href="/closed-benchmarks" style={{ color: "var(--acc)" }}>/closed-benchmarks</a></p>
      </div></section>

      <section className="sec tight alt"><div className="inner">
        <div className="ghead"><h2>Zasady pomiaru</h2><span className="c">czego nauczył nas V4</span></div>
        <div className="grid auto">
          <div className="cell"><div className="n">RÓWNE WARUNKI</div><h3 className="sm">Ten sam harness</h3><p>Identyczny tryb, few-shot, szablon promptu i seed dla wszystkich modeli.</p></div>
          <div className="cell"><div className="n">METODA PER ZADANIE</div><h3 className="sm">Likelihood vs generacja</h3><p>NLI/MCQ scoringujemy <strong style={{ color: "var(--txt)" }}>likelihood</strong> (log-prob etykiet), binarne i sentyment <strong style={{ color: "var(--txt)" }}>generacją</strong>. Zła metoda daje fałszywą regresję: CDSC-E to −22.5 w generacji, ale tylko −6.0 w likelihood.</p></div>
          <div className="cell"><div className="n">PRÓBKA</div><h3 className="sm">Decyzje na n≥400</h3><p>Mały n potrafi skłamać (kalibracja, która na n=200 dawała +3, na n=400 = 0). n=100 tylko jako szybki screen, nigdy do release.</p></div>
          <div className="cell"><div className="n">CZYSTOŚĆ</div><h3 className="sm">Tylko agregaty</h3><p>Bez inspekcji itemów, zero benchmaxxingu. Dane treningowe ze źródeł <strong style={{ color: "var(--txt)" }}>rozłącznych</strong> od evala — skill-transfer, nie zapamiętywanie pytań.</p></div>
          <div className="cell"><div className="n">DEKONTAMINACJA</div><h3 className="sm">vs train+dev+test</h3><p>Każdy shard sprawdzany n-gramowo i atom-overlapem przeciw wszystkim splitom — także <strong style={{ color: "var(--txt)" }}>train</strong>. Train-split jako paliwo = kontaminacja.</p></div>
          <div className="cell"><div className="n">REGRESJA</div><h3 className="sm">Bramki + Pareto</h3><p>Per-zadanie progi (CDSC-E ≤−3pp, parser=0), EN-retencja (ARC/MMLU/GSM8K) pilnuje angielskiego. Release wybiera Pareto-front, nie jeden score.</p></div>
        </div>
        <p className="muted" style={{ marginTop: 16, fontSize: ".92rem", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--txt)" }}>Best-of per zadanie:</strong> dla każdego zadania jedna, właściwa metoda — ta sama dla wszystkich modeli, żeby Δ było porównywalne. Pełna macierz base vs v3 vs v4 × benchmarki (kolor = Δ): <a href="/eksperymenty" style={{ color: "var(--acc)" }}>/eksperymenty</a>. Projektowanie danych pod brak regresji prowadzi jawny manifest <code>skill → eval_proxy → źródło → waga → regression_guard</code>.
        </p>
      </div></section>
    </>
  );
}
