"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  FileText,
  AlertTriangle,
} from "lucide-react";
import { fetchApi, setAuthToken } from "@/lib/api";
import { TorxLogo } from "@/components/ui/torxos-logo";
import { maskCpfCnpj, validateCpfCnpj, maskPhone, validatePhone } from "@/lib/masks";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tradeName, setTradeName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("PRO");
  const isFounder = searchParams.get("founder") === "1" || searchParams.get("founder") === "true";

  useEffect(() => {
    const urlPlan = searchParams.get("plan");
    if (urlPlan && ["STARTER", "PRO", "ENTERPRISE"].includes(urlPlan.toUpperCase())) {
      if (isFounder && urlPlan.toUpperCase() === "ENTERPRISE") {
        setPlan("PRO");
      } else {
        setPlan(urlPlan.toUpperCase());
      }
    } else if (isFounder) {
      setPlan("PRO");
    }

    const urlName = searchParams.get("name");
    if (urlName) setName(urlName);

    const urlCompany = searchParams.get("company") || searchParams.get("tradeName");
    if (urlCompany) setTradeName(urlCompany);

    const urlEmail = searchParams.get("email");
    if (urlEmail) setEmail(urlEmail);

    const urlPhone = searchParams.get("phone");
    if (urlPhone) setPhone(maskPhone(urlPhone));
  }, [searchParams, isFounder]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validação de Documento (CPF ou CNPJ)
    const docValidation = validateCpfCnpj(document);
    if (!docValidation.isValid) {
      setDocumentError(docValidation.message || "Documento inválido.");
      setErrorMsg(docValidation.message || "Por favor, corrija o CPF ou CNPJ informado.");
      return;
    }
    setDocumentError(null);

    // Validação de WhatsApp Comercial
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.message || "Telefone inválido.");
      setErrorMsg(phoneValidation.message || "Por favor, informe um WhatsApp comercial com DDD válido.");
      return;
    }
    setPhoneError(null);

    setLoading(true);

    try {
      // 1. Limpar 100% de qualquer sessão e cache residual de outros lojistas
      if (typeof window !== "undefined") {
        const keys = [
          "evorix_token",
          "evorix_user",
          "evorix_super_admin_backup",
          "torxos_company_profile",
          "evorix_stock_products",
          "evorix_service_orders",
          "evorix_financial_transactions",
          "evorix_sales",
        ];
        keys.forEach((k) => localStorage.removeItem(k));
      }

      await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          tradeName,
          document,
          phone,
          name,
          email,
          password,
          plan,
          isFounder,
        }),
      });

      // 2. Redireciona para o login com flag de cadastro bem-sucedido
      router.push(`/login?registered=1&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao criar cadastro da empresa. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-xl w-full p-8 rounded-2xl bg-white border border-[rgba(28,25,23,0.07)] shadow-elevated space-y-6">
        
        {/* Header com Identidade Visual */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <TorxLogo size={46} />
          </div>
          <h1 className="text-xl font-bold text-[#1C1C1A] tracking-tight">
            Criar Conta no Torx<span className="text-[#E2A336]">OS</span>
          </h1>
          <p className="text-xs text-[#71716C]">
            Cadastre sua assistência técnica e comece com <strong className="text-[#1C1C1A]">7 dias de teste grátis</strong>
          </p>
        </div>

        {/* Banner de Membro Fundador se originado do Programa Fundador */}
        {isFounder && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-3 animate-in fade-in">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-[#B87D18] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#8C5D08] flex items-center gap-1.5">
                Vaga de Membro Fundador Reservada!
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-200/80 font-bold text-amber-900 uppercase">
                  Condição Especial
                </span>
              </p>
              <p className="text-[#6D5220] mt-0.5 leading-relaxed text-[11px]">
                Seus dados foram pré-carregados com sucesso. Defina sua <strong>senha de acesso</strong> e informe o <strong>CNPJ ou CPF</strong> para ativar sua bancada com <strong>7 dias de teste grátis</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Benefícios Rápidos em Destaque */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#F4F4F0] border border-[rgba(28,25,23,0.06)] text-[11px] text-[#444441]">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2} />
            <span>Sem cartão inicial</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" strokeWidth={2} />
            <span>AI Mentor incluso</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#181816] shrink-0" strokeWidth={2} />
            <span>Dados 100% blindados</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Formulário de Onboarding */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#71716C]">
              1. Dados da Sua Empresa / Assistência
            </h3>

            <div>
              <label className="block text-[#1C1C1A] font-semibold mb-1">Nome Fantasia da Loja *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#71716C] absolute left-3 top-3" strokeWidth={1.75} />
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="Ex: Prime Fix Assistência Técnica"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1C1C1A] font-semibold mb-1">CNPJ ou CPF *</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-[#71716C] absolute left-3 top-3" strokeWidth={1.75} />
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => {
                      setDocument(maskCpfCnpj(e.target.value));
                      if (documentError) setDocumentError(null);
                    }}
                    placeholder="00.000.000/0001-00 ou CPF"
                    maxLength={18}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F9F7] border ${
                      documentError ? "border-red-400 bg-red-50/20" : "border-[rgba(28,25,23,0.08)]"
                    } focus:border-[#181816] focus:outline-none text-[#1C1C1A]`}
                    required
                  />
                </div>
                {documentError && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {documentError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[#1C1C1A] font-semibold mb-1">WhatsApp Comercial *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#71716C] absolute left-3 top-3" strokeWidth={1.75} />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(maskPhone(e.target.value));
                      if (phoneError) setPhoneError(null);
                    }}
                    placeholder="(11) 99999-8888"
                    maxLength={15}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F9F7] border ${
                      phoneError ? "border-red-400 bg-red-50/20" : "border-[rgba(28,25,23,0.08)]"
                    } focus:border-[#181816] focus:outline-none text-[#1C1C1A]`}
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
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#71716C]">
              2. Dados de Acesso do Administrador
            </h3>

            <div>
              <label className="block text-[#1C1C1A] font-semibold mb-1">Seu Nome Completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#71716C] absolute left-3 top-3" strokeWidth={1.75} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do Proprietário ou Gestor"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1C1C1A] font-semibold mb-1">E-mail de Login *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#71716C] absolute left-3 top-3" strokeWidth={1.75} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="gestor@sualoja.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1C1C1A] font-semibold mb-1">Criar Senha Segura *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#71716C] absolute left-3 top-3" strokeWidth={1.75} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seleção do Plano */}
          <div className="pt-2">
            <label className="block text-[#1C1C1A] font-semibold mb-1.5">
              {isFounder
                ? "Escolha seu Plano do Programa Fundador (7 Dias Grátis com Valor Travado)"
                : "Escolha seu Plano Inicial (7 Dias Grátis)"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(isFounder
                ? [
                    {
                      id: "STARTER",
                      name: "Starter",
                      price: "R$ 39,90/mês",
                      desc: "Condição Fundador",
                      badge: "Membro Fundador",
                    },
                    {
                      id: "PRO",
                      name: "Pro",
                      price: "R$ 59,90/mês",
                      desc: "AI Mentor & Kanban",
                      badge: "Recomendado",
                    },
                    {
                      id: "ENTERPRISE",
                      name: "Enterprise",
                      price: "Indisponível",
                      desc: "Não elegível ao Fundador",
                      disabled: true,
                      badge: "Indisponível",
                    },
                  ]
                : [
                    { id: "STARTER", name: "Starter", price: "R$ 79/mês", desc: "Até 2 usuários" },
                    { id: "PRO", name: "Pro", price: "R$ 139/mês", desc: "Mais Popular", badge: "Recomendado" },
                    { id: "ENTERPRISE", name: "Enterprise", price: "R$ 249/mês", desc: "Ilimitado + IA" },
                  ]
              ).map((p: any) => {
                const isSelected = plan === p.id && !p.disabled;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={p.disabled}
                    onClick={() => {
                      if (!p.disabled) setPlan(p.id);
                    }}
                    className={`p-3 rounded-xl border text-left transition relative ${
                      p.disabled
                        ? "bg-[#F3F3EF] text-[#A8A8A2] border-[rgba(28,25,23,0.06)] cursor-not-allowed opacity-60"
                        : isSelected
                        ? "bg-[#181816] text-white border-[#181816] shadow-sm"
                        : "bg-[#F9F9F7] text-[#71716C] border-[rgba(28,25,23,0.08)] hover:text-[#1C1C1A]"
                    }`}
                  >
                    {p.badge && (
                      <span
                        className={`absolute -top-2 right-2 px-1.5 py-0.5 rounded font-bold text-[8px] uppercase ${
                          p.disabled
                            ? "bg-zinc-300 text-zinc-600"
                            : p.badge === "Recomendado"
                            ? "bg-amber-400 text-black"
                            : "bg-[#E2A336] text-black"
                        }`}
                      >
                        {p.badge}
                      </span>
                    )}
                    <div className="font-bold text-[12px]">{p.name}</div>
                    <div
                      className={`text-[11px] font-mono font-semibold ${
                        isSelected
                          ? "text-amber-200"
                          : p.disabled
                          ? "text-zinc-500"
                          : "text-[#1C1C1A]"
                      }`}
                    >
                      {p.price}
                    </div>
                    <div className="text-[9px] mt-0.5 opacity-80">{p.desc}</div>
                  </button>
                );
              })}
            </div>
            {isFounder && (
              <p className="text-[10px] text-amber-700/90 mt-2 font-medium">
                ⭐ Os valores especiais de <strong>R$ 39,90</strong> (Starter) e <strong>R$ 59,90</strong> (Pro) ficam travados vitaliciamente para sua assistência técnica. O plano Enterprise não participa do programa fundador.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium text-xs flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
          >
            <span>{loading ? "Criando sua empresa e ambiente..." : "Ativar Meus 7 Dias Grátis"}</span>
            <ArrowRight className="w-4 h-4 text-amber-300" strokeWidth={1.75} />
          </button>
        </form>

        <div className="text-center text-xs text-[#71716C] pt-1">
          Já possui uma conta?{" "}
          <Link href="/login" className="font-semibold text-[#1C1C1A] hover:underline">
            Fazer login na plataforma
          </Link>
        </div>

        <div className="text-center text-[10px] text-[#A1A19B] space-y-1">
          <p>TorxOS Multi-Tenant SaaS • Termos de Uso e Política de Privacidade</p>
          <p>Seus dados são isolados com segurança multi-tenant.</p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
          <div className="text-xs text-[#71716C] font-semibold animate-pulse">
            Carregando cadastro...
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
