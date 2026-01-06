-- Create vendor_profiles table
CREATE TABLE public.vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_description TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_vendor_profiles_user_id ON public.vendor_profiles(user_id);
CREATE INDEX idx_vendor_profiles_status ON public.vendor_profiles(status);

-- Enable RLS
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Vendors can view their own profile
CREATE POLICY "Vendors can view their own profile"
ON public.vendor_profiles
FOR SELECT
USING (user_id = auth.uid());

-- Vendors can update their own profile (except status)
CREATE POLICY "Vendors can update their own profile"
ON public.vendor_profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can view all vendor profiles
CREATE POLICY "Admins can view all vendor profiles"
ON public.vendor_profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins can manage all vendor profiles
CREATE POLICY "Admins can manage all vendor profiles"
ON public.vendor_profiles
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Users can insert their own vendor application
CREATE POLICY "Users can apply as vendor"
ON public.vendor_profiles
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_vendor_profiles_updated_at
BEFORE UPDATE ON public.vendor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to approve vendor and assign role
CREATE OR REPLACE FUNCTION public.approve_vendor(target_vendor_profile_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vendor_user_id UUID;
  caller_role TEXT;
BEGIN
  -- Check caller is admin
  caller_role := public.get_user_highest_role(auth.uid());
  IF caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve vendors';
  END IF;
  
  -- Get the user_id from vendor_profiles
  SELECT user_id INTO vendor_user_id
  FROM public.vendor_profiles
  WHERE id = target_vendor_profile_id;
  
  IF vendor_user_id IS NULL THEN
    RAISE EXCEPTION 'Vendor profile not found';
  END IF;
  
  -- Update vendor profile status
  UPDATE public.vendor_profiles
  SET status = 'approved', updated_at = now()
  WHERE id = target_vendor_profile_id;
  
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

-- Function to update vendor status (reject/suspend)
CREATE OR REPLACE FUNCTION public.update_vendor_status(target_vendor_profile_id UUID, new_status TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Validate status
  IF new_status NOT IN ('pending', 'approved', 'rejected', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status. Must be pending, approved, rejected, or suspended';
  END IF;
  
  -- Check caller is admin
  caller_role := public.get_user_highest_role(auth.uid());
  IF caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Only admins can update vendor status';
  END IF;
  
  -- If approving, use the approve_vendor function instead
  IF new_status = 'approved' THEN
    RETURN public.approve_vendor(target_vendor_profile_id);
  END IF;
  
  -- Update status
  UPDATE public.vendor_profiles
  SET status = new_status, updated_at = now()
  WHERE id = target_vendor_profile_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor profile not found';
  END IF;
  
  RETURN true;
END;
$$;

-- Function to get vendor profile with user info (for admin)
CREATE OR REPLACE FUNCTION public.get_vendor_profiles_with_users(status_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  store_name TEXT,
  store_description TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_email TEXT,
  user_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can view all vendor profiles';
  END IF;
  
  RETURN QUERY
  SELECT 
    vp.id,
    vp.user_id,
    vp.store_name,
    vp.store_description,
    vp.phone,
    vp.address,
    vp.logo_url,
    vp.status,
    vp.created_at,
    vp.updated_at,
    p.email AS user_email,
    p.name AS user_name
  FROM public.vendor_profiles vp
  JOIN public.profiles p ON p.id = vp.user_id
  WHERE status_filter IS NULL OR status_filter = 'all' OR vp.status = status_filter
  ORDER BY vp.created_at DESC;
END;
$$;