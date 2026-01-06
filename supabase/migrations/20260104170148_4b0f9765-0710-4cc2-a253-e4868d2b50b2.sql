-- Update get_product_with_vendor to include vendor_id and vendor_slug
DROP FUNCTION IF EXISTS public.get_product_with_vendor(uuid);

CREATE OR REPLACE FUNCTION public.get_product_with_vendor(p_product_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  price numeric,
  category text,
  category_id uuid,
  main_image text,
  image_url text,
  images jsonb,
  colors jsonb,
  sizes jsonb,
  discount numeric,
  featured boolean,
  stock integer,
  inventory integer,
  status text,
  user_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  vendor_id uuid,
  vendor_slug text,
  vendor_store_name text,
  vendor_logo_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.category,
    p.category_id,
    p.main_image,
    p.image_url,
    p.images,
    p.colors,
    p.sizes,
    p.discount,
    p.featured,
    p.stock,
    p.inventory,
    p.status,
    p.user_id,
    p.created_at,
    p.updated_at,
    v.id as vendor_id,
    v.slug as vendor_slug,
    COALESCE(v.name, vp.store_name, pr.name, 'المتجر الرئيسي') as vendor_store_name,
    COALESCE(v.logo_url, vp.logo_url) as vendor_logo_url
  FROM public.products p
  LEFT JOIN public.vendors v ON v.id = p.vendor_id
  LEFT JOIN public.vendor_profiles vp ON vp.user_id = p.user_id
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.id = p_product_id
    AND (p.status IN ('active', 'approved') OR p.user_id = auth.uid() OR is_admin(auth.uid()));
END;
$$;