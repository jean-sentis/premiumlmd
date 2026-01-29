import { Helmet } from "react-helmet-async";
import SpecialtyPageTemplate from "@/components/SpecialtyPageTemplate";

// Placeholder - Les vraies images et contenus seront ajoutés
const bellesEncheres = [
  { title: "Ferrari 308 GTS 1979", price: "89 000 €", date: "Octobre 2024", image: "/images/voiture-collection.avif", link: "/resultats" },
  { title: "Porsche 911 Carrera 3.2 1987", price: "78 000 €", date: "Juin 2024", image: "/images/voiture-collection.avif", link: "/resultats" },
  { title: "Citroën DS 21 Pallas 1972", price: "42 000 €", date: "Mars 2024", image: "/images/voiture-collection.avif", link: "/resultats" },
  { title: "Alpine A110 1600S 1973", price: "95 000 €", date: "Décembre 2023", image: "/images/voiture-collection.avif", link: "/resultats" },
  { title: "Jaguar E-Type 4.2 Series II 1969", price: "125 000 €", date: "Octobre 2023", image: "/images/voiture-collection.avif", link: "/resultats" },
  { title: "Mercedes 280 SL Pagode 1970", price: "115 000 €", date: "Juin 2023", image: "/images/voiture-collection.avif", link: "/resultats" },
  { title: "Peugeot 205 GTI 1.9 1987", price: "38 000 €", date: "Mars 2023", image: "/images/voiture-collection.avif", link: "/resultats" },
  { title: "Lancia Delta HF Integrale 1991", price: "72 000 €", date: "Décembre 2022", image: "/images/voiture-collection.avif", link: "/resultats" },
];

const DetailContent = () => (
  <div className="max-w-5xl mx-auto">
    <div className="grid md:grid-cols-2 gap-12 mb-16">
      {/* Véhicules de prestige */}
      <div className="bg-[hsl(var(--brand-blue-100))] p-8 border border-[hsl(var(--brand-gold-200))]">
        <h3 className="text-xl font-semibold text-[hsl(var(--brand-primary))] mb-6 pb-4 border-b border-[hsl(var(--brand-gold-300))]">
          Prestige et Sport
        </h3>
        <div className="space-y-4 text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">Ferrari</h4>
            <p className="text-sm">
              Des 250 GT aux Testarossa, en passant par les F40 et F50... La marque au cheval cabré 
              domine le marché de la collection. L'historique complet et les numéros correspondants 
              sont essentiels.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Porsche</h4>
            <p className="text-sm">
              356, 911 classiques (2.0, 2.4, Carrera RS), 928, 944 Turbo... Porsche offre une gamme 
              large avec des prix accessibles et des icônes à plusieurs millions.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Aston Martin, Jaguar, Mercedes</h4>
            <p className="text-sm">
              DB5, E-Type, Pagode, 300 SL Papillon... Les GT britanniques et allemandes 
              constituent le cœur du marché européen de la collection.
            </p>
          </div>
        </div>
      </div>

      {/* Automobiles françaises */}
      <div className="bg-[hsl(var(--brand-blue-100))] p-8 border border-[hsl(var(--brand-gold-200))]">
        <h3 className="text-xl font-semibold text-[hsl(var(--brand-primary))] mb-6 pb-4 border-b border-[hsl(var(--brand-gold-300))]">
          Excellence Française
        </h3>
        <div className="space-y-4 text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">Citroën</h4>
            <p className="text-sm">
              Traction, DS, SM, CX... L'avant-gardisme technique de Citroën en fait des icônes 
              du design automobile. Les versions Chapron et Pallas sont particulièrement prisées.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Alpine et sportives</h4>
            <p className="text-sm">
              A110, A310, GTA... Les berlinettes Alpine connaissent une cote en hausse constante. 
              Matra, Gordini et autres préparateurs français ont aussi leur public.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Prestige français</h4>
            <p className="text-sm">
              Facel Vega, Delahaye, Talbot-Lago... L'âge d'or de l'automobile française de luxe 
              (1930-1960) produit des chefs-d'œuvre très recherchés.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Expertise technique */}
    <div className="bg-[hsl(var(--brand-blue-100))] p-8 border border-[hsl(var(--brand-gold-200))]">
      <h3 className="text-xl font-semibold text-[hsl(var(--brand-primary))] mb-6 pb-4 border-b border-[hsl(var(--brand-gold-300))]">
        Critères d'Évaluation
      </h3>
      <div className="grid md:grid-cols-3 gap-8 text-muted-foreground">
        <div>
          <h4 className="font-medium text-foreground mb-2">Authenticité</h4>
          <p className="text-sm">
            Numéros concordants (châssis, moteur, boîte), pièces d'origine vs restaurées, 
            carrosserie d'origine ou refaite... La traçabilité est primordiale.
          </p>
        </div>
        <div>
          <h4 className="font-medium text-foreground mb-2">Historique documenté</h4>
          <p className="text-sm">
            Carnet d'entretien, factures, photos d'époque, palmarès en compétition... 
            Un historique complet peut doubler la valeur d'un véhicule.
          </p>
        </div>
        <div>
          <h4 className="font-medium text-foreground mb-2">État et restauration</h4>
          <p className="text-sm">
            État "sortie de grange", restauration concours ou patine d'usage ? 
            Chaque état a son marché et ses amateurs.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const VoituresCollection = () => {
  return (
    <>
      <Helmet>
        <title>Voitures de Collection | Douze pages & associés - Ventes aux enchères</title>
        <meta name="description" content="Expertise et vente aux enchères de voitures de collection. Ferrari, Porsche, Citroën DS, Alpine, youngtimers. Ventes événementielles pour passionnés d'automobiles anciennes." />
      </Helmet>
      <SpecialtyPageTemplate
        title="Voitures de Collection"
        mentionAffective="La passion de l'automobile, célébrée avec exigence"
        currentSpecialtyId="voitures-collection"
        bellesEncheres={bellesEncheres}
        seoTitle="La Passion de l'Automobile"
        seoContent={
          <>
            <p>
              Les voitures de collection représentent bien plus qu'un investissement : elles incarnent 
              des époques, des innovations techniques et des émotions. Du cabriolet des années 30 
              à la sportive des années 80, chaque véhicule raconte une histoire.
            </p>
            <p className="mt-4">
              Notre expertise automobile couvre l'ensemble du spectre : véhicules de prestige (Ferrari, Porsche, 
              Aston Martin), automobiles françaises de caractère (Citroën DS, Alpine, Facel Vega), classiques 
              populaires (2CV, Coccinelle) et youngtimers des années 80-90 qui deviennent des classiques.
            </p>
            <p className="mt-4">
              Nous organisons des ventes événementielles qui rassemblent passionnés et collectionneurs, 
              avec une mise en scène adaptée à ces objets d'exception.
            </p>
          </>
        }
        ventesCards={[
          {
            type: "en-ligne",
            titre: "Automobiles de Collection",
            date: "15 mai 2026",
            nombreLots: 45,
            lien: "/acheter",
            image: "/images/voiture-collection.avif"
          },
          {
            type: "preparation",
            titre: "Youngtimers et Sportives",
            date: "Septembre 2026",
            lien: "/vendre",
            image: "/images/voiture-collection.avif"
          }
        ]}
        detailTitle="NOTRE EXPERTISE EN DÉTAIL"
        detailContent={<DetailContent />}
        expert={{
          nom: "Jacques Beaumont",
          titre: "Expert automobile • Ancien pilote, 30 ans dans le monde de la collection",
          bio: "Passionné d'automobiles depuis l'enfance, Jacques Beaumont a couru en compétition historique avant de se consacrer à l'expertise. Son expérience de pilote lui permet d'évaluer les véhicules tant sur le plan mécanique qu'émotionnel. Il connaît personnellement les plus grands collectionneurs européens.",
          photo: "/placeholder.svg"
        }}
        saviezVous={[
          {
            question: "Qu'est-ce qu'un véhicule 'matching numbers' ?",
            reponse: "Un véhicule 'matching numbers' possède encore ses composants d'origine (moteur, boîte de vitesses, pont) dont les numéros de série correspondent à ceux gravés sur le châssis lors de la sortie d'usine. Cette concordance, vérifiable sur les fiches d'identification, peut augmenter la valeur d'un véhicule de 30 à 50%.",
            image: "/images/voiture-collection.avif"
          },
          {
            question: "Pourquoi les youngtimers explosent-ils en cote ?",
            reponse: "Les collectionneurs d'aujourd'hui ont grandi avec les voitures des années 80-90. La 205 GTI, la Golf GTI, la BMW E30 M3 sont les icônes de leur jeunesse. Ce facteur nostalgie, combiné à une mécanique encore accessible et à des stocks qui s'amenuisent, explique l'envolée des cotes de ces 'jeunes classiques'.",
            image: "/images/voiture-collection.avif"
          },
          {
            question: "Vaut-il mieux acheter une voiture restaurée ou à restaurer ?",
            reponse: "Tout dépend de vos objectifs. Une restauration de qualité coûte souvent plus cher que prévu et la valeur finale n'est pas garantie. Un véhicule expertement restauré avec factures évite les mauvaises surprises. En revanche, une 'sortie de grange' authentique peut réserver de belles découvertes pour qui sait chercher.",
            image: "/images/voiture-collection.avif"
          }
        ]}
        ventesPassees={[
          {
            titre: "Automobiles de Collection",
            date: "Septembre 2024",
            nombreLots: 52,
            image: "/images/voiture-collection.avif",
            lien: "/ventes-passees/voitures-2024-09"
          },
          {
            titre: "Youngtimers et Sportives",
            date: "Mai 2024",
            nombreLots: 38,
            image: "/images/voiture-collection.avif",
            lien: "/ventes-passees/voitures-2024-05"
          },
          {
            titre: "Prestige Automobile",
            date: "Novembre 2023",
            nombreLots: 45,
            image: "/images/voiture-collection.avif",
            lien: "/ventes-passees/voitures-2023-11"
          },
          {
            titre: "Véhicules Anciens",
            date: "Mars 2023",
            nombreLots: 62,
            image: "/images/voiture-collection.avif",
            lien: "/ventes-passees/voitures-2023-03"
          }
        ]}
      />
    </>
  );
};

export default VoituresCollection;