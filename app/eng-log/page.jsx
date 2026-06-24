import { POSTS, AUTHOR, entryNo } from "./posts";

export const metadata = {
  title: "Engineering log | Slayer",
  description:
    "Dziennik inżynierski Slayera: surowe notatki z treningu, recon cudzych receptur, decyzje i wpadki. Pisane na bieżąco, bez wygładzania.",
};

const css = `
  .elog-mast{border:1px solid var(--line2);border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01)),var(--panel);padding:22px 24px;margin-top:6px}
  .elog-row{display:flex;justify-content:space-between;align-items:baseline;gap:14px;flex-wrap:wrap;font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;color:var(--dim)}
  .elog-row .id{color:var(--acc)}
  .elog-rule{border:0;border-top:1px solid var(--line2);margin:14px 0}
  h1{font-family:var(--serif);font-weight:400;font-size:clamp(2rem,4.6vw,3rem);letter-spacing:-.015em;margin:6px 0 8px}
  .intro{color:var(--mut);max-width:64ch;line-height:1.6;margin:0}
  .elog-meta{display:flex;gap:26px;flex-wrap:wrap;font-family:var(--mono);font-size:.72rem;color:var(--dim);margin-top:14px}
  .elog-meta b{color:var(--txt);font-weight:500;letter-spacing:0}
  .idx{margin-top:30px}
  .idx-head{display:grid;grid-template-columns:64px 110px 1fr;gap:14px;font-family:var(--mono);font-size:.66rem;letter-spacing:.14em;color:var(--dim);padding:0 18px 8px;border-bottom:1px solid var(--line2)}
  .entry{display:grid;grid-template-columns:64px 110px 1fr;gap:14px;align-items:start;padding:18px;border-bottom:1px solid var(--line2);text-decoration:none;transition:background .15s,border-color .15s}
  .entry:hover{background:rgba(255,255,255,.022)}
  .entry:hover .e-title{color:var(--acc)}
  .e-no{font-family:var(--mono);font-size:.95rem;font-weight:600;color:var(--acc)}
  .e-date{font-family:var(--mono);font-size:.76rem;color:var(--dim);padding-top:3px}
  .e-title{font-family:var(--serif);font-weight:400;font-size:1.35rem;color:var(--ink);letter-spacing:-.01em;line-height:1.25;margin:0 0 6px;transition:color .15s}
  .e-lead{color:var(--mut);font-size:.9rem;line-height:1.55;margin:0;max-width:72ch}
  .e-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
  .e-tag{font-family:var(--mono);font-size:.66rem;letter-spacing:.06em;padding:2px 8px;border-radius:3px;background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--dim);text-transform:uppercase}
  @media(max-width:680px){.idx-head{display:none}.entry{grid-template-columns:1fr;gap:6px}}
`;

export default function EngLog() {
  return (
    <div className="sec page-top">
      <style>{css}</style>
      <div className="inner">
        <div className="elog-mast">
          <div className="elog-row">
            <span className="id">SLAYER PROTOCOL · ENGINEERING LOG</span>
            <span>WPISÓW: {String(POSTS.length).padStart(3, "0")}</span>
          </div>
          <hr className="elog-rule" />
          <h1>Engineering log</h1>
          <p className="intro">
            Surowe notatki z budowy polskiego modelu: recon cudzych receptur, decyzje treningowe,
            wpadki i liczby. Pisane na bieżąco, bez wygładzania. Wyniki eksperymentów z metrykami
            lądują w <a href="/eksperymenty">logu eksperymentów</a>; tutaj jest myślenie pomiędzy.
          </p>
          <div className="elog-meta">
            <span>PROWADZI <b>{AUTHOR}</b></span>
            <span>FORMAT <b>notatka robocza</b></span>
            <span>RYTM <b>przy każdym istotnym znalezisku</b></span>
          </div>
        </div>

        <div className="idx">
          <div className="idx-head"><span>LOG</span><span>DATA</span><span>WPIS</span></div>
          {POSTS.map((p, i) => (
            <a className="entry" key={p.slug} href={`/eng-log/${p.slug}`}>
              <span className="e-no">{entryNo(i)}</span>
              <span className="e-date">{p.date}</span>
              <span>
                <h2 className="e-title">{p.title}</h2>
                <p className="e-lead">{p.lead}</p>
                <span className="e-tags">{p.tags.map((t) => <span className="e-tag" key={t}>{t}</span>)}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
