-- Migration: Update get_product_variant_options to include gallery_urls
-- This is required for the per-variant image gallery feature

-- Must drop first because we're adding a new return column
DROP FUNCTION IF EXISTS public.get_product_variant_options(uuid);

CREATE OR REPLACE FUNCTION public.get_product_variant_options(p_product_id uuid)
RETURNS TABLE (
  color_variant_id uuid,
  color text,
  image text,
  gallery_urls text[],
  option_id uuid,
  size text,
  price numeric,
  stock integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cv.id as color_variant_id,
    cv.color,
    cv.image,
    COALESCE(cv.gallery_urls, '{}') as gallery_urls,
    cvo.id as option_id,
    cvo.size,
    cvo.price,
    cvo.stock
  FROM public.product_color_variants cv
  LEFT JOIN public.product_color_variant_options cvo ON cvo.color_variant_id = cv.id
  WHERE cv.product_id = p_product_id
  ORDER BY cv.created_at, cvo.size;
$$;
