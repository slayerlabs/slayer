export const metadata = {
  title: "Slayer Code — on-prem coding intelligence lab",
  description:
    "Slayer Code buduje on-premowe agenty i wyspecjalizowane modele kodujące dla enterprise'owych baz TypeScript i Python. Wygrywamy tam, gdzie modele frontierowe są najsłabsze: wewnątrz prywatnych repozytoriów, których nie widzą.",
};

const css = `
    /* ---------- hero ---------- */
    .hero{position:relative;padding:132px clamp(18px,5vw,72px) 0;overflow:hidden;min-height:96vh}
    .hero::before{content:"";position:absolute;inset:0;background:
      linear-gradient(90deg,rgba(9,9,7,.96) 0%,rgba(9,9,7,.82) 42%,rgba(9,9,7,.44) 74%,rgba(9,9,7,.84) 100%),
      linear-gradient(180deg,rgba(9,9,7,.12) 0%,rgba(9,9,7,.66) 72%,var(--bg) 100%),
      url('/assets/img/hermes-lab-threshold.png') center right/cover no-repeat;
      pointer-events:none;filter:saturate(.86) contrast(1.06)}
    .hero::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.34;background:
      repeating-linear-gradient(90deg,transparent 0 56px,rgba(222,202,154,.08) 56px 57px),
      repeating-linear-gradient(0deg,transparent 0 56px,rgba(222,202,154,.055) 56px 57px);
      -webkit-mask-image:radial-gradient(ellipse 82% 72% at 58% 22%,#000 0%,transparent 76%);
      mask-image:radial-gradient(ellipse 82% 72% at 58% 22%,#000 0%,transparent 76%)}
    .hgrid{position:relative;z-index:1;width:min(var(--max),100%);margin:0 auto;display:grid;grid-template-columns:minmax(0,1.06fr) minmax(320px,.72fr);gap:clamp(24px,5vw,70px);align-items:center;min-height:72vh;padding-bottom:clamp(54px,7vw,84px)}
    @media(max-width:940px){.hgrid{grid-template-columns:1fr;min-height:0}}
    .htag{display:inline-flex;align-items:center;gap:10px;margin-bottom:26px}
    .htag .dot{width:7px;height:7px;border-radius:50%;background:var(--acc);animation:pl 2s infinite}
    .hero h1{margin:0 0 24px;font-family:var(--serif);font-size:clamp(3rem,6.6vw,5.6rem);line-height:.96;font-weight:360;letter-spacing:-.018em;color:var(--ink);max-width:13ch;text-wrap:balance;text-shadow:0 18px 70px rgba(0,0,0,.55)}
    .hero h1 em{font-style:italic;color:var(--acc)}
    .lede{max-width:700px;margin:0 0 32px;color:#cfc1a5;font-size:clamp(1.08rem,1.7vw,1.3rem);line-height:1.55;text-shadow:0 10px 34px rgba(0,0,0,.5)}
    .lede b{color:var(--ink);font-weight:600}
    .lede a{color:var(--acc);border-bottom:1px solid var(--acc-soft)}
    .hero-panel{justify-self:end;width:min(420px,100%);border:1px solid rgba(222,202,154,.18);border-radius:14px;background:rgba(18,17,13,.78);backdrop-filter:blur(18px);box-shadow:0 28px 80px rgba(0,0,0,.38);overflow:hidden}
    .hero-panel .hp-top{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 16px;border-bottom:1px solid var(--line2);font-family:var(--mono);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
    .hero-panel .hp-top b{color:var(--acc);font-weight:500}
    .focus-list{display:grid}
    .focus{display:grid;grid-template-columns:42px 1fr;gap:14px;padding:17px 18px;border-top:1px solid var(--line2)}
    .focus:first-child{border-top:0}
    .focus .idx{font-family:var(--mono);font-size:.76rem;color:var(--blue);padding-top:2px}
    .focus h3{margin:0 0 3px;font-size:1rem;color:var(--ink);letter-spacing:0}
    .focus p{margin:0;color:var(--mut);font-size:.9rem;line-height:1.45}
    .artifact-strip{display:flex;flex-wrap:wrap;gap:7px;padding:14px 16px;border-top:1px solid var(--line2);background:rgba(126,158,176,.055)}
    .artifact-strip span{font-family:var(--mono);font-size:.67rem;color:#b6c9d4;border:1px solid rgba(126,158,176,.24);border-radius:999px;padding:4px 8px;background:rgba(126,158,176,.07)}
    @media(max-width:940px){.hero-panel{justify-self:start;margin-top:8px}}

    .rv{opacity:0;transform:translateY(14px);animation:rv .7s cubic-bezier(.2,.7,.3,1) forwards}
    .rv.d1{animation-delay:.06s}.rv.d2{animation-delay:.16s}.rv.d3{animation-delay:.26s}
    .rv.d4{animation-delay:.36s}.rv.d5{animation-delay:.48s}
    @keyframes rv{to{opacity:1;transform:none}}
    @media(prefers-reduced-motion:reduce){.rv{animation:none;opacity:1;transform:none}}

    .stats{position:relative;z-index:1;border-top:1px solid var(--line);background:rgba(9,9,7,.78);backdrop-filter:blur(14px)}
    .stats .inner{display:grid;grid-template-columns:repeat(4,1fr);width:min(var(--max),100%);margin:0 auto}
    @media(max-width:820px){.stats .inner{grid-template-columns:repeat(2,1fr)}}
    .stat{padding:22px clamp(14px,2vw,28px);border-left:1px solid var(--line2);position:relative}
    .stat::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:transparent}
    .stat:nth-child(2)::before{background:rgba(126,158,176,.72)}
    .stat:nth-child(3)::before{background:rgba(116,163,122,.72)}
    .stat:nth-child(4)::before{background:rgba(199,148,72,.72)}
    .stat:first-child{border-left:0}
    @media(max-width:820px){.stat:nth-child(3){border-left:0}.stat:nth-child(n+3){border-top:1px solid var(--line2)}}
    .stat .v{font-family:var(--serif);font-size:clamp(1.7rem,3vw,2.3rem);color:var(--ink);line-height:1.1}
    .stat .v .ac{color:var(--acc)}
    .stat .k{font-family:var(--mono);font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-top:5px}

    .traction{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:18px;align-items:stretch}
    @media(max-width:920px){.traction{grid-template-columns:1fr}}
    .traction-copy{border:1px solid rgba(199,148,72,.32);border-radius:14px;background:linear-gradient(180deg,rgba(199,148,72,.075),rgba(255,255,255,.014)),var(--panel);padding:30px;box-shadow:0 22px 70px rgba(0,0,0,.22)}
    .traction-copy h2{font-family:var(--serif);font-size:clamp(2rem,4vw,3rem);font-weight:400;line-height:1.04;letter-spacing:-.016em;margin:12px 0 14px;color:var(--ink);max-width:11ch}
    .traction-copy h2 em{color:var(--acc);font-style:italic}
    .traction-copy p{margin:0;color:var(--mut);font-size:1rem;line-height:1.65;max-width:48ch}
    .traction-copy .source{margin-top:18px;font-family:var(--mono);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--dim)}
    .traction-panel{border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.012)),var(--panel);box-shadow:0 22px 70px rgba(0,0,0,.24);overflow:hidden}
    .traction-top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;border-bottom:1px solid var(--line2);font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--dim)}
    .traction-top b{color:var(--acc);font-weight:500}
    .traction-metrics{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--line2)}
    @media(max-width:620px){.traction-metrics{grid-template-columns:1fr}.traction-metric{border-left:0!important;border-top:1px solid var(--line2)}.traction-metric:first-child{border-top:0}}
    .traction-metric{padding:18px 18px 16px;border-left:1px solid var(--line2)}
    .traction-metric:first-child{border-left:0}
    .traction-metric .num{font-family:var(--serif);font-size:clamp(1.65rem,3vw,2.4rem);line-height:1;color:var(--ink);letter-spacing:-.012em}
    .traction-metric .lbl{font-family:var(--mono);font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-top:8px}
    .traction-chart{padding:22px 18px 16px}
    .chart-frame{position:relative;height:250px;border-left:1px solid var(--line2);border-bottom:1px solid var(--line2);background:linear-gradient(180deg,rgba(142,181,200,.055),transparent)}
    .chart-frame::before,.chart-frame::after{content:"";position:absolute;left:0;right:0;height:1px;background:var(--line2)}
    .chart-frame::before{top:25%}.chart-frame::after{top:58%}
    .chart-bars{position:absolute;inset:0 12px 0 12px;display:grid;grid-template-columns:repeat(7,1fr);gap:10px;align-items:end}
    .chart-bar{position:relative;display:flex;align-items:end;justify-content:center;min-width:0;height:100%}
    .chart-bar i{display:block;width:100%;max-width:34px;height:var(--h);border-radius:7px 7px 0 0;background:linear-gradient(180deg,var(--blue),rgba(142,181,200,.18));border:1px solid rgba(142,181,200,.28);box-shadow:0 0 28px rgba(142,181,200,.08)}
    .chart-bar.peak i{background:linear-gradient(180deg,var(--acc),rgba(215,163,81,.18));border-color:rgba(215,163,81,.4);box-shadow:0 0 34px rgba(215,163,81,.12)}
    .chart-bar span{position:absolute;bottom:-27px;font-family:var(--mono);font-size:.68rem;color:var(--dim);white-space:nowrap}
    .chart-note{display:flex;justify-content:space-between;gap:14px;margin-top:38px;font-family:var(--mono);font-size:.68rem;line-height:1.45;color:var(--dim)}
    .chart-note b{color:var(--acc);font-weight:500}

    .thesis{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:18px;align-items:stretch}
    @media(max-width:880px){.thesis{grid-template-columns:1fr}}
    .quote{border:1px solid rgba(199,148,72,.34);border-left:3px solid var(--acc);border-radius:14px;background:linear-gradient(180deg,rgba(199,148,72,.08),rgba(255,255,255,.015)),var(--panel);padding:32px;box-shadow:0 22px 70px rgba(0,0,0,.22)}
    .quote p{font-family:var(--serif);font-size:clamp(1.6rem,3vw,2.28rem);line-height:1.15;color:var(--ink);margin:0;letter-spacing:-.012em}
    .quote .sub{font-family:var(--mono);font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin-top:18px;line-height:1.5}
    .worklist{display:grid;gap:12px}
    .workitem{border:1px solid var(--line);border-radius:14px;padding:18px 20px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012)),var(--panel);box-shadow:0 14px 44px rgba(0,0,0,.16)}
    .workitem .label{font-family:var(--mono);font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-bottom:8px}
    .workitem p{margin:0;color:var(--mut)}
    .workitem b{color:var(--ink)}

    .loggrid{display:grid;grid-template-columns:1fr 1fr;gap:0 34px;padding:6px 18px 8px}
    @media(max-width:820px){.loggrid{grid-template-columns:1fr}}
    .loggrid .logrow:nth-child(2){border-top:0}
    .loghead{display:flex;align-items:center;gap:8px}
    .logrow{display:grid;grid-template-columns:120px 1fr auto;gap:12px;align-items:baseline;padding:13px 2px;border-top:1px solid var(--line2);font-size:.92rem}
    .logrow:first-child{border-top:0}
    .logrow .dt{font-family:var(--mono);font-size:.72rem;color:var(--dim);letter-spacing:.04em}
    .logrow .what{color:var(--txt)}
    .logrow .what b{font-weight:600;color:var(--ink)}
    .logrow .what .sub{display:block;font-family:var(--mono);font-size:.72rem;color:var(--dim);margin-top:2px}
    .logrow .go{font-family:var(--mono);font-size:.78rem;color:var(--acc);white-space:nowrap}
    a.logrow{transition:background .15s}
    a.logrow:hover{background:rgba(199,148,72,.07)}
    @media(max-width:480px){.logrow{grid-template-columns:1fr auto}.logrow .dt{display:none}}

    .stack{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
    @media(max-width:900px){.stack{grid-template-columns:1fr}}
    .stack .cell{min-height:230px;border-top:2px solid rgba(126,158,176,.42)}
    .stack .cell:nth-child(2){border-top-color:rgba(199,148,72,.58)}
    .stack .cell:nth-child(3){border-top-color:rgba(116,163,122,.50)}
    .area h3{font-family:var(--serif);font-weight:400;font-size:1.42rem;letter-spacing:-.01em;margin:12px 0 8px}
    .area .meta{margin-top:auto;padding-top:16px}
    .road{display:grid;border:1px solid var(--line);border-radius:var(--rad);overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.032),rgba(255,255,255,.012)),var(--panel)}
    .phase{display:grid;grid-template-columns:160px 1fr;gap:20px;padding:22px 24px;border-top:1px solid var(--line2)}
    .phase:first-child{border-top:0}
    .phase .when{font-family:var(--mono);font-size:.78rem;color:var(--acc)}
    .phase h3{margin:0 0 5px;font-size:1.15rem;color:var(--ink)}
    .phase p{margin:0;color:var(--mut)}
    @media(max-width:680px){.phase{grid-template-columns:1fr;gap:6px}}
`;

export default function Home() {
  return (
    <>
      <style>{css}</style>

      <section className="hero">
        <div className="hgrid">
          <div>
            <div className="htag rv"><span className="dot"></span><span className="kick"><span className="ac">ON-PREM CODING INTELLIGENCE LAB</span> · TYPESCRIPT / PYTHON · ENTERPRISE</span></div>
            <h1 className="rv d1">Wygrywamy <em>wewnątrz repo</em>, którego frontier nie widzi.</h1>
            <p className="lede rv d2">Slayer Code buduje on-premowe agenty i wyspecjalizowane modele kodujące dla enterprise'owych baz <b>TypeScript</b> i <b>Python</b>. Nie konkurujemy z OpenAI na ogólnym czacie. Konkurujemy tam, gdzie OpenAI nie ma dostępu do danych: <b>w prywatnym repozytorium klienta</b>.</p>
            <div className="cta-row rv d3">
              <a className="btn btn-p" href="#pilot">umów pilota →</a>
              <a className="btn btn-s" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">wejście do labu</a>
            </div>
          </div>
          <aside className="hero-panel rv d4" aria-label="Na czym polega przewaga Slayer Code">
            <div className="hp-top"><span>nasz wedge</span><b>repo-specific</b></div>
            <div className="focus-list">
              <div className="focus"><div className="idx">01</div><div><h3>Adaptacja do repo</h3><p>Rozumie duże prywatne monorepo: stack, frameworki, konwencje, historię issue.</p></div></div>
              <div className="focus"><div className="idx">02</div><div><h3>Zamknięta pętla</h3><p>Testy, code review i feedback klienta domykają pętlę, której modele hosted nie mają.</p></div></div>
              <div className="focus"><div className="idx">03</div><div><h3>On-prem / air-gap</h3><p>Kod, tickety, sekrety i architektura nie opuszczają organizacji.</p></div></div>
            </div>
            <div className="artifact-strip"><span>issue→PR</span><span>testy</span><span>migracje</span><span>code review</span><span>repo map</span></div>
          </aside>
        </div>
        <div className="stats rv d5" style={{ margin: "0 calc(clamp(18px,5vw,72px) * -1)" }}>
          <div className="inner">
            <div className="stat"><div className="v">135<span className="ac"> : 127</span></div><div className="k">medale IOI · Polska vs USA</div></div>
            <div className="stat"><div className="v">+20–40<span className="ac">%</span></div><div className="k">po adaptacji na repo klienta</div></div>
            <div className="stat"><div className="v">on-prem<span className="ac"> first</span></div><div className="k">deployment we wnętrzu firmy</div></div>
            <div className="stat"><div className="v">TS/<span className="ac">PY</span></div><div className="k">focus na enterprise stack</div></div>
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
          <div className="shead"><div><span className="kick">01 · produkt</span><h2>Sprzedajemy system, nie wagi modelu.</h2></div>
            <p>Model jest częścią stacku. Produktem jest on-premowy agent kodujący wpięty w GitHub/GitLab/Jira, który dowozi mierzalny wynik na repozytorium klienta.</p></div>
          <div className="stack">
            <div className="cell area"><div className="top"><span>agent</span><span>01</span></div><h3>Monorepo agent (TS/Python)</h3><p>Repo ingestion, mapa codebase, issue-to-PR, pisanie testów, migracje i refaktory, code review. Wpięty w GitHub/GitLab/Jira, uruchamiany lokalnie u klienta.</p><div className="meta"><div><span className="k">deliverable</span>agent + integracje + dashboard</div></div></div>
            <div className="cell area"><div className="top"><span>eval</span><span>02</span></div><h3>Prywatny SWE-bench klienta</h3><p>Z historycznych bugfix-PRów, issue, test suite i constraintów budujemy wewnętrzny benchmark. Pokazujemy baseline (Claude/Codex) vs agent Slayera zaadaptowany na repo — w pełni on-prem.</p><div className="meta"><div><span className="k">deliverable</span>benchmark + raport baseline vs Slayer</div></div></div>
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

      <section className="sec tight">
        <div className="inner">
          <div className="traction">
            <div className="traction-copy rv d4">
              <span className="kick">dlaczego Polska · talent arbitrage</span>
              <h2>Najgęstszy talent <em>algorytmiczny</em> w Europie.</h2>
              <p>Oficjalne statystyki IOI pokazują Polskę z <b>135 medalami</b>, przed USA z <b>127</b>. To nie dowód, że mamy już frontier lab — to <b>sygnał talent arbitrage</b>: lokalna baza do budowy zespołu od code reasoning, evali, program synthesis i RL/verifier infrastructure.</p>
              <div className="source">Źródło: stats.ioinformatics.org · medale łącznie</div>
            </div>
            <div className="traction-panel rv d4" aria-label="Precedensy: GLM i ElevenLabs">
              <div className="traction-top"><span>precedent</span><b>investable</b></div>
              <div className="traction-metrics">
                <div className="traction-metric"><div className="num">GLM-4.5</div><div className="lbl">coding SOTA poza OpenAI/Anthropic</div></div>
                <div className="traction-metric"><div className="num">$11B</div><div className="lbl">ElevenLabs · Polish-origin founders</div></div>
                <div className="traction-metric"><div className="num">SWE</div><div className="lbl">najbardziej mierzalny task LLM</div></div>
              </div>
              <div className="traction-chart">
                <div className="chart-frame">
                  <div className="chart-bars" aria-hidden="true">
                    <div className="chart-bar" style={{ "--h": "20%" }}><i></i><span>ingest</span></div>
                    <div className="chart-bar" style={{ "--h": "32%" }}><i></i><span>map</span></div>
                    <div className="chart-bar" style={{ "--h": "46%" }}><i></i><span>bugfix</span></div>
                    <div className="chart-bar" style={{ "--h": "58%" }}><i></i><span>tests</span></div>
                    <div className="chart-bar" style={{ "--h": "70%" }}><i></i><span>migrate</span></div>
                    <div className="chart-bar peak" style={{ "--h": "94%" }}><i></i><span>adapt</span></div>
                    <div className="chart-bar" style={{ "--h": "82%" }}><i></i><span>review</span></div>
                  </div>
                </div>
                <div className="chart-note"><span>Im więcej kontekstu repo i pętli feedbacku, tym większa przewaga.</span><span>baseline → <b>+20–40%</b> na repo klienta</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
          <h2 className="serif" style={{ fontSize: "clamp(2.1rem,4.2vw,3.1rem)", fontWeight: 400, letterSpacing: "-.015em", margin: "14px 0 14px" }}>The European on-prem coding lab.</h2>
          <p className="muted" style={{ maxWidth: "58ch", margin: "0 auto 26px", fontSize: "1.06rem" }}>Frontier-grade engineering dla firm, które nie mogą wysłać kodu do OpenAI, Anthropic czy Cursora. Umów 8–12-tygodniowego pilota na własnym repo.</p>
          <div className="cta-row" style={{ justifyContent: "center" }}><a className="btn btn-p" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">umów pilota →</a><a className="btn btn-s" href="/zespol">dla zespołu</a></div>
        </div>
      </section>
    </>
  );
}
