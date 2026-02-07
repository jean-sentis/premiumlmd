import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const visionApiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");
  const searchCx = Deno.env.get("GOOGLE_SEARCH_CX");

  const diagnostics: any = {
    hasVisionApiKey: !!visionApiKey,
    visionApiKeyLength: visionApiKey?.length || 0,
    visionApiKeyPrefix: visionApiKey?.substring(0, 6) || "N/A",
    hasSearchCx: !!searchCx,
    searchCxValue: searchCx || "NOT SET",
    searchCxLength: searchCx?.length || 0,
  };

  // Test 1: Simple query without special characters
  const testQuery = "porcelain figurine art deco auction";
  const params1 = new URLSearchParams({
    key: visionApiKey || "",
    cx: searchCx || "",
    q: testQuery,
    num: "3",
  });

  try {
    const url1 = `https://www.googleapis.com/customsearch/v1?${params1.toString()}`;
    diagnostics.test1_url = url1.replace(visionApiKey || "", "***KEY***");
    
    const res1 = await fetch(url1);
    diagnostics.test1_status = res1.status;
    const body1 = await res1.json();
    
    if (res1.ok) {
      diagnostics.test1_result = "SUCCESS";
      diagnostics.test1_totalResults = body1.searchInformation?.totalResults;
      diagnostics.test1_items = (body1.items || []).slice(0, 2).map((i: any) => ({ title: i.title, url: i.link }));
    } else {
      diagnostics.test1_result = "FAILED";
      diagnostics.test1_error = body1.error;
    }
  } catch (err) {
    diagnostics.test1_result = "EXCEPTION";
    diagnostics.test1_error = String(err);
  }

  // Test 2: With French characters + lr parameter (like the real function)
  const testQuery2 = "figurine porcelaine Art Déco enchères estimation prix";
  const params2 = new URLSearchParams({
    key: visionApiKey || "",
    cx: searchCx || "",
    q: testQuery2,
    num: "5",
    lr: "lang_fr",
  });

  try {
    const url2 = `https://www.googleapis.com/customsearch/v1?${params2.toString()}`;
    diagnostics.test2_url = url2.replace(visionApiKey || "", "***KEY***");
    
    const res2 = await fetch(url2);
    diagnostics.test2_status = res2.status;
    const body2 = await res2.json();
    
    if (res2.ok) {
      diagnostics.test2_result = "SUCCESS";
      diagnostics.test2_totalResults = body2.searchInformation?.totalResults;
    } else {
      diagnostics.test2_result = "FAILED";
      diagnostics.test2_error = body2.error;
    }
  } catch (err) {
    diagnostics.test2_result = "EXCEPTION";
    diagnostics.test2_error = String(err);
  }

  // Test 3: Without lr parameter  
  const params3 = new URLSearchParams({
    key: visionApiKey || "",
    cx: searchCx || "",
    q: testQuery2,
    num: "3",
  });

  try {
    const res3 = await fetch(`https://www.googleapis.com/customsearch/v1?${params3.toString()}`);
    diagnostics.test3_status = res3.status;
    const body3 = await res3.json();
    
    if (res3.ok) {
      diagnostics.test3_result = "SUCCESS (without lr param)";
      diagnostics.test3_totalResults = body3.searchInformation?.totalResults;
    } else {
      diagnostics.test3_result = "FAILED";
      diagnostics.test3_error = body3.error;
    }
  } catch (err) {
    diagnostics.test3_result = "EXCEPTION";
    diagnostics.test3_error = String(err);
  }

  return new Response(JSON.stringify(diagnostics, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
