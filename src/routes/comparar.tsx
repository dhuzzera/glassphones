import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Plus, Check, Minus } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/marketplace";
import type { Product } from "@/lib/marketplace-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/comparar")({
  validateSearch: (search: Record<string, unknown>) => ({
    ids: typeof search.ids === "string" ? search.ids : "",
  }),
  head: () => ({
    meta: [
      { title: "Comparar celulares — Glass Phone SBS" },
      {
        name: "description",
        content:
          "Compare até 3 celulares lado a lado: preço, saúde da bateria, estoque e especificações. Escolha o modelo ideal na Glass Phone SBS.",
      },
      { property: "og:title", content: "Comparador de celulares" },
      { property: "og:description", content: "Compare modelos lado a lado antes de comprar." },
      { property: "og:url", content: "https://glassphones.lovable.app/comparar" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://glassphones.lovable.app/comparar" }],
  }),
  component: CompararPage,
});

const MAX = 3;

function CompararPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const initialIds = search.ids ? search.ids.split(",").filter(Boolean).slice(0, MAX) : [];
  const [selected, setSelected] = useState<string[]>(initialIds);
  const [picking, setPicking] = useState(initialIds.length === 0);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["comparar-produtos"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("kind", "product")
        .eq("active", true)
        .order("name");
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

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX
          ? prev
          : [...prev, id];
      updateUrl(next);
      return next;
    });
  };

  const remove = (id: string) => {
    const next = selected.filter((x) => x !== id);
    setSelected(next);
    updateUrl(next);
    if (next.length === 0) setPicking(true);
  };

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-10 md:py-14">
        <header className="max-w-2xl mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Compare celulares lado a lado
          </h1>
          <p className="text-muted-foreground text-lg">
            Escolha até {MAX} modelos e veja preço, saúde da bateria e especificações
            em uma tabela clara.
          </p>
        </header>

        {picking || chosen.length < MAX ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                Selecione produtos ({selected.length}/{MAX})
              </h2>
              {chosen.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setPicking(false)}>
                  Ver comparação
                </Button>
              )}
            </div>

            {isLoading ? (
              <p className="text-muted-foreground">Carregando produtos...</p>
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
                        isSel
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                          : "border-border hover:border-primary/50 hover:bg-muted/40"
                      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="aspect-square rounded bg-muted overflow-hidden mb-2">
                        {p.image_urls[0] && (
                          <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                        )}
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
        ) : null}

        {chosen.length > 0 && (
          <ComparisonTable products={chosen} onRemove={remove} onAdd={() => setPicking(true)} maxSlots={MAX} />
        )}
      </section>
    </SiteShell>
  );
}

function ComparisonTable({
  products,
  onRemove,
  onAdd,
  maxSlots,
}: {
  products: Product[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  maxSlots: number;
}) {
  const slots = [...products, ...Array(Math.max(0, maxSlots - products.length)).fill(null)];

  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    { label: "Preço", render: (p) => <span className="font-semibold text-primary">{formatBRL(p.price_cents)}</span> },
    {
      label: "Saúde da bateria",
      render: (p) =>
        p.battery_health != null ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[100px]">
              <div className="h-full bg-primary" style={{ width: `${p.battery_health}%` }} />
            </div>
            <span className="text-sm font-medium">{p.battery_health}%</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      label: "Estoque",
      render: (p) =>
        p.stock == null ? (
          <span className="text-muted-foreground text-sm">Sob consulta</span>
        ) : p.stock > 0 ? (
          <Badge variant="outline" className="border-primary/40 text-primary">
            {p.stock} disponível{p.stock > 1 ? "eis" : ""}
          </Badge>
        ) : (
          <Badge variant="destructive">Esgotado</Badge>
        ),
    },
    {
      label: "Destaque",
      render: (p) => (p.featured ? <Badge>Destaque da semana</Badge> : <Minus className="h-3 w-3 text-muted-foreground" />),
    },
    {
      label: "Descrição",
      render: (p) => (
        <p className="text-xs text-muted-foreground line-clamp-4">
          {p.description ?? "Sem descrição."}
        </p>
      ),
    },
  ];

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="p-4 text-left text-xs uppercase tracking-wider text-muted-foreground w-40">
                Especificação
              </th>
              {slots.map((p, i) => (
                <th key={i} className="p-4 text-left align-top border-l">
                  {p ? (
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to="/loja/$slug"
                          params={{ slug: p.slug }}
                          className="font-semibold hover:text-primary transition line-clamp-2"
                        >
                          {p.name}
                        </Link>
                        <button
                          onClick={() => onRemove(p.id)}
                          className="text-muted-foreground hover:text-destructive transition"
                          aria-label={`Remover ${p.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="aspect-square rounded bg-muted overflow-hidden max-w-[160px]">
                        {p.image_urls[0] && (
                          <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={onAdd}
                      className="w-full aspect-square max-w-[160px] rounded border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition flex items-center justify-center text-muted-foreground hover:text-primary"
                    >
                      <div className="text-center">
                        <Plus className="h-6 w-6 mx-auto mb-1" />
                        <span className="text-xs">Adicionar</span>
                      </div>
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b">
                <td className="p-4 text-sm font-medium text-muted-foreground">{row.label}</td>
                {slots.map((p, i) => (
                  <td key={i} className="p-4 border-l align-top">
                    {p ? row.render(p) : <span className="text-muted-foreground/40">—</span>}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4"></td>
              {slots.map((p, i) => (
                <td key={i} className="p-4 border-l">
                  {p && (
                    <Link to="/loja/$slug" params={{ slug: p.slug }}>
                      <Button size="sm" className="w-full">Ver produto</Button>
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
