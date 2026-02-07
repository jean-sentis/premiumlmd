import { useState } from "react";
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
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PhotoUploadGrid, PhotoItem } from "./PhotoUploadGrid";

interface EstimationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: "estimation_form" | "objet_similaire" | "contact";
  relatedLotId?: string;
  relatedLotTitle?: string;
}


export function EstimationFormDialog({
  open,
  onOpenChange,
  source = "estimation_form",
  relatedLotId,
  relatedLotTitle,
}: EstimationFormDialogProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    description: "",
  });

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

    setSubmitting(true);

    try {
      // 1. Upload photos
      const photoUrls = await uploadPhotos();

      // 2. Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      // 3. Insert estimation request
      const { data: inserted, error: insertError } = await supabase
        .from("estimation_requests")
        .insert({
          nom: formData.nom,
          email: formData.email,
          telephone: formData.telephone || null,
          description: formData.description,
          photo_urls: photoUrls,
          source,
          related_lot_id: relatedLotId || null,
          user_id: user?.id || null,
          status: "new",
        } as any)
        .select("id")
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Erreur lors de l'envoi de la demande");
      }

      console.log("Estimation created:", inserted?.id);

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
        description: "Notre équipe analysera votre objet et vous répondra sous 48h.",
      });

      onOpenChange(false);
      setPhotos([]);
      setFormData({ nom: "", email: "", telephone: "", description: "" });
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'envoi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">
            Estimation gratuite
          </DialogTitle>
          <DialogDescription>
            Envoyez vos photos et une description. Notre commissaire-priseur vous répondra sous 48h.
            {relatedLotTitle && (
              <span className="block mt-1 text-brand-primary font-medium">
                En référence au lot : {relatedLotTitle}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos de l'objet *</Label>
            <PhotoUploadGrid photos={photos} onPhotosChange={setPhotos} />
          </div>

          {/* Object details */}
          <div className="space-y-2">
            <Label htmlFor="est-desc">Description de l'objet *</Label>
            <Textarea
              id="est-desc"
              required
              placeholder="Dimensions, état, provenance, histoire connue, signatures visibles..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Contact details */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="est-nom">Nom complet *</Label>
              <Input
                id="est-nom"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-email">Email *</Label>
              <Input
                id="est-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="est-tel">Téléphone</Label>
              <Input
                id="est-tel"
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={submitting || photos.length === 0}>
            {submitting ? (
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
