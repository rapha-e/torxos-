"use client";

import React from "react";
import { Lock, Sparkles, Zap, CheckCircle2, ArrowRight, X, ShieldAlert } from "lucide-react";
import { FEATURE_INFO, FeatureKey, PLAN_CONFIG } from "@/lib/plan-rules";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: FeatureKey;
  customTitle?: string;
  customDescription?: string;
  requiredPlan?: "PRO" | "ENTERPRISE";
}

export function UpgradeModal({
  isOpen,
  onClose,
  feature,
  customTitle,
  customDescription,
  requiredPlan = "PRO",
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const featureData = feature ? FEATURE_INFO[feature] : null;
  const targetPlanKey = featureData?.minPlan || requiredPlan;
  const targetPlan = PLAN_CONFIG[targetPlanKey];

  const title = customTitle || featureData?.title || `Recurso Exclusivo do Plano ${targetPlan.name}`;
  const description =
    customDescription ||
    featureData?.description ||
    `Desbloqueie todo o potencial da sua assistência técnica com os recursos avançados do plano ${targetPlan.name}.`;

  const highlights =
    targetPlanKey === "PRO"
      ? [
          "AI Mentor com consultoria e geração de copys no WhatsApp",
          "DRE Contábil, ponto de equilíbrio e fluxo de caixa completo",
          "Previsão inteligente de ruptura de estoque",
          "Rastreamento público de OS com QR Code para clientes",
          "Até 5 colaboradores com controle de comissões",
        ]
      : [
          "Todas as funcionalidades do plano Pro inclusas",
          "Gestão multi-filiais integrada com visão da Matriz",
          "Comissões avançadas e regras personalizadas por técnico",
          "Colaboradores e técnicos ilimitados",
          "Suporte prioritário VIP e onboarding individual",
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 text-white">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Topo / Ícone */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
              <Sparkles className="w-3 h-3" />
              Upgrade Necessário
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
          </div>
        </div>

        {/* Descrição */}
        <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
          {description}
        </p>

        {/* Card do Plano Recomendado */}
        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-900/40 border border-amber-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2.5">
            <div>
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                Plano Recomendado
              </span>
              <h4 className="text-lg font-bold text-amber-400">{targetPlan.name}</h4>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-white">
                R$ {targetPlan.priceMonth}
              </span>
              <span className="text-xs text-zinc-400 block">/mês</span>
            </div>
          </div>

          <div className="space-y-2">
            {highlights.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/billing"
            onClick={onClose}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <Zap className="w-4 h-4" />
            Fazer Upgrade Agora
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
