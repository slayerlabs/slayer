import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import "../styles/slayer.css";

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-archivo",
  display: "swap",
});
const jbmono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata = {
  title: "Slayer — applied research lab dla polskich modeli",
  description:
    "Slayer to niezależne applied research lab dla polskich modeli językowych: protokoły ewaluacji, lineage danych, recepty treningowe i jawne koszty.",
};

// Ustawia motyw PRZED pierwszym paintem (bez mignięcia): zapamiętany wybór,
// inaczej preferencja systemu. Brak data-theme = domyślne tokeny ciemne.
const themeScript = `(function(){try{var t=localStorage.getItem('sl-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className={`${archivo.variable} ${jbmono.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a className="sl-skip" href="#main">Przejdź do treści</a>
        <Nav />
        <div id="main" tabIndex={-1}>{children}</div>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
