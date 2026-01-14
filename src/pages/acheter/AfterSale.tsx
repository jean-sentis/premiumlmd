import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ShoppingBag, CreditCard, Building2, Clock, Info } from "lucide-react";
import TimelineLayout from "@/components/TimelineLayout";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { getDemoNow } from "@/lib/site-config";

// Proxy les images interenchères pour éviter le blocage CORS/hotlink
const getProxiedImageUrl = (url: string): string => {
  if (!url) return url;
  if (url.includes('supabase.co')) return url;
  if (url.includes('interencheres.com')) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

const AfterSale = () => {
  const demoNow = getDemoNow();

  const { data: afterSaleLots, isLoading } = useQuery({
    queryKey: ['after-sale-lots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interencheres_lots')
        .select('*')
        .eq('is_after_sale', true)
        .gte('after_sale_end_date', demoNow.toISOString().split('T')[0])
        .order('after_sale_end_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  const formatEndDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return format(parseISO(dateStr), "d MMMM yyyy", { locale: fr });
  };

  const getFirstImage = (images: unknown): string => {
    if (Array.isArray(images) && images.length > 0) {
      const firstImage = images[0];
      if (typeof firstImage === 'string') return firstImage;
      if (typeof firstImage === 'object' && firstImage && 'url' in firstImage) {
        return (firstImage as { url: string }).url;
      }
    }
    return "";
  };

  return (
    <>
      <Helmet>
        <title>After Sale - Lots disponibles | Douze pages & associés</title>
        <meta name="description" content="Découvrez nos lots disponibles à l'achat direct après les ventes aux enchères. Prix fixes, paiement simplifié." />
      </Helmet>

      <TimelineLayout pageTitle="After Sale" mode="acheter">
        {/* Bandeau explicatif compact */}
        <section className="py-6 md:py-8 bg-muted/30 border-b border-border/30">
          <div className="container">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
              <div className="flex-1">
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Qu'est-ce qu'une After Sale ?</strong> Certains lots ne trouvent pas preneur lors d'une vente aux enchères. 
                  Avec l'accord des vendeurs, nous vous proposons ces pièces à l'achat direct, à un prix fixe.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-gold" />
                  <span>Paiement en ligne</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-gold" />
                  <span>Ou à l'étude</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Liste des lots */}
        <section className="py-10 md:py-12">
          <div className="container">
            <h2 className="section-title !text-[14px] !font-sans !font-medium !tracking-[0.15em] mb-8">
              LOTS DISPONIBLES
            </h2>
            
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement des lots...</p>
              </div>
            ) : afterSaleLots && afterSaleLots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {afterSaleLots.map((lot) => {
                  const imageUrl = getProxiedImageUrl(getFirstImage(lot.images));
                  return (
                    <Link 
                      key={lot.id} 
                      to={`/acheter/after-sale/${lot.id}`}
                      className="group relative bg-background border border-border/50 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {/* Image */}
                      <div className="aspect-square overflow-hidden bg-muted">
                        {imageUrl ? (
                          <img 
                            src={imageUrl}
                            alt={lot.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      
                      {/* Infos */}
                      <div className="p-3">
                        <h3 className="font-serif text-sm line-clamp-2 mb-1">{lot.title}</h3>
                        
                        {/* Prix */}
                        <p className="text-base font-semibold text-brand-gold mb-2">
                          {lot.after_sale_price?.toLocaleString('fr-FR')} €
                        </p>
                        
                        {/* Date de fin */}
                        {lot.after_sale_end_date && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">
                              Jusqu'au {formatEndDate(lot.after_sale_end_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-background border border-border/50">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-serif text-xl mb-2">Aucun lot disponible actuellement</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Les lots After Sale sont proposés après nos ventes aux enchères. 
                  Revenez bientôt ou consultez nos prochaines ventes.
                </p>
                <Link 
                  to="/acheter/ventes-a-venir"
                  className="inline-block mt-6 text-sm text-brand-gold hover:text-brand-gold/80 transition-colors font-sans tracking-wider"
                >
                  VOIR LES PROCHAINES VENTES →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Note d'information */}
        <section className="py-10 md:py-12">
          <div className="container">
            <div className="max-w-2xl mx-auto bg-brand-blue-900 text-brand-primary-foreground p-6 md:p-8 flex gap-4">
              <Info className="w-6 h-6 text-brand-gold shrink-0 mt-1" />
              <div>
                <p className="text-sm leading-relaxed">
                  Les lots After Sale sont vendus en l'état. Les conditions générales de vente 
                  restent applicables. Pour toute question sur un lot, n'hésitez pas à nous contacter.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </TimelineLayout>
    </>
  );
};

export default AfterSale;
