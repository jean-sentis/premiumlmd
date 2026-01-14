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
    const { searchTerms } = await req.json();

    if (!searchTerms || !Array.isArray(searchTerms) || searchTerms.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'searchTerms array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query for art/antiques images
    const query = `${searchTerms.join(' ')} enchères art antique -site:pinterest.com`;
    console.log('Searching for images:', query);

    // Use Firecrawl search to find relevant pages
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: 5,
        scrapeOptions: {
          formats: ['links'],
        },
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Firecrawl search error:', errorText);
      throw new Error('Search failed');
    }

    const searchData = await searchResponse.json();
    console.log('Search results:', searchData.data?.length || 0, 'results');

    // Collect images from search results
    const images: Array<{ url: string; title: string; sourceUrl: string }> = [];

    // For each result, try to scrape images
    if (searchData.data && searchData.data.length > 0) {
      // Take first 3 results to scrape
      const urlsToScrape = searchData.data.slice(0, 3).map((r: any) => r.url);

      for (const url of urlsToScrape) {
        try {
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              formats: ['html'],
              onlyMainContent: true,
            }),
          });

          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            const html = scrapeData.data?.html || scrapeData.html || '';
            
            // Extract image URLs from HTML
            const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
            let match;
            while ((match = imgRegex.exec(html)) !== null && images.length < 6) {
              const imgUrl = match[1];
              // Filter for quality images (not icons, not too small)
              if (imgUrl && 
                  !imgUrl.includes('icon') && 
                  !imgUrl.includes('logo') &&
                  !imgUrl.includes('avatar') &&
                  !imgUrl.includes('placeholder') &&
                  !imgUrl.includes('data:image') &&
                  (imgUrl.includes('.jpg') || imgUrl.includes('.jpeg') || imgUrl.includes('.png') || imgUrl.includes('.webp'))) {
                
                // Make absolute URL if relative
                let absoluteUrl = imgUrl;
                if (imgUrl.startsWith('/')) {
                  const urlObj = new URL(url);
                  absoluteUrl = `${urlObj.origin}${imgUrl}`;
                } else if (!imgUrl.startsWith('http')) {
                  continue; // Skip other relative paths
                }

                images.push({
                  url: absoluteUrl,
                  title: searchTerms.join(' '),
                  sourceUrl: url
                });
              }
            }
          }
        } catch (scrapeError) {
          console.error('Error scraping', url, scrapeError);
        }
      }
    }

    console.log('Found', images.length, 'images');

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: images.slice(0, 4) // Return max 4 images
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-example-images:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
