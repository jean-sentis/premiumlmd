// Hydrate les images de lots: télécharge les images externes (Interenchères) puis les stocke dans le stockage public.
// But: éviter les blocages de hotlink côté navigateur.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_FIT_IN = "1200x1200";

function normalizeUrl(raw: string): string {
  const s = (raw || "").trim();
  if (!s) return s;

  // Fix protocol-relative
  let url = s.startsWith("//") ? `https:${s}` : s;

  // Fix accidental double slashes after hostname
  url = url.replace(/^(https?:\/\/[^/]+)\/\//, "$1/");

  // Fix common invalid thumbor pattern: `=/fit-in/2025/...` (missing WxH)
  url = url.replace(
    /(thumbor-[^/]+\.interencheres\.com\/[^=]+)=\/fit-in\/(20\d{2}\/\d{2}\/\d{2}\/\d+_\d+_[a-f0-9]+)/i,
    `$1=/fit-in/${DEFAULT_FIT_IN}/$2`,
  );

  // Fix common invalid thumbor pattern: `=/smart/2025/...` (missing size)
  url = url.replace(
    /(thumbor-[^/]+\.interencheres\.com\/[^=]+)=\/smart\/(20\d{2}\/\d{2}\/\d{2}\/\d+_\d+_[a-f0-9]+)/i,
    `$1=/${DEFAULT_FIT_IN}/smart/$2`,
  );

  return url;
}

async function fetchImage(url: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.interencheres.com/",
        Origin: "https://www.interencheres.com",
      },
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const bytes = await res.arrayBuffer();
    return { bytes, contentType };
  } catch {
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
    const maxLots = Number.isFinite(body?.maxLots) ? Number(body.maxLots) : 120;
    const maxImagesPerLot = Number.isFinite(body?.maxImagesPerLot) ? Number(body.maxImagesPerLot) : 2;

    if (!saleId) {
      return new Response(JSON.stringify({ success: false, error: "saleId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    console.log("[hydrate-lot-images] start", { saleId, maxLots, maxImagesPerLot });

    const { data: lots, error: lotsError } = await supabase
      .from("interencheres_lots")
      .select("id, lot_number, images")
      .eq("sale_id", saleId)
      .order("lot_number", { ascending: true })
      .limit(maxLots);

    if (lotsError) {
      console.error("[hydrate-lot-images] lotsError", lotsError);
      return new Response(JSON.stringify({ success: false, error: lotsError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{
      lotId: string;
      lotNumber: number;
      attempted: number;
      stored: number;
      error?: string;
    }> = [];

    let totalStored = 0;

    for (const lot of lots || []) {
      const rawImages = Array.isArray(lot.images) ? (lot.images as string[]) : [];
      // Met les URLs "signées" (contenant '=/') en premier, elles sont généralement valides.
      const sorted = [...rawImages].sort((a, b) => (b.includes('=/') ? 1 : 0) - (a.includes('=/') ? 1 : 0));
      const normalized = sorted.map(normalizeUrl).filter(Boolean);

      let storedUrls: string[] = [];
      let attempted = 0;

      for (let i = 0; i < normalized.length && storedUrls.length < maxImagesPerLot; i++) {
        const sourceUrl = normalized[i];
        attempted++;

        // Ici on n'essaie PAS le domaine assets-indbupload (DNS KO dans l'environnement).
        // On utilise thumbor, mais avec URL normalisée (taille injectée si manquante).
        const fetched = await fetchImage(sourceUrl);
        if (!fetched) continue;

        const ext = extFromContentType(fetched.contentType);
        const path = `lots/${saleId}/${lot.id}/${storedUrls.length + 1}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("sale-images")
          .upload(path, fetched.bytes, {
            contentType: fetched.contentType,
            upsert: true,
          });

        if (uploadError) {
          console.error("[hydrate-lot-images] uploadError", { lotId: lot.id, path, msg: uploadError.message });
          continue;
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/sale-images/${path}`;
        storedUrls.push(publicUrl);
        totalStored++;
      }

      if (storedUrls.length > 0) {
        // Met à jour la colonne images avec des URLs stables (public storage)
        const { error: updateError } = await supabase
          .from("interencheres_lots")
          .update({ images: storedUrls })
          .eq("id", lot.id);

        if (updateError) {
          console.error("[hydrate-lot-images] updateError", { lotId: lot.id, msg: updateError.message });
          results.push({ lotId: lot.id, lotNumber: lot.lot_number, attempted, stored: 0, error: updateError.message });
          continue;
        }
      }

      results.push({ lotId: lot.id, lotNumber: lot.lot_number, attempted, stored: storedUrls.length });
    }

    console.log("[hydrate-lot-images] done", { saleId, totalStored });

    return new Response(
      JSON.stringify({
        success: true,
        saleId,
        lotsProcessed: results.length,
        totalStored,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[hydrate-lot-images] fatal", e);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
