"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Search,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  Package,
  X,
  CheckCircle2,
  Check,
  Sparkles,
  RefreshCw,
  Trash2,
  Pencil,
  Save,
  Printer,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { formatCurrency, translateStockRisk } from "@/lib/utils";
import { ImageUploader } from "@/components/ui/image-uploader";
import { PrintHeader } from "@/components/ui/print-header";

const DEFAULT_PRODUCTS = [
  {
    id: "prod-001",
    sku: "TEL-IPH13-OLED",
    name: "Tela OLED Original iPhone 13 Pro Max",
    category: "Telas e Displays",
    brand: "Apple",
    currentStock: 2,
    costPrice: 380.0,
    salePrice: 890.0,
    shelfLocation: "Gaveta B-04",
    stockoutRiskStatus: "CRITICAL",
  },
  {
    id: "prod-002",
    sku: "BAT-SAMS22-ORIG",
    name: "Bateria Original Samsung Galaxy S22",
    category: "Baterias",
    brand: "Samsung",
    currentStock: 5,
    costPrice: 95.0,
    salePrice: 240.0,
    shelfLocation: "Gaveta A-12",
    stockoutRiskStatus: "WARNING",
  },
  {
    id: "prod-003",
    sku: "CON-USBC-UNIV",
    name: "Conector de Carga USB-C Universal SMD",
    category: "Conectores",
    brand: "Generic",
    currentStock: 45,
    costPrice: 8.0,
    salePrice: 90.0,
    shelfLocation: "Gaveta C-01",
    stockoutRiskStatus: "HEALTHY",
  },
];

export default function StockCatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Telas e Displays");
  const [brand, setBrand] = useState("Apple");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [currentStock, setCurrentStock] = useState("10");
  const [shelfLocation, setShelfLocation] = useState("Gaveta A-01");
  const [leadTimeDays, setLeadTimeDays] = useState("3");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setName("");
    setSku("");
    setCategory("Telas e Displays");
    setBrand("Apple");
    setImageUrl(null);
    setCostPrice("");
    setSalePrice("");
    setCurrentStock("10");
    setShelfLocation("Gaveta A-01");
    setLeadTimeDays("3");
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    setEditingProduct(product);
    setName(product.name || "");
    setSku(product.sku || "");
    setCategory(product.category || "Telas e Displays");
    setBrand(product.brand || "Geral");
    setImageUrl(product.imageUrl || null);
    setCostPrice(product.costPrice !== undefined ? product.costPrice.toString() : "");
    setSalePrice(product.salePrice !== undefined ? product.salePrice.toString() : "");
    setCurrentStock(product.currentStock !== undefined ? product.currentStock.toString() : "0");
    setShelfLocation(product.shelfLocation || "Gaveta A-01");
    setLeadTimeDays(product.supplierLeadTimeDays ? product.supplierLeadTimeDays.toString() : "3");
    setModalOpen(true);
  };

  const loadCatalog = async () => {
    setLoading(true);
    try {
      // 1. Carrega produtos em cache local primeiro para exibição instantânea
      let localSaved: any[] = [];
      if (typeof window !== "undefined") {
        const savedStr = localStorage.getItem("evorix_stock_products");
        if (savedStr) {
          try {
            localSaved = JSON.parse(savedStr);
          } catch (e) {}
        }
      }

      // 2. Busca na API NestJS
      const data = await fetchApi("/stock/products");

      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);

    if (editingProduct) {
      const updatedProduct = {
        ...editingProduct,
        name: name.trim(),
        sku: sku.trim() || editingProduct.sku,
        category,
        brand,
        imageUrl: imageUrl || null,
        costPrice: parseFloat(costPrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        currentStock: parseFloat(currentStock) || 0,
        shelfLocation: shelfLocation.trim() || "Bancada Central",
        supplierLeadTimeDays: parseInt(leadTimeDays) || 3,
      };

      setProducts((prev) => {
        const next = prev.map((p) => (p.id === editingProduct.id ? updatedProduct : p));
        if (typeof window !== "undefined") {
          localStorage.setItem("evorix_stock_products", JSON.stringify(next));
        }
        return next;
      });

      setModalOpen(false);

      try {
        await fetchApi(`/stock/products/${editingProduct.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: updatedProduct.name,
            sku: updatedProduct.sku,
            category: updatedProduct.category,
            brand: updatedProduct.brand,
            imageUrl: updatedProduct.imageUrl,
            costPrice: updatedProduct.costPrice,
            salePrice: updatedProduct.salePrice,
            currentStock: updatedProduct.currentStock,
            shelfLocation: updatedProduct.shelfLocation,
            supplierLeadTimeDays: updatedProduct.supplierLeadTimeDays,
          }),
        });
        showToast(`Peça "${updatedProduct.name}" atualizada com sucesso!`);
      } catch (err: any) {
        showToast(`Peça "${updatedProduct.name}" atualizada no catálogo local!`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const generatedSku = sku.trim() || `SKU-${name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const tempId = `prod-${Date.now()}`;

    const newProductItem = {
      id: tempId,
      name: name.trim(),
      sku: generatedSku,
      category,
      brand,
      imageUrl: imageUrl || null,
      costPrice: parseFloat(costPrice) || 0,
      salePrice: parseFloat(salePrice) || 0,
      currentStock: parseFloat(currentStock) || 0,
      shelfLocation: shelfLocation.trim() || "Bancada Central",
      supplierLeadTimeDays: parseInt(leadTimeDays) || 3,
      stockoutRiskStatus: "HEALTHY",
      isNew: true,
      createdAt: new Date().toISOString(),
    };

    // 1. Atualização Otimista Imediata na UI e no localStorage
    setProducts((prev) => {
      const updated = [newProductItem, ...prev.filter((p) => p.sku !== generatedSku)];
      if (typeof window !== "undefined") {
        localStorage.setItem("evorix_stock_products", JSON.stringify(updated));
      }
      return updated;
    });

    setNewlyCreatedId(tempId);
    setSearch(""); // Limpa filtro de busca para o produto ficar visível no topo
    setModalOpen(false);

    // 2. Dispara gravação persistente na API NestJS
    try {
      await fetchApi("/stock/products", {
        method: "POST",
        body: JSON.stringify({
          name: newProductItem.name,
          sku: newProductItem.sku,
          category: newProductItem.category,
          brand: newProductItem.brand,
          imageUrl: newProductItem.imageUrl,
          costPrice: newProductItem.costPrice,
          salePrice: newProductItem.salePrice,
          currentStock: newProductItem.currentStock,
          shelfLocation: newProductItem.shelfLocation,
          supplierLeadTimeDays: newProductItem.supplierLeadTimeDays,
        }),
      });
      showToast(`Peça "${newProductItem.name}" cadastrada com sucesso!`);
    } catch (err: any) {
      console.warn("Peça salva em modo offline resiliente:", err.message);
      showToast(`Peça "${newProductItem.name}" salva no catálogo local!`);
    } finally {
      setSubmitting(false);
      // Reset form
      setName("");
      setSku("");
      setImageUrl(null);
      setCostPrice("");
      setSalePrice("");
      setCurrentStock("10");
      setShelfLocation("Gaveta A-01");
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (!confirm(`Deseja remover "${productName}" do catálogo?`)) return;

    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      if (typeof window !== "undefined") {
        localStorage.setItem("evorix_stock_products", JSON.stringify(updated));
      }
      return updated;
    });
    showToast(`Peça "${productName}" removida do catálogo.`);
  };

  const handleResetCatalog = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("evorix_stock_products");
    }
    loadCatalog();
    showToast("Catálogo padrão restaurado.");
  };

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
      (p.shelfLocation && p.shelfLocation.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho Oficial Exclusivo para Impressão / PDF com Perfil da Empresa */}
      <PrintHeader
        title="Inventário & Posição de Estoque"
        subtitle={`Posição Física de Peças e Componentes • Total: ${filtered.length} registro(s)`}
        documentType="Almoxarifado"
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181816] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-stone-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#1C1C1A] tracking-tight">Catálogo de Peças & Produtos</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3F3EF] text-[#71716C] font-semibold border border-[rgba(28,25,23,0.06)]">
              {products.length} {products.length === 1 ? "peça cadastrada" : "peças cadastradas"}
            </span>
          </div>
          <p className="text-xs text-[#71716C] mt-0.5">
            Cadastre novas peças, consulte saldos físicos por gaveta e gerencie preços de custo e balcão.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.07)] text-[#71716C] hover:text-[#1C1C1A] font-semibold text-xs flex items-center gap-1.5 transition shadow-[0px_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Imprimir / PDF</span>
          </button>

          <button
            onClick={handleResetCatalog}
            title="Sincronizar e restaurar peças do banco"
            className="px-3 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.07)] text-[#71716C] hover:text-[#1C1C1A] font-medium text-xs flex items-center gap-1.5 transition shadow-[0px_1px_2px_rgba(0,0,0,0.02)]"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Sincronizar</span>
          </button>

          <Link
            href="/estoque/ruptura"
            className="px-3.5 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.07)] text-[#71716C] hover:text-[#1C1C1A] font-medium text-xs flex items-center gap-1.5 transition shadow-[0px_1px_2px_rgba(0,0,0,0.02)]"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" strokeWidth={1.75} />
            <span>Semáforo Preditivo</span>
          </Link>

          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" strokeWidth={1.75} />
            <span>Cadastrar Peça</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtro */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#71716C] absolute left-3 top-2.5" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome da peça, SKU, gaveta, marca ou categoria..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.07)] text-xs text-[#1C1C1A] placeholder:text-[#A1A19B] focus:outline-none focus:border-[#181816] shadow-[0px_1px_2px_rgba(0,0,0,0.02)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-[#A1A19B] hover:text-[#1C1C1A]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabela do Catálogo */}
      <div className="evorix-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F9F7] border-b border-[rgba(28,25,23,0.07)] uppercase tracking-wider text-[#71716C] font-bold">
              <tr>
                <th className="py-3.5 px-4">Peça / Descrição</th>
                <th className="py-3.5 px-4">SKU / Marca</th>
                <th className="py-3.5 px-4">Localização Física</th>
                <th className="py-3.5 px-4 text-center">Saldo em Estoque</th>
                <th className="py-3.5 px-4 text-right">Preço de Custo</th>
                <th className="py-3.5 px-4 text-right">Preço de Balcão</th>
                <th className="py-3.5 px-4 text-center">Status Preditivo</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(28,25,23,0.06)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#71716C]">
                    Carregando peças do catálogo...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#A1A19B]">
                    Nenhuma peça encontrada para "{search}".
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isRecent = item.id === newlyCreatedId;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#F9F9F7] transition ${
                        isRecent ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#1C1C1A]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl border border-[rgba(28,25,23,0.08)] bg-[#F9F9F7] flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-[#A1A19B]" strokeWidth={1.5} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{item.name}</span>
                              {isRecent && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase">
                                  Recente
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#A1A19B] font-normal block mt-0.5">
                              {item.category || "Geral"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#71716C]">
                        {item.sku || "N/A"} • {item.brand || "Geral"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#71716C]">
                        {item.shelfLocation || "Bancada Central"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#1C1C1A] tabular-nums">
                        {item.currentStock} un
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#71716C] tabular-nums">
                        {formatCurrency(item.costPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#1C1C1A] tabular-nums">
                        {formatCurrency(item.salePrice)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            item.stockoutRiskStatus === "CRITICAL"
                              ? "bg-[#FEE2E2] text-rose-800 border-[#FECACA]"
                              : item.stockoutRiskStatus === "WARNING"
                              ? "bg-[#FEF3C7] text-amber-800 border-[#FDE68A]"
                              : "bg-[#DCFCE7] text-emerald-800 border-[#BBF7D0]"
                          }`}
                        >
                          {translateStockRisk(item.stockoutRiskStatus)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Editar cadastro da peça"
                            className="p-1.5 rounded-lg text-[#71716C] hover:text-[#1C1C1A] hover:bg-[#EAEAE5] transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(item.id, item.name)}
                            title="Remover peça"
                            className="p-1.5 rounded-lg text-[#A1A19B] hover:text-rose-700 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição de Peça (Design System Luxury Off-White) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#1C1C1A]/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full p-6 rounded-2xl bg-white border border-[rgba(28,25,23,0.07)] shadow-elevated space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(28,25,23,0.07)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#181816] text-amber-200 flex items-center justify-center shadow-sm">
                  <Package className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold text-sm text-[#1C1C1A]">
                  {editingProduct ? "Editar Peça do Catálogo" : "Cadastrar Nova Peça no Estoque"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#71716C] hover:text-[#1C1C1A] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <ImageUploader
                value={imageUrl}
                onChange={setImageUrl}
                label="Foto / Imagem da Peça"
                maxDimension={700}
                maxSizeKB={250}
              />

              <div>
                <label className="block text-[#1C1C1A] font-semibold mb-1">
                  Nome / Descrição da Peça *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Display OLED iPhone 14 Pro Max Original"
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1C1C1A] font-semibold mb-1">
                    Código SKU / Part Number
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ex.: TEL-IPH14PM-01"
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                  />
                </div>
                <div>
                  <label className="block text-[#1C1C1A] font-semibold mb-1">
                    Marca / Fabricante
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex.: Apple, Samsung, Xiaomi"
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1C1C1A] font-semibold mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                  >
                    <option value="Telas e Displays">Telas e Displays</option>
                    <option value="Baterias">Baterias</option>
                    <option value="Conectores de Carga">Conectores de Carga</option>
                    <option value="Câmeras e Lentes">Câmeras e Lentes</option>
                    <option value="Carcaças e Tampas">Carcaças e Tampas</option>
                    <option value="Componentes SMD e CI">Componentes SMD e CI</option>
                    <option value="Cabos Flex">Cabos Flex</option>
                    <option value="Acessórios">Acessórios</option>
                    <option value="Eletrônicos">Eletrônicos</option>
                    <option value="Celulares e Smartphones">Celulares e Smartphones</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#1C1C1A] font-semibold mb-1">
                    Localização (Gaveta / Prateleira)
                  </label>
                  <input
                    type="text"
                    value={shelfLocation}
                    onChange={(e) => setShelfLocation(e.target.value)}
                    placeholder="Ex.: Gaveta B-12"
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#1C1C1A] font-semibold mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[#1C1C1A] font-semibold mb-1">
                    Preço Balcão (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A] tabular-nums font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[#1C1C1A] font-semibold mb-1">
                    {editingProduct ? "Saldo em Estoque" : "Saldo Inicial (Qtd)"}
                  </label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A] tabular-nums font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F3F3EF] hover:bg-[#EAEAE5] text-[#1C1C1A] font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                >
                  {editingProduct ? (
                    <Save className="w-3.5 h-3.5 text-amber-300" strokeWidth={1.75} />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-amber-300" strokeWidth={1.75} />
                  )}
                  <span>{submitting ? "Salvando..." : editingProduct ? "Salvar Alterações" : "Cadastrar no Catálogo"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
