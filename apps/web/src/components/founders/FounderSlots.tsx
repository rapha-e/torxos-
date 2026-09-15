"use client";

import React from "react";

interface FounderSlotsProps {
  totalSlots?: number;
  availableSlots?: number;
  className?: string;
}

export function FounderSlots({
  totalSlots = 10,
  availableSlots = 10,
  className = "",
}: FounderSlotsProps) {
  const occupiedSlots = Math.max(0, totalSlots - availableSlots);

  return (
    <div className={`inline-flex flex-col sm:flex-row items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
          Vagas do Programa:
        </span>
        <div className="flex items-center gap-1.5" aria-label={`${availableSlots} de ${totalSlots} vagas disponíveis`}>
          {Array.from({ length: totalSlots }).map((_, index) => {
            const isFilled = index < occupiedSlots;
            return (
              <span
                key={index}
                title={isFilled ? "Vaga preenchida" : "Vaga aberta"}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isFilled
                    ? "bg-zinc-600 border border-zinc-500"
                    : "bg-[#E2A336] shadow-[0_0_8px_rgba(226,163,54,0.6)] border border-[#EBB048]"
                }`}
              />
            );
          })}
        </div>
      </div>
      <div className="h-3 w-px bg-white/10 hidden sm:block" />
      <div className="text-xs text-zinc-300">
        <strong className="text-white font-mono">{availableSlots}</strong> de{" "}
        <span className="font-mono text-zinc-400">{totalSlots}</span> assistências disponíveis
      </div>
    </div>
  );
}
