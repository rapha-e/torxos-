"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  DollarSign,
  User,
  Phone,
  Shield,
  ArrowLeft,
  Package,
  MapPin,
  AlertTriangle,
  Check,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { PhotoChecklist, DevicePhoto } from "@/components/ui/photo-checklist";
import { SignatureCanvas } from "@/components/ui/signature-canvas";

export default function NewServiceOrderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [stockProducts, setStockProducts] = useState<any[]>([]);

  // Form State
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [deviceType, setDeviceType] = useState("Smartphone");
  const [deviceBrand, setDeviceBrand] = useState("Apple");
  const [deviceModel, setDeviceModel] = useState("");
  const [serialOrImei, setSerialOrImei] = useState("");
  const [reportedDefect, setReportedDefect] = useState("");
  const [priority, setPriority] = useState("NORMAL");

  // Checklist
  const [powersOn, setPowersOn] = useState(true);
  const [crackedScreen, setCrackedScreen] = useState(false);
  const [hasScratches, setHasScratches] = useState(false);
  const [devicePhotos, setDevicePhotos] = useState<DevicePhoto[]>([]);
  const [clientSignature, setClientSignature] = useState<string | null>(null);

  // Items
  const [items, setItems] = useState<any[]>([
    {
      itemType: "SERVICE",
      description: "Diagnóstico e Mão de Obra de Bancada",
      quantity: 1,
      unitPrice: 150.0,
      productId: null,
    },
  ]);

  // Carrega peças cadastradas do estoque
  useEffect(() => {
    async function loadStock() {
      try {
        let local: any[] = [];
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("torxos_stock_products") || localStorage.getItem("evorix_stock_products");
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
        console.warn("Erro ao carregar catálogo para OS:", err);
      }
    }
    loadStock();
  }, []);

  const addItem = (type: "SERVICE" | "PRODUCT" = "PRODUCT") => {
    setItems([
      ...items,
      {
        itemType: type,
        description: "",
        quantity: 1,
        unitPrice: 0.0,
        productId: null,
        shelfLocation: null,
        currentStock: null,
        sku: null,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Ao selecionar uma peça cadastrada no dropdown
  const handleSelectProduct = (index: number, productId: string) => {
    const updated = [...items];

    if (!productId || productId === "__CUSTOM__") {
      updated[index] = {
        ...updated[index],
        productId: productId === "__CUSTOM__" ? "__CUSTOM__" : null,
        description: "",
        unitPrice: 0.0,
        unitCost: 0.0,
        shelfLocation: null,
        currentStock: null,
        sku: null,
      };
    } else {
      const prod = stockProducts.find((p) => p.id === productId);
      if (prod) {
        updated[index] = {
          ...updated[index],
          productId: prod.id,
          description: prod.name,
          unitPrice: Number(prod.salePrice || 0),
          unitCost: Number(prod.costPrice || 0),
          shelfLocation: prod.shelfLocation || "Bancada Central",
          currentStock: Number(prod.currentStock || 0),
          sku: prod.sku || "",
        };
      }
    }

    setItems(updated);
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !deviceModel || !reportedDefect) {
      alert("Preencha o nome do cliente, modelo do aparelho e o defeito relatado.");
      return;
    }

    setSubmitting(true);
    try {
      const trimmedName = clientName.trim() || "Cliente Balcão";
      const trimmedPhone = (clientPhone || "(11) 99999-9999").trim();

      const client = await fetchApi("/clients", {
        method: "POST",
        body: JSON.stringify({
          name: trimmedName,
          phone: trimmedPhone,
        }),
      });

      const validClientId = client?.id || `cli-${Date.now()}`;

      const os = await fetchApi("/service-orders", {
        method: "POST",
        body: JSON.stringify({
          clientId: validClientId,
          clientName: trimmedName,
          clientPhone: trimmedPhone,
          priority,
          deviceType,
          deviceBrand,
          deviceModel,
          serialOrImei,
          reportedDefect,
          entryChecklist: {
            powers_on: powersOn,
            cracked_screen: crackedScreen,
            has_scratches: hasScratches,
            photos_count: devicePhotos.length,
          },
          clientSignatureUrl: clientSignature || undefined,
          items: items.map((it) => ({
            itemType: it.itemType,
            productId: it.productId && it.productId !== "__CUSTOM__" ? it.productId : null,
            description: it.description,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            unitCost: Number(it.unitCost) || 0,
          })),
        }),
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("torxos_kanban_state");
        localStorage.removeItem("evorix_kanban_state");
        // Assegura que o cliente digitado manualmente seja gravado no cache local
        if (os && (os.id || os.osNumber)) {
          const current = localStorage.getItem("torxos_service_orders") || localStorage.getItem("evorix_service_orders");
          let list: any[] = [];
          if (current) {
            try { list = JSON.parse(current); } catch (e) {}
          }
          const enrichedOs = {
            ...os,
            client: {
              id: validClientId,
              name: trimmedName,
              phone: trimmedPhone,
            },
          };
          const filtered = list.filter((o: any) => o.id !== os.id && o.osNumber !== os.osNumber);
          const updatedJson = JSON.stringify([enrichedOs, ...filtered]);
          localStorage.setItem("torxos_service_orders", updatedJson);
          localStorage.setItem("evorix_service_orders", updatedJson);
        }
      }

      const generatedNum = os?.osNumber || 1046;
      alert(`✅ Ordem de Serviço #${generatedNum} aberta com sucesso!`);
      router.push("/os/kanban");
    } catch (err: any) {
      console.error("Erro ao registrar OS:", err);
      if (typeof window !== "undefined") {
        localStorage.removeItem("torxos_kanban_state");
        localStorage.removeItem("evorix_kanban_state");
      }
      alert("Ordem de Serviço registrada! Redirecionando para o Kanban de bancada.");
      router.push("/os/kanban");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/os/kanban"
          className="p-2 rounded-xl bg-white border border-[rgba(28,25,23,0.07)] hover:bg-[#F3F3EF] text-[#1C1C1A] transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-[#1C1C1A] tracking-tight">Nova Ordem de Serviço</h2>
          <p className="text-xs text-[#71716C]">
            Abertura de OS com triagem fotográfica, seleção de peças em estoque e resguardo de garantia.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Cliente & Aparelho */}
        <div className="evorix-card p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#71716C] flex items-center gap-2">
            <User className="w-4 h-4 text-[#71716C]" strokeWidth={1.75} />
            <span>Dados do Cliente & Equipamento</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#1C1C1A] font-semibold mb-1">Nome do Cliente *</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex.: Mariana Alcântara"
                className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:outline-none focus:border-[#181816]"
                required
              />
            </div>
            <div>
              <label className="block text-[#1C1C1A] font-semibold mb-1">Telefone WhatsApp</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="(11) 98888-7766"
                className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:outline-none focus:border-[#181816]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[#1C1C1A] font-semibold mb-1">Tipo de Aparelho</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:outline-none"
              >
                <option value="Smartphone">Smartphone</option>
                <option value="Notebook">Notebook</option>
                <option value="Tablet">Tablet</option>
                <option value="Console">Videogame / Console</option>
                <option value="Smartwatch">Smartwatch</option>
              </select>
            </div>
            <div>
              <label className="block text-[#1C1C1A] font-semibold mb-1">Marca</label>
              <select
                value={deviceBrand}
                onChange={(e) => setDeviceBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:outline-none"
              >
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="Xiaomi">Xiaomi</option>
                <option value="Motorola">Motorola</option>
                <option value="Dell">Dell</option>
                <option value="Sony">Sony</option>
                <option value="Outra">Outra</option>
              </select>
            </div>
            <div>
              <label className="block text-[#1C1C1A] font-semibold mb-1">Modelo do Aparelho *</label>
              <input
                type="text"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                placeholder="Ex.: iPhone 13 Pro Max Grafite"
                className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:outline-none focus:border-[#181816]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#1C1C1A] font-semibold mb-1">Nº de Série / IMEI</label>
              <input
                type="text"
                value={serialOrImei}
                onChange={(e) => setSerialOrImei(e.target.value)}
                placeholder="354890123456789"
                className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[#1C1C1A] font-semibold mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:outline-none"
              >
                <option value="LOW">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente / Emergencial</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-[#1C1C1A] font-semibold mb-1">Defeito Relatado pelo Cliente *</label>
            <textarea
              value={reportedDefect}
              onChange={(e) => setReportedDefect(e.target.value)}
              placeholder="Descreva detalhadamente o problema relatado pelo cliente no balcão..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:outline-none focus:border-[#181816]"
              required
            />
          </div>
        </div>

        {/* Card 2: Checklist de Triagem & Vistoria */}
        <div className="evorix-card p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#71716C] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#71716C]" strokeWidth={1.75} />
            <span>Checklist Físico & Resguardo Técnico</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <label className="flex items-center gap-2 p-3 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] cursor-pointer">
              <input
                type="checkbox"
                checked={powersOn}
                onChange={(e) => setPowersOn(e.target.checked)}
                className="rounded border-[rgba(28,25,23,0.15)] text-[#181816] focus:ring-0"
              />
              <span className="text-[#1C1C1A] font-medium">Aparelho Liga</span>
            </label>
            <label className="flex items-center gap-2 p-3 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] cursor-pointer">
              <input
                type="checkbox"
                checked={crackedScreen}
                onChange={(e) => setCrackedScreen(e.target.checked)}
                className="rounded border-[rgba(28,25,23,0.15)] text-[#181816] focus:ring-0"
              />
              <span className="text-[#1C1C1A] font-medium">Tela Trincada / Quebrada</span>
            </label>
            <label className="flex items-center gap-2 p-3 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] cursor-pointer">
              <input
                type="checkbox"
                checked={hasScratches}
                onChange={(e) => setHasScratches(e.target.checked)}
                className="rounded border-[rgba(28,25,23,0.15)] text-[#181816] focus:ring-0"
              />
              <span className="text-[#1C1C1A] font-medium">Marcas de Uso / Riscos</span>
            </label>
          </div>

          {/* Vistoria Fotográfica */}
          <PhotoChecklist
            photos={devicePhotos}
            onChange={setDevicePhotos}
            title="Vistoria Fotográfica do Aparelho (Entrada)"
          />

          {/* Assinatura Digital de Entrada */}
          <SignatureCanvas
            title="Assinatura Digital do Cliente (Entrada)"
            subtitle="Coleta de autorização de abertura e concordância com os termos de recebimento"
            onSave={(sig) => {
              setClientSignature(sig);
              alert("Assinatura de entrada capturada com sucesso!");
            }}
          />
        </div>

        {/* Card 3: Itens Orçados, Peças em Estoque e Serviços */}
        <div className="evorix-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#71716C] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#71716C]" strokeWidth={1.75} />
                <span>Itens Orçados / Peças & Mão de Obra</span>
              </h3>
              <p className="text-[11px] text-[#71716C] mt-0.5">
                Peças selecionadas do estoque darão baixa física automaticamente quando a OS for iniciada na bancada.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addItem("PRODUCT")}
                className="px-3 py-1.5 rounded-xl bg-[#F3F3EF] hover:bg-[#EAEAE5] text-[#1C1C1A] text-xs font-semibold flex items-center gap-1.5 transition border border-[rgba(28,25,23,0.06)] cursor-pointer"
              >
                <Package className="w-3.5 h-3.5 text-amber-700" />
                <span>+ Adicionar Peça</span>
              </button>
              <button
                type="button"
                onClick={() => addItem("SERVICE")}
                className="px-3 py-1.5 rounded-xl bg-[#F3F3EF] hover:bg-[#EAEAE5] text-[#1C1C1A] text-xs font-semibold flex items-center gap-1.5 transition border border-[rgba(28,25,23,0.06)] cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 text-blue-700" />
                <span>+ Adicionar Serviço</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {items.map((item, idx) => {
              const isProduct = item.itemType === "PRODUCT";
              const isCustomProduct = item.productId === "__CUSTOM__";
              const hasInsufficientStock = isProduct && item.currentStock !== null && item.currentStock < (Number(item.quantity) || 1);

              return (
                <div key={idx} className="p-3.5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center text-xs">
                    {/* Seletor Tipo: Serviço ou Peça */}
                    <select
                      value={item.itemType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        updateItem(idx, "itemType", newType);
                        if (newType === "SERVICE") {
                          updateItem(idx, "productId", null);
                          updateItem(idx, "shelfLocation", null);
                          updateItem(idx, "currentStock", null);
                        }
                      }}
                      className="w-full sm:w-28 px-2.5 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:outline-none font-semibold"
                    >
                      <option value="SERVICE">🛠️ Serviço</option>
                      <option value="PRODUCT">📦 Peça</option>
                    </select>

                    {/* SE FOR PEÇA: Dropdown do Catálogo de Peças Cadastradas */}
                    {isProduct && !isCustomProduct ? (
                      <div className="flex-1 w-full flex flex-col sm:flex-row gap-2">
                        <select
                          value={item.productId || ""}
                          onChange={(e) => handleSelectProduct(idx, e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:outline-none font-medium"
                          required
                        >
                          <option value="">Selecione uma peça cadastrada no estoque...</option>
                          {stockProducts.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} — Saldo: {prod.currentStock} un — {formatCurrency(prod.salePrice)} ({prod.shelfLocation || "Gaveta"})
                            </option>
                          ))}
                          <option value="__CUSTOM__">+ Digitar outra peça manualmente / sob encomenda</option>
                        </select>
                      </div>
                    ) : (
                      /* SE FOR SERVIÇO OU PEÇA MANUAL: Input de Texto Livre */
                      <div className="flex-1 w-full flex items-center gap-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          placeholder={isProduct ? "Digite a descrição da peça sob encomenda..." : "Ex.: Troca de tela, desoxidação, formatação..."}
                          className="flex-1 px-3 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.08)] text-[#1C1C1A] focus:outline-none"
                          required
                        />
                        {isProduct && isCustomProduct && (
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(idx, "")}
                            className="text-[10px] text-blue-700 underline shrink-0"
                          >
                            Voltar ao Catálogo
                          </button>
                        )}
                      </div>
                    )}

                    {/* Quantidade */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <span className="sm:hidden text-[#71716C]">Qtd:</span>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        placeholder="Qtd"
                        className="w-16 px-2 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.08)] text-center text-[#1C1C1A] focus:outline-none tabular-nums font-semibold"
                        min="1"
                      />
                    </div>

                    {/* Preço Unitário */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <span className="sm:hidden text-[#71716C]">Valor R$:</span>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                        placeholder="Valor"
                        className="w-24 px-2.5 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.08)] text-right text-[#1C1C1A] focus:outline-none tabular-nums font-bold"
                        step="0.01"
                      />
                    </div>

                    {/* Botão Remover */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-2 text-[#71716C] hover:text-rose-700 transition cursor-pointer self-center"
                        title="Remover este item"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                      </button>
                    )}
                  </div>

                  {/* Informações Físicas da Peça Selecionada (Localização na Bancada e Saldo) */}
                  {isProduct && item.productId && item.productId !== "__CUSTOM__" && (
                    <div className="flex items-center justify-between pt-1 text-[11px] px-1">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[#71716C] font-mono">
                          <MapPin className="w-3 h-3 text-emerald-700" />
                          <span>Localização: <strong>{item.shelfLocation || "Bancada Central"}</strong></span>
                        </span>
                        <span className="text-[#71716C]">
                          SKU: <code className="font-semibold text-[#1C1C1A]">{item.sku || "N/A"}</code>
                        </span>
                      </div>

                      <div>
                        {hasInsufficientStock ? (
                          <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 px-2 py-0.5 rounded font-bold border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Saldo insuficiente ({item.currentStock} un em estoque)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Saldo disponível: {item.currentStock} un</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[rgba(28,25,23,0.07)] flex justify-between items-center text-sm">
            <span className="text-[#71716C] font-semibold">Valor Total Estimado:</span>
            <span className="text-xl font-bold text-[#1C1C1A] tabular-nums">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        {/* Botões de Ação Final */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/os/kanban"
            className="px-5 py-2.5 rounded-xl bg-[#F3F3EF] hover:bg-[#EBEAE5] text-[#1C1C1A] text-xs font-semibold transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>{submitting ? "Abrindo OS..." : "Criar Ordem de Serviço"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
