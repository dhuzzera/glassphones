import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  useEffect(() => {
    document.title = "Página não encontrada (404) — Glass Phone SBS";
    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("robots", "noindex, follow");
    setMeta("description", "A página que você procura não existe. Confira nossos serviços ou peça um orçamento pelo WhatsApp.");
    setMeta("og:title", "Página não encontrada — Glass Phone SBS", "property");
    setMeta("og:description", "A página que você procura não existe.", "property");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida. Que tal continuar por aqui?
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para a home
          </Link>
          <Link
            to="/servicos"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ver serviços
          </Link>
          <Link
            to="/orcamento"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Pedir orçamento
          </Link>
          <Link
            to="/faq"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ver FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const GTM_ID = import.meta.env.VITE_GTM_ID as string | undefined;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Glass Phone SBS — Smartphones, Acessórios e Assistência" },
      { name: "description", content: "Glass Phone SBS: loja de celulares com iPhone, Samsung, Xiaomi e Motorola. Melhores preços e atendimento pelo WhatsApp." },
      { property: "og:title", content: "Glass Phone SBS — Smartphones, Acessórios e Assistência" },
      { name: "twitter:title", content: "Glass Phone SBS — Smartphones, Acessórios e Assistência" },
      { property: "og:description", content: "Glass Phone SBS: loja de celulares com iPhone, Samsung, Xiaomi e Motorola. Melhores preços e atendimento pelo WhatsApp." },
      { name: "twitter:description", content: "Glass Phone SBS: loja de celulares com iPhone, Samsung, Xiaomi e Motorola. Melhores preços e atendimento pelo WhatsApp." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/f6876b28-dc2b-4fba-822f-e32a3bfaeb23" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/f6876b28-dc2b-4fba-822f-e32a3bfaeb23" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/glassphone-logo.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/glassphone-logo.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Inter suporta Latin Extended (ç, ã, õ, etc.) — Rajdhani não tem cobertura completa
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" },
    ],
    scripts: GTM_ID
      ? [
          {
            // GTM bootstrap — inicializa dataLayer e injeta o container.
            // Eventos custom (`whatsapp_click`, `trade_in_lead_submit`,
            // `checkout_submit`) já são empurrados pelo helper em src/lib/analytics.ts.
            children: `window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=document.getElementsByTagName('script')[0],j=document.createElement('script'),dl='dataLayer';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id=${GTM_ID}&l='+dl;f.parentNode.insertBefore(j,f);`,
          },
        ]
      : [],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  // Envia page_view virtual ao dataLayer a cada mudança de rota (SPA-safe).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const push = () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "page_view",
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
      });
    };
    push();
    const unsub = router.subscribe("onResolved", push);
    return () => unsub();
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
