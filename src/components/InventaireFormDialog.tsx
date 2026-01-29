import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send } from "lucide-react";
import { COMPANY_INFO } from "@/lib/site-config";

interface InventaireFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InventaireFormDialog = ({ open, onOpenChange }: InventaireFormDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    email: "",
    adresse: "",
    typeBiens: "",
    objectif: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Show confirmation - in future could be connected to edge function
    toast({
      title: "Demande envoyée",
      description: "Nous vous recontacterons rapidement pour convenir d'un rendez-vous.",
    });

    setIsSubmitting(false);
    onOpenChange(false);
    setFormData({
      nom: "",
      telephone: "",
      email: "",
      adresse: "",
      typeBiens: "",
      objectif: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Demande d'inventaire à domicile</DialogTitle>
          <DialogDescription>
            Remplissez ce formulaire et nous vous recontacterons pour convenir d'un rendez-vous.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input
                id="telephone"
                name="telephone"
                type="tel"
                value={formData.telephone}
                onChange={handleChange}
                required
                placeholder="06 00 00 00 00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse du lieu à inventorier *</Label>
            <Input
              id="adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              required
              placeholder="Adresse complète"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="typeBiens">Type de biens à estimer</Label>
            <Textarea
              id="typeBiens"
              name="typeBiens"
              value={formData.typeBiens}
              onChange={handleChange}
              placeholder="Mobilier, tableaux, bijoux, collections..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectif">Objectif de l'inventaire</Label>
            <Textarea
              id="objectif"
              name="objectif"
              value={formData.objectif}
              onChange={handleChange}
              placeholder="Succession, assurance, partage, vente..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Send className="w-4 h-4 mr-2" />
              Envoyer la demande
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventaireFormDialog;
