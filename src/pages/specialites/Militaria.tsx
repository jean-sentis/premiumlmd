import SpecialtyPageTemplate from "@/components/SpecialtyPageTemplate";

const bellesEncheres = [
  { title: "Sabre d'officier de hussards", price: "8 500 €", date: "2024", image: "/images/uniforme-hussard-militaria.jpg" },
  { title: "Casque à pointe prussien", price: "3 200 €", date: "2024", image: "/images/uniforme-hussard-militaria.jpg" },
  { title: "Légion d'honneur en or", price: "4 800 €", date: "2023", image: "/images/uniforme-hussard-militaria.jpg" },
  { title: "Uniforme de hussard complet", price: "12 500 €", date: "2023", image: "/images/uniforme-hussard-militaria.jpg" },
  { title: "Pistolet à silex XVIIIe", price: "6 800 €", date: "2023", image: "/images/uniforme-hussard-militaria.jpg" },
  { title: "Casque Adrian 1915", price: "1 200 €", date: "2022", image: "/images/uniforme-hussard-militaria.jpg" },
  { title: "Épée de cour Louis XVI", price: "5 400 €", date: "2022", image: "/images/uniforme-hussard-militaria.jpg" },
  { title: "Cuirasse de cavalerie", price: "7 800 €", date: "2022", image: "/images/uniforme-hussard-militaria.jpg" },
];

const Militaria = () => (
  <SpecialtyPageTemplate
    title="Militaria"
    mentionAffective="Mémoire et histoire"
    currentSpecialtyId="militaria"
    bellesEncheres={bellesEncheres}
    seoTitle="Militaria et Souvenirs Historiques"
    seoContent={<p>Le militaria demande une expertise historique pointue. Ces objets sont les témoins directs de l'Histoire.</p>}
    detailTitle="NOTRE EXPERTISE"
    detailContent={<div className="text-center text-muted-foreground">Contenu à compléter</div>}
  />
);

export default Militaria;