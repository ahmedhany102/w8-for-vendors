-- Update get_active_vendors to pull logo/cover from vendor_profiles
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
    COALESCE(v.logo_url, vp.logo_url) as logo_url,
    COALESCE(v.cover_url, vp.cover_url) as cover_url,
    v.status,
    (SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id AND p.status IN ('active', 'approved')) as product_count
  FROM vendors v
  LEFT JOIN vendor_profiles vp ON vp.user_id = v.owner_id
  WHERE v.status = 'active'
  ORDER BY v.created_at DESC;
$$;