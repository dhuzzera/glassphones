import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, X, Upload, Search, ArrowLeft, Sparkles, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Category, ProductKind, ProductVariant } from "@/lib/marketplace-types";
import { formatBRL, slugify } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";

const MOBILEAPI_KEY = import.meta.env.VITE_MOBILEAPI_KEY as string | undefined;

export const Route = createFileRoute("/admin/produtos")({
  component: ProductsAdmin,
});

interface FormState {
  id?: string;
  name: string; slug: string; description: string; priceReais: string;
  kind: ProductKind; category_id: string | null; image_urls: string[];
  featured: boolean; active: boolean; stock: string; batteryHealth: string; condition: string;
  specs: Record<string, string>;
}

const emptyForm: FormState = {
  name: "", slug: "", description: "", priceReais: "",
  kind: "product", category_id: null, image_urls: [],
  featured: false, active: true, stock: "", batteryHealth: "100", condition: "",
  specs: {},
};

function ProductsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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
    id: p.id, name: p.name, slug: p.slug,
    description: p.description ?? "", priceReais: (p.price_cents / 100).toFixed(2),
    kind: p.kind, category_id: p.category_id, image_urls: p.image_urls,
    featured: p.featured, active: p.active,
    stock: p.stock?.toString() ?? "", batteryHealth: p.battery_health?.toString() ?? "100",
    condition: p.condition ?? "",
    specs: (p.specs as Record<string, string>) ?? {},
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    if (editing?.id === id) setEditing(null);
    setDeleteTarget(null);
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      <ConfirmDialog
        open={deleteTarget !== null}
        description="O produto será excluído permanentemente."
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Lista - esquerda */}
      <div className={`flex flex-col ${editing ? "hidden lg:flex lg:w-80 shrink-0" : "w-full"}`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Produtos</h1>
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Novo</Button>
        </div>
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto rounded-lg border border-border">
          {isLoading ? <p className="p-4 text-muted-foreground text-sm">Carregando...</p>
            : filtered.length === 0 ? <p className="p-4 text-muted-foreground text-sm">Nenhum item.</p>
            : filtered.map(p => (
            <div
              key={p.id}
              onClick={() => openEdit(p)}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition border-b border-border last:border-0 ${editing?.id === p.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
            >
              <div className="w-10 h-10 bg-muted rounded overflow-hidden shrink-0">
                {p.image_urls[0] && <img src={p.image_urls[0]} className="w-full h-full object-cover" alt="" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{formatBRL(p.price_cents)}</p>
              </div>
              <div className="flex flex-col gap-1 items-end shrink-0">
                {!p.active && <Badge variant="destructive" className="text-[10px] px-1 py-0">Inativo</Badge>}
                {p.featured && <Badge variant="outline" className="text-[10px] px-1 py-0">Destaque</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={e => { e.stopPropagation(); setDeleteTarget(p.id); }}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor - direita */}
      {editing && (
        <div className="flex-1 overflow-y-auto">
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
      )}

      {!editing && (
        <div className="hidden lg:flex flex-1 items-center justify-center text-muted-foreground">
          <p className="text-sm">Selecione um produto para editar ou clique em Novo</p>
        </div>
      )}
    </div>
  );
}

function ProductEditor({ state, categories, onClose, onSaved }: {
  state: FormState; categories: Category[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingSpecs, setFetchingSpecs] = useState(false);
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecVal, setNewSpecVal] = useState("");

  useEffect(() => { setForm(state); }, [state]);

  const catsForKind = categories.filter(c => c.type === form.kind);

  // Mapeamento MobileAPI → rótulos em português
  const API_SPEC_MAP: Record<string, string> = {
    screen_resolution: "Tela",
    hardware: "Processador / RAM",
    storage: "Armazenamento",
    camera: "Câmera traseira",
    battery_capacity: "Bateria",
    os: "Sistema",
    "5g": "5G",
    nfc: "NFC",
    weight: "Peso",
    release_date: "Lançamento",
  };

  const fetchSpecs = async () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome do produto primeiro");
      return;
    }
    setFetchingSpecs(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/fetch-phone-specs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ name: form.name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Erro ${res.status}`);
      }
      const device = await res.json();
      if (!device) { toast.error("Modelo não encontrado na MobileAPI"); return; }

      const parsed: Record<string, string> = {};
      for (const [apiKey, label] of Object.entries(API_SPEC_MAP)) {
        if (device[apiKey]) parsed[label] = String(device[apiKey]);
      }
      if (Object.keys(parsed).length === 0) {
        toast.error("Nenhuma spec encontrada para este modelo");
        return;
      }
      setForm(f => ({ ...f, specs: { ...f.specs, ...parsed } }));
      toast.success(`${Object.keys(parsed).length} specs importadas`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao buscar specs");
    } finally {
      setFetchingSpecs(false);
    }
  };

  const addSpec = () => {
    const k = newSpecKey.trim();
    const v = newSpecVal.trim();
    if (!k || !v) return;
    setForm(f => ({ ...f, specs: { ...f.specs, [k]: v } }));
    setNewSpecKey("");
    setNewSpecVal("");
  };

  const removeSpec = (key: string) => {
    setForm(f => {
      const next = { ...f.specs };
      delete next[key];
      return { ...f, specs: next };
    });
  };



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
      setForm(f => ({ ...f, image_urls: [...f.image_urls, ...urls] }));
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
      let batteryHealth: number | null = null;
      if (form.kind === "product") {
        const raw = form.batteryHealth.trim();
        const parsed = raw === "" ? 100 : Number(raw.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) throw new Error("Saúde da bateria inválida (0–100)");
        batteryHealth = Math.round(parsed);
      }
      const payload = {
        name: form.name, slug: form.slug || slugify(form.name),
        description: form.description || null, price_cents: priceCents,
        kind: form.kind, category_id: form.category_id, image_urls: form.image_urls,
        featured: form.featured, active: form.active,
        stock: form.stock ? parseInt(form.stock, 10) : null,
        battery_health: batteryHealth,
        condition: form.kind === "product" && form.condition ? form.condition : null,
        specs: form.kind === "product" && Object.keys(form.specs).length > 0 ? form.specs : null,
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
    <Card className="max-w-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-bold">{form.id ? `Editando: ${form.name}` : "Novo item"}</h2>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.kind} onValueChange={v => setForm({ ...form, kind: v as ProductKind, category_id: null })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Produto</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category_id ?? "none"} onValueChange={v => setForm({ ...form, category_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {catsForKind.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} required />
          </div>

          <div>
            <Label>Slug (URL)</Label>
            <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Preço (R$) *</Label>
              <Input type="text" inputMode="decimal" value={form.priceReais} onChange={e => setForm({ ...form, priceReais: e.target.value })} required />
            </div>
            <div>
              <Label>Estoque</Label>
              <Input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
            </div>
          </div>

          {form.kind === "product" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Saúde da bateria (%) <span className="text-xs text-muted-foreground">padrão 100</span></Label>
                <Input type="number" min="0" max="100" value={form.batteryHealth}
                  onChange={e => setForm({ ...form, batteryHealth: e.target.value })} placeholder="100" />
              </div>
              <div>
                <Label>Condição</Label>
                <Select value={form.condition || "none"} onValueChange={v => setForm({ ...form, condition: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Não informado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não informado</SelectItem>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="semi-novo">Semi-novo</SelectItem>
                    <SelectItem value="usado">Usado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label>Imagens</Label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {form.image_urls.map((u, i) => (
                <div key={i} className="relative aspect-square bg-muted rounded overflow-hidden">
                  <img src={u} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => setForm({ ...form, image_urls: form.image_urls.filter((_, idx) => idx !== i) })}
                    className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-muted">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">{uploading ? "..." : "Enviar"}</span>
                <input type="file" accept="image/*" multiple hidden onChange={e => e.target.files && upload(e.target.files)} />
              </label>
            </div>
          </div>

          {form.kind === "product" && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ficha técnica</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Specs exibidas no comparador e na PDP
                  </p>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={fetchSpecs}
                    disabled={fetchingSpecs}
                    className="gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {fetchingSpecs ? "Buscando…" : "Buscar specs"}
                  </Button>
              </div>

              {/* Lista de specs */}
              {Object.keys(form.specs).length > 0 && (
                <div className="rounded-lg border border-border divide-y">
                  {Object.entries(form.specs).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 px-3 py-2">
                      <span className="text-xs text-muted-foreground w-32 shrink-0">{k}</span>
                      <Input
                        value={v}
                        onChange={e => setForm(f => ({ ...f, specs: { ...f.specs, [k]: e.target.value } }))}
                        className="h-7 text-xs flex-1"
                      />
                      <button type="button" onClick={() => removeSpec(k)} className="text-muted-foreground hover:text-destructive shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar spec manual */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nome (ex: Tela)"
                  value={newSpecKey}
                  onChange={e => setNewSpecKey(e.target.value)}
                  className="h-8 text-xs"
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSpec())}
                />
                <Input
                  placeholder="Valor (ex: 6.1 pol.)"
                  value={newSpecVal}
                  onChange={e => setNewSpecVal(e.target.value)}
                  className="h-8 text-xs"
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSpec())}
                />
                <Button type="button" size="sm" variant="outline" onClick={addSpec} className="h-8 shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-6">
            <div className="flex items-center justify-between gap-3">
              <Label>Destaque</Label>
              <Switch checked={form.featured} onCheckedChange={c => setForm({ ...form, featured: c })} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label>Ativo</Label>
              <Switch checked={form.active} onCheckedChange={c => setForm({ ...form, active: c })} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>

        {form.id && form.kind === "product" && (
          <div className="mt-8 pt-6 border-t">
            <VariantsManager productId={form.id} basePriceCents={Math.round(parseFloat((form.priceReais || "0").replace(",", ".")) * 100) || 0} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ Variants Manager ============

interface VariantFormState {
  attributes: Record<string, string>;
  sku: string; priceReais: string; stock: string;
  image_url: string; sort_order: number; active: boolean;
}

const emptyVariantForm: VariantFormState = {
  attributes: {}, sku: "", priceReais: "", stock: "", image_url: "", sort_order: 0, active: true,
};

function VariantsManager({ productId, basePriceCents }: { productId: string; basePriceCents: number }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VariantFormState>(emptyVariantForm);
  const [attrName, setAttrName] = useState("");
  const [attrValue, setAttrValue] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: variants = [] } = useQuery({
    queryKey: ["admin-variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_variants").select("*")
        .eq("product_id", productId).order("sort_order").order("created_at");
      if (error) throw error;
      return (data ?? []) as ProductVariant[];
    },
  });

  const reset = () => { setForm(emptyVariantForm); setEditingId(null); setShowForm(false); setAttrName(""); setAttrValue(""); };

  const openEdit = (v: ProductVariant) => {
    setEditingId(v.id);
    setForm({ attributes: { ...v.attributes }, sku: v.sku ?? "", priceReais: v.price_cents != null ? (v.price_cents / 100).toFixed(2) : "",
      stock: v.stock != null ? String(v.stock) : "", image_url: v.image_url ?? "", sort_order: v.sort_order, active: v.active });
    setShowForm(true);
  };

  const addAttr = () => {
    const k = attrName.trim(); const v = attrValue.trim();
    if (!k || !v) return;
    setForm(f => ({ ...f, attributes: { ...f.attributes, [k]: v } }));
    setAttrName(""); setAttrValue("");
  };

  const save = async () => {
    if (Object.keys(form.attributes).length === 0) return toast.error("Adicione ao menos um atributo.");
    setSaving(true);
    const price = form.priceReais.trim() ? Math.round(parseFloat(form.priceReais.replace(",", ".")) * 100) : null;
    if (price != null && (isNaN(price) || price < 0)) { setSaving(false); return toast.error("Preço inválido"); }
    const payload = { product_id: productId, attributes: form.attributes, sku: form.sku || null,
      price_cents: price, stock: form.stock ? parseInt(form.stock, 10) : null,
      image_url: form.image_url || null, sort_order: form.sort_order, active: form.active,
      updated_at: new Date().toISOString() };
    const { error } = editingId
      ? await supabase.from("product_variants").update(payload).eq("id", editingId)
      : await supabase.from("product_variants").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Variação atualizada" : "Variação criada");
    reset();
    qc.invalidateQueries({ queryKey: ["admin-variants", productId] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir variação?")) return;
    const { error } = await supabase.from("product_variants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    qc.invalidateQueries({ queryKey: ["admin-variants", productId] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">Variações</h3>
          <p className="text-xs text-muted-foreground">Cor, Capacidade, etc. Se vazio, usa o preço base.</p>
        </div>
        {!showForm && <Button size="sm" variant="outline" onClick={() => setShowForm(true)}><Plus className="w-3 h-3 mr-1" />Nova</Button>}
      </div>

      <div className="space-y-2">
        {variants.map(v => (
          <div key={v.id} className="flex items-center gap-3 p-2 border rounded-lg">
            <div className="w-9 h-9 rounded bg-muted overflow-hidden shrink-0">
              {v.image_url && <img src={v.image_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(" · ")}</p>
              <p className="text-xs text-muted-foreground">
                {v.price_cents != null ? formatBRL(v.price_cents) : `${formatBRL(basePriceCents)} (base)`}
                {" · "}{v.stock != null ? `${v.stock} un.` : "livre"}
                {!v.active && " · inativa"}
              </p>
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(v)}><Pencil className="w-3 h-3" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(v.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
          <p className="text-sm font-semibold">{editingId ? "Editar variação" : "Nova variação"}</p>
          <div>
            <Label className="text-xs">Atributos</Label>
            <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
              {Object.entries(form.attributes).map(([k, v]) => (
                <Badge key={k} variant="secondary" className="gap-1 text-xs">
                  {k}: {v}
                  <button type="button" onClick={() => setForm(f => { const n = { ...f.attributes }; delete n[k]; return { ...f, attributes: n }; })}>
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Nome (ex: Cor)" value={attrName} onChange={e => setAttrName(e.target.value)} className="h-8 text-xs" />
              <Input placeholder="Valor (ex: Preto)" value={attrValue} onChange={e => setAttrValue(e.target.value)} className="h-8 text-xs" />
              <Button type="button" size="sm" onClick={addAttr} className="h-8">Add</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Preço (R$) — vazio herda</Label><Input inputMode="decimal" value={form.priceReais} onChange={e => setForm({ ...form, priceReais: e.target.value })} className="h-8" /></div>
            <div><Label className="text-xs">Estoque</Label><Input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="h-8" /></div>
            <div><Label className="text-xs">SKU (opcional)</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="h-8" /></div>
            <div><Label className="text-xs">Ordem</Label><Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })} className="h-8" /></div>
          </div>
          <div><Label className="text-xs">Imagem (URL)</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="h-8" /></div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Ativa</label>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={reset} className="flex-1">Cancelar</Button>
            <Button type="button" size="sm" onClick={save} disabled={saving} className="flex-1">{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
