# KIRO — Notas do projeto GlassPhones

## Status das migrações SQL

Rodar no Supabase SQL Editor (já aplicadas):
- `supabase/migrations/20260707_pending_features.sql` ✅
- `supabase/migrations/20260707_coupons.sql` ⚠️ **PENDENTE — rodar no Supabase**

---

## Variáveis de ambiente necessárias na Vercel

| Variável | Descrição | Obrigatória |
|---|---|---|
| `VITE_GTM_ID` | ID do Google Tag Manager (ex: `GTM-XXXXXXX`) | Não |

Para configurar:
1. Acesse Vercel → projeto glassphones → Settings → Environment Variables
2. Adicione `VITE_GTM_ID` com o valor do seu container GTM
3. Redeploy (push qualquer commit)

---

## Edge Function — notify-new-order

Para receber notificação no WhatsApp quando chegar pedido novo:

1. Instalar Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Deploy: `supabase functions deploy notify-new-order --project-ref otjajtfaqzpkhbwjdiow`
4. No painel Supabase → Database → Webhooks → Create webhook:
   - Table: `orders`
   - Events: `INSERT`
   - Type: Edge Function
   - Function: `notify-new-order`

Obs: para notificação real via WhatsApp Business API, adicionar a secret
`WHATSAPP_API_TOKEN` e adaptar a edge function em `supabase/functions/notify-new-order/index.ts`.

---

## PWA

O site já tem manifest e service worker configurados.
Para instalar como app no celular: abra `www.glassphone.com.br` no Chrome/Safari
e use "Adicionar à tela inicial".

---

## Google Search Console

1. Acesse https://search.google.com/search-console
2. Adicionar propriedade: `https://www.glassphone.com.br`
3. Verificar via arquivo HTML ou DNS
4. Enviar sitemap: `https://www.glassphone.com.br/sitemap.xml`

---

## Cupons de desconto

A tabela `coupons` foi criada via migração `20260707_coupons.sql`.
Gerenciar em `/admin/cupons`.

Tipos suportados:
- `percent` — desconto percentual (ex: 10 = 10%)
- `fixed` — desconto em valor fixo (ex: 1000 = R$10,00)
