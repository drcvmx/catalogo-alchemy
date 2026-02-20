import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ZONES } from "@/config/zones";
import {
  ensureInitialized, resetData, getZones, getBrands, getCategories, getVariants,
  saveBrands, saveCategories, saveVariants,
  type AdminBrand, type AdminCategory, type AdminVariant, type AdminZone,
} from "@/services/adminStore";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LogOut, ChevronDown, ChevronRight, Search, X, DollarSign, Check, MapPin, Type, Trash2, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddItemDialog } from "@/components/admin/AddItemDialog";
import { EditItemDialog } from "@/components/admin/EditItemDialog";
import { BrandEditDialog } from "@/components/admin/BrandEditDialog";
import { CategoryImageButton } from "@/components/admin/CategoryImageButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Component for price input with local state and blur/enter save
const PriceInput = ({
  categoryId,
  categoryName,
  brandName,
  initialPrice,
  onSave,
  isSuperAdmin,
}: {
  categoryId: string;
  categoryName: string;
  brandName: string;
  initialPrice: number | null;
  onSave: (categoryId: string, price: number | null, scope: "local" | "global", categoryName: string, brandName: string) => void;
  isSuperAdmin: boolean;
}) => {
  const [localValue, setLocalValue] = useState<string>(initialPrice?.toString() ?? "");
  const [hasChanges, setHasChanges] = useState(false);
  const [showScopeDialog, setShowScopeDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local value when prop changes (after save)
  useEffect(() => {
    const newValue = initialPrice?.toString() ?? "";
    if (!inputRef.current || document.activeElement !== inputRef.current) {
      setLocalValue(newValue);
      setHasChanges(false);
    }
  }, [initialPrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    setHasChanges(val !== (initialPrice?.toString() ?? ""));
  };

  const handleSave = () => {
    if (!hasChanges) return;
    if (isSuperAdmin) {
      setShowScopeDialog(true);
    } else {
      commitSave("local");
    }
  };

  const commitSave = (scope: "local" | "global") => {
    const price = localValue ? parseFloat(localValue) : null;
    onSave(categoryId, price, scope, categoryName, brandName);
    setHasChanges(false);
    setShowScopeDialog(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
      inputRef.current?.blur();
    }
  };

  const priceDisplay = localValue ? `$${localValue}` : "Sin precio";

  return (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      <DollarSign className="h-3 w-3 text-[hsl(142,70%,45%)] shrink-0" />
      <Input
        ref={inputRef}
        type="number"
        placeholder="0"
        value={localValue}
        onChange={handleChange}
        onBlur={() => { if (!showScopeDialog) handleSave(); }}
        onKeyDown={handleKeyDown}
        className="w-12 sm:w-16 h-6 sm:h-8 text-xs sm:text-sm bg-[hsl(142,70%,45%)]/10 border-[hsl(142,70%,45%)]/30 text-[hsl(142,70%,45%)] placeholder:text-[hsl(142,70%,45%)]/50 focus:border-[hsl(142,70%,45%)] px-1 sm:px-2"
      />
      {hasChanges && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,45%)]/20"
          onClick={handleSave}
        >
          <Check className="h-3 w-3" />
        </Button>
      )}

      {/* Scope dialog for super admin */}
      <AlertDialog open={showScopeDialog} onOpenChange={setShowScopeDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[hsl(142,70%,45%)]" />
              Cambiar precio: {priceDisplay}
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Aplicar el precio de <strong>{categoryName}</strong> ({brandName}) en todas las sucursales o solo en esta zona?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowScopeDialog(false)}>Cancelar</AlertDialogCancel>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => commitSave("local")}
            >
              <MapPin className="h-3.5 w-3.5" />
              Solo esta zona
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => commitSave("global")}
            >
              <Globe className="h-3.5 w-3.5" />
              Todas las zonas
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

type Zone = AdminZone;
type Brand = AdminBrand;
type Category = AdminCategory;
type Variant = AdminVariant;

const Admin = () => {
  const { user, userRole, loading, signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>(() => {
    return localStorage.getItem("admin_selected_zone") || "";
  });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroSaving, setHeroSaving] = useState(false);

  // Auth redirect is now handled by ProtectedRoute wrapper in App.tsx

  useEffect(() => {
    if (userRole) {
      fetchZones();
    }
  }, [userRole]);

  useEffect(() => {
    if (selectedZone) {
      fetchInventory();
      fetchHero();
    }
  }, [selectedZone]);

  const fetchHero = async () => {
    // Demo: fetch from static config
    const zone = ZONES.find(z => z.slug === selectedZone);
    if (zone) {
      setHeroTitle(zone.title || zone.name);
      setHeroSubtitle('Catálogo Premium 2026');
    }
  };

  const saveHero = async () => {
    setHeroSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 500));
    setHeroSaving(false);
    toast({ title: "Hero actualizado (Simulación)", description: "Los cambios se han guardado localmente." });
  };

  // Auto-expand when searching
  useEffect(() => {
    if (searchQuery) {
      const matchingBrandIds = new Set<string>();
      const matchingCategoryIds = new Set<string>();
      const query = searchQuery.toLowerCase();

      // Find matching variants and their parents
      variants.forEach(v => {
        if (v.name.toLowerCase().includes(query)) {
          const category = categories.find(c => c.id === v.category_id);
          if (category) {
            matchingCategoryIds.add(category.id);
            matchingBrandIds.add(category.brand_id);
          }
        }
      });

      // Find matching categories and their parents
      categories.forEach(c => {
        if (c.name.toLowerCase().includes(query)) {
          matchingBrandIds.add(c.brand_id);
          matchingCategoryIds.add(c.id);
        }
      });

      // Find matching brands
      brands.forEach(b => {
        if (b.name.toLowerCase().includes(query)) {
          matchingBrandIds.add(b.id);
        }
      });

      setExpandedBrands(matchingBrandIds);
      setExpandedCategories(matchingCategoryIds);
    }
  }, [searchQuery, brands, categories, variants]);

  const fetchZones = async () => {
    ensureInitialized();
    const data = getZones();
    setZones(data);
    const savedZone = localStorage.getItem("admin_selected_zone");
    const validSaved = savedZone && data.some(z => z.id === savedZone);

    if (userRole?.zone_id) {
      setSelectedZone(userRole.zone_id);
    } else if (validSaved) {
      setSelectedZone(savedZone!);
    } else if (data.length > 0) {
      setSelectedZone(data[0].id);
    }
  };

  const fetchInventory = async () => {
    ensureInitialized();
    // Read from localStorage
    const allBrands = getBrands();
    const allCategories = getCategories();
    const allVariants = getVariants();

    // In demo all brands show in all zones (no zone filtering needed)
    const sortedBrands = allBrands.sort((a, b) => a.name.localeCompare(b.name));
    setBrands(sortedBrands);

    const brandIds = sortedBrands.map(b => b.id);
    const filteredCategories = allCategories
      .filter(c => brandIds.includes(c.brand_id))
      .sort((a, b) => a.name.localeCompare(b.name));
    setCategories(filteredCategories);

    const categoryIds = filteredCategories.map(c => c.id);
    const filteredVariants = allVariants
      .filter(v => categoryIds.includes(v.category_id))
      .sort((a, b) => a.name.localeCompare(b.name));
    setVariants(filteredVariants);
  };

  // Filter functions
  const filterByStatus = <T extends { is_active: boolean }>(items: T[]): T[] => {
    if (filterStatus === "all") return items;
    return items.filter(item => filterStatus === "active" ? item.is_active : !item.is_active);
  };

  const filterBySearch = <T extends { name: string }>(items: T[]): T[] => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Check if item matches search (for highlighting)
  const matchesSearch = (name: string) => {
    if (!searchQuery) return false;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Check if brand has matching children
  const brandHasMatchingChildren = (brandId: string) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    const brandCategories = categories.filter(c => c.brand_id === brandId);
    const hasMatchingCategory = brandCategories.some(c => c.name.toLowerCase().includes(query));

    const categoryIds = brandCategories.map(c => c.id);
    const hasMatchingVariant = variants.some(v =>
      categoryIds.includes(v.category_id) && v.name.toLowerCase().includes(query)
    );

    return hasMatchingCategory || hasMatchingVariant;
  };

  // Check if category has matching children
  const categoryHasMatchingChildren = (categoryId: string) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return variants.some(v =>
      v.category_id === categoryId && v.name.toLowerCase().includes(query)
    );
  };

  // Helper: persist current state to localStorage
  const persistBrands = (updated: Brand[]) => { setBrands(updated); saveBrands(updated); };
  const persistCategories = (updated: Category[]) => { setCategories(updated); saveCategories(updated); };
  const persistVariants = (updated: Variant[]) => { setVariants(updated); saveVariants(updated); };

  // ADD functions
  const addBrand = async (name: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const newBrand: Brand = {
      id: `brand-${Date.now()}`,
      name,
      is_active: true,
      zone_id: selectedZone,
      description: "",
      tagline: "",
      logo_url: null,
      banner_url: null,
      hero_banner_url: null
    };

    persistBrands([...brands, newBrand]);
    toast({ title: "Marca agregada", description: name });
  };

  const addCategory = async (name: string, brandId?: string) => {
    if (!brandId) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona una marca" });
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 300));

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name,
      brand_id: brandId,
      is_active: true,
      price: null,
      image_url: null
    };

    persistCategories([...categories, newCategory]);
    toast({ title: "Categoría agregada", description: name });
  };

  const addVariant = async (name: string, categoryId?: string) => {
    if (!categoryId) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona una categoría" });
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 300));

    const newVariant: Variant = {
      id: `var-${Date.now()}`,
      name,
      category_id: categoryId,
      is_active: true
    };

    persistVariants([...variants, newVariant]);
    toast({ title: "Sabor agregado", description: name });
  };

  // EDIT functions
  const editBrand = async (brandId: string, newName: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const updated = brands.map(b => b.id === brandId ? { ...b, name: newName } : b);
    persistBrands(updated);
    toast({ title: "Marca actualizada", description: newName });
  };

  const editCategory = async (categoryId: string, newName: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const updated = categories.map(c => c.id === categoryId ? { ...c, name: newName } : c);
    persistCategories(updated);
    toast({ title: "Categoría actualizada", description: newName });
  };

  const updateCategoryPrice = async (categoryId: string, price: number | null, scope: "local" | "global", categoryName: string, brandName: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (scope === "global") {
      const updated = categories.map(c => c.name === categoryName ? { ...c, price } : c);
      persistCategories(updated);
      toast({ title: "Precio actualizado globalmente", description: `${categoryName}: ${price ? `$${price} MXN` : "Sin precio"}` });
    } else {
      const updated = categories.map(c => c.id === categoryId ? { ...c, price } : c);
      persistCategories(updated);
      toast({ title: "Precio actualizado", description: price ? `$${price} MXN` : "Sin precio" });
    }
  };

  const editVariant = async (variantId: string, newName: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const updated = variants.map(v => v.id === variantId ? { ...v, name: newName } : v);
    persistVariants(updated);
    toast({ title: "Sabor actualizado", description: newName });
  };

  // Toggle functions
  const toggleBrand = async (brand: Brand) => {
    const newActive = !brand.is_active;
    const updatedBrands = brands.map(b => b.id === brand.id ? { ...b, is_active: newActive } : b);
    persistBrands(updatedBrands);

    const brandCategories = categories.filter(c => c.brand_id === brand.id);
    const categoryIds = brandCategories.map(c => c.id);
    const updatedCategories = categories.map(c => c.brand_id === brand.id ? { ...c, is_active: newActive } : c);
    persistCategories(updatedCategories);
    const updatedVariants = variants.map(v => categoryIds.includes(v.category_id) ? { ...v, is_active: newActive } : v);
    persistVariants(updatedVariants);

    toast({
      title: newActive ? "Marca activada" : "Marca desactivada",
      description: `${brand.name} ${newActive ? "y sus productos" : ""}`,
    });
  };

  const toggleCategory = async (category: Category) => {
    const newActive = !category.is_active;
    const updatedCategories = categories.map(c => c.id === category.id ? { ...c, is_active: newActive } : c);
    persistCategories(updatedCategories);
    const updatedVariants = variants.map(v => v.category_id === category.id ? { ...v, is_active: newActive } : v);
    persistVariants(updatedVariants);

    toast({
      title: newActive ? "Categoría activada" : "Categoría desactivada",
      description: `${category.name}`,
    });
  };

  // DELETE functions
  const deleteBrand = async (brand: Brand, scope: "local" | "global" = "local") => {
    const brandCategories = categories.filter(c => c.brand_id === brand.id);
    const categoryIds = brandCategories.map(c => c.id);
    persistBrands(brands.filter(b => b.id !== brand.id));
    persistCategories(categories.filter(c => c.brand_id !== brand.id));
    persistVariants(variants.filter(v => !categoryIds.includes(v.category_id)));
    toast({ title: "Marca eliminada", description: `${brand.name}` });
  };

  const deleteCategory = async (category: Category, brandName: string, scope: "local" | "global" = "local") => {
    persistCategories(categories.filter(c => c.id !== category.id));
    persistVariants(variants.filter(v => v.category_id !== category.id));
    toast({ title: "Categoría eliminada", description: `${category.name}` });
  };

  const deleteVariant = async (variant: Variant, categoryName: string, brandName: string, scope: "local" | "global" = "local") => {
    persistVariants(variants.filter(v => v.id !== variant.id));
    toast({ title: "Sabor eliminado", description: variant.name });
  };

  const toggleVariant = async (variant: Variant) => {
    const newActive = !variant.is_active;
    const updated = variants.map(v => v.id === variant.id ? { ...v, is_active: newActive } : v);
    persistVariants(updated);

    toast({
      title: newActive ? "Variante activada" : "Variante desactivada",
      description: variant.name,
    });
  };

  const toggleExpandBrand = (brandId: string) => {
    const newExpanded = new Set(expandedBrands);
    if (newExpanded.has(brandId)) {
      newExpanded.delete(brandId);
    } else {
      newExpanded.add(brandId);
    }
    setExpandedBrands(newExpanded);
  };

  const toggleExpandCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  const currentZone = zones.find(z => z.id === selectedZone);

  // Apply filters
  const filteredBrands = filterByStatus(brands).filter(b =>
    matchesSearch(b.name) || brandHasMatchingChildren(b.id)
  );

  const activeBrands = brands.filter(b => b.is_active).length;
  const activeCategories = categories.filter(c => c.is_active).length;
  const activeVariants = variants.filter(v => v.is_active).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Mobile: Stack layout */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
              <h1 className="text-lg sm:text-2xl font-bold metallic-text">Panel Admin</h1>
              {isSuperAdmin && zones.length > 0 && (
                <Select value={selectedZone} onValueChange={(v) => { setSelectedZone(v); localStorage.setItem("admin_selected_zone", v); }}>
                  <SelectTrigger className="w-32 sm:w-48 bg-input border-border text-sm">
                    <SelectValue placeholder="Zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!isSuperAdmin && currentZone && (
                <span className="text-sm text-muted-foreground">{currentZone.name}</span>
              )}
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="shrink-0">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Zone Header */}
      {currentZone && (
        <div className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
          <div className="card-premium rounded-lg p-3 sm:p-4 mb-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-wide uppercase">{currentZone.name}</h2>
          </div>
        </div>
      )}

      {/* Hero Editor (super admin only) */}
      {isSuperAdmin && selectedZone && (
        <div className="container mx-auto px-3 sm:px-4">
          <div className="card-premium rounded-lg p-3 sm:p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Type className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm sm:text-base">Texto del Hero</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Título principal</label>
                <Input
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="Ej: INTERLOMAS"
                  className="bg-input border-border text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Subtítulo</label>
                <Input
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="Ej: Catálogo Premium 2026"
                  className="bg-input border-border text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button size="sm" onClick={saveHero} disabled={heroSaving}>
                {heroSaving ? "Guardando..." : "Guardar Hero"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="card-premium rounded-lg p-2 sm:p-4 text-center">
            <div className="text-xl sm:text-3xl font-bold text-primary">{activeBrands}</div>
            <div className="text-[10px] sm:text-sm text-muted-foreground">Marcas</div>
          </div>
          <div className="card-premium rounded-lg p-2 sm:p-4 text-center">
            <div className="text-xl sm:text-3xl font-bold text-primary">{activeCategories}</div>
            <div className="text-[10px] sm:text-sm text-muted-foreground">Categorías</div>
          </div>
          <div className="card-premium rounded-lg p-2 sm:p-4 text-center">
            <div className="text-xl sm:text-3xl font-bold text-primary">{activeVariants}</div>
            <div className="text-[10px] sm:text-sm text-muted-foreground">Variantes</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card-premium rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border text-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
              <SelectTrigger className="w-full sm:w-40 bg-input border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {searchQuery && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Resultados: "{searchQuery}"
            </p>
          )}
        </div>

        {/* Inventory Tree */}
        <div className="card-premium rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Inventario</h2>
            <div className="flex items-center gap-1 sm:gap-2">
              <AddItemDialog type="brand" onAdd={addBrand} triggerClassName="text-xs" />
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">Agregar marca</span>
            </div>
          </div>

          <div className="space-y-2">
            {filteredBrands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchQuery ? "No se encontraron resultados" : "No hay marcas"}
              </div>
            ) : (
              filteredBrands.map((brand) => {
                const brandCategories = filterByStatus(categories.filter(c => c.brand_id === brand.id))
                  .filter(c => !searchQuery || matchesSearch(c.name) || categoryHasMatchingChildren(c.id));
                const isExpanded = expandedBrands.has(brand.id);

                return (
                  <div key={brand.id} className="border border-border rounded-lg overflow-hidden">
                    {/* Brand Row */}
                    <div
                      className={`group flex items-center justify-between p-2 sm:p-3 cursor-pointer hover:bg-muted/50 transition-colors ${!brand.is_active ? 'opacity-50' : ''
                        } ${matchesSearch(brand.name) ? 'bg-primary/10' : ''}`}
                      onClick={() => toggleExpandBrand(brand.id)}
                    >
                      <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-semibold text-sm sm:text-lg truncate">{brand.name}</span>
                        <EditItemDialog
                          currentName={brand.name}
                          itemType="marca"
                          onSave={(newName) => editBrand(brand.id, newName)}
                        />
                        <BrandEditDialog
                          brand={brand}
                          isSuperAdmin={!!isSuperAdmin}
                          onSave={fetchInventory}
                        />
                        <span className="text-[10px] sm:text-sm text-muted-foreground shrink-0 hidden xs:inline">
                          ({categories.filter(c => c.brand_id === brand.id && c.is_active).length})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <AddItemDialog
                          type="category"
                          brands={[brand]}
                          selectedBrandId={brand.id}
                          onAdd={(name) => addCategory(name, brand.id)}
                          triggerClassName="opacity-60 hover:opacity-100 h-6 w-6 sm:h-8 sm:w-8"
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar "{brand.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminarán todas las categorías y sabores de esta marca. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              {isSuperAdmin ? (
                                <>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
                                    onClick={() => deleteBrand(brand, "local")}
                                  >
                                    <MapPin className="h-3.5 w-3.5" />
                                    Solo esta zona
                                  </AlertDialogAction>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
                                    onClick={() => deleteBrand(brand, "global")}
                                  >
                                    <Globe className="h-3.5 w-3.5" />
                                    Todas las zonas
                                  </AlertDialogAction>
                                </>
                              ) : (
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteBrand(brand)}
                                >
                                  Eliminar
                                </AlertDialogAction>
                              )}
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Switch
                          checked={brand.is_active}
                          onCheckedChange={() => toggleBrand(brand)}
                          onClick={(e) => e.stopPropagation()}
                          className="scale-75 sm:scale-100"
                        />
                      </div>
                    </div>

                    {/* Categories */}
                    {isExpanded && brandCategories.length > 0 && (
                      <div className="border-t border-border bg-muted/20">
                        {brandCategories.map((category) => {
                          const categoryVariants = filterByStatus(variants.filter(v => v.category_id === category.id))
                            .filter(v => !searchQuery || matchesSearch(v.name));
                          const isCatExpanded = expandedCategories.has(category.id);

                          return (
                            <div key={category.id}>
                              {/* Category Row */}
                              <div
                                className={`group flex items-center justify-between p-2 sm:p-3 pl-6 sm:pl-10 cursor-pointer hover:bg-muted/50 transition-colors ${!category.is_active ? 'opacity-50' : ''
                                  } ${matchesSearch(category.name) ? 'bg-primary/10' : ''}`}
                                onClick={() => toggleExpandCategory(category.id)}
                              >
                                <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
                                  {isCatExpanded ? (
                                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                                  )}
                                  <span className="font-medium text-xs sm:text-base truncate">{category.name}</span>
                                  <EditItemDialog
                                    currentName={category.name}
                                    itemType="categoría"
                                    onSave={(newName) => editCategory(category.id, newName)}
                                  />
                                  <CategoryImageButton
                                    categoryId={category.id}
                                    categoryName={category.name}
                                    brandName={brand.name}
                                    imageUrl={category.image_url}
                                    onUpdated={fetchInventory}
                                  />
                                  <span className="text-[10px] sm:text-sm text-muted-foreground shrink-0 hidden xs:inline">
                                    ({variants.filter(v => v.category_id === category.id && v.is_active).length})
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <PriceInput
                                    categoryId={category.id}
                                    categoryName={category.name}
                                    brandName={brand.name}
                                    initialPrice={category.price}
                                    onSave={updateCategoryPrice}
                                    isSuperAdmin={!!isSuperAdmin}
                                  />
                                  <AddItemDialog
                                    type="variant"
                                    categories={[category]}
                                    selectedCategoryId={category.id}
                                    onAdd={(name) => addVariant(name, category.id)}
                                    triggerClassName="opacity-60 hover:opacity-100 h-5 w-5 sm:h-7 sm:w-7"
                                  />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 sm:h-7 sm:w-7 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Trash2 className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar "{category.name}"?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Se eliminarán todos los sabores de esta categoría. Esta acción no se puede deshacer.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        {isSuperAdmin ? (
                                          <>
                                            <AlertDialogAction
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
                                              onClick={() => deleteCategory(category, brand.name, "local")}
                                            >
                                              <MapPin className="h-3.5 w-3.5" />
                                              Solo esta zona
                                            </AlertDialogAction>
                                            <AlertDialogAction
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
                                              onClick={() => deleteCategory(category, brand.name, "global")}
                                            >
                                              <Globe className="h-3.5 w-3.5" />
                                              Todas las zonas
                                            </AlertDialogAction>
                                          </>
                                        ) : (
                                          <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={() => deleteCategory(category, brand.name)}
                                          >
                                            Eliminar
                                          </AlertDialogAction>
                                        )}
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <Switch
                                    checked={category.is_active}
                                    onCheckedChange={() => toggleCategory(category)}
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={!brand.is_active}
                                    className="scale-75 sm:scale-100"
                                  />
                                </div>
                              </div>

                              {/* Variants */}
                              {isCatExpanded && categoryVariants.length > 0 && (
                                <div className="border-t border-border/50 bg-muted/30">
                                  {categoryVariants.map((variant) => (
                                    <div
                                      key={variant.id}
                                      className={`group flex items-center justify-between p-1.5 sm:p-2 pl-10 sm:pl-16 hover:bg-muted/50 transition-colors ${!variant.is_active ? 'opacity-50' : ''
                                        } ${matchesSearch(variant.name) ? 'bg-primary/10' : ''}`}
                                    >
                                      <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                        <span className="text-xs sm:text-sm truncate">{variant.name}</span>
                                        <EditItemDialog
                                          currentName={variant.name}
                                          itemType="sabor"
                                          onSave={(newName) => editVariant(variant.id, newName)}
                                        />
                                      </div>
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 w-5 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                                            >
                                              <Trash2 className="h-2.5 w-2.5" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar "{variant.name}"?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Este sabor será eliminado permanentemente.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              {isSuperAdmin ? (
                                                <>
                                                  <AlertDialogAction
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
                                                    onClick={() => deleteVariant(variant, category.name, brand.name, "local")}
                                                  >
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    Solo esta zona
                                                  </AlertDialogAction>
                                                  <AlertDialogAction
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
                                                    onClick={() => deleteVariant(variant, category.name, brand.name, "global")}
                                                  >
                                                    <Globe className="h-3.5 w-3.5" />
                                                    Todas las zonas
                                                  </AlertDialogAction>
                                                </>
                                              ) : (
                                                <AlertDialogAction
                                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                  onClick={() => deleteVariant(variant, category.name, brand.name)}
                                                >
                                                  Eliminar
                                                </AlertDialogAction>
                                              )}
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                        <Switch
                                          checked={variant.is_active}
                                          onCheckedChange={() => toggleVariant(variant)}
                                          disabled={!category.is_active || !brand.is_active}
                                          className="scale-[0.6] sm:scale-75"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
