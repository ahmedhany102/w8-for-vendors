
-- FIX: get_vendor_orders must handle the fact that order_items.vendor_id stores user_id, not vendors.id
-- We need to match via vendors.owner_id since order_items.vendor_id = user_id = vendors.owner_id

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
  effective_user_id uuid;
BEGIN
  IF is_admin(auth.uid()) AND _vendor_id IS NOT NULL THEN
    -- Admin provided a specific vendor_id (which is vendors.id), get the owner_id
    SELECT v.owner_id INTO effective_user_id
    FROM vendors v
    WHERE v.id = _vendor_id
    LIMIT 1;
  ELSIF is_admin(auth.uid()) AND _vendor_id IS NULL THEN
    -- Admin with no filter sees all
    effective_user_id := NULL;
  ELSE
    -- Regular vendor uses their own user_id (since order_items.vendor_id = user_id)
    effective_user_id := auth.uid();
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
    (effective_user_id IS NULL OR oi.vendor_id = effective_user_id)
    AND (_status_filter IS NULL OR _status_filter = 'all' OR o.status = _status_filter)
  GROUP BY o.id, o.order_number, o.status, o.created_at, o.customer_info
  ORDER BY o.created_at DESC;
END;
$$;

-- FIX: get_vendor_order_items - same issue, order_items.vendor_id = user_id
CREATE OR REPLACE FUNCTION public.get_vendor_order_items(
  _order_id uuid,
  _vendor_id uuid DEFAULT NULL
)
RETURNS TABLE(
  item_id uuid,
  product_id uuid,
  product_name text,
  product_image text,
  quantity integer,
  unit_price numeric,
  total_price numeric,
  size text,
  color text,
  item_status text,
  vendor_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  effective_user_id uuid;
BEGIN
  IF is_admin(auth.uid()) AND _vendor_id IS NOT NULL THEN
    -- Admin provided a vendor_id (vendors.id), convert to owner_id
    SELECT v.owner_id INTO effective_user_id
    FROM vendors v
    WHERE v.id = _vendor_id
    LIMIT 1;
  ELSIF is_admin(auth.uid()) AND _vendor_id IS NULL THEN
    -- Admin with no filter sees all items
    effective_user_id := NULL;
  ELSE
    -- Vendor sees only their items (order_items.vendor_id = user_id)
    effective_user_id := auth.uid();
  END IF;

  RETURN QUERY
  SELECT 
    oi.id AS item_id,
    oi.product_id,
    oi.product_name,
    oi.product_image,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    oi.size,
    oi.color,
    oi.status AS item_status,
    oi.vendor_id
  FROM order_items oi
  WHERE 
    oi.order_id = _order_id
    AND (effective_user_id IS NULL OR oi.vendor_id = effective_user_id);
END;
$$;

-- FIX: get_vendor_products - must check BOTH vendor_id (vendors.id from new products) AND user_id (for ownership)
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
      -- When no vendor_id provided, get current user's products
      (_vendor_id IS NULL AND (
        -- Match by user_id (product owner)
        p.user_id = auth.uid()
        OR
        -- OR match by vendor_id through vendors table
        p.vendor_id IN (SELECT v.id FROM vendors v WHERE v.owner_id = auth.uid())
      ))
      OR
      -- When vendor_id provided (admin use case), filter by it
      (_vendor_id IS NOT NULL AND p.vendor_id = _vendor_id)
      OR
      -- Admins can see all if no filter
      (is_admin(auth.uid()) AND _vendor_id IS NULL)
    )
    AND 
    (_status_filter = 'all' OR p.status = _status_filter)
  ORDER BY p.created_at DESC;
$$;
