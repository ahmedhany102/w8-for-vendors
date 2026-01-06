-- Unify vendor identity to vendors.id across products + order_items,
-- fix vendor order visibility + status updates, and expose vendor-safe order details.

BEGIN;

-- 1) Backfill products.vendor_id for legacy rows (vendor products created before vendor_id linkage)
UPDATE public.products p
SET vendor_id = v.id
FROM public.vendors v
WHERE p.vendor_id IS NULL
  AND p.user_id IS NOT NULL
  AND v.owner_id = p.user_id;

-- 2) Backfill order_items.vendor_id from legacy user_id -> vendors.id
-- Only convert when vendor_id currently matches a vendors.owner_id and is NOT already a vendors.id.
UPDATE public.order_items oi
SET vendor_id = v.id
FROM public.vendors v
WHERE oi.vendor_id IS NOT NULL
  AND v.owner_id = oi.vendor_id
  AND NOT EXISTS (
    SELECT 1 FROM public.vendors v2 WHERE v2.id = oi.vendor_id
  );

-- 3) RLS: Vendors should be authorized by vendors.owner_id, not by comparing vendor_id to auth.uid().
DROP POLICY IF EXISTS "Vendors can update their order item status" ON public.order_items;
DROP POLICY IF EXISTS "Vendors can view their order items" ON public.order_items;

CREATE POLICY "Vendors can update their order item status"
ON public.order_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.vendors v
    WHERE v.id = public.order_items.vendor_id
      AND v.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.vendors v
    WHERE v.id = public.order_items.vendor_id
      AND v.owner_id = auth.uid()
  )
);

CREATE POLICY "Vendors can view their order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.vendors v
    WHERE v.id = public.order_items.vendor_id
      AND v.owner_id = auth.uid()
  )
);

-- 4) Fix RPC: vendor can update their own items (now vendor_id is vendors.id)
CREATE OR REPLACE FUNCTION public.update_order_item_status(_item_id uuid, _new_status text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _new_status NOT IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  IF NOT is_admin(auth.uid()) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.order_items oi
      JOIN public.vendors v ON v.id = oi.vendor_id
      WHERE oi.id = _item_id
        AND v.owner_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  UPDATE public.order_items
  SET status = _new_status, updated_at = now()
  WHERE id = _item_id;

  RETURN FOUND;
END;
$function$;

-- 5) Fix RPC: vendor order list (vendors.id is the only vendor identifier)
CREATE OR REPLACE FUNCTION public.get_vendor_orders(_vendor_id uuid DEFAULT NULL::uuid, _status_filter text DEFAULT 'all'::text)
 RETURNS TABLE(order_id uuid, order_number text, order_status text, order_date timestamp with time zone, customer_name text, customer_email text, customer_phone text, item_count bigint, vendor_total numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  effective_vendor_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF is_admin(auth.uid()) AND _vendor_id IS NOT NULL THEN
    effective_vendor_id := _vendor_id;
  ELSIF is_admin(auth.uid()) AND _vendor_id IS NULL THEN
    effective_vendor_id := NULL;
  ELSE
    SELECT v.id INTO effective_vendor_id
    FROM public.vendors v
    WHERE v.owner_id = auth.uid()
    LIMIT 1;

    IF effective_vendor_id IS NULL THEN
      RETURN;
    END IF;
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
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  WHERE
    (effective_vendor_id IS NULL OR oi.vendor_id = effective_vendor_id)
    AND (_status_filter IS NULL OR _status_filter = 'all' OR o.status = _status_filter)
  GROUP BY o.id, o.order_number, o.status, o.created_at, o.customer_info
  ORDER BY o.created_at DESC;
END;
$function$;

-- 6) Fix RPC: vendor order items list (vendors.id)
CREATE OR REPLACE FUNCTION public.get_vendor_order_items(_order_id uuid, _vendor_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(item_id uuid, product_id uuid, product_name text, product_image text, quantity integer, unit_price numeric, total_price numeric, size text, color text, item_status text, vendor_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  effective_vendor_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF is_admin(auth.uid()) AND _vendor_id IS NOT NULL THEN
    effective_vendor_id := _vendor_id;
  ELSIF is_admin(auth.uid()) AND _vendor_id IS NULL THEN
    effective_vendor_id := NULL;
  ELSE
    SELECT v.id INTO effective_vendor_id
    FROM public.vendors v
    WHERE v.owner_id = auth.uid()
    LIMIT 1;

    IF effective_vendor_id IS NULL THEN
      RETURN;
    END IF;
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
  WHERE
    oi.order_id = _order_id
    AND (effective_vendor_id IS NULL OR oi.vendor_id = effective_vendor_id);
END;
$function$;

-- 7) Vendor-safe order header/details (address, payment method/status, etc.)
CREATE OR REPLACE FUNCTION public.get_vendor_order_info(_order_id uuid)
 RETURNS TABLE(order_id uuid, order_number text, order_status text, payment_status text, order_date timestamp with time zone, total_amount numeric, customer_info jsonb, payment_info jsonb, coupon_info jsonb, notes text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  effective_vendor_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF is_admin(auth.uid()) THEN
    RETURN QUERY
    SELECT
      o.id,
      o.order_number,
      o.status,
      o.payment_status,
      o.created_at,
      o.total_amount,
      o.customer_info,
      o.payment_info,
      o.coupon_info,
      o.notes
    FROM public.orders o
    WHERE o.id = _order_id;
    RETURN;
  END IF;

  SELECT v.id INTO effective_vendor_id
  FROM public.vendors v
  WHERE v.owner_id = auth.uid()
  LIMIT 1;

  IF effective_vendor_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.order_items oi
    WHERE oi.order_id = _order_id
      AND oi.vendor_id = effective_vendor_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    o.status,
    o.payment_status,
    o.created_at,
    o.total_amount,
    o.customer_info,
    o.payment_info,
    o.coupon_info,
    o.notes
  FROM public.orders o
  WHERE o.id = _order_id;
END;
$function$;

COMMIT;