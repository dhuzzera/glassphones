import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WHATSAPP_NUMBER = Deno.env.get("ADMIN_WHATSAPP") ?? "5547996801247";

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;
    if (!record) return new Response("no record", { status: 400 });

    const msg = [
      `🛒 *Novo pedido — Glass Phone SBS*`,
      `Pedido: #${record.id?.slice(0, 8).toUpperCase()}`,
      `Cliente: ${record.customer_name}`,
      `Telefone: ${record.customer_phone}`,
      `Total: R$ ${((record.total_cents ?? 0) / 100).toFixed(2).replace(".", ",")}`,
      `Entrega: ${record.delivery_method === "pickup" ? "Retirada na loja" : "Frete a combinar"}`,
      ``,
      `Acesse o painel: https://www.glassphone.com.br/admin/pedidos`,
    ].join("\n");

    // Log para debugging — em produção conectar a API de notificação real
    console.log("[notify-new-order]", msg);
    console.log("[notify-new-order] WHATSAPP_NUMBER:", WHATSAPP_NUMBER);

    return new Response(JSON.stringify({ ok: true, message: msg }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
