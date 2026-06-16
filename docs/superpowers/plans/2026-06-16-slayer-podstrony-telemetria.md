# Migracja podstron → „Telemetria" — Plan

> **Dla wykonawców (subagentów):** to jest migracja *czysto wizualna*. Logika (client components, fetch, stan formularzy, walidacja, dane JSON/API) MUSI zostać nietknięta. Zmieniamy `className` i markup prezentacyjny, dodajemy/usuwamy elementy strukturalne — NIE ruszamy hooków, `useState`, `useEffect`, `fetch`, importów danych.

**Cel:** Przenieść 22 podstrony (+2 podtrasy) z `lab.css` na system `slayer.css` („Ciemny Edytorial / Telemetria"), zachowując pełną funkcjonalność.

**Architektura:** Addytywna i izolowana. `slayer.css` (prefiks `.sl-*`) i `lab.css` współistnieją globalnie (zero kolizji — wszystko prefiksowane). Każda strona owija treść w `<main className="sl">`. Nav + Footer już zmigrowane. Strona główna = wzorzec referencyjny.

**Język wizualny:** dark `#0d0a0b` + Polish Crimson `#fb4d68`; Archivo cienka UPPERCASE w nagłówkach, JetBrains Mono w etykietach; wielkie liczby (Archivo 600); przestrzeń; **zero gradientów, zero border-radius**; crosshairs `+` na rogach modułów; eyebrow w ramkach `[ … ]`; blok koloru (crimson) jako akcent; asymetryczne bento.

---

## Faza 0 — Kit prymitywów (fundament, budowany pierwszy)

Dobudowane do `slayer.css` (sekcja „KIT v2"):

| Prymityw | Do czego | Strony |
|----------|----------|--------|
| `.sl-note` | callout (rail crimson + tekst) | datasety, bielik-dane, bielik-benchmarki, closed-benchmarks, propozycja |
| `.sl-steps` / `.sl-step` (+ `.sl-step-no`/`-when`) | timeline / recipe / poziomy | roadmap, trening, drabina |
| `.sl-status` (+ `.sl-ok/run/queued/fail/open`) | kropka stanu + etykieta | progress, roadmap, wiedza, bench-explorer, leaderboard |
| `.sl-chip.sl-on / .sl-warn / .sl-mute` | aktywny filtr / kontaminacja / neutralny | bench-explorer, eksperymenty |
| kit formularza: `.sl-field`, `.sl-input`, `.sl-textarea`, `.sl-select`, `.sl-ferr`, `.sl-check`, `.sl-filter-bar` | formularze i filtry | zespol, bench-explorer/nowy, bench-explorer |
| `.sl-pre` | panel mono (JSON / kod) | bench-explorer/nowy, eng-log/[slug] |
| `.sl-bar` (+ `-fill`/`-pct`/`-run`) | progress **płaski, bez gradientu** | progress |
| `.sl-stack` + `.sl-legend` (+ `.sl-seg1..4`) | pasek składu danych | v3, trening |
| `.sl-people` / `.sl-person` + `.sl-avatar` | siatka ludzi (zdjęcie grayscale lub inicjały) | team, zespol |

Figury/panele = **reuse `.sl-art`**. Lejek (drabina), zagnieżdżone siatki = składane z istniejących (`.sl-cols` w `.sl-entry`).

**Bramka Fazy 0:** `npm run build` zielony, strona główna bez regresji, kit widoczny na 4 próbkach.

---

## Mapowanie lab.css → slayer.css (cheatsheet)

`.sec`→`.sl-sec` · `.inner`→`.sl-inner` · `.phero`→`.sl-hero` (w `.sl`) · `.kick`→`.sl-eye` · `.ghead`/`.shead`→`.sl-eye`+`.sl-h2` (lub `.sl-mast` z wielkim indeksem) · `.btn/.btn-p/.btn-s`→`.sl-btn/.sl-btn-p/.sl-btn-s` · `.grid/.grid.c2/.c3/.auto`→`.sl-cols` (lub `.sl-bento` dla asymetrii) · `.cell`→`.sl-col` · `.chip`→`.sl-chip` · `.tbl`/`table`→`.sl-tbl` (+`.sl-c/.sl-s/.sl-dn/.sl-win`) · `.note`→`.sl-note` · `.tl`/`.ph`→`.sl-steps`/`.sl-step` · `.muted/.dim`→`var(--sl-mut)/var(--sl-dim)`.

**Zawsze:** usuń gradienty i `border-radius` (inline `<style>` na team/zespol/propozycja/trening/styl/wiedza/drabina/roadmap — wytnij gradient+radius, przepisz na tokeny/prymitywy). Nagłówek sekcji → rozważ `.sl-mast` z gigantycznym indeksem tam, gdzie sekcje są numerowane.

---

## Pionowy plaster (próbki — budowane po Fazie 0)

Po jednej z najtrudniejszych rodzin, do walidacji kitu:

1. **datasety** — tabele (`.sl-tbl`) + nazwane kolumny (`.sl-cols`) + `.sl-note`. Dowód: archetyp „statyczna proza + tabele".
2. **roadmap** — `.sl-steps`/`.sl-step` + `.sl-status` + siatka call-for-contributions. Dowód: timeline/kroki.
3. **leaderboard** — DYNAMICZNA: client `LeaderboardLive` (fetch 45s) — reskin tabeli + masthead wyniku, **JS nietknięty**. Dowód: dynamiczna + tabela.
4. **team** — siatka ludzi, **usunięcie gradientów+radius**, `.sl-people`/`.sl-avatar` (grayscale). Dowód: ludzie + odśmiecanie inline CSS.

**→ CHECKPOINT: Martyna ogląda na żywo, docieramy kit.**

---

## Fale (reszta ~20 stron — po zatwierdzeniu plastra)

- **Fala A — statyczne (niskie ryzyko):** kierunki, rules, closed-benchmarks, zadania, bielik-dane, bielik-benchmarki.
- **Fala B — kroki + wykresy:** drabina, trening, v3, wiedza, styl, propozycja.
- **Fala C — indeks + artykuł:** eng-log, eng-log/[slug].
- **Fala D — DYNAMICZNE (wysokie ryzyko, JS-preserving):** benchmarks, eksperymenty, bench-explorer, bench-explorer/nowy, progress, zespol.

Każda strona: subagent (reskin) → review zgodności + jakości → commit. Checkpoint po każdej fali.

---

## Weryfikacja (każda strona)

1. `npm run build` zielony (lub dev `curl` 200, brak error-overlay).
2. Brak `className="` bez prefiksu `sl-` w zmigrowanym `<main className="sl">` (poza wyjątkami: native el. w client-logic).
3. Dynamiczne: potwierdzić, że hooki/fetch/stan zostały (diff nie rusza `use client`, `useState`, `useEffect`, `fetch`, importów danych).
4. Zero gradientów / `border-radius` w wyniku.
5. Kontrast WCAG AA na nowych kolorach (status/chip).

**Brak frameworka testów — `npm run build` to bramka.** Praca lokalna na bieżącej gałęzi, bez push (stała zasada).
