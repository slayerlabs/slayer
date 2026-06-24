"use client";

import { useEffect, useState } from "react";

export default function ZgodaForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("status");
    if (s === "confirmed") setBanner("Dziękujemy — zgoda została potwierdzona.");
    else if (s === "invalid") setBanner("Link weryfikacyjny jest nieprawidłowy lub wygasł.");
  }, []);

  async function submit(e) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    const res = await fetch("/api/zgoda", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, consent, website }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("idle");
      setError(data.error || "Nie udało się wysłać formularza.");
      return;
    }
    setStatus(data.status === "confirmed" ? "already" : "sent");
  }

  if (status === "sent") {
    return (
      <p className="form-msg">
        Wysłaliśmy link weryfikacyjny na <strong>{email}</strong>. Kliknij go, aby
        potwierdzić zgodę. Sprawdź też folder spam.
      </p>
    );
  }
  if (status === "already") {
    return <p className="form-msg">Ten adres już potwierdził zgodę. Dziękujemy.</p>;
  }

  return (
    <form className="feedback-form" onSubmit={submit}>
      {banner && <p className="form-msg">{banner}</p>}
      <div className="field-row">
        <div className="field">
          <label>Imię i nazwisko</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jan Kowalski"
            maxLength={120}
            required
          />
        </div>
        <div className="field">
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jan@example.com"
            maxLength={200}
            required
          />
        </div>
      </div>
      <input
        aria-hidden="true"
        className="hp"
        tabIndex="-1"
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      <label className="field" style={{ flexDirection: "row", gap: "0.6rem", alignItems: "flex-start" }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={{ width: "auto", marginTop: "0.25rem" }}
          required
        />
        <span>
          Wyrażam zgodę na publikację mojego wizerunku oraz danych (imię i nazwisko,
          opis, biografia) w sekcji „Zespół" na stronie Fabryka AI, zgodnie z art. 6
          ust. 1 lit. a RODO i art. 81 ustawy o prawie autorskim. Zgodę mogę wycofać
          w każdej chwili.
        </span>
      </label>
      <div className="form-foot">
        <span className={error ? "form-msg err" : "form-msg"}>
          {error || "Po wysłaniu dostaniesz e-mail z linkiem potwierdzającym (double opt-in)."}
        </span>
        <button className="btn btn-p" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "wysyłanie..." : "wyślij zgodę"}
        </button>
      </div>
    </form>
  );
}
