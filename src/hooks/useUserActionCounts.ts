import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserActionCounts {
  purchaseOrders: number;
  phoneBids: number;
  memorizedLots: number;
  alertsWithResults: number;
  wonLots: number;
  pendingPayments: number;
  loading: boolean;
}

export const useUserActionCounts = (): UserActionCounts => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Omit<UserActionCounts, 'loading'>>({
    purchaseOrders: 0,
    phoneBids: 0,
    memorizedLots: 0,
    alertsWithResults: 0,
    wonLots: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) {
        setCounts({ purchaseOrders: 0, phoneBids: 0, memorizedLots: 0, alertsWithResults: 0, wonLots: 0, pendingPayments: 0 });
        setLoading(false);
        return;
      }

      try {
        // Fetch basic counts in parallel
        const [purchaseOrdersRes, phoneBidsRes, memorizedLotsRes, alertsRes, viewedLotsRes, wonLotsRes, pendingPaymentsRes] = await Promise.all([
          supabase
            .from("purchase_orders")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("phone_bid_requests")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("memorized_lots")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("user_alerts")
            .select("id, keyword")
            .eq("user_id", user.id)
            .eq("is_active", true),
          supabase
            .from("alert_lot_views")
            .select("lot_id, alert_id")
            .eq("user_id", user.id),
          supabase
            .from("interencheres_lots")
            .select("id", { count: "exact", head: true })
            .eq("winner_user_id", user.id),
          supabase
            .from("bordereaux")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "pending"),
        ]);

        // Créer un Set des lots vus par alerte
        const viewedLotsByAlert: Record<string, Set<string>> = {};
        if (viewedLotsRes.data) {
          for (const view of viewedLotsRes.data) {
            if (!viewedLotsByAlert[view.alert_id]) {
              viewedLotsByAlert[view.alert_id] = new Set();
            }
            viewedLotsByAlert[view.alert_id].add(view.lot_id);
          }
        }

        // Compter les lots NON VUS correspondant aux alertes
        let alertsWithResultsCount = 0;
        if (alertsRes.data && alertsRes.data.length > 0) {
          for (const alert of alertsRes.data) {
            const keyword = alert.keyword.split('(')[0].trim().toLowerCase();
            const { data: matchingLots } = await supabase
              .from('interencheres_lots')
              .select('id')
              .ilike('title', `%${keyword}%`)
              .limit(50);
            
            if (matchingLots) {
              const viewedSet = viewedLotsByAlert[alert.id] || new Set();
              const unseenCount = matchingLots.filter(lot => !viewedSet.has(lot.id)).length;
              alertsWithResultsCount += unseenCount;
            }
          }
        }

        setCounts({
          purchaseOrders: purchaseOrdersRes.count || 0,
          phoneBids: phoneBidsRes.count || 0,
          memorizedLots: memorizedLotsRes.count || 0,
          alertsWithResults: alertsWithResultsCount,
          wonLots: wonLotsRes.count || 0,
          pendingPayments: pendingPaymentsRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching user action counts:", error);
      }
      setLoading(false);
    };

    fetchCounts();
  }, [user]);

  return { ...counts, loading };
};
