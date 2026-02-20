/**
 * localStorage-backed demo store for Admin panel.
 * Initializes from static brands.ts data, persists all CRUD mutations.
 */

import { brands as staticBrands, products as staticProducts } from '@/services/brands';
import { ZONES, ZoneInfo } from '@/config/zones';

// ─── Types ───────────────────────────────────────────────────────────
export interface AdminZone {
    id: string;
    name: string;
    slug: string;
}

export interface AdminBrand {
    id: string;
    name: string;
    is_active: boolean;
    zone_id: string;
    description: string;
    tagline: string;
    logo_url: string | null;
    banner_url: string | null;
    hero_banner_url: string | null;
}

export interface AdminCategory {
    id: string;
    name: string;
    brand_id: string;
    is_active: boolean;
    price: number | null;
    image_url: string | null;
}

export interface AdminVariant {
    id: string;
    name: string;
    category_id: string;
    is_active: boolean;
}

// ─── Storage Keys ────────────────────────────────────────────────────
const KEYS = {
    brands: 'demo_admin_brands',
    categories: 'demo_admin_categories',
    variants: 'demo_admin_variants',
    initialized: 'demo_admin_initialized',
};

// ─── Seed from static data ───────────────────────────────────────────
function buildInitialData() {
    // Build brands (one per brand, assigned to first zone)
    const adminBrands: AdminBrand[] = staticBrands.map(b => ({
        id: b.id,
        name: b.name,
        is_active: true,
        zone_id: ZONES[0]?.slug || 'polanco',
        description: b.description || '',
        tagline: '',
        logo_url: b.logo_url || null,
        banner_url: b.banner_url || null,
        hero_banner_url: b.banner_url || null,
    }));

    // Build categories from unique category names per brand
    const categoryMap = new Map<string, AdminCategory>();
    staticProducts.forEach(p => {
        const catName = p.category || p.name; // Some products use category field
        const key = `${p.brand_id}-${catName}`;
        if (!categoryMap.has(key) && p.category) {
            categoryMap.set(key, {
                id: `cat-${p.brand_id}-${catName.toLowerCase().replace(/\s+/g, '-')}`,
                name: catName,
                brand_id: p.brand_id,
                is_active: true,
                price: p.price || null,
                image_url: p.image_url || null,
            });
        }
    });
    const adminCategories = Array.from(categoryMap.values());

    // Build variants (each product is a flavor variant)
    const adminVariants: AdminVariant[] = staticProducts
        .filter(p => p.category) // Only products with categories become variants
        .map(p => {
            const catName = p.category!;
            const catId = `cat-${p.brand_id}-${catName.toLowerCase().replace(/\s+/g, '-')}`;
            return {
                id: p.id,
                name: p.name,
                category_id: catId,
                is_active: p.in_stock !== false,
            };
        });

    return { adminBrands, adminCategories, adminVariants };
}

// ─── Public API ──────────────────────────────────────────────────────

/** Get zones from static config */
export function getZones(): AdminZone[] {
    return ZONES.map((z, i) => ({
        id: z.slug,
        name: z.name,
        slug: z.slug,
    }));
}

/** Initialize data if not already done */
export function ensureInitialized(): void {
    if (localStorage.getItem(KEYS.initialized)) return;

    const { adminBrands, adminCategories, adminVariants } = buildInitialData();
    localStorage.setItem(KEYS.brands, JSON.stringify(adminBrands));
    localStorage.setItem(KEYS.categories, JSON.stringify(adminCategories));
    localStorage.setItem(KEYS.variants, JSON.stringify(adminVariants));
    localStorage.setItem(KEYS.initialized, 'true');
}

/** Reset to original static data */
export function resetData(): void {
    localStorage.removeItem(KEYS.initialized);
    localStorage.removeItem(KEYS.brands);
    localStorage.removeItem(KEYS.categories);
    localStorage.removeItem(KEYS.variants);
    ensureInitialized();
}

// ─── Read ────────────────────────────────────────────────────────────
export function getBrands(): AdminBrand[] {
    const raw = localStorage.getItem(KEYS.brands);
    return raw ? JSON.parse(raw) : [];
}

export function getCategories(): AdminCategory[] {
    const raw = localStorage.getItem(KEYS.categories);
    return raw ? JSON.parse(raw) : [];
}

export function getVariants(): AdminVariant[] {
    const raw = localStorage.getItem(KEYS.variants);
    return raw ? JSON.parse(raw) : [];
}

// ─── Write ───────────────────────────────────────────────────────────
export function saveBrands(brands: AdminBrand[]): void {
    localStorage.setItem(KEYS.brands, JSON.stringify(brands));
}

export function saveCategories(categories: AdminCategory[]): void {
    localStorage.setItem(KEYS.categories, JSON.stringify(categories));
}

export function saveVariants(variants: AdminVariant[]): void {
    localStorage.setItem(KEYS.variants, JSON.stringify(variants));
}
