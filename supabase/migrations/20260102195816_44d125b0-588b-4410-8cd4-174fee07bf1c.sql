-- EPIC 1: Fix product-category data inconsistency
-- Copy category UUIDs from 'category' column to 'category_id' where category_id is NULL
UPDATE products 
SET category_id = category::uuid 
WHERE category_id IS NULL 
  AND category IS NOT NULL 
  AND category ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- EPIC 2: Add vendor-owned categories support
ALTER TABLE categories ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'global';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE;

-- Create index for vendor categories lookup
CREATE INDEX IF NOT EXISTS idx_categories_vendor_id ON categories(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_scope ON categories(scope);

-- Update RLS policy to allow vendors to manage their own categories
CREATE POLICY "Vendors can manage their own categories"
ON categories
FOR ALL
USING (
  (scope = 'vendor' AND vendor_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM vendors v WHERE v.id = categories.vendor_id AND v.owner_id = auth.uid()
  ))
)
WITH CHECK (
  (scope = 'vendor' AND vendor_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM vendors v WHERE v.id = categories.vendor_id AND v.owner_id = auth.uid()
  ))
);

-- EPIC 3: Add Best Seller toggle to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller boolean DEFAULT false;

-- Create index for best seller products lookup
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(is_best_seller) WHERE is_best_seller = true;

-- Update get_best_seller_products function to use the new is_best_seller column for vendors
CREATE OR REPLACE FUNCTION public.get_best_seller_products(_vendor_id uuid DEFAULT NULL, _limit int DEFAULT 12)
RETURNS TABLE (
  id uuid,
  name text,
  price numeric,
  discount numeric,
  image_url text,
  rating numeric,
  vendor_name text,
  vendor_slug text,
  vendor_logo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    COALESCE(p.discount, 0) as discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    COALESCE(p.rating, 0) as rating,
    v.name as vendor_name,
    v.slug as vendor_slug,
    COALESCE(vp.logo_url, v.logo_url) as vendor_logo_url
  FROM products p
  LEFT JOIN vendors v ON p.vendor_id = v.id
  LEFT JOIN vendor_profiles vp ON v.owner_id = vp.user_id
  WHERE p.status IN ('active', 'approved')
    AND (
      CASE 
        -- If vendor_id is specified, only show that vendor's best sellers (marked by vendor)
        WHEN _vendor_id IS NOT NULL THEN p.vendor_id = _vendor_id AND p.is_best_seller = true
        -- Global: show featured products or products with high order count
        ELSE p.featured = true
      END
    )
  ORDER BY p.created_at DESC
  LIMIT _limit;
END;
$$;

-- Create function to get vendor categories (for vendor store pages)
CREATE OR REPLACE FUNCTION public.get_vendor_categories(_vendor_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  image_url text,
  product_count bigint,
  scope text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Get vendor's own categories
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.description,
    c.image_url,
    (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.vendor_id = _vendor_id AND p.status IN ('active', 'approved'))::bigint as product_count,
    c.scope
  FROM categories c
  WHERE c.scope = 'vendor' AND c.vendor_id = _vendor_id AND c.is_active = true
  
  UNION ALL
  
  -- Also include global categories that this vendor has products in
  SELECT DISTINCT ON (c.id)
    c.id,
    c.name,
    c.slug,
    c.description,
    c.image_url,
    (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.vendor_id = _vendor_id AND p.status IN ('active', 'approved'))::bigint as product_count,
    c.scope
  FROM categories c
  INNER JOIN products p ON p.category_id = c.id
  WHERE c.scope = 'global' 
    AND c.is_active = true
    AND p.vendor_id = _vendor_id
    AND p.status IN ('active', 'approved')
  
  ORDER BY name;
END;
$$;