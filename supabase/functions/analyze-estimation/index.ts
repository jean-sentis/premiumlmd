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
      // Replace internal unescaped double quotes: match "key": "value with "quotes" inside"
      // Strategy: parse field by field using regex
      const descMatch = cleaned.match(/"description"\s*:\s*"([\s\S]*?)"\s*,\s*"searchTerms"/);
      const termsMatch = cleaned.match(/"searchTerms"\s*:\s*\[([\s\S]*?)\]/);

      const description = descMatch ? descMatch[1].replace(/"/g, '\\"').replace(/\\\\"/g, '\\"') : "";
      let searchTerms: string[] = [];

      if (termsMatch) {
        // Extract quoted strings from the array
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

    // Extract quoted names (signatures, artists mentioned by Gemini)
    const quotedNames = raw.match(/(?:signé|signature|marqué|inscrit)\s*[«"']?\s*([A-ZÀ-Ü][A-Za-zà-ü\s-]{2,30})/gi) || [];
    for (const match of quotedNames) {
      const name = match.replace(/^(?:signé|signature|marqué|inscrit)\s*[«"']?\s*/i, "").trim();
      if (name.length >= 3) {
        fallbackTerms.push(`${name} artiste peintre`);
        fallbackTerms.push(`${name} enchères estimation`);
      }
    }

    // Extract capitalized proper names from Gemini's raw text
    const properNames = raw.match(/[A-ZÀ-Ü]{2,}[A-Za-zà-ü]*/g) || [];
    const stopWords = new Set(["JSON", "UNIQUEMENT", "IMPORTANT", "NOTE", "MAX", "ATTENTION", "URL", "HTTP", "HTTPS", "EUR"]);
    for (const name of properNames) {
      if (name.length >= 4 && !stopWords.has(name)) {
        fallbackTerms.push(`${name} artiste enchères`);
      }
    }

    // Also extract from searchTerms-like patterns in the raw text
    const termPatterns = raw.match(/"([^"]{5,60})"/g) || [];
    for (const t of termPatterns.slice(0, 5)) {
      const cleaned = t.replace(/^"|"$/g, "");
      if (cleaned.length >= 5 && !cleaned.includes("{") && !cleaned.includes(":")) {
        fallbackTerms.push(cleaned);
      }
    }

    // Deduplicate
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

  // Process only the first photo (most important, saves API quota)
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
    });

    const response = await fetch(`https://serpapi.com/search?${params.toString()}`);

    if (!response.ok) {
      const errText = await response.text();
      console.error("[analyze-estimation] SerpAPI error:", response.status, errText);
      return result;
    }

    const data = await response.json();

    // Extract knowledge graph / best guess
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

    // Extract visual matches (the core value - what Google Lens shows)
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

      // Extract search terms from the first few strong matches
      if (result.searchTermsFromLens.length < 5 && title.length > 5) {
        result.searchTermsFromLens.push(title);
      }
    }

    // Also check for text results / search suggestions
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

    // Log top 3 matches for debugging
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

  // Run up to 3 search queries in parallel
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

  // Deduplicate by URL
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
  const messages: any[] = [
    {
      role: "system",
      content: `Expert commissaire-priseur. Analyse croisée : photos → correspondances visuelles → recherche web.

RÈGLES IMPÉRATIVES :
- Analyse visuelle INDÉPENDANTE d'abord, puis confronte aux sources web.
- Ignore le titre d'un éventuel "lot similaire" mentionné par le propriétaire.
- Jamais de certitude sur un artiste sauf signature lisible ou sources convergentes.
- PRUDENCE OBLIGATOIRE : Ne JAMAIS écrire "il s'agit de", toujours utiliser des formulations conditionnelles.
- FIABILITÉ : Note ta confiance de 1 à 4 (0 et 5 réservés au commissaire-priseur).

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

CONCISION OBLIGATOIRE :
- "identified_object" = UNE seule ligne (type, matériau, style/époque). Au conditionnel.
- "summary" = 2-3 phrases courtes MAX. Au conditionnel.
- Les détails longs vont dans authenticity_assessment, condition_notes, market_insights.
- Ne JAMAIS mentionner les outils techniques utilisés (Google Vision, Google Lens, API, etc.).

JSON sans backticks :
{
  "identified_object": "1 ligne au conditionnel",
  "summary": "2-3 phrases MAX au conditionnel",
  "estimated_range": "Fourchette en € UNIQUEMENT (après conversion si nécessaire) ou 'À confirmer'",
  "authenticity_assessment": "Détails authenticité (au conditionnel)",
  "condition_notes": "Détails état",
  "market_insights": "Contexte marché, ventes récentes (prix originaux + conversion €)",
  "web_sources": [{"title":"","url":"","relevance":""}],
  "recommendation": "très_intéressant|intéressant|à_examiner|peu_intéressant|hors_spécialité",
  "recommendation_text": "1 phrase",
  "questions_for_owner": ["2-3 questions"],
  "confidence_score": 3,
  "limitations": "1 phrase"
}`,
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

  // Google Lens visual matches (SerpAPI)
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
    }
    
    userContent.push({ type: "text", text: lensContext });
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
    return JSON.parse(cleaned);
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
    // Google API keys no longer needed for search

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

    // Extract user text for search enrichment
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

    // SerpAPI Google Lens (reverse image search — replaces Vision API)
    if (photoUrls.length > 0 && serpApiKey) {
      parallelTasks.push(
        runGoogleLens(photoUrls, supabaseUrl, serpApiKey).then((r) => {
          lensResults = r;
          // Augment search terms with Lens labels
          if (r.bestGuessLabels.length > 0) {
            searchTerms.push(...r.bestGuessLabels.filter((l) => !searchTerms.includes(l)));
          }
        }),
      );
    } else if (!serpApiKey) {
      console.warn("[analyze-estimation] SERPAPI_API_KEY not configured, skipping Google Lens");
    }

    // Google Search via SerpAPI (runs in parallel with Lens using initial terms from Step 1)
    if (searchTerms.length > 0 && serpApiKey) {
      parallelTasks.push(
        searchWebReferences(searchTerms, serpApiKey).then((r) => {
          webResults = r;
        }),
      );
    }

    await Promise.all(parallelTasks);

    // If Lens gave us new terms and search had no results, retry with Lens labels
    if (webResults.length === 0 && lensResults && lensResults.bestGuessLabels.length > 0 && serpApiKey) {
      console.log("[analyze-estimation] Retrying SerpAPI Search with Lens labels:", lensResults.bestGuessLabels);
      webResults = await searchWebReferences(lensResults.bestGuessLabels, serpApiKey);
    }

    // ── EXTRA: Targeted auction platform searches (Drouot, Interenchères) ──
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
      ];
      const auctionQueries: string[] = [];
      
      // Use OR syntax to search multiple sites in fewer queries (saves API quota)
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

    // ── EXTRA: Search based on user text clues (signatures, artist names) ──
    if (serpApiKey && userOwnMessage.length > 5) {
      const extraTerms: string[] = [];

      // Flexible regex: handles text between keyword and name, case-insensitive
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

      // Also check for capitalized words that could be proper names
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
