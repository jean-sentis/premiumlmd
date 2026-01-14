import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore, startOfDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Gavel, Eye, Clock, MapPin, ExternalLink, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Types d'événements
type EventType = 'expertise-prevue' | 'expertise-creneau' | 'vente-preparation' | 'vente-catalogue' | 'exposition';

interface CalendarEvent {
  id: string;
  date: Date;
  type: EventType;
  title: string;
  specialty?: string;
  specialtySlug?: string;
  description?: string;
  time?: string;
  location?: string;
  catalogUrl?: string;
  interencheres?: boolean;
  lotCount?: number;
  coverImageUrl?: string;
}

// Configuration des types d'événements
const eventTypeConfig: Record<EventType, {
  label: string;
  shortLabel: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: typeof Calendar;
  description: string;
}> = {
  'expertise-prevue': {
    label: 'Journée d\'expertise spécialisée',
    shortLabel: 'Expertise',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-800',
    icon: Eye,
    description: 'Expertise spécialisée hors étude ou en déplacement'
  },
  'expertise-creneau': {
    label: 'Créneau d\'expertise',
    shortLabel: 'RDV Expertise',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-800',
    icon: Clock,
    description: 'Créneaux habituels d\'expertise sur rendez-vous'
  },
  'vente-preparation': {
    label: 'Vente en préparation',
    shortLabel: 'Vente prévue',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-800',
    icon: Calendar,
    description: 'Vente programmée, catalogue en cours de préparation'
  },
  'vente-catalogue': {
    label: 'Vente avec catalogue',
    shortLabel: 'Vente',
    bgColor: 'bg-brand-primary/10',
    borderColor: 'border-brand-primary',
    textColor: 'text-brand-primary',
    icon: Gavel,
    description: 'Vente dont le catalogue est disponible sur Interenchères'
  },
  'exposition': {
    label: 'Exposition publique',
    shortLabel: 'Exposition',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-800',
    icon: MapPin,
    description: 'Journée d\'exposition des lots avant vente'
  }
};

const Calendrier = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState({ x: 0, y: 0 });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  // Fetch sales and SVV events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Fetch Interenchères sales (all upcoming and recent)
        const { data: sales, error: salesError } = await supabase
          .from('interencheres_sales')
          .select('*')
          .order('sale_date', { ascending: true });

        if (salesError) {
          console.error('Error fetching sales:', salesError);
        }

        // Fetch SVV events
        const { data: svvEvents, error: svvError } = await supabase
          .from('svv_events')
          .select('*')
          .eq('is_active', true)
          .gte('start_date', format(today, 'yyyy-MM-dd'))
          .order('start_date', { ascending: true });

        if (svvError) {
          console.error('Error fetching SVV events:', svvError);
        }

        // Convert sales to calendar events
        const salesEvents: CalendarEvent[] = (sales || []).map(sale => ({
          id: sale.id,
          date: sale.sale_date ? parseISO(sale.sale_date) : new Date(),
          type: sale.catalog_url ? 'vente-catalogue' : 'vente-preparation' as EventType,
          title: sale.title,
          description: `${sale.lot_count ? `${sale.lot_count} lots` : 'Vente aux enchères'}`,
          time: sale.sale_date ? format(parseISO(sale.sale_date), 'HH:mm') : undefined,
          location: sale.location || undefined,
          catalogUrl: sale.catalog_url || sale.sale_url,
          interencheres: true,
          lotCount: sale.lot_count || undefined,
          coverImageUrl: sale.cover_image_url || undefined,
        }));

        // Convert SVV events to calendar events
        const svvCalendarEvents: CalendarEvent[] = (svvEvents || []).map(evt => {
          // Map event_type from DB to EventType
          let eventType: EventType = 'expertise-creneau';
          if (evt.event_type === 'special_expertise') {
            eventType = 'expertise-prevue';
          } else if (evt.event_type === 'expertise_slot') {
            eventType = 'expertise-creneau';
          } else if (evt.event_type === 'closure') {
            // Use exposition style for closures (could add a dedicated type later)
            eventType = 'exposition';
          }

          return {
            id: evt.id,
            date: parseISO(evt.start_date),
            type: eventType,
            title: evt.title,
            description: evt.description || undefined,
            time: evt.start_time ? evt.start_time.slice(0, 5) : undefined,
            location: evt.location || undefined,
            specialty: evt.specialty || undefined,
          };
        });

        // Combine and sort all events
        const allEvents = [...salesEvents, ...svvCalendarEvents].sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        );

        setEvents(allEvents);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Générer les 5 semaines
  const fiveWeeks = useMemo(() => {
    const weeks: Date[][] = [];
    for (let w = 0; w < 5; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(addDays(weekStart, w * 7 + d));
      }
      weeks.push(week);
    }
    return weeks;
  }, [weekStart]);

  // Fin de la période de 5 semaines
  const fiveWeeksEnd = addDays(weekStart, 35);

  // Événements après 5 semaines, groupés par mois
  const futureEventsByMonth = useMemo(() => {
    const futureEvents = events
      .filter(e => !isBefore(e.date, fiveWeeksEnd))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const grouped: Record<string, CalendarEvent[]> = {};
    futureEvents.forEach(event => {
      const monthKey = format(event.date, 'MMMM yyyy', { locale: fr });
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(event);
    });

    return grouped;
  }, [events, fiveWeeksEnd]);


  // Obtenir les événements pour une date
  const getEventsForDate = (date: Date) => {
    return events.filter(e => isSameDay(e.date, date));
  };

  // Gérer le clic sur un événement
  const handleEventClick = (event: CalendarEvent) => {
    if (event.interencheres && event.id) {
      // Naviguer vers la page de détail de la vente
      navigate(`/vente/${event.id}`);
    } else if (event.specialtySlug) {
      // Naviguer vers la page spécialité
      navigate(`/specialites/${event.specialtySlug}`);
    } else {
      // Ouvrir le dialogue de détails
      setSelectedEvent(event);
    }
  };

  // Gérer le survol
  const handleEventHover = (event: CalendarEvent | null, e?: React.MouseEvent) => {
    setHoveredEvent(event);
    if (e && event) {
      setHoveredPosition({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <>
      <Helmet>
        <title>Ventes et Expertises | Maison d'Enchères</title>
        <meta name="description" content="Consultez le calendrier complet de nos ventes aux enchères, expertises et expositions. Planifiez votre visite à l'Hôtel des Ventes d'Ajaccio." />
      </Helmet>

      {/* GRILLE DE RÉFÉRENCE TEMPORAIRE - à supprimer */}
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        {/* Ligne verticale centrale */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500 opacity-50" />
        {/* Lignes de quart */}
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-blue-500 opacity-30" />
        <div className="absolute left-3/4 top-0 bottom-0 w-px bg-blue-500 opacity-30" />
        {/* Ligne horizontale centrale */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500 opacity-50" />
        {/* Indicateur du centre */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-red-500 rounded-full opacity-70" />
      </div>

      <Header />

      {/* Titre de la page */}
      <div
        className="fixed left-0 right-0 z-[45] bg-background border-b border-border"
        style={{ top: 'var(--header-height, 145px)' }}
      >
        <h1 className="font-serif text-base md:text-lg font-semibold text-muted-foreground tracking-widest uppercase text-center py-3">
          Ventes à venir
        </h1>
      </div>

      <main
        className="min-h-screen bg-background"
        style={{ paddingTop: 'calc(var(--header-height, 145px) + 60px)' }}
      >
        {/* Section Ventes à venir */}
        <section className="py-6 md:py-10">
          <div className="container mx-auto px-4">

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <span className="ml-3 text-muted-foreground">Chargement des ventes...</span>
              </div>
            ) : (
              (() => {
                // Filter only sales events (vente-catalogue and vente-preparation)
                const salesEvents = events.filter(e => e.type === 'vente-catalogue' || e.type === 'vente-preparation');
                
                if (salesEvents.length === 0) {
                  return (
                    <div className="text-center py-16 text-muted-foreground">
                      <p>Aucune vente programmée pour le moment.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {salesEvents.map((sale) => {
                      const config = eventTypeConfig[sale.type];
                      return (
                        <div 
                          key={sale.id}
                          className="group cursor-pointer"
                          onClick={() => handleEventClick(sale)}
                        >
                          {/* Carte catalogue */}
                          <div className="relative bg-card shadow-md hover:shadow-xl transition-all duration-300 mb-4">
                            {/* Image de couverture format catalogue */}
                            <div className="aspect-[3/4] overflow-hidden bg-muted">
                              {sale.coverImageUrl ? (
                                <img 
                                  src={sale.coverImageUrl} 
                                  alt={sale.title}
                                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-b from-muted to-muted/50">
                                  <Gavel className="w-16 h-16 opacity-20" />
                                </div>
                              )}
                            </div>
                            
                            {/* Badge type de vente */}
                            <div className={`absolute top-3 left-3 px-2 py-1 text-xs uppercase tracking-wider font-medium rounded
                              ${sale.type === 'vente-catalogue' ? 'bg-brand-primary text-brand-primary-foreground' : 'bg-blue-100 text-blue-800 border border-blue-300'}
                            `}>
                              {sale.type === 'vente-catalogue' ? 'Catalogue en ligne' : 'En préparation'}
                            </div>

                            {/* Nombre de lots */}
                            {sale.lotCount && (
                              <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm px-2 py-1 text-xs font-medium rounded">
                                {sale.lotCount} lots
                              </div>
                            )}
                          </div>

                          {/* Infos sous la carte */}
                          <div className="text-center">
                            <h3 className="font-serif text-base md:text-lg font-medium mb-1 line-clamp-2 group-hover:text-brand-primary transition-colors">
                              {sale.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {format(sale.date, "d MMMM yyyy", { locale: fr })}
                              {sale.time && ` · ${sale.time}`}
                            </p>
                            <Button 
                              variant="outline-brand" 
                              size="sm" 
                              className="font-sans text-xs tracking-widest px-4"
                              asChild
                            >
                              <Link to={`/vente/${sale.id}`} onClick={(e) => e.stopPropagation()}>
                                VOIR LA VENTE
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </section>

        {/* Événements futurs par mois */}
        {Object.keys(futureEventsByMonth).length > 0 && (
          <section className="pb-16 md:pb-24">
            <div className="container mx-auto px-4">
              <h2 className="font-serif text-base md:text-lg font-semibold text-brand-primary tracking-widest uppercase mb-8 text-center">
                Événements à venir
              </h2>

              <div className="space-y-6">
                {Object.entries(futureEventsByMonth).map(([month, monthEvents]) => (
                  <div key={month} className="bg-card rounded-lg shadow p-6">
                    <h3 className="font-serif text-xl text-brand-primary mb-4 capitalize border-b border-border pb-2">
                      {month}
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {monthEvents.map(event => {
                        const config = eventTypeConfig[event.type];
                        const Icon = config.icon;
                        return (
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 transition-all hover:scale-[1.02] hover:shadow-md
                              ${config.bgColor} ${config.borderColor}
                            `}
                          >
                            <Icon className={`w-5 h-5 ${config.textColor}`} />
                            <div className="text-left">
                              <div className={`font-medium ${config.textColor}`}>{event.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(event.date, 'd MMMM', { locale: fr })} {event.time && `à ${event.time}`}
                                {event.lotCount && ` · ${event.lotCount} lots`}
                              </div>
                            </div>
                            {event.interencheres && (
                              <span className="text-xs text-brand-gold">Voir détails</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bulle d'information au survol */}
        {hoveredEvent && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: Math.min(hoveredPosition.x + 10, window.innerWidth - 320),
              top: Math.min(hoveredPosition.y + 10, window.innerHeight - 200)
            }}
          >
            <div className="bg-card rounded-lg shadow-xl border border-border p-4 max-w-[300px]">
              <div className={`font-medium mb-1 ${eventTypeConfig[hoveredEvent.type].textColor}`}>
                {hoveredEvent.title}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>{format(hoveredEvent.date, 'EEEE d MMMM yyyy', { locale: fr })}</div>
                {hoveredEvent.time && <div>⏰ {hoveredEvent.time}</div>}
                {hoveredEvent.location && <div>📍 {hoveredEvent.location}</div>}
                {hoveredEvent.lotCount && <div>📦 {hoveredEvent.lotCount} lots</div>}
                {hoveredEvent.description && <div className="text-xs mt-2">{hoveredEvent.description}</div>}
              </div>
              <div className="text-xs text-brand-gold mt-2">Cliquez pour voir les détails</div>
            </div>
          </div>
        )}

        {/* Dialog de détails */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-md">
            {selectedEvent && (
              <>
                <DialogHeader>
                  <DialogTitle className={`font-serif ${eventTypeConfig[selectedEvent.type].textColor}`}>
                    {selectedEvent.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm
                    ${eventTypeConfig[selectedEvent.type].bgColor} ${eventTypeConfig[selectedEvent.type].textColor}
                  `}>
                    {(() => {
                      const Icon = eventTypeConfig[selectedEvent.type].icon;
                      return <Icon className="w-4 h-4" />;
                    })()}
                    {eventTypeConfig[selectedEvent.type].label}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{format(selectedEvent.date, 'EEEE d MMMM yyyy', { locale: fr })}</span>
                    </div>
                    {selectedEvent.time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedEvent.time}</span>
                      </div>
                    )}
                    {selectedEvent.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                    {selectedEvent.lotCount && (
                      <div className="flex items-center gap-2">
                        <Gavel className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedEvent.lotCount} lots</span>
                      </div>
                    )}
                  </div>

                  {selectedEvent.description && (
                    <p className="text-muted-foreground">{selectedEvent.description}</p>
                  )}

                  <div className="flex gap-3 pt-4">
                    {selectedEvent.specialtySlug && (
                      <Button asChild className="flex-1">
                        <Link to={`/specialites/${selectedEvent.specialtySlug}`}>
                          Voir la spécialité
                        </Link>
                      </Button>
                    )}
                    {selectedEvent.catalogUrl && (
                      <Button variant="outline" asChild className="flex-1">
                        <a href={selectedEvent.catalogUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Voir sur Interenchères
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </>
  );
};

export default Calendrier;
