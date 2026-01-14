import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Images d'illustration
import vlaminckGrenier from "@/assets/aventures/vlaminck-grenier.jpg";
import coffreMystere from "@/assets/aventures/coffre-mystere.jpg";
import collectionPharmacien from "@/assets/aventures/collection-pharmacien.jpg";
import tresorVideGrenier from "@/assets/aventures/tresor-vide-grenier.jpg";
import archivesResistant from "@/assets/aventures/archives-resistant.jpg";
import cavePetrus from "@/assets/aventures/cave-petrus.jpg";
import bugattiHangar from "@/assets/aventures/bugatti-hangar.jpg";
import manuscritAbbaye from "@/assets/aventures/manuscrit-abbaye.jpg";

const aventuresEncheres = [
  {
    title: "Le Vlaminck oublié du grenier",
    category: "Redécouverte",
    date: "Mars 2025",
    imageUrl: vlaminckGrenier,
    description: "Lors d'un inventaire de succession à Biarritz, nous découvrons sous une bâche un tableau poussiéreux signé Vlaminck. Authentifié par un expert parisien, ce paysage fauve de Bougival a été adjugé 47 000€ à un collectionneur belge. La famille ignorait totalement sa valeur depuis trois générations."
  },
  {
    title: "L'ouverture du coffre mystère",
    category: "Coffre-fort",
    date: "Novembre 2024",
    imageUrl: coffreMystere,
    description: "Un coffre-fort scellé depuis 1945, retrouvé dans une villa de Pau. Après l'intervention d'un serrurier spécialisé, nous y avons découvert des bijoux Art Déco, des pièces d'or napoléoniennes et des lettres d'amour. L'ensemble a été dispersé en vente pour 85 000€, révélant une histoire de famille bouleversante."
  },
  {
    title: "La collection secrète du pharmacien",
    category: "Inventaire",
    date: "Juin 2025",
    imageUrl: collectionPharmacien,
    description: "Derrière l'officine d'un pharmacien décédé, une pièce fermée à clé cachait 40 ans de passion : 800 flacons de parfum anciens, des affiches publicitaires Mucha et une collection de boîtes en porcelaine. Cette vente thématique a attiré des collectionneurs du monde entier."
  },
  {
    title: "Le trésor du vide-grenier",
    category: "Belle surprise",
    date: "Septembre 2025",
    imageUrl: tresorVideGrenier,
    description: "Un client nous apporte une petite statuette en bronze achetée 15€ dans un vide-grenier. Notre expertise révèle une œuvre de Barye, célèbre sculpteur animalier du XIXe. Estimée 3 000€, elle a finalement été adjugée 8 500€ après une bataille d'enchères mémorable entre deux collectionneurs."
  },
  {
    title: "Les archives d'un résistant",
    category: "Émotion",
    date: "Mai 2025",
    imageUrl: archivesResistant,
    description: "Dans une malle en osier, des documents exceptionnels : carnets de guerre, messages codés, photographies clandestines d'un réseau de résistants basques. Le Musée de la Résistance s'est porté acquéreur de l'ensemble, préservant ainsi une mémoire précieuse pour les générations futures."
  },
  {
    title: "Le Pétrus de la cave oubliée",
    category: "Vins",
    date: "Octobre 2025",
    imageUrl: cavePetrus,
    description: "Une cave murée dans un château bordelais révèle son secret : 200 bouteilles de grands crus des années 1950-1970, dont 12 Pétrus 1961. Conservées dans des conditions parfaites, ces bouteilles ont créé l'événement lors de notre vente de vins, totalisant 120 000€."
  },
  {
    title: "La Bugatti du hangar abandonné",
    category: "Automobile",
    date: "Décembre 2025",
    imageUrl: bugattiHangar,
    description: "Dans un hangar agricole des Pyrénées, sous des bâches et du foin, dormait une Bugatti Type 57 de 1937. Retrouvée lors d'une succession, cette grange find exceptionnelle a nécessité des mois de recherches pour authentifier son histoire. Adjugée 1,2 million d'euros."
  },
  {
    title: "Le manuscrit de l'abbaye",
    category: "Livres anciens",
    date: "Juillet 2025",
    imageUrl: manuscritAbbaye,
    description: "Un manuscrit enluminé du XIIe siècle, conservé depuis des générations dans une famille sans qu'elle en connaisse l'importance. Ce livre de prières carolingien a rejoint la collection de la Bibliothèque nationale après une vente sous le feu des projecteurs des médias."
  }
];

const AventuresEncheres = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Aventures d'Enchères | Douze pages & associés</title>
        <meta name="description" content="Découvrez les histoires extraordinaires de nos ventes : trésors oubliés, coffres mystérieux, redécouvertes inattendues. Les coulisses passionnantes du métier de commissaire-priseur." />
      </Helmet>

      <Header />

      {/* Hero Section - H1 style cohérent avec les autres pages */}
      <section 
        className="pb-12 bg-background"
        style={{ paddingTop: 'var(--header-height, 145px)' }}
      >
        <div className="container text-center">
          <h1 className="font-serif text-lg md:text-xl font-semibold tracking-widest uppercase text-brand-primary border-b-2 border-[hsl(var(--brand-secondary))] pb-2 px-4 inline-block">
            Aventures d'Enchères
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-sm mt-6">
            Inventaires surprenants, coffres mystérieux, trésors oubliés dans des greniers...
          </p>
        </div>
      </section>

      {/* Introduction hero */}
      <section className="py-12 bg-brand-primary text-brand-primary-foreground">
        <div className="container text-center">
          <p className="text-brand-primary-foreground/80 max-w-3xl mx-auto leading-relaxed text-sm">
            Chaque jour, notre métier nous réserve des découvertes extraordinaires. 
            Voici quelques-unes de nos plus belles histoires.
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-muted-foreground leading-relaxed text-sm">
              Le commissaire-priseur est souvent le premier à pénétrer dans des lieux fermés depuis des décennies.
              Greniers poussiéreux, caves oubliées, coffres-forts scellés... Chaque inventaire est une exploration,
              chaque objet peut receler une surprise. Ces histoires sont vraies. Elles témoignent de la magie 
              de notre métier et de l'importance de faire expertiser vos biens avant de les jeter ou de les vendre.
            </p>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12">
            {aventuresEncheres.map((aventure, index) => (
              <article 
                key={index} 
                className="group bg-card border border-border overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={aventure.imageUrl}
                    alt={aventure.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-brand-gold text-brand-primary px-4 py-1.5 text-xs font-sans tracking-wider font-medium">
                      {aventure.category}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <span className="text-xs text-muted-foreground font-sans tracking-wider uppercase">
                    {aventure.date}
                  </span>
                  <h2 className="font-serif text-lg md:text-xl font-medium mt-3 mb-4 group-hover:text-brand-gold transition-colors">
                    {aventure.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {aventure.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Citation */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <blockquote className="max-w-3xl mx-auto text-center">
            <p className="font-serif text-lg md:text-xl font-light italic text-brand-primary leading-relaxed">
              "Chaque objet a une histoire. Notre métier est de la révéler 
              et de trouver l'acquéreur qui saura la poursuivre."
            </p>
            <footer className="mt-4 text-muted-foreground text-sm">
              — Jean-Pierre Delbarry, Commissaire-priseur
            </footer>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-brand-primary text-brand-primary-foreground">
        <div className="container text-center">
          <h2 className="font-serif text-lg md:text-xl font-light mb-4">
            Et si votre grenier cachait un trésor ?
          </h2>
          <p className="text-brand-primary-foreground/80 mb-6 max-w-xl mx-auto text-sm">
            Nous nous déplaçons gratuitement pour évaluer vos biens. 
            N'hésitez pas à nous contacter pour une estimation sans engagement.
          </p>
          <Link
            to="/contact#formulaire"
            className="inline-block border-2 border-brand-gold text-brand-gold px-8 py-3 font-sans text-sm tracking-widest uppercase hover:bg-brand-gold hover:text-brand-primary transition-colors"
          >
            Demander une estimation
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AventuresEncheres;
