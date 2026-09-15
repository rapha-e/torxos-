"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  Plus,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  Receipt,
  DollarSign,
  TrendingUp,
  Package,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  Lock,
  UserCheck,
  FileDown,
  X,
  ShieldAlert,
} from "lucide-react";
import { fetchApi, getCurrentUser } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintHeader } from "@/components/ui/print-header";

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Modais de Venda
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<any | null>(null);
  const [printMode, setPrintMode] = useState<"THERMAL" | "A4">("THERMAL");

  // Modal de Cancelamento de Venda
  const [saleToCancel, setSaleToCancel] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState("");

  const currentUser = getCurrentUser();
  const isAdminUser = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

  const [companyProfile, setCompanyProfile] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("torxos_company_profile");
      if (cached) {
        try { return JSON.parse(cached); } catch {}
      }
    }
    return {
      tradeName: currentUser?.tenantName || "Assistência Técnica",
      document: "",
      phone: "",
      address: "",
      logoUrl: "",
    };
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const queryParams: string[] = [];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (paymentFilter) queryParams.push(`paymentMethod=${paymentFilter}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      const [salesData, summaryData, tenantData] = await Promise.all([
        fetchApi(`/sales${queryString}`),
        fetchApi("/sales/daily-summary").catch(() => null),
        fetchApi("/tenant/settings").catch(() => null),
      ]);

      setSales(Array.isArray(salesData) ? salesData : []);
      setSummary(summaryData);
      if (tenantData) {
        setCompanyProfile(tenantData);
      }
    } catch (err: any) {
      console.error("Erro ao carregar histórico de vendas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [paymentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Dispara Impressão do Cupom Térmico (80mm) isolado
  const handlePrintThermal = (sale: any) => {
    setSelectedSaleForPrint(sale);
    setPrintMode("THERMAL");

    document.body.classList.remove("printing-a4");
    document.body.classList.add("printing-receipt");

    setTimeout(() => {
      window.print();
      const cleanUp = () => {
        document.body.classList.remove("printing-receipt");
        window.removeEventListener("afterprint", cleanUp);
      };
      window.addEventListener("afterprint", cleanUp);
      // Fallback
      setTimeout(() => document.body.classList.remove("printing-receipt"), 1500);
    }, 150);
  };

  // Dispara Impressão Normal (A4) isolada
  const handlePrintA4 = (sale: any) => {
    setSelectedSaleForPrint(sale);
    setPrintMode("A4");

    document.body.classList.remove("printing-receipt");
    document.body.classList.add("printing-a4");

    setTimeout(() => {
      window.print();
      const cleanUp = () => {
        document.body.classList.remove("printing-a4");
        window.removeEventListener("afterprint", cleanUp);
      };
      window.addEventListener("afterprint", cleanUp);
      // Fallback
      setTimeout(() => document.body.classList.remove("printing-a4"), 1500);
    }, 150);
  };

  // Abre Modal de Cancelamento
  const handleOpenCancelModal = (sale: any) => {
    setSaleToCancel(sale);
    setCancelReason("");
    setAdminEmail(isAdminUser ? (currentUser?.email || "") : "");
    setAdminPassword("");
    setCancelError("");
    setCancelSuccess("");
  };

  // Executa Cancelamento com Autorização Admin e Sincronização de Caixa
  const handleConfirmCancelSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToCancel) return;

    if (!cancelReason.trim() || cancelReason.trim().length < 3) {
      setCancelError("Por favor, justifique o motivo do cancelamento (mínimo 3 caracteres).");
      return;
    }

    if (!adminPassword.trim()) {
      setCancelError("A senha de autorização do administrador é obrigatória.");
      return;
    }

    if (!isAdminUser && !adminEmail.trim()) {
      setCancelError("O e-mail do administrador autorizador é obrigatório.");
      return;
    }

    setCancelLoading(true);
    setCancelError("");

    try {
      const payload: any = {
        reason: cancelReason.trim(),
        adminPassword: adminPassword.trim(),
      };
      if (!isAdminUser) {
        payload.adminEmail = adminEmail.trim();
      }

      await fetchApi(`/sales/${saleToCancel.id}/cancel`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setCancelSuccess("Venda cancelada com sucesso! O estoque e o caixa financeiro foram estornados.");
      setTimeout(() => {
        setSaleToCancel(null);
        setSelectedSaleForPrint(null);
        loadData();
      }, 1200);
    } catch (err: any) {
      setCancelError(err.message || "Falha ao autorizar o cancelamento da venda. Verifique as credenciais.");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Cabeçalho Oficial Exclusivo para Impressão / PDF do Relatório A4 */}
      {!selectedSaleForPrint && (
        <PrintHeader
          title="Relatório de Vendas de Balcão & Acessórios"
          subtitle={`Histórico de Vendas • Total de ${sales.length} transação(ões) listada(s)`}
          documentType="Comercial / PDV"
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1C1C1A] tracking-tight">Vendas de Balcão & Acessórios</h1>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#F3F3EF] text-[#71716C] border border-[rgba(28,25,23,0.06)]">
              PDV Conectado
            </span>
          </div>
          <p className="text-xs text-[#71716C] mt-0.5">
            Registro de faturamento, controle de caixa, emissão de comprovantes e cancelamento auditado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.08)] hover:bg-[#F9F9F7] text-xs font-semibold text-[#1C1C1A] transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#71716C]" />
            <span>Imprimir Relatório</span>
          </button>
          <button
            onClick={loadData}
            title="Atualizar lista"
            className="p-2 rounded-xl border border-[rgba(28,25,23,0.12)] text-[#71716C] hover:text-[#1C1C1A] hover:bg-[#F3F3EF] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/vendas/pdv"
            className="px-4 py-2 rounded-xl bg-[#1C1C1A] text-white hover:bg-black transition text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Abrir Frente de Caixa (PDV)</span>
          </Link>
        </div>
      </div>

      {/* Métricas do Caixa do Dia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print print:hidden">
        <div className="bg-white p-4 rounded-2xl border border-[rgba(28,25,23,0.08)] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71716C]">
            <span className="font-medium">Faturamento Balcão Hoje</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-[#1C1C1A] font-mono">
            {formatCurrency(summary?.totalRevenue || 0)}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">Entrada de caixa direta</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[rgba(28,25,23,0.08)] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71716C]">
            <span className="font-medium">Vendas Concluídas</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-[#1C1C1A] font-mono">
            {summary?.totalSalesCount || 0}
          </div>
          <span className="text-[11px] text-[#71716C]">Hoje no balcão</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[rgba(28,25,23,0.08)] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71716C]">
            <span className="font-medium">Ticket Médio de Venda</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-[#1C1C1A] font-mono">
            {formatCurrency(summary?.avgTicket || 0)}
          </div>
          <span className="text-[11px] text-[#71716C]">Por atendimento</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[rgba(28,25,23,0.08)] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71716C]">
            <span className="font-medium">Itens Baixados do Estoque</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-[#1C1C1A] font-mono">
            {summary?.totalItemsSold || 0} <span className="text-xs font-normal text-[#71716C]">un</span>
          </div>
          <span className="text-[11px] text-indigo-700 font-medium">Baixa atômica</span>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white p-3 rounded-2xl border border-[rgba(28,25,23,0.08)] shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between no-print print:hidden">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#A1A19B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, produto, IMEI ou anotações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] rounded-xl text-xs text-[#1C1C1A] placeholder:text-[#A1A19B] focus:outline-none focus:bg-white focus:border-[#1C1C1A] transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white transition"
          >
            <option value="">Todas as Formas de Pagamento</option>
            <option value="PIX">Pix Instantâneo</option>
            <option value="CREDIT_CARD">Cartão de Crédito</option>
            <option value="DEBIT_CARD">Cartão de Débito</option>
            <option value="CASH">Dinheiro em Espécie</option>
          </select>
        </div>
      </div>

      {/* Tabela do Histórico de Vendas */}
      <div className="bg-white rounded-2xl border border-[rgba(28,25,23,0.08)] shadow-sm overflow-hidden no-print print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[rgba(28,25,23,0.06)] bg-[#FDFDFD] text-[#71716C] font-medium">
                <th className="py-3 px-4">Venda</th>
                <th className="py-3 px-4">Data/Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Itens Vendidos (Baixados)</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4">Total Líquido</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(28,25,23,0.06)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#71716C]">
                    Carregando histórico de vendas...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#71716C]">
                    Nenhuma venda registrada até o momento.
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className={`hover:bg-[#F9F9F7] transition ${s.status === "CANCELED" ? "bg-rose-50/30 opacity-80" : ""}`}>
                    <td className="py-3 px-4 font-mono font-bold text-[#1C1C1A]">
                      #{s.saleNumber}
                    </td>
                    <td className="py-3 px-4 text-[#71716C]">
                      {new Date(s.createdAt).toLocaleDateString("pt-BR")}{" "}
                      <span className="text-[10px]">
                        {new Date(s.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {s.client ? (
                        <div>
                          <span className="font-semibold text-[#1C1C1A] block">{s.client.name}</span>
                          {s.client.phone && <span className="text-[10px] text-[#71716C] font-mono">{s.client.phone}</span>}
                        </div>
                      ) : (
                        <span className="text-[#71716C] italic font-normal">Consumidor Final</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#1C1C1A] max-w-xs">
                      {s.items && s.items.length > 0 ? (
                        <div className="space-y-0.5">
                          {s.items.map((it: any, idx: number) => (
                            <div key={idx} className="truncate">
                              <span className="font-semibold">{Number(it.quantity)}x</span> {it.product?.name || "Produto"}
                              {it.imeiOrSerial && (
                                <span className="text-[10px] font-mono text-indigo-600 block">
                                  IMEI: {it.imeiOrSerial}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#71716C] italic">Sem itens</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F3F3EF] text-[#71716C] border border-[rgba(28,25,23,0.06)]">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1C1C1A]">
                      <span className={s.status === "CANCELED" ? "line-through text-rose-700" : "text-emerald-700"}>
                        {formatCurrency(s.netTotal)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {s.status === "COMPLETED" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Concluída</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Cancelada</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedSaleForPrint(s);
                            setPrintMode("THERMAL");
                          }}
                          title="Ver Comprovante de Venda"
                          className="p-1.5 rounded-lg border border-[rgba(28,25,23,0.12)] text-[#1C1C1A] hover:bg-[#F3F3EF] transition inline-flex items-center gap-1 text-xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#71716C]" />
                          <span className="hidden sm:inline">Comprovante</span>
                        </button>

                        {s.status === "COMPLETED" && (
                          <button
                            onClick={() => handleOpenCancelModal(s)}
                            title="Cancelar Venda (Requer Admin)"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition inline-flex items-center gap-1 text-xs"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Cancelar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE COMPROVANTE DE VENDA (COM OPÇÃO DE 80MM E A4)                    */}
      {/* ========================================================================= */}
      {selectedSaleForPrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[rgba(28,25,23,0.12)] shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(28,25,23,0.08)]">
              <div>
                <span className="text-xs font-bold text-[#1C1C1A] block">
                  Comprovante de Venda #{selectedSaleForPrint.saleNumber}
                </span>
                <span className="text-[11px] text-[#71716C]">
                  {selectedSaleForPrint.status === "CANCELED" ? "Venda Estornada & Cancelada" : "Venda Concluída"}
                </span>
              </div>
              <button
                onClick={() => setSelectedSaleForPrint(null)}
                className="text-xs text-[#71716C] hover:text-[#1C1C1A] cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {/* Tarja de Venda Cancelada se for o caso */}
            {selectedSaleForPrint.status === "CANCELED" && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs text-rose-900">
                <div className="flex items-center gap-1.5 font-bold text-rose-700">
                  <ShieldAlert className="w-4 h-4" />
                  <span>ESTA VENDA FOI CANCELADA E AUDITADA</span>
                </div>
                <p className="text-[11px]">
                  <strong>Motivo:</strong> {selectedSaleForPrint.cancelReason || "Não especificado"}
                </p>
                {selectedSaleForPrint.authorizedByName && (
                  <p className="text-[10px] text-rose-700 font-mono">
                    Autorizado por: {selectedSaleForPrint.authorizedByName}
                  </p>
                )}
                {selectedSaleForPrint.canceledAt && (
                  <p className="text-[10px] text-rose-700 font-mono">
                    Data do Cancelamento: {new Date(selectedSaleForPrint.canceledAt).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
            )}

            {/* Preview Visual do Cupom */}
            <div className="bg-[#FAFAFA] p-4 rounded-xl border border-dashed border-gray-300 font-mono text-[11px] text-[#1C1C1A] space-y-2.5">
              {/* Topo / Loja */}
              <div className="text-center pb-2 border-b border-dashed border-gray-300 space-y-0.5">
                {companyProfile?.logoUrl && (
                  <img
                    src={companyProfile.logoUrl}
                    alt="Logo"
                    className="max-h-10 max-w-[100px] object-contain mx-auto mb-1"
                  />
                )}
                <h4 className="font-bold text-xs uppercase">{companyProfile?.tradeName || "Assistência Técnica"}</h4>
                {companyProfile?.document && <p className="text-[9px] text-[#71716C]">CNPJ/CPF: {companyProfile.document}</p>}
                {companyProfile?.phone && <p className="text-[9px] text-[#71716C]">Tel: {companyProfile.phone}</p>}
                <p className="text-[10px] font-bold mt-1">COMPROVANTE DE VENDA DE BALCÃO</p>
                <p className="text-[9px] text-[#71716C]">
                  Venda #{selectedSaleForPrint.saleNumber} • {new Date(selectedSaleForPrint.createdAt).toLocaleDateString("pt-BR")}{" "}
                  {new Date(selectedSaleForPrint.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* DADOS DO CLIENTE */}
              <div className="py-1.5 border-b border-dashed border-gray-300 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">CLIENTE:</span>
                  <span className="font-bold">{selectedSaleForPrint.client?.name || "Consumidor Final"}</span>
                </div>
                {selectedSaleForPrint.client?.document && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPF/CNPJ:</span>
                    <span>{selectedSaleForPrint.client.document}</span>
                  </div>
                )}
                {selectedSaleForPrint.client?.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">TELEFONE:</span>
                    <span>{selectedSaleForPrint.client.phone}</span>
                  </div>
                )}
              </div>

              {/* ITENS */}
              <div className="space-y-1 py-1 border-b border-dashed border-gray-300">
                {selectedSaleForPrint.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between leading-tight">
                    <div>
                      <span>{Number(item.quantity)}x {item.product?.name || "Produto"}</span>
                      {item.imeiOrSerial && (
                        <span className="block text-[9px] text-gray-500 font-mono">IMEI: {item.imeiOrSerial}</span>
                      )}
                    </div>
                    <span className="font-bold">{formatCurrency(item.totalAmount)}</span>
                  </div>
                ))}
              </div>

              {/* TOTAIS */}
              <div className="space-y-1 text-xs font-bold pt-1">
                <div className="flex justify-between">
                  <span>TOTAL PAGO:</span>
                  <span className={`text-sm ${selectedSaleForPrint.status === "CANCELED" ? "line-through text-rose-700" : ""}`}>
                    {formatCurrency(selectedSaleForPrint.netTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-normal text-gray-600">
                  <span>FORMA:</span>
                  <span>{selectedSaleForPrint.paymentMethod}</span>
                </div>
                {Number(selectedSaleForPrint.changeAmount) > 0 && (
                  <div className="flex justify-between text-[10px] font-normal text-gray-600">
                    <span>TROCO:</span>
                    <span>{formatCurrency(selectedSaleForPrint.changeAmount)}</span>
                  </div>
                )}
              </div>

              {/* RODAPÉ */}
              <div className="text-center pt-2 border-t border-dashed border-gray-300 text-[9px] text-gray-500">
                <p>Garantia de 90 dias com este cupom.</p>
                <p>Agradecemos a preferência!</p>
              </div>
            </div>

            {/* BOTÕES DE IMPRESSÃO: TÉRMICA 80MM E IMPRESSÃO NORMAL A4 */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => handlePrintThermal(selectedSaleForPrint)}
                  className="py-2.5 px-3 rounded-xl bg-[#1C1C1A] text-white hover:bg-black font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Recibo (80mm)</span>
                </button>
                <button
                  onClick={() => handlePrintA4(selectedSaleForPrint)}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Imprimir Normal (A4)</span>
                </button>
              </div>

              {selectedSaleForPrint.status === "COMPLETED" && (
                <button
                  onClick={() => {
                    setSelectedSaleForPrint(null);
                    handleOpenCancelModal(selectedSaleForPrint);
                  }}
                  className="w-full py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancelar Esta Venda (Estorno Caixa & Estoque)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CANCELAMENTO DE VENDA COM AUTORIZAÇÃO DE ADMINISTRADOR           */}
      {/* ========================================================================= */}
      {saleToCancel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[rgba(28,25,23,0.12)] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            {/* Top Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(28,25,23,0.08)]">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-bold text-[#1C1C1A]">Cancelar Venda #{saleToCancel.saleNumber}</h3>
              </div>
              <button
                onClick={() => setSaleToCancel(null)}
                className="text-xs text-[#71716C] hover:text-[#1C1C1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ALERTA CRÍTICO DE SINCRONIZAÇÃO DE CAIXA E ESTOQUE */}
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs text-amber-950">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>ATENÇÃO: SINCRONIZAÇÃO FINANCEIRA & ESTOQUE</span>
              </div>
              <p className="leading-relaxed">
                Ao confirmar este cancelamento:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-900">
                <li>
                  O valor de <strong className="text-rose-700 font-mono">{formatCurrency(saleToCancel.netTotal)}</strong> será <strong>debitado/estornado automaticamente do Caixa da Loja</strong>.
                </li>
                <li>
                  Os itens vendidos serão <strong>devolvidos atomicamente ao estoque físico</strong>.
                </li>
                <li>
                  A ação ficará <strong>permanentemente gravada no log de auditoria</strong> da empresa.
                </li>
              </ul>
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{cancelError}</span>
              </div>
            )}

            {cancelSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{cancelSuccess}</span>
              </div>
            )}

            <form onSubmit={handleConfirmCancelSale} className="space-y-3.5">
              {/* Motivo Obrigatório */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1C1A]">
                  Motivo / Justificativa do Cancelamento <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Desistência do cliente / Devolução no balcão"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white focus:border-[#1C1C1A]"
                />
              </div>

              {/* Autorização do Administrador */}
              <div className="p-3 bg-[#F9F9F7] rounded-xl border border-[rgba(28,25,23,0.08)] space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1C1A]">
                  <Lock className="w-3.5 h-3.5 text-[#71716C]" />
                  <span>Autorização Obrigatória de Administrador</span>
                </div>

                {!isAdminUser ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#71716C]">E-mail do Administrador:</label>
                      <input
                        type="email"
                        required
                        placeholder="admin@loja.com.br"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[rgba(28,25,23,0.12)] rounded-lg text-xs text-[#1C1C1A] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#71716C]">Senha do Administrador:</label>
                      <input
                        type="password"
                        required
                        placeholder="Digite a senha do admin..."
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[rgba(28,25,23,0.12)] rounded-lg text-xs text-[#1C1C1A] focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[11px] text-[#71716C]">
                      Conectado como Administrador (<strong>{currentUser?.name}</strong>). Digite sua senha para confirmar:
                    </p>
                    <input
                      type="password"
                      required
                      placeholder="Digite sua senha de administrador..."
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[rgba(28,25,23,0.12)] rounded-lg text-xs text-[#1C1C1A] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSaleToCancel(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(28,25,23,0.12)] text-[#1C1C1A] hover:bg-[#F3F3EF] font-bold text-xs transition"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{cancelLoading ? "Estornando Caixa..." : "Autorizar e Cancelar"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPONENTE ISOLADO DE IMPRESSÃO: RECIBO TÉRMICO (80MM)                    */}
      {/* ========================================================================= */}
      {selectedSaleForPrint && (
        <div id="thermal-receipt" className="hidden">
          <div style={{ fontFamily: "monospace", fontSize: "11px", lineHeight: "1.3", color: "#000" }}>
            {/* Cabeçalho */}
            <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px" }}>
              <div style={{ fontWeight: "bold", fontSize: "13px", textTransform: "uppercase" }}>
                {companyProfile?.tradeName || "ASSISTÊNCIA TÉCNICA"}
              </div>
              {companyProfile?.document && <div>CNPJ/CPF: {companyProfile.document}</div>}
              {companyProfile?.phone && <div>Tel: {companyProfile.phone}</div>}
              {companyProfile?.address && <div>{companyProfile.address}</div>}
              <div style={{ fontWeight: "bold", marginTop: "4px" }}>
                {selectedSaleForPrint.status === "CANCELED" ? "COMPROVANTE DE VENDA CANCELADA" : "COMPROVANTE DE VENDA DE BALCÃO"}
              </div>
              <div>
                Venda #{selectedSaleForPrint.saleNumber} • {new Date(selectedSaleForPrint.createdAt).toLocaleDateString("pt-BR")}{" "}
                {new Date(selectedSaleForPrint.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            {/* Tarja de Cancelamento se for o caso */}
            {selectedSaleForPrint.status === "CANCELED" && (
              <div style={{ border: "2px solid #000", padding: "4px", textAlign: "center", fontWeight: "bold", margin: "6px 0" }}>
                *** VENDA CANCELADA / ESTORNADA ***
                <div style={{ fontSize: "10px", fontWeight: "normal" }}>
                  Motivo: {selectedSaleForPrint.cancelReason}
                </div>
                {selectedSaleForPrint.authorizedByName && (
                  <div style={{ fontSize: "9px", fontWeight: "normal" }}>
                    Autorizado por: {selectedSaleForPrint.authorizedByName}
                  </div>
                )}
              </div>
            )}

            {/* DADOS DO CLIENTE */}
            <div style={{ borderBottom: "1px dashed #000", paddingBottom: "5px", marginBottom: "5px" }}>
              <div><strong>CLIENTE:</strong> {selectedSaleForPrint.client?.name || "Consumidor Final"}</div>
              {selectedSaleForPrint.client?.document && (
                <div><strong>CPF/CNPJ:</strong> {selectedSaleForPrint.client.document}</div>
              )}
              {selectedSaleForPrint.client?.phone && (
                <div><strong>TEL:</strong> {selectedSaleForPrint.client.phone}</div>
              )}
            </div>

            {/* ITENS */}
            <div style={{ borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginBottom: "4px" }}>
                <span>ITEM</span>
                <span>TOTAL</span>
              </div>
              {selectedSaleForPrint.items?.map((it: any, i: number) => (
                <div key={i} style={{ marginBottom: "3px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{Number(it.quantity)}x {it.product?.name || "Item"}</span>
                    <span>{formatCurrency(it.totalAmount)}</span>
                  </div>
                  {it.imeiOrSerial && (
                    <div style={{ fontSize: "9px" }}>IMEI: {it.imeiOrSerial}</div>
                  )}
                </div>
              ))}
            </div>

            {/* TOTALIZAÇÃO */}
            <div style={{ borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px" }}>
                <span>TOTAL PAGO:</span>
                <span>{formatCurrency(selectedSaleForPrint.netTotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                <span>FORMA DE PAGTO:</span>
                <span>{selectedSaleForPrint.paymentMethod}</span>
              </div>
              {Number(selectedSaleForPrint.changeAmount) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                  <span>TROCO:</span>
                  <span>{formatCurrency(selectedSaleForPrint.changeAmount)}</span>
                </div>
              )}
            </div>

            {/* GARANTIA E ASSINATURA */}
            <div style={{ textAlign: "center", fontSize: "9px", paddingTop: "4px" }}>
              <p>Garantia legal de 90 dias com este comprovante.</p>
              <p>Agradecemos a preferência!</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPONENTE ISOLADO DE IMPRESSÃO: DOCUMENTO NORMAL (FOLHA A4)             */}
      {/* ========================================================================= */}
      {selectedSaleForPrint && (
        <div id="a4-sale-document" className="hidden">
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11pt", color: "#111", lineHeight: "1.4" }}>
            {/* Cabeçalho A4 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #111", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <h1 style={{ margin: "0 0 4px 0", fontSize: "16pt", fontWeight: "bold", textTransform: "uppercase" }}>
                  {companyProfile?.tradeName || "Assistência Técnica"}
                </h1>
                {companyProfile?.legalName && <div style={{ fontSize: "9pt", color: "#555" }}>{companyProfile.legalName}</div>}
                {companyProfile?.document && <div style={{ fontSize: "9pt" }}>CNPJ/CPF: {companyProfile.document}</div>}
                {companyProfile?.phone && <div style={{ fontSize: "9pt" }}>Tel / WhatsApp: {companyProfile.phone}</div>}
                {companyProfile?.address && <div style={{ fontSize: "9pt" }}>Endereço: {companyProfile.address}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14pt", fontWeight: "bold" }}>
                  {selectedSaleForPrint.status === "CANCELED" ? "COMPROVANTE DE VENDA CANCELADA" : "DOCUMENTO DE VENDA DE BALCÃO"}
                </div>
                <div style={{ fontSize: "12pt", fontWeight: "bold", color: "#000", marginTop: "4px" }}>
                  Nº {selectedSaleForPrint.saleNumber}
                </div>
                <div style={{ fontSize: "9pt", color: "#555" }}>
                  Data: {new Date(selectedSaleForPrint.createdAt).toLocaleDateString("pt-BR")} às{" "}
                  {new Date(selectedSaleForPrint.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>

            {/* Tarja de Cancelamento se for o caso */}
            {selectedSaleForPrint.status === "CANCELED" && (
              <div style={{ border: "2px solid #b91c1c", backgroundColor: "#fef2f2", color: "#991b1b", padding: "10px", borderRadius: "6px", marginBottom: "16px", fontWeight: "bold" }}>
                ATENÇÃO: ESTA VENDA FOI CANCELADA E ESTORNADA NO CAIXA E NO ESTOQUE.
                <div style={{ fontSize: "9pt", fontWeight: "normal", marginTop: "4px" }}>
                  <strong>Motivo:</strong> {selectedSaleForPrint.cancelReason} | <strong>Autorizado por:</strong> {selectedSaleForPrint.authorizedByName || "Administrador"}
                </div>
              </div>
            )}

            {/* Quadro de Dados do Cliente */}
            <div style={{ border: "1px solid #ccc", borderRadius: "6px", padding: "10px", marginBottom: "16px", backgroundColor: "#fcfcfc" }}>
              <div style={{ fontWeight: "bold", fontSize: "10pt", borderBottom: "1px solid #e5e5e5", paddingBottom: "4px", marginBottom: "6px" }}>
                DADOS DO CLIENTE / COMPRADOR
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "9.5pt" }}>
                <div><strong>Nome / Razão Social:</strong> {selectedSaleForPrint.client?.name || "Consumidor Final"}</div>
                <div><strong>CPF / CNPJ:</strong> {selectedSaleForPrint.client?.document || "Não informado"}</div>
                <div><strong>Telefone / WhatsApp:</strong> {selectedSaleForPrint.client?.phone || "Não informado"}</div>
                <div><strong>E-mail:</strong> {selectedSaleForPrint.client?.email || "Não informado"}</div>
                <div style={{ gridColumn: "span 2" }}>
                  <strong>Endereço:</strong> {selectedSaleForPrint.client?.address || "Não informado"}
                </div>
              </div>
            </div>

            {/* Grade de Itens */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "9.5pt" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f3f3", borderBottom: "1px solid #ccc" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>Item / Descrição do Produto</th>
                  <th style={{ padding: "8px", textAlign: "center", width: "70px" }}>Qtd</th>
                  <th style={{ padding: "8px", textAlign: "right", width: "110px" }}>Valor Unit.</th>
                  <th style={{ padding: "8px", textAlign: "right", width: "110px" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSaleForPrint.items?.map((it: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>
                      <strong>{it.product?.name || "Produto"}</strong>
                      {it.imeiOrSerial && (
                        <span style={{ display: "block", fontSize: "8.5pt", color: "#555" }}>
                          IMEI / Serial: {it.imeiOrSerial}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }}>{Number(it.quantity)}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>{formatCurrency(it.unitPrice)}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>{formatCurrency(it.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totalizadores */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
              <div style={{ width: "260px", border: "1px solid #ccc", borderRadius: "6px", padding: "10px", backgroundColor: "#fafafa", fontSize: "10pt" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedSaleForPrint.totalAmount)}</span>
                </div>
                {Number(selectedSaleForPrint.discountAmount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#b91c1c" }}>
                    <span>Desconto:</span>
                    <span>- {formatCurrency(selectedSaleForPrint.discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "12pt", borderTop: "1px solid #ccc", paddingTop: "6px" }}>
                  <span>TOTAL PAGO:</span>
                  <span>{formatCurrency(selectedSaleForPrint.netTotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", color: "#555", marginTop: "4px" }}>
                  <span>Forma:</span>
                  <span>{selectedSaleForPrint.paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Termos de Garantia */}
            <div style={{ borderTop: "1px solid #ccc", paddingTop: "10px", fontSize: "8.5pt", color: "#444", marginBottom: "40px" }}>
              <strong>TERMO DE GARANTIA E CONDIÇÕES:</strong>
              <p style={{ margin: "4px 0" }}>
                1. Os produtos e acessórios comercializados possuem garantia legal de 90 (noventa) dias contra defeitos de fabricação, conforme artigo 26 do Código de Defesa do Consumidor.
              </p>
              <p style={{ margin: "4px 0" }}>
                2. A garantia não cobre danos decorrentes de mau uso, quedas, contato com líquidos, violação de selos de lacre ou intervenção de terceiros não autorizados.
              </p>
            </div>

            {/* Assinatura */}
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: "40px" }}>
              <div style={{ textAlign: "center", width: "220px", borderTop: "1px solid #000", paddingTop: "6px", fontSize: "9pt" }}>
                Assinatura do Cliente / Recebedor
              </div>
              <div style={{ textAlign: "center", width: "220px", borderTop: "1px solid #000", paddingTop: "6px", fontSize: "9pt" }}>
                {companyProfile?.tradeName || "Assistência Técnica"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
