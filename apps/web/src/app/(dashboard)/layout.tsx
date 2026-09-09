"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Wrench,
  Boxes,
  DollarSign,
  Bot,
  LayoutDashboard,
  PlusCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  LogOut,
  Building2,
  Crown,
  Settings,
  ShoppingCart,
  MessageCircle,
  Lock,
  ChevronDown,
  Store,
  ArrowRightLeft,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUser, getAuthToken, fetchApi, clearAllTenantCache } from "@/lib/api";
import { isPlanFeatureAllowed, FeatureKey } from "@/lib/plan-rules";
import { TorxLogo } from "@/components/ui/torxos-logo";

interface SubNavItem {
  name: string;
  href: string;
  requiredFeature?: FeatureKey;
  planBadge?: string;
}

interface NavItem {
  name: string;
  href?: string;
  icon: any;
  badge?: string;
  requiredFeature?: FeatureKey;
  planBadge?: string;
  children?: SubNavItem[];
}

const navigation: NavItem[] = [
  {
    name: "Visão Geral",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "TorxOS Sales & PDV",
    icon: ShoppingCart,
    badge: "Balcão",
    children: [
      { name: "Ponto de Venda (PDV)", href: "/vendas/pdv" },
      { name: "Histórico de Vendas", href: "/vendas" },
    ],
  },
  {
    name: "Ordens de Serviço",
    icon: Wrench,
    badge: "Oficina",
    children: [
      { name: "Kanban de Bancada", href: "/os/kanban" },
      { name: "Todas as OS", href: "/os" },
      { name: "Abrir Nova OS", href: "/os/nova" },
    ],
  },
  {
    name: "Almoxarifado & Estoque",
    icon: Boxes,
    children: [
      { name: "Peças & Acessórios", href: "/estoque" },
      {
        name: "Alerta de Ruptura (IA)",
        href: "/estoque/ruptura",
        requiredFeature: "canUseStockPrediction",
        planBadge: "PRO",
      },
      { name: "Pedidos de Compra", href: "/estoque/compras" },
    ],
  },
  {
    name: "Gestão Financeira",
    icon: DollarSign,
    children: [
      {
        name: "DRE Gerencial",
        href: "/financeiro/dre",
        requiredFeature: "canUseDRE",
        planBadge: "PRO",
      },
      { name: "Contas a Pagar/Receber", href: "/financeiro/titulos" },
      { name: "Fluxo de Caixa", href: "/financeiro/fluxo-caixa" },
      { name: "Conciliação OFX", href: "/financeiro/conciliacao" },
    ],
  },
  {
    name: "TorxOS AI Mentor",
    icon: Bot,
    badge: "PRO",
    requiredFeature: "canUseAiMentor",
    children: [
      {
        name: "Centro dos 5 Pilares",
        href: "/mentor",
        requiredFeature: "canUseAiMentor",
        planBadge: "PRO",
      },
      {
        name: "Chat com Copiloto",
        href: "/mentor/chat",
        requiredFeature: "canUseAiMentor",
        planBadge: "PRO",
      },
    ],
  },
  {
    name: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
  {
    name: "Painel do Dono",
    href: "/super-admin",
    icon: Crown,
    badge: "Master",
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [networkBranches, setNetworkBranches] = useState<any[]>([]);
  const [showBranchDropdown, setShowBranchDropdown] = useState<boolean>(false);

  useEffect(() => {
    const user = getCurrentUser();
    const token = getAuthToken();

    if (!user || !token) {
      router.replace("/login");
      return;
    }

    if (pathname.startsWith("/super-admin") && user.role !== "SUPER_ADMIN") {
      router.replace("/");
      return;
    }

    const backup = typeof window !== "undefined" ? (localStorage.getItem("torxos_super_admin_backup") || localStorage.getItem("evorix_super_admin_backup")) : null;
    setIsImpersonating(!!backup || !!user?.isImpersonating);

    setCurrentUser(user);
    if (user.subscription) {
      setSubscription(user.subscription);
    }

    if (user.role !== "SUPER_ADMIN") {
      fetchApi("/tenant/settings")
        .then((data) => {
          if (data?.subscription) {
            setSubscription(data.subscription);
          }
          if (data?.logoUrl) {
            setTenantLogo(data.logoUrl);
          }
          if (data && typeof window !== "undefined") {
            localStorage.setItem(
              "torxos_company_profile",
              JSON.stringify({
                tradeName: data.tradeName || user?.tenantName || "Assistência Técnica",
                legalName: data.legalName || "",
                document: data.document || "",
                phone: data.phone || "",
                email: data.email || user?.email || "",
                logoUrl: data.logoUrl || null,
              })
            );
          }
        })
        .catch((err) => {
          console.warn("Não foi possível carregar settings de assinatura:", err);
        });

      fetchApi("/tenant/branches")
        .then((data) => {
          if (data?.allUnits && Array.isArray(data.allUnits)) {
            setNetworkBranches(data.allUnits);
          }
        })
        .catch(() => {});
    }

    setCheckingAuth(false);
  }, [pathname, router]);

  const handleSwitchNetworkBranch = async (targetId: string) => {
    try {
      const res = await fetchApi(`/tenant/branches/${targetId}/switch`, { method: "POST" });
      if (res?.accessToken) {
        localStorage.setItem("torxos_token", res.accessToken);
        localStorage.setItem("evorix_token", res.accessToken);
        if (res.user) {
          localStorage.setItem("torxos_user", JSON.stringify(res.user));
          localStorage.setItem("evorix_user", JSON.stringify(res.user));
        }
        setShowBranchDropdown(false);
        window.location.reload();
      }
    } catch (err: any) {
      alert("Erro ao alternar de unidade: " + (err?.message || "Ocorreu um erro."));
    }
  };

  const handleExitImpersonation = () => {
    if (typeof window !== "undefined") {
      const backup = localStorage.getItem("torxos_super_admin_backup") || localStorage.getItem("evorix_super_admin_backup");
      if (backup) {
        try {
          const { token, user } = JSON.parse(backup);
          localStorage.setItem("torxos_token", token);
          localStorage.setItem("evorix_token", token);
          localStorage.setItem("torxos_user", JSON.stringify(user));
          localStorage.setItem("evorix_user", JSON.stringify(user));
          localStorage.removeItem("torxos_super_admin_backup");
          localStorage.removeItem("evorix_super_admin_backup");
          window.location.href = "/super-admin";
          return;
        } catch (e) {
          console.error("Erro ao restaurar sessão master:", e);
        }
      }
      window.location.href = "/super-admin";
    }
  };

  const visibleNavigation = navigation.filter((item) => {
    if (item.href === "/super-admin") {
      return currentUser?.role === "SUPER_ADMIN";
    }
    return true;
  });

  const companyName = currentUser?.tenantName || "sua empresa";
  const isTrial = subscription?.isTrial || subscription?.status === "TRIAL";
  const daysRemaining = subscription?.daysRemaining;
  const daysUntilInvoice = subscription?.daysUntilInvoice;
  const isInGracePeriod = subscription?.isInGracePeriod;
  const daysRemainingGrace = subscription?.daysRemainingGrace;

  const formattedExpiry = subscription?.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString("pt-BR")
    : "";
  const formattedInvoiceDue = subscription?.invoiceDueDate
    ? new Date(subscription.invoiceDueDate).toLocaleDateString("pt-BR")
    : formattedExpiry;
  const formattedGraceEnds = subscription?.gracePeriodEndsAt
    ? new Date(subscription.gracePeriodEndsAt).toLocaleDateString("pt-BR")
    : "";

  const showTrialAlert =
    currentUser?.role !== "SUPER_ADMIN" &&
    isTrial &&
    daysRemaining !== undefined &&
    daysRemaining <= 1;

  const showInvoiceAlert =
    currentUser?.role !== "SUPER_ADMIN" &&
    !isTrial &&
    (daysUntilInvoice === 1 || daysUntilInvoice === 0 || isInGracePeriod);

  const whatsappUrl = `https://wa.me/5561992295814?text=${encodeURIComponent(
    `Olá! Sou da empresa "${companyName}" e gostaria de regularizar a fatura/plano do sistema.`
  )}`;

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-xs text-[#71716C]">
          <div className="w-8 h-8 rounded-xl bg-[#181816] flex items-center justify-center shadow-sm animate-pulse">
            <span className="font-serif font-black text-amber-200 text-sm">T</span>
          </div>
          <span className="font-medium">Validando sessão TorxOS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F9F9F7]">
      {/* Sidebar Lateral TorxOS Luxury Off-White */}
      <aside className="no-print print:hidden w-64 border-r border-[rgba(28,25,23,0.07)] bg-[#F9F9F7] flex flex-col fixed inset-y-0 z-40">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[rgba(28,25,23,0.07)] justify-between bg-[#F9F9F7]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <TorxLogo size={32} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-sm text-[#1C1C1A]">Torx<span className="text-[#E2A336]">OS</span></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
              </div>
              <span className="block text-[9px] text-[#71716C] font-semibold uppercase tracking-wider -mt-0.5 font-mono">
                Operating System
              </span>
            </div>
          </Link>
        </div>

        {/* Tenant Info Card (Estilo Mercury Bank com Switch de Filiais) */}
        <div className="relative mx-3 my-3">
          <div
            onClick={() => {
              if (networkBranches.length > 1) {
                setShowBranchDropdown((prev) => !prev);
              }
            }}
            className={cn(
              "p-3 rounded-xl bg-white border border-[rgba(28,25,23,0.07)] shadow-[0px_1px_2px_rgba(0,0,0,0.02)] transition-all",
              networkBranches.length > 1 ? "cursor-pointer hover:border-[#181816]/30" : ""
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1C1A] min-w-0">
                {tenantLogo ? (
                  <img
                    src={tenantLogo}
                    alt="Logo"
                    className="w-5 h-5 rounded-md object-contain shrink-0 border border-[#EBEBE8] bg-[#FAF9F6]"
                  />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-[#71716C] shrink-0" strokeWidth={1.75} />
                )}
                <span className="truncate">
                  {currentUser?.role === "SUPER_ADMIN" ? "Plataforma Master" : currentUser?.tenantName || "Tech Center Matriz"}
                </span>
                {networkBranches.length > 1 && (
                  <ChevronDown className="w-3 h-3 text-[#71716C] shrink-0" />
                )}
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#F3F3EF] text-[#1C1C1A] rounded border border-[rgba(28,25,23,0.06)] shrink-0">
                {currentUser?.role === "SUPER_ADMIN" ? "MASTER" : currentUser?.tenantPlan || "PRO"}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-[#71716C] font-medium">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-700" strokeWidth={1.75} />
                <span>{currentUser?.role === "SUPER_ADMIN" ? "Administrador Global" : networkBranches.length > 1 ? `${networkBranches.length} Unidades na Rede` : "Multi-Tenant Isolado"}</span>
              </div>
              {networkBranches.length > 1 && (
                <span className="text-[9px] text-amber-700 font-bold hover:underline">
                  Trocar
                </span>
              )}
            </div>
          </div>

          {/* Menu Dropdown de Comutação Rápida entre Filiais */}
          {showBranchDropdown && networkBranches.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-[#EBEBE8] rounded-2xl shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A8A7A1] border-b border-[#F5F5F2] mb-1">
                Alternar Unidade Operacional
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {networkBranches.map((unit) => {
                  const isCurrent = currentUser?.tenantId === unit.id;
                  return (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => handleSwitchNetworkBranch(unit.id)}
                      className={cn(
                        "w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer",
                        isCurrent
                          ? "bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200/60"
                          : "hover:bg-[#FAF9F6] text-[#1C1C1A]"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {unit.isHeadquarter ? (
                          <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        ) : (
                          <Store className="w-3.5 h-3.5 text-[#71716C] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs leading-tight">{unit.tradeName}</p>
                          <span className="text-[9px] text-[#A8A7A1] block font-mono">
                            {unit.isHeadquarter ? "★ Matriz Central" : "Filial"}
                          </span>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isGroupActive = hasChildren && item.children?.some((c) => pathname.startsWith(c.href));
            const isSingleActive = !hasChildren && item.href && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
            const isSuperAdminOnly = item.href === "/super-admin";

            if (isSuperAdminOnly && currentUser?.role !== "SUPER_ADMIN") {
              return null;
            }

            return (
              <div key={item.name} className="space-y-0.5">
                {!hasChildren ? (
                  <Link
                    href={item.href || "#"}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150",
                      isSingleActive
                        ? "bg-[#181816] text-white shadow-sm"
                        : "text-[#71716C] hover:bg-[#F3F3EF] hover:text-[#1C1C1A]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon
                        className={cn("w-4 h-4", isSingleActive ? "text-amber-300" : "text-[#71716C]")}
                        strokeWidth={1.75}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                          isSingleActive
                            ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                            : "bg-[#EAEAE6] text-[#71716C]"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#A1A19B]">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-3.5 h-3.5 text-[#A1A19B]" strokeWidth={1.75} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#EAEAE6] text-[#71716C] uppercase tracking-wider">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5 pl-2">
                      {item.children?.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        const isSubLocked = Boolean(
                          sub.requiredFeature &&
                          currentUser?.role !== "SUPER_ADMIN" &&
                          !isPlanFeatureAllowed(currentUser?.tenantPlan, sub.requiredFeature)
                        );

                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={cn(
                              "flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                              isSubActive
                                ? "bg-white text-[#1C1C1A] font-semibold border border-[rgba(28,25,23,0.08)] shadow-[0px_1px_2px_rgba(0,0,0,0.02)]"
                                : "text-[#71716C] hover:bg-[#F3F3EF] hover:text-[#1C1C1A]"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn("w-1 h-1 rounded-full", isSubActive ? "bg-[#181816]" : "bg-transparent")} />
                              <span>{sub.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isSubLocked && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">
                                  <Lock className="w-2.5 h-2.5" />
                                  {sub.planBadge || "PRO"}
                                </span>
                              )}
                              {isSubActive && <ChevronRight className="w-3 h-3 text-[#1C1C1A]" strokeWidth={2} />}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3.5 border-t border-[rgba(28,25,23,0.07)] flex items-center justify-between bg-[#F9F9F7]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#181816] text-amber-200 flex items-center justify-center font-bold text-[11px] shadow-sm">
              {currentUser?.role === "SUPER_ADMIN" ? "👑" : (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "U")}
            </div>
            <div className="text-xs">
              <p className="font-semibold text-[#1C1C1A] leading-none">
                {currentUser?.name || "Usuário"}
              </p>
              <p className="text-[10px] text-[#71716C] mt-0.5">
                {currentUser?.role === "SUPER_ADMIN" ? "Dono da Plataforma" : "Administrador"}
              </p>
            </div>
          </div>
          <button
            title="Sair"
            onClick={() => {
              if (typeof window !== "undefined") {
                clearAllTenantCache();
                window.location.href = "/login";
              }
            }}
            className="text-[#A1A19B] hover:text-[#B91C1C] p-1 rounded-lg hover:bg-[#F3F3EF] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 ml-64 print:ml-0 flex flex-col min-h-screen">
        {/* Banner de Modo Suporte Ativo (Impersonate) */}
        {isImpersonating && (
          <div className="no-print print:hidden bg-amber-400 border-b border-amber-500 text-neutral-950 px-8 py-2.5 flex items-center justify-between font-semibold text-xs sticky top-0 z-50 shadow-md animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span>
                <strong>MODO SUPORTE ATIVO:</strong> Você está acessando o ambiente da assistência{" "}
                <u className="font-bold underline decoration-neutral-950 decoration-2">
                  {currentUser?.tenantName}
                </u>{" "}
                como administrador.
              </span>
            </div>
            <button
              type="button"
              onClick={handleExitImpersonation}
              className="px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              ⬅️ Voltar ao Painel Master
            </button>
          </div>
        )}

        {/* Banner de Alerta de Vencimento de Trial ou Fatura com Prazo de Confiança */}
        {(showTrialAlert || showInvoiceAlert) && (
          <div
            className={cn(
              "no-print print:hidden px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold sticky top-0 z-50 shadow-md animate-in slide-in-from-top duration-150",
              (showTrialAlert && daysRemaining === 1) || (!showTrialAlert && !isInGracePeriod && daysUntilInvoice === 1)
                ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-amber-950 border-b border-amber-500"
                : isInGracePeriod && daysRemainingGrace !== 1
                ? "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 text-neutral-950 border-b border-orange-500"
                : "bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white border-b border-red-700"
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span
                  className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    (showTrialAlert && daysRemaining === 1) || (!showTrialAlert && !isInGracePeriod && daysUntilInvoice === 1)
                      ? "bg-amber-800"
                      : "bg-white"
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-2.5 w-2.5",
                    (showTrialAlert && daysRemaining === 1) || (!showTrialAlert && !isInGracePeriod && daysUntilInvoice === 1)
                      ? "bg-amber-900"
                      : "bg-white"
                  )}
                />
              </span>
              <span>
                {showTrialAlert ? (
                  daysRemaining === 1 ? (
                    <>
                      <strong>⚠️ Atenção:</strong> O período de teste da empresa{" "}
                      <u className="underline font-bold">{companyName}</u> termina{" "}
                      <u className="underline font-bold">amanhã ({formattedExpiry})</u>! Evite a
                      interrupção das suas Ordens de Serviço e vendas. Regularize seu plano com nossa
                      equipe.
                    </>
                  ) : (
                    <>
                      <strong>🚨 Urgente:</strong> O período de teste da empresa{" "}
                      <u className="underline font-bold">{companyName}</u> encerra{" "}
                      <u className="underline font-bold">hoje às 23:59</u>! Regularize seu acesso agora
                      para evitar o bloqueio automático.
                    </>
                  )
                ) : isInGracePeriod ? (
                  daysRemainingGrace === 1 ? (
                    <>
                      <strong>🚨 ÚLTIMO AVISO:</strong> O prazo de confiança da empresa{" "}
                      <u className="underline font-bold">{companyName}</u> expira{" "}
                      <u className="underline font-bold">amanhã às 23:59</u>! Regularize agora para
                      evitar o bloqueio da sua equipe.
                    </>
                  ) : (
                    <>
                      <strong>⚠️ Atenção:</strong> A fatura da empresa{" "}
                      <u className="underline font-bold">{companyName}</u> venceu em{" "}
                      {formattedInvoiceDue}. Você tem até{" "}
                      <u className="underline font-bold">{formattedGraceEnds}</u> ({daysRemainingGrace}{" "}
                      dias de prazo de confiança) antes que o acesso da equipe seja suspenso.
                    </>
                  )
                ) : daysUntilInvoice === 1 ? (
                  <>
                    <strong>⚠️ Atenção:</strong> A fatura da empresa{" "}
                    <u className="underline font-bold">{companyName}</u> vence{" "}
                    <u className="underline font-bold">amanhã ({formattedInvoiceDue})</u>. Efetue o
                    pagamento para manter seus serviços ativos.
                  </>
                ) : (
                  <>
                    <strong>🚨 Urgente:</strong> A fatura da empresa{" "}
                    <u className="underline font-bold">{companyName}</u> vence{" "}
                    <u className="underline font-bold">hoje</u>! Efetue o pagamento para evitar o
                    bloqueio dos acessos.
                  </>
                )}
              </span>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer",
                (showTrialAlert && daysRemaining === 1) || (!showTrialAlert && !isInGracePeriod && daysUntilInvoice === 1)
                  ? "bg-neutral-950 hover:bg-neutral-800 text-amber-300"
                  : "bg-white hover:bg-neutral-100 text-neutral-950"
              )}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Falar com Suporte / Regularizar</span>
            </a>
          </div>
        )}

        {/* Navbar Flutuante com Efeito Glass Nobre */}
        <header className="no-print print:hidden h-16 evorix-navbar px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-[#A1A19B] uppercase tracking-wider">TorxOS</span>
            <span className="text-[#DDDCD6]">/</span>
            <span className="text-xs font-semibold text-[#1C1C1A] capitalize">
              {pathname === "/" ? "Visão 360" : pathname.replace("/", "").replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {currentUser?.role === "SUPER_ADMIN" && (
              <Link
                href="/super-admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold text-xs transition shadow-sm"
                title="Painel Master do Dono do Software"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>Painel do Dono</span>
              </Link>
            )}

            <Link
              href="/os/nova"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium text-xs transition shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" strokeWidth={1.75} />
              <span>Nova OS</span>
            </Link>

            <Link
              href="/mentor/chat"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F3F3EF] border border-[rgba(28,25,23,0.07)] text-[#1C1C1A] font-medium text-xs transition shadow-[0px_1px_2px_rgba(0,0,0,0.02)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" strokeWidth={1.75} />
              <span>TorxOS AI</span>
            </Link>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 p-8 bg-[#F9F9F7] print:p-0 print:bg-white">{children}</main>
      </div>
    </div>
  );
}
