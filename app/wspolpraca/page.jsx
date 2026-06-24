export const metadata = {
  title: "Zasady wspolpracy i wkladu open-source | Fabryka AI",
  description:
    "Zasady wolontariatu i wkladu w projekt open-source na licencji MIT: dobrowolnosc, brak stosunku pracy, brak wynagrodzenia, prawa autorskie i licencja inbound=outbound.",
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

export default function WspolpracaPage() {
  return (
    <>
      <style>{css}</style>
      <section className="phero">
        <div className="inner">
          <span className="kick">open-source · MIT · wolontariat</span>
          <h1>Zasady wspolpracy i <em>wkladu</em></h1>
          <p>
            Projekt jest otwarty i rozwijany na licencji MIT. Kazdy moze dolozyc
            swoj wklad dobrowolnie, dla wlasnej nauki, portfolio i wspolautorstwa.
            Wklad nie jest praca na zlecenie ani zatrudnieniem, nie wiaze sie z
            wynagrodzeniem i nie tworzy stosunku pracy.
          </p>
          <p style={{ fontSize: ".92rem" }}>
            Te zasady dotycza wkladu spolecznosciowego. Wklad istotny - kod,
            datasety, dokumentacja i materialy uzywane do treningu modeli - wymaga
            osobnej, podpisanej umowy (CLA). Sam commit albo zaznaczenie pola na
            stronie nie przenosi praw autorskich.
          </p>
        </div>
      </section>

      <section className="sec tight">
        <div className="inner legalgrid">
          <aside className="legalcard">
            <span className="kick">tl;dr</span>
            <h2>Najwazniejsze</h2>
            <div className="legalmeta">
              <div>
                <b>Dobrowolnie</b>
                <span>Wkladasz tyle, ile chcesz, bez obowiazku i terminow.</span>
              </div>
              <div>
                <b>Bez wynagrodzenia</b>
                <span>Brak zaplaty, brak roszczen o wynagrodzenie.</span>
              </div>
              <div>
                <b>Licencja MIT</b>
                <span>Wklad trafia do publicznego repo na tej samej licencji.</span>
              </div>
              <div>
                <b>Kod i datasety</b>
                <span>Wklad istotny wymaga osobnej, podpisanej umowy (CLA).</span>
              </div>
            </div>
          </aside>

          <main className="legalcard">
            <h2>1. Charakter projektu</h2>
            <p>
              Projekt jest oprogramowaniem open-source udostepnianym publicznie na
              licencji MIT. Kod, modele i materialy sa dostepne dla kazdego na tych
              samych warunkach. Celem jest wspolne, otwarte budowanie i uczenie sie,
              a nie swiadczenie uslug na rzecz dzialalnosci gospodarczej.
            </p>

            <h2>2. Dobrowolnosc wkladu</h2>
            <p>
              Udzial jest w pelni dobrowolny i z inicjatywy wspoltworcy. Nikt nie
              jest zobowiazany do wniesienia wkladu, do utrzymania jakiejkolwiek
              aktywnosci, do dostepnosci w okreslonych godzinach ani do dostarczenia
              konkretnego rezultatu. Wkład mozna zakonczyc w kazdej chwili bez
              konsekwencji.
            </p>

            <h2>3. Brak stosunku pracy i zlecenia</h2>
            <p>
              Wklad w projekt nie tworzy umowy o prace, umowy zlecenia, umowy o
              dzielo ani innego stosunku zatrudnienia czy podporzadkowania. Wspoltworcy
              nie sa pracownikami ani podwykonawcami organizatora. Nie ma polecen
              sluzbowych, czasu pracy, podporzadkowania organizacyjnego ani
              obowiazku osobistego swiadczenia pracy.
            </p>

            <h2>4. Brak wynagrodzenia i roszczen</h2>
            <p>
              Wklad jest nieodplatny i wnoszony we wlasnym interesie wspoltworcy, w
              szczegolnosci dla nauki, rozwoju umiejetnosci, budowy portfolio i
              wspolautorstwa w otwartym projekcie. Wspoltworcy nie przysluguje
              wynagrodzenie, zwrot kosztow ani roszczenie majatkowe z tytulu wkladu.
              Korzysci sa wzajemne i niepieniezne, a efekty pracy pozostaja publicznie
              dostepne dla kazdego na licencji MIT.
            </p>

            <h2>5. Prawa autorskie i licencja</h2>
            <p>
              Wspoltworca pozostaje autorem swojego wkladu i zachowuje prawa autorskie.
              Wnoszac wklad spolecznosciowy, udziela go publicznie na licencji MIT
              projektu (inbound=outbound), tak samo jak reszta projektu. Wspoltworca
              oswiadcza, ze ma prawo wniesc dany wklad i ze nie narusza on praw osob
              trzecich.
            </p>
            <p>
              W przypadku wkladu istotnego - kodu, datasetow, dokumentacji i
              materialow uzywanych do treningu modeli - przeniesienie albo szersza
              licencja na rzecz organizatora wymaga osobnej, podpisanej umowy (CLA)
              w formie pisemnej lub z kwalifikowanym podpisem elektronicznym.
              Zaznaczenie pola, commit, wiadomosc na czacie ani akceptacja tych zasad
              nie przenosza praw autorskich. Do czasu zawarcia takiej umowy taki wklad
              pozostaje objety wylacznie licencja MIT, na zasadach jak wyzej.
            </p>

            <h2>6. Oznaczanie wkladu</h2>
            <p>
              Autorstwo wkladu jest widoczne w publicznej historii repozytorium, np.
              w commitach i notach wspolautorstwa. To wspoltworca decyduje, pod jaka
              nazwa lub pseudonimem chce byc oznaczony.
            </p>

            <h2>7. Podatki i rozliczenia</h2>
            <p>
              Wklad spolecznosciowy jest dobrowolnym udzialem w dobru wspolnym na
              licencji MIT, z ktorego korzysta rowniez sam wspoltworca i ogol
              odbiorcow, a nie usluga swiadczona na rzecz organizatora. Kazda strona
              we wlasnym zakresie odpowiada za ewentualne wlasne rozliczenia podatkowe.
              Jesli pojawi sie odplatna wspolpraca albo przeniesienie praw, bedzie ona
              uregulowana osobna, podpisana umowa.
            </p>

            <h2>8. Zachowanie</h2>
            <p>
              We wspolpracy obowiazuja te same zasady kultury, co w spolecznosci, w
              tym {" "}<a className="acc" href="/regulamin-discord">Regulamin serwera
              Discord</a>. Dane osobowe przetwarzamy zgodnie z
              {" "}<a className="acc" href="/polityka-prywatnosci">Polityka
              prywatnosci</a>.
            </p>

            <h2>9. Zmiany</h2>
            <p>
              Zasady moga byc aktualizowane, gdy zmienia sie sposob prowadzenia
              projektu albo wymagania prawne. Aktualna wersja jest zawsze dostepna na
              tej stronie. Obowiazuje od 24 czerwca 2026 r.
            </p>
            <p style={{ fontSize: ".88rem", marginTop: 18, color: "var(--mut)" }}>
              Ta strona opisuje zasady wkladu spolecznosciowego i nie jest porada
              prawna. Wiazace przeniesienie praw, licencje wylaczne, NDA oraz kwestie
              podatkowe reguluja osobne, podpisane umowy.
            </p>
          </main>
        </div>
      </section>
    </>
  );
}
