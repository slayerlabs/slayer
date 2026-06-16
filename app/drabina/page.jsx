export const metadata = {
  title: "Drabina — od obserwatora do core teamu | Slayer",
  description:
    "Drabina społeczności Slayer: 7 poziomów statusu, odpowiedzialności i dowodów pracy. Awans za artefakty, nie za gadanie. Lejek: Discord → starter task → Contributor → Builder → Fellow → Maintainer → Core.",
};

const LEVELS = [
  {
    no: "01", name: "Lurker", cel: "obserwuje, czyta, uczy się języka projektu",
    dostajesz: ["publiczne kanały i weekly updates", "roadmapę i reading listę", "dostęp do demo, modeli i leaderboardów"],
    oczekiwanie: ["zero presji", "czytaj, reaguj, zadawaj pytania"],
    dalejLabel: "dalej, gdy",
    dalej: ["pierwsza sensowna wiadomość lub zgłoszenie błędu", "próba odpalenia modelu albo benchmarku"],
  },
  {
    no: "02", name: "User", cel: "realnie używa i daje feedback",
    dostajesz: ["narzędzia, modele, playground", "kanał feedbackowy i early access do buildów", "możliwość proponowania use-case'ów"],
    oczekiwanie: ["raportujesz jakość: gdzie model się wywala", "przykłady promptów, porażek, edge-case'ów"],
    dalejLabel: "dalej, gdy",
    dalej: ["3–5 użytecznych feedbacków z konkretami", "aktywność bez chaotycznego spamu"],
  },
  {
    no: "03", name: "Contributor", cel: "dokłada małe, mierzalne cegły",
    dostajesz: ["rolę, kanały robocze, zadania z backlogu", "publiczny credit w changelogu i README", "opcjonalnie bounty"],
    oczekiwanie: ["dane, evale, kod, research notes albo onboarding innych", "kończenie małych zadań, komunikacja async, brak ego-dramy"],
    dalejLabel: "dalej, gdy",
    dalej: ["2–3 zaakceptowane contribution", "powtarzalność zamiast jednorazowego zrywu"],
  },
  {
    no: "04", name: "Operator / Builder", cel: "człowiek, któremu można dać fragment systemu",
    dostajesz: ["ownership małego obszaru (eval suite, pipeline danych, harness, docs, inference…)", "prywatniejsze kanały robocze i mini-projekt", "priorytet przy bounty i płatnej współpracy"],
    oczekiwanie: ["dowozisz co tydzień i sam rozbijasz problem na taski", "raportujesz status, przyciągasz 1–2 kolejnych ludzi"],
    dalejLabel: "dalej, gdy",
    dalej: ["zamknięty projekt z widocznym artefaktem", "powtarzalna praca przez 3–4 tygodnie"],
  },
  {
    no: "05", name: "Research Fellow", cel: "semi-core, prowadzi eksperymenty",
    dostajesz: ["compute, dane, prywatny kanał research", "eksperymenty pod brandem labu, współautorstwo raportów", "potencjalnie grant, bounty albo stypendium"],
    oczekiwanie: ["hipotezy, eksperymenty z logami, krótkie technical notes", "nie „ma opinie”, tylko generuje evidence"],
    dalejLabel: "dalej, gdy",
    dalej: ["1 solidny publiczny artefakt (np. „Eval Failure Taxonomy”, „Synthetic Data Recipe”)", "1 eksperyment użyteczny dla modelu, bez prowadzenia za rękę"],
  },
  {
    no: "06", name: "Maintainer", cel: "pilnuje jakości części labu",
    dostajesz: ["merge i review rights w wybranym repo", "realny wpływ na roadmapę, strategiczne calle", "ścieżkę revenue / bounty / kontraktów"],
    oczekiwanie: ["review contribution, utrzymywanie standardów", "zamykanie pętli, projektowanie procesów, bycie filtrem jakości"],
    dalejLabel: "dalej, gdy",
    dalej: ["dowozi 2–3 miesiące, inni chcą z nim pracować", "umie powiedzieć „nie” i ma techniczny smak"],
  },
  {
    no: "07", name: "Core Team", cel: "buduje instytucję, nie tylko robi taski",
    dostajesz: ["upside zależny od struktury (equity / revenue share)", "pełny kontekst strategiczny i decyzyjność", "ownership filaru: Models, Data, Evals, Inference, Community, Research Ops, Commercial"],
    oczekiwanie: ["działa jak founder obszaru i rekrutuje innych", "reprezentuje lab na zewnątrz"],
    dalejLabel: "kryteria",
    dalej: ["trust ponad skill, długoterminowość", "wysoka energia, niski chaos"],
  },
];

const FUNNEL = ["Reach", "Discord", "Starter task", "Contributor", "Builder", "Fellow", "Maintainer", "Core"];

const PROOF = [
  "dobry issue", "eval case", "dataset PR", "benchmark run", "technical note",
  "onboarding guide", "eksperyment z logami", "model comparison", "bug report", "pull request",
];

const ROLES = ["Observer", "User", "Contributor", "Builder", "Research Fellow", "Maintainer", "Core"];
const SKILLS = ["data", "evals", "training", "inference", "frontend", "backend", "infra", "research", "community", "docs", "bizdev"];

const STARTERS = [
  "Znajdź 20 polskich promptów, na&nbsp;których Bielik/Qwen failuje.",
  "Dodaj 10 przykładów do eval suite.",
  "Uruchom benchmark i&nbsp;wrzuć wynik.",
  "Napisz 1-stronicowe streszczenie papera.",
  "Zrób taksonomię błędów modelu na&nbsp;30 przykładach.",
  "Popraw docs instalacji albo porównaj 3 modele na&nbsp;jednym tasku.",
];

const QUEST = `Title:     20 promptów, na których pada Bielik
Context:   eval stylu PL, sekcja anty-tells
Expected:  JSONL: prompt + output + co poszło źle
Difficulty: S / M / L
Reward:    credit · bounty · progres roli
Reviewer:  maintainer obszaru
Deadline:  7 dni`;

export default function Drabina() {
  return (
    <main className="sl">
      <section className="sl-hero">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">07</div>
            <div>
              <div className="sl-eye">społeczność · drabina statusu, odpowiedzialności i&nbsp;dowodów pracy</div>
              <h1 className="sl-h1" style={{ marginTop: 12 }}>Od obserwatora do <span className="sl-acc">core teamu.</span></h1>
              <p className="sl-lede" style={{ marginTop: 18 }}>Społeczność labu nie jest tłumem; to&nbsp;lejek rekrutacyjny z&nbsp;publicznym research outputem. Każdy poziom ma jasne wejście, oczekiwania i&nbsp;nagrodę, a&nbsp;awans przyznajemy za artefakty, nie za gadanie.</p>
              <div className="sl-cta" style={{ marginTop: 24, flexWrap: "wrap", gap: 8 }}>
                {FUNNEL.map((step, i) => (
                  <span key={step} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className="sl-chip">{step}</span>
                    {i < FUNNEL.length - 1 && <span className="sl-acc" style={{ fontFamily: "var(--sl-mono)", fontSize: 12 }}>›</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">siedem poziomów · wejście · co dostajesz · dowód przejścia wyżej</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Siedem <span className="sl-acc">poziomów.</span></h2>

          <div className="sl-entries" style={{ marginTop: 22 }}>
            {LEVELS.map((l) => (
              <div className="sl-entry" key={l.no}>
                <div className="sl-no">{l.no}</div>
                <div>
                  <h3>{l.name}</h3>
                  <p style={{ marginBottom: 16 }}>{l.cel}</p>
                  <div className="sl-cols">
                    <div className="sl-col sl-col-lead">
                      <div className="sl-clbl">dostajesz</div>
                      <ul className="sl-list">{l.dostajesz.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    </div>
                    <div className="sl-col">
                      <div className="sl-clbl">oczekiwanie</div>
                      <ul className="sl-list">{l.oczekiwanie.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    </div>
                    <div className="sl-col">
                      <div className="sl-clbl">{l.dalejLabel}</div>
                      <ul className="sl-list">{l.dalej.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">01</div>
            <div>
              <div className="sl-eye">proof of work · awans za artefakty, nie za gadanie</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Każdy poziom ma <span className="sl-acc">dowód pracy.</span></h2>
              <p className="sl-lede" style={{ marginTop: 12 }}>Liczą się rzeczy, które można otworzyć, odpalić i&nbsp;ocenić:</p>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 22 }}>
            {PROOF.map((p) => <span className="sl-chip" key={p}>{p}</span>)}
          </div>
          <div className="sl-cols" style={{ marginTop: 26 }}>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">role na&nbsp;discordzie</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ROLES.map((r) => <span className="sl-chip" key={r}>{r}</span>)}
              </div>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">tagi kompetencji</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SKILLS.map((s) => <span className="sl-chip sl-mute" key={s}>{s}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">02</div>
            <div>
              <div className="sl-eye">onboarding · pierwsze 7 dni · od wejścia do pierwszego artefaktu</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Pierwsze <span className="sl-acc">7 dni.</span></h2>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">krok 1–3</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Wejdź i&nbsp;wybierz ścieżkę</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Dołącz na&nbsp;Discorda, przeczytaj „Start Here”, wybierz: data / evals / code / research / community.</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">krok 4–5</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Zrób starter task</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Jeden mały task z&nbsp;quest boardu. Dostajesz feedback od reviewera w&nbsp;ciągu paru dni.</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">krok 6–7</div>
              <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Dowiezione = Contributor</h3>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Zaakceptowany artefakt to&nbsp;rola Contributor, kanały robocze i&nbsp;kolejne taski z&nbsp;backlogu.</p>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 26 }}>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">przykładowe starter taski</div>
              <ul className="sl-list">
                {STARTERS.map((s, i) => <li key={i} dangerouslySetInnerHTML={{ __html: s }} />)}
              </ul>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">quest board · format taska</div>
              <pre className="sl-pre">{QUEST}</pre>
              <p className="sl-fn">kategorie: good first tasks · bounties · research / eval / data / infra quests · needs owner</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">03</div>
            <div>
              <div className="sl-eye">prestiż · co dostają ludzie, którzy dowożą</div>
              <h2 className="sl-h2" style={{ marginTop: 10 }}>Prestiż musi być <span className="sl-acc">widoczny.</span></h2>
            </div>
          </div>
          <div className="sl-cols" style={{ marginTop: 22 }}>
            <div className="sl-col sl-col-lead">
              <div className="sl-clbl">publiczny credit</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Leaderboard contributorów, credits w&nbsp;README, monthly builders report, shoutouty na&nbsp;X/LinkedIn.</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">dostęp</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Compute, priority access do modeli, prywatne calle, współautorstwo raportów.</p>
            </div>
            <div className="sl-col">
              <div className="sl-clbl">pieniądze</div>
              <p className="sl-lede" style={{ fontSize: 14.5 }}>Bounty, płatne zlecenia, kontrakty; core team z&nbsp;upside&apos;em zależnym od struktury.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner" style={{ maxWidth: 760, marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
          <div className="sl-eye" style={{ display: "block" }}>start</div>
          <h2 className="sl-h2" style={{ margin: "12px 0 14px" }}>Wejdź na&nbsp;<span className="sl-acc">drabinę.</span></h2>
          <p className="sl-lede" style={{ margin: "0 auto 24px" }}>Pierwszy szczebel to&nbsp;jedna sensowna wiadomość albo jeden starter task. Reszta to&nbsp;powtarzalne artefakty.</p>
          <div className="sl-cta" style={{ justifyContent: "center" }}>
            <a className="sl-btn sl-btn-p" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">Dołącz na&nbsp;Discord →</a>
            <a className="sl-btn sl-btn-s" href="/zadania">zobacz zadania</a>
          </div>
        </div>
      </section>
    </main>
  );
}
