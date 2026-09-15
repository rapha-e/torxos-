"use client";

import React from "react";
import {
  LogIn,
  Calculator,
  CheckCircle,
  Stethoscope,
  Wrench,
  ShieldCheck,
  PackageCheck,
  ArrowRight,
} from "lucide-react";

export function FounderJourney() {
  const steps = [
    {
      step: "01",
      title: "Entrada",
      icon: LogIn,
      detail: "Checklist com foto de avarias e emissão de comprovante térmico com QR Code.",
    },
    {
      step: "02",
      title: "Orçamento",
      icon: Calculator,
      detail: "Cálculo preciso de peças, mão de obra e margem líquida sem achismos.",
    },
    {
      step: "03",
      title: "Aprovação",
      icon: CheckCircle,
      detail: "Envio automático por WhatsApp para aprovação com 1 toque pelo cliente.",
    },
    {
      step: "04",
      title: "Diagnóstico",
      icon: Stethoscope,
      detail: "Laudo técnico registrado na bancada e histórico salvo do equipamento.",
    },
    {
      step: "05",
      title: "Reparo",
      icon: Wrench,
      detail: "Baixa automática do estoque e rastreamento de comissão do técnico.",
    },
    {
      step: "06",
      title: "Teste",
      icon: ShieldCheck,
      detail: "Checklist de saída e verificação final de conformidade de hardware.",
    },
    {
      step: "07",
      title: "Entrega",
      icon: PackageCheck,
      detail: "Termo de garantia digital, baixa financeira e cliente satisfeito.",
    },
  ];

  return (
    <section className="py-20 border-t border-white/[0.08] bg-white/[0.015]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Fluxo Completo de Ponta a Ponta
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            Muito mais do que um sistema de OS.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
            O TorxOS foi desenvolvido para acompanhar a assistência desde a entrada do aparelho até a entrega ao cliente. O produto gerencia a operação inteira, e não somente a emissão de uma folha de papel.
          </p>
        </div>

        {/* Grid / Timeline da Jornada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative rounded-xl p-px bg-gradient-to-b from-white/12 via-white/[0.04] to-white/[0.01] shadow-md group"
              >
                <div className="rounded-[11px] bg-[#121215] p-4 h-full flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#E2A336] bg-[#E2A336]/10 px-1.5 py-0.5 rounded border border-[#E2A336]/20">
                        {item.step}
                      </span>
                      <Icon className="w-4 h-4 text-zinc-400 group-hover:text-white transition" />
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-tight">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug font-normal">
                    {item.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
