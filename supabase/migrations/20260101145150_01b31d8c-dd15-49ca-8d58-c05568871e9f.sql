-- Fix get_vendor_products (using vendor_profiles and user_id)
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
      (_vendor_id IS NULL AND p.vendor_id IN (SELECT v.id FROM vendor_profiles v WHERE v.user_id = auth.uid()))
      OR
      (_vendor_id IS NOT NULL AND p.vendor_id = _vendor_id)
      OR
      is_admin(auth.uid())
    )
    AND 
    (_status_filter = 'all' OR p.status = _status_filter);
$$;

-- Fix get_vendor_orders
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
    SELECT v.id INTO effective_vendor_id
    FROM vendor_profiles v
    WHERE v.user_id = auth.uid()
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

-- Fix get_vendor_order_items
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
  effective_vendor_id uuid;
BEGIN
  IF is_admin(auth.uid()) THEN
    effective_vendor_id := _vendor_id;
  ELSE
    SELECT v.id INTO effective_vendor_id
    FROM vendor_profiles v
    WHERE v.user_id = auth.uid()
    LIMIT 1;
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
  FROM public.order_items oi
  WHERE oi.order_id = _order_id
    AND (effective_vendor_id IS NULL OR oi.vendor_id = effective_vendor_id)
  ORDER BY oi.created_at;
END;
$$;

-- Fix update_order_item_status
CREATE OR REPLACE FUNCTION public.update_order_item_status(
  _item_id uuid,
  _new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _new_status NOT IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
    
  IF NOT is_admin(auth.uid()) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.vendor_profiles v ON v.id = oi.vendor_id
      WHERE oi.id = _item_id AND v.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;
    
  UPDATE public.order_items
  SET status = _new_status, updated_at = now()
  WHERE id = _item_id;
    
  RETURN FOUND;
END;
$$;