"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { fetchApi, setAuthToken, clearAllTenantCache } from "@/lib/api";
import { TorxLogo } from "@/components/ui/torxos-logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  useEffect(() => {
    const isReg = searchParams.get("registered");
    const paramEmail = searchParams.get("email");
    if (isReg === "1") {
      setRegisteredSuccess(true);
    }
    if (paramEmail) {
      setEmail(paramEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // Limpa qualquer cache de tenant anterior antes de autenticar o novo
      clearAllTenantCache();

      const data = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (data?.accessToken && data?.user) {
        setAuthToken(data.accessToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("evorix_user", JSON.stringify(data.user));
          if (data.user.tenantName) {
            localStorage.setItem(
              "torxos_company_profile",
              JSON.stringify({
                tradeName: data.user.tenantName,
                email: data.user.email,
              })
            );
          }
        }

        if (data.user.role === "SUPER_ADMIN") {
          window.location.href = "/super-admin";
        } else {
          window.location.href = "/";
        }
        return;
      }

      throw new Error("Não foi possível autenticar. Verifique seus dados.");
    } catch (err: any) {
      console.error("Erro no login:", err);
      setErrorMessage(
        err?.message || "E-mail ou senha inválidos. Por favor, tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-[rgba(28,25,23,0.07)] shadow-elevated space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <TorxLogo size={42} />
          </div>
          <h1 className="text-xl font-bold text-[#1C1C1A] tracking-tight">
            Torx<span className="text-[#E2A336]">OS</span>
          </h1>
          <p className="text-xs text-[#71716C]">
            Operating System for Tech Services • Autenticação
          </p>
        </div>

        {registeredSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950">Empresa cadastrada com sucesso!</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Digite sua senha abaixo para acessar seu ambiente exclusivo com 7 dias de teste grátis.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#1C1C1A] font-semibold mb-1">E-mail de Acesso</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#71716C] absolute left-3 top-3" strokeWidth={1.75} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com.br"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[#1C1C1A] font-semibold mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#71716C] absolute left-3 top-3" strokeWidth={1.75} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.08)] focus:border-[#181816] focus:outline-none text-[#1C1C1A]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium text-xs flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? "Autenticando..." : "Entrar na Plataforma"}</span>
            <ArrowRight className="w-4 h-4 text-amber-300" strokeWidth={1.75} />
          </button>
        </form>

        <div className="text-center text-xs text-[#71716C]">
          Ainda não tem cadastro?{" "}
          <a href="/cadastrar" className="font-semibold text-[#1C1C1A] hover:underline">
            Criar empresa (7 dias grátis)
          </a>
        </div>

        <div className="text-center text-[10px] text-[#A1A19B]">
          <p>TorxOS Multi-Tenant SaaS • Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F9F7]" />}>
      <LoginForm />
    </Suspense>
  );
}
