import { useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EstimationInbox } from "@/components/estimation/EstimationInbox";
import { EstimationDetail } from "@/components/estimation/EstimationDetail";
import { Helmet } from "react-helmet-async";
import { Inbox, LayoutList } from "lucide-react";

interface EstimationRequest {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  description: string;
  estimated_value: string | null;
  object_category: string | null;
  photo_urls: string[];
  source: string;
  ai_analysis: any;
  ai_analyzed_at: string | null;
  status: string;
  auctioneer_notes: string | null;
  auctioneer_decision: string | null;
  decided_at: string | null;
  response_template: string | null;
  response_message: string | null;
  responded_at: string | null;
  created_at: string;
  related_lot_id: string | null;
}

const AdminEstimations = () => {
  const [selectedEstimation, setSelectedEstimation] = useState<EstimationRequest | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdate = useCallback(() => {
    setRefreshKey((k) => k + 1);
    // Refresh the selected estimation too
    if (selectedEstimation) {
      // Re-fetch will happen via the inbox
    }
  }, [selectedEstimation]);

  return (
    <>
      <Helmet>
        <title>Demandes d'estimation | Administration</title>
      </Helmet>
      <Header />

      <main className="min-h-screen bg-background pt-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <Inbox className="w-6 h-6 text-brand-gold" />
            <h1 className="font-serif text-2xl">Demandes d'estimation</h1>
          </div>

          {/* Mail-like layout */}
          <div className="border rounded-xl overflow-hidden bg-background shadow-sm" style={{ height: "calc(100vh - 200px)" }}>
            <div className="flex h-full">
              {/* Inbox list */}
              <div
                className={`border-r w-full md:w-[380px] flex-shrink-0 ${
                  selectedEstimation ? "hidden md:flex md:flex-col" : "flex flex-col"
                }`}
              >
                <EstimationInbox
                  key={refreshKey}
                  onSelectEstimation={(est) => setSelectedEstimation(est)}
                  selectedId={selectedEstimation?.id}
                />
              </div>

              {/* Detail panel */}
              <div className={`flex-1 ${selectedEstimation ? "flex flex-col" : "hidden md:flex md:flex-col"}`}>
                {selectedEstimation ? (
                  <EstimationDetail
                    key={selectedEstimation.id + "-" + refreshKey}
                    estimation={selectedEstimation}
                    onBack={() => setSelectedEstimation(null)}
                    onUpdate={handleUpdate}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <LayoutList className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">Sélectionnez une demande</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default AdminEstimations;
