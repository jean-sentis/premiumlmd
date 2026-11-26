import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isEmptySale } from "@/lib/prototype-pages";

export default function SaleAvailabilityBadge({ saleId }: { saleId: string }) {
  const { data } = useQuery({
    queryKey: ["sale-actual-lot-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("interencheres_sales")
        .select("id, interencheres_lots(count)");
      if (error) throw error;
      return new Map((data ?? []).map((sale) => [sale.id, sale.interencheres_lots[0]?.count]));
    },
    staleTime: 30_000,
  });
  if (!isEmptySale(data?.get(saleId))) return null;
  return <span className="prototype-marker">Sans lots · Maquette</span>;
}