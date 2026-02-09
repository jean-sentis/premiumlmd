import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ══════════════════════════════════════════════════════════════════
// STEP 1: Visual triage + search terms (Gemini Flash)
// Returns object classification, confidence, AND search terms
// ══════════════════════════════════════════════════════════════════
interface TriageResult {
  description: string;
  searchTerms: string[];
  is_art_or_antique: boolean;
  triage_confidence: "high" | "medium" | "low";
  object_type: string;
}

async function extractVisualSearchTermsWithTriage(
  photoUrls: string[],
  supabaseUrl: string,
  lovableApiKey: string,
  userDescription?: string,
): Promise<TriageResult> {
  const imageContent: any[] = [];
  for (const url of photoUrls) {
    const fullUrl = url.startsWith("http") ? url : `${supabaseUrl}/storage/v1/object/public/${url}`;
    imageContent.push({ type: "image_url", image_url: { url: fullUrl } });
  }

  const userContext = userDescription
    ? `\n\nLe propriétaire a fourni cette description : "${userDescription}"\nTiens-en compte pour affiner les termes de recherche (noms propres, signatures mentionnées, artistes, matériaux, époques, etc.).`
    : "";

  const messages = [
    {
      role: "system",
      content: `Tu es un expert en art, antiquités et objets de collection. Analyse les photos et produis un JSON avec :
- "description" : description visuelle factuelle de l'objet (type, style, matériaux, signatures/poinçons visibles, époque probable). 3-4 phrases maximum.
- "searchTerms" : un tableau de 3 à 5 termes de recherche web pertinents pour identifier cet objet ou trouver des objets similaires sur des sites d'enchères.
- "is_art_or_antique" : boolean. TRUE si l'objet est une œuvre d'art (peinture, sculpture, estampe, lithographie), une antiquité (meuble ancien, objet d'art décoratif ancien), un bijou de valeur, une montre de collection, du vin/spiritueux rare, ou tout objet nécessitant une expertise spécialisée pour être correctement identifié et estimé. FALSE si c'est un objet courant facilement identifiable (électroménager, vélo, imprimante, meuble moderne IKEA, vêtements courants, jouets modernes, etc.).
- "triage_confidence" : "high" | "medium" | "low". Ta confiance dans ta capacité à identifier et estimer cet objet UNIQUEMENT à partir des photos :
  - "high" = objet clairement identifiable, tu peux donner une estimation fiable sans recherche supplémentaire (ex: un appareil électronique courant, un meuble de série reconnaissable).
  - "medium" = tu as une bonne idée de ce que c'est mais des détails restent incertains (provenance, authenticité, artiste exact).
  - "low" = tu as besoin de recherches visuelles ou web pour identifier correctement cet objet.
- "object_type" : type d'objet en 2-3 mots (ex: "sculpture bronze", "huile sur toile", "montre Rolex", "imprimante laser", "vélo route").

IMPORTANT : Sois HONNÊTE sur ta confiance. Si tu vois une signature illisible, une marque inconnue, ou un style que tu ne peux pas dater précisément → "medium" ou "low".

Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.`,
    },
    {
      role: "user",
      content: [
        { type: "text", text: `Analyse ces photos et classifie l'objet :${userContext}` },
        ...imageContent,
      ],
    },
  ];

  console.log("[analyze-estimation] Step 1: Triage + search terms...");

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
    return { description: "", searchTerms: [], is_art_or_antique: true, triage_confidence: "low", object_type: "inconnu" };
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "";

  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    console.log("[analyze-estimation] Step 1 triage:", {
      is_art: parsed.is_art_or_antique,
      confidence: parsed.triage_confidence,
      type: parsed.object_type,
      terms: parsed.searchTerms,
    });
    return {
      description: parsed.description || "",
      searchTerms: Array.isArray(parsed.searchTerms) ? parsed.searchTerms : [],
      is_art_or_antique: parsed.is_art_or_antique !== false, // default to true if missing
      triage_confidence: ["high", "medium", "low"].includes(parsed.triage_confidence) ? parsed.triage_confidence : "low",
      object_type: parsed.object_type || "inconnu",
    };
  } catch {
    console.error("[analyze-estimation] Step 1 JSON parse failed. Raw:", raw.substring(0, 300));

    // Attempt repair
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const descMatch = cleaned.match(/"description"\s*:\s*"([\s\S]*?)"\s*,\s*"searchTerms"/);
      const termsMatch = cleaned.match(/"searchTerms"\s*:\s*\[([\s\S]*?)\]/);

      const description = descMatch ? descMatch[1] : "";
      let searchTerms: string[] = [];
      if (termsMatch) {
        const termMatches = termsMatch[1].match(/"([^"]+)"/g);
        if (termMatches) {
          searchTerms = termMatches.map(t => t.replace(/^"|"$/g, ""));
        }
      }
      if (searchTerms.length > 0) {
        return { description, searchTerms, is_art_or_antique: true, triage_confidence: "low", object_type: "inconnu" };
      }
    } catch {}

    // Final fallback
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
    const uniqueTerms = [...new Set(fallbackTerms)].slice(0, 5);
    return { description: raw.substring(0, 500), searchTerms: uniqueTerms, is_art_or_antique: true, triage_confidence: "low", object_type: "inconnu" };
  }
}

// ══════════════════════════════════════════════════════════════════
// STEP 1b: SerpAPI Google Lens (reverse image search)
// ══════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════
// STEP 2b: Firecrawl scraping of visual match URLs (Level 3)
// ══════════════════════════════════════════════════════════════════
async function scrapeVisualMatchUrls(
  matches: Array<{ title: string; link: string; source: string; thumbnail?: string; price?: string }>,
  firecrawlApiKey: string,
): Promise<Array<{ title: string; url: string; description: string }>> {
  // Domains that won't yield useful scrapeable content (paywalls + social)
  const BLOCKED_DOMAINS = [
    // Paywalls enchères / art market
    "invaluable.com", "drouot.com", "artnet.com", "artnet.fr",
    "artprice.com", "mutualart.com", "barnebys.com",
    // Social / plateformes sans contenu utile
    "facebook.com", "instagram.com",
    "twitter.com", "x.com", "youtube.com", "tiktok.com",
    "amazon.com", "amazon.fr",
    "ebay.com", "ebay.fr", "etsy.com",
  ];
  const isBlocked = (url: string) => BLOCKED_DOMAINS.some(d => url?.includes(d));

  const toScrape = matches
    .filter(m => m.link && !isBlocked(m.link))
    .slice(0, 5);

  if (toScrape.length === 0) {
    console.log("[analyze-estimation] Step 2b: No scrapeable URLs from visual matches");
    return [];
  }

  console.log(`[analyze-estimation] Step 2b: Scraping ${toScrape.length} visual match URLs with Firecrawl...`);

  const scrapePromises = toScrape.map(async (match) => {
    try {
      console.log(`[analyze-estimation]   → Scraping: ${match.link}`);
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: match.link,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });

      if (!response.ok) {
        console.log(`[analyze-estimation]   ✗ Scrape failed for ${match.link}: HTTP ${response.status}`);
        return null;
      }

      const data = await response.json();
      const markdown = data.data?.markdown || data.markdown || "";

      if (markdown.length < 50) {
        console.log(`[analyze-estimation]   ✗ Content too short for ${match.link}: ${markdown.length} chars`);
        return null;
      }

      console.log(`[analyze-estimation]   ✓ Scraped ${match.link}: ${markdown.length} chars`);

      // Truncate to ~2000 chars to keep prompt manageable
      return {
        title: match.title || data.data?.metadata?.title || "",
        url: match.link,
        description: markdown.substring(0, 2000),
      };
    } catch (err) {
      console.error(`[analyze-estimation]   ✗ Scrape error for ${match.link}:`, err);
      return null;
    }
  });

  const results = await Promise.all(scrapePromises);
  const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null);

  console.log(`[analyze-estimation] Step 2b: Successfully scraped ${validResults.length}/${toScrape.length} URLs`);
  return validResults;
}

// ══════════════════════════════════════════════════════════════════
// STEP 2c (fallback): Search the web using SerpAPI Google Search
// Enhanced: extracts rich snippets, prices, dates from results
// ══════════════════════════════════════════════════════════════════
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
        num: "8",
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
      const results: Array<{ title: string; url: string; description: string }> = [];

      for (const item of (data.organic_results || [])) {
        // Build enriched description from all available SerpAPI fields
        let description = item.snippet || "";

        // Rich snippet table data (often contains price, date, dimensions)
        if (item.rich_snippet?.top?.extensions) {
          description += ` | ${item.rich_snippet.top.extensions.join(" | ")}`;
        }
        if (item.rich_snippet?.bottom?.extensions) {
          description += ` | ${item.rich_snippet.bottom.extensions.join(" | ")}`;
        }
        // Detected extensions (price, rating, etc.)
        if (item.rich_snippet?.top?.detected_extensions) {
          const ext = item.rich_snippet.top.detected_extensions;
          if (ext.price) description += ` | Prix: ${ext.price}`;
          if (ext.currency) description += ` ${ext.currency}`;
        }

        // Snippet highlighted words (useful for matching)
        if (item.snippet_highlighted_words?.length > 0) {
          const keywords = item.snippet_highlighted_words.filter((w: string) => w.length > 3);
          if (keywords.length > 0) {
            description += ` [Mots-clés: ${keywords.join(", ")}]`;
          }
        }

        // About this result / sitelinks
        if (item.about_this_result?.source?.description) {
          description += ` | Source: ${item.about_this_result.source.description}`;
        }

        results.push({
          title: item.title || "",
          url: item.link || "",
          description: description.trim(),
        });
      }

      return results;
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
  return unique.slice(0, 12);
}

// ══════════════════════════════════════════════════════════════════
// STEP 2d: Extract auction data from paywall sites via Google snippets
// Invaluable, Artnet, Drouot — can't be scraped but Google indexes them
// ══════════════════════════════════════════════════════════════════
const PAYWALL_AUCTION_DOMAINS = [
  "invaluable.com", "artnet.com", "artnet.fr",
  "drouot.com", "gazette-drouot.com",
  "artprice.com", "mutualart.com",
  "liveauctioneers.com", "barnebys.com",
];

async function extractPaywallInsights(
  visualMatches: Array<{ title: string; link: string; source: string; thumbnail?: string; price?: string }>,
  searchTerms: string[],
  serpApiKey: string,
): Promise<Array<{ title: string; url: string; description: string; source_type: string }>> {
  const isPaywall = (url: string) => PAYWALL_AUCTION_DOMAINS.some(d => url?.includes(d));

  // 1. Collect data already provided by Google Lens for paywall matches
  const paywallMatches = visualMatches.filter(m => m.link && isPaywall(m.link));
  const directInsights: Array<{ title: string; url: string; description: string; source_type: string }> = [];

  for (const match of paywallMatches) {
    const parts: string[] = [];
    parts.push(`Titre: ${match.title}`);
    parts.push(`Source: ${match.source}`);
    if (match.price) parts.push(`Prix affiché: ${match.price}`);
    parts.push(`[Données issues de l'index Google — le site original est derrière un paywall]`);

    directInsights.push({
      title: match.title,
      url: match.link,
      description: parts.join(" | "),
      source_type: "paywall_lens_match",
    });
  }

  console.log(`[analyze-estimation] Step 2d: ${paywallMatches.length} paywall visual matches with direct data`);

  // 2. Targeted Google searches on paywall domains for richer snippets
  // Build search queries from the best search terms + paywall domains
  const targetDomains = ["invaluable.com", "artnet.com", "drouot.com", "liveauctioneers.com"];
  const bestTerms = searchTerms.slice(0, 2);

  if (bestTerms.length === 0) {
    console.log("[analyze-estimation] Step 2d: No search terms for targeted paywall search");
    return directInsights;
  }

  // Create targeted queries: "artist name" + site:domain for price-rich domains
  const siteQueries: string[] = [];
  for (const term of bestTerms) {
    // One broad query across all paywall sites
    const domainFilter = targetDomains.map(d => `site:${d}`).join(" OR ");
    siteQueries.push(`${term} (${domainFilter})`);
  }
  // Also add a general auction query without site filter for broader coverage
  if (bestTerms.length > 0) {
    siteQueries.push(`"${bestTerms[0]}" adjugé OR "sold at auction" OR "vendu" prix`);
  }

  console.log(`[analyze-estimation] Step 2d: Running ${siteQueries.length} targeted paywall searches...`);

  const searchPromises = siteQueries.map(async (query) => {
    try {
      const params = new URLSearchParams({
        engine: "google",
        q: query,
        api_key: serpApiKey,
        hl: "fr",
        gl: "fr",
        num: "6",
        safe: "off",
      });

      const response = await fetch(`https://serpapi.com/search?${params.toString()}`);
      if (!response.ok) {
        console.error(`[analyze-estimation] Paywall search failed for "${query}": ${response.status}`);
        return [];
      }

      const data = await response.json();
      const results: Array<{ title: string; url: string; description: string; source_type: string }> = [];

      for (const item of (data.organic_results || [])) {
        let description = item.snippet || "";

        // Extract rich snippet data (prices, dates, auction house names)
        if (item.rich_snippet?.top?.extensions) {
          description += ` | ${item.rich_snippet.top.extensions.join(" | ")}`;
        }
        if (item.rich_snippet?.bottom?.extensions) {
          description += ` | ${item.rich_snippet.bottom.extensions.join(" | ")}`;
        }
        if (item.rich_snippet?.top?.detected_extensions?.price) {
          description += ` | Prix détecté: ${item.rich_snippet.top.detected_extensions.price}`;
        }
        if (item.date) {
          description += ` | Date: ${item.date}`;
        }

        // Mark paywall sources specially so the AI knows the data comes from Google's index
        const isFromPaywall = isPaywall(item.link || "");
        const sourceType = isFromPaywall ? "paywall_google_snippet" : "google_snippet";

        if (isFromPaywall) {
          description += ` [Snippet Google indexé depuis ${new URL(item.link).hostname} — paywall]`;
        }

        results.push({
          title: item.title || "",
          url: item.link || "",
          description: description.trim(),
          source_type: sourceType,
        });
      }

      return results;
    } catch (err) {
      console.error(`[analyze-estimation] Paywall search error:`, err);
      return [];
    }
  });

  const searchResults = await Promise.all(searchPromises);
  const allPaywallResults = [...directInsights];
  for (const batch of searchResults) {
    allPaywallResults.push(...batch);
  }

  // Dedupe by URL
  const seen = new Set<string>();
  const unique = allPaywallResults.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  console.log(`[analyze-estimation] Step 2d complete: ${unique.length} paywall insights extracted`);
  for (const r of unique.slice(0, 5)) {
    console.log(`  → [${r.source_type}] "${r.title}" — ${r.description.substring(0, 100)}`);
  }

  return unique.slice(0, 15);
}

// ══════════════════════════════════════════════════════════════════
// STEP 3: Final AI analysis with cross-referenced sources
// ══════════════════════════════════════════════════════════════════
async function runFinalAnalysis(
  estimation: any,
  photoUrls: string[],
  supabaseUrl: string,
  lovableApiKey: string,
  visualDescription: string,
  webResults: Array<{ title: string; url: string; description: string }>,
  lensResults: LensResult | null,
  analysisDepth: number,
): Promise<any> {
  // Adapt system prompt based on analysis depth
  const depthContext = analysisDepth === 1
    ? `\nNOTE : Cette analyse est de NIVEAU 1 (vision uniquement, sans recherche web). Tes estimations sont basées UNIQUEMENT sur ton expertise visuelle. Sois transparent : si tu manques d'éléments pour estimer précisément, dis-le clairement et indique ce qu'une recherche approfondie pourrait apporter.`
    : analysisDepth === 2
    ? `\nNOTE : Cette analyse est de NIVEAU 2 (vision + correspondances visuelles Google Lens). Tu disposes de correspondances visuelles mais PAS de recherche web détaillée. Si les correspondances ne suffisent pas à confirmer l'identification, indique qu'une recherche approfondie (niveau 3) serait utile.`
    : "";

  const systemPrompt = `Expert commissaire-priseur. Analyse croisée : photos → correspondances visuelles → recherche web.
${depthContext}

RÈGLES IMPÉRATIVES :
- Analyse visuelle INDÉPENDANTE d'abord, puis confronte aux sources web.
- Ignore le titre d'un éventuel "lot similaire" mentionné par le propriétaire.
- Jamais de certitude sur un artiste sauf signature lisible ou sources convergentes.
- PRUDENCE OBLIGATOIRE : Ne JAMAIS écrire "il s'agit de", toujours utiliser des formulations conditionnelles.
- FIABILITÉ : Note ta confiance de 1 à 4 (0 et 5 réservés au commissaire-priseur). SOIS SÉVÈRE. Règles strictes :
  • 1/4 = Aucune source fiable, identification très incertaine, pas de vente comparable trouvée.
  • 2/4 = Identification probable mais non confirmée par des ventes comparables, OU prix de référence incomplets/ambigus.
  • 3/4 = Identification confirmée par au moins une source fiable ET au moins un prix d'adjudication comparable vérifié.
  • 4/4 = Identification certaine avec PLUSIEURS ventes confirmées de la MÊME œuvre/du MÊME modèle, prix convergents, état comparable.
- SI tu n'as qu'une seule référence de prix → MAX 3/4.
- SI l'état de l'objet diffère significativement de la référence → baisse d'1 point.
- SI tu as lu un prix approximativement ou sans certitude sur les chiffres → MAX 2/4.

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
- Quand les dimensions diffèrent significativement, MENTIONNE-LE EXPLICITEMENT.
- Les dimensions impactent FORTEMENT la valeur.
- Si le vendeur n'a pas fourni de dimensions, DEMANDE-LES dans "questions_for_owner".
- Ne JAMAIS ignorer silencieusement un écart de dimensions.

LECTURE CRITIQUE DES SOURCES — RÈGLE LA PLUS IMPORTANTE :
- Tu DOIS lire CHAQUE source web et correspondance visuelle ATTENTIVEMENT et INTÉGRALEMENT.
- Pour chaque résultat, détermine :
  1. Est-ce la MÊME œuvre / le même objet que celui soumis ?
  2. Ou est-ce une AUTRE œuvre du même artiste ?
  3. Ou est-ce un objet SIMILAIRE d'un autre artiste ?
- SEULES les ventes de la MÊME œuvre ou d'œuvres très comparables sont pertinentes pour l'estimation.
- CITE EXPLICITEMENT dans "market_insights" quelles ventes sont comparables et lesquelles ne le sont pas.
- En cas de doute sur la comparabilité, PRENDS LA FOURCHETTE BASSE.

LECTURE DES PRIX — RÈGLE ANTI-ERREUR ABSOLUE :
- Tu DOIS lire CHAQUE prix dans les sources CARACTÈRE PAR CARACTÈRE. C'est la donnée la plus critique de l'analyse.
- ERREURS FRÉQUENTES À ÉVITER :
  • Confondre 120 et 1 200 ou 12 000 (attention aux séparateurs de milliers qui varient : "1,200", "1 200", "1.200").
  • Confondre 320 et 120 (lire trop vite).
  • Ignorer la devise (HKD ≠ EUR).
  • Confondre estimation et prix d'adjudication.
- MÉTHODE OBLIGATOIRE pour chaque prix :
  1. Relis le passage EXACT de la source contenant le prix.
  2. Note le montant EXACT tel qu'écrit dans la source.
  3. Identifie s'il s'agit d'une estimation, d'un prix de départ, ou d'une adjudication.
  4. Convertis en euros si nécessaire.
  5. CITE le prix exact de la source dans "market_insights" avec le contexte : "Adjugé 320 € chez Rouillac" et non "environ 100-200 €".
- Si un prix te semble incohérent avec l'objet, SIGNALE-LE plutôt que de l'ignorer ou le "corriger" mentalement.

COMPARAISON DE L'ÉTAT — RÈGLE CRITIQUE POUR L'ESTIMATION :
- L'ÉTAT de l'objet soumis et celui des références sont DÉTERMINANTS pour la valeur.
- Pour CHAQUE référence de vente comparable, tu DOIS :
  1. Noter l'état de l'objet dans la référence (s'il est mentionné : "bon état", "accidents", "restauration", "manques", etc.).
  2. Comparer avec l'état visible sur les photos du vendeur.
  3. Ajuster l'estimation en conséquence.
- RÈGLES D'AJUSTEMENT :
  • Si la référence était en BON état et l'objet soumis est ABÎMÉ → l'estimation doit être SIGNIFICATIVEMENT inférieure au prix de référence (souvent -30% à -70%).
  • Si la référence était ABÎMÉE et l'objet soumis est en BON état → l'estimation peut être supérieure au prix de référence.
  • Si l'état est comparable → le prix de référence est directement applicable.
- MENTIONNE EXPLICITEMENT dans "condition_notes" l'état de chaque référence utilisée ET celui de l'objet soumis.
- NE JAMAIS utiliser un prix de référence sans préciser l'état de l'objet de référence.

HIÉRARCHIE DE FIABILITÉ DES PRIX — RÈGLE CRITIQUE :
- Les prix de vente réels (« vendu », « adjugé ») sont les données LES PLUS FIABLES.
- HIÉRARCHIE (du plus fiable au moins fiable) :
  1. VENTE CONFIRMÉE : « adjugé X € », « vendu X € » → PRIORITÉ ABSOLUE.
  2. ESTIMATION DE MAISON DE VENTE : « estimé X-Y € » → Fiable mais indicatif.
  3. PRIX DEMANDÉ EN GALERIE → Moins fiable, souvent supérieur au prix de marché.
  4. PRIX SUR MARKETPLACE (eBay, Etsy, 1stDibs) → Peu fiable, souvent gonflé.
  5. ESTIMATION ARTPRICE / INDEX → Contexte général.

CONVERSION DES DEVISES — RÈGLE CRITIQUE :
- Taux approximatifs : 1 HKD ≈ 0.12 €, 1 USD ≈ 0.92 €, 1 GBP ≈ 1.16 €, 1 CHF ≈ 1.04 €, 1 CNY ≈ 0.13 €, 1 JPY ≈ 0.006 €.
- Dans "estimated_range", TOUJOURS donner la fourchette en EUROS (€).

TRAITEMENT DES NOMS MENTIONNÉS PAR LE PROPRIÉTAIRE :
- Si le propriétaire mentionne un nom d'artiste, tu DOIS en tenir compte même si les correspondances visuelles ne confirment pas ce nom.
- Ne JAMAIS ignorer silencieusement un nom fourni par le propriétaire.

VENTE PUBLIQUE CONFIRMÉE — SIGNALEMENT PRIORITAIRE :
- Si tu trouves une vente confirmée de la MÊME œuvre → MENTIONNE-LE IMMÉDIATEMENT dans "summary" avec lien markdown.

DÉTECTION DE CONTRADICTIONS AVEC LE DESCRIPTIF VENDEUR :
- Commence par "Sauf erreur, " si tu trouves une contradiction.

SITES À PAYWALL — RÈGLE ENRICHIE :
- Domaines bloqués au scraping direct : drouot.com, gazette-drouot.com, invaluable.com, artnet.com, artprice.com, mutualart.com, liveauctioneers.com
- MAIS : tu recevras des SNIPPETS GOOGLE indexés depuis ces sites. Ces snippets contiennent souvent des prix d'adjudication, dates de ventes, et noms de maisons de vente FIABLES (car indexés par Google depuis les pages originales).
- UTILISE PLEINEMENT ces snippets paywall pour ton raisonnement et ton estimation. Ils sont une source de prix très précieuse.
- En revanche, ne JAMAIS inclure de LIEN CLIQUABLE vers ces domaines dans ta réponse (les utilisateurs ne pourraient pas y accéder).
- Quand tu cites un prix issu d'un snippet paywall, mentionne la source SANS lien : "Adjugé 2 500 € chez Christie's (Invaluable, mars 2024)" et NON "[Adjugé 2 500 €](https://invaluable.com/...)".
- HIÉRARCHIE des snippets paywall : Invaluable et Drouot sont les plus fiables (résultats d'enchères réels), suivis d'Artnet (peut inclure des estimations galerie).

FORMATAGE DES TEXTES — RÈGLES ULTRA-STRICTES :
- LIENS : TOUJOURS en markdown [texte descriptif](url). JAMAIS d'URL brute.
- MONTANTS : Séparateur de milliers avec espace. "39 000 €".
- DATES : Format français "mars 2024".

CONCISION OBLIGATOIRE :
- "identified_object" = UNE seule ligne au conditionnel.
- "identity_biography" = Section IDENTITÉ / BIOGRAPHIE structurée (voir règle ci-dessous).
- "summary" = 2-4 phrases courtes au conditionnel.
- Ne JAMAIS mentionner les outils techniques utilisés.

IDENTITÉ / BIOGRAPHIE — RÈGLE STRUCTURANTE :
Le champ "identity_biography" est le cœur de l'expertise. Son contenu varie selon la nature de l'objet :

CAS 1 — Œuvre d'art ou artisanat d'art (peinture, sculpture, céramique, estampe, bijou signé, mobilier d'ébéniste, etc.) :
- IDENTITÉ : Nature précise de l'œuvre, attribution au conditionnel, technique, époque.
- AUTHENTICITÉ : Éléments visuels observés (signatures, poinçons, marques) et leur cohérence. Si l'authenticité est un enjeu, l'indiquer clairement.
- BIOGRAPHIE : Éléments biographiques connus sur l'auteur/créateur (dates, mouvement, école, faits notables). Circonstances de création de l'œuvre si connues (commande, exposition, série, édition limitée).
- Le tout en 3-6 phrases maximum, au conditionnel quand approprié.

CAS 2 — Objet usuel ou de consommation (électroménager, vélo, imprimante, meuble contemporain, etc.) :
- IDENTITÉ : Marque, modèle, référence, année approximative.
- SPÉCIFICATIONS TECHNIQUES : Caractéristiques qui impactent la cote (ex: "imprime en A3", "moteur 125cc", "capacité 10 kg", "résolution 4K", "année 2019").
- Le tout en 2-4 phrases factuelles.

VÉRIFICATION FINALE OBLIGATOIRE (5 étapes) :
ÉTAPE A : Identifie le match_index avec le meilleur verdict.
ÉTAPE B : Vérifie que summary et identified_object sont basés sur cette correspondance.
ÉTAPE C : RELIS CHAQUE PRIX cité dans market_insights. Compare caractère par caractère avec le texte source. Corrige toute erreur de lecture (120 vs 320, 1 200 vs 12 000, etc.).
ÉTAPE D : Pour chaque référence de prix, vérifie que l'ÉTAT de la référence est mentionné et comparé à l'état de l'objet soumis. Ajuste l'estimation si l'état diffère.
ÉTAPE E : Vérifie que confidence_score est cohérent : une seule source = max 3, pas de match identique = max 3, état non comparable = baisse d'1 point.

JSON sans backticks :
{
  "identified_object": "1 ligne au conditionnel.",
  "identity_biography": "Identité, authenticité (si pertinent), biographie/spécifications techniques selon le type d'objet.",
  "alternative_identifications": ["Piste écartée avec explication et source"],
  "visual_comparisons": [
    {"match_index": 0, "verdict": "similaire", "details": "Différences précises observées."}
  ],
  "summary": "Synthèse avec liens markdown.",
  "estimated_range": "Fourchette en euros.",
  "condition_notes": "Détails état",
  "market_insights": "Pour CHAQUE prix cité, indiquer le verdict visuel correspondant.",
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
        lensContext += `\nTu DOIS mentionner TOUTES ces pistes dans ton analyse et expliquer laquelle tu retiens et POURQUOI.\n`;
      }
    }
    
    userContent.push({ type: "text", text: lensContext });

    // Include visual match THUMBNAIL IMAGES
    const matchesWithThumbnails = lensResults.visualMatches.filter((m: any) => m.thumbnail).slice(0, 6);
    if (matchesWithThumbnails.length > 0) {
      userContent.push({
        type: "text",
        text: "\n\n🔍 IMAGES DES CORRESPONDANCES VISUELLES — Compare CHAQUE image ci-dessous avec les photos du vendeur.\nPour CHAQUE correspondance, note les DIFFÉRENCES PRÉCISES (socle, pose, patine, dimensions apparentes, accessoires, drapés).",
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

  // Web/scraped results — separate paywall snippets from full-content scrapes
  if (webResults.length > 0) {
    const paywallResults = webResults.filter(r => 
      r.description?.includes("[Snippet Google indexé") || r.description?.includes("[Données issues de l'index Google")
    );
    const scrapedResults = webResults.filter(r => 
      !r.description?.includes("[Snippet Google indexé") && !r.description?.includes("[Données issues de l'index Google")
    );

    if (scrapedResults.length > 0) {
      const headerText = analysisDepth >= 3
        ? "CONTENU EXTRAIT DES PAGES SOURCES (scraping complet des sites accessibles)"
        : "RÉSULTATS DE RECHERCHE WEB (à croiser avec l'analyse visuelle)";
      let webContext = `\n\n${headerText} :\n`;
      for (const r of scrapedResults) {
        webContext += `\n--- Source : ${r.title} (${r.url}) ---\n`;
        if (r.description) webContext += `${r.description}\n`;
      }
      userContent.push({ type: "text", text: webContext });
    }

    if (paywallResults.length > 0) {
      let paywallContext = `\n\n📊 DONNÉES DE MARCHÉ EXTRAITES DES SITES D'ENCHÈRES (snippets Google indexés depuis les paywalls) :\n`;
      paywallContext += `⚠️ Ces données proviennent de l'index Google. Les prix et dates sont généralement fiables car indexés depuis Invaluable, Drouot, Artnet, etc.\n`;
      paywallContext += `⚠️ NE PAS inclure de liens cliquables vers ces sites dans ta réponse.\n\n`;
      for (const r of paywallResults) {
        paywallContext += `--- ${r.title} ---\n`;
        if (r.description) paywallContext += `${r.description}\n\n`;
      }
      userContent.push({ type: "text", text: paywallContext });
    }
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

  // FINAL REMINDER
  textDescription += `\n\n⚠️ RAPPEL FINAL : Après avoir rempli visual_comparisons, VÉRIFIE que ton summary et identified_object citent bien la correspondance avec le meilleur verdict.`;

  userContent.push({ type: "text", text: textDescription });
  messages.push({ role: "user", content: userContent });

  console.log("[analyze-estimation] Step 3: Running final analysis (depth:", analysisDepth, ")...");

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

    // Strip paywall links from markdown text fields
    const stripPaywallLinks = (text: string): string => {
      if (!text) return text;
      for (const domain of PAYWALL_DOMAINS) {
        const escaped = domain.replace(/\./g, "\\.");
        const regex = new RegExp(`\\[([^\\]]+)\\]\\(https?:\\/\\/[^)]*${escaped}[^)]*\\)`, "g");
        text = text.replace(regex, "$1");
      }
      return text;
    };

    // Strip bare/raw URLs
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

    // Verify coherence between visual_comparisons and summary
    if (parsed.visual_comparisons && Array.isArray(parsed.visual_comparisons)) {
      const bestVerdict = parsed.visual_comparisons.reduce((best: any, comp: any) => {
        const verdictOrder: Record<string, number> = { "identique": 4, "même_modèle": 3, "similaire": 2, "différent": 1 };
        const currentScore = verdictOrder[comp.verdict] || 0;
        const bestScore = best ? (verdictOrder[best.verdict] || 0) : 0;
        return currentScore > bestScore ? comp : best;
      }, null);

      if (bestVerdict) {
        console.log(`[analyze-estimation] Best visual verdict: ${bestVerdict.verdict} (match_index: ${bestVerdict.match_index})`);
        const hasStrongMatch = parsed.visual_comparisons.some((c: any) => c.verdict === "identique" || c.verdict === "même_modèle");
        if (!hasStrongMatch) {
          console.log("[analyze-estimation] WARNING: No 'identique' or 'même_modèle' visual match found");
        }
      }
    }

    // ── Post-processing: validate and cap confidence score ──
    let confidenceScore = typeof parsed.confidence_score === "number" ? parsed.confidence_score : 2;

    // Cap at 4 (5 reserved for auctioneer)
    confidenceScore = Math.min(confidenceScore, 4);

    // If no strong visual match, cap at 3
    const hasStrongVisualMatch = parsed.visual_comparisons?.some?.((c: any) =>
      c.verdict === "identique" || c.verdict === "même_modèle"
    );
    if (!hasStrongVisualMatch && confidenceScore > 3) {
      console.log("[analyze-estimation] Confidence capped: no strong visual match → max 3");
      confidenceScore = 3;
    }

    // If only 1 web source with a price, cap at 3
    const sourcesWithPrices = (parsed.web_sources || []).filter((s: any) =>
      s.relevance?.match?.(/adjugé|vendu|sold|prix|price/i)
    );
    if (sourcesWithPrices.length <= 1 && confidenceScore > 3) {
      console.log("[analyze-estimation] Confidence capped: ≤1 price source → max 3");
      confidenceScore = 3;
    }

    // If analysis depth is only level 1 (vision only), cap at 2
    if (analysisDepth <= 1 && confidenceScore > 2) {
      console.log("[analyze-estimation] Confidence capped: level 1 only → max 2");
      confidenceScore = 2;
    }

    // If analysis depth is level 2 (no web scraping), cap at 3
    if (analysisDepth === 2 && confidenceScore > 3) {
      console.log("[analyze-estimation] Confidence capped: level 2 (no web) → max 3");
      confidenceScore = 3;
    }

    parsed.confidence_score = confidenceScore;
    console.log(`[analyze-estimation] Final confidence_score: ${confidenceScore}`);
    
    
    return parsed;
  } catch {
    console.error("[analyze-estimation] Step 3 JSON parse error, using fallback");
    return {
      summary: rawContent,
      identified_object: "Analyse non structurée",
      estimated_range: "Non déterminé",
      recommendation: "à_examiner",
      recommendation_text: "L'analyse n'a pas pu être structurée correctement.",
      web_sources: [],
    };
  }
}

// ══════════════════════════════════════════════════════════════════
// MAIN HANDLER — Progressive 3-level pipeline
// ══════════════════════════════════════════════════════════════════
//
// Level 1: Gemini Vision only (~$0.005)     → non-art + high confidence → STOP
// Level 2: + Google Lens    (~$0.03)        → art objects → STOP, offer "Approfondir"
// Level 3: + Full web research (~$0.10+)    → auto for non-art, manual for art
//
// Parameters:
//   estimation_id: string (required)
//   force: boolean — bypass 60s lock
//   depth: "level_2" | "level_3" — force a specific depth (manual escalation)
// ══════════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { estimation_id, force, depth } = await req.json();
    if (!estimation_id) {
      return new Response(JSON.stringify({ error: "estimation_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestedDepth = depth === "level_3" ? 3 : depth === "level_2" ? 2 : 0; // 0 = auto
    console.log(`[analyze-estimation] Starting progressive analysis for ${estimation_id} (requested depth: ${requestedDepth || "auto"})`);

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

    // ── Anti-duplicate lock: skip if analyzed less than 60s ago (unless force=true or deepening) ──
    if (!force && !depth && estimation.ai_analyzed_at) {
      const analyzedAt = new Date(estimation.ai_analyzed_at).getTime();
      const now = Date.now();
      const elapsedSeconds = (now - analyzedAt) / 1000;
      if (elapsedSeconds < 60) {
        console.log(`[analyze-estimation] Skipping: already analyzed ${Math.round(elapsedSeconds)}s ago. Use force=true to override.`);
        return new Response(JSON.stringify({ 
          status: "skipped", 
          reason: "already_analyzed_recently",
          elapsed_seconds: Math.round(elapsedSeconds),
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const photoUrls: string[] = estimation.photo_urls || [];
    const userOwnMessage = (estimation.description || "").split("---")[0]?.trim() || "";

    // ═══════════════════════════════════════════════
    // STEP 1: Visual triage + search terms (ALWAYS)
    // ═══════════════════════════════════════════════
    let triage: TriageResult = {
      description: "",
      searchTerms: [],
      is_art_or_antique: true,
      triage_confidence: "low",
      object_type: "inconnu",
    };

    if (photoUrls.length > 0) {
      triage = await extractVisualSearchTermsWithTriage(photoUrls, supabaseUrl, lovableApiKey, userOwnMessage);
    }

    // ═══════════════════════════════════════════════
    // DECIDE ANALYSIS DEPTH
    // ═══════════════════════════════════════════════
    let effectiveDepth: number;

    if (requestedDepth > 0) {
      // Manual escalation requested
      effectiveDepth = requestedDepth;
      console.log(`[analyze-estimation] Manual depth requested: level ${effectiveDepth}`);
    } else if (!triage.is_art_or_antique && triage.triage_confidence === "high") {
      // Non-art + high confidence → Level 1 (vision only)
      effectiveDepth = 1;
      console.log(`[analyze-estimation] Triage: non-art + high confidence → Level 1 (vision only)`);
    } else if (!triage.is_art_or_antique && triage.triage_confidence === "medium") {
      // Non-art + medium confidence → Level 2 (+ Google Lens)
      effectiveDepth = serpApiKey ? 2 : 1;
      console.log(`[analyze-estimation] Triage: non-art + medium confidence → Level ${effectiveDepth}`);
    } else if (!triage.is_art_or_antique && triage.triage_confidence === "low") {
      // Non-art + low confidence → Level 3 (full search, auto)
      effectiveDepth = serpApiKey ? 3 : 1;
      console.log(`[analyze-estimation] Triage: non-art + low confidence → Level ${effectiveDepth} (auto-escalated)`);
    } else {
      // Art/antique → Level 2 by default (CP can trigger Level 3)
      effectiveDepth = serpApiKey ? 2 : 1;
      console.log(`[analyze-estimation] Triage: art/antique → Level ${effectiveDepth} (CP can deepen to Level 3)`);
    }

    // ═══════════════════════════════════════════════
    // EXECUTE PIPELINE BASED ON DEPTH
    // ═══════════════════════════════════════════════
    let lensResults: LensResult | null = null;
    let webResults: Array<{ title: string; url: string; description: string }> = [];
    let searchTerms = [...triage.searchTerms];

    // ── Level 2+: Google Lens ──
    if (effectiveDepth >= 2 && photoUrls.length > 0 && serpApiKey) {
      lensResults = await runGoogleLens(photoUrls, supabaseUrl, serpApiKey);
      if (lensResults.bestGuessLabels.length > 0) {
        searchTerms.push(...lensResults.bestGuessLabels.filter(l => !searchTerms.includes(l)));
      }
    }

    // ── Level 3: Scrape visual match URLs with Firecrawl + extract paywall snippets ──
    if (effectiveDepth >= 3) {
      const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

      // Strategy A: Scrape non-paywall URLs from Google Lens visual matches via Firecrawl
      if (firecrawlApiKey && lensResults && lensResults.visualMatches.length > 0) {
        console.log("[analyze-estimation] Level 3: Using Firecrawl to scrape visual match URLs");
        webResults = await scrapeVisualMatchUrls(lensResults.visualMatches, firecrawlApiKey);
      }

      // Strategy B: Extract data from paywall sites (Invaluable, Artnet, Drouot) via Google snippets
      if (serpApiKey && lensResults && lensResults.visualMatches.length > 0) {
        console.log("[analyze-estimation] Level 3: Extracting paywall insights via Google snippets");
        const paywallInsights = await extractPaywallInsights(
          lensResults.visualMatches,
          searchTerms,
          serpApiKey,
        );
        // Add paywall insights to web results (they contain source_type but the base type is compatible)
        for (const insight of paywallInsights) {
          webResults.push({
            title: insight.title,
            url: insight.url,
            description: insight.description,
          });
        }
        console.log(`[analyze-estimation] Level 3: Added ${paywallInsights.length} paywall insights`);
      }

      // Strategy C (fallback): if nothing found yet, use broad SerpAPI Google Search
      if (webResults.length === 0 && serpApiKey && searchTerms.length > 0) {
        console.log("[analyze-estimation] Level 3 fallback: Using SerpAPI Google Search");
        webResults = await searchWebReferences(searchTerms, serpApiKey);
      }

      // Dedupe web results by URL
      const seenUrls = new Set<string>();
      webResults = webResults.filter(r => {
        if (seenUrls.has(r.url)) return false;
        seenUrls.add(r.url);
        return true;
      });

      console.log(`[analyze-estimation] Level 3 complete: ${webResults.length} total enriched results`);
    }

    // ═══════════════════════════════════════════════
    // FINAL ANALYSIS (always runs)
    // ═══════════════════════════════════════════════
    const analysis = await runFinalAnalysis(
      estimation,
      photoUrls,
      supabaseUrl,
      lovableApiKey,
      triage.description,
      webResults,
      lensResults,
      effectiveDepth,
    );

    console.log("[analyze-estimation] Analysis complete:", analysis.recommendation, "| confidence_score:", analysis.confidence_score, "| depth:", effectiveDepth);

    // Attach metadata
    if (lensResults) {
      analysis.lens_detection = {
        bestGuessLabels: lensResults.bestGuessLabels,
        visualMatches: lensResults.visualMatches.slice(0, 8),
      };
    }

    // ── Progressive pipeline metadata ──
    analysis.analysis_depth = effectiveDepth;
    analysis.is_art_or_antique = triage.is_art_or_antique;
    analysis.object_type = triage.object_type;
    // can_deepen: true if analysis stopped before Level 3
    analysis.can_deepen = effectiveDepth < 3;
    analysis.scraped_results_count = webResults.length;
    analysis.paywall_insights_count = webResults.filter(r => 
      r.description?.includes("[Snippet Google indexé") || r.description?.includes("[Données issues de l'index Google")
    ).length;
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

    console.log(`[analyze-estimation] Saved successfully (depth: ${effectiveDepth}, can_deepen: ${analysis.can_deepen})`);

    return new Response(
      JSON.stringify({ success: true, analysis, estimation_id, depth: effectiveDepth }),
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
