-- =====================================================
-- USER ROLES & PERMISSIONS SYSTEM
-- =====================================================
-- This migration adds status management and role assignment logic
-- while maintaining the secure user_roles table architecture

-- =====================================================
-- STEP 1: Add Status Column to Profiles
-- =====================================================

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'banned'));
    END IF;
END $$;

-- Update existing profiles to have active status
UPDATE public.profiles SET status = 'active' WHERE status IS NULL;

-- Make status NOT NULL after setting defaults
ALTER TABLE public.profiles ALTER COLUMN status SET NOT NULL;

-- =====================================================
-- STEP 2: Create Functions for Role Management
-- =====================================================

-- Function to check if a user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
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
      AND role = 'super_admin'
  );
$$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_highest_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') THEN 'super_admin'
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN 'admin'
      ELSE 'user'
    END;
$$;

-- Function to assign role (only super_admin can assign admin role)
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id uuid,
  new_role public.app_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  -- 1. Caller must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- 2. Cannot modify super_admin
  IF target_current_role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot modify super admin role';
  END IF;
  
  -- 3. Only super_admin can assign admin role
  IF new_role = 'admin' AND caller_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can assign admin role';
  END IF;
  
  -- 4. Only super_admin can assign super_admin role (preventing self-promotion)
  IF new_role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot assign super admin role';
  END IF;
  
  -- 5. At least admin required to manage user roles
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
    role = CASE WHEN new_role = 'super_admin' THEN 'ADMIN'
                WHEN new_role = 'admin' THEN 'ADMIN'
                ELSE 'USER' END,
    is_admin = (new_role IN ('admin', 'super_admin')),
    is_super_admin = (new_role = 'super_admin')
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$;

-- Function to ban/unban user
CREATE OR REPLACE FUNCTION public.update_user_status(
  target_user_id uuid,
  new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  target_role text;
BEGIN
  -- Validate status
  IF new_status NOT IN ('active', 'banned') THEN
    RAISE EXCEPTION 'Invalid status. Must be active or banned';
  END IF;
  
  -- Get caller's role
  caller_role := public.get_user_highest_role(auth.uid());
  
  -- Get target user's role
  target_role := public.get_user_highest_role(target_user_id);
  
  -- Security checks
  -- 1. Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- 2. Cannot ban super_admin
  IF target_role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot ban super admin';
  END IF;
  
  -- 3. Regular admins cannot ban other admins
  IF target_role = 'admin' AND caller_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can ban admins';
  END IF;
  
  -- 4. Must be at least admin
  IF caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to manage user status';
  END IF;
  
  -- Update status
  UPDATE public.profiles
  SET status = new_status
  WHERE id = target_user_id;
  
  -- If banning, sign out the user by deleting their sessions
  IF new_status = 'banned' THEN
    -- Note: This requires auth.sessions table access which may need additional permissions
    -- For now, the user will be blocked on their next auth check
    NULL;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to delete user (only super_admin can delete admins)
CREATE OR REPLACE FUNCTION public.delete_user_account(
  target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  target_role text;
BEGIN
  -- Get roles
  caller_role := public.get_user_highest_role(auth.uid());
  target_role := public.get_user_highest_role(target_user_id);
  
  -- Security checks
  -- 1. Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- 2. Cannot delete super_admin
  IF target_role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot delete super admin';
  END IF;
  
  -- 3. Regular admins cannot delete other admins
  IF target_role = 'admin' AND caller_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can delete admins';
  END IF;
  
  -- 4. Must be at least admin
  IF caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to delete users';
  END IF;
  
  -- 5. Cannot delete yourself
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;
  
  -- Delete user (cascade will handle related records)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RETURN true;
END;
$$;

-- =====================================================
-- STEP 3: Update Profiles RLS Policies
-- =====================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users cannot change their own admin status" ON public.profiles;
DROP POLICY IF EXISTS "Users cannot change their own role" ON public.profiles;

-- Users can update their own profile but NOT role/status/admin fields
CREATE POLICY "Users can update own profile (limited)"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  AND is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  AND is_super_admin = (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid())
  AND status = (SELECT status FROM public.profiles WHERE id = auth.uid())
);

-- =====================================================
-- STEP 4: Create Auth Hook to Block Banned Users
-- =====================================================

-- Function to check if user can authenticate
CREATE OR REPLACE FUNCTION public.can_user_authenticate(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT status = 'active' FROM public.profiles WHERE id = _user_id),
    false
  );
$$;

-- =====================================================
-- STEP 5: Update User Roles Table RLS
-- =====================================================

-- Admins can view all roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.is_admin(auth.uid())
);

-- =====================================================
-- Migration Complete
-- =====================================================
-- Next steps:
-- 1. Update frontend to use assign_user_role() function
-- 2. Update frontend to use update_user_status() function  
-- 3. Update frontend to use delete_user_account() function
-- 4. Add auth check on login to verify user status