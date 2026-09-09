"use client";

import { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  DollarSign,
  Clock,
  MessageSquare,
  ShieldCheck,
  Zap,
  Target,
  User,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { PlanGate } from "@/components/ui/plan-gate";

const PILLARS = [
  { id: "REVENUE", label: "1. Aumentar Faturamento", icon: TrendingUp, desc: "Reativação de clientes, orçamentos reprovados e ticket médio" },
  { id: "PROFIT", label: "2. Entender Seu Lucro", icon: DollarSign, desc: "Margem real por reparo técnico, comissões e custos ocultos" },
  { id: "ROUTINE", label: "3. Organização da Rotina", icon: Clock, desc: "Gargalos de bancada, tempo de triagem e redistribuição" },
  { id: "FINANCE", label: "4. Gestão Financeira", icon: Target, desc: "Fluxo de caixa projetado, títulos a vencer e conciliação" },
  { id: "MARKETING", label: "5. Atendimento & Marketing", icon: Zap, desc: "Copywriting persuasivo para WhatsApp e quebra de objeções" },
];

export default function MentorChatPage() {
  const [selectedPillar, setSelectedPillar] = useState("REVENUE");
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: `### 👋 Olá, Gestor! Sou o TorxOS AI Mentor.

Estou conectado aos dados em tempo real da sua assistência técnica (Ordens de Serviço, DRE de Setembro, fluxo de caixa e estoques).

Selecione um dos **5 Pilares Estratégicos** acima ou me faça qualquer pergunta operacional para receber diagnósticos e cartões de ação práticos.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetchApi("/ai-mentor/consult", {
        method: "POST",
        body: JSON.stringify({
          pillar: selectedPillar,
          prompt: textToSend,
        }),
      });

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: response.response || "Diagnóstico gerado com sucesso pelo copiloto.",
        },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `⚠️ Não foi possível obter resposta no momento: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlanGate feature="canUseAiMentor">
      <div className="max-w-5xl mx-auto space-y-4 flex flex-col h-[calc(100vh-140px)]">
      {/* Top Selector dos 5 Pilares em Action Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#1C1C1A]" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-[#1C1C1A] tracking-tight">
              Mentor Executivo — Seleção de Pilar Estratégico
            </h2>
          </div>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#F3F3EF] text-[#71716C] border border-[rgba(28,25,23,0.06)]">
            TorxOS IA • RAG SQL Conectado
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPillar === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPillar(p.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#181816] border-[#181816] text-white shadow-sm"
                    : "evorix-action-card text-[#71716C] hover:text-[#1C1C1A]"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-amber-300" : "text-[#71716C]"}`} strokeWidth={1.75} />
                  <span className="font-semibold text-[11px] truncate">{p.label}</span>
                </div>
                <p className={`text-[9px] line-clamp-1 ${isSelected ? "text-[#A1A19B]" : "text-[#71716C]"}`}>
                  {p.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Viewport */}
      <div className="flex-1 evorix-card p-6 overflow-y-auto space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 text-xs leading-relaxed ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-[#181816] text-amber-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-3.5 h-3.5" strokeWidth={1.75} />
              </div>
            )}

            <div
              className={`p-4 rounded-xl max-w-2xl ${
                m.role === "user"
                  ? "bg-[#181816] text-white font-medium rounded-tr-none shadow-sm text-xs"
                  : "bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] text-[#1C1C1A] rounded-tl-none font-sans space-y-2 text-xs"
              }`}
            >
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap">{m.content}</p>
              ) : (
                <div className="space-y-2 leading-relaxed">
                  {m.content.split("\n").map((line: string, idx: number) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={idx} className="h-1.5" />;
                    if (trimmed.startsWith("### ")) {
                      return (
                        <h3 key={idx} className="text-[13px] font-bold text-[#1C1C1A] mt-3 mb-1 tracking-tight">
                          {trimmed.replace("### ", "")}
                        </h3>
                      );
                    }
                    if (trimmed.startsWith("#### ")) {
                      return (
                        <h4 key={idx} className="text-xs font-semibold text-[#1C1C1A] mt-2 mb-0.5">
                          {trimmed.replace("#### ", "")}
                        </h4>
                      );
                    }
                    if (trimmed === "---") {
                      return <hr key={idx} className="my-2.5 border-[rgba(28,25,23,0.08)]" />;
                    }
                    if (trimmed.startsWith("> ")) {
                      return (
                        <div
                          key={idx}
                          className="p-3 my-1.5 rounded-lg bg-white border-l-2 border-amber-400 text-xs text-[#2D2D29] italic shadow-[0px_1px_2px_rgba(0,0,0,0.02)] border border-[rgba(28,25,23,0.05)]"
                        >
                          {trimmed.replace(/^>\s*"?/, "").replace(/"?$/, "")}
                        </div>
                      );
                    }
                    if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed)) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-[#444441] pl-1">
                          <span className="text-amber-600 font-bold shrink-0">•</span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: trimmed
                                .replace(/^[•\-]\s*/, "")
                                .replace(/^\d+\.\s*/, "")
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#1C1C1A]">$1</strong>')
                                .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                            }}
                          />
                        </div>
                      );
                    }
                    return (
                      <p
                        key={idx}
                        className="text-xs text-[#444441]"
                        dangerouslySetInnerHTML={{
                          __html: trimmed
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#1C1C1A]">$1</strong>')
                            .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {m.role === "user" && (
              <div className="w-7 h-7 rounded-xl bg-[#F3F3EF] text-[#1C1C1A] flex items-center justify-center shrink-0 mt-0.5 font-semibold text-[10px] border border-[rgba(28,25,23,0.06)]">
                EU
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-[#71716C]">
            <div className="w-7 h-7 rounded-xl bg-[#181816] text-amber-200 flex items-center justify-center animate-pulse">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
            <div className="p-3 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)]">
              <span>Analisando DRE, Kanban e gerando diagnóstico executivo com a IA...</span>
            </div>
          </div>
        )}
      </div>

      {/* Sugestões de Perguntas Rápidas */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 text-[11px]">
        <button
          onClick={() => handleSend("Como posso aumentar a conversão de orçamentos parados na bancada?")}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3F3EF] text-[#71716C] hover:text-[#1C1C1A] border border-[rgba(28,25,23,0.07)] whitespace-nowrap transition shadow-[0px_1px_2px_rgba(0,0,0,0.01)]"
        >
          💡 Aumentar conversão de orçamentos
        </button>
        <button
          onClick={() => handleSend("Quais peças devo comprar hoje para não faltar na semana?")}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3F3EF] text-[#71716C] hover:text-[#1C1C1A] border border-[rgba(28,25,23,0.07)] whitespace-nowrap transition shadow-[0px_1px_2px_rgba(0,0,0,0.01)]"
        >
          📦 Peças com risco iminente
        </button>
        <button
          onClick={() => handleSend("Onde está o maior gargalo de tempo na bancada dos técnicos?")}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3F3EF] text-[#71716C] hover:text-[#1C1C1A] border border-[rgba(28,25,23,0.07)] whitespace-nowrap transition shadow-[0px_1px_2px_rgba(0,0,0,0.01)]"
        >
          ⏱️ Gargalos de tempo da bancada
        </button>
      </div>

      {/* Input Form Executivo */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Consulte o copiloto executivo sobre ${PILLARS.find((p) => p.id === selectedPillar)?.label}...`}
          className="flex-1 px-4 py-3 rounded-xl bg-white border border-[rgba(28,25,23,0.07)] text-xs text-[#1C1C1A] placeholder:text-[#A1A19B] focus:outline-none focus:border-[#181816] shadow-[0px_1px_2px_rgba(0,0,0,0.02)] transition"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white font-medium text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5 text-amber-300" strokeWidth={1.75} />
          <span>Enviar</span>
        </button>
      </form>
    </div>
    </PlanGate>
  );
}
