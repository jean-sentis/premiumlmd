import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InlinePlanningSlot from "@/components/InlinePlanningSlot";
import ResultCard from "@/components/ResultCard";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, Calendar, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import grenierTresor from "@/assets/grenier-tresor-illustration.png";
import logo12P from "@/assets/logo-12p-nb.png";
import ilesSanguinaires from "@/assets/iles-sanguinaires-corse.jpg";
import marteauIllustration from "@/assets/coup-de-marteau-illustration.png";
import hotelDesVentesEquipe from "@/assets/hotel-des-ventes-equipe.png";
import recordJaguarXK120 from "@/assets/record-jaguar-xk120.png";
import recordTinguelySculpture from "@/assets/record-tinguely-sculpture.png";
import recordCesarCompression from "@/assets/record-cesar-compression.png";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Sale {
  id: string;
  title: string;
  sale_date: string;
  lot_count: number | null;
  cover_image_url: string | null;
  sale_url: string;
  sale_type: string | null;
  specialty: string | null;
}

interface GalleryLot {
  id: string;
  title: string;
  images: string[];
  estimate_low: number | null;
  estimate_high: number | null;
  adjudication_price: number | null;
  sale_id: string;
}

// Mapping spécialité → classe d'ombre
const getSpecialtyShadowClass = (specialty?: string | null): string => {
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
  if (normalizedSpecialty.includes("mode") || normalizedSpecialty.includes("textile") || normalizedSpecialty.includes("vintage")) {
    return "card-shadow-rose";
  }
  
  return "card-shadow";
};

// Date fixe pour le site démo : 3 janvier 2026
const DEMO_DATE = new Date('2026-01-03T00:00:00');

const Index = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [galleryLots, setGalleryLots] = useState<GalleryLot[]>([]);
  const [selectedResult, setSelectedResult] = useState<{
    title: string;
    artist?: string;
    price: string;
    date?: string;
    imageUrl: string;
  } | null>(null);
  
  // Auto-scroll carousel
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  const scrollCarousel = useCallback(() => {
    if (!carouselRef.current || isHovering) return;
    
    const carousel = carouselRef.current;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    
    // Si on est à la fin, revenir au début
    if (carousel.scrollLeft >= maxScroll - 10) {
      carousel.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      // Sinon, avancer d'une carte (280px = 256px card + 24px gap)
      carousel.scrollBy({ left: 280, behavior: 'smooth' });
    }
  }, [isHovering]);
  
  useEffect(() => {
    const interval = setInterval(scrollCarousel, 4000);
    return () => clearInterval(interval);
  }, [scrollCarousel]);

  // Fetch gallery lots with local images
  useEffect(() => {
    const fetchGalleryLots = async () => {
      try {
        const { data, error } = await supabase
          .from('interencheres_lots')
          .select('id, title, images, estimate_low, estimate_high, adjudication_price, sale_id')
          .not('images', 'is', null)
          .limit(50);

        if (error) {
          console.error('Error fetching gallery lots:', error);
          return;
        }

        // Filter lots with local images (starting with /images/)
        const lotsWithLocalImages = (data || [])
          .map(lot => {
            const rawImages = Array.isArray(lot.images) ? lot.images : [];
            const stringImages = rawImages.filter((img): img is string => typeof img === 'string');
            const localImages = stringImages.filter(img => img.startsWith('/images/'));
            return {
              id: lot.id,
              title: lot.title,
              estimate_low: lot.estimate_low,
              estimate_high: lot.estimate_high,
              adjudication_price: lot.adjudication_price,
              sale_id: lot.sale_id || '',
              images: localImages.length > 0 ? localImages : stringImages
            } as GalleryLot;
          })
          .filter(lot => lot.images.length > 0 && lot.images[0].startsWith('/images/'));

        setGalleryLots(lotsWithLocalImages.slice(0, 6));
      } catch (err) {
        console.error('Error:', err);
      }
    };

    fetchGalleryLots();
  }, []);

  useEffect(() => {
    const fetchSales = async () => {
      setIsLoadingSales(true);
      try {
        const { data, error } = await supabase
          .from('interencheres_sales')
          .select('id, title, sale_date, lot_count, cover_image_url, sale_url, sale_type, specialty')
          .gte('sale_date', DEMO_DATE.toISOString())
          .eq('sale_type', 'live')
          .order('sale_date', { ascending: true })
          .limit(1);

        if (error) {
          console.error('Error fetching sales:', error);
        } else {
          setSales(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoadingSales(false);
      }
    };

    fetchSales();
  }, []);

  // Helper to format price
  const formatPrice = (low: number | null, high: number | null) => {
    if (low && high) {
      return `${low.toLocaleString('fr-FR')} – ${high.toLocaleString('fr-FR')} €`;
    }
    if (low) return `${low.toLocaleString('fr-FR')} €`;
    if (high) return `${high.toLocaleString('fr-FR')} €`;
    return null;
  };

  const topResults = [
    {
      title: "Jaguar XK120 Alloy Roadster",
      artist: "1950, carrosserie aluminium",
      price: "125 000 €",
      date: "12 mai 2018",
      imageUrl: recordJaguarXK120,
    },
    {
      title: "Sculpture méta-mécanique",
      artist: "Jean Tinguely",
      price: "85 000 €",
      date: "22 mars 2017",
      imageUrl: recordTinguelySculpture,
    },
    {
      title: "Compression de voiture",
      artist: "César Baldaccini",
      price: "72 000 €",
      date: "8 novembre 2019",
      imageUrl: recordCesarCompression,
    },
    {
      title: "Sac Birkin 35",
      artist: "Hermès, cuir Togo gold",
      price: "18 500 €",
      date: "14 juin 2023",
      imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
    },
    {
      title: "Bague solitaire diamant 3,52 ct",
      artist: "Taille brillant, couleur D, pureté VVS1",
      price: "48 500 €",
      date: "15 décembre 2022",
      imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop",
    },
    {
      title: "Montre Rolex Daytona",
      artist: "Or rose, cadran chocolat",
      price: "42 000 €",
      date: "5 septembre 2019",
      imageUrl: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400&h=400&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header showLogo={true} />
      {/* Spacer under fixed header */}
      <div style={{ height: 'var(--header-sticky-top, var(--header-main-height, 145px))' }} />

      {/* Main Content */}
      <main className="relative bg-background">

        {/* Titre principal - NON sticky sur la home (exception) */}
        <section className="pt-0 pb-[10px] mt-0 text-center container mx-auto">
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-1">
            Douze pages <span className="italic">&</span> associés
          </h1>
          <p className="font-sans text-sm md:text-base tracking-widest uppercase text-muted-foreground">
            L'hôtel des ventes d'Ajaccio
          </p>
        </section>

        {/* Hero Full-Width - Un seul visuel d'impact */}
        <section className="w-full">
          {/* Image pleine largeur avec lien vers le lot */}
          <Link 
            to={galleryLots.length > 0 ? `/vente/${galleryLots[0].sale_id}/lot/${galleryLots[0].id}` : "/acheter/ventes-a-venir"}
            className="block relative group cursor-pointer"
          >
            {/* Container full-width sans limite */}
            <div className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden bg-muted">
              <img 
                src={galleryLots.length > 0 ? galleryLots[0].images[0] : "/images/sales/2025-11-08-art-moderne.jpg"} 
                alt={galleryLots.length > 0 ? galleryLots[0].title : "Œuvre à la une"}
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
              />
              {/* Overlay subtil au survol */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Cartel discret en bas à gauche */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-black/60 to-transparent">
                <div className="max-w-4xl">
                  <p className="font-serif text-white text-xl md:text-3xl lg:text-4xl font-light leading-tight drop-shadow-lg line-clamp-2">
                    {galleryLots.length > 0 ? galleryLots[0].title : "Collection Art Moderne & Contemporain"}
                  </p>
                  {galleryLots.length > 0 && formatPrice(galleryLots[0].estimate_low, galleryLots[0].estimate_high) && (
                    <p className="text-white/80 text-sm md:text-base mt-2 font-light tracking-wide">
                      Estimation {formatPrice(galleryLots[0].estimate_low, galleryLots[0].estimate_high)}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-2 text-white/70 text-xs md:text-sm uppercase tracking-widest mt-4 group-hover:text-white transition-colors">
                    Voir ce lot
                    <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Slot inline pour le planning - après la vidéo (scroll ajusté pour éviter le masquage par le header) */}
        <InlinePlanningSlot scrollOffsetPx={30} />

        {/* Section "Connaissez-vous le système des ventes aux enchères ?" */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              {/* Titre avec image de marteau */}
              <div className="flex items-center justify-center gap-6 mb-12">
                <img 
                  src={marteauIllustration} 
                  alt="Marteau de commissaire-priseur" 
                  className="h-16 md:h-20 w-auto opacity-80"
                />
                <p className="font-serif text-lg md:text-xl font-light leading-relaxed text-muted-foreground max-w-xl">
                  Connaissez-vous le système des ventes aux enchères ?
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                {/* Un système ancien et sécurisé */}
                <div className="text-center md:text-left">
                  <h3 className="font-serif text-lg font-medium mb-3 text-brand-primary">
                    Un système sûr et encadré
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Les ventes aux enchères existent depuis l'Antiquité. En France, 
                    elles sont encadrées par la loi et dirigées par un commissaire-priseur, 
                    officier ministériel garant de la transparence et de la sécurité des transactions.
                  </p>
                </div>

                {/* Écoresponsable */}
                <div className="text-center md:text-left">
                  <h3 className="font-serif text-lg font-medium mb-3 text-brand-primary">
                    Écoresponsable par nature
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Acheter aux enchères, c'est privilégier les circuits courts et donner 
                    une seconde vie aux objets. Un geste économique et écologique qui s'inscrit 
                    dans une démarche de consommation responsable.
                  </p>
                </div>

                {/* Pour tous */}
                <div className="text-center md:text-left">
                  <h3 className="font-serif text-lg font-medium mb-3 text-brand-primary">
                    Un monde ouvert à tous
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Bijoux, meubles, tableaux, vins, voitures de collection... 
                    On trouve de tout aux enchères, à tous les prix. 
                    Et tout le monde est le bienvenu, sans condition.
                  </p>
                </div>
              </div>

              {/* Liens vers les guides */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/acheter/guide"
                  className="border border-brand-primary text-brand-primary px-8 py-3 font-sans text-xs tracking-widest hover:bg-brand-primary hover:text-brand-primary-foreground transition-colors"
                >
                  GUIDE ACHETEUR
                </Link>
                <Link
                  to="/vendre/guide"
                  className="border border-brand-primary bg-brand-primary text-brand-primary-foreground px-8 py-3 font-sans text-xs tracking-widest hover:bg-brand-secondary transition-colors"
                >
                  GUIDE VENDEUR
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Notre engagement - Section institutionnelle avec image Sanguinaires */}
        <section className="relative">
          {/* Image des Sanguinaires en fond avec contenu superposé */}
          <div className="relative">
            {/* Image de fond à taille naturelle */}
            <img 
              src={ilesSanguinaires} 
              alt="Îles Sanguinaires au coucher du soleil, Corse" 
              className="w-full h-auto"
            />
            {/* Dégradé bleu profond en haut pour le texte */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, hsl(var(--brand-primary)) 0%, hsl(var(--brand-primary)) 40%, transparent 75%)'
              }}
            />
            
            {/* Contenu superposé : titre + 6 cartouches */}
            <div className="absolute inset-0 pt-12 md:pt-16 pb-12 overflow-auto">
                <div className="container">
                  {/* Titre principal */}
                  <div className="max-w-2xl mx-auto text-center mb-10">
                    <p className="font-serif text-lg md:text-xl font-light leading-relaxed text-white">
                      Depuis 2012, l'Hôtel des ventes d'Ajaccio fait vivre 
                      le patrimoine de Corse du Sud avec passion.
                    </p>
                  </div>

                  {/* 6 cartouches en 2 rangées */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-6">
                    
                    {/* Thème 1 - Patrimoine local */}
                    <Link 
                      to="/la-maison" 
                      className="group p-6 border border-white/30 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-lg bg-transparent"
                    >
                      <h3 className="font-serif text-lg mb-3 text-white group-hover:text-brand-gold transition-colors">
                        Patrimoine insulaire
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed">
                        Quatre-vingts pour cent de nos adjudications restent sur l'île. 
                        Notre patrimoine, quand il n'est plus utilisé, gagne à changer de main.
                      </p>
                      <span className="inline-block mt-4 text-xs text-white group-hover:text-brand-gold transition-colors">
                        Découvrir notre maison →
                      </span>
                    </Link>

                    {/* Thème 2 - Seconde vie */}
                    <Link 
                      to="/vendre" 
                      className="group p-6 border border-white/30 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-lg bg-transparent"
                    >
                      <h3 className="font-serif text-lg mb-3 text-white group-hover:text-brand-gold transition-colors">
                        Une seconde vie
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed">
                        À l'occasion d'une succession, nous n'avons pas toujours les moyens 
                        de faire vivre tous les objets que nous recevons. Les mettre aux enchères, 
                        c'est leur offrir une deuxième vie.
                      </p>
                      <span className="inline-block mt-4 text-xs text-white group-hover:text-brand-gold transition-colors">
                        Vendre aux enchères →
                      </span>
                    </Link>

                    {/* Thème 3 - Rayonnement */}
                    <Link 
                      to="/acheter" 
                      className="group p-6 border border-white/30 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-lg bg-transparent"
                    >
                      <h3 className="font-serif text-lg mb-3 text-white group-hover:text-brand-gold transition-colors">
                        Rayonnement international
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed">
                        Pour les pièces les plus rares, nous offrons une exposition nationale, 
                        voire internationale grâce aux plateformes de vente en ligne.
                      </p>
                      <span className="inline-block mt-4 text-xs text-white group-hover:text-brand-gold transition-colors">
                        Acheter aux enchères →
                      </span>
                    </Link>
                  </div>

                  {/* Deuxième rangée de cartouches */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    
                    {/* Thème 4 - Expertises itinérantes */}
                    <Link 
                      to="/vendre/estimation-en-ligne#expertises-itinerantes"
                      className="group p-6 border border-white/30 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-lg bg-transparent"
                    >
                      <h3 className="font-serif text-lg mb-3 text-white group-hover:text-brand-gold transition-colors">
                        Expertises itinérantes
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed">
                        Nous nous déplaçons régulièrement à Propriano, Sartène, Porto-Vecchio, 
                        Bonifacio et Lévie pour vous rencontrer et expertiser votre patrimoine.
                      </p>
                      <span className="inline-block mt-4 text-xs text-white group-hover:text-brand-gold transition-colors">
                        Voir les prochaines dates →
                      </span>
                    </Link>

                    {/* Thème 5 - Accueil à Ajaccio */}
                    <Link 
                      to="/vendre/estimation-en-ligne"
                      className="group p-6 border border-white/30 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-lg bg-transparent"
                    >
                      <h3 className="font-serif text-lg mb-3 text-white group-hover:text-brand-gold transition-colors">
                        Accueil sans rendez-vous
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed">
                        Tous les lundis matin, sans rendez-vous, nous vous accueillons à Ajaccio. 
                        Et chaque semaine, hors période de vente, nous organisons une journée d'expertise 
                        dans l'une des villes du département.
                      </p>
                      <span className="inline-block mt-4 text-xs text-white group-hover:text-brand-gold transition-colors">
                        Nos expertises →
                      </span>
                    </Link>

                    {/* Thème 6 - Conseil */}
                    <Link 
                      to="/la-maison" 
                      className="group p-6 border border-white/30 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-lg bg-transparent"
                    >
                      <h3 className="font-serif text-lg mb-3 text-white group-hover:text-brand-gold transition-colors">
                        Conseil et discrétion
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed">
                        Le commissaire-priseur, officier ministériel, peut vous conseiller 
                        en matière de patrimoine, de partage et de valeurs. 
                        Son expérience et sa discrétion en font un professionnel précieux.
                      </p>
                      <span className="inline-block mt-4 text-xs text-white group-hover:text-brand-gold transition-colors">
                        À propos →
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
        </section>


        {/* Section "Première vente aux enchères" + "Créez un compte" */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container">
            {/* Grille principale : 2 colonnes ventes + 1 colonne compte */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              
              {/* Bloc gauche : 2 colonnes "Première vente" */}
              <div className="lg:col-span-2">
                {/* Titre d'invitation */}
                <div className="text-center mb-10">
                  <p className="font-serif text-lg md:text-xl font-light leading-relaxed text-muted-foreground mb-2">
                    Vous n'êtes jamais venu à une vente aux enchères ?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Venez assister à votre première vente. L'entrée est libre et gratuite.
                  </p>
                </div>

                {/* Deux colonnes : prochaine vente + équipe */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  
                  {/* Colonne - Prochaine vente en salle */}
                  <div className="flex flex-col items-center text-center">
                  {isLoadingSales ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : sales.length > 0 ? (
                      (() => {
                        const liveSale = sales[0];
                        const shadowClass = getSpecialtyShadowClass(liveSale.specialty);
                        
                        return (
                          <>
                            {/* Image au format catalogue */}
                            <Link 
                              to={`/vente/${liveSale.id}`}
                              className={`relative ${shadowClass} mb-4 group`}
                            >
                              <div className="aspect-[3/4] w-40 md:w-44 bg-muted overflow-hidden">
                                <img 
                                  src={liveSale.cover_image_url || '/placeholder.svg'} 
                                  alt={liveSale.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            </Link>
                            
                            {/* Infos de la vente */}
                            <p className="text-xs tracking-widest text-brand-gold uppercase mb-1">
                              Prochaine vente en salle
                            </p>
                            <h3 className="font-serif text-sm font-medium tracking-wide mb-1">
                              {liveSale.title.replace(/^vente\s*/i, "")}
                            </h3>
                            <p className="font-sans text-xs text-muted-foreground mb-1">
                              {liveSale.sale_date && format(parseISO(liveSale.sale_date), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
                            </p>
                            <p className="font-sans text-xs text-muted-foreground mb-1">
                              Hôtel des Ventes · 18 avenue Maréchal Juin, Ajaccio
                            </p>
                            <p className="font-sans text-xs text-muted-foreground/70 mb-4">
                              Exposition la veille et le matin de la vente
                            </p>
                            <Link
                              to={`/vente/${liveSale.id}`}
                              className="border border-brand-primary text-brand-primary px-6 py-2 font-sans text-xs tracking-widest hover:bg-brand-primary hover:text-brand-primary-foreground transition-colors"
                            >
                              VOIR LA VENTE
                            </Link>
                          </>
                        );
                      })()
                    ) : (
                      <p className="text-sm text-muted-foreground py-6">
                        Aucune vente en salle programmée pour le moment.
                      </p>
                    )}
                  </div>

                  {/* Colonne - Découvrir l'hôtel des ventes */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4 shadow-lg">
                      <div className="aspect-[3/4] w-40 md:w-44 bg-muted overflow-hidden">
                        <img 
                          src={hotelDesVentesEquipe} 
                          alt="L'équipe de l'hôtel des ventes"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs tracking-widest text-brand-gold uppercase mb-1">
                      Découvrez notre maison
                    </p>
                    <p className="font-serif text-sm font-medium tracking-wide mb-1">
                      Commissaire-priseur, experts, clercs, magasinier
                    </p>
                    <p className="font-sans text-xs text-muted-foreground mb-4">
                      Des métiers de passionnés à votre service
                    </p>
                    <Link
                      to="/equipe"
                      className="border border-brand-primary text-brand-primary px-6 py-2 font-sans text-xs tracking-widest hover:bg-brand-primary hover:text-brand-primary-foreground transition-colors"
                    >
                      VOIR NOTRE ÉQUIPE
                    </Link>
                  </div>
                </div>

                {/* Lien vers toutes les ventes */}
                <div className="text-center mt-8">
                  <Link
                    to="/acheter/ventes-a-venir"
                    className="inline-block text-xs text-muted-foreground hover:text-brand-primary transition-colors underline underline-offset-4"
                  >
                    Voir toutes nos ventes à venir
                  </Link>
                </div>
              </div>

              {/* Bloc droit : Créez-vous un compte (style sidebar) */}
              <div className="flex flex-col">
                {/* Titre au-dessus de la carte */}
                <div className="text-center mb-6">
                  <p className="font-serif text-lg md:text-xl font-light leading-relaxed text-muted-foreground mb-2">
                    Créez-vous un compte
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Gratuit, utile et plein de bonnes surprises
                  </p>
                </div>

                {/* Carte style sidebar (blanc sur noir) */}
                <div className="bg-slate-900 text-white p-6 flex-1 flex flex-col">
                  {/* Services */}
                  <div className="space-y-5 flex-1">
                    {/* Album partageable */}
                    <div className="border-b border-white/10 pb-4">
                      <p className="font-serif text-sm font-medium mb-1 text-brand-gold">
                        Ma sélection
                      </p>
                      <p className="text-xs text-white/80 leading-relaxed">
                        Faites-vous un album partageable des lots qui vous plaisent
                      </p>
                    </div>

                    {/* Alertes */}
                    <div className="border-b border-white/10 pb-4">
                      <p className="font-serif text-sm font-medium mb-1 text-brand-gold">
                        Mes alertes
                      </p>
                      <p className="text-xs text-white/80 leading-relaxed">
                        Vous ne voulez pas manquer vos immanquables ? Enregistrez vos alertes 
                        pour qu'on n'oublie pas de vous les proposer quand ils arrivent en vente
                      </p>
                    </div>

                    {/* Dialogue avec Lia */}
                    <div className="border-b border-white/10 pb-4">
                      <p className="font-serif text-sm font-medium mb-1 text-brand-gold">
                        Dialogue avec Lia
                      </p>
                      <p className="text-xs text-white/80 leading-relaxed">
                        Avec l'aide de Lia, notre assistante artificielle, définissez vos terrains de jeu, 
                        vos centres d'intérêt, tout ce qui pourrait vous intéresser demain dans nos ventes. 
                        Nous vous ferons des suggestions totalement personnalisées
                      </p>
                    </div>

                    {/* Newsletter */}
                    <div>
                      <p className="font-serif text-sm font-medium mb-1 text-brand-gold">
                        Newsletter
                      </p>
                      <p className="text-xs text-white/80 leading-relaxed">
                        Recevez notre sélection mensuelle et les temps forts à venir
                      </p>
                    </div>
                  </div>

                  {/* Bouton */}
                  <div className="mt-6 text-center">
                    <Link
                      to="/auth"
                      className="inline-block border border-brand-gold bg-brand-gold text-brand-gold-foreground px-6 py-2 font-sans text-xs tracking-widest hover:bg-brand-gold/90 transition-colors"
                    >
                      CRÉER MON COMPTE
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Belles Enchères Carousel */}
        <section className="py-8 md:py-12 bg-[hsl(var(--brand-primary))]">
          <div className="container">
            <h2 className="section-title mb-12 text-white border-white">RECORDS D'ENCHÈRES</h2>
            <div 
              className="relative"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div 
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              >
                {topResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-64 snap-start cursor-pointer"
                    onClick={() => setSelectedResult(result)}
                  >
                    <ResultCard {...result} variant="light" />
                  </div>
                ))}
              </div>
              {/* Navigation arrows */}
              <button 
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 border border-white bg-transparent text-white flex items-center justify-center hover:bg-white hover:text-[hsl(var(--brand-primary))] transition-colors hidden md:flex"
                onClick={() => carouselRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 border border-white bg-transparent text-white flex items-center justify-center hover:bg-white hover:text-[hsl(var(--brand-primary))] transition-colors hidden md:flex"
                onClick={() => carouselRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>

        {/* Lightbox for Belles Enchères */}
        <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
          <DialogContent className="max-w-3xl p-0 bg-background border-none">
            <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-6 w-6 text-foreground" />
              <span className="sr-only">Fermer</span>
            </DialogClose>
            {selectedResult && (
              <div className="flex flex-col">
                <div className="aspect-square w-full bg-muted">
                  <img
                    src={selectedResult.imageUrl}
                    alt={selectedResult.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 text-center">
                  {selectedResult.artist && (
                    <p className="font-sans text-sm text-muted-foreground tracking-wide mb-1">
                      {selectedResult.artist}
                    </p>
                  )}
                  <h3 className="font-serif text-xl font-medium mb-2">
                    {selectedResult.title}
                  </h3>
                  <p className="font-serif text-2xl font-semibold text-brand-primary">
                    {selectedResult.price}
                  </p>
                  {selectedResult.date && (
                    <p className="font-sans text-xs text-muted-foreground mt-2">
                      Vendu le {selectedResult.date}
                    </p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Section Réseaux Sociaux */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container">
            {/* Titre principal */}
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="font-serif text-base md:text-lg font-light leading-relaxed text-foreground">
                Pour faire briller les ventes de vos objets, nous sommes actifs sur différents réseaux sociaux.
              </p>
              <p className="font-serif text-sm md:text-base font-light leading-relaxed text-muted-foreground mt-2">
                Pour tout savoir de nos actualités, rejoignez-nous.
              </p>
            </div>

            {/* Grille de publications façon mosaïque - masquée sur mobile */}
            <div className="hidden md:grid grid-cols-4 gap-6 max-w-5xl mx-auto">
              {/* Instagram - Post vertical */}
              <a 
                href="https://instagram.com/12pages" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative col-span-1 row-span-2 overflow-hidden rounded-lg aspect-[3/4] md:aspect-auto grayscale hover:grayscale-0 transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <img 
                  src={recordTinguelySculpture}
                  alt="Post Instagram"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                      <path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4z"/>
                    </svg>
                    <span className="text-white text-xs font-medium">@12pages</span>
                  </div>
                  <p className="text-white text-xs leading-relaxed line-clamp-2">
                    Nouvelle vente d'art moderne samedi ! Ne manquez pas cette sculpture exceptionnelle...
                  </p>
                </div>
              </a>

              {/* Facebook - Post carré */}
              <a 
                href="https://facebook.com/12pages" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-lg aspect-square grayscale hover:grayscale-0 transition-all duration-500"
              >
                <div className="absolute inset-0 bg-[#1877F2] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <img 
                  src={hotelDesVentesEquipe}
                  alt="Post Facebook"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="text-white text-[10px] font-medium">12 Pages</span>
                  </div>
                  <p className="text-white text-[10px] leading-relaxed line-clamp-2">
                    L'équipe vous accueille du lundi au vendredi...
                  </p>
                </div>
              </a>

              {/* YouTube - Video preview */}
              <a 
                href="https://youtube.com/@12pages" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-lg aspect-square grayscale hover:grayscale-0 transition-all duration-500"
              >
                <div className="absolute inset-0 bg-[#FF0000]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <img 
                  src={recordJaguarXK120}
                  alt="Vidéo YouTube"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                {/* Bouton play */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-foreground/80 group-hover:bg-[#FF0000] flex items-center justify-center group-hover:scale-110 transition-all duration-500">
                    <svg className="w-5 h-5 text-background group-hover:text-white ml-0.5 transition-colors duration-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-[10px] leading-relaxed line-clamp-2">
                    Record : Jaguar XK120 adjugée 125 000 €
                  </p>
                </div>
              </a>

              {/* Pinterest - Épingle */}
              <a 
                href="https://pinterest.com/12pages" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative row-span-2 overflow-hidden rounded-lg aspect-[3/4] md:aspect-auto grayscale hover:grayscale-0 transition-all duration-500"
              >
                <div className="absolute inset-0 bg-[#E60023]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <img 
                  src={recordCesarCompression}
                  alt="Épingle Pinterest"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <div className="w-8 h-8 rounded-full bg-foreground/80 group-hover:bg-[#E60023] flex items-center justify-center transition-all duration-500">
                    <svg className="w-4 h-4 text-background group-hover:text-white transition-colors duration-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-xs leading-relaxed line-clamp-2">
                    César Baldaccini - Compression automobile, art contemporain
                  </p>
                </div>
              </a>

              {/* LinkedIn - Post professionnel */}
              <a 
                href="https://linkedin.com/company/12pages" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative col-span-2 overflow-hidden rounded-lg aspect-[2/1] grayscale hover:grayscale-0 transition-all duration-500"
              >
                <div className="absolute inset-0 bg-foreground/90 group-hover:bg-[#0A66C2] transition-colors duration-500" />
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-background group-hover:text-white transition-colors duration-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="text-background group-hover:text-white text-xs font-medium transition-colors duration-500">Douze pages & associés</span>
                  </div>
                  <div>
                    <p className="text-background group-hover:text-white text-sm font-medium mb-1 transition-colors duration-500">
                      Rejoignez notre réseau professionnel
                    </p>
                    <p className="text-background/80 group-hover:text-white/80 text-xs leading-relaxed transition-colors duration-500">
                      Ventes aux enchères • Expertises • Art et patrimoine en Corse
                    </p>
                  </div>
                </div>
              </a>
            </div>

            {/* Boutons réseaux - affichés sur mobile, fallback sur desktop */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:mt-10">
              <a 
                href="https://instagram.com/12pages" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-foreground/20 hover:border-brand-gold hover:text-brand-gold transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                  <path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4z"/>
                </svg>
                Instagram
              </a>
              <a 
                href="https://facebook.com/12pages" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-foreground/20 hover:border-brand-gold hover:text-brand-gold transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </a>
              <a 
                href="https://youtube.com/@12pages" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-foreground/20 hover:border-brand-gold hover:text-brand-gold transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube
              </a>
              <a 
                href="https://pinterest.com/12pages" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-foreground/20 hover:border-brand-gold hover:text-brand-gold transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                </svg>
                Pinterest
              </a>
              <a 
                href="https://linkedin.com/company/12pages" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-foreground/20 hover:border-brand-gold hover:text-brand-gold transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </section>

        {/* Avis Clients - Ils nous ont fait confiance */}
        <TestimonialsCarousel />

        <Footer />
      </main>
    </div>
  );
};

export default Index;
