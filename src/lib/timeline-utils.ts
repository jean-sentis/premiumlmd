import { addWeeks, addDays, startOfWeek, setHours, setMinutes, isAfter, nextWednesday, startOfDay } from "date-fns";
import { isJourFerie } from "./site-config";

export interface TimelineEvent {
  id: string;
  type: "vente-live" | "vente-chrono" | "vente-preparation" | "exposition" | "veille-exposition" | "expertise" | "expertise-itinerante";
  title: string;
  date: Date;
  endDate?: Date;
  time?: string;
  link?: string;
  location?: string;
  description?: string;
}

/**
 * Génère les créneaux d'estimation gratuite du lundi matin
 * Tous les lundis non fériés, de 9h à 12h
 */
export const generateEstimationEvents = (startDate: Date, weeksAhead: number = 12): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  
  // Trouver le premier lundi à partir de la date de départ
  let currentMonday = startOfWeek(startDate, { weekStartsOn: 1 });
  
  // Si on est après le lundi de cette semaine, passer au lundi suivant
  if (isAfter(startDate, currentMonday)) {
    currentMonday = addWeeks(currentMonday, 1);
  }
  
  for (let i = 0; i < weeksAhead; i++) {
    const monday = addWeeks(currentMonday, i);
    
    // Vérifier que ce n'est pas un jour férié
    if (!isJourFerie(monday)) {
      const eventDate = setMinutes(setHours(monday, 9), 0);
      
      events.push({
        id: `estimation-${monday.toISOString().split('T')[0]}`,
        type: "expertise",
        title: "Estimations gratuites",
        date: eventDate,
        time: "9h-12h",
        link: undefined
      });
    }
  }
  
  return events;
};

/**
 * Les 5 villes de la tournée trimestrielle en Corse-du-Sud
 * Rotation tous les 15 jours (un mercredi sur deux)
 */
const VILLES_TOURNEE = [
  { nom: "Sartène", slug: "sartene" },
  { nom: "Propriano", slug: "propriano" },
  { nom: "Bonifacio", slug: "bonifacio" },
  { nom: "Lévie", slug: "levie" },
  { nom: "Porto-Vecchio", slug: "porto-vecchio" }
];

/**
 * Génère les permanences d'expertise itinérantes en Corse-du-Sud
 * Un mercredi sur deux, rotation entre les 5 villes
 * Matin sur RDV, après-midi sans RDV
 */
export const generateExpertiseItineranteEvents = (startDate: Date, weeksAhead: number = 24): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  
  // IMPORTANT:
  // Ne pas dépendre d'une année “démo” (sinon la tournée disparaît). On calcule
  // la tournée à partir du prochain mercredi réel, puis un mercredi sur deux.

  // Premier mercredi >= startDate
  const first = nextWednesday(startOfDay(startDate));
  let currentWednesday = first;

  // Rotation stable: index basé sur le nombre de pas (toutes les 2 semaines) depuis le 1er mercredi
  let stepIndex = 0;
  let villeIndex = 0;
  
  // Générer les événements pour les prochaines semaines
  const endDate = addWeeks(startDate, weeksAhead);
  
  while (isAfter(endDate, currentWednesday)) {
    // Vérifier que ce n'est pas un jour férié
    if (!isJourFerie(currentWednesday)) {
      const ville = VILLES_TOURNEE[villeIndex];
      const eventDate = setMinutes(setHours(currentWednesday, 9), 0);
      
      events.push({
        id: `expertise-itinerante-${currentWednesday.toISOString().split('T')[0]}-${ville.slug}`,
        type: "expertise-itinerante",
        title: `Expertise à ${ville.nom}`,
        date: eventDate,
        time: "9h-12h",
        location: ville.nom,
        description: "Matin sur rendez-vous.",
        link: undefined
      });
    }
    
    // Passer au mercredi suivant (dans 2 semaines)
    currentWednesday = addDays(currentWednesday, 14);
    stepIndex += 1;
    villeIndex = stepIndex % VILLES_TOURNEE.length;
  }
  
  return events;
};
