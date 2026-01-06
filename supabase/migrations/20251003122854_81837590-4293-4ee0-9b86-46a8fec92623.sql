-- Normalize profile status casing and fix authentication checks

-- 1) Normalize existing statuses to lowercase
UPDATE public.profiles
SET status = lower(status)
WHERE status IS NOT NULL;

-- 2) Set default to lowercase 'active'
ALTER TABLE public.profiles
ALTER COLUMN status SET DEFAULT 'active';

-- 3) Update handle_new_user to insert lowercase 'active'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    'active'
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role);
  
  RETURN NEW;
END;
$function$;

-- 4) Make can_user_authenticate robust to casing
CREATE OR REPLACE FUNCTION public.can_user_authenticate(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT lower(status) = 'active' FROM public.profiles WHERE id = _user_id),
    false
  );
$function$;
