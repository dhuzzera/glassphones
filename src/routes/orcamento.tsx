import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { OrcamentoForm } from "@/components/sections";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/orcamento")({
  head: () => ({
    meta: [
      { title: "Orçamento rápido pelo WhatsApp | Glass Phone SBS" },
      { name: "description", content: "Solicite seu orçamento de reparo em minutos. Informe modelo e defeito e receba valor e prazo pelo WhatsApp." },
      { property: "og:title", content: "Orçamento rápido — Glass Phone SBS" },
      { property: "og:description", content: "Orçamento gratuito em minutos com resposta pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/orcamento` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/orcamento` }],
  }),
  component: () => (
    <SiteShell>
      <section className="py-10 bg-primary/5 text-center border-b">
        <div className="container mx-auto px-4">
          <span className="text-primary font-semibold text-sm tracking-widest">ORÇAMENTO RÁPIDO</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">Receba seu orçamento em minutos</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Sem compromisso. Informe o modelo e o defeito e receba o valor pelo WhatsApp.</p>
        </div>
      </section>
      <OrcamentoForm />
    </SiteShell>
  ),
});
