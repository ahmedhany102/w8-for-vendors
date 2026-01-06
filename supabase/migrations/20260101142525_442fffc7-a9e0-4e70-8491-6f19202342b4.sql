-- Update existing products to link them to their vendors based on user_id matching owner_id
UPDATE public.products p
SET vendor_id = v.id
FROM public.vendors v
WHERE p.user_id = v.owner_id
AND p.vendor_id IS NULL
AND v.status = 'active';