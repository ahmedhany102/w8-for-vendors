-- Drop the existing function first
DROP FUNCTION IF EXISTS public.generate_vendor_slug(text);

-- Add cover_url and slug columns to vendor_profiles (if not already added)
ALTER TABLE public.vendor_profiles 
ADD COLUMN IF NOT EXISTS cover_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS slug text DEFAULT NULL;

-- Create unique index on slug (allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS vendor_profiles_slug_unique ON public.vendor_profiles (slug) WHERE slug IS NOT NULL;

-- Create function to generate slug from store name
CREATE OR REPLACE FUNCTION public.generate_vendor_slug(p_store_name text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Convert to lowercase, replace Arabic spaces and special chars
  base_slug := lower(trim(p_store_name));
  -- Replace spaces and common separators with hyphens
  base_slug := regexp_replace(base_slug, '[\s_]+', '-', 'g');
  -- Remove any characters that aren't alphanumeric, Arabic, or hyphens
  base_slug := regexp_replace(base_slug, '[^a-z0-9\u0600-\u06FF-]', '', 'g');
  -- Remove multiple consecutive hyphens
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  -- Trim hyphens from start and end
  base_slug := trim(both '-' from base_slug);
  
  -- If empty after cleaning, generate random
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'store';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM vendor_profiles WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Update existing vendor profiles to have slugs (generate from store_name)
UPDATE public.vendor_profiles 
SET slug = public.generate_vendor_slug(store_name)
WHERE slug IS NULL;