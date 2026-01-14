import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PlanningContextType {
  isOpen: boolean;
  openPlanning: () => void;
  closePlanning: () => void;
  togglePlanning: () => void;
  isStickyPage: boolean;
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

// Routes où le planning doit être ouvert par défaut
const PLANNING_OPEN_BY_DEFAULT_ROUTES = [
  "/acheter/ventes-a-venir",
  "/vendre/estimation-en-ligne",
  "/vendre/inventaire-domicile",
];

const shouldOpenByDefault = (pathname: string): boolean => {
  // Routes exactes uniquement - les pages spécialités n'ouvrent plus automatiquement
  if (PLANNING_OPEN_BY_DEFAULT_ROUTES.includes(pathname)) {
    return true;
  }
  return false;
};

export const PlanningProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => shouldOpenByDefault(location.pathname));
  const isStickyPage = shouldOpenByDefault(location.pathname);

  // Gérer l'état du planning au changement de page
  useEffect(() => {
    if (shouldOpenByDefault(location.pathname)) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [location.pathname]);

  const openPlanning = () => setIsOpen(true);
  const closePlanning = () => setIsOpen(false);
  const togglePlanning = () => setIsOpen((prev) => !prev);

  return (
    <PlanningContext.Provider value={{ isOpen, openPlanning, closePlanning, togglePlanning, isStickyPage }}>
      {children}
    </PlanningContext.Provider>
  );
};

export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error("usePlanning must be used within a PlanningProvider");
  }
  return context;
};
