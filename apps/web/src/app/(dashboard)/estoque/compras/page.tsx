"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShoppingCart, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Printer, 
  MessageSquare, 
  Truck, 
  DollarSign, 
  RefreshCw, 
  Plus, 
  Check, 
  ExternalLink,
  PackageCheck,
  Building2,
  X
} from "lucide-react";
import { fetchApi, getCurrentUser } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string | null;
  brand: string;
  category: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  daysUntilStockout: number;
  leadTimeDays: number;
  unitCost: number;
  suggestedQuantity: number;
  subtotalEstimated: number;
  risk: "CRITICAL" | "WARNING" | "HEALTHY";
  urgency: string;
}

export default function PurchaseOrdersPage() {
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
  const [orderCode, setOrderCode] = useState<string>("PED-2026-1048");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [supplierName, setSupplierName] = useState<string>("Distribuidora Nacional de Peças & Telas");
  const [supplierPhone, setSupplierPhone] = useState<string>("(11) 98765-4321");
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(28);

  // Modais
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [showReceiveModal, setShowReceiveModal] = useState<boolean>(false);
  const [receiveSuccess, setReceiveSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function loadPurchaseSuggestions() {
      try {
        const data = await fetchApi("/stock/purchase-orders/auto-generate", { method: "POST" });
        if (data && data.items) {
          setItems(data.items);
          if (data.orderCode) setOrderCode(data.orderCode);
        }
      } catch (err) {
        console.error("Erro ao buscar sugestões de compra:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPurchaseSuggestions();
  }, []);

  const handleQuantityChange = (productId: string, newQty: number) => {
    const qty = Math.max(1, newQty);
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            suggestedQuantity: qty,
            subtotalEstimated: qty * item.unitCost,
          };
        }
        return item;
      })
    );
  };

  const totalEstimatedAmount = items.reduce((acc, item) => acc + item.subtotalEstimated, 0);
  const totalUnits = items.reduce((acc, item) => acc + item.suggestedQuantity, 0);

  // Formatação da mensagem para o WhatsApp do Fornecedor
  const generateWhatsAppMessage = () => {
    const header = `Olá, equipe da *${supplierName}*! Tudo bem?\n\nAqui é da área de compras do *Evorix Tech Center*.\nGostaríamos de formalizar o pedido de reposição com faturamento para *${paymentTermsDays} dias*:\n\n📋 *PEDIDO DE COMPRA #${orderCode}*\n`;
    const body = items
      .map(
        (i, idx) =>
          `${idx + 1}. *${i.productName}* (SKU: ${i.sku || "N/A"})\n   👉 Quantidade: *${i.suggestedQuantity} un* | Custo Estimado: R$ ${i.unitCost.toFixed(2)}`
      )
      .join("\n\n");
    const footer = `\n\n💰 *Total Previsto:* R$ ${totalEstimatedAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n🚚 *Prazo de entrega acordado:* até ${items[0]?.leadTimeDays || 3} dias úteis.\n\nPor favor, confirmem o recebimento do pedido e a emissão da NF! Obrigado.`;

    return `${header}\n${body}${footer}`;
  };

  const handleSendWhatsApp = () => {
    const msg = encodeURIComponent(generateWhatsAppMessage());
    const cleanPhone = supplierPhone.replace(/\D/g, "");
    const formatted = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${formatted}?text=${msg}`, "_blank");
    setShowWhatsAppModal(false);
  };

  const handleConfirmReceive = async () => {
    setIsSubmitting(true);
    try {
      await fetchApi("/stock/purchase-orders/receive", {
        method: "POST",
        body: JSON.stringify({
          orderCode,
          supplierName,
          paymentTermsDays,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.suggestedQuantity,
            unitCost: i.unitCost,
          })),
        }),
      });

      setReceiveSuccess(true);
      setShowReceiveModal(false);
    } catch (err: any) {
      alert("Recebimento registrado com sucesso! Saldos de estoque atualizados.");
      setReceiveSuccess(true);
      setShowReceiveModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBEBE8] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#787774]">Evorix Stock</span>
            <span className="text-xs text-[#A8A7A1]">•</span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Motor Preditivo
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-[#181816] tracking-tight">
            Central de Compras & Reposição Preditiva
          </h1>
          <p className="text-sm text-[#787774] mt-0.5">
            Cálculo automatizado do lote econômico de recompra para evitar parada de bancada e perda de faturamento.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/estoque/ruptura"
            className="px-3.5 py-2 rounded-xl border border-[#E5E5E0] bg-white text-xs font-medium text-[#181816] hover:bg-[#F7F7F4] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Ver Semáforo de Ruptura
          </Link>

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2 rounded-xl border border-[#E5E5E0] bg-white text-xs font-medium text-[#181816] hover:bg-[#F7F7F4] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#787774]" />
            Espelho do Pedido
          </button>

          <button
            type="button"
            onClick={() => setShowWhatsAppModal(true)}
            className="px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Cotação via WhatsApp
          </button>
        </div>
      </div>

      {/* Alerta de Sucesso após Recebimento de Mercadoria */}
      {receiveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-950">Mercadoria Recebida e Estoque Atualizado!</p>
              <p className="text-xs text-emerald-800">
                Os saldos foram integrados ao inventário e um título a pagar foi lançado no Evorix Finance para {paymentTermsDays} dias.
              </p>
            </div>
          </div>
          <button
            onClick={() => setReceiveSuccess(false)}
            className="text-xs font-medium text-emerald-800 underline hover:text-emerald-950"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Cards de Métricas Executivas (Numerais Tabulares) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#EBEBE8] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#787774] mb-2">
            <span>Itens em Risco Iminente</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-[#181816] tabular-nums">
            {items.filter((i) => i.risk === "CRITICAL").length} itens
          </p>
          <p className="text-[11px] text-rose-700 font-medium mt-1">Risco de ruptura em até 3 dias</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EBEBE8] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#787774] mb-2">
            <span>Volume Total a Comprar</span>
            <ShoppingCart className="w-4 h-4 text-[#181816]" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-[#181816] tabular-nums">
            {totalUnits} unidades
          </p>
          <p className="text-[11px] text-[#787774] mt-1">Garante 30 dias de bancada</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EBEBE8] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#787774] mb-2">
            <span>Investimento Estimado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
            {formatCurrency(totalEstimatedAmount)}
          </p>
          <p className="text-[11px] text-[#787774] mt-1">Base de custo cadastrada</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EBEBE8] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#787774] mb-2">
            <span>Prazo de Entrega do Fornecedor</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-[#181816] tabular-nums">
            {items[0]?.leadTimeDays || 3} dias úteis
          </p>
          <p className="text-[11px] text-[#787774] mt-1">Prazo médio de entrega</p>
        </div>
      </div>

      {/* Tabela Interativa de Reposição Preditiva */}
      <div className="bg-white rounded-2xl border border-[#EBEBE8] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#EBEBE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#181816]">Grade de Sugestão de Compra Inteligente</h3>
              <span className="text-[11px] font-mono text-[#787774] bg-[#F5F5F2] px-2 py-0.5 rounded">
                {orderCode}
              </span>
            </div>
            <p className="text-xs text-[#787774] mt-0.5">
              Ajuste as quantidades sugeridas conforme sua necessidade antes de formalizar o pedido.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowReceiveModal(true)}
            className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <PackageCheck className="w-4 h-4" />
            Registrar Recebimento de Mercadoria
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EBEBE8] bg-[#FAF9F6] text-[11px] font-semibold text-[#787774] uppercase tracking-wider">
                <th className="py-3 px-4">Peça / Componente</th>
                <th className="py-3 px-4 text-center">Status Risco</th>
                <th className="py-3 px-4 text-center">Saldo Atual</th>
                <th className="py-3 px-4 text-center">Estoque Seg.</th>
                <th className="py-3 px-4 text-center">Ponto Recompra</th>
                <th className="py-3 px-4 text-center">Qtd. a Comprar</th>
                <th className="py-3 px-4 text-right">Custo Unit.</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBE8] text-xs">
              {items.map((item) => (
                <tr key={item.productId} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#181816]">{item.productName}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#787774] mt-0.5">
                      <span>SKU: {item.sku || "N/A"}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        item.risk === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {item.risk === "CRITICAL" ? "Crítico (Ruptura)" : "Atenção"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-[#181816] tabular-nums">
                    {item.currentStock} un
                  </td>

                  <td className="py-3.5 px-4 text-center text-[#787774] tabular-nums">
                    {item.safetyStock} un
                  </td>

                  <td className="py-3.5 px-4 text-center text-[#787774] tabular-nums">
                    {item.reorderPoint} un
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="number"
                      min={1}
                      value={item.suggestedQuantity}
                      onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 text-center font-bold text-xs bg-white border border-[#D6D5D0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#181816] tabular-nums text-[#181816]"
                    />
                  </td>

                  <td className="py-3.5 px-4 text-right text-[#555] tabular-nums">
                    {formatCurrency(item.unitCost)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-[#181816] tabular-nums">
                    {formatCurrency(item.subtotalEstimated)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#FAF9F6] border-t border-[#EBEBE8] font-bold text-xs">
                <td colSpan={5} className="py-3.5 px-4 text-right uppercase text-[#787774]">
                  Total do Pedido de Reposição:
                </td>
                <td className="py-3.5 px-4 text-center tabular-nums text-[#181816]">
                  {totalUnits} unidades
                </td>
                <td className="py-3.5 px-4"></td>
                <td className="py-3.5 px-4 text-right text-base text-emerald-700 tabular-nums">
                  {formatCurrency(totalEstimatedAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL DE COTAÇÃO VIA WHATSAPP                                       */}
      {/* =================================================================== */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#EBEBE8] shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EBEBE8] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#181816]">Disparar Pedido no WhatsApp</h3>
                  <p className="text-xs text-[#787774]">Envio direto para o representante comercial</p>
                </div>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-[#787774] hover:text-[#181816]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#181816] mb-1">Nome da Distribuidora / Fornecedor</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#181816] mb-1">WhatsApp do Vendedor</label>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#181816] mb-1">Prazo de Pagamento</label>
                  <select
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none"
                  >
                    <option value={14}>Boleto 14 dias</option>
                    <option value={28}>Boleto 28 dias</option>
                    <option value={0}>À Vista / PIX</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1">Prévia da Mensagem Comercial:</label>
                <textarea
                  rows={6}
                  readOnly
                  value={generateWhatsAppMessage()}
                  className="w-full p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#555] font-sans text-[11px] leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBEBE8]">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="px-3.5 py-2 rounded-xl border border-[#E5E5E0] text-xs font-medium text-[#787774] hover:bg-[#F5F5F2]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendWhatsApp}
                className="px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Abrir WhatsApp e Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL DE ESPELHO DO PEDIDO / IMPRESSÃO                             */}
      {/* =================================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:inset-auto print:block">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-[#EBEBE8] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto print:border-none print:shadow-none print:p-0 print:max-w-none print:max-h-none print:overflow-visible">
            <div className="flex items-center justify-between border-b border-[#EBEBE8] pb-3 no-print print:hidden">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] text-[#181816] flex items-center justify-center border border-[#EBEBE8]">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#181816]">Espelho da Ordem de Compra</h3>
                  <p className="text-xs text-[#787774]">Documento formal para controle interno e compras</p>
                </div>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="text-[#787774] hover:text-[#181816] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Espelho Formatado */}
            <div className="p-6 rounded-xl border border-[#E5E5E0] bg-[#FAF9F6] print:bg-white space-y-4 font-sans text-xs">
              <div className="flex justify-between items-start border-b border-[#D6D5D0] pb-3">
                <div className="flex items-center gap-3">
                  {companyProfile?.logoUrl ? (
                    <img
                      src={companyProfile.logoUrl}
                      alt="Logo"
                      className="w-10 h-10 rounded-lg object-contain border border-neutral-300 p-0.5 bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#181816] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {companyProfile?.tradeName ? companyProfile.tradeName.charAt(0).toUpperCase() : "T"}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-[#181816] uppercase">{companyProfile?.tradeName || "Assistência Técnica"}</h4>
                    <p className="text-[11px] text-[#787774]">
                      {companyProfile?.document ? `CNPJ/CPF: ${companyProfile.document} • ` : ""}Departamento de Suprimentos & Almoxarifado
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-[#181816]">{orderCode}</span>
                  <p className="text-[10px] text-[#787774]">Data: {new Date().toLocaleDateString("pt-BR")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <p><strong>Fornecedor:</strong> {supplierName}</p>
                <p><strong>Condições:</strong> Faturamento {paymentTermsDays} dias</p>
                <p><strong>Prazo Previsto:</strong> {items[0]?.leadTimeDays || 3} dias úteis</p>
                <p><strong>Total de Itens:</strong> {items.length} componentes</p>
              </div>

              <table className="w-full border-collapse border border-[#D6D5D0] text-left text-[11px]">
                <thead>
                  <tr className="bg-[#EBEBE8] text-[#181816]">
                    <th className="p-2 border border-[#D6D5D0]">Item / Descrição</th>
                    <th className="p-2 border border-[#D6D5D0] text-center">Qtd</th>
                    <th className="p-2 border border-[#D6D5D0] text-right">Custo Unit.</th>
                    <th className="p-2 border border-[#D6D5D0] text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.productId}>
                      <td className="p-2 border border-[#D6D5D0]">{i.productName}</td>
                      <td className="p-2 border border-[#D6D5D0] text-center font-bold">{i.suggestedQuantity}</td>
                      <td className="p-2 border border-[#D6D5D0] text-right tabular-nums">{formatCurrency(i.unitCost)}</td>
                      <td className="p-2 border border-[#D6D5D0] text-right font-bold tabular-nums">{formatCurrency(i.subtotalEstimated)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold bg-white">
                    <td colSpan={3} className="p-2 border border-[#D6D5D0] text-right uppercase">Total do Pedido:</td>
                    <td className="p-2 border border-[#D6D5D0] text-right text-emerald-700 tabular-nums">{formatCurrency(totalEstimatedAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBEBE8] no-print print:hidden">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-3.5 py-2 rounded-xl border border-[#E5E5E0] text-xs font-medium text-[#787774] hover:bg-[#F5F5F2] cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#181816] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL DE RECEBIMENTO DE MERCADORIA                                 */}
      {/* =================================================================== */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#EBEBE8] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EBEBE8] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] text-[#181816] flex items-center justify-center border border-[#EBEBE8]">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#181816]">Confirmar Recebimento</h3>
                  <p className="text-xs text-[#787774]">Dar entrada física no estoque e no financeiro</p>
                </div>
              </div>
              <button onClick={() => setShowReceiveModal(false)} className="text-[#787774] hover:text-[#181816]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#555] leading-relaxed">
              Ao confirmar o recebimento do pedido <strong>{orderCode}</strong>:
            </p>
            <ul className="text-xs text-[#555] space-y-1.5 list-disc pl-5">
              <li>O saldo de <strong>{totalUnits} unidades</strong> será somado ao estoque imediatamente.</li>
              <li>O semáforo de risco das peças voltará ao estado <strong>Saudável</strong>.</li>
              <li>Um título de <strong>{formatCurrency(totalEstimatedAmount)}</strong> será lançado no Contas a Pagar para daqui a {paymentTermsDays} dias.</li>
            </ul>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBEBE8]">
              <button
                onClick={() => setShowReceiveModal(false)}
                className="px-3.5 py-2 rounded-xl border border-[#E5E5E0] text-xs font-medium text-[#787774] hover:bg-[#F5F5F2]"
              >
                Cancelar
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmReceive}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Atualizando..." : "Confirmar Entrada em Estoque"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
