-- Migrate existing admin users to user_roles table
-- This ensures existing admins can still log in after the role system update

-- Insert super_admin roles for users with is_super_admin = true
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM public.profiles
WHERE is_super_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert admin roles for users with is_admin = true (but not super_admin)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM public.profiles
WHERE is_admin = true AND is_super_admin = false
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure all existing users have at least a 'user' role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::public.app_role
FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = profiles.id
)
ON CONFLICT (user_id, role) DO NOTHING;