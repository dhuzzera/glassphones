// Lightweight analytics helper. Pushes to dataLayer (GTM/GA4) if present,
// mirrors to gtag, persists a rolling log to localStorage for the internal
// /analytics dashboard, and supports a debug mode that echoes to console.
type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

const LOG_KEY = "gp_analytics_log_v1";
const DEBUG_KEY = "gp_analytics_debug";
const MAX_LOG = 100;

export type LoggedEvent = {
  event: string;
  ts: number;
  params: EventParams;
};

export function isDebug(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (typeof URLSearchParams !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      const d = q.get("debug");
      if (d === "analytics" || d === "1") {
        window.localStorage.setItem(DEBUG_KEY, "1");
        return true;
      }
      if (d === "off") window.localStorage.removeItem(DEBUG_KEY);
    }
    return window.localStorage.getItem(DEBUG_KEY) === "1";
  } catch {
    return false;
  }
}

function persist(entry: LoggedEvent) {
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    const arr: LoggedEvent[] = raw ? JSON.parse(raw) : [];
    arr.unshift(entry);
    window.localStorage.setItem(LOG_KEY, JSON.stringify(arr.slice(0, MAX_LOG)));
  } catch {
    /* noop */
  }
}

export function readLog(): LoggedEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as LoggedEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearLog() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(LOG_KEY); } catch { /* noop */ }
}

export function track(event: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;
  const entry: LoggedEvent = { event, ts: Date.now(), params };
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
    window.gtag?.("event", event, params);
  } catch {
    /* noop */
  }
  persist(entry);
  if (isDebug()) {
     
    console.log(`[analytics] ${event}`, params);
  }
}

// Runtime validation: warn (and skip) if required fields are missing.
function validate(event: string, required: string[], params: EventParams): boolean {
  const missing = required.filter((k) => params[k] === undefined || params[k] === "" || params[k] === null);
  if (missing.length > 0) {
    if (typeof console !== "undefined") {
       
      console.warn(`[analytics] ${event} missing required params:`, missing, params);
    }
    return false;
  }
  return true;
}

export function trackWhatsApp(
  location: string,
  extra: { slug?: string; nome?: string; preco?: number } & EventParams = {},
) {
  const params: EventParams = { location, ...extra };
  if (!validate("whatsapp_click", ["location"], params)) return;
  // When triggered from a service context, nome + preco should be present.
  if (extra.slug && !validate("whatsapp_click", ["nome", "preco"], params)) return;
  track("whatsapp_click", params);
}

export function trackServiceDetail(slug: string, nome: string) {
  const params: EventParams = { slug, nome };
  if (!validate("service_detail_click", ["slug", "nome"], params)) return;
  track("service_detail_click", params);
}
