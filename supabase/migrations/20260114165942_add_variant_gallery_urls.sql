-- Migration: Add gallery_urls array to product_color_variants
-- Purpose: Support multiple images per color variant for variant-specific galleries

-- Add gallery_urls array column to product_color_variants
ALTER TABLE public.product_color_variants 
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.product_color_variants.gallery_urls IS 
  'Array of additional image URLs for this color variant gallery. The main "image" column is the cover/thumbnail, and gallery_urls contains the full gallery for the product details page.';
