import { Helmet } from "react-helmet-async";
import SpecialtyPageTemplate from "@/components/SpecialtyPageTemplate";

const bellesEncheres = [
  { title: "Sac Hermès Birkin 35", price: "9 500 €", date: "2025", image: "/placeholder.svg" },
  { title: "Carré Hermès collector", price: "450 €", date: "2025", image: "/placeholder.svg" },
  { title: "Robe Chanel vintage", price: "2 800 €", date: "2025", image: "/placeholder.svg" },
  { title: "Sac Louis Vuitton Speedy", price: "1 200 €", date: "2024", image: "/placeholder.svg" },
  { title: "Manteau Dior New Look", price: "4 500 €", date: "2024", image: "/placeholder.svg" },
  { title: "Foulard Gucci soie", price: "280 €", date: "2024", image: "/placeholder.svg" },
  { title: "Sac Kelly Hermès", price: "12 000 €", date: "2024", image: "/placeholder.svg" },
  { title: "Robe YSL Mondrian", price: "8 500 €", date: "2024", image: "/placeholder.svg" },
];

const ModeTextile = () => (
  <>
    <Helmet>
      <title>Mode et Textile | Douze pages & associés</title>
      <meta name="description" content="Expertise et vente aux enchères de mode vintage et haute couture." />
    </Helmet>
    <SpecialtyPageTemplate
      title="Mode et Textile"
      mentionAffective="Élégance et pièces iconiques"
      currentSpecialtyId="mode-textile"
      bellesEncheres={bellesEncheres}
      seoTitle="La Mode aux Enchères"
      seoContent={<p>La mode vintage et la haute couture connaissent un engouement sans précédent. Ces pièces sont devenues de véritables objets de collection.</p>}
      detailTitle="NOTRE EXPERTISE"
      detailContent={<div className="text-center text-muted-foreground">Contenu à compléter</div>}
    />
  </>
);

export default ModeTextile;