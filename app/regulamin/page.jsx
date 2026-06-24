export const metadata = {
  title: "Regulamin kursu AI from scratch | Fabryka AI",
  description:
    "Regulamin kursu AI from scratch: zasady dostepu, zwrotow, komunikacji i korzystania z materialow.",
};

const css = `
  .legalgrid{display:grid;grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr);gap:18px;align-items:start}
  .legalcard{border:1px solid var(--line);border-radius:var(--rad);background:#fff;padding:24px;box-shadow:0 14px 38px rgba(35,36,48,.07)}
  .legalcard h2{margin:0 0 10px;font-family:var(--display);font-size:1.35rem;font-weight:600;letter-spacing:-.01em;color:var(--ink)}
  .legalcard h3{margin:22px 0 8px;font-size:1rem;color:var(--ink)}
  .legalcard p,.legalcard li{color:var(--mut);font-size:.98rem;line-height:1.65}
  .legalcard p{margin:0 0 12px}
  .legalcard ul,.legalcard ol{margin:0;padding-left:20px}
  .legalcard li+li{margin-top:8px}
  .legalmeta{display:grid;gap:10px}
  .legalmeta div{border-top:1px solid var(--line2);padding-top:10px}
  .legalmeta div:first-child{border-top:0;padding-top:0}
  .legalmeta b{display:block;color:var(--ink);font-size:.92rem}
  .legalmeta span{display:block;color:var(--mut);font-size:.92rem}
  @media(max-width:860px){.legalgrid{grid-template-columns:1fr}}
`;

export default function RegulaminPage() {
  return (
    <>
      <style>{css}</style>
      <section className="phero">
        <div className="inner">
          <span className="kick">kurs · AI from scratch · regulamin</span>
          <h1>Regulamin kursu <em>AI from scratch</em></h1>
          <p>
            Prosty kontrakt uczestnictwa: dostep do kursu i spolecznosci,
            uczciwe korzystanie z materialow oraz mozliwosc zwrotu w ciagu 30 dni
            od zakupu bez podawania przyczyny.
          </p>
        </div>
      </section>

      <section className="sec tight">
        <div className="inner legalgrid">
          <aside className="legalcard">
            <span className="kick">tl;dr</span>
            <h2>Najwazniejsze zasady</h2>
            <div className="legalmeta">
              <div>
                <b>Zwrot</b>
                <span>30 dni od zakupu, no questions asked.</span>
              </div>
              <div>
                <b>Dostep</b>
                <span>Materialy kursowe i komunikacja spolecznosciowa, w tym Discord.</span>
              </div>
              <div>
                <b>Kontakt</b>
                <span>Napisz przez Discord albo na k.wikiel@gmail.com.</span>
              </div>
              <div>
                <b>Wersja</b>
                <span>Obowiazuje od 22 czerwca 2026 r.</span>
              </div>
            </div>
          </aside>

          <main className="legalcard">
            <h2>1. Postanowienia ogolne</h2>
            <p>
              Regulamin okresla zasady uczestnictwa w kursie "AI from scratch"
              prowadzonym w ramach Fabryka AI. Kurs ma charakter edukacyjny
              i dotyczy praktycznego uczenia sie budowy oraz trenowania systemow AI.
            </p>
            <p>
              Kupujac dostep do kursu albo dolaczajac do jego przestrzeni roboczej,
              akceptujesz ten regulamin oraz zasady komunikacji obowiazujace w
              spolecznosci kursu.
            </p>

            <h2>2. Dostep do kursu</h2>
            <ul>
              <li>Dostep obejmuje materialy kursowe, aktualizacje i kanaly komunikacji wskazane przy zakupie.</li>
              <li>Dostep jest przeznaczony dla osoby, ktora go kupila, chyba ze ustalono inaczej na pismie.</li>
              <li>Organizator moze zmieniac kolejnosc, zakres i forme materialow, jesli sluzy to aktualnosci kursu.</li>
            </ul>

            <h2>3. Zwroty</h2>
            <p>
              Uczestnik moze poprosic o zwrot oplaty w ciagu 30 dni od zakupu.
              Nie wymagamy podawania przyczyny. Wystarczy wiadomosc przez kanal
              kontaktu uzyty przy kursie, przez Discord albo na k.wikiel@gmail.com.
            </p>
            <p>
              Zwrot wykonujemy ta sama metoda platnosci, o ile operator platnosci
              technicznie to umozliwia. Jesli potrzebne beda dodatkowe dane do
              identyfikacji platnosci, poprosimy tylko o informacje niezbedne do
              obslugi zwrotu.
            </p>

            <h2>4. Zasady korzystania z materialow</h2>
            <ul>
              <li>Materialy kursowe sa przeznaczone do nauki wlasnej uczestnika.</li>
              <li>Nie publikuj pelnych materialow kursu, nagran, linkow dostepowych ani prywatnych fragmentow spolecznosci bez zgody organizatora.</li>
              <li>Mozesz uzywac wiedzy, notatek i kodu, ktory samodzielnie tworzysz w ramach nauki, w swoich projektach.</li>
            </ul>

            <h2>5. Komunikacja i spolecznosc</h2>
            <p>
              Czesc kursu moze dzialac na Discordzie. Uczestnicy powinni komunikowac
              sie rzeczowo, bez spamu, naduzyc, podszywania sie pod inne osoby,
              udostepniania cudzych danych oraz dzialan utrudniajacych prace grupy.
            </p>
            <p>
              W razie naruszen mozemy ograniczyc dostep do spolecznosci lub kursu.
              W typowych sytuacjach najpierw wyjasniamy problem, chyba ze naruszenie
              jest powazne albo wymaga natychmiastowej reakcji.
            </p>

            <h2>6. Odpowiedzialnosc</h2>
            <p>
              Kurs ma charakter edukacyjny. Nie gwarantujemy konkretnego wyniku
              biznesowego, zawodowego ani finansowego po jego ukonczeniu. Uczestnik
              odpowiada za sposob wykorzystania wiedzy i narzedzi poznanych w kursie.
            </p>

            <h2>7. Dane osobowe</h2>
            <p>
              Zasady przetwarzania danych osobowych opisuje
              {" "}<a className="acc" href="/polityka-prywatnosci">Polityka prywatnosci</a>.
            </p>

            <h2>8. Zmiany regulaminu</h2>
            <p>
              Regulamin moze byc aktualizowany, zwlaszcza gdy zmienia sie sposob
              prowadzenia kursu, narzedzia komunikacji albo wymagania prawne. Zmiany
              nie ograniczaja praw nabytych, w tym prawa do 30-dniowego zwrotu dla
              zakupow dokonanych przed zmiana.
            </p>
          </main>
        </div>
      </section>
    </>
  );
}
