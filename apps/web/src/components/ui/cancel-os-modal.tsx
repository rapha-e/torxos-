"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  X,
  RotateCcw,
  Smartphone,
  User,
  Ban,
} from "lucide-react";
import { formatCurrency, translateOsStatus } from "@/lib/utils";

interface CancelOsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes: string) => Promise<void>;
  osData: {
    id: string;
    osNumber: number | string;
    clientName?: string;
    deviceModel?: string;
    deviceBrand?: string;
    netTotal?: number | string;
    status?: string;
  } | null;
}

const PRESET_REASONS = [
  "Cliente não aprovou o orçamento (preço / prazo)",
  "Equipamento sem possibilidade técnica de reparo",
  "Cliente desistiu do conserto e solicitou devolução",
  "Aparelho retirado da loja sem autorização de reparo",
  "Outro motivo (especificar abaixo)",
];

export function CancelOsModal({
  isOpen,
  onClose,
  onConfirm,
  osData,
}: CancelOsModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customNotes, setCustomNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !osData) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const fullReason =
        selectedReason === "Outro motivo (especificar abaixo)"
          ? customNotes.trim() || "Cancelado pelo lojista"
          : selectedReason + (customNotes.trim() ? ` - Obs: ${customNotes.trim()}` : "");

      await onConfirm(fullReason, customNotes);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao cancelar a Ordem de Serviço.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[rgba(28,25,23,0.1)] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com tom de Alerta / Atenção */}
        <div className="p-5 border-b border-[rgba(28,25,23,0.08)] bg-[#FFF5F5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5 text-rose-700" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1C1C1A]">
                Cancelar Ordem de Serviço #{osData.osNumber}
              </h3>
              <p className="text-xs text-[#71716C] mt-0.5">
                Esta ação atualizará o status da OS para Cancelada.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71716C] hover:text-[#1C1C1A] hover:bg-rose-100/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Card Resumo do Atendimento */}
          <div className="p-3.5 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#1C1C1A] font-semibold">
                <Smartphone className="w-3.5 h-3.5 text-[#71716C]" />
                <span>
                  {osData.deviceBrand ? `${osData.deviceBrand} ` : ""}
                  {osData.deviceModel || "Equipamento"}
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3F3EF] text-[#71716C] border border-[rgba(28,25,23,0.06)] uppercase">
                {translateOsStatus(osData.status)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#71716C]">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#A1A19B]" />
                <span>{osData.clientName || "Cliente Balcão"}</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-[#1C1C1A]">
                <span>Valor:</span>
                <span className="tabular-nums">
                  {formatCurrency(Number(osData.netTotal || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Alerta de Estorno Automático de Estoque */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2 text-xs text-amber-900">
            <RotateCcw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-semibold">Estorno automático de estoque:</strong> Caso alguma peça tenha sido reservada ou baixada para este reparo, o saldo físico será devolvido automaticamente ao estoque.
            </p>
          </div>

          {/* Seleção de Motivo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#1C1C1A] block">
              Motivo do Cancelamento:
            </label>
            <div className="space-y-1.5">
              {PRESET_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    selectedReason === reason
                      ? "bg-rose-50/60 border-rose-300 font-medium text-rose-950 shadow-xs"
                      : "bg-white hover:bg-[#F9F9F7] border-[rgba(28,25,23,0.08)] text-[#1C1C1A]"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellationReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="accent-rose-700 w-3.5 h-3.5"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Observação Adicional */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#71716C] block">
              Observações / Detalhes adicionais (opcional):
            </label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Ex: Cliente alegou que irá comprar um aparelho novo..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-[#FAFAF8] border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] placeholder:text-[#A1A19B] focus:bg-white focus:outline-none focus:border-rose-300 transition"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="p-4 bg-[#F9F9F7] border-t border-[rgba(28,25,23,0.08)] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.12)] hover:bg-[#F3F3EF] text-xs font-semibold text-[#71716C] transition disabled:opacity-50 cursor-pointer"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{submitting ? "Cancelando OS..." : "Confirmar Cancelamento"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
