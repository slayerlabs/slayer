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

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className={`${archivo.variable} ${jbmono.variable}`}>
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
