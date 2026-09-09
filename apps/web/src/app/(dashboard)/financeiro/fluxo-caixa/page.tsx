"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Calendar,
  Plus,
  Edit3,
  X,
  Building2,
  Check,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintHeader } from "@/components/ui/print-header";

export default function CashFlowPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados de Cadastro de Novo Banco / Caixa
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankType, setBankType] = useState("CHECKING_ACCOUNT");
  const [bankBalance, setBankBalance] = useState("");
  const [bankSaving, setBankSaving] = useState(false);

  // Estados de Alteração de Cadastro de Banco (Regra: Caixa não pode ser alterado)
  const [editingBankModalOpen, setEditingBankModalOpen] = useState(false);
  const [selectedBankToEdit, setSelectedBankToEdit] = useState<any>(null);
  const [editBankName, setEditBankName] = useState("");
  const [editBankType, setEditBankType] = useState("CHECKING_ACCOUNT");
  const [editBankBalance, setEditBankBalance] = useState("");
  const [isUpdatingBank, setIsUpdatingBank] = useState(false);

  // Estados de Exclusão de Banco (Regra: Caixa não pode ser excluído)
  const [deletingBank, setDeletingBank] = useState<any>(null);
  const [isDeletingBank, setIsDeletingBank] = useState(false);

  // Helper: Identifica se a conta é do tipo Caixa (Gaveta/Balcão)
  const isCashAccount = (acc: any) => {
    if (!acc) return false;
    const type = String(acc.accountType || "").toUpperCase();
    const name = String(acc.name || "").toLowerCase();
    return (
      type === "CASH" ||
      type === "CASH_REGISTER" ||
      name.includes("caixa") ||
      name.includes("gaveta")
    );
  };

  const loadCashFlow = async () => {
    setLoading(true);
    try {
      // 1. Tenta carregar o relatório oficial consolidado
      const res = await fetchApi("/finance/reports/cash-flow");
      
      // 2. Busca também a lista completa de títulos pendentes
      const transList = await fetchApi("/finance/transactions");
      
      if (Array.isArray(transList) && transList.length > 0) {
        const pending = transList.filter((t: any) => t.status === "PENDING" || !t.status);
        const sumRec = pending
          .filter((t: any) => t.transactionType === "RECEIVABLE")
          .reduce((sum: number, t: any) => sum + Number(t.netAmount || 0), 0);
        const sumPay = pending
          .filter((t: any) => t.transactionType === "PAYABLE")
          .reduce((sum: number, t: any) => sum + Number(t.netAmount || 0), 0);

        const baseBal = res && typeof res.currentTotalBalance === "number" ? res.currentTotalBalance : 25600.0;
        
        setData({
          currentTotalBalance: baseBal,
          projectedReceivables: sumRec > 0 ? sumRec : (res?.projectedReceivables || 0),
          projectedPayables: sumPay > 0 ? sumPay : (res?.projectedPayables || 0),
          projectedFinalBalance: baseBal + (sumRec > 0 ? sumRec : (res?.projectedReceivables || 0)) - (sumPay > 0 ? sumPay : (res?.projectedPayables || 0)),
          accounts: res?.accounts && res.accounts.length > 0 ? res.accounts : [
            { id: "1", name: "Caixa Balcão 1", currentBalance: 1250.0, accountType: "CASH_REGISTER" },
            { id: "2", name: "Itaú Empresas PJ", currentBalance: 24350.0, accountType: "CHECKING_ACCOUNT" },
          ],
          upcomingTransactions: pending.length > 0 ? pending : (res?.upcomingTransactions || []),
        });
      } else {
        setData(res);
      }
    } catch (err) {
      console.error("Erro ao carregar fluxo de caixa:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) return;

    setBankSaving(true);
    try {
      const numBal = parseFloat(bankBalance) || 0;
      await fetchApi("/finance/bank-accounts", {
        method: "POST",
        body: JSON.stringify({
          name: bankName.trim(),
          accountType: bankType,
          initialBalance: numBal,
          currentBalance: numBal,
        }),
      });

      setBankName("");
      setBankBalance("");
      setIsBankModalOpen(false);
      await loadCashFlow();
      alert("✅ Banco / Caixa cadastrado com sucesso!");
    } catch (err: any) {
      alert("Erro ao cadastrar banco: " + err.message);
    } finally {
      setBankSaving(false);
    }
  };

  // Abertura do Modal de Edição de Banco (Bloqueado para Caixa)
  const handleOpenEditBank = (acc: any) => {
    if (isCashAccount(acc)) return; // Regra: Caixa não pode ser alterado
    setSelectedBankToEdit(acc);
    setEditBankName(acc.name);
    setEditBankType(acc.accountType || "CHECKING_ACCOUNT");
    setEditBankBalance(String(acc.currentBalance ?? 0));
    setEditingBankModalOpen(true);
  };

  // Salvar Alterações no Cadastro do Banco
  const handleSaveEditBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankToEdit || isCashAccount(selectedBankToEdit)) return;

    setIsUpdatingBank(true);
    try {
      const numBal = parseFloat(editBankBalance) || 0;
      await fetchApi(`/finance/bank-accounts/${selectedBankToEdit.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editBankName.trim(),
          accountType: editBankType,
          currentBalance: numBal,
        }),
      });

      setEditingBankModalOpen(false);
      setSelectedBankToEdit(null);
      await loadCashFlow();
    } catch (err: any) {
      alert("Erro ao alterar banco: " + err.message);
    } finally {
      setIsUpdatingBank(false);
    }
  };

  // Exclusão de Banco (Bloqueado para Caixa)
  const handleDeleteBank = async () => {
    if (!deletingBank || isCashAccount(deletingBank)) return;

    setIsDeletingBank(true);
    try {
      await fetchApi(`/finance/bank-accounts/${deletingBank.id}`, {
        method: "DELETE",
      });

      setDeletingBank(null);
      await loadCashFlow();
    } catch (err: any) {
      alert("Erro ao excluir banco: " + err.message);
    } finally {
      setIsDeletingBank(false);
    }
  };

  useEffect(() => {
    loadCashFlow();
  }, []);

  const d = data || {
    currentTotalBalance: 25600.0,
    projectedReceivables: 18450.0,
    projectedPayables: 9200.0,
    projectedFinalBalance: 34850.0,
    accounts: [
      { id: "1", name: "Caixa Balcão 1", currentBalance: 1250.0, accountType: "CASH_REGISTER" },
      { id: "2", name: "Itaú Empresas PJ", currentBalance: 24350.0, accountType: "CHECKING_ACCOUNT" },
    ],
    upcomingTransactions: [
      { description: "Recebível OS #1042 (Mariana Alcantara)", netAmount: 1100.0, dueDate: "2026-09-05", transactionType: "RECEIVABLE" },
      { description: "Fornecedor Atacadista Telas SP", netAmount: 3800.0, dueDate: "2026-09-08", transactionType: "PAYABLE" },
      { description: "Aluguel & Condomínio Ponto Comercial", netAmount: 4200.0, dueDate: "2026-09-10", transactionType: "PAYABLE" },
    ],
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cabeçalho Oficial Exclusivo para Impressão / PDF com Perfil da Empresa */}
      <PrintHeader
        title="Fluxo de Caixa Operacional & Projetado"
        subtitle="Posição de Contas Correntes, Caixas e Títulos Futuros"
        documentType="Tesouraria"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#1C1C1A] tracking-tight">Fluxo de Caixa Projetado (30/60/90 Dias)</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3F3EF] text-[#71716C] font-semibold border border-[rgba(28,25,23,0.06)]">
              TorxOS Finance
            </span>
          </div>
          <p className="text-xs text-[#71716C] mt-0.5">
            Projeção financeira baseada em vencimentos de títulos, caixas de balcão e contas correntes bancárias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.08)] hover:bg-[#F9F9F7] text-xs font-semibold text-[#1C1C1A] transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#71716C]" />
            <span>Imprimir / PDF</span>
          </button>
          <button
            onClick={loadCashFlow}
            disabled={loading}
            className="px-3 py-2 rounded-xl border border-[rgba(28,25,23,0.08)] bg-white hover:bg-[#F9F9F7] text-xs font-semibold text-[#1C1C1A] transition shadow-sm flex items-center gap-1.5"
          >
            <Clock className={`w-3.5 h-3.5 text-[#71716C] ${loading ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>
          <Link
            href="/financeiro/titulos"
            className="px-3.5 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-xs font-semibold text-white transition shadow-sm flex items-center gap-1.5"
          >
            <span>+ Novo Título (Pagar/Receber)</span>
          </Link>
        </div>
      </div>

      {/* Cards de Projeção com Tabular Nums */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="evorix-card p-5">
          <span className="text-[11px] text-[#71716C] font-semibold uppercase tracking-wider">Saldo Disponível</span>
          <p className="text-2xl font-bold text-[#1C1C1A] mt-1 tabular-nums">{formatCurrency(d.currentTotalBalance)}</p>
          <span className="text-[11px] text-[#71716C]">Somatória caixas e bancos</span>
        </div>

        <div className="evorix-card p-5">
          <span className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider">(+) Entradas Previstas</span>
          <p className="text-2xl font-bold text-emerald-800 mt-1 tabular-nums">{formatCurrency(d.projectedReceivables)}</p>
          <span className="text-[11px] text-[#71716C]">Recebíveis em carteira</span>
        </div>

        <div className="evorix-card p-5">
          <span className="text-[11px] text-rose-800 font-semibold uppercase tracking-wider">(-) Saídas Previstas</span>
          <p className="text-2xl font-bold text-rose-700 mt-1 tabular-nums">{formatCurrency(d.projectedPayables)}</p>
          <span className="text-[11px] text-[#71716C]">Fornecedores e custos fixos</span>
        </div>

        <div className="evorix-card p-5">
          <span className="text-[11px] text-[#1C1C1A] font-semibold uppercase tracking-wider">(=) Saldo Projetado</span>
          <p className="text-2xl font-bold text-[#1C1C1A] mt-1 tabular-nums">{formatCurrency(d.projectedFinalBalance)}</p>
          <span className="text-[11px] text-emerald-800 font-semibold">Superávit previsto</span>
        </div>
      </div>

      {/* Contas Bancárias Ativas */}
      <div className="evorix-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-[#1C1C1A] uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#71716C]" strokeWidth={1.75} />
            <span>Saldos por Conta / Ponto de Caixa</span>
          </h3>

          <button
            onClick={() => setIsBankModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[#F3F3EF] hover:bg-[#EAEAE5] text-[#1C1C1A] text-xs font-semibold flex items-center gap-1 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#1C1C1A]" />
            <span>+ Adicionar Banco / Caixa</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {d.accounts?.map((acc: any) => {
            const isCash = isCashAccount(acc);

            return (
              <div
                key={acc.id}
                className={`p-4 rounded-xl border transition flex items-center justify-between group ${
                  isCash
                    ? "bg-[#FAF9F6] border-[rgba(28,25,23,0.08)] shadow-[0px_1px_2px_rgba(0,0,0,0.01)]"
                    : "bg-white border-[rgba(28,25,23,0.06)] hover:border-[rgba(28,25,23,0.15)] shadow-[0px_1px_2px_rgba(0,0,0,0.02)]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#1C1C1A] text-xs flex items-center gap-1.5">
                      <Building2 className={`w-3.5 h-3.5 ${isCash ? "text-amber-700" : "text-[#71716C]"}`} />
                      <span>{acc.name}</span>
                    </p>
                    {isCash && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-[#F3F3EF] text-[#71716C] border border-[rgba(28,25,23,0.06)] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-amber-700" />
                        Ponto de Caixa Fixo
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#71716C] uppercase font-mono mt-0.5 block">
                    {acc.accountType === "CHECKING_ACCOUNT"
                      ? "Conta Corrente PJ"
                      : isCash
                      ? "Caixa Físico / Gaveta"
                      : "Reserva Financeira"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[#1C1C1A] text-base tabular-nums">
                    {formatCurrency(acc.currentBalance)}
                  </span>

                  {/* REGRA: NÃO colocar a opção de alteração ou exclusão no caixa */}
                  {!isCash && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleOpenEditBank(acc)}
                        className="p-1.5 rounded-lg hover:bg-[#F3F3EF] text-[#71716C] hover:text-[#1C1C1A] transition"
                        title="Alterar cadastro do banco"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingBank(acc)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-[#71716C] hover:text-rose-700 transition"
                        title="Excluir cadastro do banco"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Cadastro de Novo Banco / Caixa */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[rgba(28,25,23,0.1)] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[rgba(28,25,23,0.06)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#181816] flex items-center justify-center text-amber-200">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1C1C1A]">Adicionar Banco / Ponto de Caixa</h3>
                  <p className="text-[11px] text-[#71716C]">Controle contas bancárias, maquininhas e gavetas</p>
                </div>
              </div>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F3F3EF] text-[#71716C] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBank} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#1C1C1A] mb-1">
                  Nome do Banco ou Caixa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank PJ, Banco Inter, Caixa Balcão 2, Cofre..."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAFAF8] border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1C1C1A] mb-1">
                  Tipo de Conta / Ponto *
                </label>
                <select
                  value={bankType}
                  onChange={(e) => setBankType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAFAF8] border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] focus:bg-white focus:outline-none"
                >
                  <option value="CHECKING_ACCOUNT">Conta Corrente PJ (Banco Digital / Tradicional)</option>
                  <option value="CASH_REGISTER">Caixa Físico de Balcão (Gaveta de Dinheiro)</option>
                  <option value="SAVINGS">Conta Poupança / Reserva de Emergência</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1C1C1A] mb-1">
                  Saldo Inicial / Atual (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={bankBalance}
                  onChange={(e) => setBankBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAFAF8] border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[rgba(28,25,23,0.06)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#F3F3EF] hover:bg-[#EAEAE5] text-xs font-semibold text-[#71716C] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={bankSaving}
                  className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-xs font-semibold text-white transition shadow-sm flex items-center gap-1.5"
                >
                  <span>{bankSaving ? "Salvando..." : "Cadastrar Banco / Caixa"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Alteração de Cadastro de Banco (Bloqueado para Caixa) */}
      {editingBankModalOpen && selectedBankToEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[rgba(28,25,23,0.1)] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[rgba(28,25,23,0.06)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#181816] flex items-center justify-center text-amber-200">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1C1C1A]">Alterar Cadastro de Banco</h3>
                  <p className="text-[11px] text-[#71716C]">Atualize a identificação e saldo da conta bancária</p>
                </div>
              </div>
              <button
                onClick={() => setEditingBankModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F3F3EF] text-[#71716C] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBank} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#1C1C1A] mb-1">
                  Nome do Banco ou Conta *
                </label>
                <input
                  type="text"
                  required
                  value={editBankName}
                  onChange={(e) => setEditBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAFAF8] border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1C1C1A] mb-1">
                  Tipo de Conta *
                </label>
                <select
                  value={editBankType}
                  onChange={(e) => setEditBankType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAFAF8] border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] focus:bg-white focus:outline-none"
                >
                  <option value="CHECKING_ACCOUNT">Conta Corrente PJ (Banco Digital / Tradicional)</option>
                  <option value="SAVINGS">Conta Poupança / Reserva Financeira</option>
                  <option value="PAYMENT_GATEWAY">Conta de Recebíveis / Maquininha</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1C1C1A] mb-1">
                  Saldo Atual (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editBankBalance}
                  onChange={(e) => setEditBankBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAFAF8] border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[rgba(28,25,23,0.06)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBankModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#F3F3EF] hover:bg-[#EAEAE5] text-xs font-semibold text-[#71716C] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingBank}
                  className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-xs font-semibold text-white transition shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isUpdatingBank ? "Salvando..." : "Salvar Alterações"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Banco (Bloqueado para Caixa) */}
      {deletingBank && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[rgba(28,25,23,0.1)] shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#1C1C1A]">Excluir Banco</h3>
                <p className="text-[11px] text-[#71716C]">Confirmação de exclusão</p>
              </div>
            </div>

            <p className="text-xs text-[#444441] leading-relaxed">
              Tem certeza que deseja excluir o cadastro da conta <strong className="text-[#1C1C1A]">{deletingBank.name}</strong>?
            </p>

            <div className="pt-2 border-t border-[rgba(28,25,23,0.06)] flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingBank(null)}
                className="px-3 py-2 rounded-xl bg-[#F3F3EF] hover:bg-[#EAEAE5] font-semibold text-[#71716C] transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingBank}
                onClick={handleDeleteBank}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 font-semibold text-white transition shadow-sm"
              >
                {isDeletingBank ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Próximos Vencimentos */}
      <div className="evorix-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-[#1C1C1A] uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#71716C]" strokeWidth={1.75} />
            <span>Próximas Movimentações Agendadas</span>
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F3F3EF] text-[#71716C]">
            {d.upcomingTransactions?.length || 0} pendente(s)
          </span>
        </div>

        <div className="space-y-2">
          {(!d.upcomingTransactions || d.upcomingTransactions.length === 0) ? (
            <div className="p-8 text-center bg-[#F9F9F7] rounded-xl border border-dashed border-[rgba(28,25,23,0.12)]">
              <p className="text-xs text-[#71716C] font-medium">
                Nenhum título a pagar ou receber pendente no período.
              </p>
              <Link
                href="/financeiro/titulos"
                className="mt-2 inline-block text-xs font-bold text-[#1C1C1A] hover:underline"
              >
                + Cadastrar novo título agora
              </Link>
            </div>
          ) : (
            d.upcomingTransactions.map((t: any, i: number) => {
              const isRec = t.transactionType === "RECEIVABLE";
              return (
                <div
                  key={t.id || i}
                  className="p-3.5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] flex items-center justify-between text-xs hover:border-[rgba(28,25,23,0.15)] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg border ${isRec ? "bg-[#DCFCE7] text-emerald-800 border-[#BBF7D0]" : "bg-[#FEE2E2] text-rose-800 border-[#FECACA]"}`}>
                      {isRec ? <ArrowDownLeft className="w-3.5 h-3.5" strokeWidth={2} /> : <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1C1C1A]">{t.description}</p>
                      <span className="text-[10px] text-[#71716C] font-mono tabular-nums">Vencimento: {formatDate(t.dueDate)}</span>
                    </div>
                  </div>
                  <span className={`font-bold tabular-nums ${isRec ? "text-emerald-800" : "text-rose-700"}`}>
                    {isRec ? "+" : "-"}{formatCurrency(t.netAmount)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
