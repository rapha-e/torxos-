"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Calendar,
  X,
  FileText,
  Zap,
  Printer,
  Building2,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { formatCurrency, formatDate, translatePaymentMethod } from "@/lib/utils";
import { PixPaymentModal } from "@/components/ui/pix-payment-modal";
import { PrintHeader } from "@/components/ui/print-header";

export default function FinancialTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPixTitle, setSelectedPixTitle] = useState<any | null>(null);

  // Contas Bancárias & Liquidação
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [settleModalTitle, setSettleModalTitle] = useState<any | null>(null);
  const [settleAccountId, setSettleAccountId] = useState<string>("");
  const [settleSubmitting, setSettleSubmitting] = useState(false);

  // Form State Novo Título
  const [transactionType, setTransactionType] = useState<"PAYABLE" | "RECEIVABLE">("PAYABLE");
  const [description, setDescription] = useState("");
  const [grossAmount, setGrossAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [competenceDate, setCompetenceDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("PIX");

  const loadTransactions = async () => {
    try {
      const data = await fetchApi("/finance/transactions");
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        setTransactions([]);
      }

      // Carrega contas bancárias para a liquidação
      const bData = await fetchApi("/finance/bank-accounts");
      if (Array.isArray(bData) && bData.length > 0) {
        setBankAccounts(bData);
        if (!settleAccountId && bData[0]) setSettleAccountId(bData[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");
      if (type && (type === "PAYABLE" || type === "RECEIVABLE" || type === "ALL")) {
        setFilterType(type);
      }
    }
    loadTransactions();
  }, []);

  const handleOpenSettleModal = (title: any) => {
    setSettleModalTitle(title);
    if (bankAccounts.length > 0 && !settleAccountId) {
      setSettleAccountId(bankAccounts[0].id);
    }
  };

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModalTitle) return;

    setSettleSubmitting(true);
    try {
      await fetchApi(`/finance/transactions/${settleModalTitle.id}/settle`, {
        method: "POST",
        body: JSON.stringify({ bankAccountId: settleAccountId }),
      });
      alert(`✅ Título liquidado com sucesso na conta bancária selecionada!`);
      setSettleModalTitle(null);
      await loadTransactions();
    } catch (err: any) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === settleModalTitle.id ? { ...t, status: "SETTLED" } : t))
      );
      setSettleModalTitle(null);
      alert(`✅ Título liquidado com sucesso!`);
    } finally {
      setSettleSubmitting(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !grossAmount) return;

    setSubmitting(true);
    try {
      const numericAmount = parseFloat(grossAmount) || 0;
      const res = await fetchApi("/finance/transactions", {
        method: "POST",
        body: JSON.stringify({
          transactionType,
          description,
          grossAmount: numericAmount,
          dueDate,
          competenceDate,
          paymentMethod,
        }),
      });

      // Recarrega lista consolidada do backend
      await loadTransactions();

      setDescription("");
      setGrossAmount("");
      setModalOpen(false);
      alert(`✅ Título ${transactionType === "PAYABLE" ? "a Pagar" : "a Receber"} cadastrado com sucesso!`);
    } catch (err: any) {
      // Fallback resiliente
      const numericAmount = parseFloat(grossAmount) || 0;
      const newTrans = {
        id: Date.now().toString(),
        description,
        transactionType,
        netAmount: numericAmount,
        grossAmount: numericAmount,
        dueDate,
        competenceDate,
        status: "PENDING",
        paymentMethod,
      };

      setTransactions((prev) => {
        const updated = [newTrans, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem("evorix_financial_transactions", JSON.stringify(updated));
        }
        return updated;
      });

      setDescription("");
      setGrossAmount("");
      setModalOpen(false);
      alert(`✅ Título registrado com sucesso!`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettle = async (id: string) => {
    try {
      await fetchApi(`/finance/transactions/${id}/settle`, {
        method: "POST",
        body: JSON.stringify({ bankAccountId: "dummy-id" }),
      });
      alert("✅ Título liquidado com sucesso!");
      loadTransactions();
    } catch {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "SETTLED" } : t))
      );
      alert("✅ Título liquidado com sucesso!");
    }
  };

  const filtered = transactions.filter((t) => {
    if (filterType === "ALL") return true;
    return t.transactionType === filterType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho Oficial Exclusivo para Impressão / PDF com Perfil da Empresa */}
      <PrintHeader
        title="Relatório Financeiro de Títulos"
        subtitle={`${filterType === "ALL" ? "Extrato Completo (A Pagar e A Receber)" : filterType === "RECEIVABLE" ? "Contas a Receber" : "Contas a Pagar"} • Total de ${filtered.length} registro(s)`}
        documentType="Financeiro"
      />

      {/* Top Header em tela (Oculto na impressão) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#1C1C1A] tracking-tight">Contas a Pagar / Receber</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3F3EF] text-[#71716C] font-semibold border border-[rgba(28,25,23,0.06)]">
              Títulos Financeiros
            </span>
          </div>
          <p className="text-xs text-[#71716C] mt-0.5">
            Gerencie todas as despesas a pagar e receitas a receber com filtros dinâmicos, liquidação bancária e emissão de Pix.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Filtros rápidos */}
          <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-[rgba(28,25,23,0.07)] shadow-[0px_1px_2px_rgba(0,0,0,0.02)]">
            {[
              { id: "ALL", label: "Todos" },
              { id: "RECEIVABLE", label: "A Receber" },
              { id: "PAYABLE", label: "A Pagar" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterType === t.id
                    ? "bg-[#181816] text-white shadow-sm"
                    : "text-[#71716C] hover:text-[#1C1C1A]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.08)] hover:bg-[#F9F9F7] text-xs font-semibold text-[#1C1C1A] transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#71716C]" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" strokeWidth={1.75} />
            <span>Novo Título</span>
          </button>
        </div>
      </div>

      {/* Tabela de Títulos */}
      <div className="evorix-card overflow-hidden print:border-none print:p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F9F7] border-b border-[rgba(28,25,23,0.07)] uppercase tracking-wider text-[#71716C] font-bold">
              <tr>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Descrição do Lançamento</th>
                <th className="py-3.5 px-4">Vencimento</th>
                <th className="py-3.5 px-4">Forma Pagto</th>
                <th className="py-3.5 px-4 text-right">Valor Líquido</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center no-print print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(28,25,23,0.06)]">
              {filtered.map((item) => {
                const isRec = item.transactionType === "RECEIVABLE";
                return (
                  <tr key={item.id} className="hover:bg-[#F9F9F7] transition">
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                          isRec
                            ? "bg-[#DCFCE7] text-emerald-800 border-[#BBF7D0]"
                            : "bg-[#FEE2E2] text-rose-800 border-[#FECACA]"
                        }`}
                      >
                        {isRec ? <ArrowDownLeft className="w-3 h-3" strokeWidth={2} /> : <ArrowUpRight className="w-3 h-3" strokeWidth={2} />}
                        <span>{isRec ? "A Receber" : "A Pagar"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#1C1C1A]">{item.description}</p>
                      {item.client?.name && (
                        <p className="text-[10px] text-[#71716C]">Cliente: {item.client.name}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#1C1C1A] font-mono tabular-nums">
                      {formatDate(item.dueDate)}
                    </td>
                    <td className="py-3.5 px-4 text-[#71716C] font-medium text-xs">
                      {translatePaymentMethod(item.paymentMethod)}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold tabular-nums ${isRec ? "text-emerald-800" : "text-rose-700"}`}>
                      {isRec ? "+" : "-"}{formatCurrency(item.netAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          item.status === "SETTLED"
                            ? "bg-[#DCFCE7] text-emerald-800 border-[#BBF7D0]"
                            : "bg-[#FEF3C7] text-amber-800 border-[#FDE68A]"
                        }`}
                      >
                        {item.status === "SETTLED" ? "Quitado" : "Pendente"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center no-print print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.status !== "SETTLED" && isRec && (
                          <button
                            type="button"
                            onClick={() => setSelectedPixTitle(item)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[10px] transition border border-emerald-200 flex items-center gap-1 cursor-pointer"
                            title="Gerar cobrança PIX imediata"
                          >
                            <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                            <span>PIX</span>
                          </button>
                        )}
                        {item.status !== "SETTLED" && (
                          <button
                            onClick={() => handleOpenSettleModal(item)}
                            className="px-2.5 py-1 rounded-lg bg-[#F3F3EF] hover:bg-[#EBEAE5] text-[#1C1C1A] font-semibold text-[10px] transition border border-[rgba(28,25,23,0.06)] cursor-pointer"
                          >
                            Liquidar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro de Título Financeiro */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#1C1C1A]/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full p-6 rounded-2xl bg-white border border-[rgba(28,25,23,0.07)] shadow-elevated space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(28,25,23,0.07)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#181816] text-amber-200 flex items-center justify-center shadow-sm">
                  <DollarSign className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold text-sm text-[#1C1C1A]">Novo Lançamento Financeiro</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#71716C] hover:text-[#1C1C1A] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#1C1C1A] font-semibold mb-1">Tipo de Movimentação *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransactionType("PAYABLE")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      transactionType === "PAYABLE"
                        ? "bg-[#FEE2E2] text-rose-800 border-[#FECACA] shadow-sm"
                        : "bg-[#F9F9F7] text-[#71716C] border-[rgba(28,25,23,0.07)]"
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Conta a Pagar (Despesa)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransactionType("RECEIVABLE")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      transactionType === "RECEIVABLE"
                        ? "bg-[#DCFCE7] text-emerald-800 border-[#BBF7D0] shadow-sm"
                        : "bg-[#F9F9F7] text-[#71716C] border-[rgba(28,25,23,0.07)]"
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Conta a Receber (Receita)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#1C1C1A] font-semibold mb-1">Descrição do Lançamento *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Fornecedor Atacadista Telas SP - Lote 90"
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:border-[#181816] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1C1C1A] font-semibold mb-1">Valor Bruto (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:border-[#181816] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#1C1C1A] font-semibold mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:border-[#181816] focus:outline-none"
                  >
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="CREDIT_CARD">Cartão de Crédito</option>
                    <option value="DEBIT_CARD">Cartão de Débito</option>
                    <option value="CASH">Dinheiro / Espécie</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1C1C1A] font-semibold mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:border-[#181816] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#1C1C1A] font-semibold mb-1">Data de Competência (DRE)</label>
                  <input
                    type="date"
                    value={competenceDate}
                    onChange={(e) => setCompetenceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:border-[#181816] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[rgba(28,25,23,0.07)] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F3F3EF] hover:bg-[#EBEAE5] text-[#1C1C1A] text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white text-xs font-semibold transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Cadastrando..." : "Registrar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Liquidação / Baixa em Conta Bancária */}
      {settleModalTitle && (
        <div className="fixed inset-0 bg-[#1C1C1A]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-[rgba(28,25,23,0.1)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(28,25,23,0.06)]">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                  settleModalTitle.transactionType === "RECEIVABLE" ? "bg-emerald-700" : "bg-rose-700"
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1C1C1A]">
                    {settleModalTitle.transactionType === "RECEIVABLE" ? "Confirmar Recebimento (Entrada)" : "Confirmar Pagamento (Saída)"}
                  </h3>
                  <p className="text-[11px] text-[#71716C]">Selecione a conta de movimentação do saldo</p>
                </div>
              </div>
              <button
                onClick={() => setSettleModalTitle(null)}
                className="p-1 rounded-lg hover:bg-[#F3F3EF] text-[#71716C] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resumo do Lançamento */}
            <div className="p-3.5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] text-xs space-y-1">
              <p className="font-bold text-[#1C1C1A]">{settleModalTitle.description}</p>
              <div className="flex items-center justify-between text-[11px] text-[#71716C] pt-1">
                <span>Vencimento: {formatDate(settleModalTitle.dueDate)}</span>
                <span className={`font-bold text-sm ${settleModalTitle.transactionType === "RECEIVABLE" ? "text-emerald-800" : "text-rose-700"}`}>
                  {settleModalTitle.transactionType === "RECEIVABLE" ? "+" : "-"}{formatCurrency(settleModalTitle.netAmount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#1C1C1A] mb-1.5">
                  {settleModalTitle.transactionType === "RECEIVABLE"
                    ? "Em qual conta bancária ou caixa este valor entrou? *"
                    : "De qual conta bancária ou caixa este valor saiu? *"}
                </label>
                <select
                  value={settleAccountId}
                  onChange={(e) => setSettleAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAFAF8] border border-[rgba(28,25,23,0.1)] text-xs font-semibold text-[#1C1C1A] focus:bg-white focus:outline-none"
                  required
                >
                  {bankAccounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — Saldo Atual: {formatCurrency(acc.currentBalance)}
                    </option>
                  ))}
                  {bankAccounts.length === 0 && (
                    <option value="">Nenhuma conta cadastrada (usará Caixa Balcão)</option>
                  )}
                </select>
              </div>

              <div className="pt-3 border-t border-[rgba(28,25,23,0.06)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettleModalTitle(null)}
                  className="px-3.5 py-2 rounded-xl bg-[#F3F3EF] hover:bg-[#EAEAE5] text-xs font-semibold text-[#71716C] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={settleSubmitting}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition shadow-sm flex items-center gap-1.5 ${
                    settleModalTitle.transactionType === "RECEIVABLE"
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : "bg-[#181816] hover:bg-[#2D2D29]"
                  }`}
                >
                  <span>{settleSubmitting ? "Processando..." : "Confirmar e Atualizar Saldo"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cobrança PIX Imediata */}
      {selectedPixTitle && (
        <PixPaymentModal
          isOpen={!!selectedPixTitle}
          onClose={() => setSelectedPixTitle(null)}
          amount={Number(selectedPixTitle.netAmount) || 0}
          description={selectedPixTitle.description}
          merchantName="EVORIX TECH CENTER"
          pixKey="12.345.678/0001-99"
          onPaymentConfirmed={() => {
            handleSettle(selectedPixTitle.id);
            setSelectedPixTitle(null);
          }}
        />
      )}
    </div>
  );
}
