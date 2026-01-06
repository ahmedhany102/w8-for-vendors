-- Fix coupons RLS policies to allow reading coupons for edge functions and users
-- This fixes the issue where percentage-based coupons fail because users/functions can't read the coupons table

-- Allow authenticated users to read active coupons
CREATE POLICY "Users can read active coupons" 
ON public.coupons 
FOR SELECT 
TO authenticated
USING (active = true);

-- Allow anonymous users to read active coupons (for guest checkout with coupons)
CREATE POLICY "Public can read active coupons" 
ON public.coupons 
FOR SELECT 
TO anon
USING (active = true);

-- Allow admins to manage all coupons
CREATE POLICY "Admins can manage coupons" 
ON public.coupons 
FOR ALL 
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));