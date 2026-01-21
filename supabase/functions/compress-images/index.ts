import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { saleId } = await req.json();

    if (!saleId) {
      return new Response(
        JSON.stringify({ error: "saleId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[compress] Starting for sale ${saleId}`);

    // Get all lots with images
    const { data: lots, error: lotsError } = await supabase
      .from("interencheres_lots")
      .select("id, lot_number, images")
      .eq("sale_id", saleId);

    if (lotsError) throw lotsError;

    const lotsWithImages = (lots || []).filter(l => {
      const imgs = l.images as string[] | null;
      return imgs && imgs.length > 0;
    });
    
    console.log(`[compress] ${lotsWithImages.length} lots with images`);

    let processed = 0;
    let totalOriginal = 0;
    let totalCompressed = 0;

    for (const lot of lotsWithImages) {
      const images = lot.images as string[];
      const newImages: string[] = [];

      for (const imageUrl of images) {
        try {
          // Skip already compressed
          if (imageUrl.includes("-cmp.")) {
            newImages.push(imageUrl);
            continue;
          }

          // Extract filename from URL
          const urlParts = imageUrl.split("/");
          const originalName = urlParts[urlParts.length - 1];

          // Download from storage using Supabase client
          const { data: fileData, error: downloadError } = await supabase.storage
            .from("sale-images")
            .download(originalName);

          if (downloadError || !fileData) {
            console.warn(`Failed to download ${originalName}:`, downloadError?.message);
            newImages.push(imageUrl);
            continue;
          }

          const originalSize = fileData.size;
          totalOriginal += originalSize;

          // Use wsrv.nl (free image CDN) to compress
          // This is a public, free service that resizes and optimizes images
          const compressUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=1200&q=75&output=jpg`;
          
          const compressResponse = await fetch(compressUrl);
          if (!compressResponse.ok) {
            console.warn(`Failed to compress ${originalName}`);
            newImages.push(imageUrl);
            continue;
          }

          const compressedBlob = await compressResponse.blob();
          const compressedSize = compressedBlob.size;
          totalCompressed += compressedSize;

          // Generate new filename
          const baseName = originalName.replace(/\.[^.]+$/, "");
          const newName = `${baseName}-cmp.jpg`;

          // Upload compressed version
          const { error: uploadError } = await supabase.storage
            .from("sale-images")
            .upload(newName, compressedBlob, {
              contentType: "image/jpeg",
              upsert: true
            });

          if (uploadError) {
            console.error(`Upload error for ${newName}:`, uploadError);
            newImages.push(imageUrl);
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from("sale-images")
            .getPublicUrl(newName);

          newImages.push(publicUrl);
          processed++;

          console.log(`[compress] Lot ${lot.lot_number}: ${Math.round(originalSize/1024)}KB → ${Math.round(compressedSize/1024)}KB`);

        } catch (imgError) {
          console.error(`Image error:`, imgError);
          newImages.push(imageUrl);
        }
      }

      // Update lot with compressed images
      if (newImages.some(img => img.includes("-cmp."))) {
        const { error: updateError } = await supabase
          .from("interencheres_lots")
          .update({ images: newImages })
          .eq("id", lot.id);
        
        if (updateError) {
          console.error(`Update error for lot ${lot.id}:`, updateError);
        }
      }
    }

    const savedKB = Math.round((totalOriginal - totalCompressed) / 1024);
    console.log(`[compress] Done: ${processed} images, saved ${savedKB}KB`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        originalKB: Math.round(totalOriginal / 1024),
        compressedKB: Math.round(totalCompressed / 1024),
        savedKB
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[compress] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
