-- Add database constraints for coupon validation
ALTER TABLE coupons
  ADD CONSTRAINT chk_percent_range
    CHECK (discount_kind <> 'percent' OR (discount_value >= 0 AND discount_value <= 100));

ALTER TABLE coupons
  ADD CONSTRAINT chk_fixed_nonnegative
    CHECK (discount_kind <> 'fixed' OR discount_value >= 0);

-- Create unique index on coupon code (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_unique ON coupons (lower(code));

-- Create atomic coupon claim function
CREATE OR REPLACE FUNCTION public.claim_coupon(p_code text)
RETURNS coupons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v_row coupons%rowtype;
BEGIN
  -- Atomically update and return coupon if valid
  UPDATE coupons
    SET used_count = used_count + 1
  WHERE upper(code) = upper(p_code)
    AND active = true
    AND (expiration_date IS NULL OR expiration_date >= now())
    AND (usage_limit IS NULL OR used_count < usage_limit)
  RETURNING * INTO v_row;

  -- Return null if no valid coupon found or limits exceeded
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN v_row;
END;
$$;