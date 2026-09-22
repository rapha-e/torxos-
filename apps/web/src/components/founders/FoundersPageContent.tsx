"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, ShieldCheck, ArrowRight } from "lucide-react";
import { TorxLogo } from "@/components/ui/torxos-logo";
import { FounderHero } from "./FounderHero";
import { FounderProblem } from "./FounderProblem";
import { FounderSolution } from "./FounderSolution";
import { FounderJourney } from "./FounderJourney";
import { FounderProgram } from "./FounderProgram";
import { FounderBenefits } from "./FounderBenefits";
import { FounderCommitment } from "./FounderCommitment";
import { FounderPricing } from "./FounderPricing";
import { FounderSavings } from "./FounderSavings";
import { FounderWhyTen } from "./FounderWhyTen";
import { FounderHowItWorks } from "./FounderHowItWorks";
import { FounderAudience } from "./FounderAudience";
import { FounderFaq } from "./FounderFaq";
import { FounderFinalCta } from "./FounderFinalCta";
import { FounderLeadForm } from "./FounderLeadForm";
import { FounderStickyCta } from "./FounderStickyCta";
import { trackFounderEvent } from "./FounderTracking";

export function FoundersPageContent() {
  const [selectedPlan, setSelectedPlan] = useState("PRO");
  const [availableSlots, setAvailableSlots] = useState(10);
  const [isSlotsFull, setIsSlotsFull] = useState(false);

  useEffect(() => {
    trackFounderEvent("founder_page_view");

    // Consulta status real de vagas na API
    async function loadSlots() {
      try {
        const res = await fetch("/web-api/founders");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.availableSlots === "number") {
            setAvailableSlots(data.availableSlots);
            setIsSlotsFull(data.isFull || data.availableSlots <= 0);
          }
        }
      } catch (e) {
        console.warn("Aviso ao carregar vagas:", e);
      }
    }
    loadSlots();
  }, []);

  const scrollToForm = () => {
    const el = document.getElementById("candidatura");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSelectPlan = (plan: string) => {
    setSelectedPlan(plan);
    scrollToForm();
  };

  return (
    <div className="min-h-screen bg-[#0C0C0E] text-[#EDEDED] font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Banner Exclusivo */}
      <div className="bg-[#141418] border-b border-white/[0.08] text-zinc-300 py-2 px-4 text-center text-xs font-medium flex items-center justify-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-[#E2A336]/15 border border-[#E2A336]/30 text-[10px] font-mono text-[#E2A336] font-bold uppercase tracking-wider">
          Fase Exclusiva
        </span>
        <span className="text-zinc-300 text-xs">
          Apenas 10 assistências técnicas serão selecionadas para o Programa Fundador.
        </span>
        <button
          onClick={scrollToForm}
          className="text-white hover:text-amber-300 underline underline-offset-4 ml-1 cursor-pointer font-semibold hidden sm:inline-flex items-center gap-1 transition"
        >
          <span>Garantir inscrição</span>
          <ArrowRight className="w-3 h-3 text-zinc-400" />
        </button>
      </div>

      {/* Header Fixo Minimalista */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0C0C0E]/90 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TorxLogo size={32} />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
                Torx<span className="text-[#E2A336]">OS</span>
              </span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#E2A336] bg-[#E2A336]/10 px-2 py-0.5 rounded border border-[#E2A336]/25">
                Fundador
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link
              href="/lp"
              className="text-zinc-400 hover:text-white hidden sm:flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver Produto Completo</span>
            </Link>
            <Link
              href="/login"
              className="text-zinc-400 hover:text-white px-3 py-1.5 transition"
            >
              Entrar
            </Link>
            <button
              onClick={scrollToForm}
              className="px-3.5 py-2 rounded-xl bg-[#E2A336] hover:bg-[#EBB048] text-[#14120E] font-bold text-xs tracking-tight shadow-sm transition active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              <span>Quero Ser Fundador</span>
            </button>
          </div>
        </div>
      </header>

      {/* 1. SEÇÃO 01 — HERO */}
      <FounderHero onCtaClick={scrollToForm} availableSlots={availableSlots} />

      {/* 2. SEÇÃO 02 — PROBLEMA */}
      <FounderProblem />

      {/* 3. SEÇÃO 03 — SOLUÇÃO */}
      <FounderSolution onCtaClick={scrollToForm} />

      {/* 4. SEÇÃO 04 — DIFERENCIAL */}
      <FounderJourney />

      {/* 5. SEÇÃO 05 — PROGRAMA FUNDADOR */}
      <FounderProgram />

      {/* 6. SEÇÃO 06 — BENEFÍCIOS DO FUNDADOR */}
      <FounderBenefits />

      {/* 7. SEÇÃO 07 — CONTRAPARTIDA */}
      <FounderCommitment />

      {/* 8. SEÇÃO 08 — PLANOS */}
      <FounderPricing onSelectPlan={handleSelectPlan} />

      {/* 9. SEÇÃO 09 — ECONOMIA */}
      <FounderSavings />

      {/* 10. SEÇÃO 10 — POR QUE APENAS 10? */}
      <FounderWhyTen />

      {/* 11. SEÇÃO 11 — COMO FUNCIONA */}
      <FounderHowItWorks />

      {/* 12 e 13. SEÇÕES 12 e 13 — PARA QUEM É / PARA QUEM NÃO É */}
      <FounderAudience />

      {/* 14. SEÇÃO 14 — FAQ */}
      <FounderFaq />

      {/* 15. SEÇÃO 15 — CTA FINAL */}
      <FounderFinalCta onCtaClick={scrollToForm} />

      {/* FORMULÁRIO DE CONVERSÃO & PÓS-ENVIO */}
      <FounderLeadForm selectedPlan={selectedPlan} isSlotsFull={isSlotsFull} />

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/10 text-xs text-zinc-500 bg-[#08080A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TorxLogo size={22} />
            <span className="font-bold text-zinc-300">Torx<span className="text-[#E2A336]">OS</span></span>
            <span>• Programa Fundador © {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/lp" className="hover:text-zinc-300 transition">
              Visão Geral do Produto
            </Link>
            <Link href="/login" className="hover:text-zinc-300 transition">
              Acesso ao Sistema
            </Link>
            <a
              href="https://wa.me/5561992295814?text=Olá! Gostaria de mais detalhes sobre o Programa Fundador TorxOS."
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp Direto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
