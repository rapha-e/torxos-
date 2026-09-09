"use client";

import React, { useState } from "react";
import { 
  QrCode, 
  Copy, 
  Check, 
  ShieldCheck, 
  Zap, 
  Clock, 
  X, 
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { QrCodeView } from "@/components/ui/qr-code-view";
import { generatePixBrCode } from "@/lib/pix";

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  orderNumber?: number | string;
  pixKey?: string;
  merchantName?: string;
  onPaymentConfirmed?: () => void;
}

export function PixPaymentModal({
  isOpen,
  onClose,
  amount,
  description,
  orderNumber,
  pixKey = "12.345.678/0001-99", // CNPJ padrão da loja
  merchantName = "TorxOS TECH CENTER",
  onPaymentConfirmed,
}: PixPaymentModalProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [paidSuccess, setPaidSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const pixData = generatePixBrCode({
    pixKey,
    merchantName,
    merchantCity: "SAO PAULO",
    amount,
    txId: orderNumber ? `OS${orderNumber}` : `EVO${Date.now().toString().slice(-6)}`,
    description: `OS #${orderNumber} ${description}`,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(pixData.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSimulateConfirmation = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setPaidSuccess(true);
      if (onPaymentConfirmed) onPaymentConfirmed();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#EBEBE8] shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EBEBE8] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Zap className="w-4 h-4 fill-emerald-600 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#181816]">Pagamento Instantâneo via PIX</h3>
              <p className="text-xs text-[#787774]">Compensação em segundos sem taxas</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#787774] hover:text-[#181816]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {paidSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-emerald-950">Pagamento Confirmado!</h4>
            <p className="text-xs text-[#787774] max-w-xs mx-auto">
              O valor de <strong>{pixData.formattedAmount}</strong> foi compensado com sucesso no sistema.
            </p>
            <div className="pt-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#181816] text-white text-xs font-semibold hover:bg-[#282824]"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Valor em Destaque */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8] text-center">
              <span className="text-xs text-[#787774] block">Valor a Pagar:</span>
              <span className="text-3xl font-extrabold text-[#181816] tracking-tight tabular-nums block mt-0.5">
                {pixData.formattedAmount}
              </span>
              <span className="text-[11px] text-[#787774] mt-1 block">
                {orderNumber ? `Referente à Ordem de Serviço #${orderNumber}` : description}
              </span>
            </div>

            {/* QR Code Centralizado */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 bg-white rounded-2xl border-2 border-[#181816] shadow-sm">
                <QrCodeView value={pixData.brCode} size={170} />
              </div>
              <p className="text-xs font-medium text-[#181816] mt-2">
                Aponte a câmera do aplicativo do seu banco
              </p>
              <p className="text-[10px] text-[#787774]">Válido para Nubank, Itaú, Bradesco, Inter, BB, etc.</p>
            </div>

            {/* Código Copia e Cola */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#787774] uppercase tracking-wide">
                PIX Copia e Cola
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixData.brCode}
                  className="flex-1 px-3 py-2 text-[11px] font-mono bg-[#FAF9F6] border border-[#E5E5E0] rounded-xl text-[#555] truncate focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl bg-[#181816] text-white text-xs font-medium hover:bg-[#282824] transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Detalhes do Recebedor */}
            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8] text-[11px] text-[#555] space-y-1">
              <div className="flex justify-between">
                <span>Beneficiário:</span>
                <strong className="text-[#181816]">{pixData.merchantName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Chave PIX (CNPJ):</span>
                <span className="font-mono">{pixData.pixKey}</span>
              </div>
              <div className="flex justify-between">
                <span>Identificador (TxId):</span>
                <span className="font-mono text-[#787774]">{pixData.txId}</span>
              </div>
            </div>

            {/* Ações Inferiores */}
            <div className="flex items-center justify-between pt-2 border-t border-[#EBEBE8]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-[#E5E5E0] text-xs font-medium text-[#787774] hover:bg-[#F5F5F2]"
              >
                Fechar
              </button>

              <button
                type="button"
                disabled={isConfirming}
                onClick={handleSimulateConfirmation}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isConfirming ? "Confirmando..." : "Confirmar Recebimento"}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
