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

  useEffect(() => {
    const urlPlan = searchParams.get("plan");
    if (urlPlan && ["STARTER", "PRO", "ENTERPRISE"].includes(urlPlan.toUpperCase())) {
      setPlan(urlPlan.toUpperCase());
    }
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
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
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1C1C1A] font-semibold mb-1">WhatsApp Comercial *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#71716C] absolute left-3 top-3" strokeWidth={1.75} />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                    required
                  />
                </div>
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
            <label className="block text-[#1C1C1A] font-semibold mb-1.5">Escolha seu Plano Inicial (7 Dias Grátis)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "STARTER", name: "Starter", price: "R$ 97/mês", desc: "Até 2 usuários" },
                { id: "PRO", name: "Pro", price: "R$ 197/mês", desc: "Mais Popular", badge: "Recomendado" },
                { id: "ENTERPRISE", name: "Enterprise", price: "R$ 347/mês", desc: "Ilimitado + IA" },
              ].map((p) => {
                const isSelected = plan === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id)}
                    className={`p-3 rounded-xl border text-left transition relative ${
                      isSelected
                        ? "bg-[#181816] text-white border-[#181816] shadow-sm"
                        : "bg-[#F9F9F7] text-[#71716C] border-[rgba(28,25,23,0.08)] hover:text-[#1C1C1A]"
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded bg-amber-400 text-black font-bold text-[8px] uppercase">
                        {p.badge}
                      </span>
                    )}
                    <div className="font-bold text-[12px]">{p.name}</div>
                    <div className={`text-[11px] font-mono ${isSelected ? "text-amber-200" : "text-[#1C1C1A]"}`}>
                      {p.price}
                    </div>
                    <div className="text-[9px] mt-0.5 opacity-80">{p.desc}</div>
                  </button>
                );
              })}
            </div>
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
