# 🟢 Green Alchemy — Catálogo Digital Premium

> **Demo interactiva** de un sistema de catálogo digital multi-sucursal para una cadena de tiendas premium. Esta versión funciona 100 % sin backend ni base de datos — todos los datos se manejan con archivos estáticos y `localStorage`.

---

## ✨ Características principales

| Módulo | Descripción |
|---|---|
| **Catálogo por zona** | 12 sucursales con catálogo independiente, cada una con su propia URL (`/polanco`, `/condesa`, `/monterrey`, etc.) |
| **Marcas y productos** | 24 marcas con logos, banners, imágenes hero y más de 300 productos organizados por categoría |
| **Buscador y filtros** | Búsqueda en tiempo real + filtrado por categoría |
| **Tienda** | Vista de tienda con carrito de compras funcional |
| **Panel Admin** | CRUD completo de marcas, categorías y sabores con persistencia en localStorage |
| **Multi-zona** | Selector de zonas con configuraciones independientes |
| **Responsive** | Diseño optimizado para móvil, tablet y escritorio |
| **Dark mode** | Interfaz premium con tema oscuro |

---

## 🚀 Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/golden-catalog.git

# 2. Entrar al directorio
cd golden-catalog

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 📁 Estructura del proyecto

```
src/
├── pages/
│   ├── ZoneCatalog.tsx    # Catálogo por zona (página principal)
│   ├── Admin.tsx          # Panel de administración
│   ├── Auth.tsx           # Login (acceso directo en demo)
│   └── Index.tsx          # Tienda
├── services/
│   ├── brands.ts          # Datos estáticos (marcas y productos)
│   └── adminStore.ts      # Persistencia con localStorage
├── config/
│   └── zones.ts           # Configuración de las 12 zonas
├── views/                 # Vistas del catálogo (BrandDetail, CustomBrandDetail)
├── components/            # Componentes reutilizables (UI, admin, shared)
├── hooks/                 # Hooks personalizados (useAuth, useZoneCatalog)
└── context/               # Contextos (Cart, CartNotification)

public/
└── brand-assets/          # Assets locales (logos, banners, imágenes de productos)
    ├── logos/
    ├── banners/
    ├── hero/
    └── categories/
```

---

## 🔐 Panel de Administración

Accede a `/auth` y haz clic en **"Acceder al Dashboard"** — no se requiere usuario ni contraseña.

Desde el panel puedes:
- ➕ Agregar marcas, categorías y sabores
- ✏️ Editar nombres y precios
- 🔄 Activar / desactivar elementos (con cascade a hijos)
- 🗑️ Eliminar con confirmación
- 💰 Actualizar precios por categoría (local o global)

> Todos los cambios se persisten en `localStorage` y sobreviven al refresh.

---

## 🛠️ Stack tecnológico

- **React 18** + **TypeScript**
- **Vite** — Build tool ultra-rápido
- **Tailwind CSS** — Estilos utilitarios
- **shadcn/ui** — Componentes de UI premium
- **React Router** — Navegación SPA
- **React Query** — Manejo de estado asíncrono
- **Recharts** — Gráficas en el dashboard
- **localStorage** — Persistencia de datos (demo)

---

## 📱 Zonas disponibles

| # | Zona | URL |
|---|------|-----|
| 1 | Polanco | `/polanco` |
| 2 | Condesa | `/condesa` |
| 3 | Santa Fe | `/santa-fe` |
| 4 | Roma Norte | `/roma-norte` |
| 5 | Interlomas | `/interlomas` |
| 6 | Coyoacán | `/coyoacan` |
| 7 | Guadalajara | `/guadalajara` |
| 8 | Monterrey | `/monterrey` |
| 9 | Playa del Carmen | `/playa-del-carmen` |
| 10 | Puebla | `/puebla` |
| 11 | Querétaro | `/queretaro` |
| 12 | Cancún | `/cancun` |

---

## 📝 Notas

- Esta es una **versión demo** diseñada para presentar las funcionalidades del sistema sin depender de servicios externos.
- Los assets (logos, banners, imágenes) están incluidos localmente en `public/brand-assets/`.
- El archivo `.env` contiene configuraciones de ejemplo y **no se sube al repositorio** (incluido en `.gitignore`).

---

## 📄 Licencia

Proyecto privado — Todos los derechos reservados.
