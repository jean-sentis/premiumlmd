import { useState } from "react";
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
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Phone, Gavel, Eye, Search } from "lucide-react";
import { format, addWeeks, startOfWeek, addDays, isSameDay, isToday, isBefore } from "date-fns";
import { fr } from "date-fns/locale";

// Types d'événements avec couleurs distinctes
type EventType = "expertise" | "vente" | "exposition-vente";

interface CalendarEvent {
  date: Date;
  title: string;
  expert?: string;
  time: string;
  description: string;
  location: string;
  type: EventType;
  catalogueUrl?: string; // URL si catalogue en ligne
}

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
  "exposition-vente": {
    bg: "bg-sky-500/15",
    border: "border-sky-500/40",
    icon: "text-sky-600",
    label: "Exposition & Vente",
    cardBg: "bg-sky-50"
  }
};

// Mock data for calendar events - in production this would come from a database
const calendarEvents: CalendarEvent[] = [
  {
    date: new Date(2025, 11, 9),
    title: "Expertise Bijoux & Montres",
    expert: "Marie Dupont",
    time: "10h00 - 12h00",
    description: "Expertise gratuite de vos bijoux anciens, montres de collection et pierres précieuses.",
    location: "Salle d'expertise principale",
    type: "expertise"
  },
  {
    date: new Date(2025, 11, 10),
    title: "Vente Mobilier & Objets d'Art",
    time: "14h00",
    description: "Vente cataloguée de mobilier XVIIIe et XIXe, objets d'art et tableaux anciens.",
    location: "Grande salle des ventes",
    type: "vente",
    catalogueUrl: "https://interencheres.com/catalogue-123"
  },
  {
    date: new Date(2025, 11, 11),
    title: "Exposition Art Moderne",
    time: "10h00 - 18h00",
    description: "Exposition publique avant la vente du 12 décembre. Venez découvrir les lots.",
    location: "Galerie du premier étage",
    type: "exposition-vente"
  },
  {
    date: new Date(2025, 11, 12),
    title: "Vente Art Moderne",
    time: "14h30",
    description: "Tableaux, sculptures et œuvres du XXème siècle. Vente live et en ligne.",
    location: "Galerie du premier étage",
    type: "vente",
    catalogueUrl: "https://interencheres.com/catalogue-124"
  },
  {
    date: new Date(2025, 11, 16),
    title: "Expertise Générale",
    expert: "Maître Pascal Delbarry",
    time: "10h00 - 12h00",
    description: "Expertise tous objets : mobilier, tableaux, objets d'art, argenterie, etc.",
    location: "Hôtel des ventes",
    type: "expertise"
  },
  {
    date: new Date(2025, 11, 17),
    title: "Exposition Vins & Spiritueux",
    time: "14h00 - 18h00",
    description: "Exposition des lots avant la vente du 18 décembre. Dégustation sur réservation.",
    location: "Cave climatisée",
    type: "exposition-vente"
  },
  {
    date: new Date(2025, 11, 18),
    title: "Vente Vins & Spiritueux",
    time: "14h00",
    description: "Grands crus de Bourgogne et Bordeaux, champagnes millésimés, whiskies rares.",
    location: "Cave climatisée",
    type: "vente"
  },
  {
    date: new Date(2025, 11, 23),
    title: "Expertise Militaria",
    expert: "Colonel Bertrand",
    time: "10h00 - 12h00",
    description: "Uniformes, décorations, armes anciennes et souvenirs historiques.",
    location: "Salle des collections",
    type: "expertise"
  },
  {
    date: new Date(2026, 0, 6),
    title: "Expertise Céramiques",
    expert: "Claire Fontaine",
    time: "14h00 - 17h00",
    description: "Porcelaines, faïences, grès et céramiques de toutes époques.",
    location: "Salle d'expertise principale",
    type: "expertise"
  },
];

const Expertises = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      case "exposition-vente": return Eye;
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
      setSelectedEvent(events[0]); // Show first event, could be extended to show multiple
      setDialogOpen(true);
    }
  };

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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
            <div className="space-y-1 md:space-y-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1 md:gap-2">
                  {week.map((date) => {
                    const events = getEventsForDate(date);
                    const isPast = isBefore(date, new Date()) && !isToday(date);
                    const hasEvents = events.length > 0;
                    const firstEvent = events[0];
                    const eventColors = firstEvent ? eventTypeColors[firstEvent.type] : null;
                    const EventIcon = firstEvent ? getEventIcon(firstEvent.type) : Calendar;

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleDateClick(date)}
                        disabled={!hasEvents || isPast}
                        className={`
                          aspect-square p-1 md:p-2 rounded-lg text-center transition-all
                          flex flex-col items-center justify-center gap-0.5
                          ${isToday(date) ? "ring-2 ring-brand-primary" : ""}
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
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

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
                <div className={`w-4 h-4 rounded ${eventTypeColors["exposition-vente"].bg} border ${eventTypeColors["exposition-vente"].border}`} />
                <Eye className={`h-3 w-3 ${eventTypeColors["exposition-vente"].icon}`} />
                <span>Exposition & Vente</span>
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
            
            <div className="space-y-4">
              {calendarEvents
                .filter(event => !isBefore(event.date, new Date()) || isToday(event.date))
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 8)
                .map((event, index) => {
                  const colors = eventTypeColors[event.type];
                  const EventIcon = getEventIcon(event.type);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedEvent(event);
                        setDialogOpen(true);
                      }}
                      className={`w-full text-left bg-card rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 ${colors.border.replace('/50', '')}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
                        <div className="flex items-start gap-3">
                          <EventIcon className={`h-5 w-5 mt-1 ${colors.icon}`} />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.icon} font-medium`}>
                                {colors.label}
                              </span>
                            </div>
                            <h3 className="font-semibold text-lg text-brand-primary">{event.title}</h3>
                            {event.expert && <p className="text-muted-foreground text-sm">{event.expert}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground ml-8 md:ml-0">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(event.date, "d MMMM yyyy", { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
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
                    const EventIcon = getEventIcon(selectedEvent.type);
                    const colors = eventTypeColors[selectedEvent.type];
                    return <EventIcon className={`h-5 w-5 ${colors.icon}`} />;
                  })()}
                  {selectedEvent.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 pt-4">
                {selectedEvent && (
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${eventTypeColors[selectedEvent.type].bg} ${eventTypeColors[selectedEvent.type].icon} font-medium`}>
                    {eventTypeColors[selectedEvent.type].label}
                  </span>
                )}
                
                <p className="text-base">{selectedEvent?.description}</p>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-brand-secondary" />
                    <span>
                      {selectedEvent?.date && format(selectedEvent.date, "EEEE d MMMM yyyy", { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-brand-secondary" />
                    <span>{selectedEvent?.time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-brand-secondary" />
                    <span>{selectedEvent?.location}</span>
                  </div>
                </div>

                {selectedEvent?.expert && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Expert responsable :</p>
                    <p className="font-medium">{selectedEvent.expert}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {selectedEvent?.catalogueUrl ? (
                    <Button className="flex-1" asChild>
                      <a href={selectedEvent.catalogueUrl} target="_blank" rel="noopener noreferrer">
                        Voir le catalogue
                      </a>
                    </Button>
                  ) : selectedEvent?.type === "vente" ? (
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