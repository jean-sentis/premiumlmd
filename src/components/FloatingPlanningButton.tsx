import { Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { usePlanning } from "@/contexts/PlanningContext";

/**
 * Bouton flottant simple - icône calendrier qui change de couleur
 * Doré quand ouvert, blanc quand fermé
 * Animation slide-in depuis la droite au montage
 * Masqué sur les pages /compte
 */
const FloatingPlanningButton = () => {
  const { isOpen, togglePlanning } = usePlanning();
  const location = useLocation();

  // Ne pas afficher sur les pages /compte
  if (location.pathname.startsWith('/compte')) {
    return null;
  }

  return (
    <motion.button
      onClick={togglePlanning}
      className="fixed right-0 top-1/2 -translate-y-1/2 mt-10 z-[110] p-3 rounded-l-md shadow-lg transition-colors duration-300 hover:opacity-90"
      style={{
        backgroundColor: isOpen ? "#c9a054" : "#001b46",
        boxShadow: isOpen 
          ? "-2px 2px 8px rgba(201, 160, 84, 0.4)" 
          : "-2px 2px 8px rgba(0, 0, 0, 0.3)",
      }}
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.5 }}
      aria-label={isOpen ? "Fermer le planning" : "Ouvrir le planning"}
    >
      <Calendar 
        className="w-6 h-6 transition-colors duration-300" 
        style={{ color: isOpen ? "#001b46" : "#ffffff" }}
      />
    </motion.button>
  );
};

export default FloatingPlanningButton;
