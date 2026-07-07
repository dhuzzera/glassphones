import { Link } from "@tanstack/react-router";
import { CreditCard, Instagram, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { assets, categorias, WhatsAppIcon } from "@/lib/site";
import { useSiteSettings } from "@/hooks/use-site-content";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/servicos", label: "Serviços" },
  { to: "/ofertas", label: "Ofertas" },
  { to: "/orcamento", label: "Orçamento" },
  { to: "/faq", label: "FAQ" },
  { to: "/contato", label: "Contato" },
] as const;

function TopBar() {
  return (
    <div className="bg-primary text-primary-foreground text-xs md:text-sm">
      <div className="container mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2"><Truck className="h-4 w-4" /> Entrega para todo o Brasil</span>
        <span className="hidden md:flex items-center gap-2"><CreditCard className="h-4 w-4" /> Até 12x sem juros no cartão</span>
        <a href={waLink("Olá! Quero falar com um vendedor.")} className="flex items-center gap-2 font-medium hover:underline">
          <WhatsAppIcon className="h-4 w-4" /> {PHONE_DISPLAY}
        </a>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center gap-6">
        <Link to="/" className="flex items-center shrink-0">
          <img src={assets.logoDark} alt="Glass Phone SBS" className="h-12 md:h-14 w-auto" />
        </Link>

        <nav className="hidden lg:flex flex-1 items-center gap-5 text-sm font-medium">
          {NAV.map(n => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-primary" }}
              className="hover:text-primary transition"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <a
          href={waLink("Olá! Vim pelo site e quero conversar.")}
          className="ml-auto hidden sm:inline-flex items-center gap-2 bg-whatsapp text-whatsapp-foreground px-4 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition"
        >
          <WhatsAppIcon className="h-4 w-4" /> WhatsApp
        </a>
      </div>
      {/* Mobile nav */}
      <nav className="lg:hidden border-t border-border overflow-x-auto">
        <div className="container mx-auto px-4 py-2 flex gap-4 text-sm font-medium whitespace-nowrap">
          {NAV.map(n => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-primary" }}
              className="hover:text-primary transition py-1"
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-foreground text-background/90 pt-12 pb-6 mt-16">
      <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
        <div>
          <img src={assets.logoFlat} alt="Glass Phone SBS" className="h-14 w-auto mb-3" />
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
            {categorias.map(c => <li key={c.nome}><Link to="/ofertas" className="hover:text-primary">{c.nome}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Navegação</h4>
          <ul className="space-y-2 text-sm text-background/70">
            {NAV.filter(n => n.to !== "/").map(n => (
              <li key={n.to}><Link to={n.to} className="hover:text-primary">{n.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contato</h4>
          <ul className="space-y-2 text-sm text-background/70">
            <li>Av. São Bento, 1330 — Sala 8</li>
            <li>São Bento do Sul/SC · 89281-100</li>
            <li>{PHONE_DISPLAY}</li>
            <li>Seg-Sáb 9h às 19h</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-10 pt-6 border-t border-background/10 text-xs text-background/50 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
        <span>© {new Date().getFullYear()} Glass Phone SBS. Todos os direitos reservados.</span>
        <Link to="/auth" className="hover:text-primary transition-colors">Admin</Link>
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

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
