export const metadata = {
  title: "Harmonogram & call for contributions | Slayer",
  description: "Harmonogram: od pomiaru baseline, przez dane i pierwszy trening, po RL na egzaminach. Plus call for contributions.",
};

export default function Roadmap() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">06</div>
            <div>
              <div className="sl-eye">harmonogram · 6–8 tygodni</div>
              <h1 className="sl-h1" style={{ marginTop: 12 }}>Plan i <span className="sl-acc">zaproszenie do współpracy</span></h1>
              <p className="sl-lede" style={{ marginTop: 18 }}>Od pomiaru bazowego, przez dane i pierwszy trening, po RL na egzaminach. Wszystko jawne, odtwarzalne, mierzone na held-out. Daty orientacyjne — projekt idzie tak szybko, jak społeczność.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-note" style={{ marginBottom: 28 }}>
            <div className="sl-clbl">◆ decyzja (wg leaderboardu)</div>
            <p><b>baza = Qwen3.5-9B</b>. W pomiarze Fazy 0 Qwen3.5-9B bije Bielika-11B-v3 8:1 (9 ważnych osi), w tym na większości polskich. Bielik trzyma jedynie <b>LLMzSzŁ</b> (egzaminy państwowe/zawodowe) — naszą oś docelową. Plan: Qwen jako baza + polska specjalizacja celowana w LLMzSzŁ i prawo/administrację → przebić Bielika szeroko. <a href="/leaderboard">wyniki →</a></p>
          </div>

          <div className="sl-eye">harmonogram · zakończone · następne · planowane</div>

          <div className="sl-steps" style={{ marginTop: 18 }}>
            <div className="sl-step">
              <div className="sl-step-when">F0 · czerwiec</div>
              <div>
                <div className="sl-step-head">
                  <span className="sl-status sl-done">zakończona ✓</span>
                </div>
                <h3>Pomiar bazowy</h3>
                <p>Bielik 1 : 8 Qwen3.5-9B (9 ważnych osi, multi-seed). Werdykt: baza = Qwen3.5-9B. <a href="/leaderboard" style={{ color: "var(--sl-acc)" }}>leaderboard</a>.</p>
              </div>
            </div>
            <div className="sl-step">
              <div className="sl-step-when">F1 · czerwiec</div>
              <div>
                <div className="sl-step-head">
                  <span className="sl-status sl-run">w toku</span>
                </div>
                <h3>Społeczność i dane</h3>
                <p><a href="https://github.com/slayerlabs" style={{ color: "var(--sl-acc)" }}>Repo</a> otwarte, zespół (<a href="/zespol" style={{ color: "var(--sl-acc)" }}>zapisy</a>), korpusy prawno-urzędowe (<a href="/datasety" style={{ color: "var(--sl-acc)" }}>datasety</a>), dekontaminacja, held-out.</p>
              </div>
            </div>
            <div className="sl-step">
              <div className="sl-step-when">F2 · lipiec</div>
              <div>
                <div className="sl-step-head">
                  <span className="sl-status sl-queued">planowane</span>
                </div>
                <h3>Pierwszy trening</h3>
                <p>QLoRA SFT na <b>Qwen3.5-9B</b> (PL + egzaminy zawodowe) → ORPO/DPO. <a href="/trening" style={{ color: "var(--sl-acc)" }}>metody</a>.</p>
              </div>
            </div>
            <div className="sl-step">
              <div className="sl-step-when">F3 · lipiec/sierpień</div>
              <div>
                <div className="sl-step-head">
                  <span className="sl-status sl-queued">planowane</span>
                </div>
                <h3>RL na egzaminach</h3>
                <p>GRPO/RLVR z weryfikowalną nagrodą + trening odmowy/grounding.</p>
              </div>
            </div>
            <div className="sl-step">
              <div className="sl-step-when">F4 · sierpień</div>
              <div>
                <div className="sl-step-head">
                  <span className="sl-status sl-queued">planowane</span>
                </div>
                <h3>Iteracje i raport</h3>
                <p>Ablacje, merging, pomiar na held-out, publiczny raport. Decyzja: czy o epsilon lepiej.</p>
              </div>
            </div>
          </div>

          <div className="sl-note" style={{ marginTop: 28 }}>
            <div className="sl-clbl">◆ cel</div>
            <p>otwarty, odtwarzalny polski model 11–14B — super tanio (~15–20k zł) i o epsilon lepszy od punktu odniesienia.</p>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">05</div>
            <div>
              <div className="sl-eye">zaproszenie · czego potrzebujemy teraz (F0→F1)</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Zaproszenie <span className="sl-acc">do współpracy.</span></h2>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">▸ ręce</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Kontrybutorzy</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Ewaluacje, dekontaminacja, loadery, dane. Wejdź na dowolnym poziomie.</p>
              <p className="sl-fn"><a href="/zadania" style={{ color: "var(--sl-acc)" }}>Lista zadań →</a></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ dane</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Dane prawno-urzędowe</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>ISAP, orzeczenia, interpretacje — to nasz moat.</p>
              <p className="sl-fn"><a href="/datasety" style={{ color: "var(--sl-acc)" }}>Datasety →</a></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ rynek</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Firmy — zastosowanie</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Powiedz, czego potrzebujesz. Zostań pierwszym użytkownikiem.</p>
              <p className="sl-fn"><a href="/zespol" style={{ color: "var(--sl-acc)" }}>Zgłoś use case →</a></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ zasoby</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Fundatorzy</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>GPU lub kredyty (RunPod/Vast). Budżet 15–20k zł, każda złotówka jawna.</p>
              <p className="sl-fn"><a href="/zespol" style={{ color: "var(--sl-acc)" }}>Wesprzyj →</a></p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ nauka</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Naukowcy</h3>
              <p className="sl-lede" style={{ fontSize: 13 }}>Metodyka, ewaluacje, współautorstwo wyników.</p>
              <p className="sl-fn"><a href="/zespol" style={{ color: "var(--sl-acc)" }}>Dołącz →</a></p>
            </div>
          </div>
          <div className="sl-cta" style={{ marginTop: 24 }}>
            <a className="sl-btn sl-btn-p" href="/zespol">Dołącz / zapisz się →</a>
            <a className="sl-btn sl-btn-s" href="https://discord.gg/HnTkVR4c5T" rel="noopener">Discord</a>
          </div>
        </div>
      </section>
    </main>
  );
}
