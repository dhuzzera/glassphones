import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ShoppingCart, Wrench, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/integrations/supabase/types";
import { formatBRL, buildServiceInquiryUrl } from "@/lib/marketplace";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/loja/$slug")({
  head: () => ({
    meta: [
      { title: "Produto — Glass Phone SBS" },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [selectedImg, setSelectedImg] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });

  if (isLoading) return <div className="container mx-auto p-8">Carregando...</div>;
  if (error || !product) return (
    <div className="container mx-auto p-8">
      <p className="text-muted-foreground">Produto não encontrado.</p>
      <Link to="/loja"><Button variant="outline" className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button></Link>
    </div>
  );

  const isService = product.kind === "service";
  const img = product.image_urls[selectedImg];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <Link to="/loja" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar para a loja
          </Link>
          <Link to="/carrinho">
            <Button variant="outline" size="sm"><ShoppingCart className="w-4 h-4 mr-2" />Carrinho</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {img ? (
              <img src={img} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                {isService ? <Wrench className="w-24 h-24" /> : <Smartphone className="w-24 h-24" />}
              </div>
            )}
          </div>
          {product.image_urls.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {product.image_urls.map((u, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={`w-20 h-20 rounded overflow-hidden border-2 flex-shrink-0 ${i === selectedImg ? "border-primary" : "border-transparent"}`}
                >
                  <img src={u} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.featured && <Badge className="mb-2" variant="secondary">Destaque</Badge>}
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="mt-4 text-4xl font-bold text-primary">{formatBRL(product.price_cents)}</p>
          {product.description && (
            <p className="mt-6 text-muted-foreground whitespace-pre-line">{product.description}</p>
          )}
          <div className="mt-8 space-y-3">
            {isService ? (
              <a href={buildServiceInquiryUrl(product.name)} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full">Agendar pelo WhatsApp</Button>
              </a>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    add({
                      product_id: product.id,
                      name: product.name,
                      price_cents: product.price_cents,
                      kind: product.kind,
                    });
                    toast.success("Adicionado ao carrinho");
                  }}
                >
                  Adicionar ao carrinho
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    add({
                      product_id: product.id,
                      name: product.name,
                      price_cents: product.price_cents,
                      kind: product.kind,
                    });
                    navigate({ to: "/checkout" });
                  }}
                >
                  Comprar agora
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
