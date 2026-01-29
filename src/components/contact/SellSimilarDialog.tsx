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
import { Send } from "lucide-react";

interface SellSimilarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
        "Je souhaite vendre un objet similaire.",
        "",
        "---",
        `Référence : Lot n°${lotNumber}`,
        `Titre : ${lotTitle}`,
      ];
      if (saleTitle) prefillLines.push(`Vente : ${saleTitle}`);
      if (lotDescription) prefillLines.push("", `Description : ${lotDescription}`);
      if (lotDimensions) prefillLines.push(`Dimensions : ${lotDimensions}`);
      if (lotUrl) prefillLines.push("", `Lien vers le lot : ${lotUrl}`);
      
      setFormData(prev => ({
        ...prev,
        message: prefillLines.join("\n"),
      }));
    }
  }, [open, lotNumber, lotTitle, saleTitle, lotDescription, lotDimensions, lotUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Show confirmation - in future could be connected to edge function
    toast({
      title: "Demande envoyée",
      description: "Nous avons bien reçu votre demande et vous recontacterons rapidement.",
    });

    setIsSubmitting(false);
    onOpenChange(false);
    setFormData({ nom: "", email: "", telephone: "", message: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Je souhaite vendre un objet similaire</DialogTitle>
          <DialogDescription>
            Décrivez votre objet et nous vous recontacterons pour une estimation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Message with lot reference */}
          <div className="space-y-2">
            <Label htmlFor="sell-message">Votre message</Label>
            <Textarea
              id="sell-message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Décrivez votre objet..."
              rows={8}
              className="resize-none text-sm"
            />
          </div>

          {/* Lot image preview if available */}
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

          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            <Send className="w-4 h-4" />
            Envoyer ma demande
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
