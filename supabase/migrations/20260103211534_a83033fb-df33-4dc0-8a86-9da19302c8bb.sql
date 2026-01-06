-- Create function for vendors to delete their own ads
CREATE OR REPLACE FUNCTION public.delete_vendor_ad(p_ad_id uuid, p_vendor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if vendor owns this ad
  IF NOT EXISTS (
    SELECT 1 FROM ads a
    JOIN vendors v ON v.id = a.vendor_id
    WHERE a.id = p_ad_id 
    AND a.vendor_id = p_vendor_id
    AND v.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You do not have permission to delete this ad';
  END IF;
  
  -- Delete the ad
  DELETE FROM public.ads WHERE id = p_ad_id AND vendor_id = p_vendor_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create function to get similar products by category
CREATE OR REPLACE FUNCTION public.get_similar_products(
  _product_id uuid,
  _limit int DEFAULT 12
)
RETURNS TABLE (
  id uuid,
  name text,
  price numeric,
  discount numeric,
  image_url text,
  rating numeric,
  stock int,
  inventory int,
  vendor_name text,
  vendor_slug text,
  vendor_logo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _category_id uuid;
  _vendor_id uuid;
BEGIN
  -- Get category and vendor of the current product
  SELECT p.category_id, p.vendor_id INTO _category_id, _vendor_id
  FROM products p
  WHERE p.id = _product_id;

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    p.stock,
    p.inventory,
    v.name as vendor_name,
    v.slug as vendor_slug,
    v.logo_url as vendor_logo_url
  FROM products p
  LEFT JOIN vendors v ON v.id = p.vendor_id
  WHERE p.id != _product_id
    AND p.status IN ('active', 'approved')
    AND (_category_id IS NULL OR p.category_id = _category_id)
  ORDER BY 
    CASE WHEN p.category_id = _category_id THEN 0 ELSE 1 END,
    p.rating DESC NULLS LAST,
    p.created_at DESC
  LIMIT _limit;
END;
$$;

-- Create function to get more products from a vendor
CREATE OR REPLACE FUNCTION public.get_vendor_more_products(
  _product_id uuid,
  _vendor_id uuid,
  _limit int DEFAULT 12
)
RETURNS TABLE (
  id uuid,
  name text,
  price numeric,
  discount numeric,
  image_url text,
  rating numeric,
  stock int,
  inventory int,
  vendor_name text,
  vendor_slug text,
  vendor_logo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    p.stock,
    p.inventory,
    v.name as vendor_name,
    v.slug as vendor_slug,
    v.logo_url as vendor_logo_url
  FROM products p
  LEFT JOIN vendors v ON v.id = p.vendor_id
  WHERE p.vendor_id = _vendor_id
    AND p.id != _product_id
    AND p.status IN ('active', 'approved')
  ORDER BY p.rating DESC NULLS LAST, p.created_at DESC
  LIMIT _limit;
END;
$$;

-- Add slug column to sections for better URLs
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index for section slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_sections_slug ON public.sections(slug) WHERE slug IS NOT NULL;

-- Function to generate section slug
CREATE OR REPLACE FUNCTION public.generate_section_slug(p_title text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Convert title to slug
  base_slug := lower(trim(p_title));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- If empty, use a default
  IF base_slug = '' THEN
    base_slug := 'section';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM sections WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Trigger to auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.sections_generate_slug_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_section_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sections_generate_slug ON public.sections;
CREATE TRIGGER sections_generate_slug
  BEFORE INSERT ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION sections_generate_slug_trigger();

-- Update existing sections to have slugs
UPDATE public.sections SET slug = generate_section_slug(title) WHERE slug IS NULL;