# Redesign Slayer — „Amber HUD" (estetyka inspirowana Arwes)

**Data:** 2026-06-06
**Status:** zatwierdzony kierunek, czeka na plan implementacji
**Podgląd referencyjny:** `docs/superpowers/specs/2026-06-06-amber-hud-preview.html` (otwórz w przeglądarce)

## Cel

Całkowita zmiana estetyki strony slayer.fabryka.ai — z obecnego „ciepłego ivory/clay"
(styl Anthropic) na **bursztynowy retro-terminal / wojskowy HUD** inspirowany frameworkiem
[Arwes](https://github.com/arwes/arwes) (klimat: konsola operatora, Alien, CRT).

## Decyzje (z brainstormingu)

| Pytanie | Decyzja |
|---|---|
| Kierunek wizualny | **Amber HUD** — bursztyn na ciepłej czerni, monospace, scanlines (rozważane: cyan Arwes, synthwave) |
| Intensywność efektów | **Wyważona** — hero pełnoklimatyczne, strony z treścią/tabelami czytelne; neon tylko na akcentach |
| Dźwięki (bleeps Arwes) | **Brak** — czysto wizualna estetyka |
| Podejście techniczne | **Czysty CSS retheme** + mały vanilla JS; bez pakietów Arwes (alpha), bez Reacta, bez build stepu |

## Architektura (bez zmian strukturalnych)

Site pozostaje statyczny: 11 stron HTML + współdzielony `assets/lab.css` (design system)
+ `assets/site.js` (wstrzykiwany nav/footer). Vercel serwuje pliki wprost. Zmieniają się
wartości, nie architektura.

## Design tokens (`assets/lab.css` → `:root`)

| Token | Wartość | Rola |
|---|---|---|
| `--bg` / `--bg2` | `#0b0700` / `#120c03` | tła sekcji (ciepła czerń CRT) |
| `--panel` / `--panel2` | `#161003` / `#1d1605` | tła kart, paneli, hover wierszy |
| `--ink` | `#ffe8bd` | nagłówki, tekst wyróżniony |
| `--txt` | `#d8c9a4` | tekst podstawowy |
| `--mut` / `--dim` | `#a8946a` / `#7a6a4a` | tekst drugorzędny / metadane |
| `--acc` | `#ffb000` | bursztyn — akcent główny (+ glow `rgba(255,176,0,.x)`) |
| `--acc-soft` | `rgba(255,176,0,.12)` | tła akcentowe |
| `--alert` / `--alert-soft` | `#ff5a26` / `rgba(255,90,38,.12)` | czerwień — LIVE, challenger (Qwen), alerty |
| `--line` / `--line2` | `rgba(255,176,0,.28)` / `rgba(255,176,0,.12)` | obramowania (często `dashed`) |
| `--disp` | `"Share Tech Mono", monospace` | nagłówki + UI (uppercase) — **zastępuje `--serif`** |
| `--mono` | `"IBM Plex Mono", monospace` | body + dane |
| `--rad` | `0` | brak zaokrągleń — HUD jest kanciasty |

Usuwane tokeny: `--serif`, `--sans` (body przechodzi na `--mono`), `--good`/`--blue`/`--amber`
zastąpione semantyką bursztyn/czerwień (chipy kolorystyczne mapują się na `--acc`/`--alert`/`--dim`).
Import Google Fonts: tylko `Share Tech Mono` + `IBM Plex Mono` (wylatują Hanken Grotesk, Newsreader).

## Typografia

- Nagłówki (`h1`, `h2`, `h3`, `.shead`, `.phero`): `--disp`, uppercase, waga 400 (font jest jednowagowy), letter-spacing ~.02em.
- `em` w nagłówkach: **bez italic** — kolor `--acc` + text-shadow glow.
- Body: `--mono` 15.5px / 1.66 — IBM Plex Mono jest projektowany do czytania dłuższych tekstów.
- Kickery/etykiety: `--disp` z terminalowymi prefiksami (patrz niżej).

## Język terminalowy (detale charakterystyczne)

- Kickery z promptem: `> 01 · TEZA` (prefiks `> ` przez `::before`, kolor `--acc`)
- Etykiety kart `.cell .n`: prefiks `// `
- Aktywny link nav w nawiasach: `[leaderboard]` (`::before`/`::after`)
- Metryki hero w nawiasach: `[10 benchmarków]`
- Migający blokowy kursor `▌` za nagłówkiem hero (`animation: steps(2)`)
- Stopka jak shell: prefiks `slayer@lab:~$ `
- Separatory `.rule` i wewnętrzne obramowania: `dashed`

## Komponenty (ten sam HTML i klasy, nowa skórka)

| Komponent | Nowy wygląd |
|---|---|
| `.nav` | czarna translucentna + blur, dolna linia bursztynowa; brand `S` na bursztynowym bloku |
| `.btn-p` | prostokąt wypełniony bursztynem, czarny tekst, glow; hover jaśniejszy |
| `.btn-s` | bursztynowy outline na `--acc-soft` |
| `.ncta` | jak `.btn-p`, mniejszy |
| `.panel` | ciemny + 4 świecące narożniki HUD (wstrzykiwane przez JS), nagłówek oddzielony `dashed` |
| `.cell` | cienka ramka `--line2`; hover: jaśniejsza ramka, translateY(-2px), glow, narożniki tl/br przez `::before/::after` |
| `.tbl` / `table` | nagłówki bursztyn mono na `rgba(255,176,0,.06)`, separatory wierszy `dashed`, zwycięskie wyniki `--acc` + glow |
| `.vb` (pill werdyktu) | `.b` (Bielik) bursztyn / `.q` (Qwen) czerwień |
| `.track` | pasek bursztyn z glow; wariant `.q` czerwień |
| `.live` | czerwień + migająca kropka `steps(2)` |
| `.chip` | outline mono; warianty kolorów mapowane na bursztyn/czerwień/dim |
| formularze | ciemne pola, bursztynowy focus ring |
| `.note` | lewa krawędź bursztynowa, tło `--panel` |
| hero | radialna poświata bursztynowa, scanlines CRT, kursor ▌ |

## Efekty i animacje

| Efekt | Implementacja |
|---|---|
| Animacje wejścia | `IntersectionObserver` w `site.js`. Cele (nadawane automatycznie przez JS, bez edycji HTML): bezpośrednie dzieci `.hgrid > div` w hero, `.shead`, bezpośrednie dzieci `.grid`, `.panel`, `.tbl`, `.tl`, `.note`. Wejście w viewport → klasa `.in` → fade + translateY; kaskada przez `transition-delay` wyliczany z indeksu elementu (max .36s) |
| Scanlines CRT | statyczny `repeating-linear-gradient` overlay na hero i panelach |
| Wiązka skanująca | jeden element `div.scanbeam` (dodawany przez `site.js`), animacja `transform` 7s loop |
| Kursor, LIVE dot | czysty CSS `steps(2)` |
| Hover karty/przyciski | czysty CSS |

**Dostępność:** wszystkie animacje w `@media (prefers-reduced-motion: no-preference)`.
Kontrast: `--txt` na `--bg` ≈ 11:1, `--acc` na `--bg` ≈ 9:1 — WCAG AA spełnione
(zweryfikować po implementacji dla `--mut`/`--dim` na tłach paneli).

## Zmiany w plikach

1. `assets/lab.css` — pełny rewrite (tokeny + wszystkie komponenty). Klasy i selektory bez zmian.
2. `assets/site.js` — bez zmian w nav/footer markup; dochodzi: observer animacji wejścia,
   dekorator narożników (4× `<i class="cnr">` do każdego `.panel`), wstawienie `.scanbeam`.
3. **11 podstron** — audyt bloków `<style>`:
   - `var(--serif)` → `var(--disp)` — zweryfikowane greppem: 6 wystąpień w 4 plikach
     (`index.html` ×2, `progress.html` ×2, `benchmarks.html`, `leaderboard.html`);
     `var(--sans)` nie występuje w żadnej podstronie (tylko wewnątrz `lab.css`),
   - usunięcie `font-style:italic` przy nagłówkach,
   - hardcoded kolory gliny `rgba(190,85,53,…)` → odpowiedniki na tokenach,
   - `index.html`: kursor ▌ w hero h1.
4. Bez zmian: pliki Python, `bench/`, `results/`, `README.md`, `vercel.json`.

## Zakres

- **W zakresie:** wszystkie strony HTML (index, benchmarks, closed-benchmarks, datasety,
  kierunki, leaderboard, progress, roadmap, trening, zadania, zespol), nav, footer.
- **Poza zakresem:** dźwięki, favicon/OG-images, treść (teksty bez zmian), README, kod Pythona.

## Plan weryfikacji

1. Serwer lokalny (`python3 -m http.server 8000`) — przejście wszystkich 11 podstron.
2. Live-fetch leaderboardu na index/leaderboard/progress działa i dobrze wygląda
   (inline JS ustawia kolory przez `var(--acc)` — przechodzi automatycznie).
3. Kontrast WCAG AA dla par tekst/tło (w tym `--mut` na `--panel`).
4. `prefers-reduced-motion` — strona w pełni używalna bez animacji.
5. Breakpointy mobilne (900px, 820px, 780px, 680px — istniejące media queries).
6. Praca na gałęzi `redesign-amber-hud`.
