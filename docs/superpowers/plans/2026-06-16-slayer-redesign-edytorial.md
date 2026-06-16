# Slayer Redesign „Ciemny Edytorial" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Przeskórować stronę główną Slayera na nowy język wizualny „Ciemny Edytorial" (typografia + liczby + listy jako grafika) oraz globalną nawigację/stopkę, addytywnie i bez psucia pozostałych 22 stron.

**Architecture:** Nowy, **izolowany** arkusz `styles/slayer.css` z prefiksowanymi tokenami (`--sl-*`) i klasami (`.sl`, `.sl-*`), importowany po `lab.css`. Fonty **Archivo** + **JetBrains Mono** przez `next/font/google` (zmienne CSS). Nav i Footer (globalne) przepisane na klasy `.sl-*`. Strona główna `app/page.jsx` owinięta w `.sl` i w całości przeskórowana z zachowaniem treści/linków; obraz w tle hero usunięty. Stare strony pozostają na `lab.css` (osobne, późniejsze plany).

**Tech Stack:** Next.js 15 (App Router), React 19, `next/font/google`, czysty CSS. Brak nowych zależności runtime.

**Strategia weryfikacji (świadome odstępstwo od unit-TDD):** to redesign wizualny statycznej strony — sensowną „prawdą" jest render i build, nie testy jednostkowe CSS. Każdy task weryfikujemy: (1) `npm run build` przechodzi, (2) `npm run dev` renderuje `/` bez błędów konsoli, (3) wizualna zgodność z mockupem `home-v12` (referencja w `.superpowers/brainstorm/.../home-v12.html` — efemeryczna; źródłem prawdy jest kod w tym planie + spec). W Tasku 7 dochodzi lekki smoke (route 200 + kluczowe treści) i przegląd dostępności/responsywności. Brak nowego frameworka testowego (YAGNI).

**Referencje:** spec `docs/superpowers/specs/2026-06-16-slayer-redesign-edytorial-design.md`.

---

## File Structure

- **Create** `styles/slayer.css` — nowy system: tokeny `--sl-*`, typografia, prymitywy (rule, eyebrow, wielka liczba, labeled list, band, button, chip, table, footnote), nav, footer, reveal.
- **Modify** `app/layout.jsx` — dodać fonty `next/font` (Archivo, JetBrains Mono) jako zmienne na `<html>`, zaimportować `styles/slayer.css`. Zachować istniejący `<link>` Google (stare strony) i `lab.css`.
- **Modify** `components/Nav.jsx` — te same dane `GROUPS`, klasy przełączone na `.sl-*`.
- **Modify** `components/Footer.jsx` — klasy na `.sl-*`.
- **Modify** `app/page.jsx` — owinąć w `.sl`, przepisać markup na klasy `.sl-*`, usunąć inline `<style>` i obraz tła; zachować całą treść, linki i `<BenchCount/>`/`<MeasureNote/>`.
- **Unchanged** `app/home-live.jsx` — logika live zostaje (komponenty użyte w nowym markupie).

---

## Task 1: Fonty (next/font) + szkielet `slayer.css`

**Files:**
- Create: `styles/slayer.css`
- Modify: `app/layout.jsx`

- [ ] **Step 1: Utwórz `styles/slayer.css` z tokenami i bazą `.sl`**

```css
/* ============================================================
   SLAYER v2 — „Ciemny Edytorial". Addytywny, izolowany pod .sl
   Tokeny i klasy prefiksowane (--sl-* / .sl-*), by nie kolidować
   z lab.css (stare 22 strony pozostają nietknięte).
   ============================================================ */
:root{
  --sl-bg:#0d0a0b; --sl-ink:#ece4e0; --sl-txt:#b9adad; --sl-mut:#8a7d7d; --sl-dim:#6e6063;
  --sl-acc:#fb4d68; --sl-acc-strong:#ec2b4f; --sl-acc-soft:rgba(236,43,79,.12);
  --sl-line:rgba(255,255,255,.12); --sl-line2:rgba(255,255,255,.06);
  --sl-sans:var(--font-archivo),"Archivo",system-ui,sans-serif;
  --sl-mono:var(--font-jbmono),"JetBrains Mono",ui-monospace,monospace;
  --sl-max:1140px;
}
.sl{background:var(--sl-bg);color:var(--sl-txt);font-family:var(--sl-sans);font-weight:400;line-height:1.55;-webkit-font-smoothing:antialiased}
.sl ::selection{background:var(--sl-acc);color:#fff}
.sl a{color:inherit;text-decoration:none}
.sl-inner{width:min(var(--sl-max),100%);margin:0 auto;padding-left:clamp(18px,5vw,72px);padding-right:clamp(18px,5vw,72px)}
.sl-sec{padding:clamp(36px,6vw,72px) 0}
.sl-rule{border:0;border-top:1px solid var(--sl-line);margin:0}
```

- [ ] **Step 2: W `app/layout.jsx` dodaj fonty i import nowego arkusza**

Zmień górę pliku i `<html>` (zachowaj istniejący `<link>` i `import "../styles/lab.css"`):

```jsx
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import "../styles/lab.css";
import "../styles/slayer.css";

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-archivo",
  display: "swap",
});
const jbmono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-jbmono",
  display: "swap",
});
```

I dodaj zmienne fontów do `<html>`:

```jsx
    <html lang="pl" className={`${archivo.variable} ${jbmono.variable}`}>
```

- [ ] **Step 3: Build i render**

Run: `npm run build`
Expected: build przechodzi bez błędów (fonty pobrane, brak błędów importu CSS).

Run: `npm run dev`, otwórz `http://localhost:3000` → strona działa jak dotąd (jeszcze stary wygląd; nowy arkusz nieużywany, bo `.sl` jeszcze nigdzie nie ma). Brak błędów w konsoli.

- [ ] **Step 4: Commit**

```bash
git add styles/slayer.css app/layout.jsx
git commit -m "redesign: fonty Archivo + JetBrains Mono (next/font) + szkielet slayer.css"
```

---

## Task 2: System designu — prymitywy w `slayer.css`

**Files:**
- Modify: `styles/slayer.css`

- [ ] **Step 1: Dopisz typografię i prymitywy (na końcu `slayer.css`)**

```css
/* ---------- typografia ---------- */
.sl-eye{font-family:var(--sl-mono);font-size:10px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--sl-acc)}
.sl-h1{font-family:var(--sl-sans);font-weight:300;text-transform:uppercase;letter-spacing:-.01em;line-height:.98;color:var(--sl-ink);font-size:clamp(40px,7vw,64px);margin:0}
.sl-h2{font-family:var(--sl-sans);font-weight:300;text-transform:uppercase;letter-spacing:-.01em;line-height:1.02;color:var(--sl-ink);font-size:clamp(26px,4vw,34px);margin:0}
.sl-acc{color:var(--sl-acc)}
.sl-lede{color:var(--sl-mut);font-size:clamp(14px,1.5vw,16px);line-height:1.6;max-width:56ch}
.sl-lede b{color:var(--sl-ink);font-weight:500}
.sl-lede a{color:var(--sl-acc);border-bottom:1px solid var(--sl-acc-soft)}

/* ---------- wielka liczba ---------- */
.sl-num{font-family:var(--sl-sans);font-weight:300;letter-spacing:-.03em;line-height:.85;font-size:clamp(40px,6vw,60px);color:var(--sl-ink)}
.sl-num.sl-acc{color:var(--sl-acc)}

/* ---------- pas wielkich liczb ---------- */
.sl-band{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--sl-line);border-top:1px solid var(--sl-line);border-bottom:1px solid var(--sl-line)}
.sl-stat{background:var(--sl-bg);padding:clamp(18px,3vw,26px) clamp(16px,2vw,24px)}
.sl-slbl{font-family:var(--sl-mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--sl-mut);margin-top:12px;line-height:1.5}
@media(max-width:820px){.sl-band{grid-template-columns:repeat(2,1fr)}}

/* ---------- nazwane kolumny + labeled list ---------- */
.sl-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--sl-line);border-top:1px solid var(--sl-line);border-bottom:1px solid var(--sl-line)}
.sl-col{background:var(--sl-bg);padding:22px clamp(16px,2vw,24px)}
.sl-clbl{font-family:var(--sl-mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--sl-acc);margin-bottom:14px}
.sl-list{margin:0;padding:0;list-style:none;font-size:13.5px;line-height:2.05;color:var(--sl-txt)}
.sl-list a{color:var(--sl-txt);transition:color .15s}
.sl-list a:hover{color:var(--sl-acc)}
.sl-list sup{font-size:8px;color:var(--sl-acc)}
@media(max-width:820px){.sl-cols{grid-template-columns:1fr}}

/* ---------- numerowane wpisy (reguły) ---------- */
.sl-entries{border-top:1px solid var(--sl-line)}
.sl-entry{display:grid;grid-template-columns:auto 1fr;gap:clamp(16px,3vw,30px);padding:clamp(18px,3vw,26px) 0;border-bottom:1px solid var(--sl-line2);align-items:start}
.sl-entry .sl-no{font-family:var(--sl-sans);font-weight:300;font-size:clamp(28px,4vw,40px);color:var(--sl-acc);line-height:.9}
.sl-entry h3{font-family:var(--sl-sans);font-weight:500;font-size:clamp(15px,2vw,19px);color:var(--sl-ink);text-transform:uppercase;letter-spacing:-.005em;margin:0 0 7px}
.sl-entry p{margin:0;color:var(--sl-mut);font-size:13.5px;max-width:74ch}
.sl-entry p b{color:var(--sl-ink)}
@media(max-width:560px){.sl-entry{grid-template-columns:1fr;gap:6px}}

/* ---------- przyciski ---------- */
.sl-cta{display:flex;flex-wrap:wrap;gap:12px}
.sl-btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--sl-mono);font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;padding:12px 18px;border:1px solid transparent;cursor:pointer;transition:.15s}
.sl-btn-p{background:var(--sl-acc-strong);color:#fff}
.sl-btn-p:hover{background:var(--sl-acc)}
.sl-btn-s{border-color:var(--sl-line);color:var(--sl-ink)}
.sl-btn-s:hover{border-color:var(--sl-acc);color:var(--sl-acc)}

/* ---------- chip ---------- */
.sl-chip{display:inline-block;font-family:var(--sl-mono);font-size:9.5px;letter-spacing:.04em;padding:3px 9px;border-radius:99px;color:var(--sl-acc);background:var(--sl-acc-soft);border:1px solid rgba(236,43,79,.32)}

/* ---------- tabela ---------- */
.sl-tbl{width:100%;border-collapse:collapse;font-size:13px}
.sl-tbl th{text-align:left;padding:12px 8px;font-family:var(--sl-mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--sl-mut);border-bottom:1px solid var(--sl-line)}
.sl-tbl th.sl-c,.sl-tbl td.sl-s{text-align:right}
.sl-tbl td{padding:13px 8px;border-bottom:1px solid var(--sl-line2);color:var(--sl-txt)}
.sl-tbl td.sl-dn{color:var(--sl-ink);font-weight:500}
.sl-tbl td.sl-s{font-family:var(--sl-mono)}
.sl-tbl td.sl-s.sl-win{color:var(--sl-acc)}

/* ---------- przypisy ---------- */
.sl-fn{font-family:var(--sl-mono);font-size:9px;line-height:1.8;color:var(--sl-dim);letter-spacing:.02em;margin-top:14px}

/* ---------- reveal (a11y: szanuje reduced-motion) ---------- */
.sl-rv{opacity:0;transform:translateY(12px);animation:sl-rv .7s cubic-bezier(.2,.7,.3,1) forwards}
.sl-rv.sl-d1{animation-delay:.06s}.sl-rv.sl-d2{animation-delay:.16s}.sl-rv.sl-d3{animation-delay:.26s}.sl-rv.sl-d4{animation-delay:.36s}
@keyframes sl-rv{to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.sl-rv{animation:none;opacity:1;transform:none}}
```

- [ ] **Step 2: Build + szybki render-test prymitywów**

Run: `npm run build` → przechodzi.
Run: `npm run dev`. Tymczasowo dopisz na dole `app/page.jsx` (PRZED `</>`), tylko by zobaczyć prymitywy, i usuń po sprawdzeniu:

```jsx
{/* TEMP probe — usunąć po Tasku 2 */}
<div className="sl"><div className="sl-inner sl-sec">
  <div className="sl-eye">✦ probe</div>
  <h1 className="sl-h1">Protokół dla <span className="sl-acc">polskiej inteligencji.</span></h1>
  <div className="sl-band"><div className="sl-stat"><div className="sl-num sl-acc">0.82</div><div className="sl-slbl">PolNative</div></div></div>
</div></div>
```

Expected: na `/` (na dole) cienkie wersaliki Archivo, karmazyn, polskie znaki (ł, ś, ż, ó) renderują się poprawnie. Usuń sondę przed commitem.

- [ ] **Step 3: Commit**

```bash
git add styles/slayer.css
git commit -m "redesign: prymitywy slayer.css (typografia, wielka liczba, kolumny, wpisy, button, chip, tabela)"
```

---

## Task 3: Nav — przeskórowanie na `.sl-*`

**Files:**
- Modify: `styles/slayer.css` (dopisać style nav)
- Modify: `components/Nav.jsx` (klasy)

- [ ] **Step 1: Dopisz style nav do `slayer.css`**

```css
/* ---------- nav ---------- */
.sl-nav{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;height:60px;padding:0 clamp(18px,5vw,72px);background:rgba(13,10,11,.86);backdrop-filter:blur(14px);border-bottom:1px solid var(--sl-line2);font-family:var(--sl-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.sl-brand{color:var(--sl-ink);font-weight:500;display:inline-flex;align-items:center;gap:8px}
.sl-brand .sep{color:var(--sl-dim)}
.sl-brand .mk{color:var(--sl-acc)}
.sl-nlinks{display:flex;align-items:center;gap:clamp(12px,2vw,22px);color:var(--sl-mut)}
.sl-navgroup{position:relative;display:inline-flex;align-items:center}
.sl-navtop{cursor:default;color:var(--sl-mut);transition:color .15s}
.sl-navgroup:hover .sl-navtop,.sl-navgroup.sl-active .sl-navtop{color:var(--sl-ink)}
.sl-navgroup.sl-active .sl-navtop{color:var(--sl-acc)}
.sl-navmenu{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:10px;min-width:210px;display:flex;flex-direction:column;gap:1px;padding:8px;background:rgba(15,12,13,.97);backdrop-filter:blur(16px);border:1px solid var(--sl-line2);box-shadow:0 18px 44px rgba(0,0,0,.5);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .15s;z-index:50}
.sl-navmenu::before{content:"";position:absolute;top:-10px;left:0;right:0;height:10px}
.sl-navgroup:hover .sl-navmenu{opacity:1;visibility:visible;pointer-events:auto}
.sl-navmenu a{padding:8px 11px;font-size:10px;color:var(--sl-mut);white-space:nowrap;transition:.12s}
.sl-navmenu a:hover{color:var(--sl-ink);background:rgba(255,255,255,.05)}
.sl-navmenu a.sl-on{color:var(--sl-acc)}
.sl-ncta{color:var(--sl-acc)}
.sl-navtoggle{display:none;flex-direction:column;justify-content:center;gap:4px;width:34px;height:34px;background:none;border:1px solid var(--sl-line2);cursor:pointer;padding:0 8px}
.sl-navtoggle span{display:block;height:1.5px;background:var(--sl-ink);transition:.2s}
@media(max-width:860px){
  .sl-navtoggle{display:inline-flex}
  .sl-nlinks{position:fixed;top:60px;left:0;right:0;flex-direction:column;align-items:stretch;gap:0;padding:10px clamp(18px,5vw,72px) 22px;background:rgba(13,10,11,.98);backdrop-filter:blur(16px);border-bottom:1px solid var(--sl-line2);max-height:calc(100vh - 60px);overflow-y:auto;transform:translateY(-12px);opacity:0;visibility:hidden;transition:.2s}
  .sl-nlinks.sl-open{transform:none;opacity:1;visibility:visible}
  .sl-navgroup{flex-direction:column;align-items:stretch;border-top:1px solid var(--sl-line2);padding-top:6px;margin-top:6px}
  .sl-navgroup:first-child{border-top:0;margin-top:0}
  .sl-navtop{padding:8px 0 4px;color:var(--sl-dim)}
  .sl-navmenu{position:static;transform:none;margin:0;min-width:0;padding:0 0 4px;background:none;border:none;box-shadow:none;backdrop-filter:none;opacity:1;visibility:visible;pointer-events:auto}
  .sl-navmenu::before{display:none}
  .sl-navmenu a{padding:9px 4px;font-size:12px}
  .sl-ncta{margin-top:14px}
}
```

- [ ] **Step 2: Przepisz `components/Nav.jsx` na nowe klasy (dane `GROUPS` bez zmian)**

Zachowaj cały blok `const GROUPS = [...]` z oryginału (linie 5–48). Zmień tylko `export default function Nav()`:

```jsx
export default function Nav() {
  const pathname = (usePathname() || "/").replace(/\/+$/, "") || "/";
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="sl-nav">
      <a className="sl-brand" href="/" onClick={close}>
        <span className="mk">✦</span> slayer<span className="sep"> / </span>protokół
      </a>
      <button
        className="sl-navtoggle"
        aria-label="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>
      <nav className={open ? "sl-nlinks sl-open" : "sl-nlinks"}>
        {GROUPS.map((g) => {
          const active = g.links.some(([href]) => href === pathname);
          return (
            <div className={active ? "sl-navgroup sl-active" : "sl-navgroup"} key={g.label}>
              <span className="sl-navtop">{g.label}</span>
              <div className="sl-navmenu">
                {g.links.map(([href, label]) => (
                  <a key={href} className={pathname === href ? "sl-on" : ""} href={href} onClick={close}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
        <a className="sl-ncta" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank" onClick={close}>
          ✦ wejście ↗
        </a>
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Build + render nav**

Run: `npm run build` → przechodzi.
Run: `npm run dev`, otwórz `/`. Nav: mono, wersaliki, karmazynowe „wejście", dropdowny działają na hover, mobile-toggle działa < 860px. Polskie znaki w linkach OK.

- [ ] **Step 4: Commit**

```bash
git add styles/slayer.css components/Nav.jsx
git commit -m "redesign: nav w nowym języku (mono wersaliki, karmazyn, dropdowny)"
```

---

## Task 4: Footer — przeskórowanie

**Files:**
- Modify: `styles/slayer.css`
- Modify: `components/Footer.jsx`

- [ ] **Step 1: Dopisz style stopki do `slayer.css`**

```css
/* ---------- footer ---------- */
.sl-foot{border-top:1px solid var(--sl-line);padding:22px clamp(18px,5vw,72px);display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;font-family:var(--sl-mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--sl-dim);background:var(--sl-bg)}
.sl-foot a{color:var(--sl-mut)}
.sl-foot a:hover{color:var(--sl-acc)}
```

- [ ] **Step 2: Przepisz `components/Footer.jsx`**

```jsx
export default function Footer() {
  return (
    <footer className="sl-foot">
      <span>slayer — applied research lab · polish llms · 2026 ✦</span>
      <span>
        <a href="https://github.com/slayerlabs" rel="noopener">github ↗</a> ·{" "}
        <a href="/benchmarks">protokoły</a> · <a href="/leaderboard">pomiary</a> ·{" "}
        <a href="/rules">rules</a> · <a href="/drabina">drabina</a> ·{" "}
        <a href="/roadmap">roadmap</a> ·{" "}
        <a href="/team">zespół</a> · <a href="/zespol">wejście</a>
      </span>
    </footer>
  );
}
```

- [ ] **Step 3: Build + render**

Run: `npm run build` → przechodzi. `npm run dev` → stopka mono, separatory `·`, hover karmazyn.

- [ ] **Step 4: Commit**

```bash
git add styles/slayer.css components/Footer.jsx
git commit -m "redesign: stopka w nowym języku (mono, separatory, dingbaty)"
```

---

## Task 5: Strona główna — hero + pas liczb

**Files:**
- Modify: `app/page.jsx`

- [ ] **Step 1: Dodaj style hero do `slayer.css`**

```css
/* ---------- hero (strona główna) ---------- */
.sl-hero{padding:clamp(40px,8vw,84px) 0 clamp(28px,4vw,44px);background:radial-gradient(ellipse 46% 70% at 14% -8%,rgba(236,43,79,.16),transparent 62%)}
.sl-hero h1{margin:14px 0 0}
.sl-hero .sl-lede{margin:22px 0 0}
.sl-hero .sl-cta{margin-top:26px}
```

- [ ] **Step 2: Przebuduj górę `app/page.jsx` — usuń inline `<style>` i obraz, owiń w `.sl`, nowy hero + band**

Zamień `const css = \`...\`;` (linie 9–81) na **usunięcie** (kasujemy cały inline blok) oraz początek `return`:

```jsx
import { BenchCount, MeasureNote } from "./home-live";

export const metadata = {
  title: "Slayer — applied research lab dla polskich modeli",
  description:
    "Slayer to niezależne applied research lab dla polskich modeli językowych: protokoły ewaluacji, lineage danych, recepty treningowe i jawne koszty. Dobry smak plus twardy pomiar.",
};

export default function Home() {
  return (
    <div className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-eye sl-rv">✦ good taste applied research lab · polskie modele</div>
          <h1 className="sl-h1 sl-rv sl-d1">Protokół dla <span className="sl-acc">polskiej inteligencji.</span></h1>
          <p className="sl-lede sl-rv sl-d2">Slayer bada modele językowe jak rzemiosło: smak odpowiedzi, czystość pomiaru, koszt treningu i ślady danych. Nie robimy widowiska. Zostawiamy <b>artefakty</b>: harnessy, lineage, recepty, modele i wyniki, które da się odtworzyć.</p>
          <div className="sl-cta sl-rv sl-d3">
            <a className="sl-btn sl-btn-p" href="/benchmarks">otwórz protokoły →</a>
            <a className="sl-btn sl-btn-s" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">wejście do labu ↗</a>
          </div>
        </div>
      </section>

      <div className="sl-inner">
        <div className="sl-band sl-rv sl-d4">
          <div className="sl-stat"><BenchCount /><div className="sl-slbl">osi ewaluacji</div></div>
          <div className="sl-stat"><div className="sl-num">24<span className="sl-acc">k</span></div><div className="sl-slbl">rekordów z rodowodem</div></div>
          <div className="sl-stat"><div className="sl-num">100<span className="sl-acc">%</span></div><div className="sl-slbl">claimów z held-out</div></div>
          <div className="sl-stat"><div className="sl-num">~18<span className="sl-acc">k</span></div><div className="sl-slbl">zł — koszt w wyniku</div></div>
        </div>
      </div>

      {/* === Task 6 wstawia tu kolejne sekcje, przed </div> === */}
    </div>
  );
}
```

> Uwaga: `BenchCount` w `home-live.jsx` renderuje `<div className="v">{n}</div>`. Aby liczba miała nowy styl, **w Tasku 5 zmodyfikuj** `app/home-live.jsx`: w `BenchCount` zamień `className="v"` na `className="sl-num sl-acc"`; w `MeasureNote` zamień `className="pnote"` oraz `var(--line2)` na `var(--sl-line2)` (dwa wystąpienia) i `var(--ink)` na `var(--sl-ink)`. Pełny nowy `home-live.jsx` poniżej.

- [ ] **Step 3: Zaktualizuj `app/home-live.jsx` (style live pod nowy system)**

```jsx
"use client";
import { useEffect, useState } from "react";

function useLeaderboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const load = () =>
      fetch("/results/leaderboard.json?ts=" + Date.now())
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);
  return data;
}

export function BenchCount() {
  const d = useLeaderboard();
  const n = d ? (d.benchmarks || []).length : 10;
  return <div className="sl-num sl-acc">{n}</div>;
}

export function MeasureNote() {
  const d = useLeaderboard();
  if (!d) {
    return (
      <p className="sl-fn" style={{ padding: "12px 0 0", margin: 0 }}>
        wczytuję pomiary…
      </p>
    );
  }
  const n = (d.benchmarks || []).length;
  const when = d.generated_at ? d.generated_at.slice(0, 10) : "";
  return (
    <p className="sl-fn" style={{ padding: "12px 0 0", margin: 0 }}>
      <b style={{ color: "var(--sl-ink)" }}>{n}</b> osi zmierzonych{when ? " · stan " + when : ""} ·{" "}
      <a href="/leaderboard" style={{ color: "var(--sl-acc)" }}>wszystkie wyniki →</a>
    </p>
  );
}
```

- [ ] **Step 4: Build + render hero**

Run: `npm run build` → przechodzi.
Run: `npm run dev`, `/`: wielki cienki wersalikowy nagłówek, karmazynowy akcent na „polskiej inteligencji.", glow w tle (bez obrazu), pas 4 wielkich liczb (pierwsza z live `BenchCount`). Polskie znaki OK. Sekcje poniżej zniknęły tymczasowo (wrócą w Tasku 6) — to oczekiwane.

- [ ] **Step 5: Commit**

```bash
git add app/page.jsx app/home-live.jsx styles/slayer.css
git commit -m "redesign: hero strony głównej (typografia-grafika) + pas wielkich liczb"
```

---

## Task 6: Strona główna — pozostałe sekcje (treść zachowana)

**Files:**
- Modify: `app/page.jsx`

Wszystkie sekcje wstaw w miejsce komentarza `{/* === Task 6 ... === */}` z Tasku 5. Treść i linki **przeniesione 1:1** ze starego `page.jsx`, tylko w nowym języku.

- [ ] **Step 1: Księga pomiarów (labeled list zamiast panelu)**

```jsx
      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">◆ księga pomiarów</div>
          <div className="sl-cols" style={{ marginTop: 18 }}>
            <div className="sl-col">
              <div className="sl-clbl">▸ ostatnie artefakty</div>
              <ul className="sl-list">
                <li><a href="/eksperymenty">slayer-style-27b — smak bez amnezji <sup>1</sup></a></li>
                <li><a href="/datasety">datasety — dane + karty + lineage <sup>2</sup></a></li>
                <li><a href="/benchmarks">benchmarks — karty 10 osi pomiaru</a></li>
                <li><a href="https://arena.fabryka.ai" rel="noopener" target="_blank">arena — ślepe porównania PL ↗</a></li>
              </ul>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">◆ stan</div>
              <MeasureNote />
              <p className="sl-fn">1 — LLMzSzŁ 65.0 vs baza 58.5 (likelihood, n=400) &nbsp; 2 — miksy 1:1 · disclosure kontaminacji v2</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />
```

- [ ] **Step 2: „01 komnaty" — cztery obszary jako nazwane kolumny + wpisy**

```jsx
      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">01 · komnaty ◆</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Cztery drzwi, <span className="sl-acc">jeden warsztat.</span></h2>
          <p className="sl-lede" style={{ marginTop: 12 }}>Każdy obszar ma własny protokół, artefakty i ślady. Bez ozdobnych deklaracji, bez wyników na słowo.</p>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col">
              <div className="sl-clbl">▸ ewaluacja</div>
              <a href="/benchmarks"><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Czysty pomiar polszczyzny</h3></a>
              <p className="sl-lede" style={{ fontSize: 13 }}>Karty benchmarków: co mierzy każda oś, jaka metryka decyduje, gdzie pułapka. Likelihood i generacja rozdzielone, stały seed, tylko agregaty.</p>
              <p className="sl-fn">artefakt — harness + karty 10 osi (LLMzSzŁ, KLEJ, PoQuAD…)</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ dane</div>
              <a href="/datasety"><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Kuracja zamiast masy</h3></a>
              <p className="sl-lede" style={{ fontSize: 13 }}>Małe, świetne zbiory biją duże i brudne. Pełny lineage każdego miksu, dekontaminacja względem ewaluacji, provenance per rekord.</p>
              <p className="sl-fn">artefakt — karty datasetów + miksy 1:1 z lineage</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ trening</div>
              <a href="/trening"><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Recepty, które przechodzą próg</h3></a>
              <p className="sl-lede" style={{ fontSize: 13 }}>QLoRA SFT, preferencje (DPO/ORPO), RL na weryfikowalnych nagrodach. Każdy run z gate&apos;ami regresji.</p>
              <p className="sl-fn">artefakt — cooking recipe + training log + decyzje</p>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 1 }}>
            <div className="sl-col">
              <div className="sl-clbl">▸ styl</div>
              <a href="/kierunki"><h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Naturalna polszczyzna</h3></a>
              <p className="sl-lede" style={{ fontSize: 13 }}>Model ma pisać jak ktoś, kto ma ucho: bez kalek, bez asystenckiej waty, z natywną fleksją. Mierzone twardo i otwartym sędzią.</p>
              <p className="sl-fn">artefakt — style-SFT 1.6k przykładów + eval stylu held-out</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />
```

- [ ] **Step 3: „02 reguły przejścia" — numerowane wpisy (idealne pod nowy styl)**

```jsx
      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">02 · reguły przejścia ◆</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Co wpuszczamy <span className="sl-acc">do twierdzeń.</span></h2>
          <p className="sl-lede" style={{ marginTop: 12, marginBottom: 8 }}>Rygor ewaluacyjny jest częścią smaku. Te reguły obowiązują w każdym runie.</p>
          <div className="sl-entries">
            <div className="sl-entry"><div className="sl-no">01</div><div><h3>Held-out albo nic</h3><p>Publiczne twierdzenia wyłącznie z danych, których model nie widział, mierzone tym samym protokołem co baseline&apos;y. Wynik na zadaniu trenowanym oznaczamy jako trenowany i nie liczymy do claimów.</p></div></div>
            <div className="sl-entry"><div className="sl-no">02</div><div><h3>Agregaty, nie itemy</h3><p>Analizujemy accuracy per kategoria, domena, rok. Nie oglądamy pojedynczych pytań i nie piszemy na ich podstawie danych treningowych. Pliki ewaluacji wchodzą do pipeline&apos;u wyłącznie jako wejście dekontaminacji.</p></div></div>
            <div className="sl-entry"><div className="sl-no">03</div><div><h3>Lineage i disclosure</h3><p>Każdy model ma audytowalną listę: co weszło do treningu, skąd, z jaką licencją. Gdy popełniliśmy błąd (skażony miks v2), <b>opublikowaliśmy go z pełnym disclosure</b> zamiast chować.</p></div></div>
            <div className="sl-entry"><div className="sl-no">04</div><div><h3>Otwarci sędziowie</h3><p>Tam, gdzie ocenia LLM, sędzią jest model o otwartych wagach, z podanym promptem i wersją. Zamknięte API nie filtrują danych i nie wystawiają ocen, na których stoi wynik.</p></div></div>
            <div className="sl-entry"><div className="sl-no">05</div><div><h3>Koszt jest wynikiem</h3><p>Budżet, sprzęt i czas każdego runu są częścią publikacji. Teza kosztowa (konkurencyjny model za ~15–20k zł) jest falsyfikowalna jak każda inna.</p></div></div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />
```

- [ ] **Step 4: „03 wejścia" — sześć modułów jako labeled list (2 kolumny po 3)**

```jsx
      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">03 · wejścia ◆</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Wybierz <span className="sl-acc">ślad.</span></h2>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col">
              <div className="sl-clbl">▸ pomiary</div>
              <ul className="sl-list">
                <li><a href="/leaderboard">Ewaluacje na żywo →</a></li>
                <li><a href="/eksperymenty">Eksperymenty (log runów) →</a></li>
                <li><a href="/benchmarks">Benchmarki (metoda) →</a></li>
              </ul>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ budowa</div>
              <ul className="sl-list">
                <li><a href="/datasety">Datasety (lineage) →</a></li>
                <li><a href="/trening">Trening (recepty) →</a></li>
                <li><a href="/zespol">Zespół (dołącz) →</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />
```

- [ ] **Step 5: „04 kontekst" + sekcja „dołącz"**

```jsx
      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">04 · kontekst ◆</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Bez teatru <span className="sl-acc">zwycięstwa.</span></h2>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col">
              <div className="sl-clbl">▸ ekosystem</div>
              <p className="sl-lede" style={{ fontSize: 13 }}>Bielik (SpeakLeash) to ważny punkt odniesienia i wzór otwartego raportowania. Nasz wkład jest komplementarny: niezależna replikacja, tańsza ścieżka treningu i publiczny warsztat pomiarowy.</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">▸ baza i licencja</div>
              <p className="sl-lede" style={{ fontSize: 13 }}>Budujemy na Qwen3.5-27B (Apache 2.0): pochodne można trenować, wydawać i komercjalizować otwarcie. 9B służy do tanich iteracji. Trening i hosting w Polsce, receptura jawna.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner" style={{ maxWidth: 760, marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
          <div className="sl-eye" style={{ display: "block" }}>✦ dołącz</div>
          <h2 className="sl-h2" style={{ margin: "12px 0 14px" }}>Wejdź, jeśli chcesz <span className="sl-acc">mierzyć.</span></h2>
          <p className="sl-lede" style={{ margin: "0 auto 24px" }}>Kontrybutorzy, naukowcy, firmy z use case&apos;ami i fundatorzy compute. Publiczny zapis: od razu widać, kto już jest.</p>
          <div className="sl-cta" style={{ justifyContent: "center" }}>
            <a className="sl-btn sl-btn-p" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">wejście do labu ↗</a>
            <a className="sl-btn sl-btn-s" href="/zespol">zapisz się</a>
          </div>
        </div>
      </section>
```

- [ ] **Step 6: Build + pełny render**

Run: `npm run build` → przechodzi.
Run: `npm run dev`, `/`: cała strona w nowym języku, wszystkie sekcje i linki obecne, treść 1:1, dingbaty `✦ ◆ ▸`, przypisy `¹²`, hairline rules. Brak błędów konsoli.

- [ ] **Step 7: Commit**

```bash
git add app/page.jsx
git commit -m "redesign: pozostałe sekcje strony głównej (księga, komnaty, reguły, wejścia, kontekst, dołącz)"
```

---

## Task 7: Responsywność, dostępność, weryfikacja końcowa

**Files:**
- Modify: `styles/slayer.css` (poprawki responsywne, jeśli trzeba)

- [ ] **Step 1: Przegląd responsywny (DevTools / wąskie okno)**

Run: `npm run dev`. Sprawdź breakpointy:
- ≤ 860px: nav zwija się do toggla, menu mobilne działa.
- ≤ 820px: `.sl-cols` → 1 kolumna; `.sl-band` → 2 kolumny.
- ≤ 560px: `.sl-entry` → 1 kolumna (numer nad treścią).
Jeśli coś się rozjeżdża (np. wielki nagłówek wychodzi poza ekran), dodaj/popraw `clamp()` w `.sl-h1`/`.sl-h2`. Expected: brak poziomego scrolla na 360px.

- [ ] **Step 2: Dostępność — kontrast i czytelność**

- Sprawdź kontrast karmazynu `--sl-acc #fb4d68` na `--sl-bg #0d0a0b` oraz `--sl-mut` na tle (DevTools → kontrast). Tekst krytyczny ma używać `--sl-ink`/`--sl-txt`, nie `--sl-dim`. Jeśli `--sl-mut` na lede wypada < 4.5:1, podnieś jasność `--sl-mut` do `#9a8d8d`.
- Wersaliki tylko CSS-em (`text-transform`), treść w markupie naturalna — potwierdź w DOM, że `<h1>` zawiera „Protokół dla polskiej inteligencji." (czytniki ekranu).
- Sprawdź `prefers-reduced-motion`: w DevTools wymuś — animacje `.sl-rv` znikają, treść widoczna.

- [ ] **Step 3: Smoke — strona główna oddaje kluczowe treści**

Z uruchomionym `npm run dev`:

Run:
```bash
curl -s http://localhost:3000/ | grep -c "polskiej inteligencji"
```
Expected: `≥ 1` (nagłówek obecny w HTML — SSR).

Run:
```bash
curl -s http://localhost:3000/ | grep -o "sl-hero\|sl-band\|sl-entry" | sort -u
```
Expected: trzy linie (`sl-band`, `sl-entry`, `sl-hero`) — nowe komponenty w DOM.

- [ ] **Step 4: Regresja starych stron (spot-check)**

Run: `npm run dev`, otwórz np. `/benchmarks` i `/trening`. Expected: renderują się jak wcześniej (na `lab.css`), nowy `slayer.css` ich nie zepsuł; widać tylko nowy globalny Nav/Footer (oczekiwany stan przejściowy do czasu ich migracji).

- [ ] **Step 5: Build produkcyjny**

Run: `npm run build`
Expected: przechodzi bez błędów i ostrzeżeń o brakujących fontach/CSS.

- [ ] **Step 6: Commit (jeśli były poprawki)**

```bash
git add styles/slayer.css
git commit -m "redesign: poprawki responsywne + dostępność (kontrast, reduced-motion)"
```

---

## Definition of Done

- `/` w pełni w języku „Ciemny Edytorial", zgodna z mockupem `home-v12`, cała treść i linki zachowane.
- Nav + Footer globalnie w nowym języku.
- `npm run build` przechodzi; brak błędów konsoli; SSR oddaje kluczowe treści; brak poziomego scrolla na mobile; kontrast AA na tekście krytycznym; `reduced-motion` uszanowane.
- Stare 22 strony nadal renderują (na `lab.css`), gotowe do osobnej migracji.
- Wszystko na gałęzi `redesign-edytorial`, lokalnie (bez pusha).
