import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TradeInLead, LeadStatus } from "@/lib/marketplace-types";
import { formatBRL } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/leads")({
  component: LeadsAdmin,
});

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contactado",
  negotiating: "Negociando",
  won: "Ganho",
  lost: "Perdido",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-200",
  contacted: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  negotiating: "bg-orange-500/10 text-orange-700 border-orange-200",
  won: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  lost: "bg-red-500/10 text-red-600 border-red-200",
};

const ALL_STATUSES: LeadStatus[] = ["new", "contacted", "negotiating", "won", "lost"];

function LeadsAdmin() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "all">("all");
  const [detail, setDetail] = useState<TradeInLead | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin-leads", filterStatus],
    queryFn: async () => {
      let q = supabase
        .from("trade_in_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (filterStatus !== "all") q = q.eq("status", filterStatus);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TradeInLead[];
    },
  });

  const updateStatus = async (id: string, status: LeadStatus) => {
    const { error } = await supabase
      .from("trade_in_leads")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["admin-leads"] });
    if (detail?.id === id) setDetail({ ...detail, status });
  };

  const saveNotes = async () => {
    if (!detail) return;
    const { error } = await supabase
      .from("trade_in_leads")
      .update({ notes: editNotes })
      .eq("id", detail.id);
    if (error) return toast.error(error.message);
    toast.success("Notas salvas");
    setDetail({ ...detail, notes: editNotes });
    qc.invalidateQueries({ queryKey: ["admin-leads"] });
  };

  const openDetail = (lead: TradeInLead) => {
    setDetail(lead);
    setEditNotes(lead.notes ?? "");
  };

  const openWhatsApp = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    const withCountry = clean.startsWith("55") ? clean : `55${clean}`;
    window.open(`https://wa.me/${withCountry}`, "_blank");
  };

  // Contadores por status
  const counts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Leads Trade-in</h1>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as LeadStatus | "all")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({leads.length})</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]} ({counts[s] ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban resumido */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
            className={`rounded-xl border p-3 text-left transition hover:opacity-80 ${
              filterStatus === s ? "ring-2 ring-primary" : ""
            } ${STATUS_COLORS[s]}`}
          >
            <p className="text-2xl font-bold">{counts[s] ?? 0}</p>
            <p className="text-xs font-medium mt-0.5">{STATUS_LABELS[s]}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-muted-foreground">Carregando…</p>
          ) : leads.length === 0 ? (
            <p className="p-6 text-muted-foreground">
              Nenhum lead ainda. Os leads aparecem aqui quando clientes preencherem
              o formulário de trade-in.
            </p>
          ) : (
            <div className="divide-y">
              {leads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => openDetail(lead)}
                  className="w-full text-left p-4 hover:bg-muted transition flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{lead.customer_name}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[lead.status]}`}
                      >
                        {STATUS_LABELS[lead.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {lead.marca.toUpperCase()} {lead.modelo} · {lead.estado} · bateria {lead.bateria}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(lead.created_at).toLocaleString("pt-BR")}
                      {lead.cidade_origem ? ` · ${lead.cidade_origem}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-primary">
                      {formatBRL(lead.estimativa_min)} — {formatBRL(lead.estimativa_max)}
                    </p>
                    <p className="text-xs text-muted-foreground">{lead.customer_phone}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Lead — {detail.customer_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Telefone</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-medium">{detail.customer_phone}</p>
                      <Button size="sm" variant="outline" onClick={() => openWhatsApp(detail.customer_phone)}>
                        <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Data</p>
                    <p className="font-medium mt-1">{new Date(detail.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Aparelho</p>
                    <p className="font-medium mt-1">{detail.marca.toUpperCase()} {detail.modelo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Estado / Bateria</p>
                    <p className="font-medium mt-1">{detail.estado} · {detail.bateria}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Estimativa</p>
                    <p className="font-semibold text-primary mt-1">
                      {formatBRL(detail.estimativa_min)} — {formatBRL(detail.estimativa_max)}
                    </p>
                  </div>
                  {detail.cidade_origem && (
                    <div>
                      <p className="text-muted-foreground text-xs">Cidade</p>
                      <p className="font-medium mt-1">{detail.cidade_origem}</p>
                    </div>
                  )}
                  {detail.produto_origem && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Produto de interesse</p>
                      <p className="font-medium mt-1">{detail.produto_origem}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs">Alterar status</Label>
                  <Select
                    value={detail.status}
                    onValueChange={(v) => updateStatus(detail.id, v as LeadStatus)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Notas internas</Label>
                  <Textarea
                    className="mt-1"
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Observações da negociação…"
                  />
                  <Button size="sm" className="mt-2" onClick={saveNotes}>
                    Salvar notas
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
