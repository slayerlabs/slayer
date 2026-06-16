export const metadata = {
  title: "Propozycja v3 — czysty model PL | Slayer",
  description: "Protokół v3: czysty korpus PL, CPT, SFT, DPO, dekontaminacja i claimy tylko z held-out. Applied research plan przed właściwym runem.",
};

export default function Propozycja() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-code"><b>propozycja</b><span>/ protokół</span></div>
            <div>
              <span className="sl-status sl-open">bieżący protokół · otwarte na uwagi</span>
              <h1 className="sl-h1" style={{ marginTop: 16 }}>Protokół <span className="sl-acc">v3</span> — czysty model, realna&nbsp;dźwignia</h1>
              <p className="sl-lede" style={{ marginTop: 22, maxWidth: "62ch" }}>Chcemy model, który <b>wychodzi dobrze na KLEJ bez trenowania na&nbsp;jego train/test</b> — tylko na&nbsp;tym, co&nbsp;się <b>generalizuje</b>. To jest mapa przed runem: hipoteza, dane, koszt, gate&nbsp;publikacji.</p>
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
              <div className="sl-eye">którą grę gramy</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Dwa różne <span className="sl-acc">benchmarki.</span></h2>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col">
              <div className="sl-clbl">▸ klejbenchmark.com</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Benchmark <b>enkoderów</b>, fine-tune per&nbsp;zadanie na&nbsp;train-splicie (top: Polish RoBERTa-v2, 88.9). Tu train-on-train to&nbsp;standard.</p>
            </div>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ Open PL LLM Leaderboard ← gramy to</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Model <b>generatywny, 5-shot</b>, bez fine-tune na&nbsp;zadaniu. Dlatego u&nbsp;nas <b>zero train-splitów</b> — inaczej to&nbsp;benchmaxxing nieporównywalny z&nbsp;5-shot.</p>
            </div>
          </div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">02</div>
            <div>
              <div className="sl-eye">teza</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Dźwignią jest duży, czysty, różnorodny <span className="sl-acc">korpus PL.</span></h2>
              <p className="sl-lede" style={{ marginTop: 16 }}>Lekcja z&nbsp;polish-roberta (Dadas): <b>135 GB / ponad miliard polskich zdań</b> + standardowy fine-tune dał #1 na&nbsp;KLEJ. Żadnych trików — skala i&nbsp;czystość korpusu. Replikujemy <b>ducha</b> dla modelu generatywnego: dużo różnorodnych danych <b>zdolności</b> i&nbsp;<b>wiedzy</b>, czysto.</p>
            </div>
          </div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-col sl-col-block" style={{ boxShadow: "none" }}>
            <div className="sl-clbl">▸ głos społeczności · wbudowany</div>
            <h3 className="sl-h2" style={{ marginBottom: 10 }}>„Bez pretreningu nie&nbsp;dodasz mu wiedzy (np. o&nbsp;Polsce)&quot;</h3>
            <p className="sl-lede" style={{ color: "#fff" }}><b style={{ color: "#fff" }}>Słuszne.</b> SFT uczy <i>umiejętności</i> i&nbsp;wydobywa to, co&nbsp;model już wie — <b style={{ color: "#fff" }}>nie dodaje nowej wiedzy</b>. Wiedza powstaje w&nbsp;pretreningu. Dodatkowo: <b style={{ color: "#fff" }}>cienki DoRA (low-rank) i&nbsp;tak nie&nbsp;pomieści wiedzy</b>. Dlatego rozdzielamy fazy i&nbsp;dorzucamy realny <b style={{ color: "#fff" }}>CPT</b>:</p>
          </div>

          <div style={{ overflowX: "auto", marginTop: 22 }}>
            <table className="sl-tbl">
              <thead><tr><th>faza</th><th>metoda</th><th>co daje</th><th>adapter</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn">1. CPT (wiedza)</td><td>continued pretraining (next-token) na&nbsp;czystym korpusie PL: Wiki PL, Wolne Lektury, książki, akademickie + EntiGraph synthetic; replay 20–30% przeciw zapominaniu</td><td className="sl-dn">wiedza o&nbsp;Polsce</td><td>full-FT lub <b>high-rank</b> (r=128–256), <b>nie cienki DoRA</b></td></tr>
                <tr><td className="sl-dn">2. SFT (umiejętności)</td><td>dystylacja zdolności</td><td><i>jak</i> użyć wiedzy (zadania)</td><td>DoRA OK</td></tr>
                <tr><td className="sl-dn">3. DPO</td><td>on-policy, sędzia otwarty</td><td>preferencje/styl</td><td>DoRA OK</td></tr>
              </tbody>
            </table>
          </div>

          <p className="sl-lede" style={{ fontSize: 14.5, marginTop: 16 }}>Kolejność: <b>wiedza → umiejętności → preferencje</b>. EntiGraph (synthetic CPT) = tańszy, sample-efficient sposób wstrzyknięcia wiedzy: rozlewa fakty na&nbsp;wiele sformułowań zamiast zapamiętywać dosłownie.</p>

          <div className="sl-note" style={{ marginTop: 16 }}>
            <p><b>Zbieramy korpus wiedzy PL.</b> Szukamy otwartych źródeł (zwłaszcza pod LLMzSzŁ akademicki, PES medyczny): podręczniki, skrypty, otwarte materiały. Masz źródło / dataset? Wrzuć na&nbsp;Discord.</p>
          </div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">03</div>
            <div>
              <div className="sl-eye">eval NAJPIERW · gate przed pierwszym dolarem</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>PolKnowledge bench — <span className="sl-acc">known / unknown.</span></h2>
              <p className="sl-lede" style={{ marginTop: 16 }}>Z&nbsp;budżetem na&nbsp;CPT pytanie brzmi nie „czy&quot;, tylko „<b>ile</b>&quot;. A&nbsp;tego nie&nbsp;zmierzysz Open PL LLM Leaderboardem — on <b>nie mierzy długiego ogona</b> (lokalne realia, prawo, regionalia, idiomy). Dlatego <b>przed treningiem</b> budujemy własny eval wiedzy o&nbsp;Polsce:</p>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col">
              <div className="sl-clbl">▸ co</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Sonda wiedzy długiego ogona PL: historia, prawo/orzecznictwo, geografia, regionalia, idiomy, kultura, współczesność. Każde pytanie z&nbsp;<b>weryfikowalną</b> odpowiedzią. Held-out, deduplikowane, NIE wchodzi do&nbsp;CPT.</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ po co</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Punkt odniesienia <b>Qwen3.5-27B vs Bielik</b> per&nbsp;domenę → mapa luk → <b>wymiaruje CPT</b> (10B czy 40B tokenów, które domeny). Bez tego nie&nbsp;wiesz, czy CPT cokolwiek dał.</p>
            </div>
          </div>
          <p className="sl-lede" style={{ fontSize: 14.5, marginTop: 16 }}>To też publiczny <b>zasób</b> — dowód, że&nbsp;pobiliśmy Bielika tam, gdzie miał być najmocniejszy (pasuje do&nbsp;CodeSOTA/leaderboardów wiedzy).</p>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">04</div>
            <div>
              <div className="sl-eye">CPT · jak dodać wiedzę o Polsce</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Pre-training (continued) na&nbsp;czystym <span className="sl-acc">korpusie PL.</span></h2>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col">
              <div className="sl-clbl">▸ 1 · korpus</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Wikipedia PL (CC-BY-SA), Wolne Lektury (PD), Wikibooks/Wikisource, książki open-access, skrypty akademickie (pod LLMzSzŁ). Dodajemy do&nbsp;Qwen: kilka–kilkadziesiąt GB wystarczy (Dadas miał 135 GB od&nbsp;zera).</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 2 · przygotowanie</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>dedup (MinHash) → filtr jakości (boilerplate) → <b>dedup vs 17 707 atomów test</b> → tokenizacja.</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 3 · CPT (Ibrahim 2024)</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>causal LM ze&nbsp;startu z&nbsp;Qwen3.5-27B, <b>full-FT bf16</b> (8×H100 FSDP + activation ckpt — mieści się). <b>Re-warm LR do&nbsp;~1e-5</b> (nie pretrainingowe 3e-4), cosine. <b>Replay 30–40%</b> (EN/kod/matma); błąd = 100% PL → piękna polszczyzna, głupszy model.</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 4 · miks korpusu</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}><b>60–70% PL</b> (SpeakLeash przefiltrowany + FineWeb-2 PL + Wiki PL + prawo/orzecznictwo) + <b>30–40% replay</b>. Albo EntiGraph synthetic (Yang 2024): encje → warianty → rozlewa wiedzę, sample-efficient.</p>
            </div>
          </div>
          <div className="sl-note" style={{ marginTop: 16 }}>
            <div className="sl-clbl">◆ wykonalność / budżet (~$80k)</div>
            <p>full-FT 27B bf16 ≈ 430–450 GB stanów → mieści się na&nbsp;8×H100 (640 GB) z&nbsp;FSDP, bez QLoRA. ~20k tok/s @40% MFU → 10B tok ≈ 5–6 dni ≈ $5–6k. <b>CPT 30–40B tok ≈ $18–25k</b> + SFT $3–5k + bufor na&nbsp;ablacje $10–15k → starcza na&nbsp;<b>2–3 podejścia z&nbsp;ewalem między nimi</b>, nie jeden heroiczny run.</p>
          </div>
          <div className="sl-note" style={{ marginTop: 14 }}>
            <div className="sl-clbl">◆ dyscyplina</div>
            <p>pipeline (tokenizacja/packing/miks/resume) dopracować na&nbsp;<b>4×3090</b>; H100 wynajmować dopiero na&nbsp;właściwe runy z&nbsp;gotowym configiem. Capacity blocks na&nbsp;konkretne okna, checkpoint co&nbsp;godzinę na&nbsp;S3.</p>
          </div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">05</div>
            <div>
              <div className="sl-eye">silniki danych · umiejętności + preferencje (fazy 2–3)</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Warstwy danych <span className="sl-acc">i ich udział.</span></h2>
            </div>
          </div>
          <div style={{ overflowX: "auto", marginTop: 22 }}>
            <table className="sl-tbl">
              <thead><tr><th>warstwa</th><th className="sl-c">udział</th><th>co</th><th>czyste</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn">Destylacja zdolności</td><td className="sl-s">~40%</td><td>teacher wymyśla różnorodne PL ucząc <i>umiejętności</i> zadań (sentyment, NLI, parafraza, QA-poprawność, rozumienie, temat, toksyczność, NER) — naturalny format, nie szablon KLEJ</td><td className="sl-acc">✅ dedup</td></tr>
                <tr><td className="sl-dn">Wiedza z&nbsp;korpusu</td><td className="sl-s">~20%</td><td>synthetic-CPT (EntiGraph) nad otwartym PL: Wiki PL, Wolne Lektury, Wikibooks, ZPE</td><td className="sl-acc">✅ dedup</td></tr>
                <tr><td className="sl-dn">Ludzkie PL</td><td className="sl-s">~15%</td><td>Aya-PL (native) + OASST-PL + nasz styl</td><td className="sl-acc">✅</td></tr>
                <tr><td className="sl-dn">EN retencja</td><td className="sl-s">~20%</td><td>Tulu 3 / Dolci (odc-by) — by nie&nbsp;zapominać kodu/matmy</td><td className="sl-acc">✅</td></tr>
                <tr><td className="sl-dn">DPO</td><td className="sl-s">~5%</td><td>on-policy pary z&nbsp;naszego modelu, sędzia = otwarty Qwen</td><td className="sl-acc">✅</td></tr>
              </tbody>
            </table>
          </div>
          <p className="sl-lede" style={{ fontSize: 14.5, marginTop: 16 }}>Teacher = deepseek-v4-pro (MIT), sędzia = otwarty Qwen3.5 (Apache). <b>Zero Anthropic/OpenAI</b> jako źródło czy filtr. Polski od&nbsp;zera, nie tłumaczenie.</p>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">06</div>
            <div>
              <div className="sl-eye">gwarancja czystości</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Benchmark = blocklista i&nbsp;miara, <span className="sl-acc">nigdy źródło.</span></h2>
              <p className="sl-lede" style={{ marginTop: 16 }}>Każdy wygenerowany przykład jest <b>deduplikowany przeciw 17 707 atomom</b> ze&nbsp;wszystkich test-splitów KLEJ. Pełny <b>lineage jawny</b> — każdy model i&nbsp;jego dokładny skład na&nbsp;prywatnym HF. (v2 jest u&nbsp;nas oznaczony jako KONTAMINACJA — uczciwie.)</p>
            </div>
          </div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">07</div>
            <div>
              <div className="sl-eye">korpus regresji · żeby nie cofać się gdzie indziej</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Stały zestaw kontrolny <span className="sl-acc">po każdym runie.</span></h2>
            </div>
          </div>
          <div style={{ overflowX: "auto", marginTop: 22 }}>
            <table className="sl-tbl">
              <thead><tr><th>wymiar</th><th>miara</th><th>po co</th></tr></thead>
              <tbody>
                <tr><td className="sl-dn">PL NLU</td><td><b>KLEJ test · 5-shot</b> (held-out)</td><td>główny cel</td></tr>
                <tr><td className="sl-dn">PL czat/jakość</td><td>MT-Bench-PL</td><td>czy nie&nbsp;psujemy generacji</td></tr>
                <tr><td className="sl-dn">EN retencja</td><td>MMLU · ARC-C · GSM8K</td><td>czy nie&nbsp;zapomina (kod/matma/wiedza)</td></tr>
                <tr><td className="sl-dn">PL wiedza</td><td>LLMzSzŁ / PES (held-out)</td><td>efekt silnika wiedzy</td></tr>
                <tr><td className="sl-dn">Styl PL</td><td>własna sonda ~200 promptów</td><td>fleksja, brak translationese/myślników</td></tr>
              </tbody>
            </table>
          </div>
          <div className="sl-note" style={{ marginTop: 16 }}>
            <div className="sl-clbl">◆ reguła publikacji</div>
            <p>tylko jeśli <b>5-shot KLEJ ↑ ORAZ MT-Bench-PL ↑</b> i&nbsp;EN retencja nie&nbsp;spada. Inaczej = regres, nie&nbsp;publikujemy.</p>
          </div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">08</div>
            <div>
              <div className="sl-eye">otwarte pytania · tu chcemy waszego głosu</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Co jest jeszcze <span className="sl-acc">otwarte.</span></h2>
            </div>
          </div>
          <div className="sl-entries" style={{ marginTop: 22 }}>
            <div className="sl-entry"><div className="sl-no">01</div><div><h3>CPT: raw czy EntiGraph?</h3><p>surowy continued-pretraining na&nbsp;korpusie, czy syntetyczny (EntiGraph, sample-efficient), czy mix?</p></div></div>
            <div className="sl-entry"><div className="sl-no">02</div><div><h3>CPT: full-FT vs high-rank?</h3><p>pełny fine-tune 27B (drogo, najlepiej dla wiedzy) czy high-rank QLoRA (r=128–256, tańszy kompromis)?</p></div></div>
            <div className="sl-entry"><div className="sl-no">03</div><div><h3>Źródła korpusu wiedzy</h3><p>Wiki PL + Wolne Lektury wystarczą, czy CCNet-PL / domeny (prawo, medycyna, akademickie pod LLMzSzŁ/PES)?</p></div></div>
            <div className="sl-entry"><div className="sl-no">04</div><div><h3>Waga warstw</h3><p>ile CPT vs SFT vs DPO?</p></div></div>
            <div className="sl-entry"><div className="sl-no">05</div><div><h3>Sonda regresji</h3><p>jakie zdolności PL pilnować poza KLEJ? Co was boli w&nbsp;polskich modelach?</p></div></div>
            <div className="sl-entry"><div className="sl-no">06</div><div><h3>Baza</h3><p>Qwen3.5-27B, czy też linia 11–14B (tańsza, bliżej Bielika)?</p></div></div>
          </div>
        </div>
      </section>


      <section className="sl-sec">
        <div className="sl-inner" style={{ maxWidth: 760, marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
          <div className="sl-eye" style={{ display: "block" }}>masz zdanie?</div>
          <h2 className="sl-h2" style={{ margin: "12px 0 14px" }}>Zanim to zbudujemy — <span className="sl-acc">powiedz.</span></h2>
          <p className="sl-lede" style={{ margin: "0 auto 24px" }}>To protokół badawczy przed runem. Dataset v3 powstaje publicznie i&nbsp;chcemy go poprawić z&nbsp;waszymi uwagami.</p>
          <div className="sl-cta" style={{ justifyContent: "center" }}>
            <a className="sl-btn sl-btn-p" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">podziel się uwagami →</a>
          </div>
          <p className="sl-fn" style={{ textAlign: "center", marginTop: 22 }}>propozycja otwarta · źródło: <a href="https://github.com/slayerlabs" rel="noopener" style={{ color: "var(--sl-acc)" }}>GitHub</a> · zmienia się z&nbsp;waszymi uwagami</p>
        </div>
      </section>
    </main>
  );
}
