import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/use-cart";
import { formatBRL, buildOrderWhatsappUrl } from "@/lib/marketplace";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { DeliveryMethod } from "@/lib/marketplace-types";

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  phone: z.string().trim().min(8, "Telefone inválido").max(20),
  email: z.string().trim().email("E-mail inválido").max(160).optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

type PaymentMethod = "pix" | "cartao" | "dinheiro" | "combinar";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Glass Phone SBS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalCents, clear, hydrated } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethod>("pickup");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && items.length === 0) navigate({ to: "/carrinho" });
  }, [hydrated, items.length, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, phone, email, notes });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name: parsed.data.name,
          customer_phone: parsed.data.phone,
          customer_email: parsed.data.email || null,
          items,
          total_cents: totalCents,
          delivery_method: delivery,
          notes: parsed.data.notes || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      const url = buildOrderWhatsappUrl({
        orderId: data.id,
        customerName: parsed.data.name,
        items,
        totalCents,
        deliveryMethod: delivery,
        notes: parsed.data.notes,
      });
      clear();
      toast.success("Pedido registrado! Abrindo WhatsApp...");
      window.open(url, "_blank");
      navigate({ to: "/loja" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar pedido";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto py-4 px-4">
          <Link to="/carrinho" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar ao carrinho
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Finalizar pedido</h1>

        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle>Seus dados</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="n">Nome completo *</Label>
                  <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="ph">WhatsApp *</Label>
                  <Input id="ph" placeholder="(47) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="em">E-mail (opcional)</Label>
                  <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Entrega</CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={delivery} onValueChange={(v) => setDelivery(v as DeliveryMethod)}>
                  <div className="flex items-start gap-2 p-3 border rounded-md">
                    <RadioGroupItem value="pickup" id="d1" className="mt-1" />
                    <Label htmlFor="d1" className="cursor-pointer">
                      <div className="font-medium">Retirada na loja</div>
                      <div className="text-sm text-muted-foreground">Combinamos horário via WhatsApp.</div>
                    </Label>
                  </div>
                  <div className="flex items-start gap-2 p-3 border rounded-md">
                    <RadioGroupItem value="whatsapp_shipping" id="d2" className="mt-1" />
                    <Label htmlFor="d2" className="cursor-pointer">
                      <div className="font-medium">Frete a combinar</div>
                      <div className="text-sm text-muted-foreground">Passamos o valor pelo WhatsApp conforme sua região.</div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
              <CardContent>
                <Textarea placeholder="Alguma observação sobre o pedido?" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.map((i) => (
                  <div key={i.product_id} className="flex justify-between text-sm">
                    <span>{i.quantity}x {i.name}</span>
                    <span>{formatBRL(i.price_cents * i.quantity)}</span>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatBRL(totalCents)}</span>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={submitting || items.length === 0}>
                  {submitting ? "Enviando..." : "Enviar via WhatsApp"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Ao enviar, seu pedido é registrado e o WhatsApp abre para você confirmar.
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
    </div>
  );
}
