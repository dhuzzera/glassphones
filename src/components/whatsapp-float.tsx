import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/lib/site";
import { useSiteSettings } from "@/hooks/use-site-content";
import { trackWhatsApp } from "@/lib/analytics";

/** Horário comercial: Seg-Sáb 9h-19h (America/Sao_Paulo, UTC-3). */
function useBusinessHours() {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  // Brasil (SC) sem horário de verão desde 2019: UTC-3 estável.
  const utc = now.getUTCHours();
  const hourBR = (utc - 3 + 24) % 24;
  // 0=dom, 1=seg... 6=sáb
  const dowUTC = now.getUTCDay();
  const dowBR = utc < 3 ? (dowUTC + 6) % 7 : dowUTC;
  const isWeekday = dowBR >= 1 && dowBR <= 6; // seg a sáb
  const open = isWeekday && hourBR >= 9 && hourBR < 19;
  return { open, hourBR, dowBR };
}

export function WhatsAppFloat() {
  const { get } = useSiteSettings();
  const { open } = useBusinessHours();
  const href = get("contact.whatsapp_url");
  const label = open ? "Responde em ~5 min" : "Fora do horário · deixe sua msg";

  return (
    <a
      href={href}
      onClick={() => trackWhatsApp("float", { open: open ? "1" : "0" })}
      aria-label={`Falar no WhatsApp — ${label}`}
      className="group fixed bottom-6 right-6 z-50 flex items-center gap-3"
    >
      <span
        className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card text-card-foreground text-xs font-medium shadow-lg border border-border transition-opacity ${
          open ? "opacity-100" : "opacity-80"
        }`}
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            open ? "bg-whatsapp animate-pulse" : "bg-muted-foreground"
          }`}
        />
        {label}
      </span>
      <span
        className="h-14 w-14 rounded-full bg-whatsapp text-whatsapp-foreground grid place-items-center shadow-lg transition group-hover:scale-110"
        style={{ boxShadow: "0 10px 30px -5px oklch(0.7 0.17 150 / 0.6)" }}
      >
        <WhatsAppIcon className="h-7 w-7" />
      </span>
    </a>
  );
}
