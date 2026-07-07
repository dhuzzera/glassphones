import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Benefits, Categorias, Hero, Vitrine } from "@/components/sections";
import { SITE_URL } from "@/lib/site";

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
        image: "https://www.glassphone.com.br/glassphone-logo-dark.png",
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
  return (
    <SiteShell>
      <Hero />
      <Benefits />
      <Categorias />
      <Vitrine title="Destaques da semana" limit={4} />
      <section className="py-14">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Precisa de conserto?</h2>
          <p className="text-muted-foreground mb-6">Faça seu orçamento em minutos e receba pelo WhatsApp.</p>
          <Link to="/orcamento" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:opacity-90">
            Solicitar orçamento
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
