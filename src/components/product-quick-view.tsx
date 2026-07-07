import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Zap, ShieldCheck, CreditCard, ShoppingCart, Pencil, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductVariant } from "@/lib/marketplace-types";
import { formatBRL, buildServiceInquiryUrl } from "@/lib/marketplace";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/lib/site";
import { toast } from "sonner";

interface Props {
  slug: string | null;
  onClose: () => void;
}

export function ProductQuickView({ slug, onClose }: Props) {
  const open = !!slug;
  const { add } = useCart();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  const { data: product, isLoading } = useQuery({
    queryKey: ["quickview-product", slug],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug!)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });

  const { data: variants = [] } = useQuery({
    queryKey: ["quickview-variants", product?.id],
    enabled: !!product,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product!.id)
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as ProductVariant[];
    },
  });

  useEffect(() => {
    if (!open) setSelectedAttrs({});
  }, [open, slug]);

  const attrGroups: Record<string, string[]> = {};
  for (const v of variants) {
    for (const [k, val] of Object.entries(v.attributes ?? {})) {
      if (!attrGroups[k]) attrGroups[k] = [];
      if (!attrGroups[k].includes(val)) attrGroups[k].push(val);
    }
  }
  const attrNames = Object.keys(attrGroups);
  const activeVariant = variants.length
    ? variants.find((v) => attrNames.every((k) => v.attributes?.[k] === selectedAttrs[k])) ?? null
    : null;
  const allPicked = attrNames.every((k) => selectedAttrs[k]);
  const effectivePrice = activeVariant?.price_cents ?? product?.price_cents ?? 0;
  const img = activeVariant?.image_url || product?.image_urls?.[0];
  const isService = product?.kind === "service";

  const doAdd = (goCheckout: boolean) => {
    if (!product) return;
    if (variants.length && !activeVariant) {
      toast.error("Selecione a variação");
      return;
    }
    add({
      product_id: product.id,
      variant_id: activeVariant?.id ?? null,
      variant_label: allPicked ? attrNames.map((k) => `${k}: ${selectedAttrs[k]}`).join(" · ") : null,
      name: product.name,
      price_cents: effectivePrice,
      kind: product.kind,
    });
    if (goCheckout) {
      onClose();
      navigate({ to: "/checkout" });
    } else {
      toast.success("Adicionado ao carrinho");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[92vh] overflow-y-auto">
        <DialogTitle className="sr-only">{product?.name ?? "Produto"}</DialogTitle>
        {isLoading || !product ? (
          <div className="p-10 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="bg-muted aspect-square md:aspect-auto md:min-h-[420px] relative">
              {img ? (
                <img src={img} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-muted-foreground">Sem imagem</div>
              )}
              {product.featured && (
                <Badge className="absolute top-3 left-3" variant="secondary">Destaque</Badge>
              )}
              {isAdmin && (
                <button
                  onClick={() => { onClose(); navigate({ to: "/admin/produtos" }); }}
                  className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-foreground text-background shadow-md hover:bg-primary transition"
                  aria-label="Editar produto"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="p-6 md:p-8 flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-bold leading-tight">{product.name}</h2>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-3xl font-black text-primary">{formatBRL(effectivePrice)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">ou 12x de {formatBRL(Math.round(effectivePrice / 12))} sem juros</p>
              </div>

              {attrNames.length > 0 && (
                <div className="space-y-3">
                  {attrNames.map((name) => (
                    <div key={name}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{name}</p>
                      <div className="flex flex-wrap gap-2">
                        {attrGroups[name].map((val) => {
                          const selected = selectedAttrs[name] === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setSelectedAttrs((s) => ({ ...s, [name]: val }))}
                              className={`px-3 py-1.5 rounded-full border text-sm transition ${
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {isService ? (
                  <a href={buildServiceInquiryUrl(product.name)} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="w-full bg-whatsapp text-whatsapp-foreground hover:opacity-90">
                      <WhatsAppIcon className="w-4 h-4 mr-2" /> Agendar pelo WhatsApp
                    </Button>
                  </a>
                ) : (
                  <>
                    <Button size="lg" className="w-full" onClick={() => doAdd(true)}>
                      <ShoppingCart className="w-4 h-4 mr-2" /> Comprar agora
                    </Button>
                    <Button size="lg" variant="outline" className="w-full" onClick={() => doAdd(false)}>
                      + Adicionar ao carrinho
                    </Button>
                  </>
                )}
              </div>

              <div className="grid gap-3">
                <InfoTile icon={Zap} title="Entrega Imediata" desc="Receba seu pacote imediatamente após o pagamento." />
                <InfoTile icon={ShieldCheck} title="Segurança Total" desc="Seus dados são criptografados de ponta-a-ponta durante todo o processo." />
                <InfoTile icon={CreditCard} title="Forma de pagamento" desc="Aceitamos PIX, cartão em até 12x e boleto." />
              </div>

              {product.description && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Descrição</p>
                  <p className="text-sm whitespace-pre-line text-muted-foreground">{product.description}</p>
                </div>
              )}

              <button
                onClick={() => { onClose(); navigate({ to: "/loja/$slug", params: { slug: product.slug } }); }}
                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 self-start"
              >
                <ExternalLink className="h-3 w-3" /> Abrir página completa
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoTile({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-border bg-card/50">
      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
