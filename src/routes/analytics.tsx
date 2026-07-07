import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { clearLog, isDebug, readLog, type LoggedEvent } from "@/lib/analytics";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics interno — Glass Phone SBS" },
      { name: "description", content: "Painel interno de cliques de WhatsApp e Ver detalhes." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AnalyticsPage,
});

function fmt(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
}

function label(e: LoggedEvent) {
  if (e.event === "whatsapp_click") return "WhatsApp";
  if (e.event === "service_detail_click") return "Ver detalhes";
  return e.event;
}

function AnalyticsPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) navigate({ to: "/auth" });
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <SiteShell>
        <div className="min-h-screen flex items-center justify-center">Verificando...</div>
      </SiteShell>
    );
  }

  if (!isAdmin) return null;

  const refresh = () => setEvents(readLog());

  useEffect(() => {
    refresh();
    setDebug(isDebug());
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleDebug = () => {
    const next = !debug;
    if (next) window.localStorage.setItem("gp_analytics_debug", "1");
    else window.localStorage.removeItem("gp_analytics_debug");
    setDebug(next);
  };

  const wa = events.filter((e) => e.event === "whatsapp_click");
  const details = events.filter((e) => e.event === "service_detail_click");

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics interno</h1>
            <p className="text-sm text-muted-foreground">Últimos {events.length} cliques registrados (local).</p>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDebug} className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted">
              Debug: {debug ? "ON" : "OFF"}
            </button>
            <button onClick={refresh} className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted">Atualizar</button>
            <button onClick={() => { clearLog(); refresh(); }} className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted">Limpar</button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-8">
          Dica: adicione <code className="px-1 rounded bg-muted">?debug=analytics</code> em qualquer URL para ligar o modo debug e ver os eventos no console. Use <code className="px-1 rounded bg-muted">?debug=off</code> para desligar.
        </p>

        <Section title="Cliques em WhatsApp" rows={wa} empty="Nenhum clique em WhatsApp ainda." showPrice />
        <Section title="Cliques em Ver detalhes" rows={details} empty="Nenhum clique em Ver detalhes ainda." />

        <div className="mt-10 text-sm">
          <Link to="/" className="text-primary hover:underline">← Voltar para a home</Link>
        </div>
      </div>
    </SiteShell>
  );
}

function Section({ title, rows, empty, showPrice = false }: { title: string; rows: LoggedEvent[]; empty: string; showPrice?: boolean }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-3">{title} <span className="text-muted-foreground text-sm font-normal">({rows.length})</span></h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">Quando</th>
                <th className="px-3 py-2">Evento</th>
                <th className="px-3 py-2">Serviço</th>
                {showPrice && <th className="px-3 py-2">Preço</th>}
                <th className="px-3 py-2">Origem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => {
                const nome = (e.params.nome as string | undefined) ?? "—";
                const preco = e.params.preco;
                const loc = (e.params.location as string | undefined) ?? "—";
                return (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2 whitespace-nowrap">{fmt(e.ts)}</td>
                    <td className="px-3 py-2">{label(e)}</td>
                    <td className="px-3 py-2">{nome}</td>
                    {showPrice && <td className="px-3 py-2">{typeof preco === "number" ? preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}</td>}
                    <td className="px-3 py-2 text-muted-foreground">{loc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
