import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URL de l'API externe
const EXTERNAL_API_BASE = 'https://fjhtcvsjqccgeddtbuoa.supabase.co/functions/v1/export-lots';

interface ExternalLot {
  lot_number: number;
  title: string;
  estimate: string;
  lot_url: string;
  images: string[];
  description?: string;
}

interface ExternalSaleData {
  sale_id: string;
  total_lots: number;
  total_images: number;
  lots: ExternalLot[];
}

// Parse l'estimation "50 / 80 €" en estimate_low et estimate_high
const parseEstimate = (estimate: string): { low: number | null; high: number | null } => {
  if (!estimate) return { low: null, high: null };
  
  const match = estimate.match(/(\d+)\s*\/\s*(\d+)/);
  if (match) {
    return {
      low: parseInt(match[1], 10),
      high: parseInt(match[2], 10),
    };
  }
  return { low: null, high: null };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sale_id, target_sale_id } = await req.json();

    if (!sale_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'sale_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching external data for sale: ${sale_id}`);

    // Récupérer les données de l'API externe
    const externalResponse = await fetch(`${EXTERNAL_API_BASE}?sale_id=${sale_id}`);
    
    if (!externalResponse.ok) {
      throw new Error(`External API error: ${externalResponse.status}`);
    }

    const externalData: ExternalSaleData = await externalResponse.json();
    console.log(`Received ${externalData.total_lots} lots with ${externalData.total_images} images`);

    // Utiliser target_sale_id si fourni, sinon chercher par interencheres_id
    let saleUuid: string;
    
    if (target_sale_id) {
      // Vérifier que la vente cible existe
      const { data: targetSale, error: targetError } = await supabase
        .from('interencheres_sales')
        .select('id')
        .eq('id', target_sale_id)
        .single();

      if (targetError || !targetSale) {
        throw new Error(`Target sale not found: ${target_sale_id}`);
      }
      saleUuid = targetSale.id;
      console.log(`Using target sale: ${saleUuid}`);
    } else {
      // Chercher une vente existante par interencheres_id ou créer une nouvelle
      const { data: existingSale } = await supabase
        .from('interencheres_sales')
        .select('id')
        .eq('interencheres_id', sale_id)
        .single();

      if (existingSale) {
        saleUuid = existingSale.id;
        console.log(`Found existing sale: ${saleUuid}`);
      } else {
        // Créer une nouvelle vente
        console.log(`Creating new sale for: ${sale_id}`);
        const { data: newSale, error: saleError } = await supabase
          .from('interencheres_sales')
          .insert({
            title: `Vente ${sale_id.replace(/-/g, ' ')}`,
            sale_url: `https://www.interencheres.com/vente/${sale_id}`,
            lot_count: externalData.total_lots,
            status: 'upcoming',
            interencheres_id: sale_id,
          })
          .select('id')
          .single();

        if (saleError) {
          console.error('Error creating sale:', saleError);
          throw saleError;
        }
        saleUuid = newSale.id;
        console.log(`Created new sale: ${saleUuid}`);
      }
    }

    // Préparer les lots pour l'insertion
    const lotsToInsert = externalData.lots.map((lot) => {
      const { low, high } = parseEstimate(lot.estimate);
      return {
        sale_id: saleUuid,
        lot_number: lot.lot_number,
        title: lot.title,
        description: lot.description || null,
        lot_url: lot.lot_url,
        images: lot.images,
        estimate_low: low,
        estimate_high: high,
        estimate_currency: 'EUR',
        interencheres_lot_id: `${sale_id}-${lot.lot_number}`,
      };
    });

    console.log(`Inserting ${lotsToInsert.length} lots...`);

    // Supprimer les lots existants pour cette vente
    await supabase
      .from('interencheres_lots')
      .delete()
      .eq('sale_id', saleUuid);

    // Insérer les nouveaux lots
    const { data: insertedLots, error: lotsError } = await supabase
      .from('interencheres_lots')
      .insert(lotsToInsert)
      .select();

    if (lotsError) {
      console.error('Error inserting lots:', lotsError);
      throw lotsError;
    }

    console.log(`Successfully imported ${insertedLots?.length || 0} lots`);

    return new Response(
      JSON.stringify({
        success: true,
        sale_id: saleUuid,
        lots_imported: insertedLots?.length || 0,
        total_images: externalData.total_images,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
