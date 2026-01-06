-- Fix: Update RLS policy for products to only show approved products to public
-- but allow vendors to see their own products regardless of status

DROP POLICY IF EXISTS "Public can view active products" ON products;

CREATE POLICY "Public can view approved products"
ON products FOR SELECT
USING (
  status IN ('active', 'approved')
  OR user_id = auth.uid()
  OR is_admin(auth.uid())
);

-- Create a function to get products with vendor info for public display
CREATE OR REPLACE FUNCTION public.get_products_with_vendor(
  _category_id uuid DEFAULT NULL,
  _search_query text DEFAULT NULL,
  _limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  category text,
  category_id uuid,
  main_image text,
  image_url text,
  images jsonb,
  colors jsonb,
  sizes jsonb,
  discount numeric,
  featured boolean,
  stock integer,
  inventory integer,
  status text,
  created_at timestamptz,
  vendor_id uuid,
  vendor_name text,
  vendor_slug text,
  vendor_logo_url text
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.category,
    p.category_id,
    p.main_image,
    p.image_url,
    p.images,
    p.colors,
    p.sizes,
    p.discount,
    p.featured,
    p.stock,
    p.inventory,
    p.status,
    p.created_at,
    p.vendor_id,
    COALESCE(v.name, vp.store_name) as vendor_name,
    COALESCE(v.slug, vp.slug) as vendor_slug,
    COALESCE(vp.logo_url, v.logo_url) as vendor_logo_url
  FROM products p
  LEFT JOIN vendors v ON v.id = p.vendor_id
  LEFT JOIN vendor_profiles vp ON vp.user_id = p.user_id
  WHERE p.status IN ('active', 'approved')
    AND (_category_id IS NULL OR p.category_id = _category_id)
    AND (_search_query IS NULL OR _search_query = '' OR 
         p.name ILIKE '%' || _search_query || '%' OR 
         p.description ILIKE '%' || _search_query || '%')
  ORDER BY p.featured DESC NULLS LAST, p.created_at DESC
  LIMIT _limit;
END;
$$;

-- Update get_active_vendors to properly count only approved products
CREATE OR REPLACE FUNCTION public.get_active_vendors()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  cover_url text,
  status text,
  product_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    v.slug,
    COALESCE(vp.logo_url, v.logo_url) as logo_url,
    COALESCE(vp.cover_url, v.cover_url) as cover_url,
    v.status,
    (SELECT COUNT(*) FROM products pr 
     WHERE pr.vendor_id = v.id 
     AND pr.status IN ('active', 'approved')) as product_count
  FROM vendors v
  LEFT JOIN vendor_profiles vp ON vp.user_id = v.owner_id
  WHERE v.status = 'active'
  ORDER BY product_count DESC;
END;
$$;