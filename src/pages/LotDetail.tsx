import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronRight, ZoomIn, Ruler, ArrowLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SaleStickyHeader from "@/components/SaleStickyHeader";
import InlinePlanningSlot from "@/components/InlinePlanningSlot";
import ImageViewer from "@/components/ImageViewer";
import { normalizeInterencheresImageUrl } from "@/lib/interencheres-images";
import { getDisplayUrl, getThumbnailUrl, getFullscreenUrl } from "@/lib/image-utils";
import { ChronoCountdown, ChronoBidButton, ChronoStickyBar } from "@/components/chrono";
import { LotActionsPanel, LotActionIcons, SaleInfoAccordion, MemorizeButton } from "@/components/lot";

// Helper to detect if a sale is a chrono/online sale
const isChronoSale = (saleType: string | null): boolean => {
  if (!saleType) return false;
  const lowerType = saleType.toLowerCase();
  return lowerType.includes('chrono') || lowerType.includes('online') || lowerType.includes('timed');
};

interface Lot {
  id: string;
  lot_number: number;
  title: string;
  description: string | null;
  estimate_low: number | null;
  estimate_high: number | null;
  adjudication_price: number | null;
  images: string[];
  dimensions: string | null;
  lot_url: string;
  sale_id: string | null;
  winner_user_id: string | null;
}

interface Sale {
  id: string;
  title: string;
  sale_date: string | null;
  sale_type: string | null;
  location: string | null;
  description: string | null;
  fees_info: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface Exposition {
  id: string;
  exposition_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
}

const LotDetail = () => {
  const { saleId, lotId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const fromAlertes = location.state?.from === 'alertes';
  const fromFavoris = location.state?.from === 'favoris';
  const [lot, setLot] = useState<Lot | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [expositions, setExpositions] = useState<Exposition[]>([]);
  const [adjacentLots, setAdjacentLots] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!lotId) return;

      const { data: lotData, error: lotError } = await supabase
        .from("interencheres_lots")
        .select("*")
        .eq("id", lotId)
        .single();

      if (lotError) {
        console.error("Error fetching lot:", lotError);
        setLoading(false);
        return;
      }

      const images = Array.isArray(lotData.images)
        ? (lotData.images as string[]).map(normalizeInterencheresImageUrl)
        : [];

      setLot({ ...lotData, images });
      setCurrentImageIndex(0);
      setImageError(false);

      const effectiveSaleId = lotData.sale_id || saleId || null;

      if (effectiveSaleId) {
        const [saleResult, exposResult] = await Promise.all([
          supabase
            .from("interencheres_sales")
            .select("id, title, sale_date, sale_type, location, description, fees_info, contact_name, contact_email, contact_phone")
            .eq("id", effectiveSaleId)
            .single(),
          supabase
            .from("interencheres_expositions")
            .select("id, exposition_date, start_time, end_time, location")
            .eq("sale_id", effectiveSaleId)
            .order("exposition_date", { ascending: true }),
        ]);

        if (saleResult.data) {
          setSale(saleResult.data);
        }
        if (exposResult.data) {
          setExpositions(exposResult.data);
        }

        // Fetch adjacent lots for navigation
        const { data: allLots } = await supabase
          .from("interencheres_lots")
          .select("id, lot_number")
          .eq("sale_id", effectiveSaleId)
          .order("lot_number", { ascending: true });

        if (allLots) {
          const currentIndex = allLots.findIndex((l) => l.id === lotId);
          setAdjacentLots({
            prev: currentIndex > 0 ? allLots[currentIndex - 1].id : null,
            next: currentIndex < allLots.length - 1 ? allLots[currentIndex + 1].id : null,
          });
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [lotId]);

  const formatEstimate = () => {
    if (!lot) return "Sur demande";
    if (lot.estimate_low && lot.estimate_high) {
      return `${lot.estimate_low.toLocaleString('fr-FR')} - ${lot.estimate_high.toLocaleString('fr-FR')} €`;
    }
    if (lot.estimate_low) {
      return `${lot.estimate_low.toLocaleString('fr-FR')} €`;
    }
    if (lot.estimate_high) {
      return `${lot.estimate_high.toLocaleString('fr-FR')} €`;
    }
    return "Sur demande";
  };

  const formatSaleDate = () => {
    if (!sale?.sale_date) return null;
    return format(new Date(sale.sale_date), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr });
  };

  const hasImages = lot?.images && lot.images.length > 0;

  const tryNextImageOrFail = () => {
    const url = lot?.images?.[currentImageIndex];
    if (url) {
      console.warn("[LotDetail] image failed", {
        lotId: lot.id,
        lotNumber: lot.lot_number,
        idx: currentImageIndex,
        url,
      });
    }

    if (!lot?.images?.length) {
      setImageError(true);
      return;
    }

    if (currentImageIndex < lot.images.length - 1) {
      setCurrentImageIndex((v) => v + 1);
      setImageError(false);
      return;
    }

    setImageError(true);
  };

  const nextImage = () => {
    if (lot?.images && lot.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % lot.images.length);
      setImageError(false);
    }
  };

  const prevImage = () => {
    if (lot?.images && lot.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + lot.images.length) % lot.images.length);
      setImageError(false);
    }
  };

  const rawDisplayImage = hasImages && !imageError ? lot!.images[currentImageIndex] : null;
  const displayImage = rawDisplayImage ? getDisplayUrl(rawDisplayImage) : null;
  const fullscreenImage = rawDisplayImage ? getFullscreenUrl(rawDisplayImage) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse text-muted-foreground">Chargement...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-muted-foreground">Lot introuvable</p>
          <button
            onClick={() => navigate(-1)}
            className="text-brand-gold hover:underline"
          >
            Retour
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Lot ${lot.lot_number} - ${lot.title} | Douze pages & associés`}</title>
        <meta name="description" content={lot.description?.substring(0, 160) || lot.title} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        {/* Sticky Header - different for chrono vs regular */}
        {sale && isChronoSale(sale.sale_type) && sale.sale_date ? (
          <ChronoStickyBar
            saleTitle={sale.title.replace(/^vente\s*/i, "")}
            endDate={new Date(sale.sale_date)}
            saleUrl={lot.lot_url}
            saleId={sale.id}
            formattedDate={format(new Date(sale.sale_date), "EEEE d MMMM", { locale: fr })}
            formattedTime={format(new Date(sale.sale_date), "HH:mm")}
            alwaysVisible
          />
        ) : saleId ? (
          <SaleStickyHeader
            saleTitle={sale?.title}
            saleDate={formatSaleDate() || undefined}
            saleId={sale?.id || saleId}
            location={sale?.location || undefined}
            lotId={lot.id}
          />
        ) : null}

        {/* Spacer under sticky header */}
        <div style={{ height: 'calc(var(--header-sticky-top, 145px) + 80px)' }}></div>

        {/* Planning slot - s'affiche quand le bouton flottant est cliqué */}
        <InlinePlanningSlot />

          <main className="max-w-6xl mx-auto px-4 py-8">
            {/* H1 contextuel */}
            {fromAlertes && (
              <section className="pb-6 -mt-4">
                <div className="flex justify-center -translate-y-[100px]">
                  <h1 className="text-lg md:text-xl font-serif tracking-wide text-center text-foreground uppercase border-b-2 border-[hsl(var(--brand-secondary))] pb-1 px-4">
                    Mes Alertes
                  </h1>
                </div>
                {/* Navigation alertes - juste sous le H1 */}
                <div className="flex items-center justify-center gap-6 -mt-2">
                  <button
                    onClick={() => navigate('/compte/alertes')}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour aux alertes
                  </button>
                  {sale && (
                    <Link
                      to={`/vente/${sale.id}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Voir la vente
                    </Link>
                  )}
                </div>
              </section>
            )}

            {fromFavoris && (
              <section className="pb-6 -mt-4">
                <div className="flex justify-center -translate-y-[100px]">
                  <h1 className="text-lg md:text-xl font-serif tracking-wide text-center text-foreground uppercase border-b-2 border-[hsl(var(--brand-secondary))] pb-1 px-4">
                    Ma sélection
                  </h1>
                </div>
                <div className="flex items-center justify-center gap-6 -mt-2">
                  <button
                    onClick={() => navigate('/compte/favoris')}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour à ma sélection
                  </button>
                  {sale && (
                    <Link
                      to={`/vente/${sale.id}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Voir la vente
                    </Link>
                  )}
                </div>
              </section>
            )}

          {/* Lot number with navigation and action icons */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Précédent/Suivant - seulement si on ne vient pas des alertes */}
            {!fromAlertes && (
              <button
                onClick={() => adjacentLots.prev && navigate(`/vente/${sale?.id || saleId}/lot/${adjacentLots.prev}`)}
                disabled={!adjacentLots.prev}
                className={`flex items-center justify-end gap-1 w-20 py-1 text-xs transition-colors ${
                  adjacentLots.prev 
                    ? 'text-muted-foreground hover:text-brand-gold' 
                    : 'text-muted/40 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-3 h-3" />
                Précédent
              </button>
            )}
            
            <div className="flex items-center gap-2">
              <span className="border border-brand-gold/60 text-brand-gold px-4 py-1.5 text-sm font-medium tracking-widest">
                LOT N°{lot.lot_number}
              </span>
              <LotActionIcons lotId={lot.id} />
            </div>
            
            {!fromAlertes && (
              <button
                onClick={() => adjacentLots.next && navigate(`/vente/${sale?.id || saleId}/lot/${adjacentLots.next}`)}
                disabled={!adjacentLots.next}
                className={`flex items-center justify-start gap-1 w-20 py-1 text-xs transition-colors ${
                  adjacentLots.next 
                    ? 'text-muted-foreground hover:text-brand-gold' 
                    : 'text-muted/40 cursor-not-allowed'
                }`}
              >
                Suivant
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Title under lot number */}
          <h2 className="font-serif text-xl font-semibold leading-snug text-center mb-10 max-w-3xl mx-auto">
            {lot.title}
          </h2>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Left Column: Image + Estimation */}
            <div className="space-y-4">
              {/* Main Image - responsive to image aspect ratio */}
              <div 
                className="relative bg-white rounded overflow-hidden cursor-zoom-in group border border-border/30 max-h-[500px] flex items-center justify-center"
                onClick={() => displayImage && setIsFullscreen(true)}
              >
                {displayImage ? (
                  <>
                    <img
                      src={displayImage}
                      alt={lot.title}
                      className="max-w-full max-h-[500px] w-auto h-auto block transition-transform duration-300 object-contain"
                      onError={tryNextImageOrFail}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </>
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-muted-foreground">
                    <span className="text-5xl font-serif opacity-20">N°{lot.lot_number}</span>
                  </div>
                )}

                {/* Navigation arrows */}
                {hasImages && lot.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-foreground p-1.5 rounded-full shadow transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-foreground p-1.5 rounded-full shadow transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 right-2 bg-foreground/60 text-background px-2 py-0.5 text-xs rounded">
                      {currentImageIndex + 1} / {lot.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {hasImages && lot.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {lot.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentImageIndex(idx);
                        setImageError(false);
                      }}
                      className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border transition-all ${
                        idx === currentImageIndex 
                          ? 'border-brand-gold ring-1 ring-brand-gold' 
                          : 'border-border/50 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={getThumbnailUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lot Details */}
            <div className="space-y-5">
              {/* Description - always show 3 lines minimum */}
              <div className="space-y-2">
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Description
                </h2>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line min-h-[3.75rem]">
                  {lot.description || "—"}
                </p>
              </div>

              {/* Dimensions - always visible */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border/30 rounded text-sm">
                <Ruler className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">{lot.dimensions || "—"}</span>
              </div>

              {/* Estimation (+ Adjugé pour les lots vendus) - sous les dimensions */}
              {lot.adjudication_price ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 border border-border/50 rounded px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                      Estimation
                    </p>
                    <p className="text-base font-serif text-foreground font-medium">
                      {formatEstimate()}
                    </p>
                  </div>
                  <div className="bg-brand-gold/10 border border-brand-gold/30 rounded px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-brand-gold mb-0.5">
                      Adjugé
                    </p>
                    <p className="text-base font-serif text-brand-gold font-semibold">
                      {lot.adjudication_price.toLocaleString('fr-FR')} €
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 border border-border/50 rounded px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                      Estimation
                    </p>
                    <p className="text-base font-serif text-foreground font-medium">
                      {formatEstimate()}
                    </p>
                  </div>
                  <a
                    href={lot.lot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand-gold/10 border border-brand-gold/50 rounded px-3 py-2 text-center hover:bg-brand-gold/20 transition-colors group flex flex-col justify-center"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-brand-gold mb-0.5">
                      S'inscrire à la vente
                    </p>
                    <p className="text-xs font-medium text-brand-gold group-hover:underline flex items-center justify-center gap-1">
                      sur Interenchères
                      <ExternalLink className="w-3 h-3" />
                    </p>
                  </a>
                </div>
              )}

              {/* Actions Panel */}
              <div className="pt-5 border-t border-border">
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
                  Vos actions
                </h2>
                <LotActionsPanel
                  lotId={lot.id}
                  lotNumber={lot.lot_number}
                  lotTitle={lot.title}
                  saleTitle={sale?.title}
                  currentDescription={lot.description}
                  currentDimensions={lot.dimensions}
                  isSold={!!lot.adjudication_price}
                  isWinner={!!user && lot.winner_user_id === user.id}
                  lotImageUrl={hasImages ? normalizeInterencheresImageUrl(lot.images[0]) : null}
                />
              </div>
            </div>
          </div>

        </main>

        {/* Navigation précédent/suivant - Mobile uniquement */}
        {!fromAlertes && !fromFavoris && (
          <div className="md:hidden sticky bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 flex items-center justify-between z-40">
            <button
              onClick={() => adjacentLots.prev && navigate(`/vente/${sale?.id || saleId}/lot/${adjacentLots.prev}`)}
              disabled={!adjacentLots.prev}
              className={`flex items-center gap-2 py-2 px-3 rounded transition-colors ${
                adjacentLots.prev 
                  ? 'text-foreground hover:bg-muted' 
                  : 'text-muted/40 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Précédent</span>
            </button>
            
            <span className="text-sm font-medium text-muted-foreground">
              Lot {lot.lot_number}
            </span>
            
            <button
              onClick={() => adjacentLots.next && navigate(`/vente/${sale?.id || saleId}/lot/${adjacentLots.next}`)}
              disabled={!adjacentLots.next}
              className={`flex items-center gap-2 py-2 px-3 rounded transition-colors ${
                adjacentLots.next 
                  ? 'text-foreground hover:bg-muted' 
                  : 'text-muted/40 cursor-not-allowed'
              }`}
            >
              <span className="text-sm">Suivant</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Spacer before footer */}
        <div className="h-12"></div>

        <Footer />
      </div>

      {/* Fullscreen Image Viewer */}
      {isFullscreen && hasImages && lot && (
        <ImageViewer
          images={lot.images}
          currentIndex={currentImageIndex}
          onClose={() => setIsFullscreen(false)}
          onNavigate={(idx) => setCurrentImageIndex(idx)}
          alt={lot.title}
        />
      )}
    </>
  );
};

export default LotDetail;