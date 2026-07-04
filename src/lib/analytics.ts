// Lightweight analytics helper. Pushes to dataLayer (GTM/GA4) if present,
// and mirrors to gtag when available. No-op safe in SSR.
type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
    window.gtag?.("event", event, params);
  } catch {
    /* noop */
  }
}

export const trackWhatsApp = (location: string, extra: EventParams = {}) =>
  track("whatsapp_click", { location, ...extra });

export const trackServiceDetail = (slug: string, nome: string) =>
  track("service_detail_click", { slug, nome });
