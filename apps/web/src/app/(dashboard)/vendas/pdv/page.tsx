"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Tag,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  Printer,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  Users,
  Zap,
  Package,
  FileDown,
  X,
} from "lucide-react";
import { fetchApi, getCurrentUser } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  imageUrl?: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  quantity: number;
  discountAmount: number;
  imeiOrSerial?: string;
}

export default function PdvPage() {
  const router = useRouter();

  // Estados do Catálogo e Busca
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [tenantInfo, setTenantInfo] = useState<any | null>(null);

  // Estados do Carrinho de Venda
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [discountGlobal, setDiscountGlobal] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");

  // Modal de Fechamento de Pagamento
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [receivedAmountStr, setReceivedAmountStr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal de Cadastro Rápido de Produto no PDV (F3)
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Acessórios");
  const [newProdBarcode, setNewProdBarcode] = useState("");
  const [newProdCostPrice, setNewProdCostPrice] = useState("");
  const [newProdProfitMargin, setNewProdProfitMargin] = useState("");
  const [newProdSalePrice, setNewProdSalePrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("10");
  const [newProdShelf, setNewProdShelf] = useState("Balcão Central");
  const [autoAddToCart, setAutoAddToCart] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);

  // Handlers de Cálculo Bidirecional de Margem no PDV
  const handleNewProdCostPriceChange = (val: string) => {
    setNewProdCostPrice(val);
    const c = parseFloat(val);
    const m = parseFloat(newProdProfitMargin);
    if (!isNaN(c) && !isNaN(m) && c > 0) {
      setNewProdSalePrice((c * (1 + m / 100)).toFixed(2));
    } else if (!isNaN(c) && c > 0 && parseFloat(newProdSalePrice) > 0) {
      const s = parseFloat(newProdSalePrice);
      setNewProdProfitMargin((((s - c) / c) * 100).toFixed(1));
    }
  };

  const handleNewProdProfitMarginChange = (val: string) => {
    setNewProdProfitMargin(val);
    const m = parseFloat(val);
    const c = parseFloat(newProdCostPrice);
    if (!isNaN(c) && !isNaN(m) && c > 0) {
      setNewProdSalePrice((c * (1 + m / 100)).toFixed(2));
    }
  };

  const handleNewProdSalePriceChange = (val: string) => {
    setNewProdSalePrice(val);
    const s = parseFloat(val);
    const c = parseFloat(newProdCostPrice);
    if (!isNaN(c) && !isNaN(s) && c > 0) {
      setNewProdProfitMargin((((s - c) / c) * 100).toFixed(1));
    }
  };

  // Modal de Cadastro Rápido de Cliente no PDV
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientDocument, setNewClientDocument] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [savingClient, setSavingClient] = useState(false);
  const [clientModalError, setClientModalError] = useState("");

  // Modal de Comprovante Concluído
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  // Handlers de Impressão Isolada do Comprovante de Venda
  const handlePrintThermal = () => {
    document.body.classList.remove("printing-a4");
    document.body.classList.add("printing-receipt");
    setTimeout(() => {
      window.print();
      const cleanUp = () => {
        document.body.classList.remove("printing-receipt");
        window.removeEventListener("afterprint", cleanUp);
      };
      window.addEventListener("afterprint", cleanUp);
      setTimeout(() => document.body.classList.remove("printing-receipt"), 1500);
    }, 150);
  };

  const handlePrintA4 = () => {
    document.body.classList.remove("printing-receipt");
    document.body.classList.add("printing-a4");
    setTimeout(() => {
      window.print();
      const cleanUp = () => {
        document.body.classList.remove("printing-a4");
        window.removeEventListener("afterprint", cleanUp);
      };
      window.addEventListener("afterprint", cleanUp);
      setTimeout(() => document.body.classList.remove("printing-a4"), 1500);
    }, 150);
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Carrega catálogo inicial de produtos e clientes
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingCatalog(true);
        const [prodData, clientData, settingsData] = await Promise.all([
          fetchApi("/stock/products"),
          fetchApi("/clients").catch(() => []),
          fetchApi("/tenant/settings").catch(() => null),
        ]);
        const validProds = Array.isArray(prodData) ? prodData : [];
        setProducts(validProds);
        setSearchResults(validProds.slice(0, 8));
        setClients(Array.isArray(clientData) ? clientData : []);
        if (settingsData) {
          setTenantInfo(settingsData);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do PDV:", err);
      } finally {
        setLoadingCatalog(false);
      }
    }
    loadData();
  }, []);

  // 2. Atalhos de Teclado Globais do PDV
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F3: Abrir Cadastro Rápido de Produto
      if (e.key === "F3") {
        e.preventDefault();
        setShowNewProductModal(true);
      }
      // F4: Focar busca de produtos
      if (e.key === "F4") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // F8: Abrir Fechamento de Venda
      if (e.key === "F8" && cart.length > 0 && !showCheckoutModal && !showNewProductModal) {
        e.preventDefault();
        setShowCheckoutModal(true);
      }
      // Escape: Fechar modais
      if (e.key === "Escape") {
        if (showNewProductModal) {
          e.preventDefault();
          setShowNewProductModal(false);
        } else if (showCheckoutModal) {
          e.preventDefault();
          setShowCheckoutModal(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, showCheckoutModal, showNewProductModal]);

  // 3. Busca dinâmica com filtro por Nome, SKU, Categoria ou Código de Barras
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(products.slice(0, 8));
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.barcode?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
    );
    setSearchResults(filtered);

    // Se houver correspondência exata de código de barras (leitor de BIP)
    if (filtered.length === 1 && pExactMatch(filtered[0], searchTerm)) {
      handleAddToCart(filtered[0]);
      setSearchTerm("");
    }
  }, [searchTerm, products]);

  const pExactMatch = (prod: any, term: string) => {
    return prod.barcode === term || prod.sku === term;
  };

  // 4. Adicionar item ao carrinho
  const handleAddToCart = (product: any) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku || "",
          imageUrl: product.imageUrl || undefined,
          category: product.category || "Acessórios",
          unitPrice: Number(product.salePrice) || 0,
          currentStock: Number(product.currentStock) || 0,
          quantity: 1,
          discountAmount: 0,
          imeiOrSerial: "",
        },
      ];
    });
  };

  // 5. Ajustar quantidade
  const handleUpdateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  // 6. Atualizar IMEI/Serial (Celulares)
  const handleUpdateImei = (index: number, imei: string) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index].imeiOrSerial = imei;
      return updated;
    });
  };

  // 7. Remover item
  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // 8. Limpar carrinho
  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Deseja cancelar esta venda e limpar todos os itens?")) {
      setCart([]);
      setDiscountGlobal("0");
      setNotes("");
    }
  };

  // Cálculos Financeiros em tempo real
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalItemDiscount = cart.reduce((sum, item) => sum + item.discountAmount, 0);
  const globalDiscountNum = parseFloat(discountGlobal) || 0;
  const netTotal = Math.max(0, subtotal - totalItemDiscount - globalDiscountNum);

  const receivedAmountNum = parseFloat(receivedAmountStr) || netTotal;
  const changeAmount = receivedAmountNum > netTotal ? receivedAmountNum - netTotal : 0;

  // 9. Concluir Venda no Backend
  const handleConfirmSale = async () => {
    if (cart.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      const payload = {
        clientId: selectedClientId || undefined,
        paymentMethod,
        discountAmount: globalDiscountNum,
        receivedAmount: paymentMethod === "CASH" ? receivedAmountNum : netTotal,
        notes: notes.trim() || undefined,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountAmount: i.discountAmount,
          imeiOrSerial: i.imeiOrSerial?.trim() || undefined,
        })),
      };

      const sale = await fetchApi("/sales", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Atualiza os saldos do catálogo local
      setProducts((prev) =>
        prev.map((p) => {
          const soldItem = cart.find((i) => i.productId === p.id);
          if (soldItem) {
            return { ...p, currentStock: Math.max(0, Number(p.currentStock) - soldItem.quantity) };
          }
          return p;
        })
      );

      // Abre comprovante térmico para impressão imediata
      setCompletedSale(sale);
      setShowCheckoutModal(false);
      setCart([]);
      setDiscountGlobal("0");
      setReceivedAmountStr("");
      setNotes("");
    } catch (err: any) {
      alert(`Erro ao registrar venda: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 10. Cadastro Rápido de Produto no PDV (F3)
  const handleQuickCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || savingProduct) return;

    setSavingProduct(true);
    try {
      const generatedSku = newProdBarcode.trim() || `SKU-${Date.now().toString().slice(-4)}`;
      const payload = {
        name: newProdName.trim(),
        sku: generatedSku,
        barcode: newProdBarcode.trim() || generatedSku,
        category: newProdCategory,
        costPrice: parseFloat(newProdCostPrice) || 0,
        salePrice: parseFloat(newProdSalePrice) || 0,
        currentStock: parseFloat(newProdStock) || 0,
        shelfLocation: newProdShelf.trim() || "Balcão Central",
      };

      const created = await fetchApi("/stock/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const newProd = created && created.id ? created : { ...payload, id: `prod-${Date.now()}` };

      // Atualiza catálogo do PDV
      setProducts((prev) => [newProd, ...prev]);
      setSearchResults((prev) => [newProd, ...prev]);

      // Adiciona ao carrinho imediatamente se solicitado
      if (autoAddToCart) {
        handleAddToCart(newProd);
      }

      // Limpa formulário e fecha modal
      setNewProdName("");
      setNewProdBarcode("");
      setNewProdCostPrice("");
      setNewProdSalePrice("");
      setNewProdStock("10");
      setShowNewProductModal(false);
    } catch (err: any) {
      alert(`Erro ao cadastrar produto: ${err.message}`);
    } finally {
      setSavingProduct(false);
    }
  };

  // 11. Cadastro Rápido de Cliente no PDV
  const handleQuickCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim() || savingClient) return;

    setSavingClient(true);
    setClientModalError("");
    try {
      const payload = {
        name: newClientName.trim(),
        phone: newClientPhone.trim(),
        document: newClientDocument.trim() || undefined,
        email: newClientEmail.trim() || undefined,
        address: newClientAddress.trim() || undefined,
      };

      const created = await fetchApi("/clients", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (created && created.id) {
        setClients((prev) => [created, ...prev]);
        setSelectedClientId(created.id);
      }

      setShowNewClientModal(false);
      setNewClientName("");
      setNewClientPhone("");
      setNewClientDocument("");
      setNewClientEmail("");
      setNewClientAddress("");
    } catch (err: any) {
      setClientModalError(err.message || "Erro ao cadastrar cliente.");
    } finally {
      setSavingClient(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Cabeçalho do PDV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[rgba(28,25,23,0.08)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1C1C1A] text-white flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#1C1C1A] tracking-tight">Frente de Caixa (PDV)</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Caixa Aberto
              </span>
            </div>
            <p className="text-xs text-[#71716C]">
              Venda rápida de balcão de acessórios, eletrônicos e celulares com baixa automática de estoque.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowNewProductModal(true)}
            className="px-3 py-1.5 rounded-lg bg-[#1C1C1A] text-white hover:bg-black transition font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Produto (F3)</span>
          </button>
          <Link
            href="/vendas"
            className="px-3 py-1.5 rounded-lg border border-[rgba(28,25,23,0.12)] text-[#1C1C1A] hover:bg-[#F3F3EF] transition font-medium flex items-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5 text-[#71716C]" />
            <span className="hidden sm:inline">Histórico de Vendas</span>
          </Link>
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#71716C] bg-[#F9F9F7] px-2.5 py-1.5 rounded-lg border border-[rgba(28,25,23,0.06)] font-mono">
            <span>F3: Cadastrar</span>
            <span>•</span>
            <span>F4: Buscar</span>
            <span>•</span>
            <span>F8: Fechar</span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Produtos / Busca (Esquerda) vs Carrinho & Fechamento (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Painel Esquerdo: Busca de Produtos e Acesso Rápido (7 colunas) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Busca com Leitor de Código de Barras */}
          <div className="bg-white p-3 rounded-xl border border-[rgba(28,25,23,0.08)] shadow-sm space-y-2">
            <label className="text-[11px] font-semibold text-[#71716C] uppercase tracking-wider flex items-center gap-1.5">
              <Barcode className="w-3.5 h-3.5 text-[#1C1C1A]" />
              <span>Bipar Código de Barras ou Digitar Nome / SKU (F4)</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#A1A19B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ex: Capinha iPhone 13, Película 3D, Carregador 20W, SKU-890..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1C1C1A] text-[#1C1C1A] placeholder:text-[#A1A19B]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A1A19B] hover:text-[#1C1C1A]"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Grade de Produtos de Acesso Rápido */}
          <div className="bg-white p-4 rounded-xl border border-[rgba(28,25,23,0.08)] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Catálogo de Balcão ({searchResults.length})</span>
              </h2>
              <span className="text-[11px] text-[#71716C]">Clique para adicionar ao carrinho</span>
            </div>

            {loadingCatalog ? (
              <div className="py-12 text-center text-xs text-[#71716C]">Carregando catálogo de estoque...</div>
            ) : searchResults.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#A1A19B] border border-dashed border-[rgba(28,25,23,0.12)] rounded-xl">
                Nenhum produto encontrado para &quot;{searchTerm}&quot;
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {searchResults.map((prod) => {
                  const stock = Number(prod.currentStock || 0);
                  const isOutOfStock = stock <= 0;
                  const isCellPhone =
                    prod.category?.toLowerCase().includes("celular") ||
                    prod.category?.toLowerCase().includes("smartphone") ||
                    prod.category?.toLowerCase().includes("aparelho");

                  return (
                    <button
                      key={prod.id}
                      onClick={() => handleAddToCart(prod)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition group relative ${
                        isOutOfStock
                          ? "bg-rose-50/40 border-rose-100 opacity-80"
                          : "bg-[#F9F9F7] border-[rgba(28,25,23,0.08)] hover:border-[#1C1C1A] hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      <div>
                        {prod.imageUrl ? (
                          <div className="w-full h-20 mb-2 rounded-lg overflow-hidden border border-[rgba(28,25,23,0.06)] bg-white flex items-center justify-center">
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9px] font-mono font-medium text-[#71716C] truncate">
                            {prod.sku || "PROD"}
                          </span>
                          {isCellPhone && (
                            <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                              Celular
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-[#1C1C1A] line-clamp-2 leading-tight">
                          {prod.name}
                        </h3>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[rgba(28,25,23,0.06)] flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#1C1C1A]">
                          {formatCurrency(prod.salePrice)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                            stock <= 2
                              ? "bg-rose-100 text-rose-800"
                              : "bg-[#EAEAE5] text-[#71716C]"
                          }`}
                        >
                          {stock} un
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Painel Direito: Carrinho de Compras & Fechamento (5 colunas) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[rgba(28,25,23,0.08)] shadow-sm flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(28,25,23,0.08)]">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#1C1C1A]" />
                  <h2 className="text-sm font-bold text-[#1C1C1A]">Itens da Venda ({cart.length})</h2>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpar</span>
                  </button>
                )}
              </div>

              {/* Seletor Rápido de Cliente */}
              <div className="bg-[#F9F9F7] p-2.5 rounded-lg border border-[rgba(28,25,23,0.06)] space-y-1">
                <label className="text-[10px] font-bold text-[#71716C] uppercase flex items-center gap-1">
                  <User className="w-3 h-3 text-[#1C1C1A]" />
                  <span>Cliente do Balcão</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-white border border-[rgba(28,25,23,0.12)] rounded-md px-2.5 py-1.5 text-xs text-[#1C1C1A] focus:outline-none"
                >
                  <option value="">Consumidor Final (Sem Cadastro)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista dos Itens no Carrinho */}
              <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="py-16 text-center text-xs text-[#A1A19B] border border-dashed border-[rgba(28,25,23,0.12)] rounded-xl space-y-2">
                    <ShoppingCart className="w-8 h-8 mx-auto text-[#D0D0CA]" strokeWidth={1.5} />
                    <p>O carrinho de venda está vazio.</p>
                    <p className="text-[11px]">Bipe um código de barras ou selecione produtos à esquerda.</p>
                  </div>
                ) : (
                  cart.map((item, index) => {
                    const isCellPhone =
                      item.category?.toLowerCase().includes("celular") ||
                      item.category?.toLowerCase().includes("smartphone");

                    return (
                      <div
                        key={index}
                        className="p-3 bg-[#F9F9F7] rounded-xl border border-[rgba(28,25,23,0.06)] space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg border border-[rgba(28,25,23,0.08)] bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
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
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[#1C1C1A] truncate">{item.name}</h4>
                              <span className="text-[10px] text-[#71716C] font-mono">
                                Unit: {formatCurrency(item.unitPrice)}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[#1C1C1A] text-sm tabular-nums">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </span>
                        </div>

                        {/* Campo de IMEI para Celulares */}
                        {isCellPhone && (
                          <div className="flex items-center gap-2 bg-indigo-50/60 p-1.5 rounded-lg border border-indigo-100">
                            <Smartphone className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                            <input
                              type="text"
                              placeholder="Digite ou bipe o IMEI do aparelho..."
                              value={item.imeiOrSerial || ""}
                              onChange={(e) => handleUpdateImei(index, e.target.value)}
                              className="w-full bg-white border border-indigo-200 rounded px-2 py-1 text-[11px] font-mono text-[#1C1C1A] placeholder:text-[#A1A19B] focus:outline-none"
                            />
                          </div>
                        )}

                        {/* Controles de Quantidade & Exclusão */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateQuantity(index, -1)}
                              className="w-6 h-6 rounded-md bg-white border border-[rgba(28,25,23,0.12)] flex items-center justify-center text-[#1C1C1A] hover:bg-[#EAEAE5] transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-xs px-2 tabular-nums">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(index, 1)}
                              className="w-6 h-6 rounded-md bg-white border border-[rgba(28,25,23,0.12)] flex items-center justify-center text-[#1C1C1A] hover:bg-[#EAEAE5] transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-rose-600 hover:text-rose-800 p-1 rounded transition"
                            title="Remover produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Totais & Botão de Fechamento */}
            <div className="mt-4 pt-3 border-t border-[rgba(28,25,23,0.08)] space-y-3">
              <div className="space-y-1.5 text-xs text-[#71716C]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium text-[#1C1C1A]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Desconto Global:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px]">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={discountGlobal}
                      onChange={(e) => setDiscountGlobal(e.target.value)}
                      className="w-20 text-right bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded px-2 py-0.5 text-xs font-mono font-bold text-[#1C1C1A]"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-base font-bold text-[#1C1C1A] pt-2 border-t border-[rgba(28,25,23,0.06)]">
                  <span>Total Líquido:</span>
                  <span className="font-mono text-xl tabular-nums text-emerald-700">{formatCurrency(netTotal)}</span>
                </div>
              </div>

              <button
                onClick={() => setShowCheckoutModal(true)}
                disabled={cart.length === 0}
                className="w-full py-3 rounded-xl bg-[#1C1C1A] text-white hover:bg-black disabled:bg-[#D0D0CA] disabled:cursor-not-allowed font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                <span>Finalizar Venda (F8)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE FECHAMENTO DE PAGAMENTO (F8)                                      */}
      {/* ========================================================================= */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[rgba(28,25,23,0.12)] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(28,25,23,0.08)]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#1C1C1A]" />
                <h3 className="text-base font-bold text-[#1C1C1A]">Recebimento de Venda</h3>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-xs text-[#71716C] hover:text-[#1C1C1A]"
              >
                Cancelar (Esc)
              </button>
            </div>

            {/* Totalizador em Destaque */}
            <div className="bg-[#F9F9F7] p-4 rounded-xl border border-[rgba(28,25,23,0.08)] text-center space-y-1">
              <span className="text-xs font-semibold text-[#71716C] uppercase">Valor Total a Pagar</span>
              <div className="text-3xl font-mono font-bold text-emerald-700 tabular-nums">
                {formatCurrency(netTotal)}
              </div>
            </div>

            {/* Formas de Pagamento em Botões Rápidos */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1C1C1A]">Selecione a Forma de Pagamento:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "PIX", label: "Pix Instantâneo", icon: QrCode },
                  { id: "CREDIT_CARD", label: "Cartão de Crédito", icon: CreditCard },
                  { id: "DEBIT_CARD", label: "Cartão de Débito", icon: CreditCard },
                  { id: "CASH", label: "Dinheiro (Espécie)", icon: Banknote },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                        isSelected
                          ? "bg-[#1C1C1A] text-white border-[#1C1C1A] shadow-sm"
                          : "bg-[#F9F9F7] border-[rgba(28,25,23,0.08)] text-[#1C1C1A] hover:bg-white"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-amber-300" : "text-[#71716C]"}`} />
                      <span className="text-xs font-bold">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Se for Dinheiro: Campo para Troco */}
            {paymentMethod === "CASH" && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-900">Valor Recebido do Cliente:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">R$</span>
                    <input
                      type="number"
                      step="1"
                      placeholder={netTotal.toFixed(2)}
                      value={receivedAmountStr}
                      onChange={(e) => setReceivedAmountStr(e.target.value)}
                      className="w-24 px-2 py-1 bg-white border border-amber-300 rounded font-mono font-bold text-xs text-right focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60">
                  <span className="font-semibold text-amber-900">Troco a Devolver:</span>
                  <span className="font-mono font-bold text-sm text-rose-700">
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Seleção do Cliente / Consumidor Final */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1C1C1A] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#71716C]" />
                  <span>Cliente / Comprador:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Novo Cliente</span>
                </button>
              </div>

              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white"
              >
                <option value="">Consumidor Final (Sem cadastro)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""} {c.document ? `— CPF: ${c.document}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Observações da Venda */}
            <div className="space-y-1">
              <label className="text-xs text-[#71716C]">Observações no Comprovante:</label>
              <input
                type="text"
                placeholder="Ex: Garantia 90 dias, película aplicada no ato..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-lg text-xs text-[#1C1C1A] focus:outline-none"
              />
            </div>

            {/* Botão de Confirmação */}
            <button
              onClick={handleConfirmSale}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? "Processando e Baixando Estoque..." : "Confirmar Venda e Baixar Estoque"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE COMPROVANTE DE VENDA (80mm E A4)                                 */}
      {/* ========================================================================= */}
      {completedSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[rgba(28,25,23,0.12)] shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-bold">Venda Finalizada com Sucesso!</span>
              </div>
              <button
                onClick={() => setCompletedSale(null)}
                className="text-xs text-[#71716C] hover:text-[#1C1C1A]"
              >
                Fechar
              </button>
            </div>

            {/* Cupom Térmico Estilizado Preview */}
            <div className="bg-[#FAFAFA] p-4 rounded-xl border border-dashed border-[rgba(28,25,23,0.2)] font-mono text-[11px] text-[#1C1C1A] space-y-2.5">
              <div className="text-center pb-2 border-b border-dashed border-gray-300 space-y-0.5">
                {tenantInfo?.logoUrl && (
                  <div className="flex justify-center mb-1.5">
                    <img
                      src={tenantInfo.logoUrl}
                      alt={tenantInfo.name || "Logo"}
                      className="max-h-12 max-w-[140px] object-contain"
                    />
                  </div>
                )}
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  {tenantInfo?.name || tenantInfo?.tradeName || getCurrentUser()?.tenantName || "Assistência Técnica"}
                </h4>
                {tenantInfo?.document && <p className="text-[9px] text-[#71716C]">CNPJ/CPF: {tenantInfo.document}</p>}
                {tenantInfo?.phone && <p className="text-[9px] text-[#71716C]">Tel: {tenantInfo.phone}</p>}
                <p className="text-[10px] font-bold mt-1">COMPROVANTE DE VENDA DE BALCÃO</p>
                <p className="text-[9px] text-[#71716C]">
                  Venda #{completedSale.saleNumber} • {new Date().toLocaleDateString("pt-BR")}{" "}
                  {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* DADOS DO CLIENTE */}
              <div className="py-1.5 border-b border-dashed border-gray-300 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">CLIENTE:</span>
                  <span className="font-bold">
                    {completedSale.client?.name || (clients.find((c) => c.id === selectedClientId)?.name) || "Consumidor Final"}
                  </span>
                </div>
                {(completedSale.client?.document || clients.find((c) => c.id === selectedClientId)?.document) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPF/CNPJ:</span>
                    <span>{completedSale.client?.document || clients.find((c) => c.id === selectedClientId)?.document}</span>
                  </div>
                )}
                {(completedSale.client?.phone || clients.find((c) => c.id === selectedClientId)?.phone) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">TEL:</span>
                    <span>{completedSale.client?.phone || clients.find((c) => c.id === selectedClientId)?.phone}</span>
                  </div>
                )}
              </div>

              {/* Itens */}
              <div className="space-y-1 py-1 border-b border-dashed border-gray-300">
                {completedSale.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between leading-tight">
                    <div>
                      <span>{Number(item.quantity)}x {item.product?.name || "Produto"}</span>
                      {item.imeiOrSerial && (
                        <span className="block text-[9px] text-gray-500">IMEI: {item.imeiOrSerial}</span>
                      )}
                    </div>
                    <span className="font-bold">{formatCurrency(item.totalAmount)}</span>
                  </div>
                ))}
              </div>

              {/* Total & Pagamento */}
              <div className="space-y-1 text-xs font-bold pt-1">
                <div className="flex justify-between">
                  <span>TOTAL PAGO:</span>
                  <span className="text-sm">{formatCurrency(completedSale.netTotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-normal text-gray-600">
                  <span>FORMA:</span>
                  <span>{completedSale.paymentMethod}</span>
                </div>
                {Number(completedSale.changeAmount) > 0 && (
                  <div className="flex justify-between text-[10px] font-normal text-gray-600">
                    <span>TROCO:</span>
                    <span>{formatCurrency(completedSale.changeAmount)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2 border-t border-dashed border-gray-300 text-[9px] text-gray-500 space-y-0.5">
                <p>Garantia de 90 dias com este cupom.</p>
                <p>Agradecemos a preferência!</p>
              </div>
            </div>

            {/* Ações do Cupom */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handlePrintThermal}
                  className="py-2.5 px-3 rounded-xl bg-[#1C1C1A] text-white hover:bg-black font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Recibo (80mm)</span>
                </button>
                <button
                  onClick={handlePrintA4}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Imprimir Normal (A4)</span>
                </button>
              </div>

              <button
                onClick={() => setCompletedSale(null)}
                className="w-full py-2 rounded-xl border border-[rgba(28,25,23,0.12)] text-[#1C1C1A] hover:bg-[#F3F3EF] font-bold text-xs transition"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPONENTES DE IMPRESSÃO ISOLADOS (80MM E A4)                              */}
      {/* ========================================================================= */}
      {completedSale && (
        <>
          {/* 1. Recibo Térmico 80mm Isolado */}
          <div id="thermal-receipt" className="hidden">
            <div style={{ fontFamily: "monospace", fontSize: "11px", lineHeight: "1.3", color: "#000" }}>
              <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px" }}>
                <div style={{ fontWeight: "bold", fontSize: "13px", textTransform: "uppercase" }}>
                  {tenantInfo?.tradeName || tenantInfo?.name || "ASSISTÊNCIA TÉCNICA"}
                </div>
                {tenantInfo?.document && <div>CNPJ/CPF: {tenantInfo.document}</div>}
                {tenantInfo?.phone && <div>Tel: {tenantInfo.phone}</div>}
                {tenantInfo?.address && <div>{tenantInfo.address}</div>}
                <div style={{ fontWeight: "bold", marginTop: "4px" }}>COMPROVANTE DE VENDA DE BALCÃO</div>
                <div>
                  Venda #{completedSale.saleNumber} • {new Date().toLocaleDateString("pt-BR")}{" "}
                  {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* DADOS DO CLIENTE */}
              <div style={{ borderBottom: "1px dashed #000", paddingBottom: "5px", marginBottom: "5px" }}>
                <div>
                  <strong>CLIENTE:</strong>{" "}
                  {completedSale.client?.name || (clients.find((c) => c.id === selectedClientId)?.name) || "Consumidor Final"}
                </div>
                {(completedSale.client?.document || clients.find((c) => c.id === selectedClientId)?.document) && (
                  <div>
                    <strong>CPF/CNPJ:</strong>{" "}
                    {completedSale.client?.document || clients.find((c) => c.id === selectedClientId)?.document}
                  </div>
                )}
                {(completedSale.client?.phone || clients.find((c) => c.id === selectedClientId)?.phone) && (
                  <div>
                    <strong>TEL:</strong>{" "}
                    {completedSale.client?.phone || clients.find((c) => c.id === selectedClientId)?.phone}
                  </div>
                )}
              </div>

              {/* ITENS */}
              <div style={{ borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginBottom: "4px" }}>
                  <span>ITEM</span>
                  <span>TOTAL</span>
                </div>
                {completedSale.items?.map((it: any, i: number) => (
                  <div key={i} style={{ marginBottom: "3px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{Number(it.quantity)}x {it.product?.name || "Produto"}</span>
                      <span>{formatCurrency(it.totalAmount)}</span>
                    </div>
                    {it.imeiOrSerial && <div style={{ fontSize: "9px" }}>IMEI: {it.imeiOrSerial}</div>}
                  </div>
                ))}
              </div>

              {/* TOTAL */}
              <div style={{ borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px" }}>
                  <span>TOTAL PAGO:</span>
                  <span>{formatCurrency(completedSale.netTotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                  <span>FORMA:</span>
                  <span>{completedSale.paymentMethod}</span>
                </div>
                {Number(completedSale.changeAmount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                    <span>TROCO:</span>
                    <span>{formatCurrency(completedSale.changeAmount)}</span>
                  </div>
                )}
              </div>

              <div style={{ textAlign: "center", fontSize: "9px", paddingTop: "4px" }}>
                <p>Garantia de 90 dias com este cupom.</p>
                <p>Agradecemos a preferência!</p>
              </div>
            </div>
          </div>

          {/* 2. Documento Normal A4 Isolado */}
          <div id="a4-sale-document" className="hidden">
            <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11pt", color: "#111", lineHeight: "1.4" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #111", paddingBottom: "12px", marginBottom: "16px" }}>
                <div>
                  <h1 style={{ margin: "0 0 4px 0", fontSize: "16pt", fontWeight: "bold", textTransform: "uppercase" }}>
                    {tenantInfo?.tradeName || tenantInfo?.name || "Assistência Técnica"}
                  </h1>
                  {tenantInfo?.document && <div style={{ fontSize: "9pt" }}>CNPJ/CPF: {tenantInfo.document}</div>}
                  {tenantInfo?.phone && <div style={{ fontSize: "9pt" }}>Tel / WhatsApp: {tenantInfo.phone}</div>}
                  {tenantInfo?.address && <div style={{ fontSize: "9pt" }}>Endereço: {tenantInfo.address}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14pt", fontWeight: "bold" }}>DOCUMENTO DE VENDA DE BALCÃO</div>
                  <div style={{ fontSize: "12pt", fontWeight: "bold", marginTop: "4px" }}>Nº {completedSale.saleNumber}</div>
                  <div style={{ fontSize: "9pt", color: "#555" }}>
                    Data: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              {/* Dados do Cliente */}
              <div style={{ border: "1px solid #ccc", borderRadius: "6px", padding: "10px", marginBottom: "16px", backgroundColor: "#fcfcfc" }}>
                <div style={{ fontWeight: "bold", fontSize: "10pt", borderBottom: "1px solid #e5e5e5", paddingBottom: "4px", marginBottom: "6px" }}>
                  DADOS DO CLIENTE / COMPRADOR
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "9.5pt" }}>
                  <div>
                    <strong>Nome / Razão Social:</strong>{" "}
                    {completedSale.client?.name || (clients.find((c) => c.id === selectedClientId)?.name) || "Consumidor Final"}
                  </div>
                  <div>
                    <strong>CPF / CNPJ:</strong>{" "}
                    {completedSale.client?.document || clients.find((c) => c.id === selectedClientId)?.document || "Não informado"}
                  </div>
                  <div>
                    <strong>Telefone / WhatsApp:</strong>{" "}
                    {completedSale.client?.phone || clients.find((c) => c.id === selectedClientId)?.phone || "Não informado"}
                  </div>
                  <div>
                    <strong>E-mail:</strong>{" "}
                    {completedSale.client?.email || clients.find((c) => c.id === selectedClientId)?.email || "Não informado"}
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <strong>Endereço:</strong>{" "}
                    {completedSale.client?.address || clients.find((c) => c.id === selectedClientId)?.address || "Não informado"}
                  </div>
                </div>
              </div>

              {/* Tabela de Produtos */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "9.5pt" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f3f3f3", borderBottom: "1px solid #ccc" }}>
                    <th style={{ padding: "8px", textAlign: "left" }}>Item / Descrição</th>
                    <th style={{ padding: "8px", textAlign: "center", width: "70px" }}>Qtd</th>
                    <th style={{ padding: "8px", textAlign: "right", width: "110px" }}>Valor Unit.</th>
                    <th style={{ padding: "8px", textAlign: "right", width: "110px" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSale.items?.map((it: any, i: number) => (
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

              {/* Totalizador */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
                <div style={{ width: "260px", border: "1px solid #ccc", borderRadius: "6px", padding: "10px", backgroundColor: "#fafafa", fontSize: "10pt" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>Subtotal:</span>
                    <span>{formatCurrency(completedSale.totalAmount)}</span>
                  </div>
                  {Number(completedSale.discountAmount) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#b91c1c" }}>
                      <span>Desconto:</span>
                      <span>- {formatCurrency(completedSale.discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "12pt", borderTop: "1px solid #ccc", paddingTop: "6px" }}>
                    <span>TOTAL PAGO:</span>
                    <span>{formatCurrency(completedSale.netTotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", color: "#555", marginTop: "4px" }}>
                    <span>Forma:</span>
                    <span>{completedSale.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Termo de Garantia */}
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
                  Assinatura do Cliente
                </div>
                <div style={{ textAlign: "center", width: "220px", borderTop: "1px solid #000", paddingTop: "6px", fontSize: "9pt" }}>
                  {tenantInfo?.tradeName || tenantInfo?.name || "Assistência Técnica"}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CADASTRO RÁPIDO DE CLIENTE NO PDV                                */}
      {/* ========================================================================= */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[rgba(28,25,23,0.12)] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(28,25,23,0.08)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1C1C1A] text-white flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1C1A]">Cadastrar Cliente no Balcão</h3>
                  <p className="text-[11px] text-[#71716C]">
                    Cadastre na hora para sair no comprovante e associar à venda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewClientModal(false)}
                className="text-xs text-[#71716C] hover:text-[#1C1C1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {clientModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{clientModalError}</span>
              </div>
            )}

            <form onSubmit={handleQuickCreateClient} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1C1A]">
                  Nome Completo <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Roberto Silva"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1C1A]">
                    WhatsApp/Telefone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-9999"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1C1A]">CPF / CNPJ</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={newClientDocument}
                    onChange={(e) => setNewClientDocument(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1C1A]">E-mail (opcional)</label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1C1A]">Endereço (opcional)</label>
                <input
                  type="text"
                  placeholder="Rua, número, bairro"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(28,25,23,0.12)] text-[#1C1C1A] hover:bg-[#F3F3EF] font-bold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingClient ? "Salvando..." : "Salvar e Vincular"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CADASTRO RÁPIDO DE PRODUTO NO PDV (F3)                           */}
      {/* ========================================================================= */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[rgba(28,25,23,0.12)] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(28,25,23,0.08)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1C1C1A] text-white flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1C1A]">Cadastrar Produto no Balcão (F3)</h3>
                  <p className="text-[11px] text-[#71716C]">
                    Cadastre na hora sem sair do caixa e já adicione à venda em andamento.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewProductModal(false)}
                className="text-xs text-[#71716C] hover:text-[#1C1C1A]"
              >
                Fechar (Esc)
              </button>
            </div>

            <form onSubmit={handleQuickCreateProduct} className="space-y-3.5">
              {/* Nome do Produto */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1C1A]">
                  Nome do Produto / Acessório <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Capa MagSafe iPhone 13, Película Cerâmica 9D, Carregador 20W..."
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1C1C1A] text-[#1C1C1A]"
                />
              </div>

              {/* Categoria e Código de Barras / SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1C1A]">Categoria</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-lg focus:outline-none text-[#1C1C1A]"
                  >
                    <option value="Acessórios">Acessórios</option>
                    <option value="Celulares e Smartphones">Celulares e Smartphones</option>
                    <option value="Eletrônicos">Eletrônicos & Áudio</option>
                    <option value="Cabos e Carregadores">Cabos e Carregadores</option>
                    <option value="Películas e Proteção">Películas e Proteção</option>
                    <option value="Peças e Displays">Peças e Displays</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1C1A]">Código de Barras / SKU</label>
                  <input
                    type="text"
                    placeholder="Bipe ou deixe em branco para gerar"
                    value={newProdBarcode}
                    onChange={(e) => setNewProdBarcode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-lg focus:outline-none text-[#1C1C1A]"
                  />
                </div>
              </div>

              {/* Preços, Margem de Lucro e Estoque - Design Idêntico ao Anexo 1 */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1C1A]">
                      Preço de Custo (R$) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newProdCostPrice}
                      onChange={(e) => handleNewProdCostPriceChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-[rgba(28,25,23,0.15)] rounded-xl focus:outline-none focus:border-[#1C1C1A] text-[#1C1C1A] shadow-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1C1A] flex items-center justify-between">
                      <span>Margem (%)</span>
                      <span className="text-[9px] text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded font-mono font-bold">Auto</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="30"
                        value={newProdProfitMargin}
                        onChange={(e) => handleNewProdProfitMarginChange(e.target.value)}
                        className="w-full pl-3 pr-6 py-2 text-xs font-mono font-bold bg-amber-50/20 border-2 border-amber-400 rounded-xl focus:outline-none focus:border-amber-500 text-amber-950 shadow-xs"
                      />
                      <span className="absolute right-2 top-2 text-amber-800 font-bold text-xs pointer-events-none">%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1C1A]">
                      Preço Balcão (R$) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={newProdSalePrice}
                      onChange={(e) => handleNewProdSalePriceChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-[rgba(28,25,23,0.15)] rounded-xl focus:outline-none focus:border-emerald-600 text-emerald-800 shadow-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1C1A]">Saldo Inicial</label>
                    <input
                      type="number"
                      step="1"
                      placeholder="10"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-[rgba(28,25,23,0.15)] rounded-xl focus:outline-none focus:border-[#1C1C1A] text-[#1C1C1A] shadow-xs"
                    />
                  </div>
                </div>

                {/* Card de Lucro Bruto Unitário (Design do Anexo 1) */}
                {(() => {
                  const costVal = parseFloat(newProdCostPrice) || 0;
                  const saleVal = parseFloat(newProdSalePrice) || 0;
                  const profitVal = saleVal > costVal ? (saleVal - costVal) : 0;
                  const marginVal = costVal > 0 
                    ? (newProdProfitMargin || (((saleVal - costVal) / costVal) * 100).toFixed(0)) 
                    : (newProdProfitMargin || "0");

                  return (
                    <div className="p-3 rounded-xl bg-[#EDFAF2] border border-[#A7E8C4] flex items-center justify-between text-xs text-[#0F5132] transition-all shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#198754] shrink-0" />
                        <span className="font-semibold text-[#1C1C1A]">
                          Lucro Bruto Unitário: <strong className="text-sm font-bold text-[#0F5132]">R$ {profitVal.toFixed(2)}</strong>
                        </span>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#D1E7DD] border border-[#A3CFBB] text-[#0F5132]">
                        +{marginVal}% Margem
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Localização no Balcão */}
              <div className="space-y-1">
                <label className="text-xs text-[#71716C]">Localização / Prateleira no Balcão</label>
                <input
                  type="text"
                  placeholder="Ex: Gôndola A-01, Gaveteiro Balcão, Vitrine Frontal..."
                  value={newProdShelf}
                  onChange={(e) => setNewProdShelf(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-lg focus:outline-none text-[#1C1C1A]"
                />
              </div>

              {/* Checkbox Adicionar ao Carrinho */}
              <label className="flex items-center gap-2 text-xs text-[#1C1C1A] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={autoAddToCart}
                  onChange={(e) => setAutoAddToCart(e.target.checked)}
                  className="rounded border-gray-300 text-[#1C1C1A] focus:ring-[#1C1C1A]"
                />
                <span className="font-medium">Adicionar 1 unidade ao carrinho desta venda imediatamente após salvar</span>
              </label>

              {/* Botões do Modal */}
              <div className="flex gap-2 pt-2 border-t border-[rgba(28,25,23,0.08)]">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[rgba(28,25,23,0.12)] text-[#71716C] hover:bg-[#F3F3EF] text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex-1 py-2.5 rounded-xl bg-[#1C1C1A] text-white hover:bg-black font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{savingProduct ? "Salvando..." : "Salvar e Inserir no PDV"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
