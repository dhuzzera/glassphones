import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { OrderSource } from "@/lib/marketplace-types";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const SOURCE_LABELS: Record<string, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  "trade-in": "Trade-in",
  "loja-fisica": "Loja física",
};

const SOURCE_COLORS: Record<string, string> = {
  site: "#6366f1",
  whatsapp: "#22c55e",
  "trade-in": "#f59e0b",
  "loja-fisica": "#3b82f6",
};

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [pendingRes, activeRes, monthRes, leadsRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
        supabase
          .from("orders")
          .select("total_cents, source")
          .gte("created_at", startOfMonth.toISOString())
          .in("status", ["confirmed", "paid", "delivered"]),
        supabase
          .from("trade_in_leads")
          .select("id", { count: "exact", head: true })
          .eq("status", "new"),
      ]);

      const revenueCents = (monthRes.data ?? []).reduce(
        (s, r) => s + (r.total_cents ?? 0),
        0
      );

      // Pedidos por origem
      const sourceMap: Record<string, number> = {};
      for (const o of monthRes.data ?? []) {
        const src = (o.source as OrderSource) ?? "site";
        sourceMap[src] = (sourceMap[src] ?? 0) + 1;
      }
      const sourceData = Object.entries(sourceMap).map(([source, count]) => ({
        source,
        label: SOURCE_LABELS[source] ?? source,
        count,
      }));

      return {
        pending: pendingRes.count ?? 0,
        active: activeRes.count ?? 0,
        revenueCents,
        newLeads: leadsRes.count ?? 0,
        sourceData,
      };
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pedidos pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.pending ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Produtos ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.active ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Faturamento no mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats ? formatBRL(stats.revenueCents) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Leads trade-in novos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.newLeads ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {stats?.sourceData && stats.sourceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos por origem (este mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.sourceData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} pedido${value !== 1 ? "s" : ""}`, "Quantidade"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.sourceData.map((entry) => (
                    <Cell
                      key={entry.source}
                      fill={SOURCE_COLORS[entry.source] ?? "#6366f1"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {(!stats?.sourceData || stats.sourceData.length === 0) && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            Nenhum pedido confirmado este mês ainda.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
