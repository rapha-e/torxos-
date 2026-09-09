"use client";

import React, { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { getCurrentUser, fetchApi } from "@/lib/api";

export interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  documentType?: string;
}

export interface CompanyProfile {
  tradeName: string;
  legalName?: string;
  document?: string;
  phone?: string;
  email?: string;
  logoUrl?: string | null;
}

export function PrintHeader({ title, subtitle, documentType = "Relatório Gerencial" }: PrintHeaderProps) {
  const [profile, setProfile] = useState<CompanyProfile>(() => {
    if (typeof window === "undefined") {
      return { tradeName: "Assistência Técnica" };
    }
    const cached = localStorage.getItem("torxos_company_profile");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fallback
      }
    }
    const user = getCurrentUser();
    return {
      tradeName: user?.tenantName || "Assistência Técnica",
      email: user?.email || "",
    };
  });

  const [currentDateStr, setCurrentDateStr] = useState<string>("");

  useEffect(() => {
    setCurrentDateStr(
      new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    // Carregar configurações atualizadas do perfil da empresa
    fetchApi("/tenant/settings")
      .then((data) => {
        if (data) {
          const user = getCurrentUser();
          const updated: CompanyProfile = {
            tradeName: data.tradeName || user?.tenantName || "Assistência Técnica",
            legalName: data.legalName || "",
            document: data.document || "",
            phone: data.phone || "",
            email: data.email || user?.email || "",
            logoUrl: data.logoUrl || null,
          };
          setProfile(updated);
          localStorage.setItem("torxos_company_profile", JSON.stringify(updated));
        }
      })
      .catch(() => {
        // Silencioso se offline/erro de rede
      });
  }, []);

  return (
    <div className="hidden print:block border-b-2 border-black pb-3 mb-5 w-full">
      <div className="flex items-start justify-between gap-4">
        {/* Lado Esquerdo: Identificação & Logotipo da Empresa do Perfil */}
        <div className="flex items-center gap-3.5 max-w-[65%]">
          {profile.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt={profile.tradeName}
              className="w-14 h-14 rounded-lg object-contain border border-neutral-300 p-0.5 shrink-0 bg-white"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
              {profile.tradeName ? profile.tradeName.charAt(0).toUpperCase() : <Building2 className="w-6 h-6" />}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-base font-extrabold text-black uppercase tracking-tight truncate">
              {profile.tradeName || "Assistência Técnica"}
            </h1>
            {profile.legalName && profile.legalName !== profile.tradeName && (
              <p className="text-[11px] text-neutral-800 font-medium truncate">
                {profile.legalName}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-neutral-600 font-mono mt-0.5">
              {profile.document && <span>CNPJ/CPF: {profile.document}</span>}
              {profile.document && profile.phone && <span>•</span>}
              {profile.phone && <span>Tel: {profile.phone}</span>}
              {(profile.document || profile.phone) && profile.email && <span>•</span>}
              {profile.email && <span>{profile.email}</span>}
            </div>
          </div>
        </div>

        {/* Lado Direito: Título do Relatório & Data de Emissão */}
        <div className="text-right shrink-0">
          <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300 rounded mb-1">
            {documentType}
          </span>
          <h2 className="text-sm font-bold text-black uppercase">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-neutral-700 font-medium">
              {subtitle}
            </p>
          )}
          <p className="text-[10px] text-neutral-500 font-mono mt-1">
            Emissão: {currentDateStr || "Hoje"}
          </p>
        </div>
      </div>
    </div>
  );
}
