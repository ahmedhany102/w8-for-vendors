-- Create RPC function to delete promotional banners (bypasses AdBlock issues)
CREATE OR REPLACE FUNCTION public.delete_promotional_banner(banner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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