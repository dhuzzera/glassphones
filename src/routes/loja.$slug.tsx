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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Category } from "@/lib/marketplace-types";
import { formatBRL, buildServiceInquiryUrl, WHATSAPP_NUMBER } from "@/lib/marketplace";
import { useCart } from "@/hooks/use-cart";
import { useSiteSettings } from "@/hooks/use-site-content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/lib/site";

export const Route = createFileRoute("/loja/$slug")({
  head: () => ({
    meta: [
      { title: "Produto — Glass Phone SBS" },
      { name: "description", content: "Confira os detalhes deste produto na Glass Phone SBS." },
    ],
  }),
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
  const img = product.image_urls[selectedImg];
  const inStock = product.stock === null || product.stock > 0;
  const lowStock = product.stock !== null && product.stock > 0 && product.stock <= 3;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `${product.name} — ${formatBRL(product.price_cents)}`;
  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;

  const handleAdd = (redirect = false) => {
    for (let i = 0; i < qty; i++) {
      add({
        product_id: product.id,
        name: product.name,
        price_cents: product.price_cents,
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

            {product.image_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.image_urls.map((u, i) => (
                  <button
                    key={i}
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
              <p className="mt-1 text-4xl font-bold text-primary">{formatBRL(product.price_cents)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ou 12x de {formatBRL(Math.round(product.price_cents / 12))} sem juros
              </p>

              <div className="mt-4 flex items-center gap-2">
                {inStock ? (
                  <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
                    <Check className="w-3 h-3 mr-1" />
                    {lowStock ? `Últimas ${product.stock} unidades` : "Em estoque"}
                  </Badge>
                ) : (
                  <Badge variant="destructive">Esgotado</Badge>
                )}
                {isService && <Badge variant="outline">Serviço</Badge>}
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
                      onClick={() => setQty(q => (product.stock !== null ? Math.min(product.stock, q + 1) : q + 1))}
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
                    <Button size="lg" className="w-full" disabled={!inStock} onClick={() => handleAdd(true)}>
                      Comprar agora
                    </Button>
                    <Button size="lg" variant="outline" className="w-full" disabled={!inStock} onClick={() => handleAdd(false)}>
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
