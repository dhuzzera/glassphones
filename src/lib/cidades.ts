/**
 * Cidades atendidas por Glass Phone SBS (Norte de Santa Catarina + Norte do PR).
 * Usadas para páginas de SEO local /em/$cidade e para o sitemap.
 */
export interface Cidade {
  slug: string;
  nome: string;
  uf: "SC" | "PR";
  regiao: string;
  distanciaKm: number;
  bairros: string[];
  destaque: string;
}

export const CIDADES: Cidade[] = [
  {
    slug: "sao-bento-do-sul",
    nome: "São Bento do Sul",
    uf: "SC",
    regiao: "Planalto Norte",
    distanciaKm: 0,
    bairros: ["Centro", "Cruzeiro", "Colonial", "Rio Vermelho", "Serra Alta", "Oxford"],
    destaque: "Nossa loja física fica na Av. São Bento, 1330 — Sala 8. Retirada no mesmo dia.",
  },
  {
    slug: "rio-negrinho",
    nome: "Rio Negrinho",
    uf: "SC",
    regiao: "Planalto Norte",
    distanciaKm: 15,
    bairros: ["Centro", "Vila Nova", "Bela Vista", "Jardim Hantschel"],
    destaque: "Entrega em Rio Negrinho no mesmo dia para pedidos até 15h.",
  },
  {
    slug: "mafra",
    nome: "Mafra",
    uf: "SC",
    regiao: "Planalto Norte",
    distanciaKm: 40,
    bairros: ["Centro", "Vila Nova", "Faxinal", "Alto de Mafra"],
    destaque: "Entrega para Mafra em até 24h. Pagamento na entrega disponível.",
  },
  {
    slug: "campo-alegre",
    nome: "Campo Alegre",
    uf: "SC",
    regiao: "Planalto Norte",
    distanciaKm: 25,
    bairros: ["Centro", "Bateias de Baixo", "Rio dos Bugres"],
    destaque: "Combine pelo WhatsApp: envio expresso para Campo Alegre.",
  },
  {
    slug: "canoinhas",
    nome: "Canoinhas",
    uf: "SC",
    regiao: "Planalto Norte",
    distanciaKm: 65,
    bairros: ["Centro", "Água Verde", "Alto das Palmeiras"],
    destaque: "Frete rápido para Canoinhas. Consulte modelos em estoque.",
  },
  {
    slug: "tres-barras",
    nome: "Três Barras",
    uf: "SC",
    regiao: "Planalto Norte",
    distanciaKm: 70,
    bairros: ["Centro", "São Cristóvão", "São Sebastião"],
    destaque: "Entrega combinada para Três Barras via WhatsApp.",
  },
  {
    slug: "itaiopolis",
    nome: "Itaiópolis",
    uf: "SC",
    regiao: "Planalto Norte",
    distanciaKm: 55,
    bairros: ["Centro", "Rio Preto", "Alto Paraguaçu"],
    destaque: "Envio para Itaiópolis via transportadora ou combinado.",
  },
];

export function findCidade(slug: string): Cidade | undefined {
  return CIDADES.find((c) => c.slug === slug);
}
