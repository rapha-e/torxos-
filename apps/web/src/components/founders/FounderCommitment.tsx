"use client";

import React from "react";
import { Check, Handshake, AlertCircle } from "lucide-react";

export function FounderCommitment() {
  const commitments = [
    "Utilizar o sistema de forma real na rotina da sua bancada;",
    "Compartilhar feedbacks sinceros sobre o que gostou e o que achou confuso;",
    "Relatar prontamente dificuldades e eventuais inconsistências encontradas;",
    "Sugerir melhorias e atalhos operacionais que agilizem o atendimento;",
    "Participar do processo contínuo de validação com o time;",
    "Responder eventualmente a pesquisas rápidas de experiência;",
    "Caso esteja satisfeito, considerar participar voluntariamente de um depoimento ou estudo de caso futuro.",
  ];

  return (
    <section className="py-20 border-t border-white/[0.08] bg-[#0C0C0E]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Compromisso Mútuo
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            E o que esperamos de você?
          </h2>
          <p className="text-sm text-zinc-300 font-medium">
            O Programa Fundador não é simplesmente uma promoção. É uma parceria.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.07] space-y-5 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commitments.map((text, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#E2A336]/15 text-[#E2A336] flex items-center justify-center shrink-0 mt-0.5 border border-[#E2A336]/30">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                  {text}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/[0.07] text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm font-semibold text-amber-300">
              <span>Não queremos elogios obrigatórios. Queremos opiniões reais.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
