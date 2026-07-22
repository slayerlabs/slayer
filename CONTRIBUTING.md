# Współpraca przy Slayer

Slayer to otwarte polskie laboratorium LLM. Cel: złożyć konkurencyjny polski model
**super tanio, w pełni otwarcie i odtwarzalnie**, o epsilon lepszy od punktu odniesienia,
**bez benchmaxxingu**. Ten dokument zbiera zasady, które trzymają jakość i wiarygodność tej roboty.

Krótko: **żadnej tezy bez dowodu.** Każda liczba ma być reprodukowalna, każdy wynik mierzony czysto.

---

## Jak kontrybuować

1. **Fork + Pull Request.** Pracujemy przez forki (zewnętrzni kontrybutorzy nie mają write do `slayerlabs/slayer`).
2. **Małe, skupione PR-y.** Jeden PR = jedna sprawa. Łatwiej zrecenzować, łatwiej cofnąć.
3. **Issue-driven.** PR domyka konkretny issue (`Closes #NN`). Nie ma issue? Załóż albo opisz problem w PR.
4. **Opisz dowód.** W PR podaj jak to zweryfikowałeś (komenda, wynik, liczby). „Działa u mnie" to nie dowód.
5. Po polsku. Dokumentacja, komentarze i opisy PR po polsku (kod i nazwy API mogą być po angielsku).

---

## Zasada czystości (no benchmaxxing) — to jest święte

To jest fundament projektu. Złamanie tego unieważnia cały pomiar.

- Zbiory **ewaluacyjne** (LLMzSzŁ, PES, PoQuAD, Belebele, FLORES, regresja EN) służą **wyłącznie do pomiaru**. Nigdy w treningu.
- Zdolności budujemy na **niezależnych danych**; benchmark tylko weryfikuje uogólnienie na held-out.
- Mierzymy **tylko publiczne, pobieralne, deterministyczne** zbiory. Zamknięte (EQ-Bench, CPTUB, PLCC) trzymamy osobno.
- Korpusy treningowe **przechodzą dekontaminację** względem zbiorów testowych:
  - `bench/decon_audit.py` — kontaminacja dosłowna (verbatim, wspólny n-gram słów),
  - `bench/decon_neardup.py` — warstwa diakrytyków (`zażółć` -> `zazolc`) i near-dup.
  - Dekontaminacja jest **fail-loud**: brak źródła ewaluacyjnego = głośny warning i niepełne pokrycie, nie ciche przejście.
- Walidację „epsilon lepszy" rób na **prywatnym held-out** wolnym od wycieków, nie na publicznym 5-shot.

Jeśli Twój PR dotyka danych treningowych albo ewaluacji, w opisie wprost odpowiedz: **czy to mogło dotknąć zbioru testowego?**

---

## Reprodukowalność

- **Determinizm i seedy.** Pomiary biorą jawny seed (`bench <nazwa> <N> <seed>`), zwykle wiele seedów. Bez ukrytej losowości.
- **Agregaty, zero inspekcji itemów.** Liczymy accuracy/metryki zbiorczo (liczniki per-kategoria), nie zaglądamy w pojedyncze itemy testowe (to też anty-kontaminacja).
- **Idempotencja.** Benche pomijają wynik dla `(bench, seed)`, który już istnieje. Re-run nie psuje danych.
- **Jeden command -> jeden wynik.** Skrypt ma dać się odpalić bez ręcznego dłubania; wynik ląduje w `results/` lub `public/results/` jako JSON.
- **Stamp i źródło.** Raport zapisuje co, kiedy i z jakich źródeł policzono.

---

## Styl kodu

- **Python 3.10+.** Instalacja: `pip install -e .` albo `uv sync`.
- **Narzędzia (decon, audyty) trzymaj na stdlib i CPU**, gdzie się da. Mniej zależności = łatwiej uruchomić każdemu.
- **Przypinaj wersje** zależności, które potrafią się ruszyć (transformers/trl/peft itp.). API tych bibliotek bywa ruchome między wersjami.
- **Docstring z usage** na górze skryptu: po co jest, jak odpalić, jakie opcje. Patrz `bench/bench_mcq.py`, `bench/decon_neardup.py` jako wzorzec.
- **Guardy na brzegi.** Pusta próbka (`n=0`), `None` w danych, brak modelu: zwróć sensowną wartość albo czytelny komunikat, nie wywal się `ZeroDivisionError` ani `format(None)`.
- **Nowy detektor = fixture + kontrola false-positive.** Jeśli dodajesz wykrywanie (kontaminacji, near-dup, błędów), dołóż mały przykład pokazujący co łapie ORAZ czego nie powinno łapać (patrz `bench/fixtures/neardup_demo/`).
- **Reużywaj silników.** Nie duplikuj logiki: nowa warstwa stoi na istniejącym module (np. `decon_neardup` używa `decon_audit` jako silnika).

---

## Dane

- **Szanuj ToS i licencje.** Nie redystrybuujemy danych gated ani thesession.org/CKE itp. w repo.
- **Dostarcz skrypt odbudowy** zamiast surowych danych (np. `prepare_data.py` z publicznego dumpu). Dane robocze trzymamy poza repo (`.gitignore`).
- Zbiory gated (np. FLORES) wymagają `HF_TOKEN` — udokumentuj to.
- Dane treningowe **dekontaminuj** (sekcja czystości) i opisz pochodzenie.

---

## Ewaluacja i bench

- Sygnatura: `python3 bench/<bench>_*.py <N|0=full> <seed>`. `N=0` to pełny zbiór.
- Metryka decydująca: zwykle **accuracy** (MCQ) albo wskazany w danym benchu (chrF, exact match, sędzia-LLM).
- Wynik do `results/leaderboard.json` / `results/status.json` przez `bench/make_dashboard.py`.
- Dodajesz nowy benchmark? Trzymaj wzorzec istniejących loaderów (skip wierszy z `None`, mapowanie gold, `cat=subject`, rejestracja w słowniku loaderów).

---

## Przegląd (review)

- Recenzja jest **adwersarialna z założenia**: recenzent szuka dziur, nie przyklepuje.
- Najmocniejszy recenzent ma **exit code**: zanim coś zgłosisz jako działające, **uruchom to** (test, realny przebieg, generacja). Failujący test bije każdą opinię.
- Druga para oczu (człowiek lub automat) mile widziana, ale nie zastępuje uruchomienia.

---

## Licencja

Kod: **MIT** (patrz [LICENSE](LICENSE)). Wyniki i metodyka są otwarte. Kontrybuując, zgadzasz się na wydanie swojego wkładu na tej licencji.

Dzięki, że budujesz to z nami. Więcej prób na bramkę dla całej polskiej sceny AI.
