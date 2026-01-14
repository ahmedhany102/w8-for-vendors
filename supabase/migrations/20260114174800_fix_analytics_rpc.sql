-- Fix: get_vendor_analytics to work with vendor_profiles and use orders.created_at for date filtering
-- Issues fixed:
-- 1. Use vendor_profiles as fallback when vendors table doesn't have the record
-- 2. Use orders.created_at instead of order_items.created_at for date filtering
-- 3. Handle legacy order_items.vendor_id = user_id pattern

DROP FUNCTION IF EXISTS public.get_vendor_analytics(uuid);

CREATE OR REPLACE FUNCTION public.get_vendor_analytics(_vendor_id uuid DEFAULT NULL)
RETURNS TABLE (
  vendor_id uuid,
  vendor_name text,
  commission_rate numeric,
  total_orders bigint,
  total_revenue numeric,
  today_revenue numeric,
  week_revenue numeric,
  month_revenue numeric,
  platform_commission numeric,
  vendor_payout numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_vendor_id uuid;
  v_user_id uuid;
  v_vendor_name text;
  v_commission_rate numeric;
  v_has_vendors_record boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Determine effective vendor ID
  IF is_admin(auth.uid()) AND _vendor_id IS NOT NULL THEN
    v_effective_vendor_id := _vendor_id;
    
    -- Check if it's a vendors.id or vendor_profiles.id
    SELECT v.id, v.name, COALESCE(v.commission_rate, 10) INTO v_effective_vendor_id, v_vendor_name, v_commission_rate
    FROM vendors v WHERE v.id = _vendor_id;
    
    IF v_effective_vendor_id IS NOT NULL THEN
      v_has_vendors_record := true;
    ELSE
      -- Try vendor_profiles
      SELECT vp.user_id, vp.store_name, COALESCE(vp.commission_rate, 10) INTO v_user_id, v_vendor_name, v_commission_rate
      FROM vendor_profiles vp WHERE vp.id = _vendor_id;
      
      v_effective_vendor_id := v_user_id;
    END IF;
  ELSIF is_admin(auth.uid()) AND _vendor_id IS NULL THEN
    -- Admin wants all vendors - handled separately below
    NULL;
  ELSE
    -- Regular vendor: find their ID
    SELECT v.id INTO v_effective_vendor_id
    FROM vendors v WHERE v.owner_id = auth.uid();
    
    IF v_effective_vendor_id IS NOT NULL THEN
      v_has_vendors_record := true;
      SELECT v.name, COALESCE(v.commission_rate, 10) INTO v_vendor_name, v_commission_rate
      FROM vendors v WHERE v.id = v_effective_vendor_id;
    ELSE
      -- Fallback to vendor_profiles
      SELECT vp.user_id, vp.store_name, COALESCE(vp.commission_rate, 15) INTO v_user_id, v_vendor_name, v_commission_rate
      FROM vendor_profiles vp WHERE vp.user_id = auth.uid() AND vp.status = 'approved';
      
      v_effective_vendor_id := v_user_id;
    END IF;
  END IF;

  -- If admin with no filter, return all vendors
  IF is_admin(auth.uid()) AND _vendor_id IS NULL THEN
    RETURN QUERY
    WITH vendor_list AS (
      -- Get all vendors from vendors table
      SELECT v.id as vid, v.owner_id, v.name as vname, COALESCE(v.commission_rate, 10) as comm, true as from_vendors
      FROM vendors v WHERE v.status = 'active'
      UNION
      -- Get vendors only in vendor_profiles (not in vendors table)
      SELECT vp.user_id as vid, vp.user_id, vp.store_name as vname, COALESCE(vp.commission_rate, 15) as comm, false as from_vendors
      FROM vendor_profiles vp 
      WHERE vp.status = 'approved'
        AND NOT EXISTS (SELECT 1 FROM vendors v WHERE v.owner_id = vp.user_id)
    ),
    order_stats AS (
      SELECT 
        oi.vendor_id as v_id,
        COUNT(DISTINCT oi.order_id) AS total_orders,
        COALESCE(SUM(oi.total_price), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN oi.total_price ELSE 0 END), 0) AS today_rev,
        COALESCE(SUM(CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN oi.total_price ELSE 0 END), 0) AS week_rev,
        COALESCE(SUM(CASE WHEN o.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN oi.total_price ELSE 0 END), 0) AS month_rev
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.vendor_id IS NOT NULL
        AND oi.status NOT IN ('cancelled', 'refunded')
      GROUP BY oi.vendor_id
    )
    SELECT 
      vl.vid AS vendor_id,
      vl.vname AS vendor_name,
      vl.comm AS commission_rate,
      COALESCE(os.total_orders, 0)::bigint AS total_orders,
      COALESCE(os.total_revenue, 0) AS total_revenue,
      COALESCE(os.today_rev, 0) AS today_revenue,
      COALESCE(os.week_rev, 0) AS week_revenue,
      COALESCE(os.month_rev, 0) AS month_revenue,
      ROUND(COALESCE(os.total_revenue, 0) * vl.comm / 100, 2) AS platform_commission,
      ROUND(COALESCE(os.total_revenue, 0) * (100 - vl.comm) / 100, 2) AS vendor_payout
    FROM vendor_list vl
    LEFT JOIN order_stats os ON (vl.from_vendors AND os.v_id = vl.vid) OR (NOT vl.from_vendors AND os.v_id = vl.owner_id)
    ORDER BY COALESCE(os.total_revenue, 0) DESC;
    RETURN;
  END IF;

  -- Single vendor query
  IF v_effective_vendor_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH order_stats AS (
    SELECT 
      COUNT(DISTINCT oi.order_id) AS total_orders,
      COALESCE(SUM(oi.total_price), 0) AS total_revenue,
      COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN oi.total_price ELSE 0 END), 0) AS today_rev,
      COALESCE(SUM(CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN oi.total_price ELSE 0 END), 0) AS week_rev,
      COALESCE(SUM(CASE WHEN o.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN oi.total_price ELSE 0 END), 0) AS month_rev
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.vendor_id = v_effective_vendor_id
      AND oi.status NOT IN ('cancelled', 'refunded')
  )
  SELECT 
    v_effective_vendor_id AS vendor_id,
    COALESCE(v_vendor_name, 'Unknown') AS vendor_name,
    COALESCE(v_commission_rate, 10) AS commission_rate,
    COALESCE(os.total_orders, 0)::bigint AS total_orders,
    COALESCE(os.total_revenue, 0) AS total_revenue,
    COALESCE(os.today_rev, 0) AS today_revenue,
    COALESCE(os.week_rev, 0) AS week_revenue,
    COALESCE(os.month_rev, 0) AS month_revenue,
    ROUND(COALESCE(os.total_revenue, 0) * COALESCE(v_commission_rate, 10) / 100, 2) AS platform_commission,
    ROUND(COALESCE(os.total_revenue, 0) * (100 - COALESCE(v_commission_rate, 10)) / 100, 2) AS vendor_payout
  FROM order_stats os;
END;
$$;

-- Also fix get_vendor_top_products to handle vendor_profiles fallback
DROP FUNCTION IF EXISTS public.get_vendor_top_products(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_vendor_top_products(_vendor_id uuid, _limit integer DEFAULT 5)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  total_sold bigint,
  total_revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_vendor_id uuid;
BEGIN
  -- For vendors not in vendors table, _vendor_id might be user_id
  -- Check vendors table first
  IF EXISTS (SELECT 1 FROM vendors WHERE id = _vendor_id) THEN
    v_effective_vendor_id := _vendor_id;
  ELSE
    -- Might be a user_id from vendor_profiles
    v_effective_vendor_id := _vendor_id;
  END IF;

  RETURN QUERY
  SELECT 
    oi.product_id,
    oi.product_name,
    SUM(oi.quantity)::bigint AS total_sold,
    SUM(oi.total_price) AS total_revenue
  FROM order_items oi
  WHERE oi.vendor_id = v_effective_vendor_id
    AND oi.status NOT IN ('cancelled', 'refunded')
  GROUP BY oi.product_id, oi.product_name
  ORDER BY total_revenue DESC
  LIMIT _limit;
END;
$$;

-- Create platform analytics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_platform_analytics()
RETURNS TABLE (
  total_revenue numeric,
  today_revenue numeric,
  week_revenue numeric,
  month_revenue numeric,
  total_orders bigint,
  active_vendors bigint,
  total_platform_earnings numeric,
  total_vendor_payouts numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  WITH order_totals AS (
    SELECT 
      COALESCE(SUM(oi.total_price), 0) AS total_rev,
      COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN oi.total_price ELSE 0 END), 0) AS today_rev,
      COALESCE(SUM(CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN oi.total_price ELSE 0 END), 0) AS week_rev,
      COALESCE(SUM(CASE WHEN o.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN oi.total_price ELSE 0 END), 0) AS month_rev,
      COUNT(DISTINCT o.id) AS total_ord
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE oi.status NOT IN ('cancelled', 'refunded')
  ),
  vendor_count AS (
    SELECT COUNT(*) as cnt FROM (
      SELECT id FROM vendors WHERE status = 'active'
      UNION
      SELECT user_id FROM vendor_profiles WHERE status = 'approved' 
        AND NOT EXISTS (SELECT 1 FROM vendors v WHERE v.owner_id = vendor_profiles.user_id)
    ) all_vendors
  ),
  commission_totals AS (
    SELECT 
      COALESCE(SUM(oi.total_price * COALESCE(
        (SELECT commission_rate FROM vendors WHERE id = oi.vendor_id),
        (SELECT commission_rate FROM vendor_profiles WHERE user_id = oi.vendor_id),
        10
      ) / 100), 0) AS platform_earnings
    FROM order_items oi
    WHERE oi.status NOT IN ('cancelled', 'refunded')
  )
  SELECT 
    ot.total_rev AS total_revenue,
    ot.today_rev AS today_revenue,
    ot.week_rev AS week_revenue,
    ot.month_rev AS month_revenue,
    ot.total_ord AS total_orders,
    vc.cnt AS active_vendors,
    ct.platform_earnings AS total_platform_earnings,
    (ot.total_rev - ct.platform_earnings) AS total_vendor_payouts
  FROM order_totals ot, vendor_count vc, commission_totals ct;
END;
$$;
