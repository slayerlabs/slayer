export const metadata = {
  title: "Trening — metody fine-tuningu (SOTA 2026) | Slayer",
  description: "Metody fine-tuningu i alignmentu: SFT/QLoRA, DPO, ORPO, SimPO, KTO, GRPO/RLVR, merging — lineage SOTA 2026, pod niski budżet.",
};

export default function Trening() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-code"><b>trening</b><span>/ dane &amp; trening</span></div>
            <div>
              <div className="sl-eye">metody fine-tuningu · SOTA 2026</div>
              <h1 className="sl-h1" style={{ marginTop: 12 }}>Jak <span className="sl-acc">trenować</span> — tanio i&nbsp;czysto</h1>
              <p className="sl-lede" style={{ marginTop: 18 }}>Każdą zdolność budujemy na&nbsp;<b>niezależnych danych</b> i&nbsp;mierzymy na&nbsp;held-out — <a href="/benchmarks">bez benchmaxxingu</a>.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">lineage · co działa w&nbsp;2026, co było modą 2025</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Linia <span className="sl-acc">rodowa metod.</span></h2>

          <div className="sl-legend" style={{ marginTop: 16, marginBottom: 4 }}>
            <span><span className="sl-chip">SOTA 2026</span></span>
            <span><span className="sl-chip sl-mute">nadal użyteczne</span></span>
            <span><span className="sl-chip sl-warn">niszowe / wyparte</span></span>
            <span><span className="sl-chip sl-mute" style={{ textDecoration: "line-through" }}>legacy</span></span>
          </div>

          <div className="sl-steps" style={{ marginTop: 14 }}>
            <div className="sl-step">
              <div className="sl-step-when">2022</div>
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span className="sl-chip sl-mute" style={{ textDecoration: "line-through" }}>RLHF/PPO</span>
                  <span className="sl-chip sl-mute">LoRA (’21)</span>
                  <span className="sl-chip sl-mute">Self-Instruct</span>
                </div>
              </div>
            </div>
            <div className="sl-step">
              <div className="sl-step-when">2023</div>
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span className="sl-chip">DPO</span>
                  <span className="sl-chip sl-warn">IPO</span>
                  <span className="sl-chip">QLoRA</span>
                  <span className="sl-chip sl-mute">Evol-Instruct</span>
                </div>
              </div>
            </div>
            <div className="sl-step">
              <div className="sl-step-when">2024</div>
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span className="sl-chip">ORPO</span>
                  <span className="sl-chip sl-mute">SimPO</span>
                  <span className="sl-chip sl-mute">KTO</span>
                  <span className="sl-chip sl-warn">Self-Rewarding</span>
                  <span className="sl-chip">GRPO</span>
                  <span className="sl-chip sl-mute">DoRA</span>
                  <span className="sl-chip">Unsloth/Liger</span>
                  <span className="sl-chip">Magpie</span>
                </div>
              </div>
            </div>
            <div className="sl-step">
              <div className="sl-step-when">2025</div>
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span className="sl-chip">RLVR (R1)</span>
                  <span className="sl-chip">distylacja CoT</span>
                  <span className="sl-chip sl-warn">PRM</span>
                  <span className="sl-chip sl-mute">iterative DPO</span>
                  <span className="sl-chip sl-mute">mergekit</span>
                </div>
              </div>
            </div>
            <div className="sl-step">
              <div className="sl-step-when">2026</div>
              <div>
                <div className="sl-step-head">
                  <span className="sl-status sl-run">teraz</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  <span className="sl-chip">GRPO+RLVR = domyślne</span>
                  <span className="sl-chip">DPO/ORPO żyją</span>
                  <span className="sl-chip">QLoRA+merging</span>
                </div>
              </div>
            </div>
          </div>

          <p className="sl-lede" style={{ marginTop: 18 }}><span style={{ textDecoration: "line-through", color: "var(--sl-dim)" }}>RLHF/PPO</span> <span className="sl-acc">→</span> <b>DPO</b> (’23) <span className="sl-acc">→</span> <b>GRPO+RLVR</b> (’25, króluje przy weryfikowalnej nagrodzie).</p>

          <div className="sl-note" style={{ marginTop: 18 }}>
            <p><b>2026:</b> SFT (QLoRA) → DPO/ORPO → GRPO/RLVR na&nbsp;egzaminach. <b>Nie:</b> RLHF-PPO z&nbsp;modelem nagrody (wyparte); IPO i&nbsp;process-reward modele okazały się niszowe. KTO/SimPO = tańsze alternatywy DPO.</p>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">01 · dane · fundament</div>
          <h2 className="sl-h2" style={{ marginTop: 10, marginBottom: 22 }}>Dane.</h2>
          <div className="sl-cols">
            <div className="sl-col"><div className="sl-clbl">◆ rekom.</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Kurowany SFT</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Mały, czysty zbiór instrukcji PL &gt; duży i&nbsp;brudny (LIMA).</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ tanie</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Syntetyczne</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Magpie, Evol-Instruct, self-instruct → filtruj.</p></div>
            <div className="sl-col"><div className="sl-clbl">◆ moat</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Domena prawnicza</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>ISAP, SAOS → pary „kontekst→odpowiedź z&nbsp;cytatem&quot;.</p></div>
            <div className="sl-col"><div className="sl-clbl">◆ czystość</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Dekontaminacja</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>n-gram/embedding overlap vs zbiory testowe.</p></div>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>02 · SFT · tanio na&nbsp;1 GPU</div>
          <h2 className="sl-h2" style={{ marginTop: 10, marginBottom: 22 }}>SFT.</h2>
          <div className="sl-cols">
            <div className="sl-col"><div className="sl-clbl">◆ rekom.</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>QLoRA / LoRA</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>4-bit + adaptery → 11–14B na&nbsp;jednym GPU.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ zaawans.</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>DoRA / LoRA+</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Bliżej full-FT przy podobnym koszcie.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ tanie</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Unsloth / Liger</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>2–4× szybciej, mniej VRAM.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ tanie</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>NEFTune + packing</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Darmowy zysk jakości i&nbsp;przepustowości.</p></div>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>03 · preferencje · offline, bez ciężkiego RLHF</div>
          <h2 className="sl-h2" style={{ marginTop: 10, marginBottom: 22 }}>Preferencje.</h2>
          <div className="sl-cols">
            <div className="sl-col"><div className="sl-clbl">◆ sprawdzone</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>DPO</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Pary lepsza/gorsza, stabilne, bez modelu nagrody.</p></div>
            <div className="sl-col"><div className="sl-clbl">◆ 1 etap</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>ORPO</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>SFT + preferencje naraz, bez modelu ref.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ tańsze</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>SimPO / KTO</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Ref-free / bez par — łatwiej o&nbsp;dane.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ zaawans.</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Iterative DPO</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Generuj → oceń (RLAIF) → dotrenuj, w&nbsp;pętli.</p></div>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>04 · RL na&nbsp;weryfikowalnych nagrodach · przełom pod egzaminy</div>
          <h2 className="sl-h2" style={{ marginTop: 10, marginBottom: 22 }}>RL na&nbsp;weryfikowalnych nagrodach.</h2>
          <div className="sl-cols">
            <div className="sl-col"><div className="sl-clbl">◆ pod egzaminy</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>GRPO</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>RL bez modelu wartości. Nagroda = poprawna litera.</p></div>
            <div className="sl-col"><div className="sl-clbl">◆ pod target</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>RLVR</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Egzaminy mają klucz → tania, mocna nagroda.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ tanie</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Distylacja CoT</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Łańcuchy myślenia z&nbsp;mocnego nauczyciela.</p></div>
          </div>

          <div className="sl-eye" style={{ marginTop: 44 }}>05 · tanie triki budżetowe</div>
          <h2 className="sl-h2" style={{ marginTop: 10, marginBottom: 22 }}>Tanie triki budżetowe.</h2>
          <div className="sl-cols">
            <div className="sl-col"><div className="sl-clbl">▸ 0 treningu</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Model merging</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>mergekit TIES/DARE/SLERP — często darmowy zysk.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ hipoteza</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Tokenizer PL</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Krótsze sekwencje, tańszy inference.</p></div>
            <div className="sl-col"><div className="sl-clbl">▸ tanie</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Long-context</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>YaRN/RoPE-scaling pod długie pisma.</p></div>
            <div className="sl-col"><div className="sl-clbl">◆ najtańsze</div><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Wybór bazy</h3><p className="sl-lede" style={{ fontSize: 14.5 }}>Start z&nbsp;mocniejszej bazy — stąd <a href="/leaderboard">leaderboard</a>.</p></div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">03</div>
            <div>
              <div className="sl-eye">referencja · raport techniczny 11B v3</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Jak trenowano <span className="sl-acc">Bielika.</span></h2>
              <p className="sl-lede" style={{ marginTop: 12 }}>Pełny, kosztowny pipeline. My startujemy z&nbsp;mocniejszej bazy (Qwen3.5-27B) i&nbsp;<b>pomijamy najdroższy etap (CPT)</b> — to sedno „super tanio + epsilon&quot;.</p>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col">
              <div className="sl-clbl">▸ Bielik 11B v3 (referencja)</div>
              <ul className="sl-list" style={{ fontSize: 14.5, lineHeight: 1.85, color: "var(--sl-mut)" }}>
                <li>Baza: Mistral 7B, <b style={{ color: "var(--sl-ink)" }}>Depth Up-Scaling</b> do&nbsp;11B; tokenizer Mistral (<b style={{ color: "var(--sl-ink)" }}>bez rozszerzania PL</b>)</li>
                <li><b style={{ color: "var(--sl-ink)" }}>CPT ~1.1T tokenów</b> (54% PL/20% EN; akty prawne, orzeczenia, sejm, Wikipedia) + merging</li>
                <li><b style={{ color: "var(--sl-ink)" }}>SFT</b> ~20M instrukcji, instruction-masking, sample-packing</li>
                <li><b style={{ color: "var(--sl-ink)" }}>DPO + DPO-P</b> 114k par (pary gen. m.in. <b style={{ color: "var(--sl-ink)" }}>DeepSeek-V3</b>)</li>
                <li><b style={{ color: "var(--sl-ink)" }}>GRPO + Dr.GRPO / RLVR</b> 143k zadań; weryfikatory: matma <code>\boxed</code>, <b style={{ color: "var(--sl-ink)" }}>STEM MCQ</b>, tool-use</li>
              </ul>
            </div>
            <div className="sl-col sl-col-block">
              <div className="sl-clbl">◆ nasza tańsza ścieżka</div>
              <ul className="sl-list" style={{ fontSize: 14.5, lineHeight: 1.85, color: "#fff" }}>
                <li>Baza: <b>Qwen3.5-27B</b> — bije Bielika już off-the-shelf → <b>pomijamy CPT</b> (największy koszt); 9B służy tylko do&nbsp;tanich iteracji</li>
                <li><b>QLoRA SFT</b> na&nbsp;kurowanych PL + arkuszach zawodowych (nie pełne 20M)</li>
                <li><b>ORPO/DPO</b> na&nbsp;mniejszym, celowanym zbiorze par</li>
                <li><b>GRPO/RLVR z&nbsp;weryfikatorem MCQ</b> — dokładnie dźwignia pod <b>LLMzSzŁ</b></li>
                <li>Generowanie danych: <b>DeepSeek</b> (jak Bielik) — <a href="/datasety" style={{ color: "#fff", textDecoration: "underline" }}>dane pod LLMzSzŁ</a></li>
              </ul>
            </div>
          </div>
          <div className="sl-note" style={{ marginTop: 22 }}>
            <p><b>Wniosek z&nbsp;raportu:</b> rozszerzanie tokenizera PL okazało się zbędne (Bielik go nie ruszał), a&nbsp;RLVR z&nbsp;weryfikatorem MCQ to sprawdzona dźwignia na&nbsp;egzaminy — zgodne z&nbsp;naszym planem.</p>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">04</div>
            <div>
              <div className="sl-eye">fertility (tokeny/słowo) · niżej = wydajniej</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Tokenizer — dlaczego <span className="sl-acc">nie rozszerzamy.</span></h2>
              <p className="sl-lede" style={{ marginTop: 12 }}>Zmierzyliśmy fertility na&nbsp;tej samej próbce Wikipedii (PL+EN). Tokenizer Qwena jest <b>~23% wydajniejszy na&nbsp;polskim</b> niż Bielika/Mistrala — tańszy inference i&nbsp;dłuższy efektywny kontekst (ważne dla długich pism). Przewagę dostajemy <b>za darmo, wyborem bazy</b>. Skrypt: <a href="https://github.com/slayerlabs/slayer/blob/main/bench/tokenizer_fertility.py" rel="noopener">tokenizer_fertility.py</a>.</p>
            </div>
          </div>
          <div style={{ overflowX: "auto", marginTop: 22 }}>
            <table className="sl-tbl">
              <thead><tr><th>Tokenizer</th><th className="sl-c">vocab</th><th className="sl-c">TpW&nbsp;PL ↓</th><th className="sl-c">CpT&nbsp;PL ↑</th><th className="sl-c">TpW&nbsp;EN</th><th className="sl-c">PL/EN</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn">Gemma-2-9B</td><td className="sl-s">256k</td><td className="sl-s">2.244</td><td className="sl-s">3.31</td><td className="sl-s">1.340</td><td className="sl-s">1.68</td></tr>
                <tr><td className="sl-dn">Qwen3.5 (9B/27B) <span className="sl-chip">nasza baza: 27B</span></td><td className="sl-s">248k</td><td className="sl-s sl-win">2.357</td><td className="sl-s">3.15</td><td className="sl-s">1.385</td><td className="sl-s">1.70</td></tr>
                <tr><td className="sl-dn">Llama-3.1-8B</td><td className="sl-s">128k</td><td className="sl-s">2.743</td><td className="sl-s">2.71</td><td className="sl-s">1.343</td><td className="sl-s">2.04</td></tr>
                <tr><td className="sl-dn">Bielik-11B-v3 = Mistral-7B<span style={{ color: "var(--sl-mut)", fontSize: 12, display: "block", marginTop: 3 }}>Bielik zostawił tokenizer Mistrala (32k)</span></td><td className="sl-s">32k</td><td className="sl-s">3.060</td><td className="sl-s">2.43</td><td className="sl-s">1.544</td><td className="sl-s">1.98</td></tr>
              </tbody>
            </table>
          </div>
          <p className="sl-fn" style={{ marginTop: 12 }}>TpW = tokeny/słowo (niżej = wydajniej) · CpT = znaki/token (wyżej = wydajniej) · PL/EN = o&nbsp;ile bardziej token-głodny polski. Próbka: ~200 akapitów Wikipedii PL i&nbsp;EN.</p>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">recepta · sekwencja, nie wszystko naraz</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Rekomendowana <span className="sl-acc">recepta.</span></h2>
          <div className="sl-steps" style={{ marginTop: 22 }}>
            <div className="sl-step"><div className="sl-step-no">01</div><div><h3>Wybierz bazę</h3><p>Wg leaderboardu — start z&nbsp;mocniejszej = najtańszy zysk.</p></div></div>
            <div className="sl-step"><div className="sl-step-no">02</div><div><h3>QLoRA SFT</h3><p>Kurowane PL + domenowe, Unsloth/Liger.</p></div></div>
            <div className="sl-step"><div className="sl-step-no">03</div><div><h3>ORPO / DPO</h3><p>Preferencje; ORPO oszczędza etap i&nbsp;VRAM.</p></div></div>
            <div className="sl-step"><div className="sl-step-no">04</div><div><h3>GRPO/RLVR na&nbsp;egzaminach</h3><p>Weryfikowalna nagroda pod target.</p></div></div>
            <div className="sl-step"><div className="sl-step-no">05</div><div><h3>Odmowa + RAG-aware</h3><p>Grounding i&nbsp;„nie wiem&quot; na&nbsp;niezależnych danych.</p></div></div>
            <div className="sl-step"><div className="sl-step-no">06</div><div><h3>Merging</h3><p>mergekit między checkpointami; mierz na&nbsp;held-out.</p></div></div>
          </div>
          <div className="sl-note" style={{ marginTop: 22 }}>
            <p><b>Czystość:</b> żadnej metody nie kierujemy na&nbsp;dane testowe. <a href="/benchmarks">Metodologia →</a></p>
          </div>
        </div>
      </section>
    </main>
  );
}
