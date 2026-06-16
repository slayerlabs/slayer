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
            <div className="sl-mast-code"><b>zadania</b><span>/ dane &amp; trening</span></div>
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
          <div className="sl-entries" style={{ marginTop: 22 }}>
            <div className="sl-entry"><div className="sl-no">01</div><div><h3>Odpal benchmark lokalnie</h3><p>Ollama + nasz skrypt MCQ na&nbsp;200 pytaniach, zgłoś wynik.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">eval</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">02</div><div><h3>Zweryfikuj dataset</h3><p>Licencja, schemat, czy publiczny (kolejka vs&nbsp;zamknięte).</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">dane</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">03</div><div><h3>Czyść / anotuj instrukcje PL</h3><p>Oznacz śmieci, popraw odpowiedzi. Jakość &gt; ilość.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">dane</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">04</div><div><h3>Dodaj loader MCQ</h3><p>Nowy publiczny zbiór: mapowanie pól do&nbsp;harnessu.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">eval</span> <span className="sl-chip">kod</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">05</div><div><h3>Poprawki strony / docs</h3><p>Treści, tłumaczenia, drobne fixy UI.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">strona</span></p></div></div>
          </div>
        </div>
      </section>


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
          <div className="sl-entries" style={{ marginTop: 22 }}>
            <div className="sl-entry"><div className="sl-no">06</div><div><h3>Skrypt dekontaminacji</h3><p>n-gram/embedding overlap korpusu vs&nbsp;zbiory testowe.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">dane</span> <span className="sl-chip">eval</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">07</div><div><h3>QLoRA SFT (mały zbiór)</h3><p>Dostrojenie 11–14B na&nbsp;1 GPU, wynik na&nbsp;held-out.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">trening</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">08</div><div><h3>Pary preferencji (DPO)</h3><p>Zbiór „lepsza/gorsza&quot; (człowiek lub&nbsp;sędzia-LLM).</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">dane</span> <span className="sl-chip">trening</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">09</div><div><h3>Dane syntetyczne</h3><p>Pipeline Magpie/Evol-Instruct + filtr jakości.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">dane</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">10</div><div><h3>Model merging</h3><p>mergekit (TIES/DARE/SLERP), pomiar na&nbsp;held-out.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">trening</span> <span className="sl-chip">infra</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">11</div><div><h3>Prywatny held-out</h3><p>Świeży zestaw (najnowsze CKE/PES) — anty-benchmaxxing.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">eval</span> <span className="sl-chip">dane</span></p></div></div>
          </div>
        </div>
      </section>


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
          <div className="sl-entries" style={{ marginTop: 22 }}>
            <div className="sl-entry"><div className="sl-no">12</div><div><h3>DPO / ORPO full + ablacje</h3><p>Pełny alignment, porównanie wariantów, raport.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">trening</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">13</div><div><h3>GRPO / RLVR na&nbsp;egzaminach</h3><p>RL z&nbsp;weryfikowalną nagrodą. Killer pod&nbsp;target.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">trening</span> <span className="sl-chip">infra</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">14</div><div><h3>Trening odmowy / grounding</h3><p>„Brak podstawy w&nbsp;dokumencie&quot;, RAG-aware.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">trening</span> <span className="sl-chip">dane</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">15</div><div><h3>Continued pre-training PL</h3><p>Doczytanie korpusu PL przed SFT.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">trening</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">16</div><div><h3>Tokenizer PL</h3><p>Polski słownik + init embeddingów.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">trening</span> <span className="sl-chip">infra</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">17</div><div><h3>Distylacja rozumowania</h3><p>Łańcuchy CoT z&nbsp;mocnego nauczyciela.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">trening</span></p></div></div>
            <div className="sl-entry"><div className="sl-no">18</div><div><h3>Long-context + koszt</h3><p>YaRN pod&nbsp;długie akta, profilowanie compute.</p><p className="sl-fn" style={{ marginTop: 8 }}><span className="sl-chip">infra</span></p></div></div>
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
