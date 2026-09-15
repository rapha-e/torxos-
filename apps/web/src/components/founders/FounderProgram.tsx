"use client";

import React from "react";
import { Sparkles, Terminal, HeartHandshake } from "lucide-react";

export function FounderProgram() {
  const actions = [
    { label: "UTILIZAR", desc: "No dia a dia real da loja" },
    { label: "TESTAR", desc: "Em cenários de bancada pesada" },
    { label: "CRITICAR", desc: "Com honestidade e franqueza" },
    { label: "SUGERIR", desc: "O que facilitaria sua rotina" },
    { label: "AJUDAR A MELHORAR", desc: "Direto com nossos engenheiros" },
  ];

  return (
    <section className="py-20 border-t border-white/[0.08] bg-[#0C0C0E]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10 text-center">
        <div className="space-y-3">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#E2A336] bg-[#E2A336]/10 px-3 py-1 rounded-full border border-[#E2A336]/20">
            Propósito & Visão
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            Por que estamos criando o Programa Fundador?
          </h2>
          <h3 className="text-lg sm:text-xl font-semibold text-zinc-300">
            Porque queremos construir o produto certo.
          </h3>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.07] text-left text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-4 shadow-xl">
          <p>
            O TorxOS está entrando em uma nova fase.
          </p>
          <p>
            Antes de levar o sistema para centenas de assistências técnicas, queremos trabalhar lado a lado com um pequeno grupo de empresas que conhecem a rotina real do setor.
          </p>
          <p>
            Por isso criamos o <strong>Programa Fundador</strong>.
          </p>
          <p>
            As primeiras 10 assistências terão a oportunidade de utilizar o TorxOS e participar diretamente da evolução do produto.
          </p>
        </div>

        {/* Destaque Visual das Ações de Co-criação */}
        <div className="space-y-3">
          <span className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold">
            O papel do fundador na bancada:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            {actions.map((act, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center space-y-1 hover:border-[#E2A336]/40 transition"
              >
                <div className="font-mono text-xs font-extrabold text-[#E2A336] tracking-wide">
                  {act.label}
                </div>
                <div className="text-[10px] text-zinc-400 font-medium">
                  {act.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#E2A336]/10 border border-[#E2A336]/25 text-xs sm:text-sm font-semibold text-amber-200">
          "Sua experiência na bancada pode ajudar a definir o futuro do sistema."
        </div>
      </div>
    </section>
  );
}
