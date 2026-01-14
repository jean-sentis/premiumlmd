import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Globe, MapPin, Phone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import maitreMarcaggi from "@/assets/maitre-marcaggi-portrait.png";
import cordonneriePietri from "@/assets/coups-coeur/cordonnerie-pietri.png";
import ceramiqueAtelier from "@/assets/coups-coeur/ceramique-atelier.png";
import maisonNapoleon from "@/assets/coups-coeur/maison-napoleon.png";
import museeFesch from "@/assets/coups-coeur/musee-fesch.png";
import joaillierSantini from "@/assets/coups-coeur/joaillier-santini.png";

const coupsDeCoeur = [
  {
    name: "Joaillerie Santini",
    category: "Joaillier",
    imageUrl: joaillierSantini,
    description: "Création de bijoux sur mesure, restauration de pièces anciennes, sertissage.",
    address: "15 Rue du Roi de Rome, 20000 Ajaccio",
    phone: "04 95 21 33 XX",
    website: "#",
    article: "François Santini perpétue un savoir-faire familial transmis depuis trois générations. Dans son atelier ajaccien, il crée des pièces uniques et restaure les bijoux anciens avec une précision remarquable. Sertissage, gravure, fonte : chaque geste est exécuté avec la patience des maîtres d'antan. Nous lui confions régulièrement la remise en état de bijoux avant vente."
  },
  {
    name: "Atelier Ferrandi - Encadrement d'Art",
    category: "Encadreur",
    imageUrl: "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=600&h=400&fit=crop",
    description: "Encadrement sur mesure, restauration de cadres anciens, dorure à la feuille d'or.",
    address: "7 Rue Fesch, 20000 Ajaccio",
    phone: "04 95 21 XX XX",
    website: "#",
    article: "Jean-Marc Ferrandi perpétue l'art de l'encadrement depuis plus de trente ans dans son atelier du vieux Ajaccio. Les cadres anciens qui passent entre ses mains retrouvent leur éclat d'origine. Dorure à la feuille, patines, restauration de bois sculptés : un savoir-faire rare que nous recommandons sans réserve."
  },
  {
    name: "Cordonnerie Pietri",
    category: "Cordonnier",
    imageUrl: cordonneriePietri,
    description: "Cordonnerie traditionnelle, réparation et entretien du cuir, sellerie artisanale.",
    address: "12 Cours Napoléon, 20000 Ajaccio",
    phone: "04 95 51 XX XX",
    website: "#",
    article: "Chez Pietri, on répare les chaussures de père en fils depuis 1958. Antoine Pietri a repris l'atelier familial et maintient les gestes ancestraux : couture main, ressemelage traditionnel, patines. Un artisan qui fait honneur au travail bien fait, rare à notre époque."
  },
  {
    name: "Musée Fesch",
    category: "Musée",
    imageUrl: museeFesch,
    description: "Deuxième collection de peintures italiennes en France après le Louvre.",
    address: "50-52 Rue Cardinal Fesch, 20000 Ajaccio",
    phone: "04 95 26 26 26",
    website: "https://www.musee-fesch.com",
    article: "Le Musée Fesch abrite la plus importante collection de peintures italiennes en France après le Louvre. Botticelli, Titien, Véronèse... Une institution avec laquelle nous collaborons pour l'authentification et l'expertise de tableaux anciens. Un partenaire naturel pour notre maison."
  },
  {
    name: "Domaine de Saparale",
    category: "Viticulteur",
    imageUrl: "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=600&h=400&fit=crop",
    description: "Vins AOP Corse-Figari, viticulture biologique, domaine familial d'exception.",
    address: "Lieu-dit Saparale, 20114 Figari",
    phone: "04 95 71 48 23",
    website: "https://www.saparale.com",
    article: "Philippe Farinelli conduit son domaine en agriculture biologique dans le terroir préservé de Figari. Ses vins expriment toute la typicité des cépages corses : Sciaccarellu, Niellucciu, Vermentinu. Un travail exigeant, une qualité constante. Nous vous recommandons particulièrement leur cuvée prestige."
  },
  {
    name: "Atelier Casanova - Ébénisterie",
    category: "Ébéniste",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    description: "Restauration de meubles anciens, marqueterie, ébénisterie traditionnelle corse.",
    address: "Zone Artisanale de Mezzavia, 20167 Ajaccio",
    phone: "04 95 20 XX XX",
    website: "#",
    article: "Pierre-Antoine Casanova restaure les meubles corses traditionnels avec un respect absolu des techniques d'origine. Châtaignier, noyer, olivier : il travaille les essences locales comme le faisaient les anciens. Nous lui confions régulièrement les meubles qui nécessitent une restauration avant vente."
  },
  {
    name: "Maison Bonaparte",
    category: "Musée",
    imageUrl: maisonNapoleon,
    description: "Maison natale de Napoléon Bonaparte, musée national.",
    address: "Rue Saint-Charles, 20000 Ajaccio",
    phone: "04 95 21 43 89",
    website: "https://www.musees-nationaux-malmaison.fr",
    article: "La maison où naquit l'Empereur est aujourd'hui un musée national. Mobilier d'époque, souvenirs familiaux, documents historiques : une plongée dans l'intimité de la famille Bonaparte. Nous avons eu l'honneur de collaborer avec cette institution pour des expertises de souvenirs napoléoniens."
  },
  {
    name: "Domaine Comte Abbatucci",
    category: "Viticulteur",
    imageUrl: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&h=400&fit=crop",
    description: "Vins biodynamiques, cépages autochtones corses redécouverts, domaine historique.",
    address: "Lieu-dit Abbatucci, 20140 Casalabriva",
    phone: "04 95 74 04 55",
    website: "https://www.abbatucci.com",
    article: "Jean-Charles Abbatucci a ressuscité des cépages corses oubliés depuis des siècles. Conduit en biodynamie, son domaine produit des vins d'une singularité absolue. Une démarche visionnaire saluée par les plus grands critiques. Ses cuvées sont régulièrement présentées dans nos ventes de vins."
  },
  {
    name: "Atelier Ferracci - Céramique",
    category: "Céramiste",
    imageUrl: ceramiqueAtelier,
    description: "Céramique d'art, poterie traditionnelle corse, pièces uniques.",
    address: "Village de Pigna, 20220 Pigna",
    phone: "04 95 61 XX XX",
    website: "#",
    article: "Dans le village perché de Pigna, bastion des artisans d'art en Balagne, Marie-Ange Ferracci façonne des céramiques qui conjuguent tradition et modernité. Ses pièces sont recherchées par les collectionneurs. Un talent que nous sommes fiers de vous faire découvrir."
  }
];

const RegionTalents = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Nos Coups de Cœur | Douze pages & associés</title>
        <meta name="description" content="Les adresses de confiance de Maître Marcaggi en Corse-du-Sud. Artisans d'art, musées, vignerons : des talents et des savoir-faire d'exception." />
      </Helmet>

      <Header />

      {/* Hero Section - Fond blanc, H1 centré */}
      <section 
        className="pb-12 bg-background"
        style={{ paddingTop: 'var(--header-height, 145px)' }}
      >
        <div className="container text-center">
          <h1 className="font-serif text-lg md:text-xl font-semibold tracking-widest uppercase text-brand-primary border-b-2 border-[hsl(var(--brand-secondary))] pb-2 px-4 inline-block">
            Nos Coups de Cœur
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-sm mt-6">
            En Corse-du-Sud, des artisans et des lieux d'exception
          </p>
        </div>
      </section>

      {/* Introduction par Maître Marcaggi */}
      <section className="py-12 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-[200px_1fr] gap-8 items-start">
              <div className="flex justify-center">
                <img
                  src={maitreMarcaggi}
                  alt="Maître Marcaggi"
                  className="w-40 h-auto object-contain"
                />
              </div>
              <div className="space-y-4">
                <blockquote className="text-muted-foreground leading-relaxed text-base italic border-l-4 border-brand-gold pl-6">
                  <p>
                    « Toute l'année, nous voyons passer de belles choses. Parfois, les encadrements 
                    sont refaits avec un soin remarquable. En matière de bijouterie et de joaillerie, 
                    les artisans font un travail magnifique.
                  </p>
                  <p className="mt-4">
                    Alors, avec l'équipe, nous avons décidé de vous transmettre — si vous nous 
                    faites confiance — un certain nombre d'adresses, publiques et privées, où l'on 
                    reçoit un bon accueil, où les gens sont talentueux, où le savoir-faire est rigoureux.
                  </p>
                  <p className="mt-4">
                    Voici nos coups de cœur en Corse-du-Sud. »
                  </p>
                </blockquote>
                <p className="text-right text-sm text-brand-primary font-serif">
                  — Maître Marcaggi
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Liste des coups de cœur */}
      <section className="py-12">
        <div className="container">
          <div className="space-y-16">
            {coupsDeCoeur.map((item, index) => (
              <article 
                key={index} 
                className={`grid md:grid-cols-2 gap-8 items-center ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="relative overflow-hidden group">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-[300px] object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-brand-gold text-brand-primary px-4 py-1.5 text-xs font-sans tracking-wider font-medium">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`space-y-4 ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <h3 className="font-serif text-lg md:text-xl font-medium text-brand-primary">
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {item.article}
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <MapPin size={14} className="text-brand-gold" />
                      {item.address}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone size={14} className="text-brand-gold" />
                      {item.phone}
                    </p>
                    {item.website !== "#" && (
                      <a 
                        href={item.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-gold transition-colors"
                      >
                        <Globe size={14} />
                        Visiter le site
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-brand-primary text-brand-primary-foreground">
        <div className="container text-center">
          <h2 className="font-serif text-lg md:text-xl font-light mb-4">
            Vous connaissez une adresse d'exception ?
          </h2>
          <p className="text-brand-primary-foreground/80 mb-6 max-w-xl mx-auto text-sm">
            Partagez-nous vos découvertes. Les bonnes adresses se transmettent.
          </p>
          <Link
            to="/contact"
            className="inline-block border-2 border-brand-gold text-brand-gold px-8 py-3 font-sans text-sm tracking-widest uppercase hover:bg-brand-gold hover:text-brand-primary transition-colors"
          >
            Nous écrire
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RegionTalents;
