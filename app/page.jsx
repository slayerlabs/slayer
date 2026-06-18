export const metadata = {
  title: "Slayer / LEM — otwarte laboratorium polskiej AI",
  description:
    "Open lab dla polskiej inteligencji: jawna receptura, held-out ewaluacja, lineage danych i koszt wpisany w wynik. Publikujemy artefakty, nie obietnice.",
};

// ponytail: design imported verbatim from Claude Design (Slayer-LEM open lab) as inline-styled HTML;
// rendered via dangerouslySetInnerHTML to avoid hand-porting 53KB of inline styles to JSX. Edit the
// source design + re-sync to change it. Global Nav/Footer are hidden on "/" (see Nav/Footer).

const lemCss = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap');
  @keyframes lemPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.75); } }
  @keyframes lemBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
`;

const html = `<div style="min-height: 100vh; background: #eceef6; color: #2a2b38; font-family: 'IBM Plex Sans', sans-serif;">

  <!-- nav -->
  <div style="border-bottom: 1px solid #e0e2ee; background: rgba(236,238,246,.85);">
    <div style="max-width: 1120px; margin: 0 auto; padding: 18px 40px; display: flex; align-items: center; justify-content: space-between;">
      <a href="/" style="display: flex; align-items: center; gap: 11px; text-decoration: none;">
        <span style="width: 10px; height: 10px; border-radius: 50%; background: #ef8a6e; display: inline-block; animation: lemPulse 2.4s ease-in-out infinite;"></span>
        <span style="font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; letter-spacing: -.01em;"><span style="color: #d56a4d;">Slayer</span> <span style="color: #b9bccd;">/</span> <span style="color: #5a63c0;">LEM</span></span>
      </a>
      <div style="display: flex; align-items: center; gap: 26px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #6a6f86;">
        <a href="/rules">protokół</a><a href="/eksperymenty">księga pomiarów</a><a href="/drabina">drabina</a><a href="/benchmarks">artefakty</a>
        <a href="https://discord.gg/HnTkVR4c5T" target="_blank" rel="noopener" style="background: #ef8a6e; color: #fff; padding: 8px 16px; border-radius: 40px; font-weight: 500;">wejdź do labu →</a>
      </div>
    </div>
  </div>

  <!-- hero -->
  <div style="border-bottom: 1px solid #e0e2ee; background-image: linear-gradient(rgba(123,132,212,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(123,132,212,.06) 1px, transparent 1px); background-size: 44px 44px;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 88px 40px 76px;">
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: .22em; color: #5a63c0; text-transform: uppercase; margin-bottom: 32px; display: flex; align-items: center; gap: 12px;"><span style="width: 26px; height: 1px; background: #5a63c0; display: inline-block;"></span>Open weights · open protocol · applied AI</div>
      <h1 style="font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 76px; line-height: 1.0; letter-spacing: -.03em; margin: 0 0 30px; max-width: 980px; color: #232430;">Protokół dla polskiej <span style="font-family: 'Newsreader', serif; font-style: italic; font-weight: 500; color: #5a63c0;">inteligencji</span>.</h1>
      <p style="font-size: 20px; line-height: 1.55; color: #3f4154; max-width: 700px; margin: 0 0 18px; font-weight: 500;">Wchodzisz do laboratorium, w którym każdy widzi, jak powstaje polski model: dane, trening, błędy, koszty, benchmarki, logi, decyzje.</p>
      <p style="font-size: 16.5px; line-height: 1.62; color: #5c5f72; max-width: 660px; margin: 0 0 36px;">Nie publikujemy obietnic — publikujemy artefakty. Pierwszy eksperyment: konkurencyjny polski model open-weight z jawną recepturą, held-out ewaluacją, lineage danych i kosztem wpisanym w wynik. To nie kolejne „AI community”. To otwarty protokół, do którego wchodzisz na dowolnym poziomie.</p>
      <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
        <a href="https://discord.gg/HnTkVR4c5T" target="_blank" rel="noopener" style="background: #ef8a6e; color: #fff; font-weight: 600; padding: 15px 26px; border-radius: 40px; font-size: 15px;">Wejdź do labu →</a>
        <a href="/rules" style="border: 1px solid #c8cbdc; color: #3f4154; padding: 15px 26px; border-radius: 40px; font-size: 15px; font-weight: 500;">Zobacz protokoły →</a><a href="https://ort.fabryka.ai" target="_blank" rel="noopener" style="color: #5a63c0; padding: 15px 6px; font-size: 15px; font-weight: 600;">Wczesne badania ↗</a>
      </div>
    </div>
  </div>

  <!-- księga pomiarów / living ledger -->
  <div style="border-bottom: 1px solid #e0e2ee; background: #e6e8f3;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 56px 40px 64px;">
      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 8px;">
        <span style="color: #5a63c0; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: .12em; display: inline-flex; align-items: center; gap: 8px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #5b9e7e; animation: lemPulse 1.6s infinite;"></span>PODGLĄD</span>
        <span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8085a0;">run-ledger/ · wpisy poglądowe · koszty szacunkowe · pełny pomiar w budowie</span>
      </div>
      <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 30px; font-weight: 600; letter-spacing: -.015em; margin: 0 0 8px; color: #232430;">Księga pomiarów.</h2>
      <p style="font-size: 15px; color: #5c5f72; margin: 0 0 26px; max-width: 620px; line-height: 1.55;">Publiczny log eksperymentów, kosztów, regresji i decyzji. Liczby kosztów są na razie szacunkowe — automatyczny pomiar runów dopiero wpinamy. Docelowo widać realne życie labu: nie tylko sukcesy, ale też porażki i ich cenę.</p>
      <div style="border: 1px solid #d6d9ea; border-radius: 6px; overflow: hidden; background: #f6f7fc; font-family: 'IBM Plex Mono', monospace;">
        <div style="display: grid; grid-template-columns: 150px 1fr 110px 120px 1fr 150px; padding: 12px 20px; border-bottom: 1px solid #e0e2ee; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: #9396ad; background: #eef0f8;">
          <span>data · run</span><span>dataset</span><span>tokeny</span><span>koszt (szac.)</span><span>eval</span><span style="text-align: right;">decyzja</span>
        </div>
        <div style="display: grid; grid-template-columns: 150px 1fr 110px 120px 1fr 150px; padding: 14px 20px; border-bottom: 1px solid #eaecf5; font-size: 12px; color: #4a4d61; align-items: center;">
          <span><span style="color: #232430; font-weight: 500;">2026-06-18</span><br><span style="color: #8085a0;">run/qwen27b-pol-v004</span></span><span>mix-v4.2</span><span>48.2M</span><span>1 840 PLN</span><span style="color: #6a6f86;">KLEJ ↑ · PolQA ↔ · code ↓</span><span style="text-align: right;"><span style="color: #d56a4d; background: #fbe7e0; padding: 4px 10px; border-radius: 40px; font-size: 10.5px;">reject</span></span>
        </div>
        <div style="display: grid; grid-template-columns: 150px 1fr 110px 120px 1fr 150px; padding: 14px 20px; border-bottom: 1px solid #eaecf5; font-size: 12px; color: #4a4d61; align-items: center;">
          <span><span style="color: #232430; font-weight: 500;">2026-06-15</span><br><span style="color: #8085a0;">run/style-sft-v011</span></span><span>style-1.6k</span><span>6.1M</span><span>240 PLN</span><span style="color: #6a6f86;">styl ↑ · NLI ↔</span><span style="text-align: right;"><span style="color: #5b9e7e; background: #e3f0e9; padding: 4px 10px; border-radius: 40px; font-size: 10.5px;">promote</span></span>
        </div>
        <div style="display: grid; grid-template-columns: 150px 1fr 110px 120px 1fr 150px; padding: 14px 20px; border-bottom: 1px solid #eaecf5; font-size: 12px; color: #4a4d61; align-items: center;">
          <span><span style="color: #232430; font-weight: 500;">2026-06-12</span><br><span style="color: #8085a0;">run/dpo-pol-v002</span></span><span>pref-9k</span><span>12.4M</span><span>520 PLN</span><span style="color: #6a6f86;">MT-Bench-PL ↑ · code ↓</span><span style="text-align: right;"><span style="color: #b07d2e; background: #f5ecd8; padding: 4px 10px; border-radius: 40px; font-size: 10.5px;">investigate</span></span>
        </div>
        <div style="display: grid; grid-template-columns: 150px 1fr 110px 120px 1fr 150px; padding: 14px 20px; font-size: 12px; color: #4a4d61; align-items: center;">
          <span><span style="color: #232430; font-weight: 500;">2026-06-09</span><br><span style="color: #8085a0;">run/cpt-wiedza-v001</span></span><span>cpt-mix-v1</span><span>220M</span><span>7 300 PLN</span><span style="color: #6a6f86;">wiedza ↑ · koszt ↑</span><span style="text-align: right;"><span style="color: #b07d2e; background: #f5ecd8; padding: 4px 10px; border-radius: 40px; font-size: 10.5px;">investigate</span></span>
        </div>
      </div>
    </div>
  </div>

  <!-- o co gramy -->
  <div style="border-bottom: 1px solid #e0e2ee;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 84px 40px;">
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: .22em; color: #5a63c0; text-transform: uppercase; margin-bottom: 16px;">01 · o co gramy</div>
      <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 46px; font-weight: 600; letter-spacing: -.025em; margin: 0 0 24px; max-width: 820px; color: #232430; line-height: 1.05;">Model jest pretekstem. Produktem jest warsztat.</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; max-width: 940px; margin-bottom: 40px;">
        <p style="font-size: 16.5px; line-height: 1.65; color: #5c5f72; margin: 0;">Polska może mieć własne applied AI lab — nie przez największy budżet, tylko przez lepszy warsztat: community, tanie iteracje, publiczne benchmarki, rygor pomiaru i realne use case'y.</p>
        <p style="font-size: 16.5px; line-height: 1.65; color: #5c5f72; margin: 0;">Pierwszym celem jest model. Ale model nie jest końcem gry — jest pierwszym publicznym eksperymentem, na którym budujemy cały warsztat: dataset pipeline, eval harness, training recipes, inference stack i wdrożenia.</p>
      </div>
      <div style="font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 500; color: #232430; letter-spacing: -.01em;">Najpierw najlepszy polski model. <span style="color: #8085a0;">Potem lab stosowanej AI.</span></div>
    </div>
  </div>

  <!-- fazy -->
  <div style="border-bottom: 1px solid #e0e2ee; background: #f4f5fa;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 80px 40px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <div style="background: #fff; border: 1px solid #e4e6f0; border-radius: 8px; padding: 36px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 18px;"><span style="font-family: 'IBM Plex Mono', monospace; color: #5a63c0; font-size: 13px; letter-spacing: .1em;">FAZA 01 — MODEL</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #9396ad;">w toku</span></div>
          <div style="font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 600; color: #232430; margin-bottom: 14px;">Konkurencyjny polski open-weight</div>
          <p style="font-size: 15px; line-height: 1.6; color: #5c5f72; margin: 0 0 20px;">Budujemy na mocnym modelu bazowym. Ambicja: pobić najlepsze polskie baseline'y na wybranych osiach — bez benchmarkowego teatru i bez ukrywania kosztów.</p>
          <div style="display: flex; flex-direction: column; gap: 9px;">
            <div style="font-size: 13.5px; color: #4a4d61; display: flex; align-items: center; gap: 10px;"><span style="color: #5b9e7e;">✓</span>held-out albo nic</div>
            <div style="font-size: 13.5px; color: #4a4d61; display: flex; align-items: center; gap: 10px;"><span style="color: #5b9e7e;">✓</span>jawna receptura i lineage danych</div>
            <div style="font-size: 13.5px; color: #4a4d61; display: flex; align-items: center; gap: 10px;"><span style="color: #5b9e7e;">✓</span>koszt wpisany w wynik</div>
            <div style="font-size: 13.5px; color: #4a4d61; display: flex; align-items: center; gap: 10px;"><span style="color: #5b9e7e;">✓</span>publiczne regresje i decyzje: promote / reject / investigate</div>
          </div>
        </div>
        <div style="background: #fff; border: 1px solid #e4e6f0; border-radius: 8px; padding: 36px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 18px;"><span style="font-family: 'IBM Plex Mono', monospace; color: #d56a4d; font-size: 13px; letter-spacing: .1em;">FAZA 02 — LAB</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #9396ad;">następnie</span></div>
          <div style="font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 600; color: #232430; margin-bottom: 14px;">Applied research lab</div>
          <p style="font-size: 15px; line-height: 1.6; color: #5c5f72; margin: 0 0 20px;">Warsztat modelowy zmienia się w lab stosowanej AI. Ten sam rygor, szersze zastosowania — dla firm, instytucji i polskiego software'u.</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <span style="display: inline-flex; padding: 6px 12px; border-radius: 40px; background: #f1f2f9; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: #5c5f72;">evale dla firm</span><span style="display: inline-flex; padding: 6px 12px; border-radius: 40px; background: #f1f2f9; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: #5c5f72;">adaptacja do domen</span><span style="display: inline-flex; padding: 6px 12px; border-radius: 40px; background: #f1f2f9; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: #5c5f72;">pipeline'y danych</span><span style="display: inline-flex; padding: 6px 12px; border-radius: 40px; background: #f1f2f9; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: #5c5f72;">deployment open-weight</span><span style="display: inline-flex; padding: 6px 12px; border-radius: 40px; background: #f1f2f9; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: #5c5f72;">inference on-prem</span><span style="display: inline-flex; padding: 6px 12px; border-radius: 40px; background: #f1f2f9; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: #5c5f72;">audyt jakości</span><span style="display: inline-flex; padding: 6px 12px; border-radius: 40px; background: #f1f2f9; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: #5c5f72;">redukcja kosztów AI</span><span style="display: inline-flex; padding: 6px 12px; border-radius: 40px; background: #f1f2f9; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: #5c5f72;">prawo · administracja · edukacja</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- reguły labu -->
  <div style="border-bottom: 1px solid #e0e2ee;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 84px 40px;">
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: .22em; color: #5a63c0; text-transform: uppercase; margin-bottom: 16px;">02 · reguły labu</div>
      <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 40px; font-weight: 600; letter-spacing: -.02em; margin: 0 0 40px; color: #232430;">Rygor jest częścią smaku.</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px 40px;">
        <div style="padding: 26px 0; border-top: 1px solid #d8dbe9;"><div style="font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600; color: #232430; margin-bottom: 10px;"><span style="font-family: 'IBM Plex Mono', monospace; color: #5a63c0; font-size: 13px; margin-right: 10px;">01</span>Held-out albo nic</div><p style="font-size: 14px; line-height: 1.6; color: #5c5f72; margin: 0;">Publiczne claimy tylko na danych, których model nie widział. Ten sam protokół dla baseline'u i naszego modelu.</p></div>
        <div style="padding: 26px 0; border-top: 1px solid #d8dbe9;"><div style="font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600; color: #232430; margin-bottom: 10px;"><span style="font-family: 'IBM Plex Mono', monospace; color: #5a63c0; font-size: 13px; margin-right: 10px;">02</span>Lineage danych</div><p style="font-size: 14px; line-height: 1.6; color: #5c5f72; margin: 0;">Każdy zbiór ma źródło, licencję, transformacje i powód użycia. Dataset bez rodowodu to nie dataset, tylko ryzyko.</p></div>
        <div style="padding: 26px 0; border-top: 1px solid #d8dbe9;"><div style="font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600; color: #232430; margin-bottom: 10px;"><span style="font-family: 'IBM Plex Mono', monospace; color: #5a63c0; font-size: 13px; margin-right: 10px;">03</span>Koszt jest wynikiem</div><p style="font-size: 14px; line-height: 1.6; color: #5c5f72; margin: 0;">Publikujemy koszt, sprzęt, czas, liczbę tokenów i decyzję. Tani wynik, którego nie da się odtworzyć, nie jest wynikiem.</p></div>
        <div style="padding: 26px 0; border-top: 1px solid #d8dbe9;"><div style="font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600; color: #232430; margin-bottom: 10px;"><span style="font-family: 'IBM Plex Mono', monospace; color: #5a63c0; font-size: 13px; margin-right: 10px;">04</span>Otwarci sędziowie</div><p style="font-size: 14px; line-height: 1.6; color: #5c5f72; margin: 0;">Jeśli ocenia LLM, sędzia ma otwarte wagi albo jawny prompt, wersję i konfigurację. Bez magicznych rankingów z zamkniętego API.</p></div>
        <div style="padding: 26px 0; border-top: 1px solid #d8dbe9;"><div style="font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600; color: #232430; margin-bottom: 10px;"><span style="font-family: 'IBM Plex Mono', monospace; color: #5a63c0; font-size: 13px; margin-right: 10px;">05</span>Regresje są publiczne</div><p style="font-size: 14px; line-height: 1.6; color: #5c5f72; margin: 0;">Nie chowamy porażek. Jeśli model poprawia styl, ale psuje NLI, kod albo matmę — trafia to do ledgeru. Failure log jest częścią labu.</p></div>
        <div style="padding: 26px 0; border-top: 1px solid #d8dbe9; display: flex; align-items: center;"><div style="font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #9396ad; line-height: 1.6;">→ Reguły obowiązują<br>w każdym runie. Bez wyjątków.</div></div>
      </div>
    </div>
  </div>

  <!-- co zostaje po runie -->
  <div style="border-bottom: 1px solid #e0e2ee; background: #f4f5fa;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 80px 40px;">
      <div style="display: grid; grid-template-columns: 360px 1fr; gap: 56px; align-items: start;">
        <div>
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: .22em; color: #5a63c0; text-transform: uppercase; margin-bottom: 16px;">03 · publiczne artefakty</div>
          <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 34px; font-weight: 600; letter-spacing: -.02em; margin: 0 0 18px; color: #232430; line-height: 1.1;">Co zostaje po każdym eksperymencie.</h2>
          <p style="font-size: 15px; line-height: 1.65; color: #5c5f72; margin: 0;">Ktoś z zewnątrz ma móc powiedzieć: „rozumiem, co zrobiliście, ile to kosztowało, co weszło do treningu, co się poprawiło, co zepsuło — i czy da się to odtworzyć”. To mocniejsze niż „open source”.</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <span style="background: #fff; border: 1px solid #e4e6f0; border-radius: 4px; padding: 14px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #3f4154;">model card</span><span style="background: #fff; border: 1px solid #e4e6f0; border-radius: 4px; padding: 14px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #3f4154;">dataset card</span><span style="background: #fff; border: 1px solid #e4e6f0; border-radius: 4px; padding: 14px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #3f4154;">training recipe</span><span style="background: #fff; border: 1px solid #e4e6f0; border-radius: 4px; padding: 14px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #3f4154;">eval report</span><span style="background: #fff; border: 1px solid #e4e6f0; border-radius: 4px; padding: 14px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #3f4154;">held-out split hash</span><span style="background: #fff; border: 1px solid #e4e6f0; border-radius: 4px; padding: 14px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #3f4154;">koszt runu</span><span style="background: #fff; border: 1px solid #e4e6f0; border-radius: 4px; padding: 14px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #3f4154;">hardware config</span><span style="background: #fff; border: 1px solid #e4e6f0; border-radius: 4px; padding: 14px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #3f4154;">commit hash</span><span style="background: #fff; border: 1px solid #e4e6f0; border-radius: 4px; padding: 14px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #3f4154;">prompt sędziego</span><span style="background: #fff; border: 1px solid #e4e6f0; border-radius: 4px; padding: 14px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #3f4154;">error analysis</span><span style="background: #fff; border: 1px solid #e4e6f0; border-radius: 4px; padding: 14px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #3f4154;">regression table</span><span style="background: #eef0fb; border: 1px solid #d3d6f0; border-radius: 4px; padding: 14px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #5a63c0;">decyzja: promote / reject / investigate</span>
        </div>
      </div>
    </div>
  </div>

  <!-- dlaczego to zadziała -->
  <div style="border-bottom: 1px solid #e0e2ee;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 84px 40px;">
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: .22em; color: #5a63c0; text-transform: uppercase; margin-bottom: 16px;">04 · dlaczego to zadziała</div>
      <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 40px; font-weight: 600; letter-spacing: -.02em; margin: 0 0 18px; color: #232430;">Talent i dystrybucja, nie budżet.</h2>
      <p style="font-size: 16.5px; line-height: 1.62; color: #5c5f72; max-width: 680px; margin: 0 0 32px;">Frontier coding model powstaje na styku talentu i realnej dystrybucji. Polska ma talent — medale w informatyce, olimpijczyków i mocnych inżynierów AI. Brakuje otwartego miejsca, w którym ten talent realnie buduje. To chcemy stworzyć — i mamy już kanał, przez który widać efekty.</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start;">
        <!-- co mamy -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: .2em; color: #9396ad; text-transform: uppercase;">co już mamy</div>
          <div style="background: #fff; border: 1px solid #e4e6f0; border-radius: 8px; padding: 28px;">
            <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px;">
              <span style="font-family: 'Space Grotesk', sans-serif; font-size: 44px; font-weight: 700; color: #d56a4d; line-height: 1;">20k</span>
              <span style="font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 600; color: #232430;">UU / mies. na codesota.com</span>
            </div>
            <p style="font-size: 14px; color: #5c5f72; line-height: 1.6; margin: 0 0 16px;">Realna dystrybucja i społeczność open research wokół analizy benchmarków — pętla zwrotna z użytkownikami, a nie tylko Discord do komentowania newsów.</p>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <span style="display: inline-flex; padding: 6px 12px; border-radius: 40px; background: #fbe9e3; color: #c0573b; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">distribution</span><span style="display: inline-flex; padding: 6px 12px; border-radius: 40px; background: #fbe9e3; color: #c0573b; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">user telemetry</span><span style="display: inline-flex; padding: 6px 12px; border-radius: 40px; background: #fbe9e3; color: #c0573b; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">benchmark analysis</span>
            </div>
          </div>
          <div style="background: #fff; border: 1px solid #e4e6f0; border-radius: 8px; padding: 28px;">
            <div style="font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600; color: #232430; margin-bottom: 10px;">Otwarty protokół + tanie iteracje</div>
            <p style="font-size: 14px; color: #5c5f72; line-height: 1.6; margin: 0;">Publiczny warsztat, do którego talent może dołączyć i od razu widzieć wpływ swojej pracy. Niski koszt runu = dużo eksperymentów, mierzonych tym samym rygorem.</p>
          </div>
        </div>
        <!-- czego wymaga -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: .2em; color: #9396ad; text-transform: uppercase;">czego wymaga frontier coding model</div>
          <div style="background: #fff; border: 1px solid #e4e6f0; border-radius: 8px; overflow: hidden;">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 13px 20px; border-bottom: 1px solid #eef0f8; gap: 12px;"><span style="font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 600; color: #232430;">compute</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #9396ad; background: #f1f2f9; padding: 4px 10px; border-radius: 40px; white-space: nowrap;">partner / fundator</span></div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 13px 20px; border-bottom: 1px solid #eef0f8; gap: 12px;"><span style="font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 600; color: #232430;">dane z repozytoriów</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #c0573b; background: #fbe9e3; padding: 4px 10px; border-radius: 40px; white-space: nowrap;">codesota</span></div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 13px 20px; border-bottom: 1px solid #eef0f8; gap: 12px;"><span style="font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 600; color: #232430;">test harnessy</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #5a63c0; background: #eef0fb; padding: 4px 10px; border-radius: 40px; white-space: nowrap;">community</span></div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 13px 20px; border-bottom: 1px solid #eef0f8; gap: 12px;"><span style="font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 600; color: #232430;">post-training</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #5a63c0; background: #eef0fb; padding: 4px 10px; border-radius: 40px; white-space: nowrap;">talent — zapraszamy</span></div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 13px 20px; border-bottom: 1px solid #eef0f8; gap: 12px;"><span style="font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 600; color: #232430;">RL / verifier loops</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #5a63c0; background: #eef0fb; padding: 4px 10px; border-radius: 40px; white-space: nowrap;">talent — zapraszamy</span></div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 13px 20px; border-bottom: 1px solid #eef0f8; gap: 12px;"><span style="font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 600; color: #232430;">eval infrastructure</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #5a63c0; background: #eef0fb; padding: 4px 10px; border-radius: 40px; white-space: nowrap;">community</span></div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 13px 20px; border-bottom: 1px solid #eef0f8; gap: 12px;"><span style="font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 600; color: #232430;">distribution</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #c0573b; background: #fbe9e3; padding: 4px 10px; border-radius: 40px; white-space: nowrap;">codesota</span></div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 13px 20px; gap: 12px;"><span style="font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 600; color: #232430;">user telemetry</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #c0573b; background: #fbe9e3; padding: 4px 10px; border-radius: 40px; white-space: nowrap;">codesota</span></div>
          </div>
          <div style="background: #eef0fb; border: 1px solid #d3d6f0; border-radius: 8px; padding: 16px 20px; font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; color: #5a63c0;">→ Compute fundujemy z partnerami. Resztę budujemy w otwartym polu.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- drabina uczestnictwa -->
  <div style="border-bottom: 1px solid #e0e2ee; background: #f4f5fa;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 84px 40px;">
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: .22em; color: #d56a4d; text-transform: uppercase; margin-bottom: 16px;">05 · drabina uczestnictwa</div>
      <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 46px; font-weight: 600; letter-spacing: -.025em; margin: 0 0 18px; max-width: 820px; color: #232430; line-height: 1.05;">Wchodzisz na dowolnym poziomie.</h2>
      <p style="font-size: 16.5px; line-height: 1.62; color: #5c5f72; max-width: 700px; margin: 0 0 14px;">Nie każdy musi być researcherem. Lab potrzebuje wielu typów wkładu — a każdy poziom dostaje realny credit, ownership i ścieżkę głębiej. To nie darmowa praca dla startupu.</p>
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #9396ad; margin-bottom: 40px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">lurker <span style="color: #c8cbdc;">→</span> tester <span style="color: #c8cbdc;">→</span> contributor <span style="color: #c8cbdc;">→</span> operator <span style="color: #c8cbdc;">→</span> core team</div>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: #fff; border: 1px solid #e4e6f0; border-radius: 10px; padding: 28px 30px; display: grid; grid-template-columns: 250px 1fr 1fr; gap: 32px; align-items: start;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;"><span style="width: 26px; height: 26px; border-radius: 50%; background: #fbe9e3; color: #d56a4d; font-family: 'IBM Plex Mono', monospace; font-size: 12px; display: inline-flex; align-items: center; justify-content: center;">01</span><span style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 600; color: #232430;">Lurker</span></div>
            <p style="font-size: 14px; line-height: 1.55; color: #5c5f72; margin: 0;">Obserwujesz, czytasz logi, uczysz się języka projektu.</p>
          </div>
          <div><div style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #5b9e7e; margin-bottom: 12px;">dostajesz</div><div style="display: flex; flex-wrap: wrap; gap: 7px;"><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">publiczne update'y</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">roadmapa</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">dostęp do demo</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">leaderboardy</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">reading listy</span></div></div>
          <div><div style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #5a63c0; margin-bottom: 12px;">oczekujemy</div><div style="display: flex; flex-wrap: wrap; gap: 7px;"><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">zero presji</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">pytania</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">reakcje</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">sygnały, co niejasne</span></div></div>
        </div>

        <div style="background: #fff; border: 1px solid #e4e6f0; border-radius: 10px; padding: 28px 30px; display: grid; grid-template-columns: 250px 1fr 1fr; gap: 32px; align-items: start;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;"><span style="width: 26px; height: 26px; border-radius: 50%; background: #fbe0d6; color: #d56a4d; font-family: 'IBM Plex Mono', monospace; font-size: 12px; display: inline-flex; align-items: center; justify-content: center;">02</span><span style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 600; color: #232430;">Tester</span></div>
            <p style="font-size: 14px; line-height: 1.55; color: #5c5f72; margin: 0;">Używasz modeli i łamiesz je na realnych zadaniach.</p>
          </div>
          <div><div style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #5b9e7e; margin-bottom: 12px;">dostajesz</div><div style="display: flex; flex-wrap: wrap; gap: 7px;"><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">playground</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">early access</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">kanał feedbackowy</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">proponowanie testów</span></div></div>
          <div><div style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #5a63c0; margin-bottom: 12px;">oczekujemy</div><div style="display: flex; flex-wrap: wrap; gap: 7px;"><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">prompty</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">przykłady porażek</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">edge case'y</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">porównania z baseline'ami</span></div></div>
        </div>

        <div style="background: #fff; border: 1px solid #e4e6f0; border-radius: 10px; padding: 28px 30px; display: grid; grid-template-columns: 250px 1fr 1fr; gap: 32px; align-items: start;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;"><span style="width: 26px; height: 26px; border-radius: 50%; background: #f6cfc0; color: #c0573b; font-family: 'IBM Plex Mono', monospace; font-size: 12px; display: inline-flex; align-items: center; justify-content: center;">03</span><span style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 600; color: #232430;">Contributor</span></div>
            <p style="font-size: 14px; line-height: 1.55; color: #5c5f72; margin: 0;">Dokładasz mierzalne cegły.</p>
          </div>
          <div><div style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #5b9e7e; margin-bottom: 12px;">dostajesz</div><div style="display: flex; flex-wrap: wrap; gap: 7px;"><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">zadania z backlogu</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">credit w changelogu</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">publiczny profil wkładu</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">bounty</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">wejście głębiej</span></div></div>
          <div><div style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #5a63c0; margin-bottom: 12px;">oczekujemy</div><div style="display: flex; flex-wrap: wrap; gap: 7px;"><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">datasety</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">evale</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">skrypty</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">research notes</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">PR-y</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">reprodukcje wyników</span></div></div>
        </div>

        <div style="background: #fff; border: 1px solid #e4e6f0; border-radius: 10px; padding: 28px 30px; display: grid; grid-template-columns: 250px 1fr 1fr; gap: 32px; align-items: start;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;"><span style="width: 26px; height: 26px; border-radius: 50%; background: #ef8a6e; color: #fff; font-family: 'IBM Plex Mono', monospace; font-size: 12px; display: inline-flex; align-items: center; justify-content: center;">04</span><span style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 600; color: #232430;">Operator</span></div>
            <p style="font-size: 14px; line-height: 1.55; color: #5c5f72; margin: 0 0 12px;">Prowadzisz konkretny fragment labu.</p>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;"><span style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #9396ad; background: #f1f2f9; padding: 3px 8px; border-radius: 3px;">eval harness</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #9396ad; background: #f1f2f9; padding: 3px 8px; border-radius: 3px;">dataset lineage</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #9396ad; background: #f1f2f9; padding: 3px 8px; border-radius: 3px;">inference stack</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #9396ad; background: #f1f2f9; padding: 3px 8px; border-radius: 3px;">bounty board</span></div>
          </div>
          <div><div style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #5b9e7e; margin-bottom: 12px;">dostajesz</div><div style="display: flex; flex-wrap: wrap; gap: 7px;"><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">ownership modułu</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">wpływ na roadmapę</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">miejsce w core calls</span><span style="background: #edf6f1; color: #4e8a6f; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">płatna współpraca</span></div></div>
          <div><div style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #5a63c0; margin-bottom: 12px;">oczekujemy</div><div style="display: flex; flex-wrap: wrap; gap: 7px;"><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">dowożenie protokołu</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">utrzymywanie jakości</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">review wkładu</span><span style="background: #eef0fb; color: #5a63c0; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">prowadzenie ludzi niżej</span></div></div>
        </div>

        <div style="background: #232430; border: 1px solid #232430; border-radius: 10px; padding: 30px; display: grid; grid-template-columns: 250px 1fr 1fr; gap: 32px; align-items: start;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;"><span style="width: 26px; height: 26px; border-radius: 50%; background: #ef8a6e; color: #fff; font-family: 'IBM Plex Mono', monospace; font-size: 12px; display: inline-flex; align-items: center; justify-content: center;">05</span><span style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 600; color: #fff;">Core Team</span></div>
            <p style="font-size: 14px; line-height: 1.55; color: #b9bccd; margin: 0;">Budujesz lab jako instytucję — model, firmę, community, klientów, funding, compute i dystrybucję.</p>
          </div>
          <div><div style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #7fc5a3; margin-bottom: 12px;">dostajesz</div><div style="display: flex; flex-wrap: wrap; gap: 7px;"><span style="background: rgba(127,197,163,.14); color: #8fd0ad; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">equity / wynagrodzenie / grant</span><span style="background: rgba(127,197,163,.14); color: #8fd0ad; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">revenue share</span><span style="background: rgba(127,197,163,.14); color: #8fd0ad; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">decyzyjność</span><span style="background: rgba(127,197,163,.14); color: #8fd0ad; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">współautorstwo wyników</span></div></div>
          <div><div style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #9aa0e0; margin-bottom: 12px;">oczekujemy</div><div style="display: flex; flex-wrap: wrap; gap: 7px;"><span style="background: rgba(154,160,224,.16); color: #aab0ec; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">odpowiedzialność za wynik</span><span style="background: rgba(154,160,224,.16); color: #aab0ec; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">praca nad modelem i firmą</span><span style="background: rgba(154,160,224,.16); color: #aab0ec; padding: 5px 11px; border-radius: 40px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;">community i klienci</span></div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- rytuały + kanały -->
  <div style="border-bottom: 1px solid #e0e2ee;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 80px 40px;">
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: .22em; color: #5a63c0; text-transform: uppercase; margin-bottom: 16px;">06 · publiczne laboratorium</div>
      <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 34px; font-weight: 600; letter-spacing: -.02em; margin: 0 0 36px; color: #232430;">Działa jak lab, nie jak Discord do newsów.</h2>
      <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 48px;">
        <div>
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: #9396ad; margin-bottom: 18px;">rytuały</div>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; gap: 14px;"><span style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #d56a4d; padding-top: 3px; white-space: nowrap;">pon</span><div><div style="font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; color: #232430;">Weekly Lab Note</div><div style="font-size: 13.5px; color: #5c5f72; line-height: 1.5;">Co zrobiliśmy, co się zepsuło, co mierzymy dalej.</div></div></div>
            <div style="display: flex; gap: 14px;"><span style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #d56a4d; padding-top: 3px; white-space: nowrap;">pt</span><div><div style="font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; color: #232430;">Friday Eval Drop</div><div style="font-size: 13.5px; color: #5c5f72; line-height: 1.5;">Tabela wyników, regresje, decyzje.</div></div></div>
            <div style="display: flex; gap: 14px;"><span style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #d56a4d; padding-top: 3px; white-space: nowrap;">2tyg</span><div><div style="font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; color: #232430;">Open Protocol Review</div><div style="font-size: 13.5px; color: #5c5f72; line-height: 1.5;">Przegląd zasad: dane, evale, contamination, release policy.</div></div></div>
            <div style="display: flex; gap: 14px;"><span style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #d56a4d; padding-top: 3px; white-space: nowrap;">ad-hoc</span><div><div style="font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; color: #232430;">Failure Postmortem</div><div style="font-size: 13.5px; color: #5c5f72; line-height: 1.5;">Jeśli run nie działa — publikujemy dlaczego. Bez udawania sukcesu.</div></div></div>
          </div>
        </div>
        <div>
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: #9396ad; margin-bottom: 18px;">kanały</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #4a4d61; background: #f1f2f9; padding: 7px 12px; border-radius: 4px;">#lab-log</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #4a4d61; background: #f1f2f9; padding: 7px 12px; border-radius: 4px;">#eval-results</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #4a4d61; background: #f1f2f9; padding: 7px 12px; border-radius: 4px;">#dataset-lineage</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #4a4d61; background: #f1f2f9; padding: 7px 12px; border-radius: 4px;">#model-testing</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #4a4d61; background: #f1f2f9; padding: 7px 12px; border-radius: 4px;">#bugs-regressions</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #4a4d61; background: #f1f2f9; padding: 7px 12px; border-radius: 4px;">#contribute</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #4a4d61; background: #f1f2f9; padding: 7px 12px; border-radius: 4px;">#bounties</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #4a4d61; background: #f1f2f9; padding: 7px 12px; border-radius: 4px;">#use-cases</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #4a4d61; background: #f1f2f9; padding: 7px 12px; border-radius: 4px;">#compute</span><span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #4a4d61; background: #f1f2f9; padding: 7px 12px; border-radius: 4px;">#papers</span>
          </div>
          <div style="margin-top: 26px; border: 1px solid #e4e6f0; border-radius: 8px; background: #f6f7fc; padding: 18px 20px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #5c5f72; line-height: 1.7;">lem-protocol/<br>&nbsp;&nbsp;evals/ · datasets/ · training/<br>&nbsp;&nbsp;model-cards/ · run-ledger/ · governance/</div>
        </div>
      </div>
    </div>
  </div>

  <!-- join CTA -->
  <div style="background: #ef8a6e;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 88px 40px; text-align: center;">
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: #7a2f1a; margin-bottom: 20px;">dołącz</div>
      <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 56px; font-weight: 600; letter-spacing: -.025em; margin: 0 0 18px; color: #3a160b; line-height: 1.02;">Wejdź do labu na swoim poziomie.</h2>
      <p style="font-size: 17px; line-height: 1.6; color: #6e3422; max-width: 560px; margin: 0 auto 32px;">Obserwuj, testuj, zgłaszaj błędy, rób dane, pisz evale, trenuj adaptery, sponsoruj compute albo wnoś use case. Realny credit, ownership i ścieżka głębiej — nie darmowa praca dla startupu.</p>
      <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
        <a href="https://discord.gg/HnTkVR4c5T" target="_blank" rel="noopener" style="background: #3a160b; color: #fff; font-weight: 600; padding: 15px 30px; border-radius: 40px; font-size: 15px;">Wejście do labu (Discord) →</a>
        <a href="https://github.com/slayerlabs" target="_blank" rel="noopener" style="border: 1px solid #9a4a30; color: #3a160b; padding: 15px 30px; border-radius: 40px; font-size: 15px; font-weight: 600;">GitHub: lem-protocol</a>
      </div>
    </div>
  </div>

  <!-- footer -->
  <div style="background: #232430; color: #b9bccd;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 44px 40px; display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap;">
      <div>
        <div style="font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; margin-bottom: 10px;"><span style="color: #ef8a6e;">Slayer</span> <span style="color: #555a72;">/</span> <span style="color: #8b93e0;">LEM</span></div>
        <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #7b7f98; max-width: 420px; line-height: 1.6;">Community-driven applied AI lab. Open weights · open protocol · publiczne artefakty. 2026.</div>
      </div>
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8b8fa8; display: flex; gap: 28px; flex-wrap: wrap;">
        <a href="https://github.com/slayerlabs" target="_blank" rel="noopener">GitHub: lem-protocol</a><a href="/eksperymenty">księga pomiarów</a><a href="/drabina">drabina</a><a href="/roadmap">roadmap</a><a href="https://discord.gg/HnTkVR4c5T" target="_blank" rel="noopener">discord</a><a href="https://ort.fabryka.ai" target="_blank" rel="noopener">wczesne badania</a>
      </div>
    </div>
  </div>

</div>`;

export default function Home() {
  return (
    <>
      <style>{lemCss}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
