import LegalDocument, { getLegalDocument } from "../../components/LegalDocument";
import ZgodaForm from "./form";

export const metadata = { title: "Zgoda na publikację wizerunku | Fabryka AI" };

export default function Page() {
  const document = getLegalDocument("/zgoda");
  const consentReady =
    !process.env.VERCEL ||
    Boolean(process.env.RESEND_API_KEY && process.env.CONSENT_BLOB_READ_WRITE_TOKEN);

  return (
    <LegalDocument documentPath="/zgoda">
      {consentReady ? (
        <ZgodaForm consentLabel={document.form_label} />
      ) : (
        <p className="note">
          Formularz jest chwilowo niedostępny. Prośbę można przesłać na{" "}
          <a className="acc" href="mailto:k.wikiel@gmail.com">k.wikiel@gmail.com</a>.
        </p>
      )}
    </LegalDocument>
  );
}
