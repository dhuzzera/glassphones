# KIRO — Status do Projeto

Todas as features planejadas foram implementadas e a migração SQL foi aplicada.

## ✅ Concluído

### Banco de dados (Supabase)
- `products.condition` — filtro de condição (novo / semi-novo / usado)
- `reviews.product_id` + `photo_url` — reviews por produto com foto
- Bucket `review-photos` + policies de Storage
- Tabela `trade_in_leads` — persistência dos leads de trade-in
- `orders.source` — origem do pedido
- RPC `count_product_sales` — contador de vendas real

### Frontend
- `/loja` — filtro de condição (novo / semi-novo / usado)
- `/avaliacoes` — upload de foto + seleção de produto avaliado
- `/loja/$slug` — reviews por `product_id` + RPC `count_product_sales` com fallback
- `/trade-in` — grava lead em `trade_in_leads` antes de abrir WhatsApp
- `/admin/leads` — lista de leads com kanban de status, notas e exportação CSV
- `/admin` — dashboard com gráfico por origem e receita dos últimos 6 meses
