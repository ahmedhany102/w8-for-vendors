
-- Fix get_vendor_products to use vendors table (not vendor_profiles)
CREATE OR REPLACE FUNCTION public.get_vendor_products(
  _vendor_id uuid DEFAULT NULL,
  _status_filter text DEFAULT 'all'
)
RETURNS SETOF products
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM products p
  WHERE 
    (
      -- When no vendor_id provided, get current user's vendor products
      (_vendor_id IS NULL AND p.vendor_id IN (
        SELECT v.id FROM vendors v WHERE v.owner_id = auth.uid()
      ))
      OR
      -- When vendor_id provided, filter by it
      (_vendor_id IS NOT NULL AND p.vendor_id = _vendor_id)
      OR
      -- Admins can see all
      is_admin(auth.uid())
    )
    AND 
    (_status_filter = 'all' OR p.status = _status_filter);
$$;

-- Fix get_vendor_orders to use vendors table (not vendor_profiles)
CREATE OR REPLACE FUNCTION public.get_vendor_orders(
  _vendor_id uuid DEFAULT NULL,
  _status_filter text DEFAULT 'all'
)
RETURNS TABLE(
  order_id uuid,
  order_number text,
  order_status text,
  order_date timestamptz,
  customer_name text,
  customer_email text,
  customer_phone text,
  item_count bigint,
  vendor_total numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  effective_vendor_id uuid;
BEGIN
  IF is_admin(auth.uid()) THEN
    effective_vendor_id := _vendor_id;
  ELSE
    -- Get vendor id from vendors table using owner_id
    SELECT v.id INTO effective_vendor_id
    FROM vendors v
    WHERE v.owner_id = auth.uid()
    LIMIT 1;
  END IF;

  RETURN QUERY
  SELECT 
    o.id AS order_id,
    o.order_number,
    o.status AS order_status,
    o.created_at AS order_date,
    (o.customer_info->>'name')::text AS customer_name,
    (o.customer_info->>'email')::text AS customer_email,
    (o.customer_info->>'phone')::text AS customer_phone,
    COUNT(oi.id) AS item_count,
    COALESCE(SUM(oi.total_price), 0) AS vendor_total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE 
    (effective_vendor_id IS NULL OR oi.vendor_id = effective_vendor_id)
    AND (_status_filter IS NULL OR _status_filter = 'all' OR o.status = _status_filter)
  GROUP BY o.id, o.order_number, o.status, o.created_at, o.customer_info
  ORDER BY o.created_at DESC;
END;
$$;

-- Fix get_active_vendors to prioritize vendor_profiles images (where they're actually stored)
CREATE OR REPLACE FUNCTION public.get_active_vendors()
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  logo_url text,
  cover_url text,
  status text,
  product_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    v.id,
    v.name,
    v.slug,
    COALESCE(vp.logo_url, v.logo_url) as logo_url,
    COALESCE(vp.cover_url, v.cover_url) as cover_url,
    v.status,
    (SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id AND p.status IN ('active', 'approved')) as product_count
  FROM vendors v
  LEFT JOIN vendor_profiles vp ON vp.user_id = v.owner_id
  WHERE v.status = 'active'
  ORDER BY v.created_at DESC;
$$;
