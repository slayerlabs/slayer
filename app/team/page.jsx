export const metadata = {
  title: "Zespół — Slayer",
  description: "Ludzie budujący Slayer — applied research lab dla polskich modeli językowych.",
};

const css = `
    .phero { padding-top: 100px; padding-bottom: 38px; }
    .sec.tight { padding-top: 28px; padding-bottom: 48px; }

    .hero-lead {
      font-size: clamp(1.05rem, 1.6vw, 1.22rem);
      color: var(--mut);
      max-width: 58ch;
      line-height: 1.65;
      margin-top: 20px;
    }
    .hero-lead em { color: var(--txt); font-style: italic; }

    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: clamp(12px, 2vw, 20px);
      margin-top: 24px;
    }

    .member {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .av {
      width: 100%;
      aspect-ratio: 3 / 4;
      border-radius: var(--rad);
      background: linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.012)), var(--bg2);
      border: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }
    .av img { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }
    .av-init {
      font-family: var(--serif);
      font-size: 4.5rem;
      font-weight: 300;
      color: var(--acc);
      opacity: .28;
      letter-spacing: -.02em;
      user-select: none;
    }

    .member-info {}
    .member-title-label {
      font-family: var(--mono);
      font-size: .68rem;
      letter-spacing: .13em;
      text-transform: uppercase;
      color: var(--acc);
      margin-bottom: 8px;
    }
    .member-name {
      font-family: var(--serif);
      font-size: clamp(1.7rem, 3vw, 2.2rem);
      font-weight: 400;
      letter-spacing: -.02em;
      line-height: 1.05;
      margin: 0 0 4px;
    }
    .member-specialty {
      font-family: var(--mono);
      font-size: .75rem;
      color: var(--dim);
      letter-spacing: .04em;
      margin-bottom: 12px;
    }
    .member-bio {
      font-size: .95rem;
      color: var(--mut);
      line-height: 1.65;
      margin: 0;
    }

    /* CTA section */
    .join-cta {
      margin-top: clamp(56px, 8vw, 96px);
      padding: clamp(36px, 5vw, 56px);
      border: 1px solid var(--line);
      border-radius: var(--rad);
      background: linear-gradient(180deg, rgba(199,148,72,.06), rgba(255,255,255,.012)), var(--panel);
      box-shadow: 0 22px 60px rgba(0,0,0,.25);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 28px;
      flex-wrap: wrap;
    }
    .join-cta h2 {
      font-family: var(--serif);
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 400;
      letter-spacing: -.015em;
      margin: 0 0 8px;
    }
    .join-cta p {
      margin: 0;
      color: var(--mut);
      font-size: .96rem;
      max-width: 48ch;
    }
`;

const FOUNDER = { img: "/assets/team/kacper-wikiel.png", name: "Kacper Wikieł", specialty: "ML · Infrastruktura", bio: "ML, infrastruktura treningowa i optymalizacja modeli. Założyciel i lider Slayera." };

const MEMBERS = [
  { img: "/assets/team/kamil-dzieniszewski.jpeg", name: "Kamil Dzieniszewski", specialty: "Product · Community · Operations", bio: "Koordynuje kontrybutorów, buduje społeczność, wspiera inicjatywy produktowe i pomaga zamieniać pomysły w wysłane projekty." },
  { img: "/assets/team/piotr-nalepa.webp", name: "Piotr Nalepa", specialty: "Fullstack · Narzędzia developerskie", bio: "Fullstack, zarządzanie projektem i tworzenie narzędzi dla developerów." },
  { img: "/assets/team/piotr-rozek.jpeg", name: "Piotr Rożek", specialty: "Python · Fizyka", bio: "Fizyk z wykształcenia, Python developer, człowiek renesansu." },
  { img: "/assets/team/piotr-styla.webp", name: "Piotr Styła", specialty: "Rekrutacja · Agenci LLM", bio: "Za dnia rekrutuje i onboarduje talenty, po zmroku LLM Slayer: buduje zespoły agentów (call center dla branży medycznej) oraz aplikacje webowe i na Androida. AGH." },
  { img: "/assets/team/bartlomiej-boczylo.jpg", name: "Bartłomiej Boczyło", specialty: "ML · Frontend", bio: "Student II roku inżynierii AI. Frontend dev, rozwija się w ML/DL, CV, NLP, RL i modelach generatywnych. Stack: Python, TensorFlow, PyTorch, MLOps." },
  { img: "/assets/team/michal-konieczka.jpeg", name: "Michał Konieczka", specialty: "Fullstack · UX · Product development", bio: "Fullstack, UX i product development." },
  { img: "/assets/team/kuba6.jpg", name: "Kuba", specialty: "AI Engineer · Fullstack", bio: "Fizyk-teoretyk z wykształcenia. AI Engineer w projekcie onkologicznym (CV), ostatnie 2 lata w GenAI i agentach. Chce trenować LLM, robi datasety i benchmarki." },
  { img: "/assets/team/lizzy.jpg", name: "Elżbieta Dawidek (Lizzy)", specialty: "Antropolog · Logopeda · AAC", bio: "Antropolog, logopeda, specjalistka wspomagających i alternatywnych metod komunikacji (AAC). Bada sposoby budowania języka. Projektuje zadania diagnostyczne dla modeli językowych, sprawdzające polską fleksję, przypadki i rozumienie relacji w zdaniu. Wykładowczyni akademicka, Uniwersytet DSW Ideis." },
  { img: "/assets/team/kamil-kaczmarek.png", name: "Kamil Kaczmarek", specialty: "Fullstack · Boty · Mikroserwisy", bio: "Fullstack deweloper. Buduje bota, mikroserwisy i narzędzia dla agencji marketingowej. Współtwórca systemu zarządzającego dziesiątkami tysięcy ofert na Allegro. Dostarcza end-to-end: od pomysłu do wdrożenia." },
  { img: "/assets/team/grzegorz.jpeg", name: "Grzegorz Trzaskoma", specialty: "Backend · Java · Node.js", bio: "Student informatyki II roku. Buduje framework agentowy @the-brain/core oraz aplikację Scheduler (system zarządzania pracownikami) jako sandbox dla agentów. Pełne środowisko testowe w terminalu, pamięć agenta w rozwój. gt-processing.com" },
  { img: "/assets/team/TG_Bio_v.jpg", name: "Tomek Guściora", specialty: "AI Devs Alumni · LLM · Agents", bio: "Uczestnik kursu AI Devs. Pracuje z LLM i agentami AI, rozwija praktyczne zastosowania modeli językowych w projektach produkcyjnych." },
  { img: "/assets/team/jakubb.png", name: "Jakub Burkiewicz", specialty: "Architect · Fullstack · Agents", bio: "Absolwent AI_Devs. Webowy Solution Architect i Full-stack Developer. AI-native od 2024 roku. Mieszam się w agenturę AI." },
  { img: "/assets/team/sygrydstorrada.webp", name: "Martyna Kazimierczuk (Nola)", specialty: "Fullstack · Agents · LLM Architecture", bio: "Programistka fullstack w Xfaang. Obecnie pracuję głównie z agentami AI i projektowaniem architektury współdziałania modeli LLM. Oprócz technologii interesuje mnie literatura, historia i sztuki wizualne." },
  { img: "/assets/team/s3nh.jpg", name: "Damian Panek", specialty: "ML Engineer · OSS · Quantization", bio: "ML Engineer, fanatyk open source. Specjalizuje się w metodach kwantyzacji i optymalizacji SOTA modeli." },
  { img: "/assets/team/konradtalik.jpg", name: "Konrad Talik", specialty: "Agent Workflows · ML Strategy · Data Viz", bio: "Wielogodzinny agentowy przepływ pracy, strategia uczenia maszynowego w oparciu o eksplorację i wizualizację danych.", link: "https://www.linkedin.com/in/ktalik", link2: "https://www.kondz.io/" },
  { img: "/assets/team/jezałb.jpg", name: "Błażej", specialty: "Data Science · NLP/LLM · ML", bio: "Bachelor Data Science, kończy MSc Data Science & AI na TU Eindhoven. Pracuje w Pythonie i R: czyszczenie danych, EDA, ewaluacja modeli, benchmarki. Prowadzi badania nad sieciami cytowań i modelami predykcyjnymi. Chętnie angażuje się w tematy agentów AI i LLM." },
  { img: "/assets/team/dominik.webp", name: "Dominik", specialty: "Frontend · Angular · TypeScript", bio: "Od prawie 5 lat frontend developer z zajawką do AI. Aktualnie na 10xDevs. Dzieli się doświadczeniem na LinkedIn — treści o AI, Angularze, TypeScript i ogólnie programowaniu." },
  { img: "/assets/team/lukasz-wesolowski.webp", name: "Łukasz Wesołowski", specialty: "SEO · NLP · LLM", bio: "Na co dzień SEO, coraz mocniej skręca w stronę NLP i LLM. Pracuje z embeddingami, encjami, RAG i analizą procesów rozumowania modeli (m.in. Gemini). Pomaga przy danych, ewaluacji i eksperymentach z modelami.", link: "https://www.linkedin.com/in/lukasz-wesolowski-dolp" },
  { img: "/assets/team/bartlomiej-kalinski.webp", name: "Bartłomiej Kaliński", specialty: "Ewaluacja · LLM · Edge/SBC", bio: "Na co dzień ewaluacja dwóch aplikacji medycznych opartych o modele Azure OpenAI. Po godzinach bawi się małymi modelami (do ~2B) na płytce SBC." },
  { img: "/assets/team/arkadiuszslota.png", name: "Arkadiusz Słota", specialty: "Fullstack · C# · AI/LLM · RAG", bio: "Fullstack developer, ~10 lat w IT (C#, systemy produkcyjne), od roku w AI/LLM. Wystawia produkty od zera — asystent AI dla BIM/stali (optimalbim.com): agentowy RAG nad IFC, serwer MCP. Buduje generatory danych syntetycznych pod SFT/LoRA. Prywatnie zgłębia wnętrze modeli — edycja wiedzy wprost na wagach (MEMIT). Pomaga przy: danych, fine-tuningu, architekturze, kodzie i dokumentacji.", link: "https://optimalbim.com" },
  { img: "/assets/team/dariusz.jpeg", name: "Dariusz", specialty: "AI Tooling · Automation · Agentic RAG", bio: "15+ lat w IT. Buduje agentic harnessy, eval/QA pipeline'y i local-first RAG. Teza: context before LLM — deterministyczny pipeline, zanim model zacznie zgadywać. Jego teren to inżynieria wokół modelu, nie sam trening." },
  { img: null, name: "Allen (Krzysiek)", specialty: "Agentic AI · Architektura AI · Wdrożenia", bio: "ADHD-owiec na pełen etat. 20 lat w serwisie sprzętu komputerowego. Prowadzi mały zespół wdrożeniowo-rozwojowy. Specjalizuje się w agentic AI i projektowaniu architektury rozwiązań AI — z naciskiem na user-friendliness i realną wartość biznesową. Hejter hype'u bez pokrycia." },
  { img: "/assets/team/bartoszpanek.webp", name: "Bartosz Panek (Osye)", specialty: "ML · Distillation · Fine-tuning · Interpretability", bio: "Samouk w ML. Robi distillacje, finetuningi, trochę modeli wytrenowanych — ale bardziej skupia się na zrozumieniu modelu od środka. Lubi eksperymenty." },
  { img: "/assets/team/pawel-wodnicki.jpg", name: "Paweł Wodnicki", specialty: "Embedded · Agenci AI · Kompilatory", bio: "O AI i sieciach neuronowych uczył się na studiach w poprzednim cyklu AI, douczał się czytając BYTE. Prowadzi firmę zajmującą się komputerami wbudowanymi razem z agentami AI. Interesuje go zastosowanie agentów AI w przemyśle, symboliczna AI, programowanie funkcjonalne, kompilatory, generowanie kodu. Języki: C/C++, Prolog, Assembler, HDL." },
  { img: "/assets/team/pawelpuzio.jpg", name: "Paweł Puzio", specialty: "Architektura systemów · AWS · AI Compliance · CTO", bio: "Architekt systemów i CTO. Rozwija rozwiązania AI do automatyzacji procesów compliance w branży AEC. Łączy LLM-y, architekturę AWS i klasyczne podejście inżynierskie — skupia się na jakości wyników, niezawodności i praktycznych zastosowaniach AI w codziennej pracy specjalistów." },
  { img: "/assets/team/adiorz.png", name: "Adrian Worzechowski (adiorz)", specialty: "Architektura systemów · Python · ML · Energia odnawialna", bio: "10+ lat w IT. Zaczynał od C++, następnie Python. Pracuje w branży energii odnawialnej. Publikacje z zakresu ML w analizie modalnej. Prywatnie automatyzuje co może. Współautor gry planszowej Paranormal Detectives (Nagroda za Najlepszą Grę Imprezową 2021).", link: "https://www.linkedin.com/in/aworzechowski/" },
  { img: null, name: "Kordian", specialty: "Mobile · Principal AI Engineer · Agentowy SDLC · Enterprise", bio: "Mobile engineer z powołania, od ponad roku wdraża AI w Booksy. W trakcie przejścia na Principal AI Engineera. Główny obszar: agentowy SDLC. Zajmuje się też dostosowywaniem systemów do Enterprise — współpraca z IT, security i strategicznie z CTO." },
  { img: "/assets/team/janekbanot.jpg", name: "Janek Banot", specialty: "LLM · Agenci · xAI · Ewaluacja", bio: "7 lat w IT, od 3 lat w LLM-ach. Na co dzień odpowiedzialny za agentów w firmie produktowej. Magisterka skupiona na xAI w małych modelach językowych. Interesuje go wyjaśnialność, ewaluacja i benchmarki." },
  { img: "/assets/team/frota.png", name: "frota", specialty: "Badania · Digital Entertainment · UX · Startupy", bio: "Bada przyszłość i teraźniejszość elektronicznej rozrywki (dystrybucja muzyki, rynki gamingowe, trendy w hardware). Budowała kategorię digital assets w e-commerce, analizowała startupy preseed/seed, współtworzyła projekty UX. Lurker z drivem.", link: "https://www.linkedin.com/in/frota/" },
  { img: "/assets/team/krzysztofgonia.jpg", name: "Krzysztof Gonia", specialty: "Java · Fine-tuning · Text2Image · Pruning · Mobile AI", bio: "Zawodowo programista Java. Po godzinach robi finetuning modeli głównie pod kątem text2image i przenosi modele na mniejsze urządzenia (NPU, pruning, destylacja). Finetuning Stable Diffusion na generacjach Midjourney, destylacja Qwen3-4B→1.7B. Aktualnie pracuje nad pruningiem text encodera dla Qwen Image." },
];

const ADVISORS = [
  { img: "/assets/team/juliusz-straszynski.jpeg", name: "dr Juliusz Straszyński", specialty: "ML Research · LLM", bio: "Doktor, Senior ML Researcher w RTB House. Wcześniej ML Engineer w Google (zespół Gemini Code Assist) i Senior AI Developer w Huawei.", link: "https://ludzie.nauka.gov.pl/ln/profiles/sCrgLf1YSOK/publications/fa141c33-cc8e-4fb9-b197-b44259c8832f" },
  { img: "/assets/team/piotr-senkus.jpg", name: "dr hab. inż. Piotr Senkus", specialty: "Zarządzanie · AI w procesach", bio: "Doktor habilitowany, adiunkt na Wydziale Zarządzania Uniwersytetu Warszawskiego. 15+ lat praktyki i nauki w AI oraz zarządzaniu procesami biznesowymi. Współzałożyciel BPM Competence Center, laureat US Presidential Lifetime Achievement Award.", link: "https://scholar.google.pl/citations?user=Z6y2kAUAAAAJ&hl=pl" },
];

export default function Team() {
  return (
    <>
      <style>{css}</style>
      <section className="phero">
        <div className="inner">
          <span className="kick">zespół · operatorzy protokołu</span>
          <h1>Ludzie przy<br /><em>warsztacie</em></h1>
          <p className="hero-lead">
            Slayer to praktyczne laboratorium modeli. Każda osoba tutaj zostawia
            ślad w danych, treningu, ewaluacji albo infrastrukturze. Mniej manifestu,
            więcej pomiaru.
          </p>
        </div>
      </section>

      <section className="sec tight">
        <div className="inner">
          <span className="kick">founder · założyciel</span>
          <div className="team-grid" style={{ marginBottom: "clamp(56px, 8vw, 96px)" }}>
            <article className="member">
              <div className="av">
                <img src={FOUNDER.img} alt={FOUNDER.name} />
              </div>
              <div className="member-info">
                <div className="member-title-label">Founder · Założyciel</div>
                <h2 className="member-name">{FOUNDER.name}</h2>
                <div className="member-specialty">{FOUNDER.specialty}</div>
                <p className="member-bio">{FOUNDER.bio}</p>
              </div>
            </article>
          </div>

          <div className="advisors-head" style={{ paddingTop: "clamp(40px, 6vw, 64px)", borderTop: "1px solid var(--line)" }}>
            <span className="kick">zespół · operatorzy protokołu</span>
            <h2 style={{ fontFamily: "var(--serif)", fontWeight: 400, letterSpacing: "-.02em", fontSize: "clamp(1.7rem, 3vw, 2.2rem)", margin: "10px 0 0" }}>Zespół</h2>
          </div>
          <div className="team-grid">
            {MEMBERS.map((m) => (
              <article className="member" key={m.name}>
                <div className="av">
                  {m.img ? <img src={m.img} alt={m.name} /> : <span className="av-init">{m.name.slice(0, 1)}</span>}
                </div>
                <div className="member-info">
                  <div className="member-title-label">Member of Technical Staff</div>
                  <h2 className="member-name">{m.name}</h2>
                  <div className="member-specialty">{m.specialty}</div>
                  <p className="member-bio">{m.bio}{m.link ? <> {" "}<a href={m.link} target="_blank" rel="noopener" style={{ color: "var(--acc)" }}>LinkedIn →</a></> : null}{m.link2 ? <> {" "}<a href={m.link2} target="_blank" rel="noopener" style={{ color: "var(--acc)" }}>www →</a></> : null}</p>
                </div>
              </article>
            ))}

            <article className="member">
              <a href="/zespol" style={{ display: "block", textDecoration: "none" }}>
                <div className="av" style={{ borderStyle: "dashed", borderColor: "var(--line)", background: "transparent", transition: ".18s" }}>
                  <span style={{ fontSize: "2rem", color: "var(--dim)", lineHeight: 1 }}>+</span>
                </div>
              </a>
              <div className="member-info">
                <div className="member-title-label">Member of Technical Staff</div>
                <h2 className="member-name" style={{ color: "var(--dim)" }}>Twoje imię tutaj</h2>
                <div className="member-specialty">Twój stack · Twoja domena</div>
                <p className="member-bio"><a href="https://discord.gg/HnTkVR4c5T" target="_blank" rel="noopener" style={{ color: "var(--acc)" }}>Dołącz do zespołu →</a></p>
              </div>
            </article>
          </div>

          <div className="advisors-head" style={{ marginTop: "clamp(56px, 8vw, 96px)", paddingTop: "clamp(40px, 6vw, 64px)", borderTop: "1px solid var(--line)" }}>
            <span className="kick">advisors · rada · spoza core teamu</span>
            <h2 style={{ fontFamily: "var(--serif)", fontWeight: 400, letterSpacing: "-.02em", fontSize: "clamp(1.7rem, 3vw, 2.2rem)", margin: "10px 0 0" }}>Doradcy</h2>
            <p className="hero-lead" style={{ marginTop: 12 }}>Wsparcie merytoryczne: research, ewaluacja, kierunek modeli.</p>
          </div>
          <div className="team-grid">
            {ADVISORS.map((m) => (
              <article className="member" key={m.name}>
                <div className="av">
                  <img src={m.img} alt={m.name} />
                </div>
                <div className="member-info">
                  <div className="member-title-label">Advisor</div>
                  <h2 className="member-name">{m.name}</h2>
                  <div className="member-specialty">{m.specialty}</div>
                  <p className="member-bio">{m.bio}{m.link ? <> {" "}<a href={m.link} target="_blank" rel="noopener" style={{ color: "var(--acc)" }}>publikacje →</a></> : null}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="join-cta">
            <div>
              <h2>Wejście do warsztatu</h2>
              <p>Szukamy ludzi, którzy potrafią domykać artefakty: kod, dane, evale, infra, dokumentację. Governance projektu opisują <a href="/rules" style={{ color: "var(--acc)" }}>rules</a>.</p>
            </div>
            <a className="btn btn-p" href="https://discord.gg/HnTkVR4c5T" target="_blank" rel="noopener">wejście przez Discord →</a>
          </div>
        </div>
      </section>
    </>
  );
}
