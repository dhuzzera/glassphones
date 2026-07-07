# notify-new-order

Edge function chamada via Database Webhook quando um novo pedido é inserido.

## Como ativar no Supabase
1. Deploy: `supabase functions deploy notify-new-order`
2. No painel Supabase → Database → Webhooks → Create webhook:
   - Table: orders
   - Events: INSERT
   - Type: Edge Function
   - Function: notify-new-order
3. (Opcional) Para notificação real via WhatsApp Business API,
   adicionar a secret WHATSAPP_API_TOKEN e usar a API oficial.
