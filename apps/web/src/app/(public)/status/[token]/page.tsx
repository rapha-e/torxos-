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

  useEffect(() => {
    async function loadOrder() {
      if (!token) return;
      try {
        const data = await fetchApi(`/public/os/${token}`);
        setOrder(data);
        if (data.status === "APPROVED" || data.status === "IN_MAINTENANCE" || data.status === "READY_FOR_PICKUP" || data.status === "DELIVERED") {
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
                {order.tenant?.tradeName || "TorxOS Tech Center"}
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
              <span className="text-xs font-semibold text-amber-800 bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#FDE68A] inline-block mt-0.5">
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
                    <p className="font-semibold text-[#1C1C1A]">{item.description}</p>
                    <span className="text-[10px] text-[#71716C] uppercase font-medium">
                      {item.itemType === "PRODUCT" ? "Peça Original Certificada" : "Serviço Técnico Especializado"}
                    </span>
                  </div>
                  <span className="font-bold text-[#1C1C1A] tabular-nums">
                    {formatCurrency(item.totalAmount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totalizador Nobre */}
            <div className="p-4 rounded-xl bg-[#181816] text-white flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs text-amber-200 font-semibold block">Valor Total do Atendimento</span>
                <span className="text-[11px] text-[#A1A19B]">Inclui peças com certificação e garantia de 90 dias</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
                {formatCurrency(order.netTotal)}
              </span>
            </div>
          </div>

          {/* Ação de Aprovação */}
          <div className="pt-3 border-t border-[rgba(28,25,23,0.07)] space-y-4">
            {approved ? (
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

                <div className="text-center space-y-2">
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                    <span>{submitting ? "Processando aprovação..." : "Aprovar Orçamento e Iniciar Reparo"}</span>
                  </button>
                  <p className="text-[11px] text-[#71716C]">
                    Ao confirmar, você formaliza a autorização de reparo com garantia técnica de 90 dias assegurada.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-[10px] text-[#A1A19B]">
          <p>TorxOS Operating System • Protocolo Digital de Atendimento</p>
        </div>
      </div>

      {/* Modal de Pagamento PIX */}
      {showPixModal && (
        <PixPaymentModal
          isOpen={showPixModal}
          onClose={() => setShowPixModal(false)}
          amount={Number(order.netTotal) || 0}
          orderNumber={order.osNumber}
          description={`Manutenção ${order.deviceBrand || ""} ${order.deviceModel || ""}`}
          merchantName={order.tenant?.tradeName || "TorxOS Tech Center"}
          pixKey={order.tenant?.document || "12.345.678/0001-99"}
          onPaymentConfirmed={() => {
            alert("Pagamento PIX registrado com sucesso! Seu equipamento já foi liberado.");
          }}
        />
      )}
    </div>
  );
}
