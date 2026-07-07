import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wrench, Clock, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { SITE_URL, WhatsAppIcon, WHATSAPP_NUM, brl } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, buildServiceInquiryUrl } from "@/lib/marketplace";
import type { Product } from "@/lib/marketplace-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
// fallback estático caso não haja serviços no banco
import { servicos as servicosEstaticos } from "@/lib/site";

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
  component: ServicosPage,
});

function ServicosPage() {
  const { data: dbServices = [], isLoading } = useQuery({
    queryKey: ["services-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("kind", "service")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
    staleTime: 60_000,
  });

  // usa banco se tiver dados, senão mostra os estáticos
  const useDb = !isLoading && dbServices.length > 0;

  return (
    <SiteShell>
      <section className="py-16 md:py-20 bg-secondary/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-primary font-semibold text-sm tracking-widest">SERVIÇOS</span>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">Assistência técnica especializada</h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Reparos com garantia real, peças de qualidade e prazo que cabe no seu dia.
            </p>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 space-y-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full rounded-lg mt-2" />
                </Card>
              ))}
            </div>
          ) : useDb ? (
            /* Serviços do banco Supabase */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dbServices.map(s => (
                <Card key={s.id} className="group hover:border-primary hover:-translate-y-1 transition flex flex-col">
                  <CardContent className="p-6 flex flex-col flex-1 gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition">
                      <Wrench className="h-6 w-6" />
                    </div>
                    <h2 className="font-bold text-lg">{s.name}</h2>
                    {s.description && (
                      <p className="text-sm text-muted-foreground flex-1">{s.description}</p>
                    )}
                    <div className="flex items-end justify-between mt-auto pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">a partir de</p>
                        <p className="text-2xl font-black text-primary leading-tight">{formatBRL(s.price_cents)}</p>
                      </div>
                      <Link to="/loja/$slug" params={{ slug: s.slug }} className="text-sm font-bold text-primary hover:underline">
                        Ver detalhes →
                      </Link>
                    </div>
                    <a
                      href={buildServiceInquiryUrl(s.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full bg-whatsapp text-whatsapp-foreground hover:opacity-90">
                        <WhatsAppIcon className="h-3.5 w-3.5 mr-2" /> Orçamento no WhatsApp
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Fallback: serviços estáticos de lib/site.tsx */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicosEstaticos.map(s => (
                <Card key={s.slug} className="group hover:border-primary hover:-translate-y-1 transition flex flex-col">
                  <CardContent className="p-6 flex flex-col flex-1 gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition">
                      <s.icon className="h-6 w-6" />
                    </div>
                    <h2 className="font-bold text-lg">{s.nome}</h2>
                    <p className="text-sm text-muted-foreground flex-1">{s.desc}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {s.prazo}
                      <ShieldCheck className="h-3.5 w-3.5 ml-2" /> 90 dias garantia
                    </div>
                    <div className="flex items-end justify-between pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">a partir de</p>
                        <p className="text-2xl font-black text-primary leading-tight">{brl(s.preco)}</p>
                      </div>
                      <Link to="/servicos/$slug" params={{ slug: s.slug }} className="text-sm font-bold text-primary hover:underline">
                        Ver detalhes →
                      </Link>
                    </div>
                    <a
                      href={`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(`Olá, Glass Phone! Quero um orçamento para: ${s.nome} (a partir de ${brl(s.preco)}).`)}`}
                      target="_blank" rel="noopener"
                    >
                      <Button className="w-full bg-whatsapp text-whatsapp-foreground hover:opacity-90">
                        <WhatsAppIcon className="h-3.5 w-3.5 mr-2" /> Orçamento no WhatsApp
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/orcamento" className="inline-flex items-center gap-2 bg-whatsapp text-whatsapp-foreground px-6 py-3 rounded-full font-bold hover:opacity-90">
              <WhatsAppIcon className="h-4 w-4" /> Solicitar orçamento agora
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
