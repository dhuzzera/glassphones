import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Category, CategoryType } from "@/lib/marketplace-types";
import { slugify } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/admin/categorias")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("product");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: cats = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order").order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(name);
    const { error } = await supabase.from("categories").insert({ name, slug, type });
    if (error) return toast.error(error.message);
    toast.success("Categoria criada");
    setName("");
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    setDeleteTarget(null);
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <>
      <ConfirmDialog
        open={deleteTarget !== null}
        description="A categoria será excluída permanentemente."
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
      <div>
        <h1 className="text-2xl font-bold mb-6">Categorias</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Nova categoria</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={create} className="space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={(v) => setType(v as CategoryType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Produto</SelectItem>
                      <SelectItem value="service">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full"><Plus className="w-4 h-4 mr-2" />Criar</Button>
              </form>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Existentes</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <p>Carregando...</p> : cats.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma categoria ainda.</p>
              ) : (
                <div className="space-y-2">
                  {cats.map((c) => (
                    <CategoryRow key={c.id} category={c} onRemove={setDeleteTarget} onChanged={() => {
                      qc.invalidateQueries({ queryKey: ["admin-categories"] });
                      qc.invalidateQueries({ queryKey: ["categories"] });
                    }} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function CategoryRow({ category, onRemove, onChanged }: {
  category: Category;
  onRemove: (id: string) => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState(category.image_url ?? "");
  const [featured, setFeatured] = useState(category.featured);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `categories/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("categories")
      .update({ image_url: imageUrl || null, featured })
      .eq("id", category.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Categoria atualizada");
    setEditing(false);
    onChanged();
  };

  return (
    <div className="p-3 border rounded-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
            {imageUrl && <img src={imageUrl} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{category.name}</p>
            <p className="text-xs text-muted-foreground truncate">/{category.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={category.type === "product" ? "default" : "secondary"}>
            {category.type === "product" ? "Produto" : "Serviço"}
          </Badge>
          {category.featured && <Badge variant="outline">Destaque</Badge>}
          <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
            {editing ? "Fechar" : "Editar"}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onRemove(category.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
      {editing && (
        <div className="mt-3 pt-3 border-t space-y-3">
          <div>
            <Label className="text-xs">Imagem de capa (URL)</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            <div className="mt-2">
              <label className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                />
                {uploading ? "Enviando..." : "Enviar imagem"}
              </label>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Exibir como destaque na loja
          </label>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
