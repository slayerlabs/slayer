export const metadata = {
  title: 'Bielik v3 — wszystkie benchmarki + Qwen3.6-27B | Slayer',
  description:
    'Komplet wyników Bielik-11B-v3.0-Instruct na 9 benchmarkach (arXiv:2601.11579): Open PL LLM, EQ-Bench, CPTUB, Medical/PES, PLCC, Open LLM EN, INCLUDE-44, Belebele, FLORES. Plus uczciwe porównanie z Qwen3.6-27B.',
};

const dsDesc = { color: "var(--sl-mut)", fontSize: 12, display: "block", marginTop: 3 };
const sub = { color: "var(--sl-mut)" };

export default function BielikBenchmarki() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-eye">wyniki · źródło zewnętrzne</div>
          <h1 className="sl-h1">Bielik v3 — <span className="sl-acc">wszystkie benchmarki</span></h1>
          <p className="sl-lede">Komplet ewaluacji <b>Bielik-11B-v3.0-Instruct</b> z&nbsp;dedykowanego raportu technicznego v3 (<a href="https://arxiv.org/abs/2601.11579" rel="noopener">arXiv:2601.11579</a>, wersja wstępna) — 9&nbsp;zestawów, plus uczciwe porównanie z&nbsp;<b>Qwen3.6-27B</b>. Na czym trenowano model: <a href="/bielik-dane">/bielik-dane</a>.</p>
        </div>
      </section>

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">01</div>
            <div>
              <div className="sl-eye">9 zestawów · arXiv:2601.11579</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Wyniki — <span className="sl-acc">wszystkie benchmarki v3.</span></h2>
              <p className="sl-lede" style={{ marginTop: 12 }}>Każdy benchmark, na&nbsp;którym <b>Bielik-11B-v3.0-Instruct</b> był odpalony. Pomiar PL w&nbsp;trybie 5-shot, agregat znormalizowany do&nbsp;baseline&apos;ów. Pełne źródło: <a href="https://arxiv.org/abs/2601.11579" rel="noopener">arXiv:2601.11579</a>.</p>
            </div>
          </div>

          <div style={{ overflowX: "auto", marginTop: 22 }}>
            <table className="sl-tbl">
              <thead><tr><th>Benchmark</th><th>Metryka</th><th className="sl-c">Wynik</th><th>Pozycja / kontekst</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn">Open PL LLM Leaderboard<span style={dsDesc}>rdzeń PL: sentyment, NER, QA, podobieństwo (5-shot)</span></td><td>śr. acc/F1</td><td className="sl-s sl-win">65,93</td><td>bije Llama-3.1-70B-Instruct (65,49) i&nbsp;Mixtral-8x22B-Instruct (65,23)</td></tr>
                <tr><td className="sl-dn">Polish EQ-Bench<span style={dsDesc}>inteligencja emocjonalna PL</span></td><td>score</td><td className="sl-s">71,20</td><td>na&nbsp;poziomie Qwen2.5-32B (71,15), Llama-3.3-70B (70,73); spadek vs v2.6 (73,8)</td></tr>
                <tr><td className="sl-dn">CPTUB<span style={dsDesc}>implikatury, pragmatyka, „tricky questions"</span></td><td>śr. 1–5</td><td className="sl-s">3,73</td><td>&gt; Qwen2.5-14B-Instruct i&nbsp;Mixtral-8x22B; tricky 3,19</td></tr>
                <tr><td className="sl-dn">Polish Medical Leaderboard<span style={dsDesc}>PES 2018–2022, egzaminy specjalizacyjne (5-shot)</span></td><td>accuracy</td><td className="sl-s">50,21</td><td>&gt; Qwen2.5-14B-Instruct (49,60); baza v3 = 45,86</td></tr>
                <tr><td className="sl-dn">PLCC<span style={dsDesc}>kompetencja kulturowa i&nbsp;językowa PL</span></td><td>accuracy %</td><td className="sl-s sl-win">71,83</td><td><span className="sl-chip">1. open-source</span> &gt; DeepSeek-V3-0324 (71,00), Llama-3.1-405B (60,00)</td></tr>
                <tr><td className="sl-dn">Open LLM Leaderboard (EN)<span style={dsDesc}>kontrola regresji EN: ARC, HellaSwag, MMLU, GSM8K…</span></td><td>śr.</td><td className="sl-s">72,45</td><td>GSM8K 85,60 · MMLU 71,11 · ARC-C 64,59 (rozbicie niżej)</td></tr>
                <tr><td className="sl-dn">INCLUDE-base-44<span style={dsDesc}>wiedza/rozumowanie, 20 języków EU</span></td><td>accuracy</td><td className="sl-s sl-win">64,8 <span style={sub}>(PL 69,0)</span></td><td>najwyżej wśród testowanych; &gt; Qwen2.5-14B-Instruct (61,7)</td></tr>
                <tr><td className="sl-dn">Belebele<span style={dsDesc}>rozumienie tekstu, 28 wariantów EU</span></td><td>accuracy</td><td className="sl-s">82,98</td><td>2. za&nbsp;Qwen2.5-14B-Instruct (85,91), &gt; phi-4 (81,71)</td></tr>
                <tr><td className="sl-dn">FLORES<span style={dsDesc}>tłumaczenie, 20 par językowych EU</span></td><td>BLEU</td><td className="sl-s">19,22</td><td>2. za&nbsp;EuroLLM-9B (20,61, trenowany na&nbsp;FLORES); do&nbsp;PL 18,54 / z&nbsp;PL 19,91</td></tr>
              </tbody>
            </table>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>Tabela 11 raportu · instruct</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Open LLM Leaderboard (EN) — <span className="sl-acc">rozbicie.</span></h2>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="sl-tbl">
              <thead><tr><th>Model</th><th className="sl-c">AVG</th><th className="sl-c">ARC-C</th><th className="sl-c">HellaSwag</th><th className="sl-c">TruthfulQA</th><th className="sl-c">MMLU</th><th className="sl-c">WinoGrande</th><th className="sl-c">GSM8K</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn">Bielik-11B-v3.0-Instruct</td><td className="sl-s sl-win">72,45</td><td className="sl-s">64,59</td><td className="sl-s">81,96</td><td className="sl-s">54,25</td><td className="sl-s">71,11</td><td className="sl-s">77,19</td><td className="sl-s">85,60</td></tr>
                <tr><td className="sl-dn">Bielik-11B-v3 (baza)</td><td className="sl-s">68,45</td><td className="sl-s">61,43</td><td className="sl-s">81,38</td><td className="sl-s">47,65</td><td className="sl-s">67,55</td><td className="sl-s">78,53</td><td className="sl-s">74,15</td></tr>
                <tr><td className="sl-dn">Bielik-4.5B-v3-Instruct</td><td className="sl-s">64,89</td><td className="sl-s">56,06</td><td className="sl-s">73,90</td><td className="sl-s">50,79</td><td className="sl-s">63,66</td><td className="sl-s">71,19</td><td className="sl-s">73,69</td></tr>
              </tbody>
            </table>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>gdzie raport podaje mniejsze modele</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Warianty <span className="sl-acc">rodziny v3.</span></h2>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="sl-tbl">
              <thead><tr><th>Model</th><th className="sl-c">Open PL LLM</th><th className="sl-c">EQ-Bench</th><th className="sl-c">CPTUB</th><th className="sl-c">Medical</th><th className="sl-c">PLCC</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn">Bielik-11B-v3.0-Instruct</td><td className="sl-s sl-win">65,93</td><td className="sl-s sl-win">71,20</td><td className="sl-s sl-win">3,73</td><td className="sl-s sl-win">50,21</td><td className="sl-s sl-win">71,83</td></tr>
                <tr><td className="sl-dn">Bielik-11B-v3 (baza, 20250730)</td><td className="sl-s">55,16</td><td className="sl-s">—</td><td className="sl-s">—</td><td className="sl-s">45,86</td><td className="sl-s">—</td></tr>
                <tr><td className="sl-dn">Bielik-4.5B-v3.0-Instruct</td><td className="sl-s">56,13</td><td className="sl-s">53,58</td><td className="sl-s">3,38</td><td className="sl-s">43,55</td><td className="sl-s">41,47</td></tr>
                <tr><td className="sl-dn">Bielik-1.5B-v3.0-Instruct</td><td className="sl-s">—</td><td className="sl-s">—</td><td className="sl-s">—</td><td className="sl-s">—</td><td className="sl-s">27,50</td></tr>
              </tbody>
            </table>
          </div>
          <p className="sl-fn" style={{ marginTop: 12 }}>Uwaga: raport oznaczony jako wersja wstępna („results may change"). Liczby cytowane z&nbsp;tabel 4–14 arXiv:2601.11579. Porównania z&nbsp;modelami zamkniętymi (GPT, Gemini, Claude) raport podaje tylko dla&nbsp;PLCC — tam Bielik 71,83 plasuje się poniżej frontier (Gemini-3.0-Pro 95,83), ale jako 1.&nbsp;open-source.</p>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">02</div>
            <div>
              <div className="sl-eye">brak wspólnej osi — porównanie uczciwe, nie apples-to-apples</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Bielik v3 ↔ <span className="sl-acc">Qwen3.6-27B.</span></h2>
            </div>
          </div>

          <div className="sl-note" style={{ marginTop: 22 }}>
            <div className="sl-clbl">▸ ostrzeżenie metodologiczne</div>
            <p><a href="https://huggingface.co/Qwen/Qwen3.6-27B" rel="noopener">Qwen3.6-27B</a> (wyd. 22.04.2026) <b>nie był odpalony na&nbsp;żadnym polskim benchmarku</b> z&nbsp;raportu Bielika. Zespół Qwen publikuje tylko benchmarki agentic/coding/general. Poniżej zestawiamy specyfikację oraz to, co&nbsp;<b>każdy zespół faktycznie zmierzył</b> — to&nbsp;<b>rozłączne</b> zestawy zadań, nie&nbsp;wolno ich odejmować.</p>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>specyfikacja</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Dwa różne <span className="sl-acc">backbone&apos;y.</span></h2>
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="sl-tbl">
              <thead><tr><th>Cecha</th><th>Bielik-11B-v3.0-Instruct</th><th>Qwen3.6-27B</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn">Parametry</td><td>11B (dense, depth up-scaling z&nbsp;Mistral 7B v0.2)</td><td>27B (dense)</td></tr>
                <tr><td className="sl-dn">Architektura</td><td>GQA + SwiGLU + RoPE, 50 warstw</td><td>hybryda Gated DeltaNet (linear attn) + Gated Attention, 3/4 warstw liniowe</td></tr>
                <tr><td className="sl-dn">Kontekst</td><td>32 768 → 131 072 (YaRN)</td><td>262 144 → ~1 010 000 (YaRN)</td></tr>
                <tr><td className="sl-dn">Języki</td><td>32 (PL-first)</td><td>201</td></tr>
                <tr><td className="sl-dn">Licencja</td><td><span className="sl-chip">Apache-2.0</span></td><td><span className="sl-chip">Apache-2.0</span></td></tr>
                <tr><td className="sl-dn">Wydanie</td><td>31.12.2025 (rynek UE)</td><td>22.04.2026</td></tr>
                <tr><td className="sl-dn">Optymalizacja</td><td>polski NLP, wiedza kulturowa, prawo/urząd</td><td>agentic coding, reasoning, tool-use, multilingual general</td></tr>
              </tbody>
            </table>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>różne benchmarki — nie da się zsumować na jedną liczbę</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Co każdy zespół <span className="sl-acc">zmierzył.</span></h2>
          <div className="sl-bento sl-bento-a" style={{ marginTop: 18 }}>
            <div className="sl-col sl-feat">
              <div className="sl-clbl">▸ bielik v3 · pl</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Polski + regresja EN</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>PLCC <b>71,83</b> (1. open-source) · Open PL LLM <b>65,93</b> · Belebele-EU <b>82,98</b> · EQ-Bench-PL <b>71,20</b> · Medical/PES <b>50,21</b> · Open LLM EN (stary) <b>72,45</b> (GSM8K 85,60, MMLU 71,11).</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ qwen3.6-27b · code</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Agentic / coding / reasoning</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>SWE-bench Verified <b>77,2</b> · SWE-bench Pro <b>53,5</b> · Terminal-Bench 2.0 <b>59,3</b> · SkillsBench <b>48,2</b> · GPQA Diamond <b>87,8</b>. Brak jakichkolwiek wyników na&nbsp;PLCC / Open PL LLM / PES.</p>
            </div>
          </div>

          <div className="sl-note" style={{ marginTop: 26 }}>
            <div className="sl-clbl">▸ wniosek</div>
            <p>Nawet na&nbsp;EN osie się rozjeżdżają — Bielik mierzony <b>starszym</b> Open LLM Leaderboard (ARC / MMLU / GSM8K), Qwen3.6 <b>nowymi</b> agentic (SWE-bench / GPQA Diamond). Jedyny realny apples-to-apples wymaga <b>odpalenia Qwen3.6-27B na&nbsp;polskich benchmarkach</b> — czego nikt jeszcze nie&nbsp;zrobił. To&nbsp;dokładnie luka, którą <a href="/kierunki" style={{ fontWeight: 500 }}>wypełnia Slayer</a>: mocny, świeży backbone klasy Qwen-27B zmierzony na&nbsp;polskim rdzeniu, którego Qwen nie&nbsp;raportuje.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
