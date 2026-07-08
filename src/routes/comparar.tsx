import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X, Plus, Check, ExternalLink, Loader2, Smartphone,
  BatteryFull, Monitor, Cpu, Camera, Weight, ChevronDown, ChevronUp,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/marketplace";
import type { Product } from "@/lib/marketplace-types";
import { Button } from "@/components/ui/button";
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
      { name: "description", content: "Compare até 3 celulares lado a lado: tela, câmera, bateria, processador e preço." },
      { property: "og:url", content: `${SITE_URL}/comparar` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/comparar` }],
  }),
  component: CompararPage,
});

// ─── MobileAPI ─────────────────────────────────────────────────────────────

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
  os?: string;
  nfc?: string;
  "5g"?: string;
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

// ─── Spec rows config ───────────────────────────────────────────────────────

const API_SPEC_ROWS: { label: string; key: keyof MobileSpecs }[] = [
  { label: "Tela", key: "screen_resolution" },
  { label: "Processador / RAM", key: "hardware" },
  { label: "Armazenamento", key: "storage" },
  { label: "Câmera traseira", key: "camera" },
  { label: "Bateria (capacidade)", key: "battery_capacity" },
  { label: "Sistema", key: "os" },
  { label: "5G", key: "5g" },
  { label: "NFC", key: "nfc" },
  { label: "Peso", key: "weight" },
  { label: "Lançamento", key: "release_date" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extrai número de uma string como "4500 mAh" → 4500 */
function extractNumber(val?: string): number | null {
  if (!val) return null;
  const m = val.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

type WinnerFn = (values: (string | null | undefined)[]) => number | null;

/** Retorna o índice do "vencedor" para uma linha de spec */
const winnerByHighestNumber: WinnerFn = (values) => {
  const nums = values.map(extractNumber);
  const max = Math.max(...nums.filter((n): n is number => n !== null));
  if (!isFinite(max)) return null;
  const idx = nums.indexOf(max);
  return idx >= 0 ? idx : null;
};

const winnerByLowestNumber: WinnerFn = (values) => {
  const nums = values.map(extractNumber);
  const min = Math.min(...nums.filter((n): n is number => n !== null));
  if (!isFinite(min)) return null;
  const idx = nums.indexOf(min);
  return idx >= 0 ? idx : null;
};

// chave → qual direção é melhor
const WIN_RULES: Partial<Record<keyof MobileSpecs | "price" | "battery_health", WinnerFn>> = {
  battery_capacity: winnerByHighestNumber,
  weight: winnerByLowestNumber,
  price: winnerByLowestNumber,
  battery_health: winnerByHighestNumber,
};

// ─── Componentes ─────────────────────────────────────────────────────────────

function ConditionBadge({ condition }: { condition: Product["condition"] }) {
  if (!condition) return <span className="text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    novo: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    "semi-novo": "bg-blue-500/10 text-blue-700 border-blue-200",
    usado: "bg-orange-500/10 text-orange-700 border-orange-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${colors[condition] ?? ""}`}>
      {condition}
    </span>
  );
}

function BatteryBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>;
  const color = value >= 85 ? "bg-emerald-500" : value >= 70 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[40px]">
        <div className={`h-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold shrink-0">{value}%</span>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

function CompararPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const initialIds = search.ids ? search.ids.split(",").filter(Boolean).slice(0, MAX) : [];
  const [selected, setSelected] = useState<string[]>(initialIds);
  const [selectorOpen, setSelectorOpen] = useState(initialIds.length < 2);
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

  // Carrega specs dos produtos já selecionados quando a lista carrega
  useEffect(() => {
    if (products.length === 0) return;
    for (const id of selected) {
      const p = byId.get(id);
      if (p) loadSpecs(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  const updateUrl = (ids: string[]) =>
    navigate({ search: { ids: ids.join(",") }, replace: true });

  const loadSpecs = async (product: Product) => {
    // Se o produto já tem specs salvas no banco, usa diretamente — sem chamar API
    if (product.specs && Object.keys(product.specs).length > 0) {
      setSpecs((s) => ({ ...s, [product.id]: product.specs as MobileSpecs }));
      return;
    }
    if (specs[product.id] !== undefined) return;
    setLoadingSpecs((s) => ({ ...s, [product.id]: true }));
    const result = await fetchPhoneSpecs(product.name);
    setSpecs((s) => ({ ...s, [product.id]: result }));
    setLoadingSpecs((s) => ({ ...s, [product.id]: false }));
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        updateUrl(next);
        return next;
      }
      if (prev.length >= MAX) return prev;
      const next = [...prev, id];
      updateUrl(next);
      const p = byId.get(id);
      if (p) loadSpecs(p);
      return next;
    });
  };

  const remove = (id: string) => {
    const next = selected.filter((x) => x !== id);
    setSelected(next);
    updateUrl(next);
  };

  // Manda para a listagem de phones do Versus — o usuário busca lá pelo modelo exato
  const versusUrl = chosen.length >= 2 ? "https://versus.com/en/phone" : null;

  // Verifica se todos estão carregando ou nenhum tem specs da API
  const allSpecsLoaded = chosen.every((p) => !loadingSpecs[p.id]);
  const anyApiSpecs = chosen.some((p) => specs[p.id] !== null && specs[p.id] !== undefined);

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Comparar celulares</h1>
          <p className="text-muted-foreground text-sm">
            Selecione até {MAX} modelos para comparar specs lado a lado.
          </p>
        </div>

        {/* ── Seletor colapsável ── */}
        <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setSelectorOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">Selecionar modelos</span>
              <div className="flex gap-1.5">
                {[...Array(MAX)].map((_, i) => {
                  const p = chosen[i];
                  return (
                    <div
                      key={i}
                      className={`h-6 w-6 rounded-full border-2 text-[10px] font-bold grid place-items-center transition ${
                        p
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {p ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                  );
                })}
              </div>
              {chosen.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {chosen.length}/{MAX} selecionado{chosen.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {selectorOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {selectorOpen && (
            <div className="border-t border-border p-4">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-44 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {products.map((p) => {
                    const isSel = selected.includes(p.id);
                    const disabled = !isSel && selected.length >= MAX;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggle(p.id)}
                        disabled={disabled}
                        className={`text-left rounded-xl border p-3 transition ${
                          isSel
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/40 hover:bg-muted/30"
                        } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="aspect-square rounded-lg bg-muted overflow-hidden mb-2">
                          {p.image_urls[0] ? (
                            <img
                              src={p.image_urls[0]}
                              alt={p.name}
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-muted-foreground">
                              <Smartphone className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium line-clamp-2 mb-1">{p.name}</p>
                        <p className="text-xs text-primary font-bold">{formatBRL(p.price_cents)}</p>
                        {isSel && (
                          <div className="flex items-center gap-1 text-xs text-primary mt-1">
                            <Check className="w-3 h-3" /> Selecionado
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {chosen.length >= 2 && (
                <div className="mt-4 flex justify-end">
                  <Button size="sm" onClick={() => setSelectorOpen(false)}>
                    Ver comparação →
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Tabela de comparação ── */}
        {chosen.length >= 2 ? (
          <div>
            {/* Link Versus */}
            {versusUrl && (
              <div className="flex justify-end mb-4">
                <a href={versusUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Comparar no Versus.com
                  </Button>
                </a>
              </div>
            )}

            {/* Scroll horizontal no mobile */}
            <div className="overflow-x-auto -mx-4 px-4">
              <div style={{ minWidth: chosen.length === 3 ? "640px" : "440px" }}>
                {/* Cabeçalho com fotos e preços */}
                <div
                  className={`grid gap-3 mb-1`}
                  style={{ gridTemplateColumns: `180px repeat(${chosen.length}, 1fr)` }}
                >
                  {/* célula vazia */}
                  <div />
                  {chosen.map((p) => (
                    <div key={p.id} className="rounded-xl border border-border bg-card p-3 flex flex-col items-center text-center gap-2">
                      <div className="w-full aspect-square rounded-lg bg-muted overflow-hidden">
                        {p.image_urls[0] ? (
                          <img
                            src={p.image_urls[0]}
                            alt={p.name}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-muted-foreground">
                            <Smartphone className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-start justify-between w-full gap-1">
                        <p className="text-xs font-semibold leading-snug text-left line-clamp-3 flex-1">
                          {p.name}
                        </p>
                        <button
                          onClick={() => remove(p.id)}
                          aria-label="Remover"
                          className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <Link to="/loja/$slug" params={{ slug: p.slug }} className="w-full">
                        <Button size="sm" className="w-full text-xs">Comprar</Button>
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Linhas da tabela */}
                <CompareTable chosen={chosen} specs={specs} loadingSpecs={loadingSpecs} anyApiSpecs={anyApiSpecs} allSpecsLoaded={allSpecsLoaded} />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            <Smartphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Selecione pelo menos 2 modelos acima para comparar.</p>
          </div>
        )}
      </section>
    </SiteShell>
  );
}

// ─── Tabela de specs ─────────────────────────────────────────────────────────

interface CompareTableProps {
  chosen: Product[];
  specs: Record<string, MobileSpecs | null>;
  loadingSpecs: Record<string, boolean>;
  anyApiSpecs: boolean;
  allSpecsLoaded: boolean;
}

function CompareTable({ chosen, specs, loadingSpecs, anyApiSpecs, allSpecsLoaded }: CompareTableProps) {
  const cols = chosen.length;

  const gridStyle = { gridTemplateColumns: `180px repeat(${cols}, 1fr)` };

  const rowBase = "grid gap-3 border-t border-border items-center";
  const labelClass = "py-3 pl-1 text-xs text-muted-foreground font-medium";
  const cellClass = "py-3 px-2 text-xs text-center";

  // Determina o índice vencedor para uma lista de valores
  function getWinner(key: string, values: (string | null | undefined)[]): number | null {
    const fn = WIN_RULES[key as keyof typeof WIN_RULES];
    if (!fn) return null;
    return fn(values);
  }

  function CellWrapper({
    children,
    isWinner,
    loading,
  }: {
    children: React.ReactNode;
    isWinner?: boolean;
    loading?: boolean;
  }) {
    return (
      <div
        className={`${cellClass} rounded-lg transition ${
          isWinner
            ? "bg-emerald-500/10 text-emerald-700 font-semibold"
            : ""
        }`}
      >
        {loading ? (
          <Skeleton className="h-4 w-16 mx-auto" />
        ) : (
          children
        )}
      </div>
    );
  }

  // ── Linha: Preço ──
  const priceValues = chosen.map((p) => String(p.price_cents));
  const priceWinner = getWinner("price", priceValues);

  // ── Linha: Saúde da bateria ──
  const batteryValues = chosen.map((p) =>
    p.battery_health !== null ? String(p.battery_health) : null
  );
  const batteryWinner = getWinner("battery_health", batteryValues);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Preço */}
      <div className={`${rowBase} first:border-t-0`} style={gridStyle}>
        <div className={labelClass}>Preço</div>
        {chosen.map((p, i) => (
          <CellWrapper key={p.id} isWinner={priceWinner === i}>
            <span className="text-primary font-bold text-sm">{formatBRL(p.price_cents)}</span>
            <span className="block text-muted-foreground text-[10px] font-normal">
              Parcelas no WhatsApp
            </span>
          </CellWrapper>
        ))}
      </div>

      {/* Condição */}
      <div className={rowBase} style={gridStyle}>
        <div className={labelClass}>Condição</div>
        {chosen.map((p) => (
          <CellWrapper key={p.id}>
            <ConditionBadge condition={p.condition} />
          </CellWrapper>
        ))}
      </div>

      {/* Saúde da bateria */}
      <div className={rowBase} style={gridStyle}>
        <div className={`${labelClass} flex items-center gap-1`}>
          <BatteryFull className="w-3.5 h-3.5" />
          Saúde da bateria
        </div>
        {chosen.map((p, i) => (
          <CellWrapper key={p.id} isWinner={batteryWinner === i}>
            {p.battery_health !== null ? (
              <div className="flex justify-center">
                <div className="w-full max-w-[100px]">
                  <BatteryBar value={p.battery_health} />
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </CellWrapper>
        ))}
      </div>

      {/* Specs da API */}
      {!allSpecsLoaded ? (
        <div className={rowBase} style={gridStyle}>
          <div className={labelClass}>Specs técnicas</div>
          {chosen.map((p) => (
            <CellWrapper key={p.id} loading={loadingSpecs[p.id]}>
              {!loadingSpecs[p.id] && (
                <span className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> buscando…
                </span>
              )}
            </CellWrapper>
          ))}
        </div>
      ) : anyApiSpecs ? (
        API_SPEC_ROWS.map((row) => {
          const values = chosen.map((p) => specs[p.id]?.[row.key] ?? null);
          const hasAny = values.some(Boolean);
          if (!hasAny) return null;
          const winner = getWinner(row.key as string, values);
          return (
            <div key={row.key} className={rowBase} style={gridStyle}>
              <div className={labelClass}>{row.label}</div>
              {chosen.map((p, i) => (
                <CellWrapper key={p.id} isWinner={winner === i}>
                  {specs[p.id]?.[row.key] ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </CellWrapper>
              ))}
            </div>
          );
        })
      ) : (
        <div className={rowBase} style={gridStyle}>
          <div className={labelClass}>Specs técnicas</div>
          {chosen.map((p) => (
            <CellWrapper key={p.id}>
              <span className="text-muted-foreground text-[10px]">
                {MOBILEAPI_KEY ? "Não disponível" : "API não configurada"}
              </span>
            </CellWrapper>
          ))}
        </div>
      )}
    </div>
  );
}


