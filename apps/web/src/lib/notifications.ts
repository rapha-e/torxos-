// ============================================================================
// TorxOS — Central de Notificações & Atualizações do Sistema (Changelog & Broadcast)
// ============================================================================

import { fetchApi } from "./api";

export interface SystemUpdateItem {
  id: string;
  version: string;
  date: string;
  category: "FEATURE" | "IMPROVEMENT" | "SECURITY" | "ALERT";
  title: string;
  summary: string;
  highlights: string[];
  isImportant?: boolean;
}

export interface BroadcastAnnouncement {
  id: string;
  author: string;
  date: string;
  title: string;
  message: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
}

export const OFFICIAL_SYSTEM_UPDATES: SystemUpdateItem[] = [
  {
    id: "update-2026-10-03-bancada",
    version: "v2.5.0",
    date: "03/10/2026",
    category: "FEATURE",
    isImportant: true,
    title: "Edição de OS na Bancada & Ajuste Dinâmico de Valores",
    summary: "Agora sua equipe pode ajustar itens, mão de obra e valores diretamente durante a execução do serviço na bancada.",
    highlights: [
      "Edição rápida de peças e serviços orçados direto no card do Kanban ou na listagem de OS.",
      "Cálculo automático de subtotais de mão de obra, peças e desconto global.",
      "Integração direta com o catálogo do almoxarifado para inserir peças cadastradas em 1 clique.",
    ],
  },
  {
    id: "update-2026-10-03-estoque-seguro",
    version: "v2.5.0",
    date: "03/10/2026",
    category: "SECURITY",
    isImportant: true,
    title: "Blindagem de Estoque & Retorno Automático para Aprovação",
    summary: "Ao revisar um orçamento de bancada, a OS pode retornar para aprovação do cliente com estorno seguro de peças.",
    highlights: [
      "Estorno imediato das peças para o estoque disponível se a OS voltar para 'Aguardando Aprovação'.",
      "Proteção total contra saldo preso caso o cliente recuse o novo valor do orçamento.",
      "Opção de manter na bancada caso o cliente já tenha autorizado verbalmente.",
    ],
  },
  {
    id: "update-2026-10-03-whatsapp-alert",
    version: "v2.5.0",
    date: "03/10/2026",
    category: "IMPROVEMENT",
    title: "Alerta Instantâneo de Revisão de Orçamento via WhatsApp",
    summary: "Dispare notificações com o novo valor e laudo técnico para o cliente aprovar online no portal público.",
    highlights: [
      "Novo modelo exclusivo de mensagem de 'Revisão de OS' no disparador de WhatsApp.",
      "Abertura automática do modal de envio logo após salvar a edição da OS.",
      "Banner visual no portal do cliente destacando que o orçamento foi revisado.",
    ],
  },
  {
    id: "update-2026-09-28-fluxo-caixa",
    version: "v2.4.0",
    date: "28/09/2026",
    category: "IMPROVEMENT",
    title: "Fluxo de Caixa 30-60-90 Dias & Gestão Financeira DRE",
    summary: "Projeções financeiras inteligentes com filtros de competência, liquidação e conciliação bancária.",
    highlights: [
      "Visão trimestral antecipada de recebíveis de OSs e vendas balcão.",
      "Filtros de período rápido (Hoje, 7 Dias, Mês Atual e Customizado).",
    ],
  },
  {
    id: "update-2026-09-15-pdv-fiscal",
    version: "v2.3.0",
    date: "15/09/2026",
    category: "FEATURE",
    title: "TorxOS Sales & PDV Balcão de Alta Velocidade",
    summary: "Frente de caixa ágil para vendas de acessórios com baixa instantânea de estoque e pagamento PIX.",
    highlights: [
      "Vendas rápidas com leitor de código de barras ou busca por nome.",
      "Comprovante de venda e etiqueta térmica formatada para impressoras 58mm/80mm.",
    ],
  },
];

const READ_STORAGE_KEY = "torxos_read_system_updates";
const BROADCAST_STORAGE_KEY = "torxos_broadcast_announcements";

export function getReadUpdatesIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markUpdatesAsRead(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const current = getReadUpdatesIds();
    const updated = Array.from(new Set([...current, ...ids]));
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getBroadcastAnnouncements(): BroadcastAnnouncement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BROADCAST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchRemoteAnnouncements(): Promise<BroadcastAnnouncement[]> {
  try {
    const data = await fetchApi("/tenant/announcements");
    if (Array.isArray(data)) {
      if (typeof window !== "undefined") {
        localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {}
  return getBroadcastAnnouncements();
}

export async function createBroadcastAnnouncement(announcement: {
  title: string;
  message: string;
  category?: string;
  priority?: "NORMAL" | "HIGH" | "URGENT";
  actionUrl?: string;
  actionLabel?: string;
}): Promise<BroadcastAnnouncement> {
  try {
    const res = await fetchApi("/tenant/super-admin/announcements", {
      method: "POST",
      body: JSON.stringify(announcement),
    });
    if (res?.announcement) {
      const current = getBroadcastAnnouncements();
      const updated = [res.announcement, ...current.filter((b) => b.id !== res.announcement.id)];
      if (typeof window !== "undefined") {
        localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(updated));
      }
      return res.announcement;
    }
  } catch (err) {}

  // Fallback local se a API estiver offline
  const newAnnounce: BroadcastAnnouncement = {
    ...announcement,
    author: "Equipe TorxOS",
    priority: announcement.priority || "NORMAL",
    id: `announce-${Date.now()}`,
    date: new Date().toLocaleDateString("pt-BR"),
  };
  if (typeof window !== "undefined") {
    try {
      const current = getBroadcastAnnouncements();
      localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify([newAnnounce, ...current]));
    } catch {}
  }
  return newAnnounce;
}

export async function deleteBroadcastAnnouncement(id: string): Promise<boolean> {
  try {
    await fetchApi(`/tenant/super-admin/announcements/${id}`, {
      method: "DELETE",
    });
  } catch (err) {}

  if (typeof window !== "undefined") {
    try {
      const current = getBroadcastAnnouncements();
      localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(current.filter((b) => b.id !== id)));
    } catch {}
  }
  return true;
}

export function saveBroadcastAnnouncement(announcement: Omit<BroadcastAnnouncement, "id" | "date">): BroadcastAnnouncement {
  const newAnnounce: BroadcastAnnouncement = {
    ...announcement,
    id: `announce-${Date.now()}`,
    date: new Date().toLocaleDateString("pt-BR"),
  };
  if (typeof window !== "undefined") {
    try {
      const current = getBroadcastAnnouncements();
      localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify([newAnnounce, ...current]));
    } catch {}
  }
  return newAnnounce;
}

export function getUnreadUpdatesCount(): number {
  const readIds = new Set(getReadUpdatesIds());
  const officialUnread = OFFICIAL_SYSTEM_UPDATES.filter((u) => !readIds.has(u.id)).length;
  const broadcastUnread = getBroadcastAnnouncements().filter((b) => !readIds.has(b.id)).length;
  return officialUnread + broadcastUnread;
}

