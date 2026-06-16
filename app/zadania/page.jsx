export const metadata = {
  title: "Zadania — od początkującego do zaawansowanego | Slayer",
  description: "Zadania dla kontrybutorów: od prostych (odpal benchmark, czyść dane) po zaawansowane (GRPO/RLVR, trening odmowy, tokenizer PL).",
};

export default function Zadania() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">00</div>
            <div>
              <div className="sl-eye">dla kontrybutorów</div>
              <h1 className="sl-h1" style={{ marginTop: 12 }}>Zadania — od <span className="sl-acc">prostych</span> po&nbsp;zaawansowane</h1>
              <p className="sl-lede" style={{ marginTop: 18 }}>Wejdź na&nbsp;dowolnym poziomie. Każde zadanie małe, sprawdzalne, mierzone na&nbsp;held-out. Metodyka: <a href="/trening">/trening</a>.</p>
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
              <div className="sl-eye">poziom · początkujący</div>
              <div className="sl-step-head" style={{ marginTop: 10 }}>
                <h2 className="sl-h2">Początkujący</h2>
                <span className="sl-chip sl-mute">łatwe</span>
                <span className="sl-fn" style={{ marginTop: 0 }}>kilka godzin · zero treningu</span>
              </div>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col">
              <div className="sl-clbl">▸ 01</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Odpal benchmark lokalnie</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Ollama + nasz skrypt MCQ na&nbsp;200 pytaniach, zgłoś wynik.</p>
              <p className="sl-fn"><span className="sl-chip">eval</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 02</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Zweryfikuj dataset</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Licencja, schemat, czy publiczny (kolejka vs&nbsp;zamknięte).</p>
              <p className="sl-fn"><span className="sl-chip">dane</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 03</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Czyść / anotuj instrukcje PL</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Oznacz śmieci, popraw odpowiedzi. Jakość &gt; ilość.</p>
              <p className="sl-fn"><span className="sl-chip">dane</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 04</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Dodaj loader MCQ</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Nowy publiczny zbiór: mapowanie pól do&nbsp;harnessu.</p>
              <p className="sl-fn"><span className="sl-chip">eval</span> <span className="sl-chip">kod</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 05</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Poprawki strony / docs</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Treści, tłumaczenia, drobne fixy UI.</p>
              <p className="sl-fn"><span className="sl-chip">strona</span></p>
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
              <div className="sl-eye">poziom · średnio zaawansowane</div>
              <div className="sl-step-head" style={{ marginTop: 10 }}>
                <h2 className="sl-h2">Średnio</h2>
                <span className="sl-chip sl-warn">średnie</span>
                <span className="sl-fn" style={{ marginTop: 0 }}>trochę kodu/compute · pierwszy trening</span>
              </div>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col">
              <div className="sl-clbl">▸ 06</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Skrypt dekontaminacji</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>n-gram/embedding overlap korpusu vs&nbsp;zbiory testowe.</p>
              <p className="sl-fn"><span className="sl-chip">dane</span> <span className="sl-chip">eval</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 07</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>QLoRA SFT (mały zbiór)</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Dostrojenie 11–14B na&nbsp;1 GPU, wynik na&nbsp;held-out.</p>
              <p className="sl-fn"><span className="sl-chip">trening</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 08</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Pary preferencji (DPO)</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Zbiór „lepsza/gorsza&quot; (człowiek lub&nbsp;sędzia-LLM).</p>
              <p className="sl-fn"><span className="sl-chip">dane</span> <span className="sl-chip">trening</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 09</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Dane syntetyczne</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Pipeline Magpie/Evol-Instruct + filtr jakości.</p>
              <p className="sl-fn"><span className="sl-chip">dane</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 10</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Model merging</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>mergekit (TIES/DARE/SLERP), pomiar na&nbsp;held-out.</p>
              <p className="sl-fn"><span className="sl-chip">trening</span> <span className="sl-chip">infra</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 11</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Prywatny held-out</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Świeży zestaw (najnowsze CKE/PES) — anty-benchmaxxing.</p>
              <p className="sl-fn"><span className="sl-chip">eval</span> <span className="sl-chip">dane</span></p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">03</div>
            <div>
              <div className="sl-eye">poziom · zaawansowane</div>
              <div className="sl-step-head" style={{ marginTop: 10 }}>
                <h2 className="sl-h2">Zaawansowane</h2>
                <span className="sl-chip">trudne</span>
                <span className="sl-fn" style={{ marginTop: 0 }}>pełne treningi · RL · infra</span>
              </div>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col">
              <div className="sl-clbl">▸ 12</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>DPO / ORPO full + ablacje</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Pełny alignment, porównanie wariantów, raport.</p>
              <p className="sl-fn"><span className="sl-chip">trening</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 13</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>GRPO / RLVR na&nbsp;egzaminach</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>RL z&nbsp;weryfikowalną nagrodą. Killer pod&nbsp;target.</p>
              <p className="sl-fn"><span className="sl-chip">trening</span> <span className="sl-chip">infra</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 14</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Trening odmowy / grounding</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>„Brak podstawy w&nbsp;dokumencie&quot;, RAG-aware.</p>
              <p className="sl-fn"><span className="sl-chip">trening</span> <span className="sl-chip">dane</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 15</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Continued pre-training PL</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Doczytanie korpusu PL przed SFT.</p>
              <p className="sl-fn"><span className="sl-chip">trening</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 16</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Tokenizer PL</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Polski słownik + init embeddingów.</p>
              <p className="sl-fn"><span className="sl-chip">trening</span> <span className="sl-chip">infra</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 17</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Distylacja rozumowania</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Łańcuchy CoT z&nbsp;mocnego nauczyciela.</p>
              <p className="sl-fn"><span className="sl-chip">trening</span></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ 18</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Long-context + koszt</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>YaRN pod&nbsp;długie akta, profilowanie compute.</p>
              <p className="sl-fn"><span className="sl-chip">infra</span></p>
            </div>
          </div>

          <div className="sl-note" style={{ marginTop: 28 }}>
            <div className="sl-clbl">◆ jak zacząć</div>
            <p>Wybierz zadanie, odezwij się na&nbsp;<a href="https://discord.gg/HnTkVR4c5T" rel="noopener" style={{ color: "var(--sl-acc)" }}>Discordzie</a>, weź je „na&nbsp;siebie&quot;. Wynik liczy się tylko, gdy jest odtwarzalny i&nbsp;mierzony na&nbsp;held-out.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
