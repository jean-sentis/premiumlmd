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
): Promise<{ description: string; searchTerms: string[] }> {
  const imageContent: any[] = [];
  for (const url of photoUrls) {
    const fullUrl = url.startsWith("http") ? url : `${supabaseUrl}/storage/v1/object/public/${url}`;
    imageContent.push({ type: "image_url", image_url: { url: fullUrl } });
  }

  const messages = [
    {
      role: "system",
      content: `Tu es un expert en art et antiquités. Analyse les photos et produis un JSON avec :
- "description" : description visuelle factuelle de l'objet (type, style, matériaux, signatures/poinçons visibles, époque probable). 3-4 phrases maximum.
- "searchTerms" : un tableau de 3 à 5 termes de recherche web pertinents pour identifier cet objet ou trouver des objets similaires sur des sites d'enchères. Chaque terme doit être une combinaison utile (ex: "vase art nouveau Gallé", "pendule bronze Empire", "huile sur toile paysage Barbizon"). Inclus des variantes si pertinent (nom d'artiste potentiel, technique, style).

Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.`,
    },
    {
      role: "user",
      content: [
        { type: "text", text: "Analyse ces photos et génère les termes de recherche :" },
        ...imageContent,
      ],
    },
  ];

  console.log("[analyze-estimation] Step 1: Extracting visual search terms...");

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
    console.error("[analyze-estimation] Step 1 JSON parse failed, raw:", raw.substring(0, 200));
    return { description: raw, searchTerms: [] };
  }
}

// ── Step 2: Search the web using Firecrawl ──
async function searchWebReferences(
  searchTerms: string[],
  firecrawlApiKey: string,
): Promise<Array<{ title: string; url: string; description: string; markdown?: string }>> {
  const allResults: Array<{ title: string; url: string; description: string; markdown?: string }> = [];

  // Run up to 3 search queries in parallel
  const queries = searchTerms.slice(0, 3).map((term) =>
    `${term} enchères estimation prix`
  );

  console.log("[analyze-estimation] Step 2: Searching web with Firecrawl...", queries);

  const searchPromises = queries.map(async (query) => {
    try {
      const response = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit: 3,
          scrapeOptions: {
            formats: ["markdown"],
            onlyMainContent: true,
          },
        }),
      });

      if (!response.ok) {
        console.error(`[analyze-estimation] Firecrawl search failed for "${query}":`, response.status);
        return [];
      }

      const data = await response.json();
      return (data.data || []).map((r: any) => ({
        title: r.title || "",
        url: r.url || "",
        description: r.description || "",
        markdown: r.markdown?.substring(0, 1500) || "", // Limit to avoid token overflow
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
  return unique.slice(0, 8); // Max 8 results
}

// ── Step 3: Final AI analysis with cross-referenced sources ──
async function runFinalAnalysis(
  estimation: any,
  photoUrls: string[],
  supabaseUrl: string,
  lovableApiKey: string,
  visualDescription: string,
  webResults: Array<{ title: string; url: string; description: string; markdown?: string }>,
): Promise<any> {
  const messages: any[] = [
    {
      role: "system",
      content: `Tu es un expert commissaire-priseur avec 30 ans d'expérience en art, antiquités, bijoux, mobilier, véhicules de collection, vins et spiritueux.

Tu reçois une demande d'estimation d'un particulier. Tu dois analyser les PHOTOS FOURNIES et les RÉSULTATS DE RECHERCHE WEB pour donner un avis professionnel croisé et sourcé.

MÉTHODE D'ANALYSE CROISÉE :
1. Analyse visuelle INDÉPENDANTE des photos (ce que tu vois réellement)
2. Confrontation avec les résultats de recherche web (objets similaires trouvés, prix en enchères, artistes identifiés)
3. Si les sources web confirment ton analyse visuelle, augmente ta confiance
4. Si les sources web contredisent ou apportent des éléments nouveaux, intègre-les avec nuance
5. Cite tes sources web quand elles sont pertinentes (nom du site, URL)

RÈGLE CRITIQUE — ANALYSE DES PHOTOS :
- Analyse les photos de manière INDÉPENDANTE d'abord, puis confronte avec les sources web.
- Si un lot de référence est mentionné dans la description (cas "objet similaire"), IGNORE le titre du lot de référence pour ton identification. Analyse la photo comme si tu la voyais pour la première fois.
- Utilise tes capacités de reconnaissance visuelle au maximum.

RÈGLES DE FORMULATION :
- N'affirme JAMAIS avec certitude l'identité d'un artiste SAUF si (a) une signature est clairement lisible OU (b) plusieurs sources web convergent vers la même identification.
- Quand les sources web confirment, utilise : "L'analyse visuelle, corroborée par [source], suggère..."
- Quand c'est incertain : "pourrait être", "évoque le style de", "à confirmer par un examen physique"
- Pour l'estimation chiffrée, appuie-toi sur les prix comparables trouvés en ligne quand disponibles.
- Mentionne les limites de l'analyse photographique.

Ta réponse doit être un JSON structuré avec les champs suivants :
- summary (string) : Résumé de ce que tu VOIS et ce que les sources web confirment/infirment
- identified_object (string) : Identification croisée photo + web. Cite les sources qui confirment.
- authenticity_assessment (string) : Éléments visuels et contextuels orientant vers authenticité ou réserves
- condition_notes (string) : État apparent + limites de l'observation photo
- estimated_range (string) : Fourchette basée sur comparables trouvés en ligne si possible (ex: "800 - 1 200 € (basé sur ventes similaires sur [site])"), ou "Estimation impossible sans examen physique"
- market_insights (string) : Contexte marché avec données web réelles (ventes récentes, tendances, cotes)
- web_sources (array of {title: string, url: string, relevance: string}) : Les 2-5 sources web les plus pertinentes utilisées, avec une phrase expliquant leur pertinence
- recommendation (string) : "très_intéressant" | "intéressant" | "à_examiner" | "peu_intéressant" | "hors_spécialité"
- recommendation_text (string) : Explication de la recommandation (1-2 phrases)
- questions_for_owner (string[]) : Questions pour affiner l'estimation (2-4 questions)
- confidence_level (string) : "élevée" | "moyenne" | "faible" — basée sur convergence vision + web
- limitations (string) : Ce qui manque pour une analyse fiable

Réponds UNIQUEMENT avec le JSON, sans markdown ni backticks.`,
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

  // Web search results
  if (webResults.length > 0) {
    let webContext = "\n\nRÉSULTATS DE RECHERCHE WEB (à croiser avec l'analyse visuelle) :\n";
    for (const r of webResults) {
      webContext += `\n--- Source : ${r.title} (${r.url}) ---\n`;
      if (r.description) webContext += `Résumé : ${r.description}\n`;
      if (r.markdown) webContext += `Contenu : ${r.markdown.substring(0, 800)}\n`;
    }
    userContent.push({ type: "text", text: webContext });
  } else {
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

    console.log(`[analyze-estimation] Starting 3-step analysis for ${estimation_id}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

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

    if (photoUrls.length > 0) {
      const step1 = await extractVisualSearchTerms(photoUrls, supabaseUrl, lovableApiKey);
      visualDescription = step1.description;
      searchTerms = step1.searchTerms;
    }

    // ── STEP 2: Web search via Firecrawl ──
    let webResults: Array<{ title: string; url: string; description: string; markdown?: string }> = [];

    if (searchTerms.length > 0 && firecrawlApiKey) {
      webResults = await searchWebReferences(searchTerms, firecrawlApiKey);
    } else if (!firecrawlApiKey) {
      console.warn("[analyze-estimation] FIRECRAWL_API_KEY not configured, skipping web search");
    }

    // ── STEP 3: Final cross-referenced analysis ──
    const analysis = await runFinalAnalysis(
      estimation,
      photoUrls,
      supabaseUrl,
      lovableApiKey,
      visualDescription,
      webResults,
    );

    console.log("[analyze-estimation] Analysis complete:", analysis.recommendation, "| confidence:", analysis.confidence_level);

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
