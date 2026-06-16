export const metadata = {
  title: "Zespół — Slayer",
  description: "Ludzie budujący Slayer — applied research lab dla polskich modeli językowych.",
};

const MEMBERS = [
  { img: "/assets/team/kacper-wikiel.png", name: "Kacper Wikieł", specialty: "ML · Infrastruktura", bio: "ML, infrastruktura treningowa i optymalizacja modeli." },
  { img: "/assets/team/kamil-dzieniszewski.jpeg", name: "Kamil Dzieniszewski", specialty: "Frontend · Produkt", bio: "Frontend, doświadczenie produktowe i narzędzia deweloperskie." },
  { img: "/assets/team/piotr-nalepa.webp", name: "Piotr Nalepa", specialty: "Fullstack · Narzędzia developerskie", bio: "Fullstack, zarządzanie projektem i tworzenie narzędzi dla developerów." },
  { img: "/assets/team/piotr-rozek.jpeg", name: "Piotr Rożek", specialty: "Python · Fizyka", bio: "Fizyk z wykształcenia, Python developer, człowiek renesansu." },
  { img: "/assets/team/piotr-styla.webp", name: "Piotr Styła", specialty: "Rekrutacja · Agenci LLM", bio: "Za dnia rekrutuje i onboarduje talenty, po zmroku LLM Slayer: buduje zespoły agentów (call center dla branży medycznej) oraz aplikacje webowe i na Androida. AGH." },
  { img: "/assets/team/bartlomiej-boczylo.jpg", name: "Bartłomiej Boczyło", specialty: "ML · Frontend", bio: "Student II roku inżynierii AI. Frontend dev, rozwija się w ML/DL, CV, NLP, RL i modelach generatywnych. Stack: Python, TensorFlow, PyTorch, MLOps." },
  { img: "/assets/team/kuba6.jpg", name: "Kuba", specialty: "AI Engineer · Fullstack", bio: "Fizyk-teoretyk z wykształcenia. AI Engineer w projekcie onkologicznym (CV), ostatnie 2 lata w GenAI i agentach. Chce trenować LLM, robi datasety i benchmarki." },
  { img: "/assets/team/lizzy.jpg", name: "Elżbieta Dawidek (Lizzy)", specialty: "Antropolog · Logopeda · AAC", bio: "Bada sposoby budowania języka. Projektuje zadania diagnostyczne dla modeli językowych, sprawdzające polską fleksję, przypadki i rozumienie relacji w zdaniu. Wykładowca akademicki Uniwersytet DSW Ideis." },
  { img: "/assets/team/kamil-kaczmarek.png", name: "Kamil Kaczmarek", specialty: "Fullstack · Boty · Mikroserwisy", bio: "Fullstack deweloper. Buduje bota, mikroserwisy i narzędzia dla agencji marketingowej. Współtwórca systemu zarządzającego dziesiątkami tysięcy ofert na Allegro. Dostarcza end-to-end: od pomysłu do wdrożenia." },
  { img: "/assets/team/grzegorz.jpeg", name: "Grzegorz Trzaskoma", specialty: "Backend · Java · Node.js", bio: "Student informatyki II roku. Buduje framework agentowy @the-brain/core oraz aplikację Scheduler (system zarządzania pracownikami) jako sandbox dla agentów. Pełne środowisko testowe w terminalu, pamięć agenta w rozwój. gt-processing.com" },
  { img: "/assets/team/s3nh.jpg", name: "Damian Panek", specialty: "ML Engineer · OSS · Quantization", bio: "ML Engineer, fanatyk open source. Specjalizuje się w metodach kwantyzacji i optymalizacji SOTA modeli." },
];

const ADVISORS = [
  { img: "/assets/team/juliusz-straszynski.jpeg", name: "dr Juliusz Straszyński", specialty: "ML Research · LLM", bio: "Doktor, Senior ML Researcher w RTB House. Wcześniej ML Engineer w Google (zespół Gemini Code Assist) i Senior AI Developer w Huawei.", link: "https://ludzie.nauka.gov.pl/ln/profiles/sCrgLf1YSOK/publications/fa141c33-cc8e-4fb9-b197-b44259c8832f" },
  { img: "/assets/team/piotr-senkus.jpg", name: "dr hab. inż. Piotr Senkus", specialty: "Zarządzanie · AI w procesach", bio: "Doktor habilitowany, adiunkt na Wydziale Zarządzania Uniwersytetu Warszawskiego. 15+ lat praktyki i nauki w AI oraz zarządzaniu procesami biznesowymi. Współzałożyciel BPM Competence Center, laureat US Presidential Lifetime Achievement Award.", link: "https://scholar.google.pl/citations?user=Z6y2kAUAAAAJ&hl=pl" },
];

function Avatar({ img, name }) {
  const init = name
    .replace(/[()]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
  return (
    <div className="sl-avatar">
      {img ? <img src={img} alt={name} /> : <div className="sl-avatar-init">{init}</div>}
    </div>
  );
}

export default function Team() {
  return (
    <main className="sl">
      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-no">{MEMBERS.length}</div>
            <div>
              <div className="sl-eye">zespół · operatorzy protokołu</div>
              <h1 className="sl-h1" style={{ marginTop: 10 }}>Ludzie przy <span className="sl-acc">warsztacie.</span></h1>
              <p className="sl-lede" style={{ marginTop: 16 }}>
                Slayer to praktyczne laboratorium modeli. Każda osoba tutaj zostawia
                ślad w danych, treningu, ewaluacji albo infrastrukturze. Mniej manifestu,
                więcej pomiaru.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye" style={{ marginBottom: 18 }}>core team · member of technical staff</div>
          <div className="sl-people">
            {MEMBERS.map((m) => (
              <article className="sl-person" key={m.name}>
                <Avatar img={m.img} name={m.name} />
                <div className="sl-pname">{m.name}</div>
                <div className="sl-prole">{m.specialty}</div>
                <p className="sl-pbio">{m.bio}</p>
              </article>
            ))}

            <article className="sl-person">
              <a href="/zespol" style={{ display: "block" }}>
                <div className="sl-avatar" style={{ borderStyle: "dashed" }}>
                  <div className="sl-avatar-init">+</div>
                </div>
              </a>
              <div className="sl-pname" style={{ color: "var(--sl-dim)" }}>Twoje imię tutaj</div>
              <div className="sl-prole">Twój stack · Twoja domena</div>
              <p className="sl-pbio">
                <a href="https://discord.gg/HnTkVR4c5T" target="_blank" rel="noopener" style={{ color: "var(--sl-acc)" }}>Dołącz do zespołu →</a>
              </p>
            </article>
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-eye">advisors · rada · spoza core teamu</div>
          <h2 className="sl-h2" style={{ marginTop: 10 }}>Doradcy</h2>
          <p className="sl-lede" style={{ marginTop: 12, marginBottom: 22 }}>Wsparcie merytoryczne: research, ewaluacja, kierunek modeli.</p>
          <div className="sl-people">
            {ADVISORS.map((m) => (
              <article className="sl-person" key={m.name}>
                <Avatar img={m.img} name={m.name} />
                <div className="sl-pname">{m.name}</div>
                <div className="sl-prole">{m.specialty}</div>
                <p className="sl-pbio">
                  {m.bio}
                  {m.link ? <> {" "}<a href={m.link} target="_blank" rel="noopener" style={{ color: "var(--sl-acc)" }}>publikacje →</a></> : null}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <hr className="sl-rule" />

      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-col sl-col-block" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="sl-clbl">▸ wejście do warsztatu</div>
            <h2 className="sl-h2">Wejście do warsztatu</h2>
            <p className="sl-lede" style={{ maxWidth: "48ch" }}>
              Szukamy ludzi, którzy potrafią domykać artefakty: kod, dane, evale, infra, dokumentację.
              Governance projektu opisują <a href="/rules">rules</a>.
            </p>
            <div className="sl-cta" style={{ marginTop: 6 }}>
              <a className="sl-btn sl-btn-p" href="https://discord.gg/HnTkVR4c5T" target="_blank" rel="noopener">wejście przez Discord →</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
