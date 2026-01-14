-- Fix: get_vendor_orders to work with vendor_profiles when vendors table is empty
-- The issue is that vendors table may not be populated but vendor_profiles is

-- First, drop existing function to change signature cleanly
DROP FUNCTION IF EXISTS public.get_vendor_orders(uuid, text);

CREATE OR REPLACE FUNCTION public.get_vendor_orders(
  _vendor_id uuid DEFAULT NULL,
  _status_filter text DEFAULT 'all'
)
RETURNS TABLE (
  order_id uuid, 
  order_number text, 
  order_status text, 
  payment_status text,
  order_date timestamp with time zone, 
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
  v_user_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- For admins, use the passed vendor_id (or null for all)
  IF is_admin(auth.uid()) THEN
    IF _vendor_id IS NOT NULL THEN
      effective_vendor_id := _vendor_id;
    ELSE
      -- Admin without filter: return all orders
      RETURN QUERY
      SELECT
        o.id AS order_id,
        o.order_number,
        o.status AS order_status,
        COALESCE(o.payment_status, 'pending') AS payment_status,
        o.created_at AS order_date,
        (o.customer_info->>'name')::text AS customer_name,
        (o.customer_info->>'email')::text AS customer_email,
        (o.customer_info->>'phone')::text AS customer_phone,
        COUNT(oi.id) AS item_count,
        COALESCE(SUM(oi.total_price), 0) AS vendor_total
      FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      WHERE (_status_filter IS NULL OR _status_filter = 'all' OR LOWER(o.status) = LOWER(_status_filter))
      GROUP BY o.id, o.order_number, o.status, o.payment_status, o.created_at, o.customer_info
      ORDER BY o.created_at DESC;
      RETURN;
    END IF;
  ELSE
    -- For vendors: Try to find vendor from vendors table first, then fall back to vendor_profiles
    SELECT v.id INTO effective_vendor_id
    FROM public.vendors v
    WHERE v.owner_id = auth.uid()
    LIMIT 1;
    
    -- If not found in vendors table, check if user has vendor_profiles and find orders by user_id in order_items
    IF effective_vendor_id IS NULL THEN
      -- Check if user is an approved vendor
      IF EXISTS (
        SELECT 1 FROM public.vendor_profiles vp 
        WHERE vp.user_id = auth.uid() 
        AND vp.status = 'approved'
      ) THEN
        v_user_id := auth.uid();
        
        -- Return orders where order_items.vendor_id = user_id (legacy behavior)
        RETURN QUERY
        SELECT
          o.id AS order_id,
          o.order_number,
          o.status AS order_status,
          COALESCE(o.payment_status, 'pending') AS payment_status,
          o.created_at AS order_date,
          (o.customer_info->>'name')::text AS customer_name,
          (o.customer_info->>'email')::text AS customer_email,
          (o.customer_info->>'phone')::text AS customer_phone,
          COUNT(oi.id) AS item_count,
          COALESCE(SUM(oi.total_price), 0) AS vendor_total
        FROM public.orders o
        JOIN public.order_items oi ON oi.order_id = o.id
        WHERE oi.vendor_id = v_user_id
          AND (_status_filter IS NULL OR _status_filter = 'all' OR LOWER(o.status) = LOWER(_status_filter))
        GROUP BY o.id, o.order_number, o.status, o.payment_status, o.created_at, o.customer_info
        ORDER BY o.created_at DESC;
        RETURN;
      END IF;
      
      -- No vendor found at all
      RETURN;
    END IF;
  END IF;

  -- Standard query using vendors.id
  RETURN QUERY
  SELECT
    o.id AS order_id,
    o.order_number,
    o.status AS order_status,
    COALESCE(o.payment_status, 'pending') AS payment_status,
    o.created_at AS order_date,
    (o.customer_info->>'name')::text AS customer_name,
    (o.customer_info->>'email')::text AS customer_email,
    (o.customer_info->>'phone')::text AS customer_phone,
    COUNT(oi.id) AS item_count,
    COALESCE(SUM(oi.total_price), 0) AS vendor_total
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  WHERE oi.vendor_id = effective_vendor_id
    AND (_status_filter IS NULL OR _status_filter = 'all' OR LOWER(o.status) = LOWER(_status_filter))
  GROUP BY o.id, o.order_number, o.status, o.payment_status, o.created_at, o.customer_info
  ORDER BY o.created_at DESC;
END;
$$;

-- Also fix get_vendor_order_items to handle legacy user_id vendor_id
DROP FUNCTION IF EXISTS public.get_vendor_order_items(uuid, uuid);

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
  v_user_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF is_admin(auth.uid()) THEN
    -- Admin can see all (when _vendor_id is null) or filter
    effective_vendor_id := _vendor_id;
    
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
      AND (effective_vendor_id IS NULL OR oi.vendor_id = effective_vendor_id);
    RETURN;
  END IF;
  
  -- For vendors: Try vendors table first
  SELECT v.id INTO effective_vendor_id
  FROM public.vendors v
  WHERE v.owner_id = auth.uid()
  LIMIT 1;
  
  -- Fallback to user_id if no vendors record
  IF effective_vendor_id IS NULL THEN
    v_user_id := auth.uid();
    
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
      AND oi.vendor_id = v_user_id;
    RETURN;
  END IF;
  
  -- Standard query using vendors.id
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
    AND oi.vendor_id = effective_vendor_id;
END;
$$;
