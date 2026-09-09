"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Share2,
  Plus,
  ArrowRight,
  Filter,
  Sparkles,
  Smartphone,
  Copy,
  Check,
  Printer,
  GripVertical,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  SlidersHorizontal,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { formatCurrency, formatDate, translatePriority } from "@/lib/utils";
import { WhatsAppNotificationModal } from "@/components/ui/whatsapp-modal";

const KANBAN_COLUMNS = [
  { id: "TRIAGE", label: "Triagem", dot: "bg-[#71716C]", badge: "bg-[#F3F3EF] text-[#71716C] border-[rgba(28,25,23,0.08)]", group: "INTAKE" },
  { id: "ANALYSIS", label: "Em Análise", dot: "bg-blue-600", badge: "bg-blue-50 text-blue-800 border-blue-200", group: "INTAKE" },
  { id: "AWAITING_APPROVAL", label: "Aguard. Aprovação", dot: "bg-amber-600", badge: "bg-[#FEF3C7] text-amber-800 border-[#FDE68A]", group: "INTAKE" },
  { id: "APPROVED", label: "Aprovado", dot: "bg-emerald-600", badge: "bg-[#DCFCE7] text-emerald-800 border-[#BBF7D0]", group: "WORKBENCH" },
  { id: "IN_MAINTENANCE", label: "Em Bancada", dot: "bg-indigo-600", badge: "bg-indigo-50 text-indigo-800 border-indigo-200", group: "WORKBENCH" },
  { id: "QUALITY_CHECK", label: "Controle Qualidade", dot: "bg-purple-600", badge: "bg-purple-50 text-purple-800 border-purple-200", group: "WORKBENCH" },
  { id: "READY_FOR_PICKUP", label: "Pronto p/ Retirada", dot: "bg-teal-600", badge: "bg-teal-50 text-teal-800 border-teal-200", group: "DISPATCH" },
  { id: "DELIVERED", label: "Finalizado / Entregue", dot: "bg-[#181816]", badge: "bg-[#181816] text-white border-[#181816]", group: "DISPATCH" },
];

const STATUS_ORDER = [
  "TRIAGE",
  "ANALYSIS",
  "AWAITING_APPROVAL",
  "APPROVED",
  "IN_MAINTENANCE",
  "QUALITY_CHECK",
  "READY_FOR_PICKUP",
  "DELIVERED",
];

type ViewFilterType = "ALL" | "WORKBENCH" | "INTAKE" | "DISPATCH";

export default function KanbanPage() {
  const router = useRouter();
  const [columns, setColumns] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [draggedOrder, setDraggedOrder] = useState<{ id: string; fromStatus: string } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilterType>("ALL");
  const [searchFilter, setSearchFilter] = useState("");
  const [whatsAppOs, setWhatsAppOs] = useState<any | null>(null);
  const [whatsAppTemplate, setWhatsAppTemplate] = useState<"QUOTE" | "READY" | "ENTRY">("QUOTE");
  const [stockErrorModal, setStockErrorModal] = useState<{
    isOpen: boolean;
    osNumber: number | string;
    deviceModel: string;
    errorMessage: string;
    orderId?: string;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadKanban = async () => {
    try {
      setLoading(true);
      const data = await fetchApi("/service-orders/kanban");
      const baseColumns: Record<string, any[]> = {
        TRIAGE: [],
        ANALYSIS: [],
        AWAITING_APPROVAL: [],
        APPROVED: [],
        IN_MAINTENANCE: [],
        QUALITY_CHECK: [],
        READY_FOR_PICKUP: [],
        DELIVERED: [],
        CANCELED: [],
        ...(data || {}),
      };

      // Se houver ordens em AWAITING_PARTS, transfere automaticamente para APPROVED
      if (baseColumns.AWAITING_PARTS && Array.isArray(baseColumns.AWAITING_PARTS)) {
        baseColumns.APPROVED = [
          ...(baseColumns.APPROVED || []),
          ...baseColumns.AWAITING_PARTS.map((o: any) => ({ ...o, status: "APPROVED" })),
        ];
        delete baseColumns.AWAITING_PARTS;
      }



      // Sanitização estrita: OSs que ainda NÃO entraram em bancada (TRIAGE, ANALYSIS, AWAITING_APPROVAL, APPROVED)
      // JAMAIS devem ter stockDeducted = true
      Object.keys(baseColumns).forEach((statusKey) => {
        if (!["IN_MAINTENANCE", "QUALITY_CHECK", "READY_FOR_PICKUP", "DELIVERED"].includes(statusKey)) {
          baseColumns[statusKey] = baseColumns[statusKey].map((order: any) => ({
            ...order,
            stockDeducted: false,
          }));
        }
      });

      setColumns(baseColumns);
    } catch (err) {
      console.error("Erro ao carregar kanban:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKanban();
  }, []);

  // Atalho de Teclado Global: Pressionar tecla 'N' abre Nova OS imediatamente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        router.push("/os/nova");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCopyPublicLink = (publicToken: string) => {
    const url = `${window.location.origin}/status/${publicToken}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(publicToken);
    showToast("Link do cliente copiado!");
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const moveOrderToStatus = async (orderId: string, fromStatus: string, toStatus: string) => {
    if (fromStatus === toStatus) return;

    let movedOrderTitle = "";

    let movedItemData: any = null;

    setColumns((prev: any) => {
      const sourceList = [...(prev[fromStatus] || [])];
      const targetList = [...(prev[toStatus] || [])];

      const itemIndex = sourceList.findIndex((item: any) => item.id === orderId);
      if (itemIndex === -1) return prev;

      const [item] = sourceList.splice(itemIndex, 1);
      
      // Regra Antifalha Bancada: Se transicionar para IN_MAINTENANCE, marca baixa única.
      // Se for CANCELED, desmarca baixa. Em outras colunas de bancada, preserva o status existente.
      let nextStockDeducted = item.stockDeducted;
      if (toStatus === "IN_MAINTENANCE") {
        nextStockDeducted = true;
      } else if (toStatus === "CANCELED") {
        nextStockDeducted = false;
      }

      const updatedItem = {
        ...item,
        status: toStatus,
        stockDeducted: toStatus === "CANCELED" ? false : item.stockDeducted,
        stockError: null,
      };
      movedOrderTitle = `OS #${item.osNumber}`;
      movedItemData = updatedItem;
      targetList.unshift(updatedItem);

      const newState = {
        ...prev,
        [fromStatus]: sourceList,
        [toStatus]: targetList,
      };

      if (typeof window !== "undefined") {
        const stateJson = JSON.stringify(newState);
        localStorage.setItem("torxos_kanban_state", stateJson);
        localStorage.setItem("evorix_kanban_state", stateJson);

        // Atualiza a ordem de serviço em torxos_service_orders para sincronização consistente
        const savedOrders = localStorage.getItem("torxos_service_orders") || localStorage.getItem("evorix_service_orders");
        if (savedOrders) {
          try {
            const parsed = JSON.parse(savedOrders);
            if (Array.isArray(parsed)) {
              const updated = parsed.map((o: any) =>
                o.id === orderId || o.publicToken === orderId || String(o.osNumber) === orderId
                  ? { ...o, status: toStatus, stockError: null }
                  : o
              );
              const updatedOrdersJson = JSON.stringify(updated);
              localStorage.setItem("torxos_service_orders", updatedOrdersJson);
              localStorage.setItem("evorix_service_orders", updatedOrdersJson);
            }
          } catch (e) {}
        }
      }

      return newState;
    });

    const toLabel = KANBAN_COLUMNS.find((c) => c.id === toStatus)?.label || toStatus;
    showToast(`${movedOrderTitle} movida para ${toLabel}`);

    // Automação: Sugere envio de WhatsApp ao entrar em Orçamento ou Pronto Retirada
    if (toStatus === "AWAITING_APPROVAL" && movedItemData) {
      setWhatsAppTemplate("QUOTE");
      setWhatsAppOs(movedItemData);
    } else if (toStatus === "READY_FOR_PICKUP" && movedItemData) {
      setWhatsAppTemplate("READY");
      setWhatsAppOs(movedItemData);
    }

    try {
      await fetchApi(`/service-orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: toStatus }),
      });

      // Confirmação de baixa física de peças apenas após validação com sucesso pela API
      if (toStatus === "IN_MAINTENANCE") {
        setColumns((prev: any) => {
          const list = [...(prev["IN_MAINTENANCE"] || [])];
          const idx = list.findIndex((o: any) => o.id === orderId);
          if (idx !== -1) {
            list[idx] = { ...list[idx], stockDeducted: true, stockError: null };
          }
          return { ...prev, IN_MAINTENANCE: list };
        });

        if (typeof window !== "undefined") {
          const savedOrders = localStorage.getItem("torxos_service_orders") || localStorage.getItem("evorix_service_orders");
          if (savedOrders) {
            try {
              const parsed = JSON.parse(savedOrders);
              if (Array.isArray(parsed)) {
                const updated = parsed.map((o: any) =>
                  o.id === orderId || o.publicToken === orderId || String(o.osNumber) === orderId
                    ? { ...o, stockDeducted: true, stockError: null }
                    : o
                );
                const updatedOrdersJson = JSON.stringify(updated);
                localStorage.setItem("torxos_service_orders", updatedOrdersJson);
                localStorage.setItem("evorix_service_orders", updatedOrdersJson);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err: any) {
      console.warn("Falha ao movimentar OS:", err.message);
      const errorMsg = err.message || "Estoque insuficiente para as peças desta Ordem de Serviço.";

      // Abre a mini janela no centro da tela para visualização obrigatória pelo operador
      setStockErrorModal({
        isOpen: true,
        osNumber: movedItemData?.osNumber || "N/A",
        deviceModel: `${movedItemData?.deviceBrand || ""} ${movedItemData?.deviceModel || ""}`.trim() || "Aparelho",
        errorMessage: errorMsg,
        orderId,
      });

      // Retorna a OS SEMPRE para o estágio APROVADO com a marcação referente ao erro
      const targetColumn = "APPROVED";

      setColumns((prev: any) => {
        const sourceList = [...(prev[toStatus] || [])];
        const targetList = [...(prev[targetColumn] || [])];
        const itemIndex = sourceList.findIndex((item: any) => item.id === orderId);
        if (itemIndex === -1) return prev;

        const [item] = sourceList.splice(itemIndex, 1);
        const revertedItem = {
          ...item,
          status: targetColumn,
          stockDeducted: false, // JAMAIS fica com peças baixadas se foi recusada!
          stockError: errorMsg,  // Marcação referente ao erro
        };
        targetList.unshift(revertedItem);

        const revertedState = {
          ...prev,
          [toStatus]: sourceList,
          [targetColumn]: targetList,
        };

        if (typeof window !== "undefined") {
          const revertedJson = JSON.stringify(revertedState);
          localStorage.setItem("torxos_kanban_state", revertedJson);
          localStorage.setItem("evorix_kanban_state", revertedJson);
          const savedOrders = localStorage.getItem("torxos_service_orders") || localStorage.getItem("evorix_service_orders");
          if (savedOrders) {
            try {
              const parsed = JSON.parse(savedOrders);
              if (Array.isArray(parsed)) {
                const updated = parsed.map((o: any) =>
                  o.id === orderId || o.publicToken === orderId || String(o.osNumber) === orderId
                    ? { ...o, status: targetColumn, stockDeducted: false, stockError: errorMsg }
                    : o
                );
                const updatedOrdersJson = JSON.stringify(updated);
                localStorage.setItem("torxos_service_orders", updatedOrdersJson);
                localStorage.setItem("evorix_service_orders", updatedOrdersJson);
              }
            } catch (e) {}
          }
        }
        return revertedState;
      });

      // Garante persistência do status APPROVED no backend
      try {
        await fetchApi(`/service-orders/${orderId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: targetColumn }),
        });
      } catch (e) {}
    }
  };

  const handleAdvanceStatus = (orderId: string, currentStatus: string) => {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < STATUS_ORDER.length - 1) {
      const nextStatus = STATUS_ORDER[currentIndex + 1];
      moveOrderToStatus(orderId, currentStatus, nextStatus);
    }
  };

  const handleResetBoard = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("torxos_kanban_state");
      localStorage.removeItem("evorix_kanban_state");
    }
    await loadKanban();
    showToast("Quadro de bancada sincronizado com sucesso.");
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  // Filtragem de Colunas por Foco Operacional
  const visibleColumns = KANBAN_COLUMNS.filter((col) => {
    if (viewFilter === "ALL") return true;
    if (viewFilter === "WORKBENCH") {
      return ["APPROVED", "IN_MAINTENANCE", "QUALITY_CHECK"].includes(col.id);
    }
    if (viewFilter === "INTAKE") {
      return ["TRIAGE", "ANALYSIS", "AWAITING_APPROVAL"].includes(col.id);
    }
    if (viewFilter === "DISPATCH") {
      return ["READY_FOR_PICKUP", "DELIVERED"].includes(col.id);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification Flutuante */}
      {notification && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#181816] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-stone-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Floating Action Button (FAB) Permanente: Botão para Abrir Nova OS Sempre Acessível */}
      <Link
        href="/os/nova"
        title="Abrir Nova Ordem de Serviço (Atalho: Pressione 'N')"
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-[#181816] hover:bg-[#2D2D29] text-white font-semibold text-xs flex items-center gap-2 shadow-2xl border border-stone-800 transition transform hover:scale-105 active:scale-95 group"
      >
        <Plus className="w-4 h-4 text-amber-300 group-hover:rotate-90 transition-transform duration-200" strokeWidth={2} />
        <span>Abrir Nova OS</span>
        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-stone-300">
          N
        </span>
      </Link>

      {/* Header Sticky (Fixado no topo para nunca sumir na rolagem) */}
      <div className="sticky top-16 z-20 bg-[#F9F9F7]/95 backdrop-blur-md pb-3 pt-1 border-b border-[rgba(28,25,23,0.06)] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1C1C1A] tracking-tight">Board Kanban de Bancada</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3F3EF] text-[#71716C] font-semibold border border-[rgba(28,25,23,0.06)]">
                TorxOS OS
              </span>
            </div>
            <p className="text-xs text-[#71716C] mt-0.5">
              Arraste e solte ou clique em <strong>Avançar →</strong> para transicionar os aparelhos em tempo real.
            </p>
          </div>

          {/* Controles de Ação do Topo */}
          <div className="flex items-center gap-2">
            {/* Navegadores de Rolagem Rápida */}
            <div className="flex items-center rounded-xl bg-white border border-[rgba(28,25,23,0.08)] shadow-xs p-0.5">
              <button
                onClick={scrollLeft}
                title="Rolar colunas para a esquerda"
                className="p-1.5 rounded-lg text-[#71716C] hover:text-[#1C1C1A] hover:bg-[#F3F3EF] transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-[rgba(28,25,23,0.08)]" />
              <button
                onClick={scrollRight}
                title="Rolar colunas para a direita"
                className="p-1.5 rounded-lg text-[#71716C] hover:text-[#1C1C1A] hover:bg-[#F3F3EF] transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleResetBoard}
              title="Restaurar posições originais do board"
              className="px-3 py-2 rounded-xl bg-white hover:bg-[#F3F3EF] text-[#71716C] hover:text-[#1C1C1A] font-medium text-xs flex items-center gap-1.5 transition border border-[rgba(28,25,23,0.08)] shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Restaurar</span>
            </button>

            {/* Botão Primário de Nova OS Sempre Visível no Topo */}
            <Link
              href="/os/nova"
              className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" strokeWidth={2} />
              <span>Abrir Nova OS</span>
            </Link>
          </div>
        </div>

        {/* Barra de Filtros Rápidos de Bancada & Busca */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Seletor de Foco de Bancada (Segmented Control) */}
          <div className="inline-flex p-1 rounded-xl bg-[#F3F3EF] border border-[rgba(28,25,23,0.06)] text-xs font-semibold text-[#71716C] self-start">
            <button
              onClick={() => setViewFilter("ALL")}
              className={`px-3 py-1 rounded-lg transition ${
                viewFilter === "ALL"
                  ? "bg-white text-[#1C1C1A] shadow-xs"
                  : "hover:text-[#1C1C1A]"
              }`}
            >
              Todas as Etapas (8)
            </button>
            <button
              onClick={() => setViewFilter("WORKBENCH")}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                viewFilter === "WORKBENCH"
                  ? "bg-[#181816] text-white shadow-xs"
                  : "hover:text-[#1C1C1A]"
              }`}
            >
              <Wrench className="w-3 h-3 text-amber-300" />
              <span>Foco Bancada Ativa (3)</span>
            </button>
            <button
              onClick={() => setViewFilter("INTAKE")}
              className={`px-3 py-1 rounded-lg transition ${
                viewFilter === "INTAKE"
                  ? "bg-white text-[#1C1C1A] shadow-xs"
                  : "hover:text-[#1C1C1A]"
              }`}
            >
              Triagem & Entrada (3)
            </button>
            <button
              onClick={() => setViewFilter("DISPATCH")}
              className={`px-3 py-1 rounded-lg transition ${
                viewFilter === "DISPATCH"
                  ? "bg-white text-[#1C1C1A] shadow-xs"
                  : "hover:text-[#1C1C1A]"
              }`}
            >
              Prontos & Entrega (2)
            </button>
          </div>

          {/* Busca Rápida de Aparelho */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#71716C] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Localizar OS, cliente, aparelho..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[rgba(28,25,23,0.08)] text-xs text-[#1C1C1A] placeholder:text-[#A1A19B] focus:outline-none focus:border-[#181816] shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Container de Colunas do Kanban com Rolagem Suave */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-8 pt-2 items-start min-h-[calc(100vh-250px)] scroll-smooth"
      >
        {visibleColumns.map((col) => {
          let items = columns[col.id] || [];

          if (searchFilter.trim()) {
            const query = searchFilter.toLowerCase();
            items = items.filter(
              (o: any) =>
                o.osNumber?.toString().includes(query) ||
                o.client?.name?.toLowerCase().includes(query) ||
                o.deviceModel?.toLowerCase().includes(query) ||
                o.reportedDefect?.toLowerCase().includes(query)
            );
          }

          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverColumn !== col.id) setDragOverColumn(col.id);
              }}
              onDragLeave={() => {
                if (dragOverColumn === col.id) setDragOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColumn(null);
                if (draggedOrder) {
                  moveOrderToStatus(draggedOrder.id, draggedOrder.fromStatus, col.id);
                  setDraggedOrder(null);
                }
              }}
              className={`w-72 shrink-0 flex flex-col rounded-xl transition-all duration-200 ${
                isOver
                  ? "bg-[#EAEAE5] border-stone-400 ring-2 ring-[#181816]/10"
                  : "bg-[#F3F3EF] border-[rgba(28,25,23,0.07)]"
              } border max-h-[calc(100vh-240px)] shadow-[0px_1px_2px_rgba(0,0,0,0.01)]`}
            >
              {/* Header da Coluna */}
              <div className="p-3 border-b border-[rgba(28,25,23,0.07)] flex items-center justify-between sticky top-0 bg-[#F3F3EF] rounded-t-xl z-10">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <h3 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider">{col.label}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${col.badge} tabular-nums`}>
                  {items.length}
                </span>
              </div>

              {/* Lista de Aparelhos na Coluna */}
              <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 min-h-[140px]">
                {items.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-[rgba(28,25,23,0.12)] rounded-xl text-[#A1A19B] text-xs">
                    Nenhum aparelho
                  </div>
                ) : (
                  items.map((order: any) => (
                    <div
                      key={order.id}
                      draggable={true}
                      onDragStart={() => {
                        setDraggedOrder({ id: order.id, fromStatus: col.id });
                      }}
                      onDragEnd={() => {
                        setDraggedOrder(null);
                        setDragOverColumn(null);
                      }}
                      className="evorix-card evorix-card-hover p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing transition-all"
                    >
                      {/* OS Number & Priority */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="w-3 h-3 text-[#A1A19B]" />
                          <Link
                            href={`/os/${order.id}/imprimir`}
                            title="Ver detalhes da OS"
                            className="text-xs font-mono font-bold text-[#1C1C1A] bg-[#F3F3EF] hover:bg-[#EAEAE5] px-2 py-0.5 rounded border border-[rgba(28,25,23,0.06)] flex items-center gap-1 transition"
                          >
                            <span>OS #{order.osNumber}</span>
                            <Eye className="w-2.5 h-2.5 text-[#71716C]" />
                          </Link>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            order.priority === "URGENT"
                              ? "bg-[#FEE2E2] text-rose-800 border-[#FECACA]"
                              : "bg-[#F3F3EF] text-[#71716C] border-[rgba(28,25,23,0.06)]"
                          }`}
                        >
                          {translatePriority(order.priority)}
                        </span>
                      </div>

                      {/* Device & Client & Estoque Baixado */}
                      <div>
                        <div className="flex items-center justify-between gap-1.5 text-xs font-bold text-[#1C1C1A]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Smartphone className="w-3.5 h-3.5 text-[#71716C] shrink-0" strokeWidth={1.75} />
                            <span className="line-clamp-1">{order.deviceBrand} {order.deviceModel}</span>
                          </div>
                          {/* 1. Badge VERDE: Apenas se estiver em Bancada ou etapas posteriores E estoque tiver sido baixado */}
                          {order.stockDeducted && ["IN_MAINTENANCE", "QUALITY_CHECK", "READY_FOR_PICKUP", "DELIVERED"].includes(col.id) && (
                            <span
                              className="shrink-0 text-[9px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1"
                              title="Peças baixadas do estoque na bancada (blindagem contra baixa duplicada)"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Peças baixadas</span>
                            </span>
                          )}

                          {/* 2. Badge VERMELHO: Marcação referente ao erro de recusa de bancada */}
                          {order.stockError && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStockErrorModal({
                                  isOpen: true,
                                  osNumber: order.osNumber,
                                  deviceModel: `${order.deviceBrand || ""} ${order.deviceModel || ""}`.trim() || "Aparelho",
                                  errorMessage: order.stockError,
                                  orderId: order.id,
                                });
                              }}
                              className="shrink-0 text-[9px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs transition cursor-pointer"
                              title={`Falha na transição: ${order.stockError} (Clique para abrir aviso)`}
                            >
                              <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                              <span>Sem estoque</span>
                            </button>
                          )}
                        </div>

                        {/* Mensagem de Erro de Recusa em destaque no card se houver */}
                        {order.stockError && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setStockErrorModal({
                                isOpen: true,
                                osNumber: order.osNumber,
                                deviceModel: `${order.deviceBrand || ""} ${order.deviceModel || ""}`.trim() || "Aparelho",
                                errorMessage: order.stockError,
                                orderId: order.id,
                              });
                            }}
                            className="mt-1 p-1.5 rounded-lg bg-rose-50/90 border border-rose-200/90 flex items-start gap-1.5 text-[10px] text-rose-800 cursor-pointer hover:bg-rose-100/90 transition"
                            title="Clique para ver o alerta detalhado"
                          >
                            <AlertCircle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-tight font-medium">
                              {order.stockError}
                            </span>
                          </div>
                        )}

                        <p className="text-[11px] text-[#71716C] mt-0.5 line-clamp-1">
                          {order.client?.name || "Cliente Balcão"} • {order.client?.phone || ""}
                        </p>
                      </div>

                      {/* Defeito */}
                      <p className="text-[11px] text-[#71716C] line-clamp-2 bg-[#F9F9F7] p-2 rounded-lg border border-[rgba(28,25,23,0.06)] leading-tight">
                        {order.reportedDefect}
                      </p>

                      {/* Footer com Valor e Ações */}
                      <div className="pt-2 border-t border-[rgba(28,25,23,0.06)] flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1C1C1A] tabular-nums">
                          {formatCurrency(order.netTotal)}
                        </span>

                        <div className="flex items-center gap-1">
                          {order.publicToken && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPublicLink(order.publicToken);
                              }}
                              title="Copiar link do cliente para WhatsApp"
                              className="p-1.5 rounded-lg bg-[#F3F3EF] hover:bg-[#EBEAE5] text-[#1C1C1A] transition border border-[rgba(28,25,23,0.06)]"
                            >
                              {copiedToken === order.publicToken ? (
                                <Check className="w-3.5 h-3.5 text-emerald-700" strokeWidth={2} />
                              ) : (
                                <Share2 className="w-3.5 h-3.5 text-[#71716C]" strokeWidth={1.75} />
                              )}
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setWhatsAppTemplate(
                                col.id === "AWAITING_APPROVAL"
                                  ? "QUOTE"
                                  : (col.id === "READY_FOR_PICKUP" || col.id === "DELIVERED"
                                      ? "READY"
                                      : "ENTRY")
                              );
                              setWhatsAppOs(order);
                            }}
                            title="Enviar notificação WhatsApp para o cliente"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition border border-emerald-200"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" strokeWidth={1.75} />
                          </button>

                          <Link
                            href={`/os/${order.id}/imprimir`}
                            onClick={(e) => e.stopPropagation()}
                            title="Imprimir etiqueta ou recibo"
                            className="p-1.5 rounded-lg bg-[#F3F3EF] hover:bg-[#EBEAE5] text-[#1C1C1A] transition border border-[rgba(28,25,23,0.06)]"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#71716C]" strokeWidth={1.75} />
                          </Link>

                          {col.id !== "DELIVERED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdvanceStatus(order.id, col.id);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white text-[11px] font-medium flex items-center gap-1 transition shadow-sm active:scale-95"
                            >
                              <span>Avançar</span>
                              <ArrowRight className="w-3 h-3 text-amber-300" strokeWidth={1.75} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Interativo de Disparo WhatsApp */}
      {whatsAppOs && (
        <WhatsAppNotificationModal
          isOpen={!!whatsAppOs}
          onClose={() => setWhatsAppOs(null)}
          clientName={whatsAppOs.client?.name || "Cliente"}
          clientPhone={whatsAppOs.client?.phone || ""}
          deviceModel={`${whatsAppOs.deviceBrand || ""} ${whatsAppOs.deviceModel || ""}`}
          publicToken={whatsAppOs.publicToken || ""}
          osNumber={whatsAppOs.osNumber}
          netTotal={Number(whatsAppOs.netTotal) || 0}
          initialTemplate={whatsAppTemplate}
        />
      )}

      {/* Mini Janela / Modal Centralizado: Bloqueio por Falha de Estoque */}
      {stockErrorModal && stockErrorModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#EBEBE8] shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header com ícone de alerta */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#181816]">
                  Transição Bloqueada: Estoque Insuficiente
                </h3>
                <p className="text-xs text-[#787774]">
                  OS #{stockErrorModal.osNumber} • {stockErrorModal.deviceModel}
                </p>
              </div>
            </div>

            {/* Caixa de Mensagem do Erro */}
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <p className="font-semibold text-rose-950 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Motivo da recusa de entrada em bancada:</span>
              </p>
              <p className="text-xs leading-relaxed text-rose-800 pl-5 font-mono">
                {stockErrorModal.errorMessage}
              </p>
            </div>

            {/* Orientação operacional */}
            <div className="text-xs text-[#787774] space-y-1.5 bg-[#FAF9F6] p-3.5 rounded-xl border border-[#EBEBE8]">
              <p className="font-semibold text-[#181816]">Como proceder?</p>
              <p className="leading-relaxed">
                A Ordem de Serviço retornou automaticamente para o estágio <strong>Aprovado</strong> com a marcação de erro. Para liberar a entrada em bancada, solicite a reposição da peça ao setor de compras ou dê entrada no <strong>TorxOS Stock</strong>.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBEBE8]">
              <button
                type="button"
                onClick={() => setStockErrorModal(null)}
                className="px-6 py-2.5 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Entendido / Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
