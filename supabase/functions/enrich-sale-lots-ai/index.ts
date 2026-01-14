import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentResult {
  title: string;
  description: string;
  dimensions: string | null;
}

const enrichLot = async (
  lot: any,
  apiKey: string
): Promise<{ success: boolean; enriched?: EnrichmentResult; error?: string }> => {
  const systemPrompt = `Tu es un expert en catalogage d'objets d'art et d'antiquités pour une maison de ventes aux enchères.

Ta mission : analyser le texte brut d'un lot et le restructurer proprement en séparant :
1. **Titre** : L'identité essentielle de l'objet (artiste, type d'objet, matière principale). Maximum 80 caractères. Pas de dimensions, pas de signatures, pas d'état.
2. **Description** : Tous les détails secondaires (signatures, marques, état de conservation, provenance, époque précise, numérotation). Phrases complètes et lisibles.
3. **Dimensions** : Extraites et formatées proprement (H. x L. x P. en cm ou diamètre).

Règles :
- Le titre doit être accrocheur et concis, comme dans un catalogue professionnel
- Ne jamais inclure "Haut.", "H.", "L.", "Diam." dans le titre
- Les signatures ("signé", "monogrammé") vont dans la description
- Les numérotations ("/150", "EA", "HC") vont dans la description
- L'état de conservation va dans la description
- Si pas de dimensions détectées, retourner null pour dimensions`;

  const userPrompt = `Analyse et restructure ce lot :

Texte brut : "${lot.title}"

${lot.description ? `Description existante : "${lot.description}"` : ''}
${lot.dimensions ? `Dimensions existantes : "${lot.dimensions}"` : ''}

Retourne le résultat structuré.`;

  try {
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
              name: 'structure_lot',
              description: 'Structure les informations du lot en titre, description et dimensions',
              parameters: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Titre concis du lot (max 80 caractères)' },
                  description: { type: 'string', description: 'Description détaillée' },
                  dimensions: { type: 'string', description: 'Dimensions formatées ou null', nullable: true }
                },
                required: ['title', 'description'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'structure_lot' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return { success: false, error: `AI error ${aiResponse.status}: ${errorText}` };
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== 'structure_lot') {
      return { success: false, error: 'Unexpected AI response format' };
    }

    const enriched: EnrichmentResult = JSON.parse(toolCall.function.arguments);
    return { success: true, enriched };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

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

    const { sale_id, dry_run = false } = await req.json();

    if (!sale_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'sale_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer tous les lots de la vente
    const { data: lots, error: lotsError } = await supabase
      .from('interencheres_lots')
      .select('*')
      .eq('sale_id', sale_id)
      .order('lot_number', { ascending: true });

    if (lotsError) throw lotsError;
    if (!lots || lots.length === 0) {
      throw new Error(`No lots found for sale ${sale_id}`);
    }

    console.log(`Processing ${lots.length} lots for sale ${sale_id}`);

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Traiter chaque lot avec un délai pour éviter le rate limiting
    for (const lot of lots) {
      console.log(`Processing lot ${lot.lot_number}...`);
      
      const result = await enrichLot(lot, LOVABLE_API_KEY);
      
      if (result.success && result.enriched) {
        successCount++;
        
        // Mettre à jour en base si pas en dry_run
        if (!dry_run) {
          const { error: updateError } = await supabase
            .from('interencheres_lots')
            .update({
              title: result.enriched.title,
              description: result.enriched.description,
              dimensions: result.enriched.dimensions,
              updated_at: new Date().toISOString()
            })
            .eq('id', lot.id);

          if (updateError) {
            console.error(`Update error for lot ${lot.lot_number}:`, updateError);
            result.success = false;
            result.error = updateError.message;
            errorCount++;
            successCount--;
          }
        }

        results.push({
          lot_number: lot.lot_number,
          lot_id: lot.id,
          success: result.success,
          original_title: lot.title,
          enriched: result.enriched
        });
      } else {
        errorCount++;
        results.push({
          lot_number: lot.lot_number,
          lot_id: lot.id,
          success: false,
          error: result.error
        });
      }

      // Petit délai entre les appels pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`Enrichment complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        sale_id,
        total_lots: lots.length,
        success_count: successCount,
        error_count: errorCount,
        dry_run,
        applied: !dry_run,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Batch enrichment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
