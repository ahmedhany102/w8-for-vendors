-- Enable RLS on the products table (policies already exist but RLS was not enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Add a SELECT policy to allow everyone to view active products
CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
USING (true);