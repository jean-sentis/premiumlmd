import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LotFromDB {
  id: string;
  lot_number: number;
  title: string;
  lot_url: string;
  estimate_low: number | null;
  estimate_high: number | null;
  images: string[];
}

interface EnrichResult {
  lotId: string;
  lotNumber: number;
  estimateUpdated: boolean;
  imagesAdded: number;
  newEstimateLow: number | null;
  newEstimateHigh: number | null;
  newImagesCount: number;
  error?: string;
}

// Scrape une page de lot avec Firecrawl
async function scrapeLotPage(lotUrl: string, firecrawlApiKey: string): Promise<{
  estimateLow: number | null;
  estimateHigh: number | null;
  images: string[];
  description: string | null;
}> {
  console.log(`🔍 Scraping: ${lotUrl}`);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${firecrawlApiKey}`,
    },
    body: JSON.stringify({
      url: lotUrl,
      formats: ['html', 'markdown'],
      waitFor: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error('Firecrawl returned no data');
  }

  const html = result.data.html || '';
  const markdown = result.data.markdown || '';
  
  // Extraire les estimations
  let estimateLow: number | null = null;
  let estimateHigh: number | null = null;
  
  // Pattern: "Estimation : 600 - 800 €" ou "Estimation : 600€" ou dans le HTML
  const estimatePatterns = [
    /Estimation\s*:?\s*(\d[\d\s]*)\s*[-–]\s*(\d[\d\s]*)\s*€/i,
    /(\d[\d\s]*)\s*[-–]\s*(\d[\d\s]*)\s*€/i,
    /Estimation\s*:?\s*(\d[\d\s]*)\s*€/i,
  ];
  
  const textToSearch = markdown + ' ' + html;
  
  for (const pattern of estimatePatterns) {
    const match = textToSearch.match(pattern);
    if (match) {
      if (match[2]) {
        estimateLow = parseInt(match[1].replace(/\s/g, ''), 10);
        estimateHigh = parseInt(match[2].replace(/\s/g, ''), 10);
      } else if (match[1]) {
        estimateLow = parseInt(match[1].replace(/\s/g, ''), 10);
      }
      if (estimateLow && estimateLow > 0) break;
    }
  }
  
  console.log(`  → Estimation trouvée: ${estimateLow} - ${estimateHigh} €`);
  
  // Extraire les images (thumbor interencheres)
  const images: string[] = [];
  
  // Pattern pour les URLs d'images Interenchères - images originales avec chemin /2025/ ou /2024/
  const imagePatterns = [
    // Images originales (chemin avec année/mois)
    /https?:\/\/thumbor-indbupload\.interencheres\.com\/[^"'\s]+\/20\d{2}\/\d{2}\/[^"'\s]+\.(jpg|jpeg|png|webp)/gi,
    // Images fit-in (redimensionnées proprement)
    /https?:\/\/thumbor-indbupload\.interencheres\.com\/[^"'\s]*fit-in[^"'\s]+\.(jpg|jpeg|png|webp)/gi,
    // Autres images thumbor
    /https?:\/\/thumbor[^"'\s]*interencheres[^"'\s]+\.(jpg|jpeg|png|webp)/gi,
  ];
  
  for (const pattern of imagePatterns) {
    const matches = html.matchAll(pattern);
    for (const m of matches) {
      let url = m[0];
      // Nettoyer l'URL (enlever caractères parasites)
      url = url.replace(/["')\]>].*$/, '');
      
      // FILTRER les miniatures (petites dimensions)
      if (url.match(/\/\d{2,3}x\d{2,3}\//)) {
        // URLs avec dimensions type /160x120/ ou /100x75/ = miniatures, on les ignore
        continue;
      }
      
      // Éviter les doublons
      if (!images.includes(url)) {
        images.push(url);
      }
    }
  }
  
  // Dédupliquer les images par leur ID unique
  const uniqueImages = deduplicateImages(images);
  
  console.log(`  → ${uniqueImages.length} images HD trouvées (${images.length} total avant dédup)`);
  
  // Extraire la description
  const descMatch = markdown.match(/En détail\s*:?\s*(.+?)(?=Estimation|$)/is);
  const description = descMatch ? descMatch[1].trim().substring(0, 2000) : null;

  return {
    estimateLow,
    estimateHigh,
    images: uniqueImages,
    description,
  };
}

// Dédupliquer les images (même image avec différentes tailles)
function deduplicateImages(images: string[]): string[] {
  const imageMap = new Map<string, string>();
  
  for (const url of images) {
    // Extraire l'identifiant unique de l'image (nom de fichier sans extension)
    // Pattern: /2025/01/abc123.jpg ou /abc123-def456.jpg
    const fileMatch = url.match(/\/([a-f0-9-]+)\.(jpg|jpeg|png|webp)$/i);
    if (fileMatch) {
      const fileId = fileMatch[1];
      // Préférer les URLs avec /20XX/ (images originales) ou fit-in (haute qualité)
      const existingUrl = imageMap.get(fileId);
      if (!existingUrl) {
        imageMap.set(fileId, url);
      } else {
        // Préférer l'URL originale (/2025/) sur fit-in, et fit-in sur les autres
        const isOriginal = url.includes('/202');
        const existingIsOriginal = existingUrl.includes('/202');
        if (isOriginal && !existingIsOriginal) {
          imageMap.set(fileId, url);
        }
      }
    } else {
      // Si on ne peut pas extraire l'ID, garder l'URL telle quelle avec une clé unique
      imageMap.set(url, url);
    }
  }
  
  return Array.from(imageMap.values());
}

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
    
    console.log(`    ✅ Image stockée: ${storagePath}`);
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
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY non configurée');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const {
      saleId,
      onlyMissingEstimates = false, // Par défaut, traiter tous les lots
      forceImages = false, // Forcer le re-téléchargement des images
      maxLots = 100,
      storeImages = true,
      delayMs = 2000,
      startFromLot = 1,
    } = body;

    if (!saleId) {
      throw new Error("saleId requis");
    }

    console.log(`🚀 Enrichissement des lots pour vente: ${saleId}`);
    console.log(`   Options: forceImages=${forceImages}, maxLots=${maxLots}, storeImages=${storeImages}, startFromLot=${startFromLot}`);

    // Récupérer les lots à enrichir
    let query = supabase
      .from('interencheres_lots')
      .select('id, lot_number, title, lot_url, estimate_low, estimate_high, images')
      .eq('sale_id', saleId)
      .gte('lot_number', startFromLot)
      .order('lot_number', { ascending: true })
      .limit(maxLots);

    if (onlyMissingEstimates) {
      query = query.is('estimate_low', null);
    }

    const { data: lots, error: lotsError } = await query;

    if (lotsError) {
      throw new Error(`Erreur récupération lots: ${lotsError.message}`);
    }

    if (!lots || lots.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Aucun lot à enrichir',
        processed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 ${lots.length} lots à traiter`);

    const results: EnrichResult[] = [];
    let estimatesUpdated = 0;
    let imagesAdded = 0;

    for (const lot of lots as LotFromDB[]) {
      const result: EnrichResult = {
        lotId: lot.id,
        lotNumber: lot.lot_number,
        estimateUpdated: false,
        imagesAdded: 0,
        newEstimateLow: null,
        newEstimateHigh: null,
        newImagesCount: 0,
      };

      try {
        // Scraper la page du lot
        const scraped = await scrapeLotPage(lot.lot_url, firecrawlApiKey);
        
        const updates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        // Mettre à jour les estimations si trouvées et manquantes
        if (scraped.estimateLow && !lot.estimate_low) {
          updates.estimate_low = scraped.estimateLow;
          updates.estimate_high = scraped.estimateHigh;
          result.estimateUpdated = true;
          result.newEstimateLow = scraped.estimateLow;
          result.newEstimateHigh = scraped.estimateHigh;
          estimatesUpdated++;
        }

        // Traiter les images - forcer si demandé ou si on en a trouvé plus
        const currentImages = Array.isArray(lot.images) ? lot.images : [];
        const currentImagesCount = currentImages.length;
        const hasMoreImages = scraped.images.length > currentImagesCount;
        const shouldUpdateImages = forceImages || hasMoreImages;
        
        if (shouldUpdateImages && scraped.images.length > 0) {
          if (storeImages) {
            // Télécharger et stocker les images
            const storedImages: string[] = [];
            
            for (let i = 0; i < scraped.images.length && i < 10; i++) {
              const storedUrl = await downloadAndStoreImage(
                scraped.images[i],
                saleId,
                lot.id,
                i,
                supabase
              );
              if (storedUrl) {
                storedImages.push(storedUrl);
              }
            }
            
            if (storedImages.length > 0) {
              updates.images = storedImages;
              result.imagesAdded = Math.max(0, storedImages.length - currentImagesCount);
              result.newImagesCount = storedImages.length;
              imagesAdded += result.imagesAdded;
            }
          } else {
            // Juste stocker les URLs externes
            updates.images = scraped.images.slice(0, 10);
            result.imagesAdded = Math.max(0, scraped.images.length - currentImagesCount);
            result.newImagesCount = scraped.images.length;
            imagesAdded += result.imagesAdded;
          }
        }

        // Mettre à jour le lot dans la base
        if (Object.keys(updates).length > 1) { // Plus que juste updated_at
          const { error: updateError } = await supabase
            .from('interencheres_lots')
            .update(updates)
            .eq('id', lot.id);

          if (updateError) {
            result.error = updateError.message;
          }
        }

        console.log(`✅ Lot ${lot.lot_number}: est=${result.estimateUpdated}, img+=${result.imagesAdded}`);

      } catch (err) {
        result.error = err instanceof Error ? err.message : String(err);
        console.log(`❌ Lot ${lot.lot_number}: ${result.error}`);
      }

      results.push(result);

      // Délai entre les requêtes Firecrawl
      if (lots.indexOf(lot) < lots.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log(`\n📊 Résumé: ${estimatesUpdated} estimations mises à jour, ${imagesAdded} images ajoutées`);

    return new Response(JSON.stringify({
      success: true,
      processed: lots.length,
      estimatesUpdated,
      imagesAdded,
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
