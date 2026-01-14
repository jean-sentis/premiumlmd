import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, ZoomIn, Ruler, ArrowLeft, ShoppingCart, Bookmark, Phone, MessageCircle, Clock, Send, Sparkles, CreditCard, Building2, Wallet, Check } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Footer from "@/components/Footer";
import ImageViewer from "@/components/ImageViewer";
import TimelineLayout from "@/components/TimelineLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Image proxy for external images
const getProxiedImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.includes("interencheres.com")) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

interface AfterSaleLot {
  id: string;
  lot_number: number;
  title: string;
  description: string | null;
  images: unknown;
  dimensions: string | null;
  after_sale_price: number | null;
  after_sale_end_date: string | null;
  interencheres_lot_id: string;
}

const AfterSaleLotDetail = () => {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lot, setLot] = useState<AfterSaleLot | null>(null);
  const [adjacentLots, setAdjacentLots] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Actions state
  const [isMemorized, setIsMemorized] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [hasSavedPayment, setHasSavedPayment] = useState(false);

  // Extract images from lot data
  const getImages = (images: unknown): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) {
      return images.map(img => {
        if (typeof img === 'string') return getProxiedImageUrl(img);
        if (img && typeof img === 'object' && 'url' in img) {
          return getProxiedImageUrl((img as { url: string }).url);
        }
        return '';
      }).filter(Boolean);
    }
    return [];
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!lotId) return;

      const { data: lotData, error: lotError } = await supabase
        .from("interencheres_lots")
        .select("*")
        .eq("id", lotId)
        .eq("is_after_sale", true)
        .single();

      if (lotError || !lotData) {
        console.error("Error fetching lot:", lotError);
        setLoading(false);
        return;
      }

      setLot(lotData);
      setCurrentImageIndex(0);
      setImageError(false);

      const { data: allLots } = await supabase
        .from("interencheres_lots")
        .select("id, lot_number")
        .eq("is_after_sale", true)
        .gt("after_sale_end_date", new Date().toISOString())
        .order("lot_number", { ascending: true });

      if (allLots) {
        const currentIndex = allLots.findIndex((l) => l.id === lotId);
        setAdjacentLots({
          prev: currentIndex > 0 ? allLots[currentIndex - 1].id : null,
          next: currentIndex < allLots.length - 1 ? allLots[currentIndex + 1].id : null,
        });
      }

      if (user) {
        const { data: memorizedData } = await supabase
          .from("memorized_lots")
          .select("id")
          .eq("user_id", user.id)
          .eq("lot_id", lotId)
          .maybeSingle();
        
        setIsMemorized(!!memorizedData);

        // Check for saved payment method
        const { data: profileData } = await supabase
          .from("profiles")
          .select("bank_validated, stripe_customer_id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        setHasSavedPayment(!!profileData?.bank_validated && !!profileData?.stripe_customer_id);
      }

      setLoading(false);
    };

    fetchData();
  }, [lotId, user]);

  const lotImages = lot ? getImages(lot.images) : [];
  const hasImages = lotImages.length > 0;

  const tryNextImageOrFail = () => {
    if (!lotImages.length) {
      setImageError(true);
      return;
    }
    if (currentImageIndex < lotImages.length - 1) {
      setCurrentImageIndex((v) => v + 1);
      setImageError(false);
      return;
    }
    setImageError(true);
  };

  const nextImage = () => {
    if (lotImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % lotImages.length);
      setImageError(false);
    }
  };

  const prevImage = () => {
    if (lotImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + lotImages.length) % lotImages.length);
      setImageError(false);
    }
  };

  const displayImage = hasImages && !imageError ? lotImages[currentImageIndex] : null;

  const formatEndDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "d MMMM yyyy", { locale: fr });
    } catch {
      return null;
    }
  };

  const handleMemorize = async () => {
    if (!user) {
      toast.error("Connexion requise", {
        description: "Veuillez vous connecter pour mémoriser ce lot.",
      });
      navigate("/auth");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isMemorized) {
        const { error } = await supabase
          .from("memorized_lots")
          .delete()
          .eq("user_id", user.id)
          .eq("lot_id", lotId);
        if (error) throw error;

        setIsMemorized(false);
        toast.success("Lot retiré de votre sélection");
        return;
      }

      const { error: insertError } = await supabase
        .from("memorized_lots")
        .insert({ user_id: user.id, lot_id: lotId });
      if (insertError) throw insertError;

      setIsMemorized(true);
      toast.success("Lot mémorisé", {
        description: "Retrouvez-le dans votre compte.",
      });
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible de mettre à jour votre sélection. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI-powered question
  const handleAskAI = async () => {
    if (!infoMessage.trim()) {
      toast.error("Question requise", { description: "Veuillez saisir votre question." });
      return;
    }

    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke('answer-lot-question', {
        body: {
          question: infoMessage.trim(),
          lotTitle: lot?.title,
          lotDescription: lot?.description,
          lotDimensions: lot?.dimensions,
          lotPrice: lot?.after_sale_price,
        }
      });

      if (error) throw error;
      setAiResponse(data?.answer || "Je n'ai pas pu répondre à cette question. Contactez-nous directement.");
    } catch (error) {
      console.error("AI error:", error);
      setAiResponse("Je n'ai pas pu répondre pour le moment. N'hésitez pas à nous appeler au 04 95 12 12 12.");
    }
    setIsAiLoading(false);
  };

  // Send question to team
  const handleSendToTeam = async () => {
    if (!user) {
      toast.error("Connexion requise", {
        description: "Veuillez vous connecter pour envoyer votre question.",
      });
      navigate("/auth");
      return;
    }

    if (!infoMessage.trim()) {
      toast.error("Message requis", { description: "Veuillez saisir votre question." });
      return;
    }

    setIsSubmitting(true);
    try {
      await supabase
        .from("info_requests")
        .insert({
          user_id: user.id,
          lot_id: lotId,
          message: infoMessage.trim(),
        });
      setInfoMessage("");
      toast.success("Question envoyée", { description: "Notre équipe vous répondra dans les plus brefs délais." });
    } catch (error) {
      toast.error("Erreur", { description: "Une erreur est survenue." });
    }
    setIsSubmitting(false);
  };

  const handlePurchase = () => {
    if (!user) {
      toast.error("Connexion requise", {
        description: "Veuillez vous connecter pour acheter ce lot.",
      });
      navigate("/auth");
      return;
    }
    setIsPurchaseOpen(!isPurchaseOpen);
    // Fermer le panneau question si ouvert
    if (!isPurchaseOpen) setIsQuestionOpen(false);
  };

  const handlePaymentChoice = (method: "card" | "agency" | "saved") => {
    switch (method) {
      case "card":
        toast.success("Paiement par carte", {
          description: "Vous allez être redirigé vers le paiement sécurisé. Fonctionnalité en cours de développement.",
        });
        break;
      case "saved":
        toast.success("Paiement enregistré", {
          description: "Votre achat va être finalisé avec vos coordonnées bancaires validées.",
        });
        break;
      case "agency":
        toast("Passage à l'agence", {
          description: "Votre lot n'est pas réservé. Présentez-vous à l'agence pour finaliser l'achat.",
        });
        break;
    }
    setIsPurchaseOpen(false);
  };

  // Generate mailto link for "Je souhaite vendre un objet similaire"
  const handleSellSimilar = () => {
    const subject = encodeURIComponent("Je souhaite vendre un objet similaire");
    const lotUrl = `${window.location.origin}/after-sale/${lotId}`;
    const lotImages = getImages(lot?.images);
    
    let body = `Je souhaite vendre un objet similaire.\n\n`;
    body += `---\n`;
    body += `Référence : Lot n°${lot?.lot_number}\n`;
    body += `Titre : ${lot?.title}\n`;
    if (lot?.description) body += `\nDescription :\n${lot.description}\n`;
    if (lot?.dimensions) body += `\nDimensions : ${lot.dimensions}\n`;
    body += `\nLien vers le lot : ${lotUrl}\n`;
    if (lotImages.length > 0) body += `\nPhoto du lot : ${lotImages[0]}\n`;
    
    const mailtoUrl = `mailto:contact@12pages.fr?subject=${subject}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TimelineLayout pageTitle="After Sale" mode="acheter">
          <section className="py-24">
            <div className="container">
              <div className="flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Chargement...</div>
              </div>
            </div>
          </section>
          <Footer />
        </TimelineLayout>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="min-h-screen bg-background">
        <TimelineLayout
          pageTitle="After Sale"
          mode="acheter"
          stickyLeft={
            <Link
              to="/acheter/after-sale"
              className="flex items-center gap-1 px-2 py-1 text-[11px] uppercase tracking-wider border border-border hover:border-brand-gold hover:text-brand-gold transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Retour au catalogue</span>
            </Link>
          }
        >
          <section className="py-24">
            <div className="container">
              <div className="flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Lot introuvable</p>
                <Link to="/acheter/after-sale" className="text-brand-gold hover:underline">
                  Retour au catalogue
                </Link>
              </div>
            </div>
          </section>
          <Footer />
        </TimelineLayout>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${lot.title} - After Sale | Douze pages & associés`}</title>
        <meta name="description" content={lot.description?.substring(0, 160) || lot.title} />
      </Helmet>

      <TimelineLayout
        pageTitle="After Sale"
        mode="acheter"
        stickyLeft={
          <Link
            to="/acheter/after-sale"
            className="flex items-center gap-1 px-2 py-1 text-[11px] uppercase tracking-wider border border-border hover:border-brand-gold hover:text-brand-gold transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Retour au catalogue</span>
          </Link>
        }
        stickyRight={
          <button
            onClick={handleMemorize}
            disabled={isSubmitting}
            className={`p-2 rounded-full transition-colors ${
              isMemorized
                ? "text-brand-gold bg-brand-gold/10"
                : "text-muted-foreground hover:text-brand-gold hover:bg-muted/50"
            }`}
            title={isMemorized ? "Retirer des favoris" : "Mémoriser"}
          >
            <Bookmark className={`w-5 h-5 ${isMemorized ? "fill-brand-gold" : ""}`} />
          </button>
        }
      >
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-4">

           {/* Titre du lot avec navigation */}
           <div className="relative flex items-center justify-center mb-10">
             {/* Précédent - à gauche */}
             <button
               onClick={() => adjacentLots.prev && navigate(`/acheter/after-sale/${adjacentLots.prev}`)}
               disabled={!adjacentLots.prev}
               className={`absolute left-0 flex items-center gap-1 text-xs transition-colors ${
                 adjacentLots.prev 
                   ? 'text-muted-foreground hover:text-brand-gold' 
                   : 'text-muted/30 cursor-not-allowed'
               }`}
             >
               <ChevronLeft className="w-4 h-4" />
               <span className="hidden sm:inline">Précédent</span>
             </button>

             {/* Titre centré */}
             <h2 className="font-serif text-2xl md:text-3xl font-semibold leading-snug text-center max-w-2xl px-16">
               {lot.title}
             </h2>

             {/* Suivant - à droite */}
             <button
               onClick={() => adjacentLots.next && navigate(`/acheter/after-sale/${adjacentLots.next}`)}
               disabled={!adjacentLots.next}
               className={`absolute right-0 flex items-center gap-1 text-xs transition-colors ${
                 adjacentLots.next 
                   ? 'text-muted-foreground hover:text-brand-gold' 
                   : 'text-muted/30 cursor-not-allowed'
               }`}
             >
               <span className="hidden sm:inline">Suivant</span>
               <ChevronRight className="w-4 h-4" />
             </button>
           </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Colonne gauche : Images */}
            <div className="space-y-4">
              <div 
                className="relative bg-white rounded overflow-hidden cursor-zoom-in group border border-border/30"
                onClick={() => displayImage && setIsFullscreen(true)}
              >
                {displayImage ? (
                  <>
                    <img
                      src={displayImage}
                      alt={lot.title}
                      className="w-full h-auto block transition-transform duration-300"
                      onError={tryNextImageOrFail}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </>
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-muted-foreground bg-muted/20">
                    <span className="text-5xl font-serif opacity-20">After Sale</span>
                  </div>
                )}

                {hasImages && lotImages.length > 1 && (
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
                      {currentImageIndex + 1} / {lotImages.length}
                    </div>
                  </>
                )}
              </div>

              {hasImages && lotImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {lotImages.map((img, idx) => (
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
                      <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}

              {/* Prix */}
              <div className="bg-brand-gold/10 border border-brand-gold/40 rounded-lg p-5 text-center">
                <p className="text-xs uppercase tracking-widest text-brand-gold mb-1">
                  Prix de vente
                </p>
                <p className="text-3xl font-serif text-brand-gold font-semibold">
                  {lot.after_sale_price?.toLocaleString('fr-FR')} €
                </p>
                {lot.after_sale_end_date && (
                  <p className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    Disponible jusqu'au {formatEndDate(lot.after_sale_end_date)}
                  </p>
                )}
              </div>
            </div>

            {/* Colonne droite : Détails + Actions */}
            <div className="space-y-5">
              {/* Description - 3-4 lignes max avec ellipsis */}
              <div className="space-y-1.5">
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Description
                </h2>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line line-clamp-4">
                  {lot.description || "—"}
                </p>
              </div>

              {/* Dimensions - 1 ligne */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border/30 rounded text-sm min-h-[40px]">
                <Ruler className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground truncate">{lot.dimensions || "Dimensions sur demande"}</span>
              </div>

              {/* 3 boutons d'action de même taille */}
              <div className="grid grid-cols-3 gap-3">
                {/* Acheter */}
                <button
                  onClick={handlePurchase}
                  className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-lg border-2 transition-colors ${
                    isPurchaseOpen
                      ? 'border-brand-gold bg-brand-gold text-brand-gold-foreground'
                      : 'border-brand-gold bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-brand-gold-foreground'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-xs font-medium uppercase tracking-wide">Acheter</span>
                </button>

                {/* Question - toggle */}
                <button
                  onClick={() => {
                    setIsQuestionOpen(!isQuestionOpen);
                    if (!isQuestionOpen) setIsPurchaseOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-lg border-2 transition-colors ${
                    isQuestionOpen
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                      : 'border-border hover:border-brand-gold/50 text-muted-foreground hover:text-brand-gold'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-xs font-medium uppercase tracking-wide">Question</span>
                </button>

                {/* Mémoriser */}
                <button
                  onClick={handleMemorize}
                  disabled={isSubmitting}
                  className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-lg border-2 transition-colors ${
                    isMemorized
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                      : 'border-border hover:border-brand-gold/50 text-muted-foreground hover:text-brand-gold'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isMemorized ? 'fill-brand-gold' : ''}`} />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {isMemorized ? 'Mémorisé' : 'Mémoriser'}
                  </span>
                </button>
              </div>

              {/* Bouton Vendre un objet similaire - pleine largeur */}
              <button
                onClick={handleSellSimilar}
                className="w-full border rounded-lg px-3 py-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <Send className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <span className="text-xs font-medium">Je souhaite vendre un objet similaire</span>
              </button>

              {/* Bloc Acheter dépliable */}
              {isPurchaseOpen && (
                <div className="border border-brand-gold/30 bg-brand-gold/5 rounded-lg p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-sm text-muted-foreground">
                    Comment souhaitez-vous procéder au paiement ?
                  </p>

                  {/* Option 1: Carte bancaire */}
                  <button
                    onClick={() => handlePaymentChoice("card")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-brand-gold hover:bg-brand-gold/5 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-gold/10 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-brand-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block">Payer par carte bancaire</span>
                      <span className="text-xs text-muted-foreground">Paiement sécurisé, lot réservé immédiatement</span>
                    </div>
                  </button>

                  {/* Option 2: Moyen de paiement enregistré */}
                  {hasSavedPayment && (
                    <button
                      onClick={() => handlePaymentChoice("saved")}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-50/50 dark:bg-green-950/20 hover:border-green-500 transition-colors text-left"
                    >
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm flex items-center gap-2">
                          Moyen de paiement enregistré
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        </span>
                        <span className="text-xs text-muted-foreground">Paiement rapide avec vos coordonnées validées</span>
                      </div>
                    </button>
                  )}

                  {/* Option 3: Passer à l'agence */}
                  <button
                    onClick={() => handlePaymentChoice("agency")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-muted-foreground/50 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block">Passer à l'agence</span>
                      <span className="text-xs text-muted-foreground">
                        Payez sur place — <span className="text-amber-600 font-medium">lot non réservé</span>
                      </span>
                    </div>
                  </button>

                  {/* Contact direct */}
                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/50 text-sm">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Besoin d'aide ?</span>
                    <a href="tel:+33495121212" className="text-brand-gold hover:underline font-medium">
                      04 95 12 12 12
                    </a>
                  </div>
                </div>
              )}

              {/* Bloc Question dépliable */}
              {isQuestionOpen && (
                <div className="border border-border rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <Textarea
                    value={infoMessage}
                    onChange={(e) => setInfoMessage(e.target.value)}
                    placeholder="Posez votre question ici..."
                    className="text-sm resize-none"
                    rows={3}
                  />

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleAskAI}
                      disabled={isAiLoading || !infoMessage.trim()}
                      variant="outline"
                      className="flex-1 text-xs"
                      size="sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      {isAiLoading ? "Réflexion..." : "Réponse IA"}
                    </Button>
                    <Button
                      onClick={handleSendToTeam}
                      disabled={isSubmitting || !infoMessage.trim()}
                      variant="secondary"
                      className="flex-1 text-xs"
                      size="sm"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Envoyer à l'équipe
                    </Button>
                  </div>

                  {/* Réponse IA */}
                  {aiResponse && (
                    <div className="bg-muted/50 border border-border/50 rounded p-3 text-sm">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Réponse
                      </p>
                      <p className="text-foreground leading-relaxed text-sm">{aiResponse}</p>
                    </div>
                  )}

                  {/* Contact téléphone */}
                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">ou appelez-nous</span>
                    <a 
                      href="tel:+33495121212" 
                      className="flex items-center gap-1.5 text-brand-gold hover:text-brand-gold-dark text-sm font-medium transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      04 95 12 12 12
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </section>

        <div className="h-12"></div>
        <Footer />
      </TimelineLayout>

      {isFullscreen && hasImages && lot && (
        <ImageViewer
          images={lotImages}
          currentIndex={currentImageIndex}
          onClose={() => setIsFullscreen(false)}
          onNavigate={(idx) => setCurrentImageIndex(idx)}
          alt={lot.title}
        />
      )}

    </>
  );
};

export default AfterSaleLotDetail;
