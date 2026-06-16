export const metadata = {
  title: 'Na czym trenowano Bielika v3 — analiza danych | Slayer',
  description:
    'Analiza danych treningowych Bielika v3 11B Instruct na podstawie oficjalnego EU Public Summary (AI Act): korpusy, licencje, crawl, dane syntetyczne, przetwarzanie — z linkami HuggingFace.',
};

const dsDesc = { color: "var(--sl-mut)", fontSize: 12, display: "block", marginTop: 3 };

export default function BielikDane() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-code"><b>bielik-dane</b><span>/ dane &amp; trening</span></div>
            <div>
              <div className="sl-eye">analiza · źródło zewnętrzne</div>
              <h1 className="sl-h1">Na czym trenowano <span className="sl-acc">Bielika&nbsp;v3</span></h1>
              <p className="sl-lede">Rozbiór danych treningowych <b>Bielik&nbsp;v3 11B Instruct</b> na&nbsp;podstawie oficjalnego <a href="https://bielik.ai/downloads/Bielik%2011B%20v3%20EU%20Public%20Summary.pdf" rel="noopener">EU Public Summary</a> — dokumentu, który dostawca GPAI musi opublikować na&nbsp;mocy AI Act. Wszystkie nazwane korpusy z&nbsp;linkami HuggingFace, plus to, czego (wg deklaracji) <b>nie</b> użyto. Wyniki benchmarkowe → <a href="/bielik-benchmarki" style={{ color: "var(--sl-acc)", fontWeight: 500 }}>/bielik-benchmarki</a>.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">01</div>
            <div>
              <div className="sl-eye">metryczka · z sekcji 1 dokumentu</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Metryczka <span className="sl-acc">modelu.</span></h2>
            </div>
          </div>

          <div style={{ overflowX: "auto", marginTop: 22 }}>
            <table className="sl-tbl">
              <tbody>
                <tr><td className="sl-dn">Model</td><td>Bielik&nbsp;v3 11B Instruct</td></tr>
                <tr><td className="sl-dn">Model bazowy (dependency)</td><td>Mistral 7B v0.2</td></tr>
                <tr><td className="sl-dn">Dostawca</td><td>Fundacja SpeakLeash (KRS 0001099568, Wrocław)</td></tr>
                <tr><td className="sl-dn">Data wejścia na&nbsp;rynek UE</td><td>31.12.2025</td></tr>
                <tr><td className="sl-dn">Modalność</td><td>tylko tekst</td></tr>
                <tr><td className="sl-dn">Rozmiar danych treningowych</td><td><b>1 mld – 10 bln tokenów</b> (zaznaczony przedział środkowy)</td></tr>
                <tr><td className="sl-dn">Najświeższe dane</td><td>maj 2025</td></tr>
                <tr><td className="sl-dn">Skład językowy</td><td>~90% polski + angielski; ~10% inne języki UE; celowo śląski i&nbsp;kaszubski (Wikipedia)</td></tr>
                <tr><td className="sl-dn">Raport techniczny</td><td><a href="https://arxiv.org/abs/2505.02410" rel="noopener">arXiv:2505.02410</a></td></tr>
              </tbody>
            </table>
          </div>
          <p className="sl-fn" style={{ marginTop: 12 }}>Dokument deklaruje typy treści: dokumenty prawne i&nbsp;urzędowe (orzeczenia, ustawy, rozporządzenia), teksty naukowe (Biblioteka Nauki), publikacje prasowe (źródła licencjonowane), web z&nbsp;domen publicznych i&nbsp;forów tematycznych, dyskurs parlamentarny, zasoby wielojęzyczne (Wikipedia, Europeana) oraz dane syntetyczne.</p>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">02</div>
            <div>
              <div className="sl-eye">pretraining · sekcja 2.1 — linki za&nbsp;dostawcą</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Duże publiczne <span className="sl-acc">korpusy.</span></h2>
            </div>
          </div>

          <div style={{ overflowX: "auto", marginTop: 22 }}>
            <table className="sl-tbl">
              <thead><tr><th>Korpus</th><th>Charakter</th><th>Licencja / dostęp</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn"><a href="https://hplt-project.org/datasets/v2.0" rel="noopener">HPLT v2.0</a><span style={dsDesc}>wielojęzyczny web, czyszczony</span></td><td>pretraining web</td><td><span className="sl-chip">otwarty</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/uonlp/CulturaX" rel="noopener">CulturaX</a><span style={dsDesc}>167 języków, dedup + filtr jakości</span></td><td>pretraining web</td><td><span className="sl-chip">otwarty (ODC-BY + per-source)</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/HuggingFaceFW/fineweb-2" rel="noopener">FineWeb-2</a><span style={dsDesc}>wielojęzyczny FineWeb (w&nbsp;tym PL)</span></td><td>pretraining web</td><td><span className="sl-chip">ODC-BY</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu" rel="noopener">FineWeb-Edu</a><span style={dsDesc}>web filtrowany pod treści edukacyjne</span></td><td>pretraining jakościowy</td><td><span className="sl-chip">ODC-BY</span></td></tr>
                <tr><td className="sl-dn"><a href="https://commoncrawl.org/" rel="noopener">Common Crawl</a><span style={dsDesc}>surowy crawl webu</span></td><td>źródło web</td><td><span className="sl-chip">publiczny</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/cerebras/SlimPajama-627B" rel="noopener">SlimPajama-627B</a><span style={dsDesc}>627 mld tokenów, dedup</span></td><td>pretraining EN</td><td><span className="sl-chip">per-source</span></td></tr>
              </tbody>
            </table>
          </div>
          <p className="sl-fn" style={{ marginTop: 12 }}>Dostawca zaznacza: „mieszanka domen web poddana mieszaniu i&nbsp;deduplikacji”. Migawki czasowe ustalono dla spójności; zbiór gromadzony 2022 – listopad 2025.</p>

          <div className="sl-eye" style={{ marginTop: 44 }}>opisowo · bez pełnej listy</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Mniejsze publiczne <span className="sl-acc">źródła.</span></h2>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="sl-tbl">
              <thead><tr><th>Źródło</th><th>Co wnosi</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/wikimedia/wikipedia" rel="noopener">Wikipedia</a> (w&nbsp;tym śląska, kaszubska)</td><td>wiedza ogólna + warianty regionalne</td></tr>
                <tr><td className="sl-dn">Biblioteka Nauki<span style={dsDesc}>dostęp przez API</span></td><td>teksty naukowe</td></tr>
                <tr><td className="sl-dn">Korpus Dyskursu Parlamentarnego</td><td>język urzędowo-polityczny</td></tr>
                <tr><td className="sl-dn"><a href="https://www.europeana.eu/" rel="noopener">Europeana</a></td><td>zasoby kulturowe, wielojęzyczne</td></tr>
                <tr><td className="sl-dn">Zbiory tłumaczeniowe</td><td>pary PL↔ (przekład)</td></tr>
                <tr><td className="sl-dn">Akty prawne i&nbsp;administracyjne (anonimizowane)<span style={dsDesc}>orzeczenia, ustawy, uchwały, dzienniki/monitory urzędowe</span></td><td>rdzeń prawno-urzędowy</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">03</div>
            <div>
              <div className="sl-eye">sekcja 2.2 — umowa z&nbsp;rightsholderem</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Dane licencjonowane <span className="sl-acc">komercyjnie.</span></h2>
            </div>
          </div>
          <div className="sl-note" style={{ marginTop: 22 }}>
            <p><b>itwiz.pl</b> — umowa z&nbsp;redakcją (właściciel / redaktor naczelny). Licencjonowany korpus artykułów z&nbsp;~10 lat, dostarczony bezpośrednio w&nbsp;formacie <code>DOCX</code> na&nbsp;potrzeby treningu. Inne prywatne dane od&nbsp;pośredników/baz danych: <b>nie</b> (sekcja 2.2.2 = No).</p>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>sekcja 2.3 — crawler „Speakleash”</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Crawl <span className="sl-acc">własny.</span></h2>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="sl-tbl">
              <tbody>
                <tr><td className="sl-dn">Okres zbierania</td><td>11/2022 – 05/2025</td></tr>
                <tr><td className="sl-dn">Cele</td><td>publiczne PDF-y i&nbsp;teksty z&nbsp;forów / źródeł otwartych</td></tr>
                <tr><td className="sl-dn">Domeny sektora publicznego</td><td>portale rządowe/samorządowe (<code>.gov</code>, <code>.bip</code>) — uchwały, rozporządzenia, materiały prawne</td></tr>
                <tr><td className="sl-dn">Fora tematyczne</td><td>motoryzacja, elektronika, ogrodnictwo i&nbsp;in. (treści nie-wrażliwe)</td></tr>
                <tr><td className="sl-dn">Zachowanie</td><td>respekt robots.txt; fora tylko gdy brak jawnego zakazu</td></tr>
              </tbody>
            </table>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>sekcja 2.5</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Dane <span className="sl-acc">syntetyczne.</span></h2>
          <div className="sl-note" style={{ marginTop: 18 }}>
            <p>Generowane modelami: <b>DeepSeek v3</b> oraz <b>Bielik v2.3 11B</b> (self-distill). Modalność: tekst. To&nbsp;istotny sygnał — część korpusu instrukcyjnego pochodzi z&nbsp;destylacji silniejszego nauczyciela (DeepSeek) i&nbsp;poprzedniej generacji własnego modelu.</p>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">04</div>
            <div>
              <div className="sl-eye">jawne „No” w&nbsp;dokumencie</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Czego — wg deklaracji — <span className="sl-acc">NIE użyto.</span></h2>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col"><div className="sl-clbl">▸ 2.4</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Dane użytkowników</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Brak. Ani prompty/interakcje z&nbsp;modelem, ani dane z&nbsp;innych usług dostawcy.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ 2.2.2</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Inne prywatne źródła</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Brak danych od&nbsp;pośredników / dostawców prywatnych baz (poza licencją itwiz).</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ 2.6</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Inne źródła</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Brak źródeł spoza sekcji 2.1–2.5.</p></div>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>sekcja 3</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Przetwarzanie i&nbsp;<span className="sl-acc">bezpieczeństwo.</span></h2>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="sl-tbl">
              <tbody>
                <tr><td className="sl-dn">Deduplikacja</td><td>na&nbsp;poziomie zbioru i&nbsp;dokumentu (ogranicza memoryzację)</td></tr>
                <tr><td className="sl-dn">Filtr jakości</td><td>własny klasyfikator — odsiewa treści niskiej jakości, wulgarne, seksualne, spam</td></tr>
                <tr><td className="sl-dn">Model guardrail</td><td>mały dedykowany model wycina: self-harm, hate, treści seksualne, przestępcze, wulgaryzmy</td></tr>
                <tr><td className="sl-dn">Anonimizacja PII</td><td>obowiązkowy krok: telefony, e-maile, URL-e, PESEL</td></tr>
                <tr><td className="sl-dn">TDM / opt-out</td><td>kontrola robots.txt, meta-tagów i&nbsp;ToS; <b>usuwanie wsteczne</b> przy późniejszym zastrzeżeniu praw</td></tr>
                <tr><td className="sl-dn">Code of Practice (GPAI)</td><td>nie jest formalnym sygnatariuszem; deklaruje zgodność „w&nbsp;duchu”</td></tr>
                <tr><td className="sl-dn">Pre-filtrowane źródła</td><td>opiera się na&nbsp;czyszczeniu wykonanym już w&nbsp;HPLT, FineWeb-2, CulturaX</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">05</div>
            <div>
              <div className="sl-eye">interpretacja, nie dokument</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Obserwacje dla <span className="sl-acc">Slayera.</span></h2>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-block"><div className="sl-clbl">▸ A</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Moat prawno-urzędowy jest wspólny</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Bielik mocno stawia na&nbsp;akty prawne, orzeczenia, BIP-y i&nbsp;dyskurs parlamentarny — dokładnie pole, które <a href="/datasety">my targetujemy</a>. To&nbsp;nie jest niezagospodarowana przestrzeń; przewaga będzie w&nbsp;kuracji i&nbsp;formacie zadań, nie w&nbsp;samym dostępie do&nbsp;ustaw.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ B</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Baza to wciąż Mistral 7B v0.2</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>v3 11B dalej rośnie z&nbsp;Mistrala 7B v0.2 (upscaling). To&nbsp;wspiera naszą <a href="/kierunki">tezę</a>, że&nbsp;sufit jakości PL leży w&nbsp;modelu bazowym — stąd nasz start od&nbsp;mocniejszego backbona.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ C</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Instrukcje = DeepSeek v3 + self-distill</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Synthetic SFT z&nbsp;DeepSeek v3 i&nbsp;Bielika v2.3. Potwierdza kierunek: jakość instrukcji zależy od&nbsp;siły nauczyciela — my dobieramy <a href="/styl">otwartego, silnego sędziego/nauczyciela</a> świadomie.</p></div>
          </div>
          <div className="sl-note" style={{ marginTop: 26 }}>
            <div className="sl-clbl">▸ źródło</div>
            <p><a href="https://bielik.ai/downloads/Bielik%2011B%20v3%20EU%20Public%20Summary.pdf" rel="noopener">Bielik 11B v3 EU Public Summary, wersja 1.0</a> (Fundacja SpeakLeash) · raport techniczny: <a href="https://arxiv.org/abs/2505.02410" rel="noopener">arXiv:2505.02410</a>. Cytowane fakty pochodzą wprost z&nbsp;dokumentu; sekcja „Obserwacje” to&nbsp;nasza interpretacja. Wyniki na&nbsp;benchmarkach → <a href="/bielik-benchmarki" style={{ color: "var(--sl-acc)", fontWeight: 500 }}>/bielik-benchmarki</a>.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
