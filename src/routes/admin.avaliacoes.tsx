import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2, Star, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Review } from "@/lib/marketplace-types";

export const Route = createFileRoute("/admin/avaliacoes")({
  component: AdminReviews,
});

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
    const { error } = await supabase
      .from("reviews")
      .update({ approved: !r.approved })
      .eq("id", r.id);
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

  const pending = reviews.filter((r) => !r.approved).length;
  const approved = reviews.filter((r) => r.approved).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Moderar avaliações</h1>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{pending} pendente{pending !== 1 ? "s" : ""}</Badge>
          <Badge variant="default">{approved} aprovada{approved !== 1 ? "s" : ""}</Badge>
        </div>
      </div>

      {isLoading ? (
        <p>Carregando…</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma avaliação ainda.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4 flex flex-col md:flex-row md:items-start gap-4">
              {/* Foto */}
              {r.photo_url ? (
                <a href={r.photo_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <img
                    src={r.photo_url}
                    alt="Foto da avaliação"
                    className="w-20 h-20 rounded-lg object-cover border border-border"
                  />
                </a>
              ) : (
                <div className="shrink-0 w-20 h-20 rounded-lg bg-muted border border-border grid place-items-center text-muted-foreground">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

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
                  {r.product_id && (
                    <Badge variant="outline" className="text-xs">Produto específico</Badge>
                  )}
                </div>
                <p className="text-sm mt-2">{r.comment}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </p>
              </div>

              <div className="flex gap-2 shrink-0 flex-wrap">
                <Button
                  size="sm"
                  variant={r.approved ? "outline" : "default"}
                  onClick={() => toggle(r)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {r.approved ? "Ocultar" : "Aprovar"}
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
