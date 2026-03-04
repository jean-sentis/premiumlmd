import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Feature = {
  name: string;
  description: string;
  tags?: string[];
};

type Section = {
  title: string;
  icon: string;
  features: Feature[];
};

const sections: Section[] = [
  {
    title: "Accueil",
    icon: "🏠",
    features: [
      { name: "Hero plein écran", description: "Image plein écran, accroche et CTA principal", tags: ["SEO", "Marketing"] },
      { name: "Carrousel prochaines ventes", description: "Slider des ventes à venir avec SaleCard", tags: ["Auto Sync"] },
      { name: "Planning inline 7 jours", description: "Timeline événements colorés par type", tags: ["Auto Sync"] },
      { name: "Grille 8 spécialités", description: "Cartes avec images et hover effects", tags: ["SEO"] },
      { name: "Témoignages carousel", description: "Avis clients en carrousel rotatif", tags: ["Marketing"] },
      { name: "Horloge temps réel", description: "Affichage heure locale mise à jour chaque seconde" },
    ],
  },
  {
    title: "Header / Footer / Navigation",
    icon: "🧭",
    features: [
      { name: "Logo et branding", description: "Logo cliquable retour accueil, variantes thème" },
      { name: "Navigation principale", description: "Menu déroulant Acheter, Vendre, Spécialités, À propos" },
      { name: "Sous-menus avec images", description: "Grille visuelle des spécialités avec photos", tags: ["SEO"] },
      { name: "Menu mobile responsive", description: "Sheet navigation avec accordéons" },
      { name: "Footer informations", description: "Adresse, téléphone, email, réseaux sociaux", tags: ["SEO"] },
      { name: "Horloge temps réel", description: "LiveClock mise à jour chaque seconde" },
      { name: "Planning flottant", description: "FloatingPlanningButton + InlinePlanningSlot intégré" },
      { name: "ScrollToTop", description: "Retour haut de page à chaque navigation" },
      { name: "DemoRdvOverlay", description: "Overlay blocage démo avec lien Cal.eu pour RDV" },
    ],
  },
  {
    title: "Acheter",
    icon: "🛒",
    features: [
      { name: "Hub acheteur", description: "Page d'accueil avec navigation vers sous-pages" },
      { name: "Ventes à venir", description: "Liste des prochaines ventes depuis la DB avec filtres", tags: ["Auto Sync", "SEO"] },
      { name: "Ventes passées chronologiques", description: "Historique par date avec recherche et filtres", tags: ["Auto Sync"] },
      { name: "Guide de l'acheteur", description: "Page manifeste pourquoi acheter aux enchères", tags: ["SEO"] },
      { name: "After-Sale invendus", description: "Consultation et achat d'invendus à prix fixe", tags: ["Auto Sync"] },
      { name: "Détail after-sale", description: "Fiche lot invendu avec prix fixe" },
    ],
  },
  {
    title: "Vente & Lot (détail)",
    icon: "🎨",
    features: [
      { name: "Fiche vente complète", description: "Infos, conditions, expositions, catalogue lots", tags: ["Auto Sync", "SEO"] },
      { name: "Catalogue en ligne HD", description: "LotsGrid avec photos haute définition", tags: ["Auto Sync"] },
      { name: "Sticky header vente", description: "Barre collante avec infos essentielles au scroll" },
      { name: "Galerie photos HD + zoom", description: "ImageViewer avec navigation galerie et zoom", tags: ["Auto Sync"] },
      { name: "Estimations affichées", description: "Estimation basse/haute avec devise" },
      { name: "Description enrichie IA", description: "Titre et description enrichis automatiquement par IA", tags: ["Auto IA"] },
      { name: "Analyse IA du lot", description: "Contexte historique, biographie créateur, observations image", tags: ["Auto IA"] },
      { name: "Q&R IA 24/7", description: "L'IA répond aux questions clients sur un lot", tags: ["Auto IA"] },
      { name: "Mémoriser (❤️)", description: "Bouton cœur pour sauvegarder un lot avec rappel dates" },
      { name: "Ordre d'achat", description: "Dépôt montant maximum, confirmation email" },
      { name: "Enchère téléphonique", description: "Formulaire pour être rappelé pendant la vente live" },
      { name: "Demande d'informations", description: "Formulaire question, rapport condition, provenance", tags: ["Auto IA"] },
      { name: "Vendre un objet similaire", description: "Bouton avec mailto pré-rempli référence lot" },
      { name: "Accordion infos vente", description: "Détails vente accessibles depuis la fiche lot" },
      { name: "Chrono (ventes online)", description: "Compte à rebours temps réel, barre sticky, guide", tags: ["Auto Sync"] },
      { name: "Lien Interenchères", description: "Inscription et accès direct plateforme externe", tags: ["Auto Sync"] },
    ],
  },
  {
    title: "Vendre",
    icon: "💰",
    features: [
      { name: "Hub vendeur", description: "Page d'accueil avec navigation estimation, inventaire, guide" },
      { name: "Estimation en ligne", description: "Formulaire upload photos, description, dimensions", tags: ["SEO"] },
      { name: "Expertises itinérantes", description: "Villes avec dates, carrés hover couleur", tags: ["SEO"] },
      { name: "Inventaire à domicile", description: "Page succession, partage, déménagement + formulaire", tags: ["SEO"] },
      { name: "Guide du vendeur", description: "Page explicative processus estimation et mise en vente", tags: ["SEO"] },
    ],
  },
  {
    title: "Spécialités (×11)",
    icon: "💎",
    features: [
      { name: "Grille spécialités", description: "Page index avec 11 cartes illustrées", tags: ["SEO"] },
      { name: "Template commun", description: "SpecialtyPageTemplate réutilisable : hero, description, lots récents", tags: ["SEO"] },
      { name: "11 pages dédiées", description: "Bijoux, Vins, Art moderne, Art XXe, Céramiques, Militaria, Argenterie, Collections, Mobilier, Mode, Voitures", tags: ["SEO"] },
    ],
  },
  {
    title: "Calendrier",
    icon: "📅",
    features: [
      { name: "Vue calendrier unifié", description: "Affichage ventes, expositions, expertises avec code couleur", tags: ["Auto Sync"] },
      { name: "Filtres par type", description: "Sélection ventes live, chrono, expositions, expertises" },
      { name: "Détail événement", description: "Dialog avec infos complètes et liens", tags: ["Auto Sync"] },
    ],
  },
  {
    title: "Pages éditoriales",
    icon: "📖",
    features: [
      { name: "La Maison", description: "Présentation, histoire, valeurs, équipe, experts", tags: ["SEO"] },
      { name: "Aventures d'Enchères", description: "8 récits storytelling de découvertes illustrés", tags: ["SEO"] },
      { name: "Région & Talents", description: "Artisans locaux, coups de cœur, ancrage territorial", tags: ["SEO"] },
      { name: "Glossaire", description: "Définitions en accordéon des termes du métier", tags: ["SEO"] },
      { name: "Contact", description: "Formulaire, carte/plan d'accès, horaires", tags: ["SEO"] },
    ],
  },
  {
    title: "Espace Client (/compte)",
    icon: "👤",
    features: [
      { name: "Authentification", description: "Login, inscription, reset password, session persistante" },
      { name: "Tableau de bord", description: "Vue d'ensemble alertes, lots, ordres, adjudications", tags: ["Auto Sync"] },
      { name: "Barre de progression", description: "Indicateur complétude profil (gamification)" },
      { name: "Profil 6 étapes", description: "Identité, téléphone, adresse, pièce ID (KYC), banque, sécurité" },
      { name: "Favoris", description: "Lots mémorisés triés par vente, dates, statuts", tags: ["Auto Sync"] },
      { name: "Ce que j'aime (Lia)", description: "Dialogue conversationnel IA pour cerner les goûts", tags: ["Auto IA"] },
      { name: "Nuage de tags (TasteCloud)", description: "Visualisation graphique du profil de goûts" },
      { name: "Centres d'intérêts", description: "Sélection spécialités, newsletter personnalisée" },
      { name: "Mes alertes", description: "Alertes mots-clés, validation IA, activation/désactivation", tags: ["Auto IA"] },
      { name: "Suggestions Lia", description: "Grille lots suggérés par IA avec validation utilisateur", tags: ["Auto IA"] },
      { name: "Mes ordres", description: "Historique ordres d'achat : lot, montant max, statut" },
      { name: "Enchères téléphone", description: "Demandes enchères tél., confirmation, résultat" },
      { name: "Mes adjudications", description: "Lots remportés, prix, frais, statut paiement/enlèvement", tags: ["Auto Sync"] },
      { name: "Régler mes achats", description: "Interface paiement bordereaux, calcul auto frais 25%" },
      { name: "Programmer enlèvement", description: "Prise RDV créneaux, confirmation" },
      { name: "Newsletter", description: "Choix spécialités, fréquence" },
      { name: "Vie privée RGPD", description: "Consentements, préférences, droit à l'oubli" },
    ],
  },
  {
    title: "Intelligence Artificielle",
    icon: "🤖",
    features: [
      { name: "Dialogue Lia conversationnel", description: "IA formelle, proactive, choix binaires, références culturelles", tags: ["Auto IA"] },
      { name: "Ton Concierge palace", description: "Vouvoiement, Monsieur/Madame NOM, références adaptées", tags: ["Auto IA"] },
      { name: "Suggestions personnalisées", description: "Sélection auto lots, grille validation, amélioration continue", tags: ["Auto IA", "Auto Sync"] },
      { name: "Analyse IA des lots", description: "Contexte historique, biographie créateur, observations image", tags: ["Auto IA", "Auto Sync"] },
      { name: "Enrichissement descriptions", description: "Titre vendeur, description enrichie, dimensions formatées", tags: ["Auto IA", "Auto Sync"] },
      { name: "Validation alertes IA", description: "Évaluation pertinence mots-clés, suggestions alternatives", tags: ["Auto IA"] },
      { name: "Analyse images lots", description: "Identification auto styles, périodes, matériaux depuis photos", tags: ["Auto IA"] },
      { name: "Q&R lot 24/7", description: "IA répond aux questions clients sur un lot", tags: ["Auto IA", "Auto Sync"] },
      { name: "Classification par familles", description: "Catégorisation auto : voitures sport, mobilier XVIIe, bijoux…", tags: ["Auto IA", "Auto Sync"] },
    ],
  },
  {
    title: "Backend (Edge Functions)",
    icon: "⚡",
    features: [
      { name: "analyze-estimation", description: "Analyse IA photos estimation (Gemini), synthèse, biographie auteur", tags: ["Auto IA"] },
      { name: "answer-lot-question", description: "Q&R IA sur un lot 24/7", tags: ["Auto IA"] },
      { name: "enrich-lot-ai", description: "Enrichissement description lot par IA", tags: ["Auto IA"] },
      { name: "enrich-sale-lots-ai", description: "Enrichissement par vente entière", tags: ["Auto IA"] },
      { name: "taste-interview", description: "Dialogue Lia profil de goûts", tags: ["Auto IA"] },
      { name: "validate-alert-keyword", description: "Validation pertinence mots-clés alertes", tags: ["Auto IA"] },
      { name: "synthesize-alerts", description: "Synthèse alertes ↔ lots correspondants", tags: ["Auto IA", "Auto Sync"] },
      { name: "scrape-interencheres", description: "Import auto données Interenchères", tags: ["Auto Sync"] },
      { name: "scrape-lots / scrape-lot-images", description: "Scraping lots et images externes", tags: ["Auto Sync"] },
      { name: "hydrate-lot-images", description: "Téléchargement et stockage images HD", tags: ["Auto Sync"] },
      { name: "store-lot-images", description: "Stockage images en storage cloud", tags: ["Auto Sync"] },
      { name: "image-proxy / compress-images", description: "Proxy et compression images" },
      { name: "import-lots-json", description: "Import lots depuis JSON/externe", tags: ["Auto Sync"] },
      { name: "search-example-images", description: "Recherche images exemples via Google" },
    ],
  },
  {
    title: "Administration",
    icon: "🛠",
    features: [
      { name: "Admin Lots", description: "Gestion lots, enrichissement IA, édition" },
      { name: "Admin Estimations", description: "Inbox estimations, pipeline, analyse IA, réponse, notes, second avis, délégation" },
      { name: "Export fonctionnalités", description: "Export tableau fonctionnalités en CSV/HTML" },
      { name: "Export offres commerciales", description: "Génération offres commerciales" },
      { name: "Export WordPress", description: "Export contenu format WordPress" },
      { name: "Export adaptation", description: "Guide adaptation multi-tenant" },
      { name: "Export vente CSV", description: "Export données vente en CSV" },
    ],
  },
  {
    title: "Base de données (19 tables)",
    icon: "🗄️",
    features: [
      { name: "interencheres_sales", description: "Ventes synchronisées depuis Interenchères" },
      { name: "interencheres_lots", description: "Lots avec images, estimations, adjudications, catégories IA" },
      { name: "interencheres_expositions", description: "Expositions liées aux ventes" },
      { name: "interencheres_cache", description: "Cache données scraping" },
      { name: "profiles", description: "Profils utilisateurs (identité, adresse, KYC, banque)" },
      { name: "memorized_lots", description: "Lots favoris des utilisateurs" },
      { name: "purchase_orders", description: "Ordres d'achat (lot, montant max)" },
      { name: "phone_bid_requests", description: "Demandes enchères téléphoniques" },
      { name: "info_requests", description: "Demandes d'informations sur un lot" },
      { name: "bordereaux", description: "Bordereaux paiement (frais, statut)" },
      { name: "pickup_appointments", description: "RDV enlèvement lots" },
      { name: "user_alerts", description: "Alertes mots-clés utilisateur" },
      { name: "alert_lot_views", description: "Suivi lots vus par alerte" },
      { name: "user_interests", description: "Centres d'intérêts spécialités" },
      { name: "user_consents", description: "Consentements RGPD" },
      { name: "user_activity", description: "Historique actions utilisateur" },
      { name: "taste_profiles", description: "Profils de goûts IA (Lia)" },
      { name: "lia_suggestions", description: "Suggestions lots par IA" },
      { name: "estimation_requests", description: "Demandes estimation en ligne" },
      { name: "svv_events", description: "Événements calendrier (expertises, permanences)" },
    ],
  },
];

const tagColors: Record<string, string> = {
  "Auto Sync": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Auto IA": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "SEO": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Marketing": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

const totalFeatures = sections.reduce((sum, s) => sum + s.features.length, 0);

export default function FonctionnalitesProjet() {
  return (
    <>
      <Helmet>
        <title>Fonctionnalités du projet | Le Marteau Digital</title>
        <meta name="description" content="Tableau complet des fonctionnalités développées pour la plateforme d'enchères Le Marteau Digital." />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Fonctionnalités du projet
            </h1>
            <p className="text-muted-foreground text-lg">
              {sections.length} sections · {totalFeatures} fonctionnalités · 19 tables · 17 Edge Functions
            </p>
          </div>

          {/* Stats badges */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Badge variant="outline" className="text-sm px-3 py-1.5">🏠 ~45 pages/vues uniques</Badge>
            <Badge variant="outline" className="text-sm px-3 py-1.5 border-blue-300 text-blue-700">🔄 Auto Sync Interenchères</Badge>
            <Badge variant="outline" className="text-sm px-3 py-1.5 border-purple-300 text-purple-700">🤖 IA Gemini intégrée</Badge>
            <Badge variant="outline" className="text-sm px-3 py-1.5 border-green-300 text-green-700">📈 SEO natif</Badge>
          </div>

          {/* Tabs by section */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-2 mb-6">
              <TabsTrigger value="all" className="text-xs">Tout</TabsTrigger>
              {sections.map((s) => (
                <TabsTrigger key={s.title} value={s.title} className="text-xs">
                  {s.icon} {s.title}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              {sections.map((section) => (
                <SectionTable key={section.title} section={section} />
              ))}
            </TabsContent>

            {sections.map((section) => (
              <TabsContent key={section.title} value={section.title}>
                <SectionTable section={section} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SectionTable({ section }: { section: Section }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-2xl">{section.icon}</span>
        {section.title}
        <span className="text-sm font-normal text-muted-foreground">({section.features.length})</span>
      </h2>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-[30%]">Fonctionnalité</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-[20%]">Tags</th>
            </tr>
          </thead>
          <tbody>
            {section.features.map((f, i) => (
              <tr key={f.name} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                <td className="px-4 py-2.5 font-medium text-foreground">{f.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{f.description}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {f.tags?.map((tag) => (
                      <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${tagColors[tag] || "bg-muted text-muted-foreground"}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
