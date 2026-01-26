import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Droplet } from "lucide-react";
import {
  format,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isAfter,
  isBefore,
  startOfDay,
  isSameDay,
  differenceInDays,
  subDays,
  differenceInSeconds,
  isWithinInterval,
  getWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import EventDetailDialog from "./EventDetailDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { getDemoNow } from "@/lib/site-config";

interface TimelineEvent {
  id: string;
  type: "vente-live" | "vente-chrono" | "vente-preparation" | "exposition" | "veille-exposition" | "expertise" | "expertise-itinerante" | "fermeture";
  title: string;
  date: Date;
  endDate?: Date;
  time?: string;
  link?: string;
  specialty?: string;
  location?: string;
  description?: string;
}

interface TimelineCalendarProps {
  events: TimelineEvent[];
  mode: "acheter" | "vendre";
  variant?: "default" | "dates-first";
}

const TimelineCalendar = ({ events, mode, variant = "default" }: TimelineCalendarProps) => {
  const isMobile = useIsMobile();
  // Nombre de jours affichés : 3 sur mobile, 7 sur desktop
  const daysToShow = isMobile ? 3 : 7;
  // État pour le popup de détail d'événement
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleEventClick = (event: TimelineEvent) => {
    // Si l'événement a un lien, ne pas ouvrir le popup (le Link gère la navigation)
    if (!event.link) {
      setSelectedEvent(event);
      setDialogOpen(true);
    }
  };
  // Date de référence (Mode démo) : toujours passer par la config centrale
  const demoDate = getDemoNow();
  // Sur mobile, on commence à la date démo directement (pas forcément début de semaine)
  const [periodStart, setPeriodStart] = useState(
    isMobile ? startOfDay(demoDate) : startOfWeek(demoDate, { weekStartsOn: 1 })
  );
  
  // Synchroniser avec le changement mobile/desktop
  useEffect(() => {
    if (isMobile) {
      setPeriodStart(startOfDay(demoDate));
    } else {
      setPeriodStart(startOfWeek(demoDate, { weekStartsOn: 1 }));
    }
  }, [isMobile]);
  
  // Pour compatibilité avec le code existant
  const weekStart = isMobile ? periodStart : startOfWeek(periodStart, { weekStartsOn: 1 });
  
  // Current time state (updates every second)
  const [currentTime, setCurrentTime] = useState(() => getDemoNow());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getDemoNow());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Drag state (mouse)
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragAccumulated = useRef(0);
  
  // Touch/swipe state (mobile)
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const periodEnd = addDays(periodStart, daysToShow - 1);
  const weekEnd = isMobile ? periodEnd : endOfWeek(weekStart, { weekStartsOn: 1 });

  // Le planning affiche tous les événements (plus de filtrage par mode)
  // Tous les types d'événements sont visibles : ventes, expositions, expertises, fermetures
  const filteredEvents = useMemo(() => {
    return events; // Plus de filtrage - le planning montre tout
  }, [events]);

  // Separate chrono events from others
  const { chronoEvents, regularEvents } = useMemo(() => {
    const chrono: TimelineEvent[] = [];
    const regular: TimelineEvent[] = [];
    
    filteredEvents.forEach(event => {
      if (event.type === "vente-chrono") {
        chrono.push(event);
      } else {
        regular.push(event);
      }
    });
    
    return { chronoEvents: chrono, regularEvents: regular };
  }, [filteredEvents]);

  // Get chrono events that overlap with this week
  const weekChronoEvents = useMemo(() => {
    return chronoEvents.filter((event) => {
      const eventStart = startOfDay(event.date);
      const eventEnd = event.endDate ? startOfDay(event.endDate) : eventStart;
      const weekStartDay = startOfDay(weekStart);
      const weekEndDay = startOfDay(weekEnd);

      return !isAfter(eventStart, weekEndDay) && !isBefore(eventEnd, weekStartDay);
    });
  }, [chronoEvents, weekStart, weekEnd]);

  // Get regular events that appear in this week
  const weekEvents = useMemo(() => {
    return regularEvents.filter((event) => {
      const eventStart = startOfDay(event.date);
      const eventEnd = event.endDate ? startOfDay(event.endDate) : eventStart;
      const weekStartDay = startOfDay(weekStart);
      const weekEndDay = startOfDay(weekEnd);

      return !isAfter(eventStart, weekEndDay) && !isBefore(eventEnd, weekStartDay);
    });
  }, [regularEvents, weekStart, weekEnd]);

  // Sort events: prioritize ventes over expositions, then by date
  // IMPORTANT: Les estimations (expertise) ne doivent JAMAIS être sur la ligne 1
  // Elles doivent toujours être sur ligne 2 ou 3
  const sortedWeekEvents = useMemo(() => {
    const typeOrder = (type: TimelineEvent["type"]) => {
      if (type === "vente-live") return 0;
      if (type === "vente-preparation") return 1;
      if (type === "exposition" || type === "veille-exposition") return 2;
      if (type === "fermeture") return 3;
      if (type === "expertise-itinerante") return 4; // expertises itinérantes avant les estimations
      return 5; // expertise toujours en dernier
    };
    
    return [...weekEvents].sort((a, b) => {
      const typeDiff = typeOrder(a.type) - typeOrder(b.type);
      if (typeDiff !== 0) return typeDiff;
      return a.date.getTime() - b.date.getTime();
    });
  }, [weekEvents]);

  // Fonction pour calculer la ligne d'affichage d'un événement
  // Les expertises sont TOUJOURS sur ligne 2 minimum (jamais ligne 1)
  const getEventDisplayLine = (event: TimelineEvent, eventsOnSameDay: TimelineEvent[]): number => {
    const indexOnDay = eventsOnSameDay.findIndex(e => e.id === event.id);
    
    // Si c'est une expertise (fixe ou itinérante), elle doit être sur ligne 2 minimum
    if (event.type === "expertise" || event.type === "expertise-itinerante") {
      // Compte combien d'événements non-expertise sont avant sur ce jour
      const nonExpertiseCount = eventsOnSameDay.filter((e, i) => i < indexOnDay && e.type !== "expertise" && e.type !== "expertise-itinerante").length;
      // L'expertise va sur ligne 2 si aucun autre événement, sinon après les autres
      return Math.max(1, nonExpertiseCount); // ligne 1 = index 1 (2ème ligne)
    }
    
    return indexOnDay;
  };

  const navigateMonth = (direction: number) => {
    setPeriodStart((prev) => {
      const newDate = direction > 0 ? addMonths(prev, 1) : subMonths(prev, 1);
      return isMobile ? startOfDay(newDate) : startOfWeek(newDate, { weekStartsOn: 1 });
    });
  };

  const navigateWeek = (direction: number) => {
    if (isMobile) {
      // Sur mobile, on navigue de 3 jours en 3 jours
      setPeriodStart((prev) => addDays(prev, direction * 3));
    } else {
      setPeriodStart((prev) => (direction > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1)));
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragAccumulated.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const diff = dragStartX.current - e.clientX;
    dragAccumulated.current = diff;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const daysMoved = Math.round(dragAccumulated.current / 50);
    if (daysMoved !== 0) {
      setPeriodStart((prev) => addDays(prev, daysMoved));
    }
    dragAccumulated.current = 0;
  };

  const handleMouseLeave = () => {
    if (isDragging.current) {
      handleMouseUp();
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Si le mouvement vertical est plus grand que horizontal, on annule le swipe
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      isSwiping.current = false;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const swipeThreshold = 50; // pixels minimum pour déclencher le swipe
    
    if (Math.abs(deltaX) > swipeThreshold) {
      // Swipe vers la droite = période précédente, swipe vers la gauche = période suivante
      const direction = deltaX > 0 ? -1 : 1;
      navigateWeek(direction);
    }
  };

  // Couleur d'ombre basée sur la spécialité
  const getSpecialtyShadow = (specialty?: string, title?: string): string => {
    const text = (specialty || title || '').toLowerCase();
    
    if (text.includes('voiture') || text.includes('véhicule') || text.includes('automobile')) {
      return '-3px 3px 0px 0px rgba(0, 100, 80, 0.85)'; // Vert jaguar
    }
    if (text.includes('art moderne') || text.includes('contemporain') || text.includes('xxe') || text.includes('xxème')) {
      return '-3px 3px 0px 0px rgba(30, 64, 175, 0.85)'; // Bleu profond
    }
    if (text.includes('bijoux') || text.includes('montre') || text.includes('joaillerie') || text.includes('bijou')) {
      return '-3px 3px 0px 0px rgba(220, 180, 0, 0.9)'; // Jaune or vif
    }
    if (text.includes('vin') || text.includes('spiritueux')) {
      return '-3px 3px 0px 0px rgba(127, 29, 29, 0.85)'; // Bordeaux
    }
    if (text.includes('mode') || text.includes('vêtement') || text.includes('textile') || text.includes('vetement') || text.includes('couture') || text.includes('maroquinerie')) {
      return '-3px 3px 0px 0px rgba(180, 60, 120, 0.85)'; // Rose fuchsia
    }
    if (text.includes('mobilier') || text.includes('objet')) {
      return '-3px 3px 0px 0px rgba(16, 120, 80, 0.85)'; // Vert émeraude
    }
    if (text.includes('collection') || text.includes('curiosité')) {
      return '-3px 3px 0px 0px rgba(180, 100, 60, 0.85)'; // Cuivre
    }
    if (text.includes('militaria') || text.includes('arme')) {
      return '-3px 3px 0px 0px rgba(85, 90, 70, 0.85)'; // Kaki
    }
    if (text.includes('argent')) {
      return '-3px 3px 0px 0px rgba(140, 140, 150, 0.85)'; // Argent
    }
    // Couleur par défaut
    return '-3px 3px 0px 0px rgba(100, 100, 100, 0.6)';
  };

  const getEventStyle = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "vente-live":
      case "vente-chrono":
      case "vente-preparation":
        return { bg: "bg-white", text: "text-neutral-800", border: "border border-neutral-300" };
      case "exposition":
      case "veille-exposition":
        return { bg: "bg-white", text: "text-neutral-800", border: "border border-neutral-300" };
      case "expertise":
      case "expertise-itinerante":
        // Toutes les expertises/estimations : même couleur distinctive (vert-bleu doux)
        return { bg: "bg-teal-50", text: "text-teal-900", border: "border border-teal-300" };
      case "fermeture":
        return { bg: "bg-red-100", text: "text-red-800", border: "border border-red-300" };
      default:
        return { bg: "bg-white", text: "text-neutral-800", border: "border border-neutral-300" };
    }
  };

  // Calculate position on timeline (0% = start of period, 100% = end of period)
  const getEventPosition = (eventDate: Date) => {
    const periodStartDay = startOfDay(periodStart);
    const daysDiff = differenceInDays(startOfDay(eventDate), periodStartDay);
    return ((daysDiff + 0.5) / daysToShow) * 100;
  };

  // Get position percentage for a specific date (for chrono events spanning multiple days)
  const getDatePosition = (date: Date) => {
    const periodStartDay = startOfDay(periodStart);
    const periodEndDay = addDays(periodStartDay, daysToShow);
    
    // Clamp date to period bounds
    let clampedDate = date;
    if (isBefore(date, periodStartDay)) clampedDate = periodStartDay;
    if (isAfter(date, periodEndDay)) clampedDate = periodEndDay;
    
    const totalSeconds = daysToShow * 24 * 60 * 60;
    const elapsedSeconds = differenceInSeconds(clampedDate, periodStartDay);
    return (elapsedSeconds / totalSeconds) * 100;
  };

  // Calculate current time position on timeline
  const getCurrentTimePosition = () => {
    // Use demo date (3 janvier 2026) with current real time
    const now = new Date(2026, 0, 3, currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds());
    const periodStartTime = startOfDay(periodStart);
    const periodEndTime = addDays(periodStartTime, daysToShow);
    
    if (isBefore(now, periodStartTime) || isAfter(now, periodEndTime)) {
      return null;
    }
    
    const totalSecondsInPeriod = daysToShow * 24 * 60 * 60;
    const secondsElapsed = differenceInSeconds(now, periodStartTime);
    return (secondsElapsed / totalSecondsInPeriod) * 100;
  };

  const currentTimePosition = getCurrentTimePosition();
  
  // Demo "now" for chrono calculations
  const demoNow = new Date(2026, 0, 3, currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds());

  // Decode HTML entities
  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Check if regular events occupy both lines (for chrono expansion)
  const hasTwoRegularEvents = sortedWeekEvents.length >= 2;

  // Render a chrono event with special styling
  const renderChronoEvent = (event: TimelineEvent) => {
    const eventStart = event.date;
    const eventEnd = event.endDate || event.date;
    
    // Calculer la position en jours depuis le début de la période
    const startDayIndex = differenceInDays(startOfDay(eventStart), startOfDay(periodStart));
    
    // Pour la fin, on prend en compte l'heure exacte
    const endDayIndex = differenceInDays(startOfDay(eventEnd), startOfDay(periodStart));
    const endHour = eventEnd.getHours();
    const endMinute = eventEnd.getMinutes();
    const endDayFraction = endDayIndex + (endHour + endMinute / 60) / 24;
    
    // Clamp to period bounds (0-daysToShow)
    const clampedStartDay = Math.max(0, Math.min(daysToShow, startDayIndex));
    const clampedEndDay = Math.max(0, Math.min(daysToShow, endDayFraction));
    
    // Position en pourcentage
    const startPos = (clampedStartDay / daysToShow) * 100;
    const endPos = (clampedEndDay / daysToShow) * 100;
    const width = endPos - startPos;
    
    if (width <= 0) return null;
    
    // Calculate "now" position relative to this event
    const nowDayIndex = differenceInDays(startOfDay(demoNow), startOfDay(periodStart));
    const nowPos = ((nowDayIndex + (currentTime.getHours() / 24)) / daysToShow) * 100;
    const decodedTitle = decodeHtmlEntities(event.title);
    
    // Determine what portion is passed vs remaining
    let passedWidth = 0;
    let remainingWidth = width;
    
    if (nowPos > startPos) {
      if (nowPos >= endPos) {
        // Entire event is in the past
        passedWidth = width;
        remainingWidth = 0;
      } else {
        // Partially passed
        passedWidth = nowPos - startPos;
        remainingWidth = endPos - nowPos;
      }
    }
    
    // Format the end time and date
    const endTimeStr = event.time ? `${event.time.replace(':', 'h')}` : format(eventEnd, "HH'h'", { locale: fr });
    const endDateStr = format(eventEnd, "d MMM", { locale: fr }).replace('.', '');
    
    // Ombre basée sur la spécialité
    const chronoShadow = getSpecialtyShadow(event.specialty, event.title);
    
    // Chrono event positioned in the top area
    const content = (
      <div 
        className="absolute flex items-center"
        style={{ 
          left: `${startPos}%`, 
          width: `${width}%`,
          top: '0',
          height: '24px',
          zIndex: 5,
        }}
      >
        {/* Conteneur avec ombre sur toute la longueur */}
        <div
          className="absolute top-0 bottom-0 left-0 right-0 rounded"
          style={{
            boxShadow: chronoShadow,
          }}
        >
          {/* Partie écoulée - matière légère (sans contour) */}
          {passedWidth > 0 && (
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: 0,
                width: `${(passedWidth / width) * 100}%`,
                backgroundColor: 'hsl(var(--brand-parchment) / 0.35)',
                borderRadius: remainingWidth > 0 ? '4px 0 0 4px' : '4px',
              }}
            />
          )}
          
          {/* Partie restante - hachurée (bien visible, sans contour) */}
          {remainingWidth > 0 && (
            <div
              className="absolute top-0 bottom-0 overflow-hidden"
              style={{
                left: `${(passedWidth / width) * 100}%`,
                width: `${(remainingWidth / width) * 100}%`,
                borderRadius: passedWidth > 0 ? '0 4px 4px 0' : '4px',
                background: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 4px,
                  hsl(var(--brand-parchment) / 0.55) 4px,
                  hsl(var(--brand-parchment) / 0.55) 8px
                )`,
              }}
            />
          )}
        </div>
        
        {/* Mini-cartouche blanche avec le texte */}
        <div 
          className="relative z-10 bg-white rounded px-3 flex items-center ml-1" 
          style={{ height: '18px' }}
        >
          <span className="text-xs md:text-sm font-semibold text-neutral-700 whitespace-nowrap leading-none">
            Chrono {decodedTitle.replace(/^vente\s*/i, "").length > 18 ? decodedTitle.replace(/^vente\s*/i, "").substring(0, 18) + "..." : decodedTitle.replace(/^vente\s*/i, "")} fin {endDateStr} {endTimeStr}
          </span>
        </div>
      </div>
    );

    return (
      <div key={event.id}>
        {event.link ? (
          <Link
            to={event.link}
            className="hover:opacity-80 transition-opacity"
            title={decodedTitle}
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </Link>
        ) : (
          <div title={decodedTitle}>
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-background flex justify-center">
      <div className="w-full max-w-[1920px]">

      {/* Bloc contenant mois, légende et timeline - avec support swipe mobile */}
      <div 
        className="relative px-2 py-1 touch-pan-y"
        style={{ marginTop: '5px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      
      {/* Fond bleu profond intérieur avec marges spécifiques */}
      <div 
        className="absolute rounded-sm"
        style={{ 
          top: '14px',
          backgroundColor: 'hsl(var(--brand-blue-900))',
          left: '9px',
          right: '23px',
          bottom: '0',
          zIndex: 0,
        }}
      />
      
      {/* Les lignes de contour sont supprimées pour ne garder que le fond et les ombres */}
      
      
      {/* Ligne 1 : Mois centré */}
      <div className="px-6" style={{ marginTop: '2px', paddingBottom: '4px' }}>
        {/* Mois avec navigation - centré */}
        <div
          className="flex items-center justify-center gap-1"
          style={{ marginTop: '-12px', transform: 'translateY(-8px)' }}
        >
          {/* Double chevron gauche - mois précédent (éloigné) */}
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1 hover:bg-neutral-100 transition-colors rounded"
            style={{ marginRight: '-3px' }}
            title="Mois précédent"
          >
            <ChevronsLeft className="w-5 h-5 text-neutral-700" />
          </button>

          {/* Simple chevron gauche - semaine précédente (proche) */}
          <button
            onClick={() => navigateWeek(-1)}
            className="p-1 hover:bg-neutral-100 transition-colors rounded"
            title="Semaine précédente"
          >
            <ChevronLeft className="w-4 h-4 text-neutral-700" />
          </button>

          <span className="font-sans text-sm md:text-base font-medium tracking-tight uppercase text-foreground">
            {format(weekStart, "MMMM yyyy", { locale: fr })} - semaine n° {getWeek(weekStart, { weekStartsOn: 1 })}
          </span>

          {/* Simple chevron droit - semaine suivante (proche) */}
          <button
            onClick={() => navigateWeek(1)}
            className="p-1 hover:bg-neutral-100 transition-colors rounded"
            title="Semaine suivante"
          >
            <ChevronRight className="w-4 h-4 text-neutral-700" />
          </button>

          {/* Double chevron droit - mois suivant (éloigné) */}
          <button
            onClick={() => navigateMonth(1)}
            className="p-1 hover:bg-neutral-100 transition-colors rounded"
            style={{ marginLeft: '-3px' }}
            title="Mois suivant"
          >
            <ChevronsRight className="w-5 h-5 text-neutral-700" />
          </button>
        </div>
      </div>

      {/* Espacement entre le menu de navigation et la frise */}
      <div className="h-[5px]" />
      <div className="px-6 py-1">
        <div style={{ transform: 'translateY(-5px)' }}>
          
          {variant === "default" ? (
            <>
              {/* VARIANTE DEFAULT: événements en haut, dates en bas */}
              {/* Zone des événements AU-DESSUS des jours + chrono */}
              <div className="relative min-h-[24px] mb-1">
                {weekChronoEvents.map(event => renderChronoEvent(event))}
                
                {sortedWeekEvents.map((event) => {
                  const style = getEventStyle(event.type);
                  const dayIndex = differenceInDays(startOfDay(event.date), startOfDay(periodStart));
                  const position = (dayIndex / daysToShow) * 100;
                  const clampedPosition = Math.max(1, Math.min(99, position));
                  const decodedTitle = decodeHtmlEntities(event.title);
                  
                    const eventsOnSameDay = sortedWeekEvents.filter(e => isSameDay(e.date, event.date));
                    const displayLine = getEventDisplayLine(event, eventsOnSameDay);
                    if (displayLine > 0) return null; // Seulement la ligne 1 (index 0)

                  const shadowStyle = event.type !== 'exposition' && event.type !== 'veille-exposition' 
                    ? getSpecialtyShadow(event.specialty, event.title) : 'none';

                  // Pour les expos sur mobile, afficher juste "Expo" - sur desktop le titre complet
                  const isExpo = event.type === 'exposition' || event.type === 'veille-exposition';
                  const displayTitle = isExpo && isMobile ? 'Expo' : decodedTitle.replace(/^vente\s*/i, "");

                  const content = (
                    <div className={`${style.bg} ${style.text} ${style.border} rounded px-2 py-1 flex items-center gap-1`}
                      style={{ maxWidth: isMobile ? '100px' : '180px', boxShadow: shadowStyle }}>
                      <span className="text-xs md:text-sm font-medium truncate">{displayTitle}</span>
                    </div>
                  );

                  return (
                    <div key={event.id} className="absolute" style={{ left: `${clampedPosition}%`, bottom: '0' }}>
                      {event.link ? (
                        <Link to={event.link} className="hover:scale-105 transition-transform block">{content}</Link>
                      ) : (
                        <button 
                          onClick={() => handleEventClick(event)} 
                          className="hover:scale-105 transition-transform block cursor-pointer"
                        >
                          {content}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Affichage des jours (3 sur mobile, 7 sur desktop) */}
              <div className="relative flex items-center">
                
                {Array.from({ length: daysToShow }).map((_, index) => {
                  const day = addDays(periodStart, index);
                  const dayName = format(day, "EEE", { locale: fr }).replace('.', '');
                  const dayNumber = format(day, "d");
                  const monthName = format(day, "MMM", { locale: fr }).replace('.', '');
                  
                  return (
                    <div key={index} className="flex items-center gap-1" style={{ width: `${100 / daysToShow}%` }}>
                      <div className="w-[2px] h-[12px] bg-[hsl(var(--brand-secondary))]" />
                      <span className="text-xs md:text-sm font-semibold text-white whitespace-nowrap drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">{dayName} {dayNumber} {monthName}</span>
                    </div>
                  );
                })}
              </div>

              {/* Zone des événements EN-DESSOUS (2ème événement du même jour) */}
              <div className="relative min-h-[24px] mt-1">
                {sortedWeekEvents.map((event) => {
                  const style = getEventStyle(event.type);
                  const dayIndex = differenceInDays(startOfDay(event.date), startOfDay(periodStart));
                  const position = (dayIndex / daysToShow) * 100;
                  const clampedPosition = Math.max(1, Math.min(99, position));
                  const decodedTitle = decodeHtmlEntities(event.title);
                  
                    const eventsOnSameDay = sortedWeekEvents.filter(e => isSameDay(e.date, event.date));
                    const displayLine = getEventDisplayLine(event, eventsOnSameDay);
                    if (displayLine !== 1) return null; // Seulement la ligne 2 (index 1)

                  const shadowStyle = event.type !== 'exposition' && event.type !== 'veille-exposition' 
                    ? getSpecialtyShadow(event.specialty, event.title) : 'none';

                  // Pour les expos sur mobile, afficher juste "Expo" - sur desktop le titre complet
                  const isExpo = event.type === 'exposition' || event.type === 'veille-exposition';
                  const displayTitle = isExpo && isMobile ? 'Expo' : decodedTitle.replace(/^vente\s*/i, "");

                  const content = (
                    <div className={`${style.bg} ${style.text} ${style.border} rounded px-2 py-1 flex items-center gap-1`}
                      style={{ maxWidth: isMobile ? '100px' : '180px', boxShadow: shadowStyle }}>
                      <span className="text-xs md:text-sm font-medium truncate">{displayTitle}</span>
                    </div>
                  );

                  return (
                    <div key={event.id} className="absolute" style={{ left: `${clampedPosition}%`, top: '0' }}>
                      {event.link ? (
                        <Link to={event.link} className="hover:scale-105 transition-transform block">{content}</Link>
                      ) : (
                        <button 
                          onClick={() => handleEventClick(event)} 
                          className="hover:scale-105 transition-transform block cursor-pointer"
                        >
                          {content}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Zone des événements EN-DESSOUS (3ème événement du même jour et +) */}
              {sortedWeekEvents.some(event => {
                const eventsOnSameDay = sortedWeekEvents.filter(e => isSameDay(e.date, event.date));
                // Vérifier si un événement a une displayLine >= 2
                return eventsOnSameDay.some(e => getEventDisplayLine(e, eventsOnSameDay) >= 2);
              }) && (
                <div className="relative min-h-[24px] mt-1">
                  {sortedWeekEvents.map((event) => {
                    const style = getEventStyle(event.type);
                    const dayIndex = differenceInDays(startOfDay(event.date), startOfDay(periodStart));
                    const position = (dayIndex / daysToShow) * 100;
                    const clampedPosition = Math.max(1, Math.min(99, position));
                    const decodedTitle = decodeHtmlEntities(event.title);
                    
                    const eventsOnSameDay = sortedWeekEvents.filter(e => isSameDay(e.date, event.date));
                    const displayLine = getEventDisplayLine(event, eventsOnSameDay);
                    if (displayLine < 2) return null; // Seulement la ligne 3+ (index >= 2)

                    const shadowStyle = event.type !== 'exposition' && event.type !== 'veille-exposition' 
                      ? getSpecialtyShadow(event.specialty, event.title) : 'none';

                    // Pour les expos sur mobile, afficher juste "Expo" - sur desktop le titre complet
                    const isExpo = event.type === 'exposition' || event.type === 'veille-exposition';
                    const displayTitle = isExpo && isMobile ? 'Expo' : decodedTitle.replace(/^vente\s*/i, "");

                    const content = (
                      <div className={`${style.bg} ${style.text} ${style.border} rounded px-2 py-1 flex items-center gap-1`}
                        style={{ maxWidth: isMobile ? '100px' : '180px', boxShadow: shadowStyle }}>
                        <span className="text-xs md:text-sm font-medium truncate">{displayTitle}</span>
                      </div>
                    );

                    return (
                      <div key={event.id} className="absolute" style={{ left: `${clampedPosition}%`, top: '0' }}>
                        {event.link ? (
                          <Link to={event.link} className="hover:scale-105 transition-transform block">{content}</Link>
                        ) : (
                          <button 
                            onClick={() => handleEventClick(event)} 
                            className="hover:scale-105 transition-transform block cursor-pointer"
                          >
                            {content}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {sortedWeekEvents.length === 0 && weekChronoEvents.length === 0 && (
                <div className="flex items-center justify-center min-h-[24px]">
                  <span className="text-xs text-neutral-400 italic">Pas d'événement cette semaine</span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* VARIANTE DATES-FIRST: dates en haut, ventes en dessous */}
              {/* Container principal avec position relative pour le trait du temps */}
              <div className="relative">
                {/* Trait du temps - positionné EN PREMIER pour être derrière tout */}
                {currentTimePosition !== null && (
                  <div 
                    className="absolute flex flex-col pointer-events-none"
                    style={{ 
                      left: `${currentTimePosition}%`, 
                      transform: 'translateX(-50%)', 
                      top: '15px',
                      bottom: '0',
                      zIndex: -1,
                    }}
                  >
                    {/* Trait vertical qui s'étend sur toute la hauteur moins l'espace pour l'heure */}
                    <div 
                      className="w-[2px] bg-[hsl(var(--brand-secondary))] flex-1"
                      style={{ marginBottom: '2px' }}
                    />
                    {/* Heure en bas */}
                    <span className="text-xs font-semibold text-white whitespace-nowrap">
                      {format(demoNow, "HH:mm", { locale: fr })}
                    </span>
                  </div>
                )}

                {/* Affichage des jours EN HAUT - z-index plus haut */}
                <div className="relative flex items-center" style={{ marginTop: '-8px', zIndex: 1 }}>
                  {Array.from({ length: daysToShow }).map((_, index) => {
                    const day = addDays(periodStart, index);
                    const dayName = format(day, "EEE", { locale: fr }).replace('.', '');
                    const dayNumber = format(day, "d");
                    const monthName = format(day, "MMM", { locale: fr }).replace('.', '');
                    
                    return (
                      <div key={index} className="flex items-center gap-1" style={{ width: `${100 / daysToShow}%` }}>
                        <div className="w-[2px] h-[12px] bg-[hsl(var(--brand-secondary))]" />
                        <span className="text-xs md:text-sm font-semibold text-white whitespace-nowrap drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">{dayName} {dayNumber} {monthName}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Ligne 1 des ventes (1ère vente de chaque jour) - z-index plus haut */}
                <div className="relative min-h-[24px]" style={{ marginTop: '5px', zIndex: 1 }}>
                  {weekChronoEvents.map(event => renderChronoEvent(event))}
                  
                  {sortedWeekEvents.map((event) => {
                    const style = getEventStyle(event.type);
                    const dayIndex = differenceInDays(startOfDay(event.date), startOfDay(periodStart));
                    const position = (dayIndex / daysToShow) * 100;
                    const clampedPosition = Math.max(1, Math.min(99, position));
                    const decodedTitle = decodeHtmlEntities(event.title);
                    
                    const eventsOnSameDay = sortedWeekEvents.filter(e => isSameDay(e.date, event.date));
                    const displayLine = getEventDisplayLine(event, eventsOnSameDay);
                    if (displayLine > 0) return null; // Seulement la ligne 1 (index 0)

                    const shadowStyle = event.type !== 'exposition' && event.type !== 'veille-exposition' 
                      ? getSpecialtyShadow(event.specialty, event.title) : 'none';

                    // Pour les expos sur mobile, afficher juste "Expo" - sur desktop le titre complet
                    const isExpo = event.type === 'exposition' || event.type === 'veille-exposition';
                    const displayTitle = isExpo && isMobile ? 'Expo' : decodedTitle.replace(/^vente\s*/i, "");

                    const content = (
                      <div className={`${style.bg} ${style.text} ${style.border} rounded px-2 py-1 flex items-center gap-1`}
                        style={{ maxWidth: isMobile ? '100px' : '180px', boxShadow: shadowStyle }}>
                        <span className="text-xs md:text-sm font-medium truncate">{displayTitle}</span>
                      </div>
                    );

                    return (
                      <div key={event.id} className="absolute" style={{ left: `${clampedPosition}%`, top: '0' }}>
                        {event.link ? (
                          <Link to={event.link} className="hover:scale-105 transition-transform block">{content}</Link>
                        ) : (
                          <button 
                            onClick={() => handleEventClick(event)} 
                            className="hover:scale-105 transition-transform block cursor-pointer"
                          >
                            {content}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Ligne 2 des ventes (2ème vente de chaque jour) - z-index plus haut */}
                <div className="relative min-h-[24px]" style={{ marginTop: '8px', zIndex: 1 }}>
                  {sortedWeekEvents.map((event) => {
                    const style = getEventStyle(event.type);
                    const dayIndex = differenceInDays(startOfDay(event.date), startOfDay(periodStart));
                    const position = (dayIndex / daysToShow) * 100;
                    const clampedPosition = Math.max(1, Math.min(99, position));
                    const decodedTitle = decodeHtmlEntities(event.title);
                    
                    const eventsOnSameDay = sortedWeekEvents.filter(e => isSameDay(e.date, event.date));
                    const displayLine = getEventDisplayLine(event, eventsOnSameDay);
                    if (displayLine !== 1) return null; // Seulement la ligne 2 (index 1)

                    const shadowStyle = event.type !== 'exposition' && event.type !== 'veille-exposition' 
                      ? getSpecialtyShadow(event.specialty, event.title) : 'none';

                    // Pour les expos sur mobile, afficher juste "Expo" - sur desktop le titre complet
                    const isExpo = event.type === 'exposition' || event.type === 'veille-exposition';
                    const displayTitle = isExpo && isMobile ? 'Expo' : decodedTitle.replace(/^vente\s*/i, "");

                    const content = (
                      <div className={`${style.bg} ${style.text} ${style.border} rounded px-2 py-1 flex items-center gap-1`}
                        style={{ maxWidth: isMobile ? '100px' : '180px', boxShadow: shadowStyle }}>
                        <span className="text-xs md:text-sm font-medium truncate">{displayTitle}</span>
                      </div>
                    );

                    return (
                      <div key={event.id} className="absolute" style={{ left: `${clampedPosition}%`, top: '0' }}>
                        {event.link ? (
                          <Link to={event.link} className="hover:scale-105 transition-transform block">{content}</Link>
                        ) : (
                          <button 
                            onClick={() => handleEventClick(event)} 
                            className="hover:scale-105 transition-transform block cursor-pointer"
                          >
                            {content}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Ligne 3 des ventes (3ème vente de chaque jour) - z-index plus haut */}
                {sortedWeekEvents.some(event => {
                  const eventsOnSameDay = sortedWeekEvents.filter(e => isSameDay(e.date, event.date));
                  return eventsOnSameDay.some(e => getEventDisplayLine(e, eventsOnSameDay) >= 2);
                }) && (
                  <div className="relative min-h-[24px]" style={{ marginTop: '8px', zIndex: 1 }}>
                    {sortedWeekEvents.map((event) => {
                      const style = getEventStyle(event.type);
                      const dayIndex = differenceInDays(startOfDay(event.date), startOfDay(periodStart));
                      const position = (dayIndex / daysToShow) * 100;
                      const clampedPosition = Math.max(1, Math.min(99, position));
                      const decodedTitle = decodeHtmlEntities(event.title);
                      
                      const eventsOnSameDay = sortedWeekEvents.filter(e => isSameDay(e.date, event.date));
                      const displayLine = getEventDisplayLine(event, eventsOnSameDay);
                      if (displayLine !== 2) return null; // Seulement la ligne 3 (index 2)

                      const shadowStyle = event.type !== 'exposition' && event.type !== 'veille-exposition' 
                        ? getSpecialtyShadow(event.specialty, event.title) : 'none';

                      // Pour les expos sur mobile, afficher juste "Expo" - sur desktop le titre complet
                      const isExpo = event.type === 'exposition' || event.type === 'veille-exposition';
                      const displayTitle = isExpo && isMobile ? 'Expo' : decodedTitle.replace(/^vente\s*/i, "");

                      const content = (
                        <div className={`${style.bg} ${style.text} ${style.border} rounded px-2 py-1 flex items-center gap-1`}
                          style={{ maxWidth: isMobile ? '100px' : '180px', boxShadow: shadowStyle }}>
                          <span className="text-xs md:text-sm font-medium truncate">{displayTitle}</span>
                        </div>
                      );

                      return (
                        <div key={event.id} className="absolute" style={{ left: `${clampedPosition}%`, top: '0' }}>
                          {event.link ? (
                            <Link to={event.link} className="hover:scale-105 transition-transform block">{content}</Link>
                          ) : (
                            <button 
                              onClick={() => handleEventClick(event)} 
                              className="hover:scale-105 transition-transform block cursor-pointer"
                            >
                              {content}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Espace pour l'heure en bas */}
                <div style={{ height: '18px' }} />
                  
                {sortedWeekEvents.length === 0 && weekChronoEvents.length === 0 && (
                  <div className="flex items-center justify-center min-h-[24px]">
                    <span className="text-xs text-neutral-400 italic">Pas d'événement cette semaine</span>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
      </div>
      </div>

      {/* Espace sous le bloc de 20px */}
      <div className="h-[20px]" />

      {/* Dialog de détail d'événement */}
      <EventDetailDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        event={selectedEvent} 
      />
    </div>
  );
};

export default TimelineCalendar;
