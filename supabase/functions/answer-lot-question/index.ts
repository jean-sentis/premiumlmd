import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, lotTitle, lotDescription, lotDimensions, lotPrice } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es l'assistant virtuel de "Douze pages & associés", une maison de ventes aux enchères en Corse.
Tu réponds aux questions des clients concernant les lots After Sale (vente directe après enchères).

Informations sur le lot :
- Titre : ${lotTitle || "Non spécifié"}
- Description : ${lotDescription || "Non disponible"}
- Dimensions : ${lotDimensions || "Non spécifiées"}
- Prix : ${lotPrice ? `${lotPrice.toLocaleString('fr-FR')} €` : "Non spécifié"}

Règles :
- Réponds en français, de manière professionnelle et chaleureuse
- Si tu ne connais pas la réponse, suggère de contacter l'équipe au 04 95 12 12 12
- Ne donne pas d'informations que tu n'as pas
- Sois concis (2-3 phrases maximum)
- Pour les questions sur l'authenticité, les conditions de vente, ou le paiement, renvoie vers l'équipe`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ answer: "Notre assistant est momentanément surchargé. Appelez-nous au 04 95 12 12 12." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "Je n'ai pas pu répondre. Contactez-nous au 04 95 12 12 12.";

    console.log("[answer-lot-question] Question:", question);
    console.log("[answer-lot-question] Answer:", answer);

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in answer-lot-question:", error);
    return new Response(
      JSON.stringify({ 
        answer: "Je n'ai pas pu répondre pour le moment. Contactez notre équipe au 04 95 12 12 12.",
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
