"use client";

import React from "react";
import { Check, X } from "lucide-react";

export function FounderAudience() {
  const forYou = [
    "Possui uma assistência técnica ativa no mercado;",
    "Trabalha com manutenção de celulares, computadores, notebooks, eletrônicos ou equipamentos;",
    "Precisa organizar melhor suas ordens de serviço e acabar com papéis soltos;",
    "Quer controlar melhor peças em estoque e saúde financeira da bancada;",
    "Quer reduzir processos manuais e cobranças repetitivas no WhatsApp;",
    "Quer acompanhar melhor a produtividade dos técnicos da equipe;",
    "Está disposto a experimentar uma solução nova e moderna.",
  ];

  const notForYou = [
    "Procura apenas o sistema mais barato do mercado sem foco em qualidade;",
    "Não pretende utilizar o sistema de fato na operação diária;",
    "Não quer participar minimamente do processo de validação e feedback;",
    "Procura apenas um gerador simples e estático de folhas de OS.",
  ];

  return (
    <section className="py-20 border-t border-white/[0.08] bg-[#0C0C0E]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Alinhamento de Perfil
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            Para quem é o TorxOS?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
            Buscamos sinergia real entre o que o sistema entrega e o que a sua assistência precisa para crescer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* É para você se */}
          <div className="rounded-2xl p-7 bg-white/[0.02] border border-emerald-500/20 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                É para você se:
              </h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
              {forYou.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Não é para você se (Mais discreto) */}
          <div className="rounded-2xl p-7 bg-white/[0.01] border border-white/[0.06] space-y-5 shadow-sm opacity-85 hover:opacity-100 transition">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
              <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-xs">
                ✕
              </div>
              <h3 className="text-base font-bold text-zinc-300 tracking-tight">
                Não é para você se:
              </h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-zinc-400">
              {notForYou.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
