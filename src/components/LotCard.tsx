import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LotActionIcons from "./lot/LotActionIcons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LotCardProps {
  id: string;
  saleId: string;
  lotNumber: number;
  title: string;
  description?: string;
  estimateLow?: number | null;
  estimateHigh?: number | null;
  images: string[];
  dimensions?: string | null;
  lotUrl: string;
  shadowClass?: string;
}

// Proxy les images interenchères pour éviter le blocage CORS/hotlink
const getProxiedImageUrl = (url: string): string => {
  if (!url) return url;
  
  if (url.includes('supabase.co')) {
    return url;
  }
  
  if (url.includes('interencheres.com')) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
  }
  
  return url;
};

interface LiaSuggestion {
  id: string;
  is_validated: boolean | null;
}

const LotCard = ({
  id,
  saleId,
  lotNumber,
  title,
  estimateLow,
  estimateHigh,
  images,
}: LotCardProps) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [liaSuggestion, setLiaSuggestion] = useState<LiaSuggestion | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Fetch Lia suggestion for this lot
  useEffect(() => {
    if (!user) return;
    
    const fetchSuggestion = async () => {
      const { data } = await supabase
        .from('lia_suggestions')
        .select('id, is_validated')
        .eq('user_id', user.id)
        .eq('lot_id', id)
        .maybeSingle();
      
      if (data) {
        setLiaSuggestion(data);
      }
    };
    
    fetchSuggestion();
  }, [user, id]);

  const hasImages = images && images.length > 0;
  const rawImage = hasImages && !imageError ? images[currentIndex] : null;
  const displayImage = rawImage ? getProxiedImageUrl(rawImage) : null;

  // Cadre vert visible si suggestion non validée négativement
  const showGreenFrame = liaSuggestion && liaSuggestion.is_validated !== false;

  const formatEstimate = () => {
    if (estimateLow && estimateHigh) {
      return `${estimateLow.toLocaleString("fr-FR")} – ${estimateHigh.toLocaleString("fr-FR")} €`;
    }
    if (estimateLow) {
      return `${estimateLow.toLocaleString("fr-FR")} €`;
    }
    if (estimateHigh) {
      return `${estimateHigh.toLocaleString("fr-FR")} €`;
    }
    return null;
  };

  const handleImgError = () => {
    if (!hasImages) {
      setImageError(true);
      return;
    }
    if (currentIndex < images.length - 1) {
      setCurrentIndex((v) => v + 1);
      setImageError(false);
      return;
    }
    setImageError(true);
  };

  const handleValidation = async (e: React.MouseEvent, isPositive: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!liaSuggestion) return;
    
    const { error } = await supabase
      .from('lia_suggestions')
      .update({ 
        is_validated: isPositive,
        validated_at: new Date().toISOString()
      })
      .eq('id', liaSuggestion.id);
    
    if (!error) {
      if (isPositive) {
        setLiaSuggestion({ ...liaSuggestion, is_validated: true });
      } else {
        // Si validation négative, le cadre disparaît
        setLiaSuggestion(null);
      }
      setShowValidation(false);
    }
  };

  const estimate = formatEstimate();

  return (
    <Link
      to={`/vente/${saleId}/lot/${id}`}
      className="group block relative"
      onMouseEnter={() => showGreenFrame && setShowValidation(true)}
      onMouseLeave={() => setShowValidation(false)}
    >
      {/* Cadre style galerie avec ombre portée élégante */}
      <div className={cn(
        "relative bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300",
        showGreenFrame && "ring-2 ring-emerald-500 ring-offset-1"
      )}>
        {/* Bordure dorée fine au survol (masquée si cadre vert) */}
        {!showGreenFrame && (
          <div className="absolute inset-0 border border-transparent group-hover:border-brand-gold/40 transition-colors duration-300 pointer-events-none" />
        )}
        
        {/* Badge Lia */}
        {showGreenFrame && (
          <div className="absolute -top-2 -left-2 z-10 bg-emerald-500 text-white text-[9px] font-medium px-2 py-0.5 rounded-full shadow-sm">
            Lia
          </div>
        )}
        
        {/* Boutons de validation au survol */}
        {showGreenFrame && showValidation && (
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <button
              onClick={(e) => handleValidation(e, true)}
              className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm"
              title="Lia a raison, ce lot m'intéresse"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => handleValidation(e, false)}
              className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
              title="Ce lot ne m'intéresse pas"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        
        {/* Image avec padding interne style cadre */}
        <div className="p-3">
          <div className="relative aspect-square overflow-hidden bg-[#fafafa]">
            {displayImage ? (
              <img
                src={displayImage}
                alt={title}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                onError={handleImgError}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-serif text-2xl text-muted-foreground/20 italic">
                  Lot {lotNumber}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bande inférieure avec infos */}
        <div className="px-3 pb-3 pt-1">
          {/* Ligne numéro + icônes actions + estimation */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[10px] font-medium tracking-[0.15em] uppercase",
                showGreenFrame ? "text-emerald-600" : "text-brand-gold"
              )}>
                Lot {lotNumber}
              </span>
              <LotActionIcons lotId={id} />
            </div>
            {estimate && (
              <span className="text-[10px] text-muted-foreground tracking-wide">
                Est. {estimate}
              </span>
            )}
          </div>
          
          {/* Titre */}
          <h3 className="font-serif text-[13px] leading-tight text-foreground line-clamp-2 group-hover:text-brand-primary transition-colors">
            {title}
          </h3>
        </div>
      </div>

      {/* Indicateur multi-images discret */}
      {hasImages && images.length > 1 && (
        <div className="absolute top-4 right-4 flex gap-0.5">
          {Array.from({ length: Math.min(images.length, 4) }).map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-foreground/30"
            />
          ))}
          {images.length > 4 && (
            <span className="text-[8px] text-foreground/40 ml-0.5">+</span>
          )}
        </div>
      )}
    </Link>
  );
};

export default LotCard;
