"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Phone,
  Zap,
  Ban,
  RotateCcw,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { formatCurrency, translateOsStatus } from "@/lib/utils";
import { SignatureCanvas } from "@/components/ui/signature-canvas";
import { PixPaymentModal } from "@/components/ui/pix-payment-modal";

export default function PublicOrderStatusPage() {
  const params = useParams();
  const token = params?.token as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [showPixModal, setShowPixModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("Valor do orçamento acima do planejado");

  useEffect(() => {
    async function loadOrder() {
      if (!token) return;
      try {
        const data = await fetchApi(`/public/os/${token}`);
        setOrder(data);
        if (
          data.status === "APPROVED" ||
          data.status === "IN_MAINTENANCE" ||
          data.status === "READY_FOR_PICKUP" ||
          data.status === "DELIVERED"
        ) {
          setApproved(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [token]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await fetchApi(`/public/os/${token}/approve`, {
        method: "POST",
        body: JSON.stringify({
          clientSignatureUrl: clientSignature || undefined,
          geolocation: "Browser Digital Signature Auth",
        }),
      });
      setApproved(true);
      const refreshed = await fetchApi(`/public/os/${token}`);
      setOrder(refreshed);
    } catch (err: any) {
      alert("Erro ao aprovar orçamento: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (reason: string) => {
    setSubmitting(true);
    try {
      await fetchApi(`/public/os/${token}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      const refreshed = await fetchApi(`/public/os/${token}`);
      setOrder(refreshed);
      setShowRejectModal(false);
    } catch (err: any) {
      alert("Erro ao recusar orçamento: " + (err.message || "Tente novamente."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#181816] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-[#71716C]">Acessando portal de atendimento...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-xl bg-white border border-[rgba(28,25,23,0.07)] text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" strokeWidth={1.75} />
          <h2 className="text-base font-bold text-[#1C1C1A]">Atendimento Não Localizado</h2>
          <p className="text-xs text-[#71716C]">
            O link informado expirou ou não corresponde a uma ordem de serviço válida. Entre em contato com a equipe da loja.
          </p>
        </div>
      </div>
    );
  }

  const isCanceled = order.status === "CANCELED";

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#1C1C1A] py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Header da Assistência */}
        <div className="evorix-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {order.tenant?.logoUrl ? (
              <img
                src={order.tenant.logoUrl}
                alt={order.tenant.tradeName || "Logo"}
                className="w-11 h-11 rounded-xl object-contain border border-[#EBEBE8] bg-white p-0.5 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#181816] flex items-center justify-center shadow-sm">
                <span className="font-serif font-black text-amber-200 text-lg">E</span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-sm text-[#1C1C1A]">
                {order.tenant?.tradeName || "Assistência Técnica"}
              </h1>
              <p className="text-[11px] text-[#71716C] flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-[#A1A19B]" strokeWidth={1.75} />
                <span>Central: {order.tenant?.phone || "(11) 98888-7766"}</span>
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-emerald-800 text-xs font-semibold self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" strokeWidth={2} />
            <span>Garantia de 90 Dias</span>
          </div>
        </div>

        {/* Card do Orçamento */}
        <div className="evorix-card p-7 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[rgba(28,25,23,0.07)]">
            <div>
              <span className="text-[10px] font-semibold text-[#71716C] uppercase tracking-wider">
                Laudo & Orçamento Técnico
              </span>
              <h2 className="text-xl font-bold text-[#1C1C1A] mt-0.5">
                Ordem de Serviço #{order.osNumber}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#71716C] font-semibold block uppercase">Status</span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border inline-block mt-0.5 ${
                  isCanceled
                    ? "text-rose-800 bg-rose-50 border-rose-200"
                    : order.status === "APPROVED" || order.status === "IN_MAINTENANCE" || order.status === "DELIVERED"
                    ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                    : "text-amber-800 bg-[#FEF3C7] border-[#FDE68A]"
                }`}
              >
                {translateOsStatus(order.status)}
              </span>
            </div>
          </div>

          {/* Dados do Aparelho */}
          <div className="p-4 rounded-xl bg-[#F3F3EF] border border-[rgba(28,25,23,0.06)] space-y-2">
            <div className="flex items-center gap-2 text-[#1C1C1A] font-bold text-xs">
              <Smartphone className="w-3.5 h-3.5 text-[#71716C]" strokeWidth={1.75} />
              <span>{order.deviceBrand} {order.deviceModel}</span>
            </div>
            <div className="text-xs text-[#71716C] space-y-1">
              <p><strong className="text-[#1C1C1A] font-semibold">Cliente:</strong> {order.client?.name}</p>
              <p><strong className="text-[#1C1C1A] font-semibold">Defeito:</strong> {order.reportedDefect}</p>
              {order.technicalDiagnosis && (
                <p><strong className="text-[#1C1C1A] font-semibold">Diagnóstico:</strong> {order.technicalDiagnosis}</p>
              )}
            </div>
          </div>

          {/* Peças e Serviços */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#71716C]">
              Serviços & Peças de Bancada
            </h3>

            <div className="space-y-1.5">
              {order.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className={`font-semibold ${isCanceled ? "line-through text-[#71716C]" : "text-[#1C1C1A]"}`}>
                      {item.description}
                    </p>
                    <span className="text-[10px] text-[#71716C] uppercase font-medium">
                      {item.itemType === "PRODUCT" ? "Peça Original Certificada" : "Serviço Técnico Especializado"}
                    </span>
                  </div>
                  <span className={`font-bold tabular-nums ${isCanceled ? "line-through text-[#71716C]" : "text-[#1C1C1A]"}`}>
                    {formatCurrency(item.totalAmount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totalizador */}
            <div className={`p-4 rounded-xl text-white flex items-center justify-between shadow-sm ${isCanceled ? "bg-stone-800 opacity-90" : "bg-[#181816]"}`}>
              <div>
                <span className="text-xs text-amber-200 font-semibold block">
                  {isCanceled ? "Orçamento Recusado" : "Valor Total do Atendimento"}
                </span>
                <span className="text-[11px] text-[#A1A19B]">
                  {isCanceled ? "Nenhum valor será cobrado pelo conserto" : "Inclui peças com certificação e garantia de 90 dias"}
                </span>
              </div>
              <span className={`text-2xl font-bold tracking-tight tabular-nums ${isCanceled ? "line-through text-stone-400" : "text-white"}`}>
                {formatCurrency(order.netTotal)}
              </span>
            </div>
          </div>

          {/* Ação de Aprovação / Recusa */}
          <div className="pt-3 border-t border-[rgba(28,25,23,0.07)] space-y-4">
            {isCanceled ? (
              /* Estado de Orçamento Recusado / Cancelado */
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
                <Ban className="w-8 h-8 text-rose-600 mx-auto" strokeWidth={2} />
                <h4 className="text-sm font-bold text-rose-950">Orçamento Não Aprovado / Recusado</h4>
                <p className="text-xs text-rose-800 leading-relaxed max-w-md mx-auto">
                  Este atendimento foi encerrado. Seu equipamento não foi submetido a reparos e já se encontra disponível para retirada no balcão da loja.
                </p>
                <div className="pt-2 text-[11px] text-[#71716C]">
                  Central da loja: <strong>{order.tenant?.phone || "(11) 98888-7766"}</strong>
                </div>
              </div>
            ) : approved ? (
              /* Estado de Orçamento Aprovado */
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" strokeWidth={2} />
                <h4 className="text-sm font-bold text-emerald-950">Orçamento Aprovado com Sucesso!</h4>
                <p className="text-xs text-emerald-800">
                  A equipe técnica já foi notificada e o reparo foi colocado em bancada de execução. Você receberá atualizações automáticas via WhatsApp.
                </p>
                {order.clientSignatureUrl && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/60 flex flex-col items-center">
                    <span className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider mb-1">
                      Assinatura Digital Registrada
                    </span>
                    <img
                      src={order.clientSignatureUrl}
                      alt="Assinatura do Cliente"
                      className="h-12 bg-white/60 rounded-lg p-1 border border-emerald-200"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowPixModal(true)}
                  className="w-full py-3 rounded-xl bg-[#181816] text-white text-xs font-semibold hover:bg-[#282824] flex items-center justify-center gap-2 shadow-sm mt-2 transition cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                  <span>Pagar Agora via PIX (QR Code / Copia e Cola)</span>
                </button>
              </div>
            ) : (
              /* Ações quando ainda aguarda aprovação */
              <div className="space-y-4">
                {/* Canvas de Assinatura Digital do Cliente */}
                <SignatureCanvas
                  title="Sua Assinatura de Aprovação"
                  subtitle="Assine com o dedo no celular ou mouse para formalizar o orçamento"
                  onSave={(signature) => {
                    setClientSignature(signature);
                    alert("Assinatura capturada! Agora clique em 'Aprovar Orçamento' para confirmar.");
                  }}
                />

                <div className="space-y-2">
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                    <span>{submitting ? "Processando aprovação..." : "Aprovar Orçamento e Iniciar Reparo"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-[#F3F3EF] hover:bg-rose-50 text-[#71716C] hover:text-rose-700 font-semibold text-xs border border-[rgba(28,25,23,0.08)] hover:border-rose-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Não Aprovo / Recusar Orçamento</span>
                  </button>

                  <p className="text-[11px] text-[#71716C] text-center pt-1">
                    Ao confirmar a aprovação, você formaliza a autorização de reparo com garantia técnica de 90 dias assegurada.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-[10px] text-[#A1A19B]">
          <p>{order.tenant?.tradeName ? `${order.tenant.tradeName} • Protocolo Digital de Atendimento` : "Protocolo Digital de Atendimento"}</p>
        </div>
      </div>

      {/* Modal de Confirmação de Recusa pelo Cliente */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[rgba(28,25,23,0.1)] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1C1C1A]">Recusar Orçamento?</h3>
                <p className="text-xs text-[#71716C] mt-0.5">
                  Ao recusar, o reparo não será iniciado e o aparelho ficará disponível para retirada no balcão da loja.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-[#1C1C1A] block">Motivo da recusa (opcional):</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAFAF8] border border-[rgba(28,25,23,0.1)] text-xs text-[#1C1C1A] focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="Valor do orçamento acima do planejado">Valor do orçamento acima do planejado</option>
                <option value="Prazo de entrega superior ao necessário">Prazo de entrega superior ao necessário</option>
                <option value="Decidi trocar ou comprar outro aparelho">Decidi trocar ou comprar outro aparelho</option>
                <option value="Outro motivo">Outro motivo</option>
              </select>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              Não haverá nenhuma taxa de cancelamento e seu equipamento será devolvido no mesmo estado da entrada.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(28,25,23,0.06)]">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-white border border-[rgba(28,25,23,0.1)] text-xs font-semibold text-[#71716C] hover:bg-[#F3F3EF] cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectReason)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Confirmando..." : "Confirmar Recusa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pagamento PIX */}
      {showPixModal && (
        <PixPaymentModal
          isOpen={showPixModal}
          onClose={() => setShowPixModal(false)}
          amount={Number(order.netTotal) || 0}
          orderNumber={order.osNumber}
          description={`Manutenção ${order.deviceBrand || ""} ${order.deviceModel || ""}`}
          merchantName={order.tenant?.tradeName || "Assistência Técnica"}
          pixKey={order.tenant?.document || "12.345.678/0001-99"}
          onPaymentConfirmed={() => {
            alert("Pagamento PIX registrado com sucesso! Seu equipamento já foi liberado.");
          }}
        />
      )}
    </div>
  );
}
