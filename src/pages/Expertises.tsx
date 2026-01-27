import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Phone, Gavel, Eye, Search, Loader2 } from "lucide-react";
import { format, addWeeks, startOfWeek, addDays, isSameDay, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useTimelineEvents, TimelineEvent } from "@/hooks/use-timeline-events";
import { getDemoNow } from "@/lib/site-config";

// Types d'événements avec couleurs distinctes
type EventType = "expertise" | "vente" | "exposition";

// Mapping des types de TimelineEvent vers EventType pour l'affichage
const mapEventType = (type: TimelineEvent["type"]): EventType => {
  switch (type) {
    case "vente-live":
    case "vente-chrono":
    case "vente-preparation":
      return "vente";
    case "exposition":
    case "veille-exposition":
      return "exposition";
    case "expertise":
    case "expertise-itinerante":
    default:
      return "expertise";
  }
};

// Couleurs par type d'événement - déclinaisons de bleu et blanc
const eventTypeColors: Record<EventType, { bg: string; border: string; icon: string; label: string; cardBg: string }> = {
  expertise: {
    bg: "bg-brand-primary/10",
    border: "border-brand-primary/30",
    icon: "text-brand-primary",
    label: "Expertise",
    cardBg: "bg-white"
  },
  vente: {
    bg: "bg-brand-secondary/20",
    border: "border-brand-secondary/50",
    icon: "text-brand-secondary",
    label: "Vente",
    cardBg: "bg-brand-primary/5"
  },
  exposition: {
    bg: "bg-sky-500/15",
    border: "border-sky-500/40",
    icon: "text-sky-600",
    label: "Exposition",
    cardBg: "bg-sky-50"
  }
};

const Expertises = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(getDemoNow(), { weekStartsOn: 1 })
  );
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Récupérer les événements depuis la base de données
  const { events: timelineEvents, isLoading } = useTimelineEvents(true);

  // Filtrer pour ne garder que les événements pertinents (expertises, ventes, expositions)
  const calendarEvents = useMemo(() => {
    return timelineEvents.filter(evt => 
      evt.type !== "fermeture"
    );
  }, [timelineEvents]);

  // Generate 4 weeks of dates
  const weeks = Array.from({ length: 4 }, (_, weekIndex) => {
    const weekStart = addWeeks(currentWeekStart, weekIndex);
    return Array.from({ length: 7 }, (_, dayIndex) => addDays(weekStart, dayIndex));
  });

  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter(event => isSameDay(event.date, date));
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case "expertise": return Search;
      case "vente": return Gavel;
      case "exposition": return Eye;
    }
  };

  const handlePreviousMonth = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, -4));
  };

  const handleNextMonth = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 4));
  };

  const handleDateClick = (date: Date) => {
    const events = getEventsForDate(date);
    if (events.length > 0) {
      setSelectedEvent(events[0]);
      setDialogOpen(true);
    }
  };

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // IMPORTANT: le site est en mode démo. On ne doit jamais utiliser isToday()
  // (basé sur la date système) pour griser/désactiver des jours.
  const demoToday = startOfDay(getDemoNow());
  const isTodayDemo = (date: Date) => isSameDay(date, demoToday);
  const isPastDemo = (date: Date) => isBefore(date, demoToday);

  return (
    <>
      <Helmet>
        <title>Expertises Gratuites | Calendrier des Séances | Douze pages & associés</title>
        <meta 
          name="description" 
          content="Consultez notre calendrier des expertises gratuites. Bijoux, tableaux, mobilier, vins... Nos experts vous accueillent sans rendez-vous pour estimer vos objets de valeur." 
        />
        <meta name="keywords" content="expertise gratuite, estimation objets, commissaire-priseur, évaluation bijoux, expertise tableaux, estimation mobilier ancien" />
        <link rel="canonical" href="https://lemarteaudigital.fr/expertises" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pt-28 md:pt-32">
        {/* Hero Section */}
        <section className="bg-brand-primary text-brand-primary-foreground py-16 md:py-24">
          <div className="container">
            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-6 text-center">
              Expertises Gratuites
            </h1>
            <p className="text-lg md:text-xl text-center max-w-3xl mx-auto opacity-90">
              Nos commissaires-priseurs et experts vous accueillent régulièrement pour estimer 
              gratuitement vos objets d'art, bijoux, mobilier et collections.
            </p>
          </div>
        </section>

        {/* Calendar Section */}
        <section className="py-12 md:py-16">
          <div className="container max-w-5xl">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-8">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handlePreviousMonth}
                className="border-brand-primary/30"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <h2 className="font-serif text-xl md:text-2xl font-semibold text-center">
                {format(currentWeekStart, "MMMM yyyy", { locale: fr })}
              </h2>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleNextMonth}
                className="border-brand-primary/30"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
              {dayNames.map((day) => (
                <div 
                  key={day} 
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid - 4 Weeks */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              </div>
            ) : (
              <div className="space-y-1 md:space-y-2">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1 md:gap-2">
                    {week.map((date) => {
                      const events = getEventsForDate(date);
                       const isPast = isPastDemo(date);
                      const hasEvents = events.length > 0;
                      const firstEvent = events[0];
                      const displayType = firstEvent ? mapEventType(firstEvent.type) : null;
                      const eventColors = displayType ? eventTypeColors[displayType] : null;
                      const EventIcon = displayType ? getEventIcon(displayType) : Calendar;

                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => handleDateClick(date)}
                          disabled={!hasEvents || isPast}
                          className={`
                            aspect-square p-1 md:p-2 rounded-lg text-center transition-all
                            flex flex-col items-center justify-center gap-0.5
                             ${isTodayDemo(date) ? "ring-2 ring-brand-primary" : ""}
                            ${hasEvents && !isPast && eventColors
                              ? `${eventColors.bg} hover:opacity-80 cursor-pointer border ${eventColors.border}` 
                              : "bg-muted/30"
                            }
                            ${isPast ? "opacity-40" : ""}
                            ${!hasEvents ? "cursor-default" : ""}
                          `}
                        >
                          <span className={`text-sm md:text-base font-medium ${hasEvents && !isPast ? "text-brand-primary" : "text-muted-foreground"}`}>
                            {format(date, "d")}
                          </span>
                          {hasEvents && eventColors && (
                            <EventIcon className={`h-3 w-3 md:h-4 md:w-4 ${isPast ? "text-muted-foreground" : eventColors.icon}`} />
                          )}
                          {events.length > 1 && (
                            <span className="text-[10px] text-muted-foreground">+{events.length - 1}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${eventTypeColors.expertise.bg} border ${eventTypeColors.expertise.border}`} />
                <Search className={`h-3 w-3 ${eventTypeColors.expertise.icon}`} />
                <span>Expertise</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${eventTypeColors.vente.bg} border ${eventTypeColors.vente.border}`} />
                <Gavel className={`h-3 w-3 ${eventTypeColors.vente.icon}`} />
                <span>Vente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${eventTypeColors.exposition.bg} border ${eventTypeColors.exposition.border}`} />
                <Eye className={`h-3 w-3 ${eventTypeColors.exposition.icon}`} />
                <span>Exposition</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded ring-2 ring-brand-primary bg-background" />
                <span>Aujourd'hui</span>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Events List */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="font-serif text-xl md:text-2xl font-semibold mb-8 text-center">
              Prochains Événements
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
              </div>
            ) : calendarEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun événement à venir pour le moment.
              </p>
            ) : (
              <div className="space-y-4">
                {calendarEvents
                  .filter(event => !isPastDemo(startOfDay(event.date)) || isTodayDemo(event.date))
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .slice(0, 8)
                  .map((event) => {
                    const displayType = mapEventType(event.type);
                    const colors = eventTypeColors[displayType];
                    const EventIcon = getEventIcon(displayType);
                    
                    return (
                      <button
                        key={event.id}
                        onClick={() => {
                          setSelectedEvent(event);
                          setDialogOpen(true);
                        }}
                        className={`w-full text-left bg-card rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 ${colors.border.replace('/50', '').replace('/40', '').replace('/30', '')}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
                          <div className="flex items-start gap-3">
                            <EventIcon className={`h-5 w-5 mt-1 ${colors.icon}`} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.icon} font-medium`}>
                                  {colors.label}
                                </span>
                                {event.specialty && (
                                  <span className="text-xs text-muted-foreground">
                                    {event.specialty}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-semibold text-lg text-brand-primary">{event.title}</h3>
                              {event.location && <p className="text-muted-foreground text-sm">{event.location}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground ml-8 md:ml-0">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(event.date, "d MMMM yyyy", { locale: fr })}
                            </span>
                            {event.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {event.time}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </section>

        {/* Info Section with SEO content */}
        <section className="py-12 md:py-16">
          <div className="container max-w-4xl">
            <div className="prose prose-lg max-w-none">
              <h2 className="font-serif text-xl md:text-2xl font-semibold mb-6">
                Comment se déroule une expertise ?
              </h2>
              <p className="text-muted-foreground mb-6">
                Nos séances d'expertise sont <strong>gratuites et sans engagement</strong>. Vous pouvez vous présenter 
                directement aux horaires indiqués avec vos objets, ou nous contacter pour prendre rendez-vous 
                si vous préférez un créneau dédié.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 my-8">
                <div className="bg-brand-primary/5 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-3 text-brand-primary">Sans rendez-vous</h3>
                  <p className="text-sm text-muted-foreground">
                    Présentez-vous directement lors des séances d'expertise programmées. 
                    Nos experts vous accueillent par ordre d'arrivée.
                  </p>
                </div>
                <div className="bg-brand-primary/5 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-3 text-brand-primary">Sur rendez-vous</h3>
                  <p className="text-sm text-muted-foreground">
                    Pour les objets volumineux ou les collections importantes, 
                    nous pouvons organiser une expertise à domicile.
                  </p>
                </div>
              </div>

              <h2 className="font-serif text-xl md:text-2xl font-semibold mb-6 mt-12">
                Que pouvez-vous faire expertiser ?
              </h2>
              <ul className="text-muted-foreground space-y-2 list-disc pl-6">
                <li>Bijoux, montres et pierres précieuses</li>
                <li>Tableaux, dessins et estampes</li>
                <li>Mobilier ancien et objets d'art</li>
                <li>Argenterie et orfèvrerie</li>
                <li>Vins et spiritueux</li>
                <li>Livres anciens et manuscrits</li>
                <li>Céramiques et porcelaines</li>
                <li>Souvenirs historiques et militaria</li>
                <li>Voitures de collection</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-brand-primary text-brand-primary-foreground">
          <div className="container text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4">
              Vous ne pouvez pas vous déplacer ?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Envoyez-nous des photos de vos objets par email ou via notre formulaire de contact. 
              Nous vous répondrons avec une première estimation sous 48h.
            </p>
            <Button 
              variant="outline" 
              size="lg"
              className="border-brand-secondary text-brand-secondary hover:bg-brand-secondary hover:text-brand-primary"
              asChild
            >
              <a href="/contact#formulaire">Demander une estimation en ligne</a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />

      {/* Event Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-brand-primary flex items-center gap-3">
              {selectedEvent && (
                <>
                  {(() => {
                    const displayType = mapEventType(selectedEvent.type);
                    const EventIcon = getEventIcon(displayType);
                    const colors = eventTypeColors[displayType];
                    return <EventIcon className={`h-5 w-5 ${colors.icon}`} />;
                  })()}
                  {selectedEvent.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 pt-4">
                {selectedEvent && (
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${eventTypeColors[mapEventType(selectedEvent.type)].bg} ${eventTypeColors[mapEventType(selectedEvent.type)].icon} font-medium`}>
                    {eventTypeColors[mapEventType(selectedEvent.type)].label}
                  </span>
                )}
                
                {selectedEvent?.description && (
                  <p className="text-base">{selectedEvent.description}</p>
                )}
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-brand-secondary" />
                    <span>
                      {selectedEvent?.date && format(selectedEvent.date, "EEEE d MMMM yyyy", { locale: fr })}
                    </span>
                  </div>
                  {selectedEvent?.time && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-brand-secondary" />
                      <span>{selectedEvent.time}</span>
                    </div>
                  )}
                  {selectedEvent?.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-brand-secondary" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                </div>

                {selectedEvent?.specialty && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Spécialité :</p>
                    <p className="font-medium">{selectedEvent.specialty}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {selectedEvent?.link ? (
                    <Button className="flex-1" asChild>
                      <a href={selectedEvent.link}>
                        Voir le catalogue
                      </a>
                    </Button>
                  ) : mapEventType(selectedEvent?.type || "expertise") === "vente" ? (
                    <Button className="flex-1" disabled>
                      Catalogue en préparation
                    </Button>
                  ) : (
                    <Button className="flex-1" asChild>
                      <a href="/contact#formulaire">
                        Prendre rendez-vous
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1" asChild>
                    <a href="tel:+33490000000" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Appeler
                    </a>
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Expertises;
