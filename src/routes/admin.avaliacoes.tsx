import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/avaliacoes")({
  component: AdminReviews,
});

interface Review {
  id: string;
  author_name: string;
  city: string | null;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

function AdminReviews() {
  const qc = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("approved", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  const toggle = async (r: Review) => {
    const { error } = await supabase.from("reviews").update({ approved: !r.approved }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(!r.approved ? "Aprovada" : "Ocultada");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["reviews-public"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir avaliação?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["reviews-public"] });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Moderar avaliações</h1>
      {isLoading ? (
        <p>Carregando…</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma avaliação ainda.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{r.author_name}</p>
                  {r.city && <span className="text-xs text-muted-foreground">· {r.city}</span>}
                  <div className="flex text-yellow-500 ml-2">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <Badge variant={r.approved ? "default" : "secondary"}>
                    {r.approved ? "Aprovada" : "Pendente"}
                  </Badge>
                </div>
                <p className="text-sm mt-2">{r.comment}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant={r.approved ? "outline" : "default"} onClick={() => toggle(r)}>
                  <Check className="h-4 w-4 mr-1" /> {r.approved ? "Ocultar" : "Aprovar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
