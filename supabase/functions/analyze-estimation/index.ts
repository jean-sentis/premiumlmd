import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Step 1: Ask Gemini for a visual description + search terms ──
async function extractVisualSearchTerms(
  photoUrls: string[],
  supabaseUrl: string,
  lovableApiKey: string,
  userDescription?: string,
): Promise<{ description: string; searchTerms: string[] }> {
  const imageContent: any[] = [];
  for (const url of photoUrls) {
    const fullUrl = url.startsWith("http") ? url : `${supabaseUrl}/storage/v1/object/public/${url}`;
    imageContent.push({ type: "image_url", image_url: { url: fullUrl } });
  }

  // Include user description context if available
  const userContext = userDescription
    ? `\n\nLe propriétaire a fourni cette description : "${userDescription}"\nTiens-en compte pour affiner les termes de recherche (noms propres, signatures mentionnées, artistes, matériaux, époques, etc.).`
    : "";

  const messages = [
    {
      role: "system",
      content: `Tu es un expert en art et antiquités. Analyse les photos et produis un JSON avec :
- "description" : description visuelle factuelle de l'objet (type, style, matériaux, signatures/poinçons visibles, époque probable). 3-4 phrases maximum.
- "searchTerms" : un tableau de 3 à 5 termes de recherche web pertinents pour identifier cet objet ou trouver des objets similaires sur des sites d'enchères. Chaque terme doit être une combinaison utile (ex: "vase art nouveau Gallé", "pendule bronze Empire", "huile sur toile paysage Barbizon"). Inclus des variantes si pertinent (nom d'artiste potentiel, technique, style).
- Si le propriétaire mentionne un nom d'artiste, une signature ou un poinçon, INCLURE ce nom dans les termes de recherche même si tu ne le reconnais pas visuellement.

Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.`,
    },
    {
      role: "user",
      content: [
        { type: "text", text: `Analyse ces photos et génère les termes de recherche :${userContext}` },
        ...imageContent,
      ],
    },
  ];

  console.log("[analyze-estimation] Step 1: Extracting visual search terms...");
  if (userDescription) {
    console.log("[analyze-estimation] Step 1: Including user description context");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[analyze-estimation] Step 1 failed:", response.status, errText);
    return { description: "", searchTerms: [] };
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "";

  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    console.log("[analyze-estimation] Step 1 result:", parsed.searchTerms);
    return {
      description: parsed.description || "",
      searchTerms: Array.isArray(parsed.searchTerms) ? parsed.searchTerms : [],
    };
  } catch {
    console.error("[analyze-estimation] Step 1 JSON parse failed, attempting repair. Raw:", raw.substring(0, 300));

    // Attempt to repair common JSON issues (unescaped quotes inside strings)
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const descMatch = cleaned.match(/"description"\s*:\s*"([\s\S]*?)"\s*,\s*"searchTerms"/);
      const termsMatch = cleaned.match(/"searchTerms"\s*:\s*\[([\s\S]*?)\]/);

      const description = descMatch ? descMatch[1].replace(/"/g, '\\\\"').replace(/\\\\\\"/g, '\\\\"') : "";
      let searchTerms: string[] = [];

      if (termsMatch) {
        const termMatches = termsMatch[1].match(/"([^"]+)"/g);
        if (termMatches) {
          searchTerms = termMatches.map(t => t.replace(/^"|"$/g, ""));
        }
      }

      if (searchTerms.length > 0) {
        console.log("[analyze-estimation] Step 1 repaired successfully:", searchTerms);
        return { description, searchTerms };
      }
    } catch (repairErr) {
      console.error("[analyze-estimation] Step 1 repair also failed:", repairErr);
    }

    // Final fallback: extract useful terms from raw text
    console.log("[analyze-estimation] Step 1 using text extraction fallback");
    const fallbackTerms: string[] = [];

    const quotedNames = raw.match(/(?:signé|signature|marqué|inscrit)\s*[«\"']?\s*([A-ZÀ-Ü][A-Za-zà-ü\s-]{2,30})/gi) || [];
    for (const match of quotedNames) {
      const name = match.replace(/^(?:signé|signature|marqué|inscrit)\s*[«\"']?\s*/i, "").trim();
      if (name.length >= 3) {
        fallbackTerms.push(`${name} artiste peintre`);
        fallbackTerms.push(`${name} enchères estimation`);
      }
    }

    const properNames = raw.match(/[A-ZÀ-Ü]{2,}[A-Za-zà-ü]*/g) || [];
    const stopWords = new Set(["JSON", "UNIQUEMENT", "IMPORTANT", "NOTE", "MAX", "ATTENTION", "URL", "HTTP", "HTTPS", "EUR"]);
    for (const name of properNames) {
      if (name.length >= 4 && !stopWords.has(name)) {
        fallbackTerms.push(`${name} artiste enchères`);
      }
    }

    const termPatterns = raw.match(/"([^"]{5,60})"/g) || [];
    for (const t of termPatterns.slice(0, 5)) {
      const cleaned = t.replace(/^"|"$/g, "");
      if (cleaned.length >= 5 && !cleaned.includes("{") && !cleaned.includes(":")) {
        fallbackTerms.push(cleaned);
      }
    }

    const uniqueTerms = [...new Set(fallbackTerms)].slice(0, 5);
    console.log("[analyze-estimation] Step 1 fallback terms:", uniqueTerms);

    return { description: raw.substring(0, 500), searchTerms: uniqueTerms };
  }
}

// ── Step 1b: SerpAPI Google Lens (reverse image search) ──
interface LensResult {
  bestGuessLabels: string[];
  visualMatches: Array<{ title: string; link: string; source: string; thumbnail?: string; price?: string }>;
  searchTermsFromLens: string[];
}

async function runGoogleLens(
  photoUrls: string[],
  supabaseUrl: string,
  serpApiKey: string,
): Promise<LensResult> {
  const result: LensResult = {
    bestGuessLabels: [],
    visualMatches: [],
    searchTermsFromLens: [],
  };

  const imageUrl = photoUrls[0].startsWith("http")
    ? photoUrls[0]
    : `${supabaseUrl}/storage/v1/object/public/${photoUrls[0]}`;

  console.log("[analyze-estimation] Step 1b: Running SerpAPI Google Lens on", imageUrl);

  try {
    const params = new URLSearchParams({
      engine: "google_lens",
      url: imageUrl,
      api_key: serpApiKey,
      hl: "fr",
      country: "fr",
      safe: "off",
    });

    const response = await fetch(`https://serpapi.com/search?${params.toString()}`);

    if (!response.ok) {
      const errText = await response.text();
      console.error("[analyze-estimation] SerpAPI error:", response.status, errText);
      return result;
    }

    const data = await response.json();

    if (data.knowledge_graph) {
      const kg = data.knowledge_graph;
      if (kg.title) {
        result.bestGuessLabels.push(kg.title);
        result.searchTermsFromLens.push(kg.title);
      }
      if (kg.subtitle) {
        result.bestGuessLabels.push(kg.subtitle);
      }
    }

    const visualMatches = data.visual_matches || [];
    const seenTitles = new Set<string>();

    for (const match of visualMatches.slice(0, 15)) {
      const title = match.title || "";
      if (title && !seenTitles.has(title)) {
        seenTitles.add(title);
        result.visualMatches.push({
          title,
          link: match.link || "",
          source: match.source || "",
          thumbnail: match.thumbnail || "",
          price: match.price?.extracted_value ? `${match.price.extracted_value} ${match.price.currency || "€"}` : undefined,
        });
      }

      if (result.searchTermsFromLens.length < 5 && title.length > 5) {
        result.searchTermsFromLens.push(title);
      }
    }

    if (data.text_results) {
      for (const tr of data.text_results.slice(0, 3)) {
        if (tr.text && !result.bestGuessLabels.includes(tr.text)) {
          result.bestGuessLabels.push(tr.text);
        }
      }
    }

    console.log("[analyze-estimation] Google Lens results:",
      result.bestGuessLabels.length, "labels,",
      result.visualMatches.length, "visual matches,",
      result.searchTermsFromLens.length, "search terms",
    );

    for (const vm of result.visualMatches.slice(0, 3)) {
      console.log(`  → "${vm.title}" (${vm.source}) ${vm.price || ""}`);
    }
  } catch (err) {
    console.error("[analyze-estimation] SerpAPI exception:", err);
  }

  return result;
}

// ── Step 2: Search the web using SerpAPI Google Search ──
async function searchWebReferences(
  searchTerms: string[],
  serpApiKey: string,
): Promise<Array<{ title: string; url: string; description: string }>> {
  const allResults: Array<{ title: string; url: string; description: string }> = [];

  const queries = searchTerms.slice(0, 3).map((term) =>
    `${term} enchères estimation prix`
  );

  console.log("[analyze-estimation] Step 2: Searching web with SerpAPI Google Search...", queries);

  const searchPromises = queries.map(async (query) => {
    try {
      const params = new URLSearchParams({
        engine: "google",
        q: query,
        api_key: serpApiKey,
        hl: "fr",
        gl: "fr",
        num: "5",
        safe: "off",
      });

      const response = await fetch(
        `https://serpapi.com/search?${params.toString()}`,
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[analyze-estimation] SerpAPI Search failed for "${query}":`, response.status, errText);
        return [];
      }

      const data = await response.json();
      return (data.organic_results || []).map((item: any) => ({
        title: item.title || "",
        url: item.link || "",
        description: item.snippet || "",
      }));
    } catch (err) {
      console.error(`[analyze-estimation] Search error for "${query}":`, err);
      return [];
    }
  });

  const results = await Promise.all(searchPromises);
  for (const batch of results) {
    allResults.push(...batch);
  }

  const seen = new Set<string>();
  const unique = allResults.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  console.log(`[analyze-estimation] Step 2: Found ${unique.length} unique web results`);
  return unique.slice(0, 10);
}

// ── Step 3: Final AI analysis with cross-referenced sources ──
async function runFinalAnalysis(
  estimation: any,
  photoUrls: string[],
  supabaseUrl: string,
  lovableApiKey: string,
  visualDescription: string,
  webResults: Array<{ title: string; url: string; description: string }>,
  lensResults: LensResult | null,
): Promise<any> {
  const systemPrompt = `Expert commissaire-priseur. Analyse croisée : photos → correspondances visuelles → recherche web.

RÈGLES IMPÉRATIVES :
- Analyse visuelle INDÉPENDANTE d'abord, puis confronte aux sources web.
- Ignore le titre d'un éventuel "lot similaire" mentionné par le propriétaire.
- Jamais de certitude sur un artiste sauf signature lisible ou sources convergentes.
- PRUDENCE OBLIGATOIRE : Ne JAMAIS écrire "il s'agit de", toujours utiliser des formulations conditionnelles.
- FIABILITÉ : Note ta confiance de 1 à 4 (0 et 5 réservés au commissaire-priseur).

CORRESPONDANCES VISUELLES — RÈGLE LA PLUS CRITIQUE :
- Les correspondances visuelles (recherche d'image inversée) identifient souvent CORRECTEMENT l'objet. Google Lens est TRÈS PERFORMANT pour reconnaître des œuvres, des artistes, des modèles connus. NE SOUS-ESTIME JAMAIS ses résultats.
- ÉTAPE OBLIGATOIRE AVANT TOUTE CONCLUSION :
  1. Liste TOUTES les identifications différentes trouvées dans les correspondances visuelles (noms d'artistes, titres d'œuvres, sujets).
  2. Pour CHAQUE identification distincte, vérifie si les résultats web la corroborent.
  3. Compare avec ta propre analyse visuelle.
  4. Présente TOUTES les pistes dans "summary" avec leur niveau de vraisemblance, même si tu en privilégies une.
- EXEMPLES :
  → Les correspondances montrent "Louis XIV" ET "Charles VII" ET "Grand Condé" → tu DOIS mentionner les 3 pistes et expliquer pourquoi tu retiens l'une plutôt que les autres.
  → Tu penses à l'artiste X mais Lens identifie Y → "L'analyse visuelle pourrait évoquer X, mais les correspondances visuelles identifient cette œuvre comme étant Y (source : ...). Les résultats web confirment/infirment cette piste car..."
- Si tu ignores une piste issue des correspondances visuelles SANS l'expliquer, c'est une FAUTE GRAVE.
- Le champ "alternative_identifications" est OBLIGATOIRE dès qu'il y a plus d'une piste. Liste-y chaque identification alternative avec sa source et ton avis.

COMPARAISON VISUELLE DÉTAILLÉE — RÈGLE ANTI-ERREUR CRITIQUE :
- Les images des correspondances visuelles te sont fournies ci-dessous. Tu DOIS les examiner ATTENTIVEMENT et les comparer pixel par pixel avec les photos du vendeur.
- Pour CHAQUE correspondance visuelle, tu DOIS remplir le champ "visual_comparisons" avec un verdict structuré. C'est OBLIGATOIRE.
- Points de comparaison OBLIGATOIRES pour chaque correspondance :
  1. SOCLE / BASE : forme (plat, circulaire, rectangulaire, mouluré, décoré, rocheux, lisse), matériau, ornementation. Un socle plat vs un socle bosselé = œuvre DIFFÉRENTE.
  2. POSE / COMPOSITION : orientation du visage, position des bras, drapés, accessoires.
  3. PATINE / FINITION : couleur, brillance, dorure, oxydation.
  4. DÉTAILS DÉCORATIFS : motifs sculptés, armoiries, cartouches, inscriptions.
  5. PROPORTIONS : silhouette générale, rapport tête/corps, largeur/hauteur.
- Verdicts possibles dans "visual_comparisons" :
  • "identique" = même œuvre exactement (même socle, même pose, même patine, dimensions compatibles)
  • "même_modèle" = même sujet et composition mais détails mineurs différents (tirage différent, patine différente)
  • "similaire" = même type d'objet mais des différences notables (socle différent, pose différente)
  • "différent" = objet clairement distinct malgré un sujet voisin
- Si un seul détail majeur diffère nettement (socle plat vs rocheux, drapé différent, accessoire absent), le verdict NE PEUT PAS être "identique".
- Ne JAMAIS citer une référence comme étant "la même œuvre" dans le summary/estimation si le verdict visual_comparisons est "similaire" ou "différent". Au mieux : "modèle similaire" ou "même sujet dans un traitement différent".
- L'estimation de prix DOIT être cohérente avec les verdicts : si AUCUNE correspondance n'est "identique", l'estimation est plus incertaine et la fourchette doit être plus large.

DIMENSIONS DU VENDEUR — RÈGLE ANTI-ABSURDITÉ CRITIQUE :
- Quand le propriétaire/vendeur fournit des DIMENSIONS (hauteur, largeur, profondeur, diamètre), ces mesures sont des DONNÉES FACTUELLES que tu dois traiter avec le plus grand respect.
- ÉTAPE OBLIGATOIRE pour CHAQUE référence de vente ou correspondance :
  1. Vérifie si la référence mentionne des dimensions.
  2. Compare ces dimensions à celles du vendeur.
  3. Si l'écart dépasse 20% sur UNE dimension ou 30% en volume global, cette référence ne peut PAS être "la même œuvre". C'est au mieux un modèle similaire dans une taille différente.
- EXEMPLES D'ERREURS À NE JAMAIS COMMETTRE :
  → Le vendeur dit "49 cm de haut" et tu cites une référence à 119 cm de haut → ABSURDE. C'est un objet complètement différent en taille. Le commissaire-priseur perdrait toute crédibilité.
  → Le vendeur dit "30 x 40 cm" et tu cites un tableau de "130 x 180 cm" → ce n'est PAS la même œuvre.
- Quand les dimensions diffèrent significativement, MENTIONNE-LE EXPLICITEMENT : "Attention, la référence de vente chez X concerne un exemplaire de 119 cm, soit plus du double de l'objet soumis (49 cm). Il s'agit donc d'un modèle de taille différente, et le prix n'est pas directement comparable."
- Les dimensions impactent FORTEMENT la valeur. Un bronze de 49 cm et un bronze de 119 cm du même sujet peuvent avoir un rapport de prix de 1 à 10 ou plus.
- Si le vendeur n'a pas fourni de dimensions, DEMANDE-LES dans "questions_for_owner". C'est une information essentielle.
- Ne JAMAIS ignorer silencieusement un écart de dimensions. C'est une faute professionnelle grave.

LECTURE CRITIQUE DES SOURCES — RÈGLE LA PLUS IMPORTANTE :
- Tu DOIS lire CHAQUE source web et correspondance visuelle ATTENTIVEMENT et INTÉGRALEMENT.
- Pour chaque résultat, détermine :
  1. Est-ce la MÊME œuvre / le même objet que celui soumis ? (même artiste, même titre, mêmes dimensions, même technique)
  2. Ou est-ce une AUTRE œuvre du même artiste ? (différent titre, différentes dimensions, différente période)
  3. Ou est-ce un objet SIMILAIRE d'un autre artiste ?
- SEULES les ventes de la MÊME œuvre ou d'œuvres très comparables (même artiste, même technique, dimensions similaires, même période) sont pertinentes pour l'estimation.
- Les records de vente d'un artiste pour ses œuvres MAJEURES ne s'appliquent PAS à toutes ses œuvres. Un artiste peut avoir des œuvres à 500 € et d'autres à 500 000 €.
- Si une source mentionne une vente à 39 000 € pour la MÊME œuvre, cette donnée prime sur des ventes à 200 000 € d'AUTRES œuvres du même artiste.
- CITE EXPLICITEMENT dans "market_insights" quelles ventes sont comparables et lesquelles ne le sont pas. Ex: "Vente comparable : même œuvre adjugée 39 000 € chez X. À ne pas confondre avec [autre œuvre majeure] adjugée 200 000 € chez Y."
- En cas de doute sur la comparabilité, PRENDS LA FOURCHETTE BASSE.

HIÉRARCHIE DE FIABILITÉ DES PRIX — RÈGLE CRITIQUE :
- Les prix de vente réels (« vendu », « adjugé », « adjugé à », « vendu frais inclus », « hammer price », « sold for ») sont les données LES PLUS FIABLES. Ils priment sur TOUT le reste.
- HIÉRARCHIE (du plus fiable au moins fiable) :
  1. VENTE CONFIRMÉE : « adjugé X € », « vendu X € », « sold for », « hammer price » → PRIORITÉ ABSOLUE, utiliser directement pour l'estimation.
  2. ESTIMATION DE MAISON DE VENTE : « estimé X-Y € », « estimate » → Fiable mais indicatif.
  3. PRIX DEMANDÉ EN GALERIE : « prix : X € », « asking price » → Moins fiable, souvent supérieur au prix de marché.
  4. PRIX SUR MARKETPLACE (eBay, Etsy, 1stDibs) : « listed at » → Peu fiable, souvent très gonflé.
  5. ESTIMATION ARTPRICE / INDEX : → Utile comme contexte général mais pas comme référence directe.
- Quand une source dit "adjugé" ou "vendu" avec un prix, c'est un FAIT. Base ton estimation dessus en priorité.
- Quand une source dit juste un prix sans contexte de vente, c'est probablement un prix demandé (moins fiable).
- MENTIONNE dans "market_insights" le type de chaque prix cité (adjugé, estimé, demandé).

CONVERSION DES DEVISES — RÈGLE CRITIQUE :
- Les sources web et correspondances visuelles peuvent afficher des prix en TOUTES DEVISES : HKD (dollar de Hong Kong), USD, GBP, CNY, JPY, CHF, AUD, etc.
- Tu DOIS identifier la devise de chaque prix trouvé et le CONVERTIR en euros (€) avant de l'utiliser.
- Taux de conversion approximatifs à utiliser : 1 HKD ≈ 0.12 €, 1 USD ≈ 0.92 €, 1 GBP ≈ 1.16 €, 1 CHF ≈ 1.04 €, 1 CNY ≈ 0.13 €, 1 JPY ≈ 0.006 €, 1 AUD ≈ 0.60 €, 1 CAD ≈ 0.68 €.
- ATTENTION : Un prix de 100 000 HKD ≈ 12 000 €, pas 100 000 €. Ne JAMAIS confondre les devises.
- Dans "estimated_range", TOUJOURS donner la fourchette en EUROS (€).
- Dans "market_insights", mentionner les prix originaux avec leur devise ET leur équivalent en euros. Ex: "Adjugé 150 000 HKD (≈ 18 000 €) chez Christie's Hong Kong".
- Si la devise d'un prix n'est pas claire, le signaler explicitement.

TRAITEMENT DES NOMS MENTIONNÉS PAR LE PROPRIÉTAIRE :
- Si le propriétaire mentionne un nom d'artiste, une signature ou un poinçon, tu DOIS en tenir compte même si les correspondances visuelles ne confirment pas ce nom.
- Si le nom mentionné N'APPARAÎT PAS dans les résultats visuels ou web : signale-le explicitement. Ex: "Le propriétaire mentionne une signature 'Claudio', mais aucune correspondance n'a été trouvée dans les bases d'enchères consultées. Il pourrait s'agir d'un artiste peu référencé ou d'une lecture incertaine."
- Inclus le nom mentionné dans tes questions au propriétaire (photo de la signature, orthographe exacte, etc.).
- Ne JAMAIS ignorer silencieusement un nom fourni par le propriétaire.

VENTE PUBLIQUE CONFIRMÉE — SIGNALEMENT PRIORITAIRE :
- Si tu trouves dans les sources web ou les correspondances visuelles une vente en enchères publiques CONFIRMÉE de ce qui semble être la MÊME œuvre/objet (même artiste, même titre, même visuel) :
  → MENTIONNE-LE IMMÉDIATEMENT dans "summary" avec le prix, la maison de vente, la date si disponible.
  → Ajoute le lien direct vers cette source dans "summary" en format MARKDOWN : [texte descriptif](url). Ex: "Cette œuvre semble avoir été [adjugée 39 000 € chez Biarritz Enchères](https://www.example.com/lot/123) en mars 2024."
  → Ne JAMAIS écrire l'URL en clair dans le texte. Toujours la masquer dans un lien markdown sur un mot ou groupe de mots.
  → C'est une information critique qui fait gagner du temps au commissaire-priseur. Ne la cache pas dans market_insights.
- Plus la vente est RÉCENTE, plus elle est pertinente. Mentionne la date.

DÉTECTION DE CONTRADICTIONS AVEC LE DESCRIPTIF VENDEUR :
- Lis ATTENTIVEMENT le descriptif du vendeur/propriétaire (provenance, durée de possession, histoire de l'objet).
- Si tu trouves une vente récente en enchères publiques de ce qui semble être la MÊME œuvre, et que le vendeur dit par exemple "je l'ai chez moi depuis 30 ans" ou "hérité de ma grand-mère", il y a une CONTRADICTION potentielle.
- Dans ce cas, commence ta remarque dans "summary" par : "Sauf erreur, " suivi de l'explication de la contradiction.
  Ex: "Sauf erreur, cette œuvre semble avoir été [vendue aux enchères chez X en 2022 pour 39 000 €](url), ce qui contredirait la provenance déclarée par le propriétaire."
- Ne fais ce signalement QUE si la correspondance visuelle est très forte (même œuvre, pas juste le même artiste).
- Ce n'est pas une accusation, c'est un signalement factuel et mesuré pour aider le commissaire-priseur.

SITES À PAYWALL — RÈGLE STRICTE :
- Certains sites sont des mines d'or pour l'ANALYSE mais leurs liens sont INACCESSIBLES aux humains (paywall, abonnement requis). Liste des domaines bloqués :
  • drouot.com, gazette-drouot.com (paywall Drouot)
  • invaluable.com (abonnement requis pour les résultats détaillés)
  • artnet.com (base de prix payante)
  • artprice.com (abonnement requis)
  • mutualart.com (abonnement requis)
  • liveauctioneers.com (résultats partiels)
- UTILISE ACTIVEMENT les données trouvées sur ces sites pour ton raisonnement et ton estimation. Ce sont des sources de premier plan.
- MAIS ne JAMAIS inclure de lien vers ces domaines dans web_sources ni dans les liens markdown. L'utilisateur cliquera et verra "accès refusé", c'est une perte de temps.
- STRATÉGIE OBLIGATOIRE quand tu trouves une info sur un site à paywall :
  1. Note le NOM DE LA MAISON DE VENTE (ex: "Biarritz Enchères", "Maître Dupont", "Christie's Paris").
  2. Cherche dans les résultats web si cette maison a son PROPRE SITE INTERNET avec un historique de ses ventes.
  3. Cherche aussi sur les sites ACCESSIBLES : interencheres.com, barnebys.com, christies.com, sothebys.com, les sites des maisons de vente régionales.
  4. Si tu trouves un lien ACCESSIBLE : intègre-le en hypertexte dans le texte. Ex: "[vendue en septembre 2018 chez Biarritz Enchères](https://www.biarritz-encheres.com/vente/123)".
  5. Si AUCUN lien accessible n'existe : cite l'info sans lien. Ex: "vendue en septembre 2018 chez Biarritz Enchères pour 39 000 €".
  6. Ne JAMAIS mentionner le nom du site à paywall comme source visible.

FORMATAGE DES TEXTES — RÈGLES ULTRA-STRICTES :
- LIENS HYPERTEXTE — TOLÉRANCE ZÉRO pour les URLs en clair :
  • INTERDIT : toute URL brute dans le texte (https://..., http://..., www...)
  • INTERDIT : "[Lien](url)" ou "[Source](url)" — le texte du lien DOIT être descriptif
  • INTERDIT : "Source : https://..." ou "Voir : https://..."
  • INTERDIT : "(https://...)" entre parenthèses
  • OBLIGATOIRE : le lien est intégré dans le texte naturel de la phrase
  • EXEMPLES CORRECTS :
    "Cette œuvre a été [adjugée 39 000 € en septembre 2018](https://example.com/lot/123) chez X."
    "Un exemplaire comparable a été [proposé chez Christie's en 2022](https://www.christies.com/lot/123)."
    "L'artiste est [référencé sur le site de la galerie Durand](https://galerie-durand.com/artistes/nom)."
  • EXEMPLES INCORRECTS À NE JAMAIS PRODUIRE :
    "Source : https://www.example.com" ← INTERDIT
    "[Lien](https://www.example.com)" ← INTERDIT
    "Voir https://www.example.com" ← INTERDIT
    "https://www.example.com" ← INTERDIT
    "(source: https://www.example.com)" ← INTERDIT
- MONTANTS : Toujours séparer les milliers avec un espace et indiquer la devise. Ex: "39 000 €", "150 000 HKD (≈ 18 000 €)", "1 200 €". JAMAIS "39000€" ou "39,000€".
- DATES : Format français "mars 2024", "12 octobre 2023". Jamais de format anglo-saxon.

CONCISION OBLIGATOIRE :
- "identified_object" = UNE seule ligne (type, matériau, style/époque). Au conditionnel.
- "summary" = 2-4 phrases courtes. Au conditionnel. MAIS si une vente confirmée ou une contradiction est détectée, ajoute 1-2 phrases supplémentaires pour le signaler clairement avec lien markdown.
- Les détails longs vont dans authenticity_assessment, condition_notes, market_insights.
- Ne JAMAIS mentionner les outils techniques utilisés (Google Vision, Google Lens, API, etc.).

VÉRIFICATION FINALE OBLIGATOIRE — ÉTAPE CRITIQUE AVANT DE PRODUIRE LE JSON :
Après avoir rempli "visual_comparisons", tu DOIS effectuer cette auto-vérification en 3 étapes :
ÉTAPE A : Identifie quel match_index a le verdict le plus favorable ("identique" > "même_modèle" > "similaire" > "différent").
ÉTAPE B : Vérifie que "identified_object" et "summary" sont BASÉS sur cette correspondance la plus favorable. Si tu as un "identique" ou "même_modèle" et que ton summary n'en parle pas ou cite une autre correspondance → CORRIGE IMMÉDIATEMENT avant de finaliser.
ÉTAPE C : Vérifie que "estimated_range" utilise le prix de la correspondance "identique"/"même_modèle" (si disponible). Si tu utilises le prix d'une correspondance "similaire" ou "différent" comme référence directe → CORRIGE.
RÈGLE ABSOLUE : Un summary qui contredit les verdicts visuels rend l'analyse INUTILE et NON PROFESSIONNELLE. Le commissaire-priseur voit les verdicts ET la synthèse côte à côte — une incohérence détruit sa confiance.

JSON sans backticks :
{
  "identified_object": "1 ligne au conditionnel. DOIT correspondre au match 'identique'/'même_modèle' s'il y en a un.",
  "alternative_identifications": ["Piste écartée avec explication et source"],
  "visual_comparisons": [
    {"match_index": 0, "verdict": "similaire", "details": "Différences précises observées : socle rocheux vs plat, etc."},
    {"match_index": 1, "verdict": "différent", "details": "Non comparable car..."},
    {"match_index": 2, "verdict": "identique", "details": "Même composition, même socle, mêmes proportions..."}
  ],
  "summary": "DOIT citer en priorité le match 'identique'/'même_modèle' (ici match 2) comme référence. Si aucun match n'est identique, le dire explicitement. Liens en markdown.",
  "estimated_range": "BASÉ sur le prix du match 'identique'/'même_modèle'. Si aucun : fourchette large et prudente.",
  "authenticity_assessment": "Détails authenticité (au conditionnel)",
  "condition_notes": "Détails état",
  "market_insights": "Pour CHAQUE prix cité, indiquer le verdict visuel correspondant. Seuls identique/même_modèle = référence directe de prix.",
  "web_sources": [{"title":"","url":"JAMAIS de paywall","relevance":"même œuvre / similaire / différent"}],
  "recommendation": "très_intéressant|intéressant|à_examiner|peu_intéressant|hors_spécialité",
  "recommendation_text": "1 phrase",
  "questions_for_owner": ["2-3 questions"],
  "confidence_score": 3,
  "limitations": "1 phrase"
}`;

  const messages: any[] = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];

  // Build user content: photos first, then web context, then user description
  const userContent: any[] = [];

  // Photos
  if (photoUrls.length > 0) {
    userContent.push({ type: "text", text: "PHOTOS DE L'OBJET À ANALYSER :" });
    for (const url of photoUrls) {
      const fullUrl = url.startsWith("http") ? url : `${supabaseUrl}/storage/v1/object/public/${url}`;
      userContent.push({ type: "image_url", image_url: { url: fullUrl } });
    }
  } else {
    userContent.push({ type: "text", text: "⚠️ Aucune photo fournie." });
  }

  // Visual description from Step 1
  if (visualDescription) {
    userContent.push({
      type: "text",
      text: `\n\nDESCRIPTION VISUELLE PRÉLIMINAIRE (étape 1) :\n${visualDescription}`,
    });
  }

  // Google Lens visual matches (SerpAPI) — with divergence analysis + THUMBNAIL IMAGES
  if (lensResults && (lensResults.bestGuessLabels.length > 0 || lensResults.visualMatches.length > 0)) {
    let lensContext = "\n\nCORRESPONDANCES VISUELLES (recherche visuelle inversée) :\n";
    
    if (lensResults.bestGuessLabels.length > 0) {
      lensContext += `\nIdentification automatique : ${lensResults.bestGuessLabels.join(", ")}\n`;
    }
    
    if (lensResults.visualMatches.length > 0) {
      lensContext += `\nObjets similaires trouvés sur le web :\n`;
      for (const match of lensResults.visualMatches.slice(0, 10)) {
        lensContext += `- "${match.title}" (source: ${match.source}) ${match.link}`;
        if (match.price) lensContext += ` — Prix: ${match.price}`;
        lensContext += `\n`;
      }
      
      // Extract distinct identifications from visual matches to flag divergences
      const identifications = new Map<string, string[]>();
      for (const match of lensResults.visualMatches.slice(0, 10)) {
        const title = match.title || "";
        const cleanTitle = title
          .replace(/\s*[-–|]\s*(eBay|Etsy|Amazon|Pinterest|Invaluable\.com).*$/i, "")
          .replace(/Sold at Auction:\s*/i, "")
          .trim();
        if (cleanTitle.length > 5) {
          const key = cleanTitle.substring(0, 60);
          if (!identifications.has(key)) {
            identifications.set(key, []);
          }
          identifications.get(key)!.push(match.source);
        }
      }
      
      if (identifications.size > 1) {
        lensContext += `\n⚠️ ATTENTION — IDENTIFICATIONS DIVERGENTES DÉTECTÉES dans les correspondances visuelles :\n`;
        lensContext += `Les correspondances ci-dessus suggèrent PLUSIEURS identifications possibles :\n`;
        let idx = 1;
        for (const [identification, sources] of identifications) {
          lensContext += `  ${idx}. "${identification}" (${sources.join(", ")})\n`;
          idx++;
        }
        lensContext += `\nTu DOIS mentionner TOUTES ces pistes dans ton analyse et expliquer laquelle tu retiens et POURQUOI. Ne te contente pas d'une seule identification sans discuter les autres.\n`;
        lensContext += `Si ta propre analyse visuelle diverge de certaines correspondances, EXPLIQUE la divergence au lieu de l'ignorer silencieusement.\n`;
      }
    }
    
    userContent.push({ type: "text", text: lensContext });

    // ── CRITICAL: Include visual match THUMBNAIL IMAGES so the AI can ACTUALLY compare visual details ──
    const matchesWithThumbnails = lensResults.visualMatches.filter((m: any) => m.thumbnail).slice(0, 6);
    if (matchesWithThumbnails.length > 0) {
      userContent.push({
        type: "text",
        text: "\n\n🔍 IMAGES DES CORRESPONDANCES VISUELLES — Compare CHAQUE image ci-dessous avec les photos du vendeur.\nPour CHAQUE correspondance, note les DIFFÉRENCES PRÉCISES (socle, pose, patine, dimensions apparentes, accessoires, drapés).\nSi le socle, la pose ou un détail majeur diffère → ce n'est PAS la même œuvre, c'est au mieux un modèle similaire.\nRAPPEL : Ton summary DOIT être COHÉRENT avec tes verdicts. Si tu trouves un 'même_modèle', cite-le dans le summary !",
      });
      for (const match of matchesWithThumbnails) {
        userContent.push({
          type: "text",
          text: `\n↓ Correspondance visuelle : "${match.title}" (${match.source})${match.price ? ` — ${match.price}` : ""}`,
        });
        userContent.push({
          type: "image_url",
          image_url: { url: match.thumbnail },
        });
      }
    }
  }

  // Web search results (Google Custom Search)
  if (webResults.length > 0) {
    let webContext = "\n\nRÉSULTATS DE RECHERCHE WEB GOOGLE (à croiser avec l'analyse visuelle) :\n";
    for (const r of webResults) {
      webContext += `\n--- Source : ${r.title} (${r.url}) ---\n`;
      if (r.description) webContext += `Résumé : ${r.description}\n`;
    }
    userContent.push({ type: "text", text: webContext });
  } else if (!lensResults || lensResults.visualMatches.length === 0) {
    userContent.push({
      type: "text",
      text: "\n\n⚠️ Aucun résultat de recherche web trouvé. Base ton analyse uniquement sur les photos.",
    });
  }

  // User context
  let textDescription = "\n\nCONTEXTE PROPRIÉTAIRE :";
  const userMessage = estimation.description || "";
  const userOwnMessage = userMessage.split("---")[0]?.trim() || userMessage;
  textDescription += `\nMessage : ${userOwnMessage}`;

  if (estimation.related_lot_id) {
    const lotRefParts = userMessage.split("---").slice(1).join("---").trim();
    if (lotRefParts) {
      textDescription += `\n\n[INFO : Le propriétaire dit posséder un objet "similaire" au lot suivant — cela ne signifie PAS que c'est le même objet.]\n${lotRefParts}`;
    }
  }
  if (estimation.estimated_value) {
    textDescription += `\nEstimation espérée : ${estimation.estimated_value}`;
  }
  if (estimation.object_category) {
    textDescription += `\nCatégorie : ${estimation.object_category}`;
  }

  // FINAL REMINDER: coherence check
  textDescription += `\n\n⚠️ RAPPEL FINAL : Après avoir rempli visual_comparisons, VÉRIFIE que ton summary et identified_object citent bien la correspondance avec le meilleur verdict (identique > même_modèle). Si tu as trouvé un "même_modèle" quelque part mais que ton summary ne le mentionne pas, CORRIGE AVANT DE RÉPONDRE.`;

  userContent.push({ type: "text", text: textDescription });
  messages.push({ role: "user", content: userContent });

  console.log("[analyze-estimation] Step 3: Running final cross-referenced analysis...");

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages,
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error("[analyze-estimation] Step 3 AI error:", aiResponse.status, errorText);

    if (aiResponse.status === 429) {
      throw { status: 429, message: "Rate limit exceeded, please try again later" };
    }
    if (aiResponse.status === 402) {
      throw { status: 402, message: "AI credits exhausted" };
    }
    throw new Error(`AI gateway returned ${aiResponse.status}: ${errorText}`);
  }

  const aiData = await aiResponse.json();
  const rawContent = aiData.choices?.[0]?.message?.content || "";

  try {
    const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    
    // Post-processing: strip links to paywall domains
    const PAYWALL_DOMAINS = ["drouot.com", "gazette-drouot", "invaluable.com", "artnet.com", "artprice.com", "mutualart.com", "liveauctioneers.com"];
    const isPaywalled = (url: string) => PAYWALL_DOMAINS.some(d => url?.includes(d));
    
    if (parsed.web_sources && Array.isArray(parsed.web_sources)) {
      parsed.web_sources = parsed.web_sources.filter((s: any) => !isPaywalled(s.url));
    }

    // Strip paywall links from markdown text fields (keep the text, remove the link)
    const stripPaywallLinks = (text: string): string => {
      if (!text) return text;
      for (const domain of PAYWALL_DOMAINS) {
        const escaped = domain.replace(/\./g, "\\.");
        const regex = new RegExp(`\\[([^\\]]+)\\]\\(https?:\\/\\/[^)]*${escaped}[^)]*\\)`, "g");
        text = text.replace(regex, "$1");
      }
      return text;
    };

    // Strip bare/raw URLs that the AI wrote in clear text instead of markdown
    const stripBareUrls = (text: string): string => {
      if (!text) return text;
      const mdLinks: string[] = [];
      let protected_ = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, url) => {
        mdLinks.push(`[${linkText}](${url})`);
        return `%%MDLINK_${mdLinks.length - 1}%%`;
      });
      protected_ = protected_.replace(/(?:(?:Source|Voir|Lien|Ref|Référence)\s*[:：]\s*)?https?:\/\/[^\s,;)}\]"']+/gi, "");
      protected_ = protected_.replace(/\(\s*\)/g, "").replace(/\[\s*\]/g, "");
      protected_ = protected_.replace(/%%MDLINK_(\d+)%%/g, (_match, idx) => mdLinks[parseInt(idx)]);
      protected_ = protected_.replace(/  +/g, " ").trim();
      return protected_;
    };

    // Apply both cleanups to all text fields
    const cleanTextField = (text: string): string => {
      if (!text) return text;
      return stripBareUrls(stripPaywallLinks(text));
    };

    if (parsed.summary) parsed.summary = cleanTextField(parsed.summary);
    if (parsed.market_insights) parsed.market_insights = cleanTextField(parsed.market_insights);
    if (parsed.authenticity_assessment) parsed.authenticity_assessment = cleanTextField(parsed.authenticity_assessment);
    if (parsed.identified_object) parsed.identified_object = cleanTextField(parsed.identified_object);
    if (parsed.condition_notes) parsed.condition_notes = cleanTextField(parsed.condition_notes);
    if (parsed.limitations) parsed.limitations = cleanTextField(parsed.limitations);

    // ── POST-PROCESSING: Verify coherence between visual_comparisons and summary ──
    if (parsed.visual_comparisons && Array.isArray(parsed.visual_comparisons)) {
      const bestVerdict = parsed.visual_comparisons.reduce((best: any, comp: any) => {
        const verdictOrder: Record<string, number> = { "identique": 4, "même_modèle": 3, "similaire": 2, "différent": 1 };
        const currentScore = verdictOrder[comp.verdict] || 0;
        const bestScore = best ? (verdictOrder[best.verdict] || 0) : 0;
        return currentScore > bestScore ? comp : best;
      }, null);

      if (bestVerdict) {
        console.log(`[analyze-estimation] Best visual verdict: ${bestVerdict.verdict} (match_index: ${bestVerdict.match_index})`);
        
        // Log warning if no match is identique/même_modèle
        const hasStrongMatch = parsed.visual_comparisons.some((c: any) => c.verdict === "identique" || c.verdict === "même_modèle");
        if (!hasStrongMatch) {
          console.log("[analyze-estimation] WARNING: No 'identique' or 'même_modèle' visual match found — estimation should be cautious");
        }
      }
    }
    
    return parsed;
  } catch {
    console.error("[analyze-estimation] Step 3 JSON parse error, using fallback");
    return {
      summary: rawContent,
      identified_object: "Analyse non structurée",
      estimated_range: "Non déterminé",
      recommendation: "à_examiner",
      recommendation_text: "L'analyse IA n'a pas pu être structurée correctement.",
      web_sources: [],
    };
  }
}

// ── Main handler ──
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { estimation_id } = await req.json();
    if (!estimation_id) {
      return new Response(JSON.stringify({ error: "estimation_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[analyze-estimation] Starting 4-step analysis for ${estimation_id}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const serpApiKey = Deno.env.get("SERPAPI_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch the estimation request
    const { data: estimation, error: fetchError } = await supabase
      .from("estimation_requests")
      .select("*")
      .eq("id", estimation_id)
      .single();

    if (fetchError || !estimation) {
      console.error("[analyze-estimation] Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: "Estimation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[analyze-estimation] Found: ${estimation.nom} - ${estimation.description?.substring(0, 50)}`);

    const photoUrls: string[] = estimation.photo_urls || [];

    // ── STEP 1: Visual description + search terms ──
    let visualDescription = "";
    let searchTerms: string[] = [];

    const userOwnMessage = (estimation.description || "").split("---")[0]?.trim() || "";

    if (photoUrls.length > 0) {
      const step1 = await extractVisualSearchTerms(photoUrls, supabaseUrl, lovableApiKey, userOwnMessage);
      visualDescription = step1.description;
      searchTerms = step1.searchTerms;
    }

    // ── STEP 1b + STEP 2: Google Lens + Google Search in parallel ──
    let lensResults: LensResult | null = null;
    let webResults: Array<{ title: string; url: string; description: string }> = [];

    const parallelTasks: Promise<void>[] = [];

    if (photoUrls.length > 0 && serpApiKey) {
      parallelTasks.push(
        runGoogleLens(photoUrls, supabaseUrl, serpApiKey).then((r) => {
          lensResults = r;
          if (r.bestGuessLabels.length > 0) {
            searchTerms.push(...r.bestGuessLabels.filter((l) => !searchTerms.includes(l)));
          }
        }),
      );
    } else if (!serpApiKey) {
      console.warn("[analyze-estimation] SERPAPI_API_KEY not configured, skipping Google Lens");
    }

    if (searchTerms.length > 0 && serpApiKey) {
      parallelTasks.push(
        searchWebReferences(searchTerms, serpApiKey).then((r) => {
          webResults = r;
        }),
      );
    }

    await Promise.all(parallelTasks);

    if (webResults.length === 0 && lensResults && lensResults.bestGuessLabels.length > 0 && serpApiKey) {
      console.log("[analyze-estimation] Retrying SerpAPI Search with Lens labels:", lensResults.bestGuessLabels);
      webResults = await searchWebReferences(lensResults.bestGuessLabels, serpApiKey);
    }

    // ── EXTRA: Research leads from Google Lens visual matches ──
    if (serpApiKey && lensResults && lensResults.visualMatches.length > 0) {
      const lensLeads = new Set<string>();
      
      for (const match of lensResults.visualMatches.slice(0, 8)) {
        const title = match.title || "";
        if (title.length < 5) continue;
        
        const cleaned = title
          .replace(/\s*[-–|]\s*(eBay|Etsy|Amazon|Pinterest|Wikipedia|Wikimedia).*$/i, "")
          .replace(/\s*[-–|]\s*\d+\s*€.*$/i, "")
          .trim();
        
        if (cleaned.length >= 5 && !lensLeads.has(cleaned)) {
          lensLeads.add(cleaned);
        }
      }
      
      for (const label of lensResults.bestGuessLabels) {
        if (label.length >= 3) lensLeads.add(label);
      }
      
      const lensSearchTerms = Array.from(lensLeads).slice(0, 4);
      
      if (lensSearchTerms.length > 0) {
        console.log("[analyze-estimation] Lens leads to research:", lensSearchTerms);
        
        const lensAuctionTerms = lensSearchTerms.map(t => `${t} enchères adjugé vente`);
        const lensWebResults = await searchWebReferences(lensAuctionTerms, serpApiKey);
        
        const existingUrls = new Set(webResults.map(r => r.url));
        for (const r of lensWebResults) {
          if (r.url && !existingUrls.has(r.url)) {
            webResults.push(r);
            existingUrls.add(r.url);
          }
        }
        console.log(`[analyze-estimation] After Lens lead research: ${webResults.length} total web results`);
      }
    }

    // ── EXTRA: Targeted auction platform searches ──
    if (serpApiKey && searchTerms.length > 0) {
      const auctionTerms = searchTerms.slice(0, 2);
      const auctionSites = [
        "drouot.com",
        "interencheres.com",
        "gazette-drouot.com",
        "invaluable.com",
        "artnet.com",
        "barnebys.com",
        "artprice.com",
        "mutualart.com",
      ];
      const auctionQueries: string[] = [];
      
      const siteFilter = auctionSites.map(s => `site:${s}`).join(" OR ");
      for (const term of auctionTerms) {
        auctionQueries.push(`(${siteFilter}) ${term}`);
      }

      console.log("[analyze-estimation] Auction platform search:", auctionQueries);

      const auctionSearchPromises = auctionQueries.map(async (query) => {
        try {
          const params = new URLSearchParams({
            engine: "google",
            q: query,
            api_key: serpApiKey,
            hl: "fr",
            gl: "fr",
            num: "5",
            safe: "off",
          });
          const response = await fetch(`https://serpapi.com/search?${params.toString()}`);
          if (!response.ok) return [];
          const data = await response.json();
          return (data.organic_results || []).map((item: any) => ({
            title: item.title || "",
            url: item.link || "",
            description: item.snippet || "",
          }));
        } catch {
          return [];
        }
      });

      const auctionResults = await Promise.all(auctionSearchPromises);
      const existingUrls = new Set(webResults.map((r) => r.url));
      for (const batch of auctionResults) {
        for (const r of batch) {
          if (r.url && !existingUrls.has(r.url)) {
            webResults.push(r);
            existingUrls.add(r.url);
          }
        }
      }
      console.log(`[analyze-estimation] After auction search: ${webResults.length} total web results`);
    }

    // ── EXTRA: Search based on user text clues ──
    if (serpApiKey && userOwnMessage.length > 5) {
      const extraTerms: string[] = [];

      const flexiblePatterns = [
        /(?:signature|signé|marqué|poinçon|inscrit|écrit)[\s\w,''éèêëàâäùûüîïôö]*?(?:comme\s+)?([a-zà-üA-ZÀ-Ü][a-zà-ü]{2,}(?:\s+[a-zà-üA-ZÀ-Ü][a-zà-ü]{2,})*)/gi,
        /(?:artiste|par|de|auteur)\s+([A-ZÀ-Ü][a-zà-ü]{2,}(?:\s+[A-ZÀ-Ü][a-zà-ü]{2,})*)/g,
      ];

      const stopWords = new Set([
        "derriere", "derrière", "devant", "dessus", "dessous", "comme", "très",
        "pas", "peu", "assez", "plutôt", "bien", "mal", "une", "lisible",
        "illisible", "visible", "invisible", "quelque", "chose", "objet",
      ]);

      const extractedNames = new Set<string>();

      for (const pattern of flexiblePatterns) {
        let match;
        while ((match = pattern.exec(userOwnMessage)) !== null) {
          const name = match[1]?.trim();
          if (name && name.length >= 3 && !stopWords.has(name.toLowerCase())) {
            extractedNames.add(name);
          }
        }
      }

      const commonWords = new Set(["Le", "La", "Les", "Un", "Une", "Des", "Du", "De", "En", "Au", "Il", "Je", "Mon", "Mes", "Son", "Ses", "Est", "Pas", "Très", "Comme", "Bonjour", "Merci"]);
      const capitalizedWords = userOwnMessage.match(/[A-ZÀ-Ü][a-zà-ü]{2,}/g) || [];
      for (const w of capitalizedWords) {
        if (!commonWords.has(w) && !stopWords.has(w.toLowerCase())) {
          extractedNames.add(w);
        }
      }

      for (const name of extractedNames) {
        extraTerms.push(`${name} artiste enchères`);
        extraTerms.push(`${name} artiste sculpture peinture`);
        extraTerms.push(`site:drouot.com ${name}`);
        extraTerms.push(`site:interencheres.com ${name}`);
      }

      if (extraTerms.length > 0) {
        console.log("[analyze-estimation] Extracted names from user text:", Array.from(extractedNames));
        console.log("[analyze-estimation] Extra search terms:", extraTerms);
        const extraResults = await searchWebReferences(extraTerms.slice(0, 6), serpApiKey);
        const existingUrls = new Set(webResults.map(r => r.url));
        for (const r of extraResults) {
          if (!existingUrls.has(r.url)) {
            webResults.push(r);
            existingUrls.add(r.url);
          }
        }
        console.log(`[analyze-estimation] After text-based search: ${webResults.length} total web results`);
      }
    }

    // ── STEP 3: Final cross-referenced analysis ──
    const analysis = await runFinalAnalysis(
      estimation,
      photoUrls,
      supabaseUrl,
      lovableApiKey,
      visualDescription,
      webResults,
      lensResults,
    );

    console.log("[analyze-estimation] Analysis complete:", analysis.recommendation, "| confidence_score:", analysis.confidence_score);

    // Attach Google Lens metadata to analysis for display
    if (lensResults) {
      analysis.lens_detection = {
        bestGuessLabels: lensResults.bestGuessLabels,
        visualMatches: lensResults.visualMatches.slice(0, 8),
      };
    }

    // Save to database
    const { error: updateError } = await supabase
      .from("estimation_requests")
      .update({
        ai_analysis: analysis,
        ai_analyzed_at: new Date().toISOString(),
        status: "ai_analyzed",
      })
      .eq("id", estimation_id);

    if (updateError) {
      console.error("[analyze-estimation] Update error:", updateError);
      throw new Error(`Failed to update estimation: ${updateError.message}`);
    }

    console.log("[analyze-estimation] Estimation updated successfully");

    return new Response(
      JSON.stringify({ success: true, analysis, estimation_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[analyze-estimation] Error:", error);

    const status = error?.status || 500;
    return new Response(
      JSON.stringify({ error: error?.message || (error instanceof Error ? error.message : "Unknown error") }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
