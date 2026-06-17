export const metadata = {
  title: "Slayer Code — on-prem model do kodu dla enterprise (TS/Python)",
  description:
    "Slayer Code to on-premowy model i agent kodujący dla enterprise'owych baz TypeScript i Python. Polska ma jedną z najgęstszych pul talentu olimpijskiego (IOI) w Europie — 135 medali, więcej niż USA. Wygrywamy wewnątrz prywatnego repo klienta.",
};

const css = `
    /* ---------- light pitch scope: override the global dark theme just on this page ---------- */
    .lp{
      --bg:#ffffff; --bg2:#f6f3ec; --panel:#ffffff; --panel2:#f8f6ef;
      --ink:#15130d; --txt:#322e24; --mut:#5d5849; --dim:#8f8773;
      --line:rgba(21,19,13,.14); --line2:rgba(21,19,13,.07);
      --acc:#b3791f; --acc-d:#8c652c; --acc-soft:rgba(179,121,31,.12); --acc-ink:#ffffff;
      --good:#2c8a47; --blue:#2c6f9c; --violet:#7a5bbf; --amber:#b3791f;
      --code-add:#1f8a4c; --code-del:#c2412f; --code-add-bg:rgba(31,138,76,.09); --code-del-bg:rgba(194,65,47,.08);
      background:var(--bg);color:var(--txt);
    }

    /* ---------- hero (bright) ---------- */
    .hero{position:relative;padding:124px clamp(18px,5vw,72px) 0;overflow:hidden;
      background:
        radial-gradient(125% 80% at 82% -12%, rgba(179,121,31,.16), transparent 58%),
        radial-gradient(95% 75% at -5% 0%, rgba(44,111,156,.12), transparent 55%),
        linear-gradient(180deg,#fffefb 0%, #f6f2e8 100%)}
    .hero::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.7;background:
      repeating-linear-gradient(90deg,transparent 0 56px,rgba(21,19,13,.045) 56px 57px),
      repeating-linear-gradient(0deg,transparent 0 56px,rgba(21,19,13,.035) 56px 57px);
      -webkit-mask-image:radial-gradient(ellipse 86% 72% at 60% 16%,#000 0%,transparent 78%);
      mask-image:radial-gradient(ellipse 86% 72% at 60% 16%,#000 0%,transparent 78%)}
    .hgrid{position:relative;z-index:1;width:min(var(--max),100%);margin:0 auto;display:grid;grid-template-columns:minmax(0,1.04fr) minmax(340px,.78fr);gap:clamp(24px,5vw,64px);align-items:center;padding:18px 0 clamp(46px,6vw,72px)}
    @media(max-width:940px){.hgrid{grid-template-columns:1fr}}
    .htag{display:inline-flex;align-items:center;gap:10px;margin-bottom:24px}
    .htag .dot{width:7px;height:7px;border-radius:50%;background:var(--acc);animation:pl 2s infinite}
    .hero h1{margin:0 0 22px;font-family:var(--serif);font-size:clamp(2.7rem,6vw,5rem);line-height:.98;font-weight:380;letter-spacing:-.018em;color:var(--ink);max-width:14ch;text-wrap:balance}
    .hero h1 em{font-style:italic;color:var(--acc)}
    .lede{max-width:680px;margin:0 0 30px;color:var(--mut);font-size:clamp(1.06rem,1.65vw,1.28rem);line-height:1.58}
    .lede b{color:var(--ink);font-weight:600}

    /* hero code card — says "coding model" at a glance */
    .codecard{justify-self:end;width:min(440px,100%);border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:0 28px 70px rgba(21,19,13,.12),0 2px 0 rgba(21,19,13,.02);overflow:hidden}
    .codecard .cc-top{display:flex;align-items:center;gap:8px;padding:13px 15px;border-bottom:1px solid var(--line2);background:var(--panel2)}
    .codecard .cc-top .dots{display:flex;gap:6px}
    .codecard .cc-top .dots i{width:10px;height:10px;border-radius:50%;display:block;background:#dcd6c7}
    .codecard .cc-top .dots i:nth-child(1){background:#e6857a}.codecard .cc-top .dots i:nth-child(2){background:#e8c277}.codecard .cc-top .dots i:nth-child(3){background:#86c08e}
    .codecard .cc-top .file{margin-left:6px;font-family:var(--mono);font-size:.72rem;color:var(--dim)}
    .codecard .cc-top .badge{margin-left:auto;font-family:var(--mono);font-size:.64rem;letter-spacing:.08em;text-transform:uppercase;color:var(--good);border:1px solid rgba(44,138,71,.3);background:rgba(44,138,71,.08);border-radius:99px;padding:3px 8px}
    .codecard pre{margin:0;padding:14px 16px;font-family:var(--mono);font-size:.79rem;line-height:1.72;color:var(--txt);overflow-x:auto}
    .codecard .cl{display:block;white-space:pre}
    .codecard .cl .ln{display:inline-block;width:1.6em;color:var(--dim);user-select:none}
    .codecard .cl.add{background:var(--code-add-bg);color:var(--code-add)}
    .codecard .cl.del{background:var(--code-del-bg);color:var(--code-del)}
    .codecard .cl .kw{color:var(--blue)}.codecard .cl .cm{color:var(--dim)}
    .codecard .cc-run{display:flex;align-items:center;gap:9px;padding:11px 16px;border-top:1px solid var(--line2);background:var(--panel2);font-family:var(--mono);font-size:.74rem;color:var(--good)}
    .codecard .cc-run b{color:var(--ink);font-weight:600}
    @media(max-width:940px){.codecard{justify-self:start;margin-top:6px}}

    .rv{opacity:0;transform:translateY(14px);animation:rv .7s cubic-bezier(.2,.7,.3,1) forwards}
    .rv.d1{animation-delay:.06s}.rv.d2{animation-delay:.16s}.rv.d3{animation-delay:.26s}
    .rv.d4{animation-delay:.36s}.rv.d5{animation-delay:.48s}
    @keyframes rv{to{opacity:1;transform:none}}
    @media(prefers-reduced-motion:reduce){.rv{animation:none;opacity:1;transform:none}}

    /* stats strip (bright) */
    .stats{position:relative;z-index:1;border-top:1px solid var(--line);background:rgba(255,255,255,.72);backdrop-filter:blur(8px)}
    .stats .inner{display:grid;grid-template-columns:repeat(4,1fr);width:min(var(--max),100%);margin:0 auto}
    @media(max-width:820px){.stats .inner{grid-template-columns:repeat(2,1fr)}}
    .stat{padding:22px clamp(14px,2vw,28px);border-left:1px solid var(--line2);position:relative}
    .stat::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:transparent}
    .stat:nth-child(1)::before{background:rgba(179,121,31,.8)}
    .stat:nth-child(2)::before{background:rgba(44,111,156,.7)}
    .stat:nth-child(3)::before{background:rgba(44,138,71,.7)}
    .stat:nth-child(4)::before{background:rgba(179,121,31,.7)}
    .stat:first-child{border-left:0}
    @media(max-width:820px){.stat:nth-child(3){border-left:0}.stat:nth-child(n+3){border-top:1px solid var(--line2)}}
    .stat .v{font-family:var(--serif);font-size:clamp(1.7rem,3vw,2.3rem);color:var(--ink);line-height:1.1}
    .stat .v .ac{color:var(--acc)}
    .stat .k{font-family:var(--mono);font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-top:5px}

    /* IOI band — the talent claim, loud and bright */
    .ioiband{position:relative;overflow:hidden;border:1px solid rgba(179,121,31,.28);border-radius:16px;
      background:linear-gradient(135deg,#fff7e6 0%,#fffdf8 52%,#eef5fb 100%);
      box-shadow:0 24px 70px rgba(21,19,13,.08);padding:clamp(26px,4vw,44px);display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(22px,4vw,48px);align-items:center}
    @media(max-width:860px){.ioiband{grid-template-columns:1fr}}
    .ioiband .kick{color:var(--acc)}
    .ioiband h2{font-family:var(--serif);font-weight:400;font-size:clamp(1.9rem,4vw,2.9rem);line-height:1.06;letter-spacing:-.016em;color:var(--ink);margin:10px 0 12px;max-width:16ch}
    .ioiband h2 em{font-style:italic;color:var(--acc)}
    .ioiband p{margin:0;color:var(--mut);font-size:1.04rem;line-height:1.62;max-width:52ch}
    .ioiband p b{color:var(--ink)}
    .medal{border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:0 16px 44px rgba(21,19,13,.08);overflow:hidden}
    .medal .row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:14px;padding:16px 20px;border-top:1px solid var(--line2)}
    .medal .row:first-child{border-top:0}
    .medal .row .who{font-family:var(--mono);font-size:.82rem;color:var(--mut);display:flex;align-items:center;gap:9px}
    .medal .row .who b{color:var(--ink);font-weight:600;font-size:.92rem}
    .medal .row .flag{font-size:1.05rem}
    .medal .row .n{font-family:var(--serif);font-size:clamp(1.7rem,3.4vw,2.4rem);line-height:1;color:var(--ink)}
    .medal .row.win{background:linear-gradient(90deg,rgba(179,121,31,.1),transparent)}
    .medal .row.win .n{color:var(--acc)}
    .medal .cap{padding:11px 20px;border-top:1px solid var(--line2);background:var(--panel2);font-family:var(--mono);font-size:.68rem;letter-spacing:.04em;color:var(--dim)}

    .thesis{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:18px;align-items:stretch}
    @media(max-width:880px){.thesis{grid-template-columns:1fr}}
    .quote{border:1px solid rgba(179,121,31,.34);border-left:3px solid var(--acc);border-radius:14px;background:linear-gradient(180deg,#fff8ea,#fff);padding:32px;box-shadow:0 18px 50px rgba(21,19,13,.07)}
    .quote p{font-family:var(--serif);font-size:clamp(1.55rem,3vw,2.2rem);line-height:1.15;color:var(--ink);margin:0;letter-spacing:-.012em}
    .quote .sub{font-family:var(--mono);font-size:.74rem;letter-spacing:.06em;text-transform:uppercase;color:var(--dim);margin-top:18px;line-height:1.6}
    .worklist{display:grid;gap:12px}
    .workitem{border:1px solid var(--line);border-radius:14px;padding:18px 20px;background:#fff;box-shadow:0 12px 36px rgba(21,19,13,.06)}
    .workitem .label{font-family:var(--mono);font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-bottom:8px}
    .workitem p{margin:0;color:var(--mut)}
    .workitem b{color:var(--ink)}

    .stack{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
    @media(max-width:900px){.stack{grid-template-columns:1fr}}
    .stack .cell{min-height:226px;border-top:2px solid rgba(44,111,156,.5)}
    .stack .cell:nth-child(2){border-top-color:rgba(179,121,31,.6)}
    .stack .cell:nth-child(3){border-top-color:rgba(44,138,71,.55)}
    .area h3{font-family:var(--serif);font-weight:400;font-size:1.42rem;letter-spacing:-.01em;margin:12px 0 8px}
    .area .meta{margin-top:auto;padding-top:16px}

    /* light surfaces for the shared .cell / .sec.alt blocks on this page */
    .lp .sec.alt{background:linear-gradient(180deg,#f7f4ec,#fbf9f3)}
    .lp .cell{background:#fff;box-shadow:0 12px 36px rgba(21,19,13,.05)}
    .lp .cell.area:hover{box-shadow:0 18px 48px rgba(21,19,13,.09)}
    .lp .rule{border-top-color:var(--line)}
`;

export default function Home() {
  return (
    <div className="lp">
      <style>{css}</style>

      <section className="hero">
        <div className="hgrid">
          <div>
            <div className="htag rv"><span className="dot"></span><span className="kick"><span className="ac">MODEL & AGENT DO KODU</span> · ON-PREM · TYPESCRIPT / PYTHON</span></div>
            <h1 className="rv d1">Wyspecjalizowany <em>model do kodu</em> dla enterprise.</h1>
            <p className="lede rv d2"><b>Slayer Code</b> to on-premowy model i agent kodujący dla enterprise'owych baz TypeScript i Python. Polska ma jedną z najgęstszych pul talentu algorytmicznego w Europie — <b>135 medali IOI, więcej niż USA</b> — i dlatego coding jest naszą grą. Wygrywamy tam, gdzie OpenAI nie widzi danych: <b>wewnątrz prywatnego repo klienta</b>.</p>
            <div className="cta-row rv d3">
              <a className="btn btn-p" href="#pilot">umów pilota →</a>
              <a className="btn btn-s" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">wejście do labu</a>
            </div>
          </div>
          <aside className="codecard rv d4" aria-label="Przykład: agent naprawia issue i przechodzi testy">
            <div className="cc-top"><span className="dots"><i></i><i></i><i></i></span><span className="file">fix/auth-token-refresh.ts</span><span className="badge">issue → PR</span></div>
            <pre aria-hidden="true">
<span className="cl"><span className="ln">12</span><span className="kw">async function</span> refresh(token) {'{'}</span>
<span className="cl del"><span className="ln">13</span>  <span className="kw">return</span> api.post('/auth', token)</span>
<span className="cl add"><span className="ln">13</span>  <span className="kw">if</span> (isExpired(token)) <span className="kw">await</span> rotate(token)</span>
<span className="cl add"><span className="ln">14</span>  <span className="kw">return</span> api.post('/auth', token, {'{'} retry: 2 {'}'})</span>
<span className="cl"><span className="ln">15</span>{'}'}  <span className="cm">// styl i wzorce twojego repo</span></span>
            </pre>
            <div className="cc-run"><span>✓</span><span><b>test suite</b> przechodzi · on-prem · 0 linii kodu wysłanych na zewnątrz</span></div>
          </aside>
        </div>
        <div className="stats rv d5" style={{ margin: "0 calc(clamp(18px,5vw,72px) * -1)" }}>
          <div className="inner">
            <div className="stat"><div className="v">135<span className="ac"> : 127</span></div><div className="k">medale IOI · Polska vs USA</div></div>
            <div className="stat"><div className="v">prywatny<span className="ac"> eval</span></div><div className="k">benchmark per repozytorium klienta</div></div>
            <div className="stat"><div className="v">on-prem<span className="ac"> first</span></div><div className="k">deployment we wnętrzu firmy</div></div>
            <div className="stat"><div className="v">TS/<span className="ac">PY</span></div><div className="k">focus na enterprise stack</div></div>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="inner">
          <div className="ioiband rv d4">
            <div>
              <span className="kick">dlaczego Polska · olimpiada informatyczna</span>
              <h2>Najgęstszy talent <em>algorytmiczny</em> w Europie.</h2>
              <p>Międzynarodowa Olimpiada Informatyczna (IOI) to najtrudniejszy na świecie konkurs programistyczny dla licealistów. Oficjalne statystyki pokazują Polskę z <b>135 medalami</b> — przed USA (<b>127</b>). To <b>sygnał talent arbitrage</b>: gęstość talentu algorytmicznego, code reasoning i program synthesis, na której opiera się europejski lab kodujący.</p>
            </div>
            <div className="medal" aria-label="Medale IOI: Polska vs USA">
              <div className="row win"><span className="who"><span className="flag">🇵🇱</span><b>Polska</b></span><span className="n">135</span></div>
              <div className="row"><span className="who"><span className="flag">🇺🇸</span><b>USA</b></span><span className="n">127</span></div>
              <div className="cap">źródło: stats.ioinformatics.org · medale łącznie</div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="inner">
          <div className="thesis">
            <div className="quote rv d4">
              <p>OpenAI wins on public code. Slayer wins inside the repo.</p>
              <div className="sub">Nie pokonujemy frontiera wagami. Pokonujemy go kontekstem, testami, historią issue i zamkniętą pętlą feedbacku, których modele hosted nie mają.</div>
            </div>
            <div className="worklist rv d4">
              <div className="workitem"><div className="label">problem</div><p><b>Najcenniejszy kontekst nie może opuścić firmy.</b> Prywatne repozytoria, wewnętrzne API, tickety, logi, decyzje architektoniczne, ograniczenia bezpieczeństwa i testy. Modele hosted są mocne ogólnie, słabe tam, gdzie leży wartość enterprise.</p></div>
              <div className="workitem"><div className="label">wedge</div><p><b>Repo-specific engineering performance.</b> Nie ogólny czat — wydajność na własnym repo, stacku, ticketach i testach klienta, bez wysyłania kodu poza organizację.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="inner">
          <div className="shead"><div><span className="kick">01 · produkt</span><h2>Model do kodu + agent, nie ogólny czat.</h2></div>
            <p>Wyspecjalizowany model kodujący jest sercem stacku. Produktem jest on-premowy agent wpięty w GitHub/GitLab/Jira, który dowozi mierzalny wynik na repozytorium klienta.</p></div>
          <div className="stack">
            <div className="cell area"><div className="top"><span>agent</span><span>01</span></div><h3>Monorepo agent (TS/Python)</h3><p>Repo ingestion, mapa codebase, issue-to-PR, pisanie testów, migracje i refaktory, code review. Wpięty w GitHub/GitLab/Jira, uruchamiany lokalnie u klienta.</p><div className="meta"><div><span className="k">deliverable</span>agent + integracje + dashboard</div></div></div>
            <div className="cell area"><div className="top"><span>eval</span><span>02</span></div><h3>Prywatny SWE-bench klienta</h3><p>Z historycznych bugfix-PRów, issue, test suite i constraintów budujemy wewnętrzny benchmark. Pokazujemy baseline (Claude/Codex) vs model Slayera zaadaptowany na repo — w pełni on-prem.</p><div className="meta"><div><span className="k">deliverable</span>benchmark + raport baseline vs Slayer</div></div></div>
            <div className="cell area"><div className="top"><span>deploy</span><span>03</span></div><h3>On-prem / air-gapped</h3><p>Wdrożenie wewnątrz organizacji. Kod, sekrety, architektura i dane klientów nie wychodzą na zewnątrz. SLA, fine-tuning i support pod wymagania enterprise.</p><div className="meta"><div><span className="k">deliverable</span>deployment + SLA + adaptery</div></div></div>
          </div>
        </div>
      </section>

      <hr className="rule" />

      <section className="sec alt">
        <div className="inner">
          <div className="shead"><div><span className="kick">02 · co robi agent</span><h2>Wydajność inżynierska na prywatnym repo.</h2></div>
            <p>Nie „najlepszy model kodujący globalnie”. Najlepszy on-prem coding agent dla enterprise'owych monorepo TypeScript/Python — mierzony na realnych testach, CI i czasie review.</p></div>
          <div className="grid auto">
            <div className="cell area"><div className="top"><span>rozumienie</span><span>01</span></div><h3>Duże prywatne monorepo</h3><p>Mapuje codebase, zależności, wewnętrzne frameworki i konwencje. Rozumie kontekst, którego model hosted nigdy nie widzi.</p></div>
            <div className="cell area"><div className="top"><span>bugfix</span><span>02</span></div><h3>Naprawa pod realne testy</h3><p>Issue → patch sprawdzany przeciw faktycznemu test suite klienta, z filtrem flaky-testów i constraintami bezpieczeństwa.</p></div>
            <div className="cell area"><div className="top"><span>zmiany</span><span>03</span></div><h3>Migracje i refaktory</h3><p>Generuje migracje, refaktory i testy w stylu repo. Adaptuje się do wewnętrznych frameworków, nie do generycznego boilerplate'u.</p></div>
            <div className="cell area"><div className="top"><span>review</span><span>04</span></div><h3>Code review</h3><p>Recenzuje pull requesty pod regresje, styl i bezpieczeństwo. Skraca czas seniorów, gdzie kosztuje najwięcej.</p></div>
            <div className="cell area"><div className="top"><span>pętla</span><span>05</span></div><h3>Customer-specific eval loop</h3><p>Każda iteracja mierzona na repo klienta: pass rate, accepted PRs, czas review, zaoszczędzone roboczogodziny.</p></div>
          </div>
        </div>
      </section>

      <hr className="rule" />

      <section className="sec">
        <div className="inner">
          <div className="shead"><div><span className="kick">03 · model biznesowy</span><h2>Pilot, licencja produkcyjna, moat.</h2></div>
            <p>Wchodzimy pilotem na 1–3 repozytoria, dowozimy baseline vs Slayer, przechodzimy w licencję produkcyjną. Moat rośnie z danymi specyficznymi dla repo klienta.</p></div>
          <div className="grid c3">
            <div className="cell"><div className="top"><span>€20k–€75k</span><span>01</span></div><h3 className="sm">Enterprise pilot</h3><p>8–12 tygodni: on-prem PoC, 1–3 repo, prywatny eval suite, baseline vs Slayer, integracja z GitHub/GitLab/Jira, raport accepted patches i test pass rate.</p></div>
            <div className="cell"><div className="top"><span>€100k–€500k ARR</span><span>02</span></div><h3 className="sm">Licencja produkcyjna</h3><p>Per enterprise, zależnie od liczby developerów i repozytoriów, deploymentu, SLA, fine-tuningu, supportu i wymagań air-gapped.</p></div>
            <div className="cell"><div className="top"><span>compounding</span><span>03</span></div><h3 className="sm">Long-term moat</h3><p>Repo-specific evale, task traces, accepted/rejected patche, datasety transformacji kodu, customer-specific adaptery i synthetic task generation z realnych repo.</p></div>
          </div>
        </div>
      </section>

      <hr className="rule" />

      <section className="sec alt">
        <div className="inner">
          <div className="shead"><div><span className="kick">04 · czego NIE obiecujemy</span><h2>Nie „polski OpenAI od kodu”.</h2></div>
            <p>Zawężamy claim do tego, co inwestowalne i obronne. Frontier capex to nie nasza gra — kontekst, evale i integracja to nasza gra.</p></div>
          <div className="grid c2">
            <div className="cell"><h3 className="sm">Nie globalny benchmark</h3><p>Nie ścigamy się o „najlepszy model kodujący na świecie”. Wygrywamy na prywatnym repo klienta, gdzie modele hosted nie widzą danych.</p></div>
            <div className="cell"><h3 className="sm">IOI = talent, nie waga</h3><p>Medale IOI to recruiting signal i baza do evali, code reasoning i program synthesis — nie „dowód konstrukcyjny”, że mamy gotowy frontier model.</p></div>
            <div className="cell"><h3 className="sm">Model ≠ produkt</h3><p>Produktem jest agent + integracje + prywatny eval harness + dashboard. Model jest częścią stacku, nie tym, co sprzedajemy.</p></div>
            <div className="cell"><h3 className="sm">Zero leaku kodu</h3><p>On-prem i air-gapped. Repozytoria, tickety, sekrety i architektura zostają w organizacji — to warunek brzegowy, nie opcja.</p></div>
          </div>
        </div>
      </section>

      <section className="sec alt" id="pilot">
        <div className="inner narrow" style={{ textAlign: "center" }}>
          <span className="kick">domyślna warstwa prywatnej inteligencji kodu</span>
          <h2 className="serif" style={{ fontSize: "clamp(2.1rem,4.2vw,3.1rem)", fontWeight: 400, letterSpacing: "-.015em", margin: "14px 0 14px", color: "var(--ink)" }}>The European on-prem coding lab.</h2>
          <p className="muted" style={{ maxWidth: "58ch", margin: "0 auto 26px", fontSize: "1.06rem" }}>Frontier-grade engineering dla firm, które nie mogą wysłać kodu do OpenAI, Anthropic czy Cursora. Umów 8–12-tygodniowego pilota na własnym repo.</p>
          <div className="cta-row" style={{ justifyContent: "center" }}><a className="btn btn-p" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">umów pilota →</a><a className="btn btn-s" href="/zespol">dla zespołu</a></div>
        </div>
      </section>
    </div>
  );
}
