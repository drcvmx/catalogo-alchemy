import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageIcon, Upload, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CategoryImageButtonProps {
  categoryId: string;
  categoryName: string;
  brandName: string;
  imageUrl: string | null;
  onUpdated: () => void;
}

export const CategoryImageButton = ({
  categoryId,
  categoryName,
  brandName,
  imageUrl,
  onUpdated,
}: CategoryImageButtonProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const brandSlug = brandName.toLowerCase().replace(/\s+/g, "-");
      const catSlug = categoryName.toLowerCase().replace(/\s+/g, "-");
      const path = `categories/${brandSlug}/${catSlug}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("brand-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("brand-assets")
        .getPublicUrl(path);

      const url = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("categories")
        .update({ image_url: url })
        .eq("id", categoryId);

      if (updateError) throw updateError;

      toast({ title: "Imagen actualizada", description: categoryName });
      onUpdated();
      setOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({ image_url: null })
        .eq("id", categoryId);

      if (error) throw error;

      toast({ title: "Imagen eliminada", description: categoryName });
      onUpdated();
      setOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-5 w-5 sm:h-6 sm:w-6 p-0 ${
            imageUrl
              ? "text-primary opacity-80 hover:opacity-100"
              : "opacity-0 group-hover:opacity-60 hover:!opacity-100 text-muted-foreground"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <ImageIcon className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" />
            Imagen de categoría
          </DialogTitle>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">{brandName}</span>
            <span className="text-xs text-muted-foreground">›</span>
            <span className="text-xs font-medium">{categoryName}</span>
            {imageUrl && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Large preview */}
          {imageUrl ? (
            <div className="relative rounded-xl border border-border overflow-hidden bg-black/40">
              <img
                src={imageUrl}
                alt={categoryName}
                className="w-full max-h-64 object-contain"
              />
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/20 h-44 flex flex-col items-center justify-center gap-2">
              <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
              <span className="text-sm text-muted-foreground/60">Sin imagen asignada</span>
              <span className="text-[11px] text-muted-foreground/40">1000 × 1500 px recomendado</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2 h-10"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Subiendo..." : imageUrl ? "Cambiar imagen" : "Subir imagen"}
            </Button>
            {imageUrl && (
              <Button
                variant="ghost"
                className="h-10 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={removing}
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4" />
                {removing ? "..." : "Quitar"}
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
      </DialogContent>
    </Dialog>
  );
};
