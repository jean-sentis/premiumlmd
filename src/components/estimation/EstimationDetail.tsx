import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Mail, Phone, Tag, Euro, ExternalLink, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisPanel } from "./detail/AnalysisPanel";
import { ResponsePanel } from "./detail/ResponsePanel";
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
}

interface EstimationDetailProps {
  estimation: EstimationRequest;
  onBack: () => void;
  onUpdate: () => void;
}

function formatDescription(desc: string) {
  const parts = desc.split("---");
  return parts[0]?.trim() || desc;
}

export function EstimationDetail({
  estimation,
  onBack,
  onUpdate,
}: EstimationDetailProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState(estimation.auctioneer_notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [freshData, setFreshData] = useState<EstimationRequest | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);

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
        console.warn("[EstimationDetail] Re-fetch failed, using prop data. Retry:", retryCount);
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

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from("estimation_requests")
        .update({
          auctioneer_notes: notes || null,
        } as any)
        .eq("id", estimation.id);
      if (error) throw error;
      toast({ title: "Notes enregistrées ✓" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSavingNotes(false);
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
        </div>
        {/* Quick status actions */}
        <EstimationStatusBar estimation={current} onUpdate={onUpdate} />
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* ══════════════════════════════════════ */}
        {/* SECTION 1 — Informations du vendeur   */}
        {/* ══════════════════════════════════════ */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Informations du vendeur
          </h3>

          {/* Contact details */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {current.nom}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {current.email}
            </span>
            {current.telephone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {current.telephone}
              </span>
            )}
            {current.object_category && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {current.object_category}
              </span>
            )}
            {current.estimated_value && (
              <span className="flex items-center gap-1">
                <Euro className="w-3 h-3" />
                {current.estimated_value}
              </span>
            )}
          </div>

          {/* Photos — FULL, never cropped */}
          {current.photo_urls?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {current.photo_urls.map((url, i) => (
                <a
                  key={i}
                  href={getPhotoUrl(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg overflow-hidden border hover:opacity-90 transition-opacity bg-muted/20"
                >
                  <img
                    src={getPhotoUrl(url)}
                    alt={`Photo ${i + 1}`}
                    className="w-full object-contain max-h-64"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Description + lien lot */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Description
              </p>
              <p className="text-sm bg-muted/30 p-3 rounded-lg border border-border/30">
                {formatDescription(current.description)}
              </p>
            </div>
            {current.related_lot_id && (
              <a
                href={`/lot/${current.related_lot_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Voir le lot référencé
              </a>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t" />

        {/* ══════════════════════════════════════ */}
        {/* SECTION 2 — Notes privées du CP       */}
        {/* Le CP se fait son avis AVANT l'IA     */}
        {/* ══════════════════════════════════════ */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Votre avis
          </h3>
          <Textarea
            placeholder="Vos observations, estimation, remarques (non visibles par le vendeur)…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="text-sm"
          />
          {notes !== (estimation.auctioneer_notes || "") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="text-xs"
            >
              Enregistrer
            </Button>
          )}
        </div>

        {/* Separator */}
        <div className="border-t" />

        {/* ══════════════════════════════════════ */}
        {/* SECTION 3 — Réponse au vendeur        */}
        {/* ══════════════════════════════════════ */}
        <ResponsePanel estimation={current} onUpdate={onUpdate} />

        {/* Separator */}
        <div className="border-t" />

        {/* ══════════════════════════════════════ */}
        {/* SECTION 4 — Aide à la décision (IA)   */}
        {/* Optionnel, réduit par défaut           */}
        {/* ══════════════════════════════════════ */}
        <div className="space-y-2">
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
            <div className="animate-in slide-in-from-top-2 duration-200">
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
  );
}
