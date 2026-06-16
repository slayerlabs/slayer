export const metadata = {
  title: "Datasety — ewaluacja i trening | Slayer",
  description:
    "Zbiory danych: publiczne benchmarki ewaluacyjne (held-out) i niezależne korpusy treningowe (prawo, urzędy). Z licencjami i linkami HuggingFace.",
};

const dsDesc = { color: "var(--sl-mut)", fontSize: 12, display: "block", marginTop: 3 };

export default function Datasety() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-eye">zbiory danych</div>
          <h1 className="sl-h1">Datasety — <span className="sl-acc">ewaluacja</span> i <span className="sl-acc">trening</span></h1>
          <p className="sl-lede">Twardy podział: zbiory <b>ewaluacyjne</b> służą TYLKO do pomiaru (held-out, nigdy w treningu), a <b>treningowe</b> są niezależne — <a href="/benchmarks">bez benchmaxxingu</a>.</p>
        </div>
      </section>

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">01</div>
            <div>
              <div className="sl-eye">ewaluacja · polski rdzeń</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Held-out, <span className="sl-acc">tylko pomiar.</span></h2>
            </div>
          </div>

          <div style={{ overflowX: "auto", marginTop: 22 }}>
            <table className="sl-tbl">
              <thead><tr><th>Dataset</th><th>Rola</th><th>Metryka</th><th className="sl-c">Rozmiar</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/amu-cai/llmzszl-dataset" rel="noopener">LLMzSzŁ</a><span style={dsDesc}>egzaminy państwowe CKE · 154 domeny</span></td><td>główny agregat</td><td>accuracy MCQ</td><td className="sl-s">18 821</td><td><span className="sl-chip">publiczny</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/speakleash/PES-2018-2022" rel="noopener">PES</a><span style={dsDesc}>egzaminy specjalizacyjne</span></td><td>egzamin zawodowy</td><td>accuracy</td><td className="sl-s">70 010</td><td><span className="sl-chip">publiczny</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/clarin-pl/poquad" rel="noopener">PoQuAD</a><span style={dsDesc}>SQuAD 2.0, natywnie PL, no-answer</span></td><td>grounding / refusal</td><td>F1 + sędzia-LLM</td><td className="sl-s">~52 000</td><td><span className="sl-chip">CC-BY-4.0</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/facebook/belebele" rel="noopener">Belebele (PL)</a><span style={dsDesc}>reading comprehension</span></td><td>rozumienie</td><td>accuracy MCQ</td><td className="sl-s">900</td><td><span className="sl-chip">CC-BY-SA</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/CohereForAI/include-base-44" rel="noopener">INCLUDE-44 (PL)</a><span style={dsDesc}>wiedza kulturowo-regionalna</span></td><td>wiedza PL</td><td>accuracy MCQ</td><td className="sl-s">config PL</td><td><span className="sl-chip">publiczny</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/openlanguagedata/flores_plus" rel="noopener">FLORES-200 (PL)</a><span style={dsDesc}>tłumaczenie PL↔inne</span></td><td>regresja generacji</td><td>BLEU / chrF</td><td className="sl-s">1 012</td><td><span className="sl-chip sl-warn">gated · dostęp</span></td></tr>
              </tbody>
            </table>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>ewaluacja · kontrola regresji (EN)</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Czy angielski <span className="sl-acc">nie spadł.</span></h2>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="sl-tbl">
              <thead><tr><th>Dataset</th><th>Rola</th><th>Metryka</th><th>Licencja</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/facebook/belebele" rel="noopener">Belebele (EN)</a><span style={dsDesc}>ten sam task → regres PL↔EN</span></td><td>regresja</td><td>accuracy MCQ</td><td><span className="sl-chip">CC-BY-SA</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/allenai/ai2_arc" rel="noopener">ARC-Challenge</a><span style={dsDesc}>rozumowanie EN</span></td><td>regresja</td><td>accuracy MCQ</td><td><span className="sl-chip">CC-BY-SA</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/cais/mmlu" rel="noopener">MMLU</a><span style={dsDesc}>wiedza EN, 57 dziedzin</span></td><td>regresja</td><td>accuracy MCQ</td><td><span className="sl-chip">MIT</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/openai/gsm8k" rel="noopener">GSM8K</a><span style={dsDesc}>matematyka / rozumowanie EN</span></td><td>regresja</td><td>exact match</td><td><span className="sl-chip">MIT</span></td></tr>
              </tbody>
            </table>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>ewaluacja · zamknięte</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Nie mierzymy — <span className="sl-acc">brak danych.</span></h2>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="sl-tbl">
              <thead><tr><th>Dataset</th><th>Domena</th><th>Dlaczego pominięte</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn">Polish EQ-Bench</td><td>inteligencja emocjonalna</td><td>zbiór testowy niepubliczny</td></tr>
                <tr><td className="sl-dn">CPTUB</td><td>pragmatyka / implikatury</td><td>tylko leaderboard, brak datasetu</td></tr>
                <tr><td className="sl-dn">PLCC</td><td>kompetencja kulturowa</td><td>publiczne tylko przykłady</td></tr>
              </tbody>
            </table>
          </div>
          <p className="sl-fn" style={{ marginTop: 10 }}>Szczegóły: <a href="/closed-benchmarks" style={{ color: "var(--sl-acc)" }}>/closed-benchmarks</a>.</p>

          <div className="sl-eye" style={{ marginTop: 44 }}>trening · niezależne korpusy</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Nigdy w ewaluacji — <span className="sl-acc">moat prawno-urzędowy.</span></h2>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="sl-tbl">
              <thead><tr><th>Źródło</th><th>Zastosowanie</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn">ISAP / akty prawne<span style={dsDesc}>ustawy, rozporządzenia</span></td><td>grounded QA, wiedza prawna</td><td><span className="sl-chip sl-mute">do zebrania</span></td></tr>
                <tr><td className="sl-dn">Orzeczenia (SAOS)<span style={dsDesc}>baza orzeczeń sądów</span></td><td>rozumowanie prawne</td><td><span className="sl-chip sl-mute">do zebrania</span></td></tr>
                <tr><td className="sl-dn">Interpretacje (KIS/MF)<span style={dsDesc}>podatki, objaśnienia</span></td><td>wariant podatkowy</td><td><span className="sl-chip sl-mute">do zebrania</span></td></tr>
                <tr><td className="sl-dn">Instrukcje PL (SFT)<span style={dsDesc}>kurowane + syntetyczne</span></td><td>instruction tuning</td><td><span className="sl-chip sl-mute">do budowy</span></td></tr>
                <tr><td className="sl-dn">Pary preferencji (DPO)<span style={dsDesc}>lepsza/gorsza odpowiedź</span></td><td>alignment</td><td><span className="sl-chip sl-mute">do budowy</span></td></tr>
                <tr><td className="sl-dn">Prywatny held-out<span style={dsDesc}>najnowsze egzaminy CKE/PES</span></td><td>wykrywanie benchmaxxingu</td><td><span className="sl-chip sl-mute">do budowy</span></td></tr>
              </tbody>
            </table>
          </div>

          <div className="sl-note" style={{ marginTop: 26 }}>
            <div className="sl-clbl">▸ zasada</div>
            <p>Ewaluacyjne i treningowe to rozłączne światy; korpusy treningowe przechodzą <b>dekontaminację</b>. Masz dobre dane prawno-urzędowe? <a href="/zespol" style={{ fontWeight: 500 }}>Dołącz / zgłoś →</a></p>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">02</div>
            <div>
              <div className="sl-eye">dane pod LLMzSzŁ</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Jedyna oś, gdzie Bielik <span className="sl-acc">wygrywa.</span></h2>
              <p className="sl-lede" style={{ marginTop: 12 }}>LLMzSzŁ to w przewadze <b>egzaminy zawodowe</b> (przepisy branżowe, BHP, prawo), więc „wygrać LLMzSzŁ&quot; pokrywa się z naszą specjalizacją prawno-urzędową. Wszystko niezależne od test-splitu, dekontaminowane.</p>
            </div>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>A · najwyższa dźwignia · on-target</div>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="sl-tbl">
              <thead><tr><th>Źródło</th><th>Co buduje</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn">Arkusze CKE/OKE + klucze<span style={dsDesc}>matura, ósmoklasista, <b>egzaminy zawodowe/kwalifikacje</b> — starsze roczniki</span></td><td>umiejętność + format MCQ (to samo źródło, inne pozycje)</td><td><span className="sl-chip sl-mute">do zebrania</span></td></tr>
                <tr><td className="sl-dn"><a href="https://isap.sejm.gov.pl" rel="noopener">ISAP</a> + BHP / normy<span style={dsDesc}>ustawy, rozporządzenia, przepisy branżowe, bezpieczeństwo</span></td><td>rdzeń części zawodowej + specjalizacja prawna</td><td><span className="sl-chip sl-mute">do zebrania</span></td></tr>
              </tbody>
            </table>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>B · wiedza ogólna i program szkolny</div>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="sl-tbl">
              <thead><tr><th>Źródło</th><th>Co buduje</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn"><a href="https://huggingface.co/datasets/wikimedia/wikipedia" rel="noopener">Wikipedia / Wikibooks / Wikisource PL</a><span style={dsDesc}>wiedza + treści podręcznikowe</span></td><td>szerokość (matura/ósmoklasista)</td><td><span className="sl-chip">publiczne</span></td></tr>
                <tr><td className="sl-dn"><a href="https://huggingface.co/speakleash" rel="noopener">Korpusy SpeakLeash</a> · CulturaX-pl / OSCAR-pl<span style={dsDesc}>polski pretraining/CPT</span></td><td>nie regresować polskiego</td><td><span className="sl-chip">publiczne</span></td></tr>
              </tbody>
            </table>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>C · format MCQ + rozumowanie · to test wielokrotnego wyboru</div>
          <div className="sl-cols" style={{ marginTop: 18 }}>
            <div className="sl-col sl-col-lead"><div className="sl-clbl">▸ syntetyczne</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Polskie MCQ z korpusów</h3><p className="sl-lede" style={{ fontSize: 13 }}>Generowane z Wikipedia/ISAP (Evol/Magpie) z weryfikacją; uczy „odpowiedz literą&quot; i szerokości.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ cot</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Distylacja rozumowania PL</h3><p className="sl-lede" style={{ fontSize: 13 }}>Łańcuchy myślenia z mocnego nauczyciela na trudniejsze pozycje.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ rlvr</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>GRPO na polskich MCQ</h3><p className="sl-lede" style={{ fontSize: 13 }}>Nagroda = poprawna litera → optymalizuje dokładnie to, co mierzy LLMzSzŁ, czysto.</p></div>
          </div>

          <div className="sl-note" style={{ marginTop: 26 }}>
            <div className="sl-clbl">▸ przepis</div>
            <p>CPT (Wikipedia + ISAP/BHP) → SFT (arkusze zawodowe + syntetyczne MCQ, dekontaminowane) → GRPO/RLVR na polskich MCQ. Pomiar na <b>prywatnym held-out</b> (świeże arkusze). Masz arkusze/przepisy/dane? <a href="/zespol" style={{ fontWeight: 500 }}>Zgłoś →</a></p>
          </div>
        </div>
      </section>
    </main>
  );
}
