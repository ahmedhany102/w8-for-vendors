-- Phase 3: Product Ownership & Vendor Product Management

-- 1.1 & 1.2: Add vendor_id column to products (using user_id as vendor_id since it already exists)
-- The existing user_id column will serve as vendor_id
-- First, let's add a proper status column for product moderation

-- Add product status column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Create index on user_id (vendor) and status
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- 1.2: Backfill - Set user_id for all existing products that don't have one
-- We'll get the first super_admin user to assign orphaned products
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get a super_admin user id
  SELECT ur.user_id INTO admin_user_id
  FROM public.user_roles ur
  WHERE ur.role = 'super_admin'
  LIMIT 1;
  
  -- If no super_admin found, get any admin
  IF admin_user_id IS NULL THEN
    SELECT ur.user_id INTO admin_user_id
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
    LIMIT 1;
  END IF;
  
  -- Update products without user_id
  IF admin_user_id IS NOT NULL THEN
    UPDATE public.products
    SET user_id = admin_user_id
    WHERE user_id IS NULL;
  END IF;
END $$;

-- Drop existing RLS policies on products to recreate them properly
DROP POLICY IF EXISTS "Public can view all products" ON public.products;
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Vendors can manage their own products" ON public.products;

-- 1.4: New RLS policies for products

-- Anyone can view active/approved products
CREATE POLICY "Public can view active products" 
ON public.products 
FOR SELECT 
USING (status IN ('active', 'approved') OR user_id = auth.uid() OR is_admin(auth.uid()));

-- Vendors can insert their own products
CREATE POLICY "Vendors can insert their own products" 
ON public.products 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  (can_manage_vendor_resources(auth.uid()) OR is_admin(auth.uid()))
);

-- Vendors can update their own products
CREATE POLICY "Vendors can update their own products" 
ON public.products 
FOR UPDATE 
USING (user_id = auth.uid() OR is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

-- Vendors can delete their own products
CREATE POLICY "Vendors can delete their own products" 
ON public.products 
FOR DELETE 
USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- Admins have full access (covered by OR is_admin in above policies)

-- Create function to get vendor products with proper filtering
CREATE OR REPLACE FUNCTION public.get_vendor_products(
  _vendor_id uuid DEFAULT NULL,
  _status_filter text DEFAULT NULL
)
RETURNS SETOF products
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If admin, can see all or filter by vendor
  IF is_admin(auth.uid()) THEN
    RETURN QUERY
    SELECT * FROM public.products
    WHERE 
      (_vendor_id IS NULL OR user_id = _vendor_id)
      AND (_status_filter IS NULL OR _status_filter = 'all' OR status = _status_filter)
    ORDER BY created_at DESC;
  ELSE
    -- Vendors can only see their own products
    RETURN QUERY
    SELECT * FROM public.products
    WHERE 
      user_id = auth.uid()
      AND (_status_filter IS NULL OR _status_filter = 'all' OR status = _status_filter)
    ORDER BY created_at DESC;
  END IF;
END;
$$;

-- Create function to update product status (admin only)
CREATE OR REPLACE FUNCTION public.update_product_status(
  _product_id uuid,
  _new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate status
  IF _new_status NOT IN ('pending', 'approved', 'active', 'inactive', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status. Must be pending, approved, active, inactive, or rejected';
  END IF;
  
  -- Check caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can update product status';
  END IF;
  
  -- Update status
  UPDATE public.products
  SET status = _new_status, updated_at = now()
  WHERE id = _product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_vendor_products(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_product_status(uuid, text) TO authenticated;