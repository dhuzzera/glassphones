-- ============================================================
-- Cupons de desconto
-- ============================================================

CREATE TABLE IF NOT EXISTS public.coupons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  code         TEXT NOT NULL UNIQUE,
  description  TEXT,
  type         TEXT NOT NULL DEFAULT 'percent'
               CHECK (type IN ('percent', 'fixed')),
  value        INT NOT NULL CHECK (value > 0),
  -- percent: 1-100 (%) | fixed: centavos (ex: 1000 = R$10)
  min_order_cents INT NOT NULL DEFAULT 0,
  max_uses     INT,
  uses         INT NOT NULL DEFAULT 0,
  active       BOOLEAN NOT NULL DEFAULT true,
  expires_at   TIMESTAMPTZ
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- leitura pública (necessária para validar no checkout)
CREATE POLICY "coupons public read active"
  ON public.coupons FOR SELECT
  USING (active = true);

-- admin gerencia tudo
CREATE POLICY "coupons admin all"
  ON public.coupons FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO service_role;

-- Adicionar coupon_code e discount_cents na orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_cents INT NOT NULL DEFAULT 0;
