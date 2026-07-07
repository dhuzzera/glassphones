import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronDown, ChevronRight, Clock, CreditCard, MapPin, Phone, Send, ShieldCheck, Smartphone, Star, Truck } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";
import { brl, categorias, faqs, defeitos, heroSlides, logo, modelosPop, PHONE_DISPLAY, produtos, servicos, waLink, WhatsAppIcon, WHATSAPP_NUM, type Produto } from "@/lib/site";
import { slugify } from "@/lib/marketplace";
import { useFaqItems, useSiteSettings } from "@/hooks/use-site-content";
import { trackServiceDetail, trackWhatsApp } from "@/lib/analytics";

export function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="container mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-8 items-center">
        <div className="text-white">
          <span className="inline-block bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold mb-4">🔥 MEGA OFERTAS DA SEMANA</span>
          <h1 className="text-4xl md:text-6xl font-black leading-[1.05] mb-4">Os melhores <br />celulares, os<br /> melhores preços.</h1>
          <p className="text-white/90 text-lg mb-6 max-w-md">iPhone, Samsung, Xiaomi e Motorola com garantia, parcelamento em até 12x e atendimento humano pelo WhatsApp.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/ofertas" className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-full font-bold hover:scale-105 transition">
              Ver ofertas <Smartphone className="h-4 w-4" />
            </Link>
            <a href={waLink("Olá! Quero uma indicação de celular.")} className="inline-flex items-center gap-2 bg-whatsapp text-whatsapp-foreground px-6 py-3 rounded-full font-bold hover:opacity-90 transition">
              <WhatsAppIcon className="h-4 w-4" /> Falar no WhatsApp
            </a>
          </div>
          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-3">
              {[
                { i: "JS", from: "#0D6EFD", to: "#1B3CFF" },
                { i: "MR", from: "#1B3CFF", to: "#0A2E8A" },
                { i: "AL", from: "#4C8DFF", to: "#0D6EFD" },
                { i: "PC", from: "#0A2E8A", to: "#1B3CFF" },
              ].map((a) => (
                <div key={a.i} className="h-9 w-9 rounded-full border-2 border-background grid place-items-center text-[10px] font-bold text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}>{a.i}</div>
              ))}
              <div className="h-9 w-9 rounded-full border-2 border-background bg-primary/20 backdrop-blur grid place-items-center text-[10px] font-bold text-primary">+5k</div>
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                <span className="text-white font-bold text-sm ml-1">4.9</span>
              </div>
              <div className="text-white/70 text-xs mt-0.5"><span className="font-semibold text-white/90">+5.000 clientes</span> satisfeitos</div>
            </div>
          </div>
        </div>
        <HeroCarousel />
      </div>
    </section>
  );
}

function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [Autoplay({ delay: 4500, stopOnInteraction: false })]);
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-3xl border border-primary/30" style={{ boxShadow: "var(--shadow-glow)" }} ref={emblaRef}>
        <div className="flex">
          {heroSlides.map((s, i) => (
            <div key={i} className="relative flex-[0_0_100%] aspect-[16/10]">
              <img src={s.img} alt={s.title} width={1600} height={1024} loading={i === 0 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-background/85 via-background/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8 gap-1.5">
                <span className="inline-block w-fit text-[10px] md:text-xs font-bold tracking-widest uppercase text-primary bg-primary/10 backdrop-blur border border-primary/40 px-2.5 py-1 rounded-full">{s.tag}</span>
                <div className="text-white font-black text-2xl md:text-4xl leading-tight uppercase">{s.title}</div>
                <div className="text-white/85 text-sm md:text-base">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button aria-label="Anterior" onClick={scrollPrev} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/70 backdrop-blur border border-primary/40 text-white grid place-items-center hover:bg-primary hover:border-primary transition"><ChevronLeft className="h-5 w-5" /></button>
      <button aria-label="Próximo" onClick={scrollNext} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/70 backdrop-blur border border-primary/40 text-white grid place-items-center hover:bg-primary hover:border-primary transition"><ChevronRight className="h-5 w-5" /></button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {heroSlides.map((_, i) => (
          <button key={i} aria-label={`Ir para slide ${i + 1}`} onClick={() => emblaApi?.scrollTo(i)} className={`h-1.5 rounded-full transition-all ${selected === i ? "w-8 bg-primary" : "w-2 bg-white/40 hover:bg-white/70"}`} />
        ))}
      </div>
    </div>
  );
}

export function Benefits() {
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
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><Icon className="h-5 w-5" /></div>
            <div><div className="font-semibold text-sm">{t}</div><div className="text-xs text-muted-foreground">{d}</div></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Categorias() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Navegue por categoria</h2>
        <p className="text-muted-foreground mb-8">Escolha sua marca favorita</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categorias.map(c => (
            <Link key={c.nome} to="/ofertas" className="group flex flex-col items-center gap-2 p-5 rounded-2xl bg-card border border-border hover:border-primary hover:-translate-y-1 transition" style={{ boxShadow: "var(--shadow-product)" }}>
              {c.icon ? <c.icon className="h-10 w-10 text-primary group-hover:scale-110 transition" strokeWidth={1.75} /> : <img src={logo(c.slug!, c.cor)} alt={`Logo ${c.nome}`} width={40} height={40} loading="lazy" className="h-10 w-10 object-contain group-hover:scale-110 transition" />}
              <span className="text-sm font-semibold">{c.nome}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProdutoCard(p: Produto) {
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
    <div className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary hover:-translate-y-1 transition flex flex-col" style={{ boxShadow: "var(--shadow-product)" }}>
      <div className="relative aspect-square bg-gradient-to-br from-muted to-secondary grid place-items-center">
        {p.promo && <span className="absolute top-3 left-3 bg-badge-promo text-white text-xs font-bold px-2.5 py-1 rounded-full">-{desconto}%</span>}
        {m ? <img src={logo(m.slug, m.cor)} alt={`Logo ${p.marca}`} width={120} height={120} loading="lazy" className="h-24 w-24 object-contain opacity-90 group-hover:scale-110 transition" /> : <Smartphone className="h-20 w-20 text-muted-foreground/40" strokeWidth={1} />}
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
        <a href={waLink(`Olá! Tenho interesse no ${p.nome} (${p.cor}) por ${brl(p.preco)}. Está disponível?`)} className="mt-auto inline-flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition">
          <WhatsAppIcon className="h-4 w-4" /> Comprar
        </a>
      </div>
    </div>
  );
}

export function Vitrine({ title = "Ofertas em destaque", limit }: { title?: string; limit?: number }) {
  const list = limit ? produtos.slice(0, limit) : produtos;
  return (
    <section className="py-12 md:py-16 bg-secondary/40">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
            <p className="text-muted-foreground">Aproveite os preços da semana</p>
          </div>
          {limit && <Link to="/ofertas" className="hidden sm:inline text-sm font-semibold text-primary hover:underline">Ver todas →</Link>}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {list.map(p => <ProdutoCard key={p.nome} {...p} />)}
        </div>
      </div>
    </section>
  );
}

export function ServicosGrid() {
  return (
    <section className="py-16 md:py-20 bg-secondary/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-primary font-semibold text-sm tracking-widest">SERVIÇOS</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Assistência técnica especializada</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Reparos com garantia real, peças de qualidade e prazo que cabe no seu dia.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {servicos.map(s => (
            <div key={s.nome} className="group bg-card rounded-2xl p-6 border border-border hover:border-primary hover:-translate-y-1 transition flex flex-col" style={{ boxShadow: "var(--shadow-product)" }}>
              <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary grid place-items-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition"><s.icon className="h-6 w-6" /></div>
              <h3 className="font-bold text-lg mb-1">{s.nome}</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1">{s.desc}</p>
              <div className="flex items-end justify-between gap-3 mt-auto">
                <div><div className="text-xs text-muted-foreground">a partir de</div><div className="text-price font-black text-2xl leading-tight">{brl(s.preco)}</div></div>
                <Link to="/servicos/$slug" params={{ slug: s.slug }} onClick={() => trackServiceDetail(s.slug, s.nome)} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">Ver detalhes <Send className="h-3.5 w-3.5" /></Link>
              </div>
              <a href={`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(`Olá, Glass Phone! Quero um orçamento para: ${s.nome} (a partir de ${brl(s.preco)}).`)}`} target="_blank" rel="noopener" onClick={() => trackWhatsApp("servicos_grid_card", { slug: s.slug, nome: s.nome, preco: s.preco })} className="mt-3 inline-flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground px-3 py-2 rounded-full text-sm font-bold hover:opacity-90 transition"><WhatsAppIcon className="h-3.5 w-3.5" /> Orçamento no WhatsApp</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OrcamentoForm() {
  const [modelo, setModelo] = useState("");
  const [defeito, setDefeito] = useState("");
  const [obs, setObs] = useState("");
  const canSend = modelo.trim().length > 0 && defeito.length > 0;
  const enviar = () => {
    if (!canSend) return;
    const msg = [
      "Olá, Glass Phone! Gostaria de um orçamento:",
      `• Modelo: ${modelo.trim().slice(0, 80)}`,
      `• Defeito: ${defeito}`,
      obs.trim() ? `• Observações: ${obs.trim().slice(0, 300)}` : null,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="text-primary font-semibold text-sm tracking-widest">ORÇAMENTO RÁPIDO</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">Receba seu orçamento em minutos</h2>
          <p className="text-muted-foreground mb-6">Informe o modelo do aparelho e o defeito. Enviamos o valor pelo WhatsApp com prazo real de reparo.</p>
          <ul className="space-y-3 text-sm">
            {["Orçamento gratuito e sem compromisso","Resposta em até 15 minutos no horário comercial","90 dias de garantia sobre o reparo"].map(x => (
              <li key={x} className="flex items-start gap-2"><ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" /> {x}</li>
            ))}
          </ul>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); enviar(); }} className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-4" style={{ boxShadow: "var(--shadow-glow)" }}>
          <div>
            <label htmlFor="modelo" className="text-sm font-semibold block mb-1.5">Modelo do aparelho</label>
            <input id="modelo" list="modelos-list" value={modelo} onChange={(e) => setModelo(e.target.value)} maxLength={80} required placeholder="Ex: iPhone 13 Pro Max" className="w-full px-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary outline-none transition" />
            <datalist id="modelos-list">{modelosPop.map(m => <option key={m} value={m} />)}</datalist>
          </div>
          <div>
            <label htmlFor="defeito" className="text-sm font-semibold block mb-1.5">Defeito</label>
            <select id="defeito" value={defeito} onChange={(e) => setDefeito(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary outline-none transition">
              <option value="">Selecione o defeito…</option>
              {defeitos.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="obs" className="text-sm font-semibold block mb-1.5">Observações (opcional)</label>
            <textarea id="obs" value={obs} onChange={(e) => setObs(e.target.value)} maxLength={300} rows={3} placeholder="Detalhes do problema, urgência, etc." className="w-full px-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary outline-none transition resize-none" />
            <div className="text-xs text-muted-foreground text-right mt-1">{obs.length}/300</div>
          </div>
          <button type="submit" disabled={!canSend} className="w-full inline-flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground px-6 py-3.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="h-4 w-4" /> Enviar pelo WhatsApp
          </button>
        </form>
      </div>
    </section>
  );
}

export function FAQList() {
  const [open, setOpen] = useState<number | null>(0);
  const { data: dbFaqs } = useFaqItems();
  const items = (dbFaqs && dbFaqs.length > 0)
    ? dbFaqs.filter(f => f.active).map(f => ({ q: f.question, a: f.answer }))
    : faqs;
  return (
    <section className="py-16 md:py-20 bg-secondary/40">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <span className="text-primary font-semibold text-sm tracking-widest">DÚVIDAS FREQUENTES</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Perguntas mais comuns</h2>
        </div>
        <div className="space-y-3">
          {items.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="w-full flex items-center justify-between gap-4 text-left p-5 hover:bg-muted/40 transition">
                  <span className="font-semibold">{f.q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-primary transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ContatoCard() {
  const { get } = useSiteSettings();
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="text-primary font-semibold text-sm">FALE COM A GENTE</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">Visite nossa loja em São Bento do Sul</h2>
          <p className="text-muted-foreground mb-6">Atendimento consultivo, sem enrolação. Traga seu aparelho ou fale com a gente pelo WhatsApp.</p>
          <a href={get("contact.whatsapp_url")} className="inline-flex items-center gap-2 bg-whatsapp text-whatsapp-foreground px-6 py-3 rounded-full font-bold hover:opacity-90">
            <WhatsAppIcon className="h-4 w-4" /> Falar no WhatsApp
          </a>
        </div>
        <div className="rounded-3xl p-8 text-white" style={{ background: "var(--gradient-hero)" }}>
          <h3 className="text-2xl font-bold mb-4">Onde estamos</h3>
          <ul className="space-y-3 text-white/90">
            <li className="flex items-start gap-3"><MapPin className="h-5 w-5 shrink-0 mt-0.5" /> {get("contact.address_line1")}, {get("contact.address_line2")}</li>
            <li className="flex items-start gap-3"><Clock className="h-5 w-5 shrink-0 mt-0.5" /> {get("contact.hours")}</li>
            <li className="flex items-start gap-3"><Phone className="h-5 w-5 shrink-0 mt-0.5" /> {get("contact.phone_display")}</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8">
        <div className="rounded-3xl overflow-hidden border border-border">
          <iframe
            title="Mapa Glass Phone SBS"
            src="https://www.google.com/maps?q=Avenida+S%C3%A3o+Bento+1330+S%C3%A3o+Bento+do+Sul&output=embed"
            className="w-full h-[360px] block"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}


