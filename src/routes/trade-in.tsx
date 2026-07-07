import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { z } from "zod";
import { Smartphone, ArrowRight, Info } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WhatsAppIcon } from "@/lib/site";
import { WHATSAPP_NUMBER, formatBRL } from "@/lib/marketplace";
import { track, trackWhatsApp } from "@/lib/analytics";

export const Route = createFileRoute("/trade-in")({
  head: () => ({
    meta: [
      { title: "Calculadora de Trade-in — Glass Phone SBS" },
      {
        name: "description",
        content:
          "Estime em segundos quanto vale seu celular usado como parte do pagamento em um novo aparelho na Glass Phone SBS. Avaliação sem compromisso via WhatsApp.",
      },
      { property: "og:title", content: "Trade-in — troque seu celular usado" },
      { property: "og:description", content: "Avaliação instantânea do seu aparelho usado." },
      { property: "og:url", content: "https://glassphones.lovable.app/trade-in" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://glassphones.lovable.app/trade-in" }],
  }),
  component: TradeInPage,
});

// ============ Modelo de precificação ============

type Marca = "apple" | "samsung" | "xiaomi" | "motorola" | "outra";
type Estado = "perfeito" | "bom" | "regular" | "danificado";

const BASE_POR_MARCA: Record<Marca, number> = {
  apple: 180_000, // R$ 1.800 base (iPhone médio, últimos 3 anos)
  samsung: 90_000, // R$ 900
  xiaomi: 70_000, // R$ 700
  motorola: 55_000, // R$ 550
  outra: 35_000, // R$ 350
};

const FATOR_ESTADO: Record<Estado, number> = {
  perfeito: 1.0,
  bom: 0.75,
  regular: 0.5,
  danificado: 0.25,
};

/** Palpite grosseiro: iPhone recente (>= 13) pesa mais, antigo pesa menos. */
function fatorModelo(marca: Marca, modelo: string): number {
  const m = modelo.toLowerCase();
  if (marca === "apple") {
    if (/(15|16)\s?pro\s?max/.test(m)) return 1.9;
    if (/(15|16)\s?pro/.test(m)) return 1.6;
    if (/(15|16)/.test(m)) return 1.3;
    if (/14\s?pro/.test(m)) return 1.2;
    if (/14/.test(m)) return 1.0;
    if (/13/.test(m)) return 0.8;
    if (/12/.test(m)) return 0.55;
    if (/11/.test(m)) return 0.4;
    return 0.3;
  }
  if (marca === "samsung") {
    if (/s2[34]\s?ultra/.test(m)) return 1.9;
    if (/s2[34]/.test(m)) return 1.4;
    if (/s2[12]/.test(m)) return 0.9;
    if (/a5[45]/.test(m)) return 0.9;
    if (/a3[45]/.test(m)) return 0.7;
    return 0.7;
  }
  if (marca === "xiaomi") {
    if (/1[34]\s?ultra/.test(m)) return 1.6;
    if (/1[34]/.test(m)) return 1.2;
    if (/note\s?1[23]/.test(m)) return 0.8;
    return 0.7;
  }
  if (marca === "motorola") {
    if (/edge\s?50/.test(m)) return 1.3;
    if (/edge\s?40/.test(m)) return 1.0;
    return 0.7;
  }
  return 0.8;
}

function estimar(marca: Marca, modelo: string, estado: Estado, bateria: number): {
  min: number;
  max: number;
} {
  const base = BASE_POR_MARCA[marca];
  const fm = fatorModelo(marca, modelo);
  const fe = FATOR_ESTADO[estado];
  const fb = Math.max(0.5, Math.min(1, bateria / 100));
  const central = Math.round(base * fm * fe * fb);
  const min = Math.round(central * 0.85);
  const max = Math.round(central * 1.15);
  return { min, max };
}

// ============ Validação ============

const schema = z.object({
  marca: z.enum(["apple", "samsung", "xiaomi", "motorola", "outra"]),
  modelo: z.string().trim().min(2, "Informe o modelo").max(80),
  estado: z.enum(["perfeito", "bom", "regular", "danificado"]),
  bateria: z.number().min(0).max(100),
  nome: z.string().trim().min(2, "Informe seu nome").max(80),
  telefone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{8,20}$/, "Telefone inválido"),
});

// ============ Componente ============

function TradeInPage() {
  const [marca, setMarca] = useState<Marca>("apple");
  const [modelo, setModelo] = useState("");
  const [estado, setEstado] = useState<Estado>("bom");
  const [bateria, setBateria] = useState("90");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const estimativa = useMemo(() => {
    if (!modelo.trim()) return null;
    const b = Math.max(0, Math.min(100, parseInt(bateria, 10) || 0));
    return estimar(marca, modelo, estado, b);
  }, [marca, modelo, estado, bateria]);

  const enviarWhats = () => {
    setErro(null);
    const b = parseInt(bateria, 10);
    const parsed = schema.safeParse({ marca, modelo, estado, bateria: b, nome, telefone });
    if (!parsed.success) {
      setErro(parsed.error.issues[0]?.message ?? "Preencha os campos corretamente");
      return;
    }
    const est = estimar(marca, modelo, estado, b);
    // Origem do lead: capturamos ?cidade / ?produto / ?origem (links vindos de
    // /em/$cidade ou de páginas de produto) + referrer para atribuição.
    const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
    const cidadeOrigem = url?.searchParams.get("cidade") ?? "";
    const produtoOrigem = url?.searchParams.get("produto") ?? "";
    const origemParam = url?.searchParams.get("origem") ?? "";
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    track("trade_in_lead_submit", {
      marca,
      modelo,
      estado,
      bateria: b,
      estimativa_min: est.min,
      estimativa_max: est.max,
      cidade: cidadeOrigem,
      produto: produtoOrigem,
      origem: origemParam,
      referrer,
    });
    trackWhatsApp("trade_in_form", { marca, modelo, cidade: cidadeOrigem });
    const msg = [
      "*Trade-in — Glass Phone SBS*",
      `Cliente: ${nome}`,
      `Telefone: ${telefone}`,
      "",
      `Aparelho: ${marca.toUpperCase()} ${modelo}`,
      `Estado: ${estado}`,
      `Bateria: ${b}%`,
      cidadeOrigem ? `Cidade: ${cidadeOrigem}` : "",
      produtoOrigem ? `Interesse: ${produtoOrigem}` : "",
      "",
      `Estimativa online: ${formatBRL(est.min)} — ${formatBRL(est.max)}`,
      "",
      "Gostaria de confirmar o valor e as opções de troca. Obrigado!",
    ]
      .filter(Boolean)
      .join("\n");
    window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-10 md:py-14 max-w-5xl">
        <header className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Smartphone className="h-3.5 w-3.5" /> Troque seu usado
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Quanto vale seu celular usado?
          </h1>
          <p className="text-muted-foreground text-lg">
            Estimativa em segundos. Depois é só falar com a gente no WhatsApp para
            confirmar e trocar por um novo (ou seminovo) da Glass Phone SBS.
          </p>
        </header>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do aparelho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Marca</Label>
                <Select value={marca} onValueChange={(v) => setMarca(v as Marca)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apple">Apple (iPhone)</SelectItem>
                    <SelectItem value="samsung">Samsung (Galaxy)</SelectItem>
                    <SelectItem value="xiaomi">Xiaomi / Redmi / POCO</SelectItem>
                    <SelectItem value="motorola">Motorola</SelectItem>
                    <SelectItem value="outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Modelo</Label>
                <Input
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ex.: iPhone 13 128GB, Galaxy S23, Redmi Note 12"
                  maxLength={80}
                />
              </div>

              <div>
                <Label className="mb-2 block">Estado de conservação</Label>
                <RadioGroup value={estado} onValueChange={(v) => setEstado(v as Estado)} className="grid grid-cols-2 gap-2">
                  {[
                    { v: "perfeito", label: "Perfeito", desc: "Sem marcas, com caixa" },
                    { v: "bom", label: "Bom", desc: "Marcas leves de uso" },
                    { v: "regular", label: "Regular", desc: "Riscos ou marcas visíveis" },
                    { v: "danificado", label: "Danificado", desc: "Tela trincada ou funcional c/ problemas" },
                  ].map((op) => (
                    <label
                      key={op.v}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                        estado === op.v ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem value={op.v} className="mt-1" />
                      <div>
                        <div className="text-sm font-medium">{op.label}</div>
                        <div className="text-xs text-muted-foreground">{op.desc}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Saúde da bateria (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={bateria}
                  onChange={(e) => setBateria(e.target.value)}
                  placeholder="90"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  iPhone: Ajustes → Bateria → Saúde. Não sabe? Deixe em 100.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <Label>Seu nome</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} />
                </div>
                <div>
                  <Label>Telefone / WhatsApp</Label>
                  <Input
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(47) 9 9999-9999"
                    maxLength={20}
                  />
                </div>
              </div>

              {erro && <p className="text-sm text-destructive">{erro}</p>}
            </CardContent>
          </Card>

          <aside className="lg:sticky lg:top-24 h-fit space-y-4">
            <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-base">Estimativa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {estimativa ? (
                  <>
                    <div className="text-3xl font-bold text-primary tracking-tight">
                      {formatBRL(estimativa.min)}
                      <span className="text-lg text-muted-foreground font-normal"> — </span>
                      {formatBRL(estimativa.max)}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      Valor estimado a partir do modelo, estado e bateria. O valor
                      final é confirmado após avaliação presencial (10-15 min).
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Preencha marca e modelo para ver a estimativa.
                  </p>
                )}
                <Button
                  onClick={enviarWhats}
                  className="w-full bg-whatsapp text-whatsapp-foreground hover:opacity-90"
                  size="lg"
                >
                  <WhatsAppIcon className="h-4 w-4 mr-2" />
                  Falar no WhatsApp
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground space-y-1 px-1">
              <p>✓ Avaliação sem compromisso</p>
              <p>✓ Pagamento parcial ou desconto direto</p>
              <p>✓ Aparelhos com nota fiscal têm valor maior</p>
            </div>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
