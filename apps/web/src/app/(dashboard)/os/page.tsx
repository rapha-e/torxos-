"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wrench,
  Search,
  Plus,
  ExternalLink,
  MessageSquare,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { formatCurrency, translateOsStatus } from "@/lib/utils";
import { WhatsAppNotificationModal } from "@/components/ui/whatsapp-modal";
import { PrintHeader } from "@/components/ui/print-header";

export default function ServiceOrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [whatsAppOs, setWhatsAppOs] = useState<any | null>(null);

  // Filtros de Período
  const [periodPreset, setPeriodPreset] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handlePresetChange = (preset: string) => {
    setPeriodPreset(preset);
    const now = new Date();
    if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "TODAY") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "LAST_7_DAYS") {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (preset === "CURRENT_MONTH") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(first.toISOString().split("T")[0]);
      setEndDate(last.toISOString().split("T")[0]);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      let queryParams = [];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (startDate) queryParams.push(`startDate=${startDate}`);
      if (endDate) queryParams.push(`endDate=${endDate}`);
      const qs = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      const data = await fetchApi(`/service-orders${qs}`);
      let list: any[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && typeof data === "object") {
        list = Object.values(data).flat();
      }

      setOrders(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [search, startDate, endDate]);

  const totalAmount = orders.reduce((sum, o) => sum + Number(o.netTotal || 0), 0);
  const avgTicket = orders.length > 0 ? totalAmount / orders.length : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho Oficial Exclusivo para Impressão / PDF com Perfil da Empresa */}
      <PrintHeader
        title="Relatório Geral de Ordens de Serviço"
        subtitle={`Total de ${orders.length} ordens listadas • Faturamento: ${formatCurrency(totalAmount)}`}
        documentType="Assistência Técnica"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print print:hidden">
        <div>
          <h2 className="text-xl font-bold text-[#1C1C1A] tracking-tight">Relatório Geral de Ordens de Serviço</h2>
          <p className="text-xs text-[#71716C] mt-0.5">
            Histórico completo de atendimentos, laudos técnicos com filtragem por data e período personalizado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.08)] hover:bg-[#F9F9F7] text-xs font-semibold text-[#1C1C1A] transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#71716C]" />
            <span>Imprimir Relatório</span>
          </button>
          <Link
            href="/os/nova"
            className="px-3.5 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" strokeWidth={1.75} />
            <span>Nova OS</span>
          </Link>
        </div>
      </div>

      {/* Cards de Resumo do Período Filtrado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="evorix-card p-4">
          <span className="text-[11px] text-[#71716C] font-semibold uppercase tracking-wider">Ordens no Período</span>
          <p className="text-2xl font-bold text-[#1C1C1A] mt-1 tabular-nums">{orders.length}</p>
        </div>
        <div className="evorix-card p-4">
          <span className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider">Faturamento do Período</span>
          <p className="text-2xl font-bold text-emerald-800 mt-1 tabular-nums">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="evorix-card p-4">
          <span className="text-[11px] text-[#71716C] font-semibold uppercase tracking-wider">Ticket Médio</span>
          <p className="text-2xl font-bold text-[#1C1C1A] mt-1 tabular-nums">{formatCurrency(avgTicket)}</p>
        </div>
      </div>

      {/* Barra de Filtro de Período Personalizado (Oculta na impressão) */}
      <div className="p-4 rounded-xl bg-white border border-[rgba(28,25,23,0.07)] shadow-[0px_1px_2px_rgba(0,0,0,0.02)] space-y-3 no-print print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#71716C]" strokeWidth={1.75} />
            <span className="text-xs font-bold text-[#1C1C1A]">Período das OSs:</span>
          </div>

          {/* Presets de Período */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: "ALL", label: "Todas as Datas" },
              { id: "TODAY", label: "Hoje" },
              { id: "LAST_7_DAYS", label: "Últimos 7 Dias" },
              { id: "CURRENT_MONTH", label: "Este Mês" },
              { id: "CUSTOM", label: "Personalizado" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  periodPreset === p.id
                    ? "bg-[#181816] text-white shadow-sm"
                    : "bg-[#F9F9F7] hover:bg-[#EFEFEA] text-[#71716C] border border-[rgba(28,25,23,0.06)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs de Data */}
        <div className="pt-2 border-t border-[rgba(28,25,23,0.06)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#71716C]">De:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodPreset("CUSTOM");
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] bg-[#FAFAF8] focus:bg-white focus:outline-none"
            />
            <span className="text-[#71716C]">Até:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodPreset("CUSTOM");
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] bg-[#FAFAF8] focus:bg-white focus:outline-none"
            />
            <button
              onClick={loadOrders}
              className="px-3 py-1.5 rounded-lg bg-[#F3F3EF] hover:bg-[#EAEAE5] text-[#1C1C1A] font-semibold flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>Filtrar</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-[#71716C] absolute left-3 top-2" strokeWidth={1.75} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, modelo ou IMEI..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#FAFAF8] border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] placeholder:text-[#A1A19B] focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="evorix-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F9F7] border-b border-[rgba(28,25,23,0.07)] uppercase tracking-wider text-[#71716C] font-bold">
              <tr>
                <th className="py-3.5 px-4">OS #</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Aparelho</th>
                <th className="py-3.5 px-4">Defeito</th>
                <th className="py-3.5 px-4 text-right">Valor Total</th>
                <th className="py-3.5 px-4 text-center no-print print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(28,25,23,0.06)]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#F9F9F7] transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#1C1C1A]">
                    #{order.osNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-[#F3F3EF] text-[#1C1C1A] border border-[rgba(28,25,23,0.06)]">
                      {translateOsStatus(order.status)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#1C1C1A]">{order.client?.name || "Cliente Balcão"}</p>
                    <p className="text-[10px] text-[#71716C]">{order.client?.phone || ""}</p>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#1C1C1A]">
                    {order.deviceBrand} {order.deviceModel}
                  </td>
                  <td className="py-3.5 px-4 text-[#71716C] line-clamp-1 max-w-xs">
                    {order.reportedDefect}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#1C1C1A] tabular-nums">
                    {formatCurrency(order.netTotal)}
                  </td>
                  <td className="py-3.5 px-4 text-center no-print print:hidden">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setWhatsAppOs(order)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                        title="Enviar notificação WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>

                      {order.publicToken && (
                        <Link
                          href={`/status/${order.publicToken}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] text-[#1C1C1A] hover:underline font-semibold px-2 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E5E0]"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3 h-3 text-[#787774]" />
                        </Link>
                      )}

                      <Link
                        href={`/os/${order.id}/imprimir`}
                        className="inline-flex items-center gap-1 text-[11px] text-[#1C1C1A] font-semibold px-2 py-1 rounded-lg bg-[#FAF9F6] hover:bg-[#F0EFEA] border border-[#E5E5E0] transition-colors"
                        title="Imprimir etiqueta ou comprovante"
                      >
                        <Printer className="w-3 h-3 text-[#181816]" />
                        <span>Imprimir</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Disparo WhatsApp */}
      {whatsAppOs && (
        <WhatsAppNotificationModal
          isOpen={!!whatsAppOs}
          onClose={() => setWhatsAppOs(null)}
          clientName={whatsAppOs.client?.name || "Cliente"}
          clientPhone={whatsAppOs.client?.phone || "(11) 99999-9999"}
          deviceModel={`${whatsAppOs.deviceBrand || ""} ${whatsAppOs.deviceModel || "Equipamento"}`}
          publicToken={whatsAppOs.publicToken}
          osNumber={whatsAppOs.osNumber}
          netTotal={Number(whatsAppOs.netTotal) || 0}
          initialTemplate={
            whatsAppOs.status === "AWAITING_APPROVAL"
              ? "QUOTE"
              : (whatsAppOs.status === "READY_FOR_PICKUP" || whatsAppOs.status === "DELIVERED"
                  ? "READY"
                  : "ENTRY")
          }
        />
      )}
    </div>
  );
}
