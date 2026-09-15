"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  HelpCircle, 
  X, 
  MessageCircle, 
  Wrench, 
  Lightbulb, 
  Building2, 
  User, 
  Send,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { getCurrentUser } from "@/lib/api";

const SUPPORT_WHATSAPP_NUMBER = "5561992295814";

export function SupportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [ticketType, setTicketType] = useState<"DUVIDA" | "MANUTENCAO">("DUVIDA");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const pathname = usePathname();

  const user = getCurrentUser();
  const operatorName = user?.name || "Operador Não Identificado";
  const operatorEmail = user?.email || "";
  const companyName = user?.tenantName || "Assistência Técnica";

  const handleOpen = () => {
    setErrorMsg("");
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage("");
    setErrorMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg("Por favor, descreva brevemente a sua solicitação.");
      return;
    }

    const typeLabel =
      ticketType === "DUVIDA"
        ? "💡 DÚVIDA OPERACIONAL"
        : "🛠️ MANUTENÇÃO / AJUSTE NO SISTEMA";

    const formattedMessage = [
      `*🚨 SOLICITAÇÃO DE SUPORTE — TORXOS*`,
      `*Tipo:* ${typeLabel}`,
      `*Empresa:* ${companyName}`,
      `*Operador:* ${operatorName} (${operatorEmail})`,
      `*Página de Origem:* ${pathname}`,
      `---------------------------------------`,
      `*Mensagem:*`,
      message.trim(),
    ].join("\n");

    const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      formattedMessage
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    handleClose();
  };

  return (
    <>
      {/* Botão Flutuante de Fácil Acesso (Bottom Right) */}
      <div className="fixed bottom-5 right-5 z-50 no-print print:hidden">
        <button
          type="button"
          onClick={handleOpen}
          className="group flex items-center gap-2 px-4 py-3 rounded-full bg-[#181816] text-white shadow-2xl hover:bg-[#2B2A27] transition-all duration-200 border border-amber-400/30 hover:scale-105 cursor-pointer"
          title="Precisa de Ajuda? Fale com o Suporte Oficial TorxOS"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <span className="text-xs font-bold tracking-tight">Suporte Técnico</span>
        </button>
      </div>

      {/* Modal de Suporte */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#EBEBE8] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header com Identidade */}
            <div className="px-6 py-5 bg-[#FAF9F6] border-b border-[#EBEBE8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#181816] flex items-center justify-center text-amber-300 shadow-sm">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#181816] tracking-tight">
                    Central de Suporte & Atendimento
                  </h3>
                  <p className="text-[11px] text-[#787774]">
                    Canal direto com o suporte de engenharia TorxOS via WhatsApp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#787774] hover:text-[#181816] hover:bg-[#EBEBE8] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Informações Automáticas de Empresa e Operador */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#EBEBE8]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#A8A7A1] tracking-wider block">
                    Empresa / Assistência
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-[#181816] truncate">
                    <Building2 className="w-3.5 h-3.5 text-[#787774] shrink-0" />
                    <span className="truncate">{companyName}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#A8A7A1] tracking-wider block">
                    Operador Logado
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-[#181816] truncate">
                    <User className="w-3.5 h-3.5 text-[#787774] shrink-0" />
                    <span className="truncate">{operatorName}</span>
                  </div>
                </div>
              </div>

              {/* Tipo de Chamado: Dúvida ou Manutenção */}
              <div>
                <label className="block text-xs font-bold text-[#181816] mb-1.5">
                  Qual é o objetivo do contato? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTicketType("DUVIDA")}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      ticketType === "DUVIDA"
                        ? "bg-amber-50/70 border-amber-400 text-amber-950 font-bold shadow-xs ring-1 ring-amber-400"
                        : "bg-[#FAF9F6] border-[#EBEBE8] text-[#787774] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Dúvida Operacional</span>
                    </div>
                    <span className="text-[10px] font-normal text-[#787774]">
                      Como usar funcionalidades, relatórios ou cadastros.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTicketType("MANUTENCAO")}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      ticketType === "MANUTENCAO"
                        ? "bg-rose-50/70 border-rose-400 text-rose-950 font-bold shadow-xs ring-1 ring-rose-400"
                        : "bg-[#FAF9F6] border-[#EBEBE8] text-[#787774] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Wrench className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Manutenção no Sistema</span>
                    </div>
                    <span className="text-[10px] font-normal text-[#787774]">
                      Erros, travamentos ou comportamento inesperado.
                    </span>
                  </button>
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#181816]">
                    Descreva o que está acontecendo *
                  </label>
                  <span className="text-[10px] text-[#A8A7A1] font-mono">
                    Tela: {pathname}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    ticketType === "DUVIDA"
                      ? "Ex.: Gostaria de entender como configurar a comissão do técnico para peças..."
                      : "Ex.: O cadastro de produtos não exibiu a tela ao clicar em salvar..."
                  }
                  className="w-full p-3 rounded-2xl bg-[#FAF9F6] border border-[#EBEBE8] text-xs text-[#181816] placeholder:text-[#A8A7A1] focus:bg-white focus:outline-none focus:border-[#181816] transition resize-none"
                  required
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Rodapé e Ações */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#EBEBE8]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#787774] hover:text-[#181816] hover:bg-[#FAF9F6] transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition hover:shadow cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Chamado via WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
