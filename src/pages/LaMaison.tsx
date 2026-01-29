import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { Helmet } from "react-helmet-async";
import { Zap, Network, Monitor, Heart, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChronoCountdown } from "@/components/chrono";
import hotelDesVentesAjaccio from "@/assets/hotel-des-ventes-ajaccio.png";
import maitreMarcaggi from "@/assets/maitre-marcaggi-portrait.png";

// Équipe de la maison
const equipeMaison = [
  {
    name: "Marie Duval",
    role: "Clerc de ventes volontaires",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=600&fit=crop&crop=top",
    bio: "Bras droit du commissaire-priseur, Marie coordonne l'ensemble des ventes volontaires. Elle assure le lien entre vendeurs et acheteurs et veille au bon déroulement de chaque vacation."
  },
  {
    name: "Dominique Léandri",
    role: "Clerc judiciaire",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop&crop=top",
    bio: "Spécialisé dans les inventaires de succession et les ventes judiciaires, Dominique apporte rigueur et précision dans les procédures légales. Son expertise juridique est un atout précieux pour la maison."
  },
  {
    name: "Isabelle Moreau",
    role: "Secrétaire",
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=600&fit=crop&crop=top",
    bio: "Premier contact de la maison, Isabelle accueille les clients avec professionnalisme et bienveillance. Elle gère les rendez-vous, les demandes d'estimation et le suivi administratif."
  },
  {
    name: "Kevin Lanfranchi",
    role: "Magasinier",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=600&fit=crop&crop=top",
    bio: "Responsable de la logistique, Kevin réceptionne, stocke et prépare les lots avec le plus grand soin. Sa connaissance des objets et son savoir-faire garantissent leur parfaite conservation."
  },
  {
    name: "Savéria Simeoni",
    role: "Comptable",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=600&fit=crop&crop=top",
    bio: "Savéria assure la gestion financière de la maison avec rigueur. Elle traite les paiements, établit les bordereaux et veille au respect des obligations comptables et fiscales."
  }
];

// Experts associés
const experts = [
  {
    name: "Dr. Hélène Marchand",
    role: "Tableaux anciens et modernes",
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&h=600&fit=crop&crop=top",
    bio: "Docteur en histoire de l'art, ancienne conservatrice au Musée des Beaux-Arts de Bordeaux. Expertise reconnue en peinture française du XVIIe au XXe siècle."
  },
  {
    name: "Maître Antoine Dupré",
    role: "Bijoux et pierres précieuses",
    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&h=600&fit=crop&crop=top",
    bio: "Gemmologue certifié, 25 ans d'expérience en joaillerie de prestige. Consultant pour les grandes maisons internationales."
  },
  {
    name: "Sophie Valéry",
    role: "Mobilier XVIIIe et XIXe",
    imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&h=600&fit=crop&crop=top",
    bio: "Diplômée de l'IESA, spécialiste du mobilier régional et parisien. Collabore avec les plus grandes institutions patrimoniales."
  },
  {
    name: "François Delcourt",
    role: "Vins et spiritueux",
    imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&h=600&fit=crop&crop=top",
    bio: "Sommelier de formation, expert en grands crus bordelais et bourguignons. Conseiller auprès de caves prestigieuses."
  },
  {
    name: "Caroline Estève",
    role: "Arts d'Asie",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=600&fit=crop&crop=top",
    bio: "Sinologue, ancienne attachée culturelle à Pékin. Expertise en porcelaines, bronzes et estampes asiatiques."
  },
  {
    name: "Laurent Michaud",
    role: "Militaria et souvenirs historiques",
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=600&fit=crop&crop=top",
    bio: "Historien militaire, collectionneur passionné. Référence nationale pour les uniformes et décorations."
  }
];

// Composant photo avec effet de fondu
const TeamPhoto = ({ src, alt }: { src: string; alt: string }) => (
  <div className="relative w-48 h-60 mx-auto flex-shrink-0">
    <div 
      className="absolute inset-0 grayscale hover:grayscale-0 transition-all duration-500"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        maskImage: 'radial-gradient(ellipse 85% 80% at 50% 45%, black 50%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 85% 80% at 50% 45%, black 50%, transparent 100%)',
      }}
    />
  </div>
);

// Composant pour afficher les ventes à venir dans la section CTA
const UpcomingSalesSection = () => {
  const [nextSale, setNextSale] = useState<any>(null);
  const [chronoSale, setChronoSale] = useState<any>(null);

  useEffect(() => {
    const fetchSales = async () => {
      const now = new Date().toISOString();
      
      // Récupérer la prochaine vente classique (live ou salle)
      const { data: regularSales } = await supabase
        .from('interencheres_sales')
        .select('*')
        .gte('sale_date', now)
        .neq('sale_type', 'online')
        .order('sale_date', { ascending: true })
        .limit(1);
      
      if (regularSales && regularSales.length > 0) {
        setNextSale(regularSales[0]);
      }
      
      // Récupérer la prochaine vente chrono (online)
      const { data: chronoSales } = await supabase
        .from('interencheres_sales')
        .select('*')
        .gte('sale_date', now)
        .eq('sale_type', 'online')
        .order('sale_date', { ascending: true })
        .limit(1);
      
      if (chronoSales && chronoSales.length > 0) {
        setChronoSale(chronoSales[0]);
      }
    };
    
    fetchSales();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <section className="bg-brand-primary text-brand-primary-foreground py-12">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h2 className="mb-6">
              Vous n'avez jamais assisté à une vente aux enchères ?
            </h2>
            <p className="text-background/80 leading-relaxed text-sm">
              Venez découvrir l'atmosphère unique d'une salle des ventes. 
              L'émotion des enchères, la passion des collectionneurs, 
              la beauté des objets... Une expérience inoubliable vous attend.
            </p>
            <Link 
              to="/calendrier"
              className="inline-flex items-center gap-2 bg-background text-foreground px-8 py-3 font-sans text-xs tracking-widest hover:bg-background/90 transition-colors card-shadow"
            >
              VOIR LE CALENDRIER DES VENTES
            </Link>
          </div>
          
          {/* Cartes des deux prochaines ventes */}
          <div className="flex flex-col gap-4">
            {/* Prochaine vente classique */}
            {nextSale && (
              <Link 
                to={`/vente/${nextSale.id}`}
                className="group bg-background/10 border border-background/20 p-4 hover:bg-background/20 transition-all duration-300 flex gap-4"
              >
                {nextSale.cover_image_url && (
                  <img 
                    src={nextSale.cover_image_url} 
                    alt={nextSale.title}
                    className="w-24 h-24 object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-brand-gold" />
                    <span className="text-xs text-background/60 uppercase tracking-wider">Prochaine vente</span>
                  </div>
                  <h3 className="text-sm font-medium text-background line-clamp-2 group-hover:text-brand-gold transition-colors">
                    {nextSale.title}
                  </h3>
                  <p className="text-xs text-background/70 mt-1 capitalize">
                    {nextSale.sale_date && formatDate(nextSale.sale_date)}
                  </p>
                </div>
              </Link>
            )}
            
            {/* Vente chrono avec compte à rebours */}
            {chronoSale && (
              <Link 
                to={`/vente/${chronoSale.id}`}
                className="group bg-brand-gold/10 border border-brand-gold/30 p-4 hover:bg-brand-gold/20 transition-all duration-300 flex gap-4"
              >
                {chronoSale.cover_image_url && (
                  <img 
                    src={chronoSale.cover_image_url} 
                    alt={chronoSale.title}
                    className="w-24 h-24 object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-brand-gold" />
                    <span className="text-xs text-brand-gold uppercase tracking-wider font-medium">Vente Chrono</span>
                  </div>
                  <h3 className="text-sm font-medium text-background line-clamp-2 group-hover:text-brand-gold transition-colors">
                    {chronoSale.title}
                  </h3>
                  <div className="mt-2">
                    <ChronoCountdown 
                      endDate={new Date(chronoSale.sale_date)} 
                      variant="inline"
                      className="text-brand-gold text-xs"
                    />
                  </div>
                </div>
              </Link>
            )}
            
            {/* Fallback si aucune vente */}
            {!nextSale && !chronoSale && (
              <p className="text-background/60 text-sm italic">
                Consultez notre calendrier pour les prochaines ventes.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const LaMaison = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Notre Maison | Douze pages & associés - Commissaire-Priseur</title>
        <meta name="description" content="Découvrez l'histoire de Douze pages & associés, maison de ventes aux enchères. Une passion pour l'art et le patrimoine." />
      </Helmet>

      <Header />

      {/* Hero Section - Titre H1 */}
      <section 
        className="pb-8"
        style={{ paddingTop: 'calc(var(--header-sticky-top, 163px) + 10px)' }}
      >
        <div className="container">
          <div className="flex justify-center -translate-y-[25px]">
            <h1 className="text-lg md:text-xl font-serif tracking-wide text-center text-foreground uppercase border-b-2 border-[hsl(var(--brand-secondary))] pb-1 px-4">
              Notre Maison
            </h1>
          </div>
          
        </div>
        
        {/* Image Hôtel des Ventes Ajaccio - Pleine largeur, intégralité visible */}
        <div className="w-full mt-8">
          <img
            src={hotelDesVentesAjaccio}
            alt="Hôtel des Ventes d'Ajaccio"
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* Histoire de la Maison */}
      <section id="histoire" className="pb-16">
        <div className="container">
          <div className="text-center mb-16">
            <p className="font-sans text-sm tracking-widest text-muted-foreground uppercase mb-2">
              Depuis 2012
            </p>
            <h2 className="section-title">
              NOTRE HISTOIRE
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Maître Marcaggi a commencé sa carrière sur le continent, dans les plus grandes maisons de vente parisiennes. 
              Originaire d'Ajaccio, chaque retour lui faisait regretter qu'il n'y ait pratiquement pas d'hôtel de vente en Corse. 
              Ce regret est vite devenu un projet.
            </p>
            
            <p>
              <strong className="text-foreground">En 2012</strong>, s'ouvrait au 12, boulevard Albert 1er à Ajaccio, 
              l'<strong className="text-foreground">Hôtel des Ventes d'Ajaccio</strong>.
            </p>
            
            <p>
              C'était un double pari humain pour Maître Marcaggi. D'abord, une partie de l'équipe parisienne avec qui 
              il travaillait en toute confiance l'avait suivi depuis le continent. Et ensuite — et surtout — sur cette 
              terre de tradition, de secret, le comportement de vendre ses biens aux enchères n'existait pas. 
              Il était à promouvoir, à inventer.
            </p>
            
            <p className="text-foreground font-medium">
              Treize ans plus tard, plus de 100 000 lots ont été vendus et ont trouvé preneur. L'histoire continue.
            </p>
            
            <p>
              Si vous découvrez notre activité, n'hésitez pas à vous balader sur le site afin de comprendre 
              à quel point les enchères sont un moyen respectueux et moderne de faire vivre le patrimoine mobilier.
            </p>

            {/* Actions et statistique centrale */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 mt-12">
              <Link 
                to="/acheter/guide" 
                className="border border-foreground px-6 py-3 font-serif text-sm tracking-wide hover:bg-foreground hover:text-background transition-colors"
              >
                Guide de l'acheteur
              </Link>
              <div className="text-center">
                <p className="font-serif text-2xl md:text-3xl font-light text-brand-primary">100 000+</p>
                <p className="text-xs text-muted-foreground">Lots vendus</p>
              </div>
              <Link 
                to="/vendre/guide" 
                className="border border-foreground px-6 py-3 font-serif text-sm tracking-wide hover:bg-foreground hover:text-background transition-colors"
              >
                Guide du vendeur
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* Le métier de Commissaire-Priseur */}
      <section id="metier" className="py-16">
        <div className="container">
          <div className="text-center mb-16">
            <p className="font-sans text-xs tracking-widest text-muted-foreground uppercase mb-2">
              Un métier d'exception
            </p>
            <h2 className="section-title">
              COMMISSAIRE-PRISEUR : UN MÉTIER DE DROIT, DE CULTURE ET DE TRANSMISSION
            </h2>
          </div>

          {/* Première rangée : Passeur de patrimoine + Photo Maître Marcaggi */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <h3 className="font-serif text-lg md:text-xl font-light text-brand-primary">
                Passeur de patrimoine
              </h3>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Le commissaire-priseur est bien plus qu'un vendeur : c'est un <strong className="text-foreground">
                  passeur de patrimoine</strong>. Chaque objet qui passe sous son marteau a une histoire, 
                  une âme, une mémoire. Notre mission est de trouver l'acquéreur qui saura poursuivre cette histoire.
                </p>
                <p>
                  De génération en génération, les objets circulent, changent de mains, traversent les époques. 
                  Le commissaire-priseur est le garant de cette transmission. Il assure que chaque pièce 
                  trouve sa juste place dans une nouvelle collection, un nouveau foyer.
                </p>
                <p>
                  Cette responsabilité nous anime chaque jour. Qu'il s'agisse d'un héritage familial ou 
                  d'une collection constituée au fil des années, nous traitons chaque bien avec le respect 
                  qu'il mérite.
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <img
                src={maitreMarcaggi}
                alt="Maître Marcaggi, Commissaire-Priseur"
                className="w-80 md:w-96 h-auto object-contain"
              />
            </div>
          </div>

          {/* Deuxième rangée : Culture + Droit côte à côte */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Une autorité en matière de culture */}
            <div className="space-y-6">
              <h3 className="font-serif text-lg md:text-xl font-light text-brand-primary">
                Une autorité en matière de culture
              </h3>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                <p>
                  Le commissaire-priseur est un <strong className="text-foreground">généraliste de haut niveau</strong>. 
                  Après de longues années d'études en histoire de l'art et en droit, puis une expérience forgée 
                  au contact quotidien des objets dans les plus grandes maisons, il développe un œil capable 
                  d'embrasser tous les domaines du patrimoine.
                </p>
                <p>
                  Du tableau de maître au bijou ancien, du mobilier régional à la porcelaine de Chine, 
                  il sait reconnaître, dater, authentifier. Cette connaissance transversale est irremplaçable : 
                  elle permet de voir ce que d'autres ne voient pas, de déceler la pièce rare au milieu du commun.
                </p>
                <p>
                  Et pour les domaines les plus pointus, le commissaire-priseur <strong className="text-foreground">
                  s'entoure d'experts spécialisés</strong> — gemmologues, œnologues, historiens militaires — 
                  dont le savoir affine encore l'estimation et garantit l'authenticité de chaque lot.
                </p>
              </div>
            </div>

            {/* Le droit qui protège */}
            <div className="space-y-6">
              <h3 className="font-serif text-lg md:text-xl font-light text-brand-primary">
                Le droit qui protège
              </h3>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                <p>
                  Le commissaire-priseur est un <strong className="text-foreground">officier ministériel assermenté</strong>, 
                  soumis à une réglementation stricte. Cette dimension juridique n'est pas une contrainte : 
                  c'est une <strong className="text-foreground">protection</strong> pour vendeurs et acheteurs.
                </p>
                <p>
                  Le droit encadre chaque étape : inventaire, estimation, publicité, adjudication, paiement. 
                  En cas de litige, vous avez un interlocuteur identifié, responsable, joignable. 
                  Une personne physique, pas un formulaire de contact.
                </p>
                <p>
                  À l'heure des plateformes numériques dont le siège social est au Luxembourg et les serveurs 
                  aux Philippines, où l'on ne trouve jamais personne quand les problèmes surviennent, 
                  le commissaire-priseur incarne une <strong className="text-foreground">sécurité juridique réelle</strong>. 
                  Le droit rassure. Le droit protège.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator className="container" />

      {/* Pourquoi choisir notre maison */}
      <section className="py-16 bg-brand-primary text-brand-primary-foreground">
        <div className="container">
          <h2 className="font-serif text-lg md:text-xl font-light mb-12 text-center">
            Pourquoi choisir notre maison ?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto border border-brand-gold rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-gold" />
              </div>
              <h4 className="font-serif text-lg text-brand-gold">Efficacité</h4>
              <p className="text-brand-primary-foreground/80 text-sm">
                Délais maîtrisés, processus fluide, règlement rapide. 
                Nous valorisons votre temps.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto border border-brand-gold rounded-full flex items-center justify-center">
                <Network className="w-5 h-5 text-brand-gold" />
              </div>
              <h4 className="font-serif text-lg text-brand-gold">Réseau</h4>
              <p className="text-brand-primary-foreground/80 text-sm">
                Treize ans de relations avec collectionneurs, musées et marchands 
                en France et à l'étranger.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto border border-brand-gold rounded-full flex items-center justify-center">
                <Monitor className="w-5 h-5 text-brand-gold" />
              </div>
              <h4 className="font-serif text-lg text-brand-gold">Modernité</h4>
              <p className="text-brand-primary-foreground/80 text-sm">
                Enchères en ligne, catalogue numérique, communication digitale. 
                L'innovation au service de la tradition.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto border border-brand-gold rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-brand-gold" />
              </div>
              <h4 className="font-serif text-lg text-brand-gold">Empathie</h4>
              <p className="text-brand-primary-foreground/80 text-sm">
                Succession, séparation, déménagement, besoin d'argent... Nous comprenons que même si vendre est raisonnable, la raison a des raisons que le cœur ignore, pour paraphraser le poète.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Équipe permanente */}
      <section className="py-16">
        <div className="container">
          <h2 className="section-title text-center mb-12">
            L'ÉQUIPE PERMANENTE
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {equipeMaison.map((member, index) => (
              <div key={index} className="text-center group">
                <TeamPhoto src={member.imageUrl} alt={member.name} />
                <div className="mt-4 space-y-2">
                  <p className="font-sans text-xs tracking-widest text-brand-gold uppercase">
                    {member.role}
                  </p>
                  <h3 className="font-serif text-lg font-medium">
                    {member.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}

            {/* Cartouche contacts services */}
            <div className="text-center bg-muted/50 p-6 border border-border">
              <h3 className="font-serif text-lg font-medium mb-4 text-brand-primary">
                Nous contacter
              </h3>
              <div className="space-y-3 text-sm text-left">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Clerc de ventes volontaires</span>
                  <a href="mailto:ventes@12pages.fr" className="text-brand-secondary hover:text-brand-gold transition-colors">ventes@12pages.fr</a>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Clerc judiciaire</span>
                  <a href="mailto:judiciaire@12pages.fr" className="text-brand-secondary hover:text-brand-gold transition-colors">judiciaire@12pages.fr</a>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Secrétariat</span>
                  <a href="mailto:accueil@12pages.fr" className="text-brand-secondary hover:text-brand-gold transition-colors">accueil@12pages.fr</a>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Magasinier</span>
                  <a href="mailto:magasin@12pages.fr" className="text-brand-secondary hover:text-brand-gold transition-colors">magasin@12pages.fr</a>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Comptabilité</span>
                  <a href="mailto:compta@12pages.fr" className="text-brand-secondary hover:text-brand-gold transition-colors">compta@12pages.fr</a>
                </div>
                <div className="mt-4 pt-2 space-y-1">
                  <p className="text-muted-foreground flex items-center gap-2">
                    <span className="text-brand-gold">📞</span> 04 95 21 79 00
                  </p>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <span className="text-brand-gold">🕐</span> Lun-Ven : 9h-12h / 14h-18h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experts associés */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="section-title text-center mb-12">
            NOS EXPERTS ASSOCIÉS
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {experts.map((expert, index) => (
              <div key={index} className="text-center group">
                <TeamPhoto src={expert.imageUrl} alt={expert.name} />
                <div className="mt-4 space-y-2">
                  <p className="font-sans text-xs tracking-widest text-brand-gold uppercase">
                    {expert.role}
                  </p>
                  <h3 className="font-serif text-lg font-medium">
                    {expert.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                    {expert.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="container" />

      {/* Liens vers pages dédiées */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Région de talents */}
            <Link 
              to="/region-talents"
              className="group bg-card border border-border p-8 hover:shadow-xl transition-all duration-300"
            >
              <p className="font-sans text-xs tracking-widest text-muted-foreground uppercase mb-2">
                Autour de nous
              </p>
              <h3 className="font-serif text-lg font-medium mb-4 group-hover:text-brand-gold transition-colors">
                Une région riche de talents
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Musées, artisans d'art, restaurateurs... Notre région regorge de talents 
                et d'expositions que nous sommes heureux de vous recommander.
              </p>
              <span className="text-brand-secondary font-sans text-sm tracking-wider uppercase group-hover:text-brand-gold transition-colors">
                Découvrir →
              </span>
            </Link>

            {/* Aventures d'enchères */}
            <Link 
              to="/aventures-encheres"
              className="group bg-card border border-border p-8 hover:shadow-xl transition-all duration-300"
            >
              <p className="font-sans text-xs tracking-widest text-muted-foreground uppercase mb-2">
                Histoires vraies
              </p>
              <h3 className="font-serif text-lg font-medium mb-4 group-hover:text-brand-gold transition-colors">
                Aventures d'Enchères
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Inventaires surprenants, ouvertures de coffres mystérieux, trésors oubliés... 
                Découvrez les coulisses extraordinaires de notre métier.
              </p>
              <span className="text-brand-secondary font-sans text-sm tracking-wider uppercase group-hover:text-brand-gold transition-colors">
                Lire les histoires →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA - Première vente avec cartes des prochaines ventes */}
      <UpcomingSalesSection />

      {/* Cartouche Estimation */}
      <section className="py-16">
        <div className="container">
          <div className="bg-muted/50 border border-border p-8 md:p-12 text-center">
            <h2 className="font-serif text-lg md:text-xl font-light mb-4">
              Vous avez un objet à faire estimer ?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Nos experts sont à votre disposition pour évaluer vos biens. 
              Estimation gratuite et confidentielle, sans engagement.
            </p>
            <Link
              to="/contact#formulaire"
              className="inline-block bg-brand-primary text-brand-primary-foreground px-8 py-3 font-sans text-sm tracking-widest uppercase hover:bg-brand-primary/90 transition-colors"
            >
              Demander une estimation
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LaMaison;
