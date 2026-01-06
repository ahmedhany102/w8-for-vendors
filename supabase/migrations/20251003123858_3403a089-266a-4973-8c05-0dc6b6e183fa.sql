-- Fix recursive RLS policies on user_roles to restore admin checks
-- 1) Drop problematic recursive policies
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can view all roles'
  ) THEN
    DROP POLICY "Admins can view all roles" ON public.user_roles;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Super admins can manage all roles'
  ) THEN
    DROP POLICY "Super admins can manage all roles" ON public.user_roles;
  END IF;
END $$;

-- 2) Recreate safe policies using SECURITY DEFINER helper (avoids recursion)
-- Ensure has_role exists (it already does per project state)
CREATE POLICY "admins_view_all_roles_safe"
ON public.user_roles
FOR SELECT
USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "super_admin_manage_user_roles_safe"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Keep existing "Users can view own roles" policy as-is

-- 3) Sanity: ensure functions have SECURITY DEFINER and search_path set
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_highest_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') THEN 'super_admin'
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN 'admin'
      ELSE 'user'
    END;
$function$;
