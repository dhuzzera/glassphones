import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { FAQList } from "@/components/sections";
import { faqs, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — Garantia, prazo e orçamento | Glass Phone SBS" },
      { name: "description", content: "Dúvidas sobre garantia, prazo de reparo, formas de pagamento e orçamento na Glass Phone SBS." },
      { property: "og:title", content: "FAQ — Glass Phone SBS" },
      { property: "og:description", content: "Respostas rápidas sobre reparos, prazos e garantia." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/faq` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/faq` }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(f => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }),
    }],
  }),
  component: () => (
    <SiteShell>
      <FAQList />
    </SiteShell>
  ),
});
