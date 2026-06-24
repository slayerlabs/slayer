"use client";
import { usePathname } from "next/navigation";

export default function Footer() {
  if ((usePathname() || "/") === "/") return null; // ponytail: landing page (LEM) ships its own footer
  return (
    <footer className="foot">
      <span>FABRYKA AI — laboratorium stosowanej AI · dostrajanie / RL / agenci · 2026</span>
      <span>
        <a href="https://github.com/slayerlabs" rel="noopener">GitHub</a> ·{" "}
        <a href="/benchmarks">protokoły</a> · <a href="/leaderboard">pomiary</a> ·{" "}
        <a href="/rules">zasady</a> · <a href="/drabina">drabina</a> ·{" "}
        <a href="/roadmap">harmonogram</a> ·{" "}
        <a href="/team">zespół</a> · <a href="/zespol">wejście</a> ·{" "}
        <a href="/regulamin">regulamin</a> · <a href="/regulamin-discord">discord</a> ·{" "}
        <a href="/wspolpraca">współpraca</a> · <a href="/zgoda">zgoda</a> ·{" "}
        <a href="/polityka-prywatnosci">prywatność</a>
      </span>
    </footer>
  );
}
