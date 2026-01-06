-- Fix RLS policies to ensure public users can view products properly

-- Update products table RLS policies to be more permissive for SELECT
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

CREATE POLICY "Public can view all products" 
ON public.products 
FOR SELECT 
USING (true);

-- Ensure product variants are also publicly viewable
DROP POLICY IF EXISTS "Anyone can view product variants" ON public.product_variants;

CREATE POLICY "Public can view product variants" 
ON public.product_variants 
FOR SELECT 
USING (true);

-- Ensure color variants are publicly viewable  
DROP POLICY IF EXISTS "Anyone can read variant data for public products" ON public.product_color_variants;

CREATE POLICY "Public can view color variants" 
ON public.product_color_variants 
FOR SELECT 
USING (true);

-- Ensure color variant options are publicly viewable
DROP POLICY IF EXISTS "Anyone can read variant options for public products" ON public.product_color_variant_options;

CREATE POLICY "Public can view color variant options" 
ON public.product_color_variant_options 
FOR SELECT 
USING (true);