import { createContext, useContext, useState, ReactNode } from "react";

interface SubmenuContextType {
  isSubmenuVisible: boolean;
  setSubmenuVisible: (visible: boolean) => void;
}

const SubmenuContext = createContext<SubmenuContextType | undefined>(undefined);

export const SubmenuProvider = ({ children }: { children: ReactNode }) => {
  const [isSubmenuVisible, setSubmenuVisible] = useState(false);

  return (
    <SubmenuContext.Provider value={{ isSubmenuVisible, setSubmenuVisible }}>
      {children}
    </SubmenuContext.Provider>
  );
};

export const useSubmenu = () => {
  const context = useContext(SubmenuContext);
  if (!context) {
    throw new Error("useSubmenu must be used within a SubmenuProvider");
  }
  return context;
};
