import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Info } from "lucide-react";
import { DEFAULT_SALE_LOCATION } from "@/lib/site-config";

interface SaleStickyHeaderProps {
  saleTitle?: string;
  saleDate?: string;
  saleId: string;
  location?: string;
  lotId?: string;
}

const SaleStickyHeader = ({
  saleTitle,
  saleDate,
  saleId,
  location,
  lotId,
}: SaleStickyHeaderProps) => {
  const navigate = useNavigate();
  
  // On lot pages, always visible. On sale pages, show after scroll.
  const isLotPage = !!lotId;
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // On lot pages, no need to track scroll
    if (isLotPage) return;

    // On sale pages, show after scrolling 20px
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    // Check initial scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLotPage]);

  // Visible immediately on lot pages, or after scroll on sale pages
  const isVisible = isLotPage || isScrolled;

  const displayLocation = (location && location.trim())
    ? location.trim()
    : DEFAULT_SALE_LOCATION;

  return (
    <>
      {/* Desktop sticky header */}
      <div
        className={`hidden md:block fixed left-0 right-0 z-[105] border-b border-border/70 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 ${
          isLotPage
            ? "opacity-100"
            : `transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`
        }`}
        style={{
          top: 'calc(var(--header-sticky-top, var(--header-main-height, 145px)) - 20px)',
          backgroundColor: 'hsl(var(--background))',
        }}
      >
        {/* Container aligné avec le header principal */}
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Left: Retour - aligné sous "Estimation gratuite" */}
            <div className="flex flex-col gap-1 items-start" style={{ minWidth: '140px' }}>
              {lotId ? (
                <>
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] uppercase tracking-wider border border-border hover:border-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Retour</span>
                  </button>
                  <Link
                    to={`/vente/${saleId}`}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] uppercase tracking-wider border border-border hover:border-brand-gold hover:text-brand-gold transition-colors"
                  >
                    Retour au catalogue
                  </Link>
                </>
              ) : (
                <Link
                  to="/acheter/ventes-a-venir"
                  className="flex items-center gap-1 px-2 py-1 text-[11px] uppercase tracking-wider border border-border hover:border-foreground transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Les ventes</span>
                </Link>
              )}
            </div>

            {/* Center: Title + Date/Location */}
            <div className="flex-1 text-center px-4">
              <h2 className="font-serif text-sm md:text-base font-semibold mb-1">
                {saleTitle || "Vente"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {(saleDate || "")}{saleDate ? " — " : ""}{displayLocation}
              </p>
            </div>

            {/* Right: Infos + Conditions - aligné sous le calendrier */}
            <div className="flex flex-col gap-1 items-end" style={{ minWidth: '140px' }}>
              <a
                href="/documents/regles-encherir.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 text-[11px] uppercase tracking-wider border border-border hover:text-brand-gold transition-colors"
              >
                <Info className="w-3 h-3" />
                <span>Infos</span>
              </a>
              <a
                href="/documents/regles-payer.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 text-[11px] uppercase tracking-wider border border-border hover:text-brand-gold transition-colors"
              >
                <FileText className="w-3 h-3" />
                <span>CGV</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: simple back button only (visible on lot pages) */}
      {lotId && (
        <div
          className="md:hidden fixed left-0 right-0 z-[105] border-b border-border/50 bg-background/95 backdrop-blur"
          style={{
            top: 'calc(var(--header-sticky-top, var(--header-main-height, 145px)) - 20px)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
            <Link
              to={`/vente/${saleId}`}
              className="text-xs uppercase tracking-wider text-brand-gold"
            >
              Catalogue
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default SaleStickyHeader;