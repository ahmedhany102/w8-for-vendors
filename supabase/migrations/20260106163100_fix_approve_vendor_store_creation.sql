-- Fix approve_vendor function to create vendors table entry
-- This migration patches the approve_vendor function to also INSERT into the vendors table
-- when a vendor application is approved.

-- First, drop existing function to recreate with updated logic
DROP FUNCTION IF EXISTS public.approve_vendor(UUID);

-- Recreate approve_vendor with vendors table creation
CREATE OR REPLACE FUNCTION public.approve_vendor(target_vendor_profile_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vendor_user_id UUID;
  vendor_profile_row RECORD;
  caller_role TEXT;
BEGIN
  -- Check caller is admin
  caller_role := public.get_user_highest_role(auth.uid());
  IF caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve vendors';
  END IF;
  
  -- Get the vendor profile data
  SELECT *
  INTO vendor_profile_row
  FROM public.vendor_profiles
  WHERE id = target_vendor_profile_id;
  
  IF vendor_profile_row IS NULL THEN
    RAISE EXCEPTION 'Vendor profile not found';
  END IF;
  
  vendor_user_id := vendor_profile_row.user_id;
  
  -- Update vendor profile status
  UPDATE public.vendor_profiles
  SET status = 'approved', updated_at = now()
  WHERE id = target_vendor_profile_id;
  
  -- ============================================
  -- CRITICAL FIX: Create vendors table entry
  -- This is the missing step that was causing
  -- "Store not found" errors for approved vendors
  -- ============================================
  INSERT INTO public.vendors (
    owner_id,
    name,
    slug,
    description,
    phone,
    address,
    logo_url,
    cover_url,
    status
  )
  VALUES (
    vendor_user_id,
    vendor_profile_row.store_name,
    vendor_profile_row.slug,
    vendor_profile_row.store_description,
    vendor_profile_row.phone,
    vendor_profile_row.address,
    vendor_profile_row.logo_url,
    vendor_profile_row.cover_url,
    'active'
  )
  ON CONFLICT (owner_id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    logo_url = EXCLUDED.logo_url,
    cover_url = EXCLUDED.cover_url,
    status = 'active';
  
  -- Assign vendor_admin role if not already assigned
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (vendor_user_id, 'vendor_admin', auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profiles table for backward compatibility
  UPDATE public.profiles
  SET role = 'VENDOR'
  WHERE id = vendor_user_id AND role = 'USER';
  
  RETURN true;
END;
$$;

-- ============================================
-- BACKFILL: Create vendors entries for any
-- already-approved vendors who are missing them
-- ============================================
INSERT INTO public.vendors (
  owner_id,
  name,
  slug,
  description,
  phone,
  address,
  logo_url,
  cover_url,
  status
)
SELECT 
  vp.user_id,
  vp.store_name,
  vp.slug,
  vp.store_description,
  vp.phone,
  vp.address,
  vp.logo_url,
  vp.cover_url,
  'active'
FROM public.vendor_profiles vp
WHERE vp.status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM public.vendors v WHERE v.owner_id = vp.user_id
);
