import { useMemo, useEffect, useRef, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import MainLayout from '@/components/shared/MainLayout';
import ScrollToTop from '@/components/shared/ScrollToTop';
import CatalogPageIndicator from '@/components/shared/CatalogPageIndicator';
import Home from '@/views/Home';
import BrandDetail from '@/views/BrandDetail';
import CustomBrandDetail from '@/views/CustomBrandDetail';
import { Loader2 } from 'lucide-react';
import { CatalogProvider } from '@/context/CatalogContext';
import { useZoneCatalog, CatalogBrand, CatalogCategory } from '@/hooks/useZoneCatalog';
import { ZONE_CONFIGS, ZONE_BY_SLUG } from '@/config/zones';

const ZoneCatalog = () => {
  const { zone } = useParams<{ zone: string }>();

  const brandSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const brandsGridRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  // Validate zone
  const zoneConfig = zone ? ZONE_CONFIGS[zone] : null;
  const zoneInfo = zone ? ZONE_BY_SLUG[zone] : undefined;

  // Load data from backend
  const { brands, categories, variants, loading, error, getBrandProducts, brandHasProducts, zoneHero } = useZoneCatalog(zone || '');

  const selectedBrand = useMemo(
    () => brands.find((b) => b.id === selectedBrandId) || null,
    [brands, selectedBrandId],
  );

  // Filter brands that have products for the catalog display
  const brandsWithProducts = useMemo(
    () => brands.filter((brand) => brandHasProducts(brand.id)),
    [brands, brandHasProducts],
  );

  // Total pages: Hero (1) + Brands Grid (2) + Each brand detail (3+)
  const totalPages = 2 + brandsWithProducts.length;

  // Select brand handler
  const selectBrand = (brandId: string | null) => {
    setSelectedBrandId(brandId);
  };

  // Detect current page based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      if (brandsGridRef.current) {
        const brandsTop = brandsGridRef.current.offsetTop;
        const brandsBottom = brandsTop + brandsGridRef.current.offsetHeight;

        if (scrollY + windowHeight * 0.5 >= brandsTop && scrollY < brandsBottom - windowHeight * 0.3) {
          setCurrentPage(2);
          return;
        }
      }

      if (brandsGridRef.current) {
        const brandsTop = brandsGridRef.current.offsetTop;
        if (scrollY + windowHeight * 0.5 < brandsTop) {
          setCurrentPage(1);
          return;
        }
      }

      for (let i = 0; i < brandsWithProducts.length; i++) {
        const brand = brandsWithProducts[i];
        const el = brandSectionRefs.current[brand.id];
        if (el) {
          const elTop = el.offsetTop;
          const elBottom = elTop + el.offsetHeight;
          if (scrollY + windowHeight * 0.5 >= elTop && scrollY < elBottom - windowHeight * 0.3) {
            setCurrentPage(3 + i);
            return;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [brandsWithProducts]);

  // Scroll to the brand section when a brand is selected from the grid
  useEffect(() => {
    if (!selectedBrand) return;

    const el = brandSectionRefs.current[selectedBrand.id];
    if (!el) return;

    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [selectedBrand]);

  // Redirect to 404 if zone is invalid
  if (!zoneConfig) {
    return <Navigate to="/404" replace />;
  }

  if (loading) {
    return (
      <MainLayout onSelectBrand={selectBrand} zoneName={zoneConfig.name} zoneInfo={zoneInfo} brands={brands} categories={categories} variants={variants}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando catálogo...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout onSelectBrand={selectBrand} zoneName={zoneConfig.name} zoneInfo={zoneInfo} brands={brands} categories={categories} variants={variants}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <p className="text-destructive text-lg">{error}</p>
            <p className="text-muted-foreground">Por favor intenta de nuevo más tarde</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Get categories for a brand with their images from DB
  const getBrandCategories = (brandId: string): CatalogCategory[] => {
    return categories.filter((c) => c.brand_id === brandId);
  };

  const renderBrandDetail = (brand: CatalogBrand) => {
    const brandCategories = getBrandCategories(brand.id);
    const hasMultipleCategories = brandCategories.length > 1;
    const hasCategoryImages = brandCategories.some((c) => c.image);
    const heroBanner = brand.hero_banner_url || brand.banner_url;

    // Use CustomBrandDetail when we have hero banner or category images
    if (heroBanner && (hasCategoryImages || hasMultipleCategories)) {
      const customCategories = brandCategories.map((c) => ({
        id: c.name,
        name: c.name,
        image: c.image,
      }));

      return (
        <CustomBrandDetail
          brand={brand}
          onBack={() => selectBrand(null)}
          showCloseButton={selectedBrand?.id === brand.id}
          heroBanner={heroBanner}
          brandTitle={brand.description || brand.name}
          tagline={brand.tagline}
          categories={customCategories}
        />
      );
    }

    // Use simple BrandDetail for brands without custom layout needs
    return (
      <BrandDetail brand={brand} onBack={() => selectBrand(null)} showCloseButton={selectedBrand?.id === brand.id} />
    );
  };

  return (
    <CatalogProvider value={{ getBrandProducts }}>
      <MainLayout onSelectBrand={selectBrand} zoneName={zoneConfig.name} zoneInfo={zoneInfo} brands={brands} categories={categories} variants={variants}>
        {/* Hero + grid de marcas */}
        <Home
          brands={brands}
          onBrandClick={selectBrand}
          selectedBrandId={selectedBrand?.id || null}
          brandsGridRef={brandsGridRef}
          zoneName={zoneConfig.name}
          heroTitle={zoneHero?.hero_title}
          heroSubtitle={zoneHero?.hero_subtitle}
        />

        {/* Catálogo scrolleable: solo marcas con productos */}
        <main>
          {brandsWithProducts.map((brand) => (
            <div
              key={brand.id}
              ref={(node) => {
                brandSectionRefs.current[brand.id] = node;
              }}
              id={`brand-${brand.id}`}
            >
              {renderBrandDetail(brand)}
            </div>
          ))}
        </main>

        <CatalogPageIndicator currentPage={currentPage} totalPages={totalPages} />
        <ScrollToTop />
      </MainLayout>
    </CatalogProvider>
  );
};

export default ZoneCatalog;
