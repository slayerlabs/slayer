"use client";
import { useState } from "react";

// Read-only mirror of Linear (team SLA). Real data comes from
// /results/zadania.json (built by scripts/pull_linear.mjs); the constants below
// are the demo fallback shown until that file exists. No write-back: "weź na
// siebie" routes to Discord, where a maintainer assigns the issue in Linear.

const DISCORD_URL = "https://discord.gg/HnTkVR4c5T";

const PEOPLE = {
  me:    { id: "me",    nick: "marcin.k", initials: "MK", color: "#C15F3C", rung: 1, rungLabel: "Kontrybutor" },
  kuba:  { id: "kuba",  nick: "kuba_w",   initials: "KW", color: "#B07D2E", rung: 3, rungLabel: "Maintainer", maintainer: true },
  ada:   { id: "ada",   nick: "ada.ml",   initials: "AM", color: "#4F6E9A", rung: 3, rungLabel: "Badaczka" },
  nowak: { id: "nowak", nick: "p_nowak",  initials: "PN", color: "#7D5C9C", rung: 2, rungLabel: "Badacz" },
  tomek: { id: "tomek", nick: "t0mek",    initials: "T0", color: "#B24A33", rung: 2, rungLabel: "Badacz" },
  darek: { id: "darek", nick: "darek",    initials: "DR", color: "#C08A3E", rung: 2, rungLabel: "Badacz" },
  wik:   { id: "wik",   nick: "wiktoria", initials: "WK", color: "#3F8A82", rung: 1, rungLabel: "Kontrybutorka" },
  ola:   { id: "ola",   nick: "ola_z",    initials: "OZ", color: "#6F8A3C", rung: 1, rungLabel: "Kontrybutorka" },
};

const TAG_META = {
  eval:    { color: "#3F8A82", bg: "rgba(63,138,130,.12)" },
  dane:    { color: "#7E6BA6", bg: "rgba(126,107,166,.12)" },
  kod:     { color: "#4F6E9A", bg: "rgba(79,110,154,.12)" },
  trening: { color: "#B07D2E", bg: "rgba(176,125,46,.13)" },
  infra:   { color: "#B24A33", bg: "rgba(178,74,51,.12)" },
  strona:  { color: "#6F8A3C", bg: "rgba(111,138,60,.13)" },
};

const STATUS_META = {
  "wolne":  { label: "WOLNE",  color: "#8C8678", bg: "rgba(140,134,120,.13)", order: 0 },
  "wziete": { label: "WZIĘTE", color: "#4F6E9A", bg: "rgba(79,110,154,.12)",  order: 1 },
  "w-toku": { label: "W TOKU", color: "#B07D2E", bg: "rgba(176,125,46,.13)",  order: 2 },
  "review": { label: "REVIEW", color: "#7D5C9C", bg: "rgba(125,92,156,.13)",  order: 3 },
  "done":   { label: "DONE",   color: "#4E8260", bg: "rgba(78,130,96,.13)",   order: 4 },
};

const LEVEL_META = {
  p: { label: "Początkujący", color: "#4E8260", bd: "rgba(78,130,96,.4)",  hint: "kilka godzin · zero treningu",              tier: "TIER 01" },
  s: { label: "Średnio",      color: "#B07D2E", bd: "rgba(176,125,46,.4)", hint: "trochę kodu i compute · pierwszy trening",  tier: "TIER 02" },
  z: { label: "Zaawansowane", color: "#B24A33", bd: "rgba(178,74,51,.4)",  hint: "pełne treningi · RL · infra",              tier: "TIER 03" },
};
const LEVEL_ORDER = ["p", "s", "z"];

const T = (id, num, level, title, tags, status, assignee, effort, progress, dod, deps) =>
  ({ id, num, level, title, tags, status, assignee, effort, progress, dod, deps: deps || [], linear: "LEM-" + (100 + num) });

const INITIAL_TASKS = [
  T("t01", 1, "p", "Odpal benchmark i zgłoś wynik", ["eval"], "done", "wik", "2-4h", 100, "Wynik MCQ (accuracy) na 200 pytaniach + log uruchomienia, zgłoszony w wątku #eval."),
  T("t02", 2, "p", "Zweryfikuj i opisz dataset", ["dane"], "w-toku", "tomek", "3-5h", 40, "Tabela: licencja, schemat pól, status (publiczny / w kolejce / zamknięty) dla każdego źródła."),
  T("t03", 3, "p", "Wyczyść i zanotuj instrukcje", ["dane"], "wolne", null, "4-6h", 0, "Min. 500 instrukcji po czyszczeniu, diff przed/po + notatka o kryteriach odrzucenia."),
  T("t04", 4, "p", "Napisz loader MCQ do harnessa", ["kod", "eval"], "review", "ada", "4-8h", 90, "Loader w harnessie przechodzi smoke-test na nowym zbiorze, format zgodny z resztą evali.", [2]),
  T("t05", 5, "p", "Poprawki na stronie protokołu", ["strona"], "done", "ola", "1-3h", 100, "PR zmergowany, podgląd na preview, zero regresji UI na kluczowych widokach."),
  T("t06", 6, "p", "Dekontaminacja zbioru treningowego", ["dane", "eval"], "wziete", "nowak", "4-6h", 0, "Skrypt liczy overlap n-gram/embedding względem evali, raport % kontaminacji per zbiór."),
  T("t07", 7, "s", "QLoRA SFT na bazowym modelu", ["trening", "kod"], "w-toku", "me", "1-2 dni", 65, "Checkpoint QLoRA + wynik na held-out vs baseline (delta), karta z hiperparametrami.", [3]),
  T("t08", 8, "s", "Zbuduj pary preferencji do DPO", ["dane"], "wolne", null, "1-2 dni", 0, "Min. 2k par preferencji z metryką zgodności sędziów i opisem procedury.", [3]),
  T("t09", 9, "s", "Pipeline danych syntetycznych", ["dane", "kod"], "wolne", null, "2-3 dni", 0, "Pipeline generuje i filtruje; próbka 1k z oceną jakości i odsetkiem odrzuceń."),
  T("t10", 10, "s", "Model merging — 3 warianty", ["trening", "eval"], "review", "ada", "1-2 dni", 95, "Zmergowany model + tabela held-out dla 3 wariantów scalania.", [7]),
  T("t11", 11, "s", "Prywatny held-out eval", ["eval"], "wolne", null, "2 dni", 0, "Zestaw 300+ świeżych pytań, zamknięty, opublikowany hash do weryfikacji."),
  T("t12", 12, "z", "Pełny DPO/ORPO + ablacje", ["trening"], "w-toku", "kuba", "3-5 dni", 55, "Pełny run + ablacje (beta, lr), raport z wnioskami i krzywymi.", [8]),
  T("t13", 13, "z", "GRPO / RLVR pipeline", ["trening", "infra"], "wziete", "nowak", "5-8 dni", 0, "RLVR pipeline działa, krzywa nagrody + wynik na targecie powyżej baseline.", [11, 7]),
  T("t14", 14, "z", "Trening kontrolowanej odmowy", ["trening", "eval"], "wolne", null, "4-6 dni", 0, "Model odmawia bez podstaw; eval grounding + niski false-refusal.", [8]),
  T("t15", 15, "z", "CPT na korpusie PL", ["trening", "dane"], "wolne", null, "5-7 dni", 0, "CPT na korpusie PL, perplexity w dół, brak degradacji na evalach EN."),
  T("t16", 16, "z", "Tokenizer PL + reinit embeddingów", ["kod", "trening"], "w-toku", "darek", "3-5 dni", 80, "Tokenizer PL + reinit embeddingów, fertility poniżej baseline."),
  T("t17", 17, "z", "Distylacja CoT nauczyciel→student", ["trening"], "wolne", null, "4-6 dni", 0, "Zbiór CoT z nauczyciela + student dorównuje na reasoning po distylacji.", [7]),
  T("t18", 18, "z", "Long-context (YaRN) do 32k", ["infra", "trening"], "wziete", "tomek", "3-5 dni", 0, "YaRN long-ctx działa do 32k, profil compute/koszt i wynik na long-eval."),
];

const INITIAL_FEED = [
  { who: "wiktoria", a: "wik",   action: "domknęła",         tid: "t01", time: "2 godz. temu" },
  { who: "ada.ml",   a: "ada",   action: "zgłosiła do review", tid: "t10", time: "4 godz. temu" },
  { who: "darek",    a: "darek", action: "pchnął do 80%",     tid: "t16", time: "6 godz. temu" },
  { who: "kuba_w",   a: "kuba",  action: "zaczął pracę nad",  tid: "t12", time: "wczoraj" },
  { who: "p_nowak",  a: "nowak", action: "wziął na siebie",   tid: "t13", time: "wczoraj" },
  { who: "ola_z",    a: "ola",   action: "domknęła",          tid: "t05", time: "2 dni temu" },
];

const pad = (n) => String(n).padStart(2, "0");
const isActive = (s) => s === "wziete" || s === "w-toku" || s === "review";
const mapTags = (arr) => arr.map((t) => ({ label: t, color: TAG_META[t].color, bg: TAG_META[t].bg }));

const css = `
.zb{font-family:'Hanken Grotesk',sans-serif;background:#F2F1E9;color:#211F1A;font-size:13px;line-height:1.5;-webkit-font-smoothing:antialiased;margin-top:68px}/* ponytail: clear the fixed site nav (68px in lab.css) */
.zb *{box-sizing:border-box}
.zb ::selection{background:#C15F3C;color:#FBFAF5}
@keyframes zbPulse{0%,100%{opacity:1}50%{opacity:.45}}
.zb-grid{display:grid;grid-template-columns:280px minmax(0,1fr) 372px;height:calc(100vh - 68px)}
.zb-left{border-right:1px solid #E4E1D4;overflow-y:auto;padding:22px 18px 48px}
.zb-main{overflow-y:auto}
.zb-right{border-left:1px solid #E4E1D4;overflow-y:auto;background:#EFEEE5}
.zb-card{border:1px solid #E4E1D4;border-radius:10px;padding:15px;background:#FBFAF5}
.zb-uc-row{display:flex;align-items:center;gap:11px;margin-bottom:15px}
.zb-uc-name{line-height:1.35}
.zb-uc-name .n{font-weight:600;font-size:14px}
.zb-uc-name .r{font-size:11px;color:#79746B}
.zb-uc-stats{display:flex;gap:8px}
.zb-stat{flex:1;border:1px solid #E8E5D9;border-radius:7px;padding:9px 10px;background:#FDFCF8}
.zb-stat .v{font-size:19px;font-weight:700;font-family:'Newsreader',serif}
.zb-stat .l{font-size:10px;color:#79746B;letter-spacing:.3px}
.zb-sec{margin-top:26px}
.zb-sec.f{margin-top:16px}
.zb-hl{font-size:10px;letter-spacing:1.4px;color:#A6A196;text-transform:uppercase;font-weight:600;margin-bottom:14px}
.zb-av{display:grid;place-items:center;color:#FBFAF5;font-weight:700}
.zb-lad{display:flex;gap:12px}
.zb-lad-rail{display:flex;flex-direction:column;align-items:center}
.zb-lad-dot{width:13px;height:13px;border-radius:50%;flex:none}
.zb-lad-line{width:2px;flex:1;min-height:14px}
.zb-lad-body{padding-bottom:16px}
.zb-lad-h{display:flex;align-items:center;gap:8px}
.zb-lad-h .lb{font-size:13px;font-weight:600}
.zb-badge-cur{font-size:9px;color:#FBFAF5;padding:1px 6px;border-radius:4px;font-weight:700;letter-spacing:.4px}
.zb-lad-hint{font-size:11px;color:#79746B;margin-top:2px}
.zb-lad-cnt{font-size:11px;color:#A6A196;margin-top:4px;font-family:'JetBrains Mono',monospace}
.zb-f-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}
.zb-reset{font-family:inherit;font-size:11px;color:#79746B;background:none;border:none;cursor:pointer;padding:0}
.zb-reset:hover{color:#C15F3C}
.zb-f-sub{font-size:11px;color:#79746B;margin-bottom:8px}
.zb-f-col{display:flex;flex-direction:column;gap:6px;margin-bottom:18px}
.zb-f-wrap{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px}
.zb-f-wrap.last{margin-bottom:0}
.zb-lf{font-family:inherit;cursor:pointer;text-align:left;display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:7px;font-size:12.5px}
.zb-lf .l{display:flex;align-items:center;gap:9px}
.zb-lf .c{font-size:11px;color:#A6A196;font-family:'JetBrains Mono',monospace}
.zb-dot{width:7px;height:7px;border-radius:50%}
.zb-sf{font-family:inherit;cursor:pointer;font-size:10px;letter-spacing:.4px;font-weight:600;padding:5px 9px;border-radius:5px}
.zb-tf{font-family:inherit;cursor:pointer;font-size:11.5px;padding:4px 9px;border-radius:5px}
.zb-tabbar{position:sticky;top:0;background:rgba(242,241,233,.92);backdrop-filter:blur(8px);border-bottom:1px solid #E4E1D4;padding:16px 28px 0;z-index:20}
.zb-tabbar-row{display:flex;align-items:flex-end;justify-content:space-between}
.zb-tabs{display:flex;gap:4px}
.zb-tab{font-family:inherit;cursor:pointer;background:none;padding:9px 14px;font-size:13.5px;font-weight:600;border:none;border-bottom:2px solid transparent}
.zb-sum{display:flex;gap:18px;padding-bottom:11px}
.zb-sum-i{display:flex;align-items:center;gap:7px}
.zb-sum-i .v{font-size:17px;font-weight:700;font-family:'Newsreader',serif}
.zb-sum-i .l{font-size:11px;color:#79746B}
.zb-pad{padding:26px 28px 64px}
.zb-prog{display:flex;align-items:stretch;margin-bottom:32px;border:1px solid #E4E1D4;border-radius:10px;overflow:hidden;background:#FBFAF5;box-shadow:0 1px 2px rgba(40,35,25,.04)}
.zb-prog-i{flex:1;padding:16px 18px;border-right:1px solid #EDEADE}
.zb-prog-top{display:flex;align-items:center;justify-content:space-between}
.zb-prog-tier{font-size:10px;font-weight:600;letter-spacing:1px;font-family:'JetBrains Mono',monospace}
.zb-prog-c{font-size:11px;color:#A6A196;font-family:'JetBrains Mono',monospace}
.zb-prog-label{font-family:'Newsreader',serif;font-size:18px;font-weight:500;margin:6px 0 3px}
.zb-prog-hint{font-size:11px;color:#79746B}
.zb-track{height:4px;background:#EAE7DB;border-radius:3px;margin-top:11px;overflow:hidden}
.zb-track>i{display:block;height:100%}
.zb-group{margin-bottom:34px}
.zb-g-head{display:flex;align-items:center;gap:11px;margin-bottom:14px}
.zb-g-label{font-family:'Newsreader',serif;font-size:18px;font-weight:500}
.zb-g-hint{font-size:11.5px;color:#79746B}
.zb-g-rule{flex:1;height:1px;background:#E4E1D4}
.zb-g-cnt{font-size:11px;color:#A6A196;font-family:'JetBrains Mono',monospace}
.zb-g-tasks{display:flex;flex-direction:column;gap:8px}
.zb-task{cursor:pointer;display:grid;grid-template-columns:32px minmax(0,1fr) 100px 140px;align-items:center;gap:16px;padding:14px 16px;border:1px solid;border-radius:9px;box-shadow:0 1px 2px rgba(40,35,25,.03)}
.zb-task:hover{background:#F6F4EC!important;border-color:#D6D2C4!important}
.zb-task-num{font-size:12px;color:#A6A196;font-weight:500;font-family:'JetBrains Mono',monospace}
.zb-task-body{min-width:0}
.zb-task-title{font-size:14px;font-weight:500;color:#211F1A;margin-bottom:5px;letter-spacing:-.1px}
.zb-task-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.zb-chip{font-size:10px;padding:2px 7px;border-radius:4px;font-weight:500}
.zb-task-eff{font-size:11px;color:#A6A196}
.zb-task-lin{font-size:10px;color:#C2BDB1;font-family:'JetBrains Mono',monospace}
.zb-task-prog{height:3px;background:#EAE7DB;border-radius:2px;margin-top:9px;max-width:240px;overflow:hidden}
.zb-task-prog>i{display:block;height:100%}
.zb-task-st{display:flex;align-items:center;gap:7px}
.zb-task-st .l{font-size:10px;letter-spacing:.4px;font-weight:600}
.zb-task-act{display:flex;justify-content:flex-end}
.zb-claim{font-family:inherit;cursor:pointer;font-size:11.5px;font-weight:600;padding:7px 12px;border-radius:6px;background:#FFFFFF;border:1px solid #C15F3C;color:#C15F3C}
.zb-claim:hover{background:#C15F3C;color:#FBFAF5}
.zb-asg{display:flex;align-items:center;gap:8px}
.zb-asg .n{font-size:11.5px}
.zb-empty{border:1px dashed #D6D2C4;border-radius:10px;padding:44px;text-align:center;color:#79746B;background:#FBFAF5}
.zb-empty .t{font-size:14px;margin-bottom:8px}
.zb-empty-btn{font-family:inherit;cursor:pointer;font-size:12px;color:#C15F3C;background:#FFFFFF;border:1px solid #C15F3C;padding:7px 13px;border-radius:6px}
.zb-view-sub{font-size:12px;color:#79746B;margin-bottom:20px}
.zb-people{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.zb-pcard{border:1px solid #E4E1D4;border-radius:11px;padding:16px;background:#FBFAF5;box-shadow:0 1px 2px rgba(40,35,25,.04)}
.zb-pc-head{display:flex;align-items:center;gap:12px;margin-bottom:15px}
.zb-pc-info{flex:1;line-height:1.4}
.zb-pc-nrow{display:flex;align-items:center;gap:8px}
.zb-pc-nick{font-weight:600;font-size:14px}
.zb-badge-maint{font-size:9px;color:#B07D2E;border:1px solid rgba(176,125,46,.4);padding:1px 6px;border-radius:4px;font-weight:600}
.zb-badge-me{font-size:9px;color:#FBFAF5;background:#C15F3C;padding:1px 6px;border-radius:4px;font-weight:700}
.zb-pc-rung{font-size:11px;color:#79746B}
.zb-pc-done{text-align:right}
.zb-pc-done .v{font-size:18px;font-weight:700;color:#4E8260;font-family:'Newsreader',serif}
.zb-pc-done .l{font-size:9px;color:#79746B}
.zb-pc-tasks{display:flex;flex-direction:column;gap:6px}
.zb-pt{cursor:pointer;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;background:#FDFCF8;border:1px solid #EDEADE;border-left:2px solid}
.zb-pt:hover{background:#F6F4EC}
.zb-pt-num{font-size:10px;color:#A6A196;font-family:'JetBrains Mono',monospace}
.zb-pt-title{flex:1;font-size:12px;color:#3F3B34;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.zb-pt-st{font-size:9px;letter-spacing:.4px;font-weight:600}
.zb-idle{font-size:12px;color:#A6A196;padding:9px 10px;border:1px dashed #D6D2C4;border-radius:6px}
.zb-cols{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;align-items:start}
.zb-col{border:1px solid #E4E1D4;border-radius:10px;background:#FBFAF5;min-height:130px;box-shadow:0 1px 2px rgba(40,35,25,.04)}
.zb-col-head{display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid #EDEADE}
.zb-col-head .l{display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.5px;font-weight:600}
.zb-col-head .c{font-size:13px;font-weight:700;font-family:'Newsreader',serif}
.zb-col-body{padding:9px;display:flex;flex-direction:column;gap:7px}
.zb-cc{cursor:pointer;padding:9px 10px;border-radius:7px;background:#FDFCF8;border:1px solid #EDEADE;border-left:2px solid}
.zb-cc:hover{background:#F6F4EC}
.zb-cc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.zb-cc-num{font-size:10px;color:#A6A196;font-family:'JetBrains Mono',monospace}
.zb-cc-title{font-size:11.5px;color:#3F3B34;line-height:1.4}
.zb-pad2{padding:22px 22px 56px}
.zb-d-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.zb-d-code{font-size:11px;color:#A6A196;font-family:'JetBrains Mono',monospace}
.zb-close{font-family:inherit;cursor:pointer;font-size:14px;color:#79746B;background:none;border:none}
.zb-close:hover{color:#211F1A}
.zb-d-badges{display:flex;align-items:center;gap:8px;margin-bottom:14px}
.zb-d-lvl{font-size:10px;font-weight:600;padding:3px 8px;border-radius:5px;border:1px solid}
.zb-d-st{display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.4px;font-weight:600;padding:3px 9px;border-radius:5px}
.zb-d-title{font-family:'Newsreader',serif;font-size:24px;font-weight:500;line-height:1.25;margin:0 0 11px;letter-spacing:-.2px}
.zb-d-desc{font-size:13px;color:#6E6A62;line-height:1.65;margin:0 0 18px}
.zb-d-box{border:1px solid #E4E1D4;border-radius:9px;padding:13px 14px;margin-bottom:16px;background:#FBFAF5}
.zb-d-box .l{font-size:9px;letter-spacing:1.4px;color:#A6A196;text-transform:uppercase;font-weight:600;margin-bottom:8px}
.zb-d-box .t{font-size:12.5px;color:#3F3B34;line-height:1.6}
.zb-d-meta{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:16px}
.zb-d-mbox{border:1px solid #E4E1D4;border-radius:9px;padding:11px 12px;background:#FBFAF5}
.zb-d-mbox .l{font-size:9px;color:#A6A196;letter-spacing:.5px;font-weight:600;margin-bottom:5px}
.zb-d-mbox .v{font-size:13px;color:#211F1A;font-weight:500}
.zb-d-mbox .tg{display:flex;gap:5px;flex-wrap:wrap}
.zb-d-sec{margin-bottom:18px}
.zb-hl2{font-size:9px;letter-spacing:1.4px;color:#A6A196;text-transform:uppercase;font-weight:600;margin-bottom:9px}
.zb-d-asg{display:flex;align-items:center;gap:11px;padding:10px 12px;border:1px solid #E4E1D4;border-radius:9px;background:#FBFAF5}
.zb-d-asg .n{font-size:13px;font-weight:600}
.zb-d-asg .r{font-size:11px;color:#79746B}
.zb-d-claimhint{font-size:12px;color:#A2532F;padding:10px 12px;border:1px dashed rgba(193,95,60,.4);border-radius:9px;background:rgba(193,95,60,.05)}
.zb-dep{cursor:pointer;display:flex;align-items:center;gap:9px;font-size:12px;color:#3F3B34;padding:7px 10px;border-radius:6px;background:#FBFAF5;border:1px solid #EDEADE}
.zb-dep:hover{background:#F6F4EC}
.zb-dep .e{font-family:'JetBrains Mono',monospace;color:#A6A196}
.zb-dep .tt{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.zb-d-actions{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
.zb-btn{font-family:inherit;cursor:pointer;border:none}
.zb-btn-acc{font-size:13.5px;font-weight:600;padding:12px;border-radius:8px;background:#C15F3C;color:#FBFAF5}
.zb-btn-acc:hover{background:#AC5030}
.zb-btn-dark{font-size:13.5px;font-weight:600;padding:12px;border-radius:8px;background:#211F1A;color:#FBFAF5}
.zb-btn-dark:hover{background:#38342C}
.zb-btn-rel{font-size:12.5px;padding:10px;border-radius:8px;background:#FFFFFF;border:1px solid #E0DDCF;color:#79746B;cursor:pointer;font-family:inherit}
.zb-btn-rel:hover{color:#B24A33;border-color:rgba(178,74,51,.4)}
.zb-btn-done{display:flex;align-items:center;justify-content:center;gap:8px;font-size:13.5px;font-weight:600;padding:12px;border-radius:8px;background:rgba(78,130,96,.1);border:1px solid rgba(78,130,96,.3);color:#4E8260}
.zb-log{display:flex;gap:11px}
.zb-log-rail{display:flex;flex-direction:column;align-items:center}
.zb-log-rail .d{width:7px;height:7px;border-radius:50%;margin-top:4px}
.zb-log-rail .ln{width:1px;flex:1;background:#E4E1D4;min-height:12px}
.zb-log-body{padding-bottom:14px}
.zb-log-body .t{font-size:12px;color:#3F3B34}
.zb-log-body .tm{font-size:10px;color:#A6A196;margin-top:2px}
.zb-feed-sub{font-size:12px;color:#79746B;margin-bottom:18px}
.zb-feed-i{display:flex;gap:12px}
.zb-feed-rail{display:flex;flex-direction:column;align-items:center}
.zb-feed-rail .ln{width:1px;flex:1;background:#E4E1D4;min-height:14px}
.zb-feed-body{padding-bottom:18px}
.zb-feed-line{font-size:12.5px;line-height:1.5}
.zb-feed-line .w{font-weight:600}
.zb-feed-line .a{color:#6E6A62}
.zb-feed-ref{cursor:pointer;font-size:11.5px;color:#79746B;margin-top:3px}
.zb-feed-ref:hover{color:#211F1A}
.zb-feed-ref .e{font-family:'JetBrains Mono',monospace;color:#A6A196}
.zb-feed-time{font-size:10px;color:#A6A196;margin-top:3px}
@media(max-width:1080px){.zb-grid{grid-template-columns:1fr;height:auto}.zb-left,.zb-right{border:none;border-bottom:1px solid #E4E1D4}.zb-prog{flex-direction:column}.zb-cols{grid-template-columns:1fr 1fr}}
`;

export default function Board({ initial }) {
  // Linear mirror is baked in at build time (page.jsx reads the JSON); demo data
  // is only used if that file is missing/empty — so there's no fake-data flash.
  const seed = initial && Array.isArray(initial.tasks) && initial.tasks.length
    ? { people: initial.people || {}, tasks: initial.tasks, feed: initial.feed || [] }
    : { people: PEOPLE, tasks: INITIAL_TASKS, feed: INITIAL_FEED };
  const [state, setState] = useState({
    tab: "zadania",
    selectedId: null,
    fLevel: "all",
    fStatus: [],
    fTags: [],
    people: seed.people,
    tasks: seed.tasks,
    feed: seed.feed,
  });
  const S = state;
  const up = (patch) => setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));

  const openClaim = () => window.open(DISCORD_URL, "_blank", "noopener");
  const taskById = (id) => S.tasks.find((t) => t.id === id);
  const taskByNum = (n) => S.tasks.find((t) => t.num === n);
  const setTab = (t) => up({ tab: t });
  const selectTask = (id) => up({ selectedId: id, tab: "zadania" });
  const closeDetail = () => up({ selectedId: null });
  const setLevel = (l) => up({ fLevel: l });
  const toggleStatus = (s) => up((st) => ({ fStatus: st.fStatus.includes(s) ? st.fStatus.filter((x) => x !== s) : [...st.fStatus, s] }));
  const toggleTag = (t) => up((st) => ({ fTags: st.fTags.includes(t) ? st.fTags.filter((x) => x !== t) : [...st.fTags, t] }));
  const resetFilters = () => up({ fLevel: "all", fStatus: [], fTags: [] });

  const assigneeOf = (t) => (t.assignee ? S.people[t.assignee] : null);

  const sm = STATUS_META, lm = LEVEL_META, tasks = S.tasks;
  const cu = {
    color: "#C15F3C", initials: "SLA", nick: "Projekt SLA", rung: null, rungLabel: "tablica społeczności",
    activeCount: tasks.filter((t) => isActive(t.status)).length,
    doneCount: tasks.filter((t) => t.status === "done").length,
  };

  const cnt = (s) => tasks.filter((t) => t.status === s).length;
  const stats = { total: tasks.length, wolne: cnt("wolne"), wziete: cnt("wziete"), wtoku: cnt("w-toku"), review: cnt("review"), done: cnt("done") };
  const summary = [
    { label: "wolne", count: stats.wolne, color: sm["wolne"].color },
    { label: "w toku", count: stats.wtoku + stats.wziete, color: sm["w-toku"].color },
    { label: "review", count: stats.review, color: sm["review"].color },
    { label: "done", count: stats.done, color: sm["done"].color },
  ];

  const ladder = LEVEL_ORDER.map((lv) => {
    const lvTasks = tasks.filter((t) => t.level === lv);
    const doneByUser = lvTasks.filter((t) => t.status === "done").length;
    return {
      lv, label: lm[lv].label, hint: lm[lv].hint, color: lm[lv].color, isCurrent: false,
      total: lvTasks.length, doneByUser,
      dotBorder: lm[lv].color, dotBg: "#FBFAF5", line: "#E4E1D4", fg: "#211F1A",
    };
  });

  const levelFilters = [{ id: "all", label: "wszystkie", dot: "#B3AEA2", count: tasks.length }]
    .concat(LEVEL_ORDER.map((lv) => ({ id: lv, label: lm[lv].label, dot: lm[lv].color, count: tasks.filter((t) => t.level === lv).length })))
    .map((o) => {
      const on = S.fLevel === o.id;
      return { ...o, bg: on ? "rgba(193,95,60,.07)" : "#FFFFFF", bd: on ? "#D6BBAC" : "#E4E1D4", fg: on ? "#211F1A" : "#6E6A62" };
    });
  const statusFilters = ["wolne", "wziete", "w-toku", "review", "done"].map((s) => {
    const on = S.fStatus.includes(s);
    return { id: s, label: sm[s].label, bg: on ? sm[s].bg : "#FFFFFF", bd: on ? sm[s].color : "#E4E1D4", fg: on ? sm[s].color : "#86817A" };
  });
  const tagFilters = Object.keys(TAG_META).map((t) => {
    const on = S.fTags.includes(t);
    return { id: t, label: t, bg: on ? TAG_META[t].bg : "#FFFFFF", bd: on ? TAG_META[t].color : "#E4E1D4", fg: on ? TAG_META[t].color : "#6E6A62" };
  });
  const filtersActive = S.fLevel !== "all" || S.fStatus.length > 0 || S.fTags.length > 0;

  const tab = S.tab || "zadania";
  const tabDefs = [{ id: "zadania", label: "Zadania" }, { id: "ludzie", label: "Kto co robi" }, { id: "przeglad", label: "Przegląd" }];

  const mapTask = (t) => {
    const a = assigneeOf(t);
    const mine = t.assignee === "me";
    const prog = t.status === "w-toku" || t.status === "review";
    return {
      id: t.id, numStr: pad(t.num), title: t.title, effort: t.effort, linear: t.linear,
      tags: mapTags(t.tags), levelColor: lm[t.level].color,
      statusLabel: sm[t.status].label, statusColor: sm[t.status].color,
      dotAnim: t.status === "w-toku" ? "zbPulse 1.8s ease-in-out infinite" : "none",
      hasProgress: prog, progressPct: (t.progress || 0) + "%",
      canClaim: t.status === "wolne", hasAssignee: !!a,
      aInitials: a ? a.initials : "", aColor: a ? a.color : "#C9C4B8", aNick: a ? a.nick : "",
      aNickColor: mine ? "#C15F3C" : "#6E6A62", mineTag: mine ? " · ty" : "",
      rowBg: S.selectedId === t.id ? "#FBF1EC" : "#FBFAF5", rowBd: S.selectedId === t.id ? "#D6BBAC" : "#E4E1D4",
    };
  };

  const passes = (t) =>
    (S.fLevel === "all" || t.level === S.fLevel) &&
    (S.fStatus.length === 0 || S.fStatus.includes(t.status)) &&
    (S.fTags.length === 0 || t.tags.some((x) => S.fTags.includes(x)));
  const visible = tasks.filter(passes);
  const groups = LEVEL_ORDER.map((lv) => {
    const gt = visible.filter((t) => t.level === lv).sort((a, b) => a.num - b.num);
    return { level: lv, label: lm[lv].label, hint: lm[lv].hint, color: lm[lv].color, count: gt.length, tasks: gt.map(mapTask) };
  }).filter((g) => g.count > 0);
  const hasResults = groups.length > 0;

  const progression = LEVEL_ORDER.map((lv) => {
    const lvTasks = tasks.filter((t) => t.level === lv);
    const done = lvTasks.filter((t) => t.status === "done").length;
    const pct = lvTasks.length ? Math.round((done / lvTasks.length) * 100) + "%" : "0%";
    return { tier: lm[lv].tier, label: lm[lv].label, hint: lm[lv].hint, color: lm[lv].color, done, total: lvTasks.length, pct };
  });

  const peopleCards = Object.keys(S.people)
    .map((pid) => {
      const p = S.people[pid];
      const ptasks = tasks
        .filter((t) => t.assignee === pid && isActive(t.status))
        .sort((a, b) => sm[a.status].order - sm[b.status].order)
        .map((t) => ({ id: t.id, numStr: pad(t.num), title: t.title, statusLabel: sm[t.status].label, statusColor: sm[t.status].color }));
      const doneCount = tasks.filter((t) => t.assignee === pid && t.status === "done").length;
      return { ...p, id: pid, isMe: false, doneCount, tasks: ptasks, hasTasks: ptasks.length > 0, idle: ptasks.length === 0 };
    })
    .filter((p) => p.hasTasks || p.doneCount > 0)
    .sort((a, b) => b.tasks.length - a.tasks.length || b.doneCount - a.doneCount);
  const activePeople = peopleCards.filter((p) => p.hasTasks).length;

  const columns = ["wolne", "wziete", "w-toku", "review", "done"].map((s) => {
    const ct = tasks
      .filter((t) => t.status === s)
      .sort((a, b) => a.num - b.num)
      .map((t) => {
        const a = assigneeOf(t);
        return { id: t.id, numStr: pad(t.num), title: t.title, levelColor: lm[t.level].color, hasAssignee: !!a, aInitials: a ? a.initials : "", aColor: a ? a.color : "#C9C4B8" };
      });
    return { label: sm[s].label, color: sm[s].color, count: ct.length, tasks: ct };
  });

  const selT = S.selectedId ? taskById(S.selectedId) : null;
  let d = null;
  if (selT) {
    const a = assigneeOf(selT);
    const mine = selT.assignee === "me";
    const deps = selT.deps
      .map((n) => {
        const dt = taskByNum(n);
        return dt ? { id: dt.id, numStr: pad(dt.num), title: dt.title, statusColor: sm[dt.status].color } : null;
      })
      .filter(Boolean);
    const log = [];
    log.push({ text: "zadanie utworzone w Linear (" + selT.linear + ")", time: "5 dni temu", color: "#C2BDB1" });
    if (a) log.push({ text: "przypisane do " + a.nick, time: "2 dni temu", color: a.color });
    if (selT.status === "w-toku") log.push({ text: "w toku — postęp " + (selT.progress || 0) + "%", time: "dziś", color: sm["w-toku"].color });
    if (selT.status === "review") log.push({ text: "zgłoszone do review", time: "dziś", color: sm["review"].color });
    if (selT.status === "done") log.push({ text: "domknięte i zweryfikowane", time: "dziś", color: sm["done"].color });
    d = {
      numStr: pad(selT.num), linear: selT.linear, title: selT.title,
      desc: "Tier: " + lm[selT.level].label + " — " + lm[selT.level].hint + ". Tagi: " + selT.tags.join(", ") + ".",
      levelLabel: lm[selT.level].label, levelColor: lm[selT.level].color, levelBd: lm[selT.level].bd,
      statusLabel: sm[selT.status].label, statusColor: sm[selT.status].color, statusBg: sm[selT.status].bg,
      dod: selT.dod, effort: selT.effort, tags: mapTags(selT.tags),
      hasAssignee: !!a, aInitials: a ? a.initials : "", aColor: a ? a.color : "#C9C4B8", aNick: a ? a.nick : "", aRungLabel: a ? a.rungLabel : "", mineTag: mine ? " · ty" : "",
      deps,
      canClaim: selT.status === "wolne", canStart: mine && selT.status === "wziete",
      canReview: mine && selT.status === "w-toku", canRelease: mine && (selT.status === "wziete" || selT.status === "w-toku"),
      isDone: selT.status === "done", log, id: selT.id,
    };
  }

  const feed = S.feed.map((f) => {
    const t = taskById(f.tid);
    const p = S.people[f.a] || { color: "#C9C4B8", initials: "?" };
    return { who: f.who, action: f.action, color: p.color, initials: p.initials, code: t ? t.linear : "", taskTitle: t ? t.title : "", time: f.time, tid: f.tid };
  });

  return (
    <div className="zb">
      <style>{css}</style>
      <div className="zb-grid">
        {/* LEFT */}
        <aside className="zb-left">
          <div className="zb-card">
            <div className="zb-uc-row">
              <div className="zb-av" style={{ width: 36, height: 36, borderRadius: 7, fontSize: 13, background: cu.color }}>{cu.initials}</div>
              <div className="zb-uc-name">
                <div className="n">{cu.nick}</div>
                <div className="r">{cu.rung ? "poziom " + cu.rung + " · " : ""}{cu.rungLabel}</div>
              </div>
            </div>
            <div className="zb-uc-stats">
              <div className="zb-stat"><div className="v" style={{ color: "#B07D2E" }}>{cu.activeCount}</div><div className="l">aktywne</div></div>
              <div className="zb-stat"><div className="v" style={{ color: "#4E8260" }}>{cu.doneCount}</div><div className="l">domknięte</div></div>
            </div>
          </div>

          <div className="zb-sec">
            <div className="zb-hl">drabina kontrybutora</div>
            {ladder.map((st) => (
              <div className="zb-lad" key={st.lv}>
                <div className="zb-lad-rail">
                  <div className="zb-lad-dot" style={{ border: "2px solid " + st.dotBorder, background: st.dotBg }} />
                  <div className="zb-lad-line" style={{ background: st.line }} />
                </div>
                <div className="zb-lad-body">
                  <div className="zb-lad-h">
                    <span className="lb" style={{ color: st.fg }}>{st.label}</span>
                    {st.isCurrent && <span className="zb-badge-cur" style={{ background: st.color }}>TU JESTEŚ</span>}
                  </div>
                  <div className="zb-lad-hint">{st.hint}</div>
                  <div className="zb-lad-cnt">{st.doneByUser}/{st.total} zrobione w tierze</div>
                </div>
              </div>
            ))}
          </div>

          <div className="zb-sec f">
            <div className="zb-f-head">
              <div className="zb-hl" style={{ marginBottom: 0 }}>filtry</div>
              {filtersActive && <button className="zb-reset" onClick={resetFilters}>wyczyść ✕</button>}
            </div>
            <div className="zb-f-sub">poziom</div>
            <div className="zb-f-col">
              {levelFilters.map((lf) => (
                <button className="zb-lf" key={lf.id} onClick={() => setLevel(lf.id)} style={{ background: lf.bg, border: "1px solid " + lf.bd, color: lf.fg }}>
                  <span className="l"><span className="zb-dot" style={{ background: lf.dot }} />{lf.label}</span>
                  <span className="c">{lf.count}</span>
                </button>
              ))}
            </div>
            <div className="zb-f-sub">status</div>
            <div className="zb-f-wrap">
              {statusFilters.map((sf) => (
                <button className="zb-sf" key={sf.id} onClick={() => toggleStatus(sf.id)} style={{ background: sf.bg, border: "1px solid " + sf.bd, color: sf.fg }}>{sf.label}</button>
              ))}
            </div>
            <div className="zb-f-sub">tagi</div>
            <div className="zb-f-wrap last">
              {tagFilters.map((tf) => (
                <button className="zb-tf" key={tf.id} onClick={() => toggleTag(tf.id)} style={{ background: tf.bg, border: "1px solid " + tf.bd, color: tf.fg }}>{tf.label}</button>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="zb-main">
          <div className="zb-tabbar">
            <div className="zb-tabbar-row">
              <div className="zb-tabs">
                {tabDefs.map((tb) => (
                  <button className="zb-tab" key={tb.id} onClick={() => setTab(tb.id)} style={{ color: tab === tb.id ? "#211F1A" : "#79746B", borderBottomColor: tab === tb.id ? "#C15F3C" : "transparent" }}>{tb.label}</button>
                ))}
              </div>
              <div className="zb-sum">
                {summary.map((s) => (
                  <div className="zb-sum-i" key={s.label}>
                    <span className="zb-dot" style={{ background: s.color }} />
                    <span className="v" style={{ color: s.color }}>{s.count}</span>
                    <span className="l">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {tab === "zadania" && (
            <div className="zb-pad">
              <div className="zb-prog">
                {progression.map((pr) => (
                  <div className="zb-prog-i" key={pr.tier} style={{ borderLeft: "3px solid " + pr.color }}>
                    <div className="zb-prog-top">
                      <span className="zb-prog-tier" style={{ color: pr.color }}>{pr.tier}</span>
                      <span className="zb-prog-c">{pr.done}/{pr.total}</span>
                    </div>
                    <div className="zb-prog-label">{pr.label}</div>
                    <div className="zb-prog-hint">{pr.hint}</div>
                    <div className="zb-track"><i style={{ width: pr.pct, background: pr.color }} /></div>
                  </div>
                ))}
              </div>

              {hasResults ? (
                groups.map((g) => (
                  <div className="zb-group" key={g.level}>
                    <div className="zb-g-head">
                      <span className="zb-dot" style={{ width: 9, height: 9, background: g.color }} />
                      <span className="zb-g-label">{g.label}</span>
                      <span className="zb-g-hint">{g.hint}</span>
                      <span className="zb-g-rule" />
                      <span className="zb-g-cnt">{g.count} zadań</span>
                    </div>
                    <div className="zb-g-tasks">
                      {g.tasks.map((task) => (
                        <div className="zb-task" key={task.id} onClick={() => selectTask(task.id)} style={{ borderColor: task.rowBd, borderLeft: "3px solid " + task.levelColor, background: task.rowBg }}>
                          <span className="zb-task-num">{task.numStr}</span>
                          <div className="zb-task-body">
                            <div className="zb-task-title">{task.title}</div>
                            <div className="zb-task-meta">
                              {task.tags.map((tag) => (
                                <span className="zb-chip" key={tag.label} style={{ color: tag.color, background: tag.bg }}>{tag.label}</span>
                              ))}
                              <span className="zb-task-eff">· {task.effort}</span>
                              <span className="zb-task-lin">· {task.linear}</span>
                            </div>
                            {task.hasProgress && (
                              <div className="zb-task-prog"><i style={{ width: task.progressPct, background: task.statusColor }} /></div>
                            )}
                          </div>
                          <div className="zb-task-st">
                            <span className="zb-dot" style={{ background: task.statusColor, animation: task.dotAnim }} />
                            <span className="l" style={{ color: task.statusColor }}>{task.statusLabel}</span>
                          </div>
                          <div className="zb-task-act">
                            {task.canClaim ? (
                              <button className="zb-claim" onClick={(e) => { e.stopPropagation(); openClaim(); }}>weź na siebie →</button>
                            ) : task.hasAssignee ? (
                              <div className="zb-asg">
                                <div className="zb-av" style={{ width: 23, height: 23, borderRadius: 5, fontSize: 10, background: task.aColor }}>{task.aInitials}</div>
                                <span className="n" style={{ color: task.aNickColor }}>{task.aNick}{task.mineTag}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="zb-empty">
                  <div className="t">brak zadań dla tych filtrów</div>
                  <button className="zb-empty-btn" onClick={resetFilters}>wyczyść filtry</button>
                </div>
              )}
            </div>
          )}

          {tab === "ludzie" && (
            <div className="zb-pad">
              <div className="zb-view-sub">kto bierze co · {activePeople} osób aktywnych w tym cyklu</div>
              <div className="zb-people">
                {peopleCards.map((p) => (
                  <div className="zb-pcard" key={p.id}>
                    <div className="zb-pc-head">
                      <div className="zb-av" style={{ width: 38, height: 38, borderRadius: 8, fontSize: 14, background: p.color }}>{p.initials}</div>
                      <div className="zb-pc-info">
                        <div className="zb-pc-nrow">
                          <span className="zb-pc-nick">{p.nick}</span>
                          {p.maintainer && <span className="zb-badge-maint">maintainer</span>}
                          {p.isMe && <span className="zb-badge-me">to ty</span>}
                        </div>
                        <div className="zb-pc-rung">poziom {p.rung} · {p.rungLabel}</div>
                      </div>
                      <div className="zb-pc-done"><div className="v">{p.doneCount}</div><div className="l">domknięte</div></div>
                    </div>
                    {p.hasTasks ? (
                      <div className="zb-pc-tasks">
                        {p.tasks.map((pt) => (
                          <div className="zb-pt" key={pt.id} onClick={() => selectTask(pt.id)} style={{ borderLeftColor: pt.statusColor }}>
                            <span className="zb-pt-num">{pt.numStr}</span>
                            <span className="zb-pt-title">{pt.title}</span>
                            <span className="zb-pt-st" style={{ color: pt.statusColor }}>{pt.statusLabel}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="zb-idle">wolny — brak aktywnych zadań</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "przeglad" && (
            <div className="zb-pad">
              <div className="zb-view-sub">przegląd dla maintainera · stan wszystkich {stats.total} zadań wg statusu</div>
              <div className="zb-cols">
                {columns.map((c) => (
                  <div className="zb-col" key={c.label}>
                    <div className="zb-col-head">
                      <span className="l" style={{ color: c.color }}><span className="zb-dot" style={{ background: c.color }} />{c.label}</span>
                      <span className="c" style={{ color: c.color }}>{c.count}</span>
                    </div>
                    <div className="zb-col-body">
                      {c.tasks.map((ct) => (
                        <div className="zb-cc" key={ct.id} onClick={() => selectTask(ct.id)} style={{ borderLeftColor: ct.levelColor }}>
                          <div className="zb-cc-top">
                            <span className="zb-cc-num">{ct.numStr}</span>
                            {ct.hasAssignee && <div className="zb-av" style={{ width: 17, height: 17, borderRadius: 4, fontSize: 8, background: ct.aColor }}>{ct.aInitials}</div>}
                          </div>
                          <div className="zb-cc-title">{ct.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* RIGHT */}
        <aside className="zb-right">
          {d ? (
            <div className="zb-pad2">
              <div className="zb-d-head">
                <span className="zb-d-code">{d.numStr} · {d.linear}</span>
                <button className="zb-close" onClick={closeDetail}>✕</button>
              </div>
              <div className="zb-d-badges">
                <span className="zb-d-lvl" style={{ color: d.levelColor, borderColor: d.levelBd }}>{d.levelLabel}</span>
                <span className="zb-d-st" style={{ color: d.statusColor, background: d.statusBg }}><span className="zb-dot" style={{ width: 6, height: 6, background: d.statusColor }} />{d.statusLabel}</span>
              </div>
              <h2 className="zb-d-title">{d.title}</h2>
              <p className="zb-d-desc">{d.desc}</p>

              <div className="zb-d-box">
                <div className="l">definicja done</div>
                <div className="t">{d.dod}</div>
              </div>

              <div className="zb-d-meta">
                <div className="zb-d-mbox"><div className="l">SZACUNEK</div><div className="v">{d.effort}</div></div>
                <div className="zb-d-mbox"><div className="l">TAGI</div><div className="tg">{d.tags.map((tag) => <span className="zb-chip" key={tag.label} style={{ color: tag.color, background: tag.bg }}>{tag.label}</span>)}</div></div>
              </div>

              <div className="zb-d-sec">
                <div className="zb-hl2">przypisane do</div>
                {d.hasAssignee && (
                  <div className="zb-d-asg">
                    <div className="zb-av" style={{ width: 30, height: 30, borderRadius: 7, fontSize: 11, background: d.aColor }}>{d.aInitials}</div>
                    <div><div className="n">{d.aNick}{d.mineTag}</div><div className="r">{d.aRungLabel}</div></div>
                  </div>
                )}
                {d.canClaim && <div className="zb-d-claimhint">wolne — możesz wziąć to zadanie na siebie</div>}
              </div>

              {d.deps.length > 0 && (
                <div className="zb-d-sec">
                  <div className="zb-hl2">zależności</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {d.deps.map((dp) => (
                      <div className="zb-dep" key={dp.id} onClick={() => selectTask(dp.id)}>
                        <span style={{ color: dp.statusColor }}>›</span>
                        <span className="e">{dp.numStr}</span>
                        <span className="tt">{dp.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="zb-d-actions">
                {d.canClaim && <button className="zb-btn zb-btn-acc" onClick={openClaim}>weź to zadanie na siebie →</button>}
                {d.isDone && <div className="zb-btn-done">✓ zadanie domknięte</div>}
              </div>

              <div>
                <div className="zb-hl2">aktywność</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {d.log.map((lg, i) => (
                    <div className="zb-log" key={i}>
                      <div className="zb-log-rail"><span className="d" style={{ background: lg.color }} /><span className="ln" /></div>
                      <div className="zb-log-body"><div className="t">{lg.text}</div><div className="tm">{lg.time}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="zb-pad2">
              <div className="zb-hl2" style={{ marginBottom: 4 }}>strumień community</div>
              <div className="zb-feed-sub">ostatnie ruchy na zadaniach</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {feed.map((f, i) => (
                  <div className="zb-feed-i" key={i}>
                    <div className="zb-feed-rail">
                      <div className="zb-av" style={{ width: 26, height: 26, borderRadius: 6, fontSize: 9, background: f.color, flex: "none" }}>{f.initials}</div>
                      <span className="ln" />
                    </div>
                    <div className="zb-feed-body">
                      <div className="zb-feed-line"><span className="w" style={{ color: f.color }}>{f.who}</span> <span className="a">{f.action}</span></div>
                      <div className="zb-feed-ref" onClick={() => selectTask(f.tid)}><span className="e">{f.code}</span> · {f.taskTitle}</div>
                      <div className="zb-feed-time">{f.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
