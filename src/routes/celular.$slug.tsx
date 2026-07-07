import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Smartphone, ArrowLeft, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductVariant } from "@/lib/marketplace-types";
import { formatBRL } from "@/lib/marketplace";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CIDADES } from "@/lib/cidades";

const BASE_URL = "https://www.glassphone.com.br";

/**
 * Parse "iphone-13-pro-128gb" → { modelo: "iphone 13 pro", capacidade: "128GB" }
 * A capacidade é sempre o último segmento no formato \d+(gb|tb).
 */
function parseSlug(slug: string): { modelo: string; capacidade: string } | null {
  const parts = slug.toLowerCase().split("-");
  const last = parts[parts.length - 1];
  const capMatch = last.match(/^(\d+)(gb|tb)$/i);
  if (!capMatch) return null;
  const capacidade = `${capMatch[1]}${capMatch[2].toUpperCase()}`;
  const modelo = parts.slice(0, -1).join(" ");
  return { modelo, capacidade };
}

function titleCase(s: string): string {
  return s.replace(/\b(\w)/g, (m) => m.toUpperCase());
}

export const Route = createFileRoute("/celular/$slug")({
  loader: ({ params }) => {
    const parsed = parseSlug(params.slug);
    if (!parsed) throw notFound();
    return { ...parsed, slug: params.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Modelo não encontrado — Glass Phone SBS" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const modeloNome = titleCase(loaderData.modelo);
    const title = `${modeloNome} ${loaderData.capacidade} — Preço e Onde Comprar | Glass Phone SBS`;
    const desc = `Comprar ${modeloNome} ${loaderData.capacidade} em São Bento do Sul e região. Garantia, entrega e retirada na loja. Compare preços e escolha cor.`;
    const url = `${BASE_URL}/celular/${loaderData.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProductGroup",
            name: `${modeloNome} ${loaderData.capacidade}`,
            description: desc,
            brand: { "@type": "Brand", name: modeloNome.split(" ")[0] },
            url,
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Modelo não encontrado</h1>
        <p className="text-muted-foreground mb-6">A URL precisa terminar com a capacidade (ex: 128gb, 256gb, 1tb).</p>
        <Link to="/loja"><Button><ArrowLeft className="w-4 h-4 mr-2" />Voltar para a loja</Button></Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-2">Erro ao carregar</h1>
        <p className="text-muted-foreground text-sm">{error.message}</p>
      </div>
    </SiteShell>
  ),
  component: ModeloCapacidadePage,
});

function ModeloCapacidadePage() {
  const { modelo, capacidade } = Route.useLoaderData();
  const modeloNome = titleCase(modelo);

  // busca produtos cujo nome contém termos do modelo
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["modelo-produtos", modelo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("kind", "product")
        .ilike("name", `%${modelo}%`);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const productIds = products.map((p) => p.id);
  const { data: allVariants = [] } = useQuery({
    queryKey: ["modelo-variants", productIds.join(",")],
    enabled: productIds.length > 0,
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

  // filtra apenas produtos com variante na capacidade pedida (ou cujo nome já contém a capacidade)
  const capUpper = capacidade.toUpperCase();
  const matching = products.filter((p) => {
    if (p.name.toUpperCase().includes(capUpper)) return true;
    return allVariants.some(
      (v) => v.product_id === p.id && (v.attributes?.["Capacidade"] ?? "").toUpperCase() === capUpper,
    );
  });

  return (
    <SiteShell>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <nav aria-label="breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Início</Link>
            <span>/</span>
            <Link to="/loja" className="hover:text-primary">Loja</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{modeloNome} {capacidade}</span>
          </nav>

          <header className="max-w-3xl mb-10">
            <Badge variant="secondary" className="mb-3">Modelo e capacidade</Badge>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              {modeloNome} {capacidade}
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">
              Confira preço, disponibilidade e onde comprar {modeloNome} {capacidade} em São Bento do Sul e região.
              Aparelhos com garantia Glass Phone SBS, entrega para todo o Brasil e retirada na loja física.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4">
              {isLoading ? "Buscando..." : `${matching.length} opção${matching.length !== 1 ? "es" : ""} disponível${matching.length !== 1 ? "eis" : ""}`}
            </h2>
            {matching.length === 0 && !isLoading ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Nenhum aparelho em estoque para essa combinação no momento. Chame no WhatsApp — costumamos ter reserva.
                  </p>
                  <Link to="/loja"><Button variant="outline">Ver toda a loja</Button></Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matching.map((p) => {
                  const img = p.image_urls[0];
                  return (
                    <Link
                      key={p.id}
                      to="/loja/$slug"
                      params={{ slug: p.slug }}
                      className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/40 transition"
                    >
                      <div className="aspect-square bg-muted overflow-hidden">
                        {img ? (
                          <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-muted-foreground">
                            <Smartphone className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold line-clamp-2">{p.name}</h3>
                        <p className="mt-2 text-xl font-bold text-primary">{formatBRL(p.price_cents)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mb-12" aria-labelledby="onde-comprar-modelo">
            <h2 id="onde-comprar-modelo" className="text-xl font-bold mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Onde comprar {modeloNome} {capacidade}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Atendemos com entrega rápida em toda a região do Planalto Norte:
            </p>
            <div className="flex flex-wrap gap-2">
              {CIDADES.map((c) => (
                <Link
                  key={c.slug}
                  to="/em/$cidade"
                  params={{ cidade: c.slug }}
                  className="text-sm px-3 py-2 rounded-full border border-border hover:border-primary hover:text-primary transition"
                >
                  {modeloNome} {capacidade} em {c.nome}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold mb-2">Por que comprar {modeloNome} {capacidade} na Glass Phone?</h2>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Garantia Glass Phone SBS de 90 dias em todo aparelho.</li>
              <li>Entrega para todo o Brasil e retirada na loja física em São Bento do Sul.</li>
              <li>Troca do seu aparelho antigo pelo novo com desconto imediato via trade-in.</li>
              <li>Atendimento humano pelo WhatsApp antes e depois da compra.</li>
            </ul>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
