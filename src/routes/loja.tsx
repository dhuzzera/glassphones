import { createFileRoute, Link, useNavigate as useNav } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { ShoppingCart, Search, Wrench, Smartphone, Pencil, SlidersHorizontal, X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Category, ProductVariant } from "@/lib/marketplace-types";
import { formatBRL, buildServiceInquiryUrl } from "@/lib/marketplace";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteShell } from "@/components/site-shell";
import { ProductGridSkeleton } from "@/components/product-skeleton";
import { WhatsAppIcon } from "@/lib/site";
import { SITE_URL } from "@/lib/site";

const searchSchema = z.object({
  tab: fallback(z.enum(["product", "service"]), "product").default("product"),
  cat: fallback(z.string().nullable(), null).default(null),
  q: fallback(z.string(), "").default(""),
  cap: fallback(z.array(z.string()), []).default([]),
  cor: fallback(z.array(z.string()), []).default([]),
  cond: fallback(z.array(z.string()), []).default([]),
  min: fallback(z.number(), 0).default(0),
  max: fallback(z.number(), 0).default(0),
  page: fallback(z.number(), 1).default(1),
});

const ITEMS_PER_PAGE = 16;

export const Route = createFileRoute("/loja")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Loja — Celulares, iPhone e Assistência | Glass Phone SBS" },
      { name: "description", content: "Celulares novos e seminovos, acessórios e serviços de assistência técnica em São Bento do Sul. Filtre por modelo, capacidade, cor e preço." },
      { property: "og:title", content: "Loja — Glass Phone SBS" },
      { property: "og:description", content: "Filtre iPhones e Samsungs por capacidade, cor e faixa de preço." },
      { property: "og:url", content: `${SITE_URL}/loja` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/loja` }],
  }),
  component: LojaPage,
});

function LojaPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { count } = useCart();

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

  const productIds = products.map((p) => p.id);
  const { data: variants = [] } = useQuery({
    queryKey: ["variants-loja", productIds.join(",")],
    enabled: search.tab === "product" && productIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants").select("*")
        .in("product_id", productIds).eq("active", true);
      if (error) throw error;
      return (data ?? []) as ProductVariant[];
    },
  });

  const { capacidades, cores, priceMin, priceMax } = useMemo(() => {
    const caps = new Set<string>();
    const cols = new Set<string>();
    for (const v of variants) {
      if (v.attributes?.["Capacidade"]) caps.add(v.attributes["Capacidade"]);
      if (v.attributes?.["Cor"]) cols.add(v.attributes["Cor"]);
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
        const cond = p.condition ?? null;
        if (!cond || !search.cond.includes(cond)) return false;
      }
      if (search.cap.length > 0 || search.cor.length > 0) {
        const pVars = variants.filter((v) => v.product_id === p.id);
        if (pVars.length === 0) return false;
        const okCap = search.cap.length === 0 || pVars.some((v) => search.cap.includes(v.attributes?.["Capacidade"] ?? ""));
        const okCor = search.cor.length === 0 || pVars.some((v) => search.cor.includes(v.attributes?.["Cor"] ?? ""));
        if (!okCap || !okCor) return false;
      }
      return true;
    });
  }, [products, variants, search.q, search.cap, search.cor, search.cond, activeMin, activeMax]);

  const catsForTab = categories.filter((c) => c.type === search.tab);
  const activeFilterCount = search.cap.length + search.cor.length + search.cond.length + (search.min > 0 || search.max > 0 ? 1 : 0);

  const toggleFilter = (key: "cap" | "cor" | "cond", value: string) => {
    const arr = search[key];
    const next = arr.includes(value) ? arr.filter((x: string) => x !== value) : [...arr, value];
    setSearch({ [key]: next, page: 1 } as Partial<z.infer<typeof searchSchema>>);
  };

  const clearFilters = () => setSearch({ q: "", cap: [], cor: [], cond: [], min: 0, max: 0, page: 1 });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentPage = Math.max(1, Math.min(search.page, totalPages || 1));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-6">
        {/* Cabeçalho da loja */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Loja</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Celulares, serviços e acessórios com garantia</p>
          </div>
          {count > 0 && (
            <Link to="/carrinho">
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Carrinho
                <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1">{count}</Badge>
              </Button>
            </Link>
          )}
        </div>

        <Tabs value={search.tab} onValueChange={(v) => setSearch({ tab: v as "product" | "service", cat: null, cap: [], cor: [], cond: [], min: 0, max: 0, page: 1 })}>
          <TabsList className="mb-4">
            <TabsTrigger value="product"><Smartphone className="w-4 h-4 mr-2" />Produtos</TabsTrigger>
            <TabsTrigger value="service"><Wrench className="w-4 h-4 mr-2" />Serviços</TabsTrigger>
          </TabsList>

          {/* Busca + categorias */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-9"
                value={search.q}
                onChange={(e) => setSearch({ q: e.target.value, page: 1 })}
              />
            </div>
            {catsForTab.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={search.cat === null ? "default" : "outline"} onClick={() => setSearch({ cat: null, page: 1 })}>
                  Todas
                </Button>
                {catsForTab.map((c) => (
                  <Button key={c.id} size="sm" variant={search.cat === c.id ? "default" : "outline"} onClick={() => setSearch({ cat: c.id, page: 1 })}>
                    {c.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Filtros avançados (só produtos) */}
          {search.tab === "product" && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button size="sm" variant={filtersOpen ? "default" : "outline"} onClick={() => setFiltersOpen((v) => !v)}>
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtros
                {activeFilterCount > 0 && <Badge className="ml-2 h-5 min-w-5 px-1.5" variant="secondary">{activeFilterCount}</Badge>}
              </Button>
              {activeFilterCount > 0 && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" /> Limpar
                </Button>
              )}
              <span className="text-sm text-muted-foreground ml-auto">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {filtersOpen && search.tab === "product" && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-4">
              {capacidades.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Capacidade</p>
                  <div className="flex flex-wrap gap-2">
                    {capacidades.map((c) => (
                      <button key={c} type="button" onClick={() => toggleFilter("cap", c)}
                        className={`px-3 py-1.5 rounded-full border text-sm transition ${search.cap.includes(c) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {cores.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Cor</p>
                  <div className="flex flex-wrap gap-2">
                    {cores.map((c) => (
                      <button key={c} type="button" onClick={() => toggleFilter("cor", c)}
                        className={`px-3 py-1.5 rounded-full border text-sm transition ${search.cor.includes(c) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold mb-2">Condição</p>
                <div className="flex flex-wrap gap-2">
                  {(["novo", "semi-novo", "usado"] as const).map((c) => {
                    const labels = { novo: "Novo", "semi-novo": "Semi-novo", usado: "Usado" };
                    return (
                      <button key={c} type="button" onClick={() => toggleFilter("cond", c)}
                        className={`px-3 py-1.5 rounded-full border text-sm transition ${search.cond.includes(c) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}>
                        {labels[c]}
                      </button>
                    );
                  })}
                </div>
              </div>
              {priceMax > priceMin && (
                <div>
                  <p className="text-sm font-semibold mb-2">Faixa de preço: {formatBRL(activeMin)} — {formatBRL(activeMax)}</p>
                  <div className="flex items-center gap-3">
                    <Input type="number" min={priceMin / 100} max={priceMax / 100} value={activeMin / 100}
                      onChange={(e) => setSearch({ min: Math.round(Number(e.target.value) * 100), page: 1 })} className="w-32" />
                    <span className="text-muted-foreground">até</span>
                    <Input type="number" min={priceMin / 100} max={priceMax / 100} value={activeMax / 100}
                      onChange={(e) => setSearch({ max: Math.round(Number(e.target.value) * 100), page: 1 })} className="w-32" />
                  </div>
                </div>
              )}
            </div>
          )}

          <TabsContent value="product" className="mt-0">
            <ProductGrid products={paginated} loading={isLoading} kind="product" />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPage={(p) => setSearch({ page: p })} />
          </TabsContent>
          <TabsContent value="service" className="mt-0">
            <ProductGrid products={paginated} loading={isLoading} kind="service" />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPage={(p) => setSearch({ page: p })} />
          </TabsContent>
        </Tabs>
      </div>
    </SiteShell>
  );
}

function Pagination({ currentPage, totalPages, onPage }: { currentPage: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPage(currentPage - 1)}>Anterior</Button>
      <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
      <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPage(currentPage + 1)}>Próxima</Button>
    </div>
  );
}

function ProductGrid({ products, loading, kind }: { products: Product[]; loading: boolean; kind: "product" | "service" }) {
  if (loading) return <ProductGridSkeleton count={8} />;
  if (products.length === 0) return (
    <div className="py-16 text-center">
      <p className="text-muted-foreground mb-2">Nenhum {kind === "product" ? "produto" : "serviço"} encontrado.</p>
      <p className="text-xs text-muted-foreground">Tente ajustar os filtros ou a busca.</p>
    </div>
  );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { isAdmin } = useAuth();
  const img = product.image_urls[0];
  const isService = product.kind === "service";

  return (
    <Card className="overflow-hidden flex flex-col group hover:shadow-lg transition relative">
      {isAdmin && (
        <Link to="/admin/produtos" aria-label="Editar produto" onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 z-10 h-8 w-8 grid place-items-center rounded-full bg-foreground text-background shadow-md hover:bg-primary transition">
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      )}

      {/* Imagem → vai para PDP */}
      <Link to="/loja/$slug" params={{ slug: product.slug }} className="block">
        <div className="aspect-square bg-muted overflow-hidden">
          {img
            ? <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
            : <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                {isService ? <Wrench className="w-12 h-12" /> : <Smartphone className="w-12 h-12" />}
              </div>
          }
        </div>
      </Link>

      <CardContent className="p-4 flex-1">
        <Link to="/loja/$slug" params={{ slug: product.slug }} className="hover:underline">
          <h3 className="font-semibold line-clamp-2 text-sm leading-snug">{product.name}</h3>
        </Link>
        <p className="mt-2 text-xl font-bold text-primary">{formatBRL(product.price_cents)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          ou 12× de {formatBRL(Math.ceil(product.price_cents / 12))}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {product.featured && <Badge variant="secondary" className="text-xs">Destaque</Badge>}
          {product.condition && (
            <Badge variant="outline" className="text-xs capitalize">{product.condition}</Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {isService ? (
          <a href={buildServiceInquiryUrl(product.name)} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button variant="default" className="w-full text-sm">
              <WhatsAppIcon className="w-3.5 h-3.5 mr-2" /> Agendar
            </Button>
          </a>
        ) : (
          <Link to="/loja/$slug" params={{ slug: product.slug }} className="w-full">
            <Button className="w-full text-sm">
              <ChevronRight className="w-3.5 h-3.5 mr-1" /> Ver produto
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
