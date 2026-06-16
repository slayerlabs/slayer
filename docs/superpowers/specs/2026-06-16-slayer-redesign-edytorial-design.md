# Slayer — redesign frontu: język wizualny „Ciemny Edytorial"

- **Data:** 2026-06-16
- **Status:** zaakceptowany kierunek (brainstorming) → do review przed planem implementacji
- **Zakres tego specu:** system designu + strona główna jako flagowiec
- **Gałąź:** `redesign-edytorial` (lokalna, bez pusha)

---

## 1. Cel i kontekst

Pełny restyle **wyglądu** strony (nie treści). Cel: nowocześnie, profesjonalnie, ale **niebanalnie** — świadomie daleko od generycznego „AI-startup" (granat + tęczowy gradient fiolet/cyan).

Stack: **Next.js 15 + React 19** (App Router), obecnie czysty CSS (`styles/lab.css` — jedno źródło prawdy), 23 strony, komponenty `Nav` i `Footer`. Brak Tailwind / UI-frameworka.

**Zasada nadrzędna designu:** *typografia + liczby + listy = grafika.* Strona nie ma zdjęć — to **dane** (benchmarki, modele, kierunki, koszty) niosą wartość wizualną. Klimat: **dziennik badawczy + terminal**, edytorialnie.

## 2. Zakres i dekompozycja

- **Spec #1 (ten):** system designu (tokeny, typografia, dingbaty, komponenty) + **strona główna** (`app/page.jsx`, `app/home-live.jsx`) jako flagowiec.
- **Później (osobne cykle):** pozostałe 22 strony, mechanicznie wg systemu — każda własny spec/plan.
- **Poza zakresem (na teraz):** zmiana treści; framework UI (shadcn/Tailwind); zależność `performative-ui` (to satyra — pomysły podkradamy ręcznie); rozbudowane animacje/FX (osobny, późniejszy krok).

## 3. Język wizualny

### 3.1 Paleta (ciemny, jeden akcent)

Jeden ciemny motyw. Akcent = **Polish Crimson** (ukłon w biało-czerwone, tożsamość; rzadki w AI). Bez gradientów tęczowych.

| Token | Wartość | Użycie |
|---|---|---|
| `--bg` | `#0d0a0b` | tło bazowe (ciepła czerń) |
| `--ink` | `#ece4e0` | nagłówki, tekst mocny |
| `--txt` | `#b9adad` | tekst podstawowy |
| `--mut` | `#8a7d7d` | tekst drugorzędny, labelki |
| `--dim` | `#6e6063` | przypisy, stopka |
| `--acc` | `#fb4d68` | akcent na ciemnym (nagłówki-akcenty, liczby, CTA) |
| `--acc-strong` | `#ec2b4f` | tła przycisków, mocne plamy |
| `--acc-soft` | `rgba(236,43,79,.12)` | chipy, podświetlenia |
| `--line` | `rgba(255,255,255,.12)` | linie strukturalne |
| `--line2` | `rgba(255,255,255,.06)` | delikatne podziały |

Kontrast/dostępność: cienkie wersaliki (waga 300) na ciemnym — tekst krytyczny min. `--ink`/`--txt` (nie `--dim`); patrz §5.

### 3.2 Typografia

Dwa kroje (zwięzły system):

- **Display / nagłówki:** **Archivo**, waga **300**, **WERSALIKI**, tracking ≈ `-0.01em`. Cienko, wielko, elegancko (energia magazynu).
- **Tekst / body:** Archivo **400** (neutralny grotesk; do potwierdzenia: ewentualnie Inter — §7).
- **Mono — labelki, eyebrow, liczby-jako-etykiety, przypisy, dane:** **JetBrains Mono**.

Skala (desktop, do sklampowania na mobile):

| Element | Krój / waga | Rozmiar | Uwaga |
|---|---|---|---|
| Hero H1 | Archivo 300 caps | `clamp(40px, 7vw, 64px)` | line-height ≈ .98 |
| Sekcja H2 | Archivo 300 caps | `clamp(26px, 4vw, 34px)` | |
| Wielka liczba | Archivo 300 | `clamp(40px, 6vw, 60px)` | kluczowe → `--acc` |
| Lede | Archivo 400 | `~14.5px` | `--txt`/`--mut` |
| Body | Archivo 400 | `~13–15px` | |
| Eyebrow / label / przypis | JetBrains Mono | `9–10px`, letter-spacing `.14em`, UPPERCASE | `--acc` lub `--mut` |

**Wielkie liczby** to pierwszorzędny element (benchmarki, koszty, statystyki) — duże, cienkie, kluczowe w karmazynie.

### 3.3 System dingbatów (zamiennik grafik, czysty Unicode)

| Rodzina | Znaki | Użycie |
|---|---|---|
| Sygnatura | `✦` (główny) · `✳ ✴ ❖` (warianty) | eyebrow, znak marki |
| Znaczniki list | `◆` `▸` · `◇ ●` | etykiety kolumn, punktory |
| Przypisy / redakcyjne | `†` `‡` `⁂` `★` | markery przypisów; `⁂` jako przełamywacz sekcji |
| Strzałki | `→` `↗` | linki/CTA; `↗` = „na zewnątrz" (HF, GitHub) |
| Akcenty naukowe (ML) | `∇` `∑` `≈` | sekcje techniczne — **oszczędnie** |
| Separatory | `·` `—` | metadane, nawigacja, stopka |

Zasada: dingbat ma *znaczyć*, nie dekorować na siłę. Naukowe (`∇ ∑`) tylko tam, gdzie pasują merytorycznie.

### 3.4 Layout / siatka

- Edytorialnie: asymetria dozwolona, **dużo powietrza**, **hairline rules** (`--line`) jako struktura.
- **Nazwane kolumny** `01 — … / 02 — … / 03 — …` (labeled lists) jako podstawowy wzorzec pokazywania treści.
- Listy z **przypisami górnymi** `¹²³ ★` + sekcja przypisów pod spodem (mono).
- Maks. szerokość treści ~1140px; wielkie nagłówki mogą iść szerzej / pełną szerokością.

## 4. Komponenty (strona główna)

1. **Topbar / nav** — mono, wersaliki, brutalist „nameplate" (marka + linki + `✦ wejdź`). Sticky, hairline pod spodem.
2. **Hero** — eyebrow (`✦` + mono), wielki cienki wersalikowy H1 z karmazynowym akcentem na frazie, lede.
3. **Nazwane kolumny** — `01 dane / 02 trening / 03 ewaluacja`, każda labeled list z `◆ ▸` i przypisami.
4. **Pas wielkich liczb** — 4 duże liczby (np. `0.82`, `9`, `100%`, `~18k`) + mono-labelki; kluczowa w karmazynie.
5. **Benchmarki** — eyebrow `◆` + H2; tabela (mono nagłówki, karmazyn na zwycięskim wyniku, `★` przy naszym modelu); przypisy `¹²³★` pod spodem.
6. **Stopka** — mono, separatory `·`, `✦`.

Wspólne prymitywy: **przycisk** (primary `--acc-strong`/biały + ghost z `--line`), **chip** (`--acc-soft`), **przypis**, **hairline rule**, **wielka liczba**, **labeled list**.

Wizualny anchor (efemeryczny, poza repo): `.superpowers/brainstorm/.../home-v12.html`.

## 5. Implementacja (kierunek)

- **CSS:** zastąpić/rozszerzyć `styles/lab.css` nowym zestawem tokenów (jedno źródło prawdy zachowane). Rozważyć nowy plik `styles/slayer.css` i stopniowe wycofanie starych klas.
- **Fonty:** preferuj `next/font` (Archivo, JetBrains Mono) zamiast `@import` — wydajność + brak CLS. **Upewnić się o `latin-ext`** (polskie znaki: ł ą ę ś ż ź ć ń ó).
- **Komponenty React:** zaktualizować `components/Nav.jsx`, `components/Footer.jsx`; przebudować `app/page.jsx` + `app/home-live.jsx` na nowe komponenty (Hero, NamedColumns, StatBand, BenchTable, Footnotes).
- **Dostępność:**
  - Cienkie wersaliki (300) tylko dla **nagłówków**; długie teksty zawsze normalną wielkością liter i wagą 400+.
  - WERSALIKI w nagłówkach: dodać letter-spacing dla czytelności; treść semantyczna w naturalnej wielkości (transform tylko CSS-em).
  - Kontrast WCAG AA dla tekstu krytycznego (testować karmazyn `--acc` na `--bg`).
  - `prefers-reduced-motion` uszanować (gdy dojdzie ruch).
- **Responsywność:** nagłówki `clamp()`; kolumny 3→1, pas liczb 4→2 na mobile; tabela → scroll-x lub układ kart.
- **Wydajność:** minimalny CSS, brak ciężkich zależności.

## 6. Decyzje (od → do)

**Odrzucone:** shadcn + Tailwind (homogenizacja autorskiego klimatu); `performative-ui` jako zależność (satyra — tylko pomysły); gradient fiolet/cyan (generyczne); Syne / Archivo Expanded (za „kręcone"/szerokie); tryb jasny; pasek „live" w hero (za dużo).

**Wybrane:** ciemny edytorial; Polish Crimson; Archivo **cienkie wersaliki**; typografia/liczby/listy jako grafika; wielkie liczby; nazwane kolumny; przypisy; system dingbatów.

## 7. Otwarte pytania

1. **Body font:** Archivo 400 vs Inter? (drobne — domyślnie Archivo 400 dla 2-krojowego systemu).
2. **Finalna intensywność karmazynu** (`#fb4d68` vs lekko ciemniejszy).
3. **Ruch/animacje** — osobny przyszły krok (scroll-reveal, micro-interakcje)? Czy MVP statyczne.
4. **Dokładny zestaw dingbatów** — potwierdzić przy review (core: `✦ ◆ ▸ † ‡ ⁂ → ↗ ·`, + `∇ ∑ ≈` opcjonalnie).

## 8. Kryteria sukcesu

Strona główna w nowym języku, zgodna z mockupem `home-v12`, wdrożona w Next.js (komponenty + tokeny), **responsywna i dostępna**, z **zachowaną treścią**, gotowa jako wzorzec do rozłożenia na pozostałe strony.
