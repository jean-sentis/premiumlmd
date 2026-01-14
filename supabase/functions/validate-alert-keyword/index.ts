import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Spécialités disponibles (mêmes que newsletter)
const SPECIALTIES = [
  'Affiches',
  'Argenterie',
  "Art d'Asie",
  'Art Déco - Design',
  'Art Moderne',
  'Art Nouveau',
  "Arts d'Orient & de l'Inde",
  "Ateliers d'artistes",
  'Automobiles de collection',
  'BD',
  'Céramiques',
  'Collections',
  'Culture Pop',
  'Estampes de collection',
  'Haute Couture / Mode',
  'Horlogerie - Montres',
  'Instruments de musique',
  'Joaillerie',
  'Livres & Autographes',
  'Marine et Voyage',
  'Militaria',
  "Mobilier & Objets d'art",
  'Numismatique',
  'Orientalisme',
  'Philatélie',
  'Photographie',
  'Tableaux anciens',
  'Ventes de Solidarité',
  'Vintage',
  'Vins et Spiritueux',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword } = await req.json();
    
    if (!keyword || typeof keyword !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Le mot-clé est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          isValid: true, 
          originalKeyword: keyword,
          suggestedKeyword: keyword,
          specialty: null,
          explanation: null,
          needsConfirmation: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const specialtiesList = SPECIALTIES.join(', ');

    const systemPrompt = `Tu es un expert en ventes aux enchères. Ton rôle est de valider les mots-clés de recherche pour des alertes d'enchères et de déterminer à quelle spécialité ils appartiennent.

Spécialités disponibles: ${specialtiesList}

Analyse le mot-clé fourni et détermine:
1. S'il contient des fautes d'orthographe → corrige-les
2. S'il fait sens dans le contexte des ventes aux enchères
3. À quelle spécialité il appartient le plus probablement
4. S'il est AMBIGU ou INSUFFISANT pour comprendre ce que cherche l'utilisateur

Réponds UNIQUEMENT en JSON avec ce format exact:
{
  "isValid": boolean,
  "needsMoreInfo": boolean,
  "suggestedKeyword": "le mot-clé corrigé ou original si correct, null si needsMoreInfo=true",
  "specialty": "la spécialité la plus pertinente, ou null",
  "needsConfirmation": boolean,
  "explanation": "explication courte",
  "clarificationQuestion": "question à poser si needsMoreInfo=true, sinon null"
}

RÈGLES IMPORTANTES:
- Si le terme est trop court, ambigu, ou pourrait correspondre à plusieurs choses différentes → needsMoreInfo=true
- Si le terme est un nombre seul (404, 911, etc.) → needsMoreInfo=true, demande de préciser (marque, contexte)
- Si le terme est un mot courant qui pourrait avoir plusieurs sens → needsMoreInfo=true

Exemples:
- "Rolex" → {"isValid": true, "needsMoreInfo": false, "suggestedKeyword": "Rolex", "specialty": "Horlogerie - Montres", "needsConfirmation": true, "explanation": "Rolex, manufacture horlogère suisse de luxe fondée en 1905.", "clarificationQuestion": null}
- "404" → {"isValid": false, "needsMoreInfo": true, "suggestedKeyword": null, "specialty": null, "needsConfirmation": false, "explanation": "Ce terme est ambigu.", "clarificationQuestion": "Pouvez-vous préciser ? S'agit-il d'une voiture (Peugeot 404), d'un modèle particulier, ou d'autre chose ?"}
- "Peugeot 404" → {"isValid": true, "needsMoreInfo": false, "suggestedKeyword": "Peugeot 404", "specialty": "Automobiles de collection", "needsConfirmation": true, "explanation": "La Peugeot 404, berline française produite de 1960 à 1975, devenue un classique de l'automobile.", "clarificationQuestion": null}
- "911" → {"isValid": false, "needsMoreInfo": true, "suggestedKeyword": null, "specialty": null, "needsConfirmation": false, "explanation": "Ce terme est ambigu.", "clarificationQuestion": "Voulez-vous parler de la Porsche 911, le célèbre modèle de voiture de sport ?"}
- "Porsche 911" → {"isValid": true, "needsMoreInfo": false, "suggestedKeyword": "Porsche 911", "specialty": "Automobiles de collection", "needsConfirmation": true, "explanation": "La Porsche 911, icône automobile produite depuis 1964, symbole de la marque allemande.", "clarificationQuestion": null}
- "Louis" → {"isValid": false, "needsMoreInfo": true, "suggestedKeyword": null, "specialty": null, "needsConfirmation": false, "explanation": "Ce prénom est trop courant.", "clarificationQuestion": "Pouvez-vous préciser ? Louis Vuitton, Louis XV, un artiste en particulier ?"}
- "asdfgh" → {"isValid": false, "needsMoreInfo": false, "suggestedKeyword": null, "specialty": null, "needsConfirmation": false, "explanation": "Ce terme ne correspond pas à un objet, artiste ou marque reconnu.", "clarificationQuestion": null}`;

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
          { role: "user", content: `Mot-clé à valider: "${keyword}"` }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ 
          isValid: true, 
          originalKeyword: keyword,
          suggestedKeyword: keyword,
          specialty: null,
          explanation: null,
          needsConfirmation: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      result = {
        isValid: true,
        suggestedKeyword: keyword,
        specialty: null,
        needsConfirmation: false,
        explanation: null
      };
    }

    return new Response(
      JSON.stringify({
        originalKeyword: keyword,
        ...result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-alert-keyword:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
