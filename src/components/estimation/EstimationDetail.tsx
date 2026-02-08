import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisPanel } from "./detail/AnalysisPanel";
import { ResponsePanel } from "./detail/ResponsePanel";
import { SellerInfoPanel } from "./detail/SellerInfoPanel";
import { NotesPanel } from "./detail/NotesPanel";
import { SecondOpinionPanel } from "./detail/SecondOpinionPanel";
import { InterestDropdown } from "./detail/InterestDropdown";
import { EstimationStatusBar } from "./EstimationStatusBar";

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
  second_opinion?: string | null;
}

interface EstimationDetailProps {
  estimation: EstimationRequest;
  onBack: () => void;
  onUpdate: () => void;
}

export function EstimationDetail({
  estimation,
  onBack,
  onUpdate,
}: EstimationDetailProps) {
  const { toast } = useToast();
  const [reanalyzing, setReanalyzing] = useState(false);
  const [freshData, setFreshData] = useState<EstimationRequest | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState<"first" | "second">("first");
  const aiSectionRef = useRef<HTMLDivElement>(null);

  // Re-fetch fresh data on mount, and poll every 5s while analysis is pending
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let retryCount = 0;
    const MAX_RETRIES = 60;

    const fetchFresh = async () => {
      const { data, error } = await supabase
        .from("estimation_requests")
        .select("*")
        .eq("id", estimation.id)
        .maybeSingle();
      if (cancelled) return;

      if (error || !data) {
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          const delay = Math.min(5000 * Math.pow(1.2, Math.min(retryCount, 10)), 15000);
          timer = setTimeout(fetchFresh, delay);
        }
        return;
      }

      retryCount = 0;
      setFreshData(data as any);
      if (!data.ai_analysis) {
        timer = setTimeout(fetchFresh, 5000);
      }
    };
    fetchFresh();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [estimation.id]);

  const current = freshData || estimation;
  const ai = current.ai_analysis;

  const getPhotoUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-estimation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ estimation_id: estimation.id }),
        }
      );
      if (!resp.ok) throw new Error("Erreur d'analyse");
      toast({
        title: "Ré-analyse lancée",
        description: "Rafraîchissez dans quelques secondes",
      });
      setTimeout(onUpdate, 3000);
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setReanalyzing(false);
    }
  };

  const handleSaveAnalysis = async (updatedAi: any, decision?: string) => {
    try {
      const updateData: any = { ai_analysis: updatedAi };
      if (decision) {
        updateData.auctioneer_decision = decision;
      }
      const { error } = await supabase
        .from("estimation_requests")
        .update(updateData)
        .eq("id", estimation.id);
      if (error) throw error;
      toast({ title: "Analyse mise à jour ✓" });
      onUpdate();
    } catch {
      toast({ title: "Erreur de sauvegarde", variant: "destructive" });
    }
  };

  const handleInterestChange = async (level: string) => {
    try {
      const { error } = await supabase
        .from("estimation_requests")
        .update({
          auctioneer_decision: level,
          decided_at: new Date().toISOString(),
        } as any)
        .eq("id", estimation.id);
      if (error) throw error;
      toast({ title: "Intérêt mis à jour ✓" });
      onUpdate();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const scrollToAi = () => {
    setShowAiAnalysis(true);
    setTimeout(() => {
      aiSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header: single line with all meta ── */}
      <div className="px-3 py-2 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-7 w-7 md:hidden shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Seller name + date */}
          <h2 className="font-semibold text-sm truncate">{current.nom}</h2>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {format(new Date(current.created_at), "dd MMM yyyy · HH:mm", {
              locale: fr,
            })}
          </span>

          {/* Status buttons inline */}
          <EstimationStatusBar estimation={current} onUpdate={onUpdate} />

          <div className="flex-1" />

          {/* Interest dropdown */}
          <InterestDropdown
            value={current.auctioneer_decision}
            onChange={handleInterestChange}
          />

          {/* AI anchor icon — framed, at far right */}
          <button
            onClick={scrollToAi}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-primary/30 text-primary hover:bg-primary/5 transition-colors text-xs font-medium shrink-0"
            title="Aide à la décision IA"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">IA</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 3-COLUMN: Client | Avis (tabs + intérêt) | Répondre */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: "calc(60vh + 50px)" }}>
            {/* Column 1: Seller info (no redundant header) */}
            <div className="lg:border-r lg:pr-6">
              <SellerInfoPanel estimation={current} getPhotoUrl={getPhotoUrl} />
            </div>

            {/* Column 2: Browser-style tabbed opinions */}
            <div className="lg:border-r lg:pr-6 flex flex-col">
              {/* Browser-style tab bar */}
              <div className="flex items-end justify-between -mb-px">
                <button
                  onClick={() => setActiveTab("first")}
                  className={`px-5 py-2 text-xs font-semibold rounded-tl-xl border transition-colors ${
                    activeTab === "first"
                      ? "bg-background text-foreground border-border border-b-background"
                      : "bg-muted/40 text-muted-foreground/60 border-transparent hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  1er Avis
                </button>
                <button
                  onClick={() => setActiveTab("second")}
                  className={`px-5 py-2 text-xs font-semibold rounded-tr-xl border transition-colors ${
                    activeTab === "second"
                      ? "bg-background text-foreground border-border border-b-background"
                      : "bg-muted/40 text-muted-foreground/60 border-transparent hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  2ème Avis
                </button>
              </div>

              {/* Tab content area */}
              <div className="flex-1 border rounded-b-xl p-3 bg-background">
                {activeTab === "first" ? (
                  <NotesPanel
                    estimationId={estimation.id}
                    initialNotes={estimation.auctioneer_notes || ""}
                  />
                ) : (
                  <SecondOpinionPanel
                    estimationId={estimation.id}
                    initialOpinion={(current as any).second_opinion || ""}
                  />
                )}
              </div>
            </div>

            {/* Column 3: Actions panel */}
            <div>
              <ResponsePanel estimation={current} onUpdate={onUpdate} />
            </div>
          </div>

          {/* ══════════════════════════════════════ */}
          {/* FULL-WIDTH: AI analysis (expandable)  */}
          {/* ══════════════════════════════════════ */}
          <div ref={aiSectionRef} className="mt-6 border-t pt-4 max-w-none">
            <button
              onClick={() => setShowAiAnalysis(!showAiAnalysis)}
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group w-full"
            >
              <Sparkles className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
              <span>Aide à la décision</span>
              {ai && (
                <span className="text-[10px] font-normal normal-case opacity-50">
                  — analyse disponible
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 ml-auto transition-transform ${showAiAnalysis ? "rotate-180" : ""}`}
              />
            </button>

            {showAiAnalysis && (
              <div className="animate-in slide-in-from-top-2 duration-200 mt-3">
                <AnalysisPanel
                  ai={ai}
                  reanalyzing={reanalyzing}
                  onReanalyze={handleReanalyze}
                  estimationId={estimation.id}
                  onSaveAnalysis={handleSaveAnalysis}
                  photoUrls={current.photo_urls?.map(getPhotoUrl) || []}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
