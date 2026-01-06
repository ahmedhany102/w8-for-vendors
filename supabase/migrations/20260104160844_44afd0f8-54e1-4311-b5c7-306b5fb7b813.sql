
-- First drop the existing functions that need return type changes
DROP FUNCTION IF EXISTS public.get_similar_products(uuid, integer);
DROP FUNCTION IF EXISTS public.get_last_viewed_products(uuid, integer);
DROP FUNCTION IF EXISTS public.get_last_viewed_products(uuid, integer, uuid);
DROP FUNCTION IF EXISTS public.get_vendor_more_products(uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.get_section_products(uuid, integer);
DROP FUNCTION IF EXISTS public.get_best_seller_products(integer, uuid);
DROP FUNCTION IF EXISTS public.get_hot_deals_products(integer, uuid);
DROP FUNCTION IF EXISTS public.get_products_by_category(uuid, uuid, integer, integer);

-- Recreate get_similar_products with stock/inventory columns
CREATE OR REPLACE FUNCTION public.get_similar_products(
  _product_id uuid,
  _limit integer DEFAULT 8
)
RETURNS TABLE(
  id uuid,
  name text,
  price numeric,
  discount numeric,
  image_url text,
  rating numeric,
  stock integer,
  inventory integer,
  vendor_name text,
  vendor_logo_url text,
  vendor_slug text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _category_id uuid;
BEGIN
  -- Get the category_id of the current product (which should be a child category)
  SELECT p.category_id INTO _category_id
  FROM products p
  WHERE p.id = _product_id;

  IF _category_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(p.stock, 0)::integer as stock,
    COALESCE(p.inventory, 0)::integer as inventory,
    v.name as vendor_name,
    v.logo_url as vendor_logo_url,
    v.slug as vendor_slug
  FROM products p
  LEFT JOIN vendors v ON v.id = p.vendor_id AND v.status = 'active'
  WHERE p.category_id = _category_id
    AND p.id != _product_id
    AND COALESCE(p.status, 'active') IN ('active', 'approved')
  ORDER BY p.rating DESC NULLS LAST, p.created_at DESC
  LIMIT _limit;
END;
$$;

-- Recreate get_last_viewed_products with stock/inventory columns
CREATE OR REPLACE FUNCTION public.get_last_viewed_products(
  _user_id uuid,
  _limit integer DEFAULT 8,
  _vendor_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  price numeric,
  discount numeric,
  image_url text,
  rating numeric,
  stock integer,
  inventory integer,
  vendor_name text,
  vendor_logo_url text,
  vendor_slug text
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
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(p.stock, 0)::integer as stock,
    COALESCE(p.inventory, 0)::integer as inventory,
    v.name as vendor_name,
    v.logo_url as vendor_logo_url,
    v.slug as vendor_slug
  FROM product_views pv
  INNER JOIN products p ON p.id = pv.product_id
  LEFT JOIN vendors v ON v.id = p.vendor_id AND v.status = 'active'
  WHERE pv.user_id = _user_id
    AND COALESCE(p.status, 'active') IN ('active', 'approved')
    AND (_vendor_id IS NULL OR p.vendor_id = _vendor_id)
  ORDER BY pv.viewed_at DESC
  LIMIT _limit;
END;
$$;

-- Recreate get_vendor_more_products with stock/inventory columns
CREATE OR REPLACE FUNCTION public.get_vendor_more_products(
  _product_id uuid,
  _vendor_id uuid,
  _limit integer DEFAULT 8
)
RETURNS TABLE(
  id uuid,
  name text,
  price numeric,
  discount numeric,
  image_url text,
  rating numeric,
  stock integer,
  inventory integer,
  vendor_name text,
  vendor_logo_url text,
  vendor_slug text
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
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(p.stock, 0)::integer as stock,
    COALESCE(p.inventory, 0)::integer as inventory,
    v.name as vendor_name,
    v.logo_url as vendor_logo_url,
    v.slug as vendor_slug
  FROM products p
  LEFT JOIN vendors v ON v.id = p.vendor_id AND v.status = 'active'
  WHERE p.vendor_id = _vendor_id
    AND p.id != _product_id
    AND COALESCE(p.status, 'active') IN ('active', 'approved')
  ORDER BY p.rating DESC NULLS LAST, p.created_at DESC
  LIMIT _limit;
END;
$$;

-- Recreate get_section_products with stock/inventory columns
CREATE OR REPLACE FUNCTION public.get_section_products(
  _section_id uuid,
  _limit integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  name text,
  price numeric,
  discount numeric,
  image_url text,
  rating numeric,
  stock integer,
  inventory integer,
  sort_order integer,
  vendor_name text,
  vendor_logo_url text,
  vendor_slug text
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
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(p.stock, 0)::integer as stock,
    COALESCE(p.inventory, 0)::integer as inventory,
    sp.sort_order,
    v.name as vendor_name,
    v.logo_url as vendor_logo_url,
    v.slug as vendor_slug
  FROM section_products sp
  INNER JOIN products p ON p.id = sp.product_id
  LEFT JOIN vendors v ON v.id = p.vendor_id AND v.status = 'active'
  WHERE sp.section_id = _section_id
    AND COALESCE(p.status, 'active') IN ('active', 'approved')
  ORDER BY sp.sort_order ASC
  LIMIT _limit;
END;
$$;

-- Recreate get_best_seller_products with stock/inventory columns
CREATE OR REPLACE FUNCTION public.get_best_seller_products(
  _limit integer DEFAULT 20,
  _vendor_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  price numeric,
  discount numeric,
  image_url text,
  rating numeric,
  stock integer,
  inventory integer,
  vendor_name text,
  vendor_logo_url text,
  vendor_slug text
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
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(p.stock, 0)::integer as stock,
    COALESCE(p.inventory, 0)::integer as inventory,
    v.name as vendor_name,
    v.logo_url as vendor_logo_url,
    v.slug as vendor_slug
  FROM products p
  LEFT JOIN vendors v ON v.id = p.vendor_id AND v.status = 'active'
  WHERE p.is_best_seller = true
    AND COALESCE(p.status, 'active') IN ('active', 'approved')
    AND (_vendor_id IS NULL OR p.vendor_id = _vendor_id)
  ORDER BY p.rating DESC NULLS LAST, p.created_at DESC
  LIMIT _limit;
END;
$$;

-- Recreate get_hot_deals_products with stock/inventory columns
CREATE OR REPLACE FUNCTION public.get_hot_deals_products(
  _limit integer DEFAULT 20,
  _vendor_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  price numeric,
  discount numeric,
  image_url text,
  rating numeric,
  stock integer,
  inventory integer,
  vendor_name text,
  vendor_logo_url text,
  vendor_slug text
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
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(p.stock, 0)::integer as stock,
    COALESCE(p.inventory, 0)::integer as inventory,
    v.name as vendor_name,
    v.logo_url as vendor_logo_url,
    v.slug as vendor_slug
  FROM products p
  LEFT JOIN vendors v ON v.id = p.vendor_id AND v.status = 'active'
  WHERE (p.is_hot_deal = true OR (p.discount IS NOT NULL AND p.discount > 0))
    AND COALESCE(p.status, 'active') IN ('active', 'approved')
    AND (_vendor_id IS NULL OR p.vendor_id = _vendor_id)
  ORDER BY p.discount DESC NULLS LAST, p.created_at DESC
  LIMIT _limit;
END;
$$;

-- Create new function to get products by category (for similar products page)
CREATE OR REPLACE FUNCTION public.get_products_by_category(
  _category_id uuid,
  _exclude_product_id uuid DEFAULT NULL,
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  price numeric,
  discount numeric,
  image_url text,
  rating numeric,
  stock integer,
  inventory integer,
  vendor_name text,
  vendor_logo_url text,
  vendor_slug text
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
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(p.stock, 0)::integer as stock,
    COALESCE(p.inventory, 0)::integer as inventory,
    v.name as vendor_name,
    v.logo_url as vendor_logo_url,
    v.slug as vendor_slug
  FROM products p
  LEFT JOIN vendors v ON v.id = p.vendor_id AND v.status = 'active'
  WHERE p.category_id = _category_id
    AND (_exclude_product_id IS NULL OR p.id != _exclude_product_id)
    AND COALESCE(p.status, 'active') IN ('active', 'approved')
  ORDER BY p.rating DESC NULLS LAST, p.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;
