import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, LayoutDashboard, Package, Tag, ClipboardList, Recycle, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Glass Phone SBS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/loja" });
  }, [user, isAdmin, loading, navigate]);

  if (loading || !user || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Verificando acesso...</div>;
  }

  const links = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/produtos", label: "Produtos", icon: Package },
    { to: "/admin/categorias", label: "Categorias", icon: Tag },
    { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
    { to: "/admin/leads", label: "Leads Trade-in", icon: Recycle },
    { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 border-r bg-card p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-6">Admin</h2>
        <nav className="flex flex-col gap-1 flex-1">
          {links.map((l) => {
            const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t pt-4 space-y-2">
          <Link to="/loja"><Button variant="outline" size="sm" className="w-full">Ver loja</Button></Link>
          <Button variant="ghost" size="sm" className="w-full" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}>
            <LogOut className="w-4 h-4 mr-2" />Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
