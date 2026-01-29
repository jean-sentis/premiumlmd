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

const computeDemoModeSync = (search: string) => {
  // Vérifier l'URL actuelle (React Router)
  const urlHasDemo = new URLSearchParams(search).get("demo") === "true";

  // Vérifier aussi window.location au cas où (navigation directe)
  const windowHasDemo = new URLSearchParams(window.location.search).get("demo") === "true";

  // Vérifier l'URL parente (iframe)
  let parentHasDemo = false;
  try {
    if (window.parent !== window) {
      parentHasDemo = new URLSearchParams(window.parent.location.search).get("demo") === "true";
    }
  } catch {
    // ignore cross-origin
  }

  if (urlHasDemo || windowHasDemo || parentHasDemo) {
    try {
      (window as any)[DEMO_GLOBAL_KEY] = true;
    } catch {
      // ignore
    }
    try {
      sessionStorage.setItem(DEMO_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    return true;
  }

  try {
    if ((window as any)[DEMO_GLOBAL_KEY] === true) return true;
  } catch {
    // ignore
  }
  try {
    return sessionStorage.getItem(DEMO_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const DemoRdvOverlay = ({
  rdvUrl = "https://app.cal.eu/votre-lien",
  ctaText = "Prenons rendez-vous pour une démo accompagnée",
}: DemoRdvOverlayProps) => {
  // DÉSACTIVÉ: plus de blocage pour la démo
  // Important: on force aussi la remise du scroll, car si l'overlay a déjà bloqué
  // la page (overflow hidden), l'early-return empêcherait les effets de cleanup.
  const DISABLE_OVERLAY = true;

  useEffect(() => {
    if (DISABLE_OVERLAY) {
      document.body.style.overflow = "";
    }
  }, []);

  if (DISABLE_OVERLAY) return null;

  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [initialPath] = useState(location.pathname);
  const [isDemoMode, setIsDemoMode] = useState(() => computeDemoModeSync(location.search));

  // Vérifier le mode démo au montage ET à chaque changement de location
  useEffect(() => {
    setIsDemoMode(computeDemoModeSync(location.search));
  }, [location.search]);

  // Si le mode démo s'active, on s'assure que l'overlay n'est jamais visible
  useEffect(() => {
    if (isDemoMode) setIsVisible(false);
  }, [isDemoMode]);

  // Déclencher l'overlay si navigation vers une autre page
  useEffect(() => {
    if (isDemoMode || isVisible) return;
    
    if (location.pathname !== initialPath) {
      setIsVisible(true);
    }
  }, [location.pathname, initialPath, isDemoMode, isVisible]);

  // Détecter le scroll pour déclencher l'overlay (2500px)
  useEffect(() => {
    if (isDemoMode || isVisible) return;

    // Important: certaines pages restaurent une position scroll élevée à l'arrivée.
    // On déclenche donc sur une *distance scrollée* depuis l'entrée sur la page,
    // pas sur un scrollY absolu.
    const startY = window.scrollY;
    const DELTA_TRIGGER_PX = 1200;

    const handleScroll = () => {
      if (window.scrollY - startY > DELTA_TRIGGER_PX) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDemoMode, isVisible]);

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
