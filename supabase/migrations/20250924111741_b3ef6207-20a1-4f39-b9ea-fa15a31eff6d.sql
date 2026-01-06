-- Phase 1: Remove dangerous RLS policies and replace with secure ones

-- ===== ORDERS TABLE SECURITY =====
-- Drop dangerous policies
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Allow full access to orders for all" ON public.orders;

-- Create secure order policies
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (customer_info->>'user_id')::uuid = auth.uid()
);

CREATE POLICY "Users can view their own orders only"
ON public.orders
FOR SELECT
TO authenticated
USING (
  (customer_info->>'user_id')::uuid = auth.uid() OR
  get_current_user_role() = 'ADMIN'
);

CREATE POLICY "Users can cancel their own pending orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  (customer_info->>'user_id')::uuid = auth.uid() AND 
  status IN ('PENDING', 'PROCESSING')
)
WITH CHECK (
  (customer_info->>'user_id')::uuid = auth.uid() AND
  status IN ('PENDING', 'PROCESSING', 'CANCELLED')
);

-- ===== PRODUCT_VARIANTS TABLE SECURITY =====
-- Drop dangerous policy
DROP POLICY IF EXISTS "Allow full access to product_variants for all" ON public.product_variants;

-- Create secure product variant policies
CREATE POLICY "Anyone can view product variants"
ON public.product_variants
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage product variants"
ON public.product_variants
FOR ALL
TO authenticated
USING (get_current_user_role() = 'ADMIN')
WITH CHECK (get_current_user_role() = 'ADMIN');

-- ===== CATEGORIES TABLE SECURITY =====
-- Drop dangerous policy
DROP POLICY IF EXISTS "Allow full access to categories for all" ON public.categories;

-- Keep view access for all but restrict management
CREATE POLICY "Anyone can view active categories"
ON public.categories
FOR SELECT
USING (is_active = true OR get_current_user_role() = 'ADMIN');

CREATE POLICY "Only admins can manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (get_current_user_role() = 'ADMIN')
WITH CHECK (get_current_user_role() = 'ADMIN');

-- ===== DATABASE FUNCTION SECURITY =====
-- Update functions to include proper search_path

CREATE OR REPLACE FUNCTION public.delete_promotional_banner(banner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has permission (admin only)
  IF get_current_user_role() != 'ADMIN' THEN
    RAISE EXCEPTION 'Only admins can delete promotional banners';
  END IF;
  
  -- Delete the promotional banner
  DELETE FROM public.ads WHERE id = banner_id;
  
  -- Check if the deletion was successful
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_orders(user_uuid uuid)
RETURNS SETOF orders
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders 
  WHERE (customer_info->>'user_id')::uuid = user_uuid
     OR (customer_info->>'email' = (SELECT email FROM profiles WHERE id = user_uuid))
  ORDER BY created_at DESC;
$$;

-- Add order cancellation function
CREATE OR REPLACE FUNCTION public.cancel_user_order(order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record orders;
BEGIN
  -- Get the order and verify ownership
  SELECT * INTO order_record 
  FROM public.orders 
  WHERE id = order_id 
    AND (customer_info->>'user_id')::uuid = auth.uid()
    AND status IN ('PENDING', 'PROCESSING');
  
  -- Check if order exists and is cancellable
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update order status to cancelled
  UPDATE public.orders 
  SET status = 'CANCELLED', 
      updated_at = now()
  WHERE id = order_id;
  
  RETURN TRUE;
END;
$$;

-- Update existing functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;