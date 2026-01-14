import { useRef, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlanning } from "@/contexts/PlanningContext";
import TimelineCalendar from "./TimelineCalendar";
import { useTimelineEvents } from "@/hooks/use-timeline-events";

/**
 * Slot inline pour le planning - s'insère dans le flux de la page
 * Quand ouvert, pousse le contenu vers le bas au lieu de le recouvrir
 * Scroll automatique vers le planning à l'ouverture
 */
type InlinePlanningSlotProps = {
  /**
   * Décalage supplémentaire (en px) pour le scroll automatique à l'ouverture
   * afin d'éviter que la frise soit masquée par le header.
   */
  scrollOffsetPx?: number;
};

const InlinePlanningSlot = ({ scrollOffsetPx = 0 }: InlinePlanningSlotProps) => {
  const { isOpen, closePlanning, isStickyPage } = usePlanning();
  const { events: timelineEvents } = useTimelineEvents(true);
  const planningRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le planning quand il s'ouvre (avec offset pour le header)
  useEffect(() => {
    if (isOpen && planningRef.current) {
      // Délai pour laisser l'animation de hauteur se terminer
      const timeoutId = setTimeout(() => {
        if (!planningRef.current) return;
        
        // Utiliser --header-sticky-top si disponible (inclut les sous-menus et sticky bars)
        // Sinon fallback sur --header-height
        const root = document.documentElement;
        const stickyTop = getComputedStyle(root).getPropertyValue("--header-sticky-top");
        const headerHeight = getComputedStyle(root).getPropertyValue("--header-height");
        
        let offsetHeight = 145; // valeur par défaut
        if (stickyTop && stickyTop.trim()) {
          offsetHeight = parseInt(stickyTop, 10) || 145;
        } else if (headerHeight && headerHeight.trim()) {
          offsetHeight = parseInt(headerHeight, 10) || 145;
        }
        
        // Ajouter une marge supplémentaire pour les sticky bars de vente
        // + éventuel extra demandé par la page (ex: Home)
        const extraMargin = 20 + scrollOffsetPx;
        
        // Calculer la position de scroll avec un offset confortable
        const elementTop = planningRef.current.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementTop - offsetHeight - extraMargin;
        
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth",
        });
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, scrollOffsetPx]);

  // Calculer les classes pour le mode sticky
  const stickyClasses = isStickyPage && isOpen
    ? "sticky z-[45] bg-background"
    : "";
  
  const stickyStyle = isStickyPage && isOpen
    ? { top: "calc(var(--header-sticky-top, 163px) - 25px + var(--timeline-title-sticky-height, 40px) - 5px)" }
    : {};

  // Debug: log l'état
  console.log("InlinePlanningSlot - isOpen:", isOpen, "events count:", timelineEvents.length);

  return (
    <div ref={planningRef} className={stickyClasses} style={stickyStyle}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="planning-content"
            className="w-full overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Réserve au-dessus + en-dessous du planning pour ne pas coller le contenu */}
            <div className="pt-6 pb-6 mt-4 border-b border-neutral-200">
              <div className="relative bg-background">
                {/* Bouton fermer discret en haut à droite */}
                <button
                  onClick={closePlanning}
                  className="absolute top-0 right-4 z-10 p-1.5 rounded-full hover:bg-neutral-200 transition-colors bg-white shadow-sm"
                  aria-label="Fermer le planning"
                >
                  <X className="w-4 h-4 text-neutral-600" />
                </button>

                {/* La frise chronologique */}
                <div className="pt-2">
                  <TimelineCalendar events={timelineEvents} mode="acheter" variant="dates-first" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InlinePlanningSlot;
