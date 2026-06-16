"use client";
import { useEffect, useState } from "react";

// Motyw ustawia skrypt inline w <head> (przed paintem) na podstawie
// localStorage → prefers-color-scheme. Tu tylko czytamy stan i przełączamy.
export default function ThemeToggle() {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "dark");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("sl-theme", next);
    } catch {
      /* tryb prywatny — trudno, motyw nie przetrwa reloadu */
    }
    setTheme(next);
  }

  const isLight = theme === "light";
  return (
    <button
      type="button"
      className="sl-theme-btn"
      onClick={toggle}
      aria-label={isLight ? "Przełącz na tryb ciemny" : "Przełącz na tryb jasny"}
      title={isLight ? "tryb ciemny" : "tryb jasny"}
    >
      <span aria-hidden="true">{theme == null ? "◐" : isLight ? "◑ ciemny" : "◐ jasny"}</span>
    </button>
  );
}
