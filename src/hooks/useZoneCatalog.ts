import { useState, useEffect, useMemo } from 'react';
import { brands as staticBrands, products as staticProducts } from '@/services/brands';
import { ZONE_BY_SLUG } from '@/config/zones';

// Types matching what the catalog expects
export interface CatalogBrand {
  id: string;
  name: string;
  description: string;
  tagline: string;
  logo_url: string;
  banner_url: string;
  hero_banner_url?: string;
  likes_count: number;
  created_at: string;
  is_active: boolean;
}

export interface CatalogCategory {
  id: string;
  brand_id: string;
  name: string;
  image?: string;
  is_active: boolean;
  price?: number;
}

export interface CatalogVariant {
  id: string;
  category_id: string;
  name: string;
  is_active: boolean;
}

// Product type expected by ProductAccordion
export interface CatalogProduct {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  in_stock: boolean;
  created_at: string;
}

export interface ZoneHero {
  hero_title: string;
  hero_subtitle: string;
}

interface UseZoneCatalogResult {
  brands: CatalogBrand[];
  categories: CatalogCategory[];
  variants: CatalogVariant[];
  loading: boolean;
  error: string | null;
  getBrandProducts: (brandId: string) => CatalogProduct[];
  brandHasProducts: (brandId: string) => boolean;
  zoneHero: ZoneHero | null;
}

const DEFAULT_LOGO = '/placeholder.svg';
const DEFAULT_BANNER = '/placeholder.svg';

export function useZoneCatalog(zoneSlug: string): UseZoneCatalogResult {
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [zoneHero, setZoneHero] = useState<ZoneHero | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // 1) Get zone info from config (static)
        const zoneData = ZONE_BY_SLUG[zoneSlug];

        if (!zoneData) {
          setError('Zona no encontrada');
          return;
        }

        setZoneHero({
          hero_title: zoneData.title || zoneData.name,
          hero_subtitle: 'Catálogo Premium 2026',
        });

        // 2) Transform brands from static data
        // For demo, we show all brands in all zones
        const transformedBrands: CatalogBrand[] = staticBrands.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description || '',
          tagline: '', // Not in static data
          logo_url: b.logo_url || DEFAULT_LOGO,
          banner_url: b.banner_url || DEFAULT_BANNER,
          hero_banner_url: undefined, // Not in static data
          likes_count: b.likes_count || 0,
          created_at: b.created_at || new Date().toISOString(),
          is_active: true,
        }));

        // 3) Transform categories from static products
        // We group products by (brand_id, category_name) to create "categories"
        const transformedCategories: CatalogCategory[] = [];
        const transformedVariants: CatalogVariant[] = [];
        
        // Helper to track unique categories
        const categoryMap = new Map<string, string>(); // key -> id

        staticProducts.forEach((p) => {
          const categoryKey = `${p.brand_id}-${p.category}`;
          let categoryId = categoryMap.get(categoryKey);

          if (!categoryId) {
            categoryId = `cat-${categoryKey}`; // simple ID generation
            categoryMap.set(categoryKey, categoryId);
            transformedCategories.push({
              id: categoryId,
              brand_id: p.brand_id,
              name: p.category,
              image: p.image_url || undefined,
              is_active: true,
              price: p.price,
            });
          }

          // Create a variant for each product
          transformedVariants.push({
            id: p.id,
            category_id: categoryId,
            name: p.name,
            is_active: p.in_stock,
          });
        });

        setBrands(transformedBrands);
        setCategories(transformedCategories);
        setVariants(transformedVariants);
      } catch (err) {
        console.error('Error loading catalog:', err);
        setError('Error cargando el catálogo');
      } finally {
        setLoading(false);
      }
    }

    if (zoneSlug) fetchData();
  }, [zoneSlug]);

  const getBrandProducts = useMemo(() => {
    return (brandId: string): CatalogProduct[] => {
      // Filter static products directly
      return staticProducts
        .filter((p) => p.brand_id === brandId)
        .map((p) => ({
          id: p.id,
          brand_id: p.brand_id,
          name: p.name,
          description: p.description,
          price: p.price,
          image_url: p.image_url,
          category: p.category,
          in_stock: p.in_stock,
          created_at: p.created_at,
        }));
    };
  }, []); // Static data doesn't change

  const brandHasProducts = useMemo(() => {
    return (brandId: string): boolean => {
      return staticProducts.some((p) => p.brand_id === brandId);
    };
  }, []);

  return {
    brands,
    categories,
    variants,
    loading,
    error,
    getBrandProducts,
    brandHasProducts,
    zoneHero,
  };
}
