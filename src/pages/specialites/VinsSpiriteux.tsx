import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Quote, Calendar, Wine } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import verreVinRouge from "@/assets/verre-vin-rouge.png";
import bouteillePetrus from "@/assets/bouteille-petrus.png";
import bouteilleChartreuse from "@/assets/bouteille-chartreuse.png";
import expertVins from "@/assets/expert-vins-spiritueux.png";
import romaneeConti from "@/assets/vins/romanee-conti.png";
import petrus from "@/assets/vins/petrus.png";
import lafite from "@/assets/vins/lafite.png";
import macallan from "@/assets/vins/macallan.png";
import domPerignon from "@/assets/vins/dom-perignon.png";
import hennessy from "@/assets/vins/hennessy.png";

const bellesEncheres = [
  { title: "Romanée-Conti 1990", price: "18 500 €", image: romaneeConti },
  { title: "Pétrus 1982", price: "4 200 €", image: petrus },
  { title: "Château Lafite Rothschild 1961", price: "3 800 €", image: lafite },
  { title: "Macallan 25 ans", price: "2 400 €", image: macallan },
  { title: "Dom Pérignon 1969", price: "1 950 €", image: domPerignon },
  { title: "Cognac Hennessy X.X.O", price: "890 €", image: hennessy },
];

const autresSpecialites = [
  { id: "bijoux-montres", title: "Bijoux et Montres" },
  { id: "art-xxeme", title: "Art du XXème" },
  { id: "voitures-collection", title: "Voitures de Collection" },
  { id: "ceramiques", title: "Céramiques" },
  { id: "militaria", title: "Militaria" },
];

const VinsSpiriteux = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - Titre H1 + Cartouches + Autres spécialités */}
      <section 
        className="pb-12 md:pb-16 bg-[hsl(var(--brand-blue-100))]"
        style={{ paddingTop: 'var(--header-height, 145px)' }}
      >
        <div className="container">
          {/* Titre H1 encadré doré */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-block border-2 border-[hsl(var(--brand-gold-500))] px-12 md:px-16 py-4 md:py-6 mb-4">
              <h1 className="text-2xl md:text-3xl font-serif text-[hsl(var(--brand-primary))]">
                Vins et Spiritueux
              </h1>
            </div>
            <p className="text-lg md:text-xl text-[hsl(var(--brand-primary)/0.8)]">
              Grands crus et millésimes d'exception
            </p>
          </div>

          {/* Cartouches cliquables - 30% plus petites */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Prochaine vente */}
            <Link 
              to="/acheter" 
              className="group bg-[hsl(var(--brand-primary))] p-5 text-white hover:bg-[hsl(var(--brand-primary)/0.9)] transition-colors border border-[hsl(var(--brand-gold-400)/0.3)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-6 h-6 text-[hsl(var(--brand-gold-400))]" />
                <span className="text-[hsl(var(--brand-gold-400))] text-xs uppercase tracking-wider">Prochaine vente</span>
              </div>
              <h3 className="text-lg font-serif mb-1">Vente de Vins et Spiritueux</h3>
              <p className="text-xl font-semibold text-[hsl(var(--brand-gold-400))] mb-2">21 mars 2026</p>
              <p className="text-white/70 text-xs group-hover:text-white transition-colors">
                Catalogue en cours de préparation →
              </p>
            </Link>

            {/* Expertise */}
            <Link 
              to="/expertises" 
              className="group bg-[hsl(var(--brand-primary))] p-5 text-white hover:bg-[hsl(var(--brand-primary)/0.9)] transition-colors border border-[hsl(var(--brand-gold-400)/0.3)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <Wine className="w-6 h-6 text-[hsl(var(--brand-gold-400))]" />
                <span className="text-[hsl(var(--brand-gold-400))] text-xs uppercase tracking-wider">Expertise</span>
              </div>
              <h3 className="text-lg font-serif mb-1">Expertise de vos Vins</h3>
              <p className="text-base text-white/90 mb-2">Caves et Collections</p>
              <p className="text-white/70 text-xs group-hover:text-white transition-colors">
                Sur rendez-vous uniquement →
              </p>
            </Link>
          </div>

          {/* Autres spécialités sur une ligne - 20px d'espace, texte plus grand */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm uppercase tracking-wide" style={{ marginTop: '20px' }}>
            <span className="text-[hsl(var(--brand-primary))] font-semibold">NOS AUTRES SPÉCIALITÉS :</span>
            {autresSpecialites.map((spec, index) => (
              <span key={spec.id} className="flex items-center">
                <Link 
                  to={`/specialites/${spec.id}`}
                  className="text-[hsl(var(--brand-primary))] hover:text-[hsl(var(--brand-gold-500))] transition-colors font-medium"
                >
                  {spec.title.toUpperCase()}
                </Link>
                {index < autresSpecialites.length - 1 && (
                  <span className="text-[hsl(var(--brand-primary)/0.4)] mx-2">•</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Synthèse avec bouteilles encadrant le texte */}
      <section className="py-16 md:py-20 relative">
        <div className="container max-w-5xl">
          <div className="relative flex items-center justify-center gap-6 md:gap-12">
            {/* Bouteille Pétrus à gauche */}
            <div className="hidden md:flex flex-shrink-0 w-40 lg:w-52 items-center justify-center">
              <img 
                src={bouteillePetrus} 
                alt="Bouteille de Pétrus" 
                className="w-full h-auto max-h-96 object-contain"
                style={{ filter: 'drop-shadow(4px 8px 16px rgba(0,0,0,0.4))' }}
              />
            </div>
            
            {/* Contenu central */}
            <div className="flex-1 max-w-3xl text-center">
              <h2 className="text-2xl font-serif text-[hsl(var(--brand-primary))] mb-8">
                L'Excellence en Bouteille
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  Le marché des vins fins et spiritueux rares connaît un essor remarquable. Caves familiales constituées 
                  au fil des décennies, collections de passionnés, héritages de professionnels : chaque cave recèle 
                  des trésors qui méritent une expertise rigoureuse.
                </p>
                <p>
                  Notre spécialiste œnologue évalue l'état de conservation, vérifie l'authenticité des étiquettes 
                  et des capsules, et estime chaque bouteille en fonction des cotations actuelles du marché. 
                  Des grands crus classés de Bordeaux aux premiers crus de Bourgogne, en passant par les champagnes 
                  de prestige et les spiritueux d'exception, nous couvrons l'ensemble du spectre œnologique.
                </p>
                <p>
                  Nos ventes thématiques attirent une clientèle d'amateurs avertis et de professionnels, 
                  garantissant des enchères animées et des résultats optimaux.
                </p>
              </div>
            </div>
            
            {/* Bouteille Chartreuse à droite */}
            <div className="hidden md:flex flex-shrink-0 w-40 lg:w-52 items-center justify-center">
              <img 
                src={bouteilleChartreuse} 
                alt="Bouteille de Chartreuse" 
                className="w-full h-auto max-h-96 object-contain"
                style={{ filter: 'drop-shadow(4px 8px 16px rgba(0,0,0,0.4))' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contenu spécialisé - fond blanc avec photo */}
      <section className="py-16 md:py-20 bg-white relative overflow-hidden">
        {/* Verre de vin en arrière-plan - zoomé sur le récipient, plein écran */}
        <div className="absolute inset-0 pointer-events-none">
          <img 
            src={verreVinRouge} 
            alt="" 
            className="w-full h-full object-cover object-top scale-150"
          />
        </div>
        
        <div className="container relative z-10">
          <h2 className="section-title mb-12">NOTRE EXPERTISE EN DÉTAIL</h2>
          
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Vins */}
            <div className="bg-white/90 backdrop-blur-sm p-8 border border-[hsl(var(--brand-gold-200))] shadow-sm">
              <h3 className="text-xl font-serif text-[hsl(var(--brand-primary))] mb-6 pb-4 border-b border-[hsl(var(--brand-gold-300))]">
                Les Grands Vins
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Bordeaux</h4>
                  <p className="text-sm">
                    Premiers grands crus classés (Lafite, Latour, Margaux, Haut-Brion, Mouton), Saint-Émilion, 
                    Pomerol (Pétrus, Le Pin)... Les millésimes mythiques (1945, 1961, 1982, 2000, 2005, 2009, 2010) 
                    atteignent des sommets.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Bourgogne</h4>
                  <p className="text-sm">
                    Romanée-Conti, La Tâche, Richebourg, Musigny... Les domaines mythiques (DRC, Leroy, Rousseau, Roumier) 
                    produisent des vins parmi les plus recherchés au monde.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Autres régions</h4>
                  <p className="text-sm">
                    Rhône (Hermitage, Côte-Rôtie), Champagne (Dom Pérignon, Krug, Salon), Alsace (vendanges tardives), 
                    Loire (Sauternes, Vouvray)... Chaque terroir a ses pépites.
                  </p>
                </div>
              </div>
            </div>

            {/* Spiritueux */}
            <div className="bg-white/90 backdrop-blur-sm p-8 border border-[hsl(var(--brand-gold-200))] shadow-sm">
              <h3 className="text-xl font-serif text-[hsl(var(--brand-primary))] mb-6 pb-4 border-b border-[hsl(var(--brand-gold-300))]">
                Spiritueux d'Exception
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Cognac</h4>
                  <p className="text-sm">
                    Hennessy, Rémy Martin, Martell, Courvoisier... Les millésimes anciens et les éditions limitées 
                    (carafes Baccarat, coffrets prestigieux) sont très prisés des collectionneurs asiatiques.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Whisky</h4>
                  <p className="text-sm">
                    Macallan, Glenfiddich, Dalmore, Yamazaki... Les single malts écossais et japonais atteignent 
                    des records. L'âge, la rareté et l'état du packaging sont déterminants.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Armagnac et Rhum</h4>
                  <p className="text-sm">
                    Armagnacs millésimés du début du XXe siècle, rhums agricoles de collection (J.M, Clément)... 
                    Ces marchés de niche offrent de belles opportunités.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conservation et authenticité */}
          <div className="bg-white/90 backdrop-blur-sm p-8 border border-[hsl(var(--brand-gold-200))] shadow-sm">
            <h3 className="text-xl font-serif text-[hsl(var(--brand-primary))] mb-6 pb-4 border-b border-[hsl(var(--brand-gold-300))]">
              Conservation et Authenticité
            </h3>
            <div className="grid md:grid-cols-3 gap-8 text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-2">État des bouteilles</h4>
                <p className="text-sm">
                  Niveau du vin (épaule, mi-épaule), état de l'étiquette et de la capsule, couleur du vin... 
                  Ces critères influencent directement la valeur et la buvabilité.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Traçabilité</h4>
                <p className="text-sm">
                  Provenance directe (château, domaine), conditions de stockage, factures d'origine... 
                  Une provenance impeccable rassure les acheteurs exigeants.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Détection des contrefaçons</h4>
                <p className="text-sm">
                  Les grands crus sont hélas copiés. Nous vérifions capsules, étiquettes, millésimes cohérents 
                  et faisons appel à des experts externes en cas de doute.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Le mot de l'expert */}
      <section className="py-16 md:py-24 bg-[hsl(var(--brand-primary))] text-white">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <Quote className="h-12 w-12 mx-auto mb-6 text-[hsl(var(--brand-gold-400))]" />
            <h2 className="text-2xl font-serif mb-2">Le Mot de l'Expert</h2>
          </div>
          
          <div className="bg-white/5 border border-[hsl(var(--brand-gold-400)/0.3)] p-8 md:p-12 relative overflow-visible">
            {/* Portrait de l'expert en haut à droite - dépasse au dessus */}
            <div className="absolute -top-12 right-4 w-32 h-40 md:w-40 md:h-52 border-2 border-[hsl(var(--brand-gold-400)/0.5)] overflow-hidden shadow-xl">
              <img 
                src={expertVins} 
                alt="Pierre Dubois, Expert en vins et spiritueux" 
                className="w-full h-full object-cover object-top"
              />
            </div>
            
            <blockquote className="text-lg md:text-xl italic mb-8 text-white/90 leading-relaxed pr-28 md:pr-36">
              "Une cave, c'est une autobiographie liquide. Chaque bouteille raconte un voyage, un dîner mémorable 
              qu'on n'a jamais osé ouvrir, un achat impulsif lors d'une visite de domaine. Quand j'inventorie 
              une cave, je découvre la vie de son propriétaire. Mon rôle est de transformer cette collection 
              en patrimoine monnayable, tout en respectant les intentions originelles. Certaines bouteilles 
              méritent d'être bues, d'autres de rejoindre des collections où elles seront préservées. 
              C'est cette alchimie entre plaisir et investissement qui rend le marché des vins si fascinant."
            </blockquote>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[hsl(var(--brand-gold-400))] rounded-full flex items-center justify-center text-[hsl(var(--brand-primary))] font-serif text-xl">
                PD
              </div>
              <div>
                <p className="font-medium text-lg">Pierre Dubois</p>
                <p className="text-[hsl(var(--brand-gold-400))]">Expert en vins et spiritueux</p>
                <p className="text-white/60 text-sm">Sommelier certifié, 22 ans d'expérience</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Belles enchères carousel */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container">
          <h2 className="section-title mb-12">NOS BELLES ENCHÈRES</h2>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {bellesEncheres.map((item, index) => (
                <CarouselItem key={index} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <div className="group cursor-pointer">
                    <div className="aspect-square bg-[hsl(var(--brand-blue-100))] mb-4 overflow-hidden border border-[hsl(var(--brand-gold-200))]">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="font-medium text-foreground text-sm mb-1">{item.title}</h3>
                    <p className="text-[hsl(var(--brand-gold-500))] font-semibold">{item.price}</p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VinsSpiriteux;
