"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Crown, ShieldCheck, Lock, Mail, User, ArrowRight, CheckCircle2, AlertCircle, Key } from "lucide-react";
import { fetchApi, setAuthToken, clearAllTenantCache } from "@/lib/api";
import { TorxLogo } from "@/components/ui/torxos-logo";

export default function SetupMasterPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(true);
  const [superAdminCount, setSuperAdminCount] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchApi("/auth/setup-status")
      .then((data) => {
        if (data) {
          setNeedsSetup(data.needsSetup ?? true);
          setSuperAdminCount(data.superAdminCount ?? 0);
        }
      })
      .catch(() => {
        // Se a rota não responder, assume que pode tentar
        setNeedsSetup(true);
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      clearAllTenantCache();

      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        password,
      };

      if (setupSecret) {
        payload.setupSecret = setupSecret.trim();
      }

      const data = await fetchApi("/auth/setup-master", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data?.accessToken && data?.user) {
        setAuthToken(data.accessToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("torxos_user", JSON.stringify(data.user));
          localStorage.setItem("evorix_user", JSON.stringify(data.user));
        }
        setSuccessMessage("Perfil de Dono do Software ativado! Redirecionando para o painel...");
        setTimeout(() => {
          window.location.href = "/super-admin";
        }, 1200);
      } else {
        setErrorMessage(data?.message || "Erro ao configurar Dono do Software.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Falha na comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <TorxLogo size={42} />
        </div>

        <div className="text-center space-y-1.5 px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs font-bold mb-2">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>Perfil Independente de Dono do Software</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#181816]">
            {needsSetup ? "Criar Dono do Software (Super Admin)" : "Gerenciar Acesso do Dono"}
          </h2>
          <p className="text-xs text-[#787774] max-w-sm mx-auto leading-relaxed">
            Acesso master global da plataforma, com controle total sobre todas as assistências cadastradas e <strong>sem necessidade de criar perfil de empresa</strong>.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#EBEBE8] rounded-3xl sm:px-8 space-y-5">
          {checking ? (
            <div className="py-12 text-center text-xs text-[#787774]">
              Verificando status de configuração da plataforma...
            </div>
          ) : (
            <>
              {!needsSetup && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Plataforma já possui {superAdminCount} Dono(s) Ativo(s)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Para adicionar ou promover um novo Super Admin por esta tela, informe a Chave Mestra de Segurança ou execute o comando seguro direto no terminal da VPS.
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#181816] mb-1.5">
                    Nome Completo do Dono
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A7A1]">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Raphael Dono da Plataforma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[#E5E5E0] rounded-xl text-xs text-[#181816] placeholder-[#A8A7A1] focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181816] mb-1.5">
                    E-mail Master de Acesso
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A7A1]">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="seu-email@dominio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[#E5E5E0] rounded-xl text-xs text-[#181816] placeholder-[#A8A7A1] focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition"
                    />
                  </div>
                  <p className="text-[10px] text-[#787774] mt-1">
                    * Se este e-mail já pertencer a um usuário no sistema, ele será promovido a Dono Global e desvinculado de qualquer loja.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181816] mb-1.5">
                    Senha Mestra (mínimo 6 dígitos)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A7A1]">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[#E5E5E0] rounded-xl text-xs text-[#181816] placeholder-[#A8A7A1] focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition"
                    />
                  </div>
                </div>

                {!needsSetup && (
                  <div>
                    <label className="block text-xs font-semibold text-[#181816] mb-1.5">
                      Chave Mestra de Segurança (Setup Secret)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A7A1]">
                        <Key className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        placeholder="Informe a chave SETUP_SECRET"
                        value={setupSecret}
                        onChange={(e) => setSetupSecret(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[#E5E5E0] rounded-xl text-xs text-[#181816] placeholder-[#A8A7A1] focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition font-mono"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-xs text-xs font-bold text-white bg-gradient-to-r from-[#181816] to-[#2e2a25] hover:from-[#252422] hover:to-[#3b3630] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#181816] transition cursor-pointer disabled:opacity-50"
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>
                    {loading ? "Configurando..." : needsSetup ? "Criar Perfil de Dono do Software" : "Salvar Dono do Software"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 text-amber-400" />
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-xs text-[#787774] hover:text-[#181816] font-medium transition cursor-pointer"
                >
                  Já possui login? Ir para tela de login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
