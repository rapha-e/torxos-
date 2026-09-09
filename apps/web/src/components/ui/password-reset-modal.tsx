"use client";

import React, { useState, useEffect } from "react";
import { 
  KeyRound, 
  Check, 
  Copy, 
  MessageSquare, 
  Mail, 
  X, 
  User, 
  Building2, 
  ExternalLink,
  ShieldCheck,
  Phone
} from "lucide-react";

export interface PasswordResetData {
  userName: string;
  userEmail: string;
  phone?: string;
  tenantName?: string;
  tempPassword: string;
}

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PasswordResetData | null;
}

export function PasswordResetModal({ isOpen, onClose, data }: PasswordResetModalProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    if (data?.phone) {
      setPhoneNumber(data.phone);
    } else {
      setPhoneNumber("");
    }
  }, [data]);

  if (!isOpen || !data) return null;

  const appOrigin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "http://localhost:3000";

  const loginUrl = `${appOrigin}/login`;

  const formattedMessage = `Olá, *${data.userName}*! 👋

Sua senha de acesso ao sistema *TorxOS*${data.tenantName ? ` (${data.tenantName})` : ""} foi redefinida pela equipe de suporte.

📌 *DADOS DE ACESSO:*
👤 *Usuário:* ${data.userName}
📧 *E-mail:* ${data.userEmail}
🔑 *Nova Senha:* ${data.tempPassword}
🌐 *Acesso:* ${loginUrl}

🔒 *Recomendação de Segurança:*
Recomendamos alterar sua senha após o primeiro acesso através do menu de configurações da sua conta.`;

  const handleCopyPassword = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(data.tempPassword);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2500);
    }
  };

  const handleCopyMessage = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(formattedMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    const rawPhone = phoneNumber.replace(/\D/g, "");
    const cleanPhone = rawPhone.length === 10 || rawPhone.length === 11 ? `55${rawPhone}` : rawPhone;
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(formattedMessage)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedMessage)}`;
    window.open(url, "_blank");
  };

  const handleSendEmail = () => {
    const subject = `Nova Senha de Acesso — TorxOS (${data.tenantName || "Sua Loja"})`;
    const mailtoUrl = `mailto:${encodeURIComponent(data.userEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(formattedMessage)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E5E0] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho do Modal */}
        <div className="p-5 border-b border-[#EBEBE8] flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#181816] flex items-center gap-1.5">
                Senha Redefinida com Sucesso
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </h3>
              <p className="text-xs text-[#787774]">Envie as novas credenciais diretamente para o usuário</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#787774] hover:text-[#181816] hover:bg-neutral-200/60 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com os Dados do Usuário */}
        <div className="p-6 space-y-4 text-xs">
          {/* Card com Detalhes do Usuário */}
          <div className="p-4 rounded-xl bg-[#F9F9F7] border border-[#EBEBE8] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#EBEBE8]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-600" />
                <span className="text-xs font-bold text-[#181816]">{data.userName}</span>
              </div>
              {data.tenantName && (
                <div className="flex items-center gap-1 text-[11px] text-neutral-600 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="truncate max-w-[150px]">{data.tenantName}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">E-mail de Login</span>
                <span className="font-mono text-neutral-900 font-semibold select-all">{data.userEmail}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Nova Senha Provisória</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-xs text-black bg-white px-2 py-0.5 rounded border border-neutral-300 select-all">
                    {data.tempPassword}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-1 rounded text-neutral-600 hover:text-black hover:bg-neutral-200 transition cursor-pointer"
                    title="Copiar senha"
                  >
                    {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Campo de Telefone / WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#181816] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neutral-600" />
                Número de WhatsApp para Envio:
              </span>
              <span className="text-[10px] text-neutral-500 font-normal">com DDD (ex: 11988887766)</span>
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(11) 98888-7766"
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E0] text-[#181816] font-mono text-xs focus:outline-none focus:border-[#181816]"
            />
          </div>

          {/* Prévia da Mensagem Formatada */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-neutral-500">
                Prévia da Mensagem
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-neutral-700 hover:text-black flex items-center gap-1 transition cursor-pointer"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Mensagem Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[10px] text-neutral-700 font-sans whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed select-all">
              {formattedMessage}
            </pre>
          </div>

          {/* Botões de Ação Imediata (WhatsApp & E-mail) */}
          <div className="pt-3 border-t border-[#EBEBE8] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>Enviar via WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleSendEmail}
              className="py-2.5 px-4 rounded-xl bg-[#181816] hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Enviar por E-mail</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
