import SpecialtyPageTemplate from "@/components/SpecialtyPageTemplate";

const bellesEncheres = [
  { title: "Maurice de Vlaminck - Bougival", price: "125 000 €", date: "2025", image: "/placeholder.svg" },
  { title: "Bernard Buffet - Nature morte", price: "45 000 €", date: "2025", image: "/placeholder.svg" },
  { title: "Hans Hartung - Composition", price: "68 000 €", date: "2025", image: "/placeholder.svg" },
  { title: "César - Compression", price: "32 000 €", date: "2024", image: "/placeholder.svg" },
  { title: "Arman - Accumulation", price: "18 500 €", date: "2024", image: "/placeholder.svg" },
  { title: "Zao Wou-Ki - Lithographie", price: "8 900 €", date: "2024", image: "/placeholder.svg" },
  { title: "Gen Paul - Montmartre", price: "12 500 €", date: "2024", image: "/placeholder.svg" },
  { title: "Jean Dufy - Le Port", price: "28 000 €", date: "2024", image: "/placeholder.svg" },
];

const ArtXXeme = () => (
  <SpecialtyPageTemplate
    title="Art du XXème siècle"
    mentionAffective="Un siècle de ruptures et de chefs-d'œuvre"
    currentSpecialtyId="art-xxeme"
    bellesEncheres={bellesEncheres}
    seoTitle="L'Art du XXème Siècle"
    seoContent={<p>Le XXème siècle a bouleversé l'histoire de l'art. Notre expertise couvre l'ensemble du siècle.</p>}
    detailTitle="NOTRE EXPERTISE"
    detailContent={<div className="text-center text-muted-foreground">Contenu à compléter</div>}
  />
);

export default ArtXXeme;