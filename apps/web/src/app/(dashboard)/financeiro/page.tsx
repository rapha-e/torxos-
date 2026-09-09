"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Calendar,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles,
  PieChart,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { formatCurrency, formatDate, translatePaymentMethod } from "@/lib/utils";

export default function FinanceiroHubPage() {
  const [loading, setLoading] = useState(true);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [dreData, setDreData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const loadAllFinancialData = async () => {
    setLoading(true);
    try {
      const [cashFlow, dre, trans, accounts] = await Promise.all([
        fetchApi("/finance/reports/cash-flow").catch(() => null),
        fetchApi("/finance/reports/dre").catch(() => null),
        fetchApi("/finance/transactions").catch(() => []),
        fetchApi("/finance/bank-accounts").catch(() => []),
      ]);

      setCashFlowData(cashFlow);
      setDreData(dre);
      setTransactions(Array.isArray(trans) ? trans : []);
      setBankAccounts(Array.isArray(accounts) ? accounts : []);
    } catch (err) {
      console.error("Erro ao carregar dados do Hub Financeiro:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllFinancialData();
  }, []);

  // Totais calculados
  const totalBalance = bankAccounts.reduce(
    (acc, b) => acc + (Number(b.currentBalance) || 0),
    0
  );

  const pendingReceivables = transactions
    .filter((t) => t.transactionType === "RECEIVABLE" && t.status === "PENDING")
    .reduce((acc, t) => acc + (Number(t.netAmount || t.grossAmount) || 0), 0);

  const pendingPayables = transactions
    .filter((t) => t.transactionType === "PAYABLE" && t.status === "PENDING")
    .reduce((acc, t) => acc + (Number(t.netAmount || t.grossAmount) || 0), 0);

  const netProfit = dreData?.summary?.netProfit ?? (cashFlowData?.summary?.currentCashBalance ?? 0);
  const grossRevenue = dreData?.summary?.grossRevenue ?? 0;
  const netMargin = dreData?.summary?.netMarginPercent ?? 0;

  const recentTransactions = transactions.slice(0, 8);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBEBE8] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Gestão Financeira & DRE
            </span>
            <span className="text-xs text-[#A8A7A1]">•</span>
            <span className="text-xs font-mono font-medium text-[#787774]">
              Visão Geral Consolidada
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#181816] tracking-tight">
            Hub Financeiro da Assistência
          </h1>
          <p className="text-sm text-[#787774] mt-0.5">
            Acompanhe o saldo consolidado de caixas e bancos, contas a pagar/receber e o resultado operacional em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadAllFinancialData}
            disabled={loading}
            className="px-3 py-2 bg-white hover:bg-[#FAF9F6] border border-[#EBEBE8] text-[#181816] text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Atualizar dados financeiros"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#787774] ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>

          <Link
            href="/financeiro/titulos"
            className="px-3.5 py-2 bg-[#181816] hover:bg-[#2b2a27] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" />
            Novo Lançamento
          </Link>
        </div>
      </div>

      {/* 4 Cards Principais de Indicadores (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Consolidado */}
        <div className="p-5 rounded-2xl bg-white border border-[#EBEBE8] shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#787774] uppercase tracking-wider">
              Saldo em Bancos & Caixa
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#181816] font-mono">
            {formatCurrency(totalBalance)}
          </div>
          <div className="text-[11px] text-[#787774] flex items-center gap-1">
            <span>Distribuído em</span>
            <strong className="text-[#181816]">{bankAccounts.length} conta(s) / caixa(s)</strong>
          </div>
        </div>

        {/* Card 2: Contas a Receber Pendentes */}
        <div className="p-5 rounded-2xl bg-white border border-[#EBEBE8] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#787774] uppercase tracking-wider">
              A Receber (Pendentes)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700 font-mono">
            {formatCurrency(pendingReceivables)}
          </div>
          <div className="text-[11px] text-[#787774] flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Previsão de entrada de caixa</span>
          </div>
        </div>

        {/* Card 3: Contas a Pagar Pendentes */}
        <div className="p-5 rounded-2xl bg-white border border-[#EBEBE8] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#787774] uppercase tracking-wider">
              A Pagar (Compromissos)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono">
            {formatCurrency(pendingPayables)}
          </div>
          <div className="text-[11px] text-[#787774] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Boletos e despesas a liquidar</span>
          </div>
        </div>

        {/* Card 4: Lucro Líquido Operacional (DRE) */}
        <div className="p-5 rounded-2xl bg-white border border-[#EBEBE8] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#787774] uppercase tracking-wider">
              Lucro Líquido (DRE)
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono ${netProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
            {formatCurrency(netProfit)}
          </div>
          <div className="text-[11px] text-[#787774] flex items-center gap-1">
            <span className="font-semibold text-[#181816]">Margem Líquida:</span>
            <span>{netMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Grid de Atalhos para os 4 Módulos Financeiros Especializados */}
      <div>
        <h2 className="text-sm font-bold text-[#181816] mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          Módulos de Gestão Financeira
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Módulo 1: Fluxo de Caixa */}
          <Link
            href="/financeiro/fluxo-caixa"
            className="group p-4 rounded-2xl bg-white border border-[#EBEBE8] hover:border-[#181816] hover:shadow-md transition space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 mb-3 group-hover:scale-105 transition">
                <Wallet className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-bold text-[#181816] group-hover:text-emerald-800 transition">
                Fluxo de Caixa & Contas
              </h3>
              <p className="text-xs text-[#787774] mt-1 line-clamp-2">
                Gestão de contas correntes, caixas da loja e projeções de saldo para 30, 60 e 90 dias.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-semibold text-emerald-700 gap-1 group-hover:translate-x-0.5 transition">
              <span>Abrir Fluxo de Caixa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Módulo 2: Contas a Pagar e Receber */}
          <Link
            href="/financeiro/titulos"
            className="group p-4 rounded-2xl bg-white border border-[#EBEBE8] hover:border-[#181816] hover:shadow-md transition space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 mb-3 group-hover:scale-105 transition">
                <FileSpreadsheet className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-bold text-[#181816] group-hover:text-blue-800 transition">
                Títulos (Pagar & Receber)
              </h3>
              <p className="text-xs text-[#787774] mt-1 line-clamp-2">
                Lançamento manual de despesas, receitas avulsas, liquidação com 1 clique e Pix dinâmico.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-semibold text-blue-700 gap-1 group-hover:translate-x-0.5 transition">
              <span>Gerenciar Títulos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Módulo 3: DRE Gerencial */}
          <Link
            href="/financeiro/dre"
            className="group p-4 rounded-2xl bg-white border border-[#EBEBE8] hover:border-[#181816] hover:shadow-md transition space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 mb-3 group-hover:scale-105 transition">
                <PieChart className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-bold text-[#181816] group-hover:text-purple-800 transition">
                DRE Gerencial
              </h3>
              <p className="text-xs text-[#787774] mt-1 line-clamp-2">
                Demonstrativo contábil e gerencial por regime de competência, custos diretos e margens.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-semibold text-purple-700 gap-1 group-hover:translate-x-0.5 transition">
              <span>Ver DRE Completa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Módulo 4: Conciliação OFX */}
          <Link
            href="/financeiro/conciliacao"
            className="group p-4 rounded-2xl bg-white border border-[#EBEBE8] hover:border-[#181816] hover:shadow-md transition space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 mb-3 group-hover:scale-105 transition">
                <Building2 className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-bold text-[#181816] group-hover:text-amber-800 transition">
                Conciliação OFX
              </h3>
              <p className="text-xs text-[#787774] mt-1 line-clamp-2">
                Importação do extrato do seu banco com cruzamento automático e liquidação em lote.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-semibold text-amber-700 gap-1 group-hover:translate-x-0.5 transition">
              <span>Importar Extrato OFX</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* Grid Inferior: Contas Bancárias Ativas + Últimos Lançamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contas Bancárias & Caixas */}
        <div className="bg-white rounded-2xl border border-[#EBEBE8] shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EBEBE8] pb-3">
            <h3 className="text-sm font-bold text-[#181816] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#787774]" />
              Contas & Caixas Cadastrados
            </h3>
            <Link
              href="/financeiro/fluxo-caixa"
              className="text-[11px] font-semibold text-emerald-700 hover:underline"
            >
              Gerenciar
            </Link>
          </div>

          <div className="space-y-2.5">
            {bankAccounts.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#787774]">
                Nenhuma conta cadastrada ainda.
              </div>
            ) : (
              bankAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#E5E5E0] flex items-center justify-center text-[#181816]">
                      <Wallet className="w-3.5 h-3.5 text-[#787774]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#181816]">
                        {acc.name}
                      </div>
                      <div className="text-[10px] text-[#787774]">
                        {acc.accountType === "CASH" ? "Caixa Físico" : "Conta Bancária"}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-bold font-mono text-[#181816]">
                    {formatCurrency(acc.currentBalance || 0)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimas Transações Financeiras */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EBEBE8] shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-[#EBEBE8] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#181816] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#787774]" />
                Últimas Movimentações Financeiras
              </h3>
              <p className="text-[11px] text-[#787774] mt-0.5">
                Transações recentes registradas no sistema
              </p>
            </div>
            <Link
              href="/financeiro/titulos"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Ver todos os títulos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#787774] font-semibold border-b border-[#EBEBE8]">
                <tr>
                  <th className="py-2.5 px-4">Descrição</th>
                  <th className="py-2.5 px-4">Tipo</th>
                  <th className="py-2.5 px-4">Vencimento</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Valor Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBE8] text-[#181816]">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[#787774]">
                      Nenhuma movimentação financeira encontrada.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((item) => {
                    const isRec = item.transactionType === "RECEIVABLE";
                    const isSettled = item.status === "SETTLED";
                    return (
                      <tr key={item.id} className="hover:bg-[#FAF9F6] transition">
                        <td className="py-3 px-4 font-medium max-w-[240px] truncate">
                          {item.description}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${
                              isRec
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {isRec ? <ArrowDownLeft className="w-2.5 h-2.5" /> : <ArrowUpRight className="w-2.5 h-2.5" />}
                            {isRec ? "A Receber" : "A Pagar"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#787774]">
                          {formatDate(item.dueDate)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded ${
                              isSettled
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {isSettled ? "Liquidado" : "Pendente"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={isRec ? "text-emerald-700" : "text-rose-600"}>
                            {isRec ? "+" : "-"} {formatCurrency(item.netAmount || item.grossAmount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
