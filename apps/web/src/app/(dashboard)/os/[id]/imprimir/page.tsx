"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Printer, 
  ArrowLeft, 
  QrCode, 
  FileText, 
  Tag, 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone, 
  Building2,
  Calendar,
  User,
  Wrench
} from "lucide-react";
import { fetchApi, getCurrentUser } from "@/lib/api";
import { formatCurrency, translatePriority, translateOsStatus } from "@/lib/utils";
import { QrCodeView } from "@/components/ui/qr-code-view";

export default function PrintServiceOrderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [printFormat, setPrintFormat] = useState<"LABEL" | "THERMAL_80" | "A4">("A4");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchApi(`/service-orders/${id}`);
        setOrder(data);
      } catch (e) {
        console.error("Erro ao carregar OS para impressão:", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#181816] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#787774]">Carregando dados para impressão...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#EBEBE8] max-w-md mx-auto my-12">
        <p className="text-sm font-semibold text-[#181816]">Ordem de Serviço não encontrada.</p>
        <Link href="/os" className="text-xs text-blue-600 underline mt-2 inline-block">
          Voltar para a lista de OS
        </Link>
      </div>
    );
  }

  // Número legível da OS garantido
  const displayOsNumber = order.osNumber || (order.id ? order.id.replace(/^[a-z]+-0*/i, "") : "1042");

  // Itens garantidos: se não houver itens cadastrados mas houver total, sintetiza a linha com o defeito
  const rawItems = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
  const itemsList = rawItems.length > 0
    ? rawItems
    : (Number(order.netTotal) > 0
        ? [{
            id: "fallback-item-1",
            description: `Diagnóstico e Manutenção Especializada - ${order.reportedDefect || "Reparo Técnico de Bancada"}`,
            itemType: "SERVICE",
            quantity: 1,
            unitPrice: Number(order.netTotal),
            totalAmount: Number(order.netTotal),
          }]
        : []);

  const totalServices = itemsList
    .filter((i: any) => i.itemType === "SERVICE")
    .reduce((sum: number, i: any) => sum + Number(i.totalAmount || 0), 0);

  const totalParts = itemsList
    .filter((i: any) => i.itemType === "PRODUCT")
    .reduce((sum: number, i: any) => sum + Number(i.totalAmount || 0), 0);

  const calculatedNetTotal = (totalServices + totalParts) > 0 ? (totalServices + totalParts) : Number(order.netTotal || 0);

  const cachedProfile = typeof window !== "undefined" ? (() => {
    try {
      const c = localStorage.getItem("torxos_company_profile");
      return c ? JSON.parse(c) : null;
    } catch { return null; }
  })() : null;

  const currentUser = typeof window !== "undefined" ? getCurrentUser() : null;

  const tenantInfo = {
    tradeName: order.tenant?.tradeName || cachedProfile?.tradeName || currentUser?.tenantName || "Assistência Técnica",
    legalName: order.tenant?.legalName || cachedProfile?.legalName || "",
    document: order.tenant?.document || cachedProfile?.document || "",
    phone: order.tenant?.phone || cachedProfile?.phone || "",
    email: order.tenant?.email || cachedProfile?.email || "",
    logoUrl: order.tenant?.logoUrl || cachedProfile?.logoUrl || null,
  };

  const appOrigin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || "https://torxos.com.br");
  const publicUrl = `${appOrigin}/status/${order.publicToken || order.id}`;
  const entryDate = new Date(order.createdAt || Date.now()).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Barra de Controle de Impressão (Oculta ao imprimir via CSS @media print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-[#EBEBE8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-[#E5E5E0] hover:bg-[#F5F5F2] text-[#181816] transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#181816]">
                Impressão da OS #{displayOsNumber}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {formatCurrency(calculatedNetTotal)}
              </span>
            </div>
            <p className="text-xs text-[#787774]">
              {order.client?.name || "Cliente Balcão"} • {order.deviceBrand} {order.deviceModel}
            </p>
          </div>
        </div>

        {/* Seleção de Formato */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setPrintFormat("A4")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              printFormat === "A4"
                ? "bg-[#181816] text-white shadow-sm"
                : "border border-[#E5E5E0] bg-[#FAF9F6] text-[#787774] hover:bg-[#F5F5F2]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-300" />
            <span>Ordem Completa (A4)</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintFormat("THERMAL_80")}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              printFormat === "THERMAL_80"
                ? "bg-[#181816] text-white shadow-sm"
                : "border border-[#E5E5E0] bg-[#FAF9F6] text-[#787774] hover:bg-[#F5F5F2]"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Térmica Balcão (80mm)</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintFormat("LABEL")}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              printFormat === "LABEL"
                ? "bg-[#181816] text-white shadow-sm"
                : "border border-[#E5E5E0] bg-[#FAF9F6] text-[#787774] hover:bg-[#F5F5F2]"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Etiqueta Adesiva</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer ml-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir Agora
          </button>
        </div>
      </div>

      {/* ÁREA DE PRÉ-VISUALIZAÇÃO / IMPRESSÃO */}
      <div className="flex justify-center">
        {/* =================================================================== */}
        {/* 1. ETIQUETA ADESIVA COM QR CODE (Para colar na carcaça do aparelho) */}
        {/* =================================================================== */}
        {printFormat === "LABEL" && (
          <div className="print-area bg-white text-black p-4 rounded-xl border border-black/20 shadow-md w-[380px] font-mono text-xs select-none">
            {/* Header Etiqueta */}
            <div className="border-b-2 border-black pb-2 mb-2 flex items-center justify-between">
              <div>
                <span className="font-sans font-black text-lg tracking-tight">TorxOS</span>
                <span className="text-[10px] block font-sans uppercase font-bold text-gray-700">Controle de Bancada</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-sans">#{displayOsNumber}</span>
                <span className="text-[9px] block uppercase text-gray-600 font-bold">{translatePriority(order.priority)}</span>
              </div>
            </div>

            {/* Corpo com Informações e QR Code */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1 leading-tight">
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-600 block">Cliente:</span>
                  <p className="font-bold text-[13px] font-sans truncate">{order.client?.name || "Cliente Balcão"}</p>
                  <p className="text-[10px]">{order.client?.phone || ""}</p>
                </div>

                <div className="pt-1">
                  <span className="text-[9px] uppercase font-bold text-gray-600 block">Equipamento:</span>
                  <p className="font-bold text-[12px] font-sans truncate">{order.deviceBrand} {order.deviceModel}</p>
                  {order.serialOrImei && (
                    <p className="text-[9px] truncate">SN: {order.serialOrImei}</p>
                  )}
                </div>

                <div className="pt-1">
                  <span className="text-[9px] uppercase font-bold text-gray-600 block">Defeito:</span>
                  <p className="text-[10px] line-clamp-2 leading-snug">{order.reportedDefect}</p>
                </div>
              </div>

              {/* QR Code de Leitura Rápida */}
              <div className="text-center shrink-0 flex flex-col items-center">
                <QrCodeView value={publicUrl} size={90} className="border border-black p-0.5" />
                <span className="text-[8px] font-sans uppercase font-bold mt-1 tracking-tighter">Escaneie a OS</span>
              </div>
            </div>

            {/* Rodapé da Etiqueta */}
            <div className="border-t border-dashed border-black mt-2.5 pt-1.5 flex items-center justify-between text-[9px] text-gray-700 font-sans">
              <span>Entrada: {entryDate}</span>
              <span className="font-bold text-black">{formatCurrency(calculatedNetTotal)}</span>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 2. COMPROVANTE TÉRMICO DE BALCÃO (Cupom Não Fiscal 80mm)             */}
        {/* =================================================================== */}
        {printFormat === "THERMAL_80" && (
          <div className="print-area bg-white text-black p-6 rounded-xl border border-black/20 shadow-md w-[320px] font-mono text-[11px] leading-tight select-none">
            {/* Cabeçalho da Loja */}
            <div className="text-center border-b border-dashed border-black pb-3 mb-3 space-y-1">
              {tenantInfo.logoUrl && (
                <img
                  src={tenantInfo.logoUrl}
                  alt={tenantInfo.tradeName}
                  className="max-h-12 max-w-[120px] object-contain mx-auto mb-1.5"
                />
              )}
              <h2 className="text-sm font-bold uppercase font-sans tracking-wide">
                {tenantInfo.tradeName}
              </h2>
              <p className="text-[10px] text-gray-800">
                {tenantInfo.legalName}
              </p>
              <p className="text-[10px]">CNPJ: {tenantInfo.document} • Tel: {tenantInfo.phone}</p>
              <p className="text-[9px] uppercase tracking-wider text-gray-600">Comprovante de Entrada de OS</p>
            </div>

            {/* Dados da OS */}
            <div className="space-y-1.5 border-b border-dashed border-black pb-3 mb-3">
              <div className="flex justify-between items-center text-xs font-bold font-sans">
                <span>ORDEM DE SERVIÇO</span>
                <span className="text-base font-black">#{displayOsNumber}</span>
              </div>
              <p>Data: {entryDate}</p>
              <p>Cliente: <strong>{order.client?.name || "Cliente Balcão"}</strong></p>
              <p>Telefone: {order.client?.phone || "Não informado"}</p>
            </div>

            {/* Equipamento */}
            <div className="space-y-1 border-b border-dashed border-black pb-3 mb-3">
              <p className="font-bold uppercase text-[10px]">Equipamento Recebido:</p>
              <p className="font-bold text-xs">{order.deviceBrand} {order.deviceModel}</p>
              {order.serialOrImei && <p className="text-[10px]">Serial/IMEI: {order.serialOrImei}</p>}
              <p className="text-[10px] mt-1">Defeito Relatado: {order.reportedDefect}</p>
            </div>

            {/* Itens / Orçamento que geraram o valor da nota */}
            <div className="border-b border-dashed border-black pb-3 mb-3 space-y-1">
              <p className="font-bold uppercase text-[10px]">Serviços & Peças Discriminados:</p>
              {itemsList.map((item: any) => (
                <div key={item.id} className="flex justify-between text-[10px] py-0.5">
                  <span className="truncate pr-2">
                    {Number(item.quantity || 1)}x {item.description}
                  </span>
                  <span className="shrink-0 font-bold">{formatCurrency(item.totalAmount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-dotted border-black">
                <span>TOTAL DA NOTA:</span>
                <span className="text-sm">{formatCurrency(calculatedNetTotal)}</span>
              </div>
            </div>

            {/* QR Code Centralizado */}
            <div className="text-center py-2 border-b border-dashed border-black mb-3">
              <div className="inline-block p-1 bg-white border border-black">
                <QrCodeView value={publicUrl} size={110} />
              </div>
              <p className="text-[9px] uppercase font-bold mt-1">Acompanhe e Aprove Online</p>
              <p className="text-[8px] text-gray-700">Aponte a câmera do seu celular</p>
            </div>

            {/* Termos Legais Resumidos */}
            <div className="text-[8px] text-justify text-gray-700 space-y-1 mb-4 leading-normal">
              <p>
                * O orçamento tem validade legal de 10 dias. Equipamentos não retirados em até 90 dias após conclusão estão sujeitos à cobrança de taxa de guarda conforme legislação civil.
              </p>
              <p>
                * Garantia técnica de 90 dias nos serviços prestados e peças substituídas conforme art. 26 do Código de Defesa do Consumidor.
              </p>
            </div>

            {/* Linha de Assinatura */}
            <div className="text-center pt-4 border-t border-black space-y-1">
              <div className="w-48 mx-auto border-b border-black mb-1" />
              <p className="text-[9px] uppercase font-bold">Assinatura do Cliente</p>
              <p className="text-[8px] text-gray-600">Concordo com os termos e vistoria</p>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. ORDEM DE SERVIÇO A4 COMPLETA (Laudo Técnico + Jurídico)          */}
        {/* =================================================================== */}
        {printFormat === "A4" && (
          <div className="print-area bg-white text-[#181816] p-8 md:p-12 rounded-xl border border-[#E5E5E0] shadow-md w-full max-w-[800px] text-xs font-sans space-y-6">
            {/* Cabeçalho Corporativo A4 */}
            <div className="flex items-start justify-between border-b-2 border-[#181816] pb-4">
              <div className="flex items-center gap-3">
                {tenantInfo.logoUrl ? (
                  <img
                    src={tenantInfo.logoUrl}
                    alt={tenantInfo.tradeName}
                    className="max-h-12 max-w-[130px] object-contain rounded-lg border border-[#E5E5E0] bg-white p-0.5 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#181816] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                    {tenantInfo.tradeName ? tenantInfo.tradeName.charAt(0).toUpperCase() : "T"}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold tracking-tight text-[#181816]">
                    {tenantInfo.tradeName}
                  </h2>
                  <p className="text-[11px] text-[#787774]">
                    {tenantInfo.legalName}
                  </p>
                  <p className="text-[10px] text-[#787774]">
                    CNPJ: {tenantInfo.document} • Telefone: {tenantInfo.phone} • {tenantInfo.email}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black tracking-tight text-[#181816] block">
                  OS #{displayOsNumber}
                </span>
                <span className="block text-[10px] uppercase font-semibold text-[#787774]">
                  Emissão: {entryDate}
                </span>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#F3F3EF] border border-[#E5E5E0]">
                  Status: {translateOsStatus(order.status)}
                </span>
              </div>
            </div>

            {/* Grid Dados do Cliente & Dados do Equipamento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#787774] block">Dados do Cliente</span>
                <p className="font-bold text-sm text-[#181816]">{order.client?.name || "Cliente Balcão"}</p>
                <p className="text-[11px] text-[#555]">Telefone: {order.client?.phone || "Não cadastrado"}</p>
                {order.client?.document && <p className="text-[11px] text-[#555]">CPF/CNPJ: {order.client.document}</p>}
                {order.client?.email && <p className="text-[11px] text-[#555]">E-mail: {order.client.email}</p>}
              </div>

              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#787774] block">Dados do Equipamento</span>
                <p className="font-bold text-sm text-[#181816]">{order.deviceBrand} {order.deviceModel}</p>
                <p className="text-[11px] text-[#555]">Tipo: {order.deviceType || "Smartphone"}</p>
                {order.serialOrImei && <p className="text-[11px] text-[#555]">Serial/IMEI: {order.serialOrImei}</p>}
                <p className="text-[11px] text-[#555]">Técnico Responsável: {order.technician?.name || "Lucas Técnico Especialista"}</p>
              </div>
            </div>

            {/* Laudo e Sintomas */}
            <div className="p-4 rounded-xl bg-white border border-[#EBEBE8] space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#787774] block">Defeito Relatado pelo Cliente</span>
                <p className="text-xs text-[#181816] mt-0.5">{order.reportedDefect || "Defeito a diagnosticar"}</p>
              </div>
              {order.technicalDiagnosis && (
                <div className="pt-2 border-t border-[#EBEBE8]">
                  <span className="text-[10px] uppercase font-bold text-[#787774] block">Diagnóstico Técnico Pericial</span>
                  <p className="text-xs text-[#181816] mt-0.5">{order.technicalDiagnosis}</p>
                </div>
              )}
            </div>

            {/* Tabela de Peças & Serviços Orçados - ITENS QUE GERARAM O VALOR DA NOTA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#787774] block">
                  Discriminação de Serviços e Peças Aplicadas (Composição do Valor da Nota)
                </span>
                <span className="text-[10px] text-[#787774] font-semibold">
                  {itemsList.length} {itemsList.length === 1 ? "item lançado" : "itens lançados"}
                </span>
              </div>
              <table className="w-full border-collapse border border-[#E5E5E0] text-left">
                <thead>
                  <tr className="bg-[#F5F5F2] text-[10px] uppercase font-semibold text-[#555]">
                    <th className="p-2.5 border border-[#E5E5E0]">Item / Descrição</th>
                    <th className="p-2.5 border border-[#E5E5E0] text-center w-24">Tipo</th>
                    <th className="p-2.5 border border-[#E5E5E0] text-center w-16">Qtd</th>
                    <th className="p-2.5 border border-[#E5E5E0] text-right w-24">Unitário</th>
                    <th className="p-2.5 border border-[#E5E5E0] text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E0]">
                  {itemsList.map((item: any) => (
                    <tr key={item.id} className="text-xs hover:bg-[#FAF9F6]">
                      <td className="p-2.5 border border-[#E5E5E0] font-medium text-[#181816]">
                        {item.description}
                      </td>
                      <td className="p-2.5 border border-[#E5E5E0] text-center text-[10px] text-[#787774]">
                        {item.itemType === "PRODUCT" ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold">Peça</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 font-semibold">Mão de Obra</span>
                        )}
                      </td>
                      <td className="p-2.5 border border-[#E5E5E0] text-center font-bold">{Number(item.quantity || 1)}</td>
                      <td className="p-2.5 border border-[#E5E5E0] text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-2.5 border border-[#E5E5E0] text-right font-bold tabular-nums text-[#181816]">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {totalServices > 0 && totalParts > 0 && (
                    <>
                      <tr className="bg-[#FAF9F6] text-xs">
                        <td colSpan={4} className="p-2 border border-[#E5E5E0] text-right text-[#787774]">
                          Subtotal Mão de Obra / Serviços:
                        </td>
                        <td className="p-2 border border-[#E5E5E0] text-right font-medium tabular-nums text-[#787774]">
                          {formatCurrency(totalServices)}
                        </td>
                      </tr>
                      <tr className="bg-[#FAF9F6] text-xs">
                        <td colSpan={4} className="p-2 border border-[#E5E5E0] text-right text-[#787774]">
                          Subtotal Peças e Componentes:
                        </td>
                        <td className="p-2 border border-[#E5E5E0] text-right font-medium tabular-nums text-[#787774]">
                          {formatCurrency(totalParts)}
                        </td>
                      </tr>
                    </>
                  )}
                  <tr className="bg-[#F5F5F2] text-xs font-bold">
                    <td colSpan={4} className="p-2.5 border border-[#E5E5E0] text-right uppercase text-[#181816]">
                      Valor Total da Nota Fiscal / OS:
                    </td>
                    <td className="p-2.5 border border-[#E5E5E0] text-right text-sm text-[#181816] font-black tabular-nums">
                      {formatCurrency(calculatedNetTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* QR Code e Termos de Garantia */}
            <div className="flex items-start justify-between gap-6 p-4 rounded-xl bg-[#FAF9F6] border border-[#EBEBE8]">
              <div className="space-y-1.5 flex-1 text-[10px] text-[#555] leading-relaxed">
                <span className="font-bold uppercase text-[#181816] block text-[11px]">Termos de Garantia & Condições Legais</span>
                <p>
                  1. A garantia é de <strong>90 (noventa) dias</strong> a partir da data de entrega do equipamento, cobrindo exclusivamente os serviços executados e componentes substituídos, conforme Art. 26 da Lei nº 8.078/1990 (Código de Defesa do Consumidor).
                </p>
                <p>
                  2. A garantia perde sua validade em casos de dano físico posterior, quebra, quedas, contato com líquidos ou intervenção de terceiros.
                </p>
                <p>
                  3. O cliente autoriza a execução técnica dos serviços orçados conforme discriminado neste documento.
                </p>
              </div>

              <div className="shrink-0 text-center flex flex-col items-center">
                <QrCodeView value={publicUrl} size={90} className="border border-[#E5E5E0]" />
                <span className="text-[8px] font-bold text-[#181816] mt-1 uppercase">Portal Online</span>
              </div>
            </div>

            {/* Assinaturas */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#EBEBE8]">
              <div className="text-center space-y-1">
                {order.clientSignatureUrl ? (
                  <div className="h-14 flex items-center justify-center">
                    <img src={order.clientSignatureUrl} alt="Assinatura Cliente" className="max-h-12 object-contain" />
                  </div>
                ) : (
                  <div className="h-14 border-b border-black w-48 mx-auto" />
                )}
                <p className="font-bold text-xs text-[#181816]">{order.client?.name || "Cliente"}</p>
                <p className="text-[10px] text-[#787774]">Assinatura do Cliente</p>
              </div>

              <div className="text-center space-y-1">
                <div className="h-14 border-b border-black w-48 mx-auto" />
                <p className="font-bold text-xs text-[#181816]">
                  {tenantInfo.tradeName}
                </p>
                <p className="text-[10px] text-[#787774]">Assinatura do Responsável Técnico</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Regras CSS de Impressão @media print */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print, header, aside, nav {
            display: none !important;
          }
          .print-area {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
