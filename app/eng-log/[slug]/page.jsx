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
    title: `${post.title} | Engineering log | Slayer`,
    description: post.lead,
    authors: [{ name: AUTHOR }],
  };
}

// Prose dla treści z MdLite (raw h2/p/ul/ol/code/pre/b/a) — czyste tokeny
// --sl-* w stylu slayer.css. Licznik ol bez ozdobników, kanty proste.
const css = `
  .sl-prose h2{font-family:var(--sl-sans);font-weight:300;text-transform:uppercase;letter-spacing:-.01em;line-height:1.05;color:var(--sl-ink);font-size:clamp(18px,2.4vw,22px);margin:38px 0 14px;padding-top:16px;border-top:1px solid var(--sl-line)}
  .sl-prose p{color:var(--sl-mut);font-size:16px;line-height:1.7;margin:0 0 16px;max-width:72ch}
  .sl-prose ul{margin:0 0 16px;padding-left:20px;display:grid;gap:8px;max-width:72ch}
  .sl-prose ul li{color:var(--sl-mut);font-size:16px;line-height:1.6}
  .sl-prose ul li::marker{color:var(--sl-acc)}
  .sl-prose ol{list-style:none;counter-reset:item;margin:0 0 16px;padding:0;display:grid;gap:12px;max-width:72ch}
  .sl-prose ol li{counter-increment:item;position:relative;padding-left:46px;color:var(--sl-mut);font-size:16px;line-height:1.6}
  .sl-prose ol li::before{content:counter(item,decimal-leading-zero);position:absolute;left:0;top:1px;font-family:var(--sl-mono);font-weight:500;font-size:13px;color:var(--sl-acc)}
  .sl-prose ol li::after{content:"";position:absolute;left:26px;top:6px;bottom:4px;border-left:1px solid var(--sl-line2)}
  .sl-prose b{color:var(--sl-ink);font-weight:500}
  .sl-prose a{color:var(--sl-acc);border-bottom:1px solid var(--sl-acc-soft)}
  .sl-prose code{font-family:var(--sl-mono);font-size:.86em;color:var(--sl-acc);background:var(--sl-acc-soft);border:1px solid rgba(236,43,79,.32);padding:1px 5px}
  .sl-prose pre{font-family:var(--sl-mono);font-size:12px;line-height:1.6;color:var(--sl-mut);background:#0a0809;border:1px solid var(--sl-line);padding:14px 16px;overflow:auto;white-space:pre;max-height:520px;margin:0 0 16px}
  .sl-prose pre code{background:none;border:none;padding:0;color:var(--sl-mut);font-size:12px}
  .sl-stamp-meta{display:flex;flex-wrap:wrap;gap:10px 26px;font-family:var(--sl-mono);font-size:11px;letter-spacing:.04em;color:var(--sl-mut);margin-top:14px}
  .sl-stamp-meta .sl-k{color:var(--sl-dim);text-transform:uppercase;letter-spacing:.1em;margin-right:8px}
  .sl-stamp-tags{display:inline-flex;gap:6px;flex-wrap:wrap}
  .sl-sig{margin-top:18px;text-align:right}
  .sl-sig .sl-name{font-family:var(--sl-sans);font-weight:300;text-transform:uppercase;letter-spacing:-.005em;font-size:18px;color:var(--sl-ink)}
  .sl-sig .sl-role{font-family:var(--sl-mono);font-size:10px;letter-spacing:.08em;color:var(--sl-dim);margin-top:4px}
`;

export default async function Post({ params }) {
  const { slug } = await params;
  const idx = POSTS.findIndex((p) => p.slug === slug);
  if (idx === -1) notFound();
  const post = POSTS[idx];
  const no = entryNo(idx);
  return (
    <main className="sl">
      <style>{css}</style>
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-eye">
            <a href="/eng-log" style={{ color: "var(--sl-acc)" }}>← engineering log</a> · wpis {no}
          </div>

          <div className="sl-stamp-meta">
            <span><span className="sl-k">data</span>{post.date}</span>
            <span><span className="sl-k">autor</span>{post.author || AUTHOR}</span>
            <span className="sl-stamp-tags">
              <span className="sl-k">tagi</span>
              {post.tags.map((t) => <span className="sl-chip" key={t}>{t}</span>)}
            </span>
          </div>

          <article style={{ marginTop: 28 }}>
            <h1 className="sl-h1" style={{ maxWidth: "20ch", fontSize: "clamp(30px,5vw,52px)" }}>{post.title}</h1>
            <p className="sl-lede" style={{ marginTop: 22, maxWidth: "66ch", borderLeft: "2px solid var(--sl-acc)", paddingLeft: 16 }}>{post.lead}</p>
            <div className="sl-prose" style={{ marginTop: 32, maxWidth: "72ch" }}><MdLite src={post.body} /></div>

            <hr className="sl-rule" style={{ margin: "44px 0 0" }} />
            <p className="sl-fn">koniec wpisu · log {no} · slayer protocol</p>
            <div className="sl-sig">
              <div className="sl-name">— {post.author || AUTHOR}</div>
              <div className="sl-role">slayer lab · {post.date}</div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
