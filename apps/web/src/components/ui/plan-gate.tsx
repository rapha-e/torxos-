"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/api";
import { isPlanFeatureAllowed, FeatureKey, FEATURE_INFO, PLAN_CONFIG, PlanType } from "@/lib/plan-rules";
import { UpgradeModal } from "./upgrade-modal";
import { Lock, Sparkles, Zap, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface PlanGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  userPlan?: string;
}

export function PlanGate({ feature, children, fallback, userPlan }: PlanGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("PRO");
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.role === "SUPER_ADMIN") {
      setHasAccess(true);
      return;
    }

    const plan = userPlan || user?.tenantPlan || "PRO";
    setCurrentPlan(plan);
    const allowed = isPlanFeatureAllowed(plan, feature);
    setHasAccess(allowed);
  }, [feature, userPlan]);

  // Enquanto avalia o acesso
  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Acesso liberado
  if (hasAccess) {
    return <>{children}</>;
  }

  // Fallback customizado se fornecido
  if (fallback) {
    return <>{fallback}</>;
  }

  // Fallback padrão com visual de bloqueio de recurso
  const featureInfo = FEATURE_INFO[feature];
  const targetPlan = PLAN_CONFIG[featureInfo.minPlan];

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto animate-fadeIn">
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8 md:p-12 shadow-2xl text-center">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-inner shadow-amber-500/20">
            <Lock className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Recurso Exclusivo Plano {targetPlan.name}
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
            {featureInfo.title}
          </h2>

          <p className="text-zinc-300 text-sm md:text-base max-w-xl mb-8 leading-relaxed">
            {featureInfo.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Zap className="w-4 h-4" />
              Conhecer o Plano {targetPlan.name}
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/billing"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-sm border border-zinc-700 transition-colors"
            >
              Gerenciar Assinatura
            </Link>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
      />
    </div>
  );
}
