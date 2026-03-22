import { Check, Sparkles, Search, Heart, Gift, TrendingDown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const OffresCommerciales = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Intelligence Artificielle
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            3 piliers IA pour
            <span className="block text-primary">transformer votre étude</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Des fonctionnalités intelligentes facturées à l'usage, sans engagement.
            Activez uniquement ce dont vous avez besoin.
          </p>
        </div>
      </section>

      {/* 2-column layout */}
      <section className="px-4 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ─── Colonne gauche : À l'usage ─── */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
                Facturation à l'usage
              </h2>
            </div>

            {/* Pilier 1 — Estimation */}
            <div className="bg-card rounded-2xl border p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Aide à l'estimation</h3>
                  <p className="text-sm text-muted-foreground">Analyse IA de chaque demande d'estimation</p>
                </div>
              </div>

              <ul className="space-y-2.5">
                {[
                  "Tri et classification automatique des demandes",
                  "Analyse IA de l'objet à partir des photos",
                  "Suggestion de fourchette d'estimation",
                  "Identification de l'artiste / fabricant",
                  "Comparaison avec les résultats récents",
                  "Brouillon de réponse pré-rédigé",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Zap className="h-4 w-4 text-amber-500" />
                  ~12 actions IA par analyse
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix par analyse</span>
                    <span className="font-semibold text-foreground">2,50 € HT</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-primary" />
                    Offre de lancement
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>20 analyses offertes</strong> le premier mois
                  </p>
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                    Remises volume mensuel
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-background rounded-lg p-2 text-center">
                      <div className="font-bold text-green-600">−10%</div>
                      <div className="text-muted-foreground">dès 100/mois</div>
                    </div>
                    <div className="bg-background rounded-lg p-2 text-center">
                      <div className="font-bold text-green-600">−20%</div>
                      <div className="text-muted-foreground">dès 200/mois</div>
                    </div>
                    <div className="bg-background rounded-lg p-2 text-center">
                      <div className="font-bold text-green-600">−30%</div>
                      <div className="text-muted-foreground">dès 300/mois</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pilier 2 — SEO */}
            <div className="bg-card rounded-2xl border p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">SEO & Visibilité Google</h3>
                  <p className="text-sm text-muted-foreground">Enrichissement automatique de chaque lot</p>
                </div>
              </div>

              <ul className="space-y-2.5">
                {[
                  "Classification automatique par familles et catégories",
                  "Génération de titre SEO optimisé",
                  "Méta-description unique par lot",
                  "Enrichissement de la description longue",
                  "Mots-clés et tags automatiques",
                  "Données structurées JSON-LD",
                  "Suggestions de lots similaires",
                  "Texte alternatif des images (accessibilité)",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Zap className="h-4 w-4 text-emerald-500" />
                  ~8 actions IA par lot
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix par lot enrichi</span>
                    <span className="font-semibold text-foreground">0,80 € HT</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                    Remises volume par vente
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-background rounded-lg p-2 text-center">
                      <div className="font-bold text-green-600">−10%</div>
                      <div className="text-muted-foreground">dès 100 lots</div>
                    </div>
                    <div className="bg-background rounded-lg p-2 text-center">
                      <div className="font-bold text-green-600">−15%</div>
                      <div className="text-muted-foreground">dès 200 lots</div>
                    </div>
                    <div className="bg-background rounded-lg p-2 text-center">
                      <div className="font-bold text-green-600">−25%</div>
                      <div className="text-muted-foreground">dès 500 lots</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Colonne droite : Expérience Acheteur ─── */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-8 bg-accent rounded-full" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-foreground">
                Abonnement mensuel
              </h2>
            </div>

            <div className="bg-card rounded-2xl border p-6 space-y-5 relative overflow-hidden">
              {/* Promo banner */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-center text-sm font-medium py-2 px-4">
                <Gift className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                6 premiers mois : tout au-delà de 20 €/mois offert
              </div>

              <div className="pt-8 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Expérience Acheteur</h3>
                  <p className="text-sm text-muted-foreground">Fidélisation & conciergerie personnalisée</p>
                </div>
              </div>

              {/* Sous-ensemble 1 : Fidélisation */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                  Fidéliser vos clients
                </h4>
                <ul className="space-y-2.5 pl-7">
                  {[
                    "Alertes personnalisées par mots-clés",
                    "Validation intelligente des mots-clés",
                    "Synthèse hebdomadaire des nouveautés",
                    "Réponses Q&R 24/7 sur les lots",
                    "Notifications de lots correspondants",
                    "Historique des interactions",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sous-ensemble 2 : Expérience sur-mesure */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</span>
                  Expérience sur-mesure
                </h4>
                <ul className="space-y-2.5 pl-7">
                  {[
                    "Assistant Lia : dialogue personnalisé",
                    "Profilage de goûts par conversation",
                    "Suggestions de lots sur-mesure",
                    "Découverte guidée des spécialités",
                    "Recommandations croisées entre ventes",
                    "Profil de collectionneur évolutif",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Zap className="h-4 w-4 text-blue-500" />
                  ~20 actions IA / acheteur actif / mois
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plancher mensuel</span>
                    <span className="font-semibold text-foreground">25 € HT / mois</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Au-delà, facturation à l'usage réel</span>
                    <span className="text-xs text-muted-foreground">selon activité</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-primary" />
                    Offre de lancement — 6 mois
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pendant 6 mois, tout dépassement au-delà de <strong>20 €/mois</strong> est offert.
                    Testez en conditions réelles, sans risque budgétaire.
                  </p>
                </div>

                <div className="pt-3 border-t border-border bg-blue-50/50 -mx-4 -mb-4 p-4 rounded-b-xl">
                  <p className="text-xs text-muted-foreground">
                    <strong>Pourquoi cette offre ?</strong> L'usage dépend du comportement de vos acheteurs.
                    Nous prenons le risque avec vous pour valider ensemble le ROI réel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Chaque pilier est activable indépendamment
          </h2>
          <p className="text-muted-foreground">
            Pas de pack obligatoire. Commencez par l'estimation IA, ajoutez le SEO quand vous êtes prêt,
            et activez l'expérience acheteur quand vous le souhaitez.
          </p>
        </div>
      </section>
    </div>
  );
};

export default OffresCommerciales;
