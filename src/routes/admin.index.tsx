import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [pendingRes, activeRes, monthRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("orders").select("total_cents").gte("created_at", startOfMonth.toISOString()).in("status", ["confirmed", "paid", "delivered"]),
      ]);

      const revenueCents = (monthRes.data ?? []).reduce((s, r) => s + (r.total_cents ?? 0), 0);
      return {
        pending: pendingRes.count ?? 0,
        active: activeRes.count ?? 0,
        revenueCents,
      };
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Pedidos pendentes</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.pending ?? "—"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Produtos ativos</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.active ?? "—"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Faturamento no mês</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats ? formatBRL(stats.revenueCents) : "—"}</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
