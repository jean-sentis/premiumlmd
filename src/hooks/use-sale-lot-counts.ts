import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPopulatedLots } from "@/lib/lot-content";

export async function fetchSaleLotCounts() {
  const { data: sales, error: salesError } = await supabase.from("interencheres_sales").select("id");
  if (salesError) throw salesError;
  const counts = new Map((sales ?? []).map((sale) => [sale.id, 0]));
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("interencheres_lots")
      .select("id, sale_id, description, images").order("id").range(offset, offset + 999);
    if (error) throw error;
    const populated = await getPopulatedLots(data ?? []);
    for (const lot of populated) {
      if (lot.sale_id) counts.set(lot.sale_id, (counts.get(lot.sale_id) ?? 0) + 1);
    }
    if (!data || data.length < 1000) break;
  }
  return counts;
}

export function useSaleLotCounts() {
  return useQuery({
    queryKey: ["sale-populated-lot-counts"],
    queryFn: fetchSaleLotCounts,
    staleTime: 30_000,
  });
}