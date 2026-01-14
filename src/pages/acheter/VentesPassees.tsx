import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Loader2, Search, X, MoreHorizontal, Archive } from "lucide-react";
import TimelineLayout from "@/components/TimelineLayout";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Images des spécialités (menu)
import imgArgenterie from "@/assets/menu/argenterie.png";
import imgArtModerne from "@/assets/menu/art-moderne.png";
import imgBijouxMontres from "@/assets/menu/bijoux-montres.png";
import imgCollections from "@/assets/menu/collections.png";
import imgVins from "@/assets/menu/vins-spiritueux.png";
import imgMobilier from "@/assets/menu/mobilier.png";
import imgModeTextile from "@/assets/menu/mode-textile.png";
import imgVoitures from "@/assets/menu/voitures.png";

// Images thématiques pour les fallbacks (plus grandes et détourées)
import imgBijouFallback from "@/assets/pendentif-email-detoured.png";
import imgVinFallback from "@/assets/bouteille-petrus.png";
import imgModeFallback from "@/assets/fond-robes-acheter.png";
import imgArtFallback from "@/assets/lithographie-moderne.png";
import imgMobilierFallback from "@/assets/vase-camille-faure-detoured.png";
import imgVoitureFallback from "@/assets/record-jaguar-xk120.png";
import imgArgenterieFallback from "@/assets/menu/argenterie.png";
import imgCollectionsFallback from "@/assets/grenier-tresor-illustration.png";
import imgDefaultFallback from "@/assets/coup-de-marteau-illustration.png";

// Mapping spécialité → classe d'ombre colorée
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

// Mapping spécialité → image de fallback thématique
const getSpecialtyFallbackImage = (specialty?: string | null, title?: string): string => {
  const normalizedSpecialty = specialty?.toLowerCase() || '';
  const normalizedTitle = title?.toLowerCase() || '';
  const combined = `${normalizedSpecialty} ${normalizedTitle}`;
  
  // Arts d'Asie, Orient, Japon
  if (combined.includes("asie") || combined.includes("japon") || combined.includes("chine") || combined.includes("orient") || combined.includes("arabe") || combined.includes("africain") || combined.includes("indien")) {
    return imgMobilierFallback; // Vase pour arts asiatiques/orientaux
  }
  // Art Moderne, Contemporain, Peinture  
  if (combined.includes("art") || combined.includes("moderne") || combined.includes("contemporain") || combined.includes("xxe") || combined.includes("xxème") || combined.includes("tableau") || combined.includes("peinture") || combined.includes("1900") || combined.includes("sculpture") || combined.includes("estampe")) {
    return imgArtFallback;
  }
  // Bijoux et Montres
  if (combined.includes("bijoux") || combined.includes("montre") || combined.includes("joaillerie") || combined.includes("or") || combined.includes("diamant")) {
    return imgBijouFallback;
  }
  // Vins et Spiritueux
  if (combined.includes("vin") || combined.includes("spiritueux") || combined.includes("champagne") || combined.includes("cru") || combined.includes("bordeaux") || combined.includes("bourgogne")) {
    return imgVinFallback;
  }
  // Mode et Textile
  if (combined.includes("mode") || combined.includes("textile") || combined.includes("vintage") || combined.includes("couture") || combined.includes("hermès") || combined.includes("vuitton") || combined.includes("luxe") || combined.includes("maroquinerie")) {
    return imgModeFallback;
  }
  // Mobilier et Objets d'Art
  if (combined.includes("mobilier") || combined.includes("objet") || combined.includes("design") || combined.includes("céramique") || combined.includes("meuble")) {
    return imgMobilierFallback;
  }
  // Voitures de Collection
  if (combined.includes("véhicule") || combined.includes("voiture") || combined.includes("automobile") || combined.includes("moto") || combined.includes("auto")) {
    return imgVoitureFallback;
  }
  // Argenterie
  if (combined.includes("argent") || combined.includes("orfèvrerie")) {
    return imgArgenterieFallback;
  }
  // Collections et Militaria
  if (combined.includes("collection") || combined.includes("curiosité") || combined.includes("militaria") || combined.includes("arme") || combined.includes("livre") || combined.includes("manuscrit")) {
    return imgCollectionsFallback;
  }
  // Ventes générales, inaugurales, etc.
  if (combined.includes("vente") || combined.includes("inaugur") || combined.includes("divers") || combined.includes("général")) {
    return imgCollectionsFallback; // Grenier pour ventes diverses
  }
  
  return imgArtFallback; // Art par défaut plutôt que marteau
};

interface PastSale {
  id: string;
  title: string;
  sale_date: string;
  lot_count: number | null;
  cover_image_url: string | null;
  sale_url: string;
  specialty: string | null;
}

// Composant de carte de vente compacte avec date intégrée
const SaleCard = ({ 
  sale, 
  shadowClass, 
  fallbackImage 
}: { 
  sale: PastSale; 
  shadowClass: string; 
  fallbackImage: string;
}) => {
  const [imageError, setImageError] = useState(false);
  const showFallback = !sale.cover_image_url || imageError;

  // Formater la date
  const formattedDate = sale.sale_date 
    ? format(parseISO(sale.sale_date), "d MMM yyyy", { locale: fr })
    : "Date à définir";

  return (
    <Link
      to={`/vente/${sale.id}`}
      className={`relative block ${shadowClass} bg-card group w-36 md:w-40`}
    >
      {/* Date intégrée en haut de la carte */}
      <div className="bg-foreground text-background px-2 py-1 text-center">
        <span className="font-serif text-xs font-medium tracking-wide">
          {formattedDate}
        </span>
      </div>
      
      {/* Image plus compacte */}
      <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 relative">
        {showFallback ? (
          <div className="w-full h-full flex items-center justify-center p-4 relative bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <img 
              src={fallbackImage} 
              alt={sale.title}
              className="max-w-[80%] max-h-[80%] object-contain opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
            />
          </div>
        ) : (
          <img 
            src={sale.cover_image_url!} 
            alt={sale.title}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      
      {/* Titre compact */}
      <div className="p-2 bg-card">
        <h4 className="font-serif text-[10px] md:text-[11px] font-medium text-center tracking-wide line-clamp-2 uppercase leading-tight">
          {sale.title}
        </h4>
      </div>
    </Link>
  );
};


interface TimelineEvent {
  id: string;
  type: "vente-live" | "vente-chrono" | "vente-preparation" | "exposition" | "veille-exposition" | "expertise";
  title: string;
  date: Date;
  endDate?: Date;
  time?: string;
  link?: string;
}

// Spécialités avec images pour le menu horizontal
const SPECIALITES_MENU = [
  { value: "bijoux-montres", label: "Bijoux et Montres", image: imgBijouxMontres },
  { value: "art-moderne", label: "Art Moderne", image: imgArtModerne },
  { value: "mobilier", label: "Mobilier\nObjets d'art", image: imgMobilier },
  { value: "vins", label: "Vins", image: imgVins },
  { value: "argenterie", label: "Argenterie", image: imgArgenterie },
  { value: "voitures", label: "Voitures", image: imgVoitures },
  { value: "mode", label: "Mode", image: imgModeTextile },
  { value: "collections", label: "Collections", image: imgCollections },
];

// Spécialités pour le filtre select
const SPECIALITES = [
  { value: "all", label: "Toutes les spécialités" },
  { value: "bijoux-montres", label: "Bijoux et Montres" },
  { value: "art-moderne", label: "Art Moderne et Contemporain" },
  { value: "mobilier", label: "Mobilier Objets d'art" },
  { value: "vins", label: "Vins et Spiritueux" },
  { value: "livres", label: "Livres et Manuscrits" },
  { value: "asie", label: "Arts d'Asie" },
  { value: "argenterie", label: "Argenterie et Orfèvrerie" },
  { value: "voitures", label: "Voitures de Collection" },
  { value: "militaria", label: "Militaria et Armes anciennes" },
  { value: "ceramiques", label: "Céramiques" },
  { value: "mode", label: "Mode et Textile" },
  { value: "collections", label: "Collections et Curiosités" },
];

// Mots-clés de filtrage par spécialité (défini hors composant pour stabilité)
const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  "bijoux-montres": ["bijoux", "montre", "joaillerie", "horlogerie", "or", "diamant", "bague", "collier", "bracelet"],
  "art-moderne": ["art moderne", "art contemporain", "contemporain", "xxe", "xxème", "tableau", "peinture", "sculpture", "1900", "estampe", "lithographie", "grands maîtres", "oeuvre"],
  "mobilier": ["mobilier", "meuble", "objet", "design", "intérieur", "caractère", "céramique"],
  "vins": ["vin", "spiritueux", "champagne", "cru", "bordeaux", "bourgogne", "millésime"],
  "argenterie": ["argent", "argenterie", "orfèvrerie", "vermeil"],
  "voitures": ["véhicule", "voiture", "automobile", "auto", "moto"],
  "mode": ["mode", "textile", "vintage", "couture", "hermès", "vuitton", "luxe", "maroquinerie", "accessoire"],
  "collections": ["collection", "curiosité", "militaria", "arme", "livre", "manuscrit", "numismatique", "philatélie", "tribal", "instrument"],
  "autres": [] // Spécial : tout ce qui ne match pas les autres
};

const VentesPassees = () => {
  const [pastSales, setPastSales] = useState<PastSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtres
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");


  useEffect(() => {
    const fetchPastSales = async () => {
      setIsLoading(true);
      try {
        const today = new Date().toISOString();
        const { data, error } = await supabase
          .from('interencheres_sales')
          .select('id, title, sale_date, lot_count, cover_image_url, sale_url, specialty')
          .lt('sale_date', today)
          .order('sale_date', { ascending: false });

        if (error) {
          console.error('Error fetching past sales:', error);
        } else {
          setPastSales(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPastSales();
  }, []);

  // Extraire les années disponibles
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    pastSales.forEach(sale => {
      if (sale.sale_date) {
        years.add(format(parseISO(sale.sale_date), 'yyyy'));
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [pastSales]);


  // Filtrer les ventes
  const filteredSales = useMemo(() => {
    return pastSales.filter(sale => {
      // Filtre par année
      if (selectedYear !== "all" && sale.sale_date) {
        const saleYear = format(parseISO(sale.sale_date), 'yyyy');
        if (saleYear !== selectedYear) return false;
      }
      
      // Filtre par spécialité avec mots-clés
      if (selectedSpecialty !== "all") {
        const specialty = sale.specialty?.toLowerCase() || '';
        const title = sale.title.toLowerCase();
        const combined = `${specialty} ${title}`;
        
        if (selectedSpecialty === "autres") {
          // "Autres" = ne correspond à aucune spécialité principale
          const allKeywords = Object.entries(SPECIALTY_KEYWORDS)
            .filter(([key]) => key !== "autres")
            .flatMap(([, keywords]) => keywords);
          const matchesAny = allKeywords.some(keyword => combined.includes(keyword));
          if (matchesAny) return false;
        } else {
          const keywords = SPECIALTY_KEYWORDS[selectedSpecialty] || [];
          const matchesSpecialty = keywords.some(keyword => combined.includes(keyword));
          if (!matchesSpecialty) return false;
        }
      }
      
      // Filtre par mot-clé
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase().trim();
        const title = sale.title.toLowerCase();
        if (!title.includes(keyword)) return false;
      }
      
      return true;
    });
  }, [pastSales, selectedYear, selectedSpecialty, searchKeyword]);

  // Grouper par année pour l'affichage
  const salesByYear = useMemo(() => {
    const grouped: Record<string, PastSale[]> = {};
    
    filteredSales.forEach(sale => {
      if (sale.sale_date) {
        const year = format(parseISO(sale.sale_date), 'yyyy');
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(sale);
      }
    });

    const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
    return sortedYears.map(year => ({ year, sales: grouped[year] }));
  }, [filteredSales]);

  // Timeline events from past sales (for navigation)
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    return pastSales.slice(0, 20).map(sale => ({
      id: sale.id,
      type: "vente-live" as const,
      title: sale.title,
      date: sale.sale_date ? parseISO(sale.sale_date) : new Date(),
      link: `/vente/${sale.id}`
    }));
  }, [pastSales]);

  const clearFilters = () => {
    setSelectedYear("all");
    setSelectedSpecialty("all");
    setSearchKeyword("");
  };

  const hasActiveFilters = selectedYear !== "all" || selectedSpecialty !== "all" || searchKeyword.trim() !== "";

  return (
    <>
      <Helmet>
        <title>Ventes Passées et Résultats | Douze pages & associés</title>
        <meta name="description" content="Découvrez les résultats de nos ventes aux enchères passées et nos plus belles adjudications." />
      </Helmet>

      <TimelineLayout pageTitle="Ventes Passées" mode="acheter" hideTimeline>
        {/* Menu spécialités horizontal - STICKY (aligné sous le titre) */}
        <section
          className="sticky z-[44] py-3 border-b border-border bg-background shadow-sm"
          style={{ top: "calc(var(--header-sticky-top, 163px) - 25px + var(--timeline-title-sticky-height, 40px) - 5px)" }}
        >
          <div className="container mx-auto px-4">
            {/* Version Desktop */}
            <div className="hidden md:flex items-center justify-center gap-6">
              {/* Filtre années - gauche */}
              <div className="shrink-0">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px] h-9 text-xs">
                    <SelectValue placeholder="Années" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Années</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Menu spécialités horizontal avec photos - centre */}
              <div className="flex flex-wrap items-center justify-center gap-6">
                {SPECIALITES_MENU.map((spec) => (
                  <button
                    key={spec.value}
                    onClick={() => setSelectedSpecialty(selectedSpecialty === spec.value ? "all" : spec.value)}
                    className={`flex flex-col items-center gap-1 group transition-all ${
                      selectedSpecialty === spec.value ? "opacity-100 scale-105" : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <div className={`w-[70px] h-[70px] flex items-center justify-center overflow-hidden rounded-full border-2 transition-all ${
                      selectedSpecialty === spec.value ? "border-gray-900 shadow-md" : "border-transparent hover:border-gray-400 hover:shadow-sm"
                    }`}>
                      <img 
                        src={spec.image} 
                        alt={spec.label}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className={`text-xs tracking-tight text-center transition-colors max-w-[80px] leading-tight whitespace-pre-line ${
                      selectedSpecialty === spec.value ? "text-gray-900 font-medium" : "text-gray-600"
                    }`}>
                      {spec.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Recherche par mot-clé - droite */}
              <div className="relative shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Mot-clé"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-8 w-[160px] h-9 text-xs"
                />
              </div>
            </div>

            {/* Version Mobile */}
            <div className="md:hidden space-y-3">
              {/* Ligne 1 : Année + Mot-clé */}
              <div className="flex items-center gap-2">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[90px] h-9 text-xs">
                    <SelectValue placeholder="Années" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Années</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Mot-clé"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
              </div>

              {/* Ligne 2-3 : Spécialités en grille 4 colonnes (2 lignes) - masque les non-sélectionnées */}
              <div className="grid grid-cols-4 gap-2 justify-items-center">
                {SPECIALITES_MENU.map((spec) => {
                  const isSelected = selectedSpecialty === spec.value;
                  const hasSelection = selectedSpecialty !== "all";
                  
                  // Si une spécialité est sélectionnée, masquer les autres
                  if (hasSelection && !isSelected) return null;
                  
                  return (
                    <button
                      key={spec.value}
                      onClick={() => setSelectedSpecialty(isSelected ? "all" : spec.value)}
                      className={`flex flex-col items-center gap-1 group transition-all ${
                        isSelected ? "opacity-100 col-span-4" : "opacity-70"
                      }`}
                    >
                      <div className={`w-10 h-10 flex items-center justify-center overflow-hidden rounded-full border-2 transition-all ${
                        isSelected ? "border-gray-900 shadow-md" : "border-transparent"
                      }`}>
                        <img 
                          src={spec.image} 
                          alt={spec.label}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <span className={`text-[10px] tracking-tight text-center transition-colors leading-tight ${
                        isSelected ? "text-gray-900 font-medium" : "text-gray-600"
                      }`}>
                        {spec.label.replace('\n', ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bouton réinitialiser */}
            {hasActiveFilters && (
              <div className="flex items-center justify-center mt-3">
                <Button variant="outline" size="sm" onClick={clearFilters} className="shrink-0 h-8 text-xs">
                  <X className="w-3 h-3 mr-1" />
                  Réinitialiser
                </Button>
              </div>
            )}
          </div>
        </section>


        {/* Ventes Passées par Année */}
        <section className="py-10 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <span className="ml-3 text-muted-foreground">Chargement des ventes...</span>
              </div>
            ) : salesByYear.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p>Aucune vente trouvée avec ces critères.</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Voir toutes les ventes
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                {salesByYear.map(({ year, sales }) => (
                  <div key={year}>
                    {/* Titre de l'année discret */}
                    <div className="flex items-center gap-3 mb-5">
                      <span className="font-serif text-lg text-muted-foreground font-light">
                        {year}
                      </span>
                      <div className="flex-1 h-px bg-border/50"></div>
                      <span className="text-xs text-muted-foreground">
                        {sales.length} vente{sales.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6">
                      {sales.map((sale) => {
                        const shadowClass = getSpecialtyShadowClass(sale.specialty);
                        const fallbackImage = getSpecialtyFallbackImage(sale.specialty, sale.title);
                        return (
                          <SaleCard
                            key={sale.id}
                            sale={sale}
                            shadowClass={shadowClass}
                            fallbackImage={fallbackImage}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Estimation */}
        <section className="pt-10 md:pt-12 pb-0">
          <div className="bg-gray-900 text-white p-6 md:p-10 text-center card-shadow">
            <h2 className="font-serif text-lg md:text-xl font-light mb-6">
              Et si le trésor que vous cherchez se trouvait dans votre grenier ?
            </h2>
            <Link 
              to="/contact"
              className="inline-block bg-white text-gray-900 px-8 py-3 font-sans text-xs tracking-widest hover:bg-gray-100 transition-colors"
            >
              ESTIMATION GRATUITE
            </Link>
          </div>
        </section>

        <Footer />
      </TimelineLayout>
    </>
  );
};

export default VentesPassees;
