/**
 * Rastreamento de Analytics desacoplado para o Programa Fundador TorxOS
 * Integrado com Meta Pixel (fbq) e Google Tag Manager / GA4 (dataLayer)
 */

export type FounderEventName =
  | "founder_page_view"
  | "founder_cta_click"
  | "founder_form_start"
  | "founder_form_submit"
  | "founder_plan_selected"
  | "founder_demo_request";

export function trackFounderEvent(
  eventName: FounderEventName,
  params: Record<string, any> = {}
) {
  try {
    if (typeof window === "undefined") return;

    const payload = {
      event: eventName,
      program: "Programa Fundador TorxOS",
      timestamp: new Date().toISOString(),
      ...params,
    };

    // Google Tag Manager / GA4 dataLayer
    if ((window as any).dataLayer && Array.isArray((window as any).dataLayer)) {
      (window as any).dataLayer.push(payload);
    }

    // Meta Pixel (fbq)
    if (typeof (window as any).fbq === "function") {
      (window as any).fbq("trackCustom", eventName, payload);

      // Mapeamento para eventos padrão do Pixel quando aplicável
      if (eventName === "founder_cta_click") {
        (window as any).fbq("track", "InitiateCheckout", {
          content_name: "Programa Fundador",
          ...params,
        });
      } else if (eventName === "founder_form_submit") {
        (window as any).fbq("track", "Lead", {
          content_name: "Candidatura Fundador TorxOS",
          ...params,
        });
      }
    }
  } catch (err) {
    console.warn("[Analytics] Erro ao disparar evento de fundador:", err);
  }
}
