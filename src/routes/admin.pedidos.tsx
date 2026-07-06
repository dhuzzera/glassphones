import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Order, OrderStatus } from "@/integrations/supabase/types";
import { formatBRL } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/pedidos")({
  component: OrdersAdmin,
});

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  paid: "Pago",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_VARIANTS: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  confirmed: "secondary",
  paid: "default",
  delivered: "default",
  cancelled: "destructive",
};

function OrdersAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [detail, setDetail] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: async () => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Order[];
    },
  });

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
    if (detail?.id === id) setDetail({ ...detail, status });
  };

  const openWhatsapp = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    const withCountry = clean.startsWith("55") ? clean : `55${clean}`;
    window.open(`https://wa.me/${withCountry}`, "_blank");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Select value={filter} onValueChange={(v) => setFilter(v as OrderStatus | "all")}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <p className="p-6">Carregando...</p> : orders.length === 0 ? (
            <p className="p-6 text-muted-foreground">Nenhum pedido.</p>
          ) : (
            <div className="divide-y">
              {orders.map((o) => (
                <button key={o.id} onClick={() => setDetail(o)} className="w-full text-left p-4 hover:bg-muted flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <Badge variant={STATUS_VARIANTS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {o.customer_name} • {new Date(o.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <p className="font-semibold">{formatBRL(o.total_cents)}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Pedido #{detail.id.slice(0, 8).toUpperCase()}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{detail.customer_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm">{detail.customer_phone}</p>
                    <Button size="sm" variant="outline" onClick={() => openWhatsapp(detail.customer_phone)}>
                      <MessageCircle className="w-3 h-3 mr-1" />WhatsApp
                    </Button>
                  </div>
                  {detail.customer_email && <p className="text-sm text-muted-foreground mt-1">{detail.customer_email}</p>}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Itens</p>
                  <div className="space-y-1 text-sm">
                    {detail.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{i.quantity}x {i.name}</span>
                        <span>{formatBRL(i.price_cents * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Total</span><span>{formatBRL(detail.total_cents)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Entrega</p>
                  <p>{detail.delivery_method === "pickup" ? "Retirada na loja" : "Frete a combinar"}</p>
                </div>

                {detail.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="text-sm">{detail.notes}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Alterar status</p>
                  <Select value={detail.status} onValueChange={(v) => updateStatus(detail.id, v as OrderStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
