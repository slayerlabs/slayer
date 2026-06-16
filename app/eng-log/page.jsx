import { POSTS, AUTHOR, entryNo } from "./posts";

export const metadata = {
  title: "Engineering log | Slayer",
  description:
    "Dziennik inżynierski Slayera: surowe notatki z treningu, recon cudzych receptur, decyzje i wpadki. Pisane na bieżąco, bez wygładzania.",
};

export default function EngLog() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">{String(POSTS.length).padStart(2, "0")}</div>
            <div>
              <div className="sl-eye">slayer protocol · engineering log</div>
              <h1 className="sl-h1" style={{ marginTop: 10 }}>
                Engineering <span className="sl-acc">log.</span>
              </h1>
              <p className="sl-lede" style={{ marginTop: 18 }}>
                Surowe notatki z&nbsp;budowy polskiego modelu: recon cudzych receptur, decyzje
                treningowe, wpadki i&nbsp;liczby. Pisane na bieżąco, bez wygładzania. Wyniki
                eksperymentów z&nbsp;metrykami lądują w&nbsp;<a href="/eksperymenty">logu eksperymentów</a>;
                tutaj jest myślenie pomiędzy.
              </p>
              <p className="sl-fn">
                prowadzi {AUTHOR} &nbsp; · &nbsp; format notatka robocza &nbsp; · &nbsp; rytm przy
                każdym istotnym znalezisku &nbsp; · &nbsp; wpisów {String(POSTS.length).padStart(3, "0")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sl-sec" style={{ paddingTop: 0 }}>
        <div className="sl-inner">
          <div className="sl-eye">indeks wpisów</div>
          <div className="sl-entries" style={{ marginTop: 18 }}>
            {POSTS.map((p, i) => (
              <a className="sl-entry" key={p.slug} href={`/eng-log/${p.slug}`}>
                <div className="sl-no">{entryNo(i)}</div>
                <div>
                  <div className="sl-step-when">{p.date}</div>
                  <h3 style={{ marginTop: 6 }}>{p.title}</h3>
                  <p>{p.lead}</p>
                  <div className="sl-cta" style={{ marginTop: 12, gap: 6 }}>
                    {p.tags.map((t) => (
                      <span className="sl-chip" key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
