import V4Comments from "./comments";

export const metadata = {
  title: "V4 plan — autopsja regresji i bezpieczny harness | Slayer",
  description:
    "Plan Slayer V4 po regresji CDSC-E: autopsja, likelihood eval, adapter scale sweep, regression gates, replay mix i komentarze do planu.",
};

const css = `
  .case-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;align-items:stretch}
  @media(max-width:900px){.case-grid{grid-template-columns:1fr}}
  .metric-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}
  @media(max-width:720px){.metric-strip{grid-template-columns:1fr}}
  .metric{border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:16px}
  .metric .k{font-family:var(--mono);font-size:.68rem;letter-spacing:.11em;text-transform:uppercase;color:var(--dim)}
  .metric .v{display:block;margin-top:8px;font-family:var(--serif);font-size:2rem;line-height:1;color:var(--ink)}
  .metric .v.bad{color:#C1121F}.metric .v.good{color:var(--good)}
  .metric .d{display:block;margin-top:8px;color:var(--mut);font-size:.9rem}
  .dist{display:grid;gap:10px}
  .dist-row{display:grid;grid-template-columns:86px 1fr 54px;gap:12px;align-items:center;font-family:var(--mono);font-size:.78rem;color:var(--mut)}
  .dist-row b{color:var(--ink);font-weight:500}
  .dist-row i{display:block;height:8px;border-radius:99px;background:var(--acc)}
  .dist-row.neu i{background:var(--blue)}.dist-row.con i{background:#C1121F}
  .flow{display:grid;gap:12px;margin-top:12px}
  .step{display:grid;grid-template-columns:76px 1fr;gap:18px;padding:16px 0;border-top:1px solid var(--line2)}
  .step:first-child{border-top:0}
  .step .no{font-family:var(--mono);font-size:.72rem;color:var(--acc);letter-spacing:.1em}
  .step h3{margin:0 0 4px;font-size:1.06rem;color:var(--ink)}
  .step p{margin:0;color:var(--mut);font-size:.95rem}
  .checklist{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
  @media(max-width:820px){.checklist{grid-template-columns:1fr}.step{grid-template-columns:1fr;gap:4px}}
  .check{border-top:1px solid var(--line2);padding-top:14px;color:var(--mut);font-size:.95rem}
  .check b{display:block;color:var(--ink);margin-bottom:4px}
  .codebox{background:rgba(0,0,0,.32);border:1px solid var(--line2);border-radius:8px;padding:14px 16px;overflow-x:auto;font-family:var(--mono);font-size:.78rem;line-height:1.55;color:var(--txt);white-space:pre}
  .feedback{margin-top:18px}
  .feedback-form{border:1px solid var(--line);border-radius:var(--rad);background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012)),var(--panel);padding:18px;display:grid;gap:14px}
  .field-row{display:grid;grid-template-columns:1fr 180px;gap:14px}
  @media(max-width:680px){.field-row{grid-template-columns:1fr}}
  select{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:8px;font-family:var(--sans);font-size:1rem;background:var(--panel);color:var(--txt)}
  select:focus{outline:none;border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}
  .hp{position:absolute;left:-10000px;width:1px;height:1px;opacity:0}
  .form-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .form-msg{font-size:.88rem;color:var(--dim)}.form-msg.err{color:#C1121F}
  .comment-list{display:grid;gap:12px;margin-top:16px}
  .comment{border:1px solid var(--line2);border-radius:8px;background:rgba(255,255,255,.025);padding:14px 16px}
  .comment-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-family:var(--mono);font-size:.7rem;color:var(--dim);letter-spacing:.05em;text-transform:uppercase}
  .comment-top .who{color:var(--acc)}.comment-top .ctype{border:1px solid var(--line2);border-radius:4px;padding:1px 6px;color:var(--mut)}
  .comment p{margin:8px 0 0;color:var(--mut);white-space:pre-wrap}
  .empty{color:var(--dim);font-family:var(--mono);font-size:.82rem}
`;

export default function V4() {
  return (
    <>
      <style>{css}</style>
      <section className="phero">
        <div className="inner">
          <span className="kick">V4 plan · feedback open · po autopsji v3</span>
          <h1>Najpierw <em>harness</em>, potem trening</h1>
          <p>
            V3 podniósł LLMzSzŁ, ale obniżył CDSC-E z 87.0 do 64.5 na poprawionym promptcie. To jest klasyczny
            przypadek, gdzie pojedynczy benchmark docelowy wygląda lepiej, a model traci kalibrację logiczną. V4 ma
            zamknąć tę lukę: każdy checkpoint przechodzi bramki rozkładu etykiet, neutral recall i parser error zanim
            w ogóle mówimy o release.
          </p>
          <div className="cta-row">
            <a className="btn btn-p" href="#feedback">dodaj feedback</a>
            <a className="btn btn-s" href="/eng-log/v3-cdsc-e-regresja">autopsja CDSC-E</a>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="inner">
          <div className="ghead">
            <h2>Case: co poszło źle</h2>
            <span className="c">CDSC-E n=200 seed 42 · prompt fixed · base vs v3</span>
          </div>
          <div className="case-grid">
            <div className="panel">
              <div className="panel-top"><span>regresja</span><span>nie szum metryki</span></div>
              <div className="panel-bd">
                <p className="muted">
                  V3 nie popsuł wszystkich etykiet po równo. Model stał się zbyt stanowczy: zamiast wybierać
                  <code> neutralna </code>, przesuwał neutralne pary w <code> sprzeczność </code> i częściowo w
                  <code> wynikanie </code>. Dlatego średnia KLEJ może wyglądać niewinnie, a konkretna umiejętność
                  logiczna jest realnie naruszona.
                </p>
                <div className="metric-strip">
                  <div className="metric"><span className="k">LLMzSzŁ</span><span className="v good">+3.3 pp</span><span className="d">63.5 → 66.8</span></div>
                  <div className="metric"><span className="k">CDSC-E</span><span className="v bad">-22.5 pp</span><span className="d">87.0 → 64.5</span></div>
                  <div className="metric"><span className="k">neutral recall</span><span className="v bad">55.1%</span><span className="d">base: 89.8%</span></div>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-top"><span>pred distribution</span><span>v3</span></div>
              <div className="panel-bd dist">
                <div className="dist-row neu"><b>neutralna</b><i style={{ width: "43%" }}></i><span>86</span></div>
                <div className="dist-row"><b>wynikanie</b><i style={{ width: "25%" }}></i><span>50</span></div>
                <div className="dist-row con"><b>sprzeczność</b><i style={{ width: "32%" }}></i><span>64</span></div>
                <p className="muted" style={{ margin: "8px 0 0" }}>
                  Gold miał 147/200 neutralnych par. Base przewidział neutralność 143 razy, v3 tylko 86 razy.
                  Taki drift musi blokować release nawet wtedy, gdy target score rośnie.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tight alt">
        <div className="inner">
          <div className="ghead">
            <h2>Plan V4</h2>
            <span className="c">kolejność działań</span>
          </div>
          <div className="panel">
            <div className="panel-bd flow">
              <div className="step"><span className="no">01</span><div><h3>Autopsja przed treningiem</h3><p>Każdy spadek rozbijamy na gold distribution, base pred distribution, candidate pred distribution, confusion matrix i parser error. Bez tej tabeli nie ma diagnozy.</p></div></div>
              <div className="step"><span className="no">02</span><div><h3>Likelihood eval dla klasyfikacji</h3><p>Generacja mierzy też styl i gadatliwość. Dla KLEJ classification dokładamy scoring etykiet logprobami: model wybiera spośród zamkniętej listy labeli.</p></div></div>
              <div className="step"><span className="no">03</span><div><h3>Adapter scale sweep bez retrainingu</h3><p>Najpierw sprawdzamy λ = 0.0, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0. Jeśli mniejsza skala odzyskuje CDSC-E i trzyma target, można wypuścić calibrated adapter.</p></div></div>
              <div className="step"><span className="no">04</span><div><h3>Dane naprawcze dopiero po diagnozie</h3><p>CDSC-like NLI ma mieć realny prior: 70-80% neutral, 15-25% entailment, 5-10% contradiction, z dużym udziałem hard-neutral. Zero przykładów testowych.</p></div></div>
              <div className="step"><span className="no">05</span><div><h3>Replay + KL do bazy</h3><p>V4 mix: target data, general replay, task-preservation replay (typy zadań na własnych/zdekontaminowanych danych, nie na splitach benchmarków) i NLI calibration. Na preservation set testujemy KL-to-base, żeby adapter nie przesuwał całej polityki decyzji.</p></div></div>
              <div className="step"><span className="no">06</span><div><h3>Wybór przez Pareto</h3><p>Nie wybieramy najlepszego checkpointa po jednym target score. Warunek: target w górę, CDSC-E blisko bazy, neutral pred blisko gold/base, parser error 0.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="inner">
          <div className="ghead">
            <h2>Nowe bramki</h2>
            <span className="c">wdrożone do harnessu</span>
          </div>
          <div className="checklist">
            <div className="check"><b>CDSC-E score drop</b>fail jeśli kandydat spada względem bazy o więcej niż 3 pp.</div>
            <div className="check"><b>Neutral prediction drift</b>fail jeśli udział predykcji neutralnych odpływa od bazy o więcej niż 5 pp.</div>
            <div className="check"><b>Neutral recall</b>fail jeśli recall klasy neutralnej spada o więcej niż 5 pp.</div>
            <div className="check"><b>Parser error</b>fail jeśli odpowiedzi nie da się sparsować do oczekiwanej etykiety.</div>
            <div className="check"><b>Macro nie wystarcza</b>KLEJ macro jest raportowane, ale nie może przykryć dużej regresji pojedynczego taska.</div>
            <div className="check"><b>Audit raw błędów</b>opcjonalny prywatny JSONL z raw outputami błędów do szybkiej ręcznej autopsji.</div>
          </div>
          <div className="codebox" style={{ marginTop: 18 }}>{`python3 klej_eval.py --tasks cdsc_e --n 200 --seed 42 --mode likelihood --out results/base_cdsc.json
python3 klej_eval.py --adapter "$CKPT" --tasks cdsc_e --n 200 --seed 42 --mode likelihood --out results/candidate_cdsc.json
python3 regression_gate.py --base results/base_cdsc.json --candidate results/candidate_cdsc.json`}</div>
        </div>
      </section>

      <section className="sec tight alt">
        <div className="inner">
          <div className="ghead">
            <h2>Reguły V4</h2>
            <span className="c">monotoniczność tylko tam, gdzie ma sens</span>
          </div>
          <div className="panel">
            <div className="panel-bd flow">
              <div className="step"><span className="no">R1</span><div><h3>Nie wymagamy wzrostu wszystkiego</h3><p>Wszystkie benchmarki monotonicznie w górę to zbyt ostra reguła. Małe próbki, judge-based evale i prompt-sensitive zadania mają szum, więc decyzja idzie po progach i trendach, nie po pojedynczym zielonym/czerwonym polu.</p></div></div>
              <div className="step"><span className="no">R2</span><div><h3>Target runu musi rosnąć</h3><p>Jeśli run jest pod LLMzSzŁ, LLMzSzŁ ma iść w górę. Jeśli run jest pod natywność polszczyzny, PolNative ma iść w górę. Bez wyraźnego zysku na celu nie ma sensu akceptować ryzyka regresji.</p></div></div>
              <div className="step"><span className="no">R3</span><div><h3>Krytyczne gate’y nie mogą spaść znacząco</h3><p>CDSC-E/NLI, KLEJ critical tasks, parser error, MMLU/ARC/GSM8K i podstawowe EN retention mają tolerancję spadku, ale nie mogą zostać rozwalone. Parser error ma zostać 0.</p></div></div>
              <div className="step"><span className="no">R4</span><div><h3>Noisy benchmarki wymagają rerun albo CI</h3><p>PolNative judge, EQ-Bench, małe sample i zadania z otwartym sędzią oceniamy przez powtórki, przedziały ufności albo większą próbkę release. Pojedynczy spadek o 1-2 pp nie musi być realny.</p></div></div>
              <div className="step"><span className="no">R5</span><div><h3>Release wybiera Pareto-front</h3><p>Nie wybieramy checkpointa z najlepszym jednym score. Wybieramy taki, który daje zysk na celu i nie przekracza progów regresji. +3 pp LLMzSzŁ przy -22 pp CDSC-E odpada; +10 pp PolNative przy -0.5 pp MMLU może przejść.</p></div></div>
            </div>
          </div>
          <div className="codebox" style={{ marginTop: 18 }}>{`V4 promotion policy:
  target benchmark            must improve
  critical regression gates   max -1..-3 pp, depending on task
  parser_error_rate           must equal 0
  noisy/judge benchmarks      rerun or larger sample before blocking
  final decision              Pareto, not single metric

Example:
  OK:    PolNative +10 pp, MMLU -0.5 pp, CDSC-E stable
  FAIL:  LLMzSzŁ +3 pp, CDSC-E -22 pp, neutral recall collapsed`}</div>
        </div>
      </section>

      <section className="sec tight">
        <div className="inner">
          <div className="ghead">
            <h2>Czy mamy dane</h2>
            <span className="c">co realnie mierzy improvement</span>
          </div>
          <div className="checklist">
            <div className="check"><b>Gotowe jako twardy gate</b>LLMzSzŁ, KLEJ/CDSC-E, Belebele PL, PolNative, PES, PoQuAD, FLORES PL↔EN, Belebele EN, ARC-C, MMLU, GSM8K. Tu improvement/regresję da się mierzyć już teraz, przy stałym seedzie i protokole.</div>
            <div className="check"><b>Publiczne, do spięcia w runner</b>HellaSwag, TruthfulQA MC2, WinoGrande, PolQA, INCLUDE-base-44, szersze Belebele multilingual, szersze FLORES. Dataset istnieje, ale trzeba jeszcze wyrównać harness i metrykę.</div>
            <div className="check"><b>Zamknięte albo leaderboard-only</b>CPTUB, Polish EQ-Bench i częściowo PLCC. Tego nie wolno udawać jako powtarzalnego gate’u, jeśli nie mamy test setu. Możemy użyć jako zewnętrzny release check albo zbudować własny izomorficzny dev set.</div>
            <div className="check"><b>Do treningu nie wchodzą itemy benchmarków</b>LLMzSzŁ, PES, PoQuAD, PolNative oraz wszystkie splity KLEJ — train, dev i test — są wyłącznie decon/eval. Nawet oficjalne train splity benchmarków nie są źródłem treningu; replay i task-preservation robimy na własnych/zdekontaminowanych danych. Improvement ma pochodzić z umiejętności, nie z widzenia pytań.</div>
            <div className="check"><b>Dev set potrzebny do iteracji</b>Dla PolNative/PLCC/CPTUB-like robimy osobny dev set podobny typem, ale rozłączny. Realny benchmark odpalamy rzadko: po zamrożeniu kandydata.</div>
            <div className="check"><b>Claim tylko tam, gdzie jest protokół</b>Jeśli dataset jest zamknięty albo protokół niestandardowy, piszemy “internal gate” albo “proxy”, nie “pobiliśmy benchmark”.</div>
          </div>
        </div>
      </section>

      <section className="sec tight alt">
        <div className="inner">
          <div className="ghead">
            <h2>Systematyczny benchmark</h2>
            <span className="c">jeden runner dla kolejnych checkpointów</span>
          </div>
          <div className="panel">
            <div className="panel-bd flow">
              <div className="step"><span className="no">SMOKE</span><div><h3>Po każdym sensownym checkpointcie</h3><p>Mała próbka KLEJ/CDSC-E + LLMzSzŁ. Łapie awarie promptu, parsera, label drift i oczywisty spadek targetu.</p></div></div>
              <div className="step"><span className="no">GATE</span><div><h3>Przed promocją checkpointa</h3><p>KLEJ generation i likelihood, rozkłady etykiet, confusion matrix, parser error, neutral recall oraz LLMzSzŁ n=400.</p></div></div>
              <div className="step"><span className="no">REL</span><div><h3>Przed publicznym claimem</h3><p>Większe próbki, ostrzejsze progi i raport PASS/FAIL. Release nie przechodzi, jeśli pojedyncza umiejętność odpada mimo dobrego target score.</p></div></div>
              <div className="step"><span className="no">STYLE</span><div><h3>PolNative jako gate natywności</h3><p>V4 musi przejść PolNative: fleksja, frazeologia, literatura, realia, rejestr, EQ, naturalność i kalibracja. To osobny gate dla claimu “lepsza polszczyzna”, komplementarny do PLCC.</p></div></div>
            </div>
          </div>
          <div className="codebox" style={{ marginTop: 18 }}>{`cd /home/ubuntu/slayer-train
python3 systematic_benchmark.py --adapter ~/slayer-out/qwen-v4-dora/checkpoint-240 --preset checkpoint

# szybki podgląd bez odpalania modeli:
python3 systematic_benchmark.py --adapter ~/slayer-out/qwen-v4-dora/checkpoint-240 --preset smoke --dry-run

# style/native release gate:
python3 bench/polnative_eval.py --from-file slayer-v4=/tmp/answers_slayer_v4.jsonl
python3 bench/polnative_report.py`}</div>
        </div>
      </section>

      <section className="sec tight alt">
        <div className="inner">
          <V4Comments />
        </div>
      </section>
    </>
  );
}
