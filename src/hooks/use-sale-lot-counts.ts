import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSaleLotCounts() {
  return useQuery({
    queryKey: ["sale-actual-lot-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("interencheres_sales")
        .select("id, interencheres_lots(count)");
      if (error) throw error;
      return new Map((data ?? []).map((sale) => [sale.id, sale.interencheres_lots[0]?.count]));
    },
    staleTime: 30_000,
  });
}