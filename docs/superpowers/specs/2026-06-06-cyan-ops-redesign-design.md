# Redesign Slayer — „Cyan Ops" (klasyczny Arwes) — delta względem Amber HUD

**Data:** 2026-06-06
**Status:** zatwierdzony (podgląd: `2026-06-06-cyan-ops-preview.html`)
**Baza:** gałąź `BrunatnyCzar` (pełny redesign Amber HUD) → gałąź `redesign-cyan-ops`.
Spec bazowy: `2026-06-06-amber-hud-redesign-design.md` — obowiązuje wszystko poza deltami niżej.

## Decyzje

| Pytanie | Decyzja |
|---|---|
| Kierunek | **Cyan Ops** — klasyczny Arwes (Star Citizen/Halo): granat + cyjan, siatka, glow |
| Detale terminalowe | **Usunięte** — czysty Arwes; bez promptu shella, prefiksów `> `/`// `, nawiasów, kursora ▌ |
| Intensywność, dźwięki | bez zmian (wyważona; brak dźwięków) |

## Tokeny (delta)

| Token | Amber HUD | Cyan Ops |
|---|---|---|
| `--bg` / `--bg2` | `#0b0700` / `#120c03` | `#020c10` / `#04131a` |
| `--panel` / `--panel2` | `#161003` / `#1d1605` | `#06181f` / `#0a2129` |
| `--ink` / `--txt` | `#ffe8bd` / `#d8c9a4` | `#dffdff` / `#b8d4d8` |
| `--mut` / `--dim` | `#a8946a` / `#8a7a5e` | `#7fa3a9` / `#5f8489` (dim rozjaśnione vs podgląd `#577a80` — kontrast ≥4.5:1) |
| `--acc` / `--acc-d` / `--acc-ink` | `#ffb000` / `#cc8d00` / `#0b0700` | `#00f8ff` / `#00c4ca` / `#021114` |
| `--acc-soft` | `rgba(255,176,0,.12)` | `rgba(0,248,255,.1)` |
| nowy `--sec` / `--sec-soft` | — | `#ffd76e` / `rgba(255,215,110,.12)` — **challenger (Qwen), warn**; klasyczna para Arwes cyjan+żółty |
| `--alert` / `--alert-soft` | `#ff5a26` (alerty **i** Qwen) | `#ff6b5e` / `rgba(255,107,94,.12)` — **wyłącznie błędy/fail** |
| `--good` / `--blue` / `--amber` | bursztyn/bursztyn-dim/pomarańcz | `#00f8ff` / `#7fa3a9` / `#ffd76e` |
| `--line` / `--line2` | bursztyn .28/.12 | cyjan `.3`/`.14`, **solid** (koniec `dashed`) |

## Typografia (delta)

- `--disp` i nowy `--sans`: **Titillium Web** (300/400/600/700) — oficjalny font Arwes; nagłówki 700 uppercase, letter-spacing ~.03em.
- Body: `var(--sans)` 16px/1.62 (koniec pełnego mono). `--mono` (IBM Plex Mono) zostaje dla danych: kickery, etykiety, tabele liczbowo, panel-top, stopka.
- Import fontów: Titillium Web + IBM Plex Mono (wylatuje Share Tech Mono).

## Detale (delta)

| Element | Amber HUD | Cyan Ops |
|---|---|---|
| `.kick::before` | `"> "` | `"▸ "` (cyjan) |
| `.cell .n::before` | `"// "` | brak prefiksu |
| Aktywny link nav | `[nawiasy]` | cyjan + glow (bez nawiasów) |
| `.hmeta` | `[nawiasy]` | bez nawiasów |
| Kursor ▌ w hero | jest | **usunięty** (rule + span) |
| Stopka | prompt `slayer@lab:~$ ` | bez promptu |
| Obramowania `dashed` | wszędzie | **solid** |
| Scanlines CRT (hero/phero/panel) | są | **zastąpione siatką liniową** 24px (hero/phero); panele czyste |
| Przyciski | prostokąty, primary wypełniony | **ścięte rogi** (`clip-path`), primary = cyjan outline + translucentne wypełnienie + glow |
| LIVE | czerwień (alarm) | **cyjan** (spokojny „online") |
| Pille/paski Qwen (`.vb.q`, `.track i.q`) | czerwień | **żółty `--sec`** |
| Scoreline Qwen (JS index) | `var(--acc)` dla zwycięzcy | zwycięzca-Qwen → `var(--sec)`; zwycięzca-Bielik → `var(--acc)` |

Bez zmian: narożniki HUD (`.cnr`), scanbeam (przebarwiony na cyjan), animacje wejścia `.rev`/`.in`,
cały `site.js`, kanciastość (`--rad:0`), reduced-motion, semantyka czerwieni dla `.msg.err`/`.step.fail`/`.lv`.

## Zmiany w plikach

1. `assets/lab.css` — rewrite wartości + detali wg powyższych delt (selektory bez zmian; usunięta reguła `.cursor` i prompt stopki).
2. `index.html` — usunięcie `<span class="cursor">` i reguły nawiasów `.hmeta`; `hero::after` scanlines → siatka; hardcoded `rgba(255,176,0,…)` → `rgba(0,248,255,…)`; h1 letter-spacing `.03em` i rozmiar `clamp(2.4rem,5.4vw,4rem)` (Titillium węższy od mono); JS: zwycięski Qwen → `var(--sec)`.
3. Podstrony — sed: `255,176,0` → `0,248,255` (kierunki, roadmap, trening, zespol, benchmarks, index); progress: `#ffc94d` → `#7ffcff`, `rgba(11,7,0,.65)` → `rgba(2,12,16,.65)`.
4. `site.js`, pliki Python, `vercel.json` — bez zmian.

## Weryfikacja

Jak w planie bazowym: 11×200 (czyste URL-e przez `npx serve`), grepy zerowe (`255,176,0`, `#ffc94d`, `Share Tech`, `cursor`, `slayer@lab`), skrypt kontrastu WCAG dla nowych par, reduced-motion, breakpointy.
