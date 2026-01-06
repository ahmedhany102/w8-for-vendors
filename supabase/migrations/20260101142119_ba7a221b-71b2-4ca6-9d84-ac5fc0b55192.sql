-- Create storage bucket for vendor assets (logos, covers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-assets',
  'vendor-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own vendor assets
CREATE POLICY "Vendors can upload their own assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-assets' 
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to update their own vendor assets
CREATE POLICY "Vendors can update their own assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vendor-assets'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete their own vendor assets
CREATE POLICY "Vendors can delete their own assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendor-assets'
  AND auth.uid() IS NOT NULL
);

-- Allow public read access to vendor assets
CREATE POLICY "Public can view vendor assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-assets');