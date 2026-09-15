"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Wrench,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface ClientItem {
  id: string;
  name: string;
  phone: string;
  document?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  _count?: {
    serviceOrders: number;
    sales: number;
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    document: "",
    email: "",
    address: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete State
  const [deleteModalClient, setDeleteModalClient] = useState<ClientItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadClients = async (searchTerm = search) => {
    setLoading(true);
    try {
      const q = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      const data = await fetchApi(`/clients${q}`);
      setClients(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    loadClients(val);
  };

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({
      name: "",
      phone: "",
      document: "",
      email: "",
      address: "",
      notes: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (c: ClientItem) => {
    setEditingClient(c);
    setFormData({
      name: c.name || "",
      phone: c.phone || "",
      document: c.document || "",
      email: c.email || "",
      address: c.address || "",
      notes: c.notes || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("O nome do cliente é obrigatório.");
      return;
    }
    if (!formData.phone.trim()) {
      setFormError("O telefone/WhatsApp é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      if (editingClient) {
        // Atualizar
        await fetchApi(`/clients/${editingClient.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        // Criar
        await fetchApi("/clients", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      setModalOpen(false);
      loadClients();
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar cliente. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalClient) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await fetchApi(`/clients/${deleteModalClient.id}`, {
        method: "DELETE",
      });
      setDeleteModalClient(null);
      loadClients();
    } catch (err: any) {
      setDeleteError(err.message || "Não foi possível excluir o cliente.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1C1C1A] tracking-tight">Clientes & Contatos</h1>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#F3F3EF] text-[#71716C] border border-[rgba(28,25,23,0.06)]">
              {clients.length} cadastrado(s)
            </span>
          </div>
          <p className="text-xs text-[#71716C] mt-0.5">
            Gerencie o cadastro de clientes, dados para emissão de comprovantes de venda e ordens de serviço.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadClients()}
            title="Atualizar lista"
            className="p-2 rounded-xl border border-[rgba(28,25,23,0.12)] text-[#71716C] hover:text-[#1C1C1A] hover:bg-[#F3F3EF] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-[#1C1C1A] text-white hover:bg-black transition text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="bg-white p-3 rounded-2xl border border-[rgba(28,25,23,0.08)] shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A1A19B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar clientes por nome, telefone, CPF/CNPJ ou e-mail..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] rounded-xl text-xs text-[#1C1C1A] placeholder:text-[#A1A19B] focus:outline-none focus:bg-white focus:border-[#1C1C1A] transition"
          />
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white rounded-2xl border border-[rgba(28,25,23,0.08)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[rgba(28,25,23,0.06)] bg-[#FDFDFD] text-[#71716C] font-medium">
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Contato & WhatsApp</th>
                <th className="py-3 px-4">CPF / CNPJ</th>
                <th className="py-3 px-4">Endereço</th>
                <th className="py-3 px-4 text-center">Histórico</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(28,25,23,0.06)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#71716C]">
                    Carregando base de clientes...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#F3F3EF] flex items-center justify-center mx-auto text-[#71716C]">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1C1C1A]">Nenhum cliente encontrado</p>
                      <p className="text-xs text-[#71716C] mt-0.5">
                        {search ? "Nenhum resultado corresponde à sua pesquisa." : "Cadastre o primeiro cliente da assistência ou loja."}
                      </p>
                    </div>
                    {!search && (
                      <button
                        onClick={handleOpenCreate}
                        className="px-3.5 py-1.5 rounded-xl bg-[#1C1C1A] text-white hover:bg-black text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Cadastrar Cliente</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F9F9F7] transition">
                    <td className="py-3 px-4 font-semibold text-[#1C1C1A]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center justify-center text-xs shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-bold">{c.name}</span>
                          {c.email && <span className="text-[11px] text-[#71716C]">{c.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[#1C1C1A] font-mono">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{c.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#71716C]">
                      {c.document || <span className="text-gray-400 italic">Não informado</span>}
                    </td>
                    <td className="py-3 px-4 text-[#71716C] max-w-xs truncate">
                      {c.address ? (
                        <span title={c.address}>{c.address}</span>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span
                          title="Ordens de Serviço vinculadas"
                          className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold flex items-center gap-1"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>{c._count?.serviceOrders || 0} OS</span>
                        </span>
                        <span
                          title="Vendas de Balcão vinculadas"
                          className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>{c._count?.sales || 0} vendas</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Editar Cliente"
                          className="p-1.5 rounded-lg border border-[rgba(28,25,23,0.12)] text-[#1C1C1A] hover:bg-[#F3F3EF] transition"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#71716C]" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteError("");
                            setDeleteModalClient(c);
                          }}
                          title="Excluir Cliente"
                          className="p-1.5 rounded-lg border border-[rgba(28,25,23,0.12)] text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE CLIENTE */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[rgba(28,25,23,0.12)] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(28,25,23,0.08)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1C1C1A] text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1C1A]">
                    {editingClient ? `Editar Cliente: ${editingClient.name}` : "Cadastrar Novo Cliente"}
                  </h3>
                  <p className="text-[11px] text-[#71716C]">
                    Dados do cliente para comprovantes, garantia e Ordens de Serviço.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#71716C] hover:text-[#1C1C1A] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1C1A]">
                  Nome Completo / Razão Social <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white focus:border-[#1C1C1A]"
                />
              </div>

              {/* Telefone e Documento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1C1A]">
                    WhatsApp / Telefone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: (11) 98765-4321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white focus:border-[#1C1C1A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1C1A]">CPF ou CNPJ</label>
                  <input
                    type="text"
                    placeholder="Ex: 000.000.000-00"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white focus:border-[#1C1C1A]"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1C1A]">E-mail (opcional)</label>
                <input
                  type="email"
                  placeholder="cliente@exemplo.com.br"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white focus:border-[#1C1C1A]"
                />
              </div>

              {/* Endereço */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1C1A]">Endereço Completo</label>
                <input
                  type="text"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white focus:border-[#1C1C1A]"
                />
              </div>

              {/* Observações */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1C1A]">Observações Internas</label>
                <textarea
                  rows={2}
                  placeholder="Preferências, recomendações ou notas sobre o cliente..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F9F9F7] border border-[rgba(28,25,23,0.12)] rounded-xl text-xs text-[#1C1C1A] focus:outline-none focus:bg-white focus:border-[#1C1C1A]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(28,25,23,0.12)] text-[#1C1C1A] hover:bg-[#F3F3EF] font-bold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#1C1C1A] text-white hover:bg-black font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saving ? "Salvando..." : editingClient ? "Salvar Alterações" : "Cadastrar Cliente"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteModalClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-[rgba(28,25,23,0.12)] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-[#1C1C1A]">Excluir Cliente?</h3>
              <p className="text-xs text-[#71716C]">
                Tem certeza que deseja excluir o cadastro de <strong>{deleteModalClient.name}</strong>?
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteModalClient(null)}
                className="flex-1 py-2.5 rounded-xl border border-[rgba(28,25,23,0.12)] text-[#1C1C1A] hover:bg-[#F3F3EF] font-bold text-xs transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{deleting ? "Excluindo..." : "Confirmar Exclusão"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
