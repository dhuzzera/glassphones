import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { ContatoCard } from "@/components/sections";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Loja em São Bento do Sul | Glass Phone SBS" },
      { name: "description", content: "Endereço, horário e telefone da Glass Phone SBS: Av. São Bento, 1330 - Sala 8, São Bento do Sul/SC." },
      { property: "og:title", content: "Contato — Glass Phone SBS" },
      { property: "og:description", content: "Loja física em São Bento do Sul. Atendimento também pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/contato` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contato` }],
  }),
  component: () => (
    <SiteShell>
      <ContatoCard />
    </SiteShell>
  ),
});
