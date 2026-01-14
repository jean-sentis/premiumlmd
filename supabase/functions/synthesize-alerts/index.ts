import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TasteData {
  styles: string[];
  ambiances: string[];
  categories: string[];
  periods: string[];
  materials: string[];
  colors: string[];
  budget_min?: number;
  budget_max?: number;
}

interface UserContext {
  interests?: string[];
  memorizedLots?: Array<{ title: string; categories?: string[] }>;
  alerts?: string[];
  purchaseOrders?: Array<{ lotTitle: string; maxBid: number }>;
}

const systemPrompt = `Tu es Lia, conseillère experte en ventes aux enchères. Tu dois synthétiser le profil de goûts d'un client pour créer des alertes pertinentes.

OBJECTIF:
À partir des données du profil de goûts et du contexte utilisateur, génère une liste de 5 à 10 mots-clés d'alertes PERTINENTS et SYNTHÉTIQUES.

RÈGLES DE SYNTHÈSE:
1. NE PAS reprendre tous les mots bruts - INTERPRÉTER et SYNTHÉTISER
2. Croiser les informations pour créer des termes de recherche efficaces
3. Privilégier les termes qui correspondent à des objets réels aux enchères
4. Éviter les doublons et les termes trop génériques

EXEMPLES DE SYNTHÈSE:
- Si categories=["Mobilier"] + periods=["XVIIIe"] → "mobilier XVIIIe"
- Si styles=["Art Déco"] + materials=["Bronze"] → "bronze Art Déco"
- Si categories=["Bijoux"] + materials=["Or", "Diamant"] → "bijoux or", "diamants"
- Si styles=["Minimaliste", "Contemporain"] + categories=["Sculptures"] → "sculpture contemporaine"

PRIORITÉS:
1. Les combinaisons catégorie + période/style sont les plus efficaces
2. Les créateurs/artistes mentionnés sont prioritaires
3. Les matériaux précis avec leur contexte
4. Les termes issus des intérêts newsletter et des lots mémorisés

FORMAT DE RÉPONSE (JSON obligatoire):
{
  "keywords": ["mot-clé 1", "mot-clé 2", ...],
  "explanation": "Phrase d'explication pour le client sur pourquoi ces alertes ont été choisies"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tasteData, userContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context for synthesis
    let dataContext = "DONNÉES À SYNTHÉTISER:\n\n";
    
    if (tasteData) {
      dataContext += "PROFIL DE GOÛTS:\n";
      if (tasteData.styles?.length > 0) dataContext += `- Styles: ${tasteData.styles.join(', ')}\n`;
      if (tasteData.categories?.length > 0) dataContext += `- Catégories: ${tasteData.categories.join(', ')}\n`;
      if (tasteData.periods?.length > 0) dataContext += `- Périodes: ${tasteData.periods.join(', ')}\n`;
      if (tasteData.materials?.length > 0) dataContext += `- Matériaux: ${tasteData.materials.join(', ')}\n`;
      if (tasteData.ambiances?.length > 0) dataContext += `- Ambiances: ${tasteData.ambiances.join(', ')}\n`;
      if (tasteData.colors?.length > 0) dataContext += `- Couleurs: ${tasteData.colors.join(', ')}\n`;
      if (tasteData.budget_min || tasteData.budget_max) {
        dataContext += `- Budget: ${tasteData.budget_min || '?'}€ - ${tasteData.budget_max || '?'}€\n`;
      }
    }

    if (userContext) {
      dataContext += "\nCONTEXTE UTILISATEUR:\n";
      if (userContext.interests?.length > 0) {
        dataContext += `- Intérêts newsletter: ${userContext.interests.join(', ')}\n`;
      }
      if (userContext.memorizedLots?.length > 0) {
        const titles = userContext.memorizedLots.slice(0, 5).map((l: any) => l.title).join(', ');
        dataContext += `- Lots mémorisés: ${titles}\n`;
      }
      if (userContext.purchaseOrders?.length > 0) {
        const orders = userContext.purchaseOrders.slice(0, 3).map((o: any) => o.lotTitle).join(', ');
        dataContext += `- Ordres d'achat sur: ${orders}\n`;
      }
    }

    console.log("Synthesizing alerts with context:", dataContext.substring(0, 300));

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
          { role: "user", content: dataContext + "\n\nGénère les mots-clés d'alertes synthétisés." }
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédit IA épuisé." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI synthesis response:", content.substring(0, 300));

    // Parse JSON response
    let parsedResponse;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      parsedResponse = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback
      parsedResponse = {
        keywords: [],
        explanation: "Je n'ai pas pu synthétiser les alertes automatiquement."
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in synthesize-alerts function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
