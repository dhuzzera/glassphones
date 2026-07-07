import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Wrench,
  Smartphone,
  Share2,
  Copy,
  Check,
  Truck,
  ShieldCheck,
  Store,
  Star,
  MapPin,
  Minus,
  Plus,
  X,
  ZoomIn,
  Recycle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Category, ProductVariant } from "@/lib/marketplace-types";
import { formatBRL, buildServiceInquiryUrl, WHATSAPP_NUMBER } from "@/lib/marketplace";
import { useCart } from "@/hooks/use-cart";
import { useSiteSettings } from "@/hooks/use-site-content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/lib/site";
import { ProductSocialProof } from "@/components/product-social-proof";
import { CIDADES } from "@/lib/cidades";

const BASE_URL = "https://www.glassphone.com.br";

export const Route = createFileRoute("/loja/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("products")
      .select("name, description, price_cents, image_urls, slug")
      .eq("slug", params.slug)
      .eq("active", true)
      .maybeSingle();
    return { product: data };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.product;
    if (!p) {
      return {
        meta: [
          { title: "Produto — Glass Phone SBS" },
          { name: "description", content: "Confira os detalhes deste produto na Glass Phone SBS." },
        ],
      };
    }
    const price = (p.price_cents / 100).toFixed(2);
    const title = `${p.name} — Comprar na Glass Phone SBS`;
    const desc =
      (p.description ?? `Compre ${p.name} com garantia, entrega para todo o Brasil e retirada em São Bento do Sul.`)
        .slice(0, 158);
    const url = `${BASE_URL}/loja/${params.slug}`;
    const img = p.image_urls?.[0];
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(img ? [{ property: "og:image", content: img }] : []),
        ...(img ? [{ name: "twitter:image", content: img }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: desc,
            image: img ? [img] : undefined,
            brand: { "@type": "Brand", name: "Glass Phone SBS" },
            offers: {
              "@type": "Offer",
              price,
              priceCurrency: "BRL",
              availability: "https://schema.org/InStock",
              url,
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "127",
            },
          }),
        },
      ],
    };
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { get } = useSiteSettings();
  const [selectedImg, setSelectedImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });

  const { data: category } = useQuery({
    queryKey: ["category", product?.category_id],
    enabled: !!product?.category_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", product!.category_id!)
        .maybeSingle();
      if (error) throw error;
      return data as Category | null;
    },
  });

  const { data: variants = [] } = useQuery({
    queryKey: ["variants", product?.id],
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

  const { data: related = [] } = useQuery({
    queryKey: ["related", product?.category_id, product?.id],
    enabled: !!product,
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("kind", product!.kind)
        .neq("id", product!.id)
        .limit(4);
      if (product!.category_id) q = q.eq("category_id", product!.category_id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleHeader />
        <div className="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted animate-pulse rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-12 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-24 bg-muted animate-pulse rounded" />
            <div className="h-12 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleHeader />
        <div className="container mx-auto p-8 text-center">
          <p className="text-muted-foreground">Produto não encontrado.</p>
          <Link to="/loja">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para a loja
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isService = product.kind === "service";
  const hasVariants = variants.length > 0;

  // Attribute name -> ordered unique values (from all variants)
  const attrGroups: Record<string, string[]> = {};
  for (const v of variants) {
    for (const [k, val] of Object.entries(v.attributes ?? {})) {
      if (!attrGroups[k]) attrGroups[k] = [];
      if (!attrGroups[k].includes(val)) attrGroups[k].push(val);
    }
  }
  const attrNames = Object.keys(attrGroups);

  const activeVariant: ProductVariant | null = hasVariants
    ? variants.find((v) =>
        attrNames.every((k) => (v.attributes?.[k] ?? "") === (selectedAttrs[k] ?? ""))
      ) ?? null
    : null;
  const allAttrsPicked = attrNames.every((k) => selectedAttrs[k]);
  const variantLabel = allAttrsPicked
    ? attrNames.map((k) => `${k}: ${selectedAttrs[k]}`).join(" · ")
    : null;

  const effectivePrice =
    activeVariant?.price_cents ?? product.price_cents;
  const effectiveStock = hasVariants
    ? activeVariant?.stock ?? null
    : product.stock;
  const effectiveImgList = activeVariant?.image_url
    ? [activeVariant.image_url, ...product.image_urls]
    : product.image_urls;
  const img = effectiveImgList[selectedImg];
  const inStock = effectiveStock === null || effectiveStock > 0;
  const lowStock = effectiveStock !== null && effectiveStock > 0 && effectiveStock <= 3;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `${product.name} — ${formatBRL(effectivePrice)}`;
  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;

  const handleAdd = (redirect = false) => {
    if (hasVariants && !activeVariant) {
      toast.error("Selecione uma variação antes de adicionar ao carrinho.");
      return;
    }
    for (let i = 0; i < qty; i++) {
      add({
        product_id: product.id,
        variant_id: activeVariant?.id ?? null,
        variant_label: variantLabel,
        name: product.name,
        price_cents: effectivePrice,
        kind: product.kind,
      });
    }
    if (redirect) navigate({ to: "/checkout" });
    else toast.success(`${qty}× ${product.name} adicionado ao carrinho`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: shareText, url: shareUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />

      <main className="container mx-auto px-4 py-6 md:py-10">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto">
          <Link to="/" className="hover:text-primary shrink-0">Início</Link>
          <span>/</span>
          <Link to="/loja" className="hover:text-primary shrink-0">Loja</Link>
          {category && (
            <>
              <span>/</span>
              <span className="shrink-0">{category.name}</span>
            </>
          )}
          <span>/</span>
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-8">
          {/* Left: Gallery */}
          <div className="space-y-4">
            <div
              className="relative aspect-square bg-muted rounded-2xl overflow-hidden group cursor-zoom-in border border-border"
              onClick={() => img && setZoomOpen(true)}
            >
              {img ? (
                <>
                  <img src={img} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute top-3 right-3 bg-background/80 backdrop-blur rounded-full p-2 opacity-0 group-hover:opacity-100 transition">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  {isService ? <Wrench className="w-24 h-24" /> : <Smartphone className="w-24 h-24" />}
                </div>
              )}
              {product.featured && (
                <Badge className="absolute top-3 left-3" variant="secondary">Destaque</Badge>
              )}
            </div>

            {effectiveImgList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {effectiveImgList.map((u, i) => (
                  <button
                    key={`${u}-${i}`}
                    onClick={() => setSelectedImg(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                      i === selectedImg ? "border-primary" : "border-transparent hover:border-border"
                    }`}
                    aria-label={`Imagem ${i + 1}`}
                  >
                    <img src={u} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info & Actions */}
          <div className="space-y-6">
            <div>
              {category && <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{category.name}</p>}
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">{product.name}</h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-0.5 text-yellow-500">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <span>4.9 · Loja verificada</span>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5">
              <p className="text-sm text-muted-foreground">Preço</p>
              <p className="mt-1 text-4xl font-bold text-primary">{formatBRL(effectivePrice)}</p>

              {hasVariants && (
                <div className="mt-5 space-y-4">
                  {attrNames.map((name) => (
                    <div key={name}>
                      <p className="text-sm font-medium mb-2">
                        {name}
                        {selectedAttrs[name] && (
                          <span className="text-muted-foreground font-normal">: {selectedAttrs[name]}</span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {attrGroups[name].map((val) => {
                          const selected = selectedAttrs[name] === val;
                          // check if any variant matches current selection + this option is active
                          const wouldSelect = { ...selectedAttrs, [name]: val };
                          const match = variants.find((v) =>
                            attrNames.every((k) => (v.attributes?.[k] ?? "") === (wouldSelect[k] ?? ""))
                          );
                          const disabled = !!wouldSelect && !variants.some((v) => v.attributes?.[name] === val);
                          const outOfStock = match && match.stock !== null && match.stock <= 0;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setSelectedAttrs((s) => ({ ...s, [name]: val }))}
                              disabled={disabled}
                              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background hover:border-primary/50"
                              } ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${
                                outOfStock && !selected ? "line-through opacity-60" : ""
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {!allAttrsPicked && (
                    <p className="text-xs text-muted-foreground">Selecione todas as variações.</p>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                {inStock ? (
                  <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
                    <Check className="w-3 h-3 mr-1" />
                    {lowStock ? `Últimas ${effectiveStock} unidades` : "Em estoque"}
                  </Badge>
                ) : (
                  <Badge variant="destructive">Esgotado</Badge>
                )}
                {isService && <Badge variant="outline">Serviço</Badge>}
                {activeVariant?.sku && (
                  <Badge variant="outline" className="text-xs">SKU: {activeVariant.sku}</Badge>
                )}
              </div>

              {!isService && inStock && (
                <div className="mt-5 flex items-center gap-3">
                  <span className="text-sm font-medium">Quantidade</span>
                  <div className="inline-flex items-center rounded-full border border-border">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="h-9 w-9 grid place-items-center hover:bg-muted rounded-l-full transition"
                      aria-label="Diminuir"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-semibold">{qty}</span>
                    <button
                      onClick={() => setQty(q => (effectiveStock !== null ? Math.min(effectiveStock, q + 1) : q + 1))}
                      className="h-9 w-9 grid place-items-center hover:bg-muted rounded-r-full transition"
                      aria-label="Aumentar"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2">
                {isService ? (
                  <a href={buildServiceInquiryUrl(product.name)} target="_blank" rel="noopener noreferrer" className="block">
                    <Button size="lg" className="w-full bg-whatsapp text-whatsapp-foreground hover:opacity-90">
                      <WhatsAppIcon className="w-4 h-4 mr-2" />
                      Agendar pelo WhatsApp
                    </Button>
                  </a>
                ) : (
                  <>
                    <Button size="lg" className="w-full" disabled={!inStock || (hasVariants && !activeVariant)} onClick={() => handleAdd(true)}>
                      {hasVariants && !activeVariant ? "Selecione a variação" : "Comprar agora"}
                    </Button>
                    <Button size="lg" variant="outline" className="w-full" disabled={!inStock || (hasVariants && !activeVariant)} onClick={() => handleAdd(false)}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Adicionar ao carrinho
                    </Button>
                  </>
                )}
              </div>

              {/* Share */}
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Compartilhar</p>
                <div className="flex flex-wrap gap-2">
                  <a href={waShareUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <WhatsAppIcon className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </a>
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copiado" : "Copiar link"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleNativeShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Mais
                  </Button>
                </div>
              </div>
            </div>

            {/* Battery health */}
            {!isService && product.battery_health !== null && product.battery_health !== undefined && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Saúde da bateria</p>
                  <span className="text-lg font-bold text-primary">{product.battery_health}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, product.battery_health))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Trade-in CTA — atribui produto + cidade (se veio de /em/$cidade) */}
            {!isService && (() => {
              const cidadeParam =
                typeof window !== "undefined"
                  ? new URLSearchParams(window.location.search).get("cidade") ?? ""
                  : "";
              const qs = new URLSearchParams({
                produto: product.slug,
                origem: "produto",
                ...(cidadeParam ? { cidade: cidadeParam } : {}),
              }).toString();
              return (
                <a href={`/trade-in?${qs}`} className="block">
                  <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-4 hover:border-primary transition">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                        <Recycle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">Troque seu usado neste {product.name.split(" ").slice(0, 2).join(" ")}</p>
                        <p className="text-xs text-muted-foreground">Estimativa em segundos · desconto direto</p>
                      </div>
                      <ArrowLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
                    </div>
                  </div>
                </a>
              );
            })()}

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40">
                <Truck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div><p className="font-semibold">Entrega</p><p className="text-muted-foreground text-xs">Todo o Brasil</p></div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div><p className="font-semibold">Garantia</p><p className="text-muted-foreground text-xs">90 dias</p></div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40">
                <Store className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div><p className="font-semibold">Retirada</p><p className="text-muted-foreground text-xs">Loja física</p></div>
              </div>
            </div>

            {/* Seller */}
            <Card>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold text-lg shrink-0">
                  GP
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">Glass Phone SBS</p>
                    <Badge variant="secondary" className="shrink-0"><ShieldCheck className="w-3 h-3 mr-1" />Verificada</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {get("contact.address_line2")}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>⭐ 4.9 (127 avaliações)</span>
                    <span>·</span>
                    <span>{get("contact.hours")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-4">Descrição</h2>
            <Separator className="mb-6" />
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
              {product.description}
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Produtos relacionados</h2>
              <Link to="/loja" className="text-sm text-primary hover:underline">Ver tudo</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map(p => (
                <Link
                  key={p.id}
                  to="/loja/$slug"
                  params={{ slug: p.slug }}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition"
                >
                  <div className="aspect-square bg-muted overflow-hidden">
                    {p.image_urls[0] ? (
                      <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-muted-foreground">
                        <Smartphone className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                    <p className="mt-1 text-primary font-bold">{formatBRL(p.price_cents)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Prova social */}
        {!isService && <ProductSocialProof productId={product.id} productName={product.name} />}

        {/* SEO local: onde comprar este produto */}
        {!isService && (
          <section className="mt-12" aria-labelledby="onde-comprar-titulo">
            <h2 id="onde-comprar-titulo" className="text-xl font-bold mb-4">
              Onde comprar {product.name}
            </h2>
            <Separator className="mb-6" />
            <p className="text-sm text-muted-foreground mb-4">
              Atendemos com entrega rápida e retirada combinada em toda a região:
            </p>
            <div className="flex flex-wrap gap-2">
              {CIDADES.map((c) => (
                <Link
                  key={c.slug}
                  to="/em/$cidade"
                  params={{ cidade: c.slug }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition"
                >
                  {product.name.split(" ").slice(0, 3).join(" ")} em {c.nome}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Zoom Lightbox */}
      {zoomOpen && img && (
        <div
          className="fixed inset-0 z-50 bg-black/90 grid place-items-center p-4"
          onClick={() => setZoomOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setZoomOpen(false)}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={img}
            alt={product.name}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function SimpleHeader() {
  const { count } = useCart();
  return (
    <header className="border-b bg-card sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between py-4 px-4 gap-4">
        <Link to="/loja" className="flex items-center gap-2 text-sm font-medium hover:text-primary shrink-0">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Voltar para a loja</span>
        </Link>
        <Link to="/" className="text-lg font-bold truncate">Glass Phone SBS</Link>
        <Link to="/carrinho">
          <Button variant="outline" size="sm" className="relative">
            <ShoppingCart className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Carrinho</span>
            {count > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1">{count}</Badge>
            )}
          </Button>
        </Link>
      </div>
    </header>
  );
}
