import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ShoppingCart, Search, Wrench, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Category } from "@/integrations/supabase/types";
import { formatBRL, buildServiceInquiryUrl } from "@/lib/marketplace";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  const { count } = useCart();

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

  const filtered = useMemo(() => {
    if (!search) return products;
    const s = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(s));
  }, [products, search]);

  const catsForTab = categories.filter((c) => c.type === tab);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <Link to="/" className="text-xl font-bold">Glass Phone SBS</Link>
          <div className="flex items-center gap-2">
            <Link to="/carrinho">
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Carrinho
                {count > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1">{count}</Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Nossa Loja</h1>

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
            <ProductGrid products={filtered} loading={isLoading} kind="product" />
          </TabsContent>
          <TabsContent value="service" className="mt-0">
            <ProductGrid products={filtered} loading={isLoading} kind="service" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ProductGrid({ products, loading, kind }: { products: Product[]; loading: boolean; kind: "product" | "service" }) {
  if (loading) return <p className="text-muted-foreground">Carregando...</p>;
  if (products.length === 0) return <p className="text-muted-foreground">Nenhum {kind === "product" ? "produto" : "serviço"} encontrado.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const img = product.image_urls[0];
  const isService = product.kind === "service";

  return (
    <Card className="overflow-hidden flex flex-col">
      <Link to="/loja/$slug" params={{ slug: product.slug }}>
        <div className="aspect-square bg-muted overflow-hidden">
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {isService ? <Wrench className="w-12 h-12" /> : <Smartphone className="w-12 h-12" />}
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4 flex-1">
        <Link to="/loja/$slug" params={{ slug: product.slug }} className="hover:underline">
          <h3 className="font-semibold line-clamp-2">{product.name}</h3>
        </Link>
        <p className="mt-2 text-xl font-bold text-primary">{formatBRL(product.price_cents)}</p>
        {product.featured && <Badge className="mt-2" variant="secondary">Destaque</Badge>}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {isService ? (
          <a href={buildServiceInquiryUrl(product.name)} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button variant="default" className="w-full">Agendar pelo WhatsApp</Button>
          </a>
        ) : (
          <Button
            className="w-full"
            onClick={() => add({
              product_id: product.id,
              name: product.name,
              price_cents: product.price_cents,
              kind: product.kind,
            })}
          >
            Adicionar ao carrinho
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
