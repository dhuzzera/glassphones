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
  // Endereço (opcional para retirada, exigido quando entrega for a combinar).
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("pix");
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
    // Endereço obrigatório quando frete for combinado.
    if (delivery === "whatsapp_shipping" && (!rua.trim() || !numero.trim() || !cidade.trim())) {
      toast.error("Preencha o endereço para envio (rua, número e cidade).");
      return;
    }
    setSubmitting(true);
    try {
      // Consolidamos endereço + pagamento em `notes` (sem alterar o schema do banco).
      const enderecoBlock =
        delivery === "whatsapp_shipping" || rua.trim()
          ? `Endereço: ${rua}, ${numero} — ${bairro} — ${cidade}${cep ? ` (CEP ${cep})` : ""}`
          : "";
      const pagamentoBlock = `Pagamento preferido: ${payment}`;
      const notasFinais = [enderecoBlock, pagamentoBlock, parsed.data.notes]
        .filter(Boolean)
        .join(" | ");

      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name: parsed.data.name,
          customer_phone: parsed.data.phone,
          customer_email: parsed.data.email || null,
          items,
          total_cents: totalCents,
          delivery_method: delivery,
          notes: notasFinais || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      track("checkout_submit", {
        order_id: data.id,
        total_cents: totalCents,
        items_count: items.length,
        delivery_method: delivery,
        payment_method: payment,
      });

      const url = buildOrderWhatsappUrl({
        orderId: data.id,
        customerName: parsed.data.name,
        items,
        totalCents,
        deliveryMethod: delivery,
        notes: notasFinais,
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
              <CardHeader>
                <CardTitle>Endereço {delivery === "pickup" && <span className="text-sm font-normal text-muted-foreground">(opcional para retirada)</span>}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="89281-100" maxLength={9} />
                </div>
                <div className="sm:col-span-4">
                  <Label htmlFor="rua">Rua / Logradouro</Label>
                  <Input id="rua" value={rua} onChange={(e) => setRua(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Pagamento</CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={payment} onValueChange={(v) => setPayment(v as PaymentMethod)} className="grid grid-cols-2 gap-2">
                  {[
                    { v: "pix", label: "PIX", desc: "Envio da chave no WhatsApp" },
                    { v: "cartao", label: "Cartão", desc: "Débito/crédito na retirada" },
                    { v: "dinheiro", label: "Dinheiro", desc: "Na entrega ou retirada" },
                    { v: "combinar", label: "A combinar", desc: "Falamos no WhatsApp" },
                  ].map((op) => (
                    <label
                      key={op.v}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                        payment === op.v ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem value={op.v} className="mt-1" />
                      <div>
                        <div className="text-sm font-medium">{op.label}</div>
                        <div className="text-xs text-muted-foreground">{op.desc}</div>
                      </div>
                    </label>
                  ))}
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
