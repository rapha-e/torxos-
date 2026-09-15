"use client";

import React from "react";
import { Users2, Search, LineChart } from "lucide-react";

export function FounderWhyTen() {
  return (
    <section className="py-20 border-t border-white/[0.08] bg-[#0C0C0E]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12 text-center">
        <div className="space-y-3">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Critério de Qualidade
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            Por que apenas 10?
          </h2>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.025] border border-white/[0.07] text-left text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-4 shadow-xl">
          <p>
            Porque esse não é um lançamento baseado simplesmente em quantidade.
          </p>
          <p>
            Queremos acompanhar de perto os primeiros usuários. Queremos observar como o sistema é utilizado no ritmo acelerado do balcão.
          </p>
          <p>
            Queremos descobrir o que funciona, o que precisa melhorar e construir essas melhorias junto com quem realmente trabalha em uma assistência técnica.
          </p>
        </div>

        {/* 3 Pilares em Destaque */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
            <div className="text-2xl font-extrabold text-[#E2A336] font-mono">10 empresas.</div>
            <p className="text-xs text-zinc-400 leading-snug">Grupo enxuto e selecionado para validação profunda.</p>
          </div>
          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
            <div className="text-2xl font-extrabold text-white font-mono">Acompanhamento próximo.</div>
            <p className="text-xs text-zinc-400 leading-snug">Acesso direto ao time técnico e fundador do TorxOS.</p>
          </div>
          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
            <div className="text-2xl font-extrabold text-white font-mono">Uso real.</div>
            <p className="text-xs text-zinc-400 leading-snug">Evolução moldada por ordens de serviço e rotina de bancada.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
