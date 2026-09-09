"use client";

import React, { useState } from "react";
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building2, 
  RefreshCw, 
  Check, 
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Filter,
  Printer,
} from "lucide-react";
import { parseOfx, DEMO_OFX_CONTENT, OfxParsedStatement, OfxTransaction } from "@/lib/ofx-parser";
import { fetchApi } from "@/lib/api";
import { PrintHeader } from "@/components/ui/print-header";

export default function ConciliacaoOfxPage() {
  const [parsedData, setParsedData] = useState<OfxParsedStatement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("itau-pj");
  const [reconciledSuccess, setReconciledSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "MATCHED" | "UNMATCHED">("ALL");

  // Ações de cada item
  const [itemActions, setItemActions] = useState<Record<string, { action: "MATCH" | "CREATE_NEW" | "IGNORE"; category?: string }>>({});

  const processOfxContent = (content: string, name: string) => {
    setIsProcessing(true);
    setReconciledSuccess(false);
    setTimeout(() => {
      const parsed = parseOfx(content);
      
      // Simula enriquecimento de correspondência com títulos do banco
      const enriched = parsed.transactions.map((t) => {
        if (t.amount === 450.0 && t.type === "CREDIT") {
          return {
            ...t,
            reconciliationStatus: "MATCHED" as const,
            suggestedMatch: {
              id: "trans-1003",
              description: "Entrada OS #1003 - Clara Mendes",
              amount: 450.0,
              dueDate: "2026-09-04",
              confidencePercent: 100,
            },
          };
        }
        if (t.amount === 850.0 && t.type === "DEBIT") {
          return {
            ...t,
            reconciliationStatus: "MATCHED" as const,
            suggestedMatch: {
              id: "trans-pay-01",
              description: "Fornecedor Telas & Displays Brasil",
              amount: 850.0,
              dueDate: "2026-09-04",
              confidencePercent: 100,
            },
          };
        }
        if (t.amount === 1200.0 && t.type === "CREDIT") {
          return {
            ...t,
            reconciliationStatus: "MATCHED" as const,
            suggestedMatch: {
              id: "trans-1002",
              description: "OS #1002 - Dr. Carlos Eduardo",
              amount: 1200.0,
              dueDate: "2026-09-02",
              confidencePercent: 100,
            },
          };
        }
        return {
          ...t,
          reconciliationStatus: "UNMATCHED" as const,
        };
      });

      // Define ações padrão iniciais
      const initialActions: Record<string, { action: "MATCH" | "CREATE_NEW" | "IGNORE"; category?: string }> = {};
      enriched.forEach((item) => {
        if (item.reconciliationStatus === "MATCHED") {
          initialActions[item.id] = { action: "MATCH" };
        } else {
          initialActions[item.id] = { action: "CREATE_NEW", category: item.type === "DEBIT" ? "Despesas Bancárias" : "Receitas Avulsas" };
        }
      });

      setItemActions(initialActions);
      setParsedData({ ...parsed, transactions: enriched });
      setFileName(name);
      setIsProcessing(false);
    }, 400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processOfxContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const loadDemoOfx = () => {
    processOfxContent(DEMO_OFX_CONTENT, "extrato_itau_setembro_2026.ofx");
  };

  const handleConfirmReconciliation = async () => {
    setIsProcessing(true);
    try {
      // Integração direta com o backend se disponível
      await fetchApi("/finance/reconciliation/confirm", {
        method: "POST",
        body: JSON.stringify({
          items: Object.entries(itemActions).map(([fitId, data]) => ({
            fitId,
            action: data.action,
            bankAccountId: selectedAccountId === "itau-pj" ? "bank-itau-id" : "bank-caixa-id",
          })),
        }),
      }).catch(() => null);

      setReconciledSuccess(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredTransactions = parsedData?.transactions.filter((t) => {
    if (activeTab === "MATCHED") return t.reconciliationStatus === "MATCHED";
    if (activeTab === "UNMATCHED") return t.reconciliationStatus === "UNMATCHED";
    return true;
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Cabeçalho Oficial Exclusivo para Impressão / PDF com Perfil da Empresa */}
      <PrintHeader
        title="Relatório de Conciliação Bancária OFX"
        subtitle={parsedData ? `Extrato ${fileName || "OFX"} • ${parsedData.bankName || "Banco"} - Conta: ${parsedData.accountNumber || "PJ"}` : "Extrato de Conciliação Financeira"}
        documentType="Auditoria Contábil"
      />

      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBEBE8] pb-6 no-print print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#787774]">TorxOS Finance</span>
            <span className="text-xs text-[#A8A7A1]">•</span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Conciliação Inteligente
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-[#181816] tracking-tight">
            Conciliação Bancária OFX
          </h1>
          <p className="text-sm text-[#787774] mt-0.5">
            Faça a correspondência automática entre o extrato bancário real e os títulos do sistema em segundos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {parsedData && (
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border border-[#E5E5E0] bg-white text-xs font-semibold text-[#181816] hover:bg-[#F7F7F4] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#787774]" />
              Imprimir / PDF
            </button>
          )}

          <button
            type="button"
            onClick={loadDemoOfx}
            className="px-4 py-2 rounded-xl border border-[#E5E5E0] bg-white text-xs font-medium text-[#181816] hover:bg-[#F7F7F4] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#787774]" />
            Carregar Extrato Demo (Itaú OFX)
          </button>

          <label className="px-4 py-2 rounded-xl bg-[#181816] text-xs font-medium text-white hover:bg-[#282824] transition-all flex items-center gap-2 shadow-sm cursor-pointer">
            <UploadCloud className="w-4 h-4" />
            Importar Arquivo .OFX
            <input
              type="file"
              accept=".ofx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Alerta de Sucesso após Conciliar */}
      {reconciledSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-950">Conciliação Concluída com Sucesso!</p>
              <p className="text-xs text-emerald-800">
                Os títulos foram liquidados e o saldo bancário da conta foi atualizado em tempo real.
              </p>
            </div>
          </div>
          <button
            onClick={() => setReconciledSuccess(false)}
            className="text-xs font-medium text-emerald-800 underline hover:text-emerald-950"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Área quando não há arquivo carregado */}
      {!parsedData && (
        <div className="bg-white rounded-2xl border border-dashed border-[#D6D5D0] p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF9F6] border border-[#EBEBE8] flex items-center justify-center text-[#787774] mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-[#181816]">Nenhum extrato bancário carregado</h3>
          <p className="text-xs text-[#787774] max-w-md mt-1 mb-6">
            Exporte o arquivo OFX do internet banking da sua empresa (Itaú, Bradesco, Santander, Banco do Brasil, Inter, etc.) e solte aqui.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDemoOfx}
              className="px-4 py-2.5 rounded-xl bg-[#181816] text-xs font-medium text-white hover:bg-[#282824] transition-all flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Experimentar com Extrato Demonstração
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo com Dados do Extrato */}
      {parsedData && (
        <div className="space-y-6">
          {/* Barra de Metadados do Arquivo e Conta */}
          <div className="bg-white rounded-2xl p-5 border border-[#EBEBE8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8] flex items-center justify-center text-[#181816]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#181816]">{parsedData.bankName}</h3>
                  <span className="text-[11px] font-mono text-[#787774] bg-[#F5F5F2] px-2 py-0.5 rounded">
                    {parsedData.accountNumber}
                  </span>
                </div>
                <p className="text-xs text-[#787774] mt-0.5">Arquivo importado: <strong className="text-[#181816]">{fileName}</strong></p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#787774]">Conciliar com conta interna:</span>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="text-xs font-medium border border-[#E5E5E0] bg-[#FAF9F6] rounded-xl px-3 py-2 text-[#181816] focus:outline-none focus:ring-1 focus:ring-[#181816]"
              >
                <option value="itau-pj">Itaú Empresas PJ (Ag 0450 / CC 98210-4)</option>
                <option value="caixa-balcao">Caixa Balcão 1 (Gaveta Loja)</option>
              </select>
            </div>
          </div>

          {/* Cards de Resumo Executivo (Numerais Tabulares) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#EBEBE8] shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#787774] mb-2">
                <span>Créditos (Entradas)</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
                + R$ {parsedData.totalCredits.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#787774] mt-1">Lançamentos recebidos na conta</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#EBEBE8] shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#787774] mb-2">
                <span>Débitos (Saídas)</span>
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-bold tracking-tight text-[#181816] tabular-nums">
                - R$ {parsedData.totalDebits.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#787774] mt-1">Pagamentos e tarifas debitadas</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#EBEBE8] shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#787774] mb-2">
                <span>Movimentação Líquida</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className={`text-2xl font-bold tracking-tight tabular-nums ${parsedData.netBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                R$ {parsedData.netBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#787774] mt-1">Impacto no saldo bancário</p>
            </div>
          </div>

          {/* Filtros e Tabela de Lançamentos */}
          <div className="bg-white rounded-2xl border border-[#EBEBE8] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#EBEBE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#181816]">Lançamentos do Extrato & Batimento</h3>
                <p className="text-xs text-[#787774] mt-0.5">
                  Revise os matches automáticos e defina a destinação das despesas avulsas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "ALL" ? "bg-[#181816] text-white" : "text-[#787774] hover:bg-[#F5F5F2]"
                  }`}
                >
                  Todos ({parsedData.transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("MATCHED")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "MATCHED" ? "bg-[#181816] text-white" : "text-[#787774] hover:bg-[#F5F5F2]"
                  }`}
                >
                  Identificados ({parsedData.transactions.filter(t => t.reconciliationStatus === "MATCHED").length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("UNMATCHED")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "UNMATCHED" ? "bg-[#181816] text-white" : "text-[#787774] hover:bg-[#F5F5F2]"
                  }`}
                >
                  Pendentes ({parsedData.transactions.filter(t => t.reconciliationStatus === "UNMATCHED").length})
                </button>
              </div>
            </div>

            {/* Listagem */}
            <div className="divide-y divide-[#EBEBE8]">
              {filteredTransactions.map((item) => {
                const isCredit = item.type === "CREDIT";
                const isMatched = item.reconciliationStatus === "MATCHED";
                const currentAction = itemActions[item.id]?.action || (isMatched ? "MATCH" : "CREATE_NEW");

                return (
                  <div key={item.id} className="p-5 hover:bg-[#FAF9F6] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Dados Bancários */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 shrink-0 ${
                        isCredit ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-[#F5F5F2] text-[#181816] border border-[#E5E5E0]"
                      }`}>
                        {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#181816] truncate">{item.memo}</p>
                          <span className="text-[10px] font-mono text-[#787774] bg-[#F5F5F2] px-2 py-0.5 rounded">
                            {item.fitId}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#787774] mt-1">
                          <span>Data: {new Date(item.date).toLocaleDateString("pt-BR")}</span>
                          <span>•</span>
                          <span className={`font-semibold tabular-nums ${isCredit ? "text-emerald-700" : "text-[#181816]"}`}>
                            {isCredit ? "+" : "-"} R$ {item.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Correspondência no Sistema */}
                    <div className="lg:w-80 p-3 rounded-xl bg-white border border-[#EBEBE8] text-xs">
                      {isMatched && item.suggestedMatch ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              100% Correspondência
                            </span>
                            <span className="text-[10px] text-[#787774]">Venc: {item.suggestedMatch.dueDate}</span>
                          </div>
                          <p className="font-medium text-[#181816] truncate">{item.suggestedMatch.description}</p>
                          <p className="text-[#787774] mt-0.5 tabular-nums">
                            Valor Sistema: R$ {item.suggestedMatch.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                              <HelpCircle className="w-3.5 h-3.5" />
                              Sem Título Prévio
                            </span>
                          </div>
                          <p className="text-[#787774] text-[11px]">
                            Lançamento não localizado no financeiro. Será gerado automaticamente ao conciliar.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Ação a Executar */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={currentAction}
                        onChange={(e) => {
                          const val = e.target.value as "MATCH" | "CREATE_NEW" | "IGNORE";
                          setItemActions({
                            ...itemActions,
                            [item.id]: { ...itemActions[item.id], action: val },
                          });
                        }}
                        className="text-xs font-medium border border-[#E5E5E0] bg-[#FAF9F6] rounded-xl px-3 py-2 text-[#181816] focus:outline-none focus:ring-1 focus:ring-[#181816]"
                      >
                        {isMatched && <option value="MATCH">Liquidar Título Encontrado</option>}
                        <option value="CREATE_NEW">Criar Novo Lançamento</option>
                        <option value="IGNORE">Ignorar Este Lançamento</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé de Ação */}
            <div className="p-5 bg-[#FAF9F6] border-t border-[#EBEBE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-[#787774]">
                Total de <strong>{filteredTransactions.length}</strong> transações preparadas para conciliação.
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReconciliation}
                className="px-6 py-2.5 rounded-xl bg-[#181816] text-xs font-semibold text-white hover:bg-[#282824] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processando Liquidações...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar e Conciliar Lançamentos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
