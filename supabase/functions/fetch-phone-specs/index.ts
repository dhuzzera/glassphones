// Edge Function: proxy para MobileAPI — evita CORS e protege a chave no servidor
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Remove capacidade, condição e outras palavras que confundem a busca
    // Ex: "iPhone 13 128GB Seminovo" → "iPhone 13"
    const cleanName = name
      .replace(/\b\d+\s*(GB|TB|MB|RAM)\b/gi, "")
      .replace(/\b(seminovo|semi-novo|novo|usado|refurbished|recondicionado|desbloqueado|unlocked)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    const key = Deno.env.get("MOBILEAPI_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "MOBILEAPI_KEY not configured" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const url = `https://api.mobileapi.dev/devices/search?name=${encodeURIComponent(cleanName)}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `MobileAPI returned ${res.status}` }), {
        status: res.status,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    let device = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);

    // Se não encontrou, tenta com versão mais curta (primeiras 3 palavras)
    if (!device) {
      const shortName = cleanName.split(" ").slice(0, 3).join(" ");
      if (shortName !== cleanName) {
        const res2 = await fetch(`https://api.mobileapi.dev/devices/search?name=${encodeURIComponent(shortName)}&key=${key}`);
        if (res2.ok) {
          const data2 = await res2.json();
          device = Array.isArray(data2) ? (data2[0] ?? null) : (data2 ?? null);
        }
      }
    }

    return new Response(JSON.stringify(device), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
