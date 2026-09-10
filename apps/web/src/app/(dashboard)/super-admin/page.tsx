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
  Megaphone,
  Video,
  Globe,
  Eye,
  ChevronLeft,
  Share2,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchApi, getCurrentUser, getAuthToken, setAuthToken } from "@/lib/api";
import { PasswordResetModal, PasswordResetData } from "@/components/ui/password-reset-modal";

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

  // Estado para o Gerador de Copys e Tráfego Pago (Etapa 2 & 3)
  const [growthModalOpen, setGrowthModalOpen] = useState(false);
  const [growthFocus, setGrowthFocus] = useState<string>("TODOS");
  const [growthTone, setGrowthTone] = useState<string>("DIRETO_E_AGRESSIVO");
  const [growthLoading, setGrowthLoading] = useState(false);
  const [growthResult, setGrowthResult] = useState<any>(null);
  const [activeGrowthTab, setActiveGrowthTab] = useState<"meta" | "reels" | "google" | "payload">("meta");
  const [copiedGrowthKey, setCopiedGrowthKey] = useState<string | null>(null);

  // Estado para Central de Redes Sociais & Carrosséis (Etapa 4)
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialPillar, setSocialPillar] = useState<string>("GESTAO_ASSISTENCIA");
  const [socialCustomTopic, setSocialCustomTopic] = useState("");
  const [socialTotalSlides, setSocialTotalSlides] = useState<number>(6);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialPostResult, setSocialPostResult] = useState<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [copiedSocialCaption, setCopiedSocialCaption] = useState(false);
  const [socialWebhookUrl, setSocialWebhookUrl] = useState("https://hook.eu1.make.com/pwx3stjiesby9cx5sivywni9tej1gfri");
  const [socialDispatching, setSocialDispatching] = useState(false);
  const [socialDispatchSuccess, setSocialDispatchSuccess] = useState("");

  // Estado para Régua de Onboarding & CRM WhatsApp (Etapa 5)
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingPipeline, setOnboardingPipeline] = useState<any>({ leads: [], summary: {} });
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("ALL");
  const [previewLead, setPreviewLead] = useState<any>(null);
  const [copiedLeadMessage, setCopiedLeadMessage] = useState(false);

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
        plan: editFormData.plan,
        monthlyPrice: editFormData.monthlyPrice ? parseFloat(editFormData.monthlyPrice) : null,
        isActive: editFormData.isActive,
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
        `Deseja confirmar o pagamento da mensalidade da empresa "${tenant.tradeName}" no valor de R$ ${(tenant.planPrice || 197).toFixed(2)}?\n\n📅 Vencimento da fatura/trial: ${currentDueFormatted}\n✨ O novo vencimento será estendido em +30 dias a partir da data de vencimento da fatura e o status passará para Ativo.`
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
      setActionSuccess(`Cobrança de R$ ${(res?.value || 197).toFixed(2)} gerada no Asaas!`);
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

  // =========================================================================
  // HANDLERS — GROWTH & GERAÇÃO DE COPYS (ETAPA 2 & 3)
  // =========================================================================

  const handleGenerateGrowthAds = async () => {
    setGrowthLoading(true);
    try {
      const data = await fetchApi("/growth/generate-ads", {
        method: "POST",
        body: JSON.stringify({
          focus: growthFocus,
          tone: growthTone,
        }),
      });
      setGrowthResult(data);
      setActionSuccess("Novas copys e criativos de tráfego gerados com sucesso!");
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      alert("Erro ao gerar anúncios: " + (err.message || "Falha na comunicação com a API"));
    } finally {
      setGrowthLoading(false);
    }
  };

  const handleCopyGrowthText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedGrowthKey(key);
    setTimeout(() => setCopiedGrowthKey(null), 2500);
  };

  // =========================================================================
  // HANDLERS — SOCIAL MEDIA & CARROSSÉIS (ETAPA 4)
  // =========================================================================

  const handleGenerateSocialCarousel = async () => {
    setSocialLoading(true);
    setCurrentSlideIndex(0);
    try {
      const data = await fetchApi("/social/generate-carousel", {
        method: "POST",
        body: JSON.stringify({
          pillar: socialPillar,
          customTopic: socialCustomTopic || undefined,
          totalSlides: socialTotalSlides,
        }),
      });
      setSocialPostResult(data);
      setActionSuccess("Carrossel educativo gerado com sucesso!");
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      alert("Erro ao gerar carrossel: " + (err.message || "Falha na API"));
    } finally {
      setSocialLoading(false);
    }
  };

  const handleGenerateWeeklyPack = async () => {
    setSocialLoading(true);
    setCurrentSlideIndex(0);
    try {
      const data = await fetchApi("/social/generate-weekly-pack", {
        method: "POST",
        body: JSON.stringify({
          postsCount: 3,
        }),
      });
      if (data?.posts && data.posts.length > 0) {
        setSocialPostResult(data.posts[0]);
      }
      setActionSuccess("Grade semanal de 3 posts gerada com sucesso!");
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      alert("Erro ao gerar grade semanal: " + (err.message || "Falha na API"));
    } finally {
      setSocialLoading(false);
    }
  };

  const handleCopySocialCaption = () => {
    if (!socialPostResult?.caption) return;
    navigator.clipboard.writeText(socialPostResult.caption);
    setCopiedSocialCaption(true);
    setTimeout(() => setCopiedSocialCaption(false), 2500);
  };

  const handleDispatchSocialWebhook = async () => {
    if (!socialWebhookUrl || !socialPostResult) {
      alert("Informe a URL do webhook e gere um post antes de disparar.");
      return;
    }
    setSocialDispatching(true);
    try {
      const res = await fetchApi("/social/dispatch-webhook", {
        method: "POST",
        body: JSON.stringify({
          webhookUrl: socialWebhookUrl,
          postData: socialPostResult,
          channel: "INSTAGRAM",
        }),
      });
      setSocialDispatchSuccess(res?.message || "Webhook disparado com sucesso!");
      setTimeout(() => setSocialDispatchSuccess(""), 5000);
    } catch (err: any) {
      alert("Erro ao disparar webhook: " + err.message);
    } finally {
      setSocialDispatching(false);
    }
  };

  // =========================================================================
  // HANDLERS — ONBOARDING & CRM WHATSAPP (ETAPA 5)
  // =========================================================================

  const handleOpenOnboardingModal = async () => {
    setOnboardingModalOpen(true);
    setOnboardingLoading(true);
    try {
      const data = await fetchApi("/onboarding/pipeline");
      if (data) {
        setOnboardingPipeline(data);
      }
    } catch (err: any) {
      alert("Erro ao carregar pipeline de onboarding: " + (err.message || "Falha na API"));
    } finally {
      setOnboardingLoading(false);
    }
  };

  const handleDispatchOnboarding = async (lead: any) => {
    try {
      const res = await fetchApi("/onboarding/dispatch", {
        method: "POST",
        body: JSON.stringify({
          tenantId: lead.id,
          stage: lead.currentStage,
        }),
      });
      setActionSuccess(`Mensagem enviada com sucesso para ${lead.tradeName}!`);
      setTimeout(() => setActionSuccess(""), 4000);
      handleOpenOnboardingModal();
    } catch (err: any) {
      alert("Erro ao disparar mensagem: " + err.message);
    }
  };

  const handleCopyLeadMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLeadMessage(true);
    setTimeout(() => setCopiedLeadMessage(false), 2500);
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
            href="/lp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E5E0] bg-white hover:bg-[#FAF9F6] text-[#181816] text-xs font-semibold shadow-xs transition"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Ver Landing Page (/lp)</span>
            <ExternalLink className="w-3 h-3 text-[#A8A7A1]" />
          </a>

          <button
            type="button"
            onClick={() => {
              setGrowthModalOpen(true);
              if (!growthResult) {
                handleGenerateGrowthAds();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#181816] to-[#2e2a25] hover:from-[#24221f] hover:to-[#3a352e] text-amber-400 text-xs font-bold shadow-sm transition cursor-pointer border border-amber-500/20"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Gerador de Copys & Tráfego</span>
            <span className="text-[10px] uppercase tracking-wider bg-amber-400/10 text-amber-300 px-1.5 py-0.5 rounded font-mono">
              IA
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSocialModalOpen(true);
              if (!socialPostResult) {
                handleGenerateSocialCarousel();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#FAF9F6] text-[#181816] text-xs font-bold shadow-2xs transition cursor-pointer border border-[#E5E5E0]"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Redes Sociais & Posts</span>
            <span className="text-[10px] uppercase tracking-wider bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono font-bold">
              Carrossel
            </span>
          </button>

          <button
            type="button"
            onClick={handleOpenOnboardingModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-2xs transition cursor-pointer border border-emerald-200"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Onboarding & CRM WhatsApp</span>
            <span className="text-[10px] uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">
              Régua
            </span>
          </button>

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
            R${" "}
            {metrics.estimatedMRR > 0
              ? Number(metrics.estimatedMRR).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
              : Number((metrics.activeTenants * 197)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
                      {tenant.monthlyPrice && (
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
                    value={editFormData.document}
                    onChange={(e) => setEditFormData({ ...editFormData, document: e.target.value })}
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
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
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
                    R$ {(asaasModalTenant.planPrice || 197).toFixed(2)}
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
                          `Olá equipe da ${asaasModalTenant.tradeName}!\n\nSegue a fatura de mensalidade do TorxOS no valor de R$ ${(asaasModalTenant.planPrice || 197).toFixed(2)}:\n${asaasPaymentInfo?.invoiceUrl || asaasModalTenant.asaasInvoiceUrl}\n\nO pagamento pode ser feito via Pix, Boleto ou Cartão com baixa automática no sistema!`
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

      {/* =========================================================================
          MODAL — CENTRAL DE GROWTH & COPYS DE TRÁFEGO PAGO (ETAPAS 2 & 3)
          ========================================================================= */}
      {growthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#EBEBE8] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header VIP */}
            <div className="p-6 bg-gradient-to-r from-[#181816] via-[#22211e] to-[#181816] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                  <Megaphone className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold tracking-tight text-white">
                      Central de Growth & Copys de Tráfego Pago
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-400 text-[#181816] font-bold">
                      Etapas 2 & 3
                    </span>
                  </div>
                  <p className="text-xs text-[#A8A7A1] mt-0.5">
                    Gere variações de anúncios focadas nas maiores dores de donos de assistência técnica de celulares.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setGrowthModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#A8A7A1] hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controles de Configuração e Geração */}
            <div className="p-5 bg-[#FAF9F6] border-b border-[#EBEBE8] flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px] space-y-1">
                <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider block">
                  Dor Principal da Assistência Técnica
                </label>
                <select
                  value={growthFocus}
                  onChange={(e) => setGrowthFocus(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-amber-500"
                >
                  <option value="TODOS">Todas as Dores (Multicampanha)</option>
                  <option value="ESTOQUE">Peças Sumindo & Falta de Estoque</option>
                  <option value="TEMPO_WHATSAPP">WhatsApp Travado com "Já tá pronto?"</option>
                  <option value="LUCRO_PRECIFICACAO">Preço Errado & Ilusão de Faturamento</option>
                  <option value="ORGANIZACAO_GERAL">Ordem de Serviço em Caderno / Papel</option>
                </select>
              </div>

              <div className="w-48 space-y-1">
                <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider block">
                  Tom de Voz da Copy
                </label>
                <select
                  value={growthTone}
                  onChange={(e) => setGrowthTone(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-amber-500"
                >
                  <option value="DIRETO_E_AGRESSIVO">Direto & Despertador</option>
                  <option value="EMPATICO_PROFISSIONAL">Empático & Profissional</option>
                  <option value="CASO_REAL">Estudo de Caso / História</option>
                </select>
              </div>

              <button
                type="button"
                disabled={growthLoading}
                onClick={handleGenerateGrowthAds}
                className="px-5 py-2 rounded-xl bg-[#181816] hover:bg-[#2b2a27] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {growthLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{growthLoading ? "Gerando com IA..." : "Gerar Novas Copys"}</span>
              </button>
            </div>

            {/* Abas de Navegação */}
            <div className="flex border-b border-[#EBEBE8] px-6 bg-white gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveGrowthTab("meta")}
                className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeGrowthTab === "meta"
                    ? "border-amber-500 text-[#181816]"
                    : "border-transparent text-[#787774] hover:text-[#181816]"
                }`}
              >
                <Megaphone className="w-3.5 h-3.5 text-rose-500" />
                <span>Meta Ads (Feed)</span>
                {growthResult?.metaAds && (
                  <span className="ml-1 text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded-full font-mono">
                    {growthResult.metaAds.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveGrowthTab("reels")}
                className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeGrowthTab === "reels"
                    ? "border-amber-500 text-[#181816]"
                    : "border-transparent text-[#787774] hover:text-[#181816]"
                }`}
              >
                <Video className="w-3.5 h-3.5 text-purple-500" />
                <span>Stories & Reels (Vídeo)</span>
                {growthResult?.reelsScripts && (
                  <span className="ml-1 text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded-full font-mono">
                    {growthResult.reelsScripts.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveGrowthTab("google")}
                className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeGrowthTab === "google"
                    ? "border-amber-500 text-[#181816]"
                    : "border-transparent text-[#787774] hover:text-[#181816]"
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Google Search</span>
                {growthResult?.googleAds && (
                  <span className="ml-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-full font-mono">
                    {growthResult.googleAds.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveGrowthTab("payload")}
                className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeGrowthTab === "payload"
                    ? "border-amber-500 text-[#181816]"
                    : "border-transparent text-[#787774] hover:text-[#181816]"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>Payload Meta Marketing API</span>
              </button>
            </div>

            {/* Conteúdo das Abas com Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!growthResult && !growthLoading && (
                <div className="text-center py-12 text-[#787774] text-xs">
                  Clique em <strong>"Gerar Novas Copys"</strong> para acionar a inteligência de tráfego pago.
                </div>
              )}

              {/* ABA 1: META ADS FEED */}
              {activeGrowthTab === "meta" && growthResult?.metaAds && (
                <div className="space-y-4">
                  {growthResult.metaAds.map((ad: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#FAF9F6] border border-[#EBEBE8] rounded-2xl space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                            {ad.framework || "PAS"}
                          </span>
                          <span className="text-xs font-bold text-[#181816]">
                            Anúncio #{idx + 1} — {ad.headline}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyGrowthText(
                              `${ad.headline}\n\n${ad.primaryText}\n\n👉 Teste grátis: https://torxos.com.br/lp`,
                              `meta-${idx}`
                            )
                          }
                          className="px-3 py-1 bg-white hover:bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          {copiedGrowthKey === `meta-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#787774]" />
                          )}
                          <span>{copiedGrowthKey === `meta-${idx}` ? "Copiado!" : "Copiar Anúncio"}</span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-[#787774] uppercase tracking-wider">
                          Texto Principal (Legenda do Feed)
                        </div>
                        <p className="text-xs text-[#22211e] whitespace-pre-line leading-relaxed bg-white p-3 rounded-xl border border-[#EBEBE8]">
                          {ad.primaryText}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-[#EBEBE8]/60">
                        <div>
                          <span className="text-[11px] text-[#787774]">Título no Card:</span>{" "}
                          <strong className="text-[#181816]">{ad.headline}</strong>
                        </div>
                        <div>
                          <span className="text-[11px] text-[#787774]">Botão (CTA):</span>{" "}
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold text-[11px]">
                            {ad.cta || "Saiba mais"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ABA 2: REELS & STORIES */}
              {activeGrowthTab === "reels" && growthResult?.reelsScripts && (
                <div className="space-y-4">
                  {growthResult.reelsScripts.map((reel: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#FAF9F6] border border-[#EBEBE8] rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            {reel.format || "Reels 15s"}
                          </span>
                          <span className="text-xs font-bold text-[#181816]">
                            Script #{idx + 1} — {reel.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const fullScript = `GANCHO (0-3s): ${reel.hook}\n\nCORPO/DESENVOLVIMENTO: ${reel.body}\n\nCHAMADA PARA AÇÃO (CTA): ${reel.cta}\n\nDIRETRIZ VISUAL: ${reel.visualDirection}`;
                            handleCopyGrowthText(fullScript, `reel-${idx}`);
                          }}
                          className="px-3 py-1 bg-white hover:bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          {copiedGrowthKey === `reel-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#787774]" />
                          )}
                          <span>{copiedGrowthKey === `reel-${idx}` ? "Copiado!" : "Copiar Script"}</span>
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                          <span className="text-[11px] font-bold text-amber-900 block mb-0.5">
                            ⚡ Gancho Visual e Falado (0 a 3 segundos):
                          </span>
                          <p className="text-[#181816] font-medium">{reel.hook}</p>
                        </div>

                        <div className="p-3 bg-white border border-[#EBEBE8] rounded-xl space-y-1">
                          <span className="text-[11px] font-bold text-[#787774] block">
                            🎙️ Roteiro / O que falar no vídeo:
                          </span>
                          <p className="text-[#22211e] whitespace-pre-line leading-relaxed">
                            {reel.body}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div className="p-2.5 bg-white border border-[#EBEBE8] rounded-xl">
                            <span className="text-[10px] font-bold text-[#787774] uppercase block">
                              CTA Final
                            </span>
                            <span className="text-xs font-semibold text-emerald-700">{reel.cta}</span>
                          </div>
                          <div className="p-2.5 bg-white border border-[#EBEBE8] rounded-xl">
                            <span className="text-[10px] font-bold text-[#787774] uppercase block">
                              Sugestão de Gravação
                            </span>
                            <span className="text-xs text-[#787774]">{reel.visualDirection}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ABA 3: GOOGLE SEARCH */}
              {activeGrowthTab === "google" && growthResult?.googleAds && (
                <div className="space-y-4">
                  {growthResult.googleAds.map((ad: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#FAF9F6] border border-[#EBEBE8] rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#181816]">
                          Grupo de Anúncios #{idx + 1} — {ad.campaignName}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const googleText = `TÍTULOS:\n${ad.headlines.join("\n")}\n\nDESCRIÇÕES:\n${ad.descriptions.join("\n")}\n\nPALAVRAS-CHAVE:\n${ad.keywords.join(", ")}`;
                            handleCopyGrowthText(googleText, `google-${idx}`);
                          }}
                          className="px-3 py-1 bg-white hover:bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          {copiedGrowthKey === `google-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#787774]" />
                          )}
                          <span>{copiedGrowthKey === `google-${idx}` ? "Copiado!" : "Copiar Textos"}</span>
                        </button>
                      </div>

                      {/* Mockup do Google Search */}
                      <div className="p-3 bg-white border border-[#EBEBE8] rounded-xl space-y-1">
                        <div className="text-[11px] text-[#787774] flex items-center gap-1">
                          <span className="font-bold text-[#181816]">Patrocinado</span> • torxos.com.br
                        </div>
                        <div className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer">
                          {ad.headlines[0]} | {ad.headlines[1] || "TorxOS Sistemas"}
                        </div>
                        <p className="text-xs text-[#4b4a45] leading-relaxed">
                          {ad.descriptions[0]}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                        <div>
                          <span className="text-[11px] font-bold text-[#787774] block mb-1">
                            Títulos (até 30 caracteres):
                          </span>
                          <ul className="space-y-1 bg-white p-2 rounded-lg border border-[#EBEBE8]">
                            {ad.headlines.map((h: string, i: number) => (
                              <li key={i} className="text-[11px] text-[#181816] font-medium flex items-center justify-between">
                                <span>• {h}</span>
                                <span className="text-[9px] font-mono text-[#A8A7A1]">{h.length}c</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-[#787774] block mb-1">
                            Palavras-chave recomendadas:
                          </span>
                          <div className="flex flex-wrap gap-1 bg-white p-2 rounded-lg border border-[#EBEBE8]">
                            {ad.keywords.map((kw: string, i: number) => (
                              <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ABA 4: META API PAYLOAD */}
              {activeGrowthTab === "payload" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#181816]">
                        Payload Pronto para Subir via Meta Marketing API
                      </h4>
                      <p className="text-[11px] text-[#787774]">
                        Envie para <code>POST /act_&#123;ad_account_id&#125;/campaigns</code> ou use com os scripts da pasta <code>scripts/growth/</code>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyGrowthText(
                          JSON.stringify(growthResult?.metaMarketingPayload || {}, null, 2),
                          "payload-json"
                        )
                      }
                      className="px-3 py-1 bg-white hover:bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedGrowthKey === "payload-json" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#787774]" />
                      )}
                      <span>{copiedGrowthKey === "payload-json" ? "Copiado!" : "Copiar JSON"}</span>
                    </button>
                  </div>

                  <pre className="p-4 bg-[#181816] text-[#FAF9F6] text-xs font-mono rounded-2xl overflow-x-auto max-h-[380px] border border-white/10">
                    {JSON.stringify(growthResult?.metaMarketingPayload || {}, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 bg-[#FAF9F6] border-t border-[#EBEBE8] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-[#787774]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  Copys otimizadas para Meta Ads & Google Ads com rastreamento ativo na Landing Page (/lp).
                </span>
              </div>

              <button
                type="button"
                onClick={() => setGrowthModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#181816] hover:bg-[#2b2a27] text-white text-xs font-bold transition cursor-pointer"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL — CENTRAL DE REDES SOCIAIS & CARROSSÉIS (ETAPA 4)
          ========================================================================= */}
      {socialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#EBEBE8] rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header VIP com Gradiente Roxo & Dourado */}
            <div className="p-6 bg-gradient-to-r from-[#181816] via-[#211a28] to-[#181816] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Share2 className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold tracking-tight text-white">
                      Central de Redes Sociais & Carrosséis Educativos
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500 text-white font-bold">
                      Etapa 4 • Orgânico
                    </span>
                  </div>
                  <p className="text-xs text-[#A8A7A1] mt-0.5">
                    Gere carrosséis de alto valor para o Instagram, atraia técnicos de bancada e converta lojistas para o teste grátis.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSocialModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#A8A7A1] hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controles Superiores: Tema, Tópico e Ações Rápidas */}
            <div className="p-5 bg-[#FAF9F6] border-b border-[#EBEBE8] flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px] space-y-1">
                <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider block">
                  Pilar de Conteúdo
                </label>
                <select
                  value={socialPillar}
                  onChange={(e) => setSocialPillar(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-purple-500"
                >
                  <option value="GESTAO_ASSISTENCIA">💼 Gestão & Lucro (Assistência e Bancada)</option>
                  <option value="BANCADA_TECNICA">🛠️ Bancada & Técnica (Solda, Placas e Defeitos)</option>
                  <option value="ATENDIMENTO_CLIENTE">💬 Atendimento & WhatsApp (Fidelização e Status)</option>
                  <option value="PRODUTIVIDADE_SISTEMA">⚡ Organização & Sistema (Fim do Papel)</option>
                </select>
              </div>

              <div className="w-64 space-y-1">
                <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider block">
                  Tópico Customizado (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Como evitar retorno em garantia..."
                  value={socialCustomTopic}
                  onChange={(e) => setSocialCustomTopic(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="w-24 space-y-1">
                <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider block">
                  Slides
                </label>
                <select
                  value={socialTotalSlides}
                  onChange={(e) => setSocialTotalSlides(Number(e.target.value))}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-purple-500"
                >
                  <option value={5}>5 slides</option>
                  <option value={6}>6 slides</option>
                  <option value={7}>7 slides</option>
                  <option value={8}>8 slides</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={socialLoading}
                  onClick={handleGenerateSocialCarousel}
                  className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#2b2a27] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {socialLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>{socialLoading ? "Gerando..." : "Gerar Carrossel"}</span>
                </button>

                <button
                  type="button"
                  disabled={socialLoading}
                  onClick={handleGenerateWeeklyPack}
                  className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Grade Semanal (3 Posts)</span>
                </button>
              </div>
            </div>

            {/* Corpo do Modal: Split 2 Colunas */}
            <div className="flex-1 overflow-y-auto p-6">
              {!socialPostResult && !socialLoading ? (
                <div className="text-center py-16 text-[#787774] text-xs">
                  Selecione o pilar desejado e clique em <strong>"Gerar Carrossel"</strong> para visualizar as artes e a legenda.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* COLUNA ESQUERDA (6 cols): Visualizador Interativo de Slide do Instagram */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#181816] uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-purple-600" />
                          Prévia do Carrossel (Instagram 1:1)
                        </span>
                      </div>
                      {socialPostResult?.slides && (
                        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          Slide {currentSlideIndex + 1} de {socialPostResult.slides.length}
                        </span>
                      )}
                    </div>

                    {/* Moldura do Slide Simulado */}
                    {socialPostResult?.slides && socialPostResult.slides[currentSlideIndex] && (
                      <div className="aspect-square bg-gradient-to-br from-[#0F0F0E] via-[#181816] to-[#1F1D19] rounded-3xl p-6 sm:p-8 text-white border border-[#2B2A27] shadow-xl flex flex-col justify-between relative overflow-hidden group">
                        {/* Top do Slide */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs tracking-widest text-amber-400">TorxOS</span>
                            <span className="text-[10px] text-[#787774]">| SISTEMAS</span>
                          </div>
                          <span className="text-xs font-mono text-[#A8A7A1] font-semibold">
                            {currentSlideIndex + 1} / {socialPostResult.slides.length}
                          </span>
                        </div>

                        {/* Conteúdo Central do Slide */}
                        <div className="space-y-4 my-auto py-2">
                          <span className="inline-block text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-[#2B2A27] text-amber-400 tracking-wider">
                            {socialPostResult.slides[currentSlideIndex].badge}
                          </span>

                          <h4 className="text-lg sm:text-xl font-black text-white leading-tight">
                            {socialPostResult.slides[currentSlideIndex].title}
                          </h4>

                          {socialPostResult.slides[currentSlideIndex].subtitle && (
                            <p className="text-xs sm:text-sm text-[#A8A7A1] leading-relaxed">
                              {socialPostResult.slides[currentSlideIndex].subtitle}
                            </p>
                          )}

                          {socialPostResult.slides[currentSlideIndex].bullets && (
                            <ul className="space-y-2 pt-2">
                              {socialPostResult.slides[currentSlideIndex].bullets.map((b: string, i: number) => (
                                <li key={i} className="text-xs text-[#E5E5E0] flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Rodapé do Slide */}
                        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[11px]">
                          <span className="text-amber-400 font-bold">
                            {socialPostResult.slides[currentSlideIndex].footer}
                          </span>
                          <span className="text-[#787774]">@torxos.oficial</span>
                        </div>
                      </div>
                    )}

                    {/* Controles de Navegação (Slide Anterior / Próximo + Dots) */}
                    <div className="flex items-center justify-between px-2">
                      <button
                        type="button"
                        disabled={currentSlideIndex === 0}
                        onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                        className="px-3 py-1.5 rounded-xl border border-[#E5E5E0] bg-white hover:bg-[#FAF9F6] text-[#181816] text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Anterior</span>
                      </button>

                      {/* Dots */}
                      <div className="flex items-center gap-1.5">
                        {socialPostResult?.slides?.map((_: any, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentSlideIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                              currentSlideIndex === idx
                                ? "w-5 bg-purple-600"
                                : "bg-[#D4D3CC] hover:bg-[#A8A7A1]"
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={
                          !socialPostResult?.slides ||
                          currentSlideIndex === socialPostResult.slides.length - 1
                        }
                        onClick={() =>
                          setCurrentSlideIndex((prev) =>
                            Math.min(socialPostResult.slides.length - 1, prev + 1)
                          )
                        }
                        className="px-3 py-1.5 rounded-xl border border-[#E5E5E0] bg-white hover:bg-[#FAF9F6] text-[#181816] text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                      >
                        <span>Próximo</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* COLUNA DIREITA (6 cols): Legenda Pronta & Disparo de Webhook */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-[#787774] uppercase tracking-wider block">
                          Legenda Completa para Instagram
                        </span>
                        <h4 className="text-xs font-bold text-[#181816] mt-0.5">
                          {socialPostResult?.title}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopySocialCaption}
                        className="px-3 py-1.5 bg-[#181816] hover:bg-[#2b2a27] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {copiedSocialCaption ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>{copiedSocialCaption ? "Legenda Copiada!" : "Copiar Legenda"}</span>
                      </button>
                    </div>

                    {/* Caixa de Texto da Legenda */}
                    <div className="p-4 bg-[#FAF9F6] border border-[#EBEBE8] rounded-2xl max-h-[320px] overflow-y-auto space-y-2">
                      <pre className="text-xs text-[#22211e] whitespace-pre-line font-sans leading-relaxed">
                        {socialPostResult?.caption}
                      </pre>
                    </div>

                    {/* Painel de Automação & Webhook (n8n / Buffer) */}
                    <div className="p-4 bg-white border border-[#EBEBE8] rounded-2xl space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Send className="w-3.5 h-3.5 text-purple-600" />
                          <span className="text-xs font-bold text-[#181816]">
                            Automação de Disparo (Webhook)
                          </span>
                        </div>
                        <span className="text-[10px] text-[#787774] bg-[#FAF9F6] px-2 py-0.5 rounded border border-[#EBEBE8]">
                          n8n / Zapier / Make
                        </span>
                      </div>

                      <p className="text-[11px] text-[#787774]">
                        Envie os dados deste post diretamente para seu workflow de automação para agendamento automático no Instagram.
                      </p>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={socialWebhookUrl}
                          onChange={(e) => setSocialWebhookUrl(e.target.value)}
                          placeholder="https://n8n.seuservidor.com/webhook/..."
                          className="flex-1 text-xs px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-purple-500 font-mono"
                        />
                        <button
                          type="button"
                          disabled={socialDispatching}
                          onClick={handleDispatchSocialWebhook}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {socialDispatching ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>{socialDispatching ? "Enviando..." : "Disparar Webhook"}</span>
                        </button>
                      </div>

                      {socialDispatchSuccess && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{socialDispatchSuccess}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 bg-[#FAF9F6] border-t border-[#EBEBE8] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-[#787774]">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  Carrosséis otimizados para retenção e salvamento no Instagram, com CTA direto para o link da bio (/lp).
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSocialModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#181816] hover:bg-[#2b2a27] text-white text-xs font-bold transition cursor-pointer"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL — RÉGUA DE ONBOARDING & CRM WHATSAPP (ETAPA 5)
          ========================================================================= */}
      {onboardingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#EBEBE8] rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header VIP Esmeralda */}
            <div className="p-6 bg-gradient-to-r from-[#181816] via-[#11241a] to-[#181816] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold tracking-tight text-white">
                      Régua de Onboarding & CRM de Ativação WhatsApp
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold">
                      Etapa 5 • Conversão 7 Dias
                    </span>
                  </div>
                  <p className="text-xs text-[#A8A7A1] mt-0.5">
                    Acompanhe cada lojista cadastrado no Funil de Vendas e envie a mensagem ideal no momento certo para fechar a assinatura.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOnboardingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#A8A7A1] hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid de Métricas da Régua (D0 a D7) */}
            <div className="p-5 bg-[#FAF9F6] border-b border-[#EBEBE8] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedStageFilter("ALL")}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  selectedStageFilter === "ALL"
                    ? "bg-white border-emerald-500 shadow-xs"
                    : "bg-white/60 border-[#EBEBE8] hover:bg-white"
                }`}
              >
                <span className="text-[10px] font-bold text-[#787774] uppercase block">Total Trials</span>
                <span className="text-lg font-extrabold text-[#181816] font-mono">
                  {onboardingPipeline?.summary?.totalTrials || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStageFilter("D0_WELCOME")}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  selectedStageFilter === "D0_WELCOME"
                    ? "bg-emerald-50 border-emerald-500 shadow-xs"
                    : "bg-white/60 border-[#EBEBE8] hover:bg-white"
                }`}
              >
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">D0: Boas-vindas</span>
                <span className="text-lg font-extrabold text-emerald-800 font-mono">
                  {onboardingPipeline?.summary?.stageD0 || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStageFilter("D1_FIRST_OS")}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  selectedStageFilter === "D1_FIRST_OS"
                    ? "bg-blue-50 border-blue-500 shadow-xs"
                    : "bg-white/60 border-[#EBEBE8] hover:bg-white"
                }`}
              >
                <span className="text-[10px] font-bold text-blue-700 uppercase block">D1: 1ª Ordem</span>
                <span className="text-lg font-extrabold text-blue-800 font-mono">
                  {onboardingPipeline?.summary?.stageD1 || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStageFilter("D3_WHATSAPP_STATUS")}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  selectedStageFilter === "D3_WHATSAPP_STATUS"
                    ? "bg-purple-50 border-purple-500 shadow-xs"
                    : "bg-white/60 border-[#EBEBE8] hover:bg-white"
                }`}
              >
                <span className="text-[10px] font-bold text-purple-700 uppercase block">D3: Status Whats</span>
                <span className="text-lg font-extrabold text-purple-800 font-mono">
                  {onboardingPipeline?.summary?.stageD3 || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStageFilter("D5_TRIAL_EXPIRING")}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  selectedStageFilter === "D5_TRIAL_EXPIRING"
                    ? "bg-amber-50 border-amber-500 shadow-xs"
                    : "bg-white/60 border-[#EBEBE8] hover:bg-white"
                }`}
              >
                <span className="text-[10px] font-bold text-amber-700 uppercase block">D5: Alerta 48h</span>
                <span className="text-lg font-extrabold text-amber-800 font-mono">
                  {onboardingPipeline?.summary?.stageD5 || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStageFilter("D7_CONVERSION")}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  selectedStageFilter === "D7_CONVERSION"
                    ? "bg-rose-50 border-rose-500 shadow-xs"
                    : "bg-white/60 border-[#EBEBE8] hover:bg-white"
                }`}
              >
                <span className="text-[10px] font-bold text-rose-700 uppercase block">D7: Conversão</span>
                <span className="text-lg font-extrabold text-rose-800 font-mono">
                  {onboardingPipeline?.summary?.stageD7 || 0}
                </span>
              </button>
            </div>

            {/* Conteúdo Principal: Lista de Lojistas em Trial */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {onboardingLoading ? (
                <div className="text-center py-16 text-xs text-[#787774] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Carregando lojistas em período de testes...</span>
                </div>
              ) : !onboardingPipeline?.leads || onboardingPipeline.leads.length === 0 ? (
                <div className="text-center py-16 text-xs text-[#787774] space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] border border-[#EBEBE8] text-[#787774] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-[#181816]">Nenhuma loja em Trial no momento!</p>
                  <p className="text-[11px] text-[#A8A7A1]">
                    Assim que novos lojistas se cadastrarem pela Landing Page (/lp), eles aparecerão organizados aqui automaticamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {onboardingPipeline.leads
                    .filter(
                      (l: any) =>
                        selectedStageFilter === "ALL" || l.currentStage === selectedStageFilter
                    )
                    .map((lead: any) => (
                      <div
                        key={lead.id}
                        className="p-4 bg-white border border-[#EBEBE8] rounded-2xl hover:border-emerald-300 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-[#181816] tracking-tight">
                              {lead.tradeName}
                            </h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {lead.plan}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF9F6] text-[#787774] border border-[#EBEBE8]">
                              {lead.daysSinceCreation}d de cadastro
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#787774]">
                            <span>
                              Responsável: <strong className="text-[#181816]">{lead.ownerName}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              WhatsApp: <span className="font-mono text-[#181816]">{lead.phone}</span>
                            </span>
                          </div>

                          <div className="pt-1 flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-[#787774]">
                              Estágio Atual:
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/60">
                              {lead.currentStageLabel}
                            </span>
                          </div>
                        </div>

                        {/* Botões de Ação do Lojista */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewLead(lead)}
                            className="px-3 py-1.5 rounded-xl border border-[#E5E5E0] bg-white hover:bg-[#FAF9F6] text-[#181816] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Ver Mensagem</span>
                          </button>

                          <a
                            href={lead.whatsappDirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Abrir WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDispatchOnboarding(lead)}
                            className="px-3 py-1.5 rounded-xl bg-[#181816] hover:bg-[#2b2a27] text-white text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Webhook</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Modal de Prévia e Cópia da Mensagem Individual */}
            {previewLead && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
                <div className="bg-white border border-[#EBEBE8] rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-[#EBEBE8] pb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-sm font-bold text-[#181816]">
                        Prévia da Mensagem para {previewLead.tradeName}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewLead(null)}
                      className="w-6 h-6 rounded-full bg-[#FAF9F6] text-[#787774] hover:text-[#181816] flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 bg-[#FAF9F6] border border-[#EBEBE8] rounded-2xl max-h-[320px] overflow-y-auto">
                    <pre className="text-xs text-[#22211e] whitespace-pre-line font-sans leading-relaxed">
                      {previewLead.suggestedMessage}
                    </pre>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLeadMessage(previewLead.suggestedMessage)}
                      className="px-3 py-1.5 bg-white hover:bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedLeadMessage ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#787774]" />
                      )}
                      <span>{copiedLeadMessage ? "Copiado!" : "Copiar Texto"}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewLead(null)}
                        className="px-3 py-1.5 rounded-xl border border-[#E5E5E0] text-xs font-semibold text-[#787774] hover:bg-[#FAF9F6] cursor-pointer"
                      >
                        Fechar
                      </button>

                      <a
                        href={previewLead.whatsappDirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Enviar no WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer do Modal */}
            <div className="p-4 bg-[#FAF9F6] border-t border-[#EBEBE8] flex items-center justify-between">
              <button
                type="button"
                onClick={handleOpenOnboardingModal}
                className="px-3 py-1.5 rounded-xl border border-[#E5E5E0] bg-white hover:bg-[#FAF9F6] text-[#181816] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${onboardingLoading ? "animate-spin" : ""}`} />
                <span>Atualizar Pipeline</span>
              </button>

              <button
                type="button"
                onClick={() => setOnboardingModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#181816] hover:bg-[#2b2a27] text-white text-xs font-bold transition cursor-pointer"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
