-- A) Fix coupon_redemptions table structure and add atomic RPC function
-- Ensure unique constraint exists for per-user redemption limits
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_coupon_user'
  ) THEN
    ALTER TABLE public.coupon_redemptions
    ADD CONSTRAINT unique_coupon_user UNIQUE (coupon_id, user_id);
  END IF;
END $$;

-- Create atomic apply_coupon RPC function with proper locking
CREATE OR REPLACE FUNCTION public.apply_coupon_atomic(
  p_coupon_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_usage_limit_global integer DEFAULT NULL,
  p_usage_limit_per_user integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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