import { Link, useNavigate } from "@tanstack/react-router";
import { CreditCard, Instagram, Truck, LayoutDashboard, Package, Tag, ClipboardList, LogOut, Star, MessageSquare, Recycle, Menu, X, Settings, Search } from "lucide-react";
import { type ReactNode, useState, useRef } from "react";
import { assets, categorias, WhatsAppIcon } from "@/lib/site";
import { useSiteSettings } from "@/hooks/use-site-content";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppFloat } from "@/components/whatsapp-float";

function AdminBar() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  const items = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true as const },
    { to: "/admin/produtos", label: "Editar produtos", icon: Package },
    { to: "/admin/destaques", label: "Destaques", icon: Star },
    { to: "/admin/categorias", label: "Categorias", icon: Tag },
    { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
    { to: "/admin/leads", label: "Leads", icon: Recycle },
    { to: "/admin/avaliacoes", label: "Avaliações", icon: MessageSquare },
    { to: "/admin/configuracoes", label: "Config.", icon: Settings },
  ];
  return (
    <div className="bg-foreground text-background text-xs md:text-sm border-b border-background/10">
      <div className="container mx-auto px-4 py-2 flex flex-wrap items-center gap-3">
        <span className="font-semibold uppercase tracking-wider text-[10px] md:text-xs opacity-70">Modo admin</span>
        <nav className="flex flex-wrap items-center gap-1 md:gap-2">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={it.exact ? { exact: true } : undefined}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-background/10 transition"
            >
              <it.icon className="h-3.5 w-3.5" />
              {it.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => supabase.auth.signOut()}
          className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-background/10 transition"
        >
          <LogOut className="h-3.5 w-3.5" /> Sair
        </button>
      </div>
    </div>
  );
}


const NAV = [
  { to: "/", label: "Home" },
  { to: "/loja", label: "Loja" },
  { to: "/servicos", label: "Serviços" },
  { to: "/comparar", label: "Comparar" },
  { to: "/trade-in", label: "Trade-in" },
  { to: "/ofertas", label: "Ofertas" },
  { to: "/avaliacoes", label: "Avaliações" },
  { to: "/faq", label: "FAQ" },
  { to: "/contato", label: "Contato" },
] as const;

function TopBar() {
  const { get } = useSiteSettings();
  const wa = get("contact.whatsapp_url");
  return (
    <div className="bg-primary text-primary-foreground text-xs md:text-sm">
      <div className="container mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2"><Truck className="h-4 w-4" /> {get("topbar.shipping")}</span>
        <span className="hidden md:flex items-center gap-2"><CreditCard className="h-4 w-4" /> {get("topbar.payment")}</span>
        <a href={wa} className="flex items-center gap-2 font-medium hover:underline">
          <WhatsAppIcon className="h-4 w-4" /> {get("contact.phone_display")}
        </a>
      </div>
    </div>
  );
}

function Header() {
  const { get } = useSiteSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate({
      to: "/loja",
      search: { q, tab: "product", cat: "null", cap: [], cor: [], cond: [], min: 0, max: 0, page: 1 },
    });
    handleSearchClose();
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center shrink-0" onClick={() => setMobileOpen(false)}>
          <img src={assets.logoDark} alt="Glass Phone SBS" className="h-10 md:h-12 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex flex-1 items-center gap-5 text-sm font-medium">
          {NAV.map(n => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
              activeProps={{ className: "text-primary" }} className="hover:text-primary transition">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Busca global */}
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && handleSearchClose()}
                placeholder="Buscar produtos..."
                className="border border-border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary w-40 sm:w-56"
                aria-label="Buscar produtos"
              />
              <button
                type="submit"
                className="p-2 rounded-md hover:bg-muted transition"
                aria-label="Buscar"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleSearchClose}
                className="p-2 rounded-md hover:bg-muted transition"
                aria-label="Fechar busca"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={handleSearchOpen}
              className="p-2 rounded-md hover:bg-muted transition"
              aria-label="Abrir busca"
            >
              <Search className="h-5 w-5" />
            </button>
          )}
          <a href={get("contact.whatsapp_url")}
            className="hidden sm:inline-flex items-center gap-2 bg-whatsapp text-whatsapp-foreground px-4 py-2 rounded-full font-semibold text-sm hover:opacity-90 transition">
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
          {/* Hambúrguer */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-muted transition"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-border bg-background/98 backdrop-blur shadow-lg">
          <div className="container mx-auto px-4 py-2 flex flex-col">
            {NAV.map(n => (
              <Link key={n.to} to={n.to}
                onClick={() => setMobileOpen(false)}
                activeOptions={{ exact: true }}
                activeProps={{ className: "text-primary bg-primary/5" }}
                className="flex items-center px-2 py-3 text-sm font-medium rounded-md hover:bg-muted transition border-b border-border/40 last:border-0">
                {n.label}
              </Link>
            ))}
            <a href={get("contact.whatsapp_url")}
              onClick={() => setMobileOpen(false)}
              className="mt-3 mb-2 flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground px-4 py-3 rounded-full font-semibold text-sm hover:opacity-90 transition">
              <WhatsAppIcon className="h-4 w-4" /> Falar no WhatsApp
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { get } = useSiteSettings();
  const insta = get("contact.instagram");
  const instaHandle = insta.replace(/\/$/, "").split("/").pop() || "instagram";
  return (
    <footer className="bg-foreground text-background/90 pt-12 pb-6 mt-16">
      <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
        <div>
          <img src={assets.logoFlat} alt="Glass Phone SBS" className="h-14 w-auto mb-3" />
          <p className="text-sm text-background/60 mb-3">
            {get("footer.tagline")}
          </p>
          <a href={insta} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm hover:text-primary">
            <Instagram className="h-4 w-4" /> @{instaHandle}
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
            <li>{get("contact.address_line1")}</li>
            <li>{get("contact.address_line2")}</li>
            <li>{get("contact.phone_display")}</li>
            <li>{get("contact.hours")}</li>
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


export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminBar />
      <TopBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

