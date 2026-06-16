import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import "../styles/lab.css";
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

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className={`${archivo.variable} ${jbmono.variable}`}>
      <head>
        {/* TODO(redesign rollout): usunąć preconnect + ten Google Fonts <link>, gdy fonty lab.css (Hanken/IBM Plex/Newsreader) zostaną zastąpione — next/font self-hostuje Archivo + JetBrains Mono i nie potrzebuje tych żądań */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Nav />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
