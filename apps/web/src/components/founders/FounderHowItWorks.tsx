"use client";

import React from "react";
import { MessageSquare, PhoneCall, KeyRound, Rocket, Wrench, GitFork } from "lucide-react";

export function FounderHowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Você demonstra interesse",
      desc: "Preenche o formulário nesta página informando o perfil da sua loja.",
      icon: MessageSquare,
    },
    {
      num: "02",
      title: "Conversamos",
      desc: "Alinhamos expectativas, tiramos dúvidas e avaliamos a aderência mútua.",
      icon: PhoneCall,
    },
    {
      num: "03",
      title: "Você entra para o programa",
      desc: "Sua vaga é formalizada com a condição exclusiva de fundador por 6 meses.",
      icon: KeyRound,
    },
    {
      num: "04",
      title: "Fazemos o onboarding",
      desc: "Configuramos seu ambiente e orientamos o uso prático inicial.",
      icon: Rocket,
    },
    {
      num: "05",
      title: "Você utiliza",
      desc: "Roda suas ordens de serviço, bancada, estoque e financeiro no sistema.",
      icon: Wrench,
    },
    {
      num: "06",
      title: "Você participa da evolução",
      desc: "Compartilha feedbacks, aponta melhorias e co-cria o futuro do TorxOS.",
      icon: GitFork,
    },
  ];

  return (
    <section className="py-20 border-t border-white/[0.08] bg-white/[0.015]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Passo a Passo
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            Como funciona a adesão ao Programa Fundador
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Processo direto, transparente e sem burocracia para colocar sua assistência no ar.
          </p>
        </div>

        {/* Timeline Desktop (Horizontal) & Mobile (Vertical) */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl p-px bg-gradient-to-b from-white/12 via-white/[0.04] to-white/[0.01] shadow-lg flex flex-col justify-between"
              >
                <div className="rounded-[15px] bg-[#121215] p-5 h-full flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold text-[#E2A336] bg-[#E2A336]/10 px-2 py-0.5 rounded border border-[#E2A336]/25">
                        {step.num}
                      </span>
                      <Icon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug pt-1">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                    {step.desc}
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
