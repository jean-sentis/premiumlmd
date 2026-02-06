import { useState, useEffect } from "react";
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
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PhotoUploadGrid, PhotoItem } from "@/components/estimation/PhotoUploadGrid";

interface SellSimilarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotId?: string;
  lotNumber?: number;
  lotTitle?: string;
  saleTitle?: string;
  lotUrl?: string;
  lotDescription?: string;
  lotDimensions?: string;
  lotImageUrl?: string;
}

export function SellSimilarDialog({
  open,
  onOpenChange,
  lotId,
  lotNumber,
  lotTitle,
  saleTitle,
  lotUrl,
  lotDescription,
  lotDimensions,
  lotImageUrl,
}: SellSimilarDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    message: "",
  });

  // Pre-fill message with lot reference when dialog opens
  useEffect(() => {
    if (open && lotTitle) {
      const prefillLines = [
        "Je possède un objet similaire à ce lot.",
        "",
        "---",
        `Référence : Lot n°${lotNumber}`,
        `Titre : ${lotTitle}`,
      ];
      if (saleTitle) prefillLines.push(`Vente : ${saleTitle}`);
      if (lotDescription) prefillLines.push("", `Description du lot : ${lotDescription}`);
      if (lotDimensions) prefillLines.push(`Dimensions : ${lotDimensions}`);
      if (lotUrl) prefillLines.push("", `Lien vers le lot : ${lotUrl}`);
      
      setFormData(prev => ({
        ...prev,
        message: prefillLines.join("\n"),
      }));
    }
  }, [open, lotNumber, lotTitle, saleTitle, lotDescription, lotDimensions, lotUrl]);

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const photo of photos) {
      const ext = photo.file.name.split(".").pop() || "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const path = `requests/${fileName}`;

      const { error } = await supabase.storage
        .from("estimation-photos")
        .upload(path, photo.file, { contentType: photo.file.type });

      if (error) {
        console.error("Upload error:", error);
        throw new Error(`Erreur d'upload : ${photo.file.name}`);
      }
      urls.push(`estimation-photos/${path}`);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (photos.length === 0) {
      toast({
        title: "Photos requises",
        description: "Veuillez ajouter au moins une photo de votre objet",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload photos
      const photoUrls = await uploadPhotos();

      // 2. Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      // 3. Insert estimation request with lot reference
      const { data: inserted, error: insertError } = await supabase
        .from("estimation_requests")
        .insert({
          nom: formData.nom,
          email: formData.email,
          telephone: formData.telephone || null,
          description: formData.message,
          photo_urls: photoUrls,
          source: "objet_similaire",
          related_lot_id: lotId || null,
          user_id: user?.id || null,
          status: "new",
        } as any)
        .select("id")
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Erreur lors de l'envoi de la demande");
      }

      // 4. Trigger AI analysis in background
      if (inserted?.id) {
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-estimation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ estimation_id: inserted.id }),
          }
        ).catch((err) => console.error("AI analysis trigger error:", err));
      }

      toast({
        title: "Demande envoyée ✓",
        description: "Notre commissaire-priseur examinera votre objet et vous répondra sous 48h.",
      });

      onOpenChange(false);
      setPhotos([]);
      setFormData({ nom: "", email: "", telephone: "", message: "" });
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'envoi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto z-[200]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">J'ai un objet similaire</DialogTitle>
          <DialogDescription>
            Envoyez des photos de votre objet pour une estimation gratuite et confidentielle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lot reference preview */}
          {lotImageUrl && (
            <div className="bg-muted/50 rounded-md p-3 flex items-center gap-3">
              <img 
                src={lotImageUrl} 
                alt={lotTitle} 
                className="w-16 h-16 object-cover rounded"
              />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Lot n°{lotNumber}</p>
                <p className="line-clamp-2">{lotTitle}</p>
              </div>
            </div>
          )}

          {/* Photos upload */}
          <div className="space-y-2">
            <Label>Photos de votre objet *</Label>
            <PhotoUploadGrid photos={photos} onPhotosChange={setPhotos} />
          </div>

          {/* Message with lot reference */}
          <div className="space-y-2">
            <Label htmlFor="sell-message">Description / commentaire</Label>
            <Textarea
              id="sell-message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Décrivez votre objet : dimensions, état, provenance..."
              rows={5}
              className="resize-none text-sm"
            />
          </div>

          {/* Contact fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sell-nom">Nom complet *</Label>
              <Input
                id="sell-nom"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sell-email">Email *</Label>
              <Input
                id="sell-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="votre@email.com"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sell-telephone">Téléphone</Label>
              <Input
                id="sell-telephone"
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isSubmitting || photos.length === 0}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Envoyer ma demande
              </>
            )}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center">
            Vos photos seront examinées par notre commissaire-priseur qui vous répondra avec une estimation personnalisée.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
