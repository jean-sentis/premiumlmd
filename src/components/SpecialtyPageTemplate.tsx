import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InlinePlanningSlot from "@/components/InlinePlanningSlot";
import { ChevronRight, HelpCircle, Archive, Calendar } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

interface AutreSpecialite {
  id: string;
  title: string;
}

interface BelleEnchere {
  title: string;
  price: string;
  date: string;
  image: string;
  link?: string;
}

interface Expert {
  nom: string;
  titre: string;
  bio: string;
  photo: string; // Photo détourée avec ombres
}

interface SaviezVous {
  question: string;
  reponse: string;
  image: string;
}

interface VenteCard {
  type: "en-ligne" | "preparation";
  titre: string;
  date: string;
  nombreLots?: number;
  lien: string;
  image?: string;
}

interface VentePassee {
  titre: string;
  date: string;
  nombreLots: number;
  image: string;
  lien: string;
}

interface SpecialtyPageTemplateProps {
  // Hero
  title: string;
  mentionAffective: string; // Mention d'intérêt ou de soin
  currentSpecialtyId: string;
  
  // Carrousel belles enchères (8 items)
  bellesEncheres: BelleEnchere[];
  
  // Texte SEO
  seoTitle: string;
  seoContent: React.ReactNode;
  
  // Cartes ventes (optionnel pour Collections)
  ventesCards?: VenteCard[];
  
  // Textes longs détaillés
  detailTitle: string;
  detailContent: React.ReactNode;
  
  // Expert
  expert?: Expert;
  
  // Encadrés Le saviez-vous
  saviezVous?: SaviezVous[];
  
  // Ventes passées (4 max)
  ventesPassees?: VentePassee[];
}

const allSpecialites: AutreSpecialite[] = [
  { id: "argenterie", title: "Argenterie" },
  { id: "art-moderne", title: "Art moderne" },
  { id: "bijoux-montres", title: "Bijoux et montres" },
  { id: "collections", title: "Collections" },
  { id: "vins-spiritueux", title: "Grands Vins et Spiritueux" },
  { id: "mobilier-objets-art", title: "Mobilier, objets d'art et horlogerie" },
  { id: "mode-textile", title: "Mode et textile" },
  { id: "voitures-collection", title: "Voitures de collection" },
];

// Composant pour un item du carrousel avec animation
const CarouselResultItem = ({ item, isActive }: { item: BelleEnchere; isActive: boolean }) => {
  const [showCaption, setShowCaption] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowCaption(false);
      const timer = setTimeout(() => setShowCaption(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowCaption(false);
    }
  }, [isActive]);

  return (
    <div className="relative group cursor-pointer h-full">
      {/* Image - plein écran, recadrée - ratio plus haut pour mieux voir les véhicules */}
      <div className="aspect-[16/10] md:aspect-[16/9] overflow-hidden">
        <img 
          src={item.image} 
          alt={item.title}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      
      {/* Caption avec animation - noir et blanc */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 md:p-10 pt-16 md:pt-24 transition-all duration-500 ${
          showCaption ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <h3 className="text-white font-serif text-xl md:text-2xl mb-2">{item.title}</h3>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-white font-semibold text-lg">{item.price}</p>
              <p className="text-white/60 text-sm">{item.date}</p>
            </div>
            {item.link && (
              <Link 
                to={item.link}
                className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors border-b border-white/40 hover:border-white pb-0.5"
              >
                En savoir plus <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SpecialtyPageTemplate = ({
  title,
  mentionAffective,
  currentSpecialtyId,
  bellesEncheres,
  seoTitle,
  seoContent,
  ventesCards,
  detailTitle,
  detailContent,
  expert,
  saviezVous,
  ventesPassees,
}: SpecialtyPageTemplateProps) => {
  const autresSpecialites = allSpecialites.filter(s => s.id !== currentSpecialtyId);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);
    
    // Autoplay - change slide every 5 seconds
    const autoplayInterval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000);

    return () => {
      carouselApi.off("select", onSelect);
      clearInterval(autoplayInterval);
    };
  }, [carouselApi]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Section 1: Hero - H1 avec mention affective */}
      <section 
        className="pb-8 md:pb-12 bg-background"
        style={{ paddingTop: 'calc(var(--header-height, 145px) + 20px)' }}
      >
        <div className="container">
          <div className="max-w-3xl mx-auto text-center -translate-y-[25px]">
            <h1 className="text-lg md:text-xl font-serif font-semibold text-foreground tracking-widest uppercase mb-4">
              <span className="border-b-2 border-brand-gold-600 pb-1">{title}</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-light">
              {mentionAffective}
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Carrousel des belles enchères */}
      <section className="py-12 md:py-16 bg-brand-gray-blue-deep">
        <div className="container">
          <h2 className="text-center text-lg md:text-xl font-serif text-brand-primary-foreground mb-10">
            Nos Belles Enchères
          </h2>
          
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {bellesEncheres.map((item, index) => (
                <CarouselItem key={index} className="basis-full">
                  <CarouselResultItem 
                    item={item} 
                    isActive={index === currentSlide}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex left-4 bg-brand-primary-foreground/10 border-brand-primary-foreground/20 text-brand-primary-foreground hover:bg-brand-primary-foreground/20" />
            <CarouselNext className="hidden md:flex right-4 bg-brand-primary-foreground/10 border-brand-primary-foreground/20 text-brand-primary-foreground hover:bg-brand-primary-foreground/20" />
          </Carousel>

          {/* Indicateurs - un par image */}
          <div className="flex justify-center gap-2 mt-6">
            {bellesEncheres.map((_, index) => (
              <button
                key={index}
                onClick={() => carouselApi?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentSlide === index 
                    ? 'bg-brand-primary-foreground' 
                    : 'bg-brand-primary-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Slot inline pour le planning - après le carrousel */}
      <InlinePlanningSlot />

      {/* Section 3: Texte SEO */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container max-w-4xl">
          <h2 className="text-lg md:text-xl font-serif text-foreground mb-6 text-center">
            {seoTitle}
          </h2>
          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
            {seoContent}
          </div>
        </div>
      </section>

      {/* Section 4: Cartes ventes (sauf Collections) */}
      {ventesCards && ventesCards.length > 0 && (
        <section className="py-12 md:py-16 bg-background">
          <div className="container">
            <div className="flex flex-wrap justify-center gap-16 md:gap-20 py-6">
              {ventesCards.map((vente, index) => {
                // Mapping spécialité → classe d'ombre
                const getSpecialtyShadowClass = (specialty?: string): string => {
                  if (!specialty) return "card-shadow";
                  const normalizedSpecialty = specialty.toLowerCase();
                  if (normalizedSpecialty.includes("bijoux") || normalizedSpecialty.includes("montre")) return "card-shadow-gold";
                  if (normalizedSpecialty.includes("art moderne") || normalizedSpecialty.includes("contemporain") || normalizedSpecialty.includes("xxe")) return "card-shadow-blue";
                  if (normalizedSpecialty.includes("véhicule") || normalizedSpecialty.includes("voiture")) return "card-shadow-jaguar";
                  if (normalizedSpecialty.includes("vin") || normalizedSpecialty.includes("spiritueux")) return "card-shadow-wine";
                  if (normalizedSpecialty.includes("mobilier") || normalizedSpecialty.includes("objet")) return "card-shadow-emerald";
                  if (normalizedSpecialty.includes("collection")) return "card-shadow-copper";
                  if (normalizedSpecialty.includes("militaria")) return "card-shadow-kaki";
                  if (normalizedSpecialty.includes("argent")) return "card-shadow-silver";
                  return "card-shadow";
                };
                
                const shadowClass = getSpecialtyShadowClass(title);
                const linkTo = vente.type === "preparation" ? "/vendre/estimation-en-ligne" : vente.lien;
                
                return (
                  <Link
                    key={index}
                    to={linkTo}
                    className={`relative block ${shadowClass} bg-card group w-44 md:w-52`}
                  >
                    {/* Image poster avec ratio 3:4 */}
                    <div className="aspect-[3/4] bg-muted overflow-hidden relative">
                      {vente.image ? (
                        <img
                          src={vente.image}
                          alt={vente.titre}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-brand-museum">
                          <Calendar className="w-12 h-12 opacity-30" />
                        </div>
                      )}
                    </div>
                    {/* Info sous l'affiche */}
                    <div className="p-3 bg-card">
                      <h3 className="font-serif text-xs md:text-sm font-medium text-center tracking-wide mb-1 line-clamp-2 uppercase">
                        {vente.titre.replace(/^vente\s*/i, "")}
                      </h3>
                      <p className="font-sans text-xs md:text-sm text-muted-foreground text-center">
                        {vente.date}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Section 5: Textes longs détaillés */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container max-w-5xl">
          <h2 className="text-lg md:text-xl font-serif text-foreground mb-8 text-center">{detailTitle}</h2>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            {detailContent}
          </div>
        </div>
      </section>

      {/* Section 6: L'Expert */}
      {expert && (
        <section className="py-12 md:py-16 bg-brand-primary text-brand-primary-foreground">
          <div className="container max-w-5xl">
            <div className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-10 items-start">
              {/* Photo de l'expert détourée avec ombres */}
              <div className="flex justify-center md:justify-start">
                <div className="relative">
                  <img 
                    src={expert.photo} 
                    alt={expert.nom}
                    className="w-52 h-64 object-cover object-top"
                    style={{
                      filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.4))',
                    }}
                  />
                </div>
              </div>
              
              {/* Bio et introduction */}
              <div>
                <p className="text-brand-primary-foreground/60 text-xs uppercase tracking-wider mb-2">
                  Votre expert
                </p>
                <h3 className="text-lg md:text-xl font-serif mb-2">{expert.nom}</h3>
                <p className="text-brand-primary-foreground/70 text-sm mb-4">{expert.titre}</p>
                <div className="prose prose-sm prose-invert max-w-none text-brand-primary-foreground/90 leading-relaxed">
                  {expert.bio}
                </div>
                {saviezVous && saviezVous.length > 0 && (
                  <p className="mt-6 text-brand-primary-foreground/50 italic text-sm">
                    {expert.nom.split(' ')[0]} répond aux questions des collectionneurs...
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 7: Le Saviez-Vous */}
      {saviezVous && saviezVous.length > 0 && (
        <section className="py-12 md:py-16 bg-brand-museum">
          <div className="container">
            <div className="flex items-center justify-center gap-2 mb-10">
              <HelpCircle className="w-5 h-5 text-foreground" />
              <h2 className="text-lg md:text-xl font-serif text-foreground">
                Le Saviez-Vous ?
              </h2>
            </div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              {saviezVous.map((item, index) => (
                <div 
                  key={index}
                  className={`bg-background border border-border card-shadow overflow-visible ${
                    index % 2 === 0 ? '' : 'md:flex-row-reverse'
                  } md:flex`}
                >
                  {/* Image couleur */}
                  <div className="md:w-1/3 aspect-[4/3] md:aspect-auto overflow-hidden">
                    <img 
                      src={item.image} 
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Question et réponse */}
                  <div className="md:w-2/3 p-5 md:p-6 flex flex-col justify-center">
                    <h3 className="text-base font-serif text-foreground mb-3">
                      {item.question}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.reponse}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 8: Ventes passées */}
      {ventesPassees && ventesPassees.length > 0 && (
        <section className="py-12 md:py-16 bg-background">
          <div className="container">
            <div className="flex items-center justify-center gap-2 mb-10">
              <Archive className="w-5 h-5 text-foreground" />
              <h2 className="text-lg md:text-xl font-serif text-foreground">
                Nos Ventes Passées
              </h2>
            </div>
            
            <div className="flex flex-wrap justify-center gap-16 md:gap-20 py-6">
              {ventesPassees.slice(0, 4).map((vente, index) => (
                <Link 
                  key={index}
                  to={vente.lien}
                  className="relative block card-shadow bg-card group w-44 md:w-52"
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <img 
                      src={vente.image} 
                      alt={vente.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3 bg-card">
                    <h3 className="font-serif text-xs md:text-sm font-medium text-center tracking-wide mb-1 line-clamp-2 uppercase">
                      {vente.titre.replace(/^vente\s*/i, "")}
                    </h3>
                    <p className="font-sans text-xs md:text-sm text-muted-foreground text-center">
                      {vente.date}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Bouton voir toutes les ventes */}
            <div className="text-center">
              <Link 
                to={`/ventes-passees?specialite=${currentSpecialtyId}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-medium tracking-wider uppercase"
              >
                Voir toutes nos ventes de {title}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Autres spécialités */}
      <section className="py-6 bg-brand-museum border-t border-border">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs uppercase tracking-wider">
            <span className="text-foreground font-semibold">NOS AUTRES SPÉCIALITÉS :</span>
            {autresSpecialites.map((spec, index) => (
              <span key={spec.id} className="flex items-center">
                <Link 
                  to={`/specialites/${spec.id}`}
                  className="text-foreground hover:text-muted-foreground transition-colors font-medium"
                >
                  {spec.title.toUpperCase()}
                </Link>
                {index < autresSpecialites.length - 1 && (
                  <span className="text-muted-foreground mx-2">•</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SpecialtyPageTemplate;