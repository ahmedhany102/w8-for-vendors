
-- 1. Ensure a proper categories table (skip if exists, but ensure schema)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add product_variants table for per-color/size/price/stock/image
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  image_url TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Ensure products.category_id FK
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- 4. Optional: drop `colorImages` or other obsolete columns if still present
-- (Uncomment if needed after manual verification)
-- ALTER TABLE public.products DROP COLUMN IF EXISTS colorImages;

-- 5. RLS for new table (public access for now – can be restricted later)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to categories for all" ON public.categories
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to product_variants for all" ON public.product_variants
  USING (true) WITH CHECK (true);
