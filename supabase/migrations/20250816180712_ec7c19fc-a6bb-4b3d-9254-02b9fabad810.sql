-- Update existing product_variants table to match image-based approach
ALTER TABLE public.product_variants 
  DROP COLUMN IF EXISTS color,
  DROP COLUMN IF EXISTS size,
  DROP COLUMN IF EXISTS price;

ALTER TABLE public.product_variants 
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS hex_code TEXT,
  ADD COLUMN IF NOT EXISTS price_adjustment NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Update existing columns
ALTER TABLE public.product_variants 
  ALTER COLUMN image_url SET NOT NULL;

-- Add unique constraint for product_id and label
DROP INDEX IF EXISTS unique_product_variant_label;
CREATE UNIQUE INDEX unique_product_variant_label ON public.product_variants(product_id, label);

-- Add variant_id to cart_items if it doesn't exist
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

-- Create coupon_redemptions table
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID, -- will be filled after successful order
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for coupon_redemptions
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own redemptions" ON public.coupon_redemptions;
DROP POLICY IF EXISTS "Admins can view all redemptions" ON public.coupon_redemptions;

-- RLS policies for coupon_redemptions
CREATE POLICY "Users can view their own redemptions" ON public.coupon_redemptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all redemptions" ON public.coupon_redemptions FOR ALL USING (get_current_user_role() = 'ADMIN');

-- Update coupons table structure
ALTER TABLE public.coupons 
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_discount NUMERIC,
  ADD COLUMN IF NOT EXISTS usage_limit_global INTEGER,
  ADD COLUMN IF NOT EXISTS usage_limit_per_user INTEGER,
  ADD COLUMN IF NOT EXISTS applies_to TEXT DEFAULT 'all';

-- Rename discount_type to discount_kind if needed
DO $$ 
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='coupons' AND column_name='discount_type') THEN
    ALTER TABLE public.coupons RENAME COLUMN discount_type TO discount_kind;
  END IF;
END $$;

-- Migrate existing data
UPDATE public.coupons SET 
  starts_at = COALESCE(starts_at, created_at),
  ends_at = COALESCE(ends_at, expiration_date),
  usage_limit_global = COALESCE(usage_limit_global, usage_limit),
  usage_limit_per_user = COALESCE(usage_limit_per_user, 1)
WHERE starts_at IS NULL OR usage_limit_global IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_position ON product_variants(product_id, position);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_user ON coupon_redemptions(coupon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code_lower ON coupons(lower(code));