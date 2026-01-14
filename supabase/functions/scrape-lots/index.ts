import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import FirecrawlApp from "https://esm.sh/@mendable/firecrawl-js@1.16.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LotData {
  lot_number: number;
  interencheres_lot_id: string;
  title: string;
  description: string;
  estimate_low: number | null;
  estimate_high: number | null;
  lot_url: string;
  images: string[];
  categories: string[];
  dimensions: string | null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getStatusCodeFromUnknownError(error: unknown): number | null {
  const anyErr = error as any;
  const code = anyErr?.statusCode ?? anyErr?.status ?? anyErr?.response?.status;
  return typeof code === "number" ? code : null;
}

function isRateLimitError(error: unknown): boolean {
  return getStatusCodeFromUnknownError(error) === 429;
}

type ScrapeFormat = "json" | "html" | "markdown" | "rawHtml" | "content" | "links" | "screenshot" | "screenshot@fullPage" | "extract";

async function scrapeUrlWithRetry(
  firecrawl: FirecrawlApp,
  url: string,
  opts: { formats: ScrapeFormat[]; waitFor?: number },
  params?: { maxAttempts?: number; baseDelayMs?: number; maxDelayMs?: number; label?: string },
) {
  const maxAttempts = params?.maxAttempts ?? 5;
  const baseDelayMs = params?.baseDelayMs ?? 3000;
  const maxDelayMs = params?.maxDelayMs ?? 30000;
  const label = params?.label ?? "scrape";

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await firecrawl.scrapeUrl(url, opts);
      return res;
    } catch (e) {
      lastErr = e;
      if (!isRateLimitError(e) || attempt === maxAttempts) {
        throw e;
      }

      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * 500);
      const waitMs = backoff + jitter;

      console.log(
        `[rate-limit] ${label} 429 for ${url} (attempt ${attempt}/${maxAttempts}). Waiting ${waitMs}ms...`,
      );
      await sleep(waitMs);
    }
  }

  throw lastErr ?? new Error("Unknown error");
}

function extractLotId(url: string): string {
  const match = url.match(/lot-(\d+)\.html/);
  return match ? match[1] : "";
}

function parseEstimation(text: string): { low: number | null; high: number | null } {
  const match = text.match(/(\d[\d\s]*)\s*€?\s*[-–]\s*(\d[\d\s]*)\s*€?/);
  if (match) {
    return {
      low: parseInt(match[1].replace(/\s/g, ""), 10),
      high: parseInt(match[2].replace(/\s/g, ""), 10),
    };
  }
  return { low: null, high: null };
}

// Télécharge une image et la stocke dans Supabase Storage
async function downloadAndStoreImage(
  supabase: any,
  imageUrl: string,
  saleId: string,
  lotId: string
): Promise<string | null> {
  try {
    console.log(`Downloading image: ${imageUrl}`);
    
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": "https://www.interencheres.com/",
      },
    });

    if (!response.ok) {
      console.error(`Failed to download image: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Déterminer l'extension
    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";
    else if (contentType.includes("gif")) ext = "gif";

    const filePath = `lots/${saleId}/${lotId}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("sale-images")
      .upload(filePath, bytes, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`Upload error: ${uploadError.message}`);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from("sale-images")
      .getPublicUrl(filePath);

    console.log(`Image stored: ${publicUrl.publicUrl}`);
    return publicUrl.publicUrl;
  } catch (error) {
    console.error(`Error downloading/storing image:`, error);
    return null;
  }
}

// Nouvelle méthode: utilise ogImage des metadata
async function scrapeLotPage(
  firecrawl: FirecrawlApp,
  supabase: any,
  lotUrl: string,
  saleId: string
): Promise<LotData | null> {
  try {
    console.log(`Scraping lot: ${lotUrl}`);

    // Scraper avec waitFor pour laisser le JS charger
    const response: any = await scrapeUrlWithRetry(
      firecrawl,
      lotUrl,
      { formats: ["markdown"], waitFor: 2000 },
      { label: "lot" },
    );

    const success = response?.success ?? (response?.data?.success !== false);
    if (!success) {
      console.error(`Failed to scrape lot: ${lotUrl}`);
      return null;
    }

    const data = response?.data || response;
    const markdown = data?.markdown || response?.markdown || "";
    const metadata = data?.metadata || response?.metadata || {};

    // Extraire l'image OG (méthode qui fonctionne!)
    const ogImage = metadata?.ogImage || metadata?.['og:image'] || null;
    console.log(`OG Image found: ${ogImage ? 'yes' : 'no'}`);

    const lotId = extractLotId(lotUrl);
    
    // Télécharger et stocker l'image si trouvée
    const images: string[] = [];
    if (ogImage) {
      const storedUrl = await downloadAndStoreImage(supabase, ogImage, saleId, lotId);
      if (storedUrl) {
        images.push(storedUrl);
      }
    }

    // Parser les données du lot
    const lotNumMatch = markdown.match(/Lot\s+(\d+)/i);
    const lotNumber = lotNumMatch ? parseInt(lotNumMatch[1], 10) : 0;

    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "Sans titre";

    const estimationMatch = markdown.match(/Estimation\s*:\s*([^\n]+)/i);
    const estimation = estimationMatch
      ? parseEstimation(estimationMatch[1])
      : { low: null, high: null };

    let description = "";
    const descMatch = markdown.match(
      /Description\n\n([\s\S]*?)(?=\n\n(?:Frais|Lot suivant|Lot précédent|$))/i,
    );
    if (descMatch) {
      description = descMatch[1].trim();
    }

    let dimensions: string | null = null;
    const dimMatch = description.match(/(?:H|L|D|Dim\.?)*\s*:\s*[\d,.\s]+(?:cm|mm|m)/gi);
    if (dimMatch) {
      dimensions = dimMatch.join(" / ");
    }

    const categories: string[] = [];
    const catMatches = markdown.match(/\[([^\]]+)\]\(https:\/\/www\.interencheres\.com\/[^)]+\)/g);
    if (catMatches) {
      catMatches.forEach((m: string) => {
        const catName = m.match(/\[([^\]]+)\]/);
        if (catName && !catName[1].includes("Photo") && !catName[1].includes("lot")) {
          categories.push(catName[1]);
        }
      });
    }

    return {
      lot_number: lotNumber,
      interencheres_lot_id: lotId,
      title,
      description,
      estimate_low: estimation.low,
      estimate_high: estimation.high,
      lot_url: lotUrl,
      images,
      categories,
      dimensions,
    };
  } catch (error) {
    console.error(`Error scraping lot ${lotUrl}:`, error);
    return null;
  }
}

// Extrait les URLs des lots depuis le HTML de la page de vente
function extractLotUrlsFromHtml(html: string, saleUrl: string): string[] {
  const urls: string[] = [];
  const regex = /href="([^"]*lot-\d+\.html)"/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    let url = match[1];
    if (url.startsWith("/")) {
      url = `https://www.interencheres.com${url}`;
    } else if (!url.startsWith("http")) {
      const baseUrl = saleUrl.replace(/\/{0,1}[^/]*$/, "/");
      url = baseUrl + url;
    }
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }

  return urls;
}

// Scrape la page de vente pour récupérer les URLs des lots
async function extractLotUrls(firecrawl: FirecrawlApp, saleUrl: string): Promise<string[]> {
  console.log(`Extracting lot URLs from: ${saleUrl}`);
  
  const response: any = await scrapeUrlWithRetry(
    firecrawl,
    saleUrl,
    { formats: ["html"], waitFor: 2000 },
    { label: "sale-html" },
  );

  const data = response?.data || response;
  const html = data?.html || response?.html || "";
  
  const lotUrls = extractLotUrlsFromHtml(html, saleUrl);
  console.log(`Found ${lotUrls.length} unique lot URLs`);
  
  return lotUrls;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { saleId, maxLots, batchSize = 5, startFrom = 0 } = await req.json();

    if (!saleId) {
      return new Response(JSON.stringify({ error: "saleId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Scraping sale: ${saleId}, batch: ${batchSize}, startFrom: ${startFrom}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey });

    const { data: sale, error: saleError } = await supabase
      .from("interencheres_sales")
      .select("*")
      .eq("id", saleId)
      .single();

    if (saleError || !sale) {
      return new Response(JSON.stringify({ error: "Sale not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found sale: ${sale.title}`);

    // Utiliser HTML pour extraire les URLs des lots
    const allLotUrls = await extractLotUrls(firecrawl, sale.sale_url);
    
    if (allLotUrls.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No lot URLs found on sale page",
        saleUrl: sale.sale_url 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalLots = maxLots ? Math.min(allLotUrls.length, maxLots) : allLotUrls.length;
    
    // Get batch of URLs to scrape
    const endIndex = Math.min(startFrom + batchSize, totalLots);
    const urlsToScrape = allLotUrls.slice(startFrom, endIndex);
    
    console.log(`Scraping lots ${startFrom + 1} to ${endIndex} of ${totalLots}`);

    const lots: LotData[] = [];
    for (const url of urlsToScrape) {
      const lot = await scrapeLotPage(firecrawl, supabase, url, saleId);
      if (lot) {
        lots.push(lot);
      }
      await sleep(2000); // 2s between requests
    }

    // Upsert lots
    let inserted = 0;
    for (const lot of lots) {
      const { error: upsertError } = await supabase
        .from("interencheres_lots")
        .upsert(
          {
            sale_id: saleId,
            interencheres_lot_id: lot.interencheres_lot_id,
            lot_number: lot.lot_number,
            title: lot.title,
            description: lot.description,
            estimate_low: lot.estimate_low,
            estimate_high: lot.estimate_high,
            lot_url: lot.lot_url,
            images: lot.images,
            categories: lot.categories,
            dimensions: lot.dimensions,
          },
          { onConflict: "interencheres_lot_id", ignoreDuplicates: false },
        );

      if (!upsertError) inserted++;
    }

    const hasMore = endIndex < totalLots;
    const progress = Math.round((endIndex / totalLots) * 100);

    console.log(`Batch complete: ${inserted} lots inserted, progress: ${progress}%`);

    return new Response(
      JSON.stringify({
        success: true,
        sale: sale.title,
        totalLots,
        batchStart: startFrom,
        batchEnd: endIndex,
        lotsScraped: lots.length,
        lotsInserted: inserted,
        hasMore,
        nextStartFrom: hasMore ? endIndex : null,
        progress,
        lots: lots.map((l) => ({ 
          lot_number: l.lot_number, 
          title: l.title,
          hasImage: l.images.length > 0 
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in scrape-lots:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
