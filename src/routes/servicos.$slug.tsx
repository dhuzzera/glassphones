import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Clock, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { brl, servicos, SITE_URL, waLink, WhatsAppIcon, WHATSAPP_NUM } from "@/lib/site";
import { trackWhatsApp } from "@/lib/analytics";

export const Route = createFileRoute("/servicos/$slug")({
  loader: ({ params }) => {
    const s = servicos.find((x) => x.slug === params.slug);
    if (!s) throw notFound();
    return { servico: s };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Serviço não encontrado" }, { name: "robots", content: "noindex" }] };
    }
    const s = loaderData.servico;
    const url = `${SITE_URL}/servicos/${params.slug}`;
    return {
      meta: [
        { title: `${s.nome} — a partir de ${brl(s.preco)} | Glass Phone SBS` },
        { name: "description", content: `${s.desc} Prazo: ${s.prazo}. 90 dias de garantia. Assistência técnica em São Bento do Sul.` },
        { property: "og:title", content: `${s.nome} — Glass Phone SBS` },
        { property: "og:description", content: s.desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: s.nome,
            description: s.detalhes,
            url,
            provider: { "@id": `${SITE_URL}/#business`, "@type": "LocalBusiness", name: "Glass Phone SBS" },
            areaServed: "São Bento do Sul, SC",
            offers: {
              "@type": "Offer",
              price: s.preco,
              priceCurrency: "BRL",
              availability: "https://schema.org/InStock",
              url,
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Serviços", item: `${SITE_URL}/servicos` },
              { "@type": "ListItem", position: 3, name: s.nome, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: ServicoDetalhe,
  notFoundComponent: () => (
    <SiteShell>
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-3">Serviço não encontrado</h1>
        <Link to="/servicos" className="text-primary hover:underline">← Voltar aos serviços</Link>
      </div>
    </SiteShell>
  ),
  errorComponent: () => (
    <SiteShell>
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-3">Erro ao carregar</h1>
        <Link to="/servicos" className="text-primary hover:underline">← Voltar aos serviços</Link>
      </div>
    </SiteShell>
  ),
});

function ServicoDetalhe() {
  const { servico: s } = Route.useLoaderData();
  const waMsg = encodeURIComponent(`Olá, Glass Phone! Quero um orçamento para: ${s.nome} (a partir de ${brl(s.preco)}).`);

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-8">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary hover:underline">Home</Link></li>
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li><Link to="/servicos" className="hover:text-primary hover:underline">Serviços</Link></li>
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li className="text-foreground font-medium" aria-current="page">{s.nome}</li>
          </ol>
        </nav>
        <Link to="/servicos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ChevronLeft className="h-4 w-4" /> Todos os serviços
        </Link>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 items-start">
          <div>
            <div className="h-16 w-16 rounded-2xl bg-primary/15 text-primary grid place-items-center mb-6">
              <s.icon className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">{s.nome}</h1>
            <p className="text-lg text-muted-foreground mb-6">{s.desc}</p>
            <p className="leading-relaxed mb-8">{s.detalhes}</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border">
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div><div className="text-xs text-muted-foreground">Prazo estimado</div><div className="font-semibold">{s.prazo}</div></div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div><div className="text-xs text-muted-foreground">Garantia</div><div className="font-semibold">90 dias sobre serviço e peça</div></div>
              </div>
            </div>
          </div>

          <aside className="bg-card border border-border rounded-3xl p-6 md:p-8 lg:sticky lg:top-24" style={{ boxShadow: "var(--shadow-glow)" }}>
            <div className="text-sm text-muted-foreground">a partir de</div>
            <div className="text-price font-black text-4xl leading-none mb-4">{brl(s.preco)}</div>
            <p className="text-sm text-muted-foreground mb-6">Preço final depende do modelo do aparelho e da disponibilidade da peça. Orçamento sem compromisso.</p>
            <a
              href={`https://wa.me/${WHATSAPP_NUM}?text=${waMsg}`}
              target="_blank"
              rel="noopener"
              onClick={() => trackWhatsApp("servico_detalhe_orcamento", { slug: s.slug, nome: s.nome, preco: s.preco })}
              className="w-full inline-flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground px-6 py-3.5 rounded-xl font-bold hover:opacity-90 transition"
            >
              <WhatsAppIcon className="h-4 w-4" /> Solicitar orçamento
            </a>
            <a
              href={waLink("")}
              onClick={() => trackWhatsApp("servico_detalhe_duvida", { slug: s.slug })}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-border px-6 py-3 rounded-xl font-semibold text-sm hover:bg-muted transition"
            >
              Tirar dúvida rápida
            </a>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
