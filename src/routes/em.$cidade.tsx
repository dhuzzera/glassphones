import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Truck, Phone, Store } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { findCidade, CIDADES } from "@/lib/cidades";
import { formatBRL, WHATSAPP_NUMBER } from "@/lib/marketplace";
import type { Product } from "@/lib/marketplace-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppIcon } from "@/lib/site";
import { trackWhatsApp } from "@/lib/analytics";

export const Route = createFileRoute("/em/$cidade")({
  beforeLoad: ({ params }) => {
    if (!findCidade(params.cidade)) throw notFound();
  },
  head: ({ params }) => {
    const cidade = findCidade(params.cidade);
    if (!cidade) return { meta: [{ title: "Cidade não encontrada" }] };
    // Título CTR-focused: começa com o benefício + cidade, marca no final.
    const title = `iPhone, Samsung e Assistência em ${cidade.nome}/${cidade.uf} · Entrega Rápida | Glass Phone SBS`;
    const description = `Loja de celulares em ${cidade.nome}: iPhone, Samsung, Xiaomi, Motorola, acessórios e assistência técnica. ${cidade.destaque} Atendimento humano no WhatsApp em ~5 min.`;
    const url = `https://glassphones.lovable.app/em/${cidade.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: `celulares ${cidade.nome}, iphone ${cidade.nome}, assistência técnica ${cidade.nome}, loja de celular ${cidade.nome} ${cidade.uf}` },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "pt_BR" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: `Glass Phone SBS — Atendimento em ${cidade.nome}`,
            description,
            areaServed: {
              "@type": "City",
              name: cidade.nome,
              containedInPlace: { "@type": "State", name: cidade.uf === "SC" ? "Santa Catarina" : "Paraná" },
            },
            address: {
              "@type": "PostalAddress",
              streetAddress: "Av. São Bento, 1330 — Sala 8",
              addressLocality: "São Bento do Sul",
              addressRegion: "SC",
              postalCode: "89281-100",
              addressCountry: "BR",
            },
            telephone: "+55 47 99680-1247",
            url,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: `Vocês entregam celulares em ${cidade.nome}?`,
                acceptedAnswer: { "@type": "Answer", text: `Sim. ${cidade.destaque} Combinamos a entrega ou envio pelo WhatsApp (47) 99680-1247.` },
              },
              {
                "@type": "Question",
                name: `Qual a distância da loja física até ${cidade.nome}?`,
                acceptedAnswer: { "@type": "Answer", text: `A loja fica em São Bento do Sul, a aproximadamente ${cidade.distanciaKm} km de ${cidade.nome}.` },
              },
              {
                "@type": "Question",
                name: `Fazem assistência técnica para clientes de ${cidade.nome}?`,
                acceptedAnswer: { "@type": "Answer", text: `Sim — troca de tela, bateria, conectores e mais. Consulte orçamento no WhatsApp.` },
              },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: "https://glassphones.lovable.app/" },
              { "@type": "ListItem", position: 2, name: "Atendimento", item: "https://glassphones.lovable.app/em/sao-bento-do-sul" },
              { "@type": "ListItem", position: 3, name: `${cidade.nome}/${cidade.uf}`, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-3">Cidade não encontrada</h1>
        <p className="text-muted-foreground mb-6">Ainda não temos página para esta cidade.</p>
        <Link to="/loja"><Button>Ver a loja</Button></Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ reset }) => (
    <SiteShell>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-3">Erro ao carregar</h1>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </SiteShell>
  ),
  component: CidadePage,
});

function CidadePage() {
  const { cidade: slug } = Route.useParams();
  const cidade = findCidade(slug)!;

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["produtos-cidade"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("kind", "product")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
    staleTime: 60_000,
  });

  const waMsg = encodeURIComponent(
    `Olá! Sou de ${cidade.nome}/${cidade.uf} e gostaria de saber mais sobre os celulares disponíveis.`,
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;

  return (
    <SiteShell>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <MapPin className="h-3.5 w-3.5" /> Atendimento em {cidade.nome}/{cidade.uf}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Celulares e assistência técnica em {cidade.nome}
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
            {cidade.destaque} A Glass Phone SBS atende toda a região do{" "}
            {cidade.regiao} com iPhone, Samsung, Xiaomi, Motorola, acessórios e reparos.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={waUrl}
              onClick={() => trackWhatsApp("cidade_hero", { cidade: cidade.slug, uf: cidade.uf })}
            >
              <Button size="lg" className="bg-whatsapp text-whatsapp-foreground hover:opacity-90">
                <WhatsAppIcon className="h-5 w-5 mr-2" /> Falar no WhatsApp
              </Button>
            </a>
            <Link to="/loja">
              <Button size="lg" variant="outline">Ver todos os produtos</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <Store className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Loja física em São Bento do Sul</h3>
              <p className="text-sm text-muted-foreground">
                Av. São Bento, 1330 — Sala 8. A {cidade.distanciaKm} km de {cidade.nome}.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Truck className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Entrega para {cidade.nome}</h3>
              <p className="text-sm text-muted-foreground">
                Combinamos entrega ou envio via transportadora. Fale conosco pelo WhatsApp.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Phone className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Atendimento humano</h3>
              <p className="text-sm text-muted-foreground">
                (47) 9 9680-1247 · Seg-Sáb 9h às 19h. Sem robô.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Produtos */}
      <section className="container mx-auto px-4 py-6 pb-12">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-bold">Modelos disponíveis para {cidade.nome}</h2>
          <Link to="/loja" className="text-sm text-primary hover:underline">
            Ver catálogo completo →
          </Link>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {produtos.map((p) => (
              <Link key={p.id} to="/loja/$slug" params={{ slug: p.slug }}>
                <Card className="hover:shadow-lg transition h-full">
                  <div className="aspect-square rounded-t-lg bg-muted overflow-hidden">
                    {p.image_urls[0] && (
                      <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                    <p className="text-primary font-bold mt-1">{formatBRL(p.price_cents)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bairros para SEO */}
      {cidade.bairros.length > 0 && (
        <section className="container mx-auto px-4 pb-12">
          <div className="rounded-lg bg-muted/30 border p-6">
            <h2 className="font-semibold mb-2">
              Atendemos os principais bairros de {cidade.nome}
            </h2>
            <p className="text-sm text-muted-foreground">
              {cidade.bairros.join(" · ")}. Não achou seu bairro? Fale no{" "}
              <a
                href={waUrl}
                onClick={() => trackWhatsApp("cidade_bairros", { cidade: cidade.slug, uf: cidade.uf })}
                className="text-primary hover:underline font-medium"
              >
                WhatsApp
              </a>{" "}
              — combinamos a melhor forma de entrega.
            </p>
          </div>
        </section>
      )}

      {/* FAQ visível — reforça as respostas do FAQPage JSON-LD */}
      <section className="container mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold mb-4">Perguntas frequentes de clientes de {cidade.nome}</h2>
        <div className="space-y-3">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-1">Vocês entregam em {cidade.nome}?</h3>
            <p className="text-sm text-muted-foreground">{cidade.destaque} Combinamos a entrega pelo WhatsApp.</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-1">Qual a distância até {cidade.nome}?</h3>
            <p className="text-sm text-muted-foreground">Cerca de {cidade.distanciaKm} km entre nossa loja em São Bento do Sul e {cidade.nome}.</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-1">Fazem assistência técnica?</h3>
            <p className="text-sm text-muted-foreground">
              Sim — troca de tela, bateria e mais. <Link to="/servicos" className="text-primary hover:underline">Ver serviços</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Outras cidades (linking interno para SEO) */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-lg font-semibold mb-3">Também atendemos</h2>
        <div className="flex flex-wrap gap-2">
          {CIDADES.filter((c) => c.slug !== cidade.slug).map((c) => (
            <Link
              key={c.slug}
              to="/em/$cidade"
              params={{ cidade: c.slug }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm hover:border-primary hover:text-primary transition"
            >
              <MapPin className="h-3 w-3" />
              {c.nome}/{c.uf}
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
