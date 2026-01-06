-- Create simplified product_variants table for image-based color variants
DROP TABLE IF EXISTS product_color_variants CASCADE;
DROP TABLE IF EXISTS product_color_variant_options CASCADE;

-- Create new product_variants table with image-based approach
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- color name
  image_url TEXT NOT NULL, -- the product image for this color
  hex_code TEXT, -- optional hex color code
  price_adjustment NUMERIC DEFAULT 0, -- price adjustment from base price
  stock INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, label)
);

-- Enable RLS for product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_variants
CREATE POLICY "Anyone can view product variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Users can manage their product variants" ON public.product_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM products WHERE id = product_variants.product_id AND (user_id = auth.uid() OR get_current_user_role() = 'ADMIN'))
);

-- Add variant_id to cart_items
ALTER TABLE public.cart_items ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

-- Create coupon_redemptions table
CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID, -- will be filled after successful order
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for coupon_redemptions
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for coupon_redemptions
CREATE POLICY "Users can view their own redemptions" ON public.coupon_redemptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all redemptions" ON public.coupon_redemptions FOR ALL USING (get_current_user_role() = 'ADMIN');

-- Update coupons table structure to match requirements
ALTER TABLE public.coupons 
  RENAME COLUMN discount_type TO discount_kind;

ALTER TABLE public.coupons 
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_discount NUMERIC,
  ADD COLUMN IF NOT EXISTS usage_limit_global INTEGER,
  ADD COLUMN IF NOT EXISTS usage_limit_per_user INTEGER,
  ADD COLUMN IF NOT EXISTS applies_to TEXT DEFAULT 'all';

-- Migrate existing data
UPDATE public.coupons SET 
  starts_at = created_at,
  ends_at = expiration_date,
  usage_limit_global = usage_limit,
  usage_limit_per_user = 1
WHERE starts_at IS NULL;

-- Create indexes for performance
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_position ON product_variants(product_id, position);
CREATE INDEX idx_coupon_redemptions_coupon_user ON coupon_redemptions(coupon_id, user_id);
CREATE INDEX idx_coupons_code_lower ON coupons(lower(code));

-- Update trigger for product_variants
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();