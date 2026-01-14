import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarPlus, MapPin, Clock, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { downloadICSFile } from "@/lib/calendar-utils";
import { COMPANY_INFO } from "@/lib/site-config";

interface EventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    type: string;
    title: string;
    date: Date;
    endDate?: Date;
    time?: string;
    link?: string;
    specialty?: string;
    description?: string;
    location?: string;
    contactInfo?: string;
  } | null;
}

const EventDetailDialog = ({ open, onOpenChange, event }: EventDetailDialogProps) => {
  if (!event) return null;

  const handleAddToCalendar = () => {
    // Extraire l'heure de début depuis le champ time (ex: "9h-12h")
    let startDate = new Date(event.date);
    let endDate: Date | undefined;
    
    if (event.time) {
      const timeMatch = event.time.match(/(\d+)h(?::?(\d+))?(?:\s*-\s*(\d+)h(?::?(\d+))?)?/);
      if (timeMatch) {
        const startHour = parseInt(timeMatch[1], 10);
        const startMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        startDate = new Date(event.date);
        startDate.setHours(startHour, startMin, 0, 0);
        
        if (timeMatch[3]) {
          const endHour = parseInt(timeMatch[3], 10);
          const endMin = timeMatch[4] ? parseInt(timeMatch[4], 10) : 0;
          endDate = new Date(event.date);
          endDate.setHours(endHour, endMin, 0, 0);
        }
      }
    }

    const eventLocation = event.location || "Hôtel des Ventes - 2 rue Pourquery de Boisserin, 84000 Avignon";

    downloadICSFile({
      title: event.title,
      description: event.description || getEventDescription(event.type, event.specialty),
      location: eventLocation,
      startDate,
      endDate,
    });
  };

  const handleBookAppointment = () => {
    const dateFormatted = format(event.date, "EEEE d MMMM yyyy", { locale: fr });
    const subject = encodeURIComponent(`Rendez-vous expertise à ${event.location} — ${dateFormatted}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaiterais prendre rendez-vous pour une expertise lors de votre passage à ${event.location} le ${dateFormatted} (matin sur rendez-vous).\n\nObjet(s) à expertiser :\n- \n\nMes coordonnées :\nNom : \nTéléphone : \n\nCordialement,`
    );
    window.location.href = `mailto:${COMPANY_INFO.email}?subject=${subject}&body=${body}`;
  };

  const getEventDescription = (type: string, specialty?: string): string => {
    const specialtyInfo = specialty ? ` Spécialité : ${specialty}.` : "";
    
    switch (type) {
      case "expertise":
        return `Venez faire estimer gratuitement vos objets par nos commissaires-priseurs. Sans rendez-vous.${specialtyInfo}`;
      case "expertise-itinerante":
        return `Expertise gratuite sur rendez-vous le matin.${specialtyInfo}`;
      case "fermeture":
        return "L'hôtel des ventes est fermé ce jour.";
      case "exposition":
        return "Exposition des lots avant la vente aux enchères.";
      default:
        return "";
    }
  };

  const getEventTypeLabel = (type: string): string => {
    switch (type) {
      case "expertise":
        return "Expertise gratuite";
      case "expertise-itinerante":
        return "Expertise itinérante";
      case "fermeture":
        return "Fermeture";
      case "exposition":
        return "Exposition";
      case "vente-live":
        return "Vente aux enchères";
      case "vente-chrono":
        return "Vente online";
      default:
        return "Événement";
    }
  };

  const eventLocation = event.location || "Hôtel des Ventes - 2 rue Pourquery de Boisserin, 84000 Avignon";
  const isItinerantExpertise = event.type === "expertise-itinerante";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {event.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Type d'événement + spécialité */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              isItinerantExpertise 
                ? "bg-teal-100 text-teal-800" 
                : "bg-primary/10 text-primary"
            }`}>
              {getEventTypeLabel(event.type)}
            </span>
            {event.specialty && (
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                {event.specialty}
              </span>
            )}
          </div>

          {/* Date et heure */}
          <div className="flex items-center gap-3 text-muted-foreground">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-foreground font-medium">
                {format(event.date, "EEEE d MMMM yyyy", { locale: fr })}
              </p>
              {event.time && (
                <p className="text-sm">{event.time}</p>
              )}
            </div>
          </div>

          {/* Lieu */}
          <div className="flex items-center gap-3 text-muted-foreground">
            <MapPin className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-foreground font-medium">
                {eventLocation.split(' - ')[0] || "Hôtel des Ventes"}
              </p>
              {eventLocation.includes(' - ') && (
                <p className="text-sm">
                  {eventLocation.split(' - ')[1]}
                </p>
              )}
              {isItinerantExpertise && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  Lieu exact communiqué après réservation
                </p>
              )}
            </div>
          </div>

          {/* Contact */}
          {event.contactInfo && (
            <div className="flex items-start gap-3 text-muted-foreground">
              <span className="w-5 h-5 flex-shrink-0 text-center">📞</span>
              <p className="text-sm text-foreground">{event.contactInfo}</p>
            </div>
          )}

          {/* Description personnalisée ou par défaut */}
          <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
            {event.description || getEventDescription(event.type, event.specialty)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {isItinerantExpertise && (
            <Button 
              onClick={handleBookAppointment}
              className="flex-1 gap-2 bg-teal-600 hover:bg-teal-700"
            >
              <Mail className="w-4 h-4" />
              Prendre rendez-vous
            </Button>
          )}
          <Button 
            onClick={handleAddToCalendar}
            variant={isItinerantExpertise ? "outline" : "default"}
            className="flex-1 gap-2"
          >
            <CalendarPlus className="w-4 h-4" />
            Ajouter à mon agenda
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className={isItinerantExpertise ? "sm:w-auto" : "flex-1"}
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailDialog;
