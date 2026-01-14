import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching sales data...');

    // Fetch all data in parallel
    const [salesResult, lotsResult, eventsResult, imagesResult] = await Promise.all([
      supabase.from('interencheres_sales').select('*').order('sale_date', { ascending: false }),
      supabase.from('interencheres_lots').select('*').order('lot_number', { ascending: true }),
      supabase.from('svv_events').select('*').order('start_date', { ascending: true }),
      supabase.storage.from('sale-images').list('', { limit: 1000 })
    ]);

    if (salesResult.error) {
      console.error('Error fetching sales:', salesResult.error);
      throw salesResult.error;
    }

    if (lotsResult.error) {
      console.error('Error fetching lots:', lotsResult.error);
      throw lotsResult.error;
    }

    if (eventsResult.error) {
      console.error('Error fetching events:', eventsResult.error);
      throw eventsResult.error;
    }

    if (imagesResult.error) {
      console.error('Error fetching images:', imagesResult.error);
      throw imagesResult.error;
    }

    // Build public URLs for images
    const imageUrls = (imagesResult.data || [])
      .filter(file => file.name && !file.name.startsWith('.'))
      .map(file => ({
        name: file.name,
        url: `${supabaseUrl}/storage/v1/object/public/sale-images/${file.name}`,
        created_at: file.created_at,
        updated_at: file.updated_at,
        size: file.metadata?.size
      }));

    const response = {
      sales: salesResult.data || [],
      lots: lotsResult.data || [],
      events: eventsResult.data || [],
      images: imageUrls,
      metadata: {
        sales_count: salesResult.data?.length || 0,
        lots_count: lotsResult.data?.length || 0,
        events_count: eventsResult.data?.length || 0,
        images_count: imageUrls.length,
        fetched_at: new Date().toISOString()
      }
    };

    console.log(`Fetched: ${response.metadata.sales_count} sales, ${response.metadata.lots_count} lots, ${response.metadata.events_count} events, ${response.metadata.images_count} images`);

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in get-sales-data:', error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Failed to fetch sales data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
