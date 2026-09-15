"use client";

import React from "react";
import {
  FileSpreadsheet,
  MessageCircleQuestion,
  Boxes,
  EyeOff,
  Unplug,
  ClockAlert,
} from "lucide-react";

export function FounderProblem() {
  const problems = [
    {
      icon: FileSpreadsheet,
      title: "Ordens de serviço espalhadas",
      description: "Blocos de papel, fichas impressas e notas no balcão que se perdem na correria diária da bancada.",
    },
    {
      icon: MessageCircleQuestion,
      title: "Clientes cobrando status no WhatsApp",
      description: "Técnicos e atendentes interrompidos dezenas de vezes ao dia apenas para responder 'meu aparelho já ficou pronto?'.",
    },
    {
      icon: Boxes,
      title: "Peças que entram e saem sem controle",
      description: "Telas e baterias que somem da gaveta ou faltam no momento crítico do reparo sem que ninguém saiba onde foram parar.",
    },
    {
      icon: EyeOff,
      title: "Informações financeiras difíceis de visualizar",
      description: "Dificuldade em enxergar a margem líquida real de cada serviço, misturando dinheiro do caixa com contas pessoais.",
    },
    {
      icon: Unplug,
      title: "Sistemas desconectados que não conversam",
      description: "Planilhas, anotações soltas, WhatsApp e sistemas legados que operam isolados e geram retrabalho contínuo.",
    },
    {
      icon: ClockAlert,
      title: "Pouco tempo para pensar no crescimento",
      description: "O proprietário passa o dia apagando incêndios operacionais em vez de estruturar e expandir a empresa.",
    },
  ];

  return (
    <section className="py-20 border-t border-white/[0.08] bg-white/[0.015]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Diagnóstico Operacional
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            Sua assistência ainda perde tempo com problemas que poderiam ser evitados?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-normal">
            A rotina de uma assistência técnica é pesada. Pequenas falhas de processo consomem o lucro e a tranquilidade do lojista.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="rounded-2xl p-px bg-gradient-to-b from-white/12 via-white/[0.04] to-white/[0.01] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <div className="rounded-[15px] bg-[#121215] p-6 space-y-3 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#E2A336] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white -tracking-[0.02em]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
