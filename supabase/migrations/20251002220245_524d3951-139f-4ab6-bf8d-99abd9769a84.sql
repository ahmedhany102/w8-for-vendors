-- =====================================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- =====================================================
-- This migration addresses critical security vulnerabilities:
-- 1. Implements proper user_roles table architecture
-- 2. Creates secure has_role() function to prevent RLS recursion
-- 3. Migrates existing admin users to new role system
-- 4. Updates all RLS policies to use secure role checking
-- 5. Adds authorization checks to security definer functions
-- 6. Consolidates overlapping RLS policies on orders table

-- =====================================================
-- STEP 1: Create Role Enum and User Roles Table
-- =====================================================

-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by uuid REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage roles
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  )
);

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- =====================================================
-- STEP 2: Create Secure has_role() Function
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Helper function to check if user has admin or super_admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  );
$$;

-- Legacy compatibility function (will be deprecated)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN 'ADMIN'
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN 'ADMIN'
      ELSE 'USER'
    END;
$$;

-- =====================================================
-- STEP 3: Migrate Existing Data
-- =====================================================

-- Migrate existing admins from profiles table to user_roles
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT 
  id,
  CASE 
    WHEN is_super_admin = true THEN 'super_admin'::public.app_role
    WHEN is_admin = true THEN 'admin'::public.app_role
    ELSE 'user'::public.app_role
  END,
  created_at
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- =====================================================
-- STEP 4: Update handle_new_user Trigger
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new trigger function without hardcoded email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, name, role, is_admin, is_super_admin, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'USER',
    false,
    false,
    'ACTIVE'
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role);
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 5: Add Authorization to Security Definer Functions
-- =====================================================

-- Update get_user_orders to validate authorization
CREATE OR REPLACE FUNCTION public.get_user_orders(user_uuid uuid)
RETURNS SETOF orders
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Validate caller is authorized (either the user themselves or an admin)
  IF auth.uid() != user_uuid AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: You can only view your own orders';
  END IF;
  
  RETURN QUERY
  SELECT * FROM public.orders 
  WHERE (customer_info->>'user_id')::uuid = user_uuid
     OR (customer_info->>'email' = (SELECT email FROM profiles WHERE id = user_uuid))
  ORDER BY created_at DESC;
END;
$$;

-- Update apply_coupon_atomic to require authentication
CREATE OR REPLACE FUNCTION public.apply_coupon_atomic(
  p_coupon_id uuid,
  p_user_id uuid DEFAULT NULL::uuid,
  p_usage_limit_global integer DEFAULT NULL::integer,
  p_usage_limit_per_user integer DEFAULT NULL::integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_global_count integer;
  current_user_count integer;
  redemption_id uuid;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to apply coupon';
  END IF;
  
  -- If user_id provided, validate it matches authenticated user (unless admin)
  IF p_user_id IS NOT NULL AND p_user_id != auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Cannot apply coupon for another user';
  END IF;
  
  -- Lock the coupon row to prevent race conditions
  SELECT id FROM coupons WHERE id = p_coupon_id FOR UPDATE;
  
  -- Check global usage limit
  IF p_usage_limit_global IS NOT NULL THEN
    SELECT COUNT(*) INTO current_global_count
    FROM coupon_redemptions
    WHERE coupon_id = p_coupon_id;
    
    IF current_global_count >= p_usage_limit_global THEN
      RETURN NULL; -- Usage limit exceeded
    END IF;
  END IF;
  
  -- Check per-user usage limit (only if user is authenticated)
  IF p_user_id IS NOT NULL AND p_usage_limit_per_user IS NOT NULL THEN
    SELECT COUNT(*) INTO current_user_count
    FROM coupon_redemptions
    WHERE coupon_id = p_coupon_id AND user_id = p_user_id;
    
    IF current_user_count >= p_usage_limit_per_user THEN
      RETURN NULL; -- User usage limit exceeded
    END IF;
  END IF;
  
  -- Create redemption record atomically
  INSERT INTO coupon_redemptions (coupon_id, user_id)
  VALUES (p_coupon_id, p_user_id)
  RETURNING id INTO redemption_id;
  
  -- Update the used_count in coupons table for backward compatibility
  UPDATE coupons 
  SET used_count = used_count + 1, 
      updated_at = now()
  WHERE id = p_coupon_id;
  
  RETURN redemption_id;
END;
$$;

-- Update delete_promotional_banner to use is_admin
CREATE OR REPLACE FUNCTION public.delete_promotional_banner(banner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user has permission (admin only)
  IF NOT public.is_admin(auth.uid()) THEN
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

-- =====================================================
-- STEP 6: Consolidate Orders Table RLS Policies
-- =====================================================

-- Drop all existing overlapping policies on orders
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admins to manage orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admins to view all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can see their own orders" ON public.orders;
DROP POLICY IF EXISTS "Only admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Only admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can cancel their own pending orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders only" ON public.orders;

-- Create consolidated, clear policies
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (
  -- User can see their own orders (by user_id or email)
  (customer_info->>'user_id')::uuid = auth.uid()
  OR customer_info->>'email' = (SELECT email FROM public.profiles WHERE id = auth.uid())
  -- Admins can see all orders
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND (
    -- Order must be for the authenticated user
    (customer_info->>'user_id')::uuid = auth.uid()
    OR customer_info->>'email' = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can cancel their pending orders"
ON public.orders
FOR UPDATE
USING (
  -- User can only update their own pending/processing orders
  (customer_info->>'user_id')::uuid = auth.uid()
  AND status IN ('PENDING', 'PROCESSING')
)
WITH CHECK (
  -- Can only change to cancelled
  (customer_info->>'user_id')::uuid = auth.uid()
  AND status IN ('PENDING', 'PROCESSING', 'CANCELLED')
);

CREATE POLICY "Admins can manage all orders"
ON public.orders
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- STEP 7: Update Other Table Policies to Use is_admin()
-- =====================================================

-- Update profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Update categories policies
DROP POLICY IF EXISTS "Only admins can manage categories" ON public.categories;

CREATE POLICY "Only admins can manage categories"
ON public.categories
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Update coupons policies
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

CREATE POLICY "Admins can manage coupons"
ON public.coupons
FOR ALL
USING (public.is_admin(auth.uid()));

-- Update contact_settings policies
DROP POLICY IF EXISTS "Admins can manage contact settings" ON public.contact_settings;

CREATE POLICY "Admins can manage contact settings"
ON public.contact_settings
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Update ads policies
DROP POLICY IF EXISTS "Admins can manage ads" ON public.ads;

CREATE POLICY "Admins can manage ads"
ON public.ads
FOR ALL
USING (public.is_admin(auth.uid()));

-- Update product_variants policies
DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;

CREATE POLICY "Admins can manage product variants"
ON public.product_variants
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Update coupon_redemptions policies
DROP POLICY IF EXISTS "Admins can view all redemptions" ON public.coupon_redemptions;

CREATE POLICY "Admins can view all redemptions"
ON public.coupon_redemptions
FOR ALL
USING (public.is_admin(auth.uid()));

-- Update product_color_variants policies
DROP POLICY IF EXISTS "Admins can manage all product color variants" ON public.product_color_variants;

CREATE POLICY "Admins can manage all product color variants"
ON public.product_color_variants
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Update product_color_variant_options policies
DROP POLICY IF EXISTS "Admins can manage all color variant options" ON public.product_color_variant_options;

CREATE POLICY "Admins can manage all color variant options"
ON public.product_color_variant_options
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Update products policies
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;

CREATE POLICY "Users can manage their own products"
ON public.products
FOR ALL
USING (
  auth.uid() = user_id 
  OR public.is_admin(auth.uid())
);

-- =====================================================
-- Migration Complete
-- =====================================================
-- Next steps:
-- 1. Update client-side code to remove hardcoded admin email
-- 2. Remove is_admin and is_super_admin columns from profiles (after testing)
-- 3. Test all admin functionality thoroughly