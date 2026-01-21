import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  explanation: string;
  creator_info: string | null;
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

    const { lot_id, dry_run = true, analyze_images = false } = await req.json();

    if (!lot_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'lot_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le lot
    const { data: lot, error: lotError } = await supabase
      .from('interencheres_lots')
      .select('*')
      .eq('id', lot_id)
      .single();

    if (lotError || !lot) {
      throw new Error(`Lot not found: ${lot_id}`);
    }

    console.log(`Processing lot ${lot.lot_number}: "${lot.title}"`);

    // Construire le prompt pour l'IA - mode explicatif
    const systemPrompt = `Tu es un expert en art et antiquités pour une maison de ventes aux enchères.

Ta mission : aider les acheteurs potentiels à comprendre le lot qu'ils consultent.

Tu dois fournir :
1. **Explication** : Explique de quoi il s'agit. Quel type d'objet ? À quoi servait-il ? Dans quel contexte était-il utilisé ? Quelle est sa valeur artistique ou historique ? Rends l'objet vivant et intéressant pour un amateur d'art.

2. **Informations sur le créateur** (si mentionné) : Si un artiste, un atelier, une manufacture ou un lieu de production est mentionné dans le lot, donne des informations biographiques ou historiques sur celui-ci. Par exemple : dates de vie de l'artiste, mouvement artistique, œuvres célèbres, histoire de la manufacture, etc. Si aucun créateur n'est mentionné, retourne null.

Style : Sois informatif et accessible, comme un guide de musée passionné. Évite le jargon technique excessif. 2-3 paragraphes maximum pour chaque section.`;

    const userPrompt = `Analyse ce lot et aide-moi à le comprendre :

Titre : "${lot.title}"
${lot.description ? `Description : "${lot.description}"` : ''}
${lot.dimensions ? `Dimensions : "${lot.dimensions}"` : ''}

Explique-moi de quoi il s'agit et, si un créateur est mentionné, parle-moi de lui.`;

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
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_lot',
              description: 'Fournit une explication du lot et des informations sur le créateur',
              parameters: {
                type: 'object',
                properties: {
                  explanation: {
                    type: 'string',
                    description: 'Explication de ce qu\'est cet objet, son contexte, sa valeur artistique ou historique'
                  },
                  creator_info: {
                    type: 'string',
                    description: 'Informations sur l\'artiste, l\'atelier ou la manufacture mentionnés, ou null si aucun créateur n\'est mentionné',
                    nullable: true
                  }
                },
                required: ['explanation'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_lot' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    // Extraire le résultat du tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'analyze_lot') {
      throw new Error('Unexpected AI response format');
    }

    const analysis: AnalysisResult = JSON.parse(toolCall.function.arguments);
    console.log('Analysis result:', analysis);

    // Analyse des images si demandé
    // Sources acceptées : URLs Supabase Storage OU URLs externes (Interenchères, etc.)
    // Les chemins locaux (/images/...) ne sont PAS accessibles depuis l'edge function
    let imageAnalysis = null;
    
    if (analyze_images && lot.images && lot.images.length > 0) {
      console.log(`Analyzing ${lot.images.length} images...`);
      
      let imageUrl = lot.images[0];
      
      // Déterminer le type d'URL
      const isSupabaseStorageUrl = imageUrl.includes('supabase.co/storage') || imageUrl.includes(supabaseUrl);
      const isExternalUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
      const isLocalPath = imageUrl.startsWith('/');
      
      if (isLocalPath) {
        // Les chemins locaux ne sont pas accessibles depuis l'edge function
        console.log(`Image is a local path (not accessible): ${imageUrl}`);
        imageAnalysis = "⚠️ L'image est stockée localement dans le projet. Pour activer l'analyse visuelle, uploadez l'image vers le storage cloud ou utilisez une URL externe (Interenchères).";
      } else if (isSupabaseStorageUrl || isExternalUrl) {
        // URL accessible - on peut analyser
        console.log(`Image URL accessible for vision: ${imageUrl}`);
        
        try {
          // Télécharger l'image et la convertir en base64 pour contourner les problèmes d'accès
          console.log(`Downloading image from: ${imageUrl}`);
          const imageResponse = await fetch(imageUrl);
          
          if (!imageResponse.ok) {
            console.error(`Failed to download image: ${imageResponse.status}`);
            imageAnalysis = `⚠️ Impossible de télécharger l'image (HTTP ${imageResponse.status}).`;
          } else {
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
            const dataUrl = `data:${contentType};base64,${base64Image}`;
            
            console.log(`Image downloaded and converted to base64 (${Math.round(imageBuffer.byteLength / 1024)} KB)`);
            
            const imagePrompt = `Décris précisément cet objet d'art ou antiquité visible sur la photo.
      
1. Que vois-tu EXACTEMENT sur cette image ? Décris l'objet tel que tu le vois.
2. Quel style, époque ou mouvement artistique semble correspondre ?
3. Quels matériaux et techniques sont visibles ?
4. Y a-t-il des détails intéressants (signatures, marques, motifs décoratifs) ?

Sois précis et factuel, comme un commissaire-priseur décrivant un lot. 3-4 phrases.`;

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
              console.log('Image analysis successful:', imageAnalysis?.substring(0, 100));
            } else {
              const errorText = await visionResponse.text();
              console.error('Vision API error:', visionResponse.status, errorText);
              imageAnalysis = `⚠️ Erreur API Vision (${visionResponse.status}): ${errorText.substring(0, 200)}`;
            }
          }
        } catch (downloadError) {
          console.error('Error downloading image:', downloadError);
          imageAnalysis = `⚠️ Erreur lors du téléchargement de l'image: ${String(downloadError)}`;
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
