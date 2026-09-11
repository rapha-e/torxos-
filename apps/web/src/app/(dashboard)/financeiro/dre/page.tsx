"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  Printer,
  Filter,
  RefreshCw,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintHeader } from "@/components/ui/print-header";
import { PlanGate } from "@/components/ui/plan-gate";

export default function DreReportPage() {
  const [dre, setDre] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filtros de Período
  const [periodPreset, setPeriodPreset] = useState<string>("CURRENT_MONTH");
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  });

  const handlePresetChange = (preset: string) => {
    setPeriodPreset(preset);
    const now = new Date();
    if (preset === "CURRENT_MONTH") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(first.toISOString().split("T")[0]);
      setEndDate(last.toISOString().split("T")[0]);
    } else if (preset === "LAST_MONTH") {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(first.toISOString().split("T")[0]);
      setEndDate(last.toISOString().split("T")[0]);
    } else if (preset === "LAST_30_DAYS") {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (preset === "LAST_90_DAYS") {
      const past = new Date();
      past.setDate(now.getDate() - 90);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    }
  };

  const loadDre = async () => {
    setLoading(true);
    try {
      const query = `?startDate=${startDate}&endDate=${endDate}`;
      const data = await fetchApi(`/finance/reports/dre${query}`);
      setDre(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDre();
  }, [startDate, endDate]);

  const s = dre?.summary || {
    grossRevenue: 0,
    deductions: 0,
    netRevenue: 0,
    directCosts: 0,
    grossProfit: 0,
    operatingExpenses: 0,
    netProfit: 0,
    netMarginPercent: 0,
  };

  return (
    <PlanGate feature="canUseDRE">
      <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cabeçalho Oficial Exclusivo para Impressão / PDF com Perfil da Empresa */}
      <PrintHeader
        title="Demonstrativo do Resultado do Exercício (DRE)"
        subtitle={`Regime de Competência • Período: ${formatDate(startDate)} até ${formatDate(endDate)}`}
        documentType="Contábil"
      />

      {/* Header em tela */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#1C1C1A] tracking-tight">
              Demonstrativo do Resultado do Exercício (DRE)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3F3EF] text-[#71716C] font-semibold border border-[rgba(28,25,23,0.06)]">
              Regime de Competência
            </span>
          </div>
          <p className="text-xs text-[#71716C] mt-0.5">
            Relatório gerencial com filtragem por período personalizado e apuração de lucro líquido real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.08)] hover:bg-[#F9F9F7] text-xs font-semibold text-[#1C1C1A] transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#71716C]" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtro de Período Personalizado (Oculta na impressão) */}
      <div className="p-4 rounded-xl bg-white border border-[rgba(28,25,23,0.07)] shadow-[0px_1px_2px_rgba(0,0,0,0.02)] space-y-3 no-print print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#71716C]" strokeWidth={1.75} />
            <span className="text-xs font-bold text-[#1C1C1A]">Período de Análise:</span>
          </div>

          {/* Presets de Período */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: "CURRENT_MONTH", label: "Este Mês" },
              { id: "LAST_MONTH", label: "Mês Anterior" },
              { id: "LAST_30_DAYS", label: "Últimos 30 Dias" },
              { id: "LAST_90_DAYS", label: "Últimos 90 Dias" },
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

        {/* Inputs de Data (Sempre visíveis no modo Personalizado ou colapsados) */}
        <div className="pt-2 border-t border-[rgba(28,25,23,0.06)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
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
              onClick={loadDre}
              className="px-3 py-1.5 rounded-lg bg-[#F3F3EF] hover:bg-[#EAEAE5] text-[#1C1C1A] font-semibold flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>Filtrar</span>
            </button>
          </div>

          <div className="text-[11px] text-[#71716C] font-mono">
            Mostrando resultados de <strong>{formatDate(startDate)}</strong> até <strong>{formatDate(endDate)}</strong>
          </div>
        </div>
      </div>

      {/* Cards de Resumo Executivo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="evorix-card p-6">
          <span className="text-[11px] text-[#71716C] font-semibold uppercase tracking-wider">Receita Líquida</span>
          <p className="text-2xl font-bold text-[#1C1C1A] mt-1 tabular-nums">{formatCurrency(s.netRevenue)}</p>
          <span className="text-[11px] text-[#71716C] mt-1 block">Deduções de adquirentes aplicadas</span>
        </div>

        <div className="evorix-card p-6">
          <span className="text-[11px] text-[#71716C] font-semibold uppercase tracking-wider">Lucro Bruto Operacional</span>
          <p className="text-2xl font-bold text-[#1C1C1A] mt-1 tabular-nums">{formatCurrency(s.grossProfit)}</p>
          <span className="text-[11px] text-[#71716C] font-semibold mt-1 block tabular-nums">Margem Bruta: {((s.grossProfit / (s.netRevenue || 1)) * 100).toFixed(1)}%</span>
        </div>

        <div className="evorix-card p-6">
          <span className="text-[11px] text-[#71716C] font-semibold uppercase tracking-wider">Lucro Líquido Real</span>
          <p className="text-2xl font-bold text-emerald-800 mt-1 tabular-nums">{formatCurrency(s.netProfit)}</p>
          <span className="text-[11px] text-emerald-800 font-semibold mt-1 block tabular-nums">Margem Líquida: {s.netMarginPercent}%</span>
        </div>
      </div>

      {/* Tabela Estruturada DRE com Tabular Nums */}
      <div className="evorix-card overflow-hidden">
        <div className="p-4 border-b border-[rgba(28,25,23,0.07)] flex items-center justify-between bg-[#F9F9F7]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#71716C]" strokeWidth={1.75} />
            <h3 className="font-bold text-xs text-[#1C1C1A]">Demonstrativo Financeiro Oficial</h3>
          </div>
          <span className="text-[11px] font-mono text-[#71716C]">BRL (R$) • Regime Competência</span>
        </div>

        <div className="divide-y divide-[rgba(28,25,23,0.07)] text-xs">
          {/* Receita Bruta */}
          <div className="p-4 flex items-center justify-between hover:bg-[#F9F9F7] transition">
            <div className="space-y-0.5">
              <span className="font-bold text-[#1C1C1A] text-sm">1. (+) RECEITA BRUTA OPERACIONAL</span>
              <p className="text-[#71716C] text-[11px]">Serviços técnicos em bancada e venda de peças de balcão</p>
            </div>
            <span className="font-bold text-[#1C1C1A] text-sm tabular-nums">{formatCurrency(s.grossRevenue)}</span>
          </div>

          {/* Deduções */}
          <div className="p-4 flex items-center justify-between bg-[#FEE2E2]/25 hover:bg-[#FEE2E2]/40 transition">
            <div className="space-y-0.5">
              <span className="font-medium text-rose-800">2. (-) DEDUÇÕES DA RECEITA BRUTA</span>
              <p className="text-[#71716C] text-[11px]">Taxas de maquininha de cartão de crédito e abatimentos concedidos</p>
            </div>
            <span className="font-bold text-rose-700 tabular-nums">-{formatCurrency(s.deductions)}</span>
          </div>

          {/* Receita Líquida */}
          <div className="p-4 flex items-center justify-between bg-[#F3F3EF] font-bold text-[#1C1C1A]">
            <span className="tracking-wide text-xs uppercase">3. (=) RECEITA OPERACIONAL LÍQUIDA</span>
            <span className="text-sm font-bold tabular-nums">{formatCurrency(s.netRevenue)}</span>
          </div>

          {/* Custos Diretos */}
          <div className="p-4 flex items-center justify-between bg-[#FEE2E2]/25 hover:bg-[#FEE2E2]/40 transition">
            <div className="space-y-0.5">
              <span className="font-medium text-rose-800">4. (-) CUSTOS OPERACIONAIS DIRETOS (CSP / CPV)</span>
              <p className="text-[#71716C] text-[11px]">Aquisição de telas, baterias e comissões pagas aos técnicos</p>
            </div>
            <span className="font-bold text-rose-700 tabular-nums">-{formatCurrency(s.directCosts)}</span>
          </div>

          {/* Lucro Bruto */}
          <div className="p-4 flex items-center justify-between bg-[#F3F3EF] font-bold text-[#1C1C1A]">
            <span className="tracking-wide text-xs uppercase">5. (=) LUCRO BRUTO OPERACIONAL</span>
            <span className="text-sm font-bold tabular-nums">{formatCurrency(s.grossProfit)}</span>
          </div>

          {/* Despesas Fixas */}
          <div className="p-4 flex items-center justify-between bg-[#FEE2E2]/25 hover:bg-[#FEE2E2]/40 transition">
            <div className="space-y-0.5">
              <span className="font-medium text-rose-800">6. (-) DESPESAS FIXAS & ADMINISTRATIVAS</span>
              <p className="text-[#71716C] text-[11px]">Aluguel da loja, internet, energia elétrica e contabilidade</p>
            </div>
            <span className="font-bold text-rose-700 tabular-nums">-{formatCurrency(s.operatingExpenses)}</span>
          </div>

          {/* Lucro Líquido Final (Financial Emerald) */}
          <div className="p-5 flex items-center justify-between bg-[#DCFCE7]/60 font-black text-emerald-950 text-base border-t-2 border-emerald-600/30">
            <div>
              <span className="tracking-wide text-sm font-bold">7. (=) RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO LÍQUIDO)</span>
              <p className="text-xs text-emerald-800/80 font-normal">Sobra financeira real gerada pela operação no período</p>
            </div>
            <span className="text-2xl font-bold text-emerald-900 tabular-nums">{formatCurrency(s.netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
    </PlanGate>
  );
}
