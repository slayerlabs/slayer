import legalContent from "../legal/generated/legal-content.json";

export function getLegalDocument(documentPath) {
  const document = legalContent.documents[documentPath];
  if (!document) throw new Error(`Missing generated legal document: ${documentPath}`);
  return document;
}

export default function LegalDocument({ documentPath, children }) {
  const document = getLegalDocument(documentPath);

  return (
    <>
      <style>{`
        .legalgrid{display:grid;grid-template-columns:minmax(220px,.55fr) minmax(0,1.45fr);gap:18px;align-items:start}
        .legalcard{border:1px solid var(--line);border-radius:var(--rad);background:#121215;padding:24px;box-shadow:0 14px 38px rgba(0,0,0,.45)}
        .legalbody h2{margin:28px 0 10px;font-family:var(--display);font-size:1.35rem;font-weight:600;color:var(--ink)}
        .legalbody h2:first-child{margin-top:0}
        .legalbody h3{margin:22px 0 8px;color:var(--ink)}
        .legalbody p,.legalbody li{color:var(--mut);font-size:.98rem;line-height:1.65}
        .legalbody p{margin:0 0 12px}.legalbody ul,.legalbody ol{padding-left:22px}
        .legalbody a{color:var(--acc)}.legalmeta{display:grid;gap:12px}
        .legalmeta div{border-top:1px solid var(--line2);padding-top:10px}
        .legalmeta div:first-child{border-top:0;padding-top:0}
        .legalmeta b,.legalmeta span{display:block;font-size:.9rem}
        .legalmeta span{color:var(--mut);overflow-wrap:anywhere}
        @media(max-width:860px){.legalgrid{grid-template-columns:1fr}}
      `}</style>
      <section className="phero">
        <div className="inner">
          <span className="kick">Fabryka Legal · dokument obowiązujący</span>
          <h1>{document.title}</h1>
        </div>
      </section>
      <section className="sec tight">
        <div className="inner legalgrid">
          <aside className="legalcard legalmeta">
            <div><b>Wersja</b><span>{document.version}</span></div>
            <div><b>Obowiązuje od</b><span>{document.effective_date}</span></div>
            <div><b>Przegląd do</b><span>{document.review_by}</span></div>
            <div><b>Źródło</b><span>{document.source_path}</span></div>
            <div><b>Integralność</b><span>{document.checksum}</span></div>
          </aside>
          <main className="legalcard">
            <div className="legalbody" dangerouslySetInnerHTML={{ __html: document.body_html }} />
            {children}
          </main>
        </div>
      </section>
    </>
  );
}
