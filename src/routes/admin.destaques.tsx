import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/marketplace-types";
import { formatBRL } from "@/lib/marketplace";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/destaques")({
  component: DestaquesAdmin,
});

function DestaquesAdmin() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-destaques"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("kind", "product")
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const toggle = async (p: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ featured: !p.featured, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(!p.featured ? "Adicionado aos destaques" : "Removido dos destaques");
    qc.invalidateQueries({ queryKey: ["admin-destaques"] });
    qc.invalidateQueries({ queryKey: ["featured-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const featuredCount = products.filter((p) => p.featured).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Destaques da semana
          </h1>
          <p className="text-sm text-muted-foreground">Ative os produtos que devem aparecer em "Destaques" na loja.</p>
        </div>
        <Badge variant="secondary">{featuredCount} em destaque</Badge>
      </div>

      {isLoading ? (
        <p>Carregando…</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground">Nenhum produto cadastrado.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {products.map((p) => (
            <Card key={p.id} className="p-3 flex items-center gap-3">
              <div className="w-14 h-14 rounded-md bg-muted overflow-hidden shrink-0 grid place-items-center">
                {p.image_urls[0] ? (
                  <img src={p.image_urls[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Smartphone className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{formatBRL(p.price_cents)}</p>
              </div>
              <Switch checked={p.featured} onCheckedChange={() => toggle(p)} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
