import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sale_id } = await req.json();

    if (!sale_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'sale_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer tous les lots de la vente
    const { data: lots, error: lotsError } = await supabase
      .from('interencheres_lots')
      .select('id, lot_number, title, images')
      .eq('sale_id', sale_id)
      .order('lot_number');

    if (lotsError) throw lotsError;

    console.log(`Processing ${lots?.length || 0} lots for sale ${sale_id}`);

    const results: any[] = [];
    const publicBaseUrl = 'https://id-preview--094b38f1-ba25-434a-9583-d79f9dc77a22.lovable.app';

    for (const lot of lots || []) {
      if (!lot.images || lot.images.length === 0) {
        results.push({ lot_number: lot.lot_number, status: 'skipped', reason: 'no images' });
        continue;
      }

      const newImages: string[] = [];

      for (let i = 0; i < lot.images.length; i++) {
        const imagePath = lot.images[i];
        
        // Si c'est déjà une URL Supabase, on la garde
        if (imagePath.includes('supabase.co/storage')) {
          newImages.push(imagePath);
          continue;
        }

        // Si c'est un chemin local, on télécharge et upload
        if (imagePath.startsWith('/')) {
          try {
            const imageUrl = `${publicBaseUrl}${imagePath}`;
            console.log(`Downloading: ${imageUrl}`);
            
            const response = await fetch(imageUrl);
            if (!response.ok) {
              console.error(`Failed to download ${imageUrl}: ${response.status}`);
              results.push({ lot_number: lot.lot_number, status: 'error', reason: `Failed to download: ${response.status}` });
              continue;
            }

            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const imageBlob = await response.arrayBuffer();
            
            // Générer un nom de fichier unique
            const fileName = imagePath.split('/').pop() || `lot-${lot.lot_number}-${i}.jpg`;
            const storagePath = `${sale_id}/${lot.id}/${fileName}`;

            console.log(`Uploading to storage: ${storagePath}`);

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('sale-images')
              .upload(storagePath, imageBlob, {
                contentType,
                upsert: true
              });

            if (uploadError) {
              console.error(`Upload error for ${storagePath}:`, uploadError);
              results.push({ lot_number: lot.lot_number, status: 'error', reason: uploadError.message });
              continue;
            }

            // Construire l'URL publique
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/sale-images/${storagePath}`;
            newImages.push(publicUrl);
            console.log(`Uploaded successfully: ${publicUrl}`);

          } catch (error) {
            console.error(`Error processing image for lot ${lot.lot_number}:`, error);
            results.push({ lot_number: lot.lot_number, status: 'error', reason: String(error) });
          }
        } else {
          // C'est une URL externe, on la garde pour l'instant
          newImages.push(imagePath);
        }
      }

      // Mettre à jour le lot avec les nouvelles URLs
      if (newImages.length > 0) {
        const { error: updateError } = await supabase
          .from('interencheres_lots')
          .update({ images: newImages })
          .eq('id', lot.id);

        if (updateError) {
          console.error(`Update error for lot ${lot.lot_number}:`, updateError);
          results.push({ lot_number: lot.lot_number, status: 'error', reason: updateError.message });
        } else {
          results.push({ lot_number: lot.lot_number, status: 'success', images: newImages });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sale_id,
        processed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
