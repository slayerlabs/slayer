# Amber HUD Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Przestylizować całą stronę slayer.fabryka.ai z „ivory/clay" na bursztynowy retro-terminal „Amber HUD" (inspiracja Arwes) — zgodnie ze specem `docs/superpowers/specs/2026-06-06-amber-hud-redesign-design.md`.

**Architecture:** Site pozostaje statyczny (zero build stepu). ~80% zmian to rewrite współdzielonego `assets/lab.css` (te same selektory, nowe wartości); `assets/site.js` dostaje dekorator narożników HUD, wiązkę skanującą i animacje wejścia (IntersectionObserver); 11 podstron dostaje punktowe poprawki (rename tokenu fontu, hardcoded kolory gliny, italiki, border-radiusy).

**Tech Stack:** czysty CSS + vanilla JS (ES5, styl istniejącego site.js), Google Fonts (Share Tech Mono, IBM Plex Mono), python3 http.server do weryfikacji.

**Wzorzec wizualny:** `docs/superpowers/specs/2026-06-06-amber-hud-preview.html` — otwórz w przeglądarce i porównuj.

**Gałąź:** `redesign-amber-hud` (już istnieje, jesteś na niej). Serwer dev zwykle już chodzi na `:8000`; jeśli nie: `cd /Users/martynakazimierczuk/Documents/slayer && python3 -m http.server 8000 &`.

**Uwaga o testach:** repo nie ma żadnego harnessu testowego (strona statyczna). „Testami" są tu: asercje greppem (policzalne, z oczekiwanym wynikiem), kody HTTP z curl, skrypt kontrastu WCAG i manualna weryfikacja wizualna względem wzorca. Każdy task kończy się weryfikacją i commitem.

---

### Task 1: Rewrite `assets/lab.css` — design system Amber HUD

**Files:**
- Modify: `assets/lab.css` (pełna podmiana zawartości, 159 → ~215 linii)

- [ ] **Step 1: Zapisz baseline do porównania**

```bash
cd /Users/martynakazimierczuk/Documents/slayer
git status --short   # oczekiwane: pusto (czyste drzewo)
```

- [ ] **Step 2: Podmień całą zawartość `assets/lab.css` na poniższą**

```css
/* ============================================================
   SLAYER — shared design system · Amber HUD (inspiracja Arwes).
   Bursztynowy retro-terminal: mono, scanlines, narożniki HUD.
   Single source of truth. Edit here → every page updates.
   ============================================================ */
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

:root{
  /* ciepła czerń CRT + bursztyn fosforowy */
  --bg:#0b0700; --bg2:#120c03; --panel:#161003; --panel2:#1d1605;
  --ink:#ffe8bd; --txt:#d8c9a4; --mut:#a8946a; --dim:#8a7a5e;
  --line:rgba(255,176,0,.28); --line2:rgba(255,176,0,.12);
  --acc:#ffb000; --acc-d:#cc8d00; --acc-soft:rgba(255,176,0,.12); --acc-ink:#0b0700;
  --alert:#ff5a26; --alert-soft:rgba(255,90,38,.12);
  /* stare tokeny semantyczne — mapowane na paletę HUD (podstrony ich używają) */
  --good:#ffb000; --blue:#a8946a; --amber:#ff8a3d;
  --disp:"Share Tech Mono",ui-monospace,Menlo,monospace;
  --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
  --rad:0; --max:1140px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--txt);font-family:var(--mono);font-size:15.5px;line-height:1.66;font-weight:400;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
::selection{background:var(--acc);color:var(--acc-ink)}
img{max-width:100%}
.mono{font-family:var(--mono)}.serif{font-family:var(--disp)}/* .serif = alias historyczny */
.acc{color:var(--acc)}
.muted{color:var(--mut)}.dim{color:var(--dim)}

/* mono micro-label / eyebrow — prompt terminala */
.kick{font-family:var(--disp);font-size:.74rem;font-weight:400;letter-spacing:.18em;text-transform:uppercase;color:var(--mut)}
.kick::before{content:"> ";color:var(--acc)}
.kick .ac{color:var(--acc)}

/* ---------- nav (injected by site.js) ---------- */
.nav{position:fixed;z-index:40;inset:0 0 auto 0;display:flex;align-items:center;justify-content:space-between;height:60px;padding:0 clamp(18px,4vw,48px);background:rgba(11,7,0,.88);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.nav .brand{display:inline-flex;align-items:center;gap:11px;font-family:var(--disp);font-weight:400;font-size:1.05rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink)}
.nav .brand .mk{display:grid;place-items:center;width:26px;height:26px;background:var(--acc);color:var(--acc-ink);font-family:var(--disp);font-weight:700;font-size:.85rem}
.nav .brand .sl{color:var(--acc)}
.nlinks{display:flex;align-items:center;gap:clamp(12px,2.4vw,26px);font-family:var(--disp);font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--mut)}
.nlinks a{transition:color .15s}
.nlinks a:hover{color:var(--acc);text-shadow:0 0 8px rgba(255,176,0,.6)}
.nlinks a.active{color:var(--acc)}
.nlinks a.active::before{content:"["}.nlinks a.active::after{content:"]"}
.nlinks .ncta{padding:7px 16px;background:var(--acc);color:var(--acc-ink);font-weight:700;transition:.15s}
.nlinks .ncta:hover{background:#ffc94d;color:var(--acc-ink);text-shadow:none}
@media(max-width:780px){.nlinks a:not(.ncta){display:none}}

/* ---------- layout ---------- */
.sec{padding:clamp(56px,7.5vw,104px) clamp(18px,5vw,72px);position:relative}
.sec.tight{padding-top:clamp(38px,5vw,60px);padding-bottom:clamp(38px,5vw,60px)}
.sec.alt{background:var(--bg2)}
.inner{width:min(var(--max),100%);margin:0 auto}
.inner.narrow{width:min(760px,100%)}
.rule{border:0;border-top:1px dashed var(--line);margin:0}
.page-top{padding-top:108px}

.shead{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;flex-wrap:wrap;margin-bottom:38px}
.shead h2{margin:14px 0 0;font-family:var(--disp);font-size:clamp(1.6rem,3.2vw,2.4rem);font-weight:400;letter-spacing:.02em;line-height:1.18;max-width:26ch;text-transform:uppercase;color:var(--ink)}
.shead h2 em{font-style:normal;color:var(--acc);text-shadow:0 0 12px rgba(255,176,0,.5)}
.shead p{max-width:44ch;color:var(--mut);margin:0;font-size:.96rem}

/* interior page hero */
.phero{padding:120px clamp(18px,5vw,72px) 52px;position:relative;border-bottom:1px dashed var(--line);background:radial-gradient(ellipse at 30% -10%,rgba(255,176,0,.08),transparent 55%)}
.phero::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,200,80,.035) 0 1px,transparent 1px 4px)}
.phero .inner{position:relative;z-index:1}
.phero h1{margin:16px 0 14px;font-family:var(--disp);font-size:clamp(1.9rem,4.4vw,3rem);font-weight:400;letter-spacing:.01em;line-height:1.15;text-transform:uppercase;color:var(--ink);text-shadow:0 0 18px rgba(255,176,0,.25)}
.phero h1 em{font-style:normal;color:var(--acc);text-shadow:0 0 14px rgba(255,176,0,.6)}
.phero p{max-width:64ch;color:var(--mut);font-size:clamp(.98rem,1.5vw,1.1rem)}
.phero p a{color:var(--acc);border-bottom:1px solid var(--acc-soft)}

/* buttons */
.btn{display:inline-flex;align-items:center;gap:9px;height:46px;padding:0 22px;font-family:var(--disp);font-size:.88rem;font-weight:400;letter-spacing:.1em;text-transform:uppercase;transition:.15s;border:1px solid transparent;cursor:pointer}
.btn-p{background:var(--acc);color:var(--acc-ink);font-weight:700;box-shadow:0 0 16px rgba(255,176,0,.35)}
.btn-p:hover{background:#ffc94d;box-shadow:0 0 24px rgba(255,176,0,.55)}
.btn-s{border-color:var(--line);color:var(--acc);background:var(--acc-soft)}
.btn-s:hover{border-color:var(--acc);box-shadow:0 0 14px rgba(255,176,0,.3)}
.cta-row{display:flex;flex-wrap:wrap;gap:14px}

/* card grids */
.grid{display:grid;gap:14px}
.grid.c2{grid-template-columns:repeat(2,1fr)}
.grid.c3{grid-template-columns:repeat(3,1fr)}
.grid.auto{grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.grid.auto-lg{grid-template-columns:repeat(auto-fill,minmax(290px,1fr))}
@media(max-width:820px){.grid.c2,.grid.c3{grid-template-columns:1fr}}
.cell{position:relative;background:var(--panel);border:1px solid var(--line2);padding:24px;transition:.15s;display:flex;flex-direction:column}
.cell::before,.cell::after{content:"";position:absolute;width:11px;height:11px;opacity:0;transition:.15s}
.cell::before{top:-1px;left:-1px;border-top:2px solid var(--acc);border-left:2px solid var(--acc)}
.cell::after{bottom:-1px;right:-1px;border-bottom:2px solid var(--acc);border-right:2px solid var(--acc)}
.cell:hover{border-color:var(--line);transform:translateY(-2px);box-shadow:0 0 20px rgba(255,176,0,.12)}
.cell:hover::before,.cell:hover::after{opacity:1}
.cell .n{font-family:var(--disp);font-size:.72rem;color:var(--acc);letter-spacing:.16em}
.cell .n::before{content:"// "}
.cell h3{margin:12px 0 7px;font-family:var(--disp);font-size:1.2rem;font-weight:400;letter-spacing:.03em;text-transform:uppercase;color:var(--ink)}
.cell h3.sm{font-size:1.02rem;font-family:var(--disp);font-weight:400;letter-spacing:.03em}
.cell p{margin:0;color:var(--mut);font-size:.92rem}
.cell .top{display:flex;align-items:center;justify-content:space-between;font-family:var(--disp);font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-bottom:2px}
.cell .ar{transition:.15s}.cell:hover .ar{transform:translateX(3px);color:var(--acc)}
.cell .meta{margin-top:auto;padding-top:14px;font-size:.86rem;color:var(--mut);display:flex;flex-wrap:wrap;gap:6px}
.cell .meta>div{display:block;width:100%;font-family:var(--disp);font-size:.76rem}
.cell .meta .k{color:var(--acc);font-size:.64rem;letter-spacing:.06em;text-transform:uppercase;margin-right:5px}

/* group head */
.ghead{display:flex;align-items:baseline;gap:14px;margin:38px 0 16px}
.ghead:first-child{margin-top:0}
.ghead h2{font-family:var(--disp);font-size:clamp(1.3rem,2.6vw,1.8rem);font-weight:400;letter-spacing:.02em;text-transform:uppercase;color:var(--ink)}
.ghead .c{color:var(--dim);font-family:var(--disp);font-size:.76rem;letter-spacing:.06em}

/* chips */
.chip{font-family:var(--disp);font-size:.7rem;font-weight:400;padding:3px 9px;letter-spacing:.06em;color:var(--mut);background:var(--panel2);border:1px solid var(--line2)}
.chip.acc{color:var(--acc);background:var(--acc-soft);border-color:var(--line)}
.chip.blue{color:var(--blue);background:var(--panel2);border-color:rgba(168,148,106,.4)}
.chip.amber{color:var(--amber);background:rgba(255,138,61,.1);border-color:rgba(255,138,61,.32)}
.tags{display:flex;flex-wrap:wrap;gap:6px}

/* tables */
.tbl{border:1px solid var(--line);overflow:hidden;background:var(--panel);overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:.9rem}
th{text-align:left;padding:13px 16px;font-family:var(--disp);font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;color:var(--acc);background:rgba(255,176,0,.06);border-bottom:1px solid var(--line)}
th.c{text-align:center}
td{padding:13px 16px;border-top:1px dashed var(--line2);vertical-align:top}
tbody tr:hover td{background:var(--panel2)}
td.s{text-align:center;font-family:var(--disp);font-weight:400;font-size:1.05rem;white-space:nowrap;color:var(--mut)}
td.s.win{color:var(--acc);text-shadow:0 0 10px rgba(255,176,0,.5)}
td.s .sub{display:block;font-family:var(--disp);font-size:.64rem;color:var(--dim);margin-top:3px}
.dn{font-weight:600;color:var(--ink)}.dn a{color:var(--acc)}
.ds{color:var(--dim);font-family:var(--disp);font-size:.72rem;margin-top:3px}

/* verdict pill */
.vb{font-family:var(--disp);font-size:.74rem;font-weight:400;padding:4px 10px;white-space:nowrap;display:inline-block;letter-spacing:.06em}
.vb.b{color:var(--acc);background:var(--acc-soft);border:1px solid var(--line)}
.vb.q{color:var(--alert);background:var(--alert-soft);border:1px solid rgba(255,90,38,.35)}
.vb.pend{color:var(--dim);border:1px dashed var(--line2)}

/* panel — ramka HUD; narożniki .cnr wstrzykuje site.js */
.panel{position:relative;border:1px solid var(--line);background:rgba(22,16,3,.9);overflow:visible;box-shadow:0 0 24px rgba(255,176,0,.08)}
.panel::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,200,80,.03) 0 1px,transparent 1px 4px)}
.panel .cnr{position:absolute;width:13px;height:13px;pointer-events:none;z-index:1}
.panel .cnr.tl{top:-2px;left:-2px;border-top:2px solid var(--acc);border-left:2px solid var(--acc)}
.panel .cnr.tr{top:-2px;right:-2px;border-top:2px solid var(--acc);border-right:2px solid var(--acc)}
.panel .cnr.bl{bottom:-2px;left:-2px;border-bottom:2px solid var(--acc);border-left:2px solid var(--acc)}
.panel .cnr.br{bottom:-2px;right:-2px;border-bottom:2px solid var(--acc);border-right:2px solid var(--acc)}
.panel-top{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px dashed var(--line);font-family:var(--disp);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.panel-bd{padding:20px 18px}
.live{display:inline-flex;align-items:center;gap:7px;font-family:var(--disp);font-size:.74rem;color:var(--alert);letter-spacing:.12em}
.live .d{width:8px;height:8px;background:var(--alert);box-shadow:0 0 8px rgba(255,90,38,.8);animation:pl 1.6s infinite}
/* twarde mignięcie (terminal), niezależne od timing-function u użytkownika */
@keyframes pl{0%,49.9%{opacity:1}50%,100%{opacity:.2}}

/* progress bar */
.track{height:7px;background:rgba(255,176,0,.1);overflow:hidden}
.track i{display:block;height:100%;background:var(--acc);box-shadow:0 0 10px rgba(255,176,0,.6);transition:width .8s ease}
.track i.q{background:var(--alert);box-shadow:0 0 10px rgba(255,90,38,.5)}

/* timeline */
.tl{display:grid;border:1px solid var(--line);overflow:hidden;background:var(--panel)}
.tl .ph{display:grid;grid-template-columns:130px 1fr;gap:20px;padding:20px 24px;border-top:1px dashed var(--line2)}
.tl .ph:first-child{border-top:0}
.tl .when{font-family:var(--disp);font-size:.76rem;color:var(--mut);letter-spacing:.06em}
.tl .st{display:inline-block;margin-top:6px;font-family:var(--disp);font-size:.68rem;padding:2px 9px;letter-spacing:.06em}
.tl h3{margin:0 0 4px;font-family:var(--disp);font-size:1.05rem;font-weight:400;letter-spacing:.03em;text-transform:uppercase;color:var(--ink)}
.tl p{margin:0;color:var(--mut);font-size:.92rem}
@media(max-width:680px){.tl .ph{grid-template-columns:1fr;gap:6px}}

/* forms */
.field label{display:block;font-family:var(--disp);font-weight:400;font-size:.85rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;color:var(--ink)}
.field label .opt{color:var(--dim);text-transform:none}
input[type=text],textarea{width:100%;padding:12px 14px;border:1px solid var(--line2);font-family:var(--mono);font-size:.95rem;background:var(--bg2);color:var(--txt)}
input:focus,textarea:focus{outline:none;border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}
textarea{min-height:74px;resize:vertical}

/* footer (injected) — prompt shella */
.foot{border-top:1px solid var(--line);padding:26px clamp(18px,5vw,72px);display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;font-family:var(--disp);font-size:.76rem;color:var(--dim);letter-spacing:.08em;background:#080500}
.foot>span:first-child::before{content:"slayer@lab:~$ ";color:var(--acc)}
.foot a{color:var(--mut)}.foot a:hover{color:var(--acc)}

/* note */
.note{margin-top:26px;padding:20px 22px;border:1px dashed var(--line);border-left:3px solid var(--acc);background:var(--panel)}
.note b{color:var(--acc)}.note p{margin:0;color:var(--mut);font-size:.92rem}

/* migający blokowy kursor (hero) */
.cursor{display:inline-block;width:.55em;height:1em;background:var(--acc);margin-left:6px;vertical-align:-.12em;animation:pl 1.1s infinite}

/* ---------- efekty ruchu (tylko bez prefers-reduced-motion) ---------- */
@media(prefers-reduced-motion:no-preference){
  /* wiązka skanująca — element wstrzykuje site.js */
  .scanbeam{position:fixed;left:0;right:0;top:0;height:120px;pointer-events:none;z-index:60;background:linear-gradient(180deg,transparent,rgba(255,176,0,.05),transparent);animation:scan 9s linear infinite}
  @keyframes scan{0%{transform:translateY(-130px)}100%{transform:translateY(110vh)}}
  /* animacje wejścia — klasy nadaje site.js (progressive enhancement: bez JS brak ukrywania) */
  .rev{opacity:0;transform:translateY(12px);transition:opacity .55s ease,transform .55s ease,border-color .15s ease,box-shadow .15s ease,background .15s ease,color .15s ease}
  .rev.in{opacity:1;transform:none}
}
@media(prefers-reduced-motion:reduce){
  .scanbeam{display:none}
  .live .d,.cursor,.htag .dot{animation:none}
}
```

- [ ] **Step 3: Weryfikacja greppem — stara paleta zniknęła, nowa jest**

```bash
cd /Users/martynakazimierczuk/Documents/slayer
grep -c '#be5535\|#f4f1ea\|Newsreader\|Hanken' assets/lab.css   # oczekiwane: 0
grep -c '#ffb000' assets/lab.css                                 # oczekiwane: >= 1
grep -c -- '--disp' assets/lab.css                               # oczekiwane: >= 20
grep -c -- '--serif' assets/lab.css                              # oczekiwane: 0
```

- [ ] **Step 4: Weryfikacja wizualna — strona główna wstaje na nowym CSS**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/index.html   # oczekiwane: 200
open http://localhost:8000
```

Strona będzie częściowo „przejściowa" (nagłówki na index nadal `var(--serif)` → fallback mono — naprawiane w Task 3). Sprawdź: ciemne tło, bursztynowe akcenty, mono wszędzie, nav z `[aktywnym]` linkiem, footer z promptem `slayer@lab:~$`.

- [ ] **Step 5: Commit**

```bash
git add assets/lab.css
git commit -m "redesign: lab.css — design system Amber HUD (tokeny, mono, scanlines, narożniki)"
```

---

### Task 2: Rozszerz `assets/site.js` — narożniki HUD, scanbeam, animacje wejścia

**Files:**
- Modify: `assets/site.js` (33 → ~75 linii; nav/footer markup bez zmian)

- [ ] **Step 1: Dopisz blok przed końcowym `})();`**

W `assets/site.js` funkcja `inject()` i jej wywołanie zostają bez zmian. Bezpośrednio **po** bloku:

```js
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",inject); else inject();
```

a **przed** zamykającym `})();` wstaw:

```js

  /* ── Amber HUD chrome: narożniki paneli, scanbeam, animacje wejścia.
     Kosmetyka wstrzykiwana centralnie — podstron nie trzeba edytować. ── */
  function hudChrome(){
    document.querySelectorAll(".panel").forEach(function(p){
      if(p.querySelector(".cnr")) return;
      ["tl","tr","bl","br"].forEach(function(pos){
        var c=document.createElement("i");
        c.className="cnr "+pos;
        p.appendChild(c);
      });
    });
    if(!document.querySelector(".scanbeam")){
      var s=document.createElement("div");
      s.className="scanbeam";
      s.setAttribute("aria-hidden","true");
      document.body.appendChild(s);
    }
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if(!("IntersectionObserver" in window)) return;
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    },{threshold:.12});
    var SEL=".hgrid > div:not(.panel) > *, .shead, .panel, .tbl, .tl, .note, .grid > *";
    document.querySelectorAll(SEL).forEach(function(el){
      var idx=Array.prototype.indexOf.call(el.parentElement.children,el);
      el.classList.add("rev");
      el.style.transitionDelay=Math.min(idx*0.08,0.36)+"s";
      io.observe(el);
    });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",hudChrome); else hudChrome();
```

- [ ] **Step 2: Weryfikacja składni**

```bash
node --check assets/site.js && echo OK   # oczekiwane: OK
# jeśli brak node: otwórz http://localhost:8000 i sprawdź konsolę DevTools (zero błędów)
```

- [ ] **Step 3: Weryfikacja w przeglądarce**

```bash
open http://localhost:8000
```

Sprawdź: panel leaderboardu na stronie głównej ma 4 bursztynowe narożniki; po stronie przesuwa się co ~9 s subtelna wiązka; sekcje pojawiają się z fade+slide przy scrollu; karty wjeżdżają kaskadowo.

- [ ] **Step 4: Commit**

```bash
git add assets/site.js
git commit -m "redesign: site.js — narożniki HUD, scanbeam, animacje wejścia (IntersectionObserver)"
```

---

### Task 3: `index.html` — hero w stylu terminala

**Files:**
- Modify: `index.html` (blok `<style>` linie 10–27 + markup h1 linia 36)

- [ ] **Step 1: Podmień regułę `.hero h1` (linia 16)**

Stara:
```css
.hero h1{margin:0 0 22px;font-family:var(--serif);font-size:clamp(2.9rem,6.4vw,5rem);line-height:1.0;font-weight:400;letter-spacing:-.02em;color:var(--ink)}
```
Nowa:
```css
.hero h1{margin:0 0 22px;font-family:var(--disp);font-size:clamp(2.1rem,4.8vw,3.6rem);line-height:1.12;font-weight:400;letter-spacing:.01em;text-transform:uppercase;color:var(--ink);text-shadow:0 0 18px rgba(255,176,0,.25)}
```

- [ ] **Step 2: Podmień regułę `.hero h1 em` (linia 17)**

Stara:
```css
.hero h1 em{font-style:italic;color:var(--acc)}
```
Nowa:
```css
.hero h1 em{font-style:normal;color:var(--acc);text-shadow:0 0 14px rgba(255,176,0,.6)}
```

- [ ] **Step 3: Resztę odwołań `--serif` i metadane hero**

W bloku `<style>` index.html:
- w regule `.scoreline` zamień `font-family:var(--serif)` → `font-family:var(--disp)`,
- w regule `.htag .dot` dopisz na końcu `;box-shadow:0 0 8px rgba(255,176,0,.8)`,
- w regule `.hmeta b` zamień `color:var(--mut)` → `color:var(--acc)`,
- po regule `.hmeta b{...}` dodaj nową linię:

```css
.hmeta span::before{content:"["}.hmeta span::after{content:"]"}
```

- po regule `.hero::before{...}` (linia 11) dodaj scanlines CRT dla hero (spec: „scanlines na hero i panelach"; `.hero` żyje tylko w index.html, więc reguła idzie tutaj, nie do lab.css):

```css
.hero::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;background:repeating-linear-gradient(0deg,rgba(255,200,80,.035) 0 1px,transparent 1px 4px)}
```

- [ ] **Step 4: Kursor terminala w markupu h1 (linia 36)**

Stare zakończenie linii:
```html
… o <em>epsilon</em> dalej.</h1>
```
Nowe:
```html
… o <em>epsilon</em> dalej.<span class="cursor"></span></h1>
```

- [ ] **Step 5: Weryfikacja**

```bash
grep -c 'var(--serif)' index.html        # oczekiwane: 0
grep -c 'font-style:italic' index.html   # oczekiwane: 0
grep -c 'class="cursor"' index.html      # oczekiwane: 1
open http://localhost:8000
```

Hero: nagłówek uppercase mono z migającym ▌, metryki w nawiasach `[10 benchmarków]`, em bursztynowe z glow.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "redesign: index — hero terminalowy (mono uppercase, kursor, nawiasy metryk)"
```

---

### Task 4: Pozostałe podstrony — rename tokenu, kolory gliny, italiki, radiusy

**Files:**
- Modify: `benchmarks.html`, `leaderboard.html`, `progress.html` (rename `--serif`)
- Modify: `kierunki.html:11`, `roadmap.html:22-23`, `trening.html:16,23` (clay → amber)
- Modify: `zespol.html:22` (italic)
- Modify: wszystkie strony z `border-radius` w stylach (8 plików, 13 wystąpień)

- [ ] **Step 1: Rename `var(--serif)` → `var(--disp)` (3 pliki; index zrobiony w Task 3)**

```bash
cd /Users/martynakazimierczuk/Documents/slayer
sed -i '' 's/var(--serif)/var(--disp)/g' benchmarks.html leaderboard.html progress.html
grep -rc 'var(--serif)' *.html | grep -v ':0'   # oczekiwane: brak wyników
```

- [ ] **Step 2: Hardcoded glina → bursztyn (te same wartości alpha)**

```bash
sed -i '' 's/190,85,53/255,176,0/g' kierunki.html roadmap.html trening.html
grep -rc '190,85,53' *.html | grep -v ':0'      # oczekiwane: brak wyników
```

- [ ] **Step 3: Usuń italic w `zespol.html:22`**

Stara:
```css
h1 .a{color:var(--acc);font-style:italic}
```
Nowa:
```css
h1 .a{color:var(--acc);font-style:normal;text-shadow:0 0 14px rgba(255,176,0,.6)}
```

- [ ] **Step 4: Usuń border-radiusy ze stylów podstron (HUD jest kanciasty)**

```bash
sed -E -i '' 's/border-radius:[0-9]+(px|%);?//g' *.html
grep -rno 'border-radius' *.html                # oczekiwane: brak wyników
```

(Obejmuje też kropki `50%` → kwadratowe, zgodnie z zatwierdzonym podglądem.)

- [ ] **Step 5: Weryfikacja wizualna wszystkich zmienionych stron**

```bash
for p in benchmarks leaderboard progress kierunki roadmap trening zespol zadania datasety closed-benchmarks; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "http://localhost:8000/$p.html"
done   # oczekiwane: 200 ×10
open http://localhost:8000/kierunki.html
```

Na /kierunki: chipy `.moat.h` bursztynowe (nie ceglane), kanciaste. Na /roadmap: statusy faz bursztynowe. Na /zespol: nagłówek bez kursywy, z glow.

- [ ] **Step 6: Commit**

```bash
git add benchmarks.html leaderboard.html progress.html kierunki.html roadmap.html trening.html zespol.html zadania.html datasety.html closed-benchmarks.html index.html
git commit -m "redesign: podstrony — disp font, bursztyn zamiast gliny, bez italic/radiusów"
```

---

### Task 5: Weryfikacja końcowa (plan ze speca)

**Files:** brak modyfikacji (chyba że wyjdą poprawki)

- [ ] **Step 1: Wszystkie strony odpowiadają**

```bash
for p in index benchmarks closed-benchmarks datasety kierunki leaderboard progress roadmap trening zadania zespol; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "http://localhost:8000/$p.html"
done   # oczekiwane: 200 ×11
```

- [ ] **Step 2: Kontrast WCAG (program — nie na oko)**

```bash
python3 - <<'EOF'
def lum(h):
    r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def ratio(a,b):
    la,lb=sorted((lum(a),lum(b)),reverse=True)
    return (la+0.05)/(lb+0.05)
pairs=[("d8c9a4","0b0700","txt na bg"),("ffb000","0b0700","acc na bg"),
       ("a8946a","161003","mut na panel"),("8a7a5e","0b0700","dim na bg"),
       ("ff5a26","0b0700","alert na bg"),("0b0700","ffb000","acc-ink na acc")]
for f,b,n in pairs:
    r=ratio(f,b); print(f"{n}: {r:.1f}:1 {'OK' if r>=4.5 else 'AA-large' if r>=3 else 'FAIL'}")
EOF
```

Oczekiwane: `txt na bg` ≥ 10:1, `acc na bg` ≥ 8:1, `mut na panel` ≥ 5:1, `dim na bg` ≥ 4.5:1, `alert na bg` ≥ 4.5:1 (gdyby `alert` wyszedł poniżej 4.5 — używany jest tylko w rozmiarach ≥ .74rem mono z wagą wizualną pill-a, AA-large 3:1 wystarcza dla LIVE/werdyktów, odnotuj wynik).

- [ ] **Step 3: Live-fetch leaderboardu działa**

Otwórz http://localhost:8000 i http://localhost:8000/leaderboard.html — panel pokazuje realny wynik (np. `1 : 8`), paski mają szerokości, kolory zwycięzcy bursztynowe (JS ustawia `var(--acc)` — przechodzi automatycznie).

- [ ] **Step 4: prefers-reduced-motion**

DevTools → Rendering → „Emulate CSS media feature prefers-reduced-motion: reduce". Oczekiwane: brak wiązki, brak migania kursora/kropek, sekcje widoczne od razu (klasa `.rev` nie jest nadawana), strona w pełni używalna.

- [ ] **Step 5: Breakpointy mobilne**

DevTools responsive: 900px (hero → 1 kolumna), 820px (gridy → 1 kolumna), 780px (nav → samo CTA), 680px (timeline → 1 kolumna). Bez poziomego scrolla na 375px.

- [ ] **Step 6: Przejdź wzrokiem wszystkie 11 stron względem wzorca**

Wzorzec: `docs/superpowers/specs/2026-06-06-amber-hud-preview.html`. Szukaj: resztek jasnego motywu, nieczytelnych zestawień, połamanych layoutów. Poprawki → osobne commity `redesign: fix — <co>`.

- [ ] **Step 7: Commit końcowy (jeśli były poprawki) i podsumowanie**

```bash
git status --short    # oczekiwane: pusto
git log --oneline main..HEAD
```

---

## Mapa plików (podsumowanie)

| Plik | Zmiana | Task |
|---|---|---|
| `assets/lab.css` | pełny rewrite — design system Amber HUD | 1 |
| `assets/site.js` | +`hudChrome()`: narożniki, scanbeam, reveal | 2 |
| `index.html` | hero: disp/uppercase/kursor/nawiasy | 3 |
| `benchmarks/leaderboard/progress.html` | `--serif`→`--disp` | 4 |
| `kierunki/roadmap/trening.html` | `190,85,53`→`255,176,0` | 4 |
| `zespol.html` | italic→glow | 4 |
| 8 plików | usunięcie `border-radius` | 4 |
| `datasety.html`, `closed-benchmarks.html`, `zadania.html` | tylko automatycznie przez tokeny + Task 4 seds | 4 |

## Świadome odstępstwa od podglądu referencyjnego

- Podgląd ma scanbeam w hero jako `absolute` — finalnie `fixed` na całej stronie (jedna wiązka site-wide, wstrzykiwana przez JS).
- `--dim` rozjaśnione `#7a6a4a` → `#8a7a5e` (kontrast ≥ 4.5:1 na `--bg`).
- Kropki statusów kwadratowe (usunięte `border-radius:50%`) — spójnie z kanciastym HUD.
