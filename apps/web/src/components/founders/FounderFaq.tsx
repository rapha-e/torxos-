"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FounderFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "O que é o Programa Fundador?",
      a: "É um programa criado para as primeiras 10 assistências técnicas que desejam utilizar o TorxOS e participar diretamente da evolução inicial do produto.",
    },
    {
      q: "Quantas empresas poderão participar?",
      a: "Apenas 10 assistências técnicas selecionadas para acompanhamento próximo.",
    },
    {
      q: "Quanto custa?",
      a: "Os planos começam em R$ 39,90/mês (Starter). O plano PRO custa R$ 59,90/mês durante os primeiros 6 meses.",
    },
    {
      q: "O preço é para sempre?",
      a: "Não. A condição apresentada é referente ao período inicial do Programa Fundador (6 meses). Após esse período, será aplicada a condição de continuidade definida para os fundadores ou o preço vigente do plano, conforme as condições de adesão.",
    },
    {
      q: "Preciso dar feedback?",
      a: "Sim. Essa é uma das características centrais do Programa Fundador: co-construir o sistema com quem vive a bancada todos os dias.",
    },
    {
      q: "Preciso autorizar um depoimento?",
      a: "Não. Depoimentos e estudos de caso somente serão realizados mediante sua autorização prévia.",
    },
    {
      q: "Posso cancelar?",
      a: "Sim, conforme os termos de contratação do TorxOS, sem pegadinhas ou taxas abusivas.",
    },
    {
      q: "Preciso assinar contrato de longo prazo?",
      a: "As condições de contratação deverão ser apresentadas claramente antes da adesão.",
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 border-t border-white/[0.08] bg-white/[0.015]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Dúvidas Frequentes
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            Perguntas Frequentes
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-normal">
            Transparência total sobre as regras e funcionamento do programa.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl p-px bg-gradient-to-b from-white/10 via-white/[0.03] to-white/[0.01] overflow-hidden transition"
              >
                <div className="rounded-[11px] bg-[#121215]">
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-white hover:text-zinc-200 transition cursor-pointer"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/[0.04] pt-3 font-normal">
                      {faq.a}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
