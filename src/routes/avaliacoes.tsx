import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Send, MessageCircle, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, Review } from "@/lib/marketplace-types";

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

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-review"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .eq("active", true)
        .eq("kind", "product")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Pick<Product, "id" | "name">[];
    },
  });

  const [name, setName] = useState("");
  const [city, setCity] = useState("São Bento do Sul");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [productId, setProductId] = useState<string>("none");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Foto muito grande. Máximo 5 MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || comment.trim().length < 5) {
      toast.error("Preencha nome e depoimento.");
      return;
    }
    setSubmitting(true);
    try {
      let uploadedPhotoUrl: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("review-photos")
          .upload(path, photoFile, { cacheControl: "3600", upsert: false });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage
          .from("review-photos")
          .getPublicUrl(path);
        uploadedPhotoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("reviews").insert({
        author_name: name.trim().slice(0, 60),
        city: city.trim().slice(0, 60) || null,
        rating: Math.min(5, Math.max(1, rating)),
        comment: comment.trim().slice(0, 500),
        approved: false,
        product_id: productId === "none" ? null : productId,
        photo_url: uploadedPhotoUrl,
      });
      if (error) throw error;
      toast.success("Avaliação enviada! Ficará visível após aprovação.");
      setName("");
      setComment("");
      setRating(5);
      setProductId("none");
      clearPhoto();
      qc.invalidateQueries({ queryKey: ["reviews-public"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar avaliação.");
    } finally {
      setSubmitting(false);
    }
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
                {r.photo_url && (
                  <img
                    src={r.photo_url}
                    alt="Foto da avaliação"
                    className="w-full aspect-video object-cover rounded-lg"
                    loading="lazy"
                  />
                )}
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
                <label className="text-sm font-semibold block mb-1.5">Produto (opcional)</label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto avaliado…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Avaliação geral da loja</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {/* Foto */}
              <div>
                <label className="text-sm font-semibold block mb-1.5">Foto (opcional)</label>
                {photoPreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="absolute top-1 right-1 bg-background/80 rounded-full p-1 hover:bg-background"
                      aria-label="Remover foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 rounded-lg border border-dashed border-border hover:border-primary hover:bg-muted/40 transition text-sm text-muted-foreground">
                    <ImagePlus className="w-4 h-4" />
                    Adicionar foto
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handlePhoto}
                    />
                  </label>
                )}
                <p className="text-xs text-muted-foreground mt-1">Máximo 5 MB · JPG, PNG ou WebP</p>
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
