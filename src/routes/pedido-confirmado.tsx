import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShoppingBag, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";

const searchSchema = z.object({
  id: fallback(z.string(), "").default(""),
  name: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/pedido-confirmado")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Pedido confirmado — Glass Phone SBS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PedidoConfirmadoPage,
});

function PedidoConfirmadoPage() {
  const { id, name } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-600 grid place-items-center">
            <CheckCircle2 className="h-10 w-10" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {name ? `Obrigado, ${name.split(" ")[0]}!` : "Pedido confirmado!"}
          </h1>
          <p className="text-muted-foreground">
            Seu pedido foi registrado com sucesso.
            {id && <> Número: <span className="font-mono font-semibold">#{id.slice(0, 8).toUpperCase()}</span>.</>}
          </p>
        </div>
        <div className="rounded-xl bg-muted/40 border p-4 text-sm text-left space-y-2">
          <p className="font-semibold">O que acontece agora?</p>
          <p className="text-muted-foreground">1. O WhatsApp já abriu para você confirmar o pedido com nossa equipe.</p>
          <p className="text-muted-foreground">2. Combinamos pagamento e entrega por lá.</p>
          <p className="text-muted-foreground">3. Qualquer dúvida, é só chamar — respondemos em minutos.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/loja">
            <Button variant="outline" className="w-full sm:w-auto">
              <ShoppingBag className="w-4 h-4 mr-2" /> Continuar comprando
            </Button>
          </Link>
          <Link to="/">
            <Button className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" /> Ir para a home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
