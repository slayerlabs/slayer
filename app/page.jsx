export const metadata = {
  title: "SLAYER AI LAB — otwarte laboratorium polskiej AI",
  description:
    "Otwarte laboratorium badań stosowanych nad AI. Budujemy własne, otwarte modele — tu, w Polsce. Compute, mentoring i wsparcie jako wspólne dobro. Trenuj, testuj, wdrażaj.",
};

// ponytail: design imported verbatim from Claude Design ("SLAYER AI LAB") as inline-styled HTML;
// rendered via dangerouslySetInnerHTML to avoid hand-porting the inline styles to JSX. Edits vs source:
// template vars resolved (scanlines=0.5, marquee=32s, art always shown), <x-dc>/<sc-if>/clock script
// stripped, style-hover → CSS classes, hero photo dropped (asset >256KiB) for a dead-signal CRT fill.
// Global Nav/Footer are hidden on "/" (see Nav/Footer). Re-sync the source design to change it.

const lemCss = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');
  html,body{margin:0;padding:0;background:#0F0F10;}
  ::selection{background:#C1121F;color:#F2F1EC;}
  @keyframes marq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
  @keyframes glitchShift{0%,90%,100%{transform:translate(0,0)}92%{transform:translate(-2px,1px)}94%{transform:translate(2px,-1px)}96%{transform:translate(-1px,0)}98%{transform:translate(1px,1px)}}
  @keyframes flick{0%,97%,100%{opacity:.5}98%{opacity:.2}99%{opacity:.7}}
  .navlink:hover{color:#F2F1EC;}
  .btn-light:hover{background:#C1121F;border-color:#C1121F;color:#F2F1EC;}
  .btn-red:hover{background:#0F0F10;color:#C1121F;}
  .btn-ghost:hover{border-color:#2979FF;color:#2979FF;}
  .pillar:hover{background:#161619;}
  .flink:hover{color:#F2F1EC;}
`;

const DISCORD = "https://discord.gg/HnTkVR4c5T";
const GITHUB = "https://github.com/slayerlabs";
const HF = "https://huggingface.co/SlayerLab";

const html = `<div id="top" style="background:#0F0F10;color:#F2F1EC;font-family:'Inter',sans-serif;overflow-x:hidden;position:relative;">

  <!-- CRT scanline overlay -->
  <div style="position:fixed;inset:0;z-index:90;pointer-events:none;opacity:0.5;background:repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 3px);"></div>
  <div style="position:fixed;inset:0;z-index:89;pointer-events:none;opacity:0.5;animation:flick 5s infinite;background:radial-gradient(120% 90% at 50% 0%, transparent 60%, rgba(0,0,0,0.5) 100%);"></div>

  <!-- ============ HEADER ============ -->
  <header style="position:sticky;top:0;z-index:80;background:rgba(15,15,16,0.86);backdrop-filter:blur(10px);border-bottom:1px solid rgba(242,241,236,0.14);">
    <div style="max-width:1320px;margin:0 auto;padding:11px clamp(18px,4vw,72px);display:flex;align-items:center;justify-content:space-between;gap:24px;">
      <a href="#top" style="display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0;">
        <span style="font-family:'Space Grotesk';font-weight:700;font-size:21px;letter-spacing:0.04em;color:#F2F1EC;transform:skewX(-7deg);display:inline-block;">SLAYER</span>
        <span style="font-family:'Space Mono';font-size:9px;font-weight:700;letter-spacing:0.22em;color:#C1121F;border:1px solid #C1121F;padding:3px 5px 2px;line-height:1;">AI&nbsp;LAB</span>
      </a>
      <nav style="display:flex;gap:26px;font-family:'Space Mono';font-size:11px;letter-spacing:0.14em;color:#8A8A8A;text-transform:uppercase;">
        <a href="#misja" class="navlink" style="text-decoration:none;color:inherit;">Misja</a>
        <a href="#wizja" class="navlink" style="text-decoration:none;color:inherit;">Wizja</a>
        <a href="#otwartosc" class="navlink" style="text-decoration:none;color:inherit;">Otwartość</a>
        <a href="#sciezka" class="navlink" style="text-decoration:none;color:inherit;">Ścieżka</a>
      </nav>
      <div style="display:flex;align-items:center;gap:16px;flex-shrink:0;">
        <a href="#dolacz" class="btn-light" style="text-decoration:none;font-family:'Space Mono';font-weight:700;font-size:12px;letter-spacing:0.1em;color:#0F0F10;background:#F2F1EC;padding:9px 16px;border:1px solid #F2F1EC;">DOŁĄCZ →</a>
      </div>
    </div>
  </header>

  <!-- ============ HERO ============ -->
  <section style="position:relative;max-width:1320px;margin:0 auto;padding:clamp(36px,6vw,76px) clamp(18px,4vw,72px) clamp(48px,7vw,96px);">
    <!-- faint grid -->
    <div style="position:absolute;inset:0;pointer-events:none;opacity:0.5;background-image:linear-gradient(rgba(242,241,236,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(242,241,236,0.04) 1px,transparent 1px);background-size:64px 64px;"></div>

    <div style="position:relative;display:flex;align-items:center;gap:14px;font-family:'Space Mono';font-size:11px;letter-spacing:0.22em;color:#8A8A8A;text-transform:uppercase;margin-bottom:clamp(28px,4vw,52px);flex-wrap:wrap;">
      <span style="color:#2979FF;">◆</span>
      <span>Otwarte laboratorium badań stosowanych nad AI</span>
      <span style="flex:1;min-width:24px;height:1px;background:rgba(242,241,236,0.16);"></span>
      <span style="color:#C1121F;">WROCŁAW · PL</span>
    </div>

    <div style="position:relative;display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:clamp(36px,5vw,64px);align-items:center;">
      <!-- LEFT: copy -->
      <div>
        <h1 style="font-family:'Space Grotesk';font-weight:700;font-size:clamp(40px,6.4vw,84px);line-height:0.96;letter-spacing:-0.02em;margin:0 0 26px;color:#F2F1EC;text-wrap:balance;">
          Nie pytamy już<br>„gdzie są polskie<br>modele”.<br>
          <span style="position:relative;color:#F2F1EC;text-shadow:-2.5px 0 rgba(193,18,31,0.92), 2.5px 0 rgba(41,121,255,0.92);animation:glitchShift 7s infinite steps(1);display:inline-block;">Po prostu je tworzymy.</span>
        </h1>
        <p style="font-family:'Inter';font-size:clamp(16px,1.5vw,19px);line-height:1.6;color:#C4C3BD;max-width:52ch;margin:0 0 36px;">
          Budujemy własne, otwarte modele i badania nad sztuczną inteligencją — tu, w Polsce. Compute, mentoring i wsparcie jako wspólne dobro. Trenuj, testuj, wdrażaj — także jeśli zaczynasz od zera.
        </p>
        <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
          <a href="#dolacz" class="btn-red" style="text-decoration:none;font-family:'Space Mono';font-weight:700;font-size:13px;letter-spacing:0.08em;color:#F2F1EC;background:#C1121F;padding:14px 24px;border:1px solid #C1121F;">DOŁĄCZ DO LABU →</a>
          <a href="${GITHUB}" target="_blank" rel="noopener" class="btn-ghost" style="text-decoration:none;font-family:'Space Mono';font-weight:700;font-size:13px;letter-spacing:0.08em;color:#F2F1EC;background:transparent;padding:14px 24px;border:1px solid rgba(242,241,236,0.28);">ZOBACZ REPOZYTORIUM</a>
        </div>
        <div style="display:flex;gap:22px;flex-wrap:wrap;margin-top:36px;font-family:'Space Mono';font-size:11px;letter-spacing:0.12em;color:#5C5C5C;text-transform:uppercase;">
          <span><span style="color:#2979FF;">[</span> open weights <span style="color:#2979FF;">]</span></span>
          <span><span style="color:#2979FF;">[</span> open data <span style="color:#2979FF;">]</span></span>
          <span><span style="color:#2979FF;">[</span> open research <span style="color:#2979FF;">]</span></span>
        </div>
      </div>

      <!-- RIGHT: transmission monitor -->
      <div style="position:relative;border:1px solid rgba(242,241,236,0.22);background:#0A0A0C;padding:10px;">
        <div style="position:relative;overflow:hidden;aspect-ratio:16/10;background:#0c0c10;">
          <img src="/assets/hero.webp" alt="SLAYER AI LAB — transmisja" style="width:100%;height:100%;object-fit:cover;display:block;">
          <!-- subtle CRT scanlines to tie into the theme -->
          <div style="position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg, rgba(0,0,0,0.20) 0, rgba(0,0,0,0.20) 1px, transparent 1px, transparent 3px);opacity:0.45;"></div>
          <!-- live REC dot -->
          <div style="position:absolute;top:10px;right:12px;display:flex;align-items:center;gap:7px;font-family:'Space Mono';font-size:10px;letter-spacing:0.16em;color:#F2F1EC;">
            <span style="width:7px;height:7px;background:#C1121F;border-radius:50%;animation:blink 1.4s infinite;"></span>REC
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 4px 2px;font-family:'Space Mono';font-size:9px;letter-spacing:0.18em;color:#5C5C5C;">
          <span>SLR-AI-240601 / TRANSMISJA</span>
          <span style="height:14px;width:88px;background:repeating-linear-gradient(90deg,#5C5C5C 0,#5C5C5C 1px,transparent 1px,transparent 3px,#5C5C5C 3px,#5C5C5C 4px,transparent 4px,transparent 7px);"></span>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ MANIFESTO MARQUEE ============ -->
  <div style="overflow:hidden;background:#F2F1EC;border-top:1px solid #0F0F10;border-bottom:1px solid #0F0F10;padding:13px 0;">
    <div style="display:inline-flex;white-space:nowrap;animation:marq 32s linear infinite;font-family:'Space Grotesk';font-weight:700;font-size:clamp(18px,2.4vw,26px);letter-spacing:0.01em;color:#0F0F10;">
      <span style="padding-right:0;">TRENUJ. TESTUJ. WDRAŻAJ.&nbsp;&nbsp;<span style="color:#C1121F;">✦</span>&nbsp;&nbsp;ODPORNE NA KORPORACJE&nbsp;&nbsp;<span style="color:#2979FF;">✦</span>&nbsp;&nbsp;OFFLINE BY CHOICE&nbsp;&nbsp;<span style="color:#C1121F;">✦</span>&nbsp;&nbsp;BUILT IN POLAND&nbsp;&nbsp;<span style="color:#2979FF;">✦</span>&nbsp;&nbsp;YOU CAN JUST DO THINGS&nbsp;&nbsp;<span style="color:#C1121F;">✦</span>&nbsp;&nbsp;</span>
      <span style="padding-right:0;" aria-hidden="true">TRENUJ. TESTUJ. WDRAŻAJ.&nbsp;&nbsp;<span style="color:#C1121F;">✦</span>&nbsp;&nbsp;ODPORNE NA KORPORACJE&nbsp;&nbsp;<span style="color:#2979FF;">✦</span>&nbsp;&nbsp;OFFLINE BY CHOICE&nbsp;&nbsp;<span style="color:#C1121F;">✦</span>&nbsp;&nbsp;BUILT IN POLAND&nbsp;&nbsp;<span style="color:#2979FF;">✦</span>&nbsp;&nbsp;YOU CAN JUST DO THINGS&nbsp;&nbsp;<span style="color:#C1121F;">✦</span>&nbsp;&nbsp;</span>
    </div>
  </div>

  <!-- ============ MISJA ============ -->
  <section id="misja" style="max-width:1320px;margin:0 auto;padding:clamp(64px,9vw,128px) clamp(18px,4vw,72px);">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:38px;">
      <span style="font-family:'Space Mono';font-size:12px;letter-spacing:0.2em;color:#2979FF;">[ 01 ]</span>
      <span style="font-family:'Space Mono';font-size:12px;letter-spacing:0.32em;color:#8A8A8A;text-transform:uppercase;">Misja</span>
      <span style="flex:1;height:1px;background:rgba(242,241,236,0.14);"></span>
    </div>
    <h2 style="font-family:'Space Grotesk';font-weight:700;font-size:clamp(30px,4.4vw,58px);line-height:1.02;letter-spacing:-0.02em;margin:0 0 24px;max-width:20ch;color:#F2F1EC;text-wrap:balance;">
      Dajemy ludziom to, czego w pojedynkę zdobyć się nie da.
    </h2>
    <p style="font-family:'Inter';font-size:clamp(16px,1.5vw,18px);line-height:1.65;color:#C4C3BD;max-width:64ch;margin:0 0 56px;">
      Moc obliczeniową, mentoring, materiały i wsparcie — także prawne. Dzięki temu każdy, kto chce, może realnie trenować, testować i wdrażać modele AI. Także osoba, która zaczyna od zera.
    </p>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:1px;background:rgba(242,241,236,0.14);border:1px solid rgba(242,241,236,0.14);">
      <div class="pillar" style="background:#121215;padding:30px 28px 34px;position:relative;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px;">
          <span style="font-family:'Space Grotesk';font-weight:700;font-size:42px;line-height:1;color:rgba(242,241,236,0.12);">01</span>
          <span style="font-family:'Space Mono';font-size:10px;letter-spacing:0.16em;color:#2979FF;">// COMPUTE</span>
        </div>
        <h3 style="font-family:'Space Grotesk';font-weight:600;font-size:19px;line-height:1.2;margin:0 0 12px;color:#F2F1EC;">Compute jako wspólne dobro</h3>
        <p style="font-family:'Inter';font-size:14.5px;line-height:1.6;color:#A6A5A0;margin:0;">Najdroższy i najtrudniej dostępny zasób w AI. Łączymy sprzęt od partnerów i udostępniamy go społeczności — o tym, co zbudujesz, decyduje pomysł, nie portfel.</p>
      </div>
      <div class="pillar" style="background:#121215;padding:30px 28px 34px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px;">
          <span style="font-family:'Space Grotesk';font-weight:700;font-size:42px;line-height:1;color:rgba(242,241,236,0.12);">02</span>
          <span style="font-family:'Space Mono';font-size:10px;letter-spacing:0.16em;color:#2979FF;">// ŚCIEŻKA</span>
        </div>
        <h3 style="font-family:'Space Grotesk';font-weight:600;font-size:19px;line-height:1.2;margin:0 0 12px;color:#F2F1EC;">Od obserwatora do kontrybutora</h3>
        <p style="font-family:'Inter';font-size:14.5px;line-height:1.6;color:#A6A5A0;margin:0;">Próg wejścia jest niski. GitHub, uruchomienie kodu, kilka modeli — a dalej tak daleko, jak chcesz. Każdy dostaje opiekuna i materiały. Awansujesz przez to, co realnie zrobisz.</p>
      </div>
      <div class="pillar" style="background:#121215;padding:30px 28px 34px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px;">
          <span style="font-family:'Space Grotesk';font-weight:700;font-size:42px;line-height:1;color:rgba(242,241,236,0.12);">03</span>
          <span style="font-family:'Space Mono';font-size:10px;letter-spacing:0.16em;color:#C1121F;">// OPEN</span>
        </div>
        <h3 style="font-family:'Space Grotesk';font-weight:600;font-size:19px;line-height:1.2;margin:0 0 12px;color:#F2F1EC;">Otwartość jako fundament</h3>
        <p style="font-family:'Inter';font-size:14.5px;line-height:1.6;color:#A6A5A0;margin:0;">Budujemy w open source — wszystko, co tworzymy, jest wspólnym dobrem. Komercja jest paliwem, nie celem: utrzymują nas wdrożenia i współpraca z partnerami.</p>
      </div>
      <div class="pillar" style="background:#121215;padding:30px 28px 34px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px;">
          <span style="font-family:'Space Grotesk';font-weight:700;font-size:42px;line-height:1;color:rgba(242,241,236,0.12);">04</span>
          <span style="font-family:'Space Mono';font-size:10px;letter-spacing:0.16em;color:#C1121F;">// KULTURA</span>
        </div>
        <h3 style="font-family:'Space Grotesk';font-weight:600;font-size:19px;line-height:1.2;margin:0 0 12px;color:#F2F1EC;">Kultura zamiast korporacji</h3>
        <p style="font-family:'Inter';font-size:14.5px;line-height:1.6;color:#A6A5A0;margin:0;">Proste zasady, mocne opinie, zero korpomowy. Inspirują nas miejsca trzecie — przestrzeń między domem a pracą, w której po prostu tworzysz.</p>
      </div>
    </div>
  </section>

  <!-- ============ WIZJA ============ -->
  <section id="wizja" style="position:relative;background:#0A0A0C;border-top:1px solid rgba(242,241,236,0.1);border-bottom:1px solid rgba(242,241,236,0.1);">
    <div style="max-width:1320px;margin:0 auto;padding:clamp(64px,9vw,128px) clamp(18px,4vw,72px);">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:38px;">
        <span style="font-family:'Space Mono';font-size:12px;letter-spacing:0.2em;color:#C1121F;">[ 02 ]</span>
        <span style="font-family:'Space Mono';font-size:12px;letter-spacing:0.32em;color:#8A8A8A;text-transform:uppercase;">Wizja</span>
        <span style="flex:1;height:1px;background:rgba(242,241,236,0.14);"></span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:clamp(40px,5vw,72px);align-items:start;">
        <div>
          <h2 style="font-family:'Space Grotesk';font-weight:700;font-size:clamp(32px,4.6vw,62px);line-height:1.0;letter-spacing:-0.02em;margin:0 0 28px;color:#F2F1EC;text-wrap:balance;">
            Talentu nigdy nam nie brakowało.<br><span style="color:#C1121F;">Brakowało miejsca.</span>
          </h2>
          <div style="display:flex;flex-direction:column;gap:14px;font-family:'Space Mono';font-size:11px;letter-spacing:0.14em;color:#5C5C5C;text-transform:uppercase;">
            <span style="border-left:2px solid #2979FF;padding-left:12px;">// jedna z najwyższych gęstości programistów na świecie</span>
            <span style="border-left:2px solid #2979FF;padding-left:12px;">// czołówka olimpiad informatycznych</span>
            <span style="border-left:2px solid #C1121F;padding-left:12px;">// polacy współtworzyli najważniejsze laby AI</span>
          </div>
        </div>
        <div>
          <p style="font-family:'Inter';font-size:clamp(16px,1.5vw,18px);line-height:1.7;color:#C4C3BD;margin:0 0 22px;">
            Mamy w kraju jedną z najwyższych na świecie gęstości programistów i inżynierów, jesteśmy w czołówce olimpiad informatycznych, a Polacy współtworzyli najważniejsze laboratoria AI na świecie. Brakowało miejsca, w którym można tego talentu użyć — <span style="color:#F2F1EC;">otwarcie, wspólnie i bez czekania na pozwolenie.</span>
          </p>
          <p style="font-family:'Inter';font-size:clamp(16px,1.5vw,18px);line-height:1.7;color:#A6A5A0;margin:0 0 22px;">
            Stawiamy na działanie zamiast bezradności. Wiedza jest dostępna, moc obliczeniowa istnieje — łączymy je z ludźmi gotowymi robić rzeczy i pokazujemy, że <em style="color:#2979FF;font-style:normal;">ty też możesz</em>. Każdy model, benchmark i wdrożenie powstają na widoku, jako wspólne dobro, i zostają w Polsce.
          </p>
          <p style="font-family:'Inter';font-size:clamp(16px,1.5vw,18px);line-height:1.7;color:#A6A5A0;margin:0;">
            Naszą ambicją jest dowód: że da się tworzyć poważne AI lokalnie, że polski research nie musi dziać się pod cudzą flagą i że największą przeszkodą nigdy nie był talent — tylko odwaga, żeby zacząć.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ OTWARTOŚĆ / TERMINAL ============ -->
  <section id="otwartosc" style="max-width:1320px;margin:0 auto;padding:clamp(64px,9vw,128px) clamp(18px,4vw,72px);">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:38px;">
      <span style="font-family:'Space Mono';font-size:12px;letter-spacing:0.2em;color:#2979FF;">[ 03 ]</span>
      <span style="font-family:'Space Mono';font-size:12px;letter-spacing:0.32em;color:#8A8A8A;text-transform:uppercase;">Otwartość</span>
      <span style="flex:1;height:1px;background:rgba(242,241,236,0.14);"></span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:clamp(36px,5vw,56px);align-items:center;">
      <div>
        <h2 style="font-family:'Space Grotesk';font-weight:700;font-size:clamp(30px,4.2vw,54px);line-height:1.02;letter-spacing:-0.02em;margin:0 0 22px;color:#F2F1EC;text-wrap:balance;">
          Wszystko powstaje na widoku.
        </h2>
        <p style="font-family:'Inter';font-size:clamp(16px,1.5vw,18px);line-height:1.65;color:#C4C3BD;max-width:48ch;margin:0 0 28px;">
          Nie trzeba budować wszystkiego od zera ani chować efektów pracy pod NDA, do których nikt z zewnątrz nie ma dostępu. Otwarte wagi, otwarte dane, otwarty research — domyślnie.
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;font-family:'Space Mono';font-size:12px;letter-spacing:0.06em;">
          <span style="border:1px solid rgba(242,241,236,0.24);padding:8px 14px;color:#F2F1EC;">GitHub</span>
          <span style="border:1px solid rgba(242,241,236,0.24);padding:8px 14px;color:#F2F1EC;">Hugging Face</span>
          <span style="border:1px solid rgba(242,241,236,0.24);padding:8px 14px;color:#F2F1EC;">Apache-2.0</span>
        </div>
      </div>
      <div style="border:1px solid rgba(242,241,236,0.2);background:#08080A;font-family:'Space Mono';font-size:13px;line-height:1.85;">
        <div style="display:flex;align-items:center;gap:7px;padding:10px 14px;border-bottom:1px solid rgba(242,241,236,0.14);color:#5C5C5C;font-size:11px;letter-spacing:0.1em;">
          <span style="width:9px;height:9px;border-radius:50%;background:#C1121F;"></span>
          <span style="width:9px;height:9px;border-radius:50%;background:#5C5C5C;"></span>
          <span style="width:9px;height:9px;border-radius:50%;background:#5C5C5C;"></span>
          <span style="margin-left:8px;">slayer@core — bash</span>
        </div>
        <div style="padding:18px 16px;color:#C4C3BD;">
          <div><span style="color:#2979FF;">$</span> git clone github.com/slayerlabs/core</div>
          <div><span style="color:#2979FF;">$</span> cd core && ./train.sh --open-weights</div>
          <div style="color:#5C5C5C;">&gt; INIT</div>
          <div style="color:#5C5C5C;">&gt; LOADING CORE MODULES</div>
          <div style="color:#5C5C5C;">&gt; TRAINING MODEL ............ <span style="color:#F2F1EC;">100%</span></div>
          <div style="color:#5C5C5C;">&gt; EVALUATING · DEPLOYING</div>
          <div style="margin-top:6px;color:#F2F1EC;">STATUS: <span style="color:#2979FF;">OPEN_BY_DEFAULT ✓</span> <span style="display:inline-block;width:8px;height:15px;background:#2979FF;margin-left:2px;vertical-align:middle;animation:blink 1.1s infinite;"></span></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ ŚCIEŻKA ============ -->
  <section id="sciezka" style="background:#0A0A0C;border-top:1px solid rgba(242,241,236,0.1);">
    <div style="max-width:1320px;margin:0 auto;padding:clamp(64px,9vw,128px) clamp(18px,4vw,72px);">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:38px;">
        <span style="font-family:'Space Mono';font-size:12px;letter-spacing:0.2em;color:#C1121F;">[ 04 ]</span>
        <span style="font-family:'Space Mono';font-size:12px;letter-spacing:0.32em;color:#8A8A8A;text-transform:uppercase;">Ścieżka</span>
        <span style="flex:1;height:1px;background:rgba(242,241,236,0.14);"></span>
      </div>
      <h2 style="font-family:'Space Grotesk';font-weight:700;font-size:clamp(30px,4.2vw,54px);line-height:1.02;letter-spacing:-0.02em;margin:0 0 48px;max-width:18ch;color:#F2F1EC;text-wrap:balance;">
        Od pierwszego clone do wdrożonego modelu.
      </h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin-bottom:48px;">
        <div style="border-top:2px solid #2979FF;padding-top:18px;">
          <div style="font-family:'Space Mono';font-size:11px;letter-spacing:0.16em;color:#2979FF;margin-bottom:10px;">STEP_01</div>
          <h3 style="font-family:'Space Grotesk';font-weight:600;font-size:18px;margin:0 0 8px;color:#F2F1EC;">Obserwujesz</h3>
          <p style="font-family:'Inter';font-size:14px;line-height:1.55;color:#A6A5A0;margin:0;">Wchodzisz na GitHub, uruchamiasz kod, testujesz kilka modeli. Zero zobowiązań.</p>
        </div>
        <div style="border-top:2px solid #2979FF;padding-top:18px;">
          <div style="font-family:'Space Mono';font-size:11px;letter-spacing:0.16em;color:#2979FF;margin-bottom:10px;">STEP_02</div>
          <h3 style="font-family:'Space Grotesk';font-weight:600;font-size:18px;margin:0 0 8px;color:#F2F1EC;">Dostajesz opiekuna</h3>
          <p style="font-family:'Inter';font-size:14px;line-height:1.55;color:#A6A5A0;margin:0;">Materiały, mentoring i dostęp do compute. Idziesz tak daleko, jak chcesz.</p>
        </div>
        <div style="border-top:2px solid #C1121F;padding-top:18px;">
          <div style="font-family:'Space Mono';font-size:11px;letter-spacing:0.16em;color:#C1121F;margin-bottom:10px;">STEP_03</div>
          <h3 style="font-family:'Space Grotesk';font-weight:600;font-size:18px;margin:0 0 8px;color:#F2F1EC;">Kontrybuujesz</h3>
          <p style="font-family:'Inter';font-size:14px;line-height:1.55;color:#A6A5A0;margin:0;">Awans przez to, co realnie zrobisz — nie przez CV. Twój kod zostaje w Polsce, na widoku.</p>
        </div>
      </div>
      <div style="border:1px solid rgba(193,18,31,0.5);background:rgba(193,18,31,0.06);padding:22px 26px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;">
        <span style="font-family:'Space Mono';font-size:11px;letter-spacing:0.16em;color:#C1121F;flex-shrink:0;">◆ STYPENDIA</span>
        <p style="font-family:'Inter';font-size:15px;line-height:1.5;color:#C4C3BD;margin:0;">Połowę miejsc rezerwujemy na stypendia — dla studentów, licealistów i osób w trudniejszej sytuacji życiowej.</p>
      </div>
    </div>
  </section>

  <!-- ============ CTA / DOŁĄCZ ============ -->
  <section id="dolacz" style="position:relative;max-width:1320px;margin:0 auto;padding:clamp(72px,11vw,160px) clamp(18px,4vw,72px);text-align:center;">
    <div style="position:absolute;inset:0;pointer-events:none;opacity:0.4;background-image:linear-gradient(rgba(242,241,236,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(242,241,236,0.04) 1px,transparent 1px);background-size:48px 48px;"></div>
    <div style="position:relative;">
      <div style="font-family:'Space Mono';font-size:12px;letter-spacing:0.24em;color:#2979FF;text-transform:uppercase;margin-bottom:24px;">// You can just do things</div>
      <h2 style="font-family:'Space Grotesk';font-weight:700;font-size:clamp(40px,7vw,96px);line-height:0.98;letter-spacing:-0.03em;margin:0 auto 28px;max-width:16ch;color:#F2F1EC;text-wrap:balance;">
        Wejdź w chaos i twórz razem z nami.
      </h2>
      <p style="font-family:'Inter';font-size:clamp(16px,1.6vw,19px);line-height:1.6;color:#C4C3BD;max-width:54ch;margin:0 auto 44px;">
        Jeśli w to nie wierzysz — wpadnij, a pokażemy ci, że się da. Nie bój się zadawać „głupich” pytań. Nie mów, że jest chaos — wejdź w niego i działaj.
      </p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;">
        <a href="${DISCORD}" target="_blank" rel="noopener" class="btn-light" style="text-decoration:none;font-family:'Space Mono';font-weight:700;font-size:13px;letter-spacing:0.08em;color:#0F0F10;background:#F2F1EC;padding:15px 28px;border:1px solid #F2F1EC;">DISCORD →</a>
        <a href="${GITHUB}" target="_blank" rel="noopener" class="btn-ghost" style="text-decoration:none;font-family:'Space Mono';font-weight:700;font-size:13px;letter-spacing:0.08em;color:#F2F1EC;background:transparent;padding:15px 28px;border:1px solid rgba(242,241,236,0.28);">GITHUB</a>
        <a href="${HF}" target="_blank" rel="noopener" class="btn-ghost" style="text-decoration:none;font-family:'Space Mono';font-weight:700;font-size:13px;letter-spacing:0.08em;color:#F2F1EC;background:transparent;padding:15px 28px;border:1px solid rgba(242,241,236,0.28);">HUGGING FACE</a>
      </div>
    </div>
  </section>

  <!-- ============ FOOTER ============ -->
  <footer style="border-top:1px solid rgba(242,241,236,0.16);background:#08080A;">
    <div style="max-width:1320px;margin:0 auto;padding:44px clamp(18px,4vw,72px) 28px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:32px;flex-wrap:wrap;margin-bottom:40px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            <span style="font-family:'Space Grotesk';font-weight:700;font-size:24px;letter-spacing:0.04em;color:#F2F1EC;transform:skewX(-7deg);display:inline-block;">SLAYER</span>
            <span style="font-family:'Space Mono';font-size:9px;font-weight:700;letter-spacing:0.22em;color:#C1121F;border:1px solid #C1121F;padding:3px 5px 2px;line-height:1;">AI&nbsp;LAB</span>
          </div>
          <p style="font-family:'Space Mono';font-size:11px;letter-spacing:0.1em;color:#5C5C5C;margin:0;line-height:1.7;">BUILT IN POLAND. DESIGNED FOR THE FUTURE.<br>RESEARCH · BUILD · DEPLOY · WROCŁAW, POLAND</p>
        </div>
        <div style="display:flex;gap:48px;flex-wrap:wrap;font-family:'Space Mono';font-size:12px;letter-spacing:0.08em;">
          <div style="display:flex;flex-direction:column;gap:9px;">
            <span style="color:#5C5C5C;font-size:10px;letter-spacing:0.2em;margin-bottom:3px;">LAB</span>
            <a href="#misja" class="flink" style="text-decoration:none;color:#A6A5A0;">Misja</a>
            <a href="#wizja" class="flink" style="text-decoration:none;color:#A6A5A0;">Wizja</a>
            <a href="#otwartosc" class="flink" style="text-decoration:none;color:#A6A5A0;">Otwartość</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:9px;">
            <span style="color:#5C5C5C;font-size:10px;letter-spacing:0.2em;margin-bottom:3px;">OPEN</span>
            <a href="${GITHUB}" target="_blank" rel="noopener" class="flink" style="text-decoration:none;color:#A6A5A0;">GitHub</a>
            <a href="${HF}" target="_blank" rel="noopener" class="flink" style="text-decoration:none;color:#A6A5A0;">Hugging Face</a>
            <a href="${DISCORD}" target="_blank" rel="noopener" class="flink" style="text-decoration:none;color:#A6A5A0;">Discord</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:9px;">
            <span style="color:#5C5C5C;font-size:10px;letter-spacing:0.2em;margin-bottom:3px;">LEGAL</span>
            <a href="/regulamin" class="flink" style="text-decoration:none;color:#A6A5A0;">Regulamin</a>
            <a href="/polityka-prywatnosci" class="flink" style="text-decoration:none;color:#A6A5A0;">Prywatność</a>
            <a href="/zgoda" class="flink" style="text-decoration:none;color:#A6A5A0;">Zgoda RODO</a>
            <a href="/regulamin-discord" class="flink" style="text-decoration:none;color:#A6A5A0;">Regulamin Discord</a>
            <a href="/wspolpraca" class="flink" style="text-decoration:none;color:#A6A5A0;">Współpraca</a>
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;padding-top:18px;border-top:1px solid rgba(242,241,236,0.12);font-family:'Space Mono';font-size:10px;letter-spacing:0.14em;color:#5C5C5C;">
        <span>SLR-AI-BB-V1.0 / 2026 · CONFIDENTIAL: NO</span>
        <span style="color:#C1121F;">SYSTEM NIE PRZEWIDZIAŁ. MY TEŻ NIE.</span>
        <span style="height:16px;width:120px;background:repeating-linear-gradient(90deg,#5C5C5C 0,#5C5C5C 1px,transparent 1px,transparent 3px,#5C5C5C 3px,#5C5C5C 4px,transparent 4px,transparent 7px,#5C5C5C 7px,#5C5C5C 9px,transparent 9px,transparent 11px);"></span>
      </div>
    </div>
  </footer>

</div>`;

export default function Home() {
  return (
    <>
      <style>{lemCss}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
