-- ============================================================
-- Migração: todas as features pendentes do KIRO.md
-- Aplicar no painel Supabase → SQL Editor, ou via CLI:
--   supabase db push
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 2.1  products.condition  ─ filtro de condição do aparelho
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS condition TEXT
  CHECK (condition IN ('novo','semi-novo','usado'));

CREATE INDEX IF NOT EXISTS idx_products_condition
  ON public.products (condition)
  WHERE active = true;

-- ─────────────────────────────────────────────────────────────
-- 2.2  reviews.product_id + photo_url
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS photo_url  TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_product_id
  ON public.reviews (product_id)
  WHERE approved = true;

-- ─────────────────────────────────────────────────────────────
-- 2.3  Bucket review-photos + policies de Storage
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'review photos public read'
  ) THEN
    CREATE POLICY "review photos public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'review-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'review photos public insert'
  ) THEN
    CREATE POLICY "review photos public insert"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'review-photos');
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2.4  trade_in_leads
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trade_in_leads (
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trade_in_leads' AND policyname = 'trade_in_leads public insert'
  ) THEN
    CREATE POLICY "trade_in_leads public insert"
      ON public.trade_in_leads FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trade_in_leads' AND policyname = 'trade_in_leads admin read'
  ) THEN
    CREATE POLICY "trade_in_leads admin read"
      ON public.trade_in_leads FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trade_in_leads' AND policyname = 'trade_in_leads admin update'
  ) THEN
    CREATE POLICY "trade_in_leads admin update"
      ON public.trade_in_leads FOR UPDATE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2.5  orders.source  ─ origem do pedido
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'site'
  CHECK (source IN ('site','whatsapp','trade-in','loja-fisica'));

-- ─────────────────────────────────────────────────────────────
-- 2.6  RPC count_product_sales
-- ─────────────────────────────────────────────────────────────
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
