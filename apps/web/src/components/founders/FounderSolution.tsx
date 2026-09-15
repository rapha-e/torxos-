"use client";

import React from "react";
import {
  FileText,
  Kanban,
  Boxes,
  DollarSign,
  Bot,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { trackFounderEvent } from "./FounderTracking";

interface FounderSolutionProps {
  onCtaClick?: () => void;
}

export function FounderSolution({ onCtaClick }: FounderSolutionProps) {
  const handleCta = () => {
    trackFounderEvent("founder_cta_click", { location: "solution" });
    onCtaClick?.();
  };

  const features = [
    {
      icon: FileText,
      title: "Ordens de Serviço",
      description: "Organize cada aparelho, serviço, diagnóstico, orçamento e histórico em um único lugar.",
    },
    {
      icon: Kanban,
      title: "Bancada Kanban",
      description: "Visualize rapidamente o que entrou, o que está em diagnóstico, aguardando aprovação, em reparo e pronto para entrega.",
    },
    {
      icon: Boxes,
      title: "Estoque",
      description: "Tenha maior controle sobre peças, movimentações e disponibilidade de produtos utilizados nos reparos.",
    },
    {
      icon: DollarSign,
      title: "Financeiro",
      description: "Acompanhe receitas, despesas, resultados e indicadores importantes para entender a saúde financeira da operação.",
    },
    {
      icon: Bot,
      title: "Inteligência Artificial",
      description: "Utilize IA para transformar os dados da sua assistência em informações úteis para tomada de decisão.",
    },
    {
      icon: BarChart3,
      title: "Gestão",
      description: "Tenha indicadores para entender o que está acontecendo na operação em tempo real.",
    },
  ];

  return (
    <section className="py-20 border-t border-white/[0.08] bg-[#0C0C0E]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            A Plataforma Integrada
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            O TorxOS foi criado para mudar isso.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Um sistema operacional especializado em assistências técnicas, reunindo em um único ambiente ordens de serviço, bancada, estoque, financeiro e inteligência artificial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.01] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-white/25"
              >
                <div className="rounded-[15px] bg-[#121215] p-6 space-y-3 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-200 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                      <Icon className="w-5 h-5 text-[#E2A336]" />
                    </div>
                    <h3 className="text-base font-bold text-white -tracking-[0.02em]">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                      {feat.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {onCtaClick && (
          <div className="pt-4 text-center">
            <button
              onClick={handleCta}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] hover:border-white/20 font-semibold text-xs tracking-tight transition cursor-pointer"
            >
              <span>Quero participar como fundador</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E2A336]" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
