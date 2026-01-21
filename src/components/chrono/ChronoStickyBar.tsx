import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ChronoCountdown from "./ChronoCountdown";

interface ChronoStickyBarProps {
  saleTitle: string;
  endDate: Date;
  saleUrl: string;
  saleId: string;
  formattedDate: string;
  formattedTime?: string;
  /** Force the bar to be visible immediately (e.g. on lot pages). */
  alwaysVisible?: boolean;
  /** Is the sale still in preparation (less than 4 lots AND more than 2 weeks away)? */
  isInPreparation?: boolean;
  /** Optional start date for sales in preparation */
  startDate?: Date;
}

const ChronoStickyBar = ({
  saleTitle,
  endDate,
  saleUrl,
  saleId,
  formattedDate,
  formattedTime,
  alwaysVisible = false,
  isInPreparation = false,
  startDate,
}: ChronoStickyBarProps) => {
  const [isVisible, setIsVisible] = useState(alwaysVisible);

  useEffect(() => {
    if (alwaysVisible) return;

    const handleScroll = () => {
      // Show after scrolling just 20px (right below the header reserve)
      setIsVisible(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state
    return () => window.removeEventListener("scroll", handleScroll);
  }, [alwaysVisible]);

  if (!isVisible) return null;

  // Format start date if provided
  const formattedStartDate = startDate 
    ? format(startDate, "d MMMM", { locale: fr })
    : null;

  return (
    <div 
      className={`fixed left-0 right-0 z-[105] border-b border-brand-gold/20 shadow-md transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        top: 'calc(var(--header-sticky-top, var(--header-main-height, 145px)) - 18px)',
        backgroundColor: 'hsl(var(--background))',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto py-2">
          {/* Row: left = chrono info + mode emploi, center = title, right = action + countdown */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Vente chrono + mode d'emploi */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-xs">
                <div className="font-medium text-foreground">
                  {isInPreparation ? "Vente chrono en préparation" : "Vente chrono"}
                </div>
                <Link 
                  to={`/vente/${saleId}#guide`}
                  className="text-muted-foreground hover:text-brand-gold transition-colors"
                >
                  mode d'emploi
                </Link>
              </div>
              <div className="text-xs text-right">
                {isInPreparation ? (
                  <>
                    {formattedStartDate && (
                      <div className="text-muted-foreground">
                        Début le <span className="text-brand-gold font-medium">{formattedStartDate}</span>
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      Fin le <span className="text-brand-gold font-medium">{formattedDate}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-muted-foreground">
                      Fin le <span className="text-brand-gold font-medium">{formattedDate}</span>
                    </div>
                    {formattedTime && (
                      <div className="text-brand-gold font-medium">à {formattedTime}</div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Center: Title */}
            <h1 className="font-serif text-base md:text-lg font-semibold tracking-wide uppercase text-center flex-1 px-4">
              {saleTitle}
            </h1>

            {/* Right: Action button + Countdown or dates */}
            <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
              <Link
                to={`/vente/${saleId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-brand-gold/10 border border-brand-gold/30 rounded-lg hover:bg-brand-gold/20 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-brand-gold" />
                <span className="text-xs font-medium text-brand-gold leading-tight">
                  <span className="hidden md:inline">Retour au catalogue</span>
                  <span className="md:hidden">Catalogue</span>
                </span>
              </Link>

              {isInPreparation ? (
                <div className="flex flex-col items-center text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground">
                    Catalogue en cours
                  </span>
                  <span className="text-sm font-medium text-brand-gold">
                    de constitution
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <span className="text-[10px] md:text-xs text-muted-foreground">
                    Temps restant
                  </span>
                  <span className="text-sm font-medium text-brand-gold">
                    <ChronoCountdown endDate={endDate} variant="inline" />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChronoStickyBar;
