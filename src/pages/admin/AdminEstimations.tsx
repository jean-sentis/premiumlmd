import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EstimationCard, type EstimationRequest } from "@/components/estimation/EstimationCard";
import { EstimationFilters, type FilterType } from "@/components/estimation/EstimationFilters";
import { EstimationNavStrip } from "@/components/estimation/EstimationNavStrip";
import { EstimationDetail } from "@/components/estimation/EstimationDetail";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Inbox, Loader2 } from "lucide-react";
import { getOverdueInfo, INTEREST_LEVELS } from "@/components/estimation/detail/interest-config";

const AdminEstimations = () => {
  const [estimations, setEstimations] = useState<EstimationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEstimation, setSelectedEstimation] = useState<EstimationRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const fetchEstimations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("estimation_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching estimations:", error);
    } else {
      setEstimations((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEstimations();
  }, [fetchEstimations]);

  const handleUpdate = useCallback(() => {
    fetchEstimations();
  }, [fetchEstimations]);

  // Filtering logic
  const filtered = useMemo(() => {
    return estimations.filter((e) => {
      // Search
      const matchesSearch =
        !searchQuery ||
        e.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.email.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Filter
      switch (activeFilter) {
        case "all":
          return true;
        case "unread":
          return e.status !== "responded";
        case "pending":
          return e.status !== "responded";
        case "overdue":
          return e.status !== "responded" && getOverdueInfo(e.created_at, e.status) !== null;
        case "responded":
          return e.status === "responded";
        default:
          // Interest level filter
          return e.auctioneer_decision === activeFilter;
      }
    });
  }, [estimations, searchQuery, activeFilter]);

  // Counts for filters
  const counts = useMemo(() => {
    const byInterest: Record<string, number> = {};
    Object.keys(INTEREST_LEVELS).forEach((key) => {
      byInterest[key] = estimations.filter((e) => e.auctioneer_decision === key).length;
    });

    return {
      all: estimations.length,
      unread: estimations.filter((e) => e.status !== "responded").length,
      pending: estimations.filter((e) => e.status !== "responded").length,
      overdue: estimations.filter(
        (e) => e.status !== "responded" && getOverdueInfo(e.created_at, e.status) !== null
      ).length,
      responded: estimations.filter((e) => e.status === "responded").length,
      byInterest,
    };
  }, [estimations]);

  const isDetailView = selectedEstimation !== null;

  return (
    <>
      <Helmet>
        <title>Demandes d'estimation | Administration</title>
      </Helmet>
      <Header />

      <main className="min-h-screen bg-background pt-20">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : isDetailView ? (
          /* ════════════════════════════════════ */
          /* DETAIL VIEW                          */
          /* ════════════════════════════════════ */
          <div className="flex h-[calc(100vh-80px)]">
            {/* Left nav strip — ~1/6 */}
            <div className="w-20 md:w-24 flex-shrink-0 border-r overflow-hidden">
              <EstimationNavStrip
                estimations={filtered}
                selectedId={selectedEstimation.id}
                onSelect={(est) => setSelectedEstimation(est)}
                onBackToList={() => setSelectedEstimation(null)}
                activeFilter={activeFilter}
                onFilterChange={(f) => {
                  setActiveFilter(f);
                  setSelectedEstimation(null);
                }}
              />
            </div>

            {/* Right detail panel — ~5/6 */}
            <div className="flex-1 overflow-hidden">
              <EstimationDetail
                key={selectedEstimation.id}
                estimation={selectedEstimation}
                onBack={() => setSelectedEstimation(null)}
                onUpdate={handleUpdate}
              />
            </div>
          </div>
        ) : (
          /* ════════════════════════════════════ */
          /* LIST VIEW                            */
          /* ════════════════════════════════════ */
          <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-5">
            {/* Title */}
            <div className="flex items-center gap-3">
              <Inbox className="w-6 h-6 text-brand-gold" />
              <h1 className="font-serif text-2xl">Demandes d'estimation</h1>
              <span className="text-sm text-muted-foreground">({estimations.length})</span>
            </div>

            {/* Filters bar */}
            <EstimationFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={counts}
              onRefresh={fetchEstimations}
            />

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Aucune demande trouvée</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-4">
                {filtered.map((est) => (
                  <EstimationCard
                    key={est.id}
                    estimation={est}
                    onClick={() => setSelectedEstimation(est)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default AdminEstimations;
