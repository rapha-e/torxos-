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
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<any | null>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("torxos_company_profile");
      if (cached) {
        try { return JSON.parse(cached); } catch {}
      }
    }
    const user = getCurrentUser();
    return { tradeName: user?.tenantName || "Assistência Técnica" };
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const queryParams: string[] = [];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (paymentFilter) queryParams.push(`paymentMethod=${paymentFilter}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      const [salesData, summaryData] = await Promise.all([
        fetchApi(`/sales${queryString}`),
        fetchApi("/sales/daily-summary").catch(() => null),
      ]);

      setSales(Array.isArray(salesData) ? salesData : []);
      setSummary(summaryData);
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

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Cabeçalho Oficial Exclusivo para Impressão / PDF com Perfil da Empresa */}
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
            Registro de faturamento de acessórios, celulares e eletrônicos com baixa automática de estoque.
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
            className="p-2 rounded-lg border border-[rgba(28,25,23,0.12)] text-[#71716C] hover:text-[#1C1C1A] hover:bg-[#F3F3EF] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/vendas/pdv"
            className="px-4 py-2 rounded-lg bg-[#1C1C1A] text-white hover:bg-black transition text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Abrir Frente de Caixa (PDV)</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards do Dia */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="evorix-card p-4 space-y-1">
          <div className="flex items-center justify-between text-[#71716C]">
            <span className="text-xs font-semibold">Faturamento Balcão Hoje</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono text-[#1C1C1A]">
            {formatCurrency(summary?.totalRevenue || 0)}
          </p>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
            Entrada de caixa direta
          </span>
        </div>

        <div className="evorix-card p-4 space-y-1">
          <div className="flex items-center justify-between text-[#71716C]">
            <span className="text-xs font-semibold">Vendas Concluídas</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold font-mono text-[#1C1C1A]">
            {summary?.totalSalesCount || 0}
          </p>
          <span className="text-[10px] text-[#71716C]">Hoje no balcão</span>
        </div>

        <div className="evorix-card p-4 space-y-1">
          <div className="flex items-center justify-between text-[#71716C]">
            <span className="text-xs font-semibold">Ticket Médio de Venda</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold font-mono text-[#1C1C1A]">
            {formatCurrency(summary?.avgTicket || 0)}
          </p>
          <span className="text-[10px] text-[#71716C]">Por atendimento</span>
        </div>

        <div className="evorix-card p-4 space-y-1">
          <div className="flex items-center justify-between text-[#71716C]">
            <span className="text-xs font-semibold">Itens Baixados do Estoque</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold font-mono text-[#1C1C1A]">
            {summary?.totalItemsSold || 0} un
          </p>
          <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">
            Baixa atômica
          </span>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="evorix-card p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#A1A19B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente, produto, IMEI do celular..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1C1C1A] text-[#1C1C1A]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-lg text-[#1C1C1A] focus:outline-none"
            >
              <option value="">Todas as Formas de Pagamento</option>
              <option value="PIX">Pix</option>
              <option value="CREDIT_CARD">Cartão de Crédito</option>
              <option value="DEBIT_CARD">Cartão de Débito</option>
              <option value="CASH">Dinheiro</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-[#1C1C1A] text-white text-xs font-bold rounded-lg hover:bg-black transition shrink-0"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Vendas */}
      <div className="evorix-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[rgba(28,25,23,0.08)] bg-[#F9F9F7] text-[#71716C] font-semibold">
                <th className="py-3 px-4">Venda</th>
                <th className="py-3 px-4">Data/Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Itens Vendidos (Baixados)</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4 text-right">Total Líquido</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(28,25,23,0.06)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#71716C]">
                    Carregando histórico de vendas...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-xs text-[#A1A19B]">
                    Nenhuma venda encontrada no período.
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F9F9F7] transition group">
                    <td className="py-3 px-4 font-mono font-bold text-[#1C1C1A]">
                      #{s.saleNumber}
                    </td>
                    <td className="py-3 px-4 text-[#71716C] font-mono text-[11px]">
                      {new Date(s.createdAt).toLocaleDateString("pt-BR")}{" "}
                      {new Date(s.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#1C1C1A]">
                        {s.client?.name || "Consumidor Final"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs space-y-0.5">
                        {s.items?.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="truncate text-[11px] text-[#1C1C1A]">
                            <span className="font-bold">{Number(item.quantity)}x</span> {item.product?.name || "Item"}
                            {item.imeiOrSerial && (
                              <span className="ml-1 text-[10px] text-indigo-700 font-mono bg-indigo-50 px-1 py-0.2 rounded">
                                IMEI: {item.imeiOrSerial}
                              </span>
                            )}
                          </div>
                        ))}
                        {s.items?.length > 2 && (
                          <span className="text-[10px] text-[#71716C]">
                            + {s.items.length - 2} outros itens
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3F3EF] text-[#1C1C1A] border border-[rgba(28,25,23,0.08)]">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 text-sm">
                      {formatCurrency(s.netTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          s.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {s.status === "COMPLETED" ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Concluída</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-2.5 h-2.5 text-rose-600" />
                            <span>Cancelada</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedSaleForPrint(s)}
                        title="Ver Comprovante Térmico"
                        className="p-1.5 rounded-lg border border-[rgba(28,25,23,0.12)] text-[#1C1C1A] hover:bg-[#F3F3EF] transition inline-flex items-center gap-1 text-xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#71716C]" />
                        <span className="hidden sm:inline">Comprovante</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Reimpressão de Comprovante */}
      {selectedSaleForPrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:inset-auto print:block">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-[rgba(28,25,23,0.12)] shadow-2xl p-6 space-y-4 animate-in zoom-in-95 print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full">
            <div className="flex items-center justify-between no-print print:hidden">
              <span className="text-xs font-bold text-[#1C1C1A]">Comprovante de Venda #{selectedSaleForPrint.saleNumber}</span>
              <button
                onClick={() => setSelectedSaleForPrint(null)}
                className="text-xs text-[#71716C] hover:text-[#1C1C1A] cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="bg-[#FAFAFA] print:bg-white p-4 print:p-0 rounded-xl border border-dashed border-gray-300 print:border-b font-mono text-[11px] text-[#1C1C1A] space-y-2.5">
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

              <div className="space-y-1 text-xs font-bold pt-1">
                <div className="flex justify-between">
                  <span>TOTAL PAGO:</span>
                  <span className="text-sm">{formatCurrency(selectedSaleForPrint.netTotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-normal text-gray-600">
                  <span>FORMA:</span>
                  <span>{selectedSaleForPrint.paymentMethod}</span>
                </div>
              </div>

              <div className="text-center pt-2 border-t border-dashed border-gray-300 text-[9px] text-gray-500">
                <p>Garantia de 90 dias com este cupom.</p>
              </div>
            </div>

            <div className="flex gap-2 no-print print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-[#1C1C1A] text-white hover:bg-black font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Recibo (80mm)</span>
              </button>
              <button
                onClick={() => setSelectedSaleForPrint(null)}
                className="px-4 py-2.5 rounded-xl border border-[rgba(28,25,23,0.12)] text-[#1C1C1A] hover:bg-[#F3F3EF] font-bold text-xs transition cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
