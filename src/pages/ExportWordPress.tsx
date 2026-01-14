import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileSpreadsheet, Settings, BarChart3, Filter } from "lucide-react";
import ExcelJS from "exceljs";

// Types
interface FeatureTask {
  id: string;
  featureId: string;
  featureName: string;
  task: string;
  difficulty: "Facile" | "Moyen" | "Complexe";
  type: string;
  heuresEssentiel: number;
  heuresStandard: number;
  heuresPremium: number;
  heuresSurMesure: number;
}

interface Feature {
  id: string;
  name: string;
  beneficiaire: string;
  type: string;
  inEssentiel: boolean;
  inStandard: boolean;
  inPremium: boolean;
  inSurMesure: boolean;
  comment?: string; // Commentaire explicatif
}

// Comments explicatifs pour les fonctionnalités
const featureComments: Record<string, string> = {
  "F01": "Barre de navigation supérieure adaptative à tous les écrans",
  "F06": "Diaporama automatique des ventes à venir avec images de couverture",
  "F07": "Sélection automatique des lots les plus attractifs via algorithme IA",
  "F09": "Page complète présentant une vente avec tous ses lots et informations",
  "F15": "Lots invendus proposés à prix fixe après la vente aux enchères",
  "F18": "Guide complet pour accompagner les vendeurs dans leur démarche",
  "F19": "Guide pratique expliquant comment participer aux enchères",
  "F20": "Questions fréquentes sur le fonctionnement des enchères",
  "F21": "Dictionnaire des termes techniques des enchères et de l'art",
  "F22": "Page de présentation de l'étude et son histoire",
  "F24": "Historique complet de la maison de ventes et ses records",
  "F25": "Pages dédiées à chaque spécialité (vins, bijoux, art, etc.)",
  "F26": "Présentation des experts associés par domaine de spécialité",
  "F27": "Mise en avant des adjudications remarquables et records",
  "F37": "Notifications personnalisées basées sur les centres d'intérêt via IA",
  "F39": "Consultation et téléchargement des bordereaux d'achat en ligne",
  "F40": "Paiement sécurisé par carte bancaire directement sur le site",
  "F41": "Prise de rendez-vous en ligne pour récupérer les achats",
  "F44": "Recherche intelligente comprenant le langage naturel",
  "F45": "Recommandations de lots basées sur l'historique et les goûts",
  "F46": "Assistant virtuel pour répondre aux questions sur les lots",
  "F47": "Analyse détaillée d'un lot par intelligence artificielle",
  "F48": "Balises meta optimisées pour le référencement naturel",
  "F49": "Plan du site XML pour les moteurs de recherche",
  "F50": "Données structurées pour enrichir les résultats Google",
  "F51": "Section actualités pour le contenu éditorial régulier",
  "F52": "Articles de fond sur les différentes spécialités",
  "F53": "Pages optimisées pour des requêtes de recherche spécifiques",
  "F54": "Stratégie de liens entrants pour améliorer l'autorité du site",
  "F56": "Application installable sur mobile comme une app native",
  "F57": "Alertes push sur mobile pour les nouvelles ventes et enchères",
  "F58": "Consultation des favoris et informations sans connexion internet",
  "F59": "Suivi des visites, comportements et conversions",
  "F60": "Tableau de bord avec statistiques clés de l'activité",
  "F61": "Génération de rapports PDF pour l'analyse",
  "F63": "Interface disponible en plusieurs langues (EN, DE, etc.)",
  "F64": "Affichage des estimations dans différentes devises",
  "F68": "Conformité aux normes d'accessibilité web WCAG 2.1",
  "F71": "Distribution des images via réseau mondial pour la rapidité",
  "F72": "Mise en cache intelligente pour des temps de chargement optimaux",
  "F73": "Chargement différé des images hors écran",
  "F76": "Journées publiques pour faire estimer ses objets gratuitement",
  "F77": "Prise de rendez-vous avec un expert pour une expertise",
  "F78": "Service d'inventaire complet au domicile du client",
  "F79": "Espace vendeur pour suivre ses objets en vente",
  "F80": "Signature électronique du contrat de vente",
  "F81": "Diffusion vidéo en direct des ventes aux enchères",
  "F82": "Inscription aux enchères par téléphone pendant la vente",
  "F83": "Enchères chronométrées avec compte à rebours automatique",
  "F86": "Revue de presse et couverture médiatique de la maison",
  "F92": "Emails automatiques de confirmation, rappels et notifications",
  "F93": "Modèles d'emails personnalisés aux couleurs de la maison",
};

// Maintenance mensuelle par type
const maintenanceHours: Record<string, { essentiel: number; standard: number; premium: number; surMesure: number; description: string }> = {
  "Sync Interenchères": { essentiel: 0, standard: 1, premium: 2, surMesure: 3, description: "Vérification synchronisation lots et ventes" },
  "Supervision IA": { essentiel: 0, standard: 0, premium: 2, surMesure: 4, description: "Contrôle qualité des suggestions et analyses IA" },
  "SEO mensuel": { essentiel: 0, standard: 2, premium: 4, surMesure: 8, description: "Suivi positionnement, ajustements, reporting" },
  "Contenu éditorial": { essentiel: 0, standard: 0, premium: 2, surMesure: 4, description: "Rédaction articles, actualités, newsletters" },
  "Mises à jour WordPress": { essentiel: 1, standard: 1, premium: 2, surMesure: 2, description: "Plugins, thème, sécurité, sauvegardes" },
  "Support utilisateur": { essentiel: 0, standard: 1, premium: 2, surMesure: 4, description: "Assistance email/téléphone, formations" },
  "Analytics & reporting": { essentiel: 0, standard: 1, premium: 2, surMesure: 3, description: "Rapports mensuels, analyses de performance" },
  "Optimisation technique": { essentiel: 0, standard: 0, premium: 1, surMesure: 2, description: "Performance, cache, vitesse de chargement" },
};

// Data
const features: Feature[] = [
  { id: "F01", name: "Header responsive", beneficiaire: "A/V", type: "Auto Sync", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F02", name: "Menu navigation", beneficiaire: "A/V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F03", name: "Footer complet", beneficiaire: "A/V", type: "Auto Sync", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F04", name: "Page d'accueil", beneficiaire: "A/V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F05", name: "Bannière hero", beneficiaire: "A/V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F06", name: "Carrousel ventes", beneficiaire: "A", type: "Auto Sync", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F07", name: "Grille lots vedettes", beneficiaire: "A", type: "Auto IA", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F08", name: "Calendrier ventes", beneficiaire: "A/V", type: "Auto Sync", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F09", name: "Page vente détail", beneficiaire: "A", type: "Auto Sync", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F10", name: "Galerie lots", beneficiaire: "A", type: "Auto Sync", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F11", name: "Fiche lot détaillée", beneficiaire: "A", type: "Auto Sync", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F12", name: "Zoom images HD", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F13", name: "Estimation affichée", beneficiaire: "A", type: "Auto Sync", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F14", name: "Résultats enchères", beneficiaire: "A/V", type: "Auto Sync", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F15", name: "Après-vente lots", beneficiaire: "A", type: "Auto Sync", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F16", name: "Formulaire estimation", beneficiaire: "V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F17", name: "Upload photos", beneficiaire: "V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F18", name: "Guide vendeur", beneficiaire: "V", type: "SEO Natif", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F19", name: "Guide acheteur", beneficiaire: "A", type: "SEO Natif", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F20", name: "FAQ enchères", beneficiaire: "A/V", type: "SEO Natif", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F21", name: "Glossaire termes", beneficiaire: "A/V", type: "SEO Natif", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F22", name: "Page La Maison", beneficiaire: "A/V", type: "SEO 6M", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F23", name: "Équipe & portraits", beneficiaire: "A/V", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F24", name: "Historique maison", beneficiaire: "A/V", type: "SEO 6M", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F25", name: "Page spécialité", beneficiaire: "A/V", type: "SEO 6M", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F26", name: "Expert associé", beneficiaire: "A/V", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F27", name: "Records & highlights", beneficiaire: "A/V", type: "Auto Sync", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F28", name: "Page contact", beneficiaire: "A/V", type: "SEO Natif", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F29", name: "Formulaire contact", beneficiaire: "A/V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F30", name: "Plan d'accès", beneficiaire: "A/V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F31", name: "Horaires & infos", beneficiaire: "A/V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F32", name: "Inscription newsletter", beneficiaire: "A/V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F33", name: "Connexion compte", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F34", name: "Profil utilisateur", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F35", name: "Mes favoris", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F36", name: "Mes ordres d'achat", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F37", name: "Alertes personnalisées", beneficiaire: "A", type: "Auto IA", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F38", name: "Historique achats", beneficiaire: "A", type: "Auto Sync", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F39", name: "Bordereaux en ligne", beneficiaire: "A", type: "Auto Sync", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F40", name: "Paiement en ligne", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F41", name: "RDV enlèvement", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F42", name: "Recherche globale", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F43", name: "Filtres avancés", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F44", name: "Recherche IA", beneficiaire: "A", type: "Auto IA", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F45", name: "Suggestions lots", beneficiaire: "A", type: "Auto IA", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F46", name: "Chat conseiller IA", beneficiaire: "A", type: "Auto IA", inEssentiel: false, inStandard: false, inPremium: false, inSurMesure: true },
  { id: "F47", name: "Analyse lot IA", beneficiaire: "A", type: "Auto IA", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F48", name: "Meta SEO pages", beneficiaire: "CP", type: "SEO Natif", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F49", name: "Sitemap XML", beneficiaire: "CP", type: "SEO Natif", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F50", name: "Schema.org markup", beneficiaire: "CP", type: "SEO Natif", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F51", name: "Blog/Actualités", beneficiaire: "A/V", type: "SEO 6M", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F52", name: "Articles spécialités", beneficiaire: "A/V", type: "SEO 6M", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F53", name: "Landing pages SEO", beneficiaire: "CP", type: "SEO 6M", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F54", name: "Backlinks strategy", beneficiaire: "CP", type: "SEO 6M", inEssentiel: false, inStandard: false, inPremium: false, inSurMesure: true },
  { id: "F55", name: "Responsive mobile", beneficiaire: "A/V", type: "Auto Sync", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F56", name: "PWA installable", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F57", name: "Notifications push", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: false, inSurMesure: true },
  { id: "F58", name: "Mode hors-ligne", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: false, inSurMesure: true },
  { id: "F59", name: "Analytics intégré", beneficiaire: "CP", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F60", name: "Dashboard stats", beneficiaire: "CP", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F61", name: "Rapports PDF", beneficiaire: "CP", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F62", name: "Export données", beneficiaire: "CP", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F63", name: "Multi-langue", beneficiaire: "A/V", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: false, inSurMesure: true },
  { id: "F64", name: "Devise étrangère", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: false, inSurMesure: true },
  { id: "F65", name: "CGV/Mentions légales", beneficiaire: "A/V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F66", name: "Politique cookies", beneficiaire: "A/V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F67", name: "Bandeau RGPD", beneficiaire: "A/V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F68", name: "Accessibilité WCAG", beneficiaire: "A/V", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F69", name: "SSL/HTTPS", beneficiaire: "A/V", type: "Auto Sync", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F70", name: "Sauvegardes auto", beneficiaire: "CP", type: "Auto Sync", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F71", name: "CDN images", beneficiaire: "A/V", type: "Auto Sync", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F72", name: "Cache optimisé", beneficiaire: "A/V", type: "Auto Sync", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F73", name: "Lazy loading", beneficiaire: "A/V", type: "Auto Sync", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F74", name: "Compression images", beneficiaire: "A/V", type: "Auto Sync", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F75", name: "Minification CSS/JS", beneficiaire: "A/V", type: "Auto Sync", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F76", name: "Journées estimation", beneficiaire: "V", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F77", name: "RDV expertise", beneficiaire: "V", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F78", name: "Inventaire domicile", beneficiaire: "V", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F79", name: "Suivi dossier vendeur", beneficiaire: "V", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F80", name: "Contrat en ligne", beneficiaire: "V", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: false, inSurMesure: true },
  { id: "F81", name: "Live streaming", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: false, inSurMesure: true },
  { id: "F82", name: "Enchères téléphone", beneficiaire: "A", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F83", name: "Chrono enchères", beneficiaire: "A", type: "Auto Sync", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F84", name: "Témoignages clients", beneficiaire: "A/V", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F85", name: "Partenaires", beneficiaire: "A/V", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F86", name: "Press/Médias", beneficiaire: "CP", type: "SEO 6M", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F87", name: "Galerie réalisations", beneficiaire: "A/V", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
  { id: "F88", name: "Vidéos intégrées", beneficiaire: "A/V", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F89", name: "Réseaux sociaux", beneficiaire: "A/V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F90", name: "Partage social", beneficiaire: "A/V", type: "Manuel", inEssentiel: true, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F91", name: "Widget Instagram", beneficiaire: "A/V", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F92", name: "Email transactionnel", beneficiaire: "A/V", type: "Manuel", inEssentiel: false, inStandard: true, inPremium: true, inSurMesure: true },
  { id: "F93", name: "Templates emails", beneficiaire: "CP", type: "Manuel", inEssentiel: false, inStandard: false, inPremium: true, inSurMesure: true },
];

const tasks: FeatureTask[] = [];
features.forEach((feature) => {
  const baseTasks = [
    { task: "Maquette & design", difficulty: "Moyen" as const },
    { task: "Intégration HTML/CSS", difficulty: "Facile" as const },
    { task: "Développement fonctionnel", difficulty: "Complexe" as const },
    { task: "Tests & validation", difficulty: "Facile" as const },
  ];

  const isSEO = feature.type.includes("SEO");
  
  baseTasks.forEach((t, idx) => {
    const baseHours = t.difficulty === "Facile" ? 1 : t.difficulty === "Moyen" ? 2 : 4;
    tasks.push({
      id: `${feature.id}-T${idx + 1}`,
      featureId: feature.id,
      featureName: feature.name,
      task: t.task,
      difficulty: t.difficulty,
      type: feature.type,
      heuresEssentiel: feature.inEssentiel ? baseHours : 0,
      heuresStandard: feature.inStandard ? baseHours : 0,
      heuresPremium: feature.inPremium ? Math.round(baseHours * 1.2) : 0,
      heuresSurMesure: feature.inSurMesure ? Math.round(baseHours * 1.5) : 0,
    });
  });

  // Add SEO-specific tasks
  if (isSEO) {
    tasks.push({
      id: `${feature.id}-SEO1`,
      featureId: feature.id,
      featureName: feature.name,
      task: "Optimisation mots-clés",
      difficulty: "Moyen",
      type: feature.type,
      heuresEssentiel: feature.inEssentiel ? 2 : 0,
      heuresStandard: feature.inStandard ? 3 : 0,
      heuresPremium: feature.inPremium ? 4 : 0,
      heuresSurMesure: feature.inSurMesure ? 5 : 0,
    });
    tasks.push({
      id: `${feature.id}-SEO2`,
      featureId: feature.id,
      featureName: feature.name,
      task: "Rédaction contenu SEO",
      difficulty: "Complexe",
      type: feature.type,
      heuresEssentiel: feature.inEssentiel ? 3 : 0,
      heuresStandard: feature.inStandard ? 4 : 0,
      heuresPremium: feature.inPremium ? 6 : 0,
      heuresSurMesure: feature.inSurMesure ? 8 : 0,
    });
  }
});

const typeColors: Record<string, string> = {
  "Auto Sync": "4472C4",
  "Auto IA": "7030A0",
  "SEO Natif": "00B050",
  "SEO 6M": "92D050",
  "Manuel": "808080",
};

const difficultyColors: Record<string, string> = {
  "Facile": "C6EFCE",
  "Moyen": "FFEB9C",
  "Complexe": "FFC7CE",
};

const offerColors = {
  essentiel: { main: "70AD47", light: "E2EFDA" },
  standard: { main: "5B9BD5", light: "DEEBF7" },
  premium: { main: "ED7D31", light: "FCE4D6" },
  surMesure: { main: "7030A0", light: "E4DFEC" },
};

const typeFilters = ["Auto Sync", "Auto IA", "SEO Natif", "SEO 6M", "Manuel"];

export default function ExportWordPress() {
  const [tarifHoraire, setTarifHoraire] = useState<number>(85);
  const [marge, setMarge] = useState<number>(25);
  const [forfaitIA, setForfaitIA] = useState<number>(30);
  const [coutPlugins, setCoutPlugins] = useState<number>(200);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(typeFilters);

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const filteredFeatures = features.filter(f => selectedTypes.includes(f.type));
  const filteredTasks = tasks.filter(t => selectedTypes.includes(t.type));

  const generateExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SVV Simulation WordPress";
    workbook.created = new Date();

    // ============================================
    // SHEET 1: Paramètres
    // ============================================
    const paramsSheet = workbook.addWorksheet("Paramètres");
    paramsSheet.columns = [
      { header: "Paramètre", key: "param", width: 30 },
      { header: "Valeur", key: "value", width: 15 },
      { header: "Unité", key: "unit", width: 15 },
    ];

    paramsSheet.addRow({ param: "Tarif horaire", value: tarifHoraire, unit: "€/heure" });
    paramsSheet.addRow({ param: "Marge commerciale", value: marge, unit: "%" });
    paramsSheet.addRow({ param: "Forfait IA mensuel", value: forfaitIA, unit: "€/mois" });
    paramsSheet.addRow({ param: "Coût plugins annuel", value: coutPlugins, unit: "€/an" });

    paramsSheet.addRow({});
    paramsSheet.addRow({ param: "LÉGENDE TYPES", value: "", unit: "" });
    Object.entries(typeColors).forEach(([type, color]) => {
      const row = paramsSheet.addRow({ param: type, value: "", unit: "" });
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
      row.getCell(1).font = { color: { argb: "FFFFFF" } };
    });

    paramsSheet.addRow({});
    paramsSheet.addRow({ param: "LÉGENDE DIFFICULTÉ", value: "", unit: "" });
    Object.entries(difficultyColors).forEach(([diff, color]) => {
      const row = paramsSheet.addRow({ param: diff, value: "", unit: "" });
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    });

    // Style header
    paramsSheet.getRow(1).font = { bold: true };
    paramsSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
    paramsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };

    // ============================================
    // SHEET 2: Détail WordPress
    // ============================================
    const detailSheet = workbook.addWorksheet("Détail WordPress");
    detailSheet.columns = [
      { header: "ID", key: "id", width: 12 },
      { header: "FeatureID", key: "featureId", width: 10 },
      { header: "Fonctionnalité", key: "featureName", width: 25 },
      { header: "Tâche", key: "task", width: 30 },
      { header: "Difficulté", key: "difficulty", width: 12 },
      { header: "Type", key: "type", width: 12 },
      { header: "H.Ess", key: "heuresEssentiel", width: 8 },
      { header: "H.Std", key: "heuresStandard", width: 8 },
      { header: "H.Pre", key: "heuresPremium", width: 8 },
      { header: "H.Sur", key: "heuresSurMesure", width: 8 },
    ];

    filteredTasks.forEach((task) => {
      const row = detailSheet.addRow({
        id: task.id,
        featureId: task.featureId,
        featureName: task.featureName,
        task: task.task,
        difficulty: task.difficulty,
        type: task.type,
        heuresEssentiel: task.heuresEssentiel,
        heuresStandard: task.heuresStandard,
        heuresPremium: task.heuresPremium,
        heuresSurMesure: task.heuresSurMesure,
      });

      // Color difficulty
      const diffColor = difficultyColors[task.difficulty];
      if (diffColor) {
        row.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: diffColor } };
      }

      // Color type
      const typeColor = typeColors[task.type];
      if (typeColor) {
        row.getCell(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: typeColor } };
        row.getCell(6).font = { color: { argb: "FFFFFF" } };
      }
    });

    // Total row
    const totalRow = detailSheet.addRow({
      id: "TOTAL",
      featureId: "",
      featureName: "",
      task: "",
      difficulty: "",
      type: "",
      heuresEssentiel: { formula: `SUM(G2:G${filteredTasks.length + 1})` },
      heuresStandard: { formula: `SUM(H2:H${filteredTasks.length + 1})` },
      heuresPremium: { formula: `SUM(I2:I${filteredTasks.length + 1})` },
      heuresSurMesure: { formula: `SUM(J2:J${filteredTasks.length + 1})` },
    });
    totalRow.font = { bold: true };
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E1F2" } };

    // Style header
    detailSheet.getRow(1).font = { bold: true };
    detailSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
    detailSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    detailSheet.getColumn(2).hidden = true;

    // ============================================
    // SHEET 3: Synthèse Offres
    // ============================================
    const syntheseSheet = workbook.addWorksheet("Synthèse Offres");
    syntheseSheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Fonctionnalité", key: "name", width: 28 },
      { header: "Bénéf.", key: "beneficiaire", width: 8 },
      { header: "Type", key: "type", width: 12 },
      { header: "ESS", key: "inEssentiel", width: 6 },
      { header: "STD", key: "inStandard", width: 6 },
      { header: "PRE", key: "inPremium", width: 6 },
      { header: "SUR", key: "inSurMesure", width: 6 },
      { header: "H.Web Ess", key: "hWebEss", width: 10 },
      { header: "H.SEO Ess", key: "hSeoEss", width: 10 },
      { header: "H.Web Std", key: "hWebStd", width: 10 },
      { header: "H.SEO Std", key: "hSeoStd", width: 10 },
      { header: "H.Web Pre", key: "hWebPre", width: 10 },
      { header: "H.SEO Pre", key: "hSeoPre", width: 10 },
      { header: "H.Web Sur", key: "hWebSur", width: 10 },
      { header: "H.SEO Sur", key: "hSeoSur", width: 10 },
      { header: "Voir", key: "link", width: 12 },
    ];

    filteredFeatures.forEach((feature, idx) => {
      const rowNum = idx + 2;
      
      const row = syntheseSheet.addRow({
        id: feature.id,
        name: feature.name,
        beneficiaire: feature.beneficiaire,
        type: feature.type,
        inEssentiel: feature.inEssentiel ? "✓" : "✗",
        inStandard: feature.inStandard ? "✓" : "✗",
        inPremium: feature.inPremium ? "✓" : "✗",
        inSurMesure: feature.inSurMesure ? "✓" : "✗",
        hWebEss: "",
        hSeoEss: "",
        hWebStd: "",
        hSeoStd: "",
        hWebPre: "",
        hSeoPre: "",
        hWebSur: "",
        hSeoSur: "",
        link: "Voir détail →",
      });

      // Add comment if exists
      const comment = featureComments[feature.id];
      if (comment) {
        row.getCell(2).note = {
          texts: [{ font: { size: 10, name: 'Calibri' }, text: comment }],
          margins: { insetmode: 'custom', inset: [0.25, 0.25, 0.35, 0.35] }
        };
      }

      // Formulas with IF condition
      row.getCell(9).value = { formula: `IF(E${rowNum}="✓",SUMIFS('Détail WordPress'!G:G,'Détail WordPress'!B:B,"${feature.id}",'Détail WordPress'!F:F,"<>*SEO*"),0)` };
      row.getCell(10).value = { formula: `IF(E${rowNum}="✓",SUMIFS('Détail WordPress'!G:G,'Détail WordPress'!B:B,"${feature.id}",'Détail WordPress'!F:F,"*SEO*"),0)` };
      row.getCell(11).value = { formula: `IF(F${rowNum}="✓",SUMIFS('Détail WordPress'!H:H,'Détail WordPress'!B:B,"${feature.id}",'Détail WordPress'!F:F,"<>*SEO*"),0)` };
      row.getCell(12).value = { formula: `IF(F${rowNum}="✓",SUMIFS('Détail WordPress'!H:H,'Détail WordPress'!B:B,"${feature.id}",'Détail WordPress'!F:F,"*SEO*"),0)` };
      row.getCell(13).value = { formula: `IF(G${rowNum}="✓",SUMIFS('Détail WordPress'!I:I,'Détail WordPress'!B:B,"${feature.id}",'Détail WordPress'!F:F,"<>*SEO*"),0)` };
      row.getCell(14).value = { formula: `IF(G${rowNum}="✓",SUMIFS('Détail WordPress'!I:I,'Détail WordPress'!B:B,"${feature.id}",'Détail WordPress'!F:F,"*SEO*"),0)` };
      row.getCell(15).value = { formula: `IF(H${rowNum}="✓",SUMIFS('Détail WordPress'!J:J,'Détail WordPress'!B:B,"${feature.id}",'Détail WordPress'!F:F,"<>*SEO*"),0)` };
      row.getCell(16).value = { formula: `IF(H${rowNum}="✓",SUMIFS('Détail WordPress'!J:J,'Détail WordPress'!B:B,"${feature.id}",'Détail WordPress'!F:F,"*SEO*"),0)` };

      // Hyperlink to detail
      const detailRowNum = filteredTasks.findIndex(t => t.featureId === feature.id) + 2;
      row.getCell(17).value = {
        text: "Voir détail →",
        hyperlink: `#'Détail WordPress'!A${detailRowNum}`,
      };
      row.getCell(17).font = { color: { argb: "0563C1" }, underline: true };

      // Style type column
      const typeColor = typeColors[feature.type];
      if (typeColor) {
        row.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: typeColor } };
        row.getCell(4).font = { color: { argb: "FFFFFF" } };
      }

      // Style checkbox columns
      [5, 6, 7, 8].forEach((col, i) => {
        const colors = [offerColors.essentiel, offerColors.standard, offerColors.premium, offerColors.surMesure];
        const isActive = row.getCell(col).value === "✓";
        row.getCell(col).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: isActive ? colors[i].main : "D9D9D9" },
        };
        row.getCell(col).font = { color: { argb: isActive ? "FFFFFF" : "808080" }, bold: true };
        row.getCell(col).alignment = { horizontal: "center" };
      });
    });

    // Totals row
    const totalsRow = syntheseSheet.addRow({
      id: "TOTAL",
      name: "",
      beneficiaire: "",
      type: "",
      inEssentiel: { formula: `COUNTIF(E2:E${filteredFeatures.length + 1},"✓")` },
      inStandard: { formula: `COUNTIF(F2:F${filteredFeatures.length + 1},"✓")` },
      inPremium: { formula: `COUNTIF(G2:G${filteredFeatures.length + 1},"✓")` },
      inSurMesure: { formula: `COUNTIF(H2:H${filteredFeatures.length + 1},"✓")` },
      hWebEss: { formula: `SUM(I2:I${filteredFeatures.length + 1})` },
      hSeoEss: { formula: `SUM(J2:J${filteredFeatures.length + 1})` },
      hWebStd: { formula: `SUM(K2:K${filteredFeatures.length + 1})` },
      hSeoStd: { formula: `SUM(L2:L${filteredFeatures.length + 1})` },
      hWebPre: { formula: `SUM(M2:M${filteredFeatures.length + 1})` },
      hSeoPre: { formula: `SUM(N2:N${filteredFeatures.length + 1})` },
      hWebSur: { formula: `SUM(O2:O${filteredFeatures.length + 1})` },
      hSeoSur: { formula: `SUM(P2:P${filteredFeatures.length + 1})` },
      link: "",
    });
    totalsRow.font = { bold: true };
    totalsRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E1F2" } };

    syntheseSheet.getRow(1).font = { bold: true };
    syntheseSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
    syntheseSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };

    // ============================================
    // SHEET 4: Maintenance Mensuelle
    // ============================================
    const maintenanceSheet = workbook.addWorksheet("Maintenance Mensuelle");
    maintenanceSheet.columns = [
      { header: "Type de maintenance", key: "type", width: 28 },
      { header: "Description", key: "description", width: 45 },
      { header: "H.Ess", key: "hEss", width: 10 },
      { header: "H.Std", key: "hStd", width: 10 },
      { header: "H.Pre", key: "hPre", width: 10 },
      { header: "H.Sur", key: "hSur", width: 10 },
      { header: "Coût Ess (€)", key: "cEss", width: 12 },
      { header: "Coût Std (€)", key: "cStd", width: 12 },
      { header: "Coût Pre (€)", key: "cPre", width: 12 },
      { header: "Coût Sur (€)", key: "cSur", width: 12 },
    ];

    let maintRowNum = 2;
    Object.entries(maintenanceHours).forEach(([type, data]) => {
      const row = maintenanceSheet.addRow({
        type: type,
        description: data.description,
        hEss: data.essentiel,
        hStd: data.standard,
        hPre: data.premium,
        hSur: data.surMesure,
        cEss: { formula: `C${maintRowNum}*Paramètres!$B$2` },
        cStd: { formula: `D${maintRowNum}*Paramètres!$B$2` },
        cPre: { formula: `E${maintRowNum}*Paramètres!$B$2` },
        cSur: { formula: `F${maintRowNum}*Paramètres!$B$2` },
      });
      
      [7, 8, 9, 10].forEach(col => {
        row.getCell(col).numFmt = '#,##0.00 €';
      });
      maintRowNum++;
    });

    // Totals row
    const maintTotalRowNum = Object.keys(maintenanceHours).length + 2;
    const maintTotal = maintenanceSheet.addRow({
      type: "TOTAL MENSUEL",
      description: "",
      hEss: { formula: `SUM(C2:C${maintTotalRowNum - 1})` },
      hStd: { formula: `SUM(D2:D${maintTotalRowNum - 1})` },
      hPre: { formula: `SUM(E2:E${maintTotalRowNum - 1})` },
      hSur: { formula: `SUM(F2:F${maintTotalRowNum - 1})` },
      cEss: { formula: `SUM(G2:G${maintTotalRowNum - 1})` },
      cStd: { formula: `SUM(H2:H${maintTotalRowNum - 1})` },
      cPre: { formula: `SUM(I2:I${maintTotalRowNum - 1})` },
      cSur: { formula: `SUM(J2:J${maintTotalRowNum - 1})` },
    });
    maintTotal.font = { bold: true };
    maintTotal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E1F2" } };
    [7, 8, 9, 10].forEach(col => {
      maintTotal.getCell(col).numFmt = '#,##0.00 €';
    });

    // Add IA + plugins row
    const totalRecurRowNum = maintTotalRowNum + 2;
    maintenanceSheet.addRow({});
    const totalRecurRow = maintenanceSheet.addRow({
      type: "COÛT RÉCURRENT TOTAL",
      description: "(Maintenance + Forfait IA + Plugins/12)",
      hEss: "",
      hStd: "",
      hPre: "",
      hSur: "",
      cEss: { formula: `G${maintTotalRowNum}+Paramètres!$B$4+Paramètres!$B$5/12` },
      cStd: { formula: `H${maintTotalRowNum}+Paramètres!$B$4+Paramètres!$B$5/12` },
      cPre: { formula: `I${maintTotalRowNum}+Paramètres!$B$4+Paramètres!$B$5/12` },
      cSur: { formula: `J${maintTotalRowNum}+Paramètres!$B$4+Paramètres!$B$5/12` },
    });
    totalRecurRow.font = { bold: true };
    totalRecurRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC000" } };
    [7, 8, 9, 10].forEach(col => {
      totalRecurRow.getCell(col).numFmt = '#,##0.00 €';
    });

    maintenanceSheet.getRow(1).font = { bold: true };
    maintenanceSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
    maintenanceSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };

    // ============================================
    // SHEET 5: Récapitulatif Commercial
    // ============================================
    const recapSheet = workbook.addWorksheet("Récapitulatif Commercial");
    recapSheet.columns = [
      { header: "Offre", key: "offre", width: 20 },
      { header: "Nb fonctionnalités", key: "nbFonc", width: 18 },
      { header: "Heures Web", key: "hWeb", width: 14 },
      { header: "Heures SEO", key: "hSeo", width: 14 },
      { header: "Total heures", key: "totalH", width: 14 },
      { header: "Coût brut (€)", key: "coutBrut", width: 14 },
      { header: "Marge (%)", key: "marge", width: 12 },
      { header: "Prix Final (€)", key: "prixFinal", width: 14 },
      { header: "Maintenance/mois", key: "maintenance", width: 16 },
      { header: "ROI estimé", key: "roi", width: 14 },
    ];

    const offers = ["Essentiel", "Standard", "Premium", "Sur Mesure"];
    const offerCols = { "Essentiel": "E", "Standard": "F", "Premium": "G", "Sur Mesure": "H" };
    const webCols = { "Essentiel": "I", "Standard": "K", "Premium": "M", "Sur Mesure": "O" };
    const seoCols = { "Essentiel": "J", "Standard": "L", "Premium": "N", "Sur Mesure": "P" };
    const maintCostCols = { "Essentiel": "G", "Standard": "H", "Premium": "I", "Sur Mesure": "J" };
    const colorMap = { "Essentiel": offerColors.essentiel, "Standard": offerColors.standard, "Premium": offerColors.premium, "Sur Mesure": offerColors.surMesure };

    offers.forEach((offre, idx) => {
      const rowNum = idx + 2;
      const row = recapSheet.addRow({
        offre: offre,
        nbFonc: { formula: `'Synthèse Offres'!${offerCols[offre as keyof typeof offerCols]}${filteredFeatures.length + 2}` },
        hWeb: { formula: `'Synthèse Offres'!${webCols[offre as keyof typeof webCols]}${filteredFeatures.length + 2}` },
        hSeo: { formula: `'Synthèse Offres'!${seoCols[offre as keyof typeof seoCols]}${filteredFeatures.length + 2}` },
        totalH: { formula: `C${rowNum}+D${rowNum}` },
        coutBrut: { formula: `E${rowNum}*Paramètres!$B$2` },
        marge: { formula: `Paramètres!$B$3` },
        prixFinal: { formula: `F${rowNum}*(1+G${rowNum}/100)` },
        maintenance: { formula: `'Maintenance Mensuelle'!${maintCostCols[offre as keyof typeof maintCostCols]}${Object.keys(maintenanceHours).length + 4}` },
        roi: { formula: `H${rowNum}/(I${rowNum}*12)` },
      });

      const color = colorMap[offre as keyof typeof colorMap];
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color.main } };
      row.getCell(1).font = { color: { argb: "FFFFFF" }, bold: true };

      [6, 8, 9].forEach(col => {
        row.getCell(col).numFmt = '#,##0.00 €';
      });
      row.getCell(7).numFmt = '0%';
      row.getCell(10).numFmt = '0.00x';
    });

    recapSheet.getRow(1).font = { bold: true };
    recapSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
    recapSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };

    // Chart section
    recapSheet.getCell("A8").value = "GRAPHIQUE COMPARATIF DES OFFRES";
    recapSheet.getCell("A8").font = { bold: true, size: 14 };
    recapSheet.mergeCells("A8:J8");

    recapSheet.getCell("A10").value = "Comparaison visuelle des prix:";
    recapSheet.getCell("A10").font = { bold: true };
    
    offers.forEach((offre, idx) => {
      const row = recapSheet.getRow(11 + idx);
      row.getCell(1).value = offre;
      row.getCell(2).value = { formula: `H${idx + 2}` };
      row.getCell(2).numFmt = '#,##0 €';
      row.getCell(3).value = { formula: `REPT("█",ROUND(H${idx + 2}/MAX($H$2:$H$5)*20,0))` };
      row.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colorMap[offre as keyof typeof colorMap].light } };
    });

    recapSheet.getCell("A17").value = "Comparaison ROI:";
    recapSheet.getCell("A17").font = { bold: true };
    
    offers.forEach((offre, idx) => {
      const row = recapSheet.getRow(18 + idx);
      row.getCell(1).value = offre;
      row.getCell(2).value = { formula: `J${idx + 2}` };
      row.getCell(2).numFmt = '0.00x';
    });

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation-wordpress-${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Simulation WordPress</h1>
          <p className="text-muted-foreground">
            Export Excel avec filtres, maintenance mensuelle, et commentaires explicatifs
          </p>
        </div>

        {/* Paramètres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Paramètres de tarification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tarifHoraire">Tarif horaire (€)</Label>
                <Input
                  id="tarifHoraire"
                  type="number"
                  value={tarifHoraire}
                  onChange={(e) => setTarifHoraire(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marge">Marge commerciale (%)</Label>
                <Input
                  id="marge"
                  type="number"
                  value={marge}
                  onChange={(e) => setMarge(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forfaitIA">Forfait IA mensuel (€)</Label>
                <Input
                  id="forfaitIA"
                  type="number"
                  value={forfaitIA}
                  onChange={(e) => setForfaitIA(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coutPlugins">Coût plugins annuel (€)</Label>
                <Input
                  id="coutPlugins"
                  type="number"
                  value={coutPlugins}
                  onChange={(e) => setCoutPlugins(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtres par type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtrer par type de fonctionnalité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {typeFilters.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                  />
                  <Label 
                    htmlFor={type} 
                    className="cursor-pointer px-2 py-1 rounded text-white text-sm"
                    style={{ backgroundColor: `#${typeColors[type]}` }}
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {filteredFeatures.length} fonctionnalités sélectionnées / {features.length} total
            </p>
          </CardContent>
        </Card>

        {/* Aperçu des feuilles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Contenu de l'export Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">📋 Paramètres</h3>
                <p className="text-sm text-muted-foreground">Tarifs, marge, forfaits modifiables</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">📊 Synthèse Offres</h3>
                <p className="text-sm text-muted-foreground">{filteredFeatures.length} fonctionnalités avec commentaires, formules IF, heures Web/SEO</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">📝 Détail WordPress</h3>
                <p className="text-sm text-muted-foreground">{filteredTasks.length} tâches avec 4 colonnes d'heures</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">🔄 Maintenance Mensuelle</h3>
                <p className="text-sm text-muted-foreground">{Object.keys(maintenanceHours).length} types de maintenance, coûts récurrents</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">💰 Récapitulatif Commercial</h3>
                <p className="text-sm text-muted-foreground">Prix finaux, maintenance, ROI, graphique</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button onClick={generateExcel} size="lg" className="gap-2">
            <Download className="h-5 w-5" />
            Télécharger l'Excel complet
          </Button>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>{filteredFeatures.length} fonctionnalités</span>
          </div>
          <div>•</div>
          <div>{filteredTasks.length} tâches</div>
          <div>•</div>
          <div>5 feuilles Excel</div>
        </div>
      </div>
    </div>
  );
}
