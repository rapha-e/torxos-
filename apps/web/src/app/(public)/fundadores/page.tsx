import type { Metadata } from "next";
import { FoundersPageContent } from "@/components/founders/FoundersPageContent";

export const metadata: Metadata = {
  title: "Programa Fundador TorxOS | Sistema para Assistências Técnicas",
  description:
    "Participe do Programa Fundador TorxOS. Apenas 10 assistências técnicas terão acesso antecipado ao sistema em condições especiais e poderão participar diretamente da evolução do produto.",
  keywords: [
    "programa fundador",
    "torxos",
    "sistema para assistência técnica",
    "gestão de bancada",
    "ordem de serviço",
    "controle de estoque para assistência",
    "software para reparo de celulares e computadores",
  ],
  openGraph: {
    title: "Programa Fundador TorxOS | Sistema para Assistências Técnicas",
    description:
      "Apenas 10 assistências técnicas terão acesso antecipado ao sistema em condições especiais e poderão participar diretamente da evolução do produto.",
    url: "https://torxos.com.br/fundadores",
    siteName: "TorxOS",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Programa Fundador TorxOS | Sistema para Assistências Técnicas",
    description:
      "Apenas 10 assistências técnicas terão acesso antecipado ao sistema em condições especiais e poderão participar diretamente da evolução do produto.",
  },
  alternates: {
    canonical: "/fundadores",
  },
};

export default function FoundersPage() {
  return <FoundersPageContent />;
}
