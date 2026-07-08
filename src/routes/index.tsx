import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { Benefits, Hero, OrcamentoForm, ContatoCard } from "@/components/sections";
import { SITE_URL, WhatsAppIcon, logo } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/marketplace";
import type { Product, Category } from "@/lib/marketplace-types";
import { Smartphone, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ProductGridSkeleton } from "@/components/product-skeleton";

// Mapa de logo por slug de categoria (simpleicons)
const BRAND_LOGOS: Record<string, { slug: string; color: string }> = {
  apple:    { slug: "apple",    color: "FFFFFF" },
  iphone:   { slug: "apple",    color: "FFFFFF" },
  samsung:  { slug: "samsung",  color: "FFFFFF" },
  xiaomi:   { slug: "xiaomi",   color: "FFFFFF" },
  motorola: { slug: "motorola", color: "FFFFFF" },
  lg:       { slug: "lg",       color: "FFFFFF" },
  sony:     { slug: "sony",     color: "FFFFFF" },
};

function getBrandLogo(categoryName: string, categorySlug: string) {
  const key = categorySlug.toLowerCase().replace(/[^a-z]/g, "");
  if (BRAND_LOGOS[key]) return BRAND_LOGOS[key];
  const nameKey = categoryName.toLowerCase().replace(/[^a-z]/g, "");
  if (BRAND_LOGOS[nameKey]) return BRAND_LOGOS[nameKey];
  return null;
}

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

      {/* Categorias com logos reais das marcas como fallback */}
      {featuredCats.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">Explorar por marca</h2>
          <div className="flex flex-wrap gap-3">
            {featuredCats.map(c => {
              const brandLogo = getBrandLogo(c.name, c.slug);
              return (
                <Link
                  key={c.id}
                  to="/loja"
                  search={{ tab: "product", cat: c.id, q: "", cap: [], cor: [], cond: [], min: 0, max: 0, page: 1 }}
                  className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-border bg-card hover:border-primary hover:bg-primary/5 transition"
                >
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="h-5 w-5 object-contain" loading="lazy" />
                  ) : brandLogo ? (
                    <img
                      src={logo(brandLogo.slug, brandLogo.color)}
                      alt={c.name}
                      className="h-5 w-5 object-contain opacity-80 group-hover:opacity-100 transition"
                      loading="lazy"
                    />
                  ) : (
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Destaques do banco */}
      <section className="container mx-auto px-4 py-6 pb-12">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-bold">Destaques da semana</h2>
          <Link to="/loja" className="text-sm text-primary hover:underline">Ver todos →</Link>
        </div>
        {loadingProducts
          ? <ProductGridSkeleton count={4} />
          : featuredProducts.length === 0
            ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <p>Nenhum destaque cadastrado ainda.</p>
                <Link to="/loja" className="text-primary hover:underline mt-2 inline-block">Ver todos os produtos →</Link>
              </div>
            )
            : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredProducts.slice(0, 8).map(p => (
                  <Card key={p.id} className="overflow-hidden flex flex-col group hover:shadow-lg transition">
                    <Link to="/loja/$slug" params={{ slug: p.slug }}>
                      <div className="aspect-square bg-muted overflow-hidden">
                        {p.image_urls[0]
                          ? <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-500" loading="lazy" />
                          : <div className="w-full h-full grid place-items-center text-muted-foreground"><Smartphone className="w-10 h-10" /></div>
                        }
                      </div>
                    </Link>
                    <CardContent className="p-4 flex-1">
                      <Link to="/loja/$slug" params={{ slug: p.slug }} className="hover:underline">
                        <p className="font-semibold line-clamp-2 text-sm">{p.name}</p>
                      </Link>
                      <p className="mt-2 text-lg font-bold text-primary">{formatBRL(p.price_cents)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Parcelas sob consulta no WhatsApp
                      </p>
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
      <section className="py-14 bg-primary/5 border-y border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Precisa de conserto?</h2>
          <p className="text-muted-foreground mb-6">Orçamento gratuito em minutos. Resposta pelo WhatsApp.</p>
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
      <ContatoCard />
    </SiteShell>
  );
}
