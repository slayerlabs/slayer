export const metadata = {
  title: "Datasety — ewaluacja i trening | Fabryka AI",
  description:
    "Zbiory danych: publiczne benchmarki ewaluacyjne (held-out) i niezależne korpusy treningowe (prawo, urzędy). Z licencjami i linkami HuggingFace.",
};

export default function Datasety() {
  return (
    <>
      <section className="phero"><div className="inner">
        <span className="kick">zbiory danych</span>
        <h1>Datasety — <em>ewaluacja</em> i <em>trening</em></h1>
        <p>Twardy podział: zbiory <strong style={{ color: "var(--txt)" }}>ewaluacyjne</strong> służą TYLKO do pomiaru (held-out, nigdy w treningu), a <strong style={{ color: "var(--txt)" }}>treningowe</strong> są niezależne — <a href="/benchmarks">bez benchmaxxingu</a>.</p>
      </div></section>

      <section className="sec tight"><div className="inner">
        <div className="ghead"><h2>Ewaluacja — polski rdzeń</h2><span className="c">held-out · tylko pomiar</span></div>
        <div className="tbl"><table><thead><tr><th>Dataset</th><th>Rola</th><th>Metryka</th><th>Rozmiar</th><th>Status</th></tr></thead><tbody>
          <tr><td><div className="dn"><a href="https://huggingface.co/datasets/amu-cai/llmzszl-dataset" rel="noopener">LLMzSzŁ</a></div><div className="ds">egzaminy państwowe CKE · 154 domeny</div></td><td>główny agregat</td><td>accuracy MCQ</td><td>18 821</td><td><span className="chip acc">publiczny</span></td></tr>
          <tr><td><div className="dn"><a href="https://huggingface.co/datasets/speakleash/PES-2018-2022" rel="noopener">PES</a></div><div className="ds">egzaminy specjalizacyjne</div></td><td>egzamin zawodowy</td><td>accuracy</td><td>70 010</td><td><span className="chip acc">publiczny</span></td></tr>
          <tr><td><div className="dn"><a href="https://huggingface.co/datasets/amu-cai/medical-exams-LEK-PL-2008-2024" rel="noopener">LEK</a></div><div className="ds">lekarski egzamin końcowy</div></td><td>egzamin zawodowy</td><td>accuracy MCQ</td><td>4 312</td><td><span className="chip acc">publiczny</span></td></tr>
          <tr><td><div className="dn"><a href="https://huggingface.co/datasets/clarin-pl/poquad" rel="noopener">PoQuAD</a></div><div className="ds">SQuAD 2.0, natywnie PL, no-answer</div></td><td>grounding / refusal</td><td>F1 + sędzia-LLM</td><td>~52 000</td><td><span className="chip acc">CC-BY-4.0</span></td></tr>
          <tr><td><div className="dn"><a href="https://huggingface.co/datasets/facebook/belebele" rel="noopener">Belebele (PL)</a></div><div className="ds">reading comprehension</div></td><td>rozumienie</td><td>accuracy MCQ</td><td>900</td><td><span className="chip acc">CC-BY-SA</span></td></tr>
          <tr><td><div className="dn"><a href="https://huggingface.co/datasets/CohereForAI/include-base-44" rel="noopener">INCLUDE-44 (PL)</a></div><div className="ds">wiedza kulturowo-regionalna</div></td><td>wiedza PL</td><td>accuracy MCQ</td><td>config PL</td><td><span className="chip acc">publiczny</span></td></tr>
          <tr><td><div className="dn"><a href="https://huggingface.co/datasets/openlanguagedata/flores_plus" rel="noopener">FLORES-200 (PL)</a></div><div className="ds">tłumaczenie PL↔inne</div></td><td>regresja generacji</td><td>BLEU / chrF</td><td>1 012</td><td><span className="chip blue">gated · dostęp</span></td></tr>
        </tbody></table></div>

        <div className="ghead"><h2>Ewaluacja — kontrola regresji (EN)</h2><span className="c">czy angielski/rozumowanie nie spadły</span></div>
        <div className="tbl"><table><thead><tr><th>Dataset</th><th>Rola</th><th>Metryka</th><th>Licencja</th></tr></thead><tbody>
          <tr><td><div className="dn"><a href="https://huggingface.co/datasets/facebook/belebele" rel="noopener">Belebele (EN)</a></div><div className="ds">ten sam task → regres PL↔EN</div></td><td>regresja</td><td>accuracy MCQ</td><td><span className="chip acc">CC-BY-SA</span></td></tr>
          <tr><td><div className="dn"><a href="https://huggingface.co/datasets/allenai/ai2_arc" rel="noopener">ARC-Challenge</a></div><div className="ds">rozumowanie EN</div></td><td>regresja</td><td>accuracy MCQ</td><td><span className="chip acc">CC-BY-SA</span></td></tr>
          <tr><td><div className="dn"><a href="https://huggingface.co/datasets/cais/mmlu" rel="noopener">MMLU</a></div><div className="ds">wiedza EN, 57 dziedzin</div></td><td>regresja</td><td>accuracy MCQ</td><td><span className="chip acc">MIT</span></td></tr>
          <tr><td><div className="dn"><a href="https://huggingface.co/datasets/openai/gsm8k" rel="noopener">GSM8K</a></div><div className="ds">matematyka / rozumowanie EN</div></td><td>regresja</td><td>exact match</td><td><span className="chip acc">MIT</span></td></tr>
        </tbody></table></div>

        <div className="ghead"><h2>Ewaluacja — zamknięte</h2><span className="c">nie mierzymy — brak otwartych danych</span></div>
        <div className="tbl"><table><thead><tr><th>Dataset</th><th>Domena</th><th>Dlaczego pominięte</th></tr></thead><tbody>
          <tr><td className="dn">Polish EQ-Bench</td><td>inteligencja emocjonalna</td><td>zbiór testowy niepubliczny</td></tr>
          <tr><td className="dn">CPTUB</td><td>pragmatyka / implikatury</td><td>tylko leaderboard, brak datasetu</td></tr>
          <tr><td className="dn">PLCC</td><td>kompetencja kulturowa</td><td>publiczne tylko przykłady</td></tr>
        </tbody></table></div>
        <p className="muted" style={{ marginTop: 8, fontSize: ".88rem" }}>Szczegóły: <a href="/closed-benchmarks" style={{ color: "var(--acc)" }}>/closed-benchmarks</a>.</p>

        <div className="ghead"><h2>Dane jakościowe do treningu</h2><span className="c">nie trainsety benchmarków · umiejętności, które benchmarki mierzą przy okazji</span></div>
        <div className="tbl"><table><thead><tr><th>Zbiór / źródło</th><th>Co poprawia</th><th>Rozmiar</th><th>Status</th></tr></thead><tbody>
          <tr><td><div className="dn">Polski styl SFT</div><div className="ds">slayer-data/style/style_pl_sft_full.jsonl</div></td><td>naturalność, instrukcje, odmowy, krótkie pisma, QA z kontekstu</td><td>1 600</td><td><span className="chip acc">gotowe</span></td></tr>
          <tr><td><div className="dn">Polskie preferencje</div><div className="ds">slayer-data/style/style_pl_pref_full.jsonl</div></td><td>DPO/ORPO: lepsza polszczyzna bez zmiany faktów</td><td>1 581 par</td><td><span className="chip acc">gotowe</span></td></tr>
          <tr><td><div className="dn">V3 SFT mix</div><div className="ds">distill + human PL + style + EN retention, po decon</div></td><td>bazowy miks instrukcyjny; dobry jako punkt odniesienia, nie jako ślepy przepis</td><td>2 251</td><td><span className="chip blue">użyć ostrożnie</span></td></tr>
          <tr><td><div className="dn">EN retention</div><div className="ds">slayer-data/v3/en_retention_tulu3.jsonl</div></td><td>utrzymanie ARC/MMLU/GSM8K/Belebele EN przy polskim tuningu</td><td>733</td><td><span className="chip acc">gotowe</span></td></tr>
          <tr><td><div className="dn">Replay mix</div><div className="ds">slayer-data/replay/replay_mix.jsonl</div></td><td>antyregresja zachowań bazowych</td><td>228</td><td><span className="chip acc">gotowe</span></td></tr>
          <tr><td><div className="dn">Syntetyczne polskie MCQ</div><div className="ds">slayer-data/mcq/mcq_synth_v3.clean.jsonl</div></td><td>format odpowiedzi, wybór opcji, krótkie rozumowanie</td><td>364</td><td><span className="chip blue">po audycie</span></td></tr>
          <tr><td><div className="dn">Task-preservation (niezależne)</div><div className="ds">własne/syntetyczne typy zadań po dekontaminacji — nie KLEJ train split</div></td><td>replay typów zadań i kalibracja formatów (NLI, MCQ, klasyfikacja, parser), bez oficjalnych splitów benchmarku</td><td>—</td><td><span className="chip">do zbudowania</span></td></tr>
        </tbody></table></div>

        <div className="ghead"><h2>Dane wiedzy — status ryzyka</h2><span className="c">CPT/RAG/SFT tylko po filtrze wierności</span></div>
        <div className="tbl"><table><thead><tr><th>Zbiór</th><th>Potencjał</th><th>Rozmiar</th><th>Decyzja</th></tr></thead><tbody>
          <tr><td><div className="dn">EntiGraph PL focus</div><div className="ds">wiki PL / wiedza ogólna</div></td><td>PoQuAD, Belebele, LLMzSzŁ, wiedza szkolna</td><td>92 084</td><td><span className="chip blue">warunkowo: filtr faithfulness</span></td></tr>
          <tr><td><div className="dn">EntiGraph hops</div><div className="ds">łączenie faktów / wieloskok</div></td><td>rozumowanie na faktach, QA, MCQ</td><td>1 999</td><td><span className="chip blue">do audytu</span></td></tr>
          <tr><td><div className="dn">EntiGraph ZPE</div><div className="ds">materiały edukacyjne</div></td><td>teoretycznie szkoła i egzaminy</td><td>91 626</td><td><span className="chip warn">kwarantanna</span></td></tr>
          <tr><td><div className="dn">Distill zewnętrzny 10k</div><div className="ds">odpowiedzi zewnętrznego modelu PL</div></td><td>analiza luk i halucynacji</td><td>4 091 verified</td><td><span className="chip warn">nie trenować</span></td></tr>
        </tbody></table></div>

        <div className="ghead"><h2>Braki danych dla V4</h2><span className="c">to trzeba zbudować, żeby wzrost był realny</span></div>
        <div className="tbl"><table><thead><tr><th>Brak</th><th>Po co</th><th>Efekt na benchmarkach</th></tr></thead><tbody>
          <tr><td><div className="dn">Hard-neutral NLI PL</div><div className="ds">niezależne pary zdań, nie CDSC-E train/test</div></td><td>naprawa nadmiernej pewności v3</td><td>CDSC-E, KLEJ, refusal/neutral calibration</td></tr>
          <tr><td><div className="dn">Zweryfikowane korpusy prawno-urzędowe</div><div className="ds">ISAP, SAOS, KIS/MF, BHP, instrukcje branżowe</div></td><td>wiedza domenowa bez benchmark leakage</td><td>LLMzSzŁ, PES, PoQuAD, PolNative-realism</td></tr>
          <tr><td><div className="dn">PolNative-dev / PLCC-like / CPTUB-like</div><div className="ds">własne, rozłączne dev sety</div></td><td>iteracja nad polskością, pragmatyką i kulturą</td><td>PolNative, PLCC, CPTUB proxy</td></tr>
          <tr><td><div className="dn">Prywatny held-out CKE/PES</div><div className="ds">świeże arkusze poza publicznym benchmarkiem</div></td><td>wykrywanie przeuczenia i benchmark contamination</td><td>LLMzSzŁ/PES release gate</td></tr>
        </tbody></table></div>

        <div className="note"><p><b>Zasada V4:</b> benchmarki są termometrem, nie paliwem. Trenujemy na niezależnych, zweryfikowanych danych jakościowych, które uczą tej samej umiejętności: wierności źródłu, neutralności, polszczyzny, rozumowania MCQ i wiedzy domenowej. Z treningu wykluczone są nie tylko zbiory eval/test — <strong style={{ color: "var(--txt)" }}>oficjalne train splity benchmarków (np. KLEJ) też są poza treningiem</strong>; replay i stabilizacja idą wyłącznie na własnych lub zdekontaminowanych danych, które nie są splitem benchmarku. Każdy większy korpus przechodzi dekontaminację oraz filtr wierności. Masz dobre dane prawno-urzędowe? <a href="/zespol" style={{ color: "var(--acc)", fontWeight: 500 }}>Dołącz / zgłoś →</a></p></div>

        <div className="ghead"><h2>Mapa treningu V4</h2><span className="c">dane → umiejętność → bramka</span></div>
        <div className="tbl"><table><thead><tr><th>Warstwa treningu</th><th>Dane</th><th>Cel</th><th>Gate</th></tr></thead><tbody>
          <tr><td><div className="dn">Neutralność i NLI</div></td><td>nowy hard-neutral NLI PL + bezpieczny replay typów zadań (własne/decontaminated, nie KLEJ split)</td><td>model ma częściej mówić “nie wynika”, gdy relacja jest neutralna</td><td>CDSC-E: neutral recall, pred distribution, macro-F1</td></tr>
          <tr><td><div className="dn">Polska naturalność</div></td><td>style_pl_sft_full + style_pl_pref_full + PolNative-like dev</td><td>odpowiedzi mają brzmieć po polsku, bez kalki i bez utraty faktów</td><td>PolNative, judge style, factuality judge</td></tr>
          <tr><td><div className="dn">Wierność źródłu</div></td><td>QA/summarize z kontekstu, PoQuAD-like własne dane, EntiGraph po filtrze</td><td>odpowiedź tylko z podanego źródła, odmowa przy braku podstawy</td><td>PoQuAD, refusal, hallucination spot-check</td></tr>
          <tr><td><div className="dn">Wiedza prawno-urzędowa</div></td><td>ISAP, SAOS, KIS/MF, BHP, instrukcje branżowe po czyszczeniu</td><td>kompetencja w polskich przepisach i egzaminach zawodowych</td><td>LLMzSzŁ, PES, prywatny held-out</td></tr>
          <tr><td><div className="dn">MCQ i format odpowiedzi</div></td><td>własne syntetyczne MCQ ze źródeł + starsze publiczne arkusze poza held-outem</td><td>wybór poprawnej opcji, stabilna litera, mniej parser errorów</td><td>LLMzSzŁ, PES, Belebele, ARC/MMLU smoke</td></tr>
          <tr><td><div className="dn">EN retention</div></td><td>en_retention_tulu3 + replay bazowy</td><td>polski tuning nie może niszczyć angielskiego i rozumowania</td><td>ARC-C, MMLU, GSM8K, Belebele EN</td></tr>
          <tr><td><div className="dn">Replay zachowań bazowych</div></td><td>replay_mix + małe, decontaminated próbki tasków</td><td>adapter ma być lokalną poprawką, nie zmianą osobowości całego modelu</td><td>loss drift, KL/replay, regression gate</td></tr>
        </tbody></table></div>
      </div></section>

      <section className="sec tight alt"><div className="inner">
        <div className="ghead"><h2>Dane pod <em>LLMzSzŁ</em></h2><span className="c">target: umiejętność, nie trainset benchmarku</span></div>
        <p className="muted" style={{ maxWidth: "74ch", margin: "0 0 22px" }}>LLMzSzŁ mierzy dużo egzaminów zawodowych, przepisów branżowych, BHP i prawa. Sensowny trening to niezależne korpusy z tych domen oraz własne zadania MCQ generowane ze źródeł, nie kopiowanie publicznych pozycji benchmarkowych.</p>

        <div className="ghead"><h2 style={{ fontSize: "1.3rem" }}>A · Najwyższa dźwignia</h2><span className="c">on-target</span></div>
        <div className="tbl"><table><thead><tr><th>Źródło</th><th>Co buduje</th><th>Status</th></tr></thead><tbody>
          <tr><td><div className="dn">Starsze arkusze CKE/OKE + klucze</div><div className="ds">matura, ósmoklasista, egzaminy zawodowe/kwalifikacje poza held-outem</div></td><td>format MCQ i umiejętność egzaminacyjna</td><td><span className="chip">do zebrania</span></td></tr>
          <tr><td><div className="dn"><a href="https://isap.sejm.gov.pl" rel="noopener">ISAP</a> + BHP / normy</div><div className="ds">ustawy, rozporządzenia, przepisy branżowe, bezpieczeństwo</div></td><td>rdzeń części zawodowej + specjalizacja prawna</td><td><span className="chip">do zebrania</span></td></tr>
        </tbody></table></div>

        <div className="ghead"><h2 style={{ fontSize: "1.3rem" }}>B · Wiedza ogólna i program szkolny</h2></div>
        <div className="tbl"><table><thead><tr><th>Źródło</th><th>Co buduje</th><th>Status</th></tr></thead><tbody>
          <tr><td><div className="dn"><a href="https://huggingface.co/datasets/wikimedia/wikipedia" rel="noopener">Wikipedia / Wikibooks / Wikisource PL</a></div><div className="ds">wiedza + treści podręcznikowe</div></td><td>szerokość (matura/ósmoklasista)</td><td><span className="chip">publiczne</span></td></tr>
          <tr><td><div className="dn"><a href="https://huggingface.co/speakleash" rel="noopener">Korpusy SpeakLeash</a> · CulturaX-pl / OSCAR-pl</div><div className="ds">polski pretraining/CPT</div></td><td>nie regresować polskiego</td><td><span className="chip">publiczne</span></td></tr>
        </tbody></table></div>

        <div className="ghead"><h2 style={{ fontSize: "1.3rem" }}>C · Format MCQ + rozumowanie</h2><span className="c">to test wielokrotnego wyboru</span></div>
        <div className="grid auto">
          <div className="cell"><div className="n">SYNTETYCZNE</div><h3 className="sm">Polskie MCQ z korpusów</h3><p>Generowane z Wikipedia/ISAP (Evol/Magpie) z weryfikacją; uczy „odpowiedz literą&quot; i szerokości.</p></div>
          <div className="cell"><div className="n">CoT</div><h3 className="sm">Distylacja rozumowania PL</h3><p>Łańcuchy myślenia z mocnego nauczyciela na trudniejsze pozycje.</p></div>
          <div className="cell"><div className="n">RLVR</div><h3 className="sm">GRPO na polskich MCQ</h3><p>Nagroda = poprawna litera → optymalizuje dokładnie to, co mierzy LLMzSzŁ, czysto.</p></div>
        </div>

        <div className="note"><p><b>Przepis:</b> CPT/RAG na wiernych źródłach (Wikipedia + ISAP/BHP/SAOS/KIS) → SFT na niezależnych zadaniach użytkowych i MCQ → preference/RLVR na formacie odpowiedzi. Pomiar zostaje na publicznych benchmarkach i prywatnym held-oucie, nigdy na danych użytych w treningu. Masz arkusze/przepisy/dane? <a href="/zespol" style={{ color: "var(--acc)", fontWeight: 500 }}>Zgłoś →</a></p></div>
      </div></section>
    </>
  );
}
