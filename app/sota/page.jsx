import SotaComments from "./comments";

export const metadata = {
  title: "SOTA roadmap 2026 + komentarze | Slayer",
  description:
    "Publiczny plan zbudowania poprawnego polskiego modelu SOTA: domkniecie macierzy benchmarkow, dane, SFT, RLVR, regression gates i komentarze spolecznosci.",
};

const css = `
  .sota-hero-grid{display:grid;grid-template-columns:1fr 360px;gap:24px;align-items:end}
  @media(max-width:900px){.sota-hero-grid{grid-template-columns:1fr}}
  .sota-card{border:1px solid var(--line);border-radius:var(--rad);background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.012)),var(--panel);padding:20px}
  .sota-card .n{font-family:var(--mono);font-size:.7rem;letter-spacing:.11em;text-transform:uppercase;color:var(--acc)}
  .sota-card strong{display:block;margin-top:7px;font-size:1.06rem;color:var(--ink)}
  .sota-card p{margin:8px 0 0;color:var(--mut);font-size:.94rem}
  .phase-list{display:grid;border:1px solid var(--line);border-radius:var(--rad);overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.032),rgba(255,255,255,.012)),var(--panel)}
  .phase{display:grid;grid-template-columns:128px 1fr;gap:22px;padding:22px 24px;border-top:1px solid var(--line2)}
  .phase:first-child{border-top:0}
  .phase .when{font-family:var(--mono);font-size:.76rem;color:var(--mut)}
  .phase .status{display:inline-block;margin-top:7px;font-family:var(--mono);font-size:.66rem;padding:2px 8px;border-radius:99px;color:var(--acc);background:var(--acc-soft);border:1px solid rgba(215,163,81,.28)}
  .phase h3{margin:0 0 6px;font-size:1.18rem;color:var(--ink)}
  .phase p{margin:0;color:var(--mut)}
  .phase ul{margin:12px 0 0;padding-left:18px;color:var(--mut)}
  .phase li{margin:4px 0}
  .matrix{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
  @media(max-width:900px){.matrix{grid-template-columns:repeat(2,1fr)}.phase{grid-template-columns:1fr;gap:7px}}
  @media(max-width:560px){.matrix{grid-template-columns:1fr}}
  .mcell{border:1px solid var(--line2);border-radius:8px;background:rgba(255,255,255,.025);padding:14px}
  .mcell b{display:block;color:var(--ink);font-size:.98rem}
  .mcell span{display:block;margin-top:4px;font-family:var(--mono);font-size:.72rem;color:var(--dim)}
  .mcell.todo{border-color:rgba(208,138,114,.32)}
  .mcell.todo span{color:#d08a72}
  .principles{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
  @media(max-width:820px){.principles{grid-template-columns:1fr}}
  .principle{border-top:1px solid var(--line2);padding-top:15px;color:var(--mut)}
  .principle b{display:block;color:var(--ink);margin-bottom:4px}
  .feedback{margin-top:0}
  .feedback-form{border:1px solid var(--line);border-radius:var(--rad);background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012)),var(--panel);padding:18px;display:grid;gap:14px}
  .field-row{display:grid;grid-template-columns:1fr 180px;gap:14px}
  @media(max-width:680px){.field-row{grid-template-columns:1fr}}
  select{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:8px;font-family:var(--sans);font-size:1rem;background:var(--panel);color:var(--txt)}
  select:focus{outline:none;border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}
  .hp{position:absolute;left:-10000px;width:1px;height:1px;opacity:0}
  .form-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .form-msg{font-size:.88rem;color:var(--dim)}.form-msg.err{color:#d08a72}
  .comment-list{display:grid;gap:12px;margin-top:16px}
  .comment{border:1px solid var(--line2);border-radius:8px;background:rgba(255,255,255,.025);padding:14px 16px}
  .comment-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-family:var(--mono);font-size:.7rem;color:var(--dim);letter-spacing:.05em;text-transform:uppercase}
  .comment-top .who{color:var(--acc)}.comment-top .ctype{border:1px solid var(--line2);border-radius:4px;padding:1px 6px;color:var(--mut)}
  .comment p{margin:8px 0 0;color:var(--mut);white-space:pre-wrap}
  .empty{color:var(--dim);font-family:var(--mono);font-size:.82rem}
`;

export default function SotaRoadmap() {
  return (
    <>
      <style>{css}</style>
      <section className="phero">
        <div className="inner sota-hero-grid">
          <div>
            <span className="kick">SOTA 2026 · public roadmap · feedback open</span>
            <h1>Plan na poprawny <em>polski model SOTA</em></h1>
            <p>
              Nie zaczynamy od hasla "wiekszy dataset". Zaczynamy od pelnej mapy przewag i regresji, potem budujemy
              dane, trening, RLVR i runtime tylko tam, gdzie jest mierzony deficyt. Ta strona jest publicznym planem do
              krytyki spolecznosci.
            </p>
            <div className="cta-row">
              <a className="btn btn-p" href="#comments">dodaj komentarz</a>
              <a className="btn btn-s" href="#phase-0">Faza 0</a>
              <a className="btn btn-s" href="#strategy">strategia 27B</a>
            </div>
          </div>
          <aside className="sota-card">
            <span className="n">twardy warunek startu</span>
            <strong>Najpierw domknac macierz, potem trenowac.</strong>
            <p>
              Open PL LLM Leaderboard nie jest otwartym benchmarkiem do iteracji. Budujemy wlasny prywatny PROXY
              replikujacy publiczny protokol/paper, a zamkniety leaderboard traktujemy dopiero jako finalny zewnetrzny
              check po mocnym modelu.
            </p>
          </aside>
        </div>
      </section>

      <section className="sec tight" id="phase-0">
        <div className="inner">
          <div className="ghead">
            <h2>Faza 0: zamkniecie macierzy</h2>
            <span className="c">1 dzien · ok. $50 inferencji · przed treningiem</span>
          </div>
          <div className="note" style={{ margin: "0 0 18px" }}>
            <p>
              <b>Status:</b> baza Qwen3.5-27B jest juz zmierzona na pelnym zestawie (likelihood/generacja, best-of per
              zadanie), v3 prawie domkniety, v4 w toku. Pelna macierz base vs v3 vs v4 (kolor = delta vs base):{" "}
              <a href="/eksperymenty" style={{ color: "var(--acc)" }}>/eksperymenty</a>. Faza 0 dalej blokuje trening,
              ale to juz pomiar, nie wiara — luki sa nazwane liczbami.
            </p>
          </div>
          <div className="matrix">
            <div className="mcell"><b>CDSC-E</b><span>base 86 · v3/v4 → matryca</span></div>
            <div className="mcell"><b>ARC-C</b><span>base 84 · EN-retencja</span></div>
            <div className="mcell"><b>MMLU</b><span>base 71 · EN-retencja</span></div>
            <div className="mcell todo"><b>GSM8K</b><span>base 20 · prompt do poprawy</span></div>
            <div className="mcell"><b>Belebele-EN</b><span>base 80 · EN-retencja</span></div>
          </div>
          <div className="phase-list" style={{ marginTop: 18 }}>
            <div className="phase">
              <div><div className="when">F0.1</div><span className="status">gate</span></div>
              <div>
                <h3>Qwen3.5-27B proxy 5-shot baseline</h3>
                <p>
                  Odpalamy wlasny proxy harness dla Qwen3.5-27B: zadania publiczne tam, gdzie sa otwarte, oraz prywatne
                  izomorficzne sety tam, gdzie oryginalny test jest zamkniety. Bez adaptera, bez prompt hackow, ze stalym
                  protokolem i artefaktami raw.
                </p>
                <ul>
                  <li>Kolumny obowiazkowe: CDSC-E, ARC-C, MMLU, GSM8K, Belebele-PL, Belebele-EN, LLMzSzL, PoQuAD, PES.</li>
                  <li>Raport: score, stderr/CI tam gdzie mozliwe, format error, confusion matrix dla classification.</li>
                  <li>Wyjscie: mapa "base wygrywa", "base przegrywa", "brak sygnalu" na naszym proxy.</li>
                </ul>
              </div>
            </div>
            <div className="phase">
              <div><div className="when">F0.2</div><span className="status">decyzja</span></div>
              <div>
                <h3>Mapa treningu zamiast wiary</h3>
                <p>
                  Jesli baza juz radzi sobie z rozumowaniem, nie zuzywamy budzetu na generic reasoning. Budzet idzie
                  tylko w polskie deficyty: zadania PL-specyficzne, format, kalibracja, prawo/administracja, grounding.
                </p>
              </div>
            </div>
            <div className="phase">
              <div><div className="when">F0.3</div><span className="status">stop/go</span></div>
              <div>
                <h3>Zakaz startu SFT bez baseline report</h3>
                <p>
                  Trening rusza dopiero po publicznym raporcie F0. Bez tego caly budzet idzie na slepo i latwo powtorzyc
                  V3: poprawic target, rozwalic krytyczna umiejetnosc.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tight alt">
        <div className="inner">
          <div className="ghead">
            <h2>Roadmap po Fazie 0</h2>
            <span className="c">SOTA jako system, nie pojedynczy fine-tune</span>
          </div>
          <div className="phase-list">
            <div className="phase">
              <div><div className="when">F1 · 2 tyg.</div><span className="status">no-regression SFT</span></div>
              <div>
                <h3>Celowany SFT na deficytach z macierzy</h3>
                <p>
                  50k-150k przykladow, 30% replay, preservation set i KL-to-base. Cel: +1-3 pp na wskazanych polskich
                  skillach, zero krytycznych regresji powyzej progu, format compliance powyzej 98%.
                </p>
              </div>
            </div>
            <div className="phase">
              <div><div className="when">F2 · 1 mies.</div><span className="status">verifiable corpus</span></div>
              <div>
                <h3>Polski korpus z verifierami</h3>
                <p>
                  100k-500k zadan math/code/table/legal/admin/QA. Kazdy rekord ma skill, source metadata,
                  decontamination status, verifier, difficulty i replay policy. Synthetic tylko po filtracji verifierem.
                </p>
              </div>
            </div>
            <div className="phase">
              <div><div className="when">F3 · 1-2 mies.</div><span className="status">RLVR</span></div>
              <div>
                <h3>GRPO/DAPO-style RL na obiektywnych nagrodach</h3>
                <p>
                  RLVR tylko tam, gdzie reward jest twardy: exact answer, label, unit test, table execution, evidence
                  span, abstention. Zero RL na "ladne odpowiedzi" bez sprawdzalnej nagrody.
                </p>
              </div>
            </div>
            <div className="phase">
              <div><div className="when">F4 · 2-3 mies.</div><span className="status">agentic loop</span></div>
              <div>
                <h3>Polish agentic benchmark i runtime</h3>
                <p>
                  Browser/forms/docs/spreadsheets/repos z initial state, tools, trajectory, observations i success
                  condition. Runtime ma uzywac retrieval, verifierow i budget forcing, nie tylko jednego greedy strzalu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tight" id="strategy">
        <div className="inner">
          <div className="ghead">
            <h2>Strategia treningu 27B</h2>
            <span className="c">operator-grade plan · repo artifact</span>
          </div>
          <div className="note" style={{ margin: "0 0 18px" }}>
            <p>
              Pelny dokument techniczny jest w repo: <code>TRAINING_STRATEGY_27B_SOTA.md</code>. Cel: Qwen3.5-27B
              mocny na macierzy PL/core, bez trainowania pod zamkniete benchmarki i bez utraty
              zdolnosci bazy.
            </p>
          </div>
          <div className="principles">
            <div className="principle"><b>1. Proxy/private matrix first</b>Najpierw base/Qwen27 na publicznych zadaniach i prywatnych izomorficznych proxy dla zamknietych testow. Zamkniety leaderboard tylko jako finalny external check.</div>
            <div className="principle"><b>2. Source shards, nie worek danych</b>SpeakLeash/Spichlerz to inventory. ISAP, SAOS, PPC, plwiki, lektury, dialogi i nauka ida jako oddzielne shardy z license, quality, decon i skill tagiem. Dostep: pip install speakleash, dashboard i publiczne wpisy datasetowe.</div>
            <div className="principle"><b>3. No-regression SFT</b>50k-150k zaakceptowanych rekordow, 30-40% replay, hard-neutral NLI, format control, EN/core retention i KL/replay do bazy.</div>
            <div className="principle"><b>4. DPO-P jako glowna dzwignia</b>20k-50k par na smoke, potem 100k-300k jesli przechodzi gate. Otwarte sedzie tam, gdzie finalny claim ma byc reprodukowalny.</div>
            <div className="principle"><b>5. RLVR tylko z verifierem</b>MCQ, NLI, math, code, table QA, citation span, abstention i legal/admin finite-state reward. Zero RL na "ladne odpowiedzi".</div>
            <div className="principle"><b>6. CPT tylko po dowodzie luki</b>Nie robimy CPT na zapas. CPT dopiero jesli proxy long-tail pokazuje realna luke, w drabinie 10M {">"} 100M {">"} 1B z replay i stop-gate.</div>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="inner">
          <div className="ghead">
            <h2>Reguly publiczne</h2>
            <span className="c">co spolecznosc moze podwazac</span>
          </div>
          <div className="principles">
            <div className="principle"><b>Benchmarki nie wchodza do treningu</b>LLMzSzL, KLEJ/CDSC-E, PES, PoQuAD, Belebele i inne splity ewaluacyjne sa tylko do decon/eval.</div>
            <div className="principle"><b>Release wybiera Pareto-front</b>Nie promujemy checkpointa po jednym target score, jesli rozwala NLI, EN retention, parser albo kalibracje.</div>
            <div className="principle"><b>Zamkniety leaderboard dopiero na koncu</b>Nie uzywamy go do treningu, wyboru checkpointow ani publicznego gate'u. Gdy model jest juz mocny na proxy/public eval, wysylamy go do autora jako finalny zewnetrzny check.</div>
            <div className="principle"><b>Najpierw source-of-truth</b>Dane maja miec licencje, lineage, dedup, decontamination, skill tag i replay policy.</div>
            <div className="principle"><b>Runtime jest czescia wyniku</b>Raportujemy greedy, pass@k/best-of-n z verifierem, latency per correct answer i cost per solved task.</div>
            <div className="principle"><b>Feedback publiczny</b>Krytyka planu, brakujace benchmarki, slabe gate'y i ryzyka treningowe trafiaja do komentarzy pod spodem.</div>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="inner">
          <div className="ghead">
            <h2>Polska specjalizacja jako przewaga</h2>
            <span className="c">na czym budujemy roznice</span>
          </div>
          <div className="note" style={{ margin: "0 0 18px" }}>
            <p>
              <b>Przewaga strukturalna:</b> startujemy z Qwen3.5-27B (mocna baza). Wiedze i rozumowanie
              juz niesie baza, wiec budzet idzie w polska specjalizacje: LLMzSzL Slayer v3 <b>66.8</b>.
            </p>
          </div>
          <div className="principles">
            <div className="principle"><b>1. DPO — dzwignia #1</b>Pelny pipeline preferencji (dedup, generacja, ocena metamodelem, filtr marginesu, DPO-P) — z sedzia OTWARTYM (Qwen3.5/deepseek), nie GPT4o. Tej fazy jeszcze nie zrobilismy.</div>
            <div className="principle"><b>2. Skala SFT z pokryciem</b>Nasze 2k przykladow ruszyly tylko sentyment. Styl = maly kurowany (LIMA), pokrycie + brak regresji = duzy zroznicowany SFT wg manifestu danych.</div>
            <div className="principle"><b>3. Polski styl jako wyroznik</b>Mocna baza + DPO + kuracja (zero kalki, zero naduzycia myslnikow) = szansa na mocny wynik na MT-Bench-PL.</div>
            <div className="principle"><b>Czego NIE robic teraz</b>Nie robic CPT na zapas — nasza baza juz niesie wiedze. CPT (EntiGraph) dopiero jesli proxy pokaze realna luke dlugiego ogona PL.</div>
            <div className="principle"><b>Najpierw wlasciwy pomiar</b>Proxy 5-shot (22 zadania) + MT-Bench-PL + EQ-Bench dla base/v3. Bez tego claim jest pusty — i to na NASZYM proxy, nie na zamknietym leaderboardzie.</div>
            <div className="principle"><b>Proxy jest PRYWATNY</b>Zamkniete testy odtwarzamy tylko przez izomorficzny proxy zgodny z publicznym opisem/paperem. Itemy trzymamy wewnatrz organizacji (tylko agregaty publiczne), zeby nie kontaminowac. Publiczna jest metodologia i liczby, nie pytania.</div>
            <div className="principle"><b>Dane otwarte</b>Korpusy SpeakLeash/Spichlerz sa dostepne przez PyPI package speakleash, dashboard projektu i publiczne wpisy datasetowe, ale public copy nie powinno podawac rozmiaru bez aktualnego zrodla. Mix instrukcyjny/DPO odbudowujemy samodzielnie.</div>
          </div>
        </div>
      </section>

      <section className="sec tight alt">
        <div className="inner">
          <SotaComments />
        </div>
      </section>
    </>
  );
}
