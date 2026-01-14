import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowRight } from "lucide-react";

const specialites = [
  {
    id: "bijoux-montres",
    title: "Bijoux et Montres",
    subtitle: "Haute joaillerie et horlogerie de prestige",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop",
    description: "De la bague de fiançailles héritée de votre grand-mère aux montres de collection, nous expertisons et vendons vos pièces précieuses avec le soin qu'elles méritent."
  },
  {
    id: "vins-spiritueux",
    title: "Vins et Spiritueux",
    subtitle: "Grands crus et millésimes d'exception",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop",
    description: "Caves de particuliers, collections de grands crus, cognacs et whiskies rares : notre expert œnologue révèle la valeur cachée de vos bouteilles."
  },
  {
    id: "art-xxeme",
    title: "Art du XXème siècle",
    subtitle: "Moderne et contemporain",
    image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&h=400&fit=crop",
    description: "Peintures, sculptures, lithographies : l'art moderne et contemporain trouve chez nous une expertise pointue et un marché de collectionneurs avertis."
  },
  {
    id: "voitures-collection",
    title: "Voitures de Collection",
    subtitle: "Automobiles anciennes et youngtimers",
    image: "/images/voiture-collection.avif",
    description: "Du cabriolet des années 60 au youngtimer des années 90, nous organisons des ventes événementielles qui rassemblent les passionnés."
  },
  {
    id: "ceramiques",
    title: "Céramiques et Porcelaines",
    subtitle: "Faïences, grès et manufactures renommées",
    image: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=600&h=400&fit=crop",
    description: "Sèvres, Limoges, Vallauris : les céramiques d'art et de manufacture trouvent ici des acquéreurs passionnés et des estimations justes."
  },
  {
    id: "militaria",
    title: "Militaria et Souvenirs Historiques",
    subtitle: "Armes, décorations et uniformes",
    image: "/images/uniforme-hussard-militaria.jpg",
    description: "Une spécialité délicate qui demande expertise réglementaire et connaissance historique. Nos ventes attirent collectionneurs et musées."
  }
];

const Specialites = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero - Cadre doré centré sur fond bleu-gris */}
      <section 
        className="relative pb-12 md:pb-16 bg-[hsl(var(--brand-blue-200))] overflow-hidden"
        style={{ paddingTop: 'var(--header-height, 145px)' }}
      >
        <div className="container relative z-10">
          <div className="max-w-2xl mx-auto border-2 border-[hsl(var(--brand-gold-500))] p-6 md:p-10 text-center">
            <h1 className="text-2xl md:text-3xl font-serif mb-4 text-[hsl(var(--brand-primary))]">
              Nos Spécialités
            </h1>
            <p className="text-base text-[hsl(var(--brand-primary)/0.8)]">
              Six domaines d'excellence où notre expertise fait la différence. 
              Chaque spécialité bénéficie d'un expert dédié et d'un réseau d'acheteurs qualifiés.
            </p>
          </div>
        </div>
      </section>

      {/* Grille des spécialités */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {specialites.map((spec, index) => (
              <Link 
                key={spec.id}
                to={`/specialites/${spec.id}`}
                className="group block bg-white border border-[hsl(var(--brand-gold-200))] overflow-hidden card-shadow hover:border-[hsl(var(--brand-gold-400))] transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-[3/2] overflow-hidden">
                  <img 
                    src={spec.image} 
                    alt={spec.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-serif text-[hsl(var(--brand-primary))] mb-1 group-hover:text-[hsl(var(--brand-blue-600))] transition-colors">
                    {spec.title}
                  </h2>
                  <p className="text-sm text-[hsl(var(--brand-gold-700))] mb-3">
                    {spec.subtitle}
                  </p>
                  <p className="text-muted-foreground text-sm mb-4">
                    {spec.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--brand-primary))] group-hover:gap-3 transition-all">
                    Découvrir <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Autres ventes */}
      <section className="py-16 md:py-24 bg-[hsl(var(--brand-blue-100))]">
        <div className="container">
          <h2 className="section-title mb-8">ET TOUTES NOS AUTRES VENTES</h2>
          <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-12">
            Au-delà de nos spécialités, nous apportons le même soin et la même expertise à toutes les catégories d'objets. 
            Chaque pièce mérite une attention particulière, quelle que soit sa nature.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Mobilier", desc: "Du XVIIe au design contemporain" },
              { title: "Tableaux anciens", desc: "Écoles françaises et européennes" },
              { title: "Objets d'art", desc: "Bronzes, pendules, objets de vitrine" },
              { title: "Arts de la table", desc: "Argenterie, cristal, services" },
              { title: "Livres anciens", desc: "Éditions rares et manuscrits" },
              { title: "Bandes dessinées", desc: "Originaux et albums rares" },
              { title: "Mode et vintage", desc: "Haute couture et accessoires" },
              { title: "Instruments de musique", desc: "Du violon au piano de concert" }
            ].map((item) => (
              <div 
                key={item.title}
                className="p-6 bg-white border border-[hsl(var(--brand-gold-200))] hover:border-[hsl(var(--brand-gold-400))] transition-colors"
              >
                <h3 className="font-serif text-[hsl(var(--brand-primary))] mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <p className="text-center mt-12 text-[hsl(var(--brand-blue-600))] italic">
            "Nous traitons chaque vente courante avec l'attention d'une vente spécialisée."
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Specialites;