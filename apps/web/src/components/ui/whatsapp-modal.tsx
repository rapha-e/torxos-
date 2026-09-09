"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Copy, Check, Sparkles, Phone, ExternalLink, X } from "lucide-react";
import { getCurrentUser } from "@/lib/api";

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientPhone: string;
  deviceModel: string;
  publicToken: string;
  osNumber: number | string;
  netTotal: number;
  initialTemplate?: "QUOTE" | "READY" | "ENTRY";
}

export function WhatsAppNotificationModal({
  isOpen,
  onClose,
  clientName,
  clientPhone,
  deviceModel,
  publicToken,
  osNumber,
  netTotal,
  initialTemplate = "QUOTE",
}: WhatsAppModalProps) {
  const [template, setTemplate] = useState<"QUOTE" | "READY" | "ENTRY">(initialTemplate);
  const [copied, setCopied] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const currentUser = typeof window !== "undefined" ? getCurrentUser() : null;
  const storeName = currentUser?.tenantName ? `da ${currentUser.tenantName}` : "da nossa assistência técnica";

  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || "https://torxos.com.br");
  const publicUrl = `${origin}/status/${publicToken}`;
  const cleanPhone = (clientPhone || "").replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  // Mensagens padrão para cada etapa
  const defaultMessages = {
    QUOTE: `Olá, ${clientName}! Aqui é da equipe técnica ${storeName}. 👋\n\nConcluímos o diagnóstico do seu *${deviceModel}* (OS #${osNumber}).\n\nO laudo técnico detalhado e os valores das peças originais já estão disponíveis para você revisar e aprovar em 1 clique pelo link seguro:\n👉 ${publicUrl}\n\nValor total: *R$ ${(Number(netTotal) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}* com garantia legal assegurada.\n\nQualquer dúvida, estamos à total disposição por aqui!`,
    READY: `Olá, ${clientName}! Boas notícias! 🎉\n\nO serviço no seu *${deviceModel}* (OS #${osNumber}) foi concluído com sucesso e passou por todos os testes de qualidade.\n\nO aparelho já está pronto para retirada em nosso balcão.\n\nVocê pode consultar o laudo final e recibo em:\n👉 ${publicUrl}\n\nAguardamos sua visita!`,
    ENTRY: `Olá, ${clientName}! Seu *${deviceModel}* acabou de dar entrada em nosso laboratório técnico sob a OS #${osNumber}.\n\nVocê pode acompanhar em tempo real cada etapa do reparo por este link exclusivo:\n👉 ${publicUrl}\n\nAssim que o laudo e orçamento forem concluídos, enviaremos os detalhes para você. Obrigado pela confiança!`,
  };

  const [customMessage, setCustomMessage] = useState<string>(defaultMessages[initialTemplate] || defaultMessages.QUOTE);

  React.useEffect(() => {
    if (isOpen) {
      setTemplate(initialTemplate);
      setCustomMessage(defaultMessages[initialTemplate] || defaultMessages.QUOTE);
    }
  }, [initialTemplate, isOpen]);

  if (!isOpen) return null;

  const handleTemplateChange = (newTemplate: "QUOTE" | "READY" | "ENTRY") => {
    setTemplate(newTemplate);
    setCustomMessage(defaultMessages[newTemplate]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encodedText = encodeURIComponent(customMessage);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;
    window.open(waUrl, "_blank");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#EBEBE8] shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#EBEBE8] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#181816]">Notificação WhatsApp</h3>
              <p className="text-xs text-[#787774]">Disparo de status para {clientName} ({clientPhone})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#787774] hover:bg-[#F5F5F2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seleção de Template */}
        <div>
          <label className="block text-xs font-semibold text-[#181816] mb-2">Selecione o Modelo de Mensagem</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleTemplateChange("QUOTE")}
              className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                template === "QUOTE"
                  ? "bg-[#181816] text-white border-[#181816]"
                  : "bg-[#FAF9F6] text-[#787774] border-[#E5E5E0] hover:bg-[#F5F5F2]"
              }`}
            >
              Orçamento
            </button>
            <button
              type="button"
              onClick={() => handleTemplateChange("READY")}
              className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                template === "READY"
                  ? "bg-[#181816] text-white border-[#181816]"
                  : "bg-[#FAF9F6] text-[#787774] border-[#E5E5E0] hover:bg-[#F5F5F2]"
              }`}
            >
              Pronto Retirada
            </button>
            <button
              type="button"
              onClick={() => handleTemplateChange("ENTRY")}
              className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                template === "ENTRY"
                  ? "bg-[#181816] text-white border-[#181816]"
                  : "bg-[#FAF9F6] text-[#787774] border-[#E5E5E0] hover:bg-[#F5F5F2]"
              }`}
            >
              Entrada / Triagem
            </button>
          </div>
        </div>

        {/* Caixa de Texto Editável */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-[#787774]">Texto da Mensagem (com link de aprovação em 1 clique):</span>
            <span className="text-[11px] text-[#A8A7A1]">{customMessage.length} caracteres</span>
          </div>
          <textarea
            rows={7}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-3 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-xl text-[#181816] focus:outline-none focus:ring-1 focus:ring-[#181816] font-sans leading-relaxed"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-2 border-t border-[#EBEBE8]">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl border border-[#E5E5E0] text-xs font-medium text-[#181816] hover:bg-[#F7F7F4] flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#787774]" />
                Copiar Texto
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#787774] hover:bg-[#F5F5F2] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Abrir e Enviar no WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
