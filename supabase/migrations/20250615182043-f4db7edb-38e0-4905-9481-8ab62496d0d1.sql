
-- Enable RLS for both tables (if not already enabled)
ALTER TABLE public.product_color_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_color_variant_options ENABLE ROW LEVEL SECURITY;

-- REVOKE all by default to close any gaps
REVOKE ALL ON public.product_color_variants FROM PUBLIC;
REVOKE ALL ON public.product_color_variant_options FROM PUBLIC;

-- Policy: Allow users to manage their own product color variants
CREATE POLICY "Users can manage their product color variants"
  ON public.product_color_variants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_color_variants.product_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_color_variants.product_id
        AND p.user_id = auth.uid()
    )
  );

-- Policy: Allow admins to manage all color variants
CREATE POLICY "Admins can manage all product color variants"
  ON public.product_color_variants
  FOR ALL
  TO authenticated
  USING (
    public.get_current_user_role() = 'ADMIN'
  )
  WITH CHECK (
    public.get_current_user_role() = 'ADMIN'
  );

-- Policy: Allow users to manage their own color variant options (must own parent color variant)
CREATE POLICY "Users can manage their product color variant options"
  ON public.product_color_variant_options
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.product_color_variants cv
      JOIN public.products p ON p.id = cv.product_id
      WHERE cv.id = product_color_variant_options.color_variant_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_color_variants cv
      JOIN public.products p ON p.id = cv.product_id
      WHERE cv.id = product_color_variant_options.color_variant_id
        AND p.user_id = auth.uid()
    )
  );

-- Policy: Allow admins to manage all color variant options
CREATE POLICY "Admins can manage all color variant options"
  ON public.product_color_variant_options
  FOR ALL
  TO authenticated
  USING (
    public.get_current_user_role() = 'ADMIN'
  )
  WITH CHECK (
    public.get_current_user_role() = 'ADMIN'
  );

-- Optional: Users can read product variant data for any public products (add more strict policy logic if desired)
CREATE POLICY "Anyone can read variant data for public products"
  ON public.product_color_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_color_variants.product_id
        AND (p.featured = true OR p.user_id = auth.uid() OR public.get_current_user_role() = 'ADMIN')
    )
  );

CREATE POLICY "Anyone can read variant options for public products"
  ON public.product_color_variant_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_color_variants cv
      JOIN public.products p ON p.id = cv.product_id
      WHERE cv.id = product_color_variant_options.color_variant_id
        AND (p.featured = true OR p.user_id = auth.uid() OR public.get_current_user_role() = 'ADMIN')
    )
  );
