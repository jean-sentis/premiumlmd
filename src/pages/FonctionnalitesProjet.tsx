import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Download } from "lucide-react";
import { exportFonctionnalitesHTML } from "@/lib/export-fonctionnalites";

type Scope = "generic" | "specific";

type Feature = {
  name: string;
  description: string;
  tags?: string[];
  scope: Scope;
  specificDetail?: string; // détail du contenu spécifique 12 pages
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
      { name: "Hero plein écran", description: "Image plein écran, accroche et CTA principal", tags: ["SEO", "Marketing"], scope: "generic" },
      { name: "Carrousel prochaines ventes", description: "Slider des ventes à venir avec SaleCard", tags: ["Auto Sync"], scope: "generic" },
      { name: "Planning inline 7 jours", description: "Timeline événements colorés par type", tags: ["Auto Sync"], scope: "generic" },
      { name: "Grille 8 spécialités", description: "Cartes avec images et hover effects", tags: ["SEO"], scope: "specific", specificDetail: "Spécialités choisies par 12 pages : Vins & Spiritueux, Bijoux & Montres, Art moderne, Art XXe, Céramiques, Militaria, Collections, Voitures de collection. Reflète l'identité méditerranéenne et corse." },
      { name: "Témoignages carousel", description: "Avis clients en carrousel rotatif", tags: ["Marketing"], scope: "specific", specificDetail: "Témoignages réels de clients de l'étude, avec noms et contextes locaux." },
      { name: "Horloge temps réel", description: "Affichage heure locale mise à jour chaque seconde", scope: "generic" },
    ],
  },
  {
    title: "Header / Footer / Navigation",
    icon: "🧭",
    features: [
      { name: "Logo et branding", description: "Logo cliquable retour accueil, variantes thème", scope: "specific", specificDetail: "Logo '12 pages & associés' avec variantes or/noir/blanc. Typographie Playfair Display pour l'identité éditoriale." },
      { name: "Navigation principale", description: "Menu déroulant Acheter, Vendre, Spécialités, À propos", scope: "generic" },
      { name: "Sous-menus avec images", description: "Grille visuelle des spécialités avec photos", tags: ["SEO"], scope: "generic" },
      { name: "Menu mobile responsive", description: "Sheet navigation avec accordéons", scope: "generic" },
      { name: "Footer informations", description: "Adresse, téléphone, email, réseaux sociaux", tags: ["SEO"], scope: "specific", specificDetail: "Coordonnées de l'étude à Ajaccio, lien vers plan d'accès Corse." },
      { name: "Horloge temps réel", description: "LiveClock mise à jour chaque seconde", scope: "generic" },
      { name: "Planning flottant", description: "FloatingPlanningButton + InlinePlanningSlot intégré", scope: "generic" },
      { name: "ScrollToTop", description: "Retour haut de page à chaque navigation", scope: "generic" },
      { name: "DemoRdvOverlay", description: "Overlay blocage démo avec lien Cal.eu pour RDV", scope: "specific", specificDetail: "Lien de prise de RDV Cal.eu spécifique à l'étude pour les démonstrations commerciales." },
    ],
  },
  {
    title: "Acheter",
    icon: "🛒",
    features: [
      { name: "Hub acheteur", description: "Page d'accueil avec navigation vers sous-pages", scope: "generic" },
      { name: "Ventes à venir", description: "Liste des prochaines ventes depuis la DB avec filtres", tags: ["Auto Sync", "SEO"], scope: "generic" },
      { name: "Ventes passées chronologiques", description: "Historique par date avec recherche et filtres", tags: ["Auto Sync"], scope: "generic" },
      { name: "Guide de l'acheteur", description: "Page manifeste pourquoi acheter aux enchères", tags: ["SEO"], scope: "specific", specificDetail: "Ton éditorial propre à 12 pages : storytelling sur l'émotion de l'enchère, anecdotes de la salle d'Ajaccio, positionnement 'démocratisation du beau'." },
      { name: "After-Sale invendus", description: "Consultation et achat d'invendus à prix fixe", tags: ["Auto Sync"], scope: "generic" },
      { name: "Détail after-sale", description: "Fiche lot invendu avec prix fixe", scope: "generic" },
    ],
  },
  {
    title: "Vente & Lot (détail)",
    icon: "🎨",
    features: [
      { name: "Fiche vente complète", description: "Infos, conditions, expositions, catalogue lots", tags: ["Auto Sync", "SEO"], scope: "generic" },
      { name: "Catalogue en ligne HD", description: "LotsGrid avec photos haute définition", tags: ["Auto Sync"], scope: "generic" },
      { name: "Sticky header vente", description: "Barre collante avec infos essentielles au scroll", scope: "generic" },
      { name: "Galerie photos HD + zoom", description: "ImageViewer avec navigation galerie et zoom", tags: ["Auto Sync"], scope: "generic" },
      { name: "Estimations affichées", description: "Estimation basse/haute avec devise", scope: "generic" },
      { name: "Description enrichie IA", description: "Titre et description enrichis automatiquement par IA", tags: ["Auto IA"], scope: "generic" },
      { name: "Analyse IA du lot", description: "Contexte historique, biographie créateur, observations image", tags: ["Auto IA"], scope: "generic" },
      { name: "Q&R IA 24/7", description: "L'IA répond aux questions clients sur un lot", tags: ["Auto IA"], scope: "generic" },
      { name: "Mémoriser (❤️)", description: "Bouton cœur pour sauvegarder un lot avec rappel dates", scope: "generic" },
      { name: "Ordre d'achat", description: "Dépôt montant maximum, confirmation email", scope: "generic" },
      { name: "Enchère téléphonique", description: "Formulaire pour être rappelé pendant la vente live", scope: "generic" },
      { name: "Demande d'informations", description: "Formulaire question, rapport condition, provenance", tags: ["Auto IA"], scope: "generic" },
      { name: "Vendre un objet similaire", description: "Bouton avec mailto pré-rempli référence lot", scope: "generic" },
      { name: "Accordion infos vente", description: "Détails vente accessibles depuis la fiche lot", scope: "generic" },
      { name: "Chrono (ventes online)", description: "Compte à rebours temps réel, barre sticky, guide", tags: ["Auto Sync"], scope: "generic" },
      { name: "Lien Interenchères", description: "Inscription et accès direct plateforme externe", tags: ["Auto Sync"], scope: "specific", specificDetail: "Intégration spécifique avec le compte Interenchères de 12 pages (house_id configuré)." },
    ],
  },
  {
    title: "Vendre",
    icon: "💰",
    features: [
      { name: "Hub vendeur", description: "Page d'accueil avec navigation estimation, inventaire, guide", scope: "generic" },
      { name: "Estimation en ligne", description: "Formulaire upload photos, description, dimensions", tags: ["SEO"], scope: "generic" },
      { name: "Expertises itinérantes", description: "Villes avec dates, carrés hover couleur", tags: ["SEO"], scope: "specific", specificDetail: "Villes du Sud-Corse : Ajaccio, Bonifacio, Porto-Vecchio, Sartène, Propriano, Levie. Calendrier et images spécifiques à chaque ville." },
      { name: "Inventaire à domicile", description: "Page succession, partage, déménagement + formulaire", tags: ["SEO"], scope: "generic" },
      { name: "Guide du vendeur", description: "Page explicative processus estimation et mise en vente", tags: ["SEO"], scope: "specific", specificDetail: "Ton et contenu éditorial propre : mentions de Maître Marcaggi, processus spécifique de l'étude, mise en avant de l'ancrage local." },
    ],
  },
  {
    title: "Spécialités (×11)",
    icon: "💎",
    features: [
      { name: "Grille spécialités", description: "Page index avec 11 cartes illustrées", tags: ["SEO"], scope: "generic" },
      { name: "Template commun", description: "SpecialtyPageTemplate réutilisable : hero, description, lots récents", tags: ["SEO"], scope: "generic" },
      { name: "11 pages dédiées", description: "Bijoux, Vins, Art moderne, Art XXe, Céramiques, Militaria, Argenterie, Collections, Mobilier, Mode, Voitures", tags: ["SEO"], scope: "specific", specificDetail: "Sélection de 11 spécialités reflétant l'ADN de 12 pages : fort accent sur Vins (Corse, Pétrus, Yquem), Militaria (collectionneurs insulaires), Voitures de collection. Textes SEO, 'belles enchères' et images spécifiques à chaque département." },
    ],
  },
  {
    title: "Calendrier",
    icon: "📅",
    features: [
      { name: "Vue calendrier unifié", description: "Affichage ventes, expositions, expertises avec code couleur", tags: ["Auto Sync"], scope: "generic" },
      { name: "Filtres par type", description: "Sélection ventes live, chrono, expositions, expertises", scope: "generic" },
      { name: "Détail événement", description: "Dialog avec infos complètes et liens", tags: ["Auto Sync"], scope: "generic" },
    ],
  },
  {
    title: "Pages éditoriales",
    icon: "📖",
    features: [
      { name: "La Maison", description: "Présentation, histoire, valeurs, équipe, experts", tags: ["SEO"], scope: "specific", specificDetail: "Histoire de l'étude 12 pages & associés, portrait de Maître Marcaggi, photos de l'Hôtel des Ventes d'Ajaccio, valeurs (proximité, exigence, transmission), ancrage corse et méditerranéen." },
      { name: "Aventures d'Enchères", description: "8 récits storytelling de découvertes illustrés", tags: ["SEO"], scope: "specific", specificDetail: "8 histoires vraies ou romancées ancrées dans le territoire : Vlaminck trouvé dans un grenier corse, cave à Pétrus, Bugatti dans un hangar, coffre mystère, manuscrit d'abbaye, archives de résistant, trésor de vide-grenier, collection de pharmacien." },
      { name: "Région & Talents", description: "Artisans locaux, coups de cœur, ancrage territorial", tags: ["SEO"], scope: "specific", specificDetail: "Mise en valeur d'artisans corses : Cordonnerie Pietri, Joaillier Santini, Musée Fesch, Maison Napoléon. Villages illustrés. Identité insulaire forte." },
      { name: "Glossaire", description: "Définitions en accordéon des termes du métier", tags: ["SEO"], scope: "generic" },
      { name: "Contact", description: "Formulaire, carte/plan d'accès, horaires", tags: ["SEO"], scope: "specific", specificDetail: "Adresse Ajaccio, plan Google Maps centré sur l'Hôtel des Ventes, horaires d'ouverture spécifiques, numéro de téléphone et email de l'étude." },
    ],
  },
  {
    title: "Espace Client (/compte)",
    icon: "👤",
    features: [
      { name: "Authentification", description: "Login, inscription, reset password, session persistante", scope: "generic" },
      { name: "Tableau de bord", description: "Vue d'ensemble alertes, lots, ordres, adjudications", tags: ["Auto Sync"], scope: "generic" },
      { name: "Barre de progression", description: "Indicateur complétude profil (gamification)", scope: "generic" },
      { name: "Profil 6 étapes", description: "Identité, téléphone, adresse, pièce ID (KYC), banque, sécurité", scope: "generic" },
      { name: "Favoris", description: "Lots mémorisés triés par vente, dates, statuts", tags: ["Auto Sync"], scope: "generic" },
      { name: "Ce que j'aime (Lia)", description: "Dialogue conversationnel IA pour cerner les goûts", tags: ["Auto IA"], scope: "specific", specificDetail: "Personnage 'Lia', ton concierge de palace, vouvoiement, références culturelles adaptées (art méditerranéen, vins corses…). Le nom, la personnalité et le vocabulaire sont propres à 12 pages." },
      { name: "Nuage de tags (TasteCloud)", description: "Visualisation graphique du profil de goûts", scope: "generic" },
      { name: "Centres d'intérêts", description: "Sélection spécialités, newsletter personnalisée", scope: "generic" },
      { name: "Mes alertes", description: "Alertes mots-clés, validation IA, activation/désactivation", tags: ["Auto IA"], scope: "generic" },
      { name: "Suggestions Lia", description: "Grille lots suggérés par IA avec validation utilisateur", tags: ["Auto IA"], scope: "generic" },
      { name: "Mes ordres", description: "Historique ordres d'achat : lot, montant max, statut", scope: "generic" },
      { name: "Enchères téléphone", description: "Demandes enchères tél., confirmation, résultat", scope: "generic" },
      { name: "Mes adjudications", description: "Lots remportés, prix, frais, statut paiement/enlèvement", tags: ["Auto Sync"], scope: "generic" },
      { name: "Régler mes achats", description: "Interface paiement bordereaux, calcul auto frais 25%", scope: "specific", specificDetail: "Taux de frais acheteur de 25% TTC configuré spécifiquement pour 12 pages. Ce pourcentage varie selon les études." },
      { name: "Programmer enlèvement", description: "Prise RDV créneaux, confirmation", scope: "generic" },
      { name: "Newsletter", description: "Choix spécialités, fréquence", scope: "generic" },
      { name: "Vie privée RGPD", description: "Consentements, préférences, droit à l'oubli", scope: "generic" },
    ],
  },
  {
    title: "Intelligence Artificielle",
    icon: "🤖",
    features: [
      { name: "Dialogue Lia conversationnel", description: "IA formelle, proactive, choix binaires, références culturelles", tags: ["Auto IA"], scope: "specific", specificDetail: "Personnalité Lia calibrée pour 12 pages : ton concierge palace, vouvoiement systématique, 'Monsieur/Madame NOM', références art méditerranéen, histoire corse et napoléonienne." },
      { name: "Ton Concierge palace", description: "Vouvoiement, Monsieur/Madame NOM, références adaptées", tags: ["Auto IA"], scope: "specific", specificDetail: "Registre de langue et posture relationnelle définis pour l'image haut de gamme mais accessible de l'étude." },
      { name: "Suggestions personnalisées", description: "Sélection auto lots, grille validation, amélioration continue", tags: ["Auto IA", "Auto Sync"], scope: "generic" },
      { name: "Analyse IA des lots", description: "Contexte historique, biographie créateur, observations image", tags: ["Auto IA", "Auto Sync"], scope: "generic" },
      { name: "Enrichissement descriptions", description: "Titre vendeur, description enrichie, dimensions formatées", tags: ["Auto IA", "Auto Sync"], scope: "generic" },
      { name: "Validation alertes IA", description: "Évaluation pertinence mots-clés, suggestions alternatives", tags: ["Auto IA"], scope: "generic" },
      { name: "Analyse images lots", description: "Identification auto styles, périodes, matériaux depuis photos", tags: ["Auto IA"], scope: "generic" },
      { name: "Q&R lot 24/7", description: "IA répond aux questions clients sur un lot", tags: ["Auto IA", "Auto Sync"], scope: "generic" },
      { name: "Classification par familles", description: "Catégorisation auto : voitures sport, mobilier XVIIe, bijoux…", tags: ["Auto IA", "Auto Sync"], scope: "generic" },
    ],
  },
  {
    title: "Backend (Edge Functions)",
    icon: "⚡",
    features: [
      { name: "analyze-estimation", description: "Analyse IA photos estimation (Gemini), synthèse, biographie auteur", tags: ["Auto IA"], scope: "generic" },
      { name: "answer-lot-question", description: "Q&R IA sur un lot 24/7", tags: ["Auto IA"], scope: "generic" },
      { name: "enrich-lot-ai", description: "Enrichissement description lot par IA", tags: ["Auto IA"], scope: "generic" },
      { name: "enrich-sale-lots-ai", description: "Enrichissement par vente entière", tags: ["Auto IA"], scope: "generic" },
      { name: "taste-interview", description: "Dialogue Lia profil de goûts", tags: ["Auto IA"], scope: "specific", specificDetail: "Prompt système calibré avec la personnalité Lia, les spécialités de 12 pages, et le ton concierge." },
      { name: "validate-alert-keyword", description: "Validation pertinence mots-clés alertes", tags: ["Auto IA"], scope: "generic" },
      { name: "synthesize-alerts", description: "Synthèse alertes ↔ lots correspondants", tags: ["Auto IA", "Auto Sync"], scope: "generic" },
      { name: "scrape-interencheres", description: "Import auto données Interenchères", tags: ["Auto Sync"], scope: "specific", specificDetail: "Connecté au house_id spécifique de 12 pages & associés sur Interenchères. URL et identifiants propres." },
      { name: "scrape-lots / scrape-lot-images", description: "Scraping lots et images externes", tags: ["Auto Sync"], scope: "generic" },
      { name: "hydrate-lot-images", description: "Téléchargement et stockage images HD", tags: ["Auto Sync"], scope: "generic" },
      { name: "store-lot-images", description: "Stockage images en storage cloud", tags: ["Auto Sync"], scope: "generic" },
      { name: "image-proxy / compress-images", description: "Proxy et compression images", scope: "generic" },
      { name: "import-lots-json", description: "Import lots depuis JSON/externe", tags: ["Auto Sync"], scope: "generic" },
      { name: "search-example-images", description: "Recherche images exemples via Google", scope: "generic" },
    ],
  },
  {
    title: "Administration",
    icon: "🛠",
    features: [
      { name: "Admin Lots", description: "Gestion lots, enrichissement IA, édition", scope: "generic" },
      { name: "Admin Estimations", description: "Inbox estimations, pipeline, analyse IA, réponse, notes, second avis, délégation", scope: "generic" },
      { name: "Export fonctionnalités", description: "Export tableau fonctionnalités en CSV/HTML", scope: "generic" },
      { name: "Export offres commerciales", description: "Génération offres commerciales", scope: "specific", specificDetail: "Templates d'offres commerciales avec tarification et positionnement propres à 12 pages." },
      { name: "Export WordPress", description: "Export contenu format WordPress", scope: "generic" },
      { name: "Export adaptation", description: "Guide adaptation multi-tenant", scope: "generic" },
      { name: "Export vente CSV", description: "Export données vente en CSV", scope: "generic" },
    ],
  },
  {
    title: "Base de données (19 tables)",
    icon: "🗄️",
    features: [
      { name: "interencheres_sales", description: "Ventes synchronisées depuis Interenchères", scope: "generic" },
      { name: "interencheres_lots", description: "Lots avec images, estimations, adjudications, catégories IA", scope: "generic" },
      { name: "interencheres_expositions", description: "Expositions liées aux ventes", scope: "generic" },
      { name: "interencheres_cache", description: "Cache données scraping", scope: "generic" },
      { name: "profiles", description: "Profils utilisateurs (identité, adresse, KYC, banque)", scope: "generic" },
      { name: "memorized_lots", description: "Lots favoris des utilisateurs", scope: "generic" },
      { name: "purchase_orders", description: "Ordres d'achat (lot, montant max)", scope: "generic" },
      { name: "phone_bid_requests", description: "Demandes enchères téléphoniques", scope: "generic" },
      { name: "info_requests", description: "Demandes d'informations sur un lot", scope: "generic" },
      { name: "bordereaux", description: "Bordereaux paiement (frais, statut)", scope: "generic" },
      { name: "pickup_appointments", description: "RDV enlèvement lots", scope: "generic" },
      { name: "user_alerts", description: "Alertes mots-clés utilisateur", scope: "generic" },
      { name: "alert_lot_views", description: "Suivi lots vus par alerte", scope: "generic" },
      { name: "user_interests", description: "Centres d'intérêts spécialités", scope: "generic" },
      { name: "user_consents", description: "Consentements RGPD", scope: "generic" },
      { name: "user_activity", description: "Historique actions utilisateur", scope: "generic" },
      { name: "taste_profiles", description: "Profils de goûts IA (Lia)", scope: "generic" },
      { name: "lia_suggestions", description: "Suggestions lots par IA", scope: "generic" },
      { name: "estimation_requests", description: "Demandes estimation en ligne", scope: "generic" },
      { name: "svv_events", description: "Événements calendrier (expertises, permanences)", scope: "generic" },
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
const genericCount = sections.reduce((sum, s) => sum + s.features.filter(f => f.scope === "generic").length, 0);
const specificCount = sections.reduce((sum, s) => sum + s.features.filter(f => f.scope === "specific").length, 0);

type ScopeFilter = "all" | "generic" | "specific";

export default function FonctionnalitesProjet() {
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");

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
          <div className="mb-10 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Fonctionnalités du projet
              </h1>
              <p className="text-muted-foreground text-lg">
                {sections.length} sections · {totalFeatures} fonctionnalités · 19 tables · 17 Edge Functions
              </p>
            </div>
            <button
              onClick={() => exportFonctionnalitesHTML(sections, totalFeatures, scopeFilter)}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity print:hidden"
            >
              <Download className="w-4 h-4" />
              Exporter HTML
            </button>
          </div>

          {/* Stats badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Badge variant="outline" className="text-sm px-3 py-1.5">🏠 ~45 pages/vues uniques</Badge>
            <Badge variant="outline" className="text-sm px-3 py-1.5 border-blue-300 text-blue-700">🔄 Auto Sync Interenchères</Badge>
            <Badge variant="outline" className="text-sm px-3 py-1.5 border-purple-300 text-purple-700">🤖 IA Gemini intégrée</Badge>
            <Badge variant="outline" className="text-sm px-3 py-1.5 border-green-300 text-green-700">📈 SEO natif</Badge>
          </div>

          {/* Scope filter */}
          <div className="flex flex-wrap items-center gap-3 mb-8 p-4 rounded-lg border border-border bg-muted/30">
            <span className="text-sm font-medium text-foreground mr-1">Filtrer :</span>
            <button
              onClick={() => setScopeFilter("all")}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                scopeFilter === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              Tout ({totalFeatures})
            </button>
            <button
              onClick={() => setScopeFilter("generic")}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                scopeFilter === "generic"
                  ? "bg-slate-700 text-white border-slate-700 dark:bg-slate-300 dark:text-slate-900 dark:border-slate-300"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              🏛 Générique SVV ({genericCount})
            </button>
            <button
              onClick={() => setScopeFilter("specific")}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                scopeFilter === "specific"
                  ? "bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:border-amber-500"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              ✦ Spécifique 12 pages ({specificCount})
            </button>
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
                <SectionTable key={section.title} section={section} scopeFilter={scopeFilter} />
              ))}
            </TabsContent>

            {sections.map((section) => (
              <TabsContent key={section.title} value={section.title}>
                <SectionTable section={section} scopeFilter={scopeFilter} />
              </TabsContent>
            ))}
          </Tabs>

          {/* Legend */}
          <div className="mt-12 p-5 rounded-lg border border-border bg-muted/20">
            <h3 className="font-semibold text-foreground mb-3">Légende</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 mt-0.5 shrink-0" />
                <span><strong>🏛 Générique SVV</strong> — Fonctionnalité commune à tout hôtel des ventes. Réutilisable telle quelle pour un autre client.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-500 mt-0.5 shrink-0" />
                <span><strong>✦ Spécifique 12 pages</strong> — Contenu, configuration ou ton éditorial propre à 12 pages & associés. Nécessite adaptation pour un autre client.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SectionTable({ section, scopeFilter }: { section: Section; scopeFilter: ScopeFilter }) {
  const filtered = section.features.filter(f =>
    scopeFilter === "all" ? true : f.scope === scopeFilter
  );

  if (filtered.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-2xl">{section.icon}</span>
        {section.title}
        <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
      </h2>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-[5%]"></th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-[25%]">Fonctionnalité</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-[15%]">Tags</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f, i) => (
              <tr key={f.name} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                <td className="px-4 py-2.5 text-center">
                  {f.scope === "specific" ? (
                    <span className="inline-block w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-500" title="Spécifique 12 pages" />
                  ) : (
                    <span className="inline-block w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" title="Générique SVV" />
                  )}
                </td>
                <td className="px-4 py-2.5 font-medium text-foreground">{f.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {f.description}
                  {f.specificDetail && (
                    <div className="mt-1.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1.5 border-l-2 border-amber-400">
                      {f.specificDetail}
                    </div>
                  )}
                </td>
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
