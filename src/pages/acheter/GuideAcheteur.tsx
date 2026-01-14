import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, ArrowRight, Leaf, RotateCcw, MapPin, Clock, Instagram, Facebook, Linkedin, Youtube, Twitter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import TimelineLayout from "@/components/TimelineLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import GlossaireAccordion from "@/components/GlossaireAccordion";
import SaleCard from "@/components/SaleCard";
import { supabase } from "@/integrations/supabase/client";
import { getDemoNow } from "@/lib/site-config";
import salleEncheresPublic from "@/assets/salle-encheres-public.png";
import coupDeMarteau from "@/assets/coup-de-marteau-illustration.png";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// Section d'invitation avec layout 3 colonnes
const InvitationSection = () => {
  const demoDateKey = getDemoNow().toISOString().split('T')[0]; // Date du jour pour invalider le cache
  
  const { data: upcomingSales } = useQuery({
    queryKey: ['upcoming-live-sales-guide', demoDateKey],
    queryFn: async () => {
      const now = getDemoNow().toISOString();
      const { data, error } = await supabase
        .from('interencheres_sales')
        .select('id, title, sale_date, cover_image_url, specialty')
        .eq('sale_type', 'live')
        .gte('sale_date', now)
        .order('sale_date', { ascending: true })
        .limit(2);
      
      if (error) throw error;
      return data || [];
    }
  });

  const formatSaleDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return format(parseISO(dateStr), "EEEE d MMMM", { locale: fr });
  };

  const formatSaleTime = (dateStr: string | null) => {
    if (!dateStr) return undefined;
    return format(parseISO(dateStr), "HH'h'mm", { locale: fr });
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="max-w-6xl mx-auto">
          {/* Layout en grille 3 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
            
            {/* Colonne gauche - Première vente */}
            <div className="hidden lg:flex flex-col items-center">
              {upcomingSales && upcomingSales[0] ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground tracking-widest uppercase text-center">Prochaine vente</p>
                  <SaleCard
                    title={upcomingSales[0].title}
                    date={formatSaleDate(upcomingSales[0].sale_date)}
                    time={formatSaleTime(upcomingSales[0].sale_date)}
                    imageUrl={upcomingSales[0].cover_image_url || ""}
                    slug={upcomingSales[0].id}
                    specialty={upcomingSales[0].specialty || undefined}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="w-px h-32 bg-gradient-to-b from-transparent via-border to-transparent" />
                </div>
              )}
            </div>

            {/* Colonne centrale - Message principal */}
            <div className="text-center lg:py-4">
              <div className="flex justify-center mb-6">
                <img 
                  src={coupDeMarteau}
                  alt="Coup de marteau"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain opacity-80"
                />
              </div>
              
              <h2 className="font-serif text-xl md:text-2xl mb-6 leading-snug">
                Vous n'avez jamais assisté<br className="hidden md:block" /> à une vente aux enchères ?
              </h2>
              
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-px bg-brand-gold/30" />
                </div>
                <p className="relative bg-background inline-block px-4 py-2 text-lg md:text-xl font-serif text-brand-gold">
                  L'entrée est libre et gratuite
                </p>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
                Venez découvrir l'ambiance unique de notre salle des ventes, 
                observer le ballet des enchérisseurs et peut-être repartir avec votre premier coup de cœur. 
                Nos équipes sont là pour vous guider.
              </p>
              
              <Button variant="outline-brand" className="font-sans text-sm tracking-widest group" asChild>
                <Link to="/acheter/ventes-a-venir">
                  VOIR LES PROCHAINES VENTES
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Colonne droite - Deuxième vente */}
            <div className="hidden lg:flex flex-col items-center">
              {upcomingSales && upcomingSales[1] ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground tracking-widest uppercase text-center">À suivre</p>
                  <SaleCard
                    title={upcomingSales[1].title}
                    date={formatSaleDate(upcomingSales[1].sale_date)}
                    time={formatSaleTime(upcomingSales[1].sale_date)}
                    imageUrl={upcomingSales[1].cover_image_url || ""}
                    slug={upcomingSales[1].id}
                    specialty={upcomingSales[1].specialty || undefined}
                  />
                </div>
              ) : upcomingSales && upcomingSales[0] ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-px h-32 bg-gradient-to-b from-transparent via-border to-transparent" />
                </div>
              ) : null}
            </div>

          </div>

          {/* Version mobile - Ventes en dessous */}
          {upcomingSales && upcomingSales.length > 0 && (
            <div className="lg:hidden mt-12 pt-8 border-t border-border/30">
              <p className="text-xs text-muted-foreground tracking-widest uppercase text-center mb-6">
                Prochaines ventes en salle
              </p>
              <div className="flex flex-wrap justify-center gap-8">
                {upcomingSales.map((sale) => (
                  <SaleCard
                    key={sale.id}
                    title={sale.title}
                    date={formatSaleDate(sale.sale_date)}
                    time={formatSaleTime(sale.sale_date)}
                    imageUrl={sale.cover_image_url || ""}
                    slug={sale.id}
                    specialty={sale.specialty || undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const GuideAcheteur = () => {
  const [isGlossaireOpen, setIsGlossaireOpen] = useState(false);
  return (
    <>
      <Helmet>
        <title>Guide de l'Acheteur | Douze pages & associés</title>
        <meta name="description" content="Découvrez pourquoi acheter aux enchères : objets uniques, patrimoine authentique, prix justes et frisson incomparable." />
      </Helmet>

      <TimelineLayout pageTitle="Guide de l'Acheteur" mode="acheter">

        {/* POURQUOI ACHETER AUX ENCHÈRES - Version manifeste */}
        <section className="pt-8 pb-12 md:pt-10 md:pb-16 bg-muted/30 relative overflow-hidden">
          {/* Décor typographique subtil - taille réduite */}
          <div className="absolute top-6 left-6 text-[8rem] md:text-[12rem] font-serif text-border/15 leading-none select-none pointer-events-none">
            «
          </div>
          <div className="absolute bottom-6 right-6 text-[8rem] md:text-[12rem] font-serif text-border/15 leading-none select-none pointer-events-none">
            »
          </div>
          
          <div className="container relative z-10">
            <h2 className="section-title !text-[14px] !font-sans !font-medium !tracking-[0.15em] mb-10">POURQUOI ACHETER AUX ENCHÈRES ?</h2>
            
            <div className="max-w-3xl mx-auto">
              {/* Bloc manifeste principal */}
              <div className="relative">
                {/* Ligne verticale décorative */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-gold via-brand-gold/50 to-transparent hidden md:block" />
                
                <div className="md:pl-8 space-y-6">
                  {/* Paragraphe d'accroche - taille réduite */}
                  <p className="font-serif text-base md:text-lg leading-relaxed text-foreground/90">
                    Chaque jour, une nouvelle plateforme offre des services numériques d'achat, de vente, d'échange…
                  </p>
                  
                  {/* La révélation */}
                  <div className="bg-background border-l-4 border-brand-gold p-4 md:p-6 shadow-sm">
                    <p className="font-serif text-base md:text-lg leading-relaxed text-foreground">
                      Mais à tout cela, <strong className="text-brand-gold">il manque quelque chose</strong> : 
                      l'incarnation de celui qui rend le service.
                    </p>
                  </div>
                  
                  {/* L'explication humaine */}
                  <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-3">
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        Le commissaire-priseur est une <strong className="text-foreground">vraie personne</strong>. 
                        L'hôtel des ventes est un <strong className="text-foreground">bâtiment véritable</strong> où travaille 
                        une équipe que vous pouvez rencontrer.
                      </p>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        Le commissaire-priseur est <strong className="text-foreground">officier ministériel</strong>. 
                        Sa parole l'engage.
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="bg-brand-blue-900 text-brand-primary-foreground p-4 md:p-6">
                        <p className="font-serif text-sm md:text-base leading-relaxed">
                          Vous avez la sécurité de <span className="text-brand-gold font-medium">connaître vos interlocuteurs</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* La conclusion sur l'authenticité */}
                  <div className="pt-4 border-t border-border/30">
                    <p className="font-serif text-sm md:text-base text-foreground leading-relaxed">
                      Et cette authenticité ne se retrouve pas seulement dans les rapports humains.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section diversité et éco-responsabilité */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="section-title !text-[14px] !font-sans !font-medium !tracking-[0.15em] mb-8">
                ON TROUVE TOUT AUX ENCHÈRES, SAUF CE QUE VOUS TROUVEZ EN MAGASIN
              </h2>
              
              <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                <p>
                  Notre métier est d'une grande diversité. Régulièrement, nous mettons en vente des objets, des lots, 
                  des œuvres d'art qui sont toutes différentes. Du trésor imprévu à la bonne affaire, de l'œuvre d'art 
                  à la voiture d'occasion, du bon plan déco original et introuvable en magasin à l'œuvre d'un peintre 
                  méconnu qui vous touchera au cœur, on trouve vraiment de tout dans notre salle des ventes.
                </p>
                
                <div className="bg-background border-l-4 border-brand-gold p-4 md:p-6 shadow-sm">
                  <p className="font-serif text-base md:text-lg leading-relaxed text-foreground">
                    Les ventes aux enchères étaient éco-responsables <strong className="text-brand-gold">bien avant qu'on invente ce mot.</strong>
                  </p>
                </div>
              </div>
              
              {/* Grille éco-responsabilité */}
              <div className="grid md:grid-cols-3 gap-4 mt-8">
                <div className="bg-muted/50 p-5 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-brand-gold/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand-gold" />
                  </div>
                  <h3 className="font-serif text-base font-medium mb-1.5">Circuit court</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    La plupart de ce que nous proposons vient de Corse et y restera.
                  </p>
                </div>
                
                <div className="bg-muted/50 p-5 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-brand-gold/10 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-brand-gold" />
                  </div>
                  <h3 className="font-serif text-base font-medium mb-1.5">Seconde vie</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    C'est la base du métier : offrir une 2ème vie à des objets qui le méritent.
                  </p>
                </div>
                
                <div className="bg-muted/50 p-5 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-brand-gold/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-brand-gold" />
                  </div>
                  <h3 className="font-serif text-base font-medium mb-1.5">Durabilité</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Obsolescence programmée ? L'ancien a été construit pour durer.
                  </p>
                </div>
              </div>
              
              {/* CTA réseaux sociaux et inscription */}
              <div className="mt-12 text-center">
                <div className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl mx-auto space-y-3">
                  <p>
                    Et pour ne rien rater de ce qui pourrait vous plaire, nous vous conseillons de nous suivre 
                    sur les réseaux sociaux et de créer un compte sur le site pour que nous puissions vous informer 
                    des ventes qui correspondent à vos centres d'intérêt, exclusivement.
                  </p>
                  <p className="font-medium text-foreground">
                    Dites nous ce que vous aimez : un style, un artiste, un objet ; ce que vous cherchez précisément ou pas. 
                    Quand c'est présent dans nos ventes, nous vous prévenons.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                  {/* Icônes réseaux sociaux */}
                  <div className="flex items-center gap-4">
                    <a 
                      href="https://instagram.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center hover:bg-brand-gold/20 transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5 text-brand-gold" />
                    </a>
                    <a 
                      href="https://facebook.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center hover:bg-brand-gold/20 transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-5 h-5 text-brand-gold" />
                    </a>
                    <a 
                      href="https://linkedin.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center hover:bg-brand-gold/20 transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5 text-brand-gold" />
                    </a>
                    <a 
                      href="https://youtube.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center hover:bg-brand-gold/20 transition-colors"
                      aria-label="YouTube"
                    >
                      <Youtube className="w-5 h-5 text-brand-gold" />
                    </a>
                    <a 
                      href="https://x.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center hover:bg-brand-gold/20 transition-colors"
                      aria-label="X"
                    >
                      <Twitter className="w-5 h-5 text-brand-gold" />
                    </a>
                    <a 
                      href="https://pinterest.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center hover:bg-brand-gold/20 transition-colors"
                      aria-label="Pinterest"
                    >
                      <svg className="w-5 h-5 text-brand-gold" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                      </svg>
                    </a>
                  </div>
                  
                  {/* Bouton inscription */}
                  <Link 
                    to="/inscription"
                    className="inline-flex items-center gap-2 bg-brand-gold text-brand-gold-foreground px-6 py-3 font-sans text-sm tracking-widest hover:bg-brand-gold/90 transition-colors"
                  >
                    CRÉER MON COMPTE
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Image de la salle des ventes */}
        <section className="py-8 md:py-12">
          <div className="container">
            <div className="max-w-5xl mx-auto overflow-hidden">
              <img 
                src={salleEncheresPublic}
                alt="Salle des ventes avec le public"
                className="w-[200%] max-w-none -ml-[50%] md:w-full md:max-w-full md:ml-0 h-auto"
              />
            </div>
          </div>
        </section>

        {/* Comment acheter */}
        <section className="pt-6 pb-10 md:pt-8 md:pb-12 bg-muted/30">
        <div className="container">
          <h2 className="section-title !text-[14px] !font-sans !font-medium !tracking-[0.15em] mb-16">COMMENT ACHETER AUX ENCHÈRES ?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Étape 1 - BIEN CHOISIR */}
            <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
              <span className="font-serif text-5xl font-light block mb-4 text-primary">1</span>
              <h3 className="font-serif text-lg font-medium tracking-wide mb-4">BIEN CHOISIR</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                <p>
                  Prenez le temps d'examiner les lots lors des <strong>journées d'exposition</strong> (veille et matin de la vente).
                </p>
                <p>
                  <strong>Renseignez-vous</strong> sur la valeur des biens en consultant les estimations et en questionnant nos experts.
                </p>
                <p>
                  <strong>Fixez vos limites</strong> avant la vente pour éviter de vous laisser emporter par l'excitation des enchères.
                </p>
                <p>
                  N'oubliez pas d'<strong>anticiper les frais acheteurs</strong> qui sont expliqués sur le catalogue en ligne.
                </p>
              </div>
            </div>
            
            {/* Étape 2 - ENCHÉRIR */}
            <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
              <span className="font-serif text-5xl font-light block mb-4 text-primary">2</span>
              <h3 className="font-serif text-lg font-medium tracking-wide mb-4">ENCHÉRIR</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                <p>
                  <strong>En salle :</strong> Munissez-vous d'une pièce d'identité et d'un moyen de paiement. Levez votre plaquette ou la main pour enchérir.
                </p>
                <p>
                  <strong>Par ordre ferme :</strong> Laissez un ordre d'achat confidentiel au commissaire-priseur qui enchérira pour vous jusqu'à votre limite.
                </p>
                <p>
                  <strong>En ligne :</strong> Participez en direct via Drouot ou Interenchères depuis chez vous (frais supplémentaires de 3%).
                </p>
                <p className="italic text-xs pt-2 border-t border-border/50">
                  Si personne n'enchérit après vous jusqu'au coup de marteau, vous devenez propriétaire de l'objet.
                </p>
              </div>
            </div>
            
            {/* Étape 3 - PAYER */}
            <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
              <span className="font-serif text-5xl font-light block mb-4 text-primary">3</span>
              <h3 className="font-serif text-lg font-medium tracking-wide mb-4">PAYER</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                <p>
                  Vous recevrez un <strong>bordereau d'achat</strong> sous 48h détaillant le montant total à régler (prix + frais).
                </p>
                <p>
                  <strong>Moyens acceptés :</strong> Carte bancaire, virement ou espèces jusqu'à 1 000€. Le paiement doit intervenir sous 48h.
                </p>
                <p>
                  <strong>Aucun lot remis</strong> avant le paiement intégral. L'encaissement du virement doit être effectif.
                </p>
                <p className="italic text-xs pt-2 border-t border-border/50">
                  En cas de défaut, le lot sera remis en vente et vous serez tenu responsable de la différence de prix.
                </p>
              </div>
            </div>
            
            {/* Étape 4 - RETIRER OU EXPÉDIER */}
            <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
              <span className="font-serif text-5xl font-light block mb-4 text-primary">4</span>
              <h3 className="font-serif text-lg font-medium tracking-wide mb-4">RETIRER OU EXPÉDIER</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                <p>
                  <strong>Retrait à l'étude :</strong> Du lundi au vendredi (9h-12h / 14h-18h). Stockage gratuit 15 jours.
                </p>
                <p>
                  <strong>Expédition :</strong> Nous pouvons coordonner l'envoi avec nos transporteurs partenaires spécialisés.
                </p>
                <p>
                  <strong>Service interne :</strong> Pour objets peu volumineux, nous proposons un service d'expédition simple.
                </p>
                <p className="italic text-xs pt-2 border-t border-border/50">
                  Le transport reste sous votre responsabilité. Assurez vos objets de valeur pendant l'expédition.
                </p>
              </div>
            </div>
          </div>

          {/* Bouton unique Règlement */}
          <div className="text-center mt-12">
            <Button variant="outline-brand" className="font-sans text-sm tracking-widest" asChild>
              <a href="/documents/reglement-acheter.pdf" target="_blank" rel="noopener noreferrer">
                VOIR NOTRE RÈGLEMENT
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Invitation à assister à une vente - Layout 3 colonnes */}
      <InvitationSection />

      {/* CTA Estimation */}
      <section className="pt-10 md:pt-12 pb-0">
        <div className="bg-brand-primary text-brand-primary-foreground p-6 md:p-10 text-center card-shadow">
          <h2 className="font-serif text-lg md:text-xl font-light mb-6">
            Et si le trésor que vous cherchez se trouvait dans votre grenier ?
          </h2>
          <Link 
            to="/contact"
            className="inline-block bg-background text-brand-primary px-8 py-3 font-sans text-xs tracking-widest hover:bg-background/90 transition-colors"
          >
            ESTIMATION GRATUITE
          </Link>
        </div>
      </section>

      {/* Glossaire intégré (repliable) - Dernière section */}
      <section id="glossaire" className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="section-title mb-4">VOCABULAIRE DES ENCHÈRES</h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-6">
              Les 50 termes incontournables du monde des enchères, avec des définitions concises pour aller à l'essentiel.
            </p>
            <button
              onClick={() => setIsGlossaireOpen(!isGlossaireOpen)}
              className="inline-flex items-center gap-2 text-sm text-brand-gold hover:text-brand-gold/80 transition-colors font-sans tracking-wider"
            >
              {isGlossaireOpen ? (
                <>
                  FERMER LE GLOSSAIRE
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  OUVRIR LE GLOSSAIRE
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          
          {isGlossaireOpen && (
            <div className="animate-fade-in">
              <GlossaireAccordion className="max-w-7xl mx-auto" />
            </div>
          )}
        </div>
      </section>

        <Footer />
      </TimelineLayout>
    </>
  );
};

export default GuideAcheteur;
