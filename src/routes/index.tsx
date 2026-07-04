import { createFileRoute } from "@tanstack/react-router";
import { Smartphone, ShieldCheck, Truck, CreditCard, Star, Search, MapPin, Clock, Phone, Instagram, Headphones, RefreshCw, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.695.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.14 1.593 5.945L0 24l6.335-1.652a12.062 12.062 0 005.71 1.447h.006c6.582 0 11.941-5.335 11.944-11.892 0-3.176-1.24-6.165-3.495-8.413zm-8.475 18.297h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.98.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.886-9.886 9.886z"/>
    </svg>
  );
}
import hero1 from "@/assets/hero1.jpg.asset.json";
import hero2 from "@/assets/hero2.jpg.asset.json";
import hero3 from "@/assets/hero3.jpg.asset.json";
import logoDark from "@/assets/glassphone-logo-dark.png.asset.json";
import logoFlat from "@/assets/glassphone-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glass Phone SBS — Smartphones, Acessórios e Assistência" },
      { name: "description", content: "Glass Phone SBS: loja de celulares com iPhone, Samsung, Xiaomi e Motorola. Melhores preços e atendimento pelo WhatsApp." },
      { property: "og:title", content: "Glass Phone SBS" },
      { property: "og:description", content: "Vitrine de smartphones novos e seminovos com atendimento pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const WHATSAPP_URL = "https://api.whatsapp.com/message/L6DTBZKAUP67J1?autoload=1&app_absent=0";
const INSTAGRAM = "https://www.instagram.com/glass_phonesbs/";
// Link curto do WhatsApp já traz mensagem padrão configurada pela loja.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const waLink = (_msg: string) => WHATSAPP_URL;

// Logos de marca via Simple Icons CDN (SVGs CC0). Uso nominativo — a loja
// vende esses produtos oficialmente, então exibir a logo original é adequado.
const logo = (slug: string, color?: string) =>
  `https://cdn.simpleicons.org/${slug}${color ? `/${color}` : ""}`;

type Categoria = { nome: string; slug?: string; cor?: string; icon?: LucideIcon };
const categorias: Categoria[] = [
  { nome: "iPhone", slug: "apple", cor: "FFFFFF" },
  { nome: "Samsung", slug: "samsung", cor: "FFFFFF" },
  { nome: "Xiaomi", slug: "xiaomi", cor: "FFFFFF" },
  { nome: "Motorola", slug: "motorola", cor: "FFFFFF" },
  { nome: "Acessórios", icon: Headphones },
  { nome: "Seminovos", icon: RefreshCw },
];

const produtos = [
  { nome: "iPhone 15 Pro Max 256GB", marca: "Apple", preco: 8499, antigo: 9999, promo: true, cor: "Titânio Natural" },
  { nome: "iPhone 14 128GB", marca: "Apple", preco: 4899, antigo: 5799, promo: true, cor: "Meia-noite" },
  { nome: "Galaxy S24 Ultra 512GB", marca: "Samsung", preco: 7299, antigo: 8499, promo: true, cor: "Titânio Cinza" },
  { nome: "Galaxy A55 5G 256GB", marca: "Samsung", preco: 2399, antigo: 2799, promo: false, cor: "Azul" },
  { nome: "Xiaomi 14 Ultra 512GB", marca: "Xiaomi", preco: 6499, antigo: 7499, promo: true, cor: "Preto" },
  { nome: "Redmi Note 13 Pro 256GB", marca: "Xiaomi", preco: 1899, antigo: 2299, promo: false, cor: "Verde" },
  { nome: "Motorola Edge 50 Ultra", marca: "Motorola", preco: 3799, antigo: 4299, promo: false, cor: "Madeira" },
  { nome: "iPhone 13 128GB Seminovo", marca: "Apple", preco: 3299, antigo: 3899, promo: true, cor: "Estelar" },
];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <Hero />
      <Benefits />
      <Categorias />
      <Vitrine />
      <SobreCTA />
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

function TopBar() {
  return (
    <div className="bg-primary text-primary-foreground text-xs md:text-sm">
      <div className="container mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2"><Truck className="h-4 w-4" /> Entrega para todo o Brasil</span>
        <span className="hidden md:flex items-center gap-2"><CreditCard className="h-4 w-4" /> Até 12x sem juros no cartão</span>
        <a href={waLink("Olá! Quero falar com um vendedor.")} className="flex items-center gap-2 font-medium hover:underline">
          <WhatsAppIcon className="h-4 w-4" /> (47) 9680-1247
        </a>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center gap-6">
        <a href="#" className="flex items-center shrink-0">
          <img src={logoDark.url} alt="Glass Phone SBS" className="h-12 md:h-14 w-auto" />
        </a>



        <div className="hidden md:flex flex-1 max-w-xl relative">
          <input
            type="search"
            placeholder="Buscar iPhone, Samsung, Xiaomi..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-muted border border-transparent focus:border-primary focus:bg-card outline-none transition"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
          <a href="#vitrine" className="hover:text-primary">Ofertas</a>
          <a href="#categorias" className="hover:text-primary">Categorias</a>
          <a href="#sobre" className="hover:text-primary">Sobre</a>
        </nav>

        <a
          href={waLink("Olá! Vim pelo site e quero conversar.")}
          className="hidden sm:inline-flex items-center gap-2 bg-whatsapp text-whatsapp-foreground px-4 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition"
        >
          <WhatsAppIcon className="h-4 w-4" /> WhatsApp
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="container mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-8 items-center">
        <div className="text-white">
          <span className="inline-block bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold mb-4">
            🔥 MEGA OFERTAS DA SEMANA
          </span>
          <h1 className="text-4xl md:text-6xl font-black leading-[1.05] mb-4">
            Os melhores <br />celulares, os<br /> melhores preços.
          </h1>
          <p className="text-white/90 text-lg mb-6 max-w-md">
            iPhone, Samsung, Xiaomi e Motorola com garantia, parcelamento em até 12x e atendimento humano pelo WhatsApp.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#vitrine"
              className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-full font-bold hover:scale-105 transition"
            >
              Ver ofertas <Smartphone className="h-4 w-4" />
            </a>
            <a
              href={waLink("Olá! Quero uma indicação de celular.")}
              className="inline-flex items-center gap-2 bg-whatsapp text-whatsapp-foreground px-6 py-3 rounded-full font-bold hover:opacity-90 transition"
            >
              <WhatsAppIcon className="h-4 w-4" /> Falar no WhatsApp
            </a>
          </div>
          <div className="flex items-center gap-4 mt-8 text-sm">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-accent to-primary" />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-yellow-300 text-yellow-300" />)}
              </div>
              <div className="text-white/80 text-xs">+5.000 clientes satisfeitos</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <img
            src={heroImg}
            alt="Smartphones em destaque"
            width={1600}
            height={1024}
            className="rounded-3xl w-full h-auto"
            style={{ boxShadow: "var(--shadow-glow)" }}
          />
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    { icon: ShieldCheck, t: "Garantia oficial", d: "Produtos originais lacrados" },
    { icon: Truck, t: "Frete pra todo Brasil", d: "Enviamos no mesmo dia" },
    { icon: CreditCard, t: "12x sem juros", d: "Cartão, Pix ou boleto" },
    { icon: WhatsAppIcon, t: "Atendimento humano", d: "Tire dúvidas no WhatsApp" },
  ];
  return (
    <section className="border-b border-border">
      <div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">{t}</div>
              <div className="text-xs text-muted-foreground">{d}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Categorias() {
  return (
    <section id="categorias" className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Navegue por categoria</h2>
        <p className="text-muted-foreground mb-8">Escolha sua marca favorita</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categorias.map(c => (
            <a
              key={c.nome}
              href={waLink(`Quero ver opções de ${c.nome}.`)}
              className="group flex flex-col items-center gap-2 p-5 rounded-2xl bg-card border border-border hover:border-primary hover:-translate-y-1 transition"
              style={{ boxShadow: "var(--shadow-product)" }}
            >
              {c.icon ? (
                <c.icon className="h-10 w-10 text-primary group-hover:scale-110 transition" strokeWidth={1.75} />
              ) : (
                <img
                  src={logo(c.slug!, c.cor)}
                  alt={`Logo ${c.nome}`}
                  width={40}
                  height={40}
                  loading="lazy"
                  className="h-10 w-10 object-contain group-hover:scale-110 transition"
                />
              )}

              <span className="text-sm font-semibold">{c.nome}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Vitrine() {
  return (
    <section id="vitrine" className="py-12 md:py-16 bg-secondary/40">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Ofertas em destaque</h2>
            <p className="text-muted-foreground">Aproveite os preços da semana</p>
          </div>
          <a href={waLink("Quero ver o catálogo completo.")} className="hidden sm:inline text-sm font-semibold text-primary hover:underline">
            Ver catálogo completo →
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {produtos.map(p => <ProdutoCard key={p.nome} {...p} />)}
        </div>
      </div>
    </section>
  );
}

type Produto = typeof produtos[number];

function ProdutoCard(p: Produto) {
  const desconto = p.promo ? Math.round((1 - p.preco / p.antigo) * 100) : 0;
  const pix = p.preco * 0.9;
  const marcaSlug: Record<string, { slug: string; cor: string }> = {
    Apple: { slug: "apple", cor: "FFFFFF" },
    Samsung: { slug: "samsung", cor: "FFFFFF" },
    Xiaomi: { slug: "xiaomi", cor: "FFFFFF" },
    Motorola: { slug: "motorola", cor: "FFFFFF" },
  };
  const m = marcaSlug[p.marca];
  return (
    <div
      className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary hover:-translate-y-1 transition flex flex-col"
      style={{ boxShadow: "var(--shadow-product)" }}
    >
      <div className="relative aspect-square bg-gradient-to-br from-muted to-secondary grid place-items-center">
        {p.promo && (
          <span className="absolute top-3 left-3 bg-badge-promo text-white text-xs font-bold px-2.5 py-1 rounded-full">
            -{desconto}%
          </span>
        )}
        {m ? (
          <img
            src={logo(m.slug, m.cor)}
            alt={`Logo ${p.marca}`}
            width={120}
            height={120}
            loading="lazy"
            className="h-24 w-24 object-contain opacity-90 group-hover:scale-110 transition"
          />
        ) : (
          <Smartphone className="h-20 w-20 text-muted-foreground/40" strokeWidth={1} />
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <span className="text-xs text-muted-foreground font-medium">{p.marca} · {p.cor}</span>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{p.nome}</h3>
        <div className="mt-1">
          {p.promo && <div className="text-xs text-muted-foreground line-through">{brl(p.antigo)}</div>}
          <div className="text-price font-black text-xl leading-tight">{brl(p.preco)}</div>
          <div className="text-xs text-whatsapp font-semibold">ou {brl(pix)} no Pix</div>
          <div className="text-xs text-muted-foreground">12x de {brl(p.preco / 12)} sem juros</div>
        </div>
        <a
          href={waLink(`Olá! Tenho interesse no ${p.nome} (${p.cor}) por ${brl(p.preco)}. Está disponível?`)}
          className="mt-auto inline-flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition"
        >
          <WhatsAppIcon className="h-4 w-4" /> Comprar
        </a>
      </div>
    </div>
  );
}

function SobreCTA() {
  return (
    <section id="sobre" className="py-16 md:py-20">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="text-primary font-semibold text-sm">SOBRE A LOJA</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Mais de 10 anos vendendo confiança.
          </h2>
          <p className="text-muted-foreground mb-6">
            Somos referência em celulares novos e seminovos, com garantia real e atendimento consultivo. Nosso time te ajuda a escolher o aparelho ideal pelo WhatsApp, sem enrolação.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[{n:"+10k",l:"clientes"},{n:"4.9★",l:"avaliação"},{n:"12x",l:"sem juros"}].map(s=>(
              <div key={s.l} className="p-4 rounded-xl bg-secondary text-center">
                <div className="text-2xl font-black text-primary">{s.n}</div>
                <div className="text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
          <a
            href={waLink("Olá! Quero conhecer melhor a loja.")}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:opacity-90"
          >
            <WhatsAppIcon className="h-4 w-4" /> Fale com um consultor
          </a>
        </div>

        <div className="rounded-3xl p-8 text-white" style={{ background: "var(--gradient-hero)" }}>
          <h3 className="text-2xl font-bold mb-4">Visite nossa loja</h3>
          <ul className="space-y-3 text-white/90">
            <li className="flex items-start gap-3"><MapPin className="h-5 w-5 shrink-0 mt-0.5" /> Av. Principal, 1234 — Centro, São Paulo/SP</li>
            <li className="flex items-start gap-3"><Clock className="h-5 w-5 shrink-0 mt-0.5" /> Seg a Sáb — 9h às 19h</li>
            <li className="flex items-start gap-3"><Phone className="h-5 w-5 shrink-0 mt-0.5" /> (47) 9680-1247</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-foreground text-background/90 pt-12 pb-6">
      <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
        <div>
          <img src={logoFlat.url} alt="Glass Phone SBS" className="h-14 w-auto mb-3" />

          <p className="text-sm text-background/60 mb-3">
            Smartphones, acessórios e assistência com atendimento humano.
          </p>
          <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm hover:text-primary">
            <Instagram className="h-4 w-4" /> @glass_phonesbs
          </a>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Categorias</h4>
          <ul className="space-y-2 text-sm text-background/70">
            {categorias.map(c => <li key={c.nome}><a href="#categorias" className="hover:text-primary">{c.nome}</a></li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Institucional</h4>
          <ul className="space-y-2 text-sm text-background/70">
            <li><a href="#sobre" className="hover:text-primary">Sobre nós</a></li>
            <li><a href="#vitrine" className="hover:text-primary">Ofertas</a></li>
            <li><a href={waLink("Quero tirar uma dúvida")} className="hover:text-primary">Atendimento</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contato</h4>
          <ul className="space-y-2 text-sm text-background/70">
            <li>(47) 9680-1247</li>
            <li>contato@glassphonesbs.com.br</li>
            <li>Seg-Sáb 9h às 19h</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-10 pt-6 border-t border-background/10 text-xs text-background/50 text-center">
        © {new Date().getFullYear()} Glass Phone SBS. Todos os direitos reservados.
      </div>
    </footer>
  );
}

function WhatsAppFloat() {
  return (
    <a
      href={waLink("Olá! Vim pelo site.")}
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-whatsapp text-whatsapp-foreground grid place-items-center shadow-lg hover:scale-110 transition animate-pulse"
      style={{ boxShadow: "0 10px 30px -5px oklch(0.7 0.17 150 / 0.6)" }}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
