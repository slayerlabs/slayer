import StyleExamples from "./examples";

export const metadata = {
  title: "Styl: co base Qwen robi źle po polsku · Slayer",
  description:
    "Ręczny przegląd odpowiedzi base Qwen3.5-27B po polsku: rażące błędy gramatyczne (Hipoza, Bezpośrednie sprzedaż, samodzielną rozwiązywanie), kalki, liczenie w dolarach, szablon. Fine-tuned v1 obok. Bez regexu, przejrzane ręcznie.",
};

// Reguły podświetleń pochodzą z dangerouslySetInnerHTML (results/style_demo.json
// renderuje <mark class='h-*'>), więc kolory typów błędów MUSZĄ zostać klasami CSS.
// Minimalny, izolowany blok — bez gradientów i border-radius. Reszta strony = kit .sl.
const markCss = `
  .sl mark{background:none;color:inherit;padding:.5px 3px}
  .sl mark.h-err{background:rgba(251,77,104,.20);color:#ffb3bf;border-bottom:2px solid #fb4d68;font-weight:500}
  .sl mark.h-tmpl{background:rgba(232,181,74,.20);color:#f0d28a}
  .sl mark.h-calq{background:rgba(102,163,209,.20);color:#a9d0ec}
  .sl mark.h-ph{background:rgba(217,140,99,.20);color:#e8b794}
  .sl mark.h-good{background:rgba(106,176,118,.20);color:#a7d8b1}
  .sl .sl-kbd{font-family:var(--sl-mono);font-size:.86em;color:var(--sl-ink);background:var(--sl-line2);border:1px solid var(--sl-line);padding:1px 6px;overflow-wrap:anywhere}
`;

export default function Styl() {
  return (
    <main className="sl">
      <style>{markCss}</style>

      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-eye">styl · v1 · przegląd ręczny</div>
          <h1 className="sl-h1" style={{ marginTop: 16 }}>
            Co base Qwen robi <span className="sl-acc">źle</span> po&nbsp;polsku.
          </h1>
          <p className="sl-lede" style={{ marginTop: 22, maxWidth: "66ch" }}>
            Przeczytałem odpowiedzi base Qwen3.5-27B po&nbsp;polsku i&nbsp;zaznaczyłem błędy ręcznie, nie&nbsp;regexem. Nie&nbsp;chodzi tylko o&nbsp;szablon. Widać <b>rażące błędy gramatyczne i&nbsp;ortograficzne</b> („Hipoza&quot;, „Bezpośrednie sprzedaż&quot;, „samodzielną rozwiązywanie&quot;), <b>kalki z&nbsp;angielskiego</b>, a&nbsp;nawet <b>liczenie w&nbsp;dolarach</b> przy polskim poleceniu. Po&nbsp;lewej base z&nbsp;zaznaczonymi błędami, po&nbsp;prawej fine-tuned <b>v1</b>. Uczciwie zaznaczam też potknięcia v1.
          </p>

          <div className="sl-legend" style={{ marginTop: 24 }}>
            <span><i style={{ background: "#fb4d68" }} />rażący błąd gramatyczny / ortograficzny</span>
            <span><i style={{ background: "#e8b54a" }} />szablon / markdown / kalka-otwarcia</span>
            <span><i style={{ background: "#66a3d1" }} />kalka z&nbsp;angielskiego</span>
            <span><i style={{ background: "#d98c63" }} />placeholder</span>
            <span><i style={{ background: "#6ab076" }} />v1 poprawnie</span>
          </div>
        </div>
      </section>

      <section className="sl-sec" style={{ paddingTop: 0 }}>
        <div className="sl-inner">
          <StyleExamples />
        </div>
      </section>

      <section className="sl-sec" style={{ paddingTop: 0 }}>
        <div className="sl-inner">
          <div className="sl-note">
            <div className="sl-clbl">▸ wniosek</div>
            <p>
              Regex łapie tylko myślniki i&nbsp;słowo „feedback&quot;. Ręczny przegląd pokazuje więcej: błędy fleksyjne, literówki w&nbsp;nagłówkach, walutę liczoną w&nbsp;dolarach, kalkowaną składnię. To&nbsp;zwykłe błędy językowe (fleksja, ortografia, składnia) w&nbsp;modelu, który uchodzi za&nbsp;jeden z&nbsp;lepszych. Fine-tuning v1 usuwa szablon i&nbsp;większość kalek, choć sam też się czasem myli, co&nbsp;zaznaczam. Dane: <code className="sl-kbd">results/style_demo.json</code>, dobrane i&nbsp;opisane ręcznie. Base Qwen3.5-27B vs <code className="sl-kbd">slayer-style ep3 (v1)</code>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
