export const metadata = {
  title: "Regulamin serwera Discord | Fabryka AI",
  description:
    "Regulamin serwera Discord Fabryka AI: zasady spolecznosci, moderacja, zakazy, wiek, dane i kontakt.",
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

export default function RegulaminDiscordPage() {
  return (
    <>
      <style>{css}</style>
      <section className="phero">
        <div className="inner">
          <span className="kick">spolecznosc · Discord · regulamin</span>
          <h1>Regulamin serwera <em>Discord</em></h1>
          <p>
            Krotkie zasady wspolnej przestrzeni. Chcemy miejsca, w ktorym da sie
            rzeczowo rozmawiac o budowie i trenowaniu AI, bez spamu, hejtu i
            podszywania sie. Wchodzac na serwer, akceptujesz ten regulamin oraz
            Warunki korzystania z uslug Discord.
          </p>
        </div>
      </section>

      <section className="sec tight">
        <div className="inner legalgrid">
          <aside className="legalcard">
            <span className="kick">tl;dr</span>
            <h2>Zasady w skrocie</h2>
            <div className="legalmeta">
              <div>
                <b>Szacunek</b>
                <span>Rzeczowo, bez hejtu, spamu i podszywania sie.</span>
              </div>
              <div>
                <b>Wiek</b>
                <span>Minimum 13 lat, zgodnie z regulaminem Discorda.</span>
              </div>
              <div>
                <b>Moderacja</b>
                <span>Naruszenia = ostrzezenie, mute, kick lub ban.</span>
              </div>
              <div>
                <b>Kontakt</b>
                <span>Napisz do moderacji albo na k.wikiel@gmail.com.</span>
              </div>
            </div>
          </aside>

          <main className="legalcard">
            <h2>1. O serwerze</h2>
            <p>
              Serwer Discord jest prowadzony w ramach Fabryka AI i sluzy
              komunikacji spolecznosci, w tym uczestnikow kursu "AI from scratch".
              Wejscie na serwer oznacza akceptacje tego regulaminu oraz Warunkow
              korzystania z uslug i Wytycznych dla spolecznosci Discord.
            </p>

            <h2>2. Wiek</h2>
            <p>
              Z serwera moga korzystac wylacznie osoby, ktore maja co najmniej 13 lat
              i spelniaja minimalny wiek wymagany przez Discord w swoim kraju. Jesli
              nie spelniasz tego warunku, nie korzystaj z serwera.
            </p>

            <h2>3. Zasady komunikacji</h2>
            <ul>
              <li>pisz rzeczowo i na temat danego kanalu;</li>
              <li>szanuj innych - bez hejtu, groźb, mowy nienawisci i atakow osobistych;</li>
              <li>bez spamu, floodu, masowych pingow i powtarzania tych samych tresci;</li>
              <li>bez podszywania sie pod inne osoby, moderacje lub organizatora;</li>
              <li>bez udostepniania cudzych danych osobowych bez zgody.</li>
            </ul>

            <h2>4. Czego nie wolno</h2>
            <ul>
              <li>tresci nielegalnych, pornograficznych, drastycznych oraz szkodzacych nieletnim;</li>
              <li>malware, scamow, phishingu, linkow do oszustw i fałszywych dropow;</li>
              <li>nieuzgodnionej reklamy, samopromocji i werbowania na inne serwery;</li>
              <li>lamania praw autorskich, w tym udostepniania platnych materialow kursu;</li>
              <li>dzialan obciazajacych serwer, botow bez zgody i prob obejscia moderacji.</li>
            </ul>

            <h2>5. Moderacja</h2>
            <p>
              Moderacja moze reagowac na naruszenia regulaminu. W zaleznosci od wagi
              sprawy stosujemy ostrzezenie, wyciszenie, usuniecie tresci, kick albo
              ban. Przy powaznych naruszeniach reakcja moze byc natychmiastowa i bez
              wczesniejszego ostrzezenia. Decyzje moderacji mozesz zaskarzyc, piszac
              do organizatora.
            </p>

            <h2>6. Tresci uzytkownikow</h2>
            <p>
              Odpowiadasz za tresci, ktore publikujesz na serwerze. Publikujac je,
              potwierdzasz, ze masz do tego prawo. Moderacja moze usuwac tresci
              naruszajace regulamin, prawo lub zasady Discorda.
            </p>
            <p>
              Publikujac tresci na serwerze, np. wiadomosci, komentarze, pomysly,
              uwagi, zgloszenia bledow, przyklady i propozycje, udzielasz organizatorowi
              niewylacznej, nieodplatnej, bezterminowej licencji na ich wykorzystanie
              na potrzeby projektu. Obejmuje to m.in. rozwoj projektu, dokumentacje,
              materialy kursowe oraz prace nad modelami. Pozostajesz autorem swoich
              tresci. Ta licencja nie przenosi praw autorskich. Przeniesienie praw albo
              szersza licencja na kod, datasety lub dokumentacje wymaga osobnej,
              podpisanej umowy, co opisuja
              {" "}<a className="acc" href="/wspolpraca">Zasady wspolpracy</a>.
            </p>

            <h2>7. Dane na Discordzie</h2>
            <p>
              Twoj nick, identyfikator konta, role, wiadomosci, reakcje i aktywnosc
              na kanalach moga byc przechowywane przez Discord oraz widoczne dla
              innych uczestnikow zgodnie z ustawieniami serwera. Zasady przetwarzania
              danych po naszej stronie opisuje
              {" "}<a className="acc" href="/polityka-prywatnosci">Polityka prywatnosci</a>.
              Discord przetwarza dane na wlasnych zasadach okreslonych w swojej
              polityce prywatnosci.
            </p>

            <h2>8. Kurs</h2>
            <p>
              Jesli korzystasz z serwera jako uczestnik kursu, obowiazuje Cie rowniez
              {" "}<a className="acc" href="/regulamin">Regulamin kursu</a>. W razie
              roznic zasady dotyczace dostepu do platnych materialow i zwrotow
              reguluje regulamin kursu.
            </p>

            <h2>9. Kontakt</h2>
            <p>
              W sprawach moderacji, naruszen i danych napisz do moderacji na serwerze
              albo na k.wikiel@gmail.com.
            </p>

            <h2>10. Zmiany</h2>
            <p>
              Regulamin moze byc aktualizowany, gdy zmieniaja sie zasady serwera,
              narzedzia albo wymagania Discorda i prawa. Aktualna wersja jest zawsze
              dostepna na tej stronie. Obowiazuje od 24 czerwca 2026 r.
            </p>
          </main>
        </div>
      </section>
    </>
  );
}
