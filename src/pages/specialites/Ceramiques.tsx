import SpecialtyPageTemplate from "@/components/SpecialtyPageTemplate";

const bellesEncheres = [
  { title: "Plat Picasso Madoura", price: "28 500 €", date: "2025", image: "/placeholder.svg" },
  { title: "Vase Sèvres Art Déco", price: "12 800 €", date: "2025", image: "/placeholder.svg" },
  { title: "Assiettes Moustiers XVIIIe", price: "4 200 €", date: "2025", image: "/placeholder.svg" },
  { title: "Céramique Roger Capron", price: "6 500 €", date: "2024", image: "/placeholder.svg" },
  { title: "Service Limoges Haviland", price: "3 800 €", date: "2024", image: "/placeholder.svg" },
  { title: "Grès Jean Girel", price: "5 200 €", date: "2024", image: "/placeholder.svg" },
  { title: "Vase Longwy", price: "2 400 €", date: "2024", image: "/placeholder.svg" },
  { title: "Assiette Quimper", price: "890 €", date: "2024", image: "/placeholder.svg" },
];

const Ceramiques = () => (
  <SpecialtyPageTemplate
    title="Céramiques et Porcelaines"
    mentionAffective="L'art du feu sublimé"
    currentSpecialtyId="ceramiques"
    bellesEncheres={bellesEncheres}
    seoTitle="L'Art du Feu"
    seoContent={<p>La céramique est l'un des arts les plus diversifiés. Notre expertise distingue les pièces de manufacture des créations d'artistes.</p>}
    detailTitle="NOTRE EXPERTISE"
    detailContent={<div className="text-center text-muted-foreground">Contenu à compléter</div>}
  />
);

export default Ceramiques;