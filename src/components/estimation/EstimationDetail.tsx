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
      {/* ── Header with status bar ── */}
      <div className="p-3 border-b sticky top-0 bg-background z-10 space-y-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">{current.nom}</h2>
            <p className="text-xs text-muted-foreground">
              {format(new Date(current.created_at), "dd MMMM yyyy à HH:mm", {
                locale: fr,
              })}
            </p>
          </div>
          {/* AI anchor icon — framed, at right */}
          <button
            onClick={scrollToAi}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-primary/30 text-primary hover:bg-primary/5 transition-colors text-xs font-medium"
            title="Aide à la décision IA"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">IA</span>
          </button>
        </div>
        <EstimationStatusBar estimation={current} onUpdate={onUpdate} />
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 3-COLUMN: Client | Avis (tabs + intérêt) | Répondre */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Seller info */}
            <div className="lg:border-r lg:pr-6">
              <SellerInfoPanel estimation={current} getPhotoUrl={getPhotoUrl} />
            </div>

            {/* Column 2: Interest dropdown + Tabbed opinions */}
            <div className="lg:border-r lg:pr-6 space-y-3">
              {/* Interest selector — inline above tabs */}
              <InterestDropdown
                value={current.auctioneer_decision}
                onChange={handleInterestChange}
              />

              {/* Tab bar */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("first")}
                  className={`flex-1 text-xs font-medium uppercase tracking-wider py-2 border-b-2 transition-colors ${
                    activeTab === "first"
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  1er Avis
                </button>
                <button
                  onClick={() => setActiveTab("second")}
                  className={`flex-1 text-xs font-medium uppercase tracking-wider py-2 border-b-2 transition-colors ${
                    activeTab === "second"
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  2ème Avis
                </button>
              </div>

              {/* Tab content */}
              <div className="flex-1">
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

            {/* Column 3: Response panel */}
            <div>
              <ResponsePanel estimation={current} onUpdate={onUpdate} />
            </div>
          </div>

          {/* ══════════════════════════════════════ */}
          {/* FULL-WIDTH: AI analysis (expandable)  */}
          {/* ══════════════════════════════════════ */}
          <div ref={aiSectionRef} className="mt-6 border-t pt-4">
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
