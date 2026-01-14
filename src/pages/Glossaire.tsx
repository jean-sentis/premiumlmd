import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Glossaire = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirige vers le Guide de l'acheteur section glossaire
    navigate("/acheter/guide#glossaire", { replace: true });
  }, [navigate]);

  return null;
};

export default Glossaire;
