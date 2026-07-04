import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { ServicosGrid } from "@/components/sections";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — Assistência técnica de celular | Glass Phone SBS" },
      { name: "description", content: "Troca de tela, bateria, placa e conector com garantia. Assistência técnica em São Bento do Sul com peças de qualidade." },
      { property: "og:title", content: "Serviços — Glass Phone SBS" },
      { property: "og:description", content: "Reparos com garantia real e peças de qualidade. Preços a partir de R$39." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/servicos` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/servicos` }],
  }),
  component: () => (
    <SiteShell>
      <ServicosGrid />
      <section className="py-14 text-center">
        <div className="container mx-auto px-4">
          <Link to="/orcamento" className="inline-flex items-center gap-2 bg-whatsapp text-whatsapp-foreground px-6 py-3 rounded-full font-bold hover:opacity-90">
            Solicitar orçamento agora
          </Link>
        </div>
      </section>
    </SiteShell>
  ),
});
