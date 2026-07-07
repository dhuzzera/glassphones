import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { ShoppingCart, Search, Wrench, Smartphone, ChevronRight, Sparkles, Pencil, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Category, ProductVariant } from "@/lib/marketplace-types";
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

const searchSchema = z.object({
  tab: fallback(z.enum(["product", "service"]), "product").default("product"),
  cat: fallback(z.string().nullable(), null).default(null),
  q: fallback(z.string(), "").default(""),
  cap: fallback(z.array(z.string()), []).default([]),
  cor: fallback(z.array(z.string()), []).default([]),
  cond: fallback(z.array(z.string()), []).default([]),
  min: fallback(z.number(), 0).default(0),
  max: fallback(z.number(), 0).default(0),
});

export const Route = createFileRoute("/loja")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Loja — Celulares, iPhone e Assistência | Glass Phone SBS" },
      { name: "description", content: "Celulares novos e seminovos, acessórios e serviços de assistência técnica em São Bento do Sul. Filtre por modelo, capacidade, cor e preço." },
      { property: "og:title", content: "Loja — Glass Phone SBS" },
      { property: "og:description", content: "Filtre iPhones e Samsungs por capacidade, cor e faixa de preço." },
      { property: "og:url", content: "https://glassphones.lovable.app/loja" },
    ],
    links: [{ rel: "canonical", href: "https://glassphones.lovable.app/loja" }],
  }),
  component: LojaPage,
});

function LojaPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [quickSlug, setQuickSlug] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { count } = useCart();
  const { get } = useSiteSettings();

  const setSearch = (patch: Partial<z.infer<typeof searchSchema>>) => {
    navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch }), replace: true });
  };
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", search.tab, search.cat],
    queryFn: async () => {
      let q = supabase.from("products").select("*").eq("active", true).eq("kind", search.tab);
      if (search.cat) q = q.eq("category_id", search.cat);
      const { data, error } = await q.order("featured", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  // Variantes dos produtos visíveis para extrair capacidades/cores disponíveis
  const productIds = products.map((p) => p.id);
  const { data: variants = [] } = useQuery({
    queryKey: ["variants-loja", productIds.join(",")],
    enabled: search.tab === "product" && productIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .in("product_id", productIds)
        .eq("active", true);
      if (error) throw error;
      return (data ?? []) as ProductVariant[];
    },
  });

  const { data: featuredProducts = [] } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products").select("*")
        .eq("active", true).eq("featured", true).eq("kind", "product")
        .order("created_at", { ascending: false }).limit(8);
      if (error) throw error;
      return data as Product[];
    },
  });

  // opções derivadas
  const { capacidades, cores, priceMin, priceMax } = useMemo(() => {
    const caps = new Set<string>();
    const cols = new Set<string>();
    for (const v of variants) {
      const a = v.attributes ?? {};
      if (a["Capacidade"]) caps.add(a["Capacidade"]);
      if (a["Cor"]) cols.add(a["Cor"]);
    }
    const prices = products.map((p) => p.price_cents).filter((n) => n > 0);
    return {
      capacidades: [...caps].sort(),
      cores: [...cols].sort(),
      priceMin: prices.length ? Math.min(...prices) : 0,
      priceMax: prices.length ? Math.max(...prices) : 0,
    };
  }, [variants, products]);

  const activeMin = search.min || priceMin;
  const activeMax = search.max || priceMax;

  const filtered = useMemo(() => {
    const s = search.q.toLowerCase();
    return products.filter((p) => {
      if (s && !p.name.toLowerCase().includes(s)) return false;
      if (activeMax > 0 && (p.price_cents < activeMin || p.price_cents > activeMax)) return false;
      if (search.cond.length > 0) {
        const cond = (p as Product & { condition?: string }).condition ?? null;
        if (!cond || !search.cond.includes(cond)) return false;
      }
      if (search.cap.length > 0 || search.cor.length > 0) {
        const pVars = variants.filter((v) => v.product_id === p.id);
        if (pVars.length === 0) return false;
        const okCap =
          search.cap.length === 0 ||
          pVars.some((v) => search.cap.includes(v.attributes?.["Capacidade"] ?? ""));
        const okCor =
          search.cor.length === 0 ||
          pVars.some((v) => search.cor.includes(v.attributes?.["Cor"] ?? ""));
        if (!okCap || !okCor) return false;
      }
      return true;
    });
  }, [products, variants, search.q, search.cap, search.cor, search.cond, activeMin, activeMax]);

  const catsForTab = categories.filter((c) => c.type === search.tab);
  const featuredCats = categories.filter((c) => c.type === "product" && c.featured);
  const heroImage = get("home.hero_image");
  const heroTitle = get("home.hero_title") || "Tecnologia com atendimento humano";
  const heroSubtitle = get("home.hero_subtitle") || "Smartphones, acessórios e assistência técnica em São Bento do Sul.";

  const activeFilterCount =
    search.cap.length + search.cor.length + search.cond.length + (search.min > 0 || search.max > 0 ? 1 : 0);

  const toggleArrayFilter = (key: "cap" | "cor" | "cond", value: string) => {
    const arr = search[key];
    const next = arr.includes(value) ? arr.filter((x: string) => x !== value) : [...arr, value];
    setSearch({ [key]: next } as Partial<z.infer<typeof searchSchema>>);
  };

  const clearFilters = () =>
    setSearch({ q: "", cap: [], cor: [], cond: [], min: 0, max: 0 });

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
            style={heroImage ? { backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/40" />
          <div className="relative container mx-auto px-4 py-16 md:py-24 max-w-3xl">
            <Badge variant="secondary" className="mb-4"><Sparkles className="w-3 h-3 mr-1" /> Loja oficial Glass Phone SBS</Badge>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">{heroTitle}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl">{heroSubtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#novidades"><Button size="lg">Ver novidades</Button></a>
              <a href={`https://wa.me/${get("contact.whatsapp_number")}`} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline"><WhatsAppIcon className="w-4 h-4 mr-2" /> Falar no WhatsApp</Button>
              </a>
            </div>
          </div>
        </section>

        {featuredCats.length > 0 && (
          <section className="container mx-auto px-4 py-10">
            <div className="mb-6"><h2 className="text-2xl font-bold">Explore por categoria</h2></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSearch({ tab: "product", cat: c.id });
                    document.getElementById("novidades")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group text-left rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg hover:border-primary/40 transition"
                >
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-muted-foreground"><Smartphone className="w-12 h-12" /></div>
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

        {featuredProducts.length > 0 && (
          <section className="container mx-auto px-4 py-6">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-2xl font-bold">Destaques</h2>
              <a href="#novidades" className="text-sm text-primary hover:underline">Ver todos</a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} onQuickView={setQuickSlug} />)}
            </div>
          </section>
        )}

        {/* NOVIDADES / CATALOG WITH FILTERS */}
        <section id="novidades" className="container mx-auto px-4 py-10 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6">Novidades</h2>

          <Tabs value={search.tab} onValueChange={(v) => setSearch({ tab: v as "product" | "service", cat: null, cap: [], cor: [], min: 0, max: 0 })}>
            <TabsList>
              <TabsTrigger value="product"><Smartphone className="w-4 h-4 mr-2" />Produtos</TabsTrigger>
              <TabsTrigger value="service"><Wrench className="w-4 h-4 mr-2" />Serviços</TabsTrigger>
            </TabsList>

            <div className="my-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9" value={search.q} onChange={(e) => setSearch({ q: e.target.value })} />
              </div>
              {catsForTab.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={search.cat === null ? "default" : "outline"} onClick={() => setSearch({ cat: null })}>Todas</Button>
                  {catsForTab.map((c) => (
                    <Button key={c.id} size="sm" variant={search.cat === c.id ? "default" : "outline"} onClick={() => setSearch({ cat: c.id })}>{c.name}</Button>
                  ))}
                </div>
              )}
            </div>

            {search.tab === "product" && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={filtersOpen ? "default" : "outline"}
                  onClick={() => setFiltersOpen((v) => !v)}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtros avançados
                  {activeFilterCount > 0 && (
                    <Badge className="ml-2 h-5 min-w-5 px-1.5" variant="secondary">{activeFilterCount}</Badge>
                  )}
                </Button>
                {activeFilterCount > 0 && (
                  <Button size="sm" variant="ghost" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" /> Limpar filtros
                  </Button>
                )}
                <span className="text-sm text-muted-foreground ml-auto">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
              </div>
            )}

            {filtersOpen && search.tab === "product" && (
              <div className="mb-6 rounded-2xl border border-border bg-card p-5 space-y-5">
                {capacidades.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Capacidade</p>
                    <div className="flex flex-wrap gap-2">
                      {capacidades.map((c) => {
                        const on = search.cap.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleArrayFilter("cap", c)}
                            className={`px-3 py-1.5 rounded-full border text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                          >{c}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {cores.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Cor</p>
                    <div className="flex flex-wrap gap-2">
                      {cores.map((c) => {
                        const on = search.cor.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleArrayFilter("cor", c)}
                            className={`px-3 py-1.5 rounded-full border text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                          >{c}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold mb-2">Condição</p>
                  <div className="flex flex-wrap gap-2">
                    {(["novo", "semi-novo", "usado"] as const).map((c) => {
                      const labels = { novo: "Novo", "semi-novo": "Semi-novo", usado: "Usado" };
                      const on = search.cond.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleArrayFilter("cond", c)}
                          className={`px-3 py-1.5 rounded-full border text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                        >{labels[c]}</button>
                      );
                    })}
                  </div>
                </div>
                {priceMax > priceMin && (
                  <div>
                    <p className="text-sm font-semibold mb-2">
                      Faixa de preço: {formatBRL(activeMin)} — {formatBRL(activeMax)}
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={priceMin / 100}
                        max={priceMax / 100}
                        value={activeMin / 100}
                        onChange={(e) => setSearch({ min: Math.round(Number(e.target.value) * 100) })}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">até</span>
                      <Input
                        type="number"
                        min={priceMin / 100}
                        max={priceMax / 100}
                        value={activeMax / 100}
                        onChange={(e) => setSearch({ max: Math.round(Number(e.target.value) * 100) })}
                        className="w-32"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

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
