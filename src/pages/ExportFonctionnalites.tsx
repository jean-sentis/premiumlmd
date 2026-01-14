import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import ExcelJS from "exceljs";

interface Feature {
  section: string;
  fonctionnalite: string;
  description: string;
  benefice: string;
  vendeur: boolean;
  acheteur: boolean;
  cp: boolean;
  setupEnfant: boolean;      // Adaptation automatique du modèle parent
  majAuto: boolean;          // Mise à jour automatique continue
  setupManuel: string;       // Catégorie de setup manuel (titre section)
  type: string;
}

interface SetupManuelDetail {
  categorie: string;
  element: string;
  description: string;
  frequence: string;  // "Initial" ou "MàJ périodique"
}

const features: Feature[] = [
  // HEADER & FOOTER
  { section: "Header & Footer", fonctionnalite: "Logo cliquable", description: "Retour accueil depuis toutes les pages", benefice: "Navigation intuitive", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Header & Footer", fonctionnalite: "Navigation principale", description: "Menu avec liens vers sections clés", benefice: "Accès rapide aux services", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Header & Footer", fonctionnalite: "Horloge temps réel", description: "Affichage heure actuelle", benefice: "Repère temporel pour enchères", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Header & Footer", fonctionnalite: "Menu mobile responsive", description: "Navigation adaptée mobile avec drawer", benefice: "Expérience mobile optimale", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Header & Footer", fonctionnalite: "Footer informatif", description: "Coordonnées, horaires, liens utiles", benefice: "Informations accessibles", vendeur: true, acheteur: true, cp: true, setupEnfant: false, majAuto: false, setupManuel: "Infos pratiques", type: "Manuel" },

  // ACCUEIL
  { section: "Accueil", fonctionnalite: "Hero section", description: "Présentation visuelle impactante", benefice: "Première impression mémorable", vendeur: true, acheteur: true, cp: true, setupEnfant: false, majAuto: false, setupManuel: "SEO Local", type: "Manuel" },
  { section: "Accueil", fonctionnalite: "Prochaines ventes", description: "Affichage ventes à venir", benefice: "Visibilité immédiate du calendrier", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },
  { section: "Accueil", fonctionnalite: "Spécialités mises en avant", description: "Grille des domaines d'expertise", benefice: "Découverte des compétences", vendeur: true, acheteur: true, cp: true, setupEnfant: false, majAuto: false, setupManuel: "SEO Global", type: "Manuel" },
  { section: "Accueil", fonctionnalite: "Témoignages clients", description: "Carrousel avis clients", benefice: "Confiance et crédibilité", vendeur: true, acheteur: true, cp: true, setupEnfant: false, majAuto: false, setupManuel: "SEO Local", type: "Manuel" },
  { section: "Accueil", fonctionnalite: "CTA estimation gratuite", description: "Bouton vers formulaire estimation", benefice: "Conversion vendeurs", vendeur: true, acheteur: false, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },

  // SERVICES ACHETEURS
  { section: "Services Acheteurs", fonctionnalite: "Guide de l'acheteur", description: "Tutoriel complet pour enchérir", benefice: "Démystification des enchères", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Services Acheteurs", fonctionnalite: "Glossaire des enchères", description: "Définitions termes spécialisés", benefice: "Compréhension du vocabulaire", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: false, setupManuel: "SEO 6M", type: "SEO 6M" },
  { section: "Services Acheteurs", fonctionnalite: "Liste ventes à venir", description: "Catalogue complet avec filtres", benefice: "Planification des achats", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },
  { section: "Services Acheteurs", fonctionnalite: "Détail vente", description: "Page complète avec tous les lots", benefice: "Vision globale de la vente", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },
  { section: "Services Acheteurs", fonctionnalite: "Détail lot", description: "Fiche produit avec images HD, zoom", benefice: "Examen détaillé avant achat", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },
  { section: "Services Acheteurs", fonctionnalite: "Ordre d'achat en ligne", description: "Formulaire enchère maximum", benefice: "Participation sans présence", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Services Acheteurs", fonctionnalite: "Enchère téléphone", description: "Réservation ligne téléphonique", benefice: "Suivi en direct à distance", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Services Acheteurs", fonctionnalite: "Ventes passées", description: "Archives avec résultats", benefice: "Historique et références prix", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync + IA" },
  { section: "Services Acheteurs", fonctionnalite: "After-sale", description: "Lots invendus disponibles", benefice: "Seconde chance d'achat", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },
  { section: "Services Acheteurs", fonctionnalite: "Paiement en ligne", description: "Règlement sécurisé des achats", benefice: "Simplicité de paiement", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Services Acheteurs", fonctionnalite: "Enlèvement RDV", description: "Prise de rendez-vous retrait", benefice: "Organisation du retrait", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },

  // SERVICES VENDEURS
  { section: "Services Vendeurs", fonctionnalite: "Guide du vendeur", description: "Processus de vente expliqué", benefice: "Transparence et confiance", vendeur: true, acheteur: false, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Services Vendeurs", fonctionnalite: "Estimation en ligne", description: "Formulaire avec upload photos", benefice: "Première évaluation rapide", vendeur: true, acheteur: false, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Services Vendeurs", fonctionnalite: "Journées estimation", description: "Calendrier RDV gratuits", benefice: "Accès expertise en personne", vendeur: true, acheteur: false, cp: true, setupEnfant: false, majAuto: false, setupManuel: "SEO Local", type: "SEO Local" },
  { section: "Services Vendeurs", fonctionnalite: "Inventaire à domicile", description: "Service déplacement expert", benefice: "Confort pour successions", vendeur: true, acheteur: false, cp: true, setupEnfant: false, majAuto: false, setupManuel: "SEO Local", type: "SEO Local" },
  { section: "Services Vendeurs", fonctionnalite: "Évaluation marché", description: "Historique prix par catégorie", benefice: "Connaissance des tendances", vendeur: true, acheteur: false, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "IA" },

  // CALENDRIER
  { section: "Calendrier", fonctionnalite: "Vue unifiée", description: "Ventes, expos, expertises ensemble", benefice: "Planification simplifiée", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },
  { section: "Calendrier", fonctionnalite: "Filtres par type", description: "Sélection ventes/expos/expertises", benefice: "Vue personnalisée", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Calendrier", fonctionnalite: "Détail événement", description: "Informations complètes au clic", benefice: "Accès rapide aux détails", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },

  // ESPACE CLIENT
  { section: "Espace Client", fonctionnalite: "Authentification", description: "Inscription/connexion sécurisée", benefice: "Compte personnel protégé", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Dashboard accueil", description: "Vue synthétique activité", benefice: "Suivi en un coup d'œil", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Mes alertes", description: "Mots-clés surveillés", benefice: "Ne rien manquer", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "IA" },
  { section: "Espace Client", fonctionnalite: "Suggestions Lia", description: "IA recommande lots pertinents", benefice: "Découverte personnalisée", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "IA" },
  { section: "Espace Client", fonctionnalite: "Dialogue goûts", description: "Conversation IA préférences", benefice: "Profil affiné intelligemment", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "IA" },
  { section: "Espace Client", fonctionnalite: "Favoris", description: "Lots mémorisés", benefice: "Suivi lots intéressants", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Mes ordres d'achat", description: "Historique enchères déposées", benefice: "Gestion des participations", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Enchères téléphone", description: "Demandes ligne téléphonique", benefice: "Suivi réservations", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Mes adjudications", description: "Lots remportés", benefice: "Historique achats", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Régler mes achats", description: "Paiement bordereaux", benefice: "Règlement simplifié", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Enlèvement", description: "Planification retrait", benefice: "Organisation facilitée", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Mon profil", description: "Informations personnelles", benefice: "Données à jour", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Vie privée", description: "Gestion consentements RGPD", benefice: "Contrôle des données", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },

  // INTELLIGENCE ARTIFICIELLE
  { section: "Intelligence Artificielle", fonctionnalite: "Lia conversationnelle", description: "Assistant IA dialogue naturel", benefice: "Accompagnement personnalisé", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "IA" },
  { section: "Intelligence Artificielle", fonctionnalite: "Analyse lot", description: "IA décrit et contextualise", benefice: "Expertise enrichie", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "IA" },
  { section: "Intelligence Artificielle", fonctionnalite: "Enrichissement descriptions", description: "Amélioration automatique textes", benefice: "Descriptions attractives", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "IA" },
  { section: "Intelligence Artificielle", fonctionnalite: "Classification catégories", description: "Tri automatique par famille", benefice: "Navigation par objet", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "IA" },
  { section: "Intelligence Artificielle", fonctionnalite: "Questions lot", description: "Chat sur lot spécifique", benefice: "Réponses instantanées", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "IA" },
  { section: "Intelligence Artificielle", fonctionnalite: "Validation alertes", description: "IA vérifie pertinence mots-clés", benefice: "Alertes qualifiées", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "IA" },

  // GESTION VENTES
  { section: "Gestion Ventes", fonctionnalite: "Page vente détaillée", description: "Toutes infos vente + lots", benefice: "Vision complète", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },
  { section: "Gestion Ventes", fonctionnalite: "Sync Interenchères", description: "Import automatique données", benefice: "Données toujours à jour", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },
  { section: "Gestion Ventes", fonctionnalite: "Images HD", description: "Stockage haute définition", benefice: "Qualité visuelle optimale", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },
  { section: "Gestion Ventes", fonctionnalite: "Ventes live", description: "Gestion enchères temps réel", benefice: "Suivi en direct", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },
  { section: "Gestion Ventes", fonctionnalite: "Ventes chrono", description: "Enchères avec compte à rebours", benefice: "Flexibilité participation", vendeur: false, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },
  { section: "Gestion Ventes", fonctionnalite: "Gestion after-sale", description: "Invendus disponibles", benefice: "Maximisation ventes", vendeur: true, acheteur: true, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto Sync" },

  // COMMUNICATION
  { section: "Communication", fonctionnalite: "Pages spécialités", description: "11 pages expertise détaillées", benefice: "SEO et expertise visible", vendeur: true, acheteur: true, cp: true, setupEnfant: false, majAuto: false, setupManuel: "SEO Global", type: "Manuel" },
  { section: "Communication", fonctionnalite: "Aventures d'enchères", description: "Histoires et anecdotes", benefice: "Storytelling engageant", vendeur: true, acheteur: true, cp: true, setupEnfant: false, majAuto: false, setupManuel: "SEO Local", type: "Manuel" },
  { section: "Communication", fonctionnalite: "La Maison", description: "Présentation entreprise", benefice: "Confiance et légitimité", vendeur: true, acheteur: true, cp: true, setupEnfant: false, majAuto: false, setupManuel: "SEO Local", type: "Manuel" },
  { section: "Communication", fonctionnalite: "Talents de la région", description: "Artisans locaux partenaires", benefice: "Ancrage territorial", vendeur: true, acheteur: true, cp: true, setupEnfant: false, majAuto: false, setupManuel: "SEO Local", type: "Manuel" },
  { section: "Communication", fonctionnalite: "Contact", description: "Formulaire et coordonnées", benefice: "Accessibilité", vendeur: true, acheteur: true, cp: true, setupEnfant: false, majAuto: false, setupManuel: "Infos pratiques", type: "Manuel" },
  { section: "Communication", fonctionnalite: "Témoignages", description: "Avis clients authentiques", benefice: "Preuve sociale", vendeur: true, acheteur: true, cp: true, setupEnfant: false, majAuto: false, setupManuel: "SEO Local", type: "Manuel" },

  // ADMINISTRATION CRM
  { section: "Administration CRM", fonctionnalite: "Profils clients auto", description: "Création automatique à l'inscription", benefice: "Base clients structurée", vendeur: false, acheteur: false, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Administration CRM", fonctionnalite: "Détection intérêts", description: "IA identifie préférences", benefice: "Connaissance client approfondie", vendeur: false, acheteur: false, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "IA" },
  { section: "Administration CRM", fonctionnalite: "Suivi paiements", description: "État des règlements", benefice: "Gestion financière claire", vendeur: false, acheteur: false, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Administration CRM", fonctionnalite: "Suivi enlèvements", description: "État des retraits", benefice: "Logistique maîtrisée", vendeur: false, acheteur: false, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },
  { section: "Administration CRM", fonctionnalite: "Statistiques", description: "Tableaux de bord analytics", benefice: "Pilotage par données", vendeur: false, acheteur: false, cp: true, setupEnfant: true, majAuto: true, setupManuel: "", type: "Auto" },

  // DESIGN & IDENTITÉ
  { section: "Design & Identité", fonctionnalite: "Direction artistique", description: "Choix polices, couleurs, style", benefice: "Identité visuelle unique", vendeur: true, acheteur: true, cp: true, setupEnfant: false, majAuto: false, setupManuel: "SEO Local", type: "Manuel" },
  { section: "Design & Identité", fonctionnalite: "Logo et favicon", description: "Identité graphique de l'étude", benefice: "Reconnaissance de marque", vendeur: true, acheteur: true, cp: true, setupEnfant: false, majAuto: false, setupManuel: "SEO Local", type: "Manuel" },
];

// Détails du contenu à fournir pour le SETUP Manuel
const setupManuelDetails: SetupManuelDetail[] = [
  // SEO LOCAL - Identité de l'étude
  { categorie: "SEO Local", element: "Photos hôtel des ventes", description: "Vues intérieure et extérieure du lieu de vente", frequence: "Initial" },
  { categorie: "SEO Local", element: "Photos d'une vente", description: "Ambiance salle, public, marteau, lots présentés", frequence: "Initial" },
  { categorie: "SEO Local", element: "Photos de l'équipe", description: "Portrait individuel ou groupe de l'équipe permanente", frequence: "Initial" },
  { categorie: "SEO Local", element: "Photos des experts", description: "Portrait de chaque expert intervenant", frequence: "Initial" },
  { categorie: "SEO Local", element: "Texte présentation hôtel des ventes", description: "Histoire, valeurs, positionnement de la maison", frequence: "Initial" },
  { categorie: "SEO Local", element: "Texte présentation équipe", description: "Bio courte de chaque membre de l'équipe", frequence: "Initial" },
  { categorie: "SEO Local", element: "Texte présentation experts", description: "Parcours et spécialités de chaque expert", frequence: "Initial" },
  { categorie: "SEO Local", element: "Rubrique coups de cœur régionaux", description: "Partenaires locaux, artisans, institutions à mettre en avant", frequence: "Initial + MàJ" },
  { categorie: "SEO Local", element: "Articles aventures d'enchères", description: "Histoires, anecdotes, découvertes marquantes", frequence: "Initial + MàJ" },
  { categorie: "SEO Local", element: "Photos articles", description: "Illustrations pour chaque article", frequence: "Initial + MàJ" },
  { categorie: "SEO Local", element: "Témoignages clients", description: "Avis et retours d'expérience authentiques", frequence: "Initial + MàJ" },
  { categorie: "SEO Local", element: "Journées estimation - villes", description: "Liste des villes et lieux d'expertise", frequence: "Initial + MàJ" },
  
  // SEO LOCAL - Direction artistique
  { categorie: "SEO Local", element: "Choix de la police principale", description: "Typographie distinctive pour titres", frequence: "Initial" },
  { categorie: "SEO Local", element: "Palette de couleurs", description: "Couleurs primaires et secondaires de l'identité", frequence: "Initial" },
  { categorie: "SEO Local", element: "Logo et déclinaisons", description: "Logo principal, favicon, versions alternatives", frequence: "Initial" },
  
  // SEO GLOBAL - Spécialités (à répéter pour chaque spécialité)
  { categorie: "SEO Global", element: "Présentation spécialité au nom du CP", description: "Texte personnalisé pour chaque domaine d'expertise", frequence: "Initial" },
  { categorie: "SEO Global", element: "Wording SEO spécialité", description: "Mots-clés et expressions ciblées par spécialité", frequence: "Initial" },
  { categorie: "SEO Global", element: "Photos de la spécialité", description: "Visuels représentatifs de chaque domaine", frequence: "Initial" },
  { categorie: "SEO Global", element: "Mot de l'expert", description: "Citation ou message de l'expert par spécialité", frequence: "Initial" },
  { categorie: "SEO Global", element: "Questions-réponses expert", description: "FAQ spécialisée par domaine d'expertise", frequence: "Initial" },
  
  // INFOS PRATIQUES
  { categorie: "Infos pratiques", element: "Adresse complète", description: "Adresse postale de l'hôtel des ventes", frequence: "Initial" },
  { categorie: "Infos pratiques", element: "Téléphone", description: "Numéro de téléphone principal", frequence: "Initial" },
  { categorie: "Infos pratiques", element: "Emails par service", description: "Adresses email (ventes, comptabilité, accueil...)", frequence: "Initial" },
  { categorie: "Infos pratiques", element: "Horaires d'ouverture", description: "Jours et heures d'ouverture au public", frequence: "Initial" },
  { categorie: "Infos pratiques", element: "Informations d'accès", description: "Parking, transports, indications", frequence: "Initial" },
  
  // SEO 6M - Mises à jour semestrielles
  { categorie: "SEO 6M", element: "Glossaire enchères", description: "Enrichissement des définitions et termes", frequence: "MàJ semestrielle" },
  { categorie: "SEO 6M", element: "Nouveaux articles", description: "Ajout de nouvelles aventures d'enchères", frequence: "MàJ semestrielle" },
  { categorie: "SEO 6M", element: "Nouveaux témoignages", description: "Collecte et publication de nouveaux avis", frequence: "MàJ semestrielle" },
];

// Couleurs par type
const typeColors: Record<string, string> = {
  "Auto Sync": "C6EFCE",      // Vert clair
  "Auto Sync + IA": "E2EFDA", // Vert très clair
  "IA": "E4DFEC",             // Violet clair
  "SEO Local": "BDD7EE",      // Bleu moyen
  "SEO 6M": "9BC2E6",         // Bleu plus foncé
  "Manuel": "FCE4D6",         // Orange clair
  "Auto": "F2F2F2",           // Gris clair
};

const setupManuelColors: Record<string, string> = {
  "SEO Local": "BDD7EE",
  "SEO Global": "DDEBF7",
  "Infos pratiques": "FCE4D6",
  "SEO 6M": "9BC2E6",
};

const ExportFonctionnalites = () => {
  const generateExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Plateforme Enchères SaaS";
    workbook.created = new Date();

    // ===== FEUILLE 1: Fonctionnalités principales =====
    const worksheet = workbook.addWorksheet("Fonctionnalités", {
      views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
    });

    worksheet.columns = [
      { header: "Section", key: "section", width: 22 },
      { header: "Fonctionnalité", key: "fonctionnalite", width: 26 },
      { header: "Description", key: "description", width: 35 },
      { header: "Bénéfice", key: "benefice", width: 28 },
      { header: "V", key: "vendeur", width: 4 },
      { header: "A", key: "acheteur", width: 4 },
      { header: "CP", key: "cp", width: 4 },
      { header: "SETUP Enfant", key: "setupEnfant", width: 14 },
      { header: "MàJ Auto", key: "majAuto", width: 10 },
      { header: "SETUP Manuel", key: "setupManuel", width: 14 },
      { header: "Type", key: "type", width: 14 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4472C4" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    headerRow.height = 30;

    // Add data rows
    features.forEach((feature, index) => {
      const row = worksheet.addRow({
        section: feature.section,
        fonctionnalite: feature.fonctionnalite,
        description: feature.description,
        benefice: feature.benefice,
        vendeur: feature.vendeur ? "✓" : "",
        acheteur: feature.acheteur ? "✓" : "",
        cp: feature.cp ? "✓" : "",
        setupEnfant: feature.setupEnfant ? "✓" : "",
        majAuto: feature.majAuto ? "✓" : "",
        setupManuel: feature.setupManuel,
        type: feature.type,
      });

      const bgColor = typeColors[feature.type] || "FFFFFF";
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgColor },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "D9D9D9" } },
          left: { style: "thin", color: { argb: "D9D9D9" } },
          bottom: { style: "thin", color: { argb: "D9D9D9" } },
          right: { style: "thin", color: { argb: "D9D9D9" } },
        };
      });

      ["vendeur", "acheteur", "cp", "setupEnfant", "majAuto", "setupManuel"].forEach((key) => {
        const cell = row.getCell(key);
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      if (index > 0 && feature.section !== features[index - 1].section) {
        row.getCell("section").font = { bold: true };
      }
    });

    // ===== Séparateur et section DÉTAIL SETUP MANUEL =====
    const separatorRow = worksheet.addRow({});
    separatorRow.height = 20;
    
    const titleRow = worksheet.addRow({
      section: "DÉTAIL SETUP MANUEL",
      fonctionnalite: "",
      description: "",
      benefice: "",
    });
    titleRow.font = { bold: true, size: 14 };
    titleRow.height = 30;
    titleRow.getCell("section").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4472C4" },
    };
    titleRow.getCell("section").font = { bold: true, color: { argb: "FFFFFF" }, size: 14 };
    worksheet.mergeCells(titleRow.number, 1, titleRow.number, 11);

    // Sous-entêtes pour la section détail
    const detailHeaderRow = worksheet.addRow({
      section: "Catégorie",
      fonctionnalite: "Élément à fournir",
      description: "Description",
      benefice: "Fréquence",
    });
    detailHeaderRow.font = { bold: true };
    detailHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D9E2F3" },
    };
    detailHeaderRow.eachCell((cell, colNumber) => {
      if (colNumber <= 4) {
        cell.border = {
          top: { style: "thin", color: { argb: "4472C4" } },
          left: { style: "thin", color: { argb: "4472C4" } },
          bottom: { style: "thin", color: { argb: "4472C4" } },
          right: { style: "thin", color: { argb: "4472C4" } },
        };
      }
    });

    // Ajouter les détails du setup manuel
    setupManuelDetails.forEach((detail) => {
      const row = worksheet.addRow({
        section: detail.categorie,
        fonctionnalite: detail.element,
        description: detail.description,
        benefice: detail.frequence,
      });

      const bgColor = setupManuelColors[detail.categorie] || "FFFFFF";
      [1, 2, 3, 4].forEach((colNum) => {
        const cell = row.getCell(colNum);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgColor },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "D9D9D9" } },
          left: { style: "thin", color: { argb: "D9D9D9" } },
          bottom: { style: "thin", color: { argb: "D9D9D9" } },
          right: { style: "thin", color: { argb: "D9D9D9" } },
        };
      });
    });

    // ===== FEUILLE 2: Légende =====
    const legendSheet = workbook.addWorksheet("Légende");
    legendSheet.columns = [
      { header: "Type / Catégorie", key: "type", width: 20 },
      { header: "Description", key: "description", width: 55 },
    ];

    const legendHeader = legendSheet.getRow(1);
    legendHeader.font = { bold: true, color: { argb: "FFFFFF" } };
    legendHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4472C4" },
    };

    const legendData = [
      { type: "TYPES DE FONCTIONNALITÉS", description: "", isSection: true },
      { type: "Auto Sync", description: "Synchronisation automatique avec Interenchères - Aucune intervention" },
      { type: "Auto Sync + IA", description: "Synchronisation + enrichissement intelligent automatique" },
      { type: "IA", description: "Fonctionnalité basée sur l'intelligence artificielle" },
      { type: "Auto", description: "Fonctionnalité automatique du système" },
      { type: "Manuel", description: "Contenu à créer lors du setup et à maintenir" },
      { type: "", description: "", isSection: false },
      { type: "CATÉGORIES SETUP MANUEL", description: "", isSection: true },
      { type: "SEO Local", description: "Contenu propre à l'étude : photos, textes, identité visuelle, articles" },
      { type: "SEO Global", description: "Contenu spécialités : présentations, mots experts, FAQ par domaine" },
      { type: "Infos pratiques", description: "Coordonnées, horaires, accès" },
      { type: "SEO 6M", description: "Contenu à enrichir tous les 6 mois pour maintenir le référencement" },
      { type: "", description: "", isSection: false },
      { type: "COLONNES SETUP", description: "", isSection: true },
      { type: "SETUP Enfant", description: "✓ = Adaptation automatique depuis le modèle parent (code, structure)" },
      { type: "MàJ Auto", description: "✓ = Mises à jour automatiques continues (sync, IA)" },
      { type: "SETUP Manuel", description: "Catégorie du contenu à fournir lors de l'installation" },
    ];

    legendData.forEach((item) => {
      const row = legendSheet.addRow({ type: item.type, description: item.description });
      if (item.isSection) {
        row.font = { bold: true };
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "D9E2F3" },
        };
      } else if (typeColors[item.type]) {
        row.getCell("type").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: typeColors[item.type] },
        };
      } else if (setupManuelColors[item.type]) {
        row.getCell("type").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: setupManuelColors[item.type] },
        };
      }
    });

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fonctionnalites-plateforme-saas.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Export Fonctionnalités SaaS
          </h1>
          <p className="text-muted-foreground">
            Tableau complet avec colonnes SETUP Enfant / MàJ Auto / SETUP Manuel
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Structure du fichier</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-medium mb-2">Colonnes principales</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Section / Fonctionnalité / Description / Bénéfice</li>
                <li>• <strong>V / A / CP</strong> — Bénéficiaires directs</li>
                <li>• <strong>SETUP Enfant</strong> — Adapté auto depuis parent</li>
                <li>• <strong>MàJ Auto</strong> — Mises à jour automatiques</li>
                <li>• <strong>SETUP Manuel</strong> — Catégorie contenu à fournir</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Section Détail en bas</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>SEO Local</strong> — Photos, textes, D.A., articles</li>
                <li>• <strong>SEO Global</strong> — Spécialités × 11</li>
                <li>• <strong>Infos pratiques</strong> — Coordonnées, horaires</li>
                <li>• <strong>SEO 6M</strong> — Enrichissements semestriels</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(typeColors).map(([type, color]) => (
              <div
                key={type}
                className="flex items-center gap-2 text-sm px-2 py-1 rounded border"
                style={{ backgroundColor: `#${color}` }}
              >
                <span>{type}</span>
              </div>
            ))}
          </div>

          <Button onClick={generateExcel} size="lg" className="gap-2">
            <Download className="h-5 w-5" />
            Télécharger le fichier Excel
          </Button>
        </div>

        <div className="bg-muted/50 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Feuille 1 :</strong> Fonctionnalités + section DÉTAIL SETUP MANUEL en bas<br />
            <strong>Feuille 2 :</strong> Légende complète des types et catégories
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportFonctionnalites;
