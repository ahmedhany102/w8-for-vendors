-- Phase 1.2: Add helper functions for vendor role checking

-- Check if user is vendor admin
CREATE OR REPLACE FUNCTION public.is_vendor_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'vendor_admin'
  );
$$;

-- Check if user can manage vendor resources (vendor_admin, admin, or super_admin)
CREATE OR REPLACE FUNCTION public.can_manage_vendor_resources(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('vendor_admin', 'admin', 'super_admin')
  );
$$;

-- Update get_user_highest_role to include vendor_admin
CREATE OR REPLACE FUNCTION public.get_user_highest_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') THEN 'super_admin'
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'vendor_admin') THEN 'vendor_admin'
      ELSE 'user'
    END;
$$;

-- Update assign_user_role to support vendor_admin assignment
CREATE OR REPLACE FUNCTION public.assign_user_role(target_user_id uuid, new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_role text;
  target_current_role text;
BEGIN
  -- Get caller's role
  caller_role := public.get_user_highest_role(auth.uid());
  
  -- Get target user's current role
  target_current_role := public.get_user_highest_role(target_user_id);
  
  -- Security checks
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF target_current_role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot modify super admin role';
  END IF;
  
  IF new_role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot assign super admin role';
  END IF;
  
  -- Admin can assign admin role, super_admin can assign anything (except super_admin)
  IF new_role = 'admin' AND caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign admin role';
  END IF;
  
  -- Only admin or super_admin can assign vendor_admin
  IF new_role = 'vendor_admin' AND caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign vendor_admin role';
  END IF;
  
  -- At least admin required to manage user roles
  IF caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to manage roles';
  END IF;
  
  -- Remove existing roles (except super_admin)
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id 
    AND role != 'super_admin';
  
  -- Insert new role
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, new_role, auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profiles table for backward compatibility
  UPDATE public.profiles
  SET 
    role = CASE WHEN new_role IN ('super_admin', 'admin') THEN 'ADMIN'
                WHEN new_role = 'vendor_admin' THEN 'VENDOR'
                ELSE 'USER' END,
    is_admin = (new_role IN ('admin', 'super_admin')),
    is_super_admin = (new_role = 'super_admin')
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$;