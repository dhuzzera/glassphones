import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatBRL } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Glass Phone SBS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, remove, updateQty, totalCents, clear, hydrated } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <Link to="/loja" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Continuar comprando
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Carrinho</h1>

        {!hydrated ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Seu carrinho está vazio.</p>
              <Link to="/loja"><Button className="mt-4">Ir para a loja</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={`${item.product_id}::${item.variant_id ?? ""}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.variant_label && (
                        <p className="text-xs text-muted-foreground">{item.variant_label}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{formatBRL(item.price_cents)} cada</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.product_id, item.quantity - 1, item.variant_id)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.product_id, item.quantity + 1, item.variant_id)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="w-24 text-right font-semibold">{formatBRL(item.price_cents * item.quantity)}</div>
                    <Button variant="ghost" size="icon" onClick={() => remove(item.product_id, item.variant_id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border rounded-lg bg-card">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold">{formatBRL(totalCents)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clear}>Limpar</Button>
                <Link to="/checkout"><Button size="lg">Finalizar pedido</Button></Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
