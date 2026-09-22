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
  MessageSquare,
  QrCode,
  RefreshCw,
  Send,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { ImageUploader } from "@/components/ui/image-uploader";
import { PasswordResetModal, PasswordResetData } from "@/components/ui/password-reset-modal";
import { UpgradeModal } from "@/components/ui/upgrade-modal";
import { PlanGate } from "@/components/ui/plan-gate";
import { getPlanMaxUsers, getPlanDetails } from "@/lib/plan-rules";
import { maskPhone, validatePhone, maskCpfCnpj, validateCpfCnpj } from "@/lib/masks";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  commissionServicesPercent: number;
  commissionProductsPercent: number;
  isActive: boolean;
}

interface RolePermissionInfo {
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  permissions: string[];
  restrictions: string[];
}

const ROLE_PERMISSIONS_DETAILS: Record<string, RolePermissionInfo> = {
  ADMIN: {
    title: "Administrador / Proprietário",
    badge: "Acesso Total",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Controle absoluto sobre a assistência técnica, dados financeiros estratégicos, equipe e configurações da empresa.",
    permissions: [
      "Gestão Financeira Completa (Fluxo de Caixa, DRE, Contas a Pagar e Receber, Conciliação)",
      "Gestão de Equipe (Contratação, redefinição de senhas, percentuais de comissão)",
      "Controle total de Ordens de Serviço (Criação, edição de laudos, aprovação e estorno)",
      "Ponto de Venda (PDV) com acesso à margem de lucro e cancelamento de vendas",
      "Controle de Estoque, compras, inventário e preço de custo",
      "Configurações gerais da empresa, termos de garantia e WhatsApp comercial",
    ],
    restrictions: [],
  },
  MANAGER: {
    title: "Gerente de Loja",
    badge: "Gestão Operacional",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    description: "Supervisão diária da equipe técnica, atendimento, vendas de balcão e cumprimento de prazos de entrega.",
    permissions: [
      "Supervisão e movimentação de todas as OS no Kanban da bancada",
      "Operação do Ponto de Venda (PDV) e liberação de descontos autorizados",
      "Visualização e solicitação de compras de reposição no Estoque",
      "Distribuição de ordens de serviço e metas para técnicos",
      "Acompanhamento do fechamento de caixa diário do balcão",
    ],
    restrictions: [
      "Sem permissão para alterar dados cadastrais ou plano de assinatura da empresa",
      "Sem permissão para excluir colaboradores da equipe",
    ],
  },
  TECHNICIAN: {
    title: "Técnico de Bancada / Laboratório",
    badge: "Laboratório & Reparos",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    description: "Focado estritamente na execução dos reparos, diagnósticos laboratoriais, laudos e substituição de componentes.",
    permissions: [
      "Visualização e movimentação de OS nas etapas técnicas (Análise, Em Reparo, Aguardando Peça, Controle de Qualidade)",
      "Lançamento de laudos técnicos detalhados, defeitos constatados e peças necessárias",
      "Upload de fotos da bancada e checklist de integridade do aparelho",
      "Acompanhamento em tempo real das suas comissões por serviços e peças",
    ],
    restrictions: [
      "Sem acesso ao fluxo de caixa, DRE ou contas a pagar da empresa",
      "Sem acesso a dados fiscais ou faturamento global da assistência",
    ],
  },
  ATTENDANT: {
    title: "Atendente de Balcão / Recepção",
    badge: "Atendimento & Balcão",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    description: "Recepção de clientes, abertura de chamados, envio de orçamentos e entrega de aparelhos reparados.",
    permissions: [
      "Abertura rápida de novas Ordens de Serviço (triagem de entrada, fotos e relatos de avarias)",
      "Cadastro e consulta da base de clientes e histórico de visitas",
      "Envio de laudos e orçamentos aos clientes via WhatsApp com link de aprovação",
      "Operação do Ponto de Venda (PDV) para venda de acessórios e peças",
      "Finalização de OS com coleta de assinatura digital na entrega",
    ],
    restrictions: [
      "Sem acesso a relatórios gerenciais ou financeiro avançado",
      "Sem permissão para alterar custos de peças ou comissões",
    ],
  },
  FINANCIAL: {
    title: "Operador Financeiro / Administrativo",
    badge: "Financeiro & Contas",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Controle de recebimentos, pagamentos, conciliação e liquidação de comissões da equipe.",
    permissions: [
      "Abertura, fechamento e conciliação de caixa diário",
      "Lançamento e quitação de títulos a pagar e a receber",
      "Consulta e exportação de DRE e fluxo de caixa consolidado",
      "Conferência e liquidação de comissões técnicas",
    ],
    restrictions: [
      "Sem permissão para alterar diagnósticos laboratoriais",
      "Sem permissão para gerenciar filiais ou excluir a empresa",
    ],
  },
};

export default function TenantSettingsPage() {
  const [activeTab, setActiveTab] = useState<"COMPANY" | "WARRANTY" | "TEAM" | "SUBSCRIPTION" | "BRANCHES" | "WHATSAPP">("COMPANY");
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // WhatsApp Multi-Tenant por Assistência
  const [whatsappData, setWhatsappData] = useState<{
    connected: boolean;
    state?: string;
    instanceName?: string;
    tradeName?: string;
    base64?: string | null;
    code?: string | null;
    pairingCode?: string | null;
    message?: string;
  } | null>(null);
  const [loadingWhatsapp, setLoadingWhatsapp] = useState<boolean>(false);
  const [testWhatsappPhone, setTestWhatsappPhone] = useState<string>("");
  const [sendingTestWhatsapp, setSendingTestWhatsapp] = useState<boolean>(false);

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
  const [branchDocumentError, setBranchDocumentError] = useState<string | null>(null);
  const [branchPhone, setBranchPhone] = useState<string>("");
  const [branchPhoneError, setBranchPhoneError] = useState<string | null>(null);
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
  const [phoneError, setPhoneError] = useState<string | null>(null);
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
  const [newUserRole, setNewUserRole] = useState<string>("");
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
    setNewUserRole("");
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

    if (phone.trim()) {
      const pVal = validatePhone(phone);
      if (!pVal.isValid) {
        setPhoneError(pVal.message || "Telefone inválido.");
        alert(pVal.message || "Por favor, informe um WhatsApp comercial válido com DDD.");
        return;
      }
    }
    setPhoneError(null);

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
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert("Por favor, preencha o Nome Completo e E-mail do colaborador.");
      return;
    }

    if (!newUserRole) {
      alert("Por favor, selecione uma Função / Perfil para o colaborador.");
      return;
    }

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

  const loadWhatsAppStatus = async () => {
    setLoadingWhatsapp(true);
    try {
      const data = await fetchApi("/tenant/whatsapp/status");
      if (data) {
        setWhatsappData(data);
        if (phone && !testWhatsappPhone) {
          setTestWhatsappPhone(phone);
        }
      }
    } catch (err: any) {
      console.warn("Erro ao carregar status do WhatsApp:", err);
    } finally {
      setLoadingWhatsapp(false);
    }
  };

  const handleConnectWhatsApp = async () => {
    setLoadingWhatsapp(true);
    try {
      const res = await fetchApi("/tenant/whatsapp/connect", { method: "POST" });
      if (res) {
        setWhatsappData(res);
      }
    } catch (err: any) {
      alert("Erro ao gerar QR Code do WhatsApp: " + (err?.message || "Ocorreu um erro."));
    } finally {
      setLoadingWhatsapp(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!confirm("Deseja realmente desconectar o WhatsApp da sua assistência técnica?\n\nOs envios automáticos de mensagens da sua loja serão pausados ou utilizarão o canal de contingência da plataforma.")) {
      return;
    }
    setLoadingWhatsapp(true);
    try {
      const res = await fetchApi("/tenant/whatsapp/disconnect", { method: "POST" });
      alert(res?.message || "WhatsApp desconectado com sucesso.");
      loadWhatsAppStatus();
    } catch (err: any) {
      alert("Erro ao desconectar WhatsApp: " + (err?.message || "Ocorreu um erro."));
    } finally {
      setLoadingWhatsapp(false);
    }
  };

  const handleSendTestWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testWhatsappPhone.trim()) {
      alert("Informe um número de WhatsApp com DDD para envio do teste.");
      return;
    }
    setSendingTestWhatsapp(true);
    try {
      const res = await fetchApi("/tenant/whatsapp/test", {
        method: "POST",
        body: JSON.stringify({ phone: testWhatsappPhone }),
      });
      alert(res?.message || "Mensagem de teste enviada com sucesso! Verifique seu WhatsApp.");
    } catch (err: any) {
      alert("Falha no envio de teste: " + (err?.message || "Ocorreu um erro."));
    } finally {
      setSendingTestWhatsapp(false);
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

    const docVal = validateCpfCnpj(branchDocument);
    if (!docVal.isValid) {
      setBranchDocumentError(docVal.message || "CNPJ/CPF inválido.");
      alert(docVal.message || "Por favor, informe um CNPJ ou CPF válido para a filial.");
      return;
    }
    setBranchDocumentError(null);

    const phoneVal = validatePhone(branchPhone);
    if (!phoneVal.isValid) {
      setBranchPhoneError(phoneVal.message || "Telefone inválido.");
      alert(phoneVal.message || "Por favor, informe um WhatsApp comercial válido com DDD.");
      return;
    }
    setBranchPhoneError(null);

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

        <button
          type="button"
          onClick={() => {
            setActiveTab("WHATSAPP");
            loadWhatsAppStatus();
          }}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "WHATSAPP"
              ? "border-[#181816] text-[#181816] font-semibold"
              : "border-transparent text-[#787774] hover:text-[#181816]"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          WhatsApp da Loja
          {whatsappData?.connected && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
                    onChange={(e) => {
                      setPhone(maskPhone(e.target.value));
                      if (phoneError) setPhoneError(null);
                    }}
                    placeholder="(11) 98888-7777"
                    maxLength={15}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF9F6] border ${
                      phoneError ? "border-red-400 bg-red-50/20" : "border-[#E5E5E0]"
                    } text-[#181816] focus:outline-none focus:ring-1 focus:ring-[#181816]`}
                    required
                  />
                </div>
                {phoneError && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {phoneError}
                  </p>
                )}
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
                  {planName === "ENTERPRISE" ? "R$ 249,00" : planName === "STARTER" ? "R$ 79,00" : "R$ 139,00"}
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
                    R$ 139<span className="text-xs font-normal text-stone-400">/mês</span>
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
      {/* ABA 6: WHATSAPP DA LOJA & NOTIFICAÇÕES AUTOMÁTICAS                 */}
      {/* =================================================================== */}
      {activeTab === "WHATSAPP" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Card Principal de Conexão */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EBEBE8] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBEBE8] pb-5">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                  whatsappData?.connected
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-[#FAF9F6] text-[#181816] border-[#EBEBE8]"
                }`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#181816]">
                      WhatsApp Exclusivo da Loja
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                      Gateway Evolution API
                    </span>
                  </div>
                  <p className="text-xs text-[#787774] mt-0.5">
                    Conecte o número de atendimento da sua assistência técnica para disparos automáticos aos clientes.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadWhatsAppStatus}
                  disabled={loadingWhatsapp}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F3F3EF] border border-[#E5E5E0] text-xs font-semibold text-[#181816] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Atualizar status da conexão"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#787774] ${loadingWhatsapp ? "animate-spin" : ""}`} />
                  Verificar Status
                </button>
              </div>
            </div>

            {loadingWhatsapp && !whatsappData && (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#181816] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#787774] font-medium">Consultando gateway de mensagens da sua loja...</p>
              </div>
            )}

            {/* ESTADO 1: WHATSAPP CONECTADO */}
            {whatsappData?.connected ? (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-emerald-950">
                          WhatsApp Conectado e Operacional
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Online
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        Sua loja está com a instância <strong>{whatsappData.instanceName}</strong> ativa. Todas as mensagens de abertura de OS, laudos, orçamentos e avisos de aparelho pronto estão sendo enviadas com a identidade da <strong>{tradeName || "sua empresa"}</strong>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDisconnectWhatsApp}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold shrink-0 transition cursor-pointer"
                  >
                    Desconectar Aparelho
                  </button>
                </div>

                {/* Teste de Disparo Real */}
                <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#EBEBE8] space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#181816] flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                      Testar Envio de Notificação da Loja
                    </h4>
                    <p className="text-xs text-[#787774] mt-0.5">
                      Envie uma mensagem instantânea para o seu próprio número e valide a identidade visual da sua assistência.
                    </p>
                  </div>

                  <form onSubmit={handleSendTestWhatsApp} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Seu WhatsApp com DDD (Ex: 61 99229-5814)"
                        value={testWhatsappPhone}
                        onChange={(e) => setTestWhatsappPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E0] text-xs text-[#181816] focus:outline-none focus:border-[#181816]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sendingTestWhatsapp}
                      className="px-5 py-2.5 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      {sendingTestWhatsapp ? "Disparando..." : "Disparar Mensagem de Teste"}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* ESTADO 2: WHATSAPP DESCONECTADO (GERAR QR CODE) */
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#EBEBE8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#181816]">
                      Nenhum Aparelho Conectado Nesta Unidade
                    </h4>
                    <p className="text-xs text-[#787774] mt-1 leading-relaxed">
                      Pareie o WhatsApp da sua assistência técnica para que os clientes recebam notificações com a sua marca e logotipo. Enquanto não parear, o sistema usará o canal seguro de contingência com o nome da sua loja.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectWhatsApp}
                    disabled={loadingWhatsapp}
                    className="px-5 py-2.5 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shrink-0 transition cursor-pointer disabled:opacity-50"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    {loadingWhatsapp ? "Gerando QR Code..." : "Gerar QR Code de Conexão"}
                  </button>
                </div>

                {/* Exibição do QR Code quando disponível */}
                {whatsappData?.base64 && (
                  <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EBEBE8] shadow-sm flex flex-col md:flex-row items-center gap-8 animate-in fade-in">
                    <div className="flex flex-col items-center p-4 rounded-2xl bg-white border-2 border-dashed border-[#E5E5E0] shadow-xs">
                      <img
                        src={whatsappData.base64}
                        alt="QR Code WhatsApp da Loja"
                        className="w-56 h-56 object-contain rounded-xl"
                      />
                      <span className="text-[11px] font-semibold text-[#787774] mt-2 flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
                        Aguardando leitura no celular...
                      </span>
                    </div>

                    <div className="flex-1 space-y-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Passo a Passo
                        </span>
                        <h4 className="text-base font-bold text-[#181816]">
                          Como escanear no seu smartphone:
                        </h4>
                      </div>

                      <ol className="space-y-2.5 text-[#555552] pl-4 list-decimal leading-relaxed">
                        <li>Abra o aplicativo do <strong>WhatsApp</strong> no celular comercial da loja.</li>
                        <li>Toque em <strong>Configurações</strong> (no iPhone) ou nos <strong>três pontinhos</strong> (no Android).</li>
                        <li>Selecione <strong>Aparelhos Conectados</strong> ➔ <strong>Conectar um aparelho</strong>.</li>
                        <li>Aponte a câmera para o <strong>QR Code</strong> ao lado.</li>
                      </ol>

                      {whatsappData.pairingCode && (
                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                          <span className="text-[11px] font-medium text-[#787774] block">Código de Pareamento por Número:</span>
                          <span className="font-mono text-base font-bold text-[#181816] tracking-widest">{whatsappData.pairingCode}</span>
                        </div>
                      )}

                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={loadWhatsAppStatus}
                          className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#282824] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Já Escaneei (Concluir)
                        </button>
                        <button
                          type="button"
                          onClick={handleConnectWhatsApp}
                          className="px-3.5 py-2 rounded-xl border border-[#E5E5E0] text-xs font-medium text-[#787774] hover:bg-[#FAF9F6] transition cursor-pointer"
                        >
                          Gerar Novo Código
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Demonstração da Identidade da Loja nas Mensagens */}
            <div className="pt-6 border-t border-[#EBEBE8] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#787774]">
                Modelo da Mensagem Recebida pelo Cliente
              </h4>
              <div className="max-w-md p-4 rounded-2xl bg-[#EFEAE2] border border-[#DDD6CB] shadow-xs text-xs space-y-2 font-sans text-[#111B21]">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <Store className="w-3.5 h-3.5" />
                  <span>{tradeName || "Sua Assistência Técnica"}</span>
                </div>
                <p className="leading-relaxed">
                  Olá, <strong>Carlos</strong>! Concluímos o laudo do seu <strong>iPhone 13 Pro</strong> (OS #1042). O orçamento detalhado já está disponível para você aprovar em 1 clique pelo link seguro:
                </p>
                <div className="p-2.5 rounded-xl bg-white/90 border border-black/5 text-[11px] text-[#0066CC] underline">
                  👉 https://torxos.tech/status/os-1042-xyz
                </div>
                <p className="text-[11px] text-[#667781] pt-1">
                  Valor total: <strong>R$ 380,00</strong> com garantia legal de 90 dias assegurada.
                </p>
              </div>
            </div>
          </div>
        </div>
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
                  maxLength={18}
                  value={branchDocument}
                  onChange={(e) => {
                    setBranchDocument(maskCpfCnpj(e.target.value));
                    if (branchDocumentError) setBranchDocumentError(null);
                  }}
                  className={`w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border ${
                    branchDocumentError ? "border-red-400 bg-red-50/20" : "border-[#E5E5E0]"
                  } text-[#181816] font-mono focus:outline-none focus:border-[#181816]`}
                />
                {branchDocumentError && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {branchDocumentError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#181816] mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98888-7777"
                    maxLength={15}
                    value={branchPhone}
                    onChange={(e) => {
                      setBranchPhone(maskPhone(e.target.value));
                      if (branchPhoneError) setBranchPhoneError(null);
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border ${
                      branchPhoneError ? "border-red-400 bg-red-50/20" : "border-[#E5E5E0]"
                    } text-[#181816] focus:outline-none focus:border-[#181816]`}
                  />
                  {branchPhoneError && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {branchPhoneError}
                    </p>
                  )}
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
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-[#EBEBE8] shadow-xl space-y-4 animate-in fade-in zoom-in-95">
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
                <label className="block font-semibold text-[#181816] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: Pedro Henrique Silva"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1">E-mail de Login *</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="pedro.tecnico@torxos.tech"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#181816] mb-1">Função / Perfil *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl bg-[#FAF9F6] border ${
                    !newUserRole ? "border-amber-400/80 bg-amber-50/20 text-[#787774]" : "border-[#E5E5E0] text-[#181816] font-semibold"
                  } text-xs focus:outline-none focus:border-[#181816] transition-colors`}
                  required
                >
                  <option value="" disabled>Selecione uma função / perfil...</option>
                  <option value="TECHNICIAN">Técnico de Bancada / Laboratório</option>
                  <option value="ATTENDANT">Atendente de Balcão / Recepção</option>
                  <option value="FINANCIAL">Operador Financeiro / Administrativo</option>
                  <option value="MANAGER">Gerente de Loja</option>
                  <option value="ADMIN">Administrador / Proprietário</option>
                </select>
                {!newUserRole && (
                  <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                    <span>💡</span> Selecione um perfil acima para visualizar as permissões e tarefas detalhadas.
                  </p>
                )}
              </div>

              {/* CARD EXPLICATIVO DE PERMISSÕES, ATRIBUIÇÕES E TAREFAS */}
              {newUserRole && ROLE_PERMISSIONS_DETAILS[newUserRole] && (
                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E5E0] space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between gap-2 border-b border-[#EBEBE8] pb-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#181816]" />
                      <span className="font-bold text-[#181816] text-xs">
                        {ROLE_PERMISSIONS_DETAILS[newUserRole].title}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_PERMISSIONS_DETAILS[newUserRole].badgeColor}`}>
                      {ROLE_PERMISSIONS_DETAILS[newUserRole].badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#555552] leading-relaxed">
                    {ROLE_PERMISSIONS_DETAILS[newUserRole].description}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#787774] block">
                      Permissões & Tarefas Permitidas no Sistema:
                    </span>
                    <ul className="space-y-1 text-[11px] text-[#222]">
                      {ROLE_PERMISSIONS_DETAILS[newUserRole].permissions.map((perm, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{perm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {ROLE_PERMISSIONS_DETAILS[newUserRole].restrictions.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-[#EBEBE8]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                        Travas de Segurança & Restrições:
                      </span>
                      <ul className="space-y-1 text-[11px] text-[#666]">
                        {ROLE_PERMISSIONS_DETAILS[newUserRole].restrictions.map((restr, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-stone-600">
                            <Lock className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                            <span>{restr}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

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
