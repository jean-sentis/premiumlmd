import { useParams, Link } from "react-router-dom";
import { useState, useEffect, type CSSProperties } from "react";
import { format, parseISO, isFuture, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Send, Calendar, MapPin, Clock, Info } from "lucide-react";
import Header from "@/components/Header";
// City images for itinerant expertises
import imgBonifacio from "@/assets/villes/bonifacio.png";
import imgLevie from "@/assets/villes/levie.png";
import imgPortoVecchio from "@/assets/villes/porto-vecchio.png";
import imgPropriano from "@/assets/villes/propriano.png";
import imgSartene from "@/assets/villes/sartene.png";
import imgHDV from "@/assets/hotel-des-ventes-ajaccio.png";
import Footer from "@/components/Footer";
import LotsGrid from "@/components/LotsGrid";
import SaleStickyHeader from "@/components/SaleStickyHeader";
import InlinePlanningSlot from "@/components/InlinePlanningSlot";
import { getSpecialtyShadowClass } from "@/lib/design-rules";
import { ChronoCountdown, ChronoGuide, ChronoBidButton, ChronoStickyBar } from "@/components/chrono";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";

// Helper to detect if a sale is a chrono/online sale
const isChronoSale = (saleType: string | null): boolean => {
  if (!saleType) return false;
  const lowerType = saleType.toLowerCase();
  return lowerType.includes('chrono') || lowerType.includes('online') || lowerType.includes('timed');
};

// Helper to get city image based on location
const getCityImage = (location: string | null): string | null => {
  if (!location) return imgHDV;
  const loc = location.toLowerCase();
  if (loc.includes('bonifacio')) return imgBonifacio;
  if (loc.includes('levie') || loc.includes('lévie')) return imgLevie;
  if (loc.includes('porto-vecchio') || loc.includes('porto vecchio')) return imgPortoVecchio;
  if (loc.includes('propriano')) return imgPropriano;
  if (loc.includes('sartene') || loc.includes('sartène')) return imgSartene;
  if (loc.includes('ajaccio') || loc.includes('hôtel des ventes')) return imgHDV;
  return null;
};

// Helper to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

interface Sale {
  id: string;
  title: string;
  updated_at?: string;
  sale_date: string | null;
  sale_type: string | null;
  location: string | null;
  sale_url: string;
  catalog_url: string | null;
  lot_count: number | null;
  specialty: string | null;
  cover_image_url: string | null;
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
  notes: string | null;
}

interface UpcomingExpertise {
  id: string;
  title: string;
  start_date: string;
  start_time: string | null;
  location: string | null;
  specialty: string | null;
}

const VenteDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [expositions, setExpositions] = useState<Exposition[]>([]);
  const [lotsCount, setLotsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [upcomingExpertises, setUpcomingExpertises] = useState<UpcomingExpertise[]>([]);

  // If the cover URL changes (or we refetch the sale), allow the image to try again.
  useEffect(() => {
    setImageError(false);
  }, [sale?.cover_image_url]);

  useEffect(() => {
    const fetchSale = async () => {
      if (!slug) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('interencheres_sales')
          .select('*')
          .eq('id', slug)
          .maybeSingle();

        if (error) {
          console.error('Error fetching sale:', error);
          setNotFound(true);
        } else if (data) {
          setSale(data);
          console.log('[VenteDetail] cover_image_url:', data.cover_image_url);

          const { data: expos } = await supabase
            .from('interencheres_expositions')
            .select('*')
            .eq('sale_id', data.id)
            .order('exposition_date', { ascending: true });

          if (expos) {
            setExpositions(expos);
          }
          
          // Check if we have scraped lots for this sale
          const { count } = await supabase
            .from('interencheres_lots')
            .select('*', { count: 'exact', head: true })
            .eq('sale_id', data.id);
          
          console.log('[VenteDetail] Lots count for sale:', data.id, count);
          setLotsCount(count || 0);
          
          // Fetch upcoming expertises before the sale date (from DB)
          if (data.sale_date) {
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data: dbExpertises } = await supabase
              .from('svv_events')
              .select('id, title, start_date, start_time, location, specialty')
              .in('event_type', ['expertise', 'expertise_slot', 'special_expertise'])
              .eq('is_active', true)
              .gte('start_date', today)
              .lte('start_date', data.sale_date.split('T')[0])
              .order('start_date', { ascending: true })
              .limit(6);
            
            if (dbExpertises && dbExpertises.length > 0) {
              setUpcomingExpertises(dbExpertises);
            }
          }
          
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Error:', err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSale();
  }, [slug]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <span className="ml-3 text-muted-foreground">Chargement de la vente...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !sale) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-40 text-center">
          <h1 className="font-serif text-3xl mb-4">Vente non trouvée</h1>
          <p className="text-muted-foreground mb-8">Cette vente n'existe pas ou a été retirée du catalogue.</p>
          <Link to="/calendrier" className="text-brand-primary underline hover:text-brand-gold transition-colors">
            Retour au calendrier des ventes
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Decode HTML entities in title and remove "vente" prefix
  const decodedTitle = decodeHtmlEntities(sale.title).replace(/^vente\s*/i, "");

  // Format date
  const saleDate = sale.sale_date ? parseISO(sale.sale_date) : null;
  const formattedDate = saleDate ? format(saleDate, "EEEE d MMMM yyyy", { locale: fr }) : "Date à confirmer";
  const formattedTime = saleDate ? format(saleDate, "HH:mm") : "";

  // Fallback image - elegant auction/art themed
  const fallbackImage = "/images/uniforme-hussard-militaria.jpg";
  
  // Get cover image - use stored image or fallback (with cache buster)
  const getCoverImage = () => {
    if (imageError || !sale.cover_image_url) return fallbackImage;
    // Cache buster based on the sale's updated_at when available
    const v = sale.updated_at ? new Date(sale.updated_at).getTime() : Date.now();
    const cacheBuster = `?v=${v}`;
    return `${sale.cover_image_url}${cacheBuster}`;
  };

  // Check if this is a chrono sale
  const isChrono = isChronoSale(sale.sale_type);

  // No more pageStyle override needed - header-height is now the single source of truth

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      
      {/* Spacer under fixed header - aligns to the sticky anchor under "Estimation gratuite" */}
      <div style={{ height: 'var(--header-sticky-top, var(--header-main-height, 145px))' }} />
      
      {/* Chrono sales: sticky bar as main header */}
      {isChrono && saleDate && (
        <ChronoStickyBar
          saleTitle={`${decodedTitle}${sale.lot_count ? ` — ${sale.lot_count} lots` : ''}`}
          endDate={saleDate}
          saleUrl={sale.sale_url}
          saleId={sale.id}
          formattedDate={formattedDate}
          formattedTime={formattedTime}
        />
      )}

      {/* Regular sales: sticky header on scroll */}
      {!isChrono && (
        <SaleStickyHeader
          saleTitle={decodedTitle}
          saleDate={`${formattedDate} à ${formattedTime}`}
          saleId={sale.id}
          location={sale.location || undefined}
        />
      )}

      {/* Regular sale header - only for non-chrono */}
      {!isChrono && (
        <section className="pt-4 md:pt-6 pb-6 md:pb-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              {/* Mobile: compact header */}
              <div className="md:hidden mb-4">
                <h1 className="font-serif text-lg font-semibold tracking-wide uppercase mb-1">
                  {decodedTitle}
                </h1>
                <p className="text-sm">
                  <span className="text-brand-gold font-medium capitalize">{formattedDate}</span>
                  {formattedTime && <span className="text-brand-gold font-semibold"> à {formattedTime}</span>}
                  {sale.lot_count && <span className="text-muted-foreground"> — {sale.lot_count} lots</span>}
                </p>
                {sale.location && (
                  <p className="text-xs text-muted-foreground mt-0.5">{sale.location}</p>
                )}
              </div>
              
              {/* Desktop: original header */}
              <div className="hidden md:block">
                <h1 className="font-serif text-xl md:text-2xl font-semibold tracking-wide uppercase mb-2">
                  {decodedTitle}{sale.lot_count ? ` — ${sale.lot_count} lots` : ''}
                </h1>
                <div className="space-y-1 mb-6">
                  <p className="text-base capitalize">
                    <span className="text-brand-gold font-medium">{formattedDate}</span>
                    {formattedTime && <span className="text-brand-gold font-semibold"> à {formattedTime}</span>}
                  </p>
                  {sale.location && (
                    <p className="text-sm text-muted-foreground">{sale.location}</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                {/* Catalog Cover */}
                <div className="w-full max-w-[200px] mx-auto md:max-w-none lg:w-[320px] flex-shrink-0">
                  <div className={`bg-card ${getSpecialtyShadowClass(sale.specialty)}`}>
                    <div className="aspect-[3/4] overflow-hidden bg-muted">
                      <img 
                        src={getCoverImage()} 
                        alt={decodedTitle}
                        className="w-full h-full object-cover"
                        onError={() => {
                          console.error('[VenteDetail] Cover image failed to load:', getCoverImage());
                          setImageError(true);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right side: Info + Accordion */}
                <div className="flex-1 flex flex-col">
                  <div className="flex flex-wrap gap-3 mb-4 md:mb-6">
                    <a
                      href={`mailto:jean@lemarteaudigital.fr?subject=${encodeURIComponent(`Demande d'informations - ${decodedTitle}`)}`}
                      className="border border-border px-4 md:px-5 py-2 md:py-2.5 text-xs tracking-widest hover:border-foreground transition-colors whitespace-nowrap text-center"
                    >
                      DEMANDE D'INFO
                    </a>

                    {lotsCount > 0 && (
                      <a
                        href="#catalogue"
                        className="border border-border px-4 md:px-5 py-2 md:py-2.5 text-xs tracking-widest hover:border-foreground transition-colors whitespace-nowrap text-center"
                      >
                        VOIR LE CATALOGUE — {lotsCount} LOTS
                      </a>
                    )}
                  </div>

                  <Accordion type="single" collapsible className="border-t border-border">
                    <AccordionItem value="catalogues" className="border-b border-border">
                      <AccordionTrigger className="hover:no-underline py-2.5 text-sm">Catalogues</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-3 text-sm">
                        Le catalogue complet est disponible sur Interenchères.
                        <a href={sale.catalog_url || sale.sale_url} target="_blank" rel="noopener noreferrer" className="block mt-1 text-brand-primary underline hover:text-brand-gold">
                          Voir le catalogue sur Interenchères →
                        </a>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="expositions" className="border-b border-border">
                      <AccordionTrigger className="hover:no-underline py-2.5 text-sm">Expositions</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-3 text-sm">
                        {expositions.length > 0 ? (
                          <ul className="space-y-1">
                            {expositions.map(expo => (
                              <li key={expo.id}>
                                <span className="capitalize">{format(parseISO(expo.exposition_date), "EEEE d MMMM yyyy", { locale: fr })}</span>
                                {expo.start_time && expo.end_time && <span> de {expo.start_time.slice(0, 5)} à {expo.end_time.slice(0, 5)}</span>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>Exposition la veille de 14h à 18h et le matin de 9h à 12h.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="frais" className="border-b border-border">
                      <AccordionTrigger className="hover:no-underline py-2.5 text-sm">Frais</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-3 text-sm">
                        {sale.fees_info || "25% TTC en salle, 28% TTC en live."}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="delivrance" className="border-b border-border">
                      <AccordionTrigger className="hover:no-underline py-2.5 text-sm">Délivrance</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-3 text-sm">
                        Retrait dès le lendemain sur présentation du justificatif de paiement. Délai : 14 jours.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="expedition" className="border-b border-border">
                      <AccordionTrigger className="hover:no-underline py-2.5 text-sm">Expédition</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-3 text-sm">
                        Mise en relation avec transporteurs spécialisés. Service interne pour petits objets.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Chrono sale content section */}
      {isChrono && (
        <section className="pt-6 pb-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Catalog Cover */}
                <div className="lg:w-[320px] flex-shrink-0">
                  <div className={`bg-card ${getSpecialtyShadowClass(sale.specialty)}`}>
                    <div className="aspect-[3/4] overflow-hidden bg-muted">
                      <img 
                        src={getCoverImage()} 
                        alt={decodedTitle}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    </div>
                  </div>
                </div>

                {/* Right side: Info + Accordion */}
                <div className="flex-1 flex flex-col pt-2.5">
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <ChronoBidButton lotUrl={sale.sale_url} className="sm:flex-1" />
                  </div>

                  <Accordion type="single" collapsible defaultValue="descriptif" className="border-t border-border">
                    <AccordionItem value="guide" id="guide" className="border-b border-border scroll-mt-48">
                      <AccordionTrigger className="hover:no-underline py-2.5 text-sm">Comment fonctionne une vente chrono ?</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-3 text-sm leading-relaxed">
                        <ChronoGuide />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="descriptif" className="border-b border-border">
                      <AccordionTrigger className="hover:no-underline py-2.5 text-sm">Descriptif de la vente</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-3 text-sm leading-relaxed">
                        <p className="mb-3">
                          Vente courante (exclusivement en ligne) de fin d'année : Art d'Asie, Céramique, Dessins, Horlogerie, Livres, Mobilier courant, Objets de vitrine, Sculptures, Verrerie, Tableaux et divers.
                        </p>
                        <p>
                          Merci de prendre en compte les descriptions et les photographies des lots avant toute acquisition. La vente ONLINE est dématérialisée : aucune exposition n'est prévue, et le public ne peut donc pas assister à la vente.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="frais" className="border-b border-border">
                      <AccordionTrigger className="hover:no-underline py-2.5 text-sm">Frais</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-3 text-sm">
                        {sale.fees_info || "28% TTC sur Interenchères."}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="delivrance" className="border-b border-border">
                      <AccordionTrigger className="hover:no-underline py-2.5 text-sm">Délivrance</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-3 text-sm">
                        Retrait dès le lendemain sur présentation du justificatif de paiement. Délai : 14 jours.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="expedition" className="border-b border-border">
                      <AccordionTrigger className="hover:no-underline py-2.5 text-sm">Expédition</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-3 text-sm">
                        Mise en relation avec transporteurs spécialisés. Service interne pour petits objets.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Planning slot - s'affiche quand le bouton flottant est cliqué */}
      <InlinePlanningSlot />

      {/* Lots Section - only show LotsGrid if we have scraped lots */}
      {lotsCount > 0 && (
        <section id="catalogue" className="py-12 scroll-mt-24">
          <div className="container mx-auto px-4">
            <LotsGrid saleId={sale.id} saleTitle={decodedTitle} specialty={sale.specialty} />
          </div>
        </section>
      )}

      {/* Vente en préparation - no lots yet */}
      {lotsCount === 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Cartouche: Proposer un lot + Estimation gratuite */}
              <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-lg p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-brand-gold/20 flex items-center justify-center">
                      <Send className="w-5 h-5 text-brand-gold" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg font-semibold mb-1">Proposer un lot pour cette vente</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Vous avez un objet en rapport avec cette spécialité ? Proposez-le avant le{" "}
                      <span className="font-semibold text-foreground">
                        {saleDate ? format(subDays(saleDate, 15), "d MMMM yyyy", { locale: fr }) : "15 jours avant la vente"}
                      </span>{" "}
                      pour qu'il soit inclus au catalogue.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href={`mailto:jean@lemarteaudigital.fr?subject=${encodeURIComponent(`Proposition de lot - ${decodedTitle}`)}&body=${encodeURIComponent(`Bonjour,\n\nJe souhaite proposer un objet pour la vente "${decodedTitle}" prévue le ${formattedDate}.\n\nDescription de l'objet :\n\n\nCordialement`)}`}
                        className="inline-flex items-center justify-center gap-2 bg-brand-gold text-white px-5 py-2.5 text-sm font-medium rounded hover:bg-brand-gold/90 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Proposer un objet
                      </a>
                      <Link
                        to="/vendre/estimation-en-ligne"
                        className="inline-flex items-center justify-center gap-2 border border-brand-gold text-brand-gold px-5 py-2.5 text-sm font-medium rounded hover:bg-brand-gold/10 transition-colors"
                      >
                        Demander une estimation gratuite
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descriptif de la vente */}
              {sale.description && (
                <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-semibold mb-2">À propos de cette vente</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {decodeHtmlEntities(sale.description)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Séparateur + Expertises à venir */}
              <div className="space-y-4">
                <p className="text-center text-lg md:text-xl font-serif text-foreground">
                  Vous pouvez aussi venir à une journée d'expertise gracieuse
                </p>

                {/* Cartes des expertises à venir */}
                {upcomingExpertises.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingExpertises.slice(0, 6).map((expertise) => {
                      const cityImage = getCityImage(expertise.location);
                      const isItinerant = expertise.location && !expertise.location.toLowerCase().includes('ajaccio');
                      
                      return (
                        <div 
                          key={expertise.id}
                          className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-lg overflow-hidden"
                        >
                          {/* Image for itinerant expertises */}
                          {cityImage && isItinerant && (
                            <div className="aspect-[16/9] overflow-hidden relative group/img">
                              <img 
                                src={cityImage} 
                                alt={expertise.location || ''} 
                                className="w-full h-full object-cover grayscale contrast-125"
                              />
                              {/* Teal overlay on hover/touch - matches bg-teal-50 */}
                              <div className="absolute inset-0 bg-teal-200/30 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
                            </div>
                          )}
                          
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              <span className="font-medium text-teal-700 dark:text-teal-300 capitalize text-sm">
                                {format(parseISO(expertise.start_date), "EEEE d MMMM", { locale: fr })}
                              </span>
                            </div>
                            <p className="text-sm font-medium mb-1">{expertise.title}</p>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              {expertise.start_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{expertise.start_time.slice(0, 5)}</span>
                                </div>
                              )}
                              {expertise.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{expertise.location}</span>
                                </div>
                              )}
                            </div>
                            {expertise.specialty && (
                              <span className="inline-block mt-2 text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded">
                                {expertise.specialty}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center">
                    <Link
                      to="/vendre/journees-estimation"
                      className="inline-flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 underline hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                    >
                      Voir nos prochaines journées d'estimation →
                    </Link>
                  </div>
                )}

                {upcomingExpertises.length > 0 && (
                  <div className="text-center">
                    <Link
                      to="/vendre/journees-estimation"
                      className="inline-flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 underline hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                    >
                      Voir toutes nos journées d'estimation →
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Back to calendar */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <Link 
            to="/acheter/ventes-a-venir"
            className="inline-block border border-foreground px-8 py-3 font-sans text-sm tracking-widest hover:bg-foreground hover:text-background transition-colors"
          >
            ← RETOUR AUX VENTES À VENIR
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VenteDetail;