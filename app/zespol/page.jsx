import Join from "./join";

export const metadata = {
  title: "Dołącz — zespół, fundatorzy, firmy, naukowcy | Slayer",
  description: "Publiczny zapis: kontrybutorzy, naukowcy, fundatorzy compute i firmy (zgłoś use case). Wpisz się i zobacz, kto już dołączył.",
};

export default function Zespol() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-code"><b>zespol</b><span>/ zespół</span></div>
            <div>
              <div className="sl-eye">dołącz · publiczny zapis</div>
              <h1 className="sl-h1">Zbuduj z&nbsp;nami <span className="sl-acc">polski model.</span></h1>
              <p className="sl-lede">Wpisz się — od&nbsp;razu widać, kto już jest i&nbsp;co oferuje. Kontrybutorzy, naukowcy, fundatorzy mocy obliczeniowej i&nbsp;firmy (zgłoście zastosowanie). Kontakt zostaje prywatny; publicznie widać imię, rolę i&nbsp;opis.</p>
            </div>
          </div>
        </div>
      </section>
      <Join />
    </main>
  );
}
