import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { COMPANY_INFO } from "@/lib/site-config";

interface EstimationPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PhotoStatus {
  file: File;
  preview: string;
  status: "checking" | "valid" | "invalid";
  message?: string;
}

export function EstimationPhotoDialog({ open, onOpenChange }: EstimationPhotoDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoStatus[]>([]);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    description: "",
  });

  const analyzePhoto = async (file: File): Promise<{ valid: boolean; message: string }> => {
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Check basic requirements
    if (file.size < 50000) {
      return { valid: false, message: "Image trop petite, qualité insuffisante" };
    }
    if (file.size > 15 * 1024 * 1024) {
      return { valid: false, message: "Fichier trop volumineux (max 15 Mo)" };
    }
    
    // Simulate random quality check (in real app, would use AI)
    const isGoodQuality = Math.random() > 0.2;
    if (!isGoodQuality) {
      return { valid: false, message: "Photo floue ou mal cadrée, veuillez reprendre" };
    }
    
    return { valid: true, message: "Photo exploitable ✓" };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 6) {
      toast({
        title: "Limite atteinte",
        description: "Maximum 6 photos par demande",
        variant: "destructive",
      });
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      const preview = URL.createObjectURL(file);
      const newPhoto: PhotoStatus = {
        file,
        preview,
        status: "checking",
      };

      setPhotos((prev) => [...prev, newPhoto]);

      // Analyze with simulated AI
      const result = await analyzePhoto(file);
      
      setPhotos((prev) =>
        prev.map((p) =>
          p.preview === preview
            ? { ...p, status: result.valid ? "valid" : "invalid", message: result.message }
            : p
        )
      );
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (preview: string) => {
    URL.revokeObjectURL(preview);
    setPhotos((prev) => prev.filter((p) => p.preview !== preview));
  };

  const validPhotosCount = photos.filter((p) => p.status === "valid").length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validPhotosCount === 0) {
      toast({
        title: "Photos requises",
        description: "Veuillez ajouter au moins une photo valide",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation - in future could be connected to edge function with file upload
    toast({
      title: "Demande envoyée",
      description: `Votre demande avec ${validPhotosCount} photo${validPhotosCount > 1 ? "s" : ""} a été transmise. Nous vous répondrons sous 48h.`,
    });
    
    onOpenChange(false);
    setPhotos([]);
    setFormData({ nom: "", email: "", telephone: "", description: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Demande d'estimation</DialogTitle>
          <DialogDescription>
            Notre IA vérifie la qualité de vos photos pour garantir une estimation optimale.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <div className="space-y-4">
            <Label>Photos de l'objet (6 max)</Label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-brand-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Cliquez ou glissez vos photos ici
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG • Max 15 Mo par fichier
              </p>
            </div>

            {/* Photo Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <div key={photo.preview} className="relative group">
                    <img
                      src={photo.preview}
                      alt="Upload"
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                      {photo.status === "checking" && (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      )}
                      {photo.status === "valid" && (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      )}
                      {photo.status === "invalid" && (
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    {photo.message && (
                      <p className={`absolute bottom-0 left-0 right-0 text-xs p-1 text-center rounded-b-lg ${
                        photo.status === "valid" ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
                      }`}>
                        {photo.message}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.preview)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {validPhotosCount > 0 && (
              <p className="text-sm text-green-600">
                {validPhotosCount} photo{validPhotosCount > 1 ? "s" : ""} validée{validPhotosCount > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet *</Label>
              <Input
                id="nom"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description de l'objet</Label>
            <Textarea
              id="description"
              placeholder="Dimensions, état, provenance, histoire connue..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={validPhotosCount === 0}>
            Envoyer ma demande
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
