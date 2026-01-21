import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";

interface DemoRdvOverlayProps {
  rdvUrl?: string;  // URL Cal.com, Calendly, Amelia, etc.
  ctaText?: string; // Texte du bouton
}

const DemoRdvOverlay = ({
  rdvUrl = "https://app.cal.eu/votre-lien",
  ctaText = "Prenons rendez-vous pour une démo accompagnée",
}: DemoRdvOverlayProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // Bypass si ?demo=true dans l'URL
  const isDemoMode = new URLSearchParams(location.search).get("demo") === "true";

  useEffect(() => {
    if (isDemoMode) return;

    const handleScroll = () => {
      const isHomePage = location.pathname === "/";
      // Homepage : déclencher après 4800px (ajuster selon votre hero)
      // Autres pages : déclencher après 200px
      const triggerPoint = isHomePage ? 4800 : 200;
      
      if (window.scrollY > triggerPoint) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname, isDemoMode]);

  if (isDemoMode) return null;

  const handleCtaClick = () => {
    // Ouvre le RDV mais NE débloque PAS le site
    window.open(rdvUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Fond blur bloquant */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[199] backdrop-blur-md bg-black/40"
          />
          
          {/* Cartouche centrée */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            <div className="bg-black text-white p-8 shadow-2xl border-2 border-brand-gold max-w-md w-full">
              <div className="flex flex-col items-center text-center gap-6">
                <Calendar className="w-10 h-10 text-brand-gold" />
                <button
                  onClick={handleCtaClick}
                  className="w-full border-2 border-brand-gold bg-brand-gold text-black px-6 py-4 font-serif text-lg hover:bg-transparent hover:text-brand-gold transition-colors"
                >
                  {ctaText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DemoRdvOverlay;
