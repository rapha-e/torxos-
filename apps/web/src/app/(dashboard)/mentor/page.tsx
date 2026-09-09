"use client";

import Link from "next/link";
import {
  Bot,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PlanGate } from "@/components/ui/plan-gate";

const PILARES = [
  {
    id: "REVENUE",
    num: "Pilar 1",
    title: "Aumentar Faturamento",
    desc: "Estratégias de reativação de clientes inativos há mais de 6 meses, recuperação de orçamentos reprovados e elevação do ticket médio de balcão.",
    icon: TrendingUp,
    badge: "+ Faturamento",
    example: "Identificação de 38 clientes com serviços de tela feitos há 8 meses para oferta preventiva.",
  },
  {
    id: "PROFIT",
    num: "Pilar 2",
    title: "Entender Seu Lucro",
    desc: "Análise profunda da margem de contribuição por tipo de reparo técnico, comissões pagas e custos ocultos de bancada.",
    icon: DollarSign,
    badge: "Margem Real",
    example: "Detecção de serviços com margem abaixo de 10% devido a tempo excessivo de bancada.",
  },
  {
    id: "ROUTINE",
    num: "Pilar 3",
    title: "Organização da Rotina",
    desc: "Diagnóstico de gargalos no Kanban, filas de triagem paradas e balanceamento de carga de trabalho entre técnicos especialistas.",
    icon: Clock,
    badge: "Eficiência",
    example: "Alerta de aparelhos parados em avaliação há mais de 40h para redistribuição imediata.",
  },
  {
    id: "FINANCE",
    num: "Pilar 4",
    title: "Gestão Financeira",
    desc: "Controle preditivo de liquidez, projeção de duplicatas a pagar versus recebíveis de cartão e conciliação de caixas.",
    icon: Target,
    badge: "Fluxo & Caixa",
    example: "Antecipação de déficit financeiro com ação sugerida de desconto para quitação via PIX.",
  },
  {
    id: "MARKETING",
    num: "Pilar 5",
    title: "Atendimento e Marketing",
    desc: "Geração de copywriting persuasivo para WhatsApp, quebra de objeções de preço e scripts de pós-venda para fidelização.",
    icon: Zap,
    badge: "Conversão",
    example: "Geração instantânea de mensagem destacando garantia estendida e peças de procedência.",
  },
];

export default function MentorOverviewPage() {
  return (
    <PlanGate feature="canUseAiMentor">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Top Banner */}
        <div className="evorix-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F3EF] border border-[rgba(28,25,23,0.06)] text-[#1C1C1A] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" strokeWidth={1.75} />
              <span>Copiloto Executivo C-Level</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1C1C1A]">
              Centro de Comando dos 5 Pilares
            </h2>
            <p className="text-xs text-[#71716C] leading-relaxed">
              O <strong>TorxOS AI Mentor</strong> monitora continuamente as métricas da sua loja. Conectado ao banco de dados relacional e à inteligência artificial avançada, ele orienta decisões estratégicas para maximizar a lucratividade.
            </p>
          </div>

          <Link
            href="/mentor/chat"
            className="px-4 py-2 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium text-xs flex items-center gap-2 shadow-sm transition shrink-0 self-start md:self-auto"
          >
            <Bot className="w-4 h-4 text-amber-200" strokeWidth={1.75} />
            <span>Abrir Conversa Direta</span>
          </Link>
        </div>

        {/* Grid dos 5 Pilares em Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILARES.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className="evorix-card evorix-card-hover p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl bg-[#F3F3EF] flex items-center justify-center border border-[rgba(28,25,23,0.06)]">
                      <Icon className="w-4 h-4 text-[#1C1C1A]" strokeWidth={1.75} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#71716C] bg-[#F3F3EF] px-2 py-0.5 rounded">
                      {p.num}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#1C1C1A] text-sm mb-1">{p.title}</h3>
                  <p className="text-xs text-[#71716C] leading-relaxed mb-4">{p.desc}</p>

                  <div className="p-3 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] text-[11px] text-[#71716C]">
                    <strong className="text-[#1C1C1A] block mb-0.5 font-semibold">Exemplo Prático:</strong>
                    {p.example}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-[rgba(28,25,23,0.07)]">
                  <Link
                    href="/mentor/chat"
                    className="w-full py-2 rounded-xl bg-[#F3F3EF] hover:bg-[#EBEAE5] text-[#1C1C1A] text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-[rgba(28,25,23,0.06)]"
                  >
                    <span>Consultar sobre este Pilar</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#1C1C1A]" strokeWidth={1.75} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PlanGate>
  );
}
