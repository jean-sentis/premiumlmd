import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, Info } from "lucide-react";
import ExcelJS from "exceljs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * EXPORT ADAPTATION - Site Enfant depuis Parent Complet
 * 
 * Basé sur l'Excel utilisateur rectifié du 2026-01-05
 * - Auto Sync / Auto IA : hérités automatiquement (0h adaptation)
 * - SEO Natif / SEO 6M : travail humain (rédaction, validation, photos)
 * - Manuel : travail développeur (configuration, intégration)
 * 
 * Pages spécialités : Essentiel 0, Standard 6, Premium 12, Sur Mesure 20
 */

// Pages spécialités par offre (Essentiel = 0 car site simple sans spécialités)
const SPECIALTY_PAGES = {
  ess: 0,
  std: 6,
  pre: 12,
  sur: 20
};

interface AdaptationTask {
  id: string;
  feature: string;
  task: string;
  taskType: "SEO" | "Dev";
  description: string;
  hoursEss: number;
  hoursStd: number;
  hoursPre: number;
  hoursSur: number;
  category: "Local" | "Contenu" | "Spécialité" | "Technique" | "Validation";
  isPerSpecialty?: boolean;
  comment?: string;
}

// Tâches d'adaptation basées sur l'Excel rectifié
// Seules les lignes NON "Auto Sync" et NON "Auto IA" sont comptabilisées
// Essentiel = site simple 6 pages avec affichage d'un lot vedette des ventes à venir
const adaptationTasks: AdaptationTask[] = [
  // ============ LOCAL : Configuration propre au site enfant ============
  {
    id: "L01",
    feature: "Configuration thème",
    task: "Logo, couleurs, polices",
    taskType: "Dev",
    description: "Paramétrage du thème enfant WordPress",
    hoursEss: 1,
    hoursStd: 2,
    hoursPre: 2,
    hoursSur: 3,
    category: "Local",
    comment: "Installation et configuration initiale du thème enfant"
  },
  {
    id: "L02",
    feature: "Page Contact",
    task: "Coordonnées locales",
    taskType: "SEO",
    description: "Adresse, téléphone, email, horaires",
    hoursEss: 1,
    hoursStd: 2,
    hoursPre: 2,
    hoursSur: 3,
    category: "Local",
    comment: "D'après F28 - Maquette & design SEO Natif"
  },
  {
    id: "L03",
    feature: "Plan d'accès",
    task: "Carte et directions",
    taskType: "Dev",
    description: "Intégration Google Maps",
    hoursEss: 1,
    hoursStd: 2,
    hoursPre: 2,
    hoursSur: 3,
    category: "Local",
    comment: "D'après F30 - Manuel"
  },
  {
    id: "L04",
    feature: "Horaires & infos",
    task: "Mise à jour contenus",
    taskType: "Dev",
    description: "Horaires, infos pratiques locales",
    hoursEss: 1,
    hoursStd: 2,
    hoursPre: 2,
    hoursSur: 3,
    category: "Local",
    comment: "D'après F31 - Manuel"
  },
  {
    id: "L05",
    feature: "CGV/Mentions légales",
    task: "Adaptation juridique",
    taskType: "Dev",
    description: "Mentions légales adaptées à l'entité",
    hoursEss: 1,
    hoursStd: 2,
    hoursPre: 2,
    hoursSur: 3,
    category: "Local",
    comment: "D'après F65 - Manuel"
  },
  {
    id: "L06",
    feature: "Réseaux sociaux",
    task: "Liens comptes locaux",
    taskType: "Dev",
    description: "Configuration liens sociaux",
    hoursEss: 1,
    hoursStd: 2,
    hoursPre: 2,
    hoursSur: 3,
    category: "Local",
    comment: "D'après F89 - Manuel"
  },

  // ============ CONTENU : Rédaction propre à la maison ============
  {
    id: "C01",
    feature: "Page La Maison",
    task: "Présentation maison",
    taskType: "SEO",
    description: "Rédaction histoire, valeurs, positionnement",
    hoursEss: 3,
    hoursStd: 6,
    hoursPre: 8,
    hoursSur: 11,
    category: "Contenu",
    comment: "D'après F22 - SEO 6M (H.SEO)"
  },
  {
    id: "C02",
    feature: "Équipe & portraits",
    task: "Photos et biographies",
    taskType: "SEO",
    description: "Shooting, rédaction bios équipe",
    hoursEss: 4,
    hoursStd: 8,
    hoursPre: 9,
    hoursSur: 13,
    category: "Contenu",
    comment: "D'après F23 - Manuel (travail photo/contenu)"
  },
  {
    id: "C03",
    feature: "Historique maison",
    task: "Chronologie et anecdotes",
    taskType: "SEO",
    description: "Recherche historique, iconographie",
    hoursEss: 2,
    hoursStd: 4,
    hoursPre: 11,
    hoursSur: 15,
    category: "Contenu",
    comment: "D'après F24 - SEO 6M"
  },
  {
    id: "C04",
    feature: "Témoignages clients",
    task: "Collecte et validation",
    taskType: "SEO",
    description: "Sollicitation, rédaction témoignages",
    hoursEss: 0,
    hoursStd: 1,
    hoursPre: 1,
    hoursSur: 2,
    category: "Contenu",
    comment: "D'après F84-T4 - SEO 6M"
  },
  {
    id: "C05",
    feature: "Records & highlights",
    task: "Sélection ventes emblématiques",
    taskType: "SEO",
    description: "Choix records, descriptions",
    hoursEss: 0,
    hoursStd: 0,
    hoursPre: 9,
    hoursSur: 13,
    category: "Contenu",
    comment: "D'après F27 - Auto Sync mais sélection manuelle"
  },
  {
    id: "C06",
    feature: "Galerie réalisations",
    task: "Photos et légendes",
    taskType: "SEO",
    description: "Sélection photos HD, légendes",
    hoursEss: 0,
    hoursStd: 0,
    hoursPre: 1,
    hoursSur: 2,
    category: "Contenu",
    comment: "D'après F87-T4 - SEO Natif"
  },
  {
    id: "C07",
    feature: "Partenaires",
    task: "Logos et descriptions",
    taskType: "SEO",
    description: "Collecte logos, liens partenaires",
    hoursEss: 0,
    hoursStd: 0,
    hoursPre: 2,
    hoursSur: 4,
    category: "Contenu",
    comment: "D'après F85 - SEO Natif"
  },
  {
    id: "C08",
    feature: "Press/Médias",
    task: "Revue de presse",
    taskType: "SEO",
    description: "Collecte articles, mise en page",
    hoursEss: 0,
    hoursStd: 0,
    hoursPre: 11,
    hoursSur: 15,
    category: "Contenu",
    comment: "D'après F86 - SEO 6M"
  },
  {
    id: "C09",
    feature: "Vidéos intégrées",
    task: "Sélection et intégration",
    taskType: "SEO",
    description: "Choix vidéos, intégration YouTube/Vimeo",
    hoursEss: 0,
    hoursStd: 1,
    hoursPre: 1,
    hoursSur: 2,
    category: "Contenu",
    comment: "D'après F88-T4 - SEO Natif"
  },

  // ============ SPÉCIALITÉ : × nombre de pages spécialités ============
  {
    id: "S01",
    feature: "Page spécialité",
    task: "Texte de présentation",
    taskType: "SEO",
    description: "Rédaction expertise, argumentaire par spécialité",
    hoursEss: 0,
    hoursStd: 1.5,
    hoursPre: 1.8,
    hoursSur: 2.5,
    category: "Spécialité",
    isPerSpecialty: true,
    comment: "D'après F25 - SEO Natif (H.SEO/nbPages)"
  },
  {
    id: "S02",
    feature: "Expert associé",
    task: "Fiche expert spécialité",
    taskType: "SEO",
    description: "Bio expert, photo, spécialisation",
    hoursEss: 0,
    hoursStd: 0,
    hoursPre: 0.25,
    hoursSur: 0.35,
    category: "Spécialité",
    isPerSpecialty: true,
    comment: "D'après F26 - Manuel mais contenu humain"
  },

  // ============ TECHNIQUE : Dev nécessaire pour l'adaptation ============
  {
    id: "T01",
    feature: "Menu navigation",
    task: "Structure et labels",
    taskType: "Dev",
    description: "Adaptation menu selon offre",
    hoursEss: 3,
    hoursStd: 8,
    hoursPre: 9,
    hoursSur: 13,
    category: "Technique",
    comment: "D'après F02 - Manuel"
  },
  {
    id: "T02",
    feature: "Page d'accueil",
    task: "Personnalisation layout",
    taskType: "Dev",
    description: "Adaptation mise en page accueil",
    hoursEss: 4,
    hoursStd: 7,
    hoursPre: 8,
    hoursSur: 11,
    category: "Technique",
    comment: "D'après F04 - Manuel (H.Web)"
  },
  {
    id: "T03",
    feature: "Bannière hero",
    task: "Visuel et accroche",
    taskType: "Dev",
    description: "Intégration visuel, animation",
    hoursEss: 2,
    hoursStd: 7,
    hoursPre: 8,
    hoursSur: 11,
    category: "Technique",
    comment: "D'après F05 - Manuel"
  },
  {
    id: "T04",
    feature: "Formulaire estimation",
    task: "Configuration emails",
    taskType: "Dev",
    description: "Destinataires, notifications",
    hoursEss: 2,
    hoursStd: 7,
    hoursPre: 8,
    hoursSur: 11,
    category: "Technique",
    comment: "D'après F16 - Manuel"
  },
  {
    id: "T05",
    feature: "Formulaire contact",
    task: "Configuration emails",
    taskType: "Dev",
    description: "Paramétrage destinataires",
    hoursEss: 2,
    hoursStd: 7,
    hoursPre: 8,
    hoursSur: 11,
    category: "Technique",
    comment: "D'après F29 - Manuel"
  },
  {
    id: "T06",
    feature: "Newsletter",
    task: "Connexion service email",
    taskType: "Dev",
    description: "Intégration Mailchimp/Sendinblue",
    hoursEss: 0,
    hoursStd: 7,
    hoursPre: 8,
    hoursSur: 11,
    category: "Technique",
    comment: "D'après F32 - Manuel"
  },
  {
    id: "T07",
    feature: "Analytics",
    task: "Configuration tracking",
    taskType: "Dev",
    description: "GA4, GTM, objectifs",
    hoursEss: 2,
    hoursStd: 8,
    hoursPre: 9,
    hoursSur: 13,
    category: "Technique",
    comment: "D'après F59 - Manuel"
  },
  {
    id: "T08",
    feature: "Meta SEO pages",
    task: "Balises et OG",
    taskType: "Dev",
    description: "Titles, descriptions, Open Graph",
    hoursEss: 2,
    hoursStd: 7,
    hoursPre: 8,
    hoursSur: 11,
    category: "Technique",
    comment: "D'après F48 - Manuel (H.Web)"
  },
  {
    id: "T09",
    feature: "Bandeau RGPD",
    task: "Configuration cookies",
    taskType: "Dev",
    description: "Paramétrage consentement",
    hoursEss: 1,
    hoursStd: 7,
    hoursPre: 8,
    hoursSur: 11,
    category: "Technique",
    comment: "D'après F67 - Manuel"
  },
  {
    id: "T10",
    feature: "Iframe Interenchères",
    task: "Intégration iframe ventes",
    taskType: "Dev",
    description: "Iframe calendrier/ventes (Essentiel uniquement)",
    hoursEss: 4,
    hoursStd: 0,
    hoursPre: 0,
    hoursSur: 0,
    category: "Technique",
    comment: "Spécifique à l'offre Essentiel"
  },

  // ============ VALIDATION : Tests et recette client ============
  {
    id: "V01",
    feature: "Tests Header",
    task: "Validation responsive",
    taskType: "SEO",
    description: "Tests manuels navigation",
    hoursEss: 0.5,
    hoursStd: 1,
    hoursPre: 1,
    hoursSur: 2,
    category: "Validation",
    comment: "D'après F01-T4 - Manuel (validation = SEO)"
  },
  {
    id: "V02",
    feature: "Tests Calendrier",
    task: "Validation synchro",
    taskType: "SEO",
    description: "Tests affichage ventes",
    hoursEss: 0.5,
    hoursStd: 1,
    hoursPre: 1,
    hoursSur: 2,
    category: "Validation",
    comment: "D'après F08-T4 - Manuel"
  },
  {
    id: "V03",
    feature: "Tests Pages ventes",
    task: "Validation lots",
    taskType: "SEO",
    description: "Tests détail vente, lots, galerie",
    hoursEss: 0,
    hoursStd: 0,
    hoursPre: 3,
    hoursSur: 6,
    category: "Validation",
    comment: "D'après F09-T4 à F11-T4 - Manuel"
  },
  {
    id: "V04",
    feature: "Tests Formulaires",
    task: "Validation envois",
    taskType: "SEO",
    description: "Tests estimation, contact, newsletter",
    hoursEss: 1,
    hoursStd: 3,
    hoursPre: 3,
    hoursSur: 6,
    category: "Validation",
    comment: "Cumul F16-T4, F17-T4, F29-T4..."
  },
  {
    id: "V05",
    feature: "Tests Compte utilisateur",
    task: "Validation espace client",
    taskType: "SEO",
    description: "Tests connexion, favoris, ordres",
    hoursEss: 0,
    hoursStd: 0,
    hoursPre: 4,
    hoursSur: 8,
    category: "Validation",
    comment: "Cumul F33-T4 à F36-T4..."
  },
  {
    id: "V06",
    feature: "Recette client",
    task: "Présentation et validation",
    taskType: "SEO",
    description: "Allers-retours corrections",
    hoursEss: 2,
    hoursStd: 4,
    hoursPre: 8,
    hoursSur: 12,
    category: "Validation",
    comment: "Temps de recette avec le client"
  },
  {
    id: "V07",
    feature: "Formation",
    task: "Prise en main CMS",
    taskType: "SEO",
    description: "Formation équipe client",
    hoursEss: 1,
    hoursStd: 2,
    hoursPre: 4,
    hoursSur: 6,
    category: "Validation",
    comment: "Formation sur WordPress"
  }
];

// Maintenance mensuelle spécifique site enfant
interface MaintenanceTask {
  id: string;
  type: string;
  description: string;
  hoursEss: number;
  hoursStd: number;
  hoursPre: number;
  hoursSur: number;
  isChildSpecific: boolean;
  comment?: string;
}

const maintenanceTasks: MaintenanceTask[] = [
  {
    id: "M01",
    type: "Sync Interenchères",
    description: "Vérification synchronisation lots (héritée du parent)",
    hoursEss: 0,
    hoursStd: 0,
    hoursPre: 0,
    hoursSur: 0,
    isChildSpecific: false,
    comment: "Automatique via le parent"
  },
  {
    id: "M02",
    type: "Supervision IA",
    description: "Contrôle qualité suggestions (héritée du parent)",
    hoursEss: 0,
    hoursStd: 0,
    hoursPre: 0,
    hoursSur: 0,
    isChildSpecific: false,
    comment: "Automatique via le parent"
  },
  {
    id: "M03",
    type: "SEO local mensuel",
    description: "Suivi positionnement mots-clés locaux",
    hoursEss: 0.5,
    hoursStd: 1,
    hoursPre: 2,
    hoursSur: 3,
    isChildSpecific: true,
    comment: "Spécifique au territoire de l'enfant"
  },
  {
    id: "M04",
    type: "Contenu éditorial",
    description: "Actualités locales, événements maison",
    hoursEss: 0,
    hoursStd: 0,
    hoursPre: 2,
    hoursSur: 4,
    isChildSpecific: true,
    comment: "Articles spécifiques à la maison"
  },
  {
    id: "M05",
    type: "Mises à jour WordPress",
    description: "Plugins, thème enfant, sécurité",
    hoursEss: 0.5,
    hoursStd: 0.5,
    hoursPre: 1,
    hoursSur: 1,
    isChildSpecific: true,
    comment: "Maintenance thème enfant uniquement"
  },
  {
    id: "M06",
    type: "Support utilisateur",
    description: "Assistance équipe locale",
    hoursEss: 0.5,
    hoursStd: 0.5,
    hoursPre: 1,
    hoursSur: 2,
    isChildSpecific: true,
    comment: "Support spécifique au site enfant"
  },
  {
    id: "M07",
    type: "Analytics local",
    description: "Rapports mensuels trafic local",
    hoursEss: 0,
    hoursStd: 0.5,
    hoursPre: 1,
    hoursSur: 2,
    isChildSpecific: true,
    comment: "Analyses spécifiques au territoire"
  },
  {
    id: "M08",
    type: "Témoignages & avis",
    description: "Collecte nouveaux témoignages",
    hoursEss: 0,
    hoursStd: 0,
    hoursPre: 1,
    hoursSur: 2,
    isChildSpecific: true,
    comment: "Enrichissement contenu local"
  },
  {
    id: "M09",
    type: "Mise à jour équipe",
    description: "Nouveaux arrivants, départs, photos",
    hoursEss: 0,
    hoursStd: 0,
    hoursPre: 0.5,
    hoursSur: 1,
    isChildSpecific: true,
    comment: "Actualisation section équipe"
  }
];

// Couleurs
const categoryColors: Record<string, { bg: string; text: string }> = {
  "Local": { bg: "FFE4CC", text: "8B4513" },
  "Contenu": { bg: "E8F5E9", text: "2E7D32" },
  "Spécialité": { bg: "E3F2FD", text: "1565C0" },
  "Technique": { bg: "FFF3E0", text: "E65100" },
  "Validation": { bg: "F3E5F5", text: "7B1FA2" }
};

const taskTypeColors: Record<string, { bg: string; text: string }> = {
  "SEO": { bg: "E8F5E9", text: "2E7D32" },
  "Dev": { bg: "FFEBEE", text: "C62828" }
};

const ExportAdaptation = () => {
  const [tarifHoraire, setTarifHoraire] = useState(80);
  const [marge, setMarge] = useState(10);
  const [forfaitIA, setForfaitIA] = useState(30);
  const [coutPlugins, setCoutPlugins] = useState(200);
  const [isGenerating, setIsGenerating] = useState(false);

  const calculateHours = (task: AdaptationTask, offer: "ess" | "std" | "pre" | "sur"): number => {
    const baseHours = offer === "ess" ? task.hoursEss : offer === "std" ? task.hoursStd : offer === "pre" ? task.hoursPre : task.hoursSur;
    if (task.isPerSpecialty) {
      return baseHours * SPECIALTY_PAGES[offer];
    }
    return baseHours;
  };

  const calculateTotals = () => {
    const totals = {
      ess: { seo: 0, dev: 0, total: 0 },
      std: { seo: 0, dev: 0, total: 0 },
      pre: { seo: 0, dev: 0, total: 0 },
      sur: { seo: 0, dev: 0, total: 0 }
    };

    adaptationTasks.forEach(task => {
      (["ess", "std", "pre", "sur"] as const).forEach(offer => {
        const hours = calculateHours(task, offer);
        if (task.taskType === "SEO") {
          totals[offer].seo += hours;
        } else {
          totals[offer].dev += hours;
        }
        totals[offer].total += hours;
      });
    });

    return totals;
  };

  const calculateMaintenanceTotals = () => {
    const totals = { ess: 0, std: 0, pre: 0, sur: 0 };
    maintenanceTasks.forEach(task => {
      totals.ess += task.hoursEss;
      totals.std += task.hoursStd;
      totals.pre += task.hoursPre;
      totals.sur += task.hoursSur;
    });
    return totals;
  };

  const totals = calculateTotals();
  const maintenanceTotals = calculateMaintenanceTotals();

  const generateExcel = async () => {
    setIsGenerating(true);
    try {
      const workbook = new ExcelJS.Workbook();
      
      // ========== ONGLET 1: Paramètres ==========
      const paramsSheet = workbook.addWorksheet("Paramètres");
      
      paramsSheet.columns = [
        { header: "Paramètre", key: "param", width: 25 },
        { header: "Valeur", key: "value", width: 15 },
        { header: "Unité", key: "unit", width: 15 }
      ];

      paramsSheet.addRows([
        { param: "Tarif horaire", value: tarifHoraire, unit: "€/heure" },
        { param: "Marge commerciale", value: marge / 100, unit: "%" },
        { param: "Forfait IA mensuel", value: forfaitIA, unit: "€/mois" },
        { param: "Coût plugins annuel", value: coutPlugins, unit: "€/an" },
        { param: "", value: "", unit: "" },
        { param: "PAGES SPÉCIALITÉS", value: "", unit: "" },
        { param: "Essentiel", value: SPECIALTY_PAGES.ess, unit: "pages (iframe)" },
        { param: "Standard", value: SPECIALTY_PAGES.std, unit: "pages" },
        { param: "Premium", value: SPECIALTY_PAGES.pre, unit: "pages" },
        { param: "Sur Mesure", value: SPECIALTY_PAGES.sur, unit: "pages" },
        { param: "", value: "", unit: "" },
        { param: "LÉGENDE CATÉGORIES", value: "", unit: "" },
        { param: "Local", value: "Configuration propre au site", unit: "" },
        { param: "Contenu", value: "Rédaction propre à la maison", unit: "" },
        { param: "Spécialité", value: "×N pages selon offre", unit: "" },
        { param: "Technique", value: "Développement adaptation", unit: "" },
        { param: "Validation", value: "Tests et recette client", unit: "" },
        { param: "", value: "", unit: "" },
        { param: "LÉGENDE TYPES", value: "", unit: "" },
        { param: "SEO", value: "Travail humain non-dev", unit: "" },
        { param: "Dev", value: "Travail développeur", unit: "" }
      ]);

      paramsSheet.getCell("B2").numFmt = "0%";
      
      const legendRows = [13, 14, 15, 16, 17];
      const legendCategories = ["Local", "Contenu", "Spécialité", "Technique", "Validation"];
      legendRows.forEach((row, i) => {
        const cell = paramsSheet.getCell(`A${row}`);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: categoryColors[legendCategories[i]].bg }
        };
      });

      paramsSheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1A365D" } };
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
      });

      // ========== ONGLET 2: Détail Adaptation ==========
      const detailSheet = workbook.addWorksheet("Détail Adaptation");
      
      detailSheet.columns = [
        { header: "ID", key: "id", width: 8 },
        { header: "Fonctionnalité", key: "feature", width: 22 },
        { header: "Tâche", key: "task", width: 25 },
        { header: "Type", key: "taskType", width: 8 },
        { header: "Catégorie", key: "category", width: 12 },
        { header: "Description", key: "description", width: 40 },
        { header: "×N", key: "multiplier", width: 6 },
        { header: "H.Ess", key: "hoursEss", width: 10 },
        { header: "H.Std", key: "hoursStd", width: 10 },
        { header: "H.Pre", key: "hoursPre", width: 10 },
        { header: "H.Sur", key: "hoursSur", width: 10 }
      ];

      adaptationTasks.forEach(task => {
        const row = detailSheet.addRow({
          id: task.id,
          feature: task.feature,
          task: task.task,
          taskType: task.taskType,
          category: task.category,
          description: task.description,
          multiplier: task.isPerSpecialty ? "×N" : "",
          hoursEss: calculateHours(task, "ess"),
          hoursStd: calculateHours(task, "std"),
          hoursPre: calculateHours(task, "pre"),
          hoursSur: calculateHours(task, "sur")
        });

        // Commentaire explicatif
        if (task.comment) {
          row.getCell("feature").note = task.comment;
        }

        const catColor = categoryColors[task.category];
        row.getCell("category").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: catColor.bg }
        };

        const typeColor = taskTypeColors[task.taskType];
        row.getCell("taskType").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: typeColor.bg }
        };

        if (task.isPerSpecialty) {
          row.getCell("multiplier").note = `Multiplié par ${SPECIALTY_PAGES.ess} (Ess), ${SPECIALTY_PAGES.std} (Std), ${SPECIALTY_PAGES.pre} (Pre), ${SPECIALTY_PAGES.sur} (Sur)`;
          row.getCell("multiplier").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF9C4" }
          };
        }
      });

      // Ligne totaux
      const totalDetailRow = detailSheet.addRow({
        id: "",
        feature: "TOTAL",
        task: "",
        taskType: "",
        category: "",
        description: "",
        multiplier: "",
        hoursEss: totals.ess.total,
        hoursStd: totals.std.total,
        hoursPre: totals.pre.total,
        hoursSur: totals.sur.total
      });
      totalDetailRow.font = { bold: true };
      totalDetailRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1A365D" } };
      totalDetailRow.font = { bold: true, color: { argb: "FFFFFF" } };

      detailSheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1A365D" } };
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
      });

      // ========== ONGLET 3: Synthèse Adaptation ==========
      const syntheseSheet = workbook.addWorksheet("Synthèse Adaptation");
      
      syntheseSheet.columns = [
        { header: "Catégorie", key: "category", width: 15 },
        { header: "H.SEO Ess", key: "seoEss", width: 12 },
        { header: "H.Dev Ess", key: "devEss", width: 12 },
        { header: "Total Ess", key: "totalEss", width: 10 },
        { header: "H.SEO Std", key: "seoStd", width: 12 },
        { header: "H.Dev Std", key: "devStd", width: 12 },
        { header: "Total Std", key: "totalStd", width: 10 },
        { header: "H.SEO Pre", key: "seoPre", width: 12 },
        { header: "H.Dev Pre", key: "devPre", width: 12 },
        { header: "Total Pre", key: "totalPre", width: 10 },
        { header: "H.SEO Sur", key: "seoSur", width: 12 },
        { header: "H.Dev Sur", key: "devSur", width: 12 },
        { header: "Total Sur", key: "totalSur", width: 10 }
      ];

      const categories = ["Local", "Contenu", "Spécialité", "Technique", "Validation"] as const;
      
      categories.forEach(cat => {
        const catTasks = adaptationTasks.filter(t => t.category === cat);
        const row: Record<string, string | number> = { category: cat };
        
        (["ess", "std", "pre", "sur"] as const).forEach(offer => {
          const suffix = offer === "ess" ? "Ess" : offer === "std" ? "Std" : offer === "pre" ? "Pre" : "Sur";
          let seo = 0, dev = 0;
          catTasks.forEach(task => {
            const hours = calculateHours(task, offer);
            if (task.taskType === "SEO") seo += hours;
            else dev += hours;
          });
          row[`seo${suffix}`] = seo;
          row[`dev${suffix}`] = dev;
          row[`total${suffix}`] = seo + dev;
        });

        const excelRow = syntheseSheet.addRow(row);
        excelRow.getCell("category").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: categoryColors[cat].bg }
        };
      });

      const totalRow = syntheseSheet.addRow({
        category: "TOTAL",
        seoEss: totals.ess.seo,
        devEss: totals.ess.dev,
        totalEss: totals.ess.total,
        seoStd: totals.std.seo,
        devStd: totals.std.dev,
        totalStd: totals.std.total,
        seoPre: totals.pre.seo,
        devPre: totals.pre.dev,
        totalPre: totals.pre.total,
        seoSur: totals.sur.seo,
        devSur: totals.sur.dev,
        totalSur: totals.sur.total
      });
      totalRow.font = { bold: true };
      totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1A365D" } };
      totalRow.font = { bold: true, color: { argb: "FFFFFF" } };

      syntheseSheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1A365D" } };
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
      });

      // ========== ONGLET 4: Maintenance Mensuelle Enfant ==========
      const maintenanceSheet = workbook.addWorksheet("Maintenance Enfant");
      
      maintenanceSheet.columns = [
        { header: "Type", key: "type", width: 25 },
        { header: "Description", key: "description", width: 45 },
        { header: "Enfant?", key: "isChild", width: 10 },
        { header: "H.Ess", key: "hoursEss", width: 10 },
        { header: "H.Std", key: "hoursStd", width: 10 },
        { header: "H.Pre", key: "hoursPre", width: 10 },
        { header: "H.Sur", key: "hoursSur", width: 10 },
        { header: "Coût Ess (€)", key: "costEss", width: 12 },
        { header: "Coût Std (€)", key: "costStd", width: 12 },
        { header: "Coût Pre (€)", key: "costPre", width: 12 },
        { header: "Coût Sur (€)", key: "costSur", width: 12 }
      ];

      maintenanceTasks.forEach(task => {
        const row = maintenanceSheet.addRow({
          type: task.type,
          description: task.description,
          isChild: task.isChildSpecific ? "✓" : "Parent",
          hoursEss: task.hoursEss,
          hoursStd: task.hoursStd,
          hoursPre: task.hoursPre,
          hoursSur: task.hoursSur,
          costEss: task.hoursEss * tarifHoraire,
          costStd: task.hoursStd * tarifHoraire,
          costPre: task.hoursPre * tarifHoraire,
          costSur: task.hoursSur * tarifHoraire
        });

        if (task.comment) {
          row.getCell("type").note = task.comment;
        }

        if (!task.isChildSpecific) {
          row.getCell("isChild").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "E3F2FD" }
          };
        } else {
          row.getCell("isChild").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "E8F5E9" }
          };
        }

        row.getCell("costEss").numFmt = '#,##0 €';
        row.getCell("costStd").numFmt = '#,##0 €';
        row.getCell("costPre").numFmt = '#,##0 €';
        row.getCell("costSur").numFmt = '#,##0 €';
      });

      // Totaux maintenance
      const maintenanceTotalRow = maintenanceSheet.addRow({
        type: "TOTAL HEURES",
        description: "",
        isChild: "",
        hoursEss: maintenanceTotals.ess,
        hoursStd: maintenanceTotals.std,
        hoursPre: maintenanceTotals.pre,
        hoursSur: maintenanceTotals.sur,
        costEss: maintenanceTotals.ess * tarifHoraire,
        costStd: maintenanceTotals.std * tarifHoraire,
        costPre: maintenanceTotals.pre * tarifHoraire,
        costSur: maintenanceTotals.sur * tarifHoraire
      });
      maintenanceTotalRow.font = { bold: true };
      maintenanceTotalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1A365D" } };
      maintenanceTotalRow.font = { bold: true, color: { argb: "FFFFFF" } };

      // Coût récurrent total
      maintenanceSheet.addRow({});
      const recurringRow = maintenanceSheet.addRow({
        type: "COÛT RÉCURRENT TOTAL",
        description: "(Maintenance + Forfait IA + Plugins/12)",
        isChild: "",
        hoursEss: "",
        hoursStd: "",
        hoursPre: "",
        hoursSur: "",
        costEss: maintenanceTotals.ess * tarifHoraire + forfaitIA + coutPlugins / 12,
        costStd: maintenanceTotals.std * tarifHoraire + forfaitIA + coutPlugins / 12,
        costPre: maintenanceTotals.pre * tarifHoraire + forfaitIA + coutPlugins / 12,
        costSur: maintenanceTotals.sur * tarifHoraire + forfaitIA + coutPlugins / 12
      });
      recurringRow.font = { bold: true };
      recurringRow.getCell("costEss").numFmt = '#,##0 €';
      recurringRow.getCell("costStd").numFmt = '#,##0 €';
      recurringRow.getCell("costPre").numFmt = '#,##0 €';
      recurringRow.getCell("costSur").numFmt = '#,##0 €';

      maintenanceSheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1A365D" } };
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
      });

      // ========== ONGLET 5: Récapitulatif Commercial ==========
      const commercialSheet = workbook.addWorksheet("Récapitulatif Commercial");
      
      commercialSheet.columns = [
        { header: "Offre", key: "offer", width: 15 },
        { header: "H. SEO", key: "hoursSEO", width: 12 },
        { header: "H. Dev", key: "hoursDev", width: 12 },
        { header: "Total H.", key: "totalHours", width: 12 },
        { header: "Coût HT", key: "costHT", width: 15 },
        { header: "Marge", key: "margin", width: 12 },
        { header: "Prix Vente HT", key: "priceHT", width: 15 },
        { header: "Ratio SEO/Dev", key: "ratio", width: 12 }
      ];

      const offers = [
        { name: "Essentiel", data: totals.ess },
        { name: "Standard", data: totals.std },
        { name: "Premium", data: totals.pre },
        { name: "Sur Mesure", data: totals.sur }
      ];

      offers.forEach(offer => {
        const costHT = offer.data.total * tarifHoraire;
        const marginAmount = costHT * (marge / 100);
        const priceHT = costHT + marginAmount;
        const ratio = offer.data.dev > 0 ? (offer.data.seo / offer.data.dev).toFixed(1) : "∞";

        const row = commercialSheet.addRow({
          offer: offer.name,
          hoursSEO: offer.data.seo,
          hoursDev: offer.data.dev,
          totalHours: offer.data.total,
          costHT: costHT,
          margin: marginAmount,
          priceHT: priceHT,
          ratio: `${ratio}:1`
        });

        row.getCell("costHT").numFmt = '#,##0 €';
        row.getCell("margin").numFmt = '#,##0 €';
        row.getCell("priceHT").numFmt = '#,##0 €';
      });

      commercialSheet.addRow({});
      commercialSheet.addRow({ offer: "NOTES" });
      commercialSheet.addRow({ offer: "• Heures SEO = Travail humain non-dev (rédaction, photos, validation)" });
      commercialSheet.addRow({ offer: "• Heures Dev = Travail développeur (configuration, intégration)" });
      commercialSheet.addRow({ offer: `• Spécialités : Ess ${SPECIALTY_PAGES.ess}, Std ${SPECIALTY_PAGES.std}, Pre ${SPECIALTY_PAGES.pre}, Sur ${SPECIALTY_PAGES.sur} pages` });
      commercialSheet.addRow({ offer: "• Ratio élevé = plus de contenu humain que de développement" });
      commercialSheet.addRow({ offer: "• Essentiel = site simple 6 pages avec iframe Interenchères" });

      commercialSheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1A365D" } };
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
      });

      // ========== ONGLET 6: Comparaison Parent vs Enfant ==========
      const comparisonSheet = workbook.addWorksheet("Comparaison");
      
      comparisonSheet.columns = [
        { header: "Métrique", key: "metric", width: 40 },
        { header: "Essentiel", key: "ess", width: 15 },
        { header: "Standard", key: "std", width: 15 },
        { header: "Premium", key: "pre", width: 15 },
        { header: "Sur Mesure", key: "sur", width: 15 }
      ];

      // Heures parent from-scratch (depuis Excel utilisateur)
      const parentHours = { ess: 150, std: 564, pre: 915, sur: 1417 };

      comparisonSheet.addRows([
        { metric: "Heures création from-scratch (parent)", ess: parentHours.ess, std: parentHours.std, pre: parentHours.pre, sur: parentHours.sur },
        { metric: "Heures adaptation (enfant)", ess: totals.ess.total, std: totals.std.total, pre: totals.pre.total, sur: totals.sur.total },
        { metric: "", ess: "", std: "", pre: "", sur: "" },
        { 
          metric: "Économie en heures", 
          ess: parentHours.ess - totals.ess.total,
          std: parentHours.std - totals.std.total, 
          pre: parentHours.pre - totals.pre.total, 
          sur: parentHours.sur - totals.sur.total 
        },
        { 
          metric: "% d'économie", 
          ess: ((parentHours.ess - totals.ess.total) / parentHours.ess * 100).toFixed(0) + "%",
          std: ((parentHours.std - totals.std.total) / parentHours.std * 100).toFixed(0) + "%", 
          pre: ((parentHours.pre - totals.pre.total) / parentHours.pre * 100).toFixed(0) + "%", 
          sur: ((parentHours.sur - totals.sur.total) / parentHours.sur * 100).toFixed(0) + "%" 
        },
        { metric: "", ess: "", std: "", pre: "", sur: "" },
        { 
          metric: "Part SEO dans adaptation", 
          ess: totals.ess.total > 0 ? (totals.ess.seo / totals.ess.total * 100).toFixed(0) + "%" : "0%",
          std: (totals.std.seo / totals.std.total * 100).toFixed(0) + "%", 
          pre: (totals.pre.seo / totals.pre.total * 100).toFixed(0) + "%", 
          sur: (totals.sur.seo / totals.sur.total * 100).toFixed(0) + "%" 
        },
        { 
          metric: "Part Dev dans adaptation", 
          ess: totals.ess.total > 0 ? (totals.ess.dev / totals.ess.total * 100).toFixed(0) + "%" : "0%",
          std: (totals.std.dev / totals.std.total * 100).toFixed(0) + "%", 
          pre: (totals.pre.dev / totals.pre.total * 100).toFixed(0) + "%", 
          sur: (totals.sur.dev / totals.sur.total * 100).toFixed(0) + "%" 
        },
        { metric: "", ess: "", std: "", pre: "", sur: "" },
        { metric: "Maintenance mensuelle enfant (heures)", ess: maintenanceTotals.ess, std: maintenanceTotals.std, pre: maintenanceTotals.pre, sur: maintenanceTotals.sur },
        { metric: "Coût récurrent mensuel (€)", ess: maintenanceTotals.ess * tarifHoraire + forfaitIA + coutPlugins/12, std: maintenanceTotals.std * tarifHoraire + forfaitIA + coutPlugins/12, pre: maintenanceTotals.pre * tarifHoraire + forfaitIA + coutPlugins/12, sur: maintenanceTotals.sur * tarifHoraire + forfaitIA + coutPlugins/12 }
      ]);

      // Highlight économie
      [4, 5].forEach(rowNum => {
        comparisonSheet.getRow(rowNum).eachCell(cell => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E8F5E9" } };
        });
      });

      comparisonSheet.getRow(11).getCell("ess").numFmt = '#,##0 €';
      comparisonSheet.getRow(11).getCell("std").numFmt = '#,##0 €';
      comparisonSheet.getRow(11).getCell("pre").numFmt = '#,##0 €';
      comparisonSheet.getRow(11).getCell("sur").numFmt = '#,##0 €';

      comparisonSheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1A365D" } };
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
      });

      // Télécharger
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `simulation-adaptation-enfant-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12" style={{ marginTop: "var(--header-height, 145px)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-serif text-[hsl(var(--brand-primary))] mb-4">
              Export Simulation Adaptation Site Enfant
            </h1>
            <p className="text-muted-foreground">
              Effort pour adapter un site enfant depuis le modèle parent complet.
              <br />
              <span className="text-sm italic">
                Auto Sync / Auto IA = hérités (0h). SEO = humain. Dev = développeur.
              </span>
            </p>
          </div>

          {/* Paramètres */}
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Paramètres</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="tarif">Tarif horaire (€)</Label>
                <Input
                  id="tarif"
                  type="number"
                  value={tarifHoraire}
                  onChange={(e) => setTarifHoraire(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="marge">Marge (%)</Label>
                <Input
                  id="marge"
                  type="number"
                  value={marge}
                  onChange={(e) => setMarge(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="forfaitIA">Forfait IA (€/mois)</Label>
                <Input
                  id="forfaitIA"
                  type="number"
                  value={forfaitIA}
                  onChange={(e) => setForfaitIA(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="plugins">Plugins (€/an)</Label>
                <Input
                  id="plugins"
                  type="number"
                  value={coutPlugins}
                  onChange={(e) => setCoutPlugins(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-[hsl(var(--brand-blue-100))] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-[hsl(var(--brand-blue-600))]" />
                <span className="font-medium">Pages spécialités par offre</span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>Essentiel : <strong>{SPECIALTY_PAGES.ess}</strong> (iframe)</div>
                <div>Standard : <strong>{SPECIALTY_PAGES.std}</strong></div>
                <div>Premium : <strong>{SPECIALTY_PAGES.pre}</strong></div>
                <div>Sur Mesure : <strong>{SPECIALTY_PAGES.sur}</strong></div>
              </div>
            </div>
          </Card>

          {/* Aperçu Setup */}
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Setup Adaptation</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Offre</th>
                    <th className="text-right py-2">H. SEO</th>
                    <th className="text-right py-2">H. Dev</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-right py-2">Ratio</th>
                    <th className="text-right py-2">Prix HT</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { name: "Essentiel", key: "ess" as const },
                    { name: "Standard", key: "std" as const },
                    { name: "Premium", key: "pre" as const },
                    { name: "Sur Mesure", key: "sur" as const }
                  ]).map(offer => {
                    const data = totals[offer.key];
                    const priceHT = data.total * tarifHoraire * (1 + marge / 100);
                    const ratio = data.dev > 0 ? (data.seo / data.dev).toFixed(1) : "∞";
                    return (
                      <tr key={offer.key} className="border-b">
                        <td className="py-2 font-medium">{offer.name}</td>
                        <td className="text-right py-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {data.seo.toFixed(0)}h
                          </Badge>
                        </td>
                        <td className="text-right py-2">
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            {data.dev.toFixed(0)}h
                          </Badge>
                        </td>
                        <td className="text-right py-2 font-semibold">{data.total.toFixed(0)}h</td>
                        <td className="text-right py-2 text-muted-foreground">{ratio}:1</td>
                        <td className="text-right py-2 font-semibold">
                          {priceHT.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Aperçu Maintenance */}
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Maintenance Mensuelle Enfant</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Offre</th>
                    <th className="text-right py-2">Heures/mois</th>
                    <th className="text-right py-2">Coût récurrent</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { name: "Essentiel", key: "ess" as const },
                    { name: "Standard", key: "std" as const },
                    { name: "Premium", key: "pre" as const },
                    { name: "Sur Mesure", key: "sur" as const }
                  ]).map(offer => {
                    const hours = maintenanceTotals[offer.key];
                    const cost = hours * tarifHoraire + forfaitIA + coutPlugins / 12;
                    return (
                      <tr key={offer.key} className="border-b">
                        <td className="py-2 font-medium">{offer.name}</td>
                        <td className="text-right py-2">{hours.toFixed(1)}h</td>
                        <td className="text-right py-2 font-semibold">
                          {cost.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €/mois
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Légende */}
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Catégories</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(categoryColors).map(([cat, colors]) => (
                <div 
                  key={cat} 
                  className="p-3 rounded text-center text-sm font-medium"
                  style={{ backgroundColor: `#${colors.bg}`, color: `#${colors.text}` }}
                >
                  {cat}
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 justify-center">
              <Badge className="bg-green-100 text-green-700 border-green-300">SEO = Humain</Badge>
              <Badge className="bg-red-100 text-red-700 border-red-300">Dev = Développeur</Badge>
            </div>
          </Card>

          {/* Bouton export */}
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={generateExcel}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>Génération...</>
              ) : (
                <>
                  <FileSpreadsheet className="h-5 w-5" />
                  Télécharger Excel Adaptation
                  <Download className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExportAdaptation;
