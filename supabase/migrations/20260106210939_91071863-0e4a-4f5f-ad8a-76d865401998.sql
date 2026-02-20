
-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'zone_admin');

-- Tabla de zonas
CREATE TABLE public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de marcas (pertenecen a una zona)
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de categorías/modelos (pertenecen a una marca)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de variantes/sabores (pertenecen a una categoría)
CREATE TABLE public.variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función para verificar rol (SECURITY DEFINER para evitar recursión)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Función para verificar si tiene acceso a zona
CREATE OR REPLACE FUNCTION public.has_zone_access(_user_id UUID, _zone_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND (role = 'super_admin' OR (role = 'zone_admin' AND zone_id = _zone_id))
  )
$$;

-- Políticas para zones (lectura pública, escritura solo super_admin)
CREATE POLICY "Zones are viewable by everyone" ON public.zones
  FOR SELECT USING (true);

CREATE POLICY "Super admin can manage zones" ON public.zones
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Políticas para brands (lectura pública, escritura por admins con acceso)
CREATE POLICY "Brands are viewable by everyone" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage brands in their zone" ON public.brands
  FOR ALL TO authenticated
  USING (public.has_zone_access(auth.uid(), zone_id))
  WITH CHECK (public.has_zone_access(auth.uid(), zone_id));

-- Políticas para categories
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories in their zone" ON public.categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.brands b 
      WHERE b.id = brand_id AND public.has_zone_access(auth.uid(), b.zone_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brands b 
      WHERE b.id = brand_id AND public.has_zone_access(auth.uid(), b.zone_id)
    )
  );

-- Políticas para variants
CREATE POLICY "Variants are viewable by everyone" ON public.variants
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage variants in their zone" ON public.variants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.categories c 
      JOIN public.brands b ON b.id = c.brand_id
      WHERE c.id = category_id AND public.has_zone_access(auth.uid(), b.zone_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.categories c 
      JOIN public.brands b ON b.id = c.brand_id
      WHERE c.id = category_id AND public.has_zone_access(auth.uid(), b.zone_id)
    )
  );

-- Políticas para user_roles (solo lectura propia, super_admin gestiona)
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Índices para mejor rendimiento
CREATE INDEX idx_brands_zone ON public.brands(zone_id);
CREATE INDEX idx_categories_brand ON public.categories(brand_id);
CREATE INDEX idx_variants_category ON public.variants(category_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
