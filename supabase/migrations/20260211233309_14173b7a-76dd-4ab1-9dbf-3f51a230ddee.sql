
-- Drop existing foreign keys and recreate with CASCADE
ALTER TABLE public.categories DROP CONSTRAINT categories_brand_id_fkey;
ALTER TABLE public.categories ADD CONSTRAINT categories_brand_id_fkey 
  FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

ALTER TABLE public.variants DROP CONSTRAINT variants_category_id_fkey;
ALTER TABLE public.variants ADD CONSTRAINT variants_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
