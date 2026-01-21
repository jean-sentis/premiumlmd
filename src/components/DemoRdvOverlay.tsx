import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";

interface DemoRdvOverlayProps {
  rdvUrl?: string;
  ctaText?: string;
}

const DEMO_STORAGE_KEY = "lmd_demo_mode";
const DEMO_GLOBAL_KEY = "__LMD_DEMO_MODE__";

const DemoRdvOverlay = ({
  rdvUrl = "https://app.cal.eu/votre-lien",
  ctaText = "Prenons rendez-vous pour une démo accompagnée",
}: DemoRdvOverlayProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // Bypass "mode démo": persiste même si le paramètre disparaît lors d'une navigation SPA
  const isDemoMode = (() => {
    const urlHasDemo = new URLSearchParams(location.search).get("demo") === "true";

    if (urlHasDemo) {
      try { (window as any)[DEMO_GLOBAL_KEY] = true; } catch (e) {}
      try { sessionStorage.setItem(DEMO_STORAGE_KEY, "true"); } catch (e) {}
      return true;
    }

    try { if ((window as any)[DEMO_GLOBAL_KEY] === true) return true; } catch (e) {}
    try { return sessionStorage.getItem(DEMO_STORAGE_KEY) === "true"; } catch (e) { return false; }
  })();

  // Détecter le scroll pour déclencher l'overlay
  useEffect(() => {
    if (isDemoMode || isVisible) return;

    const handleScroll = () => {
      const isHomePage = location.pathname === "/";
      const triggerPoint = isHomePage ? 4800 : 200;
      
      if (window.scrollY > triggerPoint) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname, isDemoMode, isVisible]);

  // Bloquer le scroll quand l'overlay est visible
  useEffect(() => {
    if (isVisible && !isDemoMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible, isDemoMode]);

  // Ne pas rendre en mode démo
  if (isDemoMode) return null;

  const handleCtaClick = () => {
    window.open(rdvUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Fond blur plein écran */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[199] backdrop-blur-md bg-black/40"
          />
          
          {/* Cartouche centrée */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            <div className="bg-black text-white p-8 shadow-2xl border-2 border-brand-gold max-w-md w-full">
              <div className="flex flex-col items-center text-center gap-6">
                <Calendar className="w-10 h-10 text-brand-gold" />
                
                <button
                  onClick={handleCtaClick}
                  className="w-full border-2 border-brand-gold bg-brand-gold text-black px-6 py-4 font-serif text-lg tracking-wide hover:bg-transparent hover:text-brand-gold transition-colors font-medium"
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
