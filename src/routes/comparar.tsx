import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Plus, Check, Minus, ExternalLink, Loader2, Smartphone } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/marketplace";
import type { Product } from "@/lib/marketplace-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_URL } from "@/lib/site";

const MOBILEAPI_KEY = import.meta.env.VITE_MOBILEAPI_KEY as string | undefined;
const MAX = 3;

export const Route = createFileRoute("/comparar")({
  validateSearch: (search: Record<string, unknown>) => ({
    ids: typeof search.ids === "string" ? search.ids : "",
  }),
  head: () => ({
    meta: [
      { title: "Comparar celulares — Glass Phone SBS" },
      { name: "description", content: "Compare até 3 celulares lado a lado: tela, câmera, bateria, processador e preço. Escolha o modelo ideal na Glass Phone SBS." },
      { property: "og:title", content: "Comparador de celulares" },
      { property: "og:description", content: "Compare modelos lado a lado antes de comprar." },
      { property: "og:url", content: `${SITE_URL}/comparar` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/comparar` }],
  }),
  component: CompararPage,
});

// ─── MobileAPI types ────────────────────────────────────────────────────────
interface MobileSpecs {
  name?: string;
  brand_name?: string;
  screen_resolution?: string;
  hardware?: string;
  camera?: string;
  battery_capacity?: string;
  weight?: string;
  release_date?: string;
  storage?: string;
  colors?: string;
  os?: string;
  nfc?: string;
  "5g"?: string;
  connectivity?: string;
  [key: string]: string | undefined;
}

async function fetchPhoneSpecs(productName: string): Promise<MobileSpecs | null> {
  if (!MOBILEAPI_KEY) return null;
  try {
    const res = await fetch(
      `https://api.mobileapi.dev/devices/search?name=${encodeURIComponent(productName)}&key=${MOBILEAPI_KEY}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
  } catch {
    return null;
  }
}

// ─── Spec rows definition ────────────────────────────────────────────────────
const SPEC_ROWS: { label: string; key: keyof MobileSpecs }[] = [
  { label: "Tela", key: "screen_resolution" },
  { label: "Processador / RAM", key: "hardware" },
  { label: "Armazenamento", key: "storage" },
  { label: "Câmera traseira", key: "camera" },
  { label: "Bateria", key: "battery_capacity" },
  { label: "Sistema", key: "os" },
  { label: "5G", key: "5g" },
  { label: "NFC", key: "nfc" },
  { label: "Peso", key: "weight" },
  { label: "Cores", key: "colors" },
  { label: "Lançamento", key: "release_date" },
];

// ─── Page component ──────────────────────────────────────────────────────────
function CompararPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const initialIds = search.ids ? search.ids.split(",").filter(Boolean).slice(0, MAX) : [];
  const [selected, setSelected] = useState<string[]>(initialIds);
  const [picking, setPicking] = useState(initialIds.length === 0);
  const [specs, setSpecs] = useState<Record<string, MobileSpecs | null>>({});
  const [loadingSpecs, setLoadingSpecs] = useState<Record<string, boolean>>({});

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["comparar-produtos"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products").select("*").eq("kind", "product").eq("active", true).order("name");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
    staleTime: 60_000,
  });

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const chosen = selected.map((id) => byId.get(id)).filter(Boolean) as Product[];

  const updateUrl = (ids: string[]) => {
    navigate({ search: { ids: ids.join(",") }, replace: true });
  };

  const loadSpecs = async (product: Product) => {
    if (specs[product.id] !== undefined) return; // already loaded
    setLoadingSpecs((s) => ({ ...s, [product.id]: true }));
    const result = await fetchPhoneSpecs(product.name);
    setSpecs((s) => ({ ...s, [product.id]: result }));
    setLoadingSpecs((s) => ({ ...s, [product.id]: false }));
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX ? prev : [...prev, id];
      updateUrl(next);
      // load specs for newly added
      if (!prev.includes(id) && prev.length < MAX) {
        const p = byId.get(id);
        if (p) loadSpecs(p);
      }
      return next;
    });
  };

  const remove = (id: string) => {
    const next = selected.filter((x) => x !== id);
    setSelected(next);
    updateUrl(next);
    if (next.length === 0) setPicking(true);
  };

  // Build Versus URL
  const versusUrl = chosen.length >= 2
    ? `https://versus.com/br/phone/${chosen.map(p => encodeURIComponent(p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))).join("/vs/")}`
    : null;

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-10 md:py-14">
        <header className="max-w-3xl mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Compare celulares lado a lado
          </h1>
          <p className="text-muted-foreground">
            Selecione até {MAX} modelos para comparar preço, tela, câmera, bateria e muito mais.
          </p>

          {/* Barra de progresso + link Versus */}
          {chosen.length >= 1 && (
            <div className="mt-4 p-3 rounded-xl border border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 text-sm">
                {chosen.length === 1
                  ? <span className="text-muted-foreground">Selecione mais 1 modelo para comparar</span>
                  : <span className="text-emerald-600 font-medium">✓ {chosen.length} modelos prontos</span>
                }
              </div>
              {versusUrl && (
                <a href={versusUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2 shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver specs técnicas no Versus.com
                  </Button>
                </a>
              )}
            </div>
          )}
        </header>

        {/* Product picker */}
        {(picking || chosen.length < MAX) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                Selecione produtos ({selected.length}/{MAX})
              </h2>
              {chosen.length >= 2 && (
                <Button variant="outline" size="sm" onClick={() => setPicking(false)}>
                  Ver comparação
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
              </div>
            ) : products.length === 0 ? (
              <p className="text-muted-foreground">Nenhum produto disponível.</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((p) => {
                  const isSel = selected.includes(p.id);
                  const disabled = !isSel && selected.length >= MAX;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggle(p.id)}
                      disabled={disabled}
                      className={`text-left rounded-lg border p-3 transition ${
                        isSel ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                               : "border-border hover:border-primary/50 hover:bg-muted/40"
                      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="aspect-square rounded bg-muted overflow-hidden mb-2">
                        {p.image_urls[0]
                          ? <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full grid place-items-center text-muted-foreground"><Smartphone className="w-8 h-8" /></div>
                        }
                      </div>
                      <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatBRL(p.price_cents)}</p>
                      {isSel && (
                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-semibold">
                          <Check className="h-3 w-3" /> Selecionado
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Comparison table */}
        {chosen.length >= 2 && (
          <ComparisonTable
            products={chosen}
            specs={specs}
            loadingSpecs={loadingSpecs}
            onRemove={remove}
            onAdd={() => setPicking(true)}
          />
        )}
      </section>
    </SiteShell>
  );
}

// ─── Comparison table ────────────────────────────────────────────────────────
function ComparisonTable({
  products, specs, loadingSpecs, onRemove, onAdd,
}: {
  products: Product[];
  specs: Record<string, MobileSpecs | null>;
  loadingSpecs: Record<string, boolean>;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const slots = [...products, ...Array(Math.max(0, MAX - products.length)).fill(null)];
  const hasSpecs = products.some((p) => specs[p.id] != null);

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="p-4 text-left text-xs uppercase tracking-wider text-muted-foreground w-36 sticky left-0 bg-muted/30">
                Especificação
              </th>
              {slots.map((p, i) => (
                <th key={i} className="p-4 text-left align-top border-l min-w-[180px]">
                  {p ? (
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link to="/loja/$slug" params={{ slug: p.slug }}
                          className="font-semibold text-sm hover:text-primary transition line-clamp-2">
                          {p.name}
                        </Link>
                        <button onClick={() => onRemove(p.id)}
                          className="text-muted-foreground hover:text-destructive transition shrink-0"
                          aria-label={`Remover ${p.name}`}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="aspect-square rounded bg-muted overflow-hidden max-w-[140px]">
                        {p.image_urls[0] && (
                          <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      {loadingSpecs[p.id] && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" /> Buscando specs...
                        </div>
                      )}
                      {!loadingSpecs[p.id] && specs[p.id] === null && (
                        <Badge variant="outline" className="text-xs">Specs não encontradas</Badge>
                      )}
                    </div>
                  ) : (
                    <button onClick={onAdd}
                      className="w-full aspect-square max-w-[140px] rounded border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition flex flex-col items-center justify-center text-muted-foreground hover:text-primary">
                      <Plus className="h-6 w-6 mb-1" />
                      <span className="text-xs">Adicionar</span>
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Preço — linha especial */}
            <tr className="border-b bg-primary/5">
              <td className="p-4 text-sm font-semibold sticky left-0 bg-primary/5">Preço na loja</td>
              {slots.map((p, i) => (
                <td key={i} className="p-4 border-l align-top">
                  {p ? (
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-primary">{formatBRL(p.price_cents)}</p>
                      <p className="text-xs text-muted-foreground">ou 12× de {formatBRL(Math.ceil(p.price_cents / 12))}</p>
                      <Link to="/loja/$slug" params={{ slug: p.slug }}>
                        <Button size="sm" className="w-full mt-1">Comprar</Button>
                      </Link>
                    </div>
                  ) : <span className="text-muted-foreground/40">—</span>}
                </td>
              ))}
            </tr>

            {/* Saúde da bateria do banco (sempre disponível) */}
            <tr className="border-b">
              <td className="p-4 text-sm text-muted-foreground sticky left-0 bg-card">Saúde da bateria</td>
              {slots.map((p, i) => (
                <td key={i} className="p-4 border-l align-middle">
                  {p ? (
                    p.battery_health != null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[80px]">
                          <div className="h-full bg-emerald-500" style={{ width: `${p.battery_health}%` }} />
                        </div>
                        <span className="text-sm font-medium">{p.battery_health}%</span>
                      </div>
                    ) : <span className="text-muted-foreground text-sm">—</span>
                  ) : <span className="text-muted-foreground/40">—</span>}
                </td>
              ))}
            </tr>

            {/* Specs da API */}
            {hasSpecs && SPEC_ROWS.map((row) => (
              <tr key={row.key} className="border-b">
                <td className="p-4 text-sm text-muted-foreground sticky left-0 bg-card">{row.label}</td>
                {slots.map((p, i) => (
                  <td key={i} className="p-4 border-l align-top text-sm">
                    {p ? (
                      loadingSpecs[p.id]
                        ? <Skeleton className="h-4 w-24" />
                        : <span>{specs[p.id]?.[row.key] ?? "—"}</span>
                    ) : <span className="text-muted-foreground/40">—</span>}
                  </td>
                ))}
              </tr>
            ))}

            {/* Condição */}
            <tr className="border-b">
              <td className="p-4 text-sm text-muted-foreground sticky left-0 bg-card">Condição</td>
              {slots.map((p, i) => (
                <td key={i} className="p-4 border-l">
                  {p ? (
                    p.condition
                      ? <Badge variant="outline" className="capitalize">{p.condition}</Badge>
                      : <span className="text-muted-foreground text-sm">—</span>
                  ) : <span className="text-muted-foreground/40">—</span>}
                </td>
              ))}
            </tr>

            {/* Ver produto */}
            <tr>
              <td className="p-4 sticky left-0 bg-card"></td>
              {slots.map((p, i) => (
                <td key={i} className="p-4 border-l">
                  {p && (
                    <Link to="/loja/$slug" params={{ slug: p.slug }}>
                      <Button size="sm" variant="outline" className="w-full">Ver produto</Button>
                    </Link>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
