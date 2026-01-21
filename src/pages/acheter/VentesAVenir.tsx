import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { format, parseISO, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Loader2, Plus, Monitor, Users, Clock, ChevronDown, Gavel } from "lucide-react";
import TimelineLayout from "@/components/TimelineLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getDemoNow } from "@/lib/site-config";

// Images des spécialités (menu)
import imgArgenterie from "@/assets/menu/argenterie.png";
import imgArtModerne from "@/assets/menu/art-moderne.png";
import imgBijouxMontres from "@/assets/menu/bijoux-montres.png";
import imgCollections from "@/assets/menu/collections.png";
import imgVins from "@/assets/menu/vins-spiritueux.png";
import imgMobilier from "@/assets/menu/mobilier.png";
import imgModeTextile from "@/assets/menu/mode-textile.png";
import imgVoitures from "@/assets/menu/voitures.png";

// Spécialités avec images pour le menu horizontal
const SPECIALITES_MENU = [
  { value: "bijoux-montres", label: "Bijoux", image: imgBijouxMontres },
  { value: "art-moderne", label: "Art", image: imgArtModerne },
  { value: "mobilier", label: "Mobilier", image: imgMobilier },
  { value: "vins", label: "Vins", image: imgVins },
  { value: "argenterie", label: "Argenterie", image: imgArgenterie },
  { value: "voitures", label: "Voitures", image: imgVoitures },
  { value: "mode", label: "Mode", image: imgModeTextile },
  { value: "collections", label: "Collections", image: imgCollections },
];

// Mots-clés de filtrage par spécialité
const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  "bijoux-montres": ["bijoux", "montre", "joaillerie", "horlogerie", "or", "diamant", "bague", "collier", "bracelet"],
  "art-moderne": ["art moderne", "art contemporain", "contemporain", "xxe", "xxème", "tableau", "peinture", "sculpture", "1900", "estampe", "lithographie", "grands maîtres", "oeuvre"],
  "mobilier": ["mobilier", "meuble", "objet", "design", "intérieur", "caractère", "céramique"],
  "vins": ["vin", "spiritueux", "champagne", "cru", "bordeaux", "bourgogne", "millésime"],
  "argenterie": ["argent", "argenterie", "orfèvrerie", "vermeil"],
  "voitures": ["véhicule", "voiture", "automobile", "auto", "moto"],
  "mode": ["mode", "textile", "vintage", "couture", "hermès", "vuitton", "luxe", "maroquinerie", "accessoire"],
  "collections": ["collection", "curiosité", "militaria", "arme", "livre", "manuscrit", "numismatique", "philatélie", "tribal", "instrument"],
};

interface Sale {
  id: string;
  title: string;
  sale_date: string;
  lot_count: number | null;
  cover_image_url: string | null;
  sale_url: string;
  sale_type: string | null;
  specialty: string | null;
  status: string | null;
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

// Calcule le temps restant avant une date
const getTimeRemaining = (targetDate: Date, now: Date) => {
  const totalMinutes = differenceInMinutes(targetDate, now);
  if (totalMinutes <= 0) return null;
  
  const days = differenceInDays(targetDate, now);
  const hours = differenceInHours(targetDate, now) % 24;
  const minutes = totalMinutes % 60;
  
  return { days, hours, minutes };
};

// Composant compteur
const CountdownOverlay = ({ saleDate }: { saleDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  
  useEffect(() => {
    const targetDate = parseISO(saleDate);
    
    const updateCountdown = () => {
      const remaining = getTimeRemaining(targetDate, getDemoNow());
      setTimeLeft(remaining);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    
    return () => clearInterval(interval);
  }, [saleDate]);
  
  if (!timeLeft) return null;
  
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-foreground/85 text-background px-3 py-1.5 z-20">
      <div className="flex items-center gap-1 font-sans text-xs tracking-wider">
        <span className="font-bold">{timeLeft.days}</span>
        <span className="opacity-70">j</span>
        <span className="mx-0.5">:</span>
        <span className="font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="opacity-70">h</span>
        <span className="mx-0.5">:</span>
        <span className="font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="opacity-70">m</span>
      </div>
    </div>
  );
};

// Composant carte de vente
const SaleCard = ({ sale, showCountdown = false }: { sale: Sale; showCountdown?: boolean }) => {
  const shadowClass = getSpecialtyShadowClass(sale.specialty);
  
  return (
    <Link
      to={`/vente/${sale.id}`}
      className={`relative block ${shadowClass} bg-card group w-40 md:w-48 flex-shrink-0`}
    >
      <div className="aspect-[3/4] bg-muted overflow-hidden relative">
        {sale.cover_image_url ? (
          <img
            src={sale.cover_image_url}
            alt={sale.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-brand-museum">
            <Calendar className="w-12 h-12 opacity-30" />
          </div>
        )}
        {showCountdown && sale.sale_date && <CountdownOverlay saleDate={sale.sale_date} />}
      </div>
      <div className="p-3 bg-card">
        <h3 className="font-serif text-[11px] md:text-xs font-medium text-center tracking-wide mb-1 line-clamp-2 uppercase">
          {sale.title.replace(/^vente\s*/i, "")}
        </h3>
        <p className="font-sans text-[10px] md:text-xs text-muted-foreground text-center">
          {sale.sale_date
            ? format(parseISO(sale.sale_date), "d MMM yyyy", { locale: fr })
            : "Date à définir"}
        </p>
      </div>
    </Link>
  );
};

// Composant section avec layout en colonnes
const SaleCategoryRow = ({ 
  icon: Icon,
  title, 
  description, 
  sales, 
  showCountdown = false,
  action
}: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string; 
  description: React.ReactNode; 
  sales: Sale[]; 
  showCountdown?: boolean;
  action?: React.ReactNode;
}) => {
  if (sales.length === 0) return null;
  
  return (
    <div className="border-b border-neutral-200 py-10 md:py-14 last:border-b-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Colonne gauche : explication */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="lg:sticky lg:top-40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand-primary" />
              </div>
              <h2 className="font-serif text-base md:text-lg font-medium">{title}</h2>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              {description}
            </div>
            {action && <div className="mt-5">{action}</div>}
          </div>
        </div>
        
        {/* Colonne droite : cartes de ventes */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="flex flex-wrap justify-center lg:justify-start gap-6 md:gap-8">
            {sales.map((sale) => (
              <SaleCard key={sale.id} sale={sale} showCountdown={showCountdown} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const VentesAVenir = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [showSpecialtyMenu, setShowSpecialtyMenu] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      setIsLoading(true);
      try {
        const demoDate = getDemoNow();
        const { data, error } = await supabase
          .from('interencheres_sales')
          .select('id, title, sale_date, lot_count, cover_image_url, sale_url, sale_type, specialty, status')
          .or(`sale_date.gte.${demoDate.toISOString()},sale_date.is.null`)
          .order('sale_date', { ascending: true });

        if (error) {
          console.error('Error fetching sales:', error);
        } else {
          setSales(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSales();
  }, []);

  // Filtrer les ventes par spécialité
  const filteredSales = useMemo(() => {
    if (selectedSpecialty === "all") return sales;
    
    const keywords = SPECIALTY_KEYWORDS[selectedSpecialty] || [];
    return sales.filter(sale => {
      const specialty = sale.specialty?.toLowerCase() || '';
      const title = sale.title.toLowerCase();
      const combined = `${specialty} ${title}`;
      return keywords.some(keyword => combined.includes(keyword));
    });
  }, [sales, selectedSpecialty]);

  // Catégoriser les ventes filtrées
  // Règle : moins de 4 lots ET date à plus de 2 semaines = vente en préparation
  const categorizeSales = () => {
    const liveSales: Sale[] = [];
    const roomOnlySales: Sale[] = [];
    const chronoSales: Sale[] = [];
    const preparationSales: Sale[] = [];
    const now = getDemoNow();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    filteredSales.forEach(sale => {
      const saleType = (sale.sale_type || "").toLowerCase();
      const status = (sale.status || "").toLowerCase();
      const lotCount = sale.lot_count ?? 0;
      const saleDate = sale.sale_date ? parseISO(sale.sale_date) : null;
      
      // Vérifier si c'est une vente en préparation :
      // - statut explicite "préparation" OU
      // - moins de 4 lots ET date à plus de 2 semaines
      const isInPreparation = 
        status.includes("préparation") || 
        status.includes("preparation") ||
        (lotCount < 4 && saleDate && saleDate > twoWeeksFromNow);
      
      if (isInPreparation) {
        preparationSales.push(sale);
      }
      // Vente chrono (online only)
      else if (saleType.includes("chrono") || saleType.includes("online")) {
        chronoSales.push(sale);
      }
      // Vente en salle uniquement
      else if (saleType === "salle") {
        roomOnlySales.push(sale);
      }
      // Vente live (salle + online) - par défaut pour les sales avec type "live" ou sans type
      else if (saleType.includes("live") || saleType.includes("interactif") || saleType === "" || !saleType) {
        liveSales.push(sale);
      }
      else {
        liveSales.push(sale);
      }
    });

    return { liveSales, roomOnlySales, chronoSales, preparationSales };
  };

  const { liveSales, roomOnlySales, chronoSales, preparationSales } = categorizeSales();

  // Vente judiciaire fictive (présente uniquement sur cette page)
  const judiciarySales: Sale[] = [
    {
      id: "judiciaire-demo-001",
      title: "Liquidation SARL Menuiserie du Sud",
      sale_date: new Date(getDemoNow().getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(), // +12 jours
      lot_count: 87,
      cover_image_url: "/images/sales/judiciaire-menuiserie.jpg",
      sale_url: "#",
      sale_type: "judiciaire",
      specialty: "Matériel professionnel",
      status: "à venir"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Ventes à Venir | Douze pages & associés</title>
        <meta name="description" content="Découvrez nos prochaines ventes aux enchères. Bijoux, art, mobilier et plus." />
      </Helmet>

      <TimelineLayout 
        pageTitle={
          <span className="flex items-center gap-3">
            Ventes à Venir
            <button
              onClick={() => {
                if (showSpecialtyMenu) {
                  // Fermer le menu = réinitialiser le filtre
                  setSelectedSpecialty("all");
                  setShowSpecialtyMenu(false);
                } else {
                  setShowSpecialtyMenu(true);
                }
              }}
              className="inline-flex items-center gap-1 text-sm font-sans font-normal tracking-wide text-muted-foreground hover:text-foreground transition-colors"
            >
              Spécialités
              <ChevronDown className={`w-4 h-4 transition-transform ${showSpecialtyMenu ? "rotate-180" : ""}`} />
            </button>
          </span>
        } 
        mode="acheter" 
        hideTimeline={false}
      >
        {/* Menu spécialités déroulant */}
        {showSpecialtyMenu && (
          <div className="border-b border-border bg-background py-4">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                {SPECIALITES_MENU.map((spec) => (
                  <button
                    key={spec.value}
                    onClick={() => {
                      setSelectedSpecialty(selectedSpecialty === spec.value ? "all" : spec.value);
                    }}
                    className={`flex flex-col items-center gap-1 group transition-all ${
                      selectedSpecialty === spec.value ? "opacity-100 scale-105" : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <div className={`w-[60px] h-[60px] md:w-[70px] md:h-[70px] flex items-center justify-center overflow-hidden rounded-full border-2 transition-all grayscale ${
                      selectedSpecialty === spec.value ? "border-gray-900 shadow-md" : "border-transparent hover:border-gray-400 hover:shadow-sm"
                    }`}>
                      <img 
                        src={spec.image} 
                        alt={spec.label}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className={`text-xs tracking-tight text-center transition-colors max-w-[80px] leading-tight ${
                      selectedSpecialty === spec.value ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}>
                      {spec.label}
                    </span>
                  </button>
                ))}
                {/* Bouton "Toutes" */}
                {selectedSpecialty !== "all" && (
                  <button
                    onClick={() => {
                      setSelectedSpecialty("all");
                      setShowSpecialtyMenu(false);
                    }}
                    className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-all"
                  >
                    <div className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 hover:border-gray-600">
                      <span className="text-xs text-muted-foreground">✕</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Toutes</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <section className="pt-4 pb-12 md:pt-6 md:pb-16">
          <div className="container mx-auto px-4 max-w-7xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <span className="ml-3 text-muted-foreground">Chargement des ventes...</span>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                {selectedSpecialty !== "all" ? (
                  <>
                    <p>Aucune vente à venir dans cette spécialité.</p>
                    <button 
                      onClick={() => setSelectedSpecialty("all")}
                      className="text-sm mt-2 underline hover:no-underline"
                    >
                      Voir toutes les ventes
                    </button>
                  </>
                ) : (
                  <>
                    <p>Aucune vente à venir pour le moment.</p>
                    <p className="text-sm mt-2">Revenez bientôt consulter notre calendrier.</p>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Vente live et en salle - catalogue en ligne */}
                <SaleCategoryRow
                  icon={Monitor}
                  title="Ventes live et en salle"
                  description={
                    <>
                      <p>Le catalogue est consultable en ligne sur Interenchères.</p>
                      <p>Le jour de la vente, enchérissez <strong>en salle</strong>, <strong>par téléphone</strong> ou <strong>en direct</strong> depuis votre ordinateur grâce à notre système de vente live.</p>
                    </>
                  }
                  sales={liveSales}
                />

                {/* Vente chrono en ligne */}
                <SaleCategoryRow
                  icon={Clock}
                  title="Ventes chrono en ligne"
                  description={
                    <>
                      <p>Enchères <strong>100% en ligne</strong> avec une heure de clôture précise pour chaque lot.</p>
                      <p>Placez vos ordres d'achat à l'avance ou enchérissez en direct. Système anti-sniping : prolongation automatique si une enchère arrive dans les dernières minutes.</p>
                    </>
                  }
                  sales={chronoSales}
                  showCountdown
                />

                {/* Ventes judiciaires */}
                <SaleCategoryRow
                  icon={Gavel}
                  title="Ventes judiciaires"
                  description={
                    <>
                      <p>Liquidations de stocks, matériel professionnel, mobilier d'entreprise... Les <strong>ventes judiciaires</strong> concernent principalement les actifs de sociétés en redressement ou liquidation.</p>
                      <p>Souvent destinées aux <strong>professionnels</strong> (lots importants, matériel spécialisé), elles sont ouvertes à tous. Frais réduits : <strong>14,40 % TTC</strong> seulement.</p>
                      <p className="text-xs mt-2 text-brand-gold">Une opportunité de dénicher du matériel de qualité à prix compétitif.</p>
                    </>
                  }
                  sales={judiciarySales}
                />

                {/* Vente en salle uniquement */}
                <SaleCategoryRow
                  icon={Users}
                  title="Ventes en salle uniquement"
                  description={
                    <>
                      <p>Ces ventes se déroulent <strong>exclusivement en salle</strong>. Aucune enchère en ligne n'est possible.</p>
                      <p>Venez découvrir les lots lors de l'exposition ou enchérissez par téléphone le jour de la vente.</p>
                    </>
                  }
                  sales={roomOnlySales}
                />

                {/* Vente en préparation */}
                <SaleCategoryRow
                  icon={Calendar}
                  title="Ventes en préparation"
                  description={
                    <>
                      <p>Ces ventes sont en cours de constitution. Les dates sont fixées pour vous permettre de <strong>nous proposer des lots</strong> à inclure au catalogue.</p>
                      <p>Le catalogue complet sera mis en ligne quelques semaines avant chaque vente.</p>
                    </>
                  }
                  sales={preparationSales}
                  action={
                    <Button variant="outline-brand" size="sm" className="font-sans text-xs tracking-widest" asChild>
                      <Link to="/contact">
                        <Plus className="w-4 h-4 mr-2" />
                        PROPOSER UN LOT
                      </Link>
                    </Button>
                  }
                />
              </>
            )}
          </div>
        </section>

        <Footer />
      </TimelineLayout>
    </>
  );
};

export default VentesAVenir;
