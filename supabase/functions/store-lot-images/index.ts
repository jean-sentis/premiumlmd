import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Télécharger et stocker une image dans Supabase Storage
async function downloadAndStoreImage(
  imageUrl: string,
  saleId: string,
  lotId: string,
  imageIndex: number,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<string | null> {
  try {
    console.log(`    📥 Téléchargement image ${imageIndex + 1}: ${imageUrl.substring(0, 80)}...`);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
        'Referer': 'https://www.interencheres.com/',
      },
    });
    
    if (!response.ok) {
      console.log(`    ⚠️ Échec téléchargement: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Vérifier que l'image n'est pas trop petite (miniature)
    if (bytes.length < 5000) {
      console.log(`    ⚠️ Image trop petite (${bytes.length} bytes), ignorée`);
      return null;
    }
    
    const storagePath = `lots/${saleId}/${lotId}/${imageIndex + 1}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('sale-images')
      .upload(storagePath, bytes, {
        contentType,
        upsert: true,
      });
    
    if (uploadError) {
      console.log(`    ⚠️ Échec upload: ${uploadError.message}`);
      return null;
    }
    
    const { data: publicUrl } = supabase.storage
      .from('sale-images')
      .getPublicUrl(storagePath);
    
    console.log(`    ✅ Image stockée: ${storagePath} (${Math.round(bytes.length / 1024)}KB)`);
    return publicUrl.publicUrl;
  } catch (err) {
    console.log(`    ⚠️ Erreur image: ${err}`);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { saleId, lotIds } = body;

    if (!saleId) {
      throw new Error("saleId requis");
    }

    console.log(`🖼️ Stockage des images externes pour vente: ${saleId}`);

    // Récupérer les lots avec des images externes (non stockées dans Supabase)
    let query = supabase
      .from('interencheres_lots')
      .select('id, lot_number, images')
      .eq('sale_id', saleId)
      .order('lot_number', { ascending: true });

    if (lotIds && lotIds.length > 0) {
      query = query.in('id', lotIds);
    }

    const { data: lots, error: lotsError } = await query;

    if (lotsError) {
      throw new Error(`Erreur récupération lots: ${lotsError.message}`);
    }

    if (!lots || lots.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Aucun lot trouvé',
        processed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: { lotNumber: number; stored: number; skipped: number }[] = [];
    let totalStored = 0;

    for (const lot of lots) {
      const images = Array.isArray(lot.images) ? lot.images : [];
      
      // Filtrer les images qui ne sont pas déjà dans Supabase Storage
      const externalImages = images.filter((url: string) => 
        !url.includes('supabase.co') && url.includes('interencheres')
      );

      if (externalImages.length === 0) {
        console.log(`⏭️ Lot ${lot.lot_number}: toutes les images sont déjà stockées`);
        results.push({ lotNumber: lot.lot_number, stored: 0, skipped: images.length });
        continue;
      }

      console.log(`📦 Lot ${lot.lot_number}: ${externalImages.length} images externes à stocker`);

      const storedImages: string[] = [];
      
      // Garder les images déjà stockées
      for (const url of images) {
        if (url.includes('supabase.co')) {
          storedImages.push(url);
        }
      }

      // Télécharger et stocker les images externes
      for (let i = 0; i < externalImages.length; i++) {
        const storedUrl = await downloadAndStoreImage(
          externalImages[i],
          saleId,
          lot.id,
          storedImages.length + i,
          supabase
        );
        if (storedUrl) {
          storedImages.push(storedUrl);
          totalStored++;
        }
      }

      // Mettre à jour le lot avec les nouvelles URLs
      if (storedImages.length > 0) {
        const { error: updateError } = await supabase
          .from('interencheres_lots')
          .update({ 
            images: storedImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', lot.id);

        if (updateError) {
          console.log(`❌ Erreur update lot ${lot.lot_number}: ${updateError.message}`);
        } else {
          console.log(`✅ Lot ${lot.lot_number}: ${storedImages.length} images total`);
        }
      }

      results.push({ 
        lotNumber: lot.lot_number, 
        stored: storedImages.length - images.filter((u: string) => u.includes('supabase.co')).length,
        skipped: images.filter((u: string) => u.includes('supabase.co')).length 
      });

      // Petit délai entre les lots pour éviter de surcharger
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n📊 Résumé: ${totalStored} images stockées`);

    return new Response(JSON.stringify({
      success: true,
      processed: lots.length,
      totalStored,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ Erreur:", errMsg);
    return new Response(JSON.stringify({
      success: false,
      error: errMsg,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
