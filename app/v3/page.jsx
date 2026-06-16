export const metadata = {
  title: "v3 — propozycja miksu danych (czysta linia) | Slayer",
  description:
    "Slayer v3: czysty miks SFT (zero train/test splitów benchmarków), program wiedzy synthetic CPT i plan DPO. Skład, proporcje, provenance i bramki jakości — wszystko audytowalne.",
};

export default function V3() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-eye">propozycja · linia v3 · czysta z&nbsp;konstrukcji</div>
          <h1 className="sl-h1">v3: czysty <span className="sl-acc">miks danych</span></h1>
          <p className="sl-lede">v2 nauczyło nas, jak wygląda skażenie train-splitami; v3 jest czyste z&nbsp;konstrukcji: benchmarki są
          wyłącznie miarą i&nbsp;blocklistą, każda warstwa przechodzi audyt verbatim, a&nbsp;wszystko, co weszło do treningu,
          da się wskazać co do rekordu. Claim publiczny: tylko held-out, 5-shot.</p>
        </div>
      </section>

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">1 · miks SFT</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Skład <span className="sl-acc">train_v3.jsonl.</span></h2>
          <p className="sl-lede" style={{ marginTop: 12 }}>2 239 przykładów · seed 42 · stan 2026-06-11. Cztery warstwy, każda z&nbsp;własnym rodowodem.</p>

          <div className="sl-stack" style={{ marginTop: 22 }}>
            <span className="sl-seg1" style={{ width: "45.6%" }} />
            <span className="sl-seg2" style={{ width: "16.7%" }} />
            <span className="sl-seg3" style={{ width: "15.4%" }} />
            <span className="sl-seg4" style={{ width: "22.3%" }} />
          </div>
          <div className="sl-legend">
            <span><i className="sl-seg1" />destylacja własna 46% · 1022 ex</span>
            <span><i className="sl-seg2" />Bielik-distill verified 17% · 374 ex</span>
            <span><i className="sl-seg3" />human PL 15% · 344 ex</span>
            <span><i className="sl-seg4" />EN retention 22% · 499 ex</span>
          </div>

          <div className="sl-entries" style={{ marginTop: 26 }}>
            <div className="sl-entry">
              <div className="sl-no">46%</div>
              <div>
                <h3>Destylacja własna — 10 zdolności</h3>
                <p>Teacher (deepseek-v4-pro) WYMYŚLA różnorodne przykłady uczące umiejętności stojących za zadaniami PL:
                sentyment, temat, parafraza, NLI, poprawność QA, rozumienie tekstu, moderacja, nazwy własne, oceny recenzji
                plus instrukcje ogólne. Naturalne, zmienne sformułowania — nigdy format ani treść benchmarków.</p>
                <p className="sl-fn">sentiment 111 · topic 120 · paraphrase 98 · nli 104 · qa_correctness 116 · reading 117 · toxicity 125 · ner 25 · rating 106 · general 100</p>
              </div>
            </div>
            <div className="sl-entry">
              <div className="sl-no">17%</div>
              <div>
                <h3>Bielik-distill, frakcja zweryfikowana</h3>
                <p>Zewnętrzny zbiór destylacji z&nbsp;Bielika-11B (Apache-2.0). Surowy miał 51% poważnych błędów faktograficznych,
                więc każdy rekord ocenił niezależny otwarty sędzia; do miksu wchodzą wyłącznie przykłady z&nbsp;czystymi faktami
                i&nbsp;naturalną polszczyzną (4 091 z&nbsp;9 769 w&nbsp;puli). Werdykty per rekord opublikowane do audytu.</p>
                <p className="sl-fn">źródło: bielik11b_distill_external · sędzia: Qwen3.5-122B (open) · pula verified: 4091</p>
              </div>
            </div>
            <div className="sl-entry">
              <div className="sl-no">15%</div>
              <div>
                <h3>Human PL + styl</h3>
                <p>Ludzkie polskie instrukcje (Aya, OASST2) plus nasz re-judged zbiór stylu w&nbsp;wersji rozłącznej z&nbsp;holdoutem
                ewaluacji (wyciek 85 promptów wykryty audytem i&nbsp;usunięty zanim cokolwiek trenowaliśmy).</p>
                <p className="sl-fn">aya_pl_human 124 · oasst2_pl_human 96 · qwen_raw_teacher_rewrite (styl, holdout-disjoint) 124</p>
              </div>
            </div>
            <div className="sl-entry">
              <div className="sl-no">22%</div>
              <div>
                <h3>EN retention — anty-zapominanie</h3>
                <p>Osiem podzbiorów Tulu 3 (odc-by): matematyka, kod, nauka. Pilnuje, żeby tuning polski nie zjadał
                kompetencji bazowych; czytane razem z&nbsp;gate&apos;ami regresji (MMLU, ARC, GSM8K, HumanEval, Δ ≥ −0.5 pp).</p>
                <p className="sl-fn">personahub_math 77 · personas-code 74 · math-grade 73 · gsm8k 66 · numinamath 66 · algebra 62 · evol_code 62 · sciriff 19</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">02</div>
            <div>
              <div className="sl-eye">warstwa wiedzy · CPT, osobny tor</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Wiedza składana, <span className="sl-acc">nie odtwarzana.</span></h2>
              <p className="sl-lede" style={{ marginTop: 12 }}>Szczegóły i&nbsp;hipotezy: <a href="/wiedza">/wiedza</a>.</p>
            </div>
          </div>

          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-block">
              <div className="sl-clbl">▸ entigraph</div>
              <div className="sl-num">10<span className="sl-acc">M</span></div>
              <p className="sl-lede" style={{ fontSize: 14.5, marginTop: 12 }}>Tokenów · 92k doków. Fakty z&nbsp;6.5k artykułów PL-focus zmultiplikowane w&nbsp;relacje, parafrazy, streszczenia i&nbsp;QA. ~100k faktów.</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ graf 2-hop</div>
              <div className="sl-num">2<span className="sl-acc">k</span></div>
              <p className="sl-lede" style={{ fontSize: 14.5, marginTop: 12 }}>Doków kompozycyjnych. Graf 274k encji / 2M krawędzi; ścieżki A→B→C dają pomosty i&nbsp;wielohopowe QA (wiedza składana, nie odtwarzana).</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ ZPE</div>
              <div className="sl-num">60<span className="sl-acc">k+</span></div>
              <p className="sl-lede" style={{ fontSize: 14.5, marginTop: 12 }}>Akapitów egzaminacyjnych. Rządowe e-materiały (podstawa programowa) w&nbsp;kolejce do multiplikacji: materiał dokładnie pod LLMzSzŁ.</p>
            </div>
          </div>

          <div className="sl-note" style={{ marginTop: 22 }}>
            <div className="sl-clbl">▸ kolejność treningu (V3_PROPOSAL)</div>
            <p>Wiedza (CPT, high-rank QLoRA) → umiejętności (SFT, miks wyżej) → preferencje (DPO na parach on-policy ocenianych otwartym sędzią; pula par stylu: 1 581). Każdy etap z&nbsp;probe&apos;em wiedzy i&nbsp;gate&apos;ami regresji przed przejściem dalej.</p>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">03</div>
            <div>
              <div className="sl-eye">bramki jakości</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Co musiał przejść <span className="sl-acc">każdy rekord.</span></h2>
            </div>
          </div>

          <div className="sl-entries" style={{ marginTop: 22 }}>
            <div className="sl-entry"><div className="sl-no">01</div><div><h3>Zero benchmarków</h3><p>Twardy bezpiecznik w&nbsp;assemblerze: jakiekolwiek źródło KLEJ-owe w&nbsp;puli przerywa budowę miksu.</p><p className="sl-fn">forbidden-sources guard</p></div></div>
            <div className="sl-entry"><div className="sl-no">02</div><div><h3>Audyt verbatim 8-gram</h3><p>vs wszystkie zbiory testowe i&nbsp;held-outy (328k n-gramów). Złapał m.in. 9% kolizji w&nbsp;syntetycznych MCQ i&nbsp;wyciek 85 promptów stylu.</p><p className="sl-fn">decon_audit.py</p></div></div>
            <div className="sl-entry"><div className="sl-no">03</div><div><h3>Weryfikacja faktów</h3><p>Zewnętrznych danych otwartym sędzią, rekord po rekordzie; odpadło 51% zbioru Bielik-distill.</p><p className="sl-fn">verify_external_sft.py</p></div></div>
            <div className="sl-entry"><div className="sl-no">04</div><div><h3>Filtr stylu</h3><p>Nadużycie myślników wycina rekord (AI-tell); 229 przykładów odpadło z&nbsp;miksu.</p><p className="sl-fn">dash-rate ≤ 1.5/100 słów</p></div></div>
            <div className="sl-entry"><div className="sl-no">05</div><div><h3>Dedup</h3><p>Promptów między warstwami + balans per źródło (cap, żaden podzbiór nie dominuje).</p><p className="sl-fn">sha1 + per-source cap</p></div></div>
            <div className="sl-entry"><div className="sl-no">06</div><div><h3>Provenance per rekord</h3><p>Źródło, teacher, sędzia i&nbsp;ścieżka grafu zapisane przy każdym przykładzie; raport miksu publikowany.</p><p className="sl-fn">train_v3_mix_report.json</p></div></div>
          </div>

          <div className="sl-note" style={{ marginTop: 26 }}>
            <div className="sl-clbl">▸ status</div>
            <p>Miks SFT i&nbsp;warstwa wiedzy gotowe; trening v3 jeszcze nie wystartował.
            Pełne dane, werdykty sędziów i&nbsp;lineage w&nbsp;wewnętrznym repo datasets (dostęp do audytu na życzenie);
            metodologia i&nbsp;karty benchmarków: <a href="/benchmarks">/benchmarks</a>.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
