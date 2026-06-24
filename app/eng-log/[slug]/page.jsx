import { notFound } from "next/navigation";
import { POSTS, AUTHOR, entryNo } from "../posts";
import { MdLite } from "../md";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} | Engineering log | Fabryka AI`,
    description: post.lead,
    authors: [{ name: AUTHOR }],
  };
}

const css = `
  .crumb{font-family:var(--mono);font-size:.74rem;letter-spacing:.08em}.crumb a{color:var(--acc);text-decoration:none}
  .stamp{border:1px solid var(--line2);border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01)),var(--panel);padding:18px 22px;margin:14px 0 30px}
  .stamp-row{display:flex;justify-content:space-between;align-items:baseline;gap:14px;flex-wrap:wrap;font-family:var(--mono);font-size:.7rem;letter-spacing:.14em;color:var(--dim)}
  .stamp-row .id{color:var(--acc)}
  .stamp-rule{border:0;border-top:1px solid var(--line2);margin:12px 0}
  .stamp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px 26px;font-family:var(--mono);font-size:.74rem}
  .stamp-grid .k{display:block;font-size:.64rem;letter-spacing:.14em;color:var(--dim);margin-bottom:3px}
  .stamp-grid .v{color:var(--txt)}
  .stamp-grid .v.tags{display:flex;gap:6px;flex-wrap:wrap}
  .stamp-tag{font-size:.66rem;letter-spacing:.06em;padding:1px 7px;border-radius:3px;background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--mut);text-transform:uppercase}
  article h1{font-family:var(--serif);font-weight:400;font-size:clamp(1.9rem,4.2vw,2.8rem);letter-spacing:-.015em;line-height:1.15;margin:0 0 18px;max-width:28ch}
  .lead{font-family:var(--serif);font-size:1.18rem;line-height:1.6;color:var(--mut);max-width:66ch;border-left:2px solid var(--acc);padding-left:16px;margin:0 0 30px}
  .body{max-width:72ch}
  .body h2{font-family:var(--mono);font-weight:600;font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:var(--acc);margin:38px 0 12px;padding-top:14px;border-top:1px solid var(--line2)}
  .body p{color:var(--mut);font-size:.96rem;line-height:1.7;margin:0 0 14px}
  .body ul{margin:0 0 14px;padding-left:20px;display:grid;gap:8px}
  .body li{color:var(--mut);font-size:.95rem;line-height:1.6}
  .body ol{list-style:none;counter-reset:item;margin:0 0 14px;padding:0;display:grid;gap:12px}
  .body ol li{counter-increment:item;position:relative;padding-left:46px}
  .body ol li::before{content:counter(item,decimal-leading-zero);position:absolute;left:0;top:2px;font-family:var(--mono);font-weight:600;font-size:.82rem;color:var(--acc)}
  .body ol li::after{content:"";position:absolute;left:26px;top:6px;bottom:4px;border-left:1px solid var(--line2)}
  .body b{color:var(--ink);font-weight:600}
  .body a{color:var(--acc)}
  .body code{font-family:var(--mono);font-size:.84em;background:rgba(255,255,255,.05);border:1px solid var(--line2);border-radius:4px;padding:1px 5px}
  .body pre{background:rgba(0,0,0,.32);border:1px solid var(--line2);border-radius:8px;padding:14px 16px;overflow-x:auto;margin:0 0 14px}
  .body pre code{background:none;border:none;padding:0;font-size:.78rem;line-height:1.5;color:var(--txt);white-space:pre}
  .eof{margin-top:44px;display:flex;align-items:center;gap:14px;font-family:var(--mono);font-size:.68rem;letter-spacing:.16em;color:var(--dim)}
  .eof::before,.eof::after{content:"";flex:1;border-top:1px solid var(--line2)}
  .sig{margin-top:18px;text-align:right}
  .sig .name{font-family:var(--serif);font-style:italic;font-size:1.1rem;color:var(--ink)}
  .sig .role{font-family:var(--mono);font-size:.68rem;letter-spacing:.1em;color:var(--dim);margin-top:2px}
`;

export default async function Post({ params }) {
  const { slug } = await params;
  const idx = POSTS.findIndex((p) => p.slug === slug);
  if (idx === -1) notFound();
  const post = POSTS[idx];
  const no = entryNo(idx);
  return (
    <div className="sec page-top">
      <style>{css}</style>
      <div className="inner">
        <span className="crumb"><a href="/eng-log">← ENGINEERING LOG</a></span>

        <div className="stamp">
          <div className="stamp-row">
            <span className="id">FABRYKA AI PROTOCOL · ENGINEERING LOG</span>
            <span>WPIS {no}</span>
          </div>
          <hr className="stamp-rule" />
          <div className="stamp-grid">
            <div><span className="k">DATA</span><span className="v">{post.date}</span></div>
            <div><span className="k">AUTOR</span><span className="v">{post.author || AUTHOR}</span></div>
            <div><span className="k">TAGI</span><span className="v tags">{post.tags.map((t) => <span className="stamp-tag" key={t}>{t}</span>)}</span></div>
          </div>
        </div>

        <article>
          <h1>{post.title}</h1>
          <p className="lead">{post.lead}</p>
          <div className="body"><MdLite src={post.body} /></div>
          <div className="eof">KONIEC WPISU · LOG {no} · FABRYKA AI PROTOCOL</div>
          <div className="sig">
            <div className="name">— {post.author || AUTHOR}</div>
            <div className="role">FABRYKA AI LAB · {post.date}</div>
          </div>
        </article>
      </div>
    </div>
  );
}
