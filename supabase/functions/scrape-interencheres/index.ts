import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import FirecrawlApp from "https://esm.sh/@mendable/firecrawl-js@4.8.1?bundle-deps&no-dts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')!;
const DEFAULT_HOUSE_ID = '316'; // Millon

// Convert thumbor URL to direct assets URL and download image
async function downloadAndStoreImage(
  imageUrl: string, 
  saleId: string, 
  supabase: any
): Promise<string | null> {
  try {
    // Extract the path from thumbor URL and try direct assets URL
    // thumbor format: https://thumbor-indbupload.interencheres.com/HASH=/fit-in/800x800/YYYY/MM/DD/HHMMSS_ID_HASH
    // assets format: https://assets-indbupload.interencheres.com/YYYY/MM/DD/HHMMSS_ID_HASH
    
    let directUrl = imageUrl;
    const pathMatch = imageUrl.match(/\/(20\d{2}\/\d{2}\/\d{2}\/\d+_\d+_[a-f0-9]+)/);
    
    if (pathMatch) {
      directUrl = `https://assets-indbupload.interencheres.com/${pathMatch[1]}`;
      console.log(`Trying direct URL: ${directUrl}`);
    }
    
    // Try direct assets URL first
    let response = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
    
    // If direct URL fails, try without any transformation
    if (!response.ok && directUrl !== imageUrl) {
      console.log(`Direct URL failed (${response.status}), trying original thumbor URL...`);
      response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.interencheres.com/',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Origin': 'https://www.interencheres.com',
        },
      });
    }
    
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageData = await response.arrayBuffer();
    
    // Determine file extension
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('gif')) extension = 'gif';
    
    const fileName = `${saleId}.${extension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('sale-images')
      .upload(fileName, imageData, {
        contentType,
        upsert: true,
      });
    
    if (error) {
      console.error(`Storage upload error: ${error.message}`);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('sale-images')
      .getPublicUrl(fileName);
    
    console.log(`Image stored successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error(`Error downloading/storing image: ${error}`);
    return null;
  }
}

interface ScrapedSale {
  interencheres_id: string;
  title: string;
  sale_type: string | null;
  sale_date: string | null;
  location: string | null;
  lot_count: number | null;
  sale_url: string;
  catalog_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  fees_info: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface DetailPageData {
  lot_count: number | null;
  description: string | null;
  fees_info: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  cover_image_url: string | null;
}

const FRENCH_MONTHS: Record<string, string> = {
  'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
  'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
  'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
};

function parseFrenchDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Format: "09/12/2025 : 04h00"
  const slashMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s*:\s*(\d{2})h(\d{2})/);
  if (slashMatch) {
    const [, day, month, year, hour, minute] = slashMatch;
    return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
  }
  
  // Format: "Mardi 10 Juin 2025 - 14:00"
  const fullMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s*[-:]\s*(\d{1,2})[:h](\d{2}))?/i);
  if (fullMatch) {
    const day = fullMatch[1].padStart(2, '0');
    const monthName = fullMatch[2].toLowerCase();
    const month = FRENCH_MONTHS[monthName];
    const year = fullMatch[3];
    const hour = fullMatch[4] ? fullMatch[4].padStart(2, '0') : '10';
    const minute = fullMatch[5] || '00';
    
    if (month) {
      return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
    }
  }
  
  // Format: "Demain 08h00" or "Aujourd'hui 14h00"
  const todayMatch = dateStr.match(/(Aujourd'hui|Demain)\s+(\d{2})h(\d{2})/i);
  if (todayMatch) {
    const [, dayWord, hour, minute] = todayMatch;
    const date = new Date();
    if (dayWord.toLowerCase() === 'demain') {
      date.setDate(date.getDate() + 1);
    }
    const year = date.getFullYear();
    const monthNum = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${monthNum}-${day}T${hour}:${minute}:00Z`;
  }
  
  return null;
}

// Extract cover image URL from sale card HTML
function extractCoverImage(cardContent: string, interencheresId: string): string | null {
  // Try to find image in card content - pattern: <img ... src="..." ...>
  const imgMatch = cardContent.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    let imgUrl = imgMatch[1];
    // Remove HTML entities
    imgUrl = imgUrl.replace(/&quot;/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
    // If relative URL, make it absolute
    if (imgUrl.startsWith('//')) {
      imgUrl = 'https:' + imgUrl;
    } else if (imgUrl.startsWith('/')) {
      imgUrl = 'https://www.interencheres.com' + imgUrl;
    }
    // Make sure it's not a placeholder or icon
    if (!imgUrl.includes('placeholder') && !imgUrl.includes('icon') && !imgUrl.includes('logo') && imgUrl.includes('http')) {
      // Get higher resolution by modifying thumbor URL
      imgUrl = imgUrl.replace('/160x120/', '/600x450/');
      console.log(`Found cover image for ${interencheresId}: ${imgUrl}`);
      return imgUrl;
    }
  }
  
  // Try background-image style
  const bgMatch = cardContent.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/i);
  if (bgMatch && bgMatch[1]) {
    let imgUrl = bgMatch[1];
    imgUrl = imgUrl.replace(/&quot;/g, '').replace(/&amp;/g, '&');
    if (imgUrl.startsWith('//')) {
      imgUrl = 'https:' + imgUrl;
    } else if (imgUrl.startsWith('/')) {
      imgUrl = 'https://www.interencheres.com' + imgUrl;
    }
    imgUrl = imgUrl.replace('/160x120/', '/600x450/');
    console.log(`Found cover image (bg) for ${interencheresId}: ${imgUrl}`);
    return imgUrl;
  }
  
  // Try data-src (lazy loading)
  const dataSrcMatch = cardContent.match(/data-src=["']([^"']+)["']/i);
  if (dataSrcMatch && dataSrcMatch[1]) {
    let imgUrl = dataSrcMatch[1];
    imgUrl = imgUrl.replace(/&quot;/g, '').replace(/&amp;/g, '&');
    if (imgUrl.startsWith('//')) {
      imgUrl = 'https:' + imgUrl;
    } else if (imgUrl.startsWith('/')) {
      imgUrl = 'https://www.interencheres.com' + imgUrl;
    }
    imgUrl = imgUrl.replace('/160x120/', '/600x450/');
    console.log(`Found cover image (data-src) for ${interencheresId}: ${imgUrl}`);
    return imgUrl;
  }
  
  return null;
}

// Fetch detailed data from individual sale page
async function fetchDetailPageData(saleUrl: string, firecrawl: typeof FirecrawlApp.prototype): Promise<DetailPageData> {
  const result: DetailPageData = {
    lot_count: null,
    description: null,
    fees_info: null,
    contact_name: null,
    contact_email: null,
    contact_phone: null,
    cover_image_url: null,
  };
  
  try {
    console.log(`Fetching details from: ${saleUrl}`);
    
    // Wait longer for JavaScript to load the lots section (8 seconds)
    const response = await firecrawl.scrape(saleUrl, {
      formats: ['html'],
      onlyMainContent: false,
      waitFor: 8000,
    });
    
    if (!response.html) {
      console.log('No HTML content from detail page');
      return result;
    }
    
    const html = response.html;
    
    // Extract lot count
    const lotPatterns = [
      />(\d+)\s*lots?</i,
      /(\d+)\s*lots?\s*(?:à|en|$)/i,
      /Catalogue\s*:\s*(\d+)\s*lots?/i,
    ];
    
    for (const pattern of lotPatterns) {
      const match = html.match(pattern);
      if (match) {
        const count = parseInt(match[1], 10);
        if (count > 0 && count < 10000) {
          result.lot_count = count;
          console.log(`Found lot count: ${count}`);
          break;
        }
      }
    }
    
    // Extract description (conditions de vente)
    const descMatch = html.match(/Conditions de vente<\/strong>\s*<div[^>]*class="nl2bl"[^>]*>[\s\S]*?<span[^>]*class="nl2bl"[^>]*>([\s\S]*?)<\/span>/i);
    if (descMatch) {
      result.description = descMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000); // Limit length
      console.log(`Found description: ${result.description?.slice(0, 100)}...`);
    }
    
    // Extract fees info
    const feesMatch = html.match(/Frais de vente\s*:<\/strong>\s*<span[^>]*><strong>\s*([\d.,]+)\s*<\/strong>%\s*TTC/i);
    if (feesMatch) {
      result.fees_info = `Frais acheteurs : ${feesMatch[1]}% TTC`;
      console.log(`Found fees: ${result.fees_info}`);
    }
    
    // Extract contact name
    const contactMatch = html.match(/v-list-item__title[^>]*>([^<]+)<\/div><\/div><\/div>\s*<div[^>]*role="listbox"/i);
    if (contactMatch) {
      result.contact_name = contactMatch[1].trim();
      console.log(`Found contact: ${result.contact_name}`);
    }
    
    // Extract contact email
    const emailMatch = html.match(/href="mailto:[^"]*<([^>]+@[^>]+)>/i) ||
                       html.match(/mailto:[^"]*%3C([^%]+@[^%]+)%3E/i) ||
                       html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      result.contact_email = decodeURIComponent(emailMatch[1]).trim();
      console.log(`Found email: ${result.contact_email}`);
    }
    
    // Extract contact phone
    const phoneMatch = html.match(/href="tel:(\d+)"/i);
    if (phoneMatch) {
      const phone = phoneMatch[1];
      result.contact_phone = phone.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
      console.log(`Found phone: ${result.contact_phone}`);
    }
    
    // Get cover image from first lot on the page (more representative of the sale)
    // Try multiple patterns since the HTML structure may vary
    
    // Pattern 1: Look for thumbor-indbupload images (lot images from catalog)
    const thumborPattern = /src="(https?:\/\/thumbor-indbupload\.interencheres\.com[^"]+)"/gi;
    const thumborMatches = [...html.matchAll(thumborPattern)];
    
    if (thumborMatches.length > 0) {
      // Filter out tiny thumbnails (less than 200px) and use the first good one
      for (const match of thumborMatches) {
        let imgUrl = match[1].replace(/&quot;/g, '').replace(/&amp;/g, '&');
        // Skip very small images
        if (imgUrl.includes('/60x60/') || imgUrl.includes('/80x80/') || imgUrl.includes('/100x100/')) {
          continue;
        }
        // Get higher resolution
        imgUrl = imgUrl.replace(/\/fit-in\/\d+x\d+\//, '/fit-in/800x800/');
        imgUrl = imgUrl.replace(/\/\d+x\d+\//, '/800x800/');
        result.cover_image_url = imgUrl;
        console.log(`Found lot image for cover: ${imgUrl}`);
        break;
      }
    }
    
    // Pattern 2: Fallback - look for any lot card image
    if (!result.cover_image_url) {
      const lotCardPattern = /class="[^"]*lot[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/gi;
      const lotCardMatches = [...html.matchAll(lotCardPattern)];
      
      for (const match of lotCardMatches) {
        let imgUrl = match[1].replace(/&quot;/g, '').replace(/&amp;/g, '&');
        if (imgUrl.includes('thumbor') && !imgUrl.includes('/60x60/')) {
          imgUrl = imgUrl.replace(/\/fit-in\/\d+x\d+\//, '/fit-in/800x800/');
          result.cover_image_url = imgUrl;
          console.log(`Found lot card image for cover: ${imgUrl}`);
          break;
        }
      }
    }
    
    // Pattern 3: Look for data-src lazy-loaded images
    if (!result.cover_image_url) {
      const dataSrcPattern = /data-src="(https?:\/\/thumbor-indbupload\.interencheres\.com[^"]+)"/gi;
      const dataSrcMatches = [...html.matchAll(dataSrcPattern)];
      
      if (dataSrcMatches.length > 0) {
        let imgUrl = dataSrcMatches[0][1].replace(/&quot;/g, '').replace(/&amp;/g, '&');
        imgUrl = imgUrl.replace(/\/fit-in\/\d+x\d+\//, '/fit-in/800x800/');
        result.cover_image_url = imgUrl;
        console.log(`Found lazy-loaded lot image for cover: ${imgUrl}`);
      }
    }
    
    console.log(`Detail page scrape complete. Lot images found in HTML: ${thumborMatches.length}`);
    
  } catch (error) {
    console.error(`Error fetching details from ${saleUrl}:`, error);
  }
  
  return result;
}

async function scrapeWithFirecrawl(houseId: string): Promise<ScrapedSale[]> {
  const url = `https://www.interencheres.com/commissaire-priseur/millon-${houseId}`;
  console.log(`Scraping ${url} with Firecrawl...`);
  
  const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
  
  const response = await firecrawl.scrape(url, {
    formats: ['html', 'markdown'],
    onlyMainContent: false,
    waitFor: 3000,
  });
  
  // Firecrawl returns data directly, check if we have content
  if (!response.markdown && !response.html) {
    console.error('Firecrawl scrape failed - no content:', response);
    throw new Error('Failed to scrape page with Firecrawl');
  }
  
  console.log('Firecrawl response received, parsing...');
  console.log('Markdown length:', response.markdown?.length || 0);
  console.log('HTML length:', response.html?.length || 0);
  
  const html = response.html || '';
  const sales: ScrapedSale[] = [];
  
  // Parse sale cards from HTML - pattern: <a href="/category/title-ID" class="sale-card ...">
  const saleCardRegex = /<a\s+href="(https:\/\/www\.interencheres\.com\/[^"]+?-(\d+))"\s+[^>]*class="[^"]*sale-card[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  
  let match;
  while ((match = saleCardRegex.exec(html)) !== null) {
    const saleUrl = match[1];
    const interencheresId = match[2];
    const cardContent = match[3];
    
    console.log(`Found sale card: ${saleUrl}`);
    
    // Extract title
    const titleMatch = cardContent.match(/autoqa-salecard-title[^>]*>[\s\S]*?<div[^>]*class="d-inline"[^>]*>([^<]+)<\/div>/i) ||
                       cardContent.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : `Vente ${interencheresId}`;
    
    // Extract location
    const locationMatch = cardContent.match(/mdi-map-marker[^>]*><\/i>\s*([^<]+)/i) ||
                          cardContent.match(/(?:Paris|Lyon|Marseille|Bordeaux|Nice|Avignon)[^<]*/i);
    const location = locationMatch ? locationMatch[1]?.trim() || locationMatch[0].trim() : null;
    
    // Extract lot count from card (may be inaccurate, will be updated from detail page)
    const lotMatch = cardContent.match(/(\d+)\s*lots?/i);
    const cardLotCount = lotMatch ? parseInt(lotMatch[1], 10) : null;
    
    // Extract date
    let saleDate = null;
    const dateMatch = cardContent.match(/(\d{2}\/\d{2}\/\d{4}\s*:\s*\d{2}h\d{2})/) ||
                      cardContent.match(/(\d{1,2}\s+\w+\s+\d{4}(?:\s*[-:]\s*\d{1,2}[:h]\d{2})?)/);
    if (dateMatch) {
      saleDate = parseFrenchDate(dateMatch[1]);
    }
    
    // Extract sale type
    const typeMatch = cardContent.match(/Interenchères\s*(Live)?/i);
    const saleType = typeMatch ? (typeMatch[1] ? 'Live' : 'Salle') : 'Live';
    
    // Extract cover image
    const coverImageUrl = extractCoverImage(cardContent, interencheresId);
    
    sales.push({
      interencheres_id: interencheresId,
      title,
      sale_type: saleType,
      sale_date: saleDate,
      location,
      lot_count: cardLotCount,
      sale_url: saleUrl,
      catalog_url: saleUrl,
      cover_image_url: coverImageUrl,
      description: null,
      fees_info: null,
      contact_name: null,
      contact_email: null,
      contact_phone: null,
    });
  }
  
  // Fallback: parse from markdown if no HTML cards found
  if (sales.length === 0 && response.markdown) {
    console.log('No HTML cards found, trying markdown parsing...');
    
    // Look for sale links in markdown
    const mdLinkRegex = /\[([^\]]+)\]\((https:\/\/www\.interencheres\.com\/[^)]+?-(\d+))\)/gi;
    const seenIds = new Set<string>();
    
    while ((match = mdLinkRegex.exec(response.markdown)) !== null) {
      const title = match[1];
      const saleUrl = match[2];
      const interencheresId = match[3];
      
      if (!seenIds.has(interencheresId)) {
        seenIds.add(interencheresId);
        sales.push({
          interencheres_id: interencheresId,
          title: title.trim(),
          sale_type: 'Live',
          sale_date: null,
          location: null,
          lot_count: null,
          sale_url: saleUrl,
          catalog_url: saleUrl,
          cover_image_url: null,
          description: null,
          fees_info: null,
          contact_name: null,
          contact_email: null,
          contact_phone: null,
        });
        console.log(`Found sale from markdown: ${title} (ID: ${interencheresId})`);
      }
    }
  }
  
  // Fetch detailed data from individual sale pages
  console.log('Fetching detailed data from sale pages...');
  for (const sale of sales) {
    const detailData = await fetchDetailPageData(sale.sale_url, firecrawl);
    
    if (detailData.lot_count !== null) {
      console.log(`Updated lot count for ${sale.interencheres_id}: ${sale.lot_count} -> ${detailData.lot_count}`);
      sale.lot_count = detailData.lot_count;
    }
    if (detailData.description) sale.description = detailData.description;
    if (detailData.fees_info) sale.fees_info = detailData.fees_info;
    if (detailData.contact_name) sale.contact_name = detailData.contact_name;
    if (detailData.contact_email) sale.contact_email = detailData.contact_email;
    if (detailData.contact_phone) sale.contact_phone = detailData.contact_phone;
    // Always prefer detail page image (from first lot) over card image
    if (detailData.cover_image_url) {
      console.log(`Replacing cover image with lot image: ${detailData.cover_image_url}`);
      sale.cover_image_url = detailData.cover_image_url;
    }
  }
  
  console.log(`Total sales found: ${sales.length}`);
  return sales;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Interenchères scrape with Firecrawl...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    let houseId = DEFAULT_HOUSE_ID;
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      houseId = body.houseId || body.house_id || DEFAULT_HOUSE_ID;
    }
    
    console.log(`Scraping house ID: ${houseId}`);
    
    const scrapedSales = await scrapeWithFirecrawl(houseId);
    
    if (scrapedSales.length === 0) {
      console.log('No sales found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No sales found',
          salesCount: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Store raw data in cache
    const { error: cacheError } = await supabase
      .from('interencheres_cache')
      .insert({
        house_id: houseId,
        raw_data: scrapedSales,
      });
    
    if (cacheError) {
      console.error('Cache insert error:', cacheError);
    }
    
    // Upsert sales data and download images
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const sale of scrapedSales) {
      // Download and store image if we have one from Interenchères
      if (sale.cover_image_url && sale.cover_image_url.includes('interencheres')) {
        const storedImageUrl = await downloadAndStoreImage(
          sale.cover_image_url, 
          sale.interencheres_id, 
          supabase
        );
        if (storedImageUrl) {
          sale.cover_image_url = storedImageUrl;
        }
      }
      
      const { data: existing } = await supabase
        .from('interencheres_sales')
        .select('id')
        .eq('interencheres_id', sale.interencheres_id)
        .single();
      
      if (existing) {
        const { error } = await supabase
          .from('interencheres_sales')
          .update({
            title: sale.title,
            sale_type: sale.sale_type,
            sale_date: sale.sale_date,
            location: sale.location,
            lot_count: sale.lot_count,
            sale_url: sale.sale_url,
            catalog_url: sale.catalog_url,
            cover_image_url: sale.cover_image_url,
            description: sale.description,
            fees_info: sale.fees_info,
            contact_name: sale.contact_name,
            contact_email: sale.contact_email,
            contact_phone: sale.contact_phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        if (!error) updatedCount++;
      } else {
        const { error } = await supabase
          .from('interencheres_sales')
          .insert({
            house_id: houseId,
            interencheres_id: sale.interencheres_id,
            title: sale.title,
            sale_type: sale.sale_type,
            sale_date: sale.sale_date,
            location: sale.location,
            lot_count: sale.lot_count,
            sale_url: sale.sale_url,
            catalog_url: sale.catalog_url,
            cover_image_url: sale.cover_image_url,
            description: sale.description,
            fees_info: sale.fees_info,
            contact_name: sale.contact_name,
            contact_email: sale.contact_email,
            contact_phone: sale.contact_phone,
            status: 'upcoming',
          });
        
        if (!error) insertedCount++;
      }
    }
    
    console.log(`Scrape complete: ${insertedCount} inserted, ${updatedCount} updated`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Scraped ${scrapedSales.length} sales`,
        inserted: insertedCount,
        updated: updatedCount,
        sales: scrapedSales,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});