"use client";
import { useEffect, useRef, useState } from "react";

const API = "https://rocky.fabryka.ai/slayer/signups";
const ROLES = ["Kontrybutor", "Dane", "Ewaluacja", "Trening/ML", "Infra/DevOps", "Naukowiec/badania", "Firma/use-case", "Fundator/compute"];
const ROLE_LABELS = { "Kontrybutor": "Kontrybutor", "Dane": "Dane", "Ewaluacja": "Ewaluacja", "Trening/ML": "Trening / ML", "Infra/DevOps": "Infra", "Naukowiec/badania": "Naukowiec", "Firma/use-case": "Firma / zastosowanie", "Fundator/compute": "Fundator / compute" };

export default function Join() {
  const [people, setPeople] = useState(null);
  const [count, setCount] = useState(null);
  const [listErr, setListErr] = useState(false);
  const [checked, setChecked] = useState({});
  const [msg, setMsg] = useState({ cls: "msg", text: "" });
  const [sending, setSending] = useState(false);
  const formTitleRef = useRef(null);
  const nameRef = useRef(null);
  const contactRef = useRef(null);
  const aboutRef = useRef(null);
  const hpRef = useRef(null);
  const formRef = useRef(null);

  const load = () =>
    fetch(API + "?ts=" + Date.now())
      .then((r) => r.json())
      .then((d) => {
        setPeople((d.people || []).slice().reverse());
        setCount(d.count);
        setListErr(false);
      })
      .catch(() => setListErr(true));

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const pickRole = (r) => {
    setChecked((c) => ({ ...c, [r]: true }));
    formTitleRef.current?.scrollIntoView({ behavior: "smooth" });
    nameRef.current?.focus();
  };

  const submit = (e) => {
    e.preventDefault();
    const name = nameRef.current.value.trim();
    const contact = contactRef.current.value.trim();
    if (!name || !contact) {
      setMsg({ cls: "msg err", text: "Podaj imię i kontakt." });
      return;
    }
    const payload = {
      name,
      contact,
      about: aboutRef.current.value.trim(),
      website: hpRef.current.value,
      roles: ROLES.filter((r) => checked[r]),
    };
    setSending(true);
    setMsg({ cls: "msg", text: "Wysyłam…" });
    fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then((r) => r.json().then((j) => ({ s: r.status, j })))
      .then(({ s, j }) => {
        if (s === 201 || j.ok) {
          setMsg({ cls: "msg ok", text: "Dodano. Dzięki." });
          formRef.current.reset();
          setChecked({});
          load();
        } else {
          setMsg({ cls: "msg err", text: j.error || "Coś poszło nie tak." });
        }
      })
      .catch(() => setMsg({ cls: "msg err", text: "Błąd sieci — spróbuj ponownie." }))
      .finally(() => setSending(false));
  };

  return (
    <>
      <section className="sl-sec"><div className="sl-inner">
        <div className="sl-eye">dla kogo</div>
        <h2 className="sl-h2" style={{ marginTop: 10 }}>Cztery <span className="sl-acc">wejścia.</span></h2>
        <div className="sl-cols" style={{ marginTop: 22 }}>
          <div className="sl-col">
            <div className="sl-clbl">▸ ręce</div>
            <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Kontrybutorzy</h3>
            <p className="sl-lede" style={{ fontSize: 14.5 }}>Kod, dane, ewaluacje, infra. Start od&nbsp;<a href="/zadania">zadań</a>.</p>
            <button className="sl-btn sl-btn-s" style={{ marginTop: 14 }} onClick={() => pickRole("Kontrybutor")}>zapisz się →</button>
          </div>
          <div className="sl-col">
            <div className="sl-clbl">▸ nauka</div>
            <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Naukowcy</h3>
            <p className="sl-lede" style={{ fontSize: 14.5 }}>Metodyka, ewaluacje, współautorstwo.</p>
            <button className="sl-btn sl-btn-s" style={{ marginTop: 14 }} onClick={() => pickRole("Naukowiec/badania")}>zapisz się →</button>
          </div>
          <div className="sl-col">
            <div className="sl-clbl">▸ rynek</div>
            <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Firmy</h3>
            <p className="sl-lede" style={{ fontSize: 14.5 }}>Zgłoś zastosowanie (prawo, urzędy, branża), zostań wczesnym użytkownikiem.</p>
            <button className="sl-btn sl-btn-s" style={{ marginTop: 14 }} onClick={() => pickRole("Firma/use-case")}>zgłoś zastosowanie →</button>
          </div>
          <div className="sl-col">
            <div className="sl-clbl">▸ compute</div>
            <h3 className="sl-h2" style={{ fontSize: 17, marginBottom: 7 }}>Fundatorzy</h3>
            <p className="sl-lede" style={{ fontSize: 14.5 }}>Sfinansuj GPU (15–20k zł) albo daj kredyty.</p>
            <button className="sl-btn sl-btn-s" style={{ marginTop: 14 }} onClick={() => pickRole("Fundator/compute")}>wesprzyj →</button>
          </div>
        </div>
      </div></section>

      <section className="sl-sec"><div className="sl-inner">
        <div className="sl-cols">
          <div className="sl-col sl-col-lead">
            <div className="sl-clbl" ref={formTitleRef}>▸ zapisz się</div>
            <form ref={formRef} autoComplete="off" onSubmit={submit} style={{ marginTop: 6 }}>
              <input type="text" className="hp" ref={hpRef} tabIndex={-1} aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0 }} />
              <div className="sl-field"><label htmlFor="name">Imię / nick / firma</label><input type="text" id="name" className="sl-input" ref={nameRef} maxLength={60} required placeholder="np. Kasia / kasia_ml / Acme sp. z o.o." /></div>
              <div className="sl-field"><label>W&nbsp;jakiej roli? <span style={{ color: "var(--sl-dim)" }}>(zaznacz dowolne)</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px", marginTop: 4 }}>
                  {ROLES.map((r) => (
                    <label key={r} className="sl-check">
                      <input type="checkbox" name="role" value={r} checked={!!checked[r]} onChange={(e) => setChecked((c) => ({ ...c, [r]: e.target.checked }))} /> {ROLE_LABELS[r]}
                    </label>
                  ))}
                </div></div>
              <div className="sl-field"><label htmlFor="contact">Kontakt <span style={{ color: "var(--sl-dim)" }}>(Discord / e-mail / GitHub — prywatny)</span></label><input type="text" id="contact" className="sl-input" ref={contactRef} maxLength={120} required placeholder="np. discord: kasia#1234" /></div>
              <div className="sl-field"><label htmlFor="about">Co oferujesz / zastosowanie <span style={{ color: "var(--sl-dim)" }}>(opcjonalnie, publiczne)</span></label><textarea id="about" className="sl-textarea" ref={aboutRef} maxLength={400} placeholder="np. robię evale w lm-eval-harness; albo: firma prawnicza, use case: analiza umów"></textarea></div>
              <button className="sl-btn sl-btn-p" type="submit" disabled={sending}>dołącz publicznie</button>
              {msg.text ? <div className={msg.cls.includes("err") ? "sl-ferr" : "sl-status sl-ok"} style={{ marginTop: 14 }}>{msg.text}</div> : null}
              <p className="sl-fn" style={{ marginTop: 14 }}>Publicznie pokażemy imię, role i&nbsp;opis. Kontakt trafia tylko do&nbsp;organizatora.</p>
            </form>
          </div>
          <div className="sl-col">
            <div className="sl-clbl">▸ już dołączyli <span className="sl-acc">{count != null ? "· " + count : ""}</span></div>
            {listErr && <div className="sl-status sl-fail">Lista chwilowo niedostępna.</div>}
            {!listErr && people === null && <div className="sl-status sl-run">Wczytuję…</div>}
            {!listErr && people !== null && !people.length && <div className="sl-status">Jeszcze nikt — bądź pierwszy.</div>}
            {!listErr && people !== null && people.length ? (
              <div className="sl-entries">
                {people.map((p, i) => (
                  <div className="sl-entry" key={i}>
                    <div className="sl-no" style={{ fontSize: 22 }}>{p.date}</div>
                    <div>
                      <h3 style={{ marginBottom: 6 }}>{p.name}</h3>
                      {p.roles && p.roles.length ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "0 0 6px" }}>{p.roles.map((r) => <span key={r} className="sl-chip">{r}</span>)}</div> : null}
                      {p.about ? <p>{p.about}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div></section>
    </>
  );
}
