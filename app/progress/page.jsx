import Console from "./console";
import CptProgress from "./cpt";
import CptHistory from "./history";

export const metadata = {
  title: "Pomiar na żywo | Slayer",
  description: "Podgląd na żywo: postęp korpusu CPT do 2B tokenów oraz autonomiczna kolejka benchmarków na simp.",
};

export default function Progress() {
  return (
    <main className="sl">
      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-code"><b>progress</b><span>/ benchmarki</span></div>
            <div>
              <div className="sl-eye">pomiar&nbsp;na&nbsp;żywo · simp / RTX 3090</div>
              <h1 className="sl-h1" style={{ marginTop: 10 }}>Konsola <span className="sl-acc">pomiaru.</span></h1>
              <p className="sl-lede" style={{ marginTop: 12 }}>
                Postęp korpusu CPT&nbsp;do 2B tokenów&nbsp;i autonomiczna kolejka benchmarków. Wartości prawdziwe, liczone czysto, publikowane co kilkadziesiąt sekund.
              </p>
            </div>
          </div>

          <div style={{ marginTop: "clamp(32px,5vw,52px)", display: "grid", gap: "clamp(28px,4vw,40px)" }}>
            <CptProgress />
            <CptHistory />
            <Console />
          </div>
        </div>
      </section>
    </main>
  );
}
