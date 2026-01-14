import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DEFAULT_SALE_LOCATION, COMPANY_INFO } from "@/lib/site-config";

// Nettoyer le titre en enlevant "vente" au début
const cleanTitle = (title: string): string => {
  return title.replace(/^vente\s*/i, "");
};

// Mapping spécialité → classe d'ombre
const getSpecialtyShadowClass = (specialty?: string): string => {
  if (!specialty) return "card-shadow";
  
  const normalizedSpecialty = specialty.toLowerCase();
  
  if (normalizedSpecialty.includes("bijoux") || normalizedSpecialty.includes("montre")) {
    return "card-shadow-gold";
  }
  if (normalizedSpecialty.includes("art moderne") || normalizedSpecialty.includes("contemporain") || normalizedSpecialty.includes("xxe") || normalizedSpecialty.includes("xxème")) {
    return "card-shadow-blue";
  }
  if (normalizedSpecialty.includes("véhicule") || normalizedSpecialty.includes("voiture") || normalizedSpecialty.includes("automobile")) {
    return "card-shadow-jaguar";
  }
  if (normalizedSpecialty.includes("vin") || normalizedSpecialty.includes("spiritueux")) {
    return "card-shadow-wine";
  }
  if (normalizedSpecialty.includes("mobilier") || normalizedSpecialty.includes("objet")) {
    return "card-shadow-emerald";
  }
  if (normalizedSpecialty.includes("collection")) {
    return "card-shadow-copper";
  }
  if (normalizedSpecialty.includes("militaria")) {
    return "card-shadow-kaki";
  }
  if (normalizedSpecialty.includes("argent")) {
    return "card-shadow-silver";
  }
  
  return "card-shadow";
};

interface SaleCardProps {
  title: string;
  date: string;
  time?: string;
  imageUrl: string;
  slug: string;
  specialty?: string;
  location?: string;
  inPreparation?: boolean;
}

const SaleCard = ({ title, date, time, imageUrl, slug, specialty, location, inPreparation }: SaleCardProps) => {
  const shadowClass = getSpecialtyShadowClass(specialty);
  const displayTitle = cleanTitle(title);
  const displayLocation = (location && location.trim()) 
    ? location.trim() 
    : COMPANY_INFO.address.city;
  
  return (
    <div className="flex flex-col items-center group">
      {/* Catalog cover */}
      <div className={`relative ${shadowClass} bg-card mb-6 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl`}>
        <div className="aspect-[3/4] w-48 md:w-56 bg-muted overflow-hidden">
          <img
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Sale info */}
      <h3 className="font-serif text-xs font-medium text-center tracking-wide mb-1">
        {displayTitle}
      </h3>
      <p className="font-sans text-xs text-muted-foreground mb-1">
        {date}{time ? ` à ${time}` : ""}
      </p>
      <p className="font-sans text-[11px] text-muted-foreground/70 mb-4">
        {displayLocation}
      </p>
      <Button variant="outline-brand" className="font-sans text-xs tracking-widest" asChild>
        <Link to={inPreparation ? "/vendre/estimation-en-ligne" : `/vente/${slug}`}>
          {inPreparation ? "PROPOSER UN LOT" : "VOIR LA VENTE"}
        </Link>
      </Button>
    </div>
  );
};

export default SaleCard;
