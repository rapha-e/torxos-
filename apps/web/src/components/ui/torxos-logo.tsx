import React from "react";

interface TorxLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: "dark" | "light" | "gold";
}

/**
 * Componente oficial de Logomarca TorxOS
 * Estilizado com a geometria de 6 pontas da chave Torx e o monograma "T"
 */
export function TorxLogo({
  className = "",
  size = 28,
  showText = false,
  variant = "gold",
}: TorxLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Símbolo Torx Star + Monograma T com microborda de precisão */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-[#141417] border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden shrink-0 group"
        style={{ width: size, height: size }}
      >
        {/* Glow sutil interno */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-white/10 pointer-events-none" />

        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1 text-[#E2A336]"
        >
          {/* Estrela de Torx de 6 lobos de precisão geométrica */}
          <path
            d="M24 5L28.2 14.8L38.8 15.5L33.2 24.5L37.8 34.2L27.2 33.8L24 43L20.8 33.8L10.2 34.2L14.8 24.5L9.2 15.5L19.8 14.8L24 5Z"
            fill="url(#torxGrad)"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Monograma "T" chanfrado central */}
          <path
            d="M17 18H31V22H26.5V32H21.5V22H17V18Z"
            fill="#121214"
            stroke="#FDE68A"
            strokeWidth="0.8"
          />
          <defs>
            <linearGradient id="torxGrad" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" />
              <stop offset="0.5" stopColor="#E2A336" />
              <stop offset="1" stopColor="#B45309" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex items-baseline tracking-tight">
          <span className="font-extrabold text-white text-base -tracking-[0.03em] font-sans">
            Torx<span className="text-[#E2A336]">OS</span>
          </span>
        </div>
      )}
    </div>
  );
}
