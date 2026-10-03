"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  X,
  Sparkles,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Megaphone,
  Check,
  Calendar,
  Tag,
} from "lucide-react";
import {
  OFFICIAL_SYSTEM_UPDATES,
  getReadUpdatesIds,
  markUpdatesAsRead,
  getBroadcastAnnouncements,
  fetchRemoteAnnouncements,
  SystemUpdateItem,
  BroadcastAnnouncement,
} from "@/lib/notifications";

interface SystemNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkedAllRead?: () => void;
}

export function SystemNotificationsModal({
  isOpen,
  onClose,
  onMarkedAllRead,
}: SystemNotificationsModalProps) {
  const [activeTab, setActiveTab] = useState<"UPDATES" | "BROADCASTS">("UPDATES");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastAnnouncement[]>([]);

  useEffect(() => {
    if (isOpen) {
      setReadIds(getReadUpdatesIds());
      setBroadcasts(getBroadcastAnnouncements());
      fetchRemoteAnnouncements().then((remote) => {
        if (Array.isArray(remote) && remote.length > 0) {
          setBroadcasts(remote);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    const allIds = [
      ...OFFICIAL_SYSTEM_UPDATES.map((u) => u.id),
      ...broadcasts.map((b) => b.id),
    ];
    markUpdatesAsRead(allIds);
    setReadIds(allIds);
    if (onMarkedAllRead) {
      onMarkedAllRead();
    }
  };

  const getCategoryBadge = (category: SystemUpdateItem["category"]) => {
    switch (category) {
      case "FEATURE":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
            Novo Recurso
          </span>
        );
      case "SECURITY":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
            Segurança & Estoque
          </span>
        );
      case "IMPROVEMENT":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase">
            Melhoria
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200 uppercase">
            Atualização
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[rgba(28,25,23,0.08)] overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(28,25,23,0.08)] bg-[#FAFAF8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#181816] text-amber-300 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1C1C1A]">
                  Central de Atualizações & Novidades
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-900 border border-amber-400/30">
                  TorxOS v2.5
                </span>
              </div>
              <p className="text-xs text-[#71716C] mt-0.5">
                Acompanhe as melhorias, novos recursos e comunicados para sua assistência técnica.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#71716C] hover:text-[#1C1C1A] hover:bg-[#F3F3EF] transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas e Ação de Marcar como Lidas */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-[rgba(28,25,23,0.06)] bg-white">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("UPDATES")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "UPDATES"
                  ? "bg-[#181816] text-white shadow-xs"
                  : "bg-transparent text-[#71716C] hover:bg-[#F3F3EF] hover:text-[#1C1C1A]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>O que há de novo</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
                {OFFICIAL_SYSTEM_UPDATES.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("BROADCASTS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "BROADCASTS"
                  ? "bg-[#181816] text-white shadow-xs"
                  : "bg-transparent text-[#71716C] hover:bg-[#F3F3EF] hover:text-[#1C1C1A]"
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-600" />
              <span>Comunicados da Plataforma</span>
              {broadcasts.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-mono">
                  {broadcasts.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="text-[11px] font-semibold text-[#71716C] hover:text-[#1C1C1A] flex items-center gap-1 transition cursor-pointer hover:underline"
            title="Marcar todos os alertas como visualizados"
          >
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Marcar lidos</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
          {activeTab === "UPDATES" && (
            <div className="space-y-4">
              {OFFICIAL_SYSTEM_UPDATES.map((update) => {
                const isRead = readIds.includes(update.id);

                return (
                  <div
                    key={update.id}
                    className={`p-4 rounded-xl border transition space-y-2.5 ${
                      !isRead
                        ? "bg-amber-50/30 border-amber-200/90 shadow-2xs"
                        : "bg-white border-[rgba(28,25,23,0.08)] hover:bg-[#FAFAF8]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(update.category)}
                        <span className="text-[11px] font-mono text-[#71716C]">
                          {update.version}
                        </span>
                        {!isRead && (
                          <span className="flex h-2 w-2 relative" title="Novidade não lida">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-[#A1A19B]">
                        <Calendar className="w-3 h-3" />
                        <span>{update.date}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#1C1C1A]">
                        {update.title}
                      </h4>
                      <p className="text-xs text-[#71716C] mt-1 leading-relaxed">
                        {update.summary}
                      </p>
                    </div>

                    {update.highlights && update.highlights.length > 0 && (
                      <div className="pt-2 border-t border-[rgba(28,25,23,0.06)] space-y-1.5">
                        {update.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-[#1C1C1A]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "BROADCASTS" && (
            <div className="space-y-4">
              {broadcasts.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Megaphone className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs font-semibold text-[#1C1C1A]">
                    Nenhum comunicado no momento
                  </p>
                  <p className="text-[11px] text-[#71716C] max-w-sm mx-auto">
                    Avisos gerais da equipe de desenvolvimento ou comunicados do Dono do Software serão exibidos aqui.
                  </p>
                </div>
              ) : (
                broadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 uppercase">
                          Comunicado Oficial
                        </span>
                        <span className="font-semibold text-[#1C1C1A]">{b.author}</span>
                      </div>
                      <span className="text-[11px] text-[#71716C]">{b.date}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#1C1C1A]">{b.title}</h4>
                    <p className="text-xs text-[#71716C] leading-relaxed whitespace-pre-line">
                      {b.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[rgba(28,25,23,0.08)] bg-[#FAFAF8] text-xs text-[#71716C]">
          <span>TorxOS Platform — Atualizações contínuas sem downtime</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#181816] hover:bg-[#2D2D29] text-white text-xs font-semibold transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
