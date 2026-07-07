import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/avaliacoes")({
  head: () => ({
    meta: [
      { title: "Avaliações — Glass Phone SBS" },
      { name: "description", content: "O que nossos clientes de São Bento do Sul dizem sobre a Glass Phone." },
      { property: "og:title", content: "Avaliações — Glass Phone SBS" },
      { property: "og:description", content: "Depoimentos reais de quem confia na Glass Phone SBS." },
    ],
  }),
  component: AvaliacoesPage,
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

function AvaliacoesPage() {
  const qc = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  const [name, setName] = useState("");
  const [city, setCity] = useState("São Bento do Sul");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || comment.trim().length < 5) {
      toast.error("Preencha nome e depoimento.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      author_name: name.trim().slice(0, 60),
      city: city.trim().slice(0, 60) || null,
      rating: Math.min(5, Math.max(1, rating)),
      comment: comment.trim().slice(0, 500),
      approved: false,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Avaliação enviada! Ficará visível após aprovação.");
    setName("");
    setComment("");
    setRating(5);
    qc.invalidateQueries({ queryKey: ["reviews-public"] });
  };

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <span className="text-primary font-semibold text-sm tracking-widest">DEPOIMENTOS</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">Quem compra, recomenda</h1>
          <p className="text-muted-foreground mt-3">
            Nota média <span className="font-bold text-foreground">{avg}</span> · {reviews.length} avaliações
          </p>
          <div className="flex items-center justify-center gap-1 mt-3 text-yellow-500">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground">Carregando…</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
            {reviews.map((r) => (
              <Card key={r.id} className="p-5 flex flex-col gap-3">
                <div className="flex items-center gap-1 text-yellow-500">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed">{r.comment}</p>
                <div className="mt-auto pt-2 border-t border-border">
                  <p className="font-semibold text-sm">{r.author_name}</p>
                  {r.city && <p className="text-xs text-muted-foreground">{r.city}</p>}
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <Card className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Deixe sua avaliação</h2>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold block mb-1.5" htmlFor="rev-name">Nome</label>
                  <Input id="rev-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5" htmlFor="rev-city">Cidade</label>
                  <Input id="rev-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Nota</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className="p-1"
                      aria-label={`${n} estrelas`}
                    >
                      <Star className={`h-7 w-7 ${n <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5" htmlFor="rev-comment">Depoimento</label>
                <Textarea id="rev-comment" rows={4} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} required />
                <div className="text-xs text-muted-foreground text-right mt-1">{comment.length}/500</div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Enviando…" : "Enviar avaliação"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Sua avaliação será publicada após aprovação da nossa equipe.
              </p>
            </form>
          </Card>
        </div>
      </section>
    </SiteShell>
  );
}
