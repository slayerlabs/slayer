"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

const GROUPS = [
  {
    label: "protokół",
    links: [
      ["/kierunki", "kierunki modelu"],
      ["/propozycja", "propozycja v3"],
      ["/v3", "miks danych v3"],
      ["/v4", "plan V4 + feedback"],
      ["/sota", "SOTA 2026 + komentarze"],
      ["/rules", "zasady"],
      ["/roadmap", "harmonogram"],
      ["/drabina", "drabina kontrybutora"],
    ],
  },
  {
    label: "badania",
    links: [
      ["/datasety", "zbiory danych"],
      ["/trening", "trening"],
      ["/styl", "styl"],
      ["/zadania", "zadania"],
      ["/wiedza", "wiedza (CPT)"],
      ["/eng-log", "dziennik badawczy"],
    ],
  },
  {
    label: "pomiary",
    links: [
      ["/runner", "benchmark runner"],
      ["/leaderboard", "ranking"],
      ["/benchmarks", "metodologia"],
      ["/bench-explorer", "przeglądarka + zgłoszenia"],
      ["/closed-benchmarks", "benchmarki zamknięte"],
      ["/progress", "pomiar na żywo"],
      ["/eksperymenty", "log eksperymentów"],
    ],
  },
  {
    label: "ludzie",
    links: [
      ["/team", "zespół"],
      ["/zespol", "dołącz"],
    ],
  },
];

export default function Nav() {
  const pathname = (usePathname() || "/").replace(/\/+$/, "") || "/";
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  if (pathname === "/") return null; // ponytail: landing page (LEM) ships its own nav
  return (
    <header className="nav">
      <a className="brand" href="/" onClick={close}>
        <span className="bdot" />
        <span><span style={{ color: "#d56a4d" }}>Slayer</span> <span style={{ color: "var(--dim)" }}>/</span> <span style={{ color: "#5a63c0" }}>LEM</span></span>
      </a>
      <button
        className="navtoggle"
        aria-label="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav className={open ? "nlinks open" : "nlinks"}>
        {GROUPS.map((g) => {
          const active = g.links.some(([href]) => href === pathname);
          return (
            <div className={active ? "navgroup active" : "navgroup"} key={g.label}>
              <span className="navtop">{g.label}</span>
              <div className="navmenu">
                {g.links.map(([href, label]) => (
                  <a key={href} className={pathname === href ? "active" : ""} href={href} onClick={close}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
        <a className="ncta" href="https://discord.gg/HnTkVR4c5T" rel="noopener" target="_blank" onClick={close}>
          wejście →
        </a>
      </nav>
    </header>
  );
}
