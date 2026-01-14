import { Check, X, Sparkles, Building2, Rocket, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const offers = [
  {
    id: "essentiel",
    name: "Essentiel",
    tagline: "Présence web minimale",
    icon: Building2,
    color: "from-amber-500 to-orange-600",
    borderColor: "border-amber-500",
    bgLight: "bg-amber-50",
    pages: "~6 pages",
    setupPrice: 2700,
    monthlyPrice: 280,
    iaIncluded: false,
    highlights: [
      "Page d'accueil personnalisée",
      "Ventes via iframe Interenchères",
      "Formulaire d'estimation en ligne",
      "Page de présentation de la maison",
      "Page contact avec coordonnées",
      "Design responsive mobile",
    ],
    notIncluded: [
      "Espace client personnel",
      "Fonctionnalités IA",
      "Pages spécialités détaillées",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "Site complet fonctionnel",
    icon: Rocket,
    color: "from-green-500 to-emerald-600",
    borderColor: "border-green-500",
    bgLight: "bg-green-50",
    pages: "~15-20 pages",
    setupPrice: 12600,
    monthlyPrice: 1680,
    iaIncluded: false,
    popular: true,
    highlights: [
      "Tout ce qui est dans Essentiel",
      "Espace client complet",
      "Ventes natives (pas d'iframe)",
      "Ordres d'achat et enchères téléphone",
      "Calendrier unifié des événements",
      "Archives des ventes passées",
      "Paiement en ligne sécurisé",
      "Gestion des enlèvements",
    ],
    notIncluded: [
      "Fonctionnalités IA",
      "11 pages spécialités détaillées",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Expérience enrichie IA",
    icon: Sparkles,
    color: "from-blue-500 to-indigo-600",
    borderColor: "border-blue-500",
    bgLight: "bg-blue-50",
    pages: "~35-40 pages",
    setupPrice: 31500,
    monthlyPrice: 4560,
    iaCost: 340,
    iaIncluded: true,
    highlights: [
      "Tout ce qui est dans Standard",
      "Assistant IA Lia conversationnel",
      "Suggestions personnalisées par IA",
      "Analyse et enrichissement des lots",
      "Classification automatique des ventes",
      "11 pages spécialités détaillées",
      "Aventures d'enchères (anecdotes)",
      "Support téléphone dédié",
      "Formation initiale incluse",
    ],
    notIncluded: [],
  },
  {
    id: "sur-mesure",
    name: "Sur Mesure",
    tagline: "Solution personnalisée",
    icon: Crown,
    color: "from-purple-500 to-violet-600",
    borderColor: "border-purple-500",
    bgLight: "bg-purple-50",
    pages: "Variable",
    setupPrice: 58500,
    monthlyPrice: 7440,
    iaCost: 340,
    iaIncluded: true,
    highlights: [
      "Tout ce qui est dans Premium",
      "Design sur mesure personnalisé",
      "Direction artistique exclusive",
      "Accompagnement création contenus",
      "Personnalisations spécifiques",
      "SLA et support dédié",
      "Formation approfondie",
    ],
    notIncluded: [],
  },
];

const OffresCommerciales = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Votre plateforme d'enchères
            <span className="block text-primary">clé en main</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Du site vitrine essentiel à la solution Premium avec intelligence artificielle,
            choisissez l'offre adaptée à votre étude.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border">
              <Check className="h-4 w-4 text-green-500" />
              Synchronisation Interenchères
            </span>
            <span className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border">
              <Check className="h-4 w-4 text-green-500" />
              Design responsive
            </span>
            <span className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border">
              <Check className="h-4 w-4 text-green-500" />
              Hébergement inclus
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 px-4 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className={`relative bg-card rounded-2xl border-2 ${offer.borderColor} overflow-hidden flex flex-col ${
                  offer.popular ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
              >
                {offer.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-sm font-medium py-1">
                    Le plus populaire
                  </div>
                )}

                {/* Header */}
                <div className={`p-6 ${offer.popular ? "pt-10" : ""}`}>
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${offer.color} mb-4`}>
                    <offer.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{offer.name}</h3>
                  <p className="text-muted-foreground text-sm">{offer.tagline}</p>
                  <p className="text-xs text-muted-foreground mt-1">{offer.pages}</p>
                </div>

                {/* Pricing */}
                <div className={`px-6 py-4 ${offer.bgLight}`}>
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">Setup (one-shot)</span>
                    <div className="text-2xl font-bold text-foreground">
                      {offer.setupPrice.toLocaleString("fr-FR")} €
                      <span className="text-sm font-normal text-muted-foreground"> HT</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Maintenance mensuelle</span>
                    <div className="text-xl font-bold text-foreground">
                      {offer.monthlyPrice.toLocaleString("fr-FR")} €
                      <span className="text-sm font-normal text-muted-foreground">/mois HT</span>
                    </div>
                  </div>
                  {offer.iaIncluded && offer.iaCost && (
                    <div className="mt-2 text-sm text-purple-700 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      + ~{offer.iaCost}€/mois coût IA
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="p-6 flex-1">
                  <ul className="space-y-3">
                    {offer.highlights.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                    {offer.notIncluded.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm opacity-50">
                        <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="p-6 pt-0">
                  <Button
                    asChild
                    className={`w-full ${offer.popular ? "" : "variant-outline"}`}
                    variant={offer.popular ? "default" : "outline"}
                  >
                    <Link to="/contact">Demander un devis</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ / Notes */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Questions fréquentes
          </h2>
          
          <div className="space-y-6">
            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Que comprend le tarif de setup ?
              </h3>
              <p className="text-muted-foreground text-sm">
                Le setup inclut la création du site à partir de notre plateforme parent, la configuration
                de votre identité visuelle (logo, couleurs), l'intégration de vos contenus initiaux,
                et la mise en production sur votre nom de domaine.
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Que comprend la maintenance mensuelle ?
              </h3>
              <p className="text-muted-foreground text-sm">
                La maintenance inclut l'hébergement, la synchronisation automatique avec Interenchères,
                les mises à jour de sécurité, le support technique, et les évolutions mineures de la plateforme.
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Comment fonctionne le coût IA ?
              </h3>
              <p className="text-muted-foreground text-sm">
                Les fonctionnalités IA (assistant Lia, suggestions personnalisées, enrichissement des lots)
                utilisent des modèles d'intelligence artificielle facturés à l'usage. Le montant estimé
                est basé sur un volume mensuel moyen d'utilisation.
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Puis-je changer d'offre plus tard ?
              </h3>
              <p className="text-muted-foreground text-sm">
                Oui, vous pouvez évoluer vers une offre supérieure à tout moment.
                Un tarif de migration sera calculé en fonction des fonctionnalités à ajouter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Prêt à digitaliser votre étude ?
          </h2>
          <p className="text-muted-foreground mb-8">
            Contactez-nous pour discuter de votre projet et obtenir un devis personnalisé.
          </p>
          <Button asChild size="lg">
            <Link to="/contact">Nous contacter</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default OffresCommerciales;
