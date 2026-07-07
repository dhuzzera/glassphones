import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { Benefits, Hero, OrcamentoForm, FAQList, ContatoCard } from "@/components/sections";
import { SITE_URL, WhatsAppIcon } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/marketplace";
import type { Product, Category } from "@/lib/marketplace-types";
import { Smartphone, ChevronRight, Sparkles, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ProductGridSkeleton } from "@/components/product-skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glass Phone SBS — Celulares e Assistência em São Bento do Sul" },
      { name: "description", content: "iPhone, Samsung, Xiaomi e Motorola com garantia e assistência técnica em São Bento do Sul. Atendimento pelo WhatsApp." },
      { property: "og:title", content: "Glass Phone SBS — Celulares e Assistência" },
      { property: "og:description", content: "Loja e assistência técnica de celular em São Bento do Sul. Orçamento pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}/#business`,
        name: "Glass Phone SBS",
        image: `${SITE_URL}/glassphone-logo-dark.png`,
        url: `${SITE_URL}/`,
        telephone: "+55-47-99680-1247",
        priceRange: "$$",
        address: { "@type": "PostalAddress", streetAddress: "Avenida São Bento, 1330 - Sala 8", addressLocality: "São Bento do Sul", addressRegion: "SC", postalCode: "89281-100", addressCountry: "BR" },
        geo: { "@type": "GeoCoordinates", latitude: -26.2497, longitude: -49.3789 },
        openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], opens: "09:00", closes: "19:00" }],
        sameAs: ["https://www.instagram.com/glass_phonesbs/"],
      }),
    }],
  }),
  component: Home,
});

function Home() {
  const { data: featuredProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products").select("*")
        .eq("active", true).eq("featured", true).eq("kind", "product")
        .order("created_at", { ascending: false }).limit(8);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
    staleTime: 60_000,
  });

  const { data: featuredCats = [] } = useQuery({
    queryKey: ["home-cats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories").select("*")
        .eq("type", "product").eq("featured", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
    staleTime: 60_000,
  });

  return (
    <SiteShell>
      <Hero />
      <Benefits />

      {/* Categorias do banco */}
      {featuredCats.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold mb-6">Explore por categoria</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredCats.map(c => (
              <Link
                key={c.id}
                to="/loja"
                search={{ tab: "product", cat: c.id, q: "", cap: [], cor: [], cond: [], min: 0, max: 0, page: 1 }}
                className="group text-left rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg hover:border-primary/40 transition"
              >
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {c.image_url
                    ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                    : <div className="w-full h-full grid place-items-center text-muted-foreground"><Smartphone className="w-12 h-12" /></div>
                  }
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="font-semibold">{c.name}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Destaques do banco */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-end justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />Destaques da semana</Badge>
          </div>
          <Link to="/loja" className="text-sm text-primary hover:underline">Ver todos →</Link>
        </div>
        {loadingProducts
          ? <ProductGridSkeleton count={4} />
          : featuredProducts.length === 0
            ? <p className="text-muted-foreground text-sm py-4">Nenhum destaque cadastrado ainda.</p>
            : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredProducts.slice(0, 8).map(p => (
                  <Card key={p.id} className="overflow-hidden flex flex-col group hover:shadow-lg transition">
                    <Link to="/loja/$slug" params={{ slug: p.slug }}>
                      <div className="aspect-square bg-muted overflow-hidden">
                        {p.image_urls[0]
                          ? <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                          : <div className="w-full h-full grid place-items-center text-muted-foreground"><Smartphone className="w-10 h-10" /></div>
                        }
                      </div>
                    </Link>
                    <CardContent className="p-4 flex-1">
                      <Link to="/loja/$slug" params={{ slug: p.slug }} className="hover:underline">
                        <p className="font-semibold line-clamp-2 text-sm">{p.name}</p>
                      </Link>
                      <p className="mt-2 text-lg font-bold text-primary">{formatBRL(p.price_cents)}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Link to="/loja/$slug" params={{ slug: p.slug }} className="w-full">
                        <Button className="w-full" size="sm">
                          <ShoppingCart className="w-3.5 h-3.5 mr-2" />Ver produto
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )
        }
      </section>

      {/* CTA orçamento */}
      <section className="py-14 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Precisa de conserto?</h2>
          <p className="text-muted-foreground mb-6">Faça seu orçamento em minutos e receba pelo WhatsApp.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/orcamento" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:opacity-90">
              Solicitar orçamento
            </Link>
            <Link to="/servicos" className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full font-bold hover:bg-muted transition">
              Ver serviços
            </Link>
          </div>
        </div>
      </section>

      <OrcamentoForm />
      <FAQList />
      <ContatoCard />
    </SiteShell>
  );
}
