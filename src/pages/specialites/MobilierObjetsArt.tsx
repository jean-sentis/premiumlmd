import { Helmet } from "react-helmet-async";
import SpecialtyPageTemplate from "@/components/SpecialtyPageTemplate";

const bellesEncheres = [
  { title: "Commode Louis XV estampillée", price: "8 500 €", date: "2024", image: "/placeholder.svg" },
  { title: "Pendule Empire bronze doré", price: "2 200 €", date: "2024", image: "/placeholder.svg" },
  { title: "Fauteuil Art Déco Leleu", price: "4 800 €", date: "2023", image: "/placeholder.svg" },
  { title: "Bureau plat XVIIIe", price: "12 000 €", date: "2023", image: "/placeholder.svg" },
  { title: "Régulateur de parquet", price: "6 500 €", date: "2023", image: "/placeholder.svg" },
  { title: "Console Louis XVI", price: "3 400 €", date: "2022", image: "/placeholder.svg" },
  { title: "Lustre à pampilles", price: "1 800 €", date: "2022", image: "/placeholder.svg" },
  { title: "Secrétaire Transition", price: "9 200 €", date: "2022", image: "/placeholder.svg" },
];

const MobilierObjetsArt = () => (
  <>
    <Helmet>
      <title>Mobilier et Objets d'Art | Douze pages & associés</title>
      <meta name="description" content="Expertise et vente aux enchères de mobilier ancien et objets d'art." />
    </Helmet>
    <SpecialtyPageTemplate
      title="Mobilier, Objets d'Art et Horlogerie"
      mentionAffective="L'art de vivre à travers les siècles"
      currentSpecialtyId="mobilier-objets-art"
      bellesEncheres={bellesEncheres}
      seoTitle="L'Art de Vivre"
      seoContent={<p>Le mobilier et les objets d'art témoignent du raffinement des arts décoratifs français.</p>}
      detailTitle="NOTRE EXPERTISE"
      detailContent={<div className="text-center text-muted-foreground">Contenu à compléter</div>}
    />
  </>
);

export default MobilierObjetsArt;