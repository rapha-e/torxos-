// ============================================================================
// TorxOS — Matriz Central de Recursos & Limites por Plano (Entitlements)
// ============================================================================

export type PlanType = "STARTER" | "PRO" | "ENTERPRISE" | "MASTER";

export interface PlanLimits {
  name: string;
  priceMonth: number;
  maxUsers: number;
  canUseAiMentor: boolean;
  canUseDRE: boolean;
  canUseStockPrediction: boolean;
  canUsePublicQrTracking: boolean;
  canUseAdvancedCommissions: boolean;
  canUseMultiBranches: boolean;
}

export const PLAN_CONFIG: Record<PlanType, PlanLimits> = {
  STARTER: {
    name: "Starter",
    priceMonth: 97,
    maxUsers: 2,
    canUseAiMentor: false,
    canUseDRE: false,
    canUseStockPrediction: false,
    canUsePublicQrTracking: false,
    canUseAdvancedCommissions: false,
    canUseMultiBranches: false,
  },
  PRO: {
    name: "Pro",
    priceMonth: 197,
    maxUsers: 5,
    canUseAiMentor: true,
    canUseDRE: true,
    canUseStockPrediction: true,
    canUsePublicQrTracking: true,
    canUseAdvancedCommissions: false,
    canUseMultiBranches: false,
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceMonth: 347,
    maxUsers: 999999, // Usuários ilimitados
    canUseAiMentor: true,
    canUseDRE: true,
    canUseStockPrediction: true,
    canUsePublicQrTracking: true,
    canUseAdvancedCommissions: true,
    canUseMultiBranches: true,
  },
  MASTER: {
    name: "Master / Super Admin",
    priceMonth: 0,
    maxUsers: 999999,
    canUseAiMentor: true,
    canUseDRE: true,
    canUseStockPrediction: true,
    canUsePublicQrTracking: true,
    canUseAdvancedCommissions: true,
    canUseMultiBranches: true,
  },
};

/**
 * Normaliza a string do plano (ex: "starter", "Starter", etc.) para o enum PlanType
 */
export function normalizePlanType(plan?: string | null): PlanType {
  if (!plan) return "PRO"; // Fallback para PRO durante onboarding / demo
  const upper = plan.toUpperCase();
  if (upper in PLAN_CONFIG) {
    return upper as PlanType;
  }
  return "PRO";
}

/**
 * Verifica se um plano específico possui a feature solicitada
 */
export function isPlanFeatureAllowed(
  plan: string | undefined | null,
  feature: keyof Omit<PlanLimits, "name" | "priceMonth" | "maxUsers">
): boolean {
  const normPlan = normalizePlanType(plan);
  return !!PLAN_CONFIG[normPlan]?.[feature];
}

/**
 * Retorna o limite de usuários para o plano
 */
export function getPlanMaxUsers(plan: string | undefined | null): number {
  const normPlan = normalizePlanType(plan);
  return PLAN_CONFIG[normPlan]?.maxUsers ?? 2;
}
