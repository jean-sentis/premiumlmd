import { Link } from "react-router-dom";
import { getSpecialtyShadowClass } from "@/lib/design-rules";

const testSales = [
  { id: 1, specialty: "Bijoux & Montres", title: "Bijoux & Montres" },
  { id: 2, specialty: "Art Moderne & Contemporain", title: "Art Moderne & Contemporain" },
  { id: 3, specialty: "Véhicules de collection", title: "Véhicules de collection" },
  { id: 4, specialty: "Vins & Spiritueux", title: "Vins & Spiritueux" },
  { id: 5, specialty: "Mobilier & Objets d'art", title: "Mobilier & Objets d'art" },
  { id: 6, specialty: "Collections", title: "Collections" },
  { id: 7, specialty: "Militaria", title: "Militaria" },
  { id: 8, specialty: "Argenterie", title: "Argenterie" },
  { id: 9, specialty: null, title: "Sans spécialité (défaut)" },
  { id: 10, specialty: "Bijoux & Montres", title: "Bijoux & Montres (2)" },
  { id: 11, specialty: "Art Moderne & Contemporain", title: "Art Moderne (2)" },
  { id: 12, specialty: "Véhicules de collection", title: "Véhicules (2)" },
  { id: 13, specialty: "Vins & Spiritueux", title: "Vins (2)" },
  { id: 14, specialty: "Mobilier & Objets d'art", title: "Mobilier (2)" },
  { id: 15, specialty: "Collections", title: "Collections (2)" },
];

export default function TestShadows() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link to="/" className="text-primary hover:underline">← Retour à l'accueil</Link>
          <h1 className="text-2xl font-bold mt-4 mb-2">Test des ombres colorées par spécialité</h1>
          <p className="text-muted-foreground">15 cartes avec les différentes spécialités pour visualiser l'effet des ombres.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
          {testSales.map((sale) => {
            const shadowClass = getSpecialtyShadowClass(sale.specialty);
            return (
              <div
                key={sale.id}
                className={`bg-card rounded-lg ${shadowClass} transition-all duration-300 hover:scale-[1.02]`}
              >
                {/* Image placeholder */}
                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Image</span>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <p className="text-xs text-primary font-medium mb-1">
                    {sale.specialty || "Non défini"}
                  </p>
                  <h3 className="font-semibold text-foreground text-sm leading-tight">
                    {sale.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2">
                    Classe: <code className="bg-muted px-1 rounded">{shadowClass}</code>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
