"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Wrench,
  AlertTriangle,
  DollarSign,
  Bot,
  ArrowUpRight,
  Boxes,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { formatCurrency, translateStockRisk } from "@/lib/utils";

export default function DashboardPage() {
  const [briefing, setBriefing] = useState<any>(null);
  const [dre, setDre] = useState<any>(null);
  const [stockouts, setStockouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [briefingData, dreData, stockData] = await Promise.all([
          fetchApi("/ai-mentor/daily-briefing"),
          fetchApi("/finance/reports/dre"),
          fetchApi("/stock/predictions/stockouts"),
        ]);
        setBriefing(briefingData);
        setDre(dreData);
        setStockouts(Array.isArray(stockData) ? stockData : []);
      } catch (e) {
        console.error("Erro ao carregar dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Executivo de Alto Valor (Mercury Bank / Apple Style) */}
      <div className="evorix-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F3EF] border border-[rgba(28,25,23,0.06)] text-[#1C1C1A] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" strokeWidth={1.75} />
            <span>TorxOS Intelligence • Visão Operacional 360</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1C1C1A]">
            Centro de Comando da Operação
          </h2>
          <p className="text-xs text-[#71716C] max-w-2xl leading-relaxed">
            Painel consolidado em tempo real. Acompanhamento de DRE por competência, fluxo de caixa diário, avanço técnico de bancada e motor preditivo de ruptura.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/mentor/chat"
            className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Bot className="w-4 h-4 text-amber-200" strokeWidth={1.75} />
            <span>Consultar TorxOS AI</span>
          </Link>
        </div>
      </div>

      {/* Grid de 4 KPIs com Numerais Tabulares (tabular-nums) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Receita Bruta */}
        <div className="evorix-card evorix-card-hover p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71716C]">
              Faturamento (Mês)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F3F3EF] flex items-center justify-center border border-[rgba(28,25,23,0.06)]">
              <DollarSign className="w-4 h-4 text-emerald-700" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-[#1C1C1A] tabular-nums">
              {loading ? "..." : formatCurrency(dre?.summary?.grossRevenue ?? 0)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              {Number(dre?.summary?.grossRevenue || 0) > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                  <TrendingUp className="w-3 h-3 text-emerald-700" strokeWidth={2} />
                  <span className="tabular-nums">Mês Atual</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#71716C] bg-[#F3F3EF] px-2 py-0.5 rounded-full border border-[rgba(28,25,23,0.06)]">
                  <span>Sem faturamento</span>
                </span>
              )}
              <span className="text-[11px] text-[#71716C]">regime competência</span>
            </div>
          </div>
        </div>

        {/* Lucro Líquido DRE */}
        <div className="evorix-card evorix-card-hover p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71716C]">
              Lucro Líquido DRE
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F3F3EF] flex items-center justify-center border border-[rgba(28,25,23,0.06)]">
              <TrendingUp className="w-4 h-4 text-emerald-700" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-[#1C1C1A] tabular-nums">
              {loading ? "..." : formatCurrency(dre?.summary?.netProfit ?? 0)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                <span className="tabular-nums">Margem: {Number(dre?.summary?.netMarginPercent ?? 0).toFixed(1)}%</span>
              </span>
              <span className="text-[11px] text-[#71716C]">após custos & peças</span>
            </div>
          </div>
        </div>

        {/* OSs na Bancada */}
        <div className="evorix-card evorix-card-hover p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71716C]">
              OSs na Bancada
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F3F3EF] flex items-center justify-center border border-[rgba(28,25,23,0.06)]">
              <Wrench className="w-4 h-4 text-amber-700" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-[#1C1C1A] tabular-nums">
              {loading ? "..." : (briefing?.kpis?.totalServiceOrders ?? 0)} <span className="text-sm font-normal text-[#71716C]">aparelhos</span>
            </h3>
            <Link
              href="/os/kanban"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 mt-2 hover:underline"
            >
              <span>Ver Kanban de bancada</span>
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>

        {/* Alerta de Ruptura */}
        <div className="evorix-card evorix-card-hover p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71716C]">
              Risco de Ruptura
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] flex items-center justify-center border border-[#FECACA]">
              <AlertTriangle className="w-4 h-4 text-rose-700" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-rose-700 tabular-nums">
              {stockouts.length} <span className="text-sm font-normal text-[#71716C]">críticas</span>
            </h3>
            <Link
              href="/estoque/ruptura"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 hover:text-rose-950 mt-2 hover:underline"
            >
              <span>Ver semáforo preditivo</span>
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Principal: Action Cards do TorxOS AI Mentor + Reposição Imediata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Cards do Mentor IA (Estilo Linear / Mercury) */}
        <div className="lg:col-span-2 evorix-card p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(28,25,23,0.07)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#181816] text-amber-200 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1C1A]">TorxOS AI Mentor — Briefing Estratégico</h3>
                  <p className="text-[11px] text-[#71716C]">Copiloto executivo conectado aos números reais da loja</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#F3F3EF] text-[#71716C] border border-[rgba(28,25,23,0.06)]">
                Inteligência Analítica
              </span>
            </div>

            <div className="mt-5 text-xs text-[#1C1C1A] leading-relaxed">
              <div className="p-5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] whitespace-pre-line font-sans text-xs text-[#1C1C1A]">
                {briefing?.briefing || "Carregando briefing analítico..."}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[rgba(28,25,23,0.07)] flex items-center justify-between">
            <span className="text-xs text-[#71716C]">Deseja aprofundar diagnósticos de lucro ou rotina?</span>
            <Link
              href="/mentor/chat"
              className="text-xs text-[#1C1C1A] font-semibold flex items-center gap-1 hover:text-amber-800 transition"
            >
              <span>Abrir sessão interativa com a IA</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#1C1C1A]" strokeWidth={2} />
            </Link>
          </div>
        </div>

        {/* Reposição de Peças Críticas */}
        <div className="evorix-card p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(28,25,23,0.07)]">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#71716C]" strokeWidth={1.75} />
                <h3 className="text-sm font-bold text-[#1C1C1A]">Atenção Imediata: Estoque</h3>
              </div>
              <span className="text-[9px] uppercase font-bold text-rose-800 bg-[#FEE2E2] px-2 py-0.5 rounded border border-[#FECACA]">
                Preditivo
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {stockouts.length === 0 ? (
                <div className="text-center py-8 text-[#71716C] text-xs">
                  <CheckCircle2 className="w-7 h-7 text-emerald-700 mx-auto mb-2" strokeWidth={1.75} />
                  <p className="font-semibold text-[#1C1C1A]">Níveis de estoque saudáveis</p>
                  <p className="text-[11px] text-[#71716C] mt-0.5">Todas as peças acima do ponto de encomenda (ROP).</p>
                </div>
              ) : (
                stockouts.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#1C1C1A] line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-[#71716C]">SKU: {item.sku || "N/A"} • {item.shelfLocation || "Sem gaveta"}</p>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                          item.stockoutRiskStatus === "CRITICAL"
                            ? "bg-[#FEE2E2] text-rose-800 border-[#FECACA]"
                            : "bg-[#FEF3C7] text-amber-800 border-[#FDE68A]"
                        }`}
                      >
                        {translateStockRisk(item.stockoutRiskStatus)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[rgba(28,25,23,0.06)] text-center text-xs">
                      <div>
                        <span className="block text-[9px] text-[#71716C]">Saldo</span>
                        <span className="font-semibold text-[#1C1C1A] tabular-nums">{item.currentStock} un</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-[#71716C]">Consumo/Dia</span>
                        <span className="font-semibold text-[#1C1C1A] tabular-nums">{item.dailyAvgConsumption}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-[#71716C]">Autonomia</span>
                        <span className="font-bold text-rose-700 tabular-nums">{item.daysUntilStockout} dias</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[rgba(28,25,23,0.07)]">
            <Link
              href="/estoque/ruptura"
              className="w-full py-2.5 rounded-xl bg-[#F3F3EF] hover:bg-[#EBEAE5] text-[#1C1C1A] text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-[rgba(28,25,23,0.07)]"
            >
              <span>Gerar Pedido de Reposição</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#71716C]" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
