// ============================================================================
// TorxOS — Matriz Central de Recursos & Limites por Plano (Web)
// ============================================================================

export type PlanType = "STARTER" | "PRO" | "ENTERPRISE" | "MASTER";

export interface PlanLimits {
  name: string;
  badgeLabel: string;
  badgeColor: string;
  priceMonth: number;
  maxUsers: number;
  canUseAiMentor: boolean;
  canUseDRE: boolean;
  canUseStockPrediction: boolean;
  canUsePublicQrTracking: boolean;
  canUseAdvancedCommissions: boolean;
  canUseMultiBranches: boolean;
}

export type FeatureKey = keyof Omit<PlanLimits, "name" | "badgeLabel" | "badgeColor" | "priceMonth" | "maxUsers">;

export const FEATURE_INFO: Record<
  FeatureKey,
  { title: string; minPlan: "PRO" | "ENTERPRISE"; description: string }
> = {
  canUseAiMentor: {
    title: "AI Mentor & Copiloto Inteligente",
    minPlan: "PRO",
    description: "Insights diários gerados por IA, copywriting automático de orçamentos para WhatsApp e consultoria em tempo real.",
  },
  canUseDRE: {
    title: "DRE Contábil & Fluxo de Caixa Avançado",
    minPlan: "PRO",
    description: "Demonstrativo de Resultados do Exercício, ponto de equilíbrio e análise aprofundada de margens.",
  },
  canUseStockPrediction: {
    title: "Previsão de Estoque & Alerta de Ruptura",
    minPlan: "PRO",
    description: "Algoritmo preditivo de consumo e reposição de peças para evitar perda de faturamento.",
  },
  canUsePublicQrTracking: {
    title: "Rastreamento Público de OS via QR Code",
    minPlan: "PRO",
    description: "Seu cliente consulta o status da ordem de serviço em tempo real escaneando a etiqueta com QR Code.",
  },
  canUseAdvancedCommissions: {
    title: "Comissões Avançadas & Regras Personalizadas",
    minPlan: "ENTERPRISE",
    description: "Regras flexíveis de comissionamento por técnico, metas escalonadas e cálculo automático detalhado.",
  },
  canUseMultiBranches: {
    title: "Gestão Multi-Filiais & Matriz",
    minPlan: "ENTERPRISE",
    description: "Gerencie múltiplas unidades, troque de filial em 1 clique e consolide os relatórios do grupo.",
  },
};

export const PLAN_CONFIG: Record<PlanType, PlanLimits> = {
  STARTER: {
    name: "Starter",
    badgeLabel: "Plano Starter",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
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
    badgeLabel: "Plano Pro",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
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
    badgeLabel: "Plano Enterprise",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    priceMonth: 347,
    maxUsers: 999999,
    canUseAiMentor: true,
    canUseDRE: true,
    canUseStockPrediction: true,
    canUsePublicQrTracking: true,
    canUseAdvancedCommissions: true,
    canUseMultiBranches: true,
  },
  MASTER: {
    name: "Master / Super Admin",
    badgeLabel: "Acesso Total Master",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
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

export function normalizePlanType(plan?: string | null): PlanType {
  if (!plan) return "PRO";
  const upper = plan.toUpperCase();
  if (upper in PLAN_CONFIG) {
    return upper as PlanType;
  }
  return "PRO";
}

export function isPlanFeatureAllowed(
  plan: string | undefined | null,
  feature: FeatureKey
): boolean {
  const normPlan = normalizePlanType(plan);
  return !!PLAN_CONFIG[normPlan]?.[feature];
}

export function getPlanMaxUsers(plan: string | undefined | null): number {
  const normPlan = normalizePlanType(plan);
  return PLAN_CONFIG[normPlan]?.maxUsers ?? 2;
}

export function getPlanDetails(plan: string | undefined | null): PlanLimits {
  const normPlan = normalizePlanType(plan);
  return PLAN_CONFIG[normPlan] || PLAN_CONFIG.STARTER;
}
