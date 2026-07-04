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
      <OrcamentoForm />
    </SiteShell>
  ),
});
