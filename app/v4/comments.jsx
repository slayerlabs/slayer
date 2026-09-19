"use client";

import { useEffect, useState } from "react";

const TYPES = ["ryzyko", "eval", "dane", "trening", "release", "inne"];

function prettyDate(value) {
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function V4Comments() {
  const [comments, setComments] = useState([]);
  const [author, setAuthor] = useState("");
  const [type, setType] = useState("eval");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  async function load() {
    const res = await fetch("/api/v4-comments", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setComments(Array.isArray(data.comments) ? data.comments : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    const res = await fetch("/api/v4-comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ author, type, body, website, accepted, termsVersion: "1.0.0" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("idle");
      setError(data.error || "Nie udało się zapisać komentarza.");
      return;
    }
    if (data.comment) {
      setComments((current) => [data.comment, ...current]);
      setBody("");
      setAccepted(false);
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 1800);
    } else {
      setStatus("idle");
    }
  }

  return (
    <section className="feedback" id="feedback">
      <div className="ghead">
        <h2>Feedback do planu</h2>
        <span className="c">{comments.length} komentarzy</span>
      </div>

      <form className="feedback-form" onSubmit={submit}>
        <div className="field-row">
          <div className="field">
            <label>Imię / handle</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="np. kacper"
              maxLength={80}
            />
          </div>
          <div className="field">
            <label>Typ</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
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
        <div className="field">
          <label>Komentarz</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Co w planie jest słabe, czego brakuje w gate, jaki eksperyment odpalić najpierw?"
            maxLength={1800}
            required
          />
        </div>
        <label className="field" style={{ flexDirection: "row", gap: ".6rem", alignItems: "flex-start" }}>
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required style={{ width: "auto", marginTop: ".25rem" }} />
          <span>Proszę o publiczną publikację komentarza na zasadach <a href="/zasady-zgloszen">Zasad zgłoszeń</a>. Znam <a href="/polityka-prywatnosci">Politykę prywatności</a>.</span>
        </label>
        <div className="form-foot">
          <span className={error ? "form-msg err" : "form-msg"}>{error || "Komentarz i handle będą publiczne. Usunięcie: k.wikiel@gmail.com."}</span>
          <button className="btn btn-p" type="submit" disabled={status === "saving"}>
            {status === "saving" ? "zapis..." : status === "saved" ? "zapisano" : "dodaj komentarz"}
          </button>
        </div>
      </form>

      <div className="comment-list">
        {comments.length === 0 ? (
          <p className="empty">Brak komentarzy.</p>
        ) : (
          comments.map((comment) => (
            <article className="comment" key={comment.id}>
              <div className="comment-top">
                <span className="who">{comment.author || "anon"}</span>
                <span className="ctype">{comment.type || "uwaga"}</span>
                <time>{prettyDate(comment.createdAt)}</time>
              </div>
              <p>{comment.body}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
