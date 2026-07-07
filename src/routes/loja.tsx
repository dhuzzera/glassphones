import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ShoppingCart, Search, Wrench, Smartphone, ChevronRight, Sparkles, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Category } from "@/lib/marketplace-types";
import { formatBRL, buildServiceInquiryUrl } from "@/lib/marketplace";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteShell } from "@/components/site-shell";
import { ProductQuickView } from "@/components/product-quick-view";
import { WhatsAppIcon } from "@/lib/site";

export const Route = createFileRoute("/loja")({
  head: () => ({
    meta: [
      { title: "Loja — Glass Phone SBS" },
      { name: "description", content: "Compre celulares, acessórios e contrate serviços de assistência técnica." },
      { property: "og:title", content: "Loja — Glass Phone SBS" },
      { property: "og:description", content: "Produtos e serviços da Glass Phone SBS." },
    ],
  }),
  component: LojaPage,
});

function LojaPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"product" | "service">("product");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);
  const { count } = useCart();
  const { get } = useSiteSettings();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", tab, categoryId],
    queryFn: async () => {
      let q = supabase.from("products").select("*").eq("active", true).eq("kind", tab);
      if (categoryId) q = q.eq("category_id", categoryId);
      const { data, error } = await q.order("featured", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: featuredProducts = [] } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("featured", true)
        .eq("kind", "product")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as Product[];
    },
  });

  const filtered = useMemo(() => {
    if (!search) return products;
    const s = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(s));
  }, [products, search]);

  const catsForTab = categories.filter((c) => c.type === tab);
  const featuredCats = categories.filter((c) => c.type === "product" && c.featured);
  const heroImage = get("home.hero_image");
  const heroTitle = get("home.hero_title") || "Tecnologia com atendimento humano";
  const heroSubtitle = get("home.hero_subtitle") || "Smartphones, acessórios e assistência técnica em São Bento do Sul.";

  return (
    <SiteShell>
      <div className="min-h-screen bg-background">
        {count > 0 && (
          <div className="container mx-auto px-4 pt-4 flex justify-end">
            <Link to="/carrinho">
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Carrinho
                <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1">{count}</Badge>
              </Button>
            </Link>
          </div>
        )}
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="absolute inset-0"
            style={
              heroImage
                ? { backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/40" />
          <div className="relative container mx-auto px-4 py-16 md:py-24 max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" /> Loja oficial Glass Phone SBS
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">{heroTitle}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl">{heroSubtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#novidades">
                <Button size="lg">Ver novidades</Button>
              </a>
              <a
                href={`https://wa.me/${get("contact.whatsapp_number")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline">
                  <WhatsAppIcon className="w-4 h-4 mr-2" /> Falar no WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* FEATURED CATEGORIES */}
        {featuredCats.length > 0 && (
          <section className="container mx-auto px-4 py-10">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Explore por categoria</h2>
                <p className="text-sm text-muted-foreground">Encontre rápido o que procura.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setTab("product");
                    setCategoryId(c.id);
                    document.getElementById("novidades")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group text-left rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg hover:border-primary/40 transition"
                >
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-muted-foreground">
                        <Smartphone className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="font-semibold">{c.name}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* FEATURED PRODUCTS */}
        {featuredProducts.length > 0 && (
          <section className="container mx-auto px-4 py-6">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-2xl font-bold">Destaques</h2>
              <a href="#novidades" className="text-sm text-primary hover:underline">
                Ver todos
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={setQuickSlug} />
              ))}
            </div>
          </section>
        )}

        {/* NOVIDADES / CATALOG WITH FILTERS */}
        <section id="novidades" className="container mx-auto px-4 py-10 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6">Novidades</h2>

          <Tabs value={tab} onValueChange={(v) => { setTab(v as "product" | "service"); setCategoryId(null); }}>
            <TabsList>
              <TabsTrigger value="product"><Smartphone className="w-4 h-4 mr-2" />Produtos</TabsTrigger>
              <TabsTrigger value="service"><Wrench className="w-4 h-4 mr-2" />Serviços</TabsTrigger>
            </TabsList>

            <div className="my-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {catsForTab.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={categoryId === null ? "default" : "outline"} onClick={() => setCategoryId(null)}>Todas</Button>
                  {catsForTab.map((c) => (
                    <Button key={c.id} size="sm" variant={categoryId === c.id ? "default" : "outline"} onClick={() => setCategoryId(c.id)}>{c.name}</Button>
                  ))}
                </div>
              )}
            </div>

            <TabsContent value="product" className="mt-0">
              <ProductGrid products={filtered} loading={isLoading} kind="product" onQuickView={setQuickSlug} />
            </TabsContent>
            <TabsContent value="service" className="mt-0">
              <ProductGrid products={filtered} loading={isLoading} kind="service" onQuickView={setQuickSlug} />
            </TabsContent>
          </Tabs>
        </section>
      </main>
      </div>
      <ProductQuickView slug={quickSlug} onClose={() => setQuickSlug(null)} />
    </SiteShell>
  );
}


function ProductGrid({ products, loading, kind, onQuickView }: { products: Product[]; loading: boolean; kind: "product" | "service"; onQuickView: (slug: string) => void }) {
  if (loading) return <p className="text-muted-foreground">Carregando...</p>;
  if (products.length === 0) return <p className="text-muted-foreground">Nenhum {kind === "product" ? "produto" : "serviço"} encontrado.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((p) => <ProductCard key={p.id} product={p} onQuickView={onQuickView} />)}
    </div>
  );
}

function ProductCard({ product, onQuickView }: { product: Product; onQuickView: (slug: string) => void }) {
  const { isAdmin } = useAuth();
  const img = product.image_urls[0];
  const isService = product.kind === "service";

  return (
    <Card className="overflow-hidden flex flex-col group hover:shadow-lg transition relative">
      {isAdmin && (
        <Link
          to="/admin/produtos"
          aria-label="Editar produto"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 z-10 h-8 w-8 grid place-items-center rounded-full bg-foreground text-background shadow-md hover:bg-primary transition"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      )}
      <button type="button" onClick={() => onQuickView(product.slug)} className="text-left">
        <div className="aspect-square bg-muted overflow-hidden">
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {isService ? <Wrench className="w-12 h-12" /> : <Smartphone className="w-12 h-12" />}
            </div>
          )}
        </div>
      </button>
      <CardContent className="p-4 flex-1">
        <button type="button" onClick={() => onQuickView(product.slug)} className="hover:underline text-left w-full">
          <h3 className="font-semibold line-clamp-2">{product.name}</h3>
        </button>
        <p className="mt-2 text-xl font-bold text-primary">{formatBRL(product.price_cents)}</p>
        <p className="text-xs text-muted-foreground">
          ou 12x de {formatBRL(Math.round(product.price_cents / 12))}
        </p>
        {product.featured && <Badge className="mt-2" variant="secondary">Destaque</Badge>}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {isService ? (
          <a href={buildServiceInquiryUrl(product.name)} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button variant="default" className="w-full">Agendar pelo WhatsApp</Button>
          </a>
        ) : (
          <Button className="w-full" onClick={() => onQuickView(product.slug)}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Comprar agora
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
