
-- Drop existing problematic constraints and clean up products table structure
ALTER TABLE public.products DROP COLUMN IF EXISTS color CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS size CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS color_images CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS has_discount CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS details CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS category_path CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS ad_product_id CASCADE;

-- Create categories table with proper parent-child relationship
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert main categories
INSERT INTO public.categories (name, slug, parent_id) VALUES 
('Men', 'men', NULL),
('Women', 'women', NULL),
('Kids', 'kids', NULL)
ON CONFLICT DO NOTHING;

-- Insert Men subcategories
INSERT INTO public.categories (name, slug, parent_id) 
SELECT 'T-Shirts', 't-shirts', id FROM public.categories WHERE slug = 'men'
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, slug, parent_id) 
SELECT 'Shoes', 'shoes', id FROM public.categories WHERE slug = 'men'
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, slug, parent_id) 
SELECT 'Jackets', 'jackets', id FROM public.categories WHERE slug = 'men'
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, slug, parent_id) 
SELECT 'Pants', 'pants', id FROM public.categories WHERE slug = 'men'
ON CONFLICT DO NOTHING;

-- Clean up products table and standardize structure
ALTER TABLE public.products DROP COLUMN IF EXISTS type CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Standardize products table structure
ALTER TABLE public.products ALTER COLUMN colors TYPE jsonb USING colors::jsonb;
ALTER TABLE public.products ALTER COLUMN sizes TYPE jsonb USING sizes::jsonb;
ALTER TABLE public.products ALTER COLUMN images TYPE jsonb USING images::jsonb;

-- Add proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Update existing products to use proper category structure
UPDATE public.products 
SET category_id = (
  SELECT c.id FROM public.categories c 
  WHERE c.slug = CASE 
    WHEN public.products.category = 'T-Shirts' THEN 't-shirts'
    WHEN public.products.category = 'Shoes' THEN 'shoes'
    WHEN public.products.category = 'Jackets' THEN 'jackets'
    WHEN public.products.category = 'Pants' THEN 'pants'
    ELSE 't-shirts'
  END
  AND c.parent_id = (SELECT id FROM public.categories WHERE slug = 'men')
)
WHERE category_id IS NULL;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (public read access)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Categories are manageable by admins" ON public.categories;
CREATE POLICY "Categories are manageable by admins" ON public.categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
