import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Compress image using canvas via browser-compatible approach
async function compressImageBlob(blob: Blob, maxWidth = 1200, quality = 0.75): Promise<Uint8Array> {
  // For Deno, we'll use a WebAssembly-based image processor
  // Import mozjpeg wasm for compression
  const { encode } = await import("https://unpkg.com/@jsquash/jpeg@1.4.0/encode.js");
  const { decode } = await import("https://unpkg.com/@jsquash/jpeg@1.4.0/decode.js");
  const { decode: decodePng } = await import("https://unpkg.com/@jsquash/png@2.2.0/decode.js");
  
  const arrayBuffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  
  let imageData;
  
  // Try to decode as JPEG first, then PNG
  try {
    imageData = await decode(uint8);
  } catch {
    try {
      imageData = await decodePng(uint8);
    } catch {
      throw new Error("Unsupported image format");
    }
  }
  
  // Resize if needed
  let { width, height, data } = imageData;
  
  if (width > maxWidth) {
    const ratio = maxWidth / width;
    const newWidth = Math.round(width * ratio);
    const newHeight = Math.round(height * ratio);
    
    // Simple resize using nearest neighbor (fast, acceptable quality)
    const resizedData = new Uint8ClampedArray(newWidth * newHeight * 4);
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = Math.floor(x / ratio);
        const srcY = Math.floor(y / ratio);
        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * newWidth + x) * 4;
        
        resizedData[dstIdx] = data[srcIdx];
        resizedData[dstIdx + 1] = data[srcIdx + 1];
        resizedData[dstIdx + 2] = data[srcIdx + 2];
        resizedData[dstIdx + 3] = data[srcIdx + 3];
      }
    }
    
    data = resizedData;
    width = newWidth;
    height = newHeight;
  }
  
  // Encode as JPEG with specified quality
  const compressed = await encode({ data, width, height }, { quality: quality * 100 });
  
  return compressed;
}

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

    const lotsWithImages = (lots || []).filter(l => (l.images as string[])?.length > 0);
    console.log(`[compress] ${lotsWithImages.length} lots with images`);

    let processed = 0;
    let saved = 0;

    for (const lot of lotsWithImages) {
      const images = lot.images as string[];
      const newImages: string[] = [];

      for (const imageUrl of images) {
        try {
          // Skip already compressed
          if (imageUrl.includes("-cmp.jpg")) {
            newImages.push(imageUrl);
            continue;
          }

          // Download original
          const response = await fetch(imageUrl);
          if (!response.ok) {
            console.warn(`Failed to fetch: ${imageUrl}`);
            newImages.push(imageUrl);
            continue;
          }

          const originalBlob = await response.blob();
          const originalSize = originalBlob.size;

          // Compress
          const compressed = await compressImageBlob(originalBlob, 1200, 0.75);
          const compressedSize = compressed.length;

          // Generate new filename
          const urlParts = imageUrl.split("/");
          const originalName = urlParts[urlParts.length - 1];
          const baseName = originalName.replace(/\.[^.]+$/, "");
          const newName = `${baseName}-cmp.jpg`;

          // Upload compressed version
          const { error: uploadError } = await supabase.storage
            .from("sale-images")
            .upload(newName, compressed, {
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
          saved += originalSize - compressedSize;
          processed++;

          console.log(`[compress] Lot ${lot.lot_number}: ${Math.round(originalSize/1024)}KB → ${Math.round(compressedSize/1024)}KB`);

        } catch (imgError) {
          console.error(`Image error:`, imgError);
          newImages.push(imageUrl);
        }
      }

      // Update lot with compressed images
      if (newImages.some(img => img.includes("-cmp.jpg"))) {
        await supabase
          .from("interencheres_lots")
          .update({ images: newImages })
          .eq("id", lot.id);
      }
    }

    console.log(`[compress] Done: ${processed} images, saved ${Math.round(saved/1024)}KB`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        savedKB: Math.round(saved / 1024)
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
