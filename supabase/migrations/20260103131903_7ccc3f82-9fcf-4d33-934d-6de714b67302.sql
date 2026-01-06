
-- ==============================================
-- PHASE 2: CORE FIXES MIGRATION
-- ==============================================

-- 1. Add unique constraint on product_views to prevent duplicates
-- First, clean up any existing duplicates (keep the latest view)
DELETE FROM product_views a
USING product_views b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.product_id = b.product_id;

-- Now add the unique constraint
ALTER TABLE product_views 
ADD CONSTRAINT unique_user_product_view UNIQUE (user_id, product_id);

-- 2. Update track_product_view function to upsert instead of insert
CREATE OR REPLACE FUNCTION public.track_product_view(_product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Upsert: Insert new view or update existing viewed_at timestamp
  INSERT INTO product_views (user_id, product_id, viewed_at)
  VALUES (_user_id, _product_id, now())
  ON CONFLICT (user_id, product_id) 
  DO UPDATE SET viewed_at = now();
  
  RETURN true;
END;
$$;

-- 3. Add vendor_id column to ads table for vendor-specific ads
ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE;

-- 4. Create index for efficient ad filtering
CREATE INDEX IF NOT EXISTS idx_ads_vendor_position ON ads(vendor_id, "position") WHERE is_active = true;

-- 5. Update RLS policy for vendor ads
DROP POLICY IF EXISTS "Vendors can manage their own ads" ON ads;
CREATE POLICY "Vendors can manage their own ads" ON ads
FOR ALL
USING (
  vendor_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM vendors v WHERE v.id = ads.vendor_id AND v.owner_id = auth.uid()
  )
)
WITH CHECK (
  vendor_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM vendors v WHERE v.id = ads.vendor_id AND v.owner_id = auth.uid()
  )
);

-- 6. Add is_hot_deal column to products for Hot Deals feature
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_hot_deal boolean DEFAULT false;

-- 7. Create function to get vendor ads (with quoted column names)
CREATE OR REPLACE FUNCTION public.get_vendor_ads(_vendor_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  image_url text,
  redirect_url text,
  ad_position integer,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, title, description, image_url, redirect_url, "position" as ad_position, is_active
  FROM ads
  WHERE vendor_id = _vendor_id
    AND is_active = true
  ORDER BY "position" ASC;
$$;

-- 8. Update get_best_seller_products to also include is_best_seller flag from products
CREATE OR REPLACE FUNCTION public.get_best_seller_products(_vendor_id uuid DEFAULT NULL::uuid, _limit integer DEFAULT 12)
RETURNS TABLE(id uuid, name text, price numeric, discount numeric, image_url text, rating numeric, vendor_name text, vendor_slug text, vendor_logo_url text)
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
      -- is_best_seller takes priority
      p.is_best_seller = true
      OR
      -- Fallback to featured for global view
      (_vendor_id IS NULL AND p.featured = true)
    )
    AND (_vendor_id IS NULL OR p.vendor_id = _vendor_id)
  ORDER BY p.is_best_seller DESC NULLS LAST, p.featured DESC NULLS LAST, p.created_at DESC
  LIMIT _limit;
END;
$$;

-- 9. Update get_hot_deals_products to use is_hot_deal flag
CREATE OR REPLACE FUNCTION public.get_hot_deals_products(_vendor_id uuid DEFAULT NULL::uuid, _limit integer DEFAULT 12)
RETURNS TABLE(id uuid, name text, price numeric, discount numeric, image_url text, rating numeric, vendor_name text, vendor_slug text, vendor_logo_url text)
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
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(v.name, vp.store_name) as vendor_name,
    COALESCE(v.slug, vp.slug) as vendor_slug,
    COALESCE(v.logo_url, vp.logo_url) as vendor_logo_url
  FROM products p
  LEFT JOIN vendors v ON v.id = p.vendor_id
  LEFT JOIN vendor_profiles vp ON vp.user_id = p.user_id
  WHERE 
    p.status IN ('active', 'approved')
    AND (
      -- is_hot_deal takes priority
      p.is_hot_deal = true
      OR
      -- Fallback: products with discount > 0
      (p.discount IS NOT NULL AND p.discount > 0)
    )
    AND (_vendor_id IS NULL OR p.vendor_id = _vendor_id)
  ORDER BY p.is_hot_deal DESC NULLS LAST, p.discount DESC NULLS FIRST, p.created_at DESC
  LIMIT _limit;
END;
$$;
