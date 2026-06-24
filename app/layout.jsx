import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import "../styles/lab.css";

export const metadata = {
  title: "Fabryka AI — laboratorium stosowanej AI",
  description:
    "Fabryka AI to laboratorium stosowanej AI: dostrajanie modeli, RL, ewaluacje, agenci, narzędzia badawcze i otwarte artefakty.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <head>
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
