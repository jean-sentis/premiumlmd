import { useState, useEffect } from "react";
import { parseISO, subDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { generateEstimationEvents, generateExpertiseItineranteEvents } from "@/lib/timeline-utils";
import { getDemoNow } from "@/lib/site-config";

export interface TimelineEvent {
  id: string;
  type: "vente-live" | "vente-chrono" | "vente-preparation" | "exposition" | "veille-exposition" | "expertise" | "expertise-itinerante" | "fermeture";
  title: string;
  date: Date;
  endDate?: Date;
  time?: string;
  link?: string;
  specialty?: string;
  description?: string;
  location?: string;
  contactInfo?: string;
}

/**
 * Hook centralisé pour récupérer tous les événements du timeline
 * - Ventes (live et chrono) depuis interencheres_sales
 * - Expositions (veille des ventes)
 * - Événements SVV (expertises, fermetures, etc.) depuis svv_events
 * - Créneaux d'estimation gratuite générés automatiquement (lundis matin)
 */
export const useTimelineEvents = (enabled: boolean = true) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const demoDate = getDemoNow();
        const demoDateStr = demoDate.toISOString().split('T')[0];

        const [salesResult, eventsResult] = await Promise.all([
          supabase
            .from('interencheres_sales')
            .select('id, title, sale_date, sale_type, specialty')
            .gte('sale_date', demoDate.toISOString())
            .order('sale_date', { ascending: true }),
          supabase
            .from('svv_events')
            .select('id, title, event_type, start_date, start_time, end_date, end_time, description, specialty, location, contact_info')
            .eq('is_active', true)
            .gte('start_date', demoDateStr)
            .order('start_date', { ascending: true })
        ]);

        const timelineEvents: TimelineEvent[] = [];

        // === Traitement des ventes ===
        if (salesResult.data) {
          salesResult.data.forEach((sale) => {
            if (sale.sale_date) {
              const saleEndDate = parseISO(sale.sale_date);
              const saleType = sale.sale_type?.toLowerCase() || '';
              const isChrono = saleType.includes('chrono') || saleType.includes('online');

              if (isChrono) {
                // Vente chrono : commence 11 jours avant la date de fin
                const chronoStartDate = subDays(saleEndDate, 11);
                timelineEvents.push({
                  id: sale.id,
                  type: "vente-chrono",
                  title: sale.title,
                  date: chronoStartDate,
                  endDate: saleEndDate,
                  time: format(saleEndDate, "HH:mm"),
                  link: `/vente/${sale.id}`,
                  specialty: sale.specialty || undefined
                });
              } else {
                // Vente live
                timelineEvents.push({
                  id: sale.id,
                  type: "vente-live",
                  title: sale.title,
                  date: saleEndDate,
                  time: format(saleEndDate, "HH:mm"),
                  link: `/vente/${sale.id}`,
                  specialty: sale.specialty || undefined
                });

                // Exposition la veille
                const veilleDate = subDays(saleEndDate, 1);
                timelineEvents.push({
                  id: `${sale.id}-expo`,
                  type: "exposition",
                  title: `Expo: ${sale.title}`,
                  date: veilleDate,
                  time: "10h-18h",
                  link: `/vente/${sale.id}`,
                  specialty: sale.specialty || undefined
                });
              }
            }
          });
        }

        // === Traitement des événements SVV ===
        if (eventsResult.data) {
          eventsResult.data.forEach((evt) => {
            const startDate = parseISO(evt.start_date);
            
            // Déterminer le type d'événement
            let eventType: TimelineEvent["type"] = "expertise";
            
            switch (evt.event_type) {
              case "fermeture":
              case "closure":
                eventType = "fermeture";
                break;
              case "exposition":
                eventType = "exposition";
                break;
              case "vente_preparation":
                eventType = "vente-preparation";
                break;
              case "special_expertise":
                // Expertises spécialisées (bijoux, livres, etc.) - affichées distinctement
                eventType = "expertise";
                break;
              case "expertise":
              case "expertise_slot":
              default:
                eventType = "expertise";
                break;
            }

            // Formater l'heure si disponible
            let timeStr: string | undefined;
            if (evt.start_time && evt.end_time) {
              timeStr = `${evt.start_time.slice(0, 5)}-${evt.end_time.slice(0, 5)}`;
            } else if (evt.start_time) {
              timeStr = evt.start_time.slice(0, 5);
            }

            timelineEvents.push({
              id: evt.id,
              type: eventType,
              title: evt.title,
              date: startDate,
              endDate: evt.end_date ? parseISO(evt.end_date) : undefined,
              time: timeStr,
              link: undefined,
              specialty: evt.specialty || undefined,
              description: evt.description || undefined,
              location: evt.location || undefined,
              contactInfo: evt.contact_info || undefined,
            });
          });
        }

        // === Ajout des créneaux d'estimation gratuite (lundis matin) ===
        const estimationEvents = generateEstimationEvents(demoDate, 12);
        timelineEvents.push(...estimationEvents);

        // === Ajout des expertises itinérantes en Corse-du-Sud (mercredis) ===
        const expertiseItineranteEvents = generateExpertiseItineranteEvents(demoDate, 24);
        timelineEvents.push(...expertiseItineranteEvents);

        setEvents(timelineEvents);
      } catch (err) {
        console.error('Error fetching timeline data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [enabled]);

  return { events, isLoading, error };
};
