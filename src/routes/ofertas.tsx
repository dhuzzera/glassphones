import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Vitrine } from "@/components/sections";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/ofertas")({
  head: () => ({
    meta: [
      { title: "Ofertas — iPhone, Samsung, Xiaomi | Glass Phone SBS" },
      { name: "description", content: "Smartphones novos e seminovos com melhores preços em São Bento do Sul. 12x sem juros e frete para todo Brasil." },
      { property: "og:title", content: "Ofertas — Glass Phone SBS" },
      { property: "og:description", content: "iPhone, Samsung, Xiaomi e Motorola com garantia e parcelamento." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/ofertas` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/ofertas` }],
  }),
  component: () => (
    <SiteShell>
      <div className="py-6" />
      <Vitrine title="Catálogo de ofertas" />
    </SiteShell>
  ),
});
