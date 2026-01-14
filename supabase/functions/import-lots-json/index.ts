import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LotData {
  lot: string;
  title: string;
  estimate: string;
  image: string;
  url: string;
}

interface SaleData {
  title: string;
  date: string;
  location: string;
  operator?: string;
  frais?: string;
  url: string;
}

interface ImportPayload {
  sale: SaleData;
  lots: LotData[];
  houseId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: ImportPayload = await req.json();
    const { sale, lots, houseId = "12-p-avignon" } = payload;

    if (!sale || !lots || !Array.isArray(lots)) {
      throw new Error("Format invalide: 'sale' et 'lots' requis");
    }

    console.log(`📦 Import de ${lots.length} lots pour: ${sale.title}`);

    // Extraire l'ID Interenchères de l'URL de vente
    const saleUrlMatch = sale.url.match(/(\d+)(?:\.html)?$/);
    const interencheresId = saleUrlMatch ? saleUrlMatch[1] : null;

    // Parser la date (format: "11 janvier 2026 à 04h00")
    let saleDate: string | null = null;
    const dateMatch = sale.date?.match(/(\d+)\s+(\w+)\s+(\d{4})/);
    if (dateMatch) {
      const [, day, monthName, year] = dateMatch;
      const months: Record<string, string> = {
        janvier: '01', février: '02', mars: '03', avril: '04',
        mai: '05', juin: '06', juillet: '07', août: '08',
        septembre: '09', octobre: '10', novembre: '11', décembre: '12'
      };
      const month = months[monthName.toLowerCase()] || '01';
      saleDate = `${year}-${month}-${day.padStart(2, '0')}`;
    }

    // Upsert la vente
    const { data: saleRow, error: saleError } = await supabase
      .from('interencheres_sales')
      .upsert({
        sale_url: sale.url,
        title: sale.title,
        house_id: houseId,
        location: sale.location,
        sale_date: saleDate,
        fees_info: sale.frais,
        contact_name: sale.operator,
        interencheres_id: interencheresId,
        lot_count: lots.length,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'sale_url'
      })
      .select('id')
      .single();

    if (saleError) {
      console.error("Erreur upsert vente:", saleError);
      throw saleError;
    }

    const saleId = saleRow.id;
    console.log(`✅ Vente créée/mise à jour: ${saleId}`);

    // Préparer les lots pour upsert
    const lotsToUpsert = lots.map(lot => {
      // Extraire l'ID lot de l'URL (lot-84411878.html -> 84411878)
      const lotIdMatch = lot.url.match(/lot-(\d+)/);
      const interencheresLotId = lotIdMatch ? lotIdMatch[1] : `lot-${lot.lot}`;
      
      // Parser les estimations
      let estimateLow: number | null = null;
      let estimateHigh: number | null = null;
      if (lot.estimate) {
        const estMatch = lot.estimate.match(/(\d+)[\s-]+(\d+)/);
        if (estMatch) {
          estimateLow = parseInt(estMatch[1], 10);
          estimateHigh = parseInt(estMatch[2], 10);
        }
      }

      // Construire l'URL complète du lot
      const baseUrl = sale.url.replace(/\/[^/]+$/, '/');
      const lotUrl = lot.url.startsWith('http') ? lot.url : `${baseUrl}${lot.url}`;

      return {
        sale_id: saleId,
        interencheres_lot_id: interencheresLotId,
        lot_number: parseInt(lot.lot.replace(/[^\d]/g, ''), 10) || 0,
        title: lot.title,
        lot_url: lotUrl,
        images: [lot.image], // Stocker l'URL thumbor directement
        estimate_low: estimateLow,
        estimate_high: estimateHigh,
        estimate_currency: 'EUR',
        updated_at: new Date().toISOString()
      };
    });

    // Upsert tous les lots
    const { error: lotsError } = await supabase
      .from('interencheres_lots')
      .upsert(lotsToUpsert, {
        onConflict: 'interencheres_lot_id'
      });

    if (lotsError) {
      console.error("Erreur upsert lots:", lotsError);
      throw lotsError;
    }

    console.log(`✅ ${lots.length} lots importés avec succès`);

    return new Response(JSON.stringify({
      success: true,
      saleId,
      lotsImported: lots.length,
      message: `${lots.length} lots importés pour "${sale.title}"`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ Erreur import:", errMsg);
    return new Response(JSON.stringify({
      success: false,
      error: errMsg
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
