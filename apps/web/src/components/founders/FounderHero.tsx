"use client";

import React from "react";
import { ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { FounderSlots } from "./FounderSlots";
import { trackFounderEvent } from "./FounderTracking";

interface FounderHeroProps {
  onCtaClick: () => void;
  availableSlots?: number;
}

export function FounderHero({ onCtaClick, availableSlots = 10 }: FounderHeroProps) {
  const handleClick = () => {
    trackFounderEvent("founder_cta_click", { location: "hero" });
    onCtaClick();
  };

  return (
    <section className="relative pt-20 pb-20 overflow-hidden">
      {/* Luzes difusas de ambientação suave (não exageradas) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-amber-500/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-[280px] h-[280px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8 relative z-10">
        {/* Badge do Programa com indicador de status */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] text-xs font-medium text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-[#E2A336] shadow-[0_0_8px_rgba(226,163,54,0.6)] animate-pulse" />
          <span className="font-semibold text-white">Programa Fundador TorxOS</span>
          <span className="text-zinc-500 font-mono text-[11px]">•</span>
          <span className="text-zinc-400 font-mono text-[11px]">Acesso Antecipado & Parceria</span>
        </div>

        {/* Indicador visual das 10 vagas */}
        <div className="flex justify-center">
          <FounderSlots availableSlots={availableSlots} totalSlots={10} />
        </div>

        {/* Headline Principal */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold -tracking-[0.035em] text-white max-w-4xl mx-auto leading-[1.12]">
          As 10 primeiras assistências vão construir o{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-amber-200 to-[#E2A336]">
            futuro do TorxOS.
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="text-base sm:text-lg text-zinc-300 max-w-3xl mx-auto leading-relaxed font-medium">
          Seja uma das primeiras assistências técnicas a utilizar uma nova geração de gestão especializada — e participe diretamente da evolução do produto.
        </p>

        {/* Parágrafo explicativo e transparente */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.07] max-w-2xl mx-auto text-xs sm:text-sm text-zinc-400 leading-relaxed text-left space-y-3 shadow-lg">
          <p>
            Estamos selecionando <strong className="text-zinc-200">apenas 10 assistências técnicas</strong> para participar do Programa Fundador TorxOS.
          </p>
          <p>
            Durante os primeiros 6 meses, você terá acesso ao TorxOS em uma condição exclusiva, poderá enviar feedbacks diretamente para o time e contribuir para definir as próximas melhorias do sistema.
          </p>
        </div>

        {/* Bloco de Preço Âncora de Fundador & Chamada para Ação */}
        <div className="pt-2 space-y-4 max-w-md mx-auto">
          <div className="text-center space-y-1">
            <span className="text-[11px] uppercase tracking-widest font-mono text-zinc-400 font-semibold">
              Condição exclusiva para os 10 primeiros fundadores
            </span>
            <div className="flex items-baseline justify-center gap-1.5 font-mono">
              <span className="text-xs text-zinc-400 font-sans">A partir de</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">R$ 39,90</span>
              <span className="text-xs text-zinc-400 font-sans">/mês</span>
            </div>
          </div>

          <button
            onClick={handleClick}
            className="w-full py-4 px-6 rounded-xl bg-[#E2A336] hover:bg-[#EBB048] text-[#14120E] font-bold text-sm tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_24px_-6px_rgba(226,163,54,0.35)] border border-[#EBB048]/60 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>QUERO SER UM DOS 10 FUNDADORES</span>
            <ArrowRight className="w-4 h-4 text-[#14120E]" />
          </button>

          <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
            Vagas limitadas a 10 assistências técnicas. Sujeito à aprovação para participação no programa.
          </p>
        </div>

        {/* Pilares de Transparência */}
        <div className="pt-4 flex items-center justify-center gap-6 sm:gap-8 text-xs text-zinc-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sem fidelidade obrigatória</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Canal direto com o time fundador</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Condição travada por 6 meses</span>
          </div>
        </div>
      </div>
    </section>
  );
}
