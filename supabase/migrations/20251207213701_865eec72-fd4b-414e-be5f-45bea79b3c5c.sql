-- Add updated_at column to coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create or replace trigger function for coupons updated_at
CREATE OR REPLACE FUNCTION public.update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_coupons_updated_at ON public.coupons;
CREATE TRIGGER trigger_update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_coupons_updated_at();