import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPopulatedLots } from "@/lib/lot-content";
import { isInPreparationSale } from "@/lib/prototype-pages";
import { getDemoNow } from "@/lib/site-config";

export interface SaleLotCounts {
  counts: Map<string, number>;
  preparation: Set<string>;
}

export async function fetchSaleLotCounts(): Promise<SaleLotCounts> {
  const now = getDemoNow();
  const { data: sales, error: salesError } = await supabase
    .from("interencheres_sales")
    .select("id, sale_date");
  if (salesError) throw salesError;
  const counts = new Map((sales ?? []).map((sale) => [sale.id, 0]));
  const preparation = new Set(
    (sales ?? [])
      .filter((sale) => isInPreparationSale(sale.sale_date, now))
      .map((sale) => sale.id),
  );
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
  return { counts, preparation };
}

export function useSaleLotCounts() {
  return useQuery({
    queryKey: ["sale-populated-lot-counts"],
    queryFn: fetchSaleLotCounts,
    staleTime: 30_000,
  });
}
