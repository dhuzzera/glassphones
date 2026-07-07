import { useQuery } from "@tanstack/react-query";
import { Star, ShoppingBag, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

interface Review {
  id: string;
  author_name: string;
  city: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

interface Props {
  productId: string;
  productName: string;
}

/**
 * Prova social na PDP:
 *  - Contador de vendas do produto (via orders.items @> [{product_id}])
 *  - Últimas avaliações aprovadas da loja (schema atual não tem reviews.product_id;
 *    quando as migrations forem aplicadas isso vira "reviews deste produto")
 */
export function ProductSocialProof({ productId, productName }: Props) {
  const { data: salesCount = 0 } = useQuery({
    queryKey: ["product-sales-count", productId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["confirmed", "paid", "delivered"])
        .contains("items", [{ product_id: productId }]);
      if (error) return 0;
      return count ?? 0;
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews-social-proof"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, author_name, city, rating, comment, created_at")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <section className="mt-12" aria-labelledby="prova-social-titulo">
      <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 id="prova-social-titulo" className="text-xl font-bold">
            Prova social
          </h2>
          <p className="text-sm text-muted-foreground">
            Clientes reais que confiam na Glass Phone SBS.
          </p>
        </div>
        {avg && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="font-bold">{avg}</span>
            <span className="text-muted-foreground">· {reviews.length} avaliações recentes</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{salesCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {salesCount === 1 ? "cliente comprou" : "clientes compraram"} este modelo
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 text-yellow-600 grid place-items-center shrink-0">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{avg ?? "5.0"}</p>
              <p className="text-xs text-muted-foreground mt-1">nota média da loja</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 grid place-items-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{reviews.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                depoimentos <Link to="/avaliacoes" className="underline hover:text-primary">ver todos</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reviews.slice(0, 4).map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-0.5 text-yellow-500 mb-2">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-foreground line-clamp-4">{r.comment}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  — {r.author_name}
                  {r.city ? ` · ${r.city}` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="sr-only">Avaliações relacionadas ao produto {productName}</p>
    </section>
  );
}
