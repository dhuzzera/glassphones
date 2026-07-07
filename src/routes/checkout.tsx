import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Tag, X, CheckCircle2, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import type { DeliveryMethod, Coupon } from "@/lib/marketplace-types";

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  phone: z.string().trim().regex(
    /^(\+?55\s?)?(\(?\d{2}\)?\s?)(9\s?\d{4}|\d{4})-?\s?\d{4}$/,
    "Telefone inválido. Use (XX) 9XXXX-XXXX"
  ),
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

function calcDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.type === "percent") {
    return Math.round(subtotal * coupon.value / 100);
  }
  return Math.min(coupon.value, subtotal);
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalCents, clear, hydrated } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethod>("pickup");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Cupom
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Frete estimado (via WhatsApp — sem API externa por enquanto)
  const [shippingNote, setShippingNote] = useState("");

  useEffect(() => {
    if (hydrated && items.length === 0) navigate({ to: "/carrinho" });
  }, [hydrated, items.length, navigate]);

  const fetchCep = async (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado"); return; }
      setRua(data.logradouro ?? "");
      setBairro(data.bairro ?? "");
      setCidade(data.localidade ?? "");
      // Informar sobre frete baseado na cidade
      if (data.localidade) {
        const isSBS = data.localidade.toLowerCase().includes("são bento");
        setShippingNote(isSBS
          ? "📍 São Bento do Sul — frete expresso disponível, combinamos no WhatsApp."
          : `📦 Entrega para ${data.localidade}/${data.uf} via transportadora. Valor combinado no WhatsApp.`
        );
      }
    } catch { /* silencioso */ }
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("active", true)
        .maybeSingle();
      if (error || !data) {
        toast.error("Cupom inválido ou expirado.");
        setCoupon(null);
        return;
      }
      const c = data as Coupon;
      if (c.expires_at && new Date(c.expires_at) < new Date()) {
        toast.error("Este cupom expirou.");
        return;
      }
      if (c.max_uses !== null && c.uses >= c.max_uses) {
        toast.error("Este cupom já atingiu o limite de uso.");
        return;
      }
      if (totalCents < c.min_order_cents) {
        toast.error(`Pedido mínimo de ${formatBRL(c.min_order_cents)} para este cupom.`);
        return;
      }
      setCoupon(c);
      toast.success(`Cupom "${c.code}" aplicado!`);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => { setCoupon(null); setCouponInput(""); };

  const discountCents = coupon ? calcDiscount(coupon, totalCents) : 0;
  const finalTotal = Math.max(0, totalCents - discountCents);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, phone, email, notes });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (delivery === "whatsapp_shipping" && (!rua.trim() || !numero.trim() || !cidade.trim())) {
      toast.error("Preencha o endereço para envio (rua, número e cidade).");
      return;
    }
    setSubmitting(true);
    try {
      const enderecoBlock = delivery === "whatsapp_shipping" || rua.trim()
        ? `Endereço: ${rua}, ${numero} — ${bairro} — ${cidade}${cep ? ` (CEP ${cep})` : ""}`
        : "";
      const descontoBlock = coupon ? `Cupom: ${coupon.code} (-${formatBRL(discountCents)})` : "";
      const pagamentoBlock = `Pagamento preferido: ${payment}`;
      const notasFinais = [enderecoBlock, descontoBlock, pagamentoBlock, parsed.data.notes]
        .filter(Boolean).join(" | ");

      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name: parsed.data.name,
          customer_phone: parsed.data.phone,
          customer_email: parsed.data.email || null,
          items,
          total_cents: finalTotal,
          delivery_method: delivery,
          notes: notasFinais || null,
          coupon_code: coupon?.code ?? null,
          discount_cents: discountCents,
        })
        .select("id")
        .single();
      if (error) throw error;

      // Incrementar uso do cupom
      if (coupon) {
        await supabase.from("coupons").update({ uses: coupon.uses + 1 }).eq("id", coupon.id);
      }

      track("checkout_submit", {
        order_id: data.id,
        total_cents: finalTotal,
        discount_cents: discountCents,
        coupon_code: coupon?.code ?? "",
        items_count: items.length,
        delivery_method: delivery,
        payment_method: payment,
      });

      const url = buildOrderWhatsappUrl({
        orderId: data.id,
        customerName: parsed.data.name,
        items,
        totalCents: finalTotal,
        deliveryMethod: delivery,
        notes: notasFinais,
      });
      clear();
      toast.success("Pedido registrado! Abrindo WhatsApp...");
      window.open(url, "_blank");
      navigate({ to: "/pedido-confirmado", search: { id: data.id, name: parsed.data.name } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto py-4 px-4">
          <Link to="/carrinho" className="flex items-center gap-2 text-sm hover:text-primary">
            <ArrowLeft className="w-4 h-4" /> Voltar ao carrinho
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Finalizar pedido</h1>

        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {/* Dados */}
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

            {/* Entrega */}
            <Card>
              <CardHeader><CardTitle>Entrega</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <RadioGroup value={delivery} onValueChange={(v) => setDelivery(v as DeliveryMethod)}>
                  <div className="flex items-start gap-2 p-3 border rounded-md">
                    <RadioGroupItem value="pickup" id="d1" className="mt-1" />
                    <Label htmlFor="d1" className="cursor-pointer">
                      <div className="font-medium">Retirada na loja <Badge variant="secondary" className="ml-2 text-xs">Grátis</Badge></div>
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

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle>Endereço {delivery === "pickup" && <span className="text-sm font-normal text-muted-foreground">(opcional para retirada)</span>}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" value={cep} onChange={(e) => setCep(e.target.value)} onBlur={(e) => fetchCep(e.target.value)} placeholder="89281-100" maxLength={9} />
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
                {shippingNote && delivery === "whatsapp_shipping" && (
                  <div className="sm:col-span-6 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                    {shippingNote}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagamento */}
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
                    <label key={op.v} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${payment === op.v ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
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

            {/* Observações */}
            <Card>
              <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
              <CardContent>
                <Textarea placeholder="Alguma observação sobre o pedido?" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </CardContent>
            </Card>
          </div>

          {/* Resumo */}
          <div>
            <Card className="sticky top-20">
              <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.map((i) => (
                  <div key={`${i.product_id}::${i.variant_id ?? ""}`} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{i.quantity}× {i.name}</span>
                    <span className="shrink-0">{formatBRL(i.price_cents * i.quantity)}</span>
                  </div>
                ))}

                {/* Cupom */}
                <div className="pt-2 border-t">
                  {coupon ? (
                    <div className="flex items-center justify-between gap-2 text-sm bg-emerald-500/10 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        {coupon.code}
                        {coupon.type === "percent" ? ` (−${coupon.value}%)` : ` (−${formatBRL(coupon.value)})`}
                      </div>
                      <button type="button" onClick={removeCoupon}>
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Cupom de desconto"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                        className="h-9 text-sm"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={applyCoupon} disabled={couponLoading} className="shrink-0">
                        {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Totais */}
                <div className="pt-2 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatBRL(totalCents)}</span>
                  </div>
                  {discountCents > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-medium">
                      <span>Desconto</span>
                      <span>−{formatBRL(discountCents)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-1">
                    <span>Total</span>
                    <span>{formatBRL(finalTotal)}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting || items.length === 0}>
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : "Enviar via WhatsApp"}
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
