"use client";

import React from "react";
import {
  Laptop,
  BadgePercent,
  Lightbulb,
  Compass,
  MessageSquareShare,
  Award,
} from "lucide-react";

export function FounderBenefits() {
  const benefits = [
    {
      icon: Laptop,
      title: "Acesso ao TorxOS",
      description: "Utilize o sistema na operação real da sua assistência técnica sem limitações artificiais.",
    },
    {
      icon: BadgePercent,
      title: "Condição exclusiva",
      description: "Tenha acesso aos planos do TorxOS por valores especiais garantidos durante os primeiros 6 meses.",
    },
    {
      icon: Lightbulb,
      title: "Participação na evolução",
      description: "Envie sugestões e feedbacks diretos sobre funcionalidades, fluxos de trabalho e prioridades.",
    },
    {
      icon: Compass,
      title: "Onboarding guiado",
      description: "Receba orientação inicial dedicada para configurar o sistema, importar cadastros e rodar no primeiro dia.",
    },
    {
      icon: MessageSquareShare,
      title: "Canal direto com engenharia",
      description: "Tenha um canal exclusivo de comunicação para relatar dificuldades, tirar dúvidas e pedir auxílio.",
    },
    {
      icon: Award,
      title: "Benefício de continuidade",
      description: "Após o período inicial, fundadores ativos poderão contar com condições comerciais diferenciadas de continuidade.",
    },
  ];

  return (
    <section className="py-20 border-t border-white/[0.08] bg-white/[0.015]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Vantagens do Programa
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            O que você recebe como Fundador?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Benefícios estruturados para quem apoia o projeto desde o primeiro dia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((item, index) => {
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
                    <h3 className="text-base font-bold text-white -tracking-[0.02em]">
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
