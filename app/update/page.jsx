export const metadata = {
  title: "Na czym stoimy — update | Slayer",
  description:
    "Uczciwy stan projektu: co już działa (research i produkty), co dopiero robimy (zbieramy ludzi do własnego modelu) i czego jeszcze nie ma.",
};

export default function Update() {
  return (
    <>
      <section className="phero"><div className="inner">
        <span className="kick">update · stan na 2026-06-21</span>
        <h1>Na czym <em>stoimy</em></h1>
        <p>Bez ściemy. Dziś jesteśmy grupą, która robi research i ma działające produkty wokół polskiej AI. Własnego konkurencyjnego modelu jeszcze nie ma — to cel, dla którego zbieramy ludzi. Artefakty są dowodem, model jest celem, społeczność jest mechanizmem.</p>
      </div></section>

      <section className="sec tight"><div className="inner">
        <div className="note" style={{ margin: "0 0 28px", borderLeftColor: "var(--acc)" }}><p><b>Teraz pracujemy nad:</b> przekrojowym setem benchmarków, żeby zmierzyć <b style={{ color: "var(--ink)" }}>Bielik vs Qwen / Gemma</b>. Pomiar to nie ranking dla rankingu — chcemy zobaczyć, gdzie są luki i jak budować dane pod <b style={{ color: "var(--ink)" }}>SFT / CPT</b>, żeby z bazy zrobić model SOTA. <a href="/benchmarks" style={{ color: "var(--acc)" }}>metodologia →</a></p></div>
        <div className="ghead"><h2>Co już działa</h2><span className="c">prawda teraz · produkty i research</span></div>
        <div className="grid auto-lg">
          <div className="cell"><div className="n">DYSTRYBUCJA</div><h3 className="sm">Codesota</h3><p>Data terminal: rejestr środowisk RL i SOTA-with-code. ~20k użytkowników / mies.</p><div className="meta"><a href="https://codesota.com" rel="noopener" target="_blank" style={{ color: "var(--acc)" }}>codesota.com ↗</a></div></div>
          <div className="cell"><div className="n">POMIAR</div><h3 className="sm">CodeSOTA Intelligence</h3><p>Codzienny pomiar popytu na modele na OpenRouter — kto wygrywa użycie.</p><div className="meta"><a href="https://ort.fabryka.ai" rel="noopener" target="_blank" style={{ color: "var(--acc)" }}>ort.fabryka.ai ↗</a></div></div>
          <div className="cell"><div className="n">PAPER</div><h3 className="sm">Ricardo</h3><p>Outcome-Grounded Routing for Multimodal LLM Agents — opublikowany, z danymi z własnego ruchu.</p><div className="meta"><a href="/research/ricardo.pdf" rel="noopener" target="_blank" style={{ color: "var(--acc)" }}>PDF ↗</a></div></div>
          <div className="cell"><div className="n">BENCHMARK</div><h3 className="sm">ZusWave</h3><p>Benchmark polskiego rozumowania urzędowego: administracja, podatki, ZUS, e-government. Live.</p><div className="meta"><a href="https://kwikiel.github.io/ZusWaveBench/" rel="noopener" target="_blank" style={{ color: "var(--acc)" }}>ZusWaveBench ↗</a></div></div>
          <div className="cell"><div className="n">NARZĘDZIE</div><h3 className="sm">Polish Morph Tokenizer</h3><p>Tokenizer tnący polskie słowa po prefiksach, rdzeniach i końcówkach, a potem na fonemy. Repo.</p><div className="meta"><a href="https://chomsky-pi.vercel.app" rel="noopener" target="_blank" style={{ color: "var(--acc)" }}>chomsky-pi ↗</a></div></div>
          <div className="cell"><div className="n">API · AGENCI</div><h3 className="sm">Fabryka: token API, SDK, agenci</h3><p>Polskie modele jako OpenAI-compatible API, SDK i agenci (ROBOTNIK, Rocky) — wdrożone i używane.</p><div className="meta"><a href="https://meta.fabryka.ai" rel="noopener" target="_blank" style={{ color: "var(--acc)" }}>meta.fabryka.ai ↗</a></div></div>
        </div>
      </div></section>

      <section className="sec tight alt"><div className="inner">
        <div className="ghead"><h2>Eksperymenty treningowe</h2><span className="c">pierwsze kroki, jawnie</span></div>
        <div className="grid auto-lg">
          <div className="cell"><div className="n">FROM SCRATCH</div><h3 className="sm">Mały LLM od zera</h3><p>Zrobiliśmy kilka eksperymentów z treningiem małego LLM w 100% from scratch — do celów edukacyjnych. Tak uczymy się i pokazujemy, jak naprawdę powstaje model.</p><div className="meta"><a href="/research/my-little-llm.pdf" rel="noopener" target="_blank" style={{ color: "var(--acc)" }}>My Little LLM — kurs ↗</a></div></div>
          <div className="cell"><div className="n">BASELINE</div><h3 className="sm">Pomiar bazowy</h3><p>Zmierzyliśmy bazę na zewnętrznej suicie (multi-seed, held-out). Werdykt i wyniki są jawne.</p><div className="meta"><a href="/leaderboard" style={{ color: "var(--acc)" }}>leaderboard →</a></div></div>
        </div>
      </div></section>

      <section className="sec tight"><div className="inner">
        <div className="note"><p><b>Czego jeszcze nie ma:</b> własnego konkurencyjnego polskiego modelu open-weight. Nie ma też pełnej księgi runów z realnymi kosztami — automatyczny pomiar runów dopiero wpinamy. Nie udajemy liczb, których nie zmierzyliśmy.</p></div>
      </div></section>

      <section className="sec tight alt"><div className="inner">
        <div className="ghead"><h2>Co teraz robimy</h2><span className="c">cel · zbieramy ludzi</span></div>
        <div className="grid auto-lg">
          <div className="cell"><div className="n">CEL</div><h3 className="sm">Własny model</h3><p>Konkurencyjny polski open-weight: jawna receptura, held-out ewaluacja, lineage danych, koszt wpisany w wynik.</p><div className="meta"><a href="/roadmap" style={{ color: "var(--acc)" }}>harmonogram →</a></div></div>
          <div className="cell"><div className="n">DANE</div><h3 className="sm">Korpusy PL</h3><p>Prawno-urzędowe i egzaminacyjne — dekontaminacja, held-out. To nasz moat.</p><div className="meta"><a href="/datasety" style={{ color: "var(--acc)" }}>datasety →</a></div></div>
          <div className="cell"><div className="n">LUDZIE</div><h3 className="sm">Drabina kontrybutora</h3><p>Wchodzisz na dowolnym poziomie — z realnym creditem za wkład.</p><div className="meta"><a href="/drabina" style={{ color: "var(--acc)" }}>drabina →</a></div></div>
        </div>
        <div className="cta-row" style={{ marginTop: 24 }}><a className="btn btn-p" href="/zespol">Dołącz / zapisz się →</a><a className="btn btn-s" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank">Discord</a></div>
      </div></section>
    </>
  );
}
