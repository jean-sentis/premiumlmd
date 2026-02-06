import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    console.log(`[analyze-estimation] Starting analysis for ${estimation_id}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

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

    console.log(`[analyze-estimation] Found estimation: ${estimation.nom} - ${estimation.description?.substring(0, 50)}`);

    // Build messages for AI analysis
    const messages: any[] = [
      {
        role: "system",
        content: `Tu es un expert commissaire-priseur avec 30 ans d'expérience en art, antiquités, bijoux, mobilier, véhicules de collection, vins et spiritueux.

Tu reçois une demande d'estimation d'un particulier. Tu dois analyser les PHOTOS FOURNIES pour donner un avis professionnel PRUDENT et NUANCÉ.

RÈGLE CRITIQUE — ANALYSE DES PHOTOS :
- Tu dois TOUJOURS analyser les photos de manière INDÉPENDANTE, en te basant UNIQUEMENT sur ce que tu VOIS dans les images.
- Si un lot de référence est mentionné dans la description (cas "objet similaire"), IGNORE complètement le titre et la description du lot de référence pour ton identification. Le propriétaire dit simplement qu'il possède "un objet similaire" — cela ne signifie PAS que c'est le même objet. Analyse la photo comme si tu la voyais pour la première fois, sans a priori.
- Utilise tes capacités de reconnaissance visuelle au maximum : identifie le type d'objet, le style, l'époque, les matériaux visibles, les techniques, les marques ou signatures visibles.

RÈGLES DE FORMULATION :
- N'affirme JAMAIS avec certitude l'identité d'un artiste, d'un fabricant ou d'une époque à partir de photos uniquement. Utilise des formulations comme : "pourrait être", "ressemble à", "évoque le style de", "rappelle la production de", "à confirmer par un examen physique".
- La SEULE exception où tu peux affirmer : quand une signature, un poinçon ou une marque est CLAIREMENT LISIBLE sur la photo. Dans ce cas, précise "signature lisible" ou "poinçon identifiable".
- Pour l'estimation chiffrée, donne TOUJOURS une fourchette large et précise qu'elle est indicative et soumise à examen.
- Ne prétends JAMAIS avoir identifié formellement un objet que tu n'as vu qu'en photo. Un examen physique est toujours nécessaire.
- Mentionne systématiquement les limites de l'analyse photographique (angles manquants, lumière, résolution, impossibilité de vérifier matériaux/poids/texture).

Ta réponse doit être un JSON structuré avec les champs suivants :
- summary (string) : Résumé en 2-3 phrases de ce que tu VOIS sur les photos et de ton impression générale, en utilisant le conditionnel
- identified_object (string) : Ce que tu PENSES identifier EN REGARDANT LES PHOTOS (type, époque probable, style, artiste/fabricant POSSIBLE). Utilise "pourrait être", "évoque", "rappelle". NE TE BASE PAS sur le titre du lot de référence.
- authenticity_assessment (string) : Éléments visuels qui pourraient orienter vers une authenticité ou des réserves — JAMAIS de conclusion définitive
- condition_notes (string) : Notes sur l'état APPARENT de l'objet d'après les photos, en précisant les limites de l'observation photographique
- estimated_range (string) : Fourchette d'estimation INDICATIVE (ex: "800 - 1 200 € (sous réserve d'examen)"), ou "Estimation impossible sans examen physique" si tu ne peux pas
- market_insights (string) : Contexte marché (demande actuelle, tendances, comparables récents si pertinent)
- recommendation (string) : "très_intéressant" | "intéressant" | "à_examiner" | "peu_intéressant" | "hors_spécialité"
- recommendation_text (string) : Explication de ta recommandation au commissaire-priseur (1-2 phrases)
- questions_for_owner (string[]) : Questions à poser au propriétaire pour affiner l'estimation (2-4 questions). Inclure systématiquement : provenance, historique de propriété, existence de certificats/factures
- confidence_level (string) : "élevée" | "moyenne" | "faible" — ton niveau de confiance dans cette analyse à distance
- limitations (string) : Ce qui manque pour une analyse fiable (ex: "vue du dos nécessaire", "signature à vérifier en main", "matériau à tester")

Réponds UNIQUEMENT avec le JSON, sans markdown ni backticks.`,
      },
    ];

    // Build user message with photos — PHOTOS FIRST, then context
    const userContent: any[] = [];

    // Add photos FIRST so the AI analyzes them before reading any text context
    const photoUrls: string[] = estimation.photo_urls || [];
    if (photoUrls.length > 0) {
      console.log(`[analyze-estimation] Including ${photoUrls.length} photos for vision analysis`);
      userContent.push({ type: "text", text: "PHOTOS DE L'OBJET À ANALYSER (analyse ces photos en priorité, indépendamment de tout contexte textuel) :" });
      for (const url of photoUrls) {
        const fullUrl = url.startsWith("http") ? url : `${supabaseUrl}/storage/v1/object/public/${url}`;
        userContent.push({
          type: "image_url",
          image_url: { url: fullUrl },
        });
      }
    } else {
      userContent.push({
        type: "text",
        text: "⚠️ Aucune photo fournie. Analyse basée uniquement sur la description textuelle.",
      });
    }

    // Add text description AFTER photos — and strip lot reference details for the AI to avoid bias
    let textDescription = `\n\nCONTEXTE (informatif uniquement, ne pas utiliser pour identifier l'objet) :`;
    
    // Extract only the user's own message, not the pre-filled lot reference
    const userMessage = estimation.description || "";
    const userOwnMessage = userMessage.split("---")[0]?.trim() || userMessage;
    textDescription += `\nMessage du propriétaire : ${userOwnMessage}`;
    
    // Add lot reference as separate context, clearly marked
    if (estimation.related_lot_id) {
      const lotRefParts = userMessage.split("---").slice(1).join("---").trim();
      if (lotRefParts) {
        textDescription += `\n\n[INFO CONTEXTE : Le propriétaire a indiqué posséder un objet qu'il considère "similaire" au lot suivant. Cela ne signifie PAS que c'est le même objet. Cette information est fournie à titre indicatif uniquement.]\n${lotRefParts}`;
      }
    }

    if (estimation.estimated_value) {
      textDescription += `\n\nEstimation espérée par le propriétaire : ${estimation.estimated_value}`;
    }
    if (estimation.object_category) {
      textDescription += `\n\nCatégorie indiquée : ${estimation.object_category}`;
    }

    userContent.push({ type: "text", text: textDescription });

    messages.push({ role: "user", content: userContent });

    console.log("[analyze-estimation] Calling Lovable AI Gateway with Vision...");

    // Call Lovable AI Gateway
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
      console.error("[analyze-estimation] AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${aiResponse.status}: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    console.log("[analyze-estimation] AI response received, parsing...");

    // Parse the JSON response (handle potential markdown wrapping)
    let analysis;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[analyze-estimation] JSON parse error:", parseErr);
      analysis = {
        summary: rawContent,
        identified_object: "Analyse non structurée",
        estimated_range: "Non déterminé",
        recommendation: "à_examiner",
        recommendation_text: "L'analyse IA n'a pas pu être structurée correctement.",
      };
    }

    console.log("[analyze-estimation] Analysis parsed successfully:", analysis.recommendation);

    // Update the estimation request with AI analysis
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
      JSON.stringify({
        success: true,
        analysis,
        estimation_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[analyze-estimation] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
