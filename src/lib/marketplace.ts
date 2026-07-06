import type { OrderItem } from "@/lib/marketplace-types";

export const WHATSAPP_NUMBER = "5547996801247";

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildOrderWhatsappUrl(params: {
  orderId: string;
  customerName: string;
  items: OrderItem[];
  totalCents: number;
  deliveryMethod: "pickup" | "whatsapp_shipping";
  notes?: string;
}): string {
  const lines = [
    `*Novo pedido — Glass Phone SBS*`,
    `Pedido: #${params.orderId.slice(0, 8).toUpperCase()}`,
    `Cliente: ${params.customerName}`,
    ``,
    `*Itens:*`,
    ...params.items.map(
      (it) => `• ${it.quantity}x ${it.name} — ${formatBRL(it.price_cents * it.quantity)}`
    ),
    ``,
    `*Total: ${formatBRL(params.totalCents)}*`,
    `Entrega: ${params.deliveryMethod === "pickup" ? "Retirada na loja" : "Frete a combinar"}`,
    params.notes ? `Obs: ${params.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;
}

export function buildServiceInquiryUrl(serviceName: string): string {
  const msg = `Olá! Tenho interesse no serviço: *${serviceName}*. Podem me passar mais detalhes?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}
