import { Helmet } from "react-helmet-async";
import SpecialtyPageTemplate from "@/components/SpecialtyPageTemplate";
import vlaminckBougival from "@/assets/vlaminck-bougival.jpg";
import tableauRothko from "@/assets/tableau-rothko-art-xxeme.png";
import expertArtModerne from "@/assets/expert-art-moderne.png";
import lithographieModerne from "@/assets/lithographie-moderne.png";
import ecoleParisImage from "@/assets/ecole-paris-peinture.png";
import authentificationArt from "@/assets/authentification-art.png";

const bellesEncheres = [
  { 
    title: "Maurice de Vlaminck - Paysage de Bougival", 
    price: "125 000 €", 
    date: "Juin 2024", 
    image: vlaminckBougival, 
    link: "/ventes-passees" 
  },
  { 
    title: "Mark Rothko - Composition abstraite", 
    price: "185 000 €", 
    date: "Mars 2024", 
    image: tableauRothko, 
    link: "/ventes-passees" 
  },
  { 
    title: "Hans Hartung - Composition T1960-15", 
    price: "68 000 €", 
    date: "Décembre 2023", 
    image: lithographieModerne, 
    link: "/ventes-passees" 
  },
  { 
    title: "École de Paris - Portrait expressionniste", 
    price: "32 000 €", 
    date: "Octobre 2023", 
    image: ecoleParisImage, 
    link: "/ventes-passees" 
  },
  { 
    title: "Bernard Buffet - Nature morte au homard", 
    price: "45 000 €", 
    date: "Juin 2023", 
    image: vlaminckBougival, 
    link: "/ventes-passees" 
  },
  { 
    title: "Zao Wou-Ki - Lithographie originale signée", 
    price: "8 900 €", 
    date: "Mars 2023", 
    image: lithographieModerne, 
    link: "/ventes-passees" 
  },
  { 
    title: "Gen Paul - Vue de Montmartre", 
    price: "12 500 €", 
    date: "Décembre 2022", 
    image: ecoleParisImage, 
    link: "/ventes-passees" 
  },
  { 
    title: "Jean Dufy - Le Port de Nice", 
    price: "28 000 €", 
    date: "Octobre 2022", 
    image: vlaminckBougival, 
    link: "/ventes-passees" 
  },
];

const DetailContent = () => (
  <div className="w-full max-w-[1800px] mx-auto px-4">
    <div className="grid md:grid-cols-[minmax(600px,1fr)_1fr] gap-10 mb-16">
      {/* Contenu principal */}
      <div className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Art moderne */}
          <div className="bg-neutral-50 p-8 border border-neutral-200">
            <h3 className="text-xl font-semibold text-neutral-900 mb-6 pb-4 border-b border-neutral-300">
              Art Moderne (1900-1960)
            </h3>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-2">Les avant-gardes</h4>
                <p className="text-sm">
                  Fauvisme (Matisse, Derain, Vlaminck), Cubisme (Picasso, Braque, Léger), Surréalisme (Dalí, Magritte, Ernst)... 
                  Ces mouvements fondateurs sont très documentés et leurs œuvres authentifiables.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">École de Paris</h4>
                <p className="text-sm">
                  Modigliani, Soutine, Chagall, Foujita... Ces artistes cosmopolites installés à Paris 
                  ont créé un style reconnaissable entre tous, aujourd'hui très recherché.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Abstraction</h4>
                <p className="text-sm">
                  Kandinsky, Mondrian, Malevitch, puis Hartung, Soulages, Poliakoff... 
                  L'abstraction géométrique et lyrique constitue un marché solide et documenté.
                </p>
              </div>
            </div>
          </div>

          {/* Art contemporain */}
          <div className="bg-neutral-50 p-8 border border-neutral-200">
            <h3 className="text-xl font-semibold text-neutral-900 mb-6 pb-4 border-b border-neutral-300">
              Art Contemporain (1960-2000)
            </h3>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-2">Nouveaux réalismes</h4>
                <p className="text-sm">
                  Arman, César, Niki de Saint Phalle, Tinguely... Le mouvement français a su s'imposer 
                  sur la scène internationale avec des œuvres accessibles et décoratives.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Pop Art et au-delà</h4>
                <p className="text-sm">
                  Warhol, Lichtenstein, Hockney, mais aussi la Figuration Narrative française (Erro, Rancillac)... 
                  Ces artistes parlent au grand public et au collectionneur averti.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Art conceptuel et minimal</h4>
                <p className="text-sm">
                  Buren, Morellet, Support-Surface... L'art français des années 70-80 trouve aujourd'hui 
                  une reconnaissance tardive mais méritée.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Techniques et supports */}
        <div className="bg-neutral-50 p-8 border border-neutral-200">
          <h3 className="text-xl font-semibold text-neutral-900 mb-6 pb-4 border-b border-neutral-300">
            Techniques et Authentification
          </h3>
          <div className="grid md:grid-cols-3 gap-8 text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">Peintures et dessins</h4>
              <p className="text-sm">
                Huiles, gouaches, aquarelles, techniques mixtes... Nous examinons la signature, 
                le support, la provenance et consultons les catalogues raisonnés.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Estampes et multiples</h4>
              <p className="text-sm">
                Lithographies, sérigraphies, gravures : le numéro, la signature, l'éditeur 
                et l'état déterminent la valeur. Attention aux reproductions !
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Sculptures</h4>
              <p className="text-sm">
                Bronze (numéro d'édition, fondeur), céramique, résine... Chaque technique 
                a ses critères spécifiques d'authentification et de cotation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vidéo verticale - pleine largeur restante */}
      <div className="hidden md:block">
        <div className="sticky top-32">
          <div className="relative w-full aspect-[9/16]">
            <iframe
              src="https://player.vimeo.com/video/1136014524?autoplay=1&loop=1&muted=1&background=1"
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Le marteau digital - IA"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ArtModerne = () => {
  return (
    <>
      <Helmet>
        <title>Art Moderne et Contemporain | Douze pages & associés - Ventes aux enchères Avignon</title>
        <meta name="description" content="Expertise et vente aux enchères d'art moderne et contemporain à Avignon. Peintures, sculptures, dessins et estampes des grands maîtres du XXe siècle. Expertise gratuite." />
      </Helmet>
      <SpecialtyPageTemplate
        title="Art Moderne"
        mentionAffective="Peintures, sculptures et œuvres graphiques des avant-gardes aux mouvements contemporains, de 1900 à nos jours."
        currentSpecialtyId="art-moderne"
        bellesEncheres={bellesEncheres}
        seoTitle="L'Art Moderne en Vente aux Enchères"
        seoContent={
          <>
            <p>
              L'art moderne, mouvement majeur du XXe siècle, a révolutionné notre rapport à la création artistique. 
              Des impressionnistes aux abstraits, en passant par les surréalistes, chaque œuvre témoigne d'une rupture féconde 
              avec les académismes du passé.
            </p>
            <p className="mt-4">
              Notre expertise couvre les peintures, sculptures, dessins et estampes des grands noms : Picasso, Matisse, Chagall, 
              Miró, mais aussi les artistes de l'École de Paris et les mouvements régionaux qui ont enrichi ce patrimoine artistique.
            </p>
            <p className="mt-4">
              Chaque année, nous organisons plusieurs ventes dédiées à l'art moderne et contemporain, attirant collectionneurs 
              institutionnels et privés du monde entier. Notre implantation en Provence nous permet de découvrir régulièrement 
              des œuvres ayant appartenu à des collections privées constituées au fil des décennies.
            </p>
          </>
        }
        ventesCards={[
          {
            type: "en-ligne",
            titre: "Art Moderne - Vente de Printemps",
            date: "15 mars 2026",
            nombreLots: 185,
            lien: "/acheter",
            image: tableauRothko
          },
          {
            type: "preparation",
            titre: "Art Moderne et Contemporain",
            date: "Juin 2026",
            lien: "/vendre",
            image: lithographieModerne
          }
        ]}
        detailTitle="NOTRE EXPERTISE EN DÉTAIL"
        detailContent={<DetailContent />}
        expert={{
          nom: "Claire Martin",
          titre: "Expert en art moderne et contemporain • Historienne de l'art",
          bio: "Ancienne conservatrice au Musée d'Art Moderne de la Ville de Paris, Claire Martin a rejoint notre maison en 2008. Sa connaissance approfondie des mouvements artistiques du XXe siècle et son réseau dans les institutions muséales font d'elle une référence pour l'authentification et l'estimation des œuvres modernes et contemporaines. Elle collabore régulièrement avec les comités d'artistes et fondations pour garantir l'authenticité des pièces présentées.",
          photo: expertArtModerne
        }}
        saviezVous={[
          {
            question: "Comment distinguer une lithographie originale d'une reproduction ?",
            reponse: "Une lithographie originale est réalisée par l'artiste lui-même sur la pierre lithographique. Elle est numérotée, signée au crayon, et présente souvent des irrégularités caractéristiques du procédé manuel. Une reproduction, même de qualité, est imprimée mécaniquement et manque de la profondeur d'encre et des variations subtiles de l'original. L'examen du papier, de l'encre et de la technique d'impression permet de trancher.",
            image: lithographieModerne
          },
          {
            question: "Pourquoi certains artistes de l'École de Paris sont-ils moins cotés ?",
            reponse: "Le marché de l'art est influencé par de nombreux facteurs : la rareté des œuvres, l'existence d'un catalogue raisonné, la présence en musées, les expositions récentes. Certains artistes talentueux de l'École de Paris ont été négligés par l'histoire de l'art officielle, mais leur redécouverte est en cours. C'est précisément le moment d'investir dans ces artistes avant que leur cote ne s'envole.",
            image: ecoleParisImage
          },
          {
            question: "Comment faire authentifier une œuvre du XXe siècle ?",
            reponse: "L'authentification passe par plusieurs étapes : analyse stylistique, vérification de la provenance, consultation du catalogue raisonné s'il existe, et parfois demande de certificat auprès du comité ou de la fondation de l'artiste. Pour les œuvres importantes, nous travaillons avec les experts agréés et pouvons solliciter des analyses scientifiques (datation des pigments, radiographie).",
            image: authentificationArt
          }
        ]}
        ventesPassees={[
          {
            titre: "Art Moderne et Contemporain",
            date: "Décembre 2024",
            nombreLots: 165,
            image: tableauRothko,
            lien: "/ventes-passees"
          },
          {
            titre: "Peintures et Sculptures du XXe",
            date: "Juin 2024",
            nombreLots: 142,
            image: vlaminckBougival,
            lien: "/ventes-passees"
          },
          {
            titre: "École de Paris",
            date: "Mars 2024",
            nombreLots: 98,
            image: ecoleParisImage,
            lien: "/ventes-passees"
          },
          {
            titre: "Art Moderne - Vente d'Automne",
            date: "Octobre 2023",
            nombreLots: 178,
            image: lithographieModerne,
            lien: "/ventes-passees"
          }
        ]}
      />
    </>
  );
};

export default ArtModerne;
