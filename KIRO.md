# KIRO — Pendências bloqueadas por falta de créditos

Este arquivo lista tudo que **não pôde ser executado** por falta de créditos no
workspace Lovable. Assim que houver recarga, aplicar na ordem abaixo.

---

## 1. Ativar Lovable Cloud

Sem Cloud ativo, nenhuma migração, bucket ou policy pode ser criada.

- Ação: rodar `supabase--enable` (ou pedir à IA para ativar Cloud).
- Depois disso, aplicar as migrações abaixo em sequência.

---

## 2. Migrações SQL pendentes

### 2.1 `products.condition` — filtro de condição do aparelho

```sql
ALTER TABLE public.products
  ADD COLUMN condition TEXT
  CHECK (condition IN ('novo','semi-novo','usado'));

CREATE INDEX IF NOT EXISTS idx_products_condition
  ON public.products (condition)
  WHERE active = true;
```

**Desbloqueia:** filtro "Condição" em `/loja` (frontend já preparado para
consumir a coluna via `searchParams`).

---

### 2.2 `reviews.product_id` + `photo_url` — reviews por produto com foto

```sql
ALTER TABLE public.reviews
  ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ADD COLUMN photo_url  TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_product_id
  ON public.reviews (product_id)
  WHERE approved = true;
```

**Desbloqueia:**
- Prova social específica por produto na PDP (`/loja/$slug`).
- Exibição da foto real enviada pelo cliente.

---

### 2.3 Bucket `review-photos` + policies de Storage

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- leitura pública
CREATE POLICY "review photos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-photos');

-- upload público (form anônimo) — arquivos ficam em revisão via reviews.approved
CREATE POLICY "review photos public insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'review-photos');
```

**Desbloqueia:** upload de foto no formulário público `/avaliacoes`.

---

### 2.4 `trade_in_leads` — persistência dos leads da calculadora

```sql
CREATE TABLE public.trade_in_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  marca            TEXT NOT NULL,
  modelo           TEXT NOT NULL,
  estado           TEXT NOT NULL CHECK (estado IN ('perfeito','bom','regular','danificado')),
  bateria          INT  NOT NULL CHECK (bateria BETWEEN 0 AND 100),
  estimativa_min   INT  NOT NULL,
  estimativa_max   INT  NOT NULL,
  cidade_origem    TEXT,
  produto_origem   TEXT,
  origem           TEXT,
  referrer         TEXT,
  status           TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','contacted','negotiating','won','lost')),
  notes            TEXT
);

GRANT INSERT ON public.trade_in_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.trade_in_leads TO authenticated;
GRANT ALL ON public.trade_in_leads TO service_role;

ALTER TABLE public.trade_in_leads ENABLE ROW LEVEL SECURITY;

-- insert público (form anônimo)
CREATE POLICY "trade_in_leads public insert"
  ON public.trade_in_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- somente admin lê/edita
CREATE POLICY "trade_in_leads admin read"
  ON public.trade_in_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "trade_in_leads admin update"
  ON public.trade_in_leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

**Desbloqueia:**
- Gravar lead antes de abrir o WhatsApp em `/trade-in`.
- Página `/admin/leads` (a criar) com status kanban.

---

### 2.5 `orders.source` — origem do pedido no dashboard admin

```sql
ALTER TABLE public.orders
  ADD COLUMN source TEXT DEFAULT 'site'
  CHECK (source IN ('site','whatsapp','trade-in','loja-fisica'));
```

**Desbloqueia:** gráficos por origem em `/admin` (dashboard).

---

### 2.6 RPC `count_product_sales` — contador de vendas real

```sql
CREATE OR REPLACE FUNCTION public.count_product_sales(_product_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM((item->>'quantity')::int), 0)::int
  FROM public.orders,
       jsonb_array_elements(items) AS item
  WHERE (item->>'product_id') = _product_id::text
    AND status IN ('confirmed','paid','delivered');
$$;

GRANT EXECUTE ON FUNCTION public.count_product_sales(UUID) TO anon, authenticated;
```

**Desbloqueia:** número "X vendidos" real no `<ProductSocialProof />` (hoje
faz `select count` no client, que é mais lento e menos preciso).

---

## 3. Frontend pendente (depende das migrações acima)

Depois que 2.x estiver aplicado:

1. **`/loja`** — adicionar chip de filtro "Condição" (novo / semi-novo / usado)
   consumindo `products.condition`.
2. **`/avaliacoes`** — adicionar `<input type="file">` + upload para bucket
   `review-photos`, gravar `photo_url` e `product_id` selecionado.
3. **`/loja/$slug`** — trocar query genérica de reviews por
   `.eq('product_id', product.id)`; usar RPC `count_product_sales`.
4. **`/trade-in`** — `insert` em `trade_in_leads` **antes** do
   `window.location.href = wa.me/...`.
5. **`/admin/leads`** (nova rota) — lista + mudança de status dos leads.
6. **`/admin` (dashboard)** — cards e gráfico "Pedidos por origem" usando
   `orders.source`.

---

## 4. Ordem recomendada de execução

1. `supabase--enable`
2. Migrações 2.1 → 2.6 (podem ir juntas em um único arquivo de migração)
3. Frontend 3.1 → 3.6

Cada etapa é independente das seguintes — dá para entregar em incrementos.
