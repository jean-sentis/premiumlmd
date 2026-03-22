import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LotInput {
  title: string;
  description?: string;
  category?: string;
  estimate_low?: number;
  estimate_high?: number;
  image_urls?: string[];
  lot_number?: number;
  sale_title?: string;
}

interface SeoOutput {
  meta_title: string;
  meta_description: string;
  keywords: string[];
  json_ld: Record<string, unknown>;
  slug: string;
}

function buildPrompt(lot: LotInput): string {
  const estimate = lot.estimate_low && lot.estimate_high
    ? `Estimation : ${lot.estimate_low} – ${lot.estimate_high} €`
    : lot.estimate_low
      ? `Estimation : ${lot.estimate_low} €`
      : '';

  return `Tu es un expert SEO spécialisé dans les ventes aux enchères et les objets d'art.

À partir des informations suivantes sur un lot, génère les métadonnées SEO optimisées.

**Lot :**
- Titre : ${lot.title}
- Description : ${lot.description || 'Non fournie'}
- Catégorie : ${lot.category || 'Non précisée'}
- ${estimate || 'Pas d\'estimation'}
- Vente : ${lot.sale_title || 'Non précisée'}

**Génère au format JSON strict (pas de markdown) :**
{
  "meta_title": "< 60 caractères, mot-clé principal + contexte enchères",
  "meta_description": "< 160 caractères, descriptif engageant avec call-to-action vers l'enchère",
  "keywords": ["5 à 8 mots-clés longue traîne pertinents pour le référencement"],
  "slug": "url-seo-friendly-en-minuscules-sans-accents"
}

Règles :
- meta_title : inclure le type d'objet + un qualificatif (époque, artiste, matière)
- meta_description : donner envie, mentionner "enchère" ou "vente aux enchères"
- keywords : termes que taperait un acheteur sur Google (ex: "pendule bronze doré Louis XVI")
- slug : court, descriptif, sans numéro de lot
- Langue : français`;
}

function buildJsonLd(lot: LotInput, seo: Omit<SeoOutput, 'json_ld'>): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": seo.meta_title,
    "description": seo.meta_description,
    "category": lot.category || "Objet d'art",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/UsedCondition",
    },
  };

  if (lot.estimate_low) {
    (jsonLd.offers as Record<string, unknown>).lowPrice = lot.estimate_low;
  }
  if (lot.estimate_high) {
    (jsonLd.offers as Record<string, unknown>).highPrice = lot.estimate_high;
  }
  if (lot.image_urls && lot.image_urls.length > 0) {
    jsonLd.image = lot.image_urls;
  }

  return jsonLd;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const body = await req.json();
    
    // Support single lot or batch
    const lots: LotInput[] = Array.isArray(body.lots) ? body.lots : [body];
    const minEstimate = body.min_estimate ?? 0;

    const results: { lot_index: number; seo: SeoOutput | null; skipped: boolean; error?: string }[] = [];

    for (let i = 0; i < lots.length; i++) {
      const lot = lots[i];

      // Filtre par seuil d'estimation
      if (minEstimate > 0 && (!lot.estimate_low || lot.estimate_low < minEstimate)) {
        results.push({ lot_index: i, seo: null, skipped: true });
        continue;
      }

      try {
        const prompt = buildPrompt(lot);

        const aiResponse = await fetch('https://ai.lovable.dev/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          throw new Error(`AI API error ${aiResponse.status}: ${errText}`);
        }

        const aiData = await aiResponse.json();
        const rawContent = aiData.choices?.[0]?.message?.content || '';

        // Parse JSON from response (handle possible markdown wrapping)
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        const seo: SeoOutput = {
          meta_title: (parsed.meta_title || '').substring(0, 60),
          meta_description: (parsed.meta_description || '').substring(0, 160),
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
          slug: (parsed.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 80),
          json_ld: buildJsonLd(lot, {
            meta_title: parsed.meta_title || lot.title,
            meta_description: parsed.meta_description || '',
            keywords: parsed.keywords || [],
            slug: parsed.slug || '',
          }),
        };

        results.push({ lot_index: i, seo, skipped: false });
        console.log(`✅ Lot ${i}: "${seo.meta_title}" → /${seo.slug}`);

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Lot ${i}: ${msg}`);
        results.push({ lot_index: i, seo: null, skipped: false, error: msg });
      }

      // Rate limiting entre les appels
      if (i < lots.length - 1) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const enriched = results.filter(r => r.seo).length;
    const skipped = results.filter(r => r.skipped).length;
    const errors = results.filter(r => r.error).length;

    return new Response(JSON.stringify({
      success: true,
      total: lots.length,
      enriched,
      skipped,
      errors,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
