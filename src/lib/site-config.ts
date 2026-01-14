/**
 * =====================================================
 * CONFIGURATION CENTRALE DU SITE
 * =====================================================
 * 
 * CONSIGNE IMPORTANTE :
 * ---------------------
 * Ce fichier contient toutes les informations susceptibles de devenir obsolètes.
 * NE JAMAIS écrire de dates, années, ou informations temporelles en dur dans les composants.
 * Toujours utiliser les constantes de ce fichier.
 * 
 * À METTRE À JOUR RÉGULIÈREMENT :
 * - L'année en cours (CURRENT_YEAR)
 * - Les jours fériés (JOURS_FERIES)
 * - La date de démonstration si le site est en mode démo
 * 
 * =====================================================
 */

// Date actuelle du site (mode démo : 3 janvier 2026)
// Cette date de base est utilisée pour définir le jour de démo
const DEMO_DATE_BASE = new Date('2026-01-03');

// Fonction pour obtenir la date de démo avec l'heure réelle actuelle
export const getDemoNow = (): Date => {
  const realNow = new Date();
  return new Date(
    2026, // année de démo
    0,    // janvier (0-indexed)
    3,    // jour 3
    realNow.getHours(),
    realNow.getMinutes(),
    realNow.getSeconds(),
    realNow.getMilliseconds()
  );
};

// Pour compatibilité avec le code existant
export const DEMO_DATE = DEMO_DATE_BASE;

// Année courante pour les copyrights et affichages
export const CURRENT_YEAR = 2026;

// Coordonnées de l'entreprise (SOURCE UNIQUE - à utiliser partout)
export const COMPANY_INFO = {
  name: "Douze pages & associés",
  tagline: "Maison de ventes aux enchères",
  address: {
    street: "12 boulevard Albert 1er",
    city: "Ajaccio",
    postalCode: "20000",
    country: "Corse",
    full: "12 boulevard Albert 1er, 20000 Ajaccio"
  },
  phone: "04 95 12 12 12",
  phoneLink: "tel:+33495121212",
  email: "jean@lemarteaudigital.fr",
  emailLink: "mailto:jean@lemarteaudigital.fr"
};

// Lieu par défaut pour les ventes (à utiliser quand location est null/vide)
export const DEFAULT_SALE_LOCATION = `Hôtel des ventes d'Ajaccio — ${COMPANY_INFO.address.full}`;

// Horaires d'ouverture
export const OPENING_HOURS = {
  summary: "Lun — Ven : 9h-12h / 14h-18h",
  saturday: "Sam : sur rendez-vous",
  weekdays: "Du lundi au vendredi",
  morning: "9h - 12h",
  afternoon: "14h - 18h",
  estimations: {
    day: "Lundi",
    time: "9h - 12h",
    note: "Sans rendez-vous"
  }
};

// Réseaux sociaux
export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/12pages",
  facebook: "https://facebook.com/12pages",
  pinterest: "https://pinterest.com/12pages",
  youtube: "https://youtube.com/@12pages",
  linkedin: "https://linkedin.com/company/12pages",
  twitter: "https://x.com/12pages"
};

// Jours fériés français (à mettre à jour chaque année)
// Format: YYYY-MM-DD
export const JOURS_FERIES: Record<number, string[]> = {
  2026: [
    "2026-01-01", // Jour de l'an
    "2026-04-06", // Lundi de Pâques
    "2026-05-01", // Fête du Travail
    "2026-05-08", // Victoire 1945
    "2026-05-14", // Ascension
    "2026-05-25", // Lundi de Pentecôte
    "2026-07-14", // Fête Nationale
    "2026-08-15", // Assomption
    "2026-11-01", // Toussaint
    "2026-11-11", // Armistice
    "2026-12-25", // Noël
  ],
  2027: [
    "2027-01-01", // Jour de l'an
    "2027-03-29", // Lundi de Pâques
    "2027-05-01", // Fête du Travail
    "2027-05-08", // Victoire 1945
    "2027-05-06", // Ascension
    "2027-05-17", // Lundi de Pentecôte
    "2027-07-14", // Fête Nationale
    "2027-08-15", // Assomption (dimanche)
    "2027-11-01", // Toussaint
    "2027-11-11", // Armistice
    "2027-12-25", // Noël
  ]
};

/**
 * Vérifie si une date est un jour férié
 */
export const isJourFerie = (date: Date): boolean => {
  const year = date.getFullYear();
  const dateStr = date.toISOString().split('T')[0];
  const holidays = JOURS_FERIES[year] || [];
  return holidays.includes(dateStr);
};
