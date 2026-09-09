"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Boxes,
  MessageSquare,
  Zap,
  Smartphone,
  Check,
  X,
  ChevronDown,
  Star,
  Users,
  ShieldAlert,
  Clock,
  ExternalLink,
  Laptop,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { TorxLogo } from "@/components/ui/torxos-logo";

export default function LandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Função para rastrear evento no Meta Pixel e Google Tag Manager
  const trackConversion = (eventName: string, planSelected?: string) => {
    try {
      if (typeof window !== "undefined") {
        // Meta Pixel
        if ((window as any).fbq) {
          (window as any).fbq("track", eventName, {
            content_name: "Landing Page TorxOS",
            plan: planSelected || "TRIAL",
          });
        }
        // Google Tag Manager / GA4
        if ((window as any).dataLayer) {
          (window as any).dataLayer.push({
            event: eventName,
            plan: planSelected || "TRIAL",
          });
        }
      }
    } catch (e) {
      console.warn("Analytics tracking error:", e);
    }
  };

  const handleCtaClick = (planName: string = "PRO") => {
    trackConversion("Lead", planName);
    router.push(`/cadastrar?plan=${planName}`);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#0C0C0E] text-[#EDEDED] font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Banner Informativo B2B Premium & Discreto */}
      <div className="bg-[#111113] border-b border-white/[0.08] text-zinc-300 py-2.5 px-4 text-center text-xs font-medium flex items-center justify-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-[10px] font-mono text-zinc-400 font-semibold uppercase tracking-wider">
          Novo
        </span>
        <span className="text-zinc-300 text-xs">
          Teste o TorxOS grátis por 7 dias sem compromisso e sem precisar cadastrar cartão de crédito.
        </span>
        <button
          onClick={() => handleCtaClick("PRO")}
          className="text-zinc-100 hover:text-white underline underline-offset-4 ml-1 cursor-pointer font-semibold hidden sm:inline-flex items-center gap-1 transition"
        >
          <span>Criar conta</span>
          <ArrowRight className="w-3 h-3 text-zinc-400" />
        </button>
      </div>

      {/* Navbar Flutuante */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0C0C0E]/90 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TorxLogo size={34} />
            <div>
              <span className="text-sm font-bold -tracking-[0.03em] text-white flex items-center gap-1.5">
                Torx<span className="text-[#E2A336]">OS</span>
                <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/10 font-semibold">
                  PRO
                </span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
            <a href="#recursos" className="hover:text-white transition">Recursos</a>
            <a href="#solucoes" className="hover:text-white transition">Solução</a>
            <a href="#comparativo" className="hover:text-white transition">Comparativo</a>
            <a href="#precos" className="hover:text-white transition">Planos</a>
            <a href="#faq" className="hover:text-white transition">Dúvidas</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition"
            >
              Entrar
            </Link>
            <button
              onClick={() => handleCtaClick("PRO")}
              className="px-3.5 py-2 rounded-xl bg-[#EDEDEC] hover:bg-white text-[#121214] font-semibold text-xs tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(0,0,0,0.4)] border border-white/20 transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              <span>Testar 7 Dias Grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Glow de fundo sutil e refinado */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-amber-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-7 relative z-10">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] text-xs font-medium text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Sistema Operacional Especializado para Assistências Técnicas</span>
            <span className="text-zinc-500 font-mono text-[11px]">•</span>
            <span className="text-zinc-400 font-mono text-[11px]">com IA</span>
          </div>

          {/* Headline Principal com Tracking Apertado -tracking-[0.03em] */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold -tracking-[0.03em] text-white max-w-4xl mx-auto leading-[1.12]">
            Elimine a bagunça na bancada e{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-amber-200 to-amber-400">
              multiplique o lucro líquido
            </span>{" "}
            da sua assistência técnica.
          </h1>

          {/* Subheadline persuasiva */}
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Chega de ordens de serviço perdidas em papel, peças sumindo no estoque e clientes cobrando status no WhatsApp. 
            O <strong>TorxOS</strong> centraliza OS, almoxarifado, financeiro e inteligência artificial para você focar no que dá dinheiro.
          </p>

          {/* Botões de Ação do Hero - Acabamento Premium Sólido com Inner Bevel */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => handleCtaClick("PRO")}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#E2A336] hover:bg-[#EBB048] text-[#14120E] font-semibold text-sm -tracking-[0.01em] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_24px_-6px_rgba(226,163,54,0.3)] border border-[#EBB048]/60 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Começar 7 Dias Grátis</span>
              <ArrowRight className="w-4 h-4 text-[#14120E]" />
            </button>
            <a
              href="#recursos"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] hover:border-white/[0.15] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <span>Ver como funciona</span>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </a>
          </div>

          {/* Selos de Confiança */}
          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-zinc-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Configuração em 2 minutos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Cancela a qualquer momento</span>
            </div>
          </div>

          {/* Mockup Interativo do Painel do Sistema (Bento Top-Light) */}
          <div className="pt-8 max-w-5xl mx-auto">
            <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.06] to-white/[0.02] shadow-2xl shadow-black/90">
              <div className="rounded-[15px] overflow-hidden bg-[#121215] text-left">
                {/* Janela estilo macOS */}
                <div className="px-4 py-3 bg-[#17171B] border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <span className="text-[11px] font-mono text-zinc-400 ml-2">app.torxos.com.br/os/kanban</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Oficina Conectada • Ao Vivo</span>
                  </div>
                </div>

                {/* Conteúdo do Mockup: Kanban de Bancada + DRE (Monocromático com Dot Indicators) */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                  {/* Coluna 1: Entrada / Diagnóstico */}
                  <div className="bg-[#18181C] p-3.5 rounded-xl border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="font-semibold text-zinc-200 flex items-center gap-2 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/90 shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
                        <Clock className="w-3.5 h-3.5 text-zinc-400" /> Na Bancada (Diagnóstico)
                      </span>
                      <span className="text-[10px] font-mono bg-white/[0.04] text-zinc-400 border border-white/[0.08] px-1.5 py-0.5 rounded">
                        2 aparelhos
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#202026] border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-zinc-200">#1042 • iPhone 13 Pro</span>
                        <span className="text-zinc-100 font-mono font-medium">R$ 650</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">Troca de Display OLED + Vedação IP68</p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400">
                        <span>Técnico: Lucas R.</span>
                        <span className="inline-flex items-center gap-1.5 text-zinc-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" /> Peça em Estoque
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#202026] border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-zinc-200">#1045 • Galaxy S22 Ultra</span>
                        <span className="text-zinc-100 font-mono font-medium">R$ 380</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">Troca de Conector de Carga Tipo C</p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400">
                        <span>Técnico: Rafael M.</span>
                        <span className="inline-flex items-center gap-1.5 text-zinc-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Aguardando Aprovação
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 2: Pronto / Retirada com WhatsApp */}
                  <div className="bg-[#18181C] p-3.5 rounded-xl border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="font-semibold text-zinc-200 flex items-center gap-2 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/90 shadow-[0_0_6px_rgba(52,211,153,0.4)]" />
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" /> Pronto para Retirada
                      </span>
                      <span className="text-[10px] font-mono bg-white/[0.04] text-zinc-400 border border-white/[0.08] px-1.5 py-0.5 rounded">
                        1 aparelho
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#202026] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-zinc-200">#1039 • MacBook Air M1</span>
                        <span className="text-zinc-100 font-mono font-medium">R$ 1.250</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">Reparo de Trilha de Alimentação 19V</p>
                      <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[10px] text-zinc-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                          WhatsApp enviado: "Seu aparelho está pronto!"
                        </span>
                        <span className="font-mono text-zinc-400 text-[9px]">Lido ✓✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 3: Visão de Lucro & AI Mentor */}
                  <div className="bg-[#18181C] p-3.5 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="font-semibold text-zinc-200 flex items-center gap-2 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400/90 shadow-[0_0_6px_rgba(56,189,248,0.4)]" />
                        <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> AI Mentor de Bancada
                      </span>
                      <span className="text-[10px] font-mono bg-white/[0.04] text-zinc-400 border border-white/[0.08] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        Ativo
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] space-y-1 text-[11px]">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                        Sugestão Inteligente de Preço:
                      </span>
                      <p className="text-zinc-400 leading-relaxed">
                        "Para o iPhone 13 Pro, sua margem foi de <strong className="text-zinc-200">62%</strong>. Sugiro aplicar garantia estendida de 90 dias com termo digital."
                      </p>
                    </div>

                    {/* Resumo Financeiro */}
                    <div className="p-3 rounded-lg bg-[#202026] border border-white/5 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-zinc-400">Faturamento Hoje</div>
                      <div className="text-lg font-bold font-mono text-zinc-100">R$ 3.840,00</div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-zinc-400" />
                        <span>+28% acima da média da semana</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prova Social em Números com Números em Mono Estilizado */}
      <section className="py-14 border-y border-white/[0.08] bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-tight tabular-nums">+1.250</div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">Assistências Técnicas no Brasil</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-100 font-mono tracking-tight tabular-nums">+480.000</div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">Ordens de Serviço Concluídas</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-tight tabular-nums">35%</div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">Aumento Médio de Lucro Líquido</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-100 font-mono tracking-tight tabular-nums">4.9 / 5.0</div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">Avaliação dos Lojistas</div>
          </div>
        </div>
      </section>

      {/* Seção: As 4 Maiores Dores de Bancada que o TorxOS Resolve (Bento Top-Light & Ícones Monocromáticos) */}
      <section id="solucoes" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Diagnóstico de Eficiência
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] tracking-tight">
            Sua oficina sofre com algum desses 4 problemas clássicos?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-normal">
            Identificamos os maiores gargalos que roubam a energia e o faturamento do dono de assistência técnica.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1 - Bento Top-Light com Hover Elevation */}
          <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] hover:from-white/25 focus-within:ring-1 focus-within:ring-white/20">
            <div className="rounded-[15px] bg-[#121215] p-6 space-y-3 h-full">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white -tracking-[0.02em]">Peças que Somem e Falta de Estoque Crítico</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Você aceita um serviço com prazo apertado e, na hora de montar, percebe que a tela ou bateria não está na gaveta. Com o TorxOS, a baixa é 100% automática e você recebe alerta de reposição antes da peça acabar.
              </p>
            </div>
          </div>

          {/* Card 2 - Bento Top-Light com Hover Elevation */}
          <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] hover:from-white/25 focus-within:ring-1 focus-within:ring-white/20">
            <div className="rounded-[15px] bg-[#121215] p-6 space-y-3 h-full">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white -tracking-[0.02em]">Clientes Cobrando Status o Dia Inteiro no WhatsApp</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Sua equipe perde horas respondendo "Já ficou pronto?". O TorxOS gera um link público de acompanhamento por QR Code e dispara avisos automáticos pelo WhatsApp a cada etapa do conserto.
              </p>
            </div>
          </div>

          {/* Card 3 - Bento Top-Light com Hover Elevation */}
          <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] hover:from-white/25 focus-within:ring-1 focus-within:ring-white/20">
            <div className="rounded-[15px] bg-[#121215] p-6 space-y-3 h-full">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white -tracking-[0.02em]">Orçamentos Mal Calculados e Prejuízo em Garantias</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Sem saber exatamente o custo da peça + imposto + comissão do técnico, você acha que teve lucro mas tomou prejuízo. O TorxOS calcula a margem líquida real de cada serviço em tempo real.
              </p>
            </div>
          </div>

          {/* Card 4 - Bento Top-Light com Hover Elevation */}
          <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] hover:from-white/25 focus-within:ring-1 focus-within:ring-white/20">
            <div className="rounded-[15px] bg-[#121215] p-6 space-y-3 h-full">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white -tracking-[0.02em]">Caixa Desorganizado sem Saber o Lucro do Mês</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Misturar contas pessoais com as da oficina é o caminho mais rápido para quebrar. Com nosso DRE Gerencial automático, você sabe no centavo quanto faturou, quanto gastou e quanto pode retirar de pró-labore.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Core em Destaque (4 Pilares com Bento Top-Light & Ícones Monocromáticos) */}
      <section id="recursos" className="py-24 bg-white/[0.015] border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
              Arquitetura de Gestão
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] tracking-tight">
              Os 4 Pilares que Transformam sua Assistência em uma Empresa Sólida
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Pilar 1 */}
            <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] hover:from-white/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] focus-within:ring-1 focus-within:ring-white/20 shadow-lg">
              <div className="rounded-[15px] bg-[#121215] p-6 space-y-4 h-full">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white -tracking-[0.02em]">1. Ordem de Serviço & Bancada Kanban</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  Entrada rápida com checklist de avarias, foto de entrada, laudo técnico, termo de garantia digital e impressão térmica de comprovante para colar no aparelho.
                </p>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] hover:from-white/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] focus-within:ring-1 focus-within:ring-white/20 shadow-lg">
              <div className="rounded-[15px] bg-[#121215] p-6 space-y-4 h-full">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white -tracking-[0.02em]">2. WhatsApp & Consulta por QR Code</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  O cliente escaneia o QR Code do comprovante pelo celular e vê fotos do conserto, peças trocadas e termo de garantia, aprovando o orçamento com 1 toque.
                </p>
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] hover:from-white/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] focus-within:ring-1 focus-within:ring-white/20 shadow-lg">
              <div className="rounded-[15px] bg-[#121215] p-6 space-y-4 h-full">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <Boxes className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white -tracking-[0.02em]">3. Estoque com Alerta de Ruptura</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  Previsão matemática de esgotamento de telas e baterias com base nas vendas dos últimos 30 dias. Geração de pedido de compra automático para fornecedores.
                </p>
              </div>
            </div>

            {/* Pilar 4 */}
            <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] hover:from-white/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] focus-within:ring-1 focus-within:ring-white/20 shadow-lg">
              <div className="rounded-[15px] bg-[#121215] p-6 space-y-4 h-full">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white -tracking-[0.02em]">4. AI Mentor de Gestão</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  Inteligência artificial nativa que atua como seu conselheiro financeiro: redige orçamentos persuasivos, audita suas despesas e avisa onde cortar custos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabela Comparativa */}
      <section id="comparativo" className="py-24 max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Comparativo Direto
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] tracking-tight">
            Por que trocar o caderno ou sistemas antigos pelo TorxOS?
          </h2>
        </div>

        <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] shadow-xl overflow-hidden">
          <div className="rounded-[15px] bg-[#121215] overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-400 text-[11px] uppercase tracking-wider">
                  <th className="py-4 px-5">Funcionalidade / Capacidade</th>
                  <th className="py-4 px-4 text-center text-zinc-500 font-medium">Caderno / Planilhas</th>
                  <th className="py-4 px-4 text-center text-zinc-500 font-medium">Sistemas Antigos</th>
                  <th className="py-4 px-4 text-center text-zinc-100 font-bold bg-white/[0.04] border-x border-white/[0.06]">
                    TorxOS PRO
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-zinc-300 font-normal">
                <tr>
                  <td className="py-4 px-5 font-semibold text-white">Acompanhamento de OS pelo cliente via WhatsApp</td>
                  <td className="py-4 px-4 text-center text-zinc-600"><X className="w-4 h-4 mx-auto" /></td>
                  <td className="py-4 px-4 text-center text-zinc-600"><X className="w-4 h-4 mx-auto" /></td>
                  <td className="py-4 px-4 text-center bg-white/[0.02] border-x border-white/[0.06] text-emerald-400 font-semibold"><Check className="w-4 h-4 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-5 font-semibold text-white">Previsão de Ruptura de Estoque com IA</td>
                  <td className="py-4 px-4 text-center text-zinc-600"><X className="w-4 h-4 mx-auto" /></td>
                  <td className="py-4 px-4 text-center text-zinc-600"><X className="w-4 h-4 mx-auto" /></td>
                  <td className="py-4 px-4 text-center bg-white/[0.02] border-x border-white/[0.06] text-emerald-400 font-semibold"><Check className="w-4 h-4 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-5 font-semibold text-white">Cálculo de Margem Líquida e DRE em Tempo Real</td>
                  <td className="py-4 px-4 text-center text-zinc-600"><X className="w-4 h-4 mx-auto" /></td>
                  <td className="py-4 px-4 text-center text-zinc-500">Complexo</td>
                  <td className="py-4 px-4 text-center bg-white/[0.02] border-x border-white/[0.06] text-emerald-400 font-semibold"><Check className="w-4 h-4 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-5 font-semibold text-white">Impressão Térmica de OS com QR Code</td>
                  <td className="py-4 px-4 text-center text-zinc-600"><X className="w-4 h-4 mx-auto" /></td>
                  <td className="py-4 px-4 text-center text-zinc-400"><Check className="w-4 h-4 mx-auto" /></td>
                  <td className="py-4 px-4 text-center bg-white/[0.02] border-x border-white/[0.06] text-emerald-400 font-semibold"><Check className="w-4 h-4 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-5 font-semibold text-white">Mentor Virtual com IA para Orçamentos e Gestão</td>
                  <td className="py-4 px-4 text-center text-zinc-600"><X className="w-4 h-4 mx-auto" /></td>
                  <td className="py-4 px-4 text-center text-zinc-600"><X className="w-4 h-4 mx-auto" /></td>
                  <td className="py-4 px-4 text-center bg-white/[0.02] border-x border-white/[0.06] text-emerald-400 font-semibold"><Check className="w-4 h-4 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-5 font-semibold text-white">Interface Rápida e 100% na Nuvem (sem instalar nada)</td>
                  <td className="py-4 px-4 text-center text-zinc-600"><X className="w-4 h-4 mx-auto" /></td>
                  <td className="py-4 px-4 text-center text-zinc-500">Lento / Local</td>
                  <td className="py-4 px-4 text-center bg-white/[0.02] border-x border-white/[0.06] text-emerald-400 font-semibold"><Check className="w-4 h-4 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Planos e Preços (Pricing Funnel - Bento Top-Light & Contenção Cromática) */}
      <section id="precos" className="py-24 bg-white/[0.015] border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
              Planos Transparentes
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] tracking-tight">
              Investimento que se paga logo na primeira semana
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal">
              Comece com 7 dias grátis. Só pague quando tiver certeza que a sua oficina está mais rápida e organizada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Plano STARTER - Bento Top-Light com Hover Elevation */}
            <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] hover:from-white/25 focus-within:ring-1 focus-within:ring-white/20">
              <div className="rounded-[15px] bg-[#121215] p-7 flex flex-col justify-between space-y-6 h-full">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white -tracking-[0.02em]">STARTER</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Ideal para técnicos autônomos e oficinas individuais.</p>
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-sm text-zinc-400">R$</span>
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">97</span>
                    <span className="text-xs text-zinc-400">/mês</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-zinc-300 pt-3 border-t border-white/[0.06] font-normal">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Até 2 usuários inclusos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Ordens de Serviço Ilimitadas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Impressão Térmica de OS</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Controle Básico de Estoque</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Controle de Caixa Diário</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleCtaClick("STARTER")}
                  className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] hover:border-white/[0.15] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] font-semibold text-xs transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 cursor-pointer"
                >
                  Começar no Starter
                </button>
              </div>
            </div>

            {/* Plano PRO (Destaque VIP - Top-Light Dourado Refinado & Botão Sólido com Inner Shadow) */}
            <div className="rounded-2xl p-px bg-gradient-to-b from-[#E2A336]/40 via-white/[0.08] to-white/[0.02] shadow-2xl relative transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-12px_rgba(226,163,54,0.18)] hover:from-[#E2A336]/60">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#E2A336]/15 border border-[#E2A336]/40 text-[#E2A336] font-mono text-[10px] font-semibold uppercase tracking-wider">
                Mais Escolhido
              </div>
              <div className="rounded-[15px] bg-[#141418] p-7 flex flex-col justify-between space-y-6 h-full">
                <div className="space-y-4 pt-1">
                  <div>
                    <h3 className="text-base font-bold text-white -tracking-[0.02em]">PRO</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Para lojas e bancadas em crescimento que exigem automação total.</p>
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-sm text-zinc-400">R$</span>
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">197</span>
                    <span className="text-xs text-zinc-400">/mês</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-zinc-300 pt-3 border-t border-white/[0.06] font-normal">
                    <li className="flex items-center gap-2 font-medium text-white">
                      <Check className="w-4 h-4 text-[#E2A336] shrink-0" />
                      <span>Tudo do Starter +</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#E2A336] shrink-0" />
                      <span>Até 5 usuários / técnicos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#E2A336] shrink-0" />
                      <span>Consulta de OS Online com QR Code</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#E2A336] shrink-0" />
                      <span>Previsão de Ruptura de Estoque</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#E2A336] shrink-0" />
                      <span>DRE & Conciliação Pix Automática</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-zinc-200">
                      <Sparkles className="w-4 h-4 text-[#E2A336] shrink-0" />
                      <span>AI Mentor de Gestão Integrado</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleCtaClick("PRO")}
                  className="w-full py-3.5 rounded-xl bg-[#E2A336] hover:bg-[#EBB048] text-[#14120E] font-semibold text-xs -tracking-[0.01em] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_20px_-4px_rgba(226,163,54,0.3)] border border-[#EBB048]/60 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A336]/50 cursor-pointer"
                >
                  Testar Plano PRO 7 Dias Grátis
                </button>
              </div>
            </div>

            {/* Plano ENTERPRISE - Bento Top-Light com Hover Elevation */}
            <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] hover:from-white/25 focus-within:ring-1 focus-within:ring-white/20">
              <div className="rounded-[15px] bg-[#121215] p-7 flex flex-col justify-between space-y-6 h-full">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white -tracking-[0.02em]">ENTERPRISE</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Para redes de lojas, franquias e centros de reparo avançado.</p>
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-sm text-zinc-400">R$</span>
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">347</span>
                    <span className="text-xs text-zinc-400">/mês</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-zinc-300 pt-3 border-t border-white/[0.06] font-normal">
                    <li className="flex items-center gap-2 font-medium text-white">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Tudo do PRO +</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Usuários Ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Multi-Unidades / Filiais</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Comissionamento Avançado de Técnicos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Gerente de Contas Dedicado</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Suporte VIP Prioritário no WhatsApp</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleCtaClick("ENTERPRISE")}
                  className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] hover:border-white/[0.15] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] font-semibold text-xs transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 cursor-pointer"
                >
                  Começar no Enterprise
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos / Prova Social Real com Fotos Reais Monocromáticas/Duotone & Hover Elevation */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Depoimentos Reais
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] tracking-tight">
            O que dizem os donos de bancada que usam o TorxOS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Depoimento 1 */}
          <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] hover:from-white/25">
            <div className="rounded-[15px] bg-[#121215] p-6 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-[#E2A336] gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#E2A336] text-[#E2A336]" />
                  ))}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic font-normal">
                  "Antes eu usava planilha e caderno. Toda semana sumia tela de iPhone ou bateria. Com o TorxOS, o controle de estoque é cirúrgico e os clientes adoram receber o link do conserto pelo WhatsApp."
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.06] flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
                  alt="Marcos Vinícius"
                  className="w-10 h-10 rounded-full object-cover grayscale contrast-125 border border-white/15 ring-2 ring-white/5 shadow-inner shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5 truncate">
                    <span>Marcos Vinícius</span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.06] px-1.5 py-0.2 rounded border border-white/10 font-normal shrink-0">
                      ✓ Ativo
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">iFix Celulares • Campinas/SP</div>
                </div>
              </div>
            </div>
          </div>

          {/* Depoimento 2 */}
          <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] hover:from-white/25">
            <div className="rounded-[15px] bg-[#121215] p-6 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-[#E2A336] gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#E2A336] text-[#E2A336]" />
                  ))}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic font-normal">
                  "O AI Mentor me ajudou a parar de cobrar barato nos reparos de placa. Hoje sei exatamente meu custo e aumentei meu faturamento em quase 40% em 3 meses de uso."
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.06] flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80"
                  alt="Rodrigo Albuquerque"
                  className="w-10 h-10 rounded-full object-cover grayscale contrast-125 border border-white/15 ring-2 ring-white/5 shadow-inner shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5 truncate">
                    <span>Rodrigo Albuquerque</span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.06] px-1.5 py-0.2 rounded border border-white/10 font-normal shrink-0">
                      ✓ Ativo
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">TechPoint Assistência • Belo Horizonte/MG</div>
                </div>
              </div>
            </div>
          </div>

          {/* Depoimento 3 */}
          <div className="rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/[0.05] to-white/[0.02] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] hover:from-white/25">
            <div className="rounded-[15px] bg-[#121215] p-6 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-[#E2A336] gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#E2A336] text-[#E2A336]" />
                  ))}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic font-normal">
                  "A impressão térmica com QR Code para colar no aparelho é sensacional. O cliente não fica ligando para saber se o aparelho está pronto, ele olha no link do QR Code direto."
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.06] flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
                  alt="Camila Fagundes"
                  className="w-10 h-10 rounded-full object-cover grayscale contrast-125 border border-white/15 ring-2 ring-white/5 shadow-inner shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5 truncate">
                    <span>Camila Fagundes</span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.06] px-1.5 py-0.2 rounded border border-white/10 font-normal shrink-0">
                      ✓ Ativo
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">SmartLab Consertos • Curitiba/PR</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Interativo */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Tire Suas Dúvidas
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white -tracking-[0.03em] tracking-tight">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Preciso cadastrar cartão de crédito para testar?",
              a: "Não! Você se cadastra em menos de 1 minuto apenas com os dados da sua loja e já tem acesso total ao sistema por 7 dias grátis. Sem pegadinhas.",
            },
            {
              q: "Funciona em qualquer computador ou impressora?",
              a: "Sim. O TorxOS roda 100% na nuvem no navegador (Google Chrome, Edge, Safari) no Windows, Mac ou celular. Suporta qualquer impressora térmica padrão (58mm e 80mm) e impressoras convencionais A4.",
            },
            {
              q: "Posso importar os dados do meu sistema antigo?",
              a: "Sim, oferecemos suporte para importação de planilhas de clientes e produtos/peças para que você não precise começar do zero.",
            },
            {
              q: "Como meus clientes consultam o status da OS pelo celular?",
              a: "Ao imprimir a entrada da OS ou enviar pelo WhatsApp, é gerado um link seguro exclusivo com QR Code. O cliente acessa, vê as fotos do aparelho, laudo e pode até aprovar o orçamento.",
            },
            {
              q: "Se eu não gostar, como cancelo?",
              a: "O cancelamento é feito com 1 clique direto no painel, sem multas, contratos de fidelidade ou burocracia.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="rounded-xl p-px bg-gradient-to-b from-white/10 via-white/[0.04] to-white/[0.01] overflow-hidden transition"
            >
              <div className="rounded-[11px] bg-[#121215]">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-semibold text-white hover:text-zinc-300 cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180 text-zinc-200" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-white/[0.04] pt-2 font-normal">
                    {item.a}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final Refinado - Contenção Cromática & Inner Shadow */}
      <section className="py-24 border-t border-white/[0.08] bg-white/[0.01]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white -tracking-[0.03em] tracking-tight">
            Pronto para transformar sua assistência técnica em uma máquina de lucro?
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto font-normal">
            Junte-se a mais de 1.200 assistências em todo o país. Comece agora seus 7 dias de teste sem nenhum compromisso.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleCtaClick("PRO")}
              className="px-8 py-4 rounded-xl bg-[#E2A336] hover:bg-[#EBB048] text-[#14120E] font-semibold text-sm -tracking-[0.01em] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_30px_-8px_rgba(226,163,54,0.35)] border border-[#EBB048]/60 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mx-auto"
            >
              <span>Criar Minha Conta Grátis (7 Dias)</span>
              <ArrowRight className="w-4 h-4 text-[#14120E]" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-xs text-zinc-500 bg-[#08080A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TorxLogo size={24} />
            <span className="font-bold text-zinc-300">Torx<span className="text-[#E2A336]">OS</span></span>
            <span>• Operating System for Tech Services © {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-zinc-300 transition">
              Acesso ao Sistema
            </Link>
            <Link href="/cadastrar" className="hover:text-zinc-300 transition">
              Criar Conta
            </Link>
            <a
              href="https://wa.me/5561992295814?text=Olá! Gostaria de tirar dúvidas sobre o sistema TorxOS"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp de Atendimento
            </a>
          </div>
        </div>
      </footer>

      {/* Ponto de Contato Flutuante Discreto: Suporte & Migração de Dados (Número oculto visualmente) */}
      <a
        href="https://wa.me/5561992295814?text=Olá!%20Estou%20na%20página%20do%20TorxOS%20e%20gostaria%20de%20tirar%20dúvidas%20técnicas%20sobre%20migração%20de%20dados%20e%20implantação."
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackConversion("ContactWhatsAppMigration")}
        aria-label="Fale no WhatsApp sobre migração de dados e suporte técnico"
        className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#121215]/95 backdrop-blur-md border border-white/[0.12] hover:border-emerald-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_12px_36px_rgba(16,185,129,0.15)]"
      >
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 group-hover:bg-emerald-500/20 transition">
          <MessageCircle className="w-4 h-4 fill-emerald-400/20" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        </div>
        <div className="flex flex-col text-left pr-1">
          <span className="text-[11px] font-semibold text-white -tracking-[0.01em] group-hover:text-emerald-300 transition">
            Dúvidas sobre Migração?
          </span>
          <span className="text-[9px] text-zinc-400">
            Falar no WhatsApp
          </span>
        </div>
      </a>
    </div>
  );
}
