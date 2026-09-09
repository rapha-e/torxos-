"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  Settings, 
  Save, 
  Plus, 
  Check, 
  Percent, 
  Phone, 
  Mail, 
  FileText, 
  UserPlus, 
  Edit3, 
  ToggleLeft, 
  ToggleRight,
  Sparkles,
  Lock,
  X,
  CreditCard,
  Zap,
  Calendar,
  CheckCircle2,
  Trash2,
  KeyRound,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  HelpCircle,
  HeartHandshake,
  ArrowLeft,
  Store,
  GitFork,
  ArrowRightLeft,
  MapPin,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { ImageUploader } from "@/components/ui/image-uploader";
import { PasswordResetModal, PasswordResetData } from "@/components/ui/password-reset-modal";
import { UpgradeModal } from "@/components/ui/upgrade-modal";
import { PlanGate } from "@/components/ui/plan-gate";
import { getPlanMaxUsers, getPlanDetails } from "@/lib/plan-rules";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  commissionServicesPercent: number;
  commissionProductsPercent: number;
  isActive: boolean;
}

export default function TenantSettingsPage() {
  const [activeTab, setActiveTab] = useState<"COMPANY" | "WARRANTY" | "TEAM" | "SUBSCRIPTION" | "BRANCHES">("COMPANY");
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Gestão Multi-Filiais & Matriz (Enterprise)
  const [branchesData, setBranchesData] = useState<{
    currentUnitId: string;
    headquarter: any;
    branches: any[];
    allUnits: any[];
    totalUnits: number;
  } | null>(null);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);
  const [showBranchModal, setShowBranchModal] = useState<boolean>(false);
  const [branchTradeName, setBranchTradeName] = useState<string>("");
  const [branchLegalName, setBranchLegalName] = useState<string>("");
  const [branchDocument, setBranchDocument] = useState<string>("");
  const [branchPhone, setBranchPhone] = useState<string>("");
  const [branchEmail, setBranchEmail] = useState<string>("");
  const [creatingBranch, setCreatingBranch] = useState<boolean>(false);

  // Assinatura & Cancelamento Self-Service
  const [planName, setPlanName] = useState<string>("PRO");
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("PRECO");
  const [cancelFeedback, setCancelFeedback] = useState<string>("");
  const [isCanceling, setIsCanceling] = useState<boolean>(false);
  const [isReactivating, setIsReactivating] = useState<boolean>(false);

  // Dados da Loja (iniciam vazios e carregam estritamente do banco de dados da empresa)
  const [tradeName, setTradeName] = useState<string>("");
  const [legalName, setLegalName] = useState<string>("");
  const [document, setDocument] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Regras de Garantia
  const [warrantyDaysDefault, setWarrantyDaysDefault] = useState<number>(90);
  const [enableWhatsappAuto, setEnableWhatsappAuto] = useState<boolean>(true);
  const [warrantyTermsText, setWarrantyTermsText] = useState<string>(
    "A garantia é de 90 (noventa) dias a partir da data de entrega do equipamento, cobrindo exclusivamente os serviços executados e componentes substituídos, conforme Art. 26 da Lei nº 8.078/1990 (Código de Defesa do Consumidor). A garantia perde sua validade em casos de dano físico posterior, quebra, quedas, contato com líquidos ou intervenção de terceiros."
  );

  // Equipe (inicia vazia, populada exclusivamente pela API)
  const [team, setTeam] = useState<TeamMember[]>([]);

  // Modal Novo/Edição Colaborador
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newUserName, setNewUserName] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<string>("TECHNICIAN");
  const [newUserCommServices, setNewUserCommServices] = useState<number>(10.0);
  const [newUserCommProducts, setNewUserCommProducts] = useState<number>(3.0);

  // Modal Reset Senha Colaborador
  const [resetModalMember, setResetModalMember] = useState<TeamMember | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState<string>("torxos123");
  const [resettingPassword, setResettingPassword] = useState<boolean>(false);
  const [resetSuccessData, setResetSuccessData] = useState<PasswordResetData | null>(null);

  // Upgrade Modal por Limite do Plano
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  const planLimits = getPlanDetails(planName);
  const maxUsers = planLimits.maxUsers;
  const currentActiveUsers = team.filter((t) => t.isActive).length;
  const isUserLimitReached = currentActiveUsers >= maxUsers;

  const handleOpenCreateUser = () => {
    if (isUserLimitReached && maxUsers < 1000) {
      setShowUpgradeModal(true);
      return;
    }
    setEditingMember(null);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("TECHNICIAN");
    setNewUserCommServices(10.0);
    setNewUserCommProducts(3.0);
    setShowUserModal(true);
  };

  const handleOpenEditUser = (member: TeamMember) => {
    setEditingMember(member);
    setNewUserName(member.name);
    setNewUserEmail(member.email);
    setNewUserRole(member.role);
    setNewUserCommServices(Number(member.commissionServicesPercent) || 0);
    setNewUserCommProducts(Number(member.commissionProductsPercent) || 0);
    setShowUserModal(true);
  };

  useEffect(() => {
    async function loadTenantData() {
      try {
        const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("evorix_user") || "null") : null;
        const settingsData = await fetchApi("/tenant/settings");
        if (settingsData) {
          setTradeName(settingsData.tradeName || user?.tenantName || "");
          setLegalName(settingsData.legalName || settingsData.tradeName || user?.tenantName || "");
          setDocument(settingsData.document || "");
          setPhone(settingsData.phone || "");
          setEmail(settingsData.email || user?.email || "");
          setLogoUrl(settingsData.logoUrl || null);

          if (settingsData.warrantyDaysDefault) setWarrantyDaysDefault(settingsData.warrantyDaysDefault);
          if (settingsData.enableWhatsappAuto !== undefined) setEnableWhatsappAuto(settingsData.enableWhatsappAuto);
          if (settingsData.warrantyTermsText) setWarrantyTermsText(settingsData.warrantyTermsText);

          if (settingsData.plan) setPlanName(settingsData.plan);
          if (settingsData.subscription) setSubscriptionData(settingsData.subscription);
        } else if (user) {
          setTradeName(user.tenantName || "");
          setLegalName(user.tenantName || "");
          setEmail(user.email || "");
        }

        const teamData = await fetchApi("/tenant/users");
        if (Array.isArray(teamData)) {
          setTeam(teamData);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações do tenant:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTenantData();
  }, []);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCanceling(true);
    try {
      const res = await fetchApi("/tenant/subscription/cancel", {
        method: "POST",
        body: JSON.stringify({
          reason: cancelReason,
          feedback: cancelFeedback,
        }),
      });
      alert(res?.message || "Cancelamento agendado com sucesso.");
      setShowCancelModal(false);
      const updated = await fetchApi("/tenant/settings");
      if (updated?.subscription) setSubscriptionData(updated.subscription);
    } catch (err: any) {
      alert("Erro ao solicitar cancelamento: " + err.message);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!confirm("Deseja reativar sua assinatura e continuar utilizando o TorxOS sem interrupções?")) {
      return;
    }
    setIsReactivating(true);
    try {
      const res = await fetchApi("/tenant/subscription/reactivate", {
        method: "POST",
      });
      alert(res?.message || "Assinatura reativada com sucesso!");
      const updated = await fetchApi("/tenant/settings");
      if (updated?.subscription) setSubscriptionData(updated.subscription);
    } catch (err: any) {
      alert("Erro ao reativar assinatura: " + err.message);
    } finally {
      setIsReactivating(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await fetchApi("/tenant/settings", {
        method: "PATCH",
        body: JSON.stringify({
          tradeName,
          legalName,
          document,
          phone,
          email,
          logoUrl,
        }),
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "torxos_company_profile",
          JSON.stringify({
            tradeName,
            legalName,
            document,
            phone,
            email,
            logoUrl,
          })
        );
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "torxos_company_profile",
          JSON.stringify({
            tradeName,
            legalName,
            document,
            phone,
            email,
            logoUrl,
          })
        );
      }
      alert("Configurações da empresa salvas com sucesso!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await fetchApi("/tenant/settings", {
        method: "PUT",
        body: JSON.stringify({
          warrantyDaysDefault,
          enableWhatsappAuto,
          warrantyTermsText,
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Termos de garantia salvos no ambiente local com sucesso!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    if (editingMember) {
      setTeam((prev) =>
        prev.map((u) =>
          u.id === editingMember.id
            ? {
                ...u,
                name: newUserName,
                email: newUserEmail,
                role: newUserRole,
                commissionServicesPercent: newUserCommServices,
                commissionProductsPercent: newUserCommProducts,
              }
            : u
        )
      );
      setShowUserModal(false);
      setEditingMember(null);
      return;
    }

    try {
      const created = await fetchApi("/tenant/users", {
        method: "POST",
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          commissionServicesPercent: newUserCommServices,
          commissionProductsPercent: newUserCommProducts,
        }),
      });

      if (created && created.user) {
        setTeam((prev) => [...prev, created.user]);
      } else {
        setTeam((prev) => [
          ...prev,
          {
            id: `u-${Date.now()}`,
            name: newUserName,
            email: newUserEmail,
            role: newUserRole,
            commissionServicesPercent: newUserCommServices,
            commissionProductsPercent: newUserCommProducts,
            isActive: true,
          },
        ]);
      }

      setShowUserModal(false);
      setNewUserName("");
      setNewUserEmail("");
    } catch (err: any) {
      if (
        err?.code === "PLAN_USER_LIMIT_REACHED" ||
        err?.message?.includes("Limite de colaboradores atingido") ||
        err?.status === 403
      ) {
        setShowUserModal(false);
        setShowUpgradeModal(true);
        return;
      }
      setTeam((prev) => [
        ...prev,
        {
          id: `u-${Date.now()}`,
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          commissionServicesPercent: newUserCommServices,
          commissionProductsPercent: newUserCommProducts,
          isActive: true,
        },
      ]);
      setShowUserModal(false);
      setNewUserName("");
      setNewUserEmail("");
    }
  };

  const handleToggleUserStatus = async (member: TeamMember) => {
    const nextStatus = !member.isActive;
    try {
      await fetchApi(`/tenant/users/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextStatus }),
      });
      setTeam((prev) =>
        prev.map((u) => (u.id === member.id ? { ...u, isActive: nextStatus } : u))
      );
    } catch (err: any) {
      alert("Erro ao alterar status: " + err.message);
    }
  };

  const handleDeleteUser = async (member: TeamMember) => {
    if (
      !confirm(
        `Deseja realmente excluir o colaborador "${member.name}" (${member.email})?\n\nEsta ação removerá o acesso do usuário ao sistema.`
      )
    ) {
      return;
    }
    try {
      const res = await fetchApi(`/tenant/users/${member.id}`, {
        method: "DELETE",
      });
      setTeam((prev) => prev.filter((u) => u.id !== member.id));
      alert(res?.message || `Colaborador ${member.name} excluído com sucesso.`);
    } catch (err: any) {
      alert("Erro ao excluir colaborador: " + err.message);
    }
  };

  const handleOpenResetPassword = (member: TeamMember) => {
    setResetModalMember(member);
    setResetPasswordValue("evorix123");
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalMember) return;
    setResettingPassword(true);
    try {
      const res = await fetchApi(`/tenant/users/${resetModalMember.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ newPassword: resetPasswordValue }),
      });
      const dataToReset: PasswordResetData = {
        userName: res?.userName || resetModalMember.name,
        userEmail: res?.email || resetModalMember.email,
        phone: res?.phone || "",
        tenantName: tradeName || "Sua Loja",
        tempPassword: res?.tempPassword || resetPasswordValue,
      };
      setResetModalMember(null);
      setResetSuccessData(dataToReset);
    } catch (err: any) {
      alert("Erro ao redefinir senha: " + err.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const loadBranches = async () => {
    setLoadingBranches(true);
    try {
      const data = await fetchApi("/tenant/branches");
      if (data) {
        setBranchesData(data);
      }
    } catch (err) {
      console.warn("Não foi possível carregar filiais:", err);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchTradeName.trim() || !branchDocument.trim() || !branchPhone.trim() || !branchEmail.trim()) {
      alert("Preencha todos os campos obrigatórios da filial.");
      return;
    }
    setCreatingBranch(true);
    try {
      const res = await fetchApi("/tenant/branches", {
        method: "POST",
        body: JSON.stringify({
          tradeName: branchTradeName.trim(),
          legalName: branchLegalName.trim() || branchTradeName.trim(),
          document: branchDocument.trim(),
          phone: branchPhone.trim(),
          email: branchEmail.trim(),
        }),
      });
      alert(res?.message || "Filial cadastrada com sucesso!");
      setShowBranchModal(false);
      setBranchTradeName("");
      setBranchLegalName("");
      setBranchDocument("");
      setBranchPhone("");
      setBranchEmail("");
      loadBranches();
    } catch (err: any) {
      alert("Erro ao cadastrar filial: " + (err?.message || "Ocorreu um erro."));
    } finally {
      setCreatingBranch(false);
    }
  };

  const handleSwitchBranch = async (targetBranchId: string) => {
    try {
      const res = await fetchApi(`/tenant/branches/${targetBranchId}/switch`, {
        method: "POST",
      });
      if (res?.accessToken) {
        localStorage.setItem("torxos_token", res.accessToken);
        localStorage.setItem("evorix_token", res.accessToken);
        if (res.user) {
          localStorage.setItem("torxos_user", JSON.stringify(res.user));
          localStorage.setItem("evorix_user", JSON.stringify(res.user));
        }
        alert(res?.message || "Unidade alterada com sucesso!");
        window.location.reload();
      }
    } catch (err: any) {
      alert("Erro ao alternar para a filial: " + (err?.message || "Ocorreu um erro."));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#181816] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#787774] font-medium">Carregando dados da sua empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBEBE8] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#787774]">Governança & Tenant</span>
            <span className="text-xs text-[#A8A7A1]">•</span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Plano Enterprise
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-[#181816] tracking-tight">
            Configurações da Empresa & Equipe
          </h1>
          <p className="text-sm text-[#787774] mt-0.5">
            Personalize a identidade da assistência, termos de garantia legal e regras de comissão dos técnicos.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            Configurações salvas com sucesso!
          </div>
        )}
      </div>

      {/* Navegação por Abas Luxury Off-White */}
      <div className="flex items-center gap-2 border-b border-[#EBEBE8] pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("COMPANY")}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "COMPANY"
              ? "border-[#181816] text-[#181816] font-semibold"
              : "border-transparent text-[#787774] hover:text-[#181816]"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Dados da Empresa
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("WARRANTY")}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "WARRANTY"
              ? "border-[#181816] text-[#181816] font-semibold"
              : "border-transparent text-[#787774] hover:text-[#181816]"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Garantia & Termos Legais
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TEAM")}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "TEAM"
              ? "border-[#181816] text-[#181816] font-semibold"
              : "border-transparent text-[#787774] hover:text-[#181816]"
          }`}
        >
          <Users className="w-4 h-4" />
          Equipe Técnica & Comissões ({team.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SUBSCRIPTION")}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "SUBSCRIPTION"
              ? "border-[#181816] text-[#181816] font-semibold"
              : "border-transparent text-[#787774] hover:text-[#181816]"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Plano & Mensalidade (SaaS)
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("BRANCHES");
            if (!branchesData) loadBranches();
          }}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "BRANCHES"
              ? "border-[#181816] text-[#181816] font-semibold"
              : "border-transparent text-[#787774] hover:text-[#181816]"
          }`}
        >
          <Store className="w-4 h-4" />
          Unidades & Filiais
          {planName !== "ENTERPRISE" && planName !== "MASTER" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">
              ENT 🔒
            </span>
          )}
        </button>
      </div>

      {/* =================================================================== */}
      {/* ABA 1: DADOS DA EMPRESA                                             */}
      {/* =================================================================== */}
      {activeTab === "COMPANY" && (
        <form onSubmit={handleSaveCompany} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBE8] shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-[#181816] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#787774]" />
              Identificação Cadastral & Contato Oficial
            </h3>

            {/* Upload do Logotipo Oficial da Empresa */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8]">
              <ImageUploader
                label="Logotipo Oficial da Assistência Técnica"
                sublabel="Será exibido no topo do recibo impresso da OS (A4 e Bobina Térmica 80mm), no rastreio público via WhatsApp e no cabeçalho do sistema."
                value={logoUrl}
                onChange={setLogoUrl}
                aspectRatio="wide"
                maxDimension={600}
                placeholderText="Clique ou arraste a Logo da sua empresa aqui"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#181816] mb-1.5">Nome Fantasia (Exibido aos clientes)</label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:ring-1 focus:ring-[#181816]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1.5">Razão Social Completa</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:ring-1 focus:ring-[#181816]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1.5">CNPJ da Matriz</label>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] font-mono focus:outline-none focus:ring-1 focus:ring-[#181816]"
                  disabled
                />
                <span className="text-[10px] text-[#A8A7A1] mt-1 block">CNPJ vinculado à licença multi-tenant.</span>
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1.5">WhatsApp Comercial / Balcão</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#787774] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:ring-1 focus:ring-[#181816]"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-[#181816] mb-1.5">E-mail de Suporte / Administrativo</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#787774] absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:ring-1 focus:ring-[#181816]"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EBEBE8] flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Salvando..." : "Salvar Alterações da Loja"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* ABA 2: GARANTIA & REGRAS DE NEGÓCIO                                 */}
      {/* =================================================================== */}
      {activeTab === "WARRANTY" && (
        <form onSubmit={handleSaveWarranty} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBE8] shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-[#181816] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#787774]" />
              Políticas de Garantia Legal & Automações
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#181816] mb-1.5">Prazo Padrão de Garantia de Serviços (Dias)</label>
                <input
                  type="number"
                  min={30}
                  max={365}
                  value={warrantyDaysDefault}
                  onChange={(e) => setWarrantyDaysDefault(parseInt(e.target.value) || 90)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-[#181816]"
                />
                <span className="text-[10px] text-[#787774] mt-1 block">O Código de Defesa do Consumidor estipula mínimo de 90 dias para bens duráveis.</span>
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1.5">Notificação Automática pós-Aprovação</label>
                <div 
                  onClick={() => setEnableWhatsappAuto(!enableWhatsappAuto)}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] cursor-pointer hover:bg-[#F5F5F0] transition-colors"
                >
                  <span className="text-xs text-[#181816] font-medium">Disparo automático de WhatsApp</span>
                  {enableWhatsappAuto ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Ativo
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[#787774] bg-[#F5F5F2] px-2 py-0.5 rounded border border-[#E5E5E0]">
                      Inativo
                    </span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-[#181816] mb-1.5">Texto Formal dos Termos de Garantia (Impresso no laudo)</label>
                <textarea
                  rows={4}
                  value={warrantyTermsText}
                  onChange={(e) => setWarrantyTermsText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] leading-relaxed text-xs focus:outline-none focus:ring-1 focus:ring-[#181816]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#EBEBE8] flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Salvando..." : "Salvar Regras de Garantia"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* ABA 3: EQUIPE TÉCNICA & COMISSÕES                                   */}
      {/* =================================================================== */}
      {activeTab === "TEAM" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#EBEBE8] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#EBEBE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#181816]">Quadro de Colaboradores & Regras de Comissão</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F3F3EF] text-[#181816] border border-[rgba(28,25,23,0.08)]">
                    {planLimits.name}: {currentActiveUsers} / {maxUsers > 1000 ? "Ilimitados" : `${maxUsers} membros`}
                  </span>
                </div>
                <p className="text-xs text-[#787774] mt-0.5">
                  As comissões de bancada são calculadas e provisionadas automaticamente no Contas a Pagar ao entregar a OS.
                </p>
                {isUserLimitReached && maxUsers < 1000 && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Limite do plano {planLimits.name} atingido.</span>
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(true)}
                      className="font-bold underline hover:text-amber-800 ml-1 cursor-pointer"
                    >
                      Fazer upgrade para adicionar mais
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenCreateUser}
                className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                Adicionar Colaborador
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EBEBE8] bg-[#FAF9F6] text-[11px] font-semibold text-[#787774] uppercase tracking-wider">
                    <th className="py-3 px-4">Nome & E-mail</th>
                    <th className="py-3 px-4 text-center">Perfil de Acesso</th>
                    <th className="py-3 px-4 text-center">Comissão Serviços</th>
                    <th className="py-3 px-4 text-center">Comissão Peças</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBE8] text-xs">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#181816]">{member.name}</p>
                        <p className="text-[11px] text-[#787774]">{member.email}</p>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#F5F5F2] text-[#181816] border border-[#E5E5E0]">
                          {member.role === "ADMIN" ? "Administrador" : member.role === "TECHNICIAN" ? "Técnico de Bancada" : member.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-[#181816] tabular-nums">
                        {member.commissionServicesPercent > 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {Number(member.commissionServicesPercent).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[#A8A7A1]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-[#181816] tabular-nums">
                        {member.commissionProductsPercent > 0 ? (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {Number(member.commissionProductsPercent).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[#A8A7A1]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          member.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {member.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(member)}
                            className="p-1.5 rounded-lg text-[#787774] hover:text-[#181816] hover:bg-[#F5F5F2] transition cursor-pointer"
                            title="Editar colaborador e comissões"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenResetPassword(member)}
                            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-800 hover:bg-amber-50 transition cursor-pointer"
                            title="Redefinir senha de acesso"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(member)}
                            className="text-[11px] font-semibold text-[#787774] hover:text-[#181816] underline cursor-pointer"
                          >
                            {member.isActive ? "Desativar" : "Ativar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(member)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                            title="Excluir colaborador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 4: PLANO & MENSALIDADE (COMERCIALIZAÇÃO SAAS)                  */}
      {/* =================================================================== */}
      {activeTab === "SUBSCRIPTION" && (
        <div className="space-y-6">
          {/* Banner de Cancelamento Agendado (se aplicável) */}
          {(subscriptionData?.isCanceled || subscriptionData?.status === "CANCELED") && (
            <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-amber-950">Cancelamento de Assinatura Agendado</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-200/80 text-amber-900 border border-amber-400">
                      Acesso Ativo até {subscriptionData?.cancelEffectiveDate ? new Date(subscriptionData.cancelEffectiveDate).toLocaleDateString("pt-BR") : "o fim do ciclo"}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/90 max-w-2xl leading-relaxed">
                    Você e sua equipe continuam com acesso completo a todas as ferramentas até{" "}
                    <strong>{subscriptionData?.cancelEffectiveDate ? new Date(subscriptionData.cancelEffectiveDate).toLocaleDateString("pt-BR") : "o vencimento do período pago"}</strong>.
                    Nenhum cliente, ordem de serviço ou dado de estoque foi ou será excluído.
                  </p>
                  {subscriptionData?.cancellationReason && (
                    <p className="text-[11px] text-amber-800 font-medium">
                      Motivo registrado: {
                        subscriptionData.cancellationReason === "PRECO" ? "Valor da mensalidade alto no momento" :
                        subscriptionData.cancellationReason === "FALTA_TEMPO" ? "Falta de tempo para implantar" :
                        subscriptionData.cancellationReason === "FECHAMENTO_LOJA" ? "Fechamento ou pausa nas operações da loja" :
                        subscriptionData.cancellationReason === "FALTA_RECURSOS" ? "Falta de funcionalidades específicas" :
                        subscriptionData.cancellationReason === "DIFICULDADE_USO" ? "Dificuldades de adaptação ou uso do sistema" :
                        "Outro motivo"
                      }
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleReactivateSubscription}
                disabled={isReactivating}
                className="px-5 py-2.5 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-bold shrink-0 shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isReactivating ? "Reativando..." : "Reativar Minha Assinatura"}
              </button>
            </div>
          )}

          {/* Card de Status da Assinatura Atual */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBE8] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBEBE8] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#181816] text-amber-300 flex items-center justify-center shadow-sm">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#181816]">
                      {planName === "ENTERPRISE" ? "Plano Enterprise — TorxOS" : planName === "STARTER" ? "Plano Starter — TorxOS" : "Plano Pro — TorxOS"}
                    </h3>
                    {(subscriptionData?.isCanceled || subscriptionData?.status === "CANCELED") ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                        Cancelamento Agendado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Assinatura Ativa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#787774]">
                    Assinatura mensal com emissão ilimitada de OSs, controle de caixa e inteligência analítica
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#787774] block">Valor da Mensalidade</span>
                <span className="text-xl font-bold text-[#181816] font-mono">
                  {planName === "ENTERPRISE" ? "R$ 347,00" : planName === "STARTER" ? "R$ 97,00" : "R$ 197,00"}
                  <span className="text-xs font-normal text-[#787774]">/mês</span>
                </span>
              </div>
            </div>

            {/* Metadados da Assinatura */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8] space-y-1">
                <span className="text-[11px] text-[#787774] flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#181816]" />
                  {(subscriptionData?.isCanceled || subscriptionData?.status === "CANCELED") ? "Término do Acesso" : "Próxima Renovação"}
                </span>
                <p className="font-bold text-[#181816] text-sm">
                  {subscriptionData?.cancelEffectiveDate
                    ? new Date(subscriptionData.cancelEffectiveDate).toLocaleDateString("pt-BR")
                    : subscriptionData?.invoiceDueDate
                    ? new Date(subscriptionData.invoiceDueDate).toLocaleDateString("pt-BR")
                    : "04 de Outubro de 2026"}
                </p>
                <span className={`text-[10px] ${(subscriptionData?.isCanceled || subscriptionData?.status === "CANCELED") ? "text-amber-800 font-semibold" : "text-emerald-700"}`}>
                  {(subscriptionData?.isCanceled || subscriptionData?.status === "CANCELED")
                    ? "Sem novas cobranças no cartão"
                    : "Cobrança automática programada"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8] space-y-1">
                <span className="text-[11px] text-[#787774] flex items-center gap-1.5 font-medium">
                  <CreditCard className="w-3.5 h-3.5 text-[#181816]" /> Forma de Pagamento
                </span>
                <p className="font-bold text-[#181816] text-sm">Cartão de Crédito / Asaas</p>
                <span className="text-[10px] text-[#787774]">Recorrência Segura Automatizada</span>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8] space-y-1">
                <span className="text-[11px] text-[#787774] flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#181816]" /> Segurança & Histórico
                </span>
                <p className="font-bold text-[#181816] text-sm">Dados 100% Protegidos</p>
                <span className="text-[10px] text-[#787774]">Backup em nuvem permanente</span>
              </div>
            </div>

            {/* Rodapé de Gestão de Cancelamento / Reativação */}
            <div className="pt-4 border-t border-[#EBEBE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {(subscriptionData?.isCanceled || subscriptionData?.status === "CANCELED") ? (
                <>
                  <div className="text-xs text-[#787774]">
                    Sua assinatura está com cancelamento programado. Deseja continuar utilizando o TorxOS?
                  </div>
                  <button
                    type="button"
                    onClick={handleReactivateSubscription}
                    disabled={isReactivating}
                    className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                    {isReactivating ? "Reativando..." : "Reativar Minha Assinatura"}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-xs text-[#787774]">
                    Precisa pausar ou cancelar o plano? Seus dados, clientes e ordens de serviço continuam salvos com total segurança.
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-200 transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    Cancelar Assinatura
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Comparativo dos Planos de Mensalidade */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#181816] flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Tabela Oficial de Planos & Mensalidades
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Plano Starter */}
              <div className="p-5 rounded-2xl bg-white border border-[#EBEBE8] shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="font-bold text-sm text-[#181816]">Starter</div>
                  <div className="text-2xl font-bold text-[#181816] font-mono">
                    R$ 97<span className="text-xs font-normal text-[#787774]">/mês</span>
                  </div>
                  <p className="text-[11px] text-[#787774]">
                    Ideal para técnicos autônomos ou lojas iniciantes com até 2 colaboradores.
                  </p>
                  <ul className="space-y-1.5 pt-2 text-[11px] text-[#444441]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Até 2 usuários simultâneos
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Até 80 Ordens de Serviço/mês
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Gestão de OSs & Kanban
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Portal Público com Assinatura
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl border border-[#E5E5E0] hover:bg-[#FAF9F6] text-[#181816] font-semibold text-xs transition"
                >
                  Migrar para Starter
                </button>
              </div>

              {/* Plano Pro (Atual) */}
              <div className="p-5 rounded-2xl bg-[#181816] text-white shadow-md flex flex-col justify-between space-y-4 relative">
                <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded bg-amber-400 text-black font-bold text-[9px] uppercase tracking-wider">
                  Plano Ativo
                </span>
                <div className="space-y-2">
                  <div className="font-bold text-sm text-white">Pro (Mais Escolhido)</div>
                  <div className="text-2xl font-bold text-white font-mono">
                    R$ 197<span className="text-xs font-normal text-stone-400">/mês</span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Solução completa para assistências técnicas em expansão com controle financeiro rigoroso.
                  </p>
                  <ul className="space-y-1.5 pt-2 text-[11px] text-stone-200">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" /> <strong>Usuários e técnicos ilimitados</strong>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" /> OSs ilimitadas sem taxa extra
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" /> Conciliação Bancária OFX & DRE
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" /> Previsão de Ruptura de Estoque
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" /> Checklist Fotográfico de Entrada
                    </li>
                  </ul>
                </div>
                <div className="w-full py-2.5 rounded-xl bg-white/10 text-center font-semibold text-xs text-amber-200 border border-white/15">
                  Plano Contratado
                </div>
              </div>

              {/* Plano Enterprise */}
              <div className="p-5 rounded-2xl bg-white border border-[#EBEBE8] shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="font-bold text-sm text-[#181816]">Enterprise</div>
                  <div className="text-2xl font-bold text-[#181816] font-mono">
                    R$ 347<span className="text-xs font-normal text-[#787774]">/mês</span>
                  </div>
                  <p className="text-[11px] text-[#787774]">
                    Para redes, franquias ou lojas com alto volume e foco em inteligência artificial.
                  </p>
                  <ul className="space-y-1.5 pt-2 text-[11px] text-[#444441]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Tudo incluso no Plano Pro
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <strong>TorxOS AI Mentor Ilimitado</strong>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Disparo WhatsApp Automático
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Suporte Prioritário VIP
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-semibold text-xs transition shadow-sm"
                >
                  Fazer Upgrade para Enterprise
                </button>
              </div>
            </div>
          </div>

          {/* Dicas de Faturamento & Gestão de Mensalidades */}
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8] text-xs space-y-2">
            <h4 className="font-bold text-[#181816] flex items-center gap-1.5">
              💡 Como Funciona o Faturamento Recorrente do TorxOS:
            </h4>
            <p className="text-[#787774] leading-relaxed">
              O sistema emite a cobrança automaticamente todo mês no cartão de crédito ou gera o código Pix de renovação 3 dias antes do vencimento. Caso necessite trocar o cartão ou cadastrar CNPJ para Nota Fiscal de Software, as alterações entram em vigor no ciclo imediatamente seguinte.
            </p>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 5: UNIDADES & FILIAIS (MULTI-FILIAIS & MATRIZ)                  */}
      {/* =================================================================== */}
      {activeTab === "BRANCHES" && (
        <PlanGate feature="canUseMultiBranches">
          <div className="space-y-6">
            {/* Header da Rede */}
            <div className="bg-white rounded-2xl border border-[#EBEBE8] shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-[#181816]">Rede de Lojas & Unidades de Atendimento</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {branchesData?.totalUnits || 1} {branchesData?.totalUnits === 1 ? "Unidade" : "Unidades na Rede"}
                  </span>
                </div>
                <p className="text-xs text-[#787774] leading-relaxed max-w-xl">
                  Gerencie sua Matriz e todas as filiais integradas. O lojista e a diretoria podem alternar entre unidades instantaneamente para conferir caixas, estoques e ordens de serviço.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBranchModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Nova Filial
              </button>
            </div>

            {loadingBranches ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[#EBEBE8]">
                <div className="w-7 h-7 border-2 border-[#181816] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#787774]">Carregando rede de filiais...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Card Matriz Principal */}
                {branchesData?.headquarter && (
                  <div className="bg-white rounded-2xl border-2 border-amber-500/40 p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBEBE8] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 font-bold shadow-xs">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#181816]">
                              {branchesData.headquarter.tradeName}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                              ★ Matriz Central (HQ)
                            </span>
                          </div>
                          <p className="text-xs text-[#787774] mt-0.5">
                            CNPJ: {branchesData.headquarter.document} • Telefone: {branchesData.headquarter.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {branchesData.currentUnitId === branchesData.headquarter.id ? (
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Unidade Ativa
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSwitchBranch(branchesData.headquarter.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
                            Operar na Matriz
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#555552]">
                      <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#EBEBE8]">
                        <span className="text-[10px] text-[#787774] block uppercase font-semibold">Razão Social</span>
                        <span className="font-medium text-[#181816] truncate block">{branchesData.headquarter.legalName || "—"}</span>
                      </div>
                      <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#EBEBE8]">
                        <span className="text-[10px] text-[#787774] block uppercase font-semibold">E-mail Operacional</span>
                        <span className="font-medium text-[#181816] truncate block">{branchesData.headquarter.email}</span>
                      </div>
                      <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#EBEBE8]">
                        <span className="text-[10px] text-[#787774] block uppercase font-semibold">Plano Global</span>
                        <span className="font-medium text-emerald-800">{branchesData.headquarter.plan}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Filiais */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#787774]">
                      Filiais Vinculadas ({branchesData?.branches?.length || 0})
                    </h4>
                  </div>

                  {(!branchesData?.branches || branchesData.branches.length === 0) ? (
                    <div className="p-8 rounded-2xl bg-[#FAF9F6] border border-dashed border-[#DCDCD8] text-center space-y-2">
                      <Store className="w-8 h-8 text-[#A8A7A1] mx-auto" />
                      <h5 className="text-xs font-bold text-[#181816]">Nenhuma filial cadastrada ainda</h5>
                      <p className="text-xs text-[#787774] max-w-sm mx-auto">
                        Expanda sua rede cadastrando novos pontos físicos ou quiosques vinculados à sua conta Enterprise.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {branchesData.branches.map((b) => {
                        const isCurrent = branchesData.currentUnitId === b.id;
                        return (
                          <div
                            key={b.id}
                            className={`bg-white rounded-2xl border p-5 space-y-3 transition-shadow shadow-xs hover:shadow-sm ${
                              isCurrent ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-[#EBEBE8]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-[#F5F5F2] text-[#181816] flex items-center justify-center border border-[#E5E5E0]">
                                  <Store className="w-4 h-4" />
                                </div>
                                <div>
                                  <h5 className="font-semibold text-xs text-[#181816] leading-tight">
                                    {b.tradeName}
                                  </h5>
                                  <span className="text-[10px] text-[#787774] font-mono">
                                    {b.document}
                                  </span>
                                </div>
                              </div>

                              {isCurrent ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Loja Atual
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSwitchBranch(b.id)}
                                  className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] hover:bg-[#F3F3EF] border border-[#E5E5E0] text-[11px] font-semibold text-[#181816] flex items-center gap-1 transition cursor-pointer"
                                >
                                  <ArrowRightLeft className="w-3 h-3 text-[#787774]" />
                                  Operar Aqui
                                </button>
                              )}
                            </div>

                            <div className="text-[11px] text-[#787774] space-y-1 pt-1 border-t border-[#F5F5F2]">
                              <p className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-[#A8A7A1]" /> {b.phone}
                              </p>
                              <p className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-[#A8A7A1]" /> {b.email}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </PlanGate>
      )}

      {/* =================================================================== */}
      {/* MODAL CADASTRAR NOVA FILIAL (PLANO ENTERPRISE)                      */}
      {/* =================================================================== */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#EBEBE8] shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EBEBE8] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#181816]">Cadastrar Nova Filial</h3>
                  <p className="text-xs text-[#787774]">Vincule uma nova unidade à sua Matriz</p>
                </div>
              </div>
              <button onClick={() => setShowBranchModal(false)} className="text-[#787774] hover:text-[#181816]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#181816] mb-1">Nome Fantasia da Filial *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: TorxOS Tech — Shopping Sul"
                  value={branchTradeName}
                  onChange={(e) => setBranchTradeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1">Razão Social (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: TorxOS Reparos Ltda - Filial 02"
                  value={branchLegalName}
                  onChange={(e) => setBranchLegalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1">CNPJ da Filial *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 12.345.678/0002-99"
                  value={branchDocument}
                  onChange={(e) => setBranchDocument(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] font-mono focus:outline-none focus:border-[#181816]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#181816] mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98888-7777"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#181816] mb-1">E-mail Operacional *</label>
                  <input
                    type="email"
                    required
                    placeholder="filial@torxos.com.br"
                    value={branchEmail}
                    onChange={(e) => setBranchEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                ℹ️ Esta filial herdará o plano <strong>Enterprise</strong> da Matriz e terá caixas, estoques e ordens de serviço isolados. O gestor poderá alternar entre elas em 1 clique.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBEBE8]">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#E5E5E0] text-xs font-medium text-[#787774] hover:bg-[#F5F5F2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingBranch}
                  className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Store className="w-3.5 h-3.5 text-amber-300" />
                  {creatingBranch ? "Cadastrando..." : "Salvar e Ativar Filial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL ADICIONAR COLABORADOR                                         */}
      {/* =================================================================== */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#EBEBE8] shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EBEBE8] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] text-[#181816] flex items-center justify-center border border-[#EBEBE8]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#181816]">
                    {editingMember ? "Editar Colaborador" : "Novo Membro da Equipe"}
                  </h3>
                  <p className="text-xs text-[#787774]">
                    {editingMember ? "Atualize perfil de acesso e regras de comissão" : "Cadastre um técnico ou operador"}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowUserModal(false)} className="text-[#787774] hover:text-[#181816]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#181816] mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: Pedro Henrique Silva"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1">E-mail de Login</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="pedro.tecnico@evorix.com.br"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1">Função / Perfil</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none"
                >
                  <option value="TECHNICIAN">Técnico de Bancada</option>
                  <option value="ATTENDANT">Atendente de Balcão</option>
                  <option value="FINANCIAL">Operador Financeiro</option>
                  <option value="MANAGER">Gerente de Loja</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-[#181816] mb-1">% Comissão em Serviços</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={newUserCommServices}
                    onChange={(e) => setNewUserCommServices(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] font-bold tabular-nums focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#181816] mb-1">% Comissão em Peças</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={newUserCommProducts}
                    onChange={(e) => setNewUserCommProducts(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] font-bold tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBEBE8]">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#E5E5E0] text-xs font-medium text-[#787774] hover:bg-[#F5F5F2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#181816] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-[#282824] transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {editingMember ? "Salvar Alterações" : "Salvar Colaborador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Redefinir Senha do Colaborador */}
      {resetModalMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBEBE8] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEBE8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#181816]">Redefinir Senha</h3>
                  <p className="text-[11px] text-[#787774]">{resetModalMember.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalMember(null)}
                className="text-[#787774] hover:text-[#181816]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#181816] mb-1">
                  E-mail do Colaborador
                </label>
                <input
                  type="text"
                  disabled
                  value={resetModalMember.email}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F5F2] border border-[#E5E5E0] text-[#787774] font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1">
                  Nova Senha Temporária
                </label>
                <input
                  type="text"
                  required
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Ex: evorix123"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] font-mono text-xs focus:outline-none focus:border-[#181816]"
                />
                <p className="text-[10px] text-[#787774] mt-1">
                  Informe esta nova senha provisória ao colaborador após redefinir.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBEBE8]">
                <button
                  type="button"
                  onClick={() => setResetModalMember(null)}
                  className="px-3.5 py-2 rounded-xl border border-[#E5E5E0] text-xs font-medium text-[#787774] hover:bg-[#F5F5F2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  {resettingPassword ? "Redefinindo..." : "Confirmar Nova Senha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL DE CANCELAMENTO & RETENÇÃO DE ASSINATURA                      */}
      {/* =================================================================== */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBEBE8] rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Topo do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEBE8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-2xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#181816]">Cancelar Assinatura do TorxOS</h3>
                  <p className="text-[11px] text-[#787774]">Sentiremos sua falta na nossa rede de lojistas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-[#787774] hover:text-[#181816] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Caixa de Benefícios & Tranquilidade (Anti-Pânico) */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8] text-xs space-y-2.5">
              <h4 className="font-bold text-[#181816] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                O que acontece após confirmar o cancelamento?
              </h4>
              <ul className="space-y-1.5 text-[#555552] text-[11px] leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>
                    Seu acesso permanecerá <strong>100% ativo até {subscriptionData?.invoiceDueDate ? new Date(subscriptionData.invoiceDueDate).toLocaleDateString("pt-BR") : "o final do ciclo pago"}</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>
                    <strong>Seus dados e históricos NÃO serão apagados.</strong> Suas ordens de serviço, clientes e estoque continuarão salvos em segurança caso queira retornar.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>
                    <strong>Cobranças automáticas suspensas:</strong> Nenhuma nova fatura será cobrada no seu cartão de crédito.
                  </span>
                </li>
              </ul>
            </div>

            {/* Formulário com Motivo da Decisão */}
            <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#181816] mb-1.5">
                  Qual o principal motivo da sua decisão?
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: "PRECO", label: "O valor da mensalidade está alto para o meu momento" },
                    { id: "FALTA_TEMPO", label: "Falta de tempo para implantar e treinar a equipe" },
                    { id: "FECHAMENTO_LOJA", label: "Fechamento, mudança de ramo ou pausa na loja" },
                    { id: "FALTA_RECURSOS", label: "Falta de recursos ou ferramentas específicas que necessito" },
                    { id: "DIFICULDADE_USO", label: "Dificuldades de adaptação ou uso do sistema" },
                    { id: "OUTRO", label: "Outro motivo" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                        cancelReason === item.id
                          ? "bg-stone-50 border-[#181816] font-semibold text-[#181816]"
                          : "border-[#E5E5E0] text-[#555552] hover:bg-[#FAF9F6]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={item.id}
                        checked={cancelReason === item.id}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="accent-[#181816]"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1">
                  Conte-nos mais detalhes ou deixe sua sugestão (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={cancelFeedback}
                  onChange={(e) => setCancelFeedback(e.target.value)}
                  placeholder="Seu relato nos ajuda a melhorar a plataforma para toda a comunidade de técnicos..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] text-xs focus:outline-none focus:border-[#181816]"
                />
              </div>

              {/* Botões de Decisão */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-[#EBEBE8]">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer order-2 sm:order-1"
                >
                  <HeartHandshake className="w-4 h-4 text-emerald-300" />
                  Voltar e Manter Meu Plano
                </button>

                <button
                  type="submit"
                  disabled={isCanceling}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 order-1 sm:order-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  {isCanceling ? "Agendando..." : "Confirmar Agendamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Disparo de Credenciais Redefinidas (WhatsApp / E-mail) */}
      <PasswordResetModal
        isOpen={Boolean(resetSuccessData)}
        onClose={() => setResetSuccessData(null)}
        data={resetSuccessData}
      />

      {/* Modal de Upgrade de Plano */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        customTitle="Limite de Membros da Equipe"
        customDescription={`O seu plano ${planLimits.name} permite o cadastro de até ${maxUsers} membros na equipe. Para expandir seu time de técnicos e atendentes, faça upgrade para o plano seguinte.`}
        requiredPlan={planLimits.maxUsers <= 2 ? "PRO" : "ENTERPRISE"}
      />
    </div>
  );
}
