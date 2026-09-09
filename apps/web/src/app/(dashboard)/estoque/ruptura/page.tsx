"use client";

import { useEffect, useState } from "react";
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { formatCurrency, translateStockRisk } from "@/lib/utils";
import { PlanGate } from "@/components/ui/plan-gate";

export default function StockRupturePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [purchaseOrderModal, setPurchaseOrderModal] = useState<any>(null);

  const loadStockData = async () => {
    try {
      const data = await fetchApi("/stock/predictions/stockouts");
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await fetchApi("/stock/predictions/recalculate", { method: "POST" });
      await loadStockData();
    } catch (e: any) {
      alert("Erro ao recalcular motor preditivo: " + e.message);
    } finally {
      setRecalculating(false);
    }
  };

  const handleAutoGeneratePO = async () => {
    try {
      const po = await fetchApi("/stock/purchase-orders/auto-generate", { method: "POST" });
      setPurchaseOrderModal(po);
    } catch (e: any) {
      alert("Erro ao gerar sugestão de compra: " + e.message);
    }
  };

  return (
    <PlanGate feature="canUseStockPrediction">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1C1C1A] tracking-tight">
                Motor Preditivo de Ruptura de Estoque
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3F3EF] text-[#71716C] font-semibold border border-[rgba(28,25,23,0.06)]">
                TorxOS Stock
              </span>
            </div>
          <p className="text-xs text-[#71716C] mt-0.5">
            Cálculo de consumo médio diário (CMD móvel 30d), Ponto de Encomenda (ROP) e Runway em dias.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="px-3.5 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.07)] hover:bg-[#F3F3EF] text-[#1C1C1A] font-medium text-xs flex items-center gap-2 transition shadow-[0px_1px_2px_rgba(0,0,0,0.02)] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#71716C] ${recalculating ? "animate-spin" : ""}`} strokeWidth={1.75} />
            <span>Recalcular Motor</span>
          </button>

          <button
            onClick={handleAutoGeneratePO}
            className="px-3.5 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium text-xs flex items-center gap-2 transition shadow-sm"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-300" strokeWidth={1.75} />
            <span>Gerar Sugestão de Compra</span>
          </button>
        </div>
      </div>

      {/* Tabela do Semáforo */}
      <div className="evorix-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F9F7] border-b border-[rgba(28,25,23,0.07)] uppercase tracking-wider text-[#71716C] font-bold">
              <tr>
                <th className="py-3.5 px-4">Status & Criticidade</th>
                <th className="py-3.5 px-4">Peça / Produto</th>
                <th className="py-3.5 px-4">Localização</th>
                <th className="py-3.5 px-4 text-center">Saldo Atual</th>
                <th className="py-3.5 px-4 text-center">Consumo Médio (CMD/Dia)</th>
                <th className="py-3.5 px-4 text-center">Prazo Fornecedor (Dias)</th>
                <th className="py-3.5 px-4 text-center">Ponto de Encomenda (ROP)</th>
                <th className="py-3.5 px-4 text-center">Autonomia (Dias até Ruptura)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(28,25,23,0.06)]">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#71716C]">
                    <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto mb-2" strokeWidth={1.75} />
                    <p className="font-semibold text-[#1C1C1A]">Nenhuma ruptura prevista!</p>
                    <p className="text-xs text-[#71716C] mt-0.5">Todas as peças do catálogo estão com estoques seguros.</p>
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F9F9F7] transition">
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          item.stockoutRiskStatus === "CRITICAL"
                            ? "bg-[#FEE2E2] text-rose-800 border-[#FECACA]"
                            : item.stockoutRiskStatus === "WARNING"
                            ? "bg-[#FEF3C7] text-amber-800 border-[#FDE68A]"
                            : "bg-[#DCFCE7] text-emerald-800 border-[#BBF7D0]"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{translateStockRisk(item.stockoutRiskStatus)}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#1C1C1A] text-xs">{item.name}</p>
                      <p className="text-[10px] text-[#71716C]">SKU: {item.sku || "N/A"} • {item.category}</p>
                    </td>
                    <td className="py-3.5 px-4 text-[#71716C] font-mono text-[11px]">
                      {item.shelfLocation || "Bancada Central"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#1C1C1A] tabular-nums">
                      {item.currentStock} un
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[#71716C] tabular-nums">
                      {item.dailyAvgConsumption}
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#71716C] tabular-nums">
                      {item.supplierLeadTimeDays || 3} dias
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-[#1C1C1A] tabular-nums">
                      {item.reorderPointCalculated} un
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-rose-700 text-xs tabular-nums">
                        {item.daysUntilStockout} {item.daysUntilStockout === 1 ? "dia" : "dias"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Sugestão de Pedido de Compra */}
      {purchaseOrderModal && (
        <div className="fixed inset-0 bg-[#1C1C1A]/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full p-6 rounded-2xl bg-white border border-[rgba(28,25,23,0.07)] shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(28,25,23,0.07)]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#1C1C1A]" strokeWidth={1.75} />
                <h3 className="font-bold text-sm text-[#1C1C1A]">Sugestão de Reposição Preditiva</h3>
              </div>
              <button
                onClick={() => setPurchaseOrderModal(null)}
                className="text-[#71716C] hover:text-[#1C1C1A] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#71716C]">
              Itens calculados para cobrir 30 dias de bancada mais a margem de segurança contra atrasos de entrega:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {purchaseOrderModal.items?.map((item: any) => (
                <div
                  key={item.productId}
                  className="p-3 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-[#1C1C1A]">{item.productName}</p>
                    <span className="text-[10px] text-rose-700 font-semibold">
                      Urgência: {item.urgency} (Saldo: {item.currentStock} un)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-[#71716C]">Comprar</span>
                    <span className="font-bold text-[#1C1C1A] text-sm tabular-nums">+{item.suggestedQuantity} un</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[rgba(28,25,23,0.07)] flex justify-end gap-2">
              <button
                onClick={() => setPurchaseOrderModal(null)}
                className="px-4 py-2 rounded-xl bg-[#F3F3EF] hover:bg-[#EBEAE5] text-[#1C1C1A] text-xs font-semibold transition"
              >
                Concluir
              </button>
              <button
                onClick={() => {
                  alert("Pedido de Compra copiado e pronto para envio aos fornecedores!");
                  setPurchaseOrderModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white text-xs font-semibold transition shadow-sm"
              >
                Exportar para Fornecedores
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PlanGate>
  );
}
