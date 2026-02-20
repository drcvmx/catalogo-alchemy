

# Plan: Correcciones del Sistema (6 Bloques Independientes)

Cada bloque es una corrección aislada que no afecta a las demas. Se implementan en orden de prioridad.

---

## Bloque 1: GlobalSearch usa datos reales de la zona

**Problema**: `GlobalSearch` importa `getBrands()` y `getAllProducts()` de `services/brands.ts` (datos estaticos locales). La busqueda no refleja el catalogo real de la zona.

**Solucion**:
- Modificar `GlobalSearch` para recibir `brands` y `variants/categories` como props desde `ZoneCatalog` (que ya tiene los datos reales).
- Eliminar las importaciones de `services/brands.ts`.
- Buscar marcas por nombre y variantes por nombre dentro de los datos de la zona actual.
- Actualizar `Navbar` y `MainLayout` para pasar los datos del catalogo al buscador.

**Archivos a modificar**:
- `src/components/shared/GlobalSearch.tsx`
- `src/components/shared/Navbar.tsx`
- `src/components/shared/MainLayout.tsx`
- `src/pages/ZoneCatalog.tsx`

---

## Bloque 2: Proteccion de ruta /admin

**Problema**: Cualquier usuario puede acceder a `/admin` y ver un flash de la UI antes de la redireccion interna.

**Solucion**:
- Crear un componente `ProtectedRoute` que valide autenticacion y rol antes de renderizar.
- Mostrar un spinner de carga mientras se verifica el estado de auth.
- Envolver `<Admin />` con este componente en `App.tsx`.

**Archivos a crear/modificar**:
- Crear `src/components/shared/ProtectedRoute.tsx`
- Modificar `src/App.tsx`

---

## Bloque 3: Robustez de rutas (/:zone no capture todo)

**Problema**: `/:zone` es un parametro catch-all que podria capturar rutas como `/auth` o `/admin` si el orden cambia.

**Solucion**:
- Mover las rutas estaticas (`/auth`, `/admin`) antes de `/:zone` (ya estan, pero agregar validacion adicional).
- En `ZoneCatalog`, la validacion contra `ZONE_CONFIGS` ya redirige a 404 si el slug no es valido. Esto es suficiente, pero se puede reforzar con un comentario de documentacion y asegurar que el orden nunca cambie accidentalmente.

**Cambio minimo**: Agregar comentario explicativo en `App.tsx` sobre el orden critico de rutas. El sistema ya maneja esto correctamente por orden.

---

## Bloque 4: Optimizar toggles en Admin (sin fetchInventory completo)

**Problema**: Cada toggle de activar/desactivar llama `fetchInventory()` que descarga TODA la data (brands + categories + variants). Con muchas marcas esto genera peticiones innecesarias.

**Solucion**:
- Despues de un toggle exitoso, actualizar el estado local directamente en lugar de recargar todo.
- `toggleBrand`: actualizar `brands`, `categories` y `variants` en el state local.
- `toggleCategory`: actualizar `categories` y `variants` en el state local.
- `toggleVariant`: actualizar solo `variants` en el state local.
- Mantener `fetchInventory()` solo para operaciones que agregan/editan items (add, edit, price update).

**Archivos a modificar**:
- `src/pages/Admin.tsx` (funciones `toggleBrand`, `toggleCategory`, `toggleVariant`)

---

## Bloque 5: Eliminar `as any` en useZoneCatalog

**Problema**: Los campos `hero_title` y `hero_subtitle` se castean con `as any` porque los tipos autogenerados de Supabase ya deberian incluirlos (la migracion ya se ejecuto).

**Solucion**:
- Los tipos en `types.ts` se auto-generan. Verificar si ya incluyen `hero_title` y `hero_subtitle`.
- Si ya estan, simplemente remover los `as any` en `useZoneCatalog.ts` y `Admin.tsx`.
- Si no estan, los tipos se actualizaran automaticamente en el proximo ciclo; por ahora, el cast es inofensivo pero se limpiara.

**Archivos a modificar**:
- `src/hooks/useZoneCatalog.ts` (lineas 88-91)
- `src/pages/Admin.tsx` (lineas 170, 179)

---

## Bloque 6: Estabilizar useEffect en ProductAccordion

**Problema**: El `useEffect` en linea 47-58 depende de `categories.length` que es un valor derivado que puede cambiar en cada render, causando re-ejecuciones innecesarias.

**Solucion**:
- Cambiar la dependencia de `categories.length` a una referencia estable. Usar `categories` como string serializado o `useMemo` para estabilizar la lista.
- Alternativa mas simple: el `useEffect` depende de `[openCategory, isDesktop, categories.length]`. El problema real es que `categories` se recalcula cada render. Estabilizar usando `JSON.stringify(categories)` como comparador o memoizar `categories` antes de pasarlo.
- La solucion mas limpia: en `ProductAccordion`, cambiar la dependencia a un valor estable como el numero de categorias solo cuando realmente cambia, usando un ref para comparar.

**Archivos a modificar**:
- `src/components/products/ProductAccordion.tsx`

---

## Resumen de impacto

| Bloque | Riesgo | Impacto |
|--------|--------|---------|
| 1 - GlobalSearch | Bajo | Busqueda ahora muestra datos reales |
| 2 - ProtectedRoute | Bajo | Sin flash de contenido no autorizado |
| 3 - Rutas | Minimo | Documentacion preventiva |
| 4 - Toggle optimizado | Bajo | Menos peticiones a la DB |
| 5 - Quitar as any | Nulo | Limpieza de tipos |
| 6 - useEffect estable | Bajo | Menos re-renders innecesarios |

Ninguno de estos cambios elimina funcionalidad existente. Todos son mejoras incrementales y aisladas.

