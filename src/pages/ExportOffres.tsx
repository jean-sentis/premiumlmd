import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Settings } from "lucide-react";
import ExcelJS from "exceljs";

interface FeatureWithOffers {
  section: string;
  fonctionnalite: string;
  description: string;
  essentiel: boolean;
  essentielSetupH: number;
  essentielMaintenanceH: number;
  standard: boolean;
  standardSetupH: number;
  standardMaintenanceH: number;
  premium: boolean;
  premiumSetupH: number;
  premiumMaintenanceH: number;
  surMesure: boolean;
  surMesureSetupH: number;
  surMesureMaintenanceH: number;
  type: string;
  // Coût tokens IA mensuel estimé (€) - uniquement pour les fonctionnalités IA
  iaTokensCostMonthly?: number;
}

const features: FeatureWithOffers[] = [
  // === DÉCLINAISON SITE PARENT ===
  { section: "Setup Initial", fonctionnalite: "Déclinaison du site parent", description: "Fork codebase, configuration domaine, environnement", essentiel: true, essentielSetupH: 4, essentielMaintenanceH: 0, standard: true, standardSetupH: 6, standardMaintenanceH: 0, premium: true, premiumSetupH: 8, premiumMaintenanceH: 0, surMesure: true, surMesureSetupH: 12, surMesureMaintenanceH: 0, type: "Auto" },
  { section: "Setup Initial", fonctionnalite: "Configuration Supabase/Cloud", description: "Base de données, auth, storage", essentiel: true, essentielSetupH: 2, essentielMaintenanceH: 0.5, standard: true, standardSetupH: 4, standardMaintenanceH: 1, premium: true, premiumSetupH: 6, premiumMaintenanceH: 2, surMesure: true, surMesureSetupH: 8, surMesureMaintenanceH: 3, type: "Auto" },
  { section: "Setup Initial", fonctionnalite: "Paramétrage identité (logo, couleurs)", description: "Adaptation charte graphique de l'étude", essentiel: true, essentielSetupH: 2, essentielMaintenanceH: 0, standard: true, standardSetupH: 3, standardMaintenanceH: 0, premium: true, premiumSetupH: 4, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 8, surMesureMaintenanceH: 0.5, type: "Manuel" },
  
  // HEADER & FOOTER
  { section: "Header & Footer", fonctionnalite: "Logo cliquable", description: "Retour accueil depuis toutes les pages", essentiel: true, essentielSetupH: 0.5, essentielMaintenanceH: 0, standard: true, standardSetupH: 0.5, standardMaintenanceH: 0, premium: true, premiumSetupH: 0.5, premiumMaintenanceH: 0, surMesure: true, surMesureSetupH: 0.5, surMesureMaintenanceH: 0, type: "Auto" },
  { section: "Header & Footer", fonctionnalite: "Navigation principale", description: "Menu avec liens vers sections clés", essentiel: true, essentielSetupH: 1, essentielMaintenanceH: 0, standard: true, standardSetupH: 2, standardMaintenanceH: 0, premium: true, premiumSetupH: 3, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 4, surMesureMaintenanceH: 0.5, type: "Auto" },
  { section: "Header & Footer", fonctionnalite: "Horloge temps réel", description: "Affichage heure actuelle", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 0.5, standardMaintenanceH: 0, premium: true, premiumSetupH: 0.5, premiumMaintenanceH: 0, surMesure: true, surMesureSetupH: 0.5, surMesureMaintenanceH: 0, type: "Auto" },
  { section: "Header & Footer", fonctionnalite: "Menu mobile responsive", description: "Navigation adaptée mobile avec drawer", essentiel: true, essentielSetupH: 1, essentielMaintenanceH: 0, standard: true, standardSetupH: 1, standardMaintenanceH: 0, premium: true, premiumSetupH: 1, premiumMaintenanceH: 0, surMesure: true, surMesureSetupH: 2, surMesureMaintenanceH: 0, type: "Auto" },
  { section: "Header & Footer", fonctionnalite: "Footer informatif", description: "Coordonnées, horaires, liens utiles", essentiel: true, essentielSetupH: 2, essentielMaintenanceH: 0.5, standard: true, standardSetupH: 2, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 2, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 3, surMesureMaintenanceH: 0.5, type: "Manuel" },

  // ACCUEIL
  { section: "Accueil", fonctionnalite: "Hero section", description: "Présentation visuelle impactante", essentiel: true, essentielSetupH: 3, essentielMaintenanceH: 0.5, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 6, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 10, surMesureMaintenanceH: 1, type: "Manuel" },
  { section: "Accueil", fonctionnalite: "Prochaines ventes", description: "Affichage ventes à venir (iframe ou natif)", essentiel: true, essentielSetupH: 2, essentielMaintenanceH: 0, standard: true, standardSetupH: 3, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 3, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 4, surMesureMaintenanceH: 0.5, type: "Auto Sync" },
  { section: "Accueil", fonctionnalite: "Spécialités mises en avant", description: "Grille des domaines d'expertise", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 2, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 3, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 4, surMesureMaintenanceH: 0.5, type: "Manuel" },
  { section: "Accueil", fonctionnalite: "Témoignages clients", description: "Carrousel avis clients", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 3, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 4, surMesureMaintenanceH: 1, type: "Manuel" },
  { section: "Accueil", fonctionnalite: "CTA estimation gratuite", description: "Bouton vers formulaire estimation", essentiel: true, essentielSetupH: 0.5, essentielMaintenanceH: 0, standard: true, standardSetupH: 0.5, standardMaintenanceH: 0, premium: true, premiumSetupH: 0.5, premiumMaintenanceH: 0, surMesure: true, surMesureSetupH: 0.5, surMesureMaintenanceH: 0, type: "Auto" },

  // SERVICES ACHETEURS
  { section: "Services Acheteurs", fonctionnalite: "Guide de l'acheteur", description: "Tutoriel complet pour enchérir", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 2, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 2, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 3, surMesureMaintenanceH: 0.5, type: "Auto" },
  { section: "Services Acheteurs", fonctionnalite: "Glossaire des enchères", description: "Définitions termes spécialisés", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 4, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 6, surMesureMaintenanceH: 1, type: "SEO 6M" },
  { section: "Services Acheteurs", fonctionnalite: "Liste ventes à venir", description: "Catalogue complet avec filtres (ou iframe)", essentiel: true, essentielSetupH: 2, essentielMaintenanceH: 0, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 4, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 6, surMesureMaintenanceH: 1, type: "Auto Sync" },
  { section: "Services Acheteurs", fonctionnalite: "Détail vente (natif)", description: "Page complète avec tous les lots", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 6, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 6, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 8, surMesureMaintenanceH: 1, type: "Auto Sync" },
  { section: "Services Acheteurs", fonctionnalite: "Détail vente (iframe)", description: "Iframe Interenchères intégré", essentiel: true, essentielSetupH: 1, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: false, premiumSetupH: 0, premiumMaintenanceH: 0, surMesure: false, surMesureSetupH: 0, surMesureMaintenanceH: 0, type: "Auto Sync" },
  { section: "Services Acheteurs", fonctionnalite: "Détail lot", description: "Fiche produit avec images HD, zoom", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 6, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 8, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 12, surMesureMaintenanceH: 1.5, type: "Auto Sync" },
  { section: "Services Acheteurs", fonctionnalite: "Ordre d'achat en ligne", description: "Formulaire enchère maximum", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 4, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 6, surMesureMaintenanceH: 1, type: "Auto" },
  { section: "Services Acheteurs", fonctionnalite: "Enchère téléphone", description: "Réservation ligne téléphonique", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 3, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 3, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 4, surMesureMaintenanceH: 0.5, type: "Auto" },
  { section: "Services Acheteurs", fonctionnalite: "Ventes passées", description: "Archives avec résultats", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 4, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 6, surMesureMaintenanceH: 1, type: "Auto Sync" },
  { section: "Services Acheteurs", fonctionnalite: "Catégorisation IA ventes passées", description: "Tri intelligent par famille d'objets", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 8, premiumMaintenanceH: 2, surMesure: true, surMesureSetupH: 12, surMesureMaintenanceH: 3, type: "IA", iaTokensCostMonthly: 25 },
  { section: "Services Acheteurs", fonctionnalite: "After-sale", description: "Lots invendus disponibles", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 4, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 6, surMesureMaintenanceH: 1, type: "Auto Sync" },
  { section: "Services Acheteurs", fonctionnalite: "Paiement en ligne", description: "Règlement sécurisé des achats", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 8, standardMaintenanceH: 1, premium: true, premiumSetupH: 8, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 12, surMesureMaintenanceH: 2, type: "Auto" },
  { section: "Services Acheteurs", fonctionnalite: "Enlèvement RDV", description: "Prise de rendez-vous retrait", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 3, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 3, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 5, surMesureMaintenanceH: 1, type: "Auto" },

  // SERVICES VENDEURS
  { section: "Services Vendeurs", fonctionnalite: "Guide du vendeur", description: "Processus de vente expliqué", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 2, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 2, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 3, surMesureMaintenanceH: 0.5, type: "Auto" },
  { section: "Services Vendeurs", fonctionnalite: "Estimation en ligne", description: "Formulaire avec upload photos", essentiel: true, essentielSetupH: 4, essentielMaintenanceH: 0.5, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 6, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 8, surMesureMaintenanceH: 1.5, type: "Auto" },
  { section: "Services Vendeurs", fonctionnalite: "Journées estimation", description: "Calendrier RDV gratuits", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 3, standardMaintenanceH: 1, premium: true, premiumSetupH: 3, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 5, surMesureMaintenanceH: 2, type: "SEO Local" },
  { section: "Services Vendeurs", fonctionnalite: "Inventaire à domicile", description: "Service déplacement expert", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 3, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 5, surMesureMaintenanceH: 1, type: "SEO Local" },
  { section: "Services Vendeurs", fonctionnalite: "Évaluation marché IA", description: "Historique prix par catégorie", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 12, premiumMaintenanceH: 2, surMesure: true, surMesureSetupH: 20, surMesureMaintenanceH: 3, type: "IA", iaTokensCostMonthly: 15 },

  // CALENDRIER
  { section: "Calendrier", fonctionnalite: "Vue unifiée", description: "Ventes, expos, expertises ensemble", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 6, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 6, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 8, surMesureMaintenanceH: 1, type: "Auto Sync" },
  { section: "Calendrier", fonctionnalite: "Filtres par type", description: "Sélection ventes/expos/expertises", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 2, standardMaintenanceH: 0, premium: true, premiumSetupH: 2, premiumMaintenanceH: 0, surMesure: true, surMesureSetupH: 3, surMesureMaintenanceH: 0, type: "Auto" },
  { section: "Calendrier", fonctionnalite: "Détail événement", description: "Informations complètes au clic", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 2, standardMaintenanceH: 0, premium: true, premiumSetupH: 2, premiumMaintenanceH: 0, surMesure: true, surMesureSetupH: 3, surMesureMaintenanceH: 0.5, type: "Auto Sync" },

  // ESPACE CLIENT
  { section: "Espace Client", fonctionnalite: "Authentification", description: "Inscription/connexion sécurisée", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 4, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 6, surMesureMaintenanceH: 1, type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Dashboard accueil", description: "Vue synthétique activité", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 6, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 10, surMesureMaintenanceH: 1.5, type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Mes alertes mots-clés", description: "Mots-clés surveillés (basique)", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 4, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 6, surMesureMaintenanceH: 1, type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Alertes intelligentes IA", description: "Validation et enrichissement par IA", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 8, premiumMaintenanceH: 2, surMesure: true, surMesureSetupH: 12, surMesureMaintenanceH: 3, type: "IA", iaTokensCostMonthly: 20 },
  { section: "Espace Client", fonctionnalite: "Suggestions Lia", description: "IA recommande lots pertinents", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 16, premiumMaintenanceH: 3, surMesure: true, surMesureSetupH: 24, surMesureMaintenanceH: 4, type: "IA", iaTokensCostMonthly: 45 },
  { section: "Espace Client", fonctionnalite: "Dialogue goûts avec Lia", description: "Conversation IA préférences", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 20, premiumMaintenanceH: 3, surMesure: true, surMesureSetupH: 30, surMesureMaintenanceH: 5, type: "IA", iaTokensCostMonthly: 35 },
  { section: "Espace Client", fonctionnalite: "Favoris", description: "Lots mémorisés", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 3, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 3, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 4, surMesureMaintenanceH: 0.5, type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Mes ordres d'achat", description: "Historique enchères déposées", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 3, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 3, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 4, surMesureMaintenanceH: 0.5, type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Enchères téléphone", description: "Demandes ligne téléphonique", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 2, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 2, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 3, surMesureMaintenanceH: 0.5, type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Mes adjudications", description: "Lots remportés", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 4, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 6, surMesureMaintenanceH: 1, type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Régler mes achats", description: "Paiement bordereaux", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 6, standardMaintenanceH: 1, premium: true, premiumSetupH: 6, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 10, surMesureMaintenanceH: 2, type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Enlèvement", description: "Planification retrait", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 3, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 3, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 5, surMesureMaintenanceH: 1, type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Mon profil", description: "Informations personnelles", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 3, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 3, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 5, surMesureMaintenanceH: 0.5, type: "Auto" },
  { section: "Espace Client", fonctionnalite: "Vie privée RGPD", description: "Gestion consentements", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 2, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 2, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 3, surMesureMaintenanceH: 0.5, type: "Auto" },

  // INTELLIGENCE ARTIFICIELLE
  { section: "Intelligence Artificielle", fonctionnalite: "Lia conversationnelle", description: "Assistant IA dialogue naturel", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 16, premiumMaintenanceH: 3, surMesure: true, surMesureSetupH: 24, surMesureMaintenanceH: 4, type: "IA", iaTokensCostMonthly: 50 },
  { section: "Intelligence Artificielle", fonctionnalite: "Analyse lot", description: "IA décrit et contextualise", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 8, premiumMaintenanceH: 2, surMesure: true, surMesureSetupH: 12, surMesureMaintenanceH: 3, type: "IA", iaTokensCostMonthly: 30 },
  { section: "Intelligence Artificielle", fonctionnalite: "Enrichissement descriptions", description: "Amélioration automatique textes lots", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 12, premiumMaintenanceH: 2, surMesure: true, surMesureSetupH: 16, surMesureMaintenanceH: 3, type: "IA", iaTokensCostMonthly: 40 },
  { section: "Intelligence Artificielle", fonctionnalite: "Classification catégories", description: "Tri automatique par famille", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 12, premiumMaintenanceH: 2, surMesure: true, surMesureSetupH: 16, surMesureMaintenanceH: 3, type: "IA", iaTokensCostMonthly: 25 },
  { section: "Intelligence Artificielle", fonctionnalite: "Questions lot", description: "Chat sur lot spécifique", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 8, premiumMaintenanceH: 1.5, surMesure: true, surMesureSetupH: 12, surMesureMaintenanceH: 2, type: "IA", iaTokensCostMonthly: 20 },
  { section: "Intelligence Artificielle", fonctionnalite: "Validation alertes", description: "IA vérifie pertinence mots-clés", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 6, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 10, surMesureMaintenanceH: 2, type: "IA", iaTokensCostMonthly: 10 },

  // GESTION VENTES
  { section: "Gestion Ventes", fonctionnalite: "Sync Interenchères (iframe)", description: "Affichage ventes via iframe", essentiel: true, essentielSetupH: 2, essentielMaintenanceH: 0.5, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: false, premiumSetupH: 0, premiumMaintenanceH: 0, surMesure: false, surMesureSetupH: 0, surMesureMaintenanceH: 0, type: "Auto Sync" },
  { section: "Gestion Ventes", fonctionnalite: "Sync Interenchères (natif)", description: "Import données dans base propre", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 8, standardMaintenanceH: 1, premium: true, premiumSetupH: 8, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 12, surMesureMaintenanceH: 2, type: "Auto Sync" },
  { section: "Gestion Ventes", fonctionnalite: "Images HD stockées", description: "Stockage haute définition local", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 4, standardMaintenanceH: 1, premium: true, premiumSetupH: 4, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 6, surMesureMaintenanceH: 2, type: "Auto Sync" },
  { section: "Gestion Ventes", fonctionnalite: "Ventes live", description: "Gestion enchères temps réel", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 2, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 2, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 4, surMesureMaintenanceH: 1, type: "Auto Sync" },
  { section: "Gestion Ventes", fonctionnalite: "Ventes chrono", description: "Enchères avec compte à rebours", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 4, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 6, surMesureMaintenanceH: 1, type: "Auto Sync" },
  { section: "Gestion Ventes", fonctionnalite: "Gestion after-sale", description: "Invendus disponibles à prix fixe", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 4, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 6, surMesureMaintenanceH: 1, type: "Auto Sync" },

  // COMMUNICATION
  { section: "Communication", fonctionnalite: "Pages spécialités (11)", description: "Pages expertise détaillées", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 24, premiumMaintenanceH: 3, surMesure: true, surMesureSetupH: 40, surMesureMaintenanceH: 5, type: "Manuel" },
  { section: "Communication", fonctionnalite: "Page spécialité simplifiée", description: "Liste des spécialités sans détail", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 3, standardMaintenanceH: 0.5, premium: false, premiumSetupH: 0, premiumMaintenanceH: 0, surMesure: false, surMesureSetupH: 0, surMesureMaintenanceH: 0, type: "Manuel" },
  { section: "Communication", fonctionnalite: "Aventures d'enchères", description: "Histoires et anecdotes", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 8, premiumMaintenanceH: 2, surMesure: true, surMesureSetupH: 12, surMesureMaintenanceH: 3, type: "Manuel" },
  { section: "Communication", fonctionnalite: "La Maison", description: "Présentation entreprise", essentiel: true, essentielSetupH: 4, essentielMaintenanceH: 0.5, standard: true, standardSetupH: 6, standardMaintenanceH: 1, premium: true, premiumSetupH: 8, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 12, surMesureMaintenanceH: 2, type: "Manuel" },
  { section: "Communication", fonctionnalite: "Talents de la région", description: "Artisans locaux partenaires", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 6, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 10, surMesureMaintenanceH: 2, type: "Manuel" },
  { section: "Communication", fonctionnalite: "Contact", description: "Formulaire et coordonnées", essentiel: true, essentielSetupH: 2, essentielMaintenanceH: 0.5, standard: true, standardSetupH: 2, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 3, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 4, surMesureMaintenanceH: 1, type: "Manuel" },
  { section: "Communication", fonctionnalite: "Témoignages", description: "Avis clients authentiques", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 3, premiumMaintenanceH: 1, surMesure: true, surMesureSetupH: 5, surMesureMaintenanceH: 1.5, type: "Manuel" },

  // ADMINISTRATION CRM
  { section: "Administration CRM", fonctionnalite: "Profils clients auto", description: "Création automatique à l'inscription", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 2, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 2, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 4, surMesureMaintenanceH: 1, type: "Auto" },
  { section: "Administration CRM", fonctionnalite: "Détection intérêts IA", description: "IA identifie préférences", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 10, premiumMaintenanceH: 2, surMesure: true, surMesureSetupH: 16, surMesureMaintenanceH: 3, type: "IA", iaTokensCostMonthly: 25 },
  { section: "Administration CRM", fonctionnalite: "Suivi paiements", description: "État des règlements", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 4, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 4, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 6, surMesureMaintenanceH: 1, type: "Auto" },
  { section: "Administration CRM", fonctionnalite: "Suivi enlèvements", description: "État des retraits", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 3, standardMaintenanceH: 0.5, premium: true, premiumSetupH: 3, premiumMaintenanceH: 0.5, surMesure: true, surMesureSetupH: 5, surMesureMaintenanceH: 1, type: "Auto" },
  { section: "Administration CRM", fonctionnalite: "Statistiques avancées", description: "Tableaux de bord analytics", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 12, premiumMaintenanceH: 2, surMesure: true, surMesureSetupH: 20, surMesureMaintenanceH: 3, type: "Auto" },

  // DESIGN & IDENTITÉ
  { section: "Design & Identité", fonctionnalite: "Template standard", description: "Design générique adapté", essentiel: true, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 0, standardMaintenanceH: 0, premium: false, premiumSetupH: 0, premiumMaintenanceH: 0, surMesure: false, surMesureSetupH: 0, surMesureMaintenanceH: 0, type: "Auto" },
  { section: "Design & Identité", fonctionnalite: "Direction artistique", description: "Choix polices, couleurs, style unique", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 16, premiumMaintenanceH: 2, surMesure: true, surMesureSetupH: 32, surMesureMaintenanceH: 3, type: "Manuel" },
  { section: "Design & Identité", fonctionnalite: "Logo et favicon", description: "Identité graphique de l'étude", essentiel: true, essentielSetupH: 1, essentielMaintenanceH: 0, standard: true, standardSetupH: 1, standardMaintenanceH: 0, premium: true, premiumSetupH: 2, premiumMaintenanceH: 0, surMesure: true, surMesureSetupH: 4, surMesureMaintenanceH: 0, type: "Manuel" },
  { section: "Design & Identité", fonctionnalite: "Design sur mesure", description: "Création graphique personnalisée", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: false, premiumSetupH: 0, premiumMaintenanceH: 0, surMesure: true, surMesureSetupH: 40, surMesureMaintenanceH: 4, type: "Manuel" },

  // SUPPORT & ACCOMPAGNEMENT
  { section: "Support", fonctionnalite: "Documentation en ligne", description: "Guides et FAQ utilisateur", essentiel: true, essentielSetupH: 0, essentielMaintenanceH: 0, standard: true, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 0, premiumMaintenanceH: 0, surMesure: true, surMesureSetupH: 0, surMesureMaintenanceH: 0, type: "Auto" },
  { section: "Support", fonctionnalite: "Support email", description: "Assistance par email", essentiel: true, essentielSetupH: 0, essentielMaintenanceH: 1, standard: true, standardSetupH: 0, standardMaintenanceH: 2, premium: true, premiumSetupH: 0, premiumMaintenanceH: 3, surMesure: true, surMesureSetupH: 0, surMesureMaintenanceH: 4, type: "Manuel" },
  { section: "Support", fonctionnalite: "Support téléphone dédié", description: "Ligne directe avec référent", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 0, premiumMaintenanceH: 2, surMesure: true, surMesureSetupH: 0, surMesureMaintenanceH: 4, type: "Manuel" },
  { section: "Support", fonctionnalite: "Formation initiale", description: "Formation équipe à la plateforme", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: true, premiumSetupH: 8, premiumMaintenanceH: 0, surMesure: true, surMesureSetupH: 16, surMesureMaintenanceH: 0, type: "Manuel" },
  { section: "Support", fonctionnalite: "Accompagnement setup", description: "Aide création contenus initiaux", essentiel: false, essentielSetupH: 0, essentielMaintenanceH: 0, standard: false, standardSetupH: 0, standardMaintenanceH: 0, premium: false, premiumSetupH: 0, premiumMaintenanceH: 0, surMesure: true, surMesureSetupH: 24, surMesureMaintenanceH: 2, type: "Manuel" },
];

// Couleurs par type
const typeColors: Record<string, string> = {
  "Auto Sync": "C6EFCE",
  "IA": "E4DFEC",
  "SEO Local": "BDD7EE",
  "SEO 6M": "9BC2E6",
  "Manuel": "FCE4D6",
  "Auto": "F2F2F2",
};

// Couleurs des offres
const offerColors = {
  essentiel: { main: "E69138", light: "FFF2CC" },
  standard: { main: "6AA84F", light: "D9EAD3" },
  premium: { main: "3D85C6", light: "CFE2F3" },
  surMesure: { main: "8E7CC3", light: "E6D5E9" },
};

const ExportOffres = () => {
  // États pour les tarifs modifiables
  const [tarifSetup, setTarifSetup] = useState(90);
  const [tarifMaintenance, setTarifMaintenance] = useState(80);

  // Calculs des totaux
  const totals = {
    essentiel: {
      features: features.filter(f => f.essentiel).length,
      setupH: features.reduce((acc, f) => acc + f.essentielSetupH, 0),
      maintenanceH: features.reduce((acc, f) => acc + f.essentielMaintenanceH, 0),
      iaTokensCost: 0, // Pas d'IA dans Essentiel
    },
    standard: {
      features: features.filter(f => f.standard).length,
      setupH: features.reduce((acc, f) => acc + f.standardSetupH, 0),
      maintenanceH: features.reduce((acc, f) => acc + f.standardMaintenanceH, 0),
      iaTokensCost: 0, // Pas d'IA dans Standard
    },
    premium: {
      features: features.filter(f => f.premium).length,
      setupH: features.reduce((acc, f) => acc + f.premiumSetupH, 0),
      maintenanceH: features.reduce((acc, f) => acc + f.premiumMaintenanceH, 0),
      iaTokensCost: features.filter(f => f.premium && f.iaTokensCostMonthly).reduce((acc, f) => acc + (f.iaTokensCostMonthly || 0), 0),
    },
    surMesure: {
      features: features.filter(f => f.surMesure).length,
      setupH: features.reduce((acc, f) => acc + f.surMesureSetupH, 0),
      maintenanceH: features.reduce((acc, f) => acc + f.surMesureMaintenanceH, 0),
      iaTokensCost: features.filter(f => f.surMesure && f.iaTokensCostMonthly).reduce((acc, f) => acc + (f.iaTokensCostMonthly || 0), 0),
    },
  };

  const generateExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Plateforme Enchères SaaS";
    workbook.created = new Date();

    // ===== FEUILLE 1: Comparatif Détaillé =====
    const worksheet = workbook.addWorksheet("Comparatif Détaillé", {
      views: [{ state: "frozen", xSplit: 0, ySplit: 2 }],
    });

    // Colonnes avec coût IA
    worksheet.columns = [
      { header: "Section", key: "section", width: 20 },
      { header: "Fonctionnalité", key: "fonctionnalite", width: 28 },
      { header: "Description", key: "description", width: 36 },
      // ESSENTIEL
      { header: "✓", key: "essentielIncl", width: 4 },
      { header: "Setup", key: "essentielSetup", width: 7 },
      { header: "Maint.", key: "essentielMaint", width: 7 },
      // STANDARD
      { header: "✓", key: "standardIncl", width: 4 },
      { header: "Setup", key: "standardSetup", width: 7 },
      { header: "Maint.", key: "standardMaint", width: 7 },
      // PREMIUM
      { header: "✓", key: "premiumIncl", width: 4 },
      { header: "Setup", key: "premiumSetup", width: 7 },
      { header: "Maint.", key: "premiumMaint", width: 7 },
      { header: "IA €", key: "premiumIA", width: 6 },
      // SUR MESURE
      { header: "✓", key: "surMesureIncl", width: 4 },
      { header: "Setup", key: "surMesureSetup", width: 7 },
      { header: "Maint.", key: "surMesureMaint", width: 7 },
      { header: "IA €", key: "surMesureIA", width: 6 },
      // Type
      { header: "Type", key: "type", width: 12 },
    ];

    // Row 1: Headers groupés
    const groupRow = worksheet.insertRow(1, [
      "", "", "",
      "ESSENTIEL", "", "",
      "STANDARD", "", "",
      "PREMIUM", "", "", "",
      "SUR MESURE", "", "", "",
      ""
    ]);
    
    worksheet.mergeCells("D1:F1");
    worksheet.mergeCells("G1:I1");
    worksheet.mergeCells("J1:M1");
    worksheet.mergeCells("N1:Q1");

    groupRow.eachCell((cell, colNumber) => {
      if (colNumber >= 4 && colNumber <= 6) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: offerColors.essentiel.main } };
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
      } else if (colNumber >= 7 && colNumber <= 9) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: offerColors.standard.main } };
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
      } else if (colNumber >= 10 && colNumber <= 13) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: offerColors.premium.main } };
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
      } else if (colNumber >= 14 && colNumber <= 17) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: offerColors.surMesure.main } };
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
      }
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    groupRow.height = 24;

    // Style row 2
    const subHeaderRow = worksheet.getRow(2);
    subHeaderRow.font = { bold: true, size: 9 };
    subHeaderRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    subHeaderRow.height = 28;
    
    ["D", "E", "F"].forEach(col => {
      worksheet.getCell(`${col}2`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: offerColors.essentiel.light } };
    });
    ["G", "H", "I"].forEach(col => {
      worksheet.getCell(`${col}2`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: offerColors.standard.light } };
    });
    ["J", "K", "L", "M"].forEach(col => {
      worksheet.getCell(`${col}2`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: offerColors.premium.light } };
    });
    ["N", "O", "P", "Q"].forEach(col => {
      worksheet.getCell(`${col}2`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: offerColors.surMesure.light } };
    });
    ["A", "B", "C", "R"].forEach(col => {
      worksheet.getCell(`${col}2`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
      worksheet.getCell(`${col}2`).font = { bold: true, color: { argb: "FFFFFF" } };
    });

    // Add data rows
    features.forEach((feature) => {
      const row = worksheet.addRow({
        section: feature.section,
        fonctionnalite: feature.fonctionnalite,
        description: feature.description,
        essentielIncl: feature.essentiel ? "✓" : "",
        essentielSetup: feature.essentielSetupH || "",
        essentielMaint: feature.essentielMaintenanceH || "",
        standardIncl: feature.standard ? "✓" : "",
        standardSetup: feature.standardSetupH || "",
        standardMaint: feature.standardMaintenanceH || "",
        premiumIncl: feature.premium ? "✓" : "",
        premiumSetup: feature.premiumSetupH || "",
        premiumMaint: feature.premiumMaintenanceH || "",
        premiumIA: feature.premium && feature.iaTokensCostMonthly ? feature.iaTokensCostMonthly : "",
        surMesureIncl: feature.surMesure ? "✓" : "",
        surMesureSetup: feature.surMesureSetupH || "",
        surMesureMaint: feature.surMesureMaintenanceH || "",
        surMesureIA: feature.surMesure && feature.iaTokensCostMonthly ? feature.iaTokensCostMonthly : "",
        type: feature.type,
      });

      const bgColor = typeColors[feature.type] || "FFFFFF";
      [1, 2, 3, 18].forEach(colNumber => {
        row.getCell(colNumber).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      });

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "D9D9D9" } },
          left: { style: "thin", color: { argb: "D9D9D9" } },
          bottom: { style: "thin", color: { argb: "D9D9D9" } },
          right: { style: "thin", color: { argb: "D9D9D9" } },
        };
      });

      if (feature.essentiel) {
        [4, 5, 6].forEach(col => {
          row.getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: offerColors.essentiel.light } };
        });
      }
      if (feature.standard) {
        [7, 8, 9].forEach(col => {
          row.getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: offerColors.standard.light } };
        });
      }
      if (feature.premium) {
        [10, 11, 12, 13].forEach(col => {
          row.getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: offerColors.premium.light } };
        });
      }
      if (feature.surMesure) {
        [14, 15, 16, 17].forEach(col => {
          row.getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: offerColors.surMesure.light } };
        });
      }

      // Colorer les cellules IA en violet
      if (feature.iaTokensCostMonthly) {
        if (feature.premium) {
          row.getCell(13).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E4DFEC" } };
        }
        if (feature.surMesure) {
          row.getCell(17).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E4DFEC" } };
        }
      }

      [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].forEach(col => {
        row.getCell(col).alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    // LIGNE TOTAUX
    const totalRowData = worksheet.addRow({
      section: "",
      fonctionnalite: "TOTAL",
      description: "",
      essentielIncl: totals.essentiel.features,
      essentielSetup: totals.essentiel.setupH,
      essentielMaint: totals.essentiel.maintenanceH,
      standardIncl: totals.standard.features,
      standardSetup: totals.standard.setupH,
      standardMaint: totals.standard.maintenanceH,
      premiumIncl: totals.premium.features,
      premiumSetup: totals.premium.setupH,
      premiumMaint: totals.premium.maintenanceH,
      premiumIA: totals.premium.iaTokensCost,
      surMesureIncl: totals.surMesure.features,
      surMesureSetup: totals.surMesure.setupH,
      surMesureMaint: totals.surMesure.maintenanceH,
      surMesureIA: totals.surMesure.iaTokensCost,
      type: "",
    });
    totalRowData.font = { bold: true };
    totalRowData.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEB9C" } };
    totalRowData.eachCell((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "medium", color: { argb: "000000" } }, bottom: { style: "medium", color: { argb: "000000" } } };
    });

    // LIGNE TARIFS SETUP
    const tarifSetupRow = worksheet.addRow({
      section: "",
      fonctionnalite: `TARIF SETUP (${tarifSetup}€/h)`,
      description: "",
      essentielIncl: "",
      essentielSetup: `${Math.round(totals.essentiel.setupH * tarifSetup).toLocaleString("fr-FR")} €`,
      essentielMaint: "",
      standardIncl: "",
      standardSetup: `${Math.round(totals.standard.setupH * tarifSetup).toLocaleString("fr-FR")} €`,
      standardMaint: "",
      premiumIncl: "",
      premiumSetup: `${Math.round(totals.premium.setupH * tarifSetup).toLocaleString("fr-FR")} €`,
      premiumMaint: "",
      premiumIA: "",
      surMesureIncl: "",
      surMesureSetup: `${Math.round(totals.surMesure.setupH * tarifSetup).toLocaleString("fr-FR")} €`,
      surMesureMaint: "",
      surMesureIA: "",
      type: "",
    });
    tarifSetupRow.font = { bold: true };
    tarifSetupRow.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "92D050" } };
    [5, 8, 11, 15].forEach(col => {
      tarifSetupRow.getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "92D050" } };
      tarifSetupRow.getCell(col).alignment = { horizontal: "center" };
    });

    // LIGNE TARIFS MAINTENANCE
    const tarifMaintRow = worksheet.addRow({
      section: "",
      fonctionnalite: `MAINTENANCE/MOIS (${tarifMaintenance}€/h)`,
      description: "",
      essentielIncl: "",
      essentielSetup: "",
      essentielMaint: `${Math.round(totals.essentiel.maintenanceH * tarifMaintenance).toLocaleString("fr-FR")} €`,
      standardIncl: "",
      standardSetup: "",
      standardMaint: `${Math.round(totals.standard.maintenanceH * tarifMaintenance).toLocaleString("fr-FR")} €`,
      premiumIncl: "",
      premiumSetup: "",
      premiumMaint: `${Math.round(totals.premium.maintenanceH * tarifMaintenance).toLocaleString("fr-FR")} €`,
      premiumIA: "",
      surMesureIncl: "",
      surMesureSetup: "",
      surMesureMaint: `${Math.round(totals.surMesure.maintenanceH * tarifMaintenance).toLocaleString("fr-FR")} €`,
      surMesureIA: "",
      type: "",
    });
    tarifMaintRow.font = { bold: true };
    tarifMaintRow.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC000" } };
    [6, 9, 12, 16].forEach(col => {
      tarifMaintRow.getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC000" } };
      tarifMaintRow.getCell(col).alignment = { horizontal: "center" };
    });

    // LIGNE COÛT IA MENSUEL
    const iaRow = worksheet.addRow({
      section: "",
      fonctionnalite: "COÛT TOKENS IA/MOIS",
      description: "(estimation volume moyen)",
      essentielIncl: "",
      essentielSetup: "",
      essentielMaint: "—",
      standardIncl: "",
      standardSetup: "",
      standardMaint: "—",
      premiumIncl: "",
      premiumSetup: "",
      premiumMaint: "",
      premiumIA: `${totals.premium.iaTokensCost} €`,
      surMesureIncl: "",
      surMesureSetup: "",
      surMesureMaint: "",
      surMesureIA: `${totals.surMesure.iaTokensCost} €`,
      type: "",
    });
    iaRow.font = { bold: true };
    iaRow.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E4DFEC" } };
    [13, 17].forEach(col => {
      iaRow.getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E4DFEC" } };
      iaRow.getCell(col).alignment = { horizontal: "center" };
    });

    // ===== FEUILLE 2: Synthèse Tarification =====
    const synthSheet = workbook.addWorksheet("Synthèse Tarification");
    synthSheet.columns = [
      { header: "Offre", key: "offre", width: 18 },
      { header: "Fonctionnalités", key: "features", width: 16 },
      { header: "Heures Setup", key: "setupH", width: 14 },
      { header: "Tarif Setup HT", key: "setupPrix", width: 16 },
      { header: "H. Maint./mois", key: "maintH", width: 14 },
      { header: "Maint./mois HT", key: "maintPrix", width: 16 },
      { header: "Coût IA/mois", key: "iaCost", width: 14 },
      { header: "TOTAL Mensuel", key: "totalMensuel", width: 16 },
    ];

    const synthHeader = synthSheet.getRow(1);
    synthHeader.font = { bold: true, color: { argb: "FFFFFF" } };
    synthHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
    synthHeader.alignment = { horizontal: "center", wrapText: true };

    const synthData = [
      { 
        offre: "ESSENTIEL", 
        features: totals.essentiel.features, 
        setupH: totals.essentiel.setupH, 
        setupPrix: totals.essentiel.setupH * tarifSetup,
        maintH: totals.essentiel.maintenanceH,
        maintPrix: totals.essentiel.maintenanceH * tarifMaintenance,
        iaCost: 0,
        totalMensuel: totals.essentiel.maintenanceH * tarifMaintenance,
        color: offerColors.essentiel.main 
      },
      { 
        offre: "STANDARD", 
        features: totals.standard.features, 
        setupH: totals.standard.setupH, 
        setupPrix: totals.standard.setupH * tarifSetup,
        maintH: totals.standard.maintenanceH,
        maintPrix: totals.standard.maintenanceH * tarifMaintenance,
        iaCost: 0,
        totalMensuel: totals.standard.maintenanceH * tarifMaintenance,
        color: offerColors.standard.main 
      },
      { 
        offre: "PREMIUM", 
        features: totals.premium.features, 
        setupH: totals.premium.setupH, 
        setupPrix: totals.premium.setupH * tarifSetup,
        maintH: totals.premium.maintenanceH,
        maintPrix: totals.premium.maintenanceH * tarifMaintenance,
        iaCost: totals.premium.iaTokensCost,
        totalMensuel: totals.premium.maintenanceH * tarifMaintenance + totals.premium.iaTokensCost,
        color: offerColors.premium.main 
      },
      { 
        offre: "SUR MESURE", 
        features: totals.surMesure.features, 
        setupH: totals.surMesure.setupH, 
        setupPrix: totals.surMesure.setupH * tarifSetup,
        maintH: totals.surMesure.maintenanceH,
        maintPrix: totals.surMesure.maintenanceH * tarifMaintenance,
        iaCost: totals.surMesure.iaTokensCost,
        totalMensuel: totals.surMesure.maintenanceH * tarifMaintenance + totals.surMesure.iaTokensCost,
        color: offerColors.surMesure.main 
      },
    ];

    synthData.forEach((item) => {
      const row = synthSheet.addRow({
        offre: item.offre,
        features: item.features,
        setupH: item.setupH,
        setupPrix: `${Math.round(item.setupPrix).toLocaleString("fr-FR")} €`,
        maintH: item.maintH.toFixed(1),
        maintPrix: `${Math.round(item.maintPrix).toLocaleString("fr-FR")} €`,
        iaCost: item.iaCost > 0 ? `${item.iaCost} €` : "—",
        totalMensuel: `${Math.round(item.totalMensuel).toLocaleString("fr-FR")} €/mois`,
      });
      row.getCell("offre").fill = { type: "pattern", pattern: "solid", fgColor: { argb: item.color } };
      row.getCell("offre").font = { bold: true, color: { argb: "FFFFFF" } };
      row.getCell("setupPrix").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "92D050" } };
      row.getCell("maintPrix").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC000" } };
      if (item.iaCost > 0) {
        row.getCell("iaCost").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E4DFEC" } };
      }
      row.getCell("totalMensuel").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "B4C6E7" } };
      row.getCell("totalMensuel").font = { bold: true };
      row.eachCell(cell => { cell.alignment = { horizontal: "center" }; });
    });

    synthSheet.addRow([]);
    const noteRow = synthSheet.addRow([`Tarifs appliqués : Setup ${tarifSetup}€/h HT | Maintenance ${tarifMaintenance}€/h HT | Coûts IA basés sur volume mensuel moyen`]);
    noteRow.font = { italic: true, color: { argb: "666666" } };

    // ===== FEUILLE 3: Légende =====
    const legendSheet = workbook.addWorksheet("Légende");
    legendSheet.columns = [
      { header: "Type", key: "type", width: 18 },
      { header: "Description", key: "description", width: 55 },
    ];

    const legendHeader = legendSheet.getRow(1);
    legendHeader.font = { bold: true, color: { argb: "FFFFFF" } };
    legendHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };

    const legendData = [
      { type: "Auto Sync", description: "Synchronisation automatique avec Interenchères" },
      { type: "IA", description: "Fonctionnalité IA (coût tokens mensuel estimé en colonne 'IA €')" },
      { type: "Auto", description: "Fonctionnalité automatique du système" },
      { type: "Manuel", description: "Contenu à créer par l'étude et à maintenir" },
      { type: "SEO Local", description: "Contenu SEO local (photos, textes spécifiques)" },
      { type: "SEO 6M", description: "Contenu SEO à enrichir semestriellement" },
    ];

    legendData.forEach((item) => {
      const row = legendSheet.addRow(item);
      if (typeColors[item.type]) {
        row.getCell("type").fill = { type: "pattern", pattern: "solid", fgColor: { argb: typeColors[item.type] } };
      }
    });

    legendSheet.addRow([]);
    legendSheet.addRow(["Colonnes par offre :"]);
    legendSheet.addRow(["✓", "Fonctionnalité incluse"]);
    legendSheet.addRow(["Setup", "Heures d'installation (one-shot)"]);
    legendSheet.addRow(["Maint.", "Heures de maintenance mensuelle"]);
    legendSheet.addRow(["IA €", "Coût tokens IA mensuel estimé (Premium/Sur Mesure)"]);

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "offres-plateforme-encheres-tarifs.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Comparatif des 4 Offres — Tarification
          </h1>
          <p className="text-muted-foreground">
            Heures de setup et maintenance par fonctionnalité, coûts IA inclus
          </p>
        </div>

        {/* Paramètres tarifs */}
        <div className="bg-card rounded-lg border p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Paramètres de tarification</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
            <div>
              <Label htmlFor="tarifSetup">Tarif horaire Setup (€/h HT)</Label>
              <Input
                id="tarifSetup"
                type="number"
                value={tarifSetup}
                onChange={(e) => setTarifSetup(Number(e.target.value))}
                className="mt-1"
                min={1}
              />
            </div>
            <div>
              <Label htmlFor="tarifMaintenance">Tarif horaire Maintenance (€/h HT)</Label>
              <Input
                id="tarifMaintenance"
                type="number"
                value={tarifMaintenance}
                onChange={(e) => setTarifMaintenance(Number(e.target.value))}
                className="mt-1"
                min={1}
              />
            </div>
          </div>
        </div>

        {/* Grille des offres avec tarifs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#FFF2CC] rounded-lg border-2 border-[#E69138] p-4">
            <h3 className="font-bold text-lg mb-1">ESSENTIEL</h3>
            <p className="text-xs text-muted-foreground mb-3">~6 pages, iframe</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Fonctionnalités :</span><span className="font-bold">{totals.essentiel.features}</span></div>
              <div className="flex justify-between"><span>Setup :</span><span className="font-bold">{totals.essentiel.setupH}h</span></div>
              <div className="flex justify-between bg-green-100 rounded px-2 py-1"><span>Tarif Setup :</span><span className="font-bold">{(totals.essentiel.setupH * tarifSetup).toLocaleString("fr-FR")} €</span></div>
              <div className="flex justify-between"><span>Maintenance :</span><span className="font-bold">{totals.essentiel.maintenanceH}h/mois</span></div>
              <div className="flex justify-between bg-amber-100 rounded px-2 py-1"><span>Tarif/mois :</span><span className="font-bold">{(totals.essentiel.maintenanceH * tarifMaintenance).toLocaleString("fr-FR")} €</span></div>
            </div>
          </div>
          
          <div className="bg-[#D9EAD3] rounded-lg border-2 border-[#6AA84F] p-4">
            <h3 className="font-bold text-lg mb-1">STANDARD</h3>
            <p className="text-xs text-muted-foreground mb-3">~15-20 pages, espace client</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Fonctionnalités :</span><span className="font-bold">{totals.standard.features}</span></div>
              <div className="flex justify-between"><span>Setup :</span><span className="font-bold">{totals.standard.setupH}h</span></div>
              <div className="flex justify-between bg-green-100 rounded px-2 py-1"><span>Tarif Setup :</span><span className="font-bold">{(totals.standard.setupH * tarifSetup).toLocaleString("fr-FR")} €</span></div>
              <div className="flex justify-between"><span>Maintenance :</span><span className="font-bold">{totals.standard.maintenanceH.toFixed(1)}h/mois</span></div>
              <div className="flex justify-between bg-amber-100 rounded px-2 py-1"><span>Tarif/mois :</span><span className="font-bold">{(totals.standard.maintenanceH * tarifMaintenance).toLocaleString("fr-FR")} €</span></div>
            </div>
          </div>
          
          <div className="bg-[#CFE2F3] rounded-lg border-2 border-[#3D85C6] p-4">
            <h3 className="font-bold text-lg mb-1">PREMIUM</h3>
            <p className="text-xs text-muted-foreground mb-3">~35-40 pages, IA</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Fonctionnalités :</span><span className="font-bold">{totals.premium.features}</span></div>
              <div className="flex justify-between"><span>Setup :</span><span className="font-bold">{totals.premium.setupH}h</span></div>
              <div className="flex justify-between bg-green-100 rounded px-2 py-1"><span>Tarif Setup :</span><span className="font-bold">{(totals.premium.setupH * tarifSetup).toLocaleString("fr-FR")} €</span></div>
              <div className="flex justify-between"><span>Maintenance :</span><span className="font-bold">{totals.premium.maintenanceH.toFixed(1)}h/mois</span></div>
              <div className="flex justify-between bg-amber-100 rounded px-2 py-1"><span>Tarif/mois :</span><span className="font-bold">{(totals.premium.maintenanceH * tarifMaintenance).toLocaleString("fr-FR")} €</span></div>
              <div className="flex justify-between bg-purple-100 rounded px-2 py-1"><span>Coût IA/mois :</span><span className="font-bold">{totals.premium.iaTokensCost} €</span></div>
            </div>
          </div>
          
          <div className="bg-[#E6D5E9] rounded-lg border-2 border-[#8E7CC3] p-4">
            <h3 className="font-bold text-lg mb-1">SUR MESURE</h3>
            <p className="text-xs text-muted-foreground mb-3">Personnalisation complète</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Fonctionnalités :</span><span className="font-bold">{totals.surMesure.features}</span></div>
              <div className="flex justify-between"><span>Setup :</span><span className="font-bold">{totals.surMesure.setupH}h</span></div>
              <div className="flex justify-between bg-green-100 rounded px-2 py-1"><span>Tarif Setup :</span><span className="font-bold">{(totals.surMesure.setupH * tarifSetup).toLocaleString("fr-FR")} €</span></div>
              <div className="flex justify-between"><span>Maintenance :</span><span className="font-bold">{totals.surMesure.maintenanceH.toFixed(1)}h/mois</span></div>
              <div className="flex justify-between bg-amber-100 rounded px-2 py-1"><span>Tarif/mois :</span><span className="font-bold">{(totals.surMesure.maintenanceH * tarifMaintenance).toLocaleString("fr-FR")} €</span></div>
              <div className="flex justify-between bg-purple-100 rounded px-2 py-1"><span>Coût IA/mois :</span><span className="font-bold">{totals.surMesure.iaTokensCost} €</span></div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Contenu du fichier Excel</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className="font-medium mb-2">Feuille 1 : Comparatif Détaillé</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Toutes les fonctionnalités ligne par ligne</li>
                <li>• 3-4 colonnes par offre : ✓ / Setup H / Maint. H / IA €</li>
                <li>• Totaux, tarifs et coûts IA en bas</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Feuille 2 : Synthèse Tarification</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Récapitulatif par offre</li>
                <li>• Tarifs Setup + Maintenance + IA</li>
                <li>• Total mensuel calculé</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Feuille 3 : Légende</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Types de fonctionnalités</li>
                <li>• Explication des colonnes</li>
              </ul>
            </div>
          </div>

          <Button onClick={generateExcel} size="lg" className="gap-2">
            <Download className="h-5 w-5" />
            Télécharger le comparatif Excel avec tarifs
          </Button>
        </div>

        <div className="bg-muted/50 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Total :</strong> {features.length} fonctionnalités analysées<br />
            <strong>Note :</strong> Les coûts IA sont basés sur un volume d'utilisation mensuel moyen estimé. Les heures "Sur Mesure" peuvent varier selon les personnalisations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportOffres;
