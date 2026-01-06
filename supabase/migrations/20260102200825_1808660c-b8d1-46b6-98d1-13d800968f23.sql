-- Drop and recreate the type check constraint to include mid_page_ads
ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_type_check;

ALTER TABLE public.sections ADD CONSTRAINT sections_type_check 
CHECK (type IN ('hero_carousel', 'category_grid', 'best_seller', 'hot_deals', 'last_viewed', 'category_products', 'manual', 'vendor_highlights', 'mid_page_ads'));

-- Now add the mid_page_ads section
INSERT INTO public.sections (title, type, scope, sort_order, is_active, config)
VALUES ('Mid Page Ads', 'mid_page_ads', 'global', 25, true, '{}')
ON CONFLICT DO NOTHING;