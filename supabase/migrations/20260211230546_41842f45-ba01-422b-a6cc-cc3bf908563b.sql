
-- Add editable hero fields to zones table
ALTER TABLE public.zones ADD COLUMN hero_title text;
ALTER TABLE public.zones ADD COLUMN hero_subtitle text;

-- Set default values for existing zones
UPDATE public.zones SET hero_title = name, hero_subtitle = 'Catálogo Premium 2026';
