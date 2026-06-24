import ZgodaForm from "./form";

export const metadata = {
  title: "Zgoda na publikację wizerunku | Fabryka AI",
  description:
    "Formularz zgody RODO na publikację wizerunku i danych osobowych w sekcji Zespół na stronie Fabryka AI. Potwierdzenie przez e-mail (double opt-in).",
};

export default function ZgodaPage() {
  return (
    <section className="sec tight">
      <div className="inner" style={{ maxWidth: 720 }}>
        <span className="kick">RODO · wizerunek · double opt-in</span>
        <h1>Zgoda na publikację wizerunku</h1>
        <p className="note" style={{ margin: "12px 0 22px" }}>
          Aby Twoje zdjęcie i dane mogły pojawić się w sekcji „Zespół", potrzebujemy
          Twojej zgody. Po wysłaniu formularza dostaniesz e-mail z linkiem
          potwierdzającym — zgoda jest ważna dopiero po jego kliknięciu. Zgodę możesz
          wycofać w każdej chwili, pisząc na nasz adres kontaktowy.
        </p>
        <ZgodaForm />
      </div>
    </section>
  );
}
