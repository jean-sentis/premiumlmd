/**
 * RÈGLES DE DIRECTION ARTISTIQUE - VERROUILLÉES
 * =============================================
 * 
 * CE FICHIER CONTIENT LES DÉCISIONS DA VALIDÉES PAR LE CLIENT.
 * NE PAS MODIFIER SANS DEMANDE EXPLICITE DU CLIENT.
 * 
 * Dernière mise à jour : 11/01/2026
 */

// =============================================================================
// TYPESCALE - ÉCHELLE COHÉRENTE & ACCESSIBLE
// =============================================================================
// Toutes les tailles sont définies dans index.css @layer base
// Ce fichier documente les classes à utiliser pour garantir la cohérence

export const TYPESCALE = {
  // H1 - Titre principal de page (1 seul par page)
  h1: {
    description: 'Titre principal de page',
    mobile: '28px (1.75rem)',
    desktop: '36px (2.25rem)',
    weight: 'font-semibold',
    font: 'font-serif',
    tracking: 'tracking-tight',
    // Classes additionnelles si besoin d'override
    override: 'text-[1.75rem] md:text-[2.25rem] font-serif font-semibold tracking-tight leading-tight',
  },
  
  // H2 - Sections principales
  h2: {
    description: 'Titre de section',
    mobile: '22px (1.375rem)',
    desktop: '26px (1.625rem)',
    weight: 'font-semibold',
    font: 'font-serif',
    override: 'text-[1.375rem] md:text-[1.625rem] font-serif font-semibold leading-snug',
  },
  
  // H3 - Sous-sections
  h3: {
    description: 'Sous-titre de section',
    mobile: '18px (1.125rem)',
    desktop: '20px (1.25rem)',
    weight: 'font-medium',
    font: 'font-serif',
    override: 'text-lg md:text-xl font-serif font-medium',
  },
  
  // H4 - Petits titres (cartes, items)
  h4: {
    description: 'Titre de carte ou item',
    mobile: '16px (1rem)',
    desktop: '18px (1.125rem)',
    weight: 'font-semibold',
    font: 'font-sans',
    override: 'text-base md:text-lg font-sans font-semibold',
  },
  
  // H5/H6 - Labels et légendes (UPPERCASE)
  h5: {
    description: 'Label uppercase',
    size: '14px (0.875rem)',
    weight: 'font-medium',
    font: 'font-sans',
    tracking: 'tracking-wider uppercase',
    override: 'text-sm font-sans font-medium tracking-wider uppercase',
  },
  
  // Corps de texte
  body: {
    description: 'Paragraphe standard',
    size: '16px (1rem)',
    lineHeight: '1.6',
    min: '14px - jamais en dessous',
  },
  
  // Petits textes (légendes, metadata)
  small: {
    description: 'Texte secondaire',
    size: '14px (0.875rem)',
    class: 'text-sm',
  },
} as const;

// Classes utilitaires pour uniformiser
export const HEADING_CLASSES = {
  // Page title - utilisé pour le H1 principal
  pageTitle: 'font-serif font-semibold tracking-tight',
  
  // Section title - H2 avec ornements dorés
  sectionTitle: 'section-title', // défini dans index.css
  
  // Card title - H4 pour les cartes
  cardTitle: 'font-sans font-semibold text-base md:text-lg',
  
  // Label - H5/H6 uppercase
  label: 'font-sans font-medium text-sm tracking-wider uppercase',
} as const;

// =============================================================================
// SOUS-MENU SPÉCIALITÉS (Header)
// =============================================================================
// Tailles fixées le 27/12/2024 - Scale 1.25x

export const SPECIALITES_MENU = {
  // Images des spécialités
  imageSize: {
    width: 80,   // px
    height: 80,  // px
    class: 'w-[80px] h-[80px]',
  },
  // Labels sous les images
  label: {
    fontSize: 11,      // px
    maxWidth: 100,     // px
    class: 'text-[11px] max-w-[100px]',
  },
  // Espacement entre items
  gap: 'gap-4',
  // Padding du container
  containerPadding: 'py-2.5',
} as const;

// =============================================================================
// OMBRES - EFFET RELIEF CARTES
// =============================================================================
// Effet inspiré du logo HDV Avignon : lumière en haut à droite → ombre en bas à gauche
// Donne une impression d'épaisseur/relief aux cartes

export const CARD_SHADOW = {
  // Ombre par défaut (foreground neutre)
  default: 'card-shadow',
  // Ombres colorées par spécialité
  colored: {
    'bijoux': 'card-shadow-gold',           // Or/doré
    'art-moderne': 'card-shadow-blue',       // Bleu profond
    'vehicules': 'card-shadow-jaguar',       // Vert Jaguar (British Racing Green)
    'vins': 'card-shadow-wine',              // Pourpre/lie de vin
    'mobilier': 'card-shadow-emerald',       // Vert émeraude
    'collections': 'card-shadow-copper',     // Orange cuivre
    'militaria': 'card-shadow-kaki',         // Vert kaki
    'argenterie': 'card-shadow-silver',      // Argenté
  },
} as const;

// Mapping spécialité DB → clé couleur
export const SPECIALTY_TO_SHADOW: Record<string, keyof typeof CARD_SHADOW.colored> = {
  'Bijoux & Montres': 'bijoux',
  'Art Moderne & Contemporain': 'art-moderne',
  'Véhicules de collection': 'vehicules',
  'Vins & Spiritueux': 'vins',
  'Mobilier & Objets d\'art': 'mobilier',
  'Collections': 'collections',
  'Militaria': 'militaria',
  'Argenterie': 'argenterie',
};

/**
 * Retourne la classe d'ombre colorée selon la spécialité
 */
export function getSpecialtyShadowClass(specialty?: string | null): string {
  if (!specialty) return CARD_SHADOW.default;
  const key = SPECIALTY_TO_SHADOW[specialty];
  if (key) return CARD_SHADOW.colored[key];
  return CARD_SHADOW.default;
}

// =============================================================================
// HISTORIQUE DES DÉCISIONS
// =============================================================================
/**
 * 11/01/2026 - TYPESCALE COHÉRENTE & ACCESSIBLE
 *   → Fonts locales : Inter (sans) + Playfair Display (serif)
 *   → Fichiers .woff2 dans /public/fonts/
 *   → Échelle typographique définie dans index.css @layer base :
 *     - H1 : 28px mobile / 36px desktop (font-serif, font-semibold)
 *     - H2 : 22px mobile / 26px desktop (font-serif, font-semibold)
 *     - H3 : 18px mobile / 20px desktop (font-serif, font-medium)
 *     - H4 : 16px mobile / 18px desktop (font-sans, font-semibold)
 *     - H5/H6 : 14px (font-sans, uppercase, tracking-wider)
 *     - Body : 16px minimum, line-height 1.6
 *     - Small : 14px minimum (jamais en dessous)
 *   → Classes utilitaires : .section-title, .frame-title
 *   → Suppression des overrides inline sur les headings
 * 
 * 29/12/2024 - Taille minimum textes
 *   → Aucun texte plus petit que text-xs md:text-sm (12px / 14px)
 *   → Tous les text-[10px], text-[11px] remplacés par text-xs md:text-sm
 *   → Marge minimum 15px au-dessus du planning (InlinePlanningSlot)
 * 
 * 27/12/2024 - Sous-menu Spécialités
 *   → Images : 80x80px (augmenté de 25% depuis 64x64)
 *   → Labels : 11px, max-width 100px
 *   → Ne plus modifier sans demande explicite
 * 
 * 27/12/2024 - Ombre cartes (effet relief)
 *   → Lumière haut-droite → ombre bas-gauche
 *   → Ombres colorées par spécialité :
 *     - Bijoux & Montres : Or/doré
 *     - Art Moderne : Bleu profond
 *     - Véhicules de collection : Vert Jaguar
 *     - Vins & Spiritueux : Pourpre/lie de vin
 *     - Mobilier : Vert émeraude
 *     - Collections : Orange cuivre
 *     - Militaria : Vert kaki
 *     - Argenterie : Argenté
 */
