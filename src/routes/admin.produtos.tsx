import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Category, ProductKind, ProductVariant } from "@/lib/marketplace-types";
import { formatBRL, slugify } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin/produtos")({
  component: ProductsAdmin,
});

interface FormState {
  id?: string;
  name: string;
  slug: string;
  description: string;
  priceReais: string;
  kind: ProductKind;
  category_id: string | null;
  image_urls: string[];
  featured: boolean;
  active: boolean;
  stock: string;
}

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  priceReais: "",
  kind: "product",
  category_id: null,
  image_urls: [],
  featured: false,
  active: true,
  stock: "",
};

function ProductsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FormState | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const openNew = () => setEditing({ ...emptyForm });
  const openEdit = (p: Product) => setEditing({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    priceReais: (p.price_cents / 100).toFixed(2),
    kind: p.kind,
    category_id: p.category_id,
    image_urls: p.image_urls,
    featured: p.featured,
    active: p.active,
    stock: p.stock?.toString() ?? "",
  });

  const remove = async (id: string) => {
    if (!confirm("Excluir este item?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Produtos e Serviços</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6">Carregando...</p>
          ) : products.length === 0 ? (
            <p className="p-6 text-muted-foreground">Nenhum item ainda. Clique em "Novo" para começar.</p>
          ) : (
            <div className="divide-y">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-4">
                  <div className="w-14 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                    {p.image_urls[0] && <img src={p.image_urls[0]} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{p.name}</p>
                      <Badge variant={p.kind === "product" ? "default" : "secondary"}>{p.kind === "product" ? "Produto" : "Serviço"}</Badge>
                      {p.featured && <Badge variant="outline">Destaque</Badge>}
                      {!p.active && <Badge variant="destructive">Inativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{formatBRL(p.price_cents)} • /{p.slug}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ProductEditor
        state={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["admin-products"] });
          qc.invalidateQueries({ queryKey: ["products"] });
        }}
      />
    </div>
  );
}

function ProductEditor({ state, categories, onClose, onSaved }: {
  state: FormState | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (state) setForm(state); }, [state]);

  const catsForKind = categories.filter((c) => c.type === form.kind);

  const upload = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...urls] }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const priceCents = Math.round(parseFloat(form.priceReais.replace(",", ".")) * 100);
      if (isNaN(priceCents) || priceCents < 0) throw new Error("Preço inválido");
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description || null,
        price_cents: priceCents,
        kind: form.kind,
        category_id: form.category_id,
        image_urls: form.image_urls,
        featured: form.featured,
        active: form.active,
        stock: form.stock ? parseInt(form.stock, 10) : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = form.id
        ? await supabase.from("products").update(payload).eq("id", form.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
      toast.success(form.id ? "Atualizado" : "Criado");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={state !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>{form.id ? "Editar" : "Novo item"}</SheetTitle></SheetHeader>
        <form onSubmit={save} className="space-y-4 mt-6">
          <div>
            <Label>Tipo</Label>
            <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as ProductKind, category_id: null })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Produto</SelectItem>
                <SelectItem value="service">Serviço</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} required />
          </div>
          <div>
            <Label>Slug (URL)</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Preço (R$) *</Label>
              <Input type="text" inputMode="decimal" value={form.priceReais} onChange={(e) => setForm({ ...form, priceReais: e.target.value })} required />
            </div>
            <div>
              <Label>Estoque {form.kind === "service" && <span className="text-xs text-muted-foreground">(opcional)</span>}</Label>
              <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={form.category_id ?? "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {catsForKind.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Imagens</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {form.image_urls.map((u, i) => (
                <div key={i} className="relative aspect-square bg-muted rounded overflow-hidden">
                  <img src={u} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => setForm({ ...form, image_urls: form.image_urls.filter((_, idx) => idx !== i) })}
                    className="absolute top-1 right-1 bg-background/80 rounded-full p-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-muted">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">{uploading ? "..." : "Enviar"}</span>
                <input type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Destaque</Label>
            <Switch checked={form.featured} onCheckedChange={(c) => setForm({ ...form, featured: c })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Ativo</Label>
            <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
