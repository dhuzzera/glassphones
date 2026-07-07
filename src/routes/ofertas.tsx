import { createFileRoute, redirect } from "@tanstack/react-router";

// /ofertas agora é alias de /loja
export const Route = createFileRoute("/ofertas")({
  beforeLoad: () => {
    throw redirect({ to: "/loja", replace: true });
  },
  component: () => null,
});
