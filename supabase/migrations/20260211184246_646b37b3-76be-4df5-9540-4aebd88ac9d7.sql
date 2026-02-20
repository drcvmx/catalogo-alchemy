
-- Create public bucket for brand assets
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true);

-- Allow public read access
CREATE POLICY "Brand assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

-- Allow admins to upload/update/delete
CREATE POLICY "Admins can manage brand assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brand-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can update brand assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'brand-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete brand assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'brand-assets' AND auth.role() = 'authenticated');

-- Add new columns to brands table
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS mobile_banner_url TEXT,
ADD COLUMN IF NOT EXISTS hero_banner_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT '';

-- Categories already have image_url, no changes needed there
