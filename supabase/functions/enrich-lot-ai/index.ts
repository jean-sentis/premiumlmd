import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  ANALYZE_LOT_TOOL,
  JUDGE_SYSTEM_PROMPT,
  buildJudgeUserPrompt,
  JUDGE_TOOL,
  type LotInput,
  type AnalysisResult as SharedAnalysisResult,
} from "./prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  explanation: string;
  creator_info: string | null;
}

// Limite de taille d'image pour éviter les dépassements de mémoire
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB max

/**
 * Convertit un ArrayBuffer en base64 par chunks (évite stack overflow)
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binaryString = '';
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binaryString += String.fromCharCode(...chunk);
  }
  
  return btoa(binaryString);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { lot_id, dry_run = true, analyze_images = false, mode, test_lot, analysis } = body;

    // ---- MODE JUGE : évalue une analyse existante (utilisé par la suite de tests) ----
    if (mode === 'judge') {
      if (!test_lot || !analysis) {
        return new Response(
          JSON.stringify({ success: false, error: 'mode "judge" requires test_lot and analysis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const verdict = await runJudge(LOVABLE_API_KEY, test_lot as LotInput, analysis as SharedAnalysisResult);
      return new Response(
        JSON.stringify({ success: true, verdict }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lot_id && !test_lot) {
      return new Response(
        JSON.stringify({ success: false, error: 'lot_id or test_lot is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le lot (ou utiliser un lot fourni en clair pour les tests)
    let lot: any;
    if (test_lot) {
      lot = {
        lot_number: 'TEST',
        title: test_lot.title,
        description: test_lot.description ?? null,
        dimensions: test_lot.dimensions ?? null,
        images: [],
      };
    } else {
      const { data, error: lotError } = await supabase
        .from('interencheres_lots')
        .select('*')
        .eq('id', lot_id)
        .single();

      if (lotError || !data) {
        throw new Error(`Lot not found: ${lot_id}`);
      }
      lot = data;
    }

    console.log(`Processing lot ${lot.lot_number}: "${lot.title}"`);

    // Prompts partagés (voir prompts.ts)
    const systemPrompt = SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt(lot as LotInput);

    // Appel à l'IA avec tool calling pour extraction structurée
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [ANALYZE_LOT_TOOL],
        tool_choice: { type: 'function', function: { name: 'analyze_lot' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extraire le résultat du tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'analyze_lot') {
      throw new Error('Unexpected AI response format');
    }

    const analysis: AnalysisResult = JSON.parse(toolCall.function.arguments);
    console.log('Text analysis complete');

    // Analyse des images si demandé
    let imageAnalysis = null;
    
    if (analyze_images && lot.images && lot.images.length > 0) {
      console.log(`Analyzing ${lot.images.length} images...`);
      
      let imageUrl = lot.images[0];
      
      // Déterminer le type d'URL
      const isSupabaseStorageUrl = imageUrl.includes('supabase.co/storage') || imageUrl.includes(supabaseUrl);
      const isExternalUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
      const isLocalPath = imageUrl.startsWith('/');
      
      if (isLocalPath) {
        console.log(`Image is a local path (not accessible): ${imageUrl}`);
        imageAnalysis = "⚠️ L'image est stockée localement dans le projet. Pour activer l'analyse visuelle, utilisez une URL externe (Interenchères).";
      } else if (isSupabaseStorageUrl || isExternalUrl) {
        console.log(`Fetching image from: ${imageUrl}`);
        
        try {
          const buildOptimizedUrl = (url: string, width: number, quality: number) =>
            `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=${quality}&output=jpg`;

          let fetchUrl = imageUrl;
          let abortImageProcessing = false;

          // Télécharger l'image avec un timeout et limite de taille
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
          
          let imageResponse = await fetch(fetchUrl, { 
            signal: controller.signal,
            headers: {
              'Accept': 'image/*'
            }
          });
          clearTimeout(timeoutId);
          
          if (!imageResponse.ok) {
            console.error(`Failed to download image: ${imageResponse.status}`);
            imageAnalysis = `⚠️ Impossible de télécharger l'image (HTTP ${imageResponse.status}).`;
          } else {
            // Vérifier la taille via Content-Length header si disponible
            const contentLength = imageResponse.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE_BYTES) {
              console.log(`Image too large: ${contentLength} bytes — retry optimized`);

              // Retenter avec une version redimensionnée/optimisée (sans stocker de copie)
              fetchUrl = buildOptimizedUrl(imageUrl, 1024, 75);
              const controller2 = new AbortController();
              const timeoutId2 = setTimeout(() => controller2.abort(), 15000);
              imageResponse = await fetch(fetchUrl, {
                signal: controller2.signal,
                headers: { 'Accept': 'image/*' },
              });
              clearTimeout(timeoutId2);

              if (!imageResponse.ok) {
                console.error(`Failed to download optimized image: ${imageResponse.status}`);
                imageAnalysis = `⚠️ Image trop volumineuse / inaccessible (HTTP ${imageResponse.status}).`;
                abortImageProcessing = true;
              }
            }

            if (abortImageProcessing) {
              // imageAnalysis déjà renseignée
            } else {

            // Télécharger le contenu
            let imageBuffer = await imageResponse.arrayBuffer();
            let actualSize = imageBuffer.byteLength;
            
            console.log(`Image downloaded: ${Math.round(actualSize / 1024)} KB`);
            
            if (actualSize > MAX_IMAGE_SIZE_BYTES) {
              console.log(`Image still too large (${actualSize} bytes) — retry smaller optimized`);

              const smallerUrl = buildOptimizedUrl(imageUrl, 720, 70);
              const controller3 = new AbortController();
              const timeoutId3 = setTimeout(() => controller3.abort(), 15000);
              const smallerResponse = await fetch(smallerUrl, {
                signal: controller3.signal,
                headers: { 'Accept': 'image/*' },
              });
              clearTimeout(timeoutId3);

              if (smallerResponse.ok) {
                imageBuffer = await smallerResponse.arrayBuffer();
                actualSize = imageBuffer.byteLength;
                imageResponse = smallerResponse;
                console.log(`Smaller image downloaded: ${Math.round(actualSize / 1024)} KB`);
              }
            }

            if (actualSize > MAX_IMAGE_SIZE_BYTES) {
              imageAnalysis = `⚠️ Image trop volumineuse (${Math.round(actualSize / 1024 / 1024)}MB). Maximum: 3MB.`;
            } else {
              // Convertir en base64
              const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
              const base64Image = arrayBufferToBase64(imageBuffer);
              const dataUrl = `data:${contentType};base64,${base64Image}`;
                
                console.log(`Sending image to vision API...`);
                
                const imagePrompt = `Tu es commissaire-priseur. Observe la photo de ce lot et décris UNIQUEMENT ce que tu vois réellement, sans rien inventer.

Contexte du lot (pour vérifier la cohérence, sans le recopier) :
- Titre : "${lot.title}"
${lot.description ? `- Description : "${lot.description}"` : ''}

Analyse en 3 à 4 phrases :
1. Objet visible : ce que montre exactement l'image (typologie, forme, sujet).
2. Style, époque ou mouvement suggérés (avec prudence : « probablement », « dans le goût de »).
3. Matériaux, techniques et état apparent.
4. Détails notables visibles : signature, cachet, marque, motifs, inscriptions.

Cohérence : si ce que tu vois semble en contradiction avec le titre/la description (autre type d'objet, autre sujet), signale-le explicitement. Reste factuel, en français, sans estimation de prix.`;

                const visionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'google/gemini-2.5-flash',
                    messages: [
                      {
                        role: 'user',
                        content: [
                          { type: 'text', text: imagePrompt },
                          { type: 'image_url', image_url: { url: dataUrl } }
                        ]
                      }
                    ]
                  }),
                });

                if (visionResponse.ok) {
                  const visionData = await visionResponse.json();
                  imageAnalysis = visionData.choices?.[0]?.message?.content;
                  console.log('Image analysis successful');
                } else {
                  const errorText = await visionResponse.text();
                  console.error('Vision API error:', visionResponse.status, errorText);
                  
                  if (visionResponse.status === 429) {
                    imageAnalysis = "⚠️ Limite de requêtes atteinte. Réessayez dans quelques instants.";
                  } else if (visionResponse.status === 402) {
                    imageAnalysis = "⚠️ Crédits IA insuffisants.";
                  } else {
                    imageAnalysis = `⚠️ Erreur API Vision (${visionResponse.status})`;
                  }
                }
            }
            }
          }
        } catch (downloadError) {
          console.error('Error processing image:', downloadError);
          if (downloadError instanceof Error && downloadError.name === 'AbortError') {
            imageAnalysis = "⚠️ Timeout lors du téléchargement de l'image.";
          } else {
            imageAnalysis = `⚠️ Erreur lors du traitement de l'image.`;
          }
        }
      } else {
        imageAnalysis = "⚠️ Format d'URL d'image non reconnu.";
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        lot_id,
        lot_number: lot.lot_number,
        original: {
          title: lot.title,
          description: lot.description,
          dimensions: lot.dimensions
        },
        analysis: analysis,
        image_analysis: imageAnalysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Enrichment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Juge qualité (LLM-as-judge) : évalue une analyse au regard des règles
 * "valeur ajoutée vs contexte" et "pas d'invention de faits".
 */
async function runJudge(
  apiKey: string,
  lot: LotInput,
  analysis: SharedAnalysisResult,
) {
  const judgeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: JUDGE_SYSTEM_PROMPT },
        { role: 'user', content: buildJudgeUserPrompt(lot, analysis) },
      ],
      tools: [JUDGE_TOOL],
      tool_choice: { type: 'function', function: { name: 'submit_verdict' } },
    }),
  });

  if (!judgeResponse.ok) {
    const errorText = await judgeResponse.text();
    console.error('Judge gateway error:', judgeResponse.status, errorText);
    throw new Error(`Judge gateway error: ${judgeResponse.status}`);
  }

  const judgeData = await judgeResponse.json();
  const toolCall = judgeData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== 'submit_verdict') {
    throw new Error('Unexpected judge response format');
  }
  return JSON.parse(toolCall.function.arguments);
}
