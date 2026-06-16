import { BenchCount, MeasureNote } from "./home-live";

export const metadata = {
  title: "Slayer — applied research lab dla polskich modeli",
  description:
    "Slayer to niezależne applied research lab dla polskich modeli językowych: protokoły ewaluacji, lineage danych, recepty treningowe i jawne koszty. Dobry smak plus twardy pomiar.",
};

export default function Home() {
  return (
    <div className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-eye sl-rv">✦ good taste applied research lab · polskie modele</div>
          <h1 className="sl-h1 sl-rv sl-d1">Protokół dla <span className="sl-acc">polskiej inteligencji.</span></h1>
          <p className="sl-lede sl-rv sl-d2">Slayer bada modele językowe jak rzemiosło: smak odpowiedzi, czystość pomiaru, koszt treningu i ślady danych. Nie robimy widowiska. Zostawiamy <b>artefakty</b>: harnessy, lineage, recepty, modele i wyniki, które da się odtworzyć.</p>
          <div className="sl-cta sl-rv sl-d3">
            <a className="sl-btn sl-btn-p" href="/benchmarks">otwórz protokoły →</a>
            <a className="sl-btn sl-btn-s" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">wejście do labu ↗</a>
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

      {/* === Task 6 wstawia tu kolejne sekcje, przed </div> === */}
    </div>
  );
}
