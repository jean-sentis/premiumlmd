import { Helmet } from "react-helmet-async";
import SpecialtyPageTemplate from "@/components/SpecialtyPageTemplate";

const bellesEncheres = [
  { title: "Collection timbres France 1900-1950", price: "1 800 €", date: "2024", image: "/placeholder.svg" },
  { title: "Ensemble monnaies romaines", price: "2 400 €", date: "2024", image: "/placeholder.svg" },
  { title: "Lot jouets Dinky Toys", price: "950 €", date: "2023", image: "/placeholder.svg" },
  { title: "Cartes postales anciennes", price: "450 €", date: "2023", image: "/placeholder.svg" },
  { title: "Médailles militaires", price: "1 200 €", date: "2023", image: "/placeholder.svg" },
  { title: "Automates anciens", price: "3 800 €", date: "2022", image: "/placeholder.svg" },
  { title: "Soldats de plomb", price: "680 €", date: "2022", image: "/placeholder.svg" },
  { title: "Instruments scientifiques", price: "2 100 €", date: "2022", image: "/placeholder.svg" },
];

const Collections = () => (
  <>
    <Helmet>
      <title>Collections | Douze pages & associés</title>
      <meta name="description" content="Expertise et vente aux enchères de collections diverses." />
    </Helmet>
    <SpecialtyPageTemplate
      title="Collections"
      mentionAffective="Passion et objets de collection"
      currentSpecialtyId="collections"
      bellesEncheres={bellesEncheres}
      seoTitle="L'Univers des Collections"
      seoContent={<p>Le monde des collections est infini et passionnant. Chaque objet témoigne d'une époque ou d'un savoir-faire.</p>}
      detailTitle="NOS SPÉCIALITÉS"
      detailContent={<div className="text-center text-muted-foreground">Contenu à compléter</div>}
    />
  </>
);

export default Collections;