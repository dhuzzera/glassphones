import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Smartphone, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/marketplace-types";
import { formatBRL, buildServiceInquiryUrl } from "@/lib/marketplace";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/ofertas")({
  head: () => ({
    meta: [
      { title: "Ofertas — iPhone, Samsung, Xiaomi | Glass Phone SBS" },
      { name: "description", content: "Smartphones novos e seminovos com melhores preços em São Bento do Sul. Frete para todo Brasil." },
      { property: "og:title", content: "Ofertas — Glass Phone SBS" },
      { property: "og:description", content: "iPhone, Samsung, Xiaomi e Motorola com garantia e parcelamento." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/ofertas` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/ofertas` }],
  }),
  component: OfertasPage,
});

function OfertasPage() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["ofertas-produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("kind", "product")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const featured = products.filter((p) => p.featured).slice(0, 8);
  const regular = products.filter((p) => !p.featured);

  return (
    <SiteShell>
      <section className="py-12 md:py-16 bg-secondary/40">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-8">
            <Badge variant="secondary" className="mb-3">Ofertas da semana</Badge>
            <h1 className="text-3xl md:text-4xl font-bold">Catálogo de ofertas</h1>
            <p className="text-muted-foreground mt-2">
              Smartphones novos e seminovos com garantia e entrega para todo o Brasil.
            </p>
          </div>

          {featured.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Destaques da semana</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : regular.length === 0 ? (
            <p className="text-muted-foreground">Nenhum produto disponível no momento.</p>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-4">Todos os produtos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {regular.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function ProductCard({ product }: { product: Product }) {
  const img = product.image_urls[0];
  const isService = product.kind === "service";

  return (
    <Card className="overflow-hidden flex flex-col group hover:shadow-lg transition">
      <Link to="/loja/$slug" params={{ slug: product.slug }} className="text-left">
        <div className="aspect-square bg-muted overflow-hidden relative">
          {img ? (
            <img
              src={img}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {isService ? <Wrench className="w-12 h-12" /> : <Smartphone className="w-12 h-12" />}
            </div>
          )}
          {product.featured && (
            <Badge className="absolute top-2 left-2" variant="secondary">
              Destaque
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4 flex-1">
        <Link to="/loja/$slug" params={{ slug: product.slug }} className="hover:underline text-left w-full">
          <h3 className="font-semibold line-clamp-2">{product.name}</h3>
        </Link>
        <p className="mt-2 text-xl font-bold text-primary">{formatBRL(product.price_cents)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {isService ? (
          <a href={buildServiceInquiryUrl(product.name)} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button variant="default" className="w-full">
              Agendar pelo WhatsApp
            </Button>
          </a>
        ) : (
          <Link to="/loja/$slug" params={{ slug: product.slug }} className="w-full">
            <Button className="w-full">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Ver produto
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
