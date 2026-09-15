"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { trackFounderEvent } from "./FounderTracking";

interface FounderStickyCtaProps {
  onCtaClick: () => void;
  availableSlots?: number;
}

export function FounderStickyCta({
  onCtaClick,
  availableSlots = 10,
}: FounderStickyCtaProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Mostra o CTA fixo após rolar 350px e esconde perto do final do formulário
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;

      if (scrollY > 350 && scrollY + windowHeight < docHeight - 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  const handleClick = () => {
    trackFounderEvent("founder_cta_click", { location: "sticky_mobile" });
    onCtaClick();
  };

  return (
    <aside aria-label="Acesso rápido ao Programa Fundador" className="fixed bottom-3 inset-x-3 z-40 sm:hidden">
      <div className="p-2.5 rounded-2xl bg-[#121215]/95 backdrop-blur-md border border-white/[0.12] shadow-[0_12px_36px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3">
        <div className="pl-1">
          <div className="text-[10px] font-mono text-[#E2A336] uppercase font-bold tracking-wider">
            {availableSlots} vagas restantes
          </div>
          <div className="text-xs font-bold text-white leading-tight">
            Programa Fundador
          </div>
        </div>

        <button
          onClick={handleClick}
          className="px-4 py-2.5 rounded-xl bg-[#E2A336] hover:bg-[#EBB048] text-[#14120E] font-bold text-xs shadow-md transition active:scale-[0.98] flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>QUERO SER FUNDADOR</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#14120E]" />
        </button>
      </div>
    </aside>
  );
}
