"use client";

import { useEffect, useState } from "react";

const TYPES = ["faza-0", "benchmark", "dane", "trening", "rlvr", "produkt", "ryzyko", "inne"];

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

export default function SotaComments() {
  const [comments, setComments] = useState([]);
  const [author, setAuthor] = useState("");
  const [type, setType] = useState("faza-0");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/sota-comments", { cache: "no-store" });
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
    const res = await fetch("/api/sota-comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ author, type, body, website }),
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
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 1800);
    } else {
      setStatus("idle");
    }
  }

  return (
    <section className="feedback" id="comments">
      <div className="ghead">
        <h2>Komentarze publiczne</h2>
        <span className="c">{comments.length} wpisow</span>
      </div>

      <form className="feedback-form" onSubmit={submit}>
        <div className="field-row">
          <div className="field">
            <label>Imie / handle</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="np. @handle"
              maxLength={80}
            />
          </div>
          <div className="field">
            <label>Obszar</label>
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
            placeholder="Co jest bledne w planie, ktory gate jest za slaby, jaki benchmark albo verifier trzeba dodac?"
            maxLength={2200}
            required
          />
        </div>
        <div className="form-foot">
          <span className={error ? "form-msg err" : "form-msg"}>
            {error || "Komentarze sa publiczne. Najbardziej przydatne sa konkretne braki w macierzy, danych i gate'ach."}
          </span>
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
