"use client";

import React from "react";
import { TrendingDown, Sparkles, CheckCircle2 } from "lucide-react";

export function FounderSavings() {
  return (
    <section className="py-20 border-t border-white/[0.08] bg-[#0C0C0E]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Demonstrativo de Economia
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            Uma condição especial para quem chega primeiro.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
            A recompensa direta para as assistências pioneiras que construírem o TorxOS conosco nos primeiros 6 meses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* STARTER */}
          <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/[0.07] space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="font-bold text-white text-base">STARTER</h3>
              <span className="text-[10px] font-mono text-zinc-400">Individual</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Preço Oficial:</span>
                <span className="font-mono text-zinc-300">R$ 79,00/mês</span>
              </div>
              <div className="flex justify-between font-semibold text-white">
                <span>Condição Fundador:</span>
                <span className="font-mono text-amber-300">R$ 39,90/mês</span>
              </div>
              <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center text-emerald-400 font-medium">
                <span>Economia mensal:</span>
                <span className="font-mono font-bold text-sm">R$ 39,10/mês</span>
              </div>
            </div>
          </div>

          {/* PRO — Destaque */}
          <div className="rounded-2xl p-6 bg-gradient-to-b from-[#E2A336]/15 via-white/[0.03] to-transparent border border-[#E2A336]/30 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">PRO</h3>
                <span className="text-[9px] font-mono font-bold uppercase bg-[#E2A336]/20 text-[#E2A336] px-1.5 py-0.5 rounded border border-[#E2A336]/30">
                  Principal
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-200">Equipes & Bancadas</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Preço Oficial:</span>
                <span className="font-mono text-zinc-300">R$ 139,00/mês</span>
              </div>
              <div className="flex justify-between font-semibold text-white">
                <span>Condição Fundador:</span>
                <span className="font-mono text-[#E2A336]">R$ 59,90/mês</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-medium pt-1">
                <span>Economia mensal:</span>
                <span className="font-mono font-bold">R$ 79,10/mês</span>
              </div>
              <div className="pt-3 border-t border-white/[0.08] text-center bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05]">
                <span className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                  Durante o período de 6 meses
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400 tracking-tight">
                  R$ 474,60 de economia
                </span>
              </div>
            </div>
          </div>

          {/* ENTERPRISE */}
          <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/[0.07] space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="font-bold text-white text-base">ENTERPRISE</h3>
              <span className="text-[10px] font-mono text-zinc-400">Redes & Filiais</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Preço Oficial:</span>
                <span className="font-mono text-zinc-300">R$ 249,00/mês</span>
              </div>
              <div className="flex justify-between font-semibold text-white">
                <span>Condição Fundador:</span>
                <span className="font-mono text-white">Sob avaliação</span>
              </div>
              <div className="pt-2 border-t border-white/[0.06] text-zinc-400 leading-relaxed text-[11px]">
                Ajustado sob medida para o porte e volume de bancada da sua rede.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
