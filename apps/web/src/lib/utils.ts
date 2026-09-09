import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const numeric = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numeric || 0);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// ---------------------------------------------------------------------------
// Traduções Oficiais do Ecossistema TorxOS para Português do Brasil (PT-BR)
// ---------------------------------------------------------------------------

export function translateOsStatus(status: string | null | undefined): string {
  if (!status) return "Triagem";
  const map: Record<string, string> = {
    TRIAGE: "Triagem",
    ANALYSIS: "Em Análise",
    AWAITING_APPROVAL: "Aguard. Aprovação",
    APPROVED: "Aprovado",
    IN_MAINTENANCE: "Em Bancada",
    AWAITING_PARTS: "Aguard. Peças",
    QUALITY_CHECK: "Controle de Qualidade",
    READY_FOR_PICKUP: "Pronto p/ Retirada",
    DELIVERED: "Finalizado / Entregue",
    CANCELED: "Cancelado",
  };
  return map[status] || status;
}

export function translatePriority(priority: string | null | undefined): string {
  if (!priority) return "Normal";
  const map: Record<string, string> = {
    LOW: "Baixa",
    NORMAL: "Normal",
    HIGH: "Alta",
    URGENT: "Urgente",
  };
  return map[priority] || priority;
}

export function translateStockRisk(risk: string | null | undefined): string {
  if (!risk) return "Normal";
  const map: Record<string, string> = {
    CRITICAL: "Risco Crítico",
    WARNING: "Atenção",
    HEALTHY: "Normal",
  };
  return map[risk] || risk;
}

export function translatePaymentMethod(method: string | null | undefined): string {
  if (!method) return "PIX";
  const map: Record<string, string> = {
    PIX: "PIX",
    CREDIT_CARD: "Cartão de Crédito",
    DEBIT_CARD: "Cartão de Débito",
    CASH: "Dinheiro em Espécie",
    BOLETO: "Boleto Bancário",
    BANK_TRANSFER: "Transferência / TED",
  };
  return map[method] || method;
}

export function translateTransactionStatus(status: string | null | undefined): string {
  if (!status) return "Pendente";
  const map: Record<string, string> = {
    PENDING: "Pendente",
    SETTLED: "Quitado",
    PARTIALLY_SETTLED: "Parcialmente Quitado",
    CANCELLED: "Cancelado",
  };
  return map[status] || status;
}

export function translateTransactionType(type: string | null | undefined): string {
  if (!type) return "-";
  const map: Record<string, string> = {
    RECEIVABLE: "A Receber",
    PAYABLE: "A Pagar",
  };
  return map[type] || type;
}
