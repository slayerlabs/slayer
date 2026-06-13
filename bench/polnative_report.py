#!/usr/bin/env python3
"""PolNative — generator wizualnego raportu (self-contained HTML).

Czyta agregaty z public/results/polnative_v1.json i renderuje statyczny raport
(inline SVG, zero JS, działa z file://). Reprodukowalny: po każdym nowym runie
(np. dorzucenie slayer-27b) wystarczy odpalić ponownie.

Tylko agregaty (overall / per domena / per tryb) — zgodnie z czystością ewaluacji
nie pokazujemy itemów ani odpowiedzi modeli.

Usage:
  python3 bench/polnative_report.py [--in public/results/polnative_v1.json]
                                    [--out public/results/polnative_v1_report.html]
                                    [--date 2026-06-13]
"""
import argparse
import datetime
import html
import json

DOM_LABEL = {
    "EQ": "EQ / pragmatyka", "fleksja": "fleksja", "frazeologia": "frazeologia",
    "kalibracja": "kalibracja", "leksyka": "leksyka", "literatura": "literatura",
    "naturalnosc": "naturalność", "ortografia": "ortografia", "realia": "realia",
    "rejestr": "rejestr", "skladnia": "składnia",
}
MODEL_LABEL = {
    "bielik": "Bielik-11B-v3", "qwen27b": "Qwen3.5-27B", "qwen9b": "Qwen3.5-9B",
    "slayer": "Slayer-27B",
}
# kolory spójne ze stroną (acc=gold, slate, good=green)
PALETTE = ["#c79448", "#8a93a3", "#74a37a", "#c98a78", "#7a9bd1"]


def mlabel(k):
    return MODEL_LABEL.get(k, k)


def esc(s):
    return html.escape(str(s))


def doms_of(score):
    return sorted(k[4:] for k in score if k.startswith("dom:"))


def overall_band(models, colors):
    """Duże poziome słupki overall, ranking malejąco."""
    rows = sorted(models.items(), key=lambda kv: -kv[1]["score"]["all"])
    W, rowh, gap, lab, valw = 900, 54, 16, 0, 120
    barx, barw = 250, W - 250 - valw
    h = len(rows) * (rowh + gap) - gap + 10
    out = [f'<svg viewBox="0 0 {W} {h}" class="ov" role="img" aria-label="Wyniki ogólne">']
    for i, (k, m) in enumerate(rows):
        y = i * (rowh + gap)
        sc = m["score"]["all"]
        c = colors[k]
        bw = barw * sc / 100
        out.append(f'<text class="ov-name" x="0" y="{y+rowh/2+2}">{esc(mlabel(k))}</text>')
        out.append(f'<text class="ov-sub" x="0" y="{y+rowh/2+20}">{esc(m["backend"])} · temp {m["temp"]}</text>')
        out.append(f'<rect x="{barx}" y="{y+6}" width="{barw}" height="{rowh-12}" rx="5" class="ov-track"/>')
        out.append(f'<rect x="{barx}" y="{y+6}" width="{bw:.1f}" height="{rowh-12}" rx="5" fill="{c}"/>')
        out.append(f'<text class="ov-val" x="{barx+barw+14}" y="{y+rowh/2+8}" fill="{c}">{sc:.1f}</text>')
    out.append("</svg>")
    return "\n".join(out)


def domain_chart(models, colors):
    """Pogrupowane poziome słupki per domena, sort wg lidera malejąco."""
    keys = list(models.keys())
    leader = max(keys, key=lambda k: models[k]["score"]["all"])
    doms = doms_of(models[leader]["score"])
    doms.sort(key=lambda d: -models[leader]["score"].get("dom:" + d, 0))
    n = len(keys)
    W, lab, valw = 900, 150, 46
    barx, barw = lab, W - lab - valw
    bh, bgap, rpad = 14, 3, 16
    rowh = n * bh + (n - 1) * bgap + rpad
    H = len(doms) * rowh + 34
    out = [f'<svg viewBox="0 0 {W} {H}" class="dc" role="img" aria-label="Wyniki per domena">']
    # siatka 0..100
    for gx in (0, 25, 50, 75, 100):
        x = barx + barw * gx / 100
        out.append(f'<line class="dc-grid" x1="{x:.1f}" y1="20" x2="{x:.1f}" y2="{H-6}"/>')
        out.append(f'<text class="dc-ax" x="{x:.1f}" y="14" text-anchor="middle">{gx}</text>')
    for di, d in enumerate(doms):
        ry = 28 + di * rowh
        out.append(f'<text class="dc-dom" x="{lab-12}" y="{ry+(rowh-rpad)/2+3}" text-anchor="end">{esc(DOM_LABEL.get(d,d))}</text>')
        for mi, k in enumerate(keys):
            sc = models[k]["score"].get("dom:" + d, 0)
            by = ry + mi * (bh + bgap)
            bw = barw * sc / 100
            c = colors[k]
            out.append(f'<rect x="{barx}" y="{by}" width="{barw}" height="{bh}" rx="3" class="dc-track"/>')
            out.append(f'<rect x="{barx}" y="{by}" width="{bw:.1f}" height="{bh}" rx="3" fill="{c}"/>')
            out.append(f'<text class="dc-val" x="{barx+barw+6}" y="{by+bh-3}" fill="{c}">{sc:.0f}</text>')
    out.append("</svg>")
    return "\n".join(out), keys, leader


def delta_chart(models, colors, keys):
    """Diverging delta lider vs drugi (tylko dla 2 modeli)."""
    if len(keys) != 2:
        return ""
    a, b = sorted(keys, key=lambda k: -models[k]["score"]["all"])
    doms = doms_of(models[a]["score"])
    deltas = [(d, models[a]["score"].get("dom:" + d, 0) - models[b]["score"].get("dom:" + d, 0)) for d in doms]
    deltas.sort(key=lambda x: -x[1])
    mx = max(1, max(abs(v) for _, v in deltas))
    W, lab = 900, 150
    cx = lab + (W - lab) / 2
    half = (W - lab) / 2 - 56
    rowh = 24
    H = len(deltas) * rowh + 30
    out = [f'<svg viewBox="0 0 {W} {H}" class="dl" role="img" aria-label="Różnice per domena">']
    out.append(f'<line class="dl-axis" x1="{cx}" y1="20" x2="{cx}" y2="{H-6}"/>')
    out.append(f'<text class="dl-cap" x="{cx-8}" y="14" text-anchor="end" fill="{colors[b]}">◄ {esc(mlabel(b))} lepszy</text>')
    out.append(f'<text class="dl-cap" x="{cx+8}" y="14" text-anchor="start" fill="{colors[a]}">{esc(mlabel(a))} lepszy ►</text>')
    for i, (d, v) in enumerate(deltas):
        y = 24 + i * rowh
        out.append(f'<text class="dl-dom" x="{lab-12}" y="{y+rowh/2+2}" text-anchor="end">{esc(DOM_LABEL.get(d,d))}</text>')
        w = half * abs(v) / mx
        if v >= 0:
            out.append(f'<rect x="{cx}" y="{y+3}" width="{w:.1f}" height="{rowh-9}" rx="3" fill="{colors[a]}"/>')
            out.append(f'<text class="dl-val" x="{cx+w+6}" y="{y+rowh/2+2}" fill="{colors[a]}">+{v:.0f}</text>')
        else:
            out.append(f'<rect x="{cx-w:.1f}" y="{y+3}" width="{w:.1f}" height="{rowh-9}" rx="3" fill="{colors[b]}"/>')
            out.append(f'<text class="dl-val" x="{cx-w-6:.1f}" y="{y+rowh/2+2}" text-anchor="end" fill="{colors[b]}">{v:.0f}</text>')
    out.append("</svg>")
    return "\n".join(out)


def split_band(models, colors):
    """Auto vs sędzia per model."""
    out = ['<div class="splits">']
    for k, m in sorted(models.items(), key=lambda kv: -kv[1]["score"]["all"]):
        a = m["score"].get("tryb:auto", 0)
        j = m["score"].get("tryb:judge", 0)
        c = colors[k]
        out.append(f'''<div class="split">
          <div class="split-h"><b style="color:{c}">{esc(mlabel(k))}</b></div>
          <div class="split-r"><span class="sl">auto (formy)</span>
            <div class="sb"><i style="width:{a}%;background:{c}"></i></div><span class="sv">{a:.1f}</span></div>
          <div class="split-r"><span class="sl">sędzia (styl, kalibracja)</span>
            <div class="sb"><i style="width:{j}%;background:{c};opacity:.55"></i></div><span class="sv">{j:.1f}</span></div>
        </div>''')
    out.append("</div>")
    return "\n".join(out)


def findings(models, leader, keys):
    out = []
    rank = sorted(models.items(), key=lambda kv: -kv[1]["score"]["all"])
    top, topv = rank[0][0], rank[0][1]["score"]["all"]
    out.append(f'<b>{esc(mlabel(top))} prowadzi z wynikiem {topv:.1f}/100.</b> '
               + " ".join(f"{esc(mlabel(k))} {m['score']['all']:.1f}." for k, m in rank[1:]))
    if len(keys) == 2:
        a, b = top, rank[1][0]
        doms = doms_of(models[a]["score"])
        dl = sorted(((d, models[a]["score"]["dom:" + d] - models[b]["score"]["dom:" + d]) for d in doms), key=lambda x: -x[1])
        gains = ", ".join(f"{DOM_LABEL.get(d,d)} +{v:.0f}" for d, v in dl[:3])
        losses = ", ".join(f"{DOM_LABEL.get(d,d)} {v:.0f}" for d, v in dl if v < 0)
        out.append(f"Największa przewaga {esc(mlabel(a))}: {gains} — to domeny pamięci kulturowej i fleksji, sygnał dla fazy wiedzy (CPT).")
        if losses:
            out.append(f"{esc(mlabel(b))} wygrywa w: {losses}.")
    # flaga kalibracji + rozjazd auto/judge
    for k, m in rank:
        kal = m["score"].get("dom:kalibracja")
        if kal is not None and kal <= 40:
            out.append(f"<b>Czerwona lampa:</b> {esc(mlabel(k))} ma kalibrację {kal:.0f}/100 — pewnie fabrykuje odpowiedzi na pytania-pułapki o niedostępną wiedzę lokalną.")
            break
    spreads = [(k, m["score"].get("tryb:auto", 0) - m["score"].get("tryb:judge", 0)) for k, m in rank]
    big = max(spreads, key=lambda x: x[1])
    if big[1] > 15:
        out.append(f"Rozjazd auto−sędzia {big[1]:.0f} pkt u {esc(mlabel(big[0]))}: świetne formy językowe, dużo słabsze zachowanie konwersacyjne (EQ, naturalność, kalibracja). To ziemia niczyja i okazja dla Slayera.")
    return "".join(f"<li>{x}</li>" for x in out)


CSS = """
:root{--bg:#0d0f12;--panel:#13161b;--panel2:#171a20;--ink:#eef0f3;--txt:#d7dade;--mut:#a3a9b2;--dim:#6c727c;--line:#252a31;--line2:#1d2127;--acc:#c79448;--good:#74a37a}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(1200px 700px at 70% -10%,rgba(199,148,72,.05),transparent),var(--bg);color:var(--txt);font-family:'Hanken Grotesk',system-ui,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:980px;margin:0 auto;padding:40px 24px 80px}
.mono{font-family:'IBM Plex Mono',ui-monospace,monospace}
.stamp{border:1px solid var(--line2);border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01)),var(--panel);padding:20px 24px}
.stamp-row{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;font-family:'IBM Plex Mono',monospace;font-size:.72rem;letter-spacing:.14em;color:var(--dim)}
.stamp-row .id{color:var(--acc)}
.rule{border:0;border-top:1px solid var(--line2);margin:14px 0}
h1{font-family:'Newsreader',Georgia,serif;font-weight:400;font-size:clamp(2rem,5vw,3rem);letter-spacing:-.015em;margin:6px 0 6px}
.sub{color:var(--mut);max-width:64ch;margin:0}
.meta{display:flex;gap:24px;flex-wrap:wrap;font-family:'IBM Plex Mono',monospace;font-size:.72rem;color:var(--dim);margin-top:14px}
.meta b{color:var(--txt);font-weight:500;letter-spacing:0}
h2{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:.76rem;letter-spacing:.16em;text-transform:uppercase;color:var(--acc);margin:46px 0 14px;padding-top:14px;border-top:1px solid var(--line2)}
.card{border:1px solid var(--line2);border-radius:10px;background:var(--panel);padding:18px 20px}
svg{width:100%;height:auto;display:block}
.ov-name{font-family:'Newsreader',serif;font-size:1.3rem;fill:var(--ink)}
.ov-sub{font-family:'IBM Plex Mono',monospace;font-size:.66rem;fill:var(--dim);letter-spacing:.04em}
.ov-track{fill:rgba(255,255,255,.05)}
.ov-val{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:1.5rem}
.dc-grid{stroke:var(--line2);stroke-width:.7}
.dc-ax,.dl-cap{font-family:'IBM Plex Mono',monospace;font-size:9.5px;fill:var(--dim)}
.dc-dom,.dl-dom{font-family:'IBM Plex Mono',monospace;font-size:11px;fill:var(--mut)}
.dc-track{fill:rgba(255,255,255,.04)}
.dc-val,.dl-val{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:10px}
.dl-axis{stroke:var(--line);stroke-width:1}
.legend{display:flex;gap:18px;flex-wrap:wrap;font-family:'IBM Plex Mono',monospace;font-size:.74rem;color:var(--mut);margin:6px 0 4px}
.legend i{display:inline-block;width:18px;height:10px;border-radius:2px;vertical-align:middle;margin-right:7px}
.splits{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:640px){.splits{grid-template-columns:1fr}}
.split{border:1px solid var(--line2);border-radius:8px;background:var(--panel);padding:14px 16px}
.split-h{font-family:'Newsreader',serif;font-size:1.05rem;margin-bottom:10px}
.split-r{display:grid;grid-template-columns:170px 1fr 42px;align-items:center;gap:10px;margin-top:7px}
.split-r .sl{font-family:'IBM Plex Mono',monospace;font-size:.68rem;color:var(--dim)}
.sb{height:11px;border-radius:5px;background:rgba(255,255,255,.05);overflow:hidden}
.sb i{display:block;height:100%}
.split-r .sv{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:.82rem;color:var(--txt);text-align:right}
ul.find{margin:0;padding-left:20px;display:grid;gap:10px}
ul.find li{color:var(--mut);font-size:.95rem;line-height:1.6}
ul.find b{color:var(--ink);font-weight:600}
.prov{margin-top:40px;padding-top:16px;border-top:1px solid var(--line2);font-family:'IBM Plex Mono',monospace;font-size:.72rem;color:var(--dim);line-height:1.7}
.prov b{color:var(--mut);font-weight:500}
a{color:var(--acc)}
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", default="public/results/polnative_v1.json")
    ap.add_argument("--out", default="public/results/polnative_v1_report.html")
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    a = ap.parse_args()

    d = json.load(open(a.inp, encoding="utf-8"))
    models = d["results"]
    colors = {k: PALETTE[i % len(PALETTE)] for i, k in enumerate(models)}

    dc_svg, keys, leader = domain_chart(models, colors)
    legend = '<div class="legend">' + "".join(
        f'<span><i style="background:{colors[k]}"></i>{esc(mlabel(k))}</span>' for k in keys) + "</div>"

    n = d.get("n", "—")
    judge = d.get("judge", "—")

    page = f"""<!doctype html>
<html lang="pl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PolNative v1 — raport</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&family=Newsreader:opsz,wght@6..72,300..500&display=swap" rel="stylesheet">
<style>{CSS}</style></head>
<body><div class="wrap">

<div class="stamp">
  <div class="stamp-row"><span class="id">SLAYER PROTOCOL · BENCHMARK</span><span>POLNATIVE v1 · RAPORT</span></div>
  <hr class="rule">
  <h1>PolNative v1 — natywność polszczyzny</h1>
  <p class="sub">Benchmark poprawnej polszczyzny i polskości generacji: fleksja, składnia, ortografia,
  leksyka, frazeologia, atrybucja literacka, realia, kalibracja wiedzy lokalnej, EQ i naturalność.
  Mierzy osie, na których wykładają się modele trenowane głównie na angielskim.</p>
  <div class="meta">
    <span>DATA <b>{esc(a.date)}</b></span>
    <span>ITEMÓW <b>{esc(n)}</b></span>
    <span>SĘDZIA <b>{esc(judge)}</b></span>
    <span>SKALA <b>pass=1, mixed=0.5, fail=0 → 0–100</b></span>
  </div>
</div>

<h2>Wynik ogólny</h2>
<div class="card">{overall_band(models, colors)}</div>

<h2>Per domena</h2>
{legend}
<div class="card">{dc_svg}</div>

<h2>Różnica per domena</h2>
<div class="card">{delta_chart(models, colors, keys)}</div>

<h2>Sprawdzalne formy vs ocena stylu</h2>
{split_band(models, colors)}

<h2>Wnioski</h2>
<div class="card"><ul class="find">{findings(models, leader, keys)}</ul></div>

<div class="prov">
  <b>Proweniencja.</b> Tryb auto = deterministyczne grupy substringów/regexów (formy w użyciu).
  Tryb judge = otwarty sędzia {esc(judge)} z rubryką pass/mixed/fail per item.
  Każdy model na rekomendowanym samplingu wydawcy (nie handicap).<br>
  <b>Czystość.</b> Raport pokazuje wyłącznie agregaty. Itemy benchmarku są prywatne
  (eval_only, nie wchodzą do treningu) — anti-leak. Runy bez pustych odpowiedzi i błędów sędziego.<br>
  <b>Slayer protocol</b> · otwarte laboratorium polskiego LLM-a.
</div>

</div></body></html>"""

    open(a.out, "w", encoding="utf-8").write(page)
    print(f"[polnative-report] {len(models)} modeli, {len(doms_of(models[leader]['score']))} domen -> {a.out}")


if __name__ == "__main__":
    main()
