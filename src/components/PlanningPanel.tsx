import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlanning } from "@/contexts/PlanningContext";
import TimelineCalendar from "./TimelineCalendar";
import { useTimelineEvents } from "@/hooks/use-timeline-events";

/**
 * Planning compact qui s'insère dans le flux de la page
 * Affiche la frise chronologique avec animation tiroir
 */
const PlanningPanel = () => {
  const { isOpen, closePlanning } = usePlanning();
  const { events: timelineEvents } = useTimelineEvents(true); // Always fetch to avoid delay

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed left-0 right-0 z-[60]"
          style={{
            top: "var(--header-height, 145px)",
          }}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Planning compact avec juste un petit bouton fermer */}
          <div className="relative bg-background shadow-md pt-[5px]">
            {/* Bouton fermer discret en haut à droite */}
            <button
              onClick={closePlanning}
              className="absolute top-2 right-4 z-10 p-1 rounded-full hover:bg-neutral-200 transition-colors"
              aria-label="Fermer le planning"
              style={{ backgroundColor: "rgba(255,255,255,0.8)" }}
            >
              <X className="w-4 h-4 text-neutral-600" />
            </button>

            {/* La frise chronologique elle-même */}
            <TimelineCalendar events={timelineEvents} mode="acheter" variant="dates-first" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlanningPanel;
