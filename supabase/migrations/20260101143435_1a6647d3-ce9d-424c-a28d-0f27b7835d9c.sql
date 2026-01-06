-- Update vendors table slugs to be SEO-friendly based on name
UPDATE public.vendors v
SET slug = public.generate_vendor_slug(v.name)
WHERE v.slug IS NULL OR v.slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';