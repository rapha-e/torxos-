"use client";

import React, { useState, useEffect } from "react";
import {
  Crown,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Zap,
  Phone,
  Mail,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Plus,
  Edit3,
  X,
  Save,
  FileText,
  KeyRound,
  LogIn,
  Trash2,
  Calendar,
  CalendarPlus,
  AlertCircle,
  MessageSquare,
  Send,
  CreditCard,
  ShieldAlert,
  QrCode,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchApi, getCurrentUser, getAuthToken, setAuthToken } from "@/lib/api";
import { PasswordResetModal, PasswordResetData } from "@/components/ui/password-reset-modal";
import { maskCpfCnpj, maskPhone } from "@/lib/masks";

interface TenantItem {
  id: string;
  tradeName: string;
  legalName?: string;
  document: string;
  phone: string;
  email: string;
  plan: string;
  planPrice?: number;
  monthlyPrice?: number | null;
  isActive: boolean;
  isTrial: boolean;
  trialDays?: number;
  lastPaymentDate?: string | null;
  invoiceDueDate?: string;
  daysUntilInvoice?: number;
  isInvoiceOverdue?: boolean;
  gracePeriodDays?: number;
  gracePeriodEndsAt?: string;
  daysRemainingGrace?: number;
  isInGracePeriod?: boolean;
  isGraceExpired?: boolean;
  subscriptionStatus?: string;
  expiresAt?: string;
  daysRemaining?: number;
  isExpired?: boolean;
  whatsappBillingUrl?: string | null;
  asaasCustomerId?: string | null;
  asaasSubscriptionId?: string | null;
  asaasLastPaymentId?: string | null;
  asaasInvoiceUrl?: string | null;
  asaasLastPaymentStatus?: string | null;
  isCanceled?: boolean;
  cancelEffectiveDate?: string | null;
  cancellationReason?: string | null;
  cancellationFeedback?: string | null;
  canceledAt?: string | null;
  createdAt: string;
  stats: {
    usersCount: number;
    ordersCount: number;
    clientsCount: number;
  };
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    estimatedMRR: 0,
    totalUsers: 0,
    totalServiceOrders: 0,
  });
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [actionSuccess, setActionSuccess] = useState<string>("");

  // Estado para o Modal de Edição Completa da Empresa
  const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    tradeName: "",
    legalName: "",
    document: "",
    phone: "",
    email: "",
    plan: "STARTER",
    monthlyPrice: "",
    isActive: true,
    subscriptionStatus: "TRIAL",
    expiresAt: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState("torxos123");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetSuccessData, setResetSuccessData] = useState<PasswordResetData | null>(null);

  // Estado para o Modal de Exclusão Segura da Empresa
  const [deletingTenant, setDeletingTenant] = useState<TenantItem | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Estado para o Modal de Cobrança / Assinatura Asaas
  const [asaasModalTenant, setAsaasModalTenant] = useState<TenantItem | null>(null);
  const [asaasBillingType, setAsaasBillingType] = useState<string>("UNDEFINED");
  const [asaasLoadingAction, setAsaasLoadingAction] = useState<string>("");
  const [asaasPaymentInfo, setAsaasPaymentInfo] = useState<any>(null);
  const [asaasSubInfo, setAsaasSubInfo] = useState<any>(null);
  const [asaasPixData, setAsaasPixData] = useState<{ encodedImage?: string; payload?: string; expirationDate?: string } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);


  useEffect(() => {
    const user = getCurrentUser();
    const token = getAuthToken();

    if (!user || !token) {
      router.replace("/login");
      return;
    }

    if (user.role !== "SUPER_ADMIN") {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    setIsSuperAdmin(true);
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/tenant/super-admin/dashboard");
      if (data && data.metrics) {
        setMetrics(data.metrics);
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do Super Admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (tenantId: string, newPlan: string) => {
    try {
      await fetchApi(`/tenant/super-admin/tenants/${tenantId}`, {
        method: "PATCH",
        body: JSON.stringify({ plan: newPlan }),
      });
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, plan: newPlan } : t))
      );
      setActionSuccess(`Plano da empresa alterado para ${newPlan} com sucesso!`);
      setTimeout(() => setActionSuccess(""), 3000);
      loadData();
    } catch (err: any) {
      alert("Erro ao alterar plano: " + err.message);
    }
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      await fetchApi(`/tenant/super-admin/tenants/${tenantId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextStatus }),
      });
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, isActive: nextStatus } : t))
      );
      setActionSuccess(`Status da empresa ${nextStatus ? "ativado" : "suspenso"} com sucesso!`);
      setTimeout(() => setActionSuccess(""), 3000);
      loadData();
    } catch (err: any) {
      alert("Erro ao alterar status: " + err.message);
    }
  };

  const handleOpenEdit = (tenant: TenantItem) => {
    setEditingTenant(tenant);
    let initialExpiry = "";
    if (tenant.expiresAt) {
      try {
        const d = new Date(tenant.expiresAt);
        if (!isNaN(d.getTime())) {
          initialExpiry = d.toISOString().split("T")[0];
        }
      } catch {
        initialExpiry = "";
      }
    }
    setEditFormData({
      tradeName: tenant.tradeName || "",
      legalName: tenant.legalName || "",
      document: tenant.document || "",
      phone: tenant.phone || "",
      email: tenant.email || "",
      plan: tenant.plan || "STARTER",
      monthlyPrice: tenant.monthlyPrice !== undefined && tenant.monthlyPrice !== null ? String(tenant.monthlyPrice) : "",
      isActive: tenant.isActive ?? true,
      subscriptionStatus: tenant.subscriptionStatus || (tenant.isTrial ? "TRIAL" : "ACTIVE"),
      expiresAt: initialExpiry,
    });
  };

  const handleExtendExpiry = (daysToAdd: number) => {
    const baseDate = editFormData.expiresAt ? new Date(editFormData.expiresAt + "T12:00:00") : new Date();
    const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;
    const futureDate = new Date(validBase.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const yyyy = futureDate.getFullYear();
    const mm = String(futureDate.getMonth() + 1).padStart(2, "0");
    const dd = String(futureDate.getDate()).padStart(2, "0");
    setEditFormData((prev) => ({
      ...prev,
      expiresAt: `${yyyy}-${mm}-${dd}`,
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setSavingEdit(true);
    try {
      const payload: any = {
        tradeName: editFormData.tradeName,
        legalName: editFormData.legalName,
        document: editFormData.document,
        phone: editFormData.phone,
        email: editFormData.email,
        monthlyPrice: editFormData.monthlyPrice !== "" && editFormData.monthlyPrice !== null && !isNaN(Number(editFormData.monthlyPrice))
          ? Number(editFormData.monthlyPrice)
          : null,
        subscriptionStatus: editFormData.subscriptionStatus,
      };

      if (editFormData.expiresAt) {
        payload.expiresAt = new Date(editFormData.expiresAt + "T23:59:59").toISOString();
      }

      const res = await fetchApi(`/tenant/super-admin/tenants/${editingTenant.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setActionSuccess(`Dados e vencimento da empresa "${editFormData.tradeName}" atualizados com sucesso!`);
      setEditingTenant(null);
      setTimeout(() => setActionSuccess(""), 3500);
      loadData();
    } catch (err: any) {
      alert("Erro ao salvar alterações da empresa: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!deletingTenant) return;
    setDeletingLoading(true);
    try {
      const res = await fetchApi(`/tenant/super-admin/tenants/${deletingTenant.id}`, {
        method: "DELETE",
      });
      setActionSuccess(res?.message || `Empresa "${deletingTenant.tradeName}" excluída permanentemente.`);
      setDeletingTenant(null);
      setTimeout(() => setActionSuccess(""), 4000);
      loadData();
    } catch (err: any) {
      alert("Erro ao excluir empresa: " + err.message);
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleConfirmPayment = async (tenant: TenantItem) => {
    const currentDueFormatted = tenant.invoiceDueDate
      ? new Date(tenant.invoiceDueDate).toLocaleDateString("pt-BR")
      : "vencimento atual";

    if (
      !confirm(
        `Deseja confirmar o pagamento da mensalidade da empresa "${tenant.tradeName}" no valor de R$ ${(tenant.planPrice ?? 197).toFixed(2)}?\n\n📅 Vencimento da fatura/trial: ${currentDueFormatted}\n✨ O novo vencimento será estendido em +30 dias a partir da data de vencimento da fatura e o status passará para Ativo.`
      )
    ) {
      return;
    }
    try {
      const res = await fetchApi(`/tenant/super-admin/tenants/${tenant.id}/confirm-payment`, {
        method: "POST",
      });
      setActionSuccess(res?.message || `Pagamento de "${tenant.tradeName}" confirmado com sucesso!`);
      setTimeout(() => setActionSuccess(""), 5000);
      loadData();
    } catch (err: any) {
      alert("Erro ao confirmar pagamento: " + err.message);
    }
  };

  const handleExtendGrace = async (tenant: TenantItem, days: number = 5) => {
    try {
      const res = await fetchApi(`/tenant/super-admin/tenants/${tenant.id}/extend-grace`, {
        method: "POST",
        body: JSON.stringify({ days }),
      });
      setActionSuccess(res?.message || `Prazo de confiança estendido em +${days} dias!`);
      setTimeout(() => setActionSuccess(""), 4000);
      loadData();
    } catch (err: any) {
      alert("Erro ao estender prazo: " + err.message);
    }
  };

  const handleSendBillingEmail = async (tenant: TenantItem) => {
    try {
      const res = await fetchApi(`/tenant/super-admin/tenants/${tenant.id}/send-billing-email`, {
        method: "POST",
      });
      alert(`✅ ${res?.message || "E-mail de cobrança enviado com sucesso!"}`);
      setActionSuccess(`Fatura enviada para ${tenant.email}!`);
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      alert("Erro ao enviar e-mail de cobrança: " + err.message);
    }
  };

  const handleResetAdminPassword = async () => {
    if (!editingTenant) return;
    if (
      !confirm(
        `Deseja redefinir a senha do administrador da loja "${editingTenant.tradeName}" para "${resetPasswordInput}"?`
      )
    ) {
      return;
    }
    setResettingPassword(true);
    try {
      const res = await fetchApi(
        `/tenant/super-admin/tenants/${editingTenant.id}/reset-admin-password`,
        {
          method: "POST",
          body: JSON.stringify({ newPassword: resetPasswordInput }),
        }
      );
      const resetData: PasswordResetData = {
        userName: res.adminName || editingTenant.tradeName || "Administrador da Loja",
        userEmail: res.adminEmail || editingTenant.email || "",
        phone: res.adminPhone || editingTenant.phone || "",
        tenantName: res.tenantTradeName || editingTenant.tradeName || "Assistência Técnica",
        tempPassword: res.tempPassword || resetPasswordInput,
      };
      setResetSuccessData(resetData);
      setActionSuccess(`Senha de ${resetData.userName} redefinida com sucesso!`);
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      alert("Erro ao redefinir senha: " + err.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleImpersonate = async (tenant: TenantItem) => {
    if (
      !confirm(
        `Deseja entrar no ambiente da loja "${tenant.tradeName}" em Modo Suporte?\n\nVocê verá a plataforma exatamente como o lojista vê e poderá voltar ao Painel Master a qualquer momento.`
      )
    ) {
      return;
    }
    try {
      // Guarda a sessão de Super Admin para poder retornar com 1 clique
      const currentToken = getAuthToken();
      const currentUser = getCurrentUser();
      if (currentToken && currentUser) {
        const backupData = JSON.stringify({ token: currentToken, user: currentUser });
        localStorage.setItem("torxos_super_admin_backup", backupData);
        localStorage.setItem("evorix_super_admin_backup", backupData);
      }

      const res = await fetchApi(`/tenant/super-admin/tenants/${tenant.id}/impersonate`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (res?.accessToken && res?.user) {
        setAuthToken(res.accessToken);
        localStorage.setItem("torxos_user", JSON.stringify(res.user));
        localStorage.setItem("evorix_user", JSON.stringify(res.user));
        window.location.href = "/";
      }
    } catch (err: any) {
      alert("Erro ao acessar como loja: " + err.message);
    }
  };

  // =========================================================================
  // HANDLERS — INTEGRAÇÃO ASAAS
  // =========================================================================

  const handleOpenAsaasModal = async (tenant: TenantItem) => {
    setAsaasModalTenant(tenant);
    setAsaasBillingType("UNDEFINED");
    setAsaasPaymentInfo(null);
    setAsaasSubInfo(null);
    setAsaasPixData(null);
    setCopiedPix(false);
    setCopiedInvoice(false);

    try {
      if (tenant.asaasLastPaymentId) {
        fetchApi(`/asaas/tenants/${tenant.id}/payment-status`)
          .then((data) => setAsaasPaymentInfo(data))
          .catch(() => {});
      }
      if (tenant.asaasSubscriptionId) {
        fetchApi(`/asaas/tenants/${tenant.id}/subscription`)
          .then((data) => setAsaasSubInfo(data))
          .catch(() => {});
      }
    } catch {}
  };

  const handleCreateAsaasSubscription = async () => {
    if (!asaasModalTenant) return;
    setAsaasLoadingAction("sub");
    try {
      const res = await fetchApi(`/asaas/tenants/${asaasModalTenant.id}/create-subscription`, {
        method: "POST",
        body: JSON.stringify({ billingType: asaasBillingType }),
      });
      alert(`✅ ${res?.message || "Assinatura recorrente criada com sucesso no Asaas!"}`);
      setActionSuccess(`Assinatura Asaas gerada para "${asaasModalTenant.tradeName}"!`);
      const updatedSub = await fetchApi(`/asaas/tenants/${asaasModalTenant.id}/subscription`).catch(() => null);
      if (updatedSub) setAsaasSubInfo(updatedSub);
      loadData();
    } catch (err: any) {
      alert("Erro ao criar assinatura Asaas: " + err.message);
    } finally {
      setAsaasLoadingAction("");
    }
  };

  const handleCreateAsaasCharge = async () => {
    if (!asaasModalTenant) return;
    setAsaasLoadingAction("charge");
    try {
      const res = await fetchApi(`/asaas/tenants/${asaasModalTenant.id}/create-charge`, {
        method: "POST",
        body: JSON.stringify({ billingType: asaasBillingType }),
      });
      alert(`✅ ${res?.message || "Cobrança gerada com sucesso no Asaas!"}`);
      setActionSuccess(`Cobrança de R$ ${(res?.value ?? 197).toFixed(2)} gerada no Asaas!`);
      if (res?.paymentId) {
        const payStatus = await fetchApi(`/asaas/tenants/${asaasModalTenant.id}/payment-status`).catch(() => null);
        if (payStatus) setAsaasPaymentInfo(payStatus);
      }
      loadData();
    } catch (err: any) {
      alert("Erro ao gerar cobrança Asaas: " + err.message);
    } finally {
      setAsaasLoadingAction("");
    }
  };

  const handleLoadPixQr = async () => {
    if (!asaasModalTenant) return;
    setAsaasLoadingAction("pix");
    try {
      const res = await fetchApi(`/asaas/tenants/${asaasModalTenant.id}/pix-qrcode`);
      if (res?.success && (res?.encodedImage || res?.payload)) {
        setAsaasPixData(res);
      } else {
        alert("Não foi possível gerar QR Code Pix: " + (res?.message || "Gere uma cobrança primeiro."));
      }
    } catch (err: any) {
      alert("Erro ao obter QR Code Pix: " + err.message);
    } finally {
      setAsaasLoadingAction("");
    }
  };

  const handleRefreshAsaasStatus = async () => {
    if (!asaasModalTenant) return;
    setAsaasLoadingAction("status");
    try {
      const [pRes, sRes] = await Promise.all([
        fetchApi(`/asaas/tenants/${asaasModalTenant.id}/payment-status`).catch(() => null),
        fetchApi(`/asaas/tenants/${asaasModalTenant.id}/subscription`).catch(() => null),
      ]);
      if (pRes) setAsaasPaymentInfo(pRes);
      if (sRes) setAsaasSubInfo(sRes);
      setActionSuccess("Status do Asaas sincronizado!");
      setTimeout(() => setActionSuccess(""), 3000);
      loadData();
    } catch (err: any) {
      alert("Erro ao sincronizar status: " + err.message);
    } finally {
      setAsaasLoadingAction("");
    }
  };

  const handleCopyText = (text: string, type: "pix" | "invoice") => {
    navigator.clipboard.writeText(text);
    if (type === "pix") {
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    } else {
      setCopiedInvoice(true);
      setTimeout(() => setCopiedInvoice(false), 2500);
    }
  };


  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.tradeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.document?.includes(searchTerm) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === "ALL" || t.plan?.toUpperCase() === planFilter;
    return matchesSearch && matchesPlan;
  });

  if (isSuperAdmin === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-[#181816] tracking-tight">
          Acesso Restrito ao Dono do Software (403 Forbidden)
        </h2>
        <p className="text-xs text-[#787774] max-w-md mt-2 leading-relaxed">
          Esta área é estritamente confidencial e reservada à administração global do TorxOS.
          Sua conta não possui privilégios de Super Admin.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 px-4 py-2 bg-[#181816] hover:bg-[#2b2a27] text-white text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
        >
          Voltar ao Painel da Assistência Técnica
        </button>
      </div>
    );
  }

  if (loading || isSuperAdmin === null) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-xs text-[#787774]">
        <div className="w-8 h-8 rounded-xl bg-[#181816] flex items-center justify-center shadow-sm animate-pulse">
          <Crown className="w-4 h-4 text-amber-300" />
        </div>
        <span className="font-medium">Carregando painel master de empresas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header com Badge Dourado VIP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBEBE8] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              Painel do Dono do Software
            </span>
            <span className="text-xs text-[#A8A7A1]">•</span>
            <span className="text-xs font-mono font-medium text-[#787774]">
              Visão Global SaaS Multi-Tenant
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#181816] tracking-tight">
            Gestão Master de Empresas & Mensalidades
          </h1>
          <p className="text-sm text-[#787774] mt-0.5">
            Monitore o crescimento da sua plataforma, receita recorrente (MRR), assinaturas ativas e todas as assistências cadastradas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/api/v1/onboarding/whatsapp/qrcode"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold shadow-2xs transition cursor-pointer"
            title="Conecte o número de WhatsApp que enviará as mensagens automáticas da régua de trial para os lojistas"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Conectar WhatsApp do Sistema (Régua Trial)</span>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </a>

          {actionSuccess && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {actionSuccess}
            </div>
          )}
        </div>
      </div>

      {/* Grid de Métricas Principais (SaaS C-Level) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MRR */}
        <div className="p-5 rounded-2xl bg-white border border-[#EBEBE8] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#787774] uppercase tracking-wider">
              MRR Recorrente
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#181816] font-mono">
            R$ {Number(metrics.estimatedMRR ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#787774]">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Previsão de faturamento mensal</span>
          </div>
        </div>

        {/* Card 2: Lojas Ativas */}
        <div className="p-5 rounded-2xl bg-white border border-[#EBEBE8] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#787774] uppercase tracking-wider">
              Empresas Cadastradas
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] text-[#181816] flex items-center justify-center border border-[#EBEBE8]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#181816] font-mono">
            {metrics.totalTenants}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{metrics.activeTenants} lojas operando no Brasil</span>
          </div>
        </div>

        {/* Card 3: Lojas em Trial */}
        <div className="p-5 rounded-2xl bg-white border border-[#EBEBE8] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#787774] uppercase tracking-wider">
              Lojas em Teste (Trial)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono">
            {metrics.trialTenants}
          </div>
          <div className="text-[11px] text-[#787774]">
            <span>Novas adesões no período de 7 dias grátis</span>
          </div>
        </div>

        {/* Card 4: Volume de OSs */}
        <div className="p-5 rounded-2xl bg-white border border-[#EBEBE8] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#787774] uppercase tracking-wider">
              OSs Processadas
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] text-[#181816] flex items-center justify-center border border-[#EBEBE8]">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#181816] font-mono">
            {metrics.totalServiceOrders}
          </div>
          <div className="text-[11px] text-[#787774]">
            <span>{metrics.totalUsers} usuários técnicos conectados</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtro e Pesquisa */}
      <div className="p-4 rounded-2xl bg-white border border-[#EBEBE8] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#787774] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome da assistência, CNPJ ou e-mail..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[#787774] whitespace-nowrap">Filtrar Plano:</span>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none"
          >
            <option value="ALL">Todos os Planos</option>
            <option value="STARTER">Starter (R$ 97)</option>
            <option value="PRO">Pro (R$ 197)</option>
            <option value="ENTERPRISE">Enterprise (R$ 347)</option>
          </select>
        </div>
      </div>

      {/* Tabela de Empresas Clientes */}
      <div className="bg-white rounded-2xl border border-[#EBEBE8] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#EBEBE8] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#181816] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#787774]" />
            Lista de Assistências Técnicas Conectadas ({filteredTenants.length})
          </h3>
          <span className="text-[11px] font-mono text-[#787774]">
            Atualizado em tempo real
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-[#787774] font-semibold border-b border-[#EBEBE8]">
              <tr>
                <th className="py-3 px-4">Assistência / Empresa</th>
                <th className="py-3 px-4">Documento (CNPJ/CPF)</th>
                <th className="py-3 px-4">Contato Oficial</th>
                <th className="py-3 px-4">Plano Contratado</th>
                <th className="py-3 px-4 text-center">Usuários / OSs</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBE8] text-[#181816]">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-[#FAF9F6] transition">
                  <td className="py-3.5 px-4 font-semibold">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#181816] text-amber-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {tenant.tradeName?.charAt(0)?.toUpperCase() || "E"}
                      </div>
                      <div>
                        <div className="font-bold text-[#181816]">{tenant.tradeName}</div>
                        <div className="text-[10px] text-[#787774] font-mono">
                          ID: {tenant.id.slice(0, 8)}... • Desde {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[#444441]">
                    {tenant.document}
                  </td>

                  <td className="py-3.5 px-4 text-[#444441]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#787774]" /> {tenant.phone}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#787774]">
                        <Mail className="w-3 h-3 text-[#787774]" /> {tenant.email}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      <select
                        value={tenant.plan}
                        onChange={(e) => handleUpdatePlan(tenant.id, e.target.value)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#E5E5E0] bg-white text-[#181816] focus:outline-none cursor-pointer"
                      >
                        <option value="STARTER">STARTER (R$ 97)</option>
                        <option value="PRO">PRO (R$ 197)</option>
                        <option value="ENTERPRISE">ENTERPRISE (R$ 347)</option>
                      </select>
                      {tenant.monthlyPrice !== undefined && tenant.monthlyPrice !== null && (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded font-mono inline-block w-fit" title="Preço negociado personalizado ativo para esta loja">
                          ⭐ R$ {Number(tenant.monthlyPrice).toFixed(2)} (Negociado)
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center tabular-nums">
                    <div className="inline-flex items-center gap-2 font-mono">
                      <span className="px-2 py-0.5 bg-[#FAF9F6] border border-[#EBEBE8] rounded text-[#181816] font-bold" title="Usuários Ativos">
                        👥 {tenant.stats?.usersCount || 1}
                      </span>
                      <span className="px-2 py-0.5 bg-[#FAF9F6] border border-[#EBEBE8] rounded text-[#181816] font-bold" title="Total de Ordens de Serviço">
                        🛠️ {tenant.stats?.ordersCount || 0}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-1 flex-wrap justify-center">
                        {tenant.isGraceExpired ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            Bloqueado (Tolerância Esgotada)
                          </span>
                        ) : tenant.isInGracePeriod ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-400 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-700" />
                            Prazo de Confiança ({tenant.daysRemainingGrace}d)
                          </span>
                        ) : !tenant.isActive || tenant.subscriptionStatus === "SUSPENDED" ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Suspenso
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Ativo
                          </span>
                        )}

                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                            tenant.isTrial
                              ? "text-amber-800 bg-amber-50 border-amber-200"
                              : "text-blue-800 bg-blue-50 border-blue-200"
                          }`}
                        >
                          {tenant.isTrial ? `Trial (${tenant.trialDays || 7}d)` : `Assinatura ${tenant.plan}`}
                        </span>

                        {tenant.isCanceled && (
                          <span
                            className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1"
                            title={`Cancelamento Agendado\nMotivo: ${tenant.cancellationReason || "Não informado"}\nFeedback: ${tenant.cancellationFeedback || "Nenhum"}\nExpira em: ${tenant.cancelEffectiveDate ? new Date(tenant.cancelEffectiveDate).toLocaleDateString("pt-BR") : "N/D"}`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                            Cancelamento Agendado
                          </span>
                        )}

                        {tenant.asaasSubscriptionId && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-0.5" title="Assinatura Recorrente no Asaas configurada">
                            ⚡ Asaas Recorrente
                          </span>
                        )}
                        {tenant.asaasLastPaymentStatus && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                            tenant.asaasLastPaymentStatus === "CONFIRMED" || tenant.asaasLastPaymentStatus === "RECEIVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : tenant.asaasLastPaymentStatus === "OVERDUE"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`} title="Status do último pagamento no Asaas">
                            Asaas: {tenant.asaasLastPaymentStatus}
                          </span>
                        )}
                      </div>

                      {/* Datas de Faturamento e Prazo de Confiança */}
                      <div className="text-[10px] font-mono leading-tight space-y-0.5 text-center">
                        {tenant.lastPaymentDate && (
                          <div className="text-[#666] flex items-center justify-center gap-1">
                            <span>💳 Pago em:</span>
                            <span className="text-[#181816] font-medium">
                              {new Date(tenant.lastPaymentDate).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        )}

                        {tenant.invoiceDueDate && (
                          <div className="text-[#555] flex items-center justify-center gap-1">
                            <span>📅 Fatura:</span>
                            <strong className={tenant.isInvoiceOverdue ? "text-rose-600" : "text-[#181816]"}>
                              {new Date(tenant.invoiceDueDate).toLocaleDateString("pt-BR")}
                            </strong>
                          </div>
                        )}

                        {!tenant.isTrial && tenant.gracePeriodEndsAt && (
                          <div className="text-[9px] flex items-center justify-center gap-1 text-[#787774]">
                            <span>🛡️ Tolerância até:</span>
                            <span className="font-semibold text-[#444]">
                              {new Date(tenant.gracePeriodEndsAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        )}

                        <div>
                          {tenant.isGraceExpired ? (
                            <span className="inline-block text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-300 px-1.5 py-0.2 rounded">
                              ❌ Bloqueado há {Math.abs(tenant.daysRemainingGrace ?? 0)}d
                            </span>
                          ) : tenant.isInGracePeriod ? (
                            <span className="inline-block text-[9px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                              ⚠️ Bloqueia em {tenant.daysRemainingGrace} dia(s)
                            </span>
                          ) : tenant.daysUntilInvoice === 1 ? (
                            <span className="inline-block text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                              ⚠️ Vence amanhã!
                            </span>
                          ) : tenant.daysUntilInvoice === 0 ? (
                            <span className="inline-block text-[9px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.2 rounded animate-pulse">
                              🚨 Vence hoje!
                            </span>
                          ) : (
                            <span className="inline-block text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              restam {tenant.daysUntilInvoice} dias
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="flex flex-col gap-1.5 items-center justify-center">
                      {/* Linha 1: Gestão Operacional */}
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleImpersonate(tenant)}
                          className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition shadow-xs cursor-pointer"
                          title="Entrar no ambiente desta empresa em Modo Suporte"
                        >
                          <LogIn className="w-3 h-3 text-amber-700" />
                          Acessar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(tenant)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border border-[#E5E5E0] bg-[#FAF9F6] text-[#181816] hover:bg-white hover:border-[#181816] transition shadow-xs cursor-pointer"
                          title="Editar Informações da Loja"
                        >
                          <Edit3 className="w-3 h-3 text-[#787774]" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(tenant.id, tenant.isActive)}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border transition cursor-pointer ${
                            tenant.isActive
                              ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {tenant.isActive ? "Suspender" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTenant(tenant)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition shadow-xs cursor-pointer"
                          title="Excluir Permanentemente esta Empresa"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          Excluir
                        </button>
                      </div>

                      {/* Linha 2: Ações de Faturamento & Cobrança (WhatsApp / E-mail / Renovar) */}
                      <div className="flex items-center justify-center gap-1 flex-wrap pt-1 border-t border-[#F0F0ED] w-full">
                        {tenant.whatsappBillingUrl && (
                          <a
                            href={tenant.whatsappBillingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition shadow-xs cursor-pointer"
                            title="Enviar cobrança personalizada via WhatsApp"
                          >
                            <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                            WhatsApp
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSendBillingEmail(tenant)}
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 transition shadow-xs cursor-pointer"
                          title="Disparar e-mail com fatura"
                        >
                          <Send className="w-2.5 h-2.5 text-blue-600" />
                          E-mail
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmPayment(tenant)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-400 bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
                          title="Confirmar pagamento manual e renovar por +30 dias"
                        >
                          <CreditCard className="w-2.5 h-2.5" />
                          Pagar (+30d)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExtendGrace(tenant, 5)}
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition shadow-xs cursor-pointer"
                          title="Conceder +5 dias de Prazo de Confiança"
                        >
                          <CalendarPlus className="w-2.5 h-2.5 text-amber-700" />
                          +5d Prazo
                        </button>
                      </div>

                      {/* Linha 3: Gateway Asaas Automático */}
                      <div className="flex items-center justify-center gap-1 flex-wrap pt-1 border-t border-[#F0F0ED] w-full">
                        <button
                          type="button"
                          onClick={() => handleOpenAsaasModal(tenant)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100 transition shadow-xs cursor-pointer"
                          title="Abrir painel Asaas: Assinatura recorrente, Cobrança, Pix e Status"
                        >
                          <Zap className="w-2.5 h-2.5 text-blue-600" />
                          Asaas Gateway
                        </button>

                        {tenant.asaasInvoiceUrl && (
                          <a
                            href={tenant.asaasInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-lg border border-[#E5E5E0] bg-white text-[#181816] hover:bg-[#FAF9F6] transition shadow-xs"
                            title="Abrir link da fatura no Asaas"
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-[#787774]" />
                            Fatura
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#787774]">
                    Nenhuma assistência encontrada com os filtros informados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição Completa da Empresa */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBEBE8] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#EBEBE8] flex items-center justify-between bg-[#FAF9F6]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#181816] text-amber-300 flex items-center justify-center font-bold text-xs">
                  <Crown className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#181816]">Editar Empresa / Assistência</h3>
                  <p className="text-[11px] text-[#787774] font-mono">ID: {editingTenant.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="w-7 h-7 rounded-lg text-[#787774] hover:text-[#181816] hover:bg-[#EBEBE8] flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#444441] mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.tradeName}
                    onChange={(e) => setEditFormData({ ...editFormData, tradeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#444441] mb-1">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    value={editFormData.legalName}
                    onChange={(e) => setEditFormData({ ...editFormData, legalName: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#444441] mb-1">
                    CNPJ ou CPF
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    value={editFormData.document}
                    onChange={(e) => setEditFormData({ ...editFormData, document: maskCpfCnpj(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#444441] mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: maskPhone(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#444441] mb-1">
                  E-mail Oficial da Empresa
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#EBEBE8]">
                <div>
                  <label className="block text-[11px] font-bold text-[#444441] mb-1">
                    Plano Atribuído
                  </label>
                  <select
                    value={editFormData.plan}
                    onChange={(e) => setEditFormData({ ...editFormData, plan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] font-semibold focus:outline-none focus:border-[#181816]"
                  >
                    <option value="STARTER">STARTER (R$ 97/mês)</option>
                    <option value="PRO">PRO (R$ 197/mês)</option>
                    <option value="ENTERPRISE">ENTERPRISE (R$ 347/mês)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#444441] mb-1">
                    Modelo / Status da Assinatura
                  </label>
                  <select
                    value={editFormData.subscriptionStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setEditFormData({
                        ...editFormData,
                        subscriptionStatus: newStatus,
                        isActive: newStatus !== "SUSPENDED",
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] font-semibold focus:outline-none focus:border-[#181816]"
                  >
                    <option value="TRIAL">⏳ Período de Testes (TRIAL)</option>
                    <option value="ACTIVE">✅ Assinatura Regular (ATIVO)</option>
                    <option value="SUSPENDED">⛔ Acesso Bloqueado (SUSPENSO)</option>
                  </select>
                </div>
              </div>

              {/* Valor Personalizado da Mensalidade */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#181816] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                    Valor Personalizado da Mensalidade (R$)
                  </label>
                  <span className="text-[10px] text-[#787774]">
                    Deixe em branco para usar o valor padrão
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#787774]">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={`Padrão do plano ${editFormData.plan}: R$ ${
                      editFormData.plan === "STARTER" ? "97,00" : editFormData.plan === "ENTERPRISE" ? "347,00" : "197,00"
                    }`}
                    value={editFormData.monthlyPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, monthlyPrice: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-amber-300 text-[#181816] font-mono text-xs font-semibold focus:outline-none focus:border-amber-600"
                  />
                </div>
                <p className="text-[10px] text-[#787774] leading-relaxed">
                  💡 Se preenchido, este valor personalizado substitui o valor padrão do plano em todas as funcionalidades: <strong>MRR</strong>, mensagens do <strong>WhatsApp</strong>, <strong>E-mail</strong> de fatura e <strong>Asaas Gateway</strong>.
                </p>
              </div>

              {/* Data de Vencimento e Extensão Rápida */}
              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E5E0] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#181816] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Data de Vencimento da Assinatura / Trial
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleExtendExpiry(7)}
                      className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                      title="Adicionar 7 dias à data de vencimento"
                    >
                      <CalendarPlus className="w-3 h-3" />
                      +7 dias
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExtendExpiry(30)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                      title="Adicionar 30 dias à data de vencimento"
                    >
                      <CalendarPlus className="w-3 h-3" />
                      +30 dias
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={editFormData.expiresAt}
                  onChange={(e) => setEditFormData({ ...editFormData, expiresAt: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E5E5E0] text-[#181816] font-mono text-xs focus:outline-none focus:border-[#181816]"
                />
                <p className="text-[10px] text-[#787774]">
                  Ao expirar esta data, o sistema bloqueará automaticamente o acesso da loja no login (exceto Super Admin).
                </p>
              </div>

              {/* Redefinição de Senha do Lojista (Suporte Master) */}
              <div className="pt-4 border-t border-[#EBEBE8] space-y-2 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#181816] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    Redefinir Senha do Dono / Administrador da Loja
                  </span>
                </div>
                <p className="text-[10px] text-[#787774]">
                  Caso o lojista perca o acesso ou solicite suporte, defina uma nova senha provisória para ele:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={resetPasswordInput}
                    onChange={(e) => setResetPasswordInput(e.target.value)}
                    placeholder="Nova senha temporária (ex: torxos123)"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-[#E5E5E0] text-[#181816] font-mono text-xs focus:outline-none focus:border-[#181816]"
                  />
                  <button
                    type="button"
                    disabled={resettingPassword}
                    onClick={handleResetAdminPassword}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {resettingPassword ? "Redefinindo..." : "Resetar Senha"}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EBEBE8] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 rounded-xl border border-[#E5E5E0] text-[#787774] hover:text-[#181816] hover:bg-[#FAF9F6] font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#2b2a27] text-white font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-amber-300" />
                  {savingEdit ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exibição e Disparo de Senha Redefinida (WhatsApp / E-mail) */}
      <PasswordResetModal
        isOpen={Boolean(resetSuccessData)}
        onClose={() => setResetSuccessData(null)}
        data={resetSuccessData}
      />

      {/* Modal de Confirmação Segura para Exclusão de Empresa */}
      {deletingTenant && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">Excluir Empresa Permanentemente</h3>
                  <p className="text-[11px] text-rose-700 font-mono">ID: {deletingTenant.id.slice(0, 8)}...</p>
                </div>
              </div>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={() => setDeletingTenant(null)}
                className="w-7 h-7 rounded-lg text-rose-700 hover:text-rose-950 hover:bg-rose-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Atenção: Ação Destrutiva Irreversível!</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Você está prestes a apagar permanentemente a empresa{" "}
                  <strong className="underline">{deletingTenant.tradeName}</strong>.
                </p>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Todos os dados relacionados (<strong>{deletingTenant.stats?.usersCount || 0} usuários</strong>,{" "}
                  <strong>{deletingTenant.stats?.ordersCount || 0} ordens de serviço</strong>, clientes, estoque e finanças) serão eliminados do banco de dados em cascata.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={deletingLoading}
                  onClick={() => setDeletingTenant(null)}
                  className="px-4 py-2 rounded-xl border border-[#E5E5E0] text-[#787774] hover:text-[#181816] hover:bg-[#FAF9F6] font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={deletingLoading}
                  onClick={handleDeleteTenant}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingLoading ? "Excluindo..." : "Sim, Excluir Empresa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asaas Gateway — Cobrança & Mensalidades */}
      {asaasModalTenant && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBEBE8] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho do Modal Asaas */}
            <div className="p-5 border-b border-[#EBEBE8] flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#181816]">Asaas Gateway de Pagamentos</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Sandbox Ativo
                    </span>
                  </div>
                  <p className="text-xs text-[#787774]">
                    Cobranças e assinaturas de <strong className="text-[#181816]">{asaasModalTenant.tradeName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAsaasModalTenant(null)}
                className="w-8 h-8 rounded-lg text-[#787774] hover:text-[#181816] hover:bg-[#FAF9F6] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Card Resumo da Loja & Plano */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#787774]">Plano Atual</span>
                  <div className="text-xs font-bold text-[#181816] mt-0.5">{asaasModalTenant.plan}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#787774]">Valor Mensal</span>
                  <div className="text-xs font-bold text-emerald-700 font-mono mt-0.5">
                    R$ {(asaasModalTenant.planPrice ?? 197).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#787774]">CNPJ / CPF</span>
                  <div className="text-xs font-medium text-[#181816] font-mono mt-0.5">
                    {asaasModalTenant.document || "Não cadastrado"}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#787774]">Cliente Asaas</span>
                  <div className="text-[11px] font-mono text-blue-700 font-bold truncate mt-0.5" title={asaasModalTenant.asaasCustomerId || "Será gerado na 1ª cobrança"}>
                    {asaasModalTenant.asaasCustomerId || "Automático"}
                  </div>
                </div>
              </div>

              {/* Seção 1: Configurar & Gerar Cobrança */}
              <div className="space-y-3 p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#181816] flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Gerar Cobrança ou Assinatura Recorrente
                  </span>
                  <span className="text-[10px] text-[#787774]">
                    Fatura automática com baixa por Webhook
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#444] mb-1">
                    Método de Pagamento Permitido:
                  </label>
                  <select
                    value={asaasBillingType}
                    onChange={(e) => setAsaasBillingType(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E5E5E0] text-xs font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="UNDEFINED">Qualquer forma (Lojista escolhe Pix, Boleto ou Cartão na fatura)</option>
                    <option value="PIX">Somente Pix (Instantâneo)</option>
                    <option value="BOLETO">Somente Boleto Bancário</option>
                    <option value="CREDIT_CARD">Somente Cartão de Crédito</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Botão Assinatura Recorrente */}
                  <button
                    type="button"
                    disabled={!!asaasLoadingAction}
                    onClick={handleCreateAsaasSubscription}
                    className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex flex-col items-center justify-center gap-1 text-center transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Zap className="w-3.5 h-3.5" />
                      {asaasLoadingAction === "sub" ? "Criando Assinatura..." : "Criar Assinatura Recorrente"}
                    </div>
                    <span className="text-[10px] font-normal text-blue-100">
                      O Asaas cobra todo mês automaticamente
                    </span>
                  </button>

                  {/* Botão Cobrança Avulsa */}
                  <button
                    type="button"
                    disabled={!!asaasLoadingAction}
                    onClick={handleCreateAsaasCharge}
                    className="p-3 rounded-xl bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 font-bold flex flex-col items-center justify-center gap-1 text-center transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      {asaasLoadingAction === "charge" ? "Gerando Fatura..." : "Gerar Cobrança Avulsa"}
                    </div>
                    <span className="text-[10px] font-normal text-[#787774]">
                      Cobrança avulsa para regularização imediata
                    </span>
                  </button>
                </div>

                {asaasSubInfo?.hasSubscription && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] flex items-center justify-between">
                    <div>
                      <strong>Assinatura Recorrente Ativa:</strong> ID {asaasSubInfo.subscriptionId} ({asaasSubInfo.cycle})
                      <div className="text-[10px] text-emerald-700">
                        Próximo vencimento: {asaasSubInfo.nextDueDate} • R$ {Number(asaasSubInfo.value).toFixed(2)}
                      </div>
                    </div>
                    <span className="font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      {asaasSubInfo.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Seção 2: Links da Fatura e Compartilhamento */}
              {(asaasModalTenant.asaasInvoiceUrl || asaasPaymentInfo?.invoiceUrl) && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 text-emerald-600" />
                      Link da Fatura do Asaas
                    </span>
                    <span className="text-[10px] font-mono text-emerald-800 font-medium">
                      Status: {asaasPaymentInfo?.status || asaasModalTenant.asaasLastPaymentStatus || "PENDING"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={asaasPaymentInfo?.invoiceUrl || asaasModalTenant.asaasInvoiceUrl || ""}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-[11px] font-mono text-[#181816] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyText(asaasPaymentInfo?.invoiceUrl || asaasModalTenant.asaasInvoiceUrl || "", "invoice")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      {copiedInvoice ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedInvoice ? "Copiado!" : "Copiar"}
                    </button>
                    <a
                      href={asaasPaymentInfo?.invoiceUrl || asaasModalTenant.asaasInvoiceUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs transition flex items-center gap-1 whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir Fatura
                    </a>
                  </div>

                  {/* Atalho de Envio via WhatsApp com link da fatura */}
                  {asaasModalTenant.phone && (
                    <div className="pt-1">
                      <a
                        href={`https://wa.me/55${asaasModalTenant.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Olá equipe da ${asaasModalTenant.tradeName}!\n\nSegue a fatura de mensalidade do TorxOS no valor de R$ ${(asaasModalTenant.planPrice ?? 197).toFixed(2)}:\n${asaasPaymentInfo?.invoiceUrl || asaasModalTenant.asaasInvoiceUrl}\n\nO pagamento pode ser feito via Pix, Boleto ou Cartão com baixa automática no sistema!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        Enviar fatura diretamente pelo WhatsApp do lojista
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Seção 3: QR Code Pix Instantâneo */}
              <div className="p-4 rounded-xl border border-[#EBEBE8] bg-[#FAF9F6] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#181816] flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    QR Code Pix Instantâneo
                  </span>
                  <button
                    type="button"
                    disabled={!!asaasLoadingAction}
                    onClick={handleLoadPixQr}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <QrCode className="w-3 h-3" />
                    {asaasLoadingAction === "pix" ? "Carregando..." : asaasPixData ? "Recarregar Pix" : "Ver QR Code Pix"}
                  </button>
                </div>

                {asaasPixData ? (
                  <div className="p-3 bg-white border border-[#EBEBE8] rounded-xl flex flex-col items-center gap-3">
                    {asaasPixData.encodedImage && (
                      <div className="p-2 bg-white rounded-lg border border-[#EBEBE8] shadow-xs">
                        <img
                          src={`data:image/png;base64,${asaasPixData.encodedImage}`}
                          alt="QR Code Pix Asaas"
                          className="w-44 h-44 object-contain"
                        />
                      </div>
                    )}
                    {asaasPixData.payload && (
                      <div className="w-full space-y-1">
                        <label className="block text-[10px] font-semibold text-[#787774]">
                          Código Pix Copia e Cola:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={asaasPixData.payload}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#FAF9F6] border border-[#EBEBE8] text-[10px] font-mono text-[#181816] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopyText(asaasPixData.payload || "", "pix")}
                            className="px-3 py-1.5 rounded-lg bg-[#181816] hover:bg-[#2b2a27] text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            {copiedPix ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedPix ? "Copiado!" : "Copiar"}
                          </button>
                        </div>
                      </div>
                    )}
                    {asaasPixData.expirationDate && (
                      <span className="text-[10px] text-[#787774]">
                        Válido até: {new Date(asaasPixData.expirationDate).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#787774]">
                    Gere uma cobrança ou clique em <strong>Ver QR Code Pix</strong> para exibir a imagem e a chave copia-e-cola do Pix para o cliente.
                  </p>
                )}
              </div>

              {/* Seção 4: Sincronização & Informações Técnicas */}
              <div className="pt-2 flex items-center justify-between border-t border-[#EBEBE8]">
                <button
                  type="button"
                  disabled={!!asaasLoadingAction}
                  onClick={handleRefreshAsaasStatus}
                  className="px-3 py-1.5 rounded-xl border border-[#E5E5E0] bg-white hover:bg-[#FAF9F6] text-[#181816] font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${asaasLoadingAction === "status" ? "animate-spin" : ""}`} />
                  {asaasLoadingAction === "status" ? "Sincronizando..." : "Atualizar Status no Asaas"}
                </button>

                <button
                  type="button"
                  onClick={() => setAsaasModalTenant(null)}
                  className="px-4 py-1.5 rounded-xl bg-[#181816] hover:bg-[#2b2a27] text-white font-semibold text-xs transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
