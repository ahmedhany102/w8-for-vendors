-- ============================================
-- FIX 1: Update RLS policy for products INSERT to allow admins to insert with any user_id
-- ============================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Vendors can insert their own products" ON public.products;

-- Create new INSERT policy that allows:
-- 1. Vendor admins to insert products with their own user_id
-- 2. Admins/Super admins to insert products with ANY user_id
CREATE POLICY "Vendors and admins can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (
  -- Admin/Super admin can insert with any user_id
  is_admin(auth.uid())
  OR 
  -- Vendor admin can only insert with their own user_id
  (user_id = auth.uid() AND can_manage_vendor_resources(auth.uid()))
);

-- ============================================
-- FIX 2: Create a function to decrement stock atomically when placing orders
-- ============================================

-- Function to decrement variant option stock atomically
-- Returns true if successful, raises exception if insufficient stock
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
  p_color_variant_id uuid,
  p_size text,
  p_quantity integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock integer;
  rows_updated integer;
BEGIN
  -- Try to update the stock atomically
  UPDATE public.product_color_variant_options
  SET stock = stock - p_quantity,
      updated_at = now()
  WHERE color_variant_id = p_color_variant_id
    AND size = p_size
    AND stock >= p_quantity;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  IF rows_updated = 0 THEN
    -- Check if it's because of insufficient stock or missing record
    SELECT stock INTO current_stock
    FROM public.product_color_variant_options
    WHERE color_variant_id = p_color_variant_id AND size = p_size;
    
    IF current_stock IS NULL THEN
      RAISE EXCEPTION 'Variant option not found for color_variant_id=% and size=%', p_color_variant_id, p_size;
    ELSE
      RAISE EXCEPTION 'Insufficient stock: requested %, available %', p_quantity, current_stock;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to find and decrement stock by product_id, color, and size
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_id uuid,
  p_color text,
  p_size text,
  p_quantity integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_color_variant_id uuid;
  v_current_stock integer;
  v_rows_updated integer;
BEGIN
  -- Find the color variant
  SELECT id INTO v_color_variant_id
  FROM public.product_color_variants
  WHERE product_id = p_product_id
    AND LOWER(TRIM(color)) = LOWER(TRIM(p_color));
  
  IF v_color_variant_id IS NULL THEN
    -- No color variants found - try to decrement from products.stock directly
    UPDATE public.products
    SET stock = COALESCE(stock, 0) - p_quantity,
        inventory = COALESCE(inventory, 0) - p_quantity,
        updated_at = now()
    WHERE id = p_product_id
      AND COALESCE(stock, 0) >= p_quantity;
    
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    
    IF v_rows_updated = 0 THEN
      -- Check if insufficient stock
      SELECT COALESCE(stock, 0) INTO v_current_stock
      FROM public.products
      WHERE id = p_product_id;
      
      IF v_current_stock IS NOT NULL AND v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient product stock: requested %, available %', p_quantity, v_current_stock;
      END IF;
    END IF;
    
    RETURN true;
  END IF;
  
  -- Decrement from variant options
  UPDATE public.product_color_variant_options
  SET stock = stock - p_quantity,
      updated_at = now()
  WHERE color_variant_id = v_color_variant_id
    AND LOWER(TRIM(size)) = LOWER(TRIM(p_size))
    AND stock >= p_quantity;
  
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  
  IF v_rows_updated = 0 THEN
    -- Check if it's because of insufficient stock
    SELECT stock INTO v_current_stock
    FROM public.product_color_variant_options
    WHERE color_variant_id = v_color_variant_id
      AND LOWER(TRIM(size)) = LOWER(TRIM(p_size));
    
    IF v_current_stock IS NULL THEN
      -- Size not found, might be a product without size variants
      RETURN true;
    ELSIF v_current_stock < p_quantity THEN
      RAISE EXCEPTION 'Insufficient variant stock: requested %, available % for color=% size=%', 
        p_quantity, v_current_stock, p_color, p_size;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- ============================================
-- FIX 3: Tighten RLS policies for product_color_variants and product_color_variant_options
-- Remove overly permissive policies
-- ============================================

-- Remove permissive INSERT/DELETE policies
DROP POLICY IF EXISTS "allow_delete_color_variants" ON public.product_color_variants;
DROP POLICY IF EXISTS "allow_insert_color_variants" ON public.product_color_variants;
DROP POLICY IF EXISTS "allow_delete_color_variant_options" ON public.product_color_variant_options;
DROP POLICY IF EXISTS "allow_insert_color_variant_options" ON public.product_color_variant_options;

-- ============================================
-- FIX 4: Create function to get product with vendor info for product details page
-- ============================================

CREATE OR REPLACE FUNCTION public.get_product_with_vendor(p_product_id uuid)
RETURNS TABLE (
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
  created_at timestamptz,
  updated_at timestamptz,
  vendor_store_name text,
  vendor_logo_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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
    COALESCE(vp.store_name, pr.name, 'المتجر الرئيسي') as vendor_store_name,
    vp.logo_url as vendor_logo_url
  FROM public.products p
  LEFT JOIN public.vendor_profiles vp ON vp.user_id = p.user_id
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.id = p_product_id
    AND (p.status IN ('active', 'approved') OR p.user_id = auth.uid() OR is_admin(auth.uid()));
END;
$$;

-- ============================================
-- FIX 5: Create function to get variant options with stock for a product
-- ============================================

CREATE OR REPLACE FUNCTION public.get_product_variant_options(p_product_id uuid)
RETURNS TABLE (
  color_variant_id uuid,
  color text,
  image text,
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
    cvo.id as option_id,
    cvo.size,
    cvo.price,
    cvo.stock
  FROM public.product_color_variants cv
  LEFT JOIN public.product_color_variant_options cvo ON cvo.color_variant_id = cv.id
  WHERE cv.product_id = p_product_id
  ORDER BY cv.created_at, cvo.size;
$$;