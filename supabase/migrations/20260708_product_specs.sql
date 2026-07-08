-- Adiciona coluna specs (JSONB) na tabela products
-- Armazena specs técnicas do aparelho: tela, processador, câmeras, etc.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS specs JSONB;

COMMENT ON COLUMN public.products.specs IS
  'Specs técnicas do aparelho em formato livre. Ex: {"Tela":"6.1 polegadas","Processador":"A17 Bionic"}';
