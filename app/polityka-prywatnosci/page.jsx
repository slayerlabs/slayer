export const metadata = {
  title: "Polityka prywatnosci kursu AI from scratch | Fabryka AI",
  description:
    "Polityka prywatnosci kursu AI from scratch: jakie dane przetwarzamy, Discord, prawa RODO i usuwanie danych.",
};

const css = `
  .legalgrid{display:grid;grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr);gap:18px;align-items:start}
  .legalcard{border:1px solid var(--line);border-radius:var(--rad);background:#121215;padding:24px;box-shadow:0 14px 38px rgba(0,0,0,.45)}
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

export default function PrivacyPage() {
  return (
    <>
      <style>{css}</style>
      <section className="phero">
        <div className="inner">
          <span className="kick">kurs · AI from scratch · prywatnosc</span>
          <h1>Polityka <em>prywatnosci</em></h1>
          <p>
            Zbieramy minimum danych potrzebnych do obslugi kursu i komunikacji.
            Czesc danych znajduje sie na Discordzie, bo tam dziala spolecznosc.
            Jesli chcesz cos usunac, napisz do nas - usuwamy dane, o ile nie musimy
            zachowac ich z powodow prawnych lub rozliczeniowych.
          </p>
        </div>
      </section>

      <section className="sec tight">
        <div className="inner legalgrid">
          <aside className="legalcard">
            <span className="kick">tl;dr</span>
            <h2>Jak traktujemy dane</h2>
            <div className="legalmeta">
              <div>
                <b>Minimum danych</b>
                <span>Kontakt, status dostepu, komunikacja i dane platnosci/rozliczen.</span>
              </div>
              <div>
                <b>Discord</b>
                <span>Wiadomosci, nick, role i aktywnosc moga byc przechowywane na Discordzie.</span>
              </div>
              <div>
                <b>Usuwanie</b>
                <span>Napisz na k.wikiel@gmail.com, jesli chcesz usunac lub poprawic dane.</span>
              </div>
              <div>
                <b>Organ nadzorczy</b>
                <span>Prezes Urzedu Ochrony Danych Osobowych (UODO).</span>
              </div>
            </div>
          </aside>

          <main className="legalcard">
            <h2>1. Administrator danych</h2>
            <p>
              Administratorem danych zwiazanych z kursem "AI from scratch" jest
              organizator kursu dzialajacy pod marka Fabryka AI. Kontakt
              w sprawach danych: k.wikiel@gmail.com, przez kanal kontaktu wskazany
              w kursie albo przez Discord.
            </p>

            <h2>2. Jakie dane przetwarzamy</h2>
            <ul>
              <li>dane kontaktowe, np. imie, e-mail, nick lub identyfikator Discord;</li>
              <li>informacje o zakupie, platnosci, fakturze, zwrocie i statusie dostepu;</li>
              <li>wiadomosci wyslane do nas lub na kanalach kursowych;</li>
              <li>dane techniczne potrzebne do bezpiecznego dzialania strony i formularzy, np. logi serwera.</li>
            </ul>

            <h2>3. Discord</h2>
            <p>
              Kurs moze korzystac z Discorda jako glownego miejsca komunikacji.
              Oznacza to, ze Twoj nick, identyfikator konta, role, wiadomosci,
              reakcje i aktywnosc w kanalach kursowych moga byc przechowywane przez
              Discord oraz widoczne dla innych uczestnikow zgodnie z ustawieniami
              serwera i kanalow.
            </p>
            <p>
              Jesli poprosisz nas o usuniecie danych, usuniemy dane, ktore kontrolujemy,
              np. role, notatki administracyjne i dostep. W przypadku tresci
              przechowywanych przez Discord czesc dzialan moze wymagac usuniecia
              wiadomosci w Discordzie albo skorzystania z narzedzi prywatnosci Discorda.
            </p>

            <h2>4. Po co przetwarzamy dane</h2>
            <ul>
              <li>zeby dac dostep do kursu i spolecznosci;</li>
              <li>zeby obslugiwac platnosci, zwroty, reklamacje i rozliczenia;</li>
              <li>zeby odpowiadac na wiadomosci i prowadzic komunikacje kursowa;</li>
              <li>zeby dbac o bezpieczenstwo, moderacje i jakosc spolecznosci;</li>
              <li>zeby wypelniac obowiazki prawne, podatkowe i rachunkowe.</li>
            </ul>

            <h2>5. Podstawy prawne</h2>
            <p>
              Dane przetwarzamy w szczegolnosci dlatego, ze jest to potrzebne do
              wykonania umowy o dostep do kursu, do wypelnienia obowiazkow prawnych,
              na podstawie naszego uzasadnionego interesu w prowadzeniu i zabezpieczaniu
              kursu oraz - tam, gdzie jest to wymagane - na podstawie zgody.
            </p>

            <h2>6. Jak dlugo trzymamy dane</h2>
            <p>
              Dane przechowujemy tak dlugo, jak jest to potrzebne do prowadzenia kursu,
              obslugi konta, zwrotow, reklamacji i rozliczen. Dane rozliczeniowe moga
              byc przechowywane przez okres wymagany przepisami podatkowymi i
              rachunkowymi. Dane spolecznosciowe usuwamy lub ograniczamy po otrzymaniu
              zasadnego wniosku, jesli nie ma powodu, zeby je dalej przechowywac.
            </p>

            <h2>7. Komu przekazujemy dane</h2>
            <p>
              Korzystamy z narzedzi potrzebnych do prowadzenia kursu, w szczegolnosci
              Discorda, operatorow platnosci, hostingu, poczty e-mail i narzedzi
              administracyjnych. Przekazujemy im tylko dane potrzebne do wykonania
              danej uslugi.
            </p>

            <h2>8. Twoje prawa</h2>
            <p>
              Masz prawo poprosic o dostep do swoich danych, kopie danych, sprostowanie,
              usuniecie, ograniczenie przetwarzania, przeniesienie danych, sprzeciw
              wobec przetwarzania oraz wycofanie zgody, jesli przetwarzanie odbywa sie
              na podstawie zgody.
            </p>
            <p>
              Masz tez prawo wniesienia skargi do Prezesa Urzedu Ochrony Danych
              Osobowych, jesli uznasz, ze przetwarzanie danych narusza przepisy RODO.
            </p>

            <h2>9. Jak usunac dane</h2>
            <p>
              Napisz do nas przez Discord albo kanal kontaktu wskazany w kursie i
              opisz, jakie dane chcesz usunac. Mozesz tez napisac bezposrednio na
              k.wikiel@gmail.com. Odpowiemy i wykonamy zadanie bez zbednej zwloki,
              chyba ze prawo wymaga dalszego przechowywania czesci danych, np.
              danych ksiegowych.
            </p>

            <h2>10. Aktualizacje</h2>
            <p>
              Polityka moze byc aktualizowana, gdy zmienia sie sposob prowadzenia
              kursu, narzedzia albo wymagania prawne. Aktualna wersja jest zawsze
              dostepna na tej stronie. Obowiazuje od 22 czerwca 2026 r.
            </p>
          </main>
        </div>
      </section>
    </>
  );
}
