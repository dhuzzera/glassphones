import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Coupon } from "@/lib/marketplace-types";
import { formatBRL } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/admin/cupons")({
  component: CuponsAdmin,
});

const emptyForm = {
  code: "",
  description: "",
  type: "percent" as "percent" | "fixed",
  value: "",
  min_order_cents: "",
  max_uses: "",
  expires_at: "",
};

function CuponsAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Coupon[];
    },
  });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.value) return toast.error("Preencha código e valor.");
    setSaving(true);
    try {
      const { error } = await supabase.from("coupons").insert({
        code: form.code.trim().toUpperCase(),
        description: form.description || null,
        type: form.type,
        value: parseInt(form.value, 10),
        min_order_cents: form.min_order_cents ? Math.round(parseFloat(form.min_order_cents) * 100) : 0,
        max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
        expires_at: form.expires_at || null,
      });
      if (error) throw error;
      toast.success("Cupom criado");
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar cupom");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(c.active ? "Cupom desativado" : "Cupom ativado");
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cupom excluído");
    setDeleteTarget(null);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  return (
    <div>
      <ConfirmDialog
        open={deleteTarget !== null}
        description="O cupom será excluído permanentemente."
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Tag className="w-5 h-5" /> Cupons de desconto
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <Card>
          <CardHeader><CardTitle>Novo cupom</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-3">
              <div>
                <Label>Código *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="DESCONTO10"
                  required
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="10% de desconto"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "percent" | "fixed" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{form.type === "percent" ? "Valor (%)" : "Valor (R$)"} *</Label>
                  <Input
                    type="number"
                    min="1"
                    max={form.type === "percent" ? "100" : undefined}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Pedido mínimo (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.min_order_cents}
                  onChange={(e) => setForm({ ...form, min_order_cents: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Limite de usos</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>
              <div>
                <Label>Validade</Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                <Plus className="w-4 h-4 mr-2" />
                {saving ? "Criando..." : "Criar cupom"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Cupons ativos e inativos</CardTitle></CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="p-4 text-muted-foreground text-sm">Carregando...</p>
              ) : coupons.length === 0 ? (
                <p className="p-4 text-muted-foreground text-sm">Nenhum cupom ainda.</p>
              ) : (
                <div className="divide-y">
                  {coupons.map((c) => (
                    <div key={c.id} className="p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold">{c.code}</span>
                          <Badge variant={c.active ? "default" : "secondary"}>
                            {c.active ? "Ativo" : "Inativo"}
                          </Badge>
                          <Badge variant="outline">
                            {c.type === "percent" ? `${c.value}%` : `−${formatBRL(c.value)}`}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.uses}/{c.max_uses ?? "∞"} usos
                          {c.min_order_cents > 0 && ` · mín. ${formatBRL(c.min_order_cents)}`}
                          {c.expires_at && ` · expira ${new Date(c.expires_at).toLocaleDateString("pt-BR")}`}
                        </p>
                        {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                      </div>
                      <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
