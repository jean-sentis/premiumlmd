// Module partagé : prompts de l'analyse de lot + jeux de tests + juge qualité.
// Importé par index.ts (fonction déployée) et index.test.ts (suite de tests).

export interface LotInput {
  title: string;
  description?: string | null;
  dimensions?: string | null;
}

export interface AnalysisResult {
  explanation: string;
  creator_info: string | null;
}

// ---------------------------------------------------------------------------
// PROMPT DE GÉNÉRATION
// ---------------------------------------------------------------------------

export const SYSTEM_PROMPT = `Tu es un expert généraliste en art, antiquités et objets de collection, au service d'une maison de ventes aux enchères. Tu écris pour aider un acheteur potentiel à comprendre, apprécier et se projeter sur le lot qu'il consulte.

MISSION
Produire une fiche claire, vivante et fiable à partir des seules informations fournies (titre, description, dimensions). Tu peux mobiliser tes connaissances générales sur les techniques, styles, époques et créateurs, mais tu ne dois JAMAIS inventer de faits spécifiques au lot.

1) EXPLICATION (champ "explanation") — EXACTEMENT DEUX PARAGRAPHES

PARAGRAPHE 1 — VALEUR AJOUTÉE sur l'objet lui-même.
Ce paragraphe doit APPORTER quelque chose que la description ne dit PAS. Ne paraphrase jamais, ne répète jamais, ne reformule jamais ce qui figure déjà dans la description fournie : le lecteur l'a déjà sous les yeux. Interdiction de recopier ou de reformuler les éléments déjà donnés (titre, matériau, dimensions, décor, signature déjà mentionnée) ; ne les cite que si c'est strictement nécessaire pour introduire une information NOUVELLE. Apporte un éclairage complémentaire : ce que l'objet révèle sur sa fonction et son usage réel, la technique ou le savoir-faire de fabrication qu'il suppose, ce qui le rend remarquable, rare ou intéressant pour un amateur, les points d'attention ou de lecture qu'un œil averti remarquerait. Si la description est déjà très complète, va plus loin encore dans l'analyse plutôt que de résumer. Reste prudent sur les hypothèses (« probablement », « dans le goût de », « style… ») et n'invente aucun fait spécifique au lot.

PARAGRAPHE 2 — CONTEXTE autour du lot.
Deux cas :
- Si un auteur, un artiste, un artisan, un créateur, un fabricant, un atelier ou une manufacture est mentionné ou clairement déductible : donne des éléments biographiques et historiques sur cette personne ou cet établissement (dates, lieux, spécialité, production, réputation) permettant de situer et d'apprécier le lot.
- S'il n'y a rien de tout cela : relie l'objet aux mouvements, courants ou ensembles auxquels il ressemble ou appartient — qu'ils soient artistiques, industriels, politiques ou historiques — pour lui donner un cadre et une profondeur.
Reste factuel et prudent ; n'invente aucune attribution non suggérée par le lot.

SÉPARATION DES PARAGRAPHES
Sépare IMPÉRATIVEMENT le paragraphe 1 et le paragraphe 2 par une ligne vide (deux sauts de ligne « \n\n »). Ne colle jamais les deux paragraphes l'un à l'autre.

2) INFOS SUR LE CRÉATEUR (champ "creator_info")
Si un artiste, un artisan, un atelier, une manufacture, une maison ou un lieu de production identifiable est mentionné (ou clairement déductible) dans le lot, fournis une véritable notice biographique/historique : dates et lieux, formation ou origine, mouvement ou spécialité, œuvres ou productions marquantes, cote et réputation, éléments permettant de situer et valoriser le lot. Sois aussi complet que tes connaissances le permettent.
Si aucun créateur n'est identifiable, retourne null. N'invente jamais un auteur qui n'est pas suggéré par le lot.

RÈGLES DE FIABILITÉ
- N'invente aucune date, provenance, signature, mesure ou attribution absente des données fournies.
- Distingue toujours ce qui est certain (indiqué dans le lot) de ce qui est une hypothèse (tes déductions), en le signalant clairement.
- Reste factuel et sobre : pas de superlatifs commerciaux ni d'estimation de prix.

FORMAT
Réponds exclusivement en français. Explication : EXACTEMENT 2 paragraphes séparés par une ligne vide (« \n\n ») — (1) valeur ajoutée sur l'objet sans paraphraser la description ; (2) contexte biographique du créateur ou rattachement à des mouvements. Notice créateur : 1 à 2 paragraphes. Prose fluide, sans listes ni markdown dans les valeurs renvoyées.`;

export function buildUserPrompt(lot: LotInput): string {
  return `Analyse le lot suivant et aide-moi à le comprendre en respectant strictement les données ci-dessous (n'ajoute aucun fait non fourni) :

Titre : "${lot.title}"
${lot.description ? `Description : "${lot.description}"` : 'Description : (aucune description fournie — appuie-toi uniquement sur le titre et sois prudent)'}
${lot.dimensions ? `Dimensions : "${lot.dimensions}"` : ''}

Rédige l'explication en EXACTEMENT 2 paragraphes séparés par une ligne vide (deux sauts de ligne) : (1) une valeur ajoutée sur l'objet qui NE répète PAS et NE paraphrase PAS la description ci-dessus ; (2) le contexte autour du lot (éléments biographiques du créateur/fabricant si identifiable, sinon rattachement à des mouvements artistiques, industriels, politiques ou historiques). Puis, si et seulement si un créateur est identifiable, remplis sa notice biographique. Sinon, laisse la notice à null.`;
}

export const ANALYZE_LOT_TOOL = {
  type: 'function',
  function: {
    name: 'analyze_lot',
    description: 'Fournit une explication du lot et des informations sur le créateur',
    parameters: {
      type: 'object',
      properties: {
        explanation: {
          type: 'string',
          description: "Explication grand public en français en EXACTEMENT 2 paragraphes SÉPARÉS PAR UNE LIGNE VIDE (deux sauts de ligne \\n\\n). Paragraphe 1 : valeur ajoutée sur l'objet, sans paraphraser ni répéter la description fournie (usage réel, technique/savoir-faire, ce qui le rend remarquable). Paragraphe 2 : contexte autour du lot — éléments biographiques du créateur/artisan/fabricant si identifiable, sinon rattachement à des mouvements artistiques, industriels, politiques ou historiques. Aucun fait inventé, aucune estimation de prix.",
        },
        creator_info: {
          type: 'string',
          description: "Notice biographique/historique en français (1-2 paragraphes) du créateur identifiable (artiste, atelier, manufacture, maison), ou null si aucun créateur n'est identifiable. Ne jamais inventer d'auteur.",
          nullable: true,
        },
      },
      required: ['explanation'],
      additionalProperties: false,
    },
  },
} as const;

// ---------------------------------------------------------------------------
// JUGE QUALITÉ (LLM-as-judge)
// ---------------------------------------------------------------------------

export interface JudgeVerdict {
  has_two_paragraphs: boolean;
  p1_adds_value: boolean;
  p1_not_paraphrase: boolean;
  p2_is_context: boolean;
  creator_info_consistent: boolean;
  no_invented_facts: boolean;
  no_price_estimate: boolean;
  overall_pass: boolean;
  reasons: string;
}

export const JUDGE_SYSTEM_PROMPT = `Tu es un évaluateur qualité rigoureux et impartial pour une maison de ventes aux enchères. On te fournit les données brutes d'un lot (titre, description, dimensions) et une ANALYSE générée automatiquement (un champ "explanation" censé contenir 2 paragraphes, et un champ "creator_info" optionnel).

Ta mission : vérifier objectivement que l'analyse respecte les règles suivantes. Sois strict mais juste. Base-toi UNIQUEMENT sur les textes fournis.

RÈGLES À VÉRIFIER :
1. has_two_paragraphs : "explanation" contient exactement deux paragraphes distincts.
2. p1_adds_value : le 1er paragraphe apporte une réelle valeur ajoutée (usage réel, technique/savoir-faire, intérêt pour l'amateur, points d'attention) au-delà de ce que dit déjà la description.
3. p1_not_paraphrase : le 1er paragraphe ne se contente PAS de paraphraser, reformuler ou répéter la description fournie. Si l'essentiel du paragraphe redit ce que la description dit déjà, c'est FAUX.
4. p2_is_context : le 2e paragraphe donne le CONTEXTE autour du lot — soit des éléments biographiques/historiques du créateur, artisan, fabricant ou manufacture, soit (à défaut) un rattachement à des mouvements artistiques, industriels, politiques ou historiques.
5. creator_info_consistent : si un créateur/fabricant identifiable est mentionné dans le lot, "creator_info" est renseigné ; sinon "creator_info" est null (pas d'auteur inventé).
6. no_invented_facts : l'analyse n'invente AUCUN fait spécifique au lot absent des données fournies (date précise, provenance, signature, dimensions, attribution catégorique). Les connaissances générales sur un créateur réel nommé dans le lot, ou les hypothèses clairement prudentes ("probablement", "dans le goût de", "style…"), sont autorisées.
7. no_price_estimate : aucune estimation de prix ni de valeur monétaire.

overall_pass = true UNIQUEMENT si toutes les règles ci-dessus sont respectées.
Dans "reasons", explique brièvement (2-4 phrases) chaque violation éventuelle.`;

export function buildJudgeUserPrompt(lot: LotInput, analysis: AnalysisResult): string {
  return `DONNÉES BRUTES DU LOT
Titre : "${lot.title}"
Description : ${lot.description ? `"${lot.description}"` : '(aucune)'}
Dimensions : ${lot.dimensions ? `"${lot.dimensions}"` : '(aucune)'}

ANALYSE GÉNÉRÉE À ÉVALUER
--- explanation ---
${analysis.explanation}
--- creator_info ---
${analysis.creator_info ?? '(null)'}

Évalue cette analyse au regard des 7 règles et rends ton verdict.`;
}

export const JUDGE_TOOL = {
  type: 'function',
  function: {
    name: 'submit_verdict',
    description: "Rend le verdict d'évaluation qualité de l'analyse du lot",
    parameters: {
      type: 'object',
      properties: {
        has_two_paragraphs: { type: 'boolean', description: 'explanation contient exactement 2 paragraphes' },
        p1_adds_value: { type: 'boolean', description: 'le 1er paragraphe apporte une valeur ajoutée' },
        p1_not_paraphrase: { type: 'boolean', description: 'le 1er paragraphe ne paraphrase pas la description' },
        p2_is_context: { type: 'boolean', description: 'le 2e paragraphe donne le contexte (biographie ou mouvements)' },
        creator_info_consistent: { type: 'boolean', description: 'creator_info cohérent (renseigné si créateur identifiable, sinon null)' },
        no_invented_facts: { type: 'boolean', description: "aucun fait spécifique inventé" },
        no_price_estimate: { type: 'boolean', description: 'aucune estimation de prix' },
        overall_pass: { type: 'boolean', description: 'toutes les règles respectées' },
        reasons: { type: 'string', description: 'explication concise des éventuelles violations' },
      },
      required: [
        'has_two_paragraphs', 'p1_adds_value', 'p1_not_paraphrase', 'p2_is_context',
        'creator_info_consistent', 'no_invented_facts', 'no_price_estimate', 'overall_pass', 'reasons',
      ],
      additionalProperties: false,
    },
  },
} as const;

// ---------------------------------------------------------------------------
// JEUX DE TESTS : lots exemples couvrant les cas clés
// ---------------------------------------------------------------------------

export interface ExampleLot {
  id: string;
  lot: LotInput;
  // Attentes spécifiques au cas
  expectCreatorInfo: boolean; // creator_info doit-il être renseigné ?
  note: string;
}

export const EXAMPLE_LOTS: ExampleLot[] = [
  {
    id: 'artiste-nomme',
    lot: {
      title: 'Huile sur toile signée Bernard Buffet, paysage de Provence',
      description: "Tableau représentant un paysage provençal aux tons vifs, signé en bas à droite. Cadre en bois doré.",
      dimensions: '50 x 65 cm',
    },
    expectCreatorInfo: true,
    note: 'Artiste réel nommé → biographie attendue au §2 et dans creator_info',
  },
  {
    id: 'manufacture-nommee',
    lot: {
      title: 'Assiette en porcelaine de Sèvres à décor floral polychrome',
      description: "Assiette en porcelaine à décor polychrome de fleurs, filet doré sur l'aile, marque au revers.",
      dimensions: 'Diam. 24 cm',
    },
    expectCreatorInfo: true,
    note: 'Manufacture identifiable → historique de la manufacture attendu',
  },
  {
    id: 'objet-industriel-anonyme',
    lot: {
      title: "Lampe d'atelier articulée en métal laqué noir",
      description: "Lampe de bureau articulée en métal laqué noir, abat-jour conique, vers 1950.",
      dimensions: 'H. 90 cm',
    },
    expectCreatorInfo: false,
    note: 'Aucun créateur → rattachement à un mouvement (design industriel) attendu au §2, creator_info null',
  },
  {
    id: 'ethnographie-anonyme',
    lot: {
      title: 'Masque de danse africain en bois sculpté et patiné',
      description: "Masque de danse en bois sculpté, patine d'usage, Afrique de l'Ouest.",
      dimensions: 'H. 32 cm',
    },
    expectCreatorInfo: false,
    note: 'Objet ethnographique anonyme → rattachement à un contexte culturel/historique, creator_info null',
  },
  {
    id: 'description-minimale',
    lot: {
      title: "Montre de gousset en argent, cadran émaillé",
      description: null,
      dimensions: null,
    },
    expectCreatorInfo: false,
    note: 'Description absente → prudence maximale, aucune invention, creator_info null',
  },
];
