import { Helmet } from "react-helmet-async";
import SpecialtyPageTemplate from "@/components/SpecialtyPageTemplate";

const bellesEncheres = [
  { title: "Ménagère Christofle 124 pièces", price: "2 800 €", date: "2024", image: "/placeholder.svg" },
  { title: "Soupière Louis XV en argent", price: "4 500 €", date: "2024", image: "/placeholder.svg" },
  { title: "Paire de candélabres XIXe", price: "1 200 €", date: "2023", image: "/placeholder.svg" },
  { title: "Service à thé Odiot", price: "3 800 €", date: "2023", image: "/placeholder.svg" },
  { title: "Cafetière Empire", price: "1 500 €", date: "2023", image: "/placeholder.svg" },
  { title: "Légumier Puiforcat", price: "2 200 €", date: "2022", image: "/placeholder.svg" },
  { title: "Plateau de service XVIIIe", price: "5 600 €", date: "2022", image: "/placeholder.svg" },
  { title: "Saucière Cardeilhac", price: "890 €", date: "2022", image: "/placeholder.svg" },
];

const Argenterie = () => (
  <>
    <Helmet>
      <title>Argenterie | Douze pages & associés</title>
      <meta name="description" content="Expertise et vente aux enchères d'argenterie ancienne." />
    </Helmet>
    <SpecialtyPageTemplate
      title="Argenterie"
      mentionAffective="L'art de l'orfèvrerie française"
      currentSpecialtyId="argenterie"
      bellesEncheres={bellesEncheres}
      seoTitle="L'Art de l'Argenterie"
      seoContent={<p>L'argenterie représente un patrimoine familial précieux. Notre expertise couvre l'ensemble de l'orfèvrerie française et étrangère.</p>}
      detailTitle="NOTRE EXPERTISE"
      detailContent={<div className="text-center text-muted-foreground">Contenu à compléter</div>}
    />
  </>
);

export default Argenterie;