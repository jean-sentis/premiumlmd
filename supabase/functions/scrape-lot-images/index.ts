// Scrape TOUTES les images des lots via Firecrawl et les stocke dans Supabase Storage
// Méthode: 
// 1. Récupérer les lots existants depuis la DB
// 2. Scraper chaque page de lot pour récupérer TOUTES les images (pas juste og:image)
// 3. Télécharger et stocker les images dans Supabase Storage

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Délai entre chaque appel Firecrawl (par défaut 30s pour limiter le taux)
const DEFAULT_FIRECRAWL_DELAY_MS = 30000;

interface LotFromDB {
  id: string;
  lot_number: number;
  interencheres_lot_id: string;
  lot_url: string;
  title: string;
  images: string[] | null;
}

// Scraper TOUTES les images d'une page de lot
async function scrapeAllImages(lotUrl: string, firecrawlApiKey: string): Promise<{
  images: string[];
  title: string | null;
  description: string | null;
}> {
  console.log(`[scrape-lot-images] Scraping ALL images from: ${lotUrl}`);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: lotUrl,
      formats: ['html', 'links'],  // Get HTML to find all images
      onlyMainContent: false,
      waitFor: 3000,
    }),
  });

  if (!response.ok) {
    console.error(`[scrape-lot-images] Firecrawl error: ${response.status}`);
    return { images: [], title: null, description: null };
  }

  const data = await response.json();
  const metadata = data.data?.metadata || data.metadata || {};
  const html = data.data?.html || data.html || "";
  const links = data.data?.links || data.links || [];
  
  const title = metadata.ogTitle || metadata['og:title'] || metadata.title || null;
  const description = metadata.ogDescription || metadata['og:description'] || metadata.description || null;

  // Collecter toutes les images
  const imageUrls = new Set<string>();

  // 1. og:image depuis les metadata
  const ogImage = metadata.ogImage || metadata['og:image'];
  if (ogImage) {
    imageUrls.add(ogImage);
  }

  // 2. Chercher les images dans le HTML (pattern thumbor-indbupload ou assets-indbupload)
  const imgRegex = /https:\/\/(?:thumbor-indbupload|assets-indbupload)\.interencheres\.com[^"'\s)]+/g;
  const htmlMatches = html.match(imgRegex) || [];
  for (const url of htmlMatches) {
    // Nettoyer l'URL (enlever les caractères parasites à la fin)
    const cleanUrl = url.replace(/[<>\\'"]/g, '').split('&quot;')[0];
    if (cleanUrl.length > 50) {
      imageUrls.add(cleanUrl);
    }
  }

  // 3. Chercher dans les liens aussi
  for (const link of links) {
    if (typeof link === 'string' && link.includes('interencheres.com') && 
        (link.includes('/fit-in/') || link.includes('/smart/') || link.match(/\/\d{4}\/\d{2}\/\d{2}\//))) {
      imageUrls.add(link);
    }
  }

  // Dédupliquer en gardant les versions différentes (pas les thumbnails)
  const uniqueImages = Array.from(imageUrls).filter(url => {
    // Garder les images originales et smart, pas les petites thumbs
    return !url.includes('160x120') && !url.includes('80x60');
  });

  console.log(`[scrape-lot-images] Found ${uniqueImages.length} unique images`);

  return { images: uniqueImages, title, description };
}

// Télécharger une image
async function downloadImage(imageUrl: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": "https://www.interencheres.com/",
      },
    });

    if (!res.ok) {
      console.error(`[scrape-lot-images] Download failed: ${res.status} for ${imageUrl}`);
      return null;
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const bytes = await res.arrayBuffer();
    
    return { bytes, contentType };
  } catch (e) {
    console.error(`[scrape-lot-images] Download error: ${e}`);
    return null;
  }
}

function extFromContentType(ct: string): string {
  const v = ct.toLowerCase();
  if (v.includes("png")) return "png";
  if (v.includes("webp")) return "webp";
  if (v.includes("gif")) return "gif";
  if (v.includes("avif")) return "avif";
  return "jpg";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const saleId = (body?.saleId || "").toString();
    const maxLotNumber = Number.isFinite(body?.maxLotNumber) ? Number(body.maxLotNumber) : 28;
    const maxImagesPerLot = Number.isFinite(body?.maxImagesPerLot) ? Number(body.maxImagesPerLot) : 5;
    const startFromLot = Number.isFinite(body?.startFromLot) ? Number(body.startFromLot) : 1;
    const firecrawlDelayMs = Number.isFinite(body?.firecrawlDelayMs)
      ? Number(body.firecrawlDelayMs)
      : DEFAULT_FIRECRAWL_DELAY_MS;

    if (!saleId) {
      return new Response(JSON.stringify({ success: false, error: "saleId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Récupérer les lots existants depuis la DB
    const { data: lots, error: lotsError } = await supabase
      .from("interencheres_lots")
      .select("id, lot_number, interencheres_lot_id, lot_url, title, images")
      .eq("sale_id", saleId)
      .gte("lot_number", startFromLot)
      .lte("lot_number", maxLotNumber)
      .order("lot_number", { ascending: true });

    if (lotsError || !lots || lots.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No lots found for this sale" 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[scrape-lot-images] Found ${lots.length} lots to process (lot ${startFromLot} to ${maxLotNumber})`);

    const results: Array<{
      lotNumber: number;
      interencheresLotId: string;
      status: "stored" | "skipped" | "failed";
      imagesFound?: number;
      imagesStored?: number;
      error?: string;
    }> = [];

    let totalStored = 0;
    let totalImages = 0;

    for (let i = 0; i < lots.length; i++) {
      const lot = lots[i] as LotFromDB;
      console.log(`[scrape-lot-images] Processing lot ${lot.lot_number} (${i + 1}/${lots.length})`);

      // Scraper toutes les images du lot
      const { images: foundImages } = await scrapeAllImages(lot.lot_url, firecrawlApiKey);

      if (foundImages.length === 0) {
        results.push({
          lotNumber: lot.lot_number,
          interencheresLotId: lot.interencheres_lot_id,
          status: "failed",
          imagesFound: 0,
          error: "No images found on page",
        });
        
        // Attendre avant le prochain appel Firecrawl
        if (i < lots.length - 1) {
          console.log(`[scrape-lot-images] Waiting ${firecrawlDelayMs / 1000}s before next request...`);
          await new Promise(resolve => setTimeout(resolve, firecrawlDelayMs));
        }
        continue;
      }

      // Limiter le nombre d'images par lot
      const imagesToProcess = foundImages.slice(0, maxImagesPerLot);
      console.log(`[scrape-lot-images] Processing ${imagesToProcess.length}/${foundImages.length} images`);

      const storedUrls: string[] = [];

      // Télécharger et stocker chaque image
      for (let imgIdx = 0; imgIdx < imagesToProcess.length; imgIdx++) {
        const imageUrl = imagesToProcess[imgIdx];
        
        const downloaded = await downloadImage(imageUrl);
        if (!downloaded) continue;

        const ext = extFromContentType(downloaded.contentType);
        const storagePath = `lots/${saleId}/${lot.interencheres_lot_id}/${imgIdx + 1}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("sale-images")
          .upload(storagePath, downloaded.bytes, {
            contentType: downloaded.contentType,
            upsert: true,
          });

        if (uploadError) {
          console.error(`[scrape-lot-images] Upload error for image ${imgIdx + 1}:`, uploadError.message);
          continue;
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/sale-images/${storagePath}`;
        storedUrls.push(publicUrl);
        totalImages++;
      }

      if (storedUrls.length > 0) {
        // Mettre à jour le lot dans la base de données
        const { error: updateError } = await supabase
          .from("interencheres_lots")
          .update({ images: storedUrls })
          .eq("id", lot.id);

        if (updateError) {
          console.error(`[scrape-lot-images] Update error:`, updateError);
          results.push({
            lotNumber: lot.lot_number,
            interencheresLotId: lot.interencheres_lot_id,
            status: "failed",
            imagesFound: foundImages.length,
            imagesStored: storedUrls.length,
            error: updateError.message,
          });
        } else {
          console.log(`[scrape-lot-images] ✅ Stored ${storedUrls.length} images for lot ${lot.lot_number}`);
          results.push({
            lotNumber: lot.lot_number,
            interencheresLotId: lot.interencheres_lot_id,
            status: "stored",
            imagesFound: foundImages.length,
            imagesStored: storedUrls.length,
          });
          totalStored++;
        }
      } else {
        results.push({
          lotNumber: lot.lot_number,
          interencheresLotId: lot.interencheres_lot_id,
          status: "failed",
          imagesFound: foundImages.length,
          imagesStored: 0,
          error: "Failed to download any images",
        });
      }

      // Attendre avant le prochain appel Firecrawl (sauf pour le dernier)
      if (i < lots.length - 1) {
        console.log(`[scrape-lot-images] Waiting ${firecrawlDelayMs / 1000}s before next request...`);
        await new Promise(resolve => setTimeout(resolve, firecrawlDelayMs));
      }
    }

    console.log(`[scrape-lot-images] ✅ Done! ${totalStored}/${lots.length} lots updated, ${totalImages} total images stored`);

    return new Response(
      JSON.stringify({
        success: true,
        saleId,
        lotsProcessed: lots.length,
        lotsUpdated: totalStored,
        totalImagesStored: totalImages,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[scrape-lot-images] Fatal error:", error);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
