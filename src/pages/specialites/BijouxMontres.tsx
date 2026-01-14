import { Helmet } from "react-helmet-async";
import SpecialtyPageTemplate from "@/components/SpecialtyPageTemplate";
import experteBijouIllustration from "@/assets/experte-bijou-illustration.png";

// Placeholder - Les vraies images et contenus seront ajoutés
const bellesEncheres = [
  { title: "Bague solitaire diamant 3,52 cts VVS", price: "45 600 €", date: "Novembre 2024", image: "/placeholder.svg", link: "/resultats" },
  { title: "Montre Patek Philippe Nautilus 5711", price: "89 000 €", date: "Septembre 2024", image: "/placeholder.svg", link: "/resultats" },
  { title: "Collier Van Cleef & Arpels Alhambra", price: "32 400 €", date: "Juin 2024", image: "/placeholder.svg", link: "/resultats" },
  { title: "Rolex Daytona Paul Newman ref.6239", price: "156 000 €", date: "Mars 2024", image: "/placeholder.svg", link: "/resultats" },
  { title: "Parure émeraudes de Colombie et diamants", price: "28 500 €", date: "Décembre 2023", image: "/placeholder.svg", link: "/resultats" },
  { title: "Bracelet Cartier Love or rose 18K", price: "12 800 €", date: "Octobre 2023", image: "/placeholder.svg", link: "/resultats" },
  { title: "Boucles d'oreilles saphirs Birmanie", price: "18 200 €", date: "Juin 2023", image: "/placeholder.svg", link: "/resultats" },
  { title: "Montre Audemars Piguet Royal Oak", price: "67 000 €", date: "Mars 2023", image: "/placeholder.svg", link: "/resultats" },
];

const DetailContent = () => (
  <div className="max-w-5xl mx-auto">
    <div className="grid md:grid-cols-2 gap-12 mb-16">
      {/* Haute Joaillerie */}
      <div className="bg-[hsl(var(--brand-blue-100))] p-8 border border-[hsl(var(--brand-gold-200))]">
        <h3 className="text-xl font-serif text-[hsl(var(--brand-primary))] mb-6 pb-4 border-b border-[hsl(var(--brand-gold-300))]">
          Haute Joaillerie
        </h3>
        <div className="space-y-4 text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">Les grandes maisons</h4>
            <p className="text-sm">
              Cartier, Van Cleef & Arpels, Boucheron, Chaumet, Mauboussin... Nous connaissons les signatures, 
              les périodes de production et les pièces emblématiques de chaque maison parisienne et internationale.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Bijoux anciens</h4>
            <p className="text-sm">
              Du bijou régional du XIXe siècle aux parures Art Nouveau et Art Déco, nous identifions les styles, 
              les techniques (émail, micromosaïque, cheveux) et les provenances.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Pierres précieuses</h4>
            <p className="text-sm">
              Diamants (les 4C : carat, couleur, clarté, coupe), émeraudes de Colombie, rubis de Birmanie, 
              saphirs de Ceylan... L'origine géographique influence considérablement la valeur.
            </p>
          </div>
        </div>
      </div>

      {/* Horlogerie */}
      <div className="bg-[hsl(var(--brand-blue-100))] p-8 border border-[hsl(var(--brand-gold-200))]">
        <h3 className="text-xl font-serif text-[hsl(var(--brand-primary))] mb-6 pb-4 border-b border-[hsl(var(--brand-gold-300))]">
          Horlogerie de Prestige
        </h3>
        <div className="space-y-4 text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">Manufactures suisses</h4>
            <p className="text-sm">
              Patek Philippe, Audemars Piguet, Vacheron Constantin, Rolex, Omega... Chaque manufacture a son histoire, 
              ses calibres emblématiques et ses références recherchées par les collectionneurs.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Complications horlogères</h4>
            <p className="text-sm">
              Tourbillon, répétition minutes, quantième perpétuel, chronographe... Les complications mécaniques 
              sont au cœur de la valeur d'une montre de collection.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">État et provenance</h4>
            <p className="text-sm">
              Boîte, papiers, historique de révision : la documentation complète peut multiplier la valeur d'une pièce. 
              Nous vérifions l'authenticité de chaque élément.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Pierres et certifications */}
    <div className="bg-[hsl(var(--brand-blue-100))] p-8 border border-[hsl(var(--brand-gold-200))]">
      <h3 className="text-xl font-serif text-[hsl(var(--brand-primary))] mb-6 pb-4 border-b border-[hsl(var(--brand-gold-300))]">
        Gemmologie et Certifications
      </h3>
      <div className="grid md:grid-cols-3 gap-8 text-muted-foreground">
        <div>
          <h4 className="font-medium text-foreground mb-2">Analyse des pierres</h4>
          <p className="text-sm">
            Identification des pierres naturelles, traitements éventuels (chauffage, huilage), 
            distinction des synthèses. Nous utilisons des équipements gemmologiques professionnels.
          </p>
        </div>
        <div>
          <h4 className="font-medium text-foreground mb-2">Laboratoires partenaires</h4>
          <p className="text-sm">
            Pour les pièces importantes, nous faisons appel au LFG (Laboratoire Français de Gemmologie), 
            au GIA ou au Gübelin pour des certificats reconnus internationalement.
          </p>
        </div>
        <div>
          <h4 className="font-medium text-foreground mb-2">Estimation et cote</h4>
          <p className="text-sm">
            Notre estimation intègre les résultats récents des ventes internationales (Christie's, Sotheby's, Artcurial) 
            et les tendances du marché pour chaque catégorie.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const BijouxMontres = () => {
  return (
    <>
      <Helmet>
        <title>Bijoux et Montres | Douze pages & associés - Ventes aux enchères</title>
        <meta name="description" content="Expertise et vente aux enchères de bijoux et montres de luxe. Haute joaillerie, horlogerie de prestige, pierres précieuses. Cartier, Van Cleef, Patek Philippe, Rolex." />
      </Helmet>
      <SpecialtyPageTemplate
        title="Bijoux et Montres"
        mentionAffective="L'éclat des pièces d'exception, sublimé par notre expertise"
        currentSpecialtyId="bijoux-montres"
        bellesEncheres={bellesEncheres}
        seoTitle="L'Art de la Préciosité"
        seoContent={
          <>
            <p>
              Les bijoux et montres représentent bien plus que des objets de valeur : ils sont les témoins silencieux 
              de moments précieux, d'héritages familiaux et de savoir-faire exceptionnels. Dans notre maison de ventes, 
              cette spécialité occupe une place privilégiée.
            </p>
            <p className="mt-4">
              Qu'il s'agisse d'une bague de fiançailles Art Déco, d'une parure signée Van Cleef & Arpels, d'une montre 
              Patek Philippe ou d'un simple solitaire qui traverse les générations, chaque pièce mérite une expertise 
              rigoureuse et une mise en valeur appropriée.
            </p>
            <p className="mt-4">
              Notre approche combine analyse gemmologique, connaissance des maisons de joaillerie et veille constante 
              sur les tendances du marché international. Nous travaillons en partenariat avec des laboratoires certifiés 
              pour l'authentification des pierres et la certification des pièces exceptionnelles.
            </p>
          </>
        }
        ventesCards={[
          {
            type: "en-ligne",
            titre: "Bijoux et Montres de Collection",
            date: "12 février 2026",
            nombreLots: 245,
            lien: "/acheter",
            image: "/placeholder.svg"
          },
          {
            type: "preparation",
            titre: "Haute Joaillerie et Horlogerie",
            date: "Mai 2026",
            lien: "/vendre",
            image: "/placeholder.svg"
          }
        ]}
        detailTitle="NOTRE EXPERTISE EN DÉTAIL"
        detailContent={<DetailContent />}
        expert={{
          nom: "Sophie Laurent",
          titre: "Expert en bijoux et montres anciennes • Gemmologue diplômée ING",
          bio: "Avec 18 ans d'expérience dans l'expertise de bijoux et montres de prestige, Sophie Laurent a développé un œil infaillible pour distinguer les pièces authentiques des contrefaçons. Formée au prestigieux Institut National de Gemmologie, elle apporte à notre maison son expertise technique et son réseau de collectionneurs internationaux.",
          photo: experteBijouIllustration
        }}
        saviezVous={[
          {
            question: "Comment reconnaître un diamant naturel d'un diamant synthétique ?",
            reponse: "Seul un équipement professionnel peut distinguer avec certitude un diamant naturel d'un diamant synthétique de laboratoire. Cependant, certains indices visuels peuvent alerter : les diamants synthétiques présentent parfois des inclusions métalliques ou des motifs de croissance caractéristiques. Le certificat d'un laboratoire reconnu (GIA, HRD, LFG) reste la meilleure garantie.",
            image: "/placeholder.svg"
          },
          {
            question: "Pourquoi les montres vintage atteignent-elles des records ?",
            reponse: "Le marché de l'horlogerie vintage combine passion et investissement. Les collectionneurs recherchent les références iconiques (Rolex Daytona, Patek Nautilus) dans leur état d'origine, avec boîte et papiers. La rareté, l'histoire de la pièce et son état de conservation expliquent les enchères record observées ces dernières années.",
            image: "/placeholder.svg"
          },
          {
            question: "Quelle est l'importance de l'origine géographique des pierres ?",
            reponse: "L'origine géographique peut multiplier le prix d'une pierre par 5 ou 10. Un rubis de Birmanie (Myanmar) non chauffé, une émeraude de Colombie à huile mineure ou un saphir du Cachemire sont des trésors rares. Les laboratoires gemmologiques peuvent aujourd'hui déterminer l'origine avec une grande précision grâce à l'analyse des inclusions.",
            image: "/placeholder.svg"
          }
        ]}
        ventesPassees={[
          {
            titre: "Bijoux et Montres de Prestige",
            date: "Novembre 2024",
            nombreLots: 210,
            image: "/placeholder.svg",
            lien: "/ventes-passees/bijoux-2024-11"
          },
          {
            titre: "Haute Joaillerie - Vente de Printemps",
            date: "Mai 2024",
            nombreLots: 185,
            image: "/placeholder.svg",
            lien: "/ventes-passees/bijoux-2024-05"
          },
          {
            titre: "Montres de Collection",
            date: "Février 2024",
            nombreLots: 120,
            image: "/placeholder.svg",
            lien: "/ventes-passees/montres-2024-02"
          },
          {
            titre: "Bijoux Anciens et Modernes",
            date: "Octobre 2023",
            nombreLots: 195,
            image: "/placeholder.svg",
            lien: "/ventes-passees/bijoux-2023-10"
          }
        ]}
      />
    </>
  );
};

export default BijouxMontres;