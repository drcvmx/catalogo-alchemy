import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Upload, Loader2, Trash2, ImageIcon, CheckCircle2, Globe, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getBrands, saveBrands } from "@/services/adminStore";

interface BrandData {
  id: string;
  name: string;
  description: string;
  tagline: string;
  logo_url: string | null;
  banner_url: string | null;
  hero_banner_url: string | null;
}

interface BrandEditDialogProps {
  brand: BrandData;
  isSuperAdmin: boolean;
  onSave: () => void;
}

const ImageField = ({
  label,
  description,
  value,
  fieldKey,
  brandName,
  onUploaded,
  onRemove,
  aspectHint,
}: {
  label: string;
  description: string;
  value: string | null;
  fieldKey: string;
  brandName: string;
  onUploaded: (url: string) => void;
  onRemove: () => void;
  aspectHint: string;
}) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Convert file to base64 data URL for local demo
      const reader = new FileReader();
      const url = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      onUploaded(url);
      toast({ title: "Imagen subida", description: label });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">{label}</span>
            {value && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
          </div>
          <p className="text-[11px] text-muted-foreground">{description} · {aspectHint}</p>
        </div>
      </div>

      {/* Large preview */}
      {value ? (
        <div className="relative rounded-lg border border-border overflow-hidden bg-black/40">
          <img
            src={value}
            alt={label}
            className="w-full max-h-48 object-contain"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 h-28 flex flex-col items-center justify-center gap-1.5">
          <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/60">Sin imagen</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 h-8 text-xs"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Subiendo..." : value ? "Cambiar" : "Subir"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
            onClick={() => onRemove()}
          >
            <Trash2 className="h-3 w-3" />
            Quitar
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
};

export const BrandEditDialog = ({ brand, isSuperAdmin, onSave }: BrandEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(brand.description || "");
  const [tagline, setTagline] = useState(brand.tagline || "");
  const [logoUrl, setLogoUrl] = useState(brand.logo_url || "");
  const [heroBannerUrl, setHeroBannerUrl] = useState(brand.hero_banner_url || "");
  const [saving, setSaving] = useState(false);
  const [scope, setScope] = useState<"global" | "local">("global");

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setDescription(brand.description || "");
      setTagline(brand.tagline || "");
      setLogoUrl(brand.logo_url || "");
      setHeroBannerUrl(brand.hero_banner_url || "");
      setScope("global");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        description,
        tagline,
        logo_url: logoUrl || null,
        hero_banner_url: heroBannerUrl || null,
      };

      // Update in localStorage via adminStore
      const brands = getBrands();
      let updated;
      if (isSuperAdmin && scope === "global") {
        // Update all brands with this name
        updated = brands.map(b =>
          b.name === brand.name ? { ...b, ...updateData } : b
        );
      } else {
        // Update only this specific brand
        updated = brands.map(b =>
          b.id === brand.id ? { ...b, ...updateData } : b
        );
      }
      saveBrands(updated);

      const scopeMsg = isSuperAdmin && scope === "global"
        ? `${brand.name} actualizada en todas las zonas`
        : `${brand.name} actualizada en esta zona`;

      toast({ title: "Marca actualizada", description: scopeMsg });
      setOpen(false);
      onSave();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const imageCount = [logoUrl, heroBannerUrl].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 h-6 w-6 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Settings className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-primary" />
            Configurar {brand.name}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {imageCount}/2 imágenes configuradas
          </p>
        </DialogHeader>

        <div className="space-y-5">
          {/* Scope selector - only for super admin */}
          {isSuperAdmin && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Alcance de cambios
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={scope === "global" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 h-9 text-xs"
                  onClick={() => setScope("global")}
                >
                  <Globe className="h-3.5 w-3.5" />
                  Todas las zonas
                </Button>
                <Button
                  type="button"
                  variant={scope === "local" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 h-9 text-xs"
                  onClick={() => setScope("local")}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Solo esta zona
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {scope === "global"
                  ? "Los cambios se aplicarán a esta marca en todas las sucursales."
                  : "Los cambios solo afectarán a esta marca en la zona actual."}
              </p>
            </div>
          )}

          {/* Text fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Título / Descripción</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: BUGATTI"
                className="bg-input border-border text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Tagline</Label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ej: Luxury Vape Experience"
                className="bg-input border-border text-sm"
              />
            </div>
          </div>

          {/* Image fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Imágenes de marca
            </h4>

            <ImageField
              label="Logo"
              description="Ícono cuadrado de la marca"
              value={logoUrl}
              fieldKey="logos"
              brandName={brand.name}
              aspectHint="500 × 500 px recomendado"
              onUploaded={(url) => setLogoUrl(url)}
              onRemove={() => setLogoUrl("")}
            />
            <ImageField
              label="Hero Banner"
              description="Banner grande en detalle de marca"
              value={heroBannerUrl}
              fieldKey="hero"
              brandName={brand.name}
              aspectHint="1000 × 1500 px recomendado"
              onUploaded={(url) => setHeroBannerUrl(url)}
              onRemove={() => setHeroBannerUrl("")}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
