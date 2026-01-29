import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight, Camera } from "lucide-react";
import { Link } from "react-router-dom";

interface ObjetSimilaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestEstimation?: () => void;
}

export function ObjetSimilaireDialog({ 
  open, 
  onOpenChange,
  onRequestEstimation 
}: ObjetSimilaireDialogProps) {
  const handleEstimationClick = () => {
    onOpenChange(false);
    onRequestEstimation?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-primary" />
            J'ai un objet similaire
          </DialogTitle>
          <DialogDescription>
            Vous avez repéré un lot dans nos ventes et possédez un objet comparable ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Deux options s'offrent à vous :
          </p>

          <div className="space-y-3">
            {/* Option 1: Retourner dans la vente */}
            <div className="p-4 border rounded-lg space-y-3">
              <h3 className="font-medium text-sm">Depuis la fiche du lot</h3>
              <p className="text-sm text-muted-foreground">
                Retournez sur la page du lot qui vous intéresse et cliquez sur 
                le bouton "J'ai un objet similaire" pour nous contacter directement 
                en référence à ce lot.
              </p>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                asChild
              >
                <Link to="/acheter/ventes-a-venir" onClick={() => onOpenChange(false)}>
                  Voir les ventes
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Option 2: Demande d'estimation classique */}
            <div className="p-4 border rounded-lg space-y-3">
              <h3 className="font-medium text-sm">Demande d'estimation</h3>
              <p className="text-sm text-muted-foreground">
                Envoyez-nous des photos de votre objet pour une estimation 
                gratuite et confidentielle.
              </p>
              <Button 
                className="w-full gap-2"
                onClick={handleEstimationClick}
              >
                <Camera className="w-4 h-4" />
                Demander une estimation
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
