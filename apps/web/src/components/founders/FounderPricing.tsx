"use client";

import React from "react";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { trackFounderEvent } from "./FounderTracking";

interface FounderPricingProps {
  onSelectPlan: (plan: string) => void;
}

export function FounderPricing({ onSelectPlan }: FounderPricingProps) {
  const handleSelect = (plan: string) => {
    trackFounderEvent("founder_plan_selected", { plan });
    trackFounderEvent("founder_cta_click", { location: "pricing", plan });
    onSelectPlan(plan);
  };

  return (
    <section id="planos" className="py-20 border-t border-white/[0.08] bg-white/[0.015]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Condição de Fundador
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            Condição exclusiva para os 10 primeiros
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Valores de acesso antecipado assegurados durante os primeiros 6 meses do programa em troca da sua participação e feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Card STARTER */}
          <div className="rounded-2xl p-px bg-gradient-to-b from-white/12 via-white/[0.04] to-white/[0.01] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
            <div className="rounded-[15px] bg-[#121215] p-7 flex flex-col justify-between space-y-6 h-full">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white -tracking-[0.02em]">STARTER</h3>
                  <p className="text-xs text-zinc-400 mt-1">Para técnicos autônomos e oficinas que buscam sair do papel.</p>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="text-[11px] font-mono text-zinc-500 line-through">
                    Preço oficial: R$ 79/mês
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-xs text-zinc-400 font-sans">Fundador:</span>
                    <span className="text-3xl font-extrabold text-white">R$ 39,90</span>
                    <span className="text-xs text-zinc-400 font-sans">/mês</span>
                  </div>
                  <span className="inline-block text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
                    Durante 6 meses
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-300 pt-3 border-t border-white/[0.06]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Até 2 usuários inclusos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Ordens de Serviço ilimitadas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Impressão térmica de OS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Controle de estoque básico</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Fluxo de caixa diário</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleSelect("Starter")}
                className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] hover:border-white/20 font-semibold text-xs tracking-tight transition cursor-pointer"
              >
                Candidatar-se no Starter
              </button>
            </div>
          </div>

          {/* Card PRO — Destaque VIP */}
          <div className="rounded-2xl p-px bg-gradient-to-b from-[#E2A336]/60 via-white/[0.1] to-white/[0.02] shadow-2xl relative transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-12px_rgba(226,163,54,0.2)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-[#E2A336] text-[#14120E] font-mono text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
              Mais Escolhido • Recomendado
            </div>
            <div className="rounded-[15px] bg-[#141418] p-7 flex flex-col justify-between space-y-6 h-full">
              <div className="space-y-4 pt-1">
                <div>
                  <h3 className="text-base font-bold text-white -tracking-[0.02em]">PRO</h3>
                  <p className="text-xs text-zinc-400 mt-1">Para bancadas em crescimento que necessitam de automação e controle total.</p>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="text-[11px] font-mono text-zinc-500 line-through">
                    Preço oficial: R$ 139/mês
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-xs text-zinc-400 font-sans">Fundador:</span>
                    <span className="text-3xl font-extrabold text-[#E2A336]">R$ 59,90</span>
                    <span className="text-xs text-zinc-400 font-sans">/mês</span>
                  </div>
                  <span className="inline-block text-[10px] font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-medium">
                    Durante 6 meses • Economia garantida
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-300 pt-3 border-t border-white/[0.06]">
                  <li className="flex items-center gap-2 font-medium text-white">
                    <Check className="w-4 h-4 text-[#E2A336] shrink-0" />
                    <span>Tudo do Starter incluso</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#E2A336] shrink-0" />
                    <span>Até 5 usuários / técnicos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#E2A336] shrink-0" />
                    <span>Consulta de OS com QR Code</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#E2A336] shrink-0" />
                    <span>Previsão preditiva de estoque</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#E2A336] shrink-0" />
                    <span>DRE & Conciliação Pix</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-amber-200">
                    <Sparkles className="w-4 h-4 text-[#E2A336] shrink-0" />
                    <span>TorxOS AI Mentor integrado</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleSelect("PRO")}
                className="w-full py-3.5 rounded-xl bg-[#E2A336] hover:bg-[#EBB048] text-[#14120E] font-bold text-xs tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_20px_-4px_rgba(226,163,54,0.3)] border border-[#EBB048]/60 transition-all active:scale-[0.99] cursor-pointer"
              >
                QUERO SER FUNDADOR
              </button>
            </div>
          </div>

          {/* Card ENTERPRISE */}
          <div className="rounded-2xl p-px bg-gradient-to-b from-white/12 via-white/[0.04] to-white/[0.01] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
            <div className="rounded-[15px] bg-[#121215] p-7 flex flex-col justify-between space-y-6 h-full">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white -tracking-[0.02em]">ENTERPRISE</h3>
                  <p className="text-xs text-zinc-400 mt-1">Para redes de lojas, franquias e centros técnicos avançados.</p>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="text-[11px] font-mono text-zinc-500">
                    Preço oficial de catálogo: R$ 249/mês
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-xs text-zinc-400 font-sans">Condição especial:</span>
                    <span className="text-2xl font-bold text-white">Sob avaliação</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 pt-0.5">
                    Condições especiais para operações maiores avaliadas individualmente.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-300 pt-3 border-t border-white/[0.06]">
                  <li className="flex items-center gap-2 font-medium text-white">
                    <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Tudo do plano PRO</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Múltiplas unidades e filiais</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Comissionamento customizado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Gerente de contas dedicado</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleSelect("Enterprise")}
                className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] hover:border-white/20 font-semibold text-xs tracking-tight transition cursor-pointer"
              >
                Falar com nosso time
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
