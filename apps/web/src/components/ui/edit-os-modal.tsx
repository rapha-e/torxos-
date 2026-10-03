"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Wrench,
  Smartphone,
  Plus,
  Trash2,
  Package,
  DollarSign,
  AlertCircle,
  Check,
  CheckCircle2,
  Sparkles,
  Layers,
  Clock,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { formatCurrency, translateOsStatus } from "@/lib/utils";

export interface EditOsItem {
  id?: string;
  itemType: "SERVICE" | "PRODUCT";
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  discountAmount?: number;
  shelfLocation?: string | null;
  currentStock?: number | null;
}

interface EditOsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedOs: any) => void;
  osData: {
    id: string;
    osNumber: number | string;
    client?: {
      name?: string;
      phone?: string;
    };
    deviceBrand?: string;
    deviceModel?: string;
    serialOrImei?: string;
    reportedDefect?: string;
    technicalDiagnosis?: string;
    priority?: string;
    status?: string;
    stockDeducted?: boolean;
    totalServices?: number | string;
    totalParts?: number | string;
    totalDiscount?: number | string;
    netTotal?: number | string;
    items?: EditOsItem[];
  } | null;
}

export function EditOsModal({ isOpen, onClose, onSaved, osData }: EditOsModalProps) {
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceBrand, setDeviceBrand] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [reportedDefect, setReportedDefect] = useState("");
  const [technicalDiagnosis, setTechnicalDiagnosis] = useState("");
  const [totalDiscount, setTotalDiscount] = useState<number>(0);
  const [requireApproval, setRequireApproval] = useState<boolean>(true);
  const [items, setItems] = useState<EditOsItem[]>([]);
  const [stockProducts, setStockProducts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWorkbench = Boolean(
    osData &&
      ["APPROVED", "IN_MAINTENANCE", "QUALITY_CHECK", "READY_FOR_PICKUP", "DELIVERED"].includes(
        osData.status || ""
      )
  );



  // Inicializa dados quando a OS selecionada mudar
  useEffect(() => {
    if (osData) {
      setDeviceModel(osData.deviceModel || "");
      setDeviceBrand(osData.deviceBrand || "");
      setPriority(osData.priority || "NORMAL");
      setReportedDefect(osData.reportedDefect || "");
      setTechnicalDiagnosis(osData.technicalDiagnosis || "");
      setTotalDiscount(Number(osData.totalDiscount) || 0);

      if (osData.items && Array.isArray(osData.items) && osData.items.length > 0) {
        setItems(
          osData.items.map((it) => ({
            id: it.id,
            itemType: (it.itemType as "SERVICE" | "PRODUCT") || "SERVICE",
            productId: it.productId || null,
            description: it.description || "",
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            unitCost: Number(it.unitCost) || 0,
            discountAmount: Number(it.discountAmount) || 0,
          }))
        );
      } else {
        // Se a OS não tinha itens salvos, inicializa com mão de obra básica para permitir ajuste de valor imediato
        const initialTotal = Number(osData.netTotal) || 150;
        setItems([
          {
            itemType: "SERVICE",
            description: "Serviço de Mão de Obra e Manutenção",
            quantity: 1,
            unitPrice: initialTotal,
            unitCost: 0,
            discountAmount: 0,
          },
        ]);
      }
      setError(null);
    }
  }, [osData]);

  // Carrega produtos do estoque para facilitar a seleção de peças
  useEffect(() => {
    async function loadStock() {
      try {
        let local: any[] = [];
        if (typeof window !== "undefined") {
          const saved =
            localStorage.getItem("torxos_stock_products") ||
            localStorage.getItem("evorix_stock_products");
          if (saved) {
            try {
              local = JSON.parse(saved);
            } catch (e) {}
          }
        }

        const data = await fetchApi("/stock/products");
        if (Array.isArray(data) && data.length > 0) {
          const map = new Map();
          [...data, ...local].forEach((p) => {
            if (p && p.name) map.set(p.id || p.name, p);
          });
          setStockProducts(Array.from(map.values()));
        } else if (local.length > 0) {
          setStockProducts(local);
        }
      } catch (err) {
        console.warn("Erro ao carregar catálogo para edição de OS:", err);
      }
    }
    if (isOpen) {
      loadStock();
    }
  }, [isOpen]);

  if (!isOpen || !osData) return null;

  // Adicionar item
  const addItem = (type: "SERVICE" | "PRODUCT") => {
    setItems((prev) => [
      ...prev,
      {
        itemType: type,
        description: type === "SERVICE" ? "Serviço de Reparo / Mão de Obra" : "",
        quantity: 1,
        unitPrice: type === "SERVICE" ? 100 : 0,
        unitCost: 0,
        discountAmount: 0,
        productId: null,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof EditOsItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleSelectProduct = (index: number, productId: string) => {
    if (productId === "__CUSTOM__") {
      updateItem(index, "productId", null);
      return;
    }

    const prod = stockProducts.find((p) => p.id === productId);
    if (prod) {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          productId: prod.id,
          description: prod.name,
          unitPrice: Number(prod.salePrice) || Number(prod.price) || 0,
          unitCost: Number(prod.costPrice) || 0,
          shelfLocation: prod.shelfLocation || null,
          currentStock: prod.currentStock !== undefined ? Number(prod.currentStock) : null,
        };
        return updated;
      });
    }
  };

  // Cálculos dinâmicos dos valores da OS
  const totalServices = items
    .filter((it) => it.itemType === "SERVICE")
    .reduce(
      (sum, it) =>
        sum + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0) - (Number(it.discountAmount) || 0),
      0
    );

  const totalParts = items
    .filter((it) => it.itemType === "PRODUCT")
    .reduce(
      (sum, it) =>
        sum + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0) - (Number(it.discountAmount) || 0),
      0
    );

  const calculatedNetTotal = Math.max(0, totalServices + totalParts - (Number(totalDiscount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("A Ordem de Serviço deve conter pelo menos um item ou serviço cadastrado.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const isWorkbench = ["APPROVED", "IN_MAINTENANCE", "QUALITY_CHECK", "READY_FOR_PICKUP", "DELIVERED"].includes(
        osData.status || ""
      );

      const payload = {
        deviceBrand,
        deviceModel,
        priority,
        reportedDefect,
        technicalDiagnosis,
        totalDiscount: Number(totalDiscount) || 0,
        requireClientApproval: isWorkbench ? requireApproval : false,
        items: items.map((it) => ({
          itemType: it.itemType,
          productId: it.productId || null,
          description: it.description.trim() || (it.itemType === "SERVICE" ? "Serviço" : "Peça"),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          unitCost: Number(it.unitCost) || 0,
          discountAmount: Number(it.discountAmount) || 0,
        })),
      };

      const result = await fetchApi(`/service-orders/${osData.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const updatedStatus = payload.requireClientApproval ? "AWAITING_APPROVAL" : (result?.status || osData.status);

      onSaved(result || {
        ...osData,
        ...payload,
        status: updatedStatus,
        stockDeducted: payload.requireClientApproval ? false : osData.stockDeducted,
        totalServices,
        totalParts,
        netTotal: calculatedNetTotal,
      });
      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar edição da OS:", err);
      setError(err.message || "Erro ao salvar alterações da OS. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[rgba(28,25,23,0.08)] overflow-hidden my-8">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(28,25,23,0.08)] bg-[#FAFAF8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#181816] text-amber-300 flex items-center justify-center shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1C1C1A]">
                  Editar OS #{osData.osNumber}
                </h3>
                {osData.status && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
                    {translateOsStatus(osData.status)}
                  </span>
                )}
                {osData.stockDeducted && (
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Estoque Baixado</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#71716C] mt-0.5">
                Cliente: <strong className="text-[#1C1C1A]">{osData.client?.name || "Cliente Balcão"}</strong>
                {osData.client?.phone ? ` • ${osData.client.phone}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#71716C] hover:text-[#1C1C1A] hover:bg-[#F3F3EF] transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Informações Rápidas do Aparelho & Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71716C] mb-1">
                Marca
              </label>
              <input
                type="text"
                value={deviceBrand}
                onChange={(e) => setDeviceBrand(e.target.value)}
                placeholder="Ex: Apple, Samsung..."
                className="w-full px-3 py-2 rounded-xl border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] bg-[#FAFAF8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71716C] mb-1">
                Modelo do Aparelho
              </label>
              <input
                type="text"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                placeholder="Ex: iPhone 13 Pro Max"
                className="w-full px-3 py-2 rounded-xl border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] bg-[#FAFAF8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71716C] mb-1">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] bg-[#FAFAF8] focus:bg-white focus:outline-none"
              >
                <option value="LOW">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgente (Fura Fila)</option>
              </select>
            </div>
          </div>

          {/* Laudo Técnico e Diagnóstico de Bancada */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71716C]">
                Laudo Técnico / Diagnóstico de Bancada
              </label>
              <span className="text-[10px] text-[#A1A19B]">Visível no recibo e portal do cliente</span>
            </div>
            <textarea
              rows={2}
              value={technicalDiagnosis}
              onChange={(e) => setTechnicalDiagnosis(e.target.value)}
              placeholder="Ex: Placa em curto na linha VDD_MAIN. Substituído capacitor C3201 e conector de carga tipo C."
              className="w-full px-3 py-2 rounded-xl border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] bg-[#FAFAF8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-[#A1A19B]"
            />
          </div>

          {/* SEÇÃO: Ajuste de Valores e Itens da OS na Bancada */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[rgba(28,25,23,0.08)] pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1C1C1A]" />
                <h4 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider">
                  Itens Orçados & Mão de Obra de Bancada
                </h4>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addItem("SERVICE")}
                  className="px-2.5 py-1 rounded-lg bg-[#F3F3EF] hover:bg-[#EAEAE5] text-[#1C1C1A] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Mão de Obra</span>
                </button>
                <button
                  type="button"
                  onClick={() => addItem("PRODUCT")}
                  className="px-2.5 py-1 rounded-lg bg-amber-100/70 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>+ Peça / Estoque</span>
                </button>
              </div>
            </div>

            {/* Lista dos Itens */}
            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const subtotal =
                  (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0) -
                  (Number(item.discountAmount) || 0);

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-[rgba(28,25,23,0.08)] bg-[#FAFAF8] hover:bg-white transition space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            item.itemType === "SERVICE"
                              ? "bg-stone-200 text-stone-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.itemType === "SERVICE" ? "Serviço" : "Peça / Estoque"}
                        </span>
                        <span className="text-[11px] font-mono text-[#71716C]">#{idx + 1}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1C1C1A] tabular-nums">
                          {formatCurrency(subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Remover este item da OS"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Se for PRODUTO, permite buscar do estoque cadastrado */}
                    {item.itemType === "PRODUCT" && stockProducts.length > 0 && (
                      <div className="pt-0.5">
                        <select
                          value={item.productId || "__CUSTOM__"}
                          onChange={(e) => handleSelectProduct(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] bg-white focus:outline-none"
                        >
                          <option value="__CUSTOM__">Peça Avulsa / Personalizada</option>
                          {stockProducts.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} (Saldo: {prod.currentStock ?? 0} un • R$ {Number(prod.salePrice || 0).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Descrição, Quantidade e Preço Unitário */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-12 sm:col-span-6">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          placeholder={
                            item.itemType === "SERVICE"
                              ? "Descrição da mão de obra..."
                              : "Descrição da peça..."
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] bg-white focus:outline-none font-medium"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[9px] text-[#71716C] mb-0.5">Qtd</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-[rgba(28,25,23,0.1)] text-xs text-center text-[#1C1C1A] bg-white focus:outline-none font-mono"
                        />
                      </div>

                      <div className="col-span-8 sm:col-span-4">
                        <label className="block text-[9px] text-[#71716C] mb-0.5">Valor Unitário (R$)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-[#71716C]">R$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                            className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] bg-white focus:outline-none font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumo Financeiro & Desconto Geral */}
          <div className="p-4 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 text-xs text-[#71716C]">
                <div className="flex items-center gap-2">
                  <span>Subtotal Serviços:</span>
                  <strong className="text-[#1C1C1A] tabular-nums">{formatCurrency(totalServices)}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span>Subtotal Peças:</span>
                  <strong className="text-[#1C1C1A] tabular-nums">{formatCurrency(totalParts)}</strong>
                </div>
              </div>

              {/* Campo de Desconto Geral */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#71716C] font-semibold">Desconto:</span>
                <div className="relative w-28">
                  <span className="absolute left-2.5 top-1.5 text-xs text-[#71716C]">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalDiscount}
                    onChange={(e) => setTotalDiscount(Number(e.target.value))}
                    className="w-full pl-8 pr-2 py-1 rounded-lg border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] bg-white focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Total Líquido Ajustado */}
            <div className="pt-2 border-t border-[rgba(28,25,23,0.08)] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#71716C]">
                  Novo Valor Total da OS
                </span>
                <p className="text-[10px] text-[#A1A19B]">Atualiza a bancada e o portal em tempo real</p>
              </div>
              <span className="text-2xl font-black text-emerald-800 tabular-nums">
                {formatCurrency(calculatedNetTotal)}
              </span>
            </div>
          </div>

          {/* SEÇÃO: Fluxo de Aprovação do Cliente & Gestão de Estoque */}
          {isWorkbench && (
            <div className="p-4 rounded-xl border border-[rgba(28,25,23,0.08)] bg-[#FAFAF8] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1C1C1A]" />
                  <h4 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider">
                    Fluxo de Aprovação & Gestão de Estoque
                  </h4>
                </div>
                <span className="text-[10px] text-[#71716C] bg-white px-2 py-0.5 rounded-full border border-[rgba(28,25,23,0.06)] font-semibold">
                  Aparelho em Bancada
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Opção 1: Solicitar Nova Aprovação (Estorna estoque) */}
                <button
                  type="button"
                  onClick={() => setRequireApproval(true)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                    requireApproval
                      ? "bg-amber-50/80 border-amber-300 ring-1 ring-amber-400 shadow-xs"
                      : "bg-white border-[rgba(28,25,23,0.08)] hover:bg-[#F3F3EF]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span className="text-xs font-bold text-[#1C1C1A]">
                        Solicitar Nova Aprovação
                      </span>
                    </div>
                    {requireApproval && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#71716C] leading-snug">
                    Move a OS para <strong>Aguardando Aprovação</strong>. <strong>Estorna as peças</strong> para o estoque até o cliente aprovar o novo orçamento.
                  </p>
                  <span className="text-[9px] font-bold uppercase text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded w-fit">
                    Recomendado se o valor aumentou
                  </span>
                </button>

                {/* Opção 2: Manter em Bancada (Atualiza baixa física) */}
                <button
                  type="button"
                  onClick={() => setRequireApproval(false)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                    !requireApproval
                      ? "bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400 shadow-xs"
                      : "bg-white border-[rgba(28,25,23,0.08)] hover:bg-[#F3F3EF]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-indigo-700" />
                      <span className="text-xs font-bold text-[#1C1C1A]">
                        Cliente já autorizou / Bancada
                      </span>
                    </div>
                    {!requireApproval && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#71716C] leading-snug">
                    Mantém a OS em <strong>Bancada</strong>. Atualiza e efetua a <strong>baixa física</strong> das novas peças no estoque imediatamente.
                  </p>
                  <span className="text-[9px] font-bold uppercase text-indigo-800 bg-indigo-100/80 px-1.5 py-0.5 rounded w-fit">
                    Ajuste autorizado / Desconto
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Rodapé com Botões de Ação */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(28,25,23,0.08)]">

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#71716C] hover:text-[#1C1C1A] hover:bg-[#F3F3EF] transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-amber-300" />
                  <span>Salvar Alterações da OS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
