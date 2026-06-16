import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import "../styles/lab.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://slayer.fabryka.ai";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: "Slayer — applied research lab dla polskich modeli",
  description:
    "Slayer to niezależne applied research lab dla polskich modeli językowych: protokoły ewaluacji, lineage danych, recepty treningowe i jawne koszty.",
  openGraph: {
    title: "Slayer — applied research lab dla polskich modeli",
    description: "Slayer to niezależne applied research lab dla polskich modeli językowych.",
    images: [{
      url: "/assets/img/hermes-lab-threshold.png",
      alt: "Slayer",
    }],
  },
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
