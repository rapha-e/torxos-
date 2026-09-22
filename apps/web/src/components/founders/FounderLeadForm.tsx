"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Layers,
  Wrench,
  Clock,
  ArrowRight,
} from "lucide-react";
import { maskPhone, validatePhone } from "@/lib/masks";
import { trackFounderEvent } from "./FounderTracking";

interface FounderLeadFormProps {
  selectedPlan?: string;
  isSlotsFull?: boolean;
}

export function FounderLeadForm({
  selectedPlan = "PRO",
  isSlotsFull = false,
}: FounderLeadFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [cityState, setCityState] = useState("");
  const [businessType, setBusinessType] = useState("Celulares");
  const [monthlyOrders, setMonthlyOrders] = useState("51–100");
  const [planInterest, setPlanInterest] = useState(selectedPlan);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasStartedForm, setHasStartedForm] = useState(false);

  useEffect(() => {
    if (selectedPlan) {
      setPlanInterest(selectedPlan);
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (!submitted || !redirectUrl) return;

    if (countdown <= 0) {
      router.push(redirectUrl);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [submitted, countdown, redirectUrl, router]);

  const handleFieldFocus = () => {
    if (!hasStartedForm) {
      setHasStartedForm(true);
      trackFounderEvent("founder_form_start");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validações no cliente
    if (!name.trim()) {
      setErrorMsg("Por favor, preencha o seu nome completo.");
      return;
    }
    if (!companyName.trim()) {
      setErrorMsg("Por favor, informe o nome da sua assistência técnica.");
      return;
    }
    const phoneVal = validatePhone(whatsapp);
    if (!phoneVal.isValid) {
      setErrorMsg(phoneVal.message || "Informe um número de WhatsApp com DDD válido.");
      return;
    }
    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      setErrorMsg("Por favor, informe um e-mail comercial válido.");
      return;
    }
    if (!cityState.trim()) {
      setErrorMsg("Por favor, informe sua Cidade e Estado (ex: Campinas/SP).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/web-api/founders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          companyName,
          whatsapp,
          email,
          cityState,
          businessType,
          monthlyOrders,
          planInterest,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ocorreu uma falha ao registrar o interesse.");
      }

      trackFounderEvent("founder_form_submit", {
        plan: planInterest,
        businessType,
        monthlyOrders,
      });

      const mappedPlan = planInterest.toLowerCase().includes("starter")
        ? "STARTER"
        : planInterest.toLowerCase().includes("enterprise")
        ? "ENTERPRISE"
        : "PRO";

      const targetUrl = `/cadastrar?founder=1&name=${encodeURIComponent(name.trim())}&company=${encodeURIComponent(companyName.trim())}&phone=${encodeURIComponent(whatsapp.trim())}&email=${encodeURIComponent(email.trim().toLowerCase())}&plan=${mappedPlan}`;

      setRedirectUrl(targetUrl);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao conectar com o servidor. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  // Estado: Slots Full (Vagas Encerradas)
  if (isSlotsFull && !submitted) {
    return (
      <section id="candidatura" className="py-20 border-t border-white/[0.08] bg-[#0C0C0E]">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
            <span>Inscrições Concluídas</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Programa Fundador encerrado
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-lg mx-auto">
            As 10 vagas do Programa Fundador foram preenchidas. Você pode entrar na lista de interesse para ser notificado com prioridade na próxima fase do TorxOS.
          </p>

          <form onSubmit={handleSubmit} className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.07] space-y-4 text-left">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Seu Nome</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#E2A336]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">WhatsApp</label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#E2A336]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#E2A336]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#E2A336] hover:bg-[#EBB048] text-[#14120E] font-bold text-xs tracking-tight transition cursor-pointer"
            >
              {loading ? "Enviando..." : "Quero entrar na lista de interesse"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  // Estado: Sucesso Pós-Envio com Transição VIP para Cadastro
  if (submitted) {
    return (
      <section id="candidatura" className="py-20 border-t border-white/[0.08] bg-[#0C0C0E]">
        <div className="max-w-xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 text-[#E2A336] flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#E2A336] bg-[#E2A336]/10 px-3 py-1 rounded-full border border-[#E2A336]/20">
              Vaga VIP Reservada
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Candidatura Confirmada!
            </h2>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.07] text-left text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-3">
            <p>
              Parabéns, <strong>{name}</strong>! Recebemos sua inscrição para a <strong>{companyName}</strong>.
            </p>
            <p className="text-zinc-400 text-xs">
              Para você já começar a organizar suas ordens de serviço imediatamente, seus dados foram pré-carregados. Falta apenas definir sua <strong>senha de acesso</strong> para ativar seu período de teste grátis de 7 dias.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => router.push(redirectUrl)}
              className="w-full py-4 rounded-xl bg-[#E2A336] hover:bg-[#EBB048] text-[#14120E] font-bold text-sm tracking-tight transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#E2A336]/10"
            >
              <span>Ativar Minha Conta VIP Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#E2A336]" />
              <span>Redirecionando automaticamente em <strong>{countdown}s</strong>...</span>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="candidatura" className="py-20 border-t border-white/[0.08] bg-white/[0.015]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#E2A336] bg-[#E2A336]/10 px-3 py-1 rounded-full border border-[#E2A336]/20">
            Candidatura Oficial
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] leading-snug">
            Candidatura ao Programa Fundador
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto font-normal leading-relaxed">
            Preencha os dados da sua assistência técnica. Entraremos em contato individualmente para validar sua participação.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 sm:p-8 bg-[#121215] border border-white/[0.08] shadow-2xl space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Seu Nome Completo <span className="text-[#E2A336]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onFocus={handleFieldFocus}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Lucas Ribeiro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#E2A336] transition"
                />
              </div>
            </div>

            {/* Nome da assistência */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Nome da Assistência Técnica <span className="text-[#E2A336]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={companyName}
                  onFocus={handleFieldFocus}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: SmartFix Celulares"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#E2A336] transition"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                WhatsApp Comercial <span className="text-[#E2A336]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onFocus={handleFieldFocus}
                  onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#E2A336] transition"
                />
              </div>
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                E-mail Comercial <span className="text-[#E2A336]">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onFocus={handleFieldFocus}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@suaassistencia.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#E2A336] transition"
                />
              </div>
            </div>

            {/* Cidade / Estado */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Cidade e Estado <span className="text-[#E2A336]">*</span>
              </label>
              <input
                type="text"
                required
                value={cityState}
                onFocus={handleFieldFocus}
                onChange={(e) => setCityState(e.target.value)}
                placeholder="Ex: Campinas / SP"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#E2A336] transition"
              />
            </div>

            {/* Tipo de assistência */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Tipo Principal de Assistência <span className="text-[#E2A336]">*</span>
              </label>
              <select
                value={businessType}
                onFocus={handleFieldFocus}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17171B] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#E2A336] transition"
              >
                <option value="Celulares">Celulares / Smartphones</option>
                <option value="Computadores">Computadores / Desktops</option>
                <option value="Notebooks">Notebooks / MacBooks</option>
                <option value="Eletrônicos">Eletrônicos / Games / TV</option>
                <option value="Eletrodomésticos">Eletrodomésticos</option>
                <option value="Equipamentos industriais">Equipamentos Industriais</option>
                <option value="Outro">Outro segmento técnico</option>
              </select>
            </div>

            {/* Quantidade aproximada de OS por mês */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Quantidade aproximada de OS/mês <span className="text-[#E2A336]">*</span>
              </label>
              <select
                value={monthlyOrders}
                onFocus={handleFieldFocus}
                onChange={(e) => setMonthlyOrders(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17171B] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#E2A336] transition"
              >
                <option value="Até 50">Até 50 OS/mês</option>
                <option value="51–100">51 a 100 OS/mês</option>
                <option value="101–300">101 a 300 OS/mês</option>
                <option value="301–500">301 a 500 OS/mês</option>
                <option value="Mais de 500">Mais de 500 OS/mês</option>
              </select>
            </div>

            {/* Plano de interesse */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Plano de Interesse do Programa <span className="text-[#E2A336]">*</span>
              </label>
              <select
                value={planInterest}
                onFocus={handleFieldFocus}
                onChange={(e) => setPlanInterest(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17171B] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#E2A336] transition font-medium"
              >
                <option value="Starter">Starter — R$ 39,90/mês (Condição Fundador)</option>
                <option value="PRO">PRO — R$ 59,90/mês (Recomendado • AI Mentor & Kanban)</option>
                <option value="Enterprise">Enterprise — Sob avaliação (Multi-lojas / Filiais)</option>
                <option value="Ainda não sei">Ainda não sei (Decidir durante a conversa)</option>
              </select>
            </div>

            {/* Mensagem opcional */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Conte brevemente como você administra sua assistência hoje <span className="text-zinc-500 font-normal">(opcional)</span>
              </label>
              <textarea
                rows={3}
                value={message}
                onFocus={handleFieldFocus}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: Hoje uso caderno e planilhas no Excel. Gostaria de organizar a bancada e parar de perder peças no estoque..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#E2A336] transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-[#E2A336] hover:bg-[#EBB048] disabled:opacity-50 text-[#14120E] font-bold text-sm tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_24px_-6px_rgba(226,163,54,0.35)] border border-[#EBB048]/60 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#14120E]" />
                  <span>Enviando candidatura...</span>
                </>
              ) : (
                <>
                  <span>QUERO PARTICIPAR DO PROGRAMA</span>
                  <ArrowRight className="w-4 h-4 text-[#14120E]" />
                </>
              )}
            </button>
            <p className="text-[11px] text-zinc-500 text-center mt-2.5">
              Seus dados serão tratados com estrito sigilo. Entraremos em contato pelo WhatsApp fornecido.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
