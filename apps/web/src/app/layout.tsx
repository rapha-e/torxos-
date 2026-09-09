import type { Metadata } from "next";
import "./globals.css";
import { AnalyticsTracker } from "@/components/analytics/pixel";

export const metadata: Metadata = {
  title: "TorxOS — Sistema Operacional para Assistências Técnicas",
  description: "O sistema operacional definitivo para assistências técnicas e centros de reparo de hardware. OS digital no WhatsApp, controle de estoque e AI mentor de gestão.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen selection:bg-amber-500 selection:text-black">
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
