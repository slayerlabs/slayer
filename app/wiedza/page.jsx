export const metadata = {
  title: "Wiedza — wstrzykiwanie polskiego długiego ogona (synthetic CPT) | Slayer",
  description:
    "Program badawczy: ile wiedzy o Polsce można wstrzyknąć w model syntetycznym CPT i za ile. Fermi-rachunek jądra wiedzy, probe długiego ogona, koszt vs pokrycie, hipotezy z falsyfikatorami.",
};

/* Klasy pomocnicze rysują WNĘTRZE ręcznych wykresów SVG (osie, siatka, etykiety,
   wartości). Nie zawierają gradientów ani zaokrągleń — tylko kolory dociągnięte
   do palety Telemetrii. Słupki/punkty/krzywe mają własne wypełnienia w markupie. */
const css = `
    .sl-fig{margin-top:22px}
    .sl-fig svg{width:100%;height:auto;display:block;margin-top:18px}
    .sl-fig text{font-family:var(--sl-mono)}
    .sl-fig .axis{stroke:var(--sl-line);stroke-width:1}
    .sl-fig .gridl{stroke:var(--sl-line2);stroke-width:1}
    .sl-fig .lbl{fill:var(--sl-dim);font-size:11px}
    .sl-fig .lblb{fill:var(--sl-mut);font-size:11.5px}
    .sl-fig .val{fill:var(--sl-ink);font-size:12px;font-weight:600}
    .sl-pyr{width:100%;border-collapse:collapse}
    .sl-pyr td{padding:11px 8px;border-bottom:1px solid var(--sl-line2);font-size:14px;color:var(--sl-txt);vertical-align:middle}
    .sl-pyr td.sl-dn{color:var(--sl-ink);font-weight:500}
    .sl-pyr td.sl-s{font-family:var(--sl-mono);text-align:right;white-space:nowrap;color:var(--sl-mut)}
    .sl-pyr .sl-ds{display:block;font-family:var(--sl-mono);font-size:11px;color:var(--sl-dim);margin-top:4px;text-transform:none;letter-spacing:0}
    .sl-pyr .sl-bar{height:10px;background:var(--sl-acc);opacity:.85}
    .sl-hyp-row{display:flex;align-items:start;gap:16px;justify-content:space-between}
    .sl-fals{margin-top:10px;font-family:var(--sl-mono);font-size:11.5px;line-height:1.6;color:var(--sl-dim)}
    .sl-fals b{color:var(--sl-warn);font-weight:500}
`;

export default function Wiedza() {
  return (
    <main className="sl">
      <style>{css}</style>

      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-code"><b>wiedza</b><span>/ dane &amp; trening</span></div>
            <div>
              <div className="sl-eye">program badawczy · synthetic CPT</div>
              <h1 className="sl-h1">Ile <span className="sl-acc">wiedzy o&nbsp;Polsce</span> da&nbsp;się wstrzyknąć w&nbsp;model?</h1>
              <p className="sl-lede">Bielik przeszedł 1.1T tokenów polskiego CPT i&nbsp;zna 29% naszego długiego ogona. Nasza baza (Qwen3.5-27B) zna 16%.
              Pytanie za&nbsp;kilka tysięcy dolarów: czy syntetyczna multiplikacja faktów (EntiGraph) wstrzykuje ogon taniej
              i&nbsp;głębiej niż surowy korpus? Wszystko poniżej jest mierzone, z&nbsp;falsyfikatorami.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">01</div>
            <div>
              <div className="sl-eye">fermi-rachunek · rzędy wielkości</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Ile w&nbsp;ogóle jest <span className="sl-acc">faktów.</span></h2>
            </div>
          </div>
          <div className="sl-art sl-fig">
            <div className="sl-clbl">▸ piramida faktów: od świata do naszego korpusu</div>
            <p className="sl-fn" style={{ marginTop: 6 }}>fakt = atomowe twierdzenie „X ma własność Y&quot; · skala logarytmiczna</p>
            <div style={{ overflowX: "auto" }}>
              <table className="sl-pyr"><tbody>
                <tr><td className="sl-dn">wiedza świata (Wikidata, encyklopedie)</td><td className="sl-s">~10⁹</td><td style={{ width: "42%" }}><div className="sl-bar" style={{ width: "100%" }}></div></td></tr>
                <tr><td className="sl-dn">udokumentowane tylko w&nbsp;polskich źródłach<span className="sl-ds">Wikipedia PL, SAOS, ISAP, prasa lokalna, BIP, GUS</span></td><td className="sl-s">10⁷–10⁸</td><td><div className="sl-bar" style={{ width: "72%" }}></div></td></tr>
                <tr><td className="sl-dn">jądro pytalne<span className="sl-ds">to, o&nbsp;co realnie zapyta egzamin, prawnik, mieszkaniec</span></td><td className="sl-s">1–5M</td><td><div className="sl-bar" style={{ width: "46%" }}></div></td></tr>
                <tr><td className="sl-dn">w&nbsp;kolejce: ZPE (surowe akapity × ~8 faktów)</td><td className="sl-s">~400k</td><td><div className="sl-bar" style={{ width: "38%", background: "var(--sl-info)" }}></div></td></tr>
                <tr><td className="sl-dn">zmultiplikowane w&nbsp;naszym korpusie (10M tok)</td><td className="sl-s">~100k</td><td><div className="sl-bar" style={{ width: "30%", background: "var(--sl-ok)" }}></div></td></tr>
              </tbody></table>
            </div>
            <p className="sl-fn">74 616 par QA + 46 713 akapitów relacji z&nbsp;6 506 artykułów · skala log: każdy stopień to&nbsp;~rząd wielkości</p>
          </div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">02</div>
            <div>
              <div className="sl-eye">knowledge_probe_v1 · 71 pytań closed-book · 2026-06-11</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Probe <span className="sl-acc">długiego ogona.</span></h2>
            </div>
          </div>
          <div className="sl-art sl-fig">
            <div className="sl-clbl">▸ kto zna polski długi ogon? (accuracy, %)</div>
            <p className="sl-fn" style={{ marginTop: 6 }}>pytania z&nbsp;korpusu EntiGraph · sędzia: otwarty Qwen3.5-122B vs gold ugruntowany w&nbsp;źródle · temp 0</p>
            <svg viewBox="0 0 760 300" role="img" aria-label="Wykres słupkowy: accuracy modeli na pytaniach polonica i ogólnych">
              <line className="axis" x1="120" y1="20" x2="120" y2="250" />
              <line className="axis" x1="120" y1="250" x2="740" y2="250" />
              <g>
                <line className="gridl" x1="120" y1="135" x2="740" y2="135" /><text className="lbl" x="112" y="139" textAnchor="end">25</text>
                <line className="gridl" x1="120" y1="20" x2="740" y2="20" /><text className="lbl" x="112" y="24" textAnchor="end">50</text>
                <text className="lbl" x="112" y="254" textAnchor="end">0</text>
              </g>
              {/* grupy: polonica (n=38) / ogólne (n=33) */}
              <text className="lblb" x="265" y="285" textAnchor="middle">polonica · fakty lokalne (n=38)</text>
              <text className="lblb" x="595" y="285" textAnchor="middle">wiedza ogólna (n=33)</text>
              {/* polonica: bielik 28.9, q9 18.4, q27 15.8  (skala: 1% = 4.6px) */}
              <rect x="160" y="117.06" width="60" height="132.94" fill="#c79448" />
              <text className="val" x="190" y="109" textAnchor="middle">28.9</text>
              <text className="lbl" x="190" y="264" textAnchor="middle">Bielik 11B</text>
              <rect x="235" y="165.36" width="60" height="84.64" fill="#7e9eb0" />
              <text className="val" x="265" y="157" textAnchor="middle">18.4</text>
              <text className="lbl" x="265" y="264" textAnchor="middle">Qwen 9B</text>
              <rect x="310" y="177.32" width="60" height="72.68" fill="#74a37a" />
              <text className="val" x="340" y="169" textAnchor="middle">15.8</text>
              <text className="lbl" x="340" y="264" textAnchor="middle">Qwen 27B</text>
              {/* ogólne: 39.4 / 30.3 / 33.3 */}
              <rect x="490" y="68.76" width="60" height="181.24" fill="#c79448" />
              <text className="val" x="520" y="61" textAnchor="middle">39.4</text>
              <text className="lbl" x="520" y="264" textAnchor="middle">Bielik 11B</text>
              <rect x="565" y="110.62" width="60" height="139.38" fill="#7e9eb0" />
              <text className="val" x="595" y="102" textAnchor="middle">30.3</text>
              <text className="lbl" x="595" y="264" textAnchor="middle">Qwen 9B</text>
              <rect x="640" y="96.82" width="60" height="153.18" fill="#74a37a" />
              <text className="val" x="670" y="89" textAnchor="middle">33.3</text>
              <text className="lbl" x="670" y="264" textAnchor="middle">Qwen 27B</text>
            </svg>
            <p className="sl-fn">results/knowledge_probe_v1.json · itemy probe = held-out (exclusion list z&nbsp;treningu) · n=71, różnica Bielik↔27B na&nbsp;polonica jeszcze nieistotna statystycznie (potwierdzenie: probe 300–500 + drugi sędzia)</p>
          </div>
          <div className="sl-note" style={{ marginTop: 22 }}><p><b>Odczyt:</b> długi ogon leży u&nbsp;wszystkich (16–29%). Bielik prowadzi: jego 1.1T CPT częściowo
          kupiło ogon. Nasza baza 27B ma najlepszą wiedzę ogólną (transfer z&nbsp;EN/ZH) i&nbsp;najsłabszą lokalną: faktów
          o&nbsp;eksporcie piwa z&nbsp;Mławy nie ma w&nbsp;żadnym nie-polskim korpusie. Tej luki nie da&nbsp;się przetransferować; można ją tylko wstrzyknąć.</p></div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">03</div>
            <div>
              <div className="sl-eye">ekonomia wstrzykiwania · ceny 2026-06</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Koszt vs <span className="sl-acc">pokrycie jądra.</span></h2>
            </div>
          </div>
          <div className="sl-art sl-fig">
            <div className="sl-clbl">▸ za ile kupuje się pokrycie pytalnego jądra (1–5M faktów)</div>
            <p className="sl-fn" style={{ marginTop: 6 }}>1 fakt ≈ 10 sformułowań × ~100 tok = ~1k tokenów syntetycznych · generacja (deepseek-flash) + trening (QLoRA 27B, 1 epoka) · oś X logarytmiczna</p>
            <svg viewBox="0 0 760 320" role="img" aria-label="Koszt łączny vs pokrycie jądra wiedzy">
              <line className="axis" x1="90" y1="20" x2="90" y2="260" />
              <line className="axis" x1="90" y1="260" x2="730" y2="260" />
              <g>
                <line className="gridl" x1="90" y1="200" x2="730" y2="200" /><text className="lbl" x="82" y="204" textAnchor="end">25%</text>
                <line className="gridl" x1="90" y1="140" x2="730" y2="140" /><text className="lbl" x="82" y="144" textAnchor="end">50%</text>
                <line className="gridl" x1="90" y1="80" x2="730" y2="80" /><text className="lbl" x="82" y="84" textAnchor="end">75%</text>
                <line className="gridl" x1="90" y1="20" x2="730" y2="20" /><text className="lbl" x="82" y="24" textAnchor="end">100%</text>
              </g>
              {/* X (log $): 10 -> x=150 ; 50 -> 290 ; 1000 -> 530* ; 3500 -> 660 (umowne pozycje log) */}
              <text className="lbl" x="150" y="276" textAnchor="middle">$10</text>
              <text className="lbl" x="295" y="276" textAnchor="middle">$50</text>
              <text className="lbl" x="540" y="276" textAnchor="middle">$1.5k</text>
              <text className="lbl" x="665" y="276" textAnchor="middle">$3.5k</text>
              {/* krzywa log-liniowa (hipoteza H1) */}
              <path d="M150,252 C 240,244 270,222 295,212 C 420,164 470,140 540,110 C 600,84 640,44 665,24" fill="none" stroke="#c79448" strokeWidth="2.5" strokeDasharray="1 0" />
              {/* punkty */}
              <circle cx="150" cy="252" r="6" fill="#74a37a" />
              <text className="val" x="150" y="236" textAnchor="middle">10M tok</text>
              <text className="lbl" x="150" y="222" textAnchor="middle">~3% · MAMY</text>
              <circle cx="295" cy="212" r="6" fill="#c79448" />
              <text className="val" x="295" y="194" textAnchor="middle">50M</text>
              <text className="lbl" x="295" y="180" textAnchor="middle">10–30%</text>
              <circle cx="540" cy="110" r="6" fill="#c79448" />
              <text className="val" x="540" y="93" textAnchor="middle">2B</text>
              <text className="lbl" x="540" y="79" textAnchor="middle">~50%</text>
              <circle cx="665" cy="24" r="6" fill="#7e9eb0" />
              <text className="val" x="640" y="40" textAnchor="end">5B tok</text>
              <text className="lbl" x="640" y="54" textAnchor="end">~100% jądra</text>
              {/* adnotacja Bielik CPT */}
              <line className="gridl" x1="90" y1="232" x2="730" y2="232" strokeDasharray="4 4" />
              <text className="lbl" x="726" y="226" textAnchor="end">poziom Bielika na probe (28.9% ogona): cel minimum po pierwszym CPT</text>
            </svg>
            <p className="sl-fn">kształt krzywej = hipoteza H1 (log-liniowość, EntiGraph); pozycje punktów 50M+ to&nbsp;prognoza do&nbsp;zmierzenia, nie wynik · pełne jądro ≈ $2k generacji + $0.7–1.5k treningu, czyli mieści&nbsp;się w&nbsp;tezie „model za&nbsp;15–20k zł&quot;</p>
          </div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">04</div>
            <div>
              <div className="sl-eye">każda z falsyfikatorem · status na 2026-06-11</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Hipotezy <span className="sl-acc">badawcze.</span></h2>
            </div>
          </div>
          <div className="sl-entries" style={{ marginTop: 22 }}>
            <div className="sl-entry"><div className="sl-no">H1</div><div>
              <div className="sl-hyp-row">
                <h3>Wstrzykiwanie wiedzy skaluje się log-liniowo z&nbsp;tokenami syntetycznymi</h3>
                <span className="sl-status sl-queued">do testu</span>
              </div>
              <p>Za EntiGraph (Stanford 2024): accuracy closed-book rośnie ~log-liniowo z&nbsp;liczbą syntetycznych tokenów multiplikujących fakty. Pierwszy punkt pomiarowy: CPT na&nbsp;10M tokenów, probe przed/po.</p>
              <div className="sl-fals"><b>falsyfikator:</b> delta na&nbsp;probe po&nbsp;10M ≤ +3 pp → krzywa płaska, ekonomia z&nbsp;sekcji 3 nieaktualna</div>
            </div></div>
            <div className="sl-entry"><div className="sl-no">H2</div><div>
              <div className="sl-hyp-row">
                <h3>Lokalnego ogona nie da&nbsp;się przetransferować między językami</h3>
                <span className="sl-status sl-open">wstępnie potwierdzona</span>
              </div>
              <p>Fakty istniejące tylko w&nbsp;polskich źródłach (lokalna gospodarka, regionalia, administracja) są nieobecne w&nbsp;modelach trenowanych globalnie, niezależnie od&nbsp;ich rozmiaru. Qwen 27B: 15.8% na&nbsp;polonica przy 33.3% na&nbsp;wiedzy ogólnej.</p>
              <div className="sl-fals"><b>falsyfikator:</b> na&nbsp;probe 300–500 z&nbsp;czystą stratą „fakt lokalny&quot; Qwen 27B osiąga &gt;40% bez CPT</div>
            </div></div>
            <div className="sl-entry"><div className="sl-no">H3</div><div>
              <div className="sl-hyp-row">
                <h3>Surowy korpus kupuje ogon fragmentarycznie</h3>
                <span className="sl-status sl-open">wstępnie potwierdzona</span>
              </div>
              <p>1.1T polskich tokenów CPT (Bielik) daje 28.9% ogona: fakt występujący w&nbsp;korpusie raz, w&nbsp;jednym sformułowaniu, zwykle nie zapisuje&nbsp;się w&nbsp;wagach. Multiplikacja sformułowań (×10) powinna być radykalnie tańsza na&nbsp;fakt niż skala surowa.</p>
              <div className="sl-fals"><b>falsyfikator:</b> nasz CPT na&nbsp;10M tokenów syntetycznych nie zbliża&nbsp;się do&nbsp;poziomu Bielika (≤22%) na&nbsp;polonica</div>
            </div></div>
            <div className="sl-entry"><div className="sl-no">H4</div><div>
              <div className="sl-hyp-row">
                <h3>Pytalne jądro polskiej wiedzy mieści&nbsp;się w&nbsp;budżecie hobbystycznym</h3>
                <span className="sl-status sl-queued">do testu</span>
              </div>
              <p>~5M faktów × 1k tokenów = ~5B tokenów syntetycznych ≈ $2k generacji + $0.7–1.5k treningu. Jeśli H1 i&nbsp;H3 się bronią, pełne jądro to&nbsp;rząd $3–4k, czyli wciąż „super tanio + epsilon&quot;.</p>
              <div className="sl-fals"><b>falsyfikator:</b> koszt za&nbsp;punkt procentowy probe rośnie zamiast maleć między 10M a&nbsp;250M tokenów</div>
            </div></div>
            <div className="sl-entry"><div className="sl-no">H5</div><div>
              <div className="sl-hyp-row">
                <h3>Wstrzykiwanie nie może zjadać kompetencji bazowych</h3>
                <span className="sl-status sl-queued">warunek brzegowy</span>
              </div>
              <p>CPT na&nbsp;5B tokenów to&nbsp;poważna dywergencja od&nbsp;bazy. Warunek brzegowy każdego etapu: gate&apos;y regresji (MMLU, ARC, GSM8K, HumanEval) z&nbsp;Δ ≥ −0.5 pp; przeciwwaga: replay EN 20–30%.</p>
              <div className="sl-fals"><b>falsyfikator:</b> regresja EN przekracza −0.5 pp przy proporcji replay ≤30% → koszt rośnie o&nbsp;kolejne przebiegi</div>
            </div></div>
          </div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">05</div>
            <div>
              <div className="sl-eye">jak to jest mierzone</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Metoda i&nbsp;<span className="sl-acc">czystość.</span></h2>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-block">
              <div className="sl-clbl">▸ probe</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Held-out z&nbsp;konstrukcji</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Pytania losowane z&nbsp;doków QA korpusu trafiają na&nbsp;exclusion list i&nbsp;nie wchodzą do&nbsp;treningu CPT. Model musi znać fakt z&nbsp;relacji i&nbsp;parafraz, nie z&nbsp;wykutego itemu.</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ sędzia</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Otwarte wagi, gold w&nbsp;źródle</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Otwarty Qwen3.5-122B porównuje odpowiedź z&nbsp;goldem ugruntowanym w&nbsp;akapicie źródłowym. Pusta odpowiedź = błędna. W&nbsp;planie: drugi niezależny sędzia (gpt-oss-120b) i&nbsp;raport zgodności.</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ anty-kontaminacja</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Audyt verbatim 8-gram</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Każdy wygenerowany dokument przechodzi przez indeks n-gramów wszystkich zbiorów testowych (KLEJ, LLMzSzŁ, PolKnowledge, held-outy). Kopie wypadają; fakty zostają.</p>
            </div>
          </div>
          <div className="sl-note" style={{ marginTop: 22 }}><p><b>Pipeline (stan na&nbsp;2026-06-11):</b> korpus EntiGraph 10M tokenów / 92k dokumentów z&nbsp;6.5k artykułów (PL-focus Wikipedia) · ZPE: 50k+ akapitów materiałów egzaminacyjnych w&nbsp;kolejce do&nbsp;multiplikacji · zewnętrzny zbiór destylacji z&nbsp;Bielika: przyjęte 4 091 z&nbsp;9 769 po&nbsp;weryfikacji faktów otwartym sędzią (51% surowych odpadło jako konfabulacje). Następny krok: pilot CPT (high-rank QLoRA, 27B) na&nbsp;10M → probe przed/po → decyzja o&nbsp;skali ze&nbsp;slope&apos;u, nie z&nbsp;wiary.</p></div>
        </div>
      </section>
    </main>
  );
}
