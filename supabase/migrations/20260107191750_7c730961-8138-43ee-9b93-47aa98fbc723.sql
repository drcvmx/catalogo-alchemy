-- Agregar campo price a la tabla categories
ALTER TABLE public.categories
ADD COLUMN price DECIMAL(10,2) DEFAULT NULL;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.categories.price IS 'Precio en MXN para todos los sabores de esta categoría';