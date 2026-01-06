
-- Create table for product color variants (one per unique color per product)
CREATE TABLE public.product_color_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color text NOT NULL,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create table for the options for each color (size, price, stock)
CREATE TABLE public.product_color_variant_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  color_variant_id uuid NOT NULL REFERENCES product_color_variants(id) ON DELETE CASCADE,
  size text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for future access control (safe, but optional)
ALTER TABLE public.product_color_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_color_variant_options ENABLE ROW LEVEL SECURITY;
