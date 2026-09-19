import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Newsreader, Space_Grotesk, Space_Mono } from "next/font/google";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import "../styles/lab.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono", display: "swap" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata = {
  title: "Slayer — laboratorium stosowanej AI",
  description:
    "Slayer to laboratorium stosowanej AI: dostrajanie modeli, RL, ewaluacje, agenci, narzędzia badawcze i otwarte artefakty.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className={`${inter.variable} ${display.variable} ${mono.variable} ${serif.variable}`}>
      <head />
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
