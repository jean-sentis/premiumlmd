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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { COMPANY_INFO } from "@/lib/site-config";

interface RendezVousDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CRENEAUX = [
  "09h00",
  "09h30",
  "10h00",
  "10h30",
  "11h00",
  "11h30",
  "14h00",
  "14h30",
  "15h00",
  "15h30",
  "16h00",
  "16h30",
  "17h00",
];

export function RendezVousDialog({ open, onOpenChange }: RendezVousDialogProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [creneau, setCreneau] = useState<string>("");
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    objetDescription: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !creneau) {
      toast({
        title: "Date requise",
        description: "Veuillez sélectionner une date et un créneau",
        variant: "destructive",
      });
      return;
    }

    const formattedDate = format(date, "EEEE d MMMM yyyy", { locale: fr });
    
    // For now, show confirmation - in future could be connected to edge function
    toast({
      title: "Demande envoyée",
      description: `Rendez-vous demandé pour le ${formattedDate} à ${creneau}. Nous vous confirmerons sous 48h.`,
    });
    
    onOpenChange(false);
    setDate(undefined);
    setCreneau("");
    setFormData({ nom: "", email: "", telephone: "", objetDescription: "" });
  };

  // Disable weekends and past dates
  const disabledDays = (day: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day < today || day.getDay() === 0 || day.getDay() === 6;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Rendez-vous à l'étude</DialogTitle>
          <DialogDescription>
            Apportez votre objet pour une estimation en main propre par notre commissaire-priseur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date souhaitée *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "EEEE d MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={disabledDays}
                  locale={fr}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slots */}
          {date && (
            <div className="space-y-2">
              <Label>Créneau horaire *</Label>
              <div className="grid grid-cols-4 gap-2">
                {CRENEAUX.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={creneau === c ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCreneau(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
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
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input
                id="telephone"
                type="tel"
                required
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetDescription">Description de l'objet</Label>
            <Textarea
              id="objetDescription"
              placeholder="Décrivez brièvement l'objet que vous souhaitez faire estimer..."
              value={formData.objetDescription}
              onChange={(e) => setFormData({ ...formData, objetDescription: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            Demander ce rendez-vous
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Confirmation sous 48h • Parking gratuit devant l'étude
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
