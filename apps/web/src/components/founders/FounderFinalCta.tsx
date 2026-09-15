"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { trackFounderEvent } from "./FounderTracking";

interface FounderFinalCtaProps {
  onCtaClick: () => void;
}

export function FounderFinalCta({ onCtaClick }: FounderFinalCtaProps) {
  const handleClick = () => {
    trackFounderEvent("founder_cta_click", { location: "final_cta" });
    onCtaClick();
  };

  return (
    <section className="py-24 border-t border-white/[0.08] bg-[#0C0C0E] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-amber-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 text-center space-y-8 relative z-10">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white -tracking-[0.035em] leading-tight">
          As primeiras 10 assistências terão a oportunidade de entrar.
        </h2>

        <div className="max-w-2xl mx-auto space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
          <p>
            O TorxOS foi criado para quem vive a rotina de uma assistência técnica.
          </p>
          <p>
            Agora queremos construir os próximos passos junto com quem vive essa realidade todos os dias.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.07] max-w-xl mx-auto space-y-1 text-center">
          <h3 className="text-base sm:text-lg font-bold text-zinc-300">
            Você pode simplesmente esperar o sistema ficar pronto.
          </h3>
          <h3 className="text-base sm:text-lg font-extrabold text-[#E2A336]">
            Ou pode ajudar a construí-lo.
          </h3>
        </div>

        <div className="pt-2 space-y-3 max-w-md mx-auto">
          <button
            onClick={handleClick}
            className="w-full py-4 px-8 rounded-xl bg-[#E2A336] hover:bg-[#EBB048] text-[#14120E] font-bold text-sm tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_24px_-6px_rgba(226,163,54,0.35)] border border-[#EBB048]/60 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>QUERO SER UM DOS 10 FUNDADORES</span>
            <ArrowRight className="w-4 h-4 text-[#14120E]" />
          </button>
          <p className="text-[11px] text-zinc-400">
            Programa Fundador TorxOS — 10 vagas. Condições especiais. Participação na evolução do produto.
          </p>
        </div>
      </div>
    </section>
  );
}
