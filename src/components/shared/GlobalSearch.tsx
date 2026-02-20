import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { CatalogBrand, CatalogCategory, CatalogVariant } from '@/hooks/useZoneCatalog';

interface SearchBrand {
  id: string;
  name: string;
  logo_url: string;
}

interface SearchProduct {
  id: string;
  brand_id: string;
  name: string;
  category: string;
}

interface GlobalSearchProps {
  onSelectBrand?: (brandId: string) => void;
  brands?: CatalogBrand[];
  categories?: CatalogCategory[];
  variants?: CatalogVariant[];
}

const GlobalSearch = ({ onSelectBrand, brands = [], categories = [], variants = [] }: GlobalSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ brands: SearchBrand[]; products: SearchProduct[] }>({ brands: [], products: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Build searchable products from categories + variants
  const searchableProducts = useMemo((): SearchProduct[] => {
    return variants.map((v) => {
      const cat = categories.find((c) => c.id === v.category_id);
      return {
        id: v.id,
        brand_id: cat?.brand_id || '',
        name: v.name,
        category: cat?.name || '',
      };
    });
  }, [categories, variants]);

  // Search logic
  useEffect(() => {
    if (query.length < 2) {
      setResults({ brands: [], products: [] });
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();

    const matchedBrands = brands
      .filter((b) => b.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 3);

    const matchedProducts = searchableProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(normalizedQuery) ||
          p.category.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 6);

    setResults({ brands: matchedBrands, products: matchedProducts });
  }, [query, brands, searchableProducts]);

  const handleSelectBrand = (brandId: string) => {
    onSelectBrand?.(brandId);
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectProduct = (product: SearchProduct) => {
    onSelectBrand?.(product.brand_id);
    setIsOpen(false);
    setQuery('');
  };

  const hasResults = results.brands.length > 0 || results.products.length > 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Search trigger */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Buscar"
        >
          <Search className="w-5 h-5 text-white/80" />
        </button>
      ) : (
        <div className="fixed inset-x-0 top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/30 px-4 py-3 animate-fade-in md:relative md:inset-auto md:bg-transparent md:border-0 md:p-0">
          <div className="flex items-center gap-2 max-w-md mx-auto md:max-w-none md:mx-0">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar marca o sabor..."
                className="w-full md:w-64 pl-9 pr-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setQuery('');
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white/80" />
            </button>
          </div>
        </div>
      )}

      {/* Results dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="fixed inset-x-4 top-16 md:absolute md:inset-auto md:top-full md:right-0 md:mt-2 w-auto md:w-80 bg-white rounded-lg shadow-xl border border-border overflow-hidden z-50 animate-fade-in">
          {hasResults ? (
            <div className="max-h-80 overflow-y-auto">
              {/* Brands */}
              {results.brands.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] tracking-widest text-muted-foreground uppercase px-2 mb-1">Marcas</p>
                  {results.brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => handleSelectBrand(brand.id)}
                      className="w-full flex items-center gap-3 px-2 py-2 hover:bg-muted rounded-md transition-colors text-left"
                    >
                      <img src={brand.logo_url} alt={brand.name} className="w-8 h-8 object-contain" />
                      <span className="text-sm font-medium text-foreground">{brand.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Divider */}
              {results.brands.length > 0 && results.products.length > 0 && (
                <div className="h-px bg-border mx-2" />
              )}

              {/* Products */}
              {results.products.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] tracking-widest text-muted-foreground uppercase px-2 mb-1">Sabores</p>
                  {results.products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full flex items-center justify-between px-2 py-2 hover:bg-muted rounded-md transition-colors text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No se encontraron resultados</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
