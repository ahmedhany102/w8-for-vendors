-- Add commission_rate column to vendors table for per-vendor commission tracking
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 10 CHECK (commission_rate >= 0 AND commission_rate <= 100);

-- Add commission_rate column to vendor_profiles for consistency
ALTER TABLE public.vendor_profiles
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 10 CHECK (commission_rate >= 0 AND commission_rate <= 100);

-- Create function to get vendor revenue analytics
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
BEGIN
  RETURN QUERY
  WITH order_stats AS (
    SELECT 
      oi.vendor_id,
      COUNT(DISTINCT oi.order_id) AS total_orders,
      COALESCE(SUM(oi.total_price), 0) AS total_revenue,
      COALESCE(SUM(CASE WHEN DATE(oi.created_at) = CURRENT_DATE THEN oi.total_price ELSE 0 END), 0) AS today_revenue,
      COALESCE(SUM(CASE WHEN oi.created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN oi.total_price ELSE 0 END), 0) AS week_revenue,
      COALESCE(SUM(CASE WHEN oi.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN oi.total_price ELSE 0 END), 0) AS month_revenue
    FROM order_items oi
    WHERE oi.vendor_id IS NOT NULL
      AND oi.status NOT IN ('cancelled', 'refunded')
      AND (_vendor_id IS NULL OR oi.vendor_id = _vendor_id)
    GROUP BY oi.vendor_id
  )
  SELECT 
    v.id AS vendor_id,
    v.name AS vendor_name,
    COALESCE(v.commission_rate, 10) AS commission_rate,
    COALESCE(os.total_orders, 0)::bigint AS total_orders,
    COALESCE(os.total_revenue, 0) AS total_revenue,
    COALESCE(os.today_revenue, 0) AS today_revenue,
    COALESCE(os.week_revenue, 0) AS week_revenue,
    COALESCE(os.month_revenue, 0) AS month_revenue,
    ROUND(COALESCE(os.total_revenue, 0) * COALESCE(v.commission_rate, 10) / 100, 2) AS platform_commission,
    ROUND(COALESCE(os.total_revenue, 0) * (100 - COALESCE(v.commission_rate, 10)) / 100, 2) AS vendor_payout
  FROM vendors v
  LEFT JOIN order_stats os ON v.id = os.vendor_id
  WHERE v.status = 'active'
    AND (_vendor_id IS NULL OR v.id = _vendor_id)
  ORDER BY COALESCE(os.total_revenue, 0) DESC;
END;
$$;

-- Create function to update vendor commission rate
CREATE OR REPLACE FUNCTION public.update_vendor_commission(_vendor_id uuid, _commission_rate numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can update commission rates
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can update commission rates';
  END IF;
  
  -- Validate commission rate
  IF _commission_rate < 0 OR _commission_rate > 100 THEN
    RAISE EXCEPTION 'Commission rate must be between 0 and 100';
  END IF;
  
  UPDATE vendors
  SET commission_rate = _commission_rate,
      updated_at = now()
  WHERE id = _vendor_id;
  
  -- Also update vendor_profiles if exists
  UPDATE vendor_profiles
  SET commission_rate = _commission_rate,
      updated_at = now()
  WHERE user_id = (SELECT owner_id FROM vendors WHERE id = _vendor_id);
  
  RETURN FOUND;
END;
$$;

-- Create function to get top selling products per vendor
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
BEGIN
  RETURN QUERY
  SELECT 
    oi.product_id,
    oi.product_name,
    SUM(oi.quantity)::bigint AS total_sold,
    SUM(oi.total_price) AS total_revenue
  FROM order_items oi
  WHERE oi.vendor_id = _vendor_id
    AND oi.status NOT IN ('cancelled', 'refunded')
  GROUP BY oi.product_id, oi.product_name
  ORDER BY total_revenue DESC
  LIMIT _limit;
END;
$$;