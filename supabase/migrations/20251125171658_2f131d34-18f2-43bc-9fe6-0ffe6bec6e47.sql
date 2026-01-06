-- Fix remaining functions missing search_path

-- Fix apply_coupon_atomic (jsonb version)
CREATE OR REPLACE FUNCTION public.apply_coupon_atomic(coupon_code text, user_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  coupon_record RECORD;
  now_time timestamptz := now();
  discount numeric;
  already_used integer;
BEGIN
  SELECT *
  INTO coupon_record
  FROM public.coupons
  WHERE LOWER(code) = LOWER(coupon_code)
    AND active = TRUE
    AND (expiration_date IS NULL OR expiration_date > now_time)
  LIMIT 1;

  IF coupon_record IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Invalid or expired coupon');
  END IF;

  -- Check per-user usage
  IF coupon_record.usage_limit_per_user IS NOT NULL THEN
    SELECT COUNT(*) INTO already_used
    FROM public.coupon_redemptions
    WHERE coupon_id = coupon_record.id
      AND user_id = user_uuid;

    IF already_used >= coupon_record.usage_limit_per_user THEN
      RETURN jsonb_build_object('ok', false, 'message', 'User usage limit reached');
    END IF;
  END IF;

  -- Calculate discount amount
  IF coupon_record.discount_kind = 'percent' THEN
    discount := coupon_record.discount_value;
  ELSE
    discount := coupon_record.discount_value;
  END IF;

  -- Record redemption
  INSERT INTO public.coupon_redemptions (coupon_id, user_id, redeemed_at)
  VALUES (coupon_record.id, user_uuid, now_time);

  -- Return success JSON
  RETURN jsonb_build_object(
    'ok', true,
    'message', 'Coupon applied successfully',
    'coupon_id', coupon_record.id,
    'discount_kind', coupon_record.discount_kind,
    'discount_value', coupon_record.discount_value,
    'expires_at', coupon_record.expiration_date
  );
END;
$function$;