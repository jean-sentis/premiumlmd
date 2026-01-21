import { useEffect, useState } from "react";
import { Sparkles, Eye, Loader2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface LotAIAnalysisProps {
  lotId: string;
  lotNumber: number;
  currentTitle: string;
  currentDescription: string | null;
  currentDimensions: string | null;
}

interface AnalysisResult {
  analysis: {
    explanation: string;
    creator_info: string | null;
  };
  image_analysis: string | null;
  original: {
    title: string;
    description: string | null;
    dimensions: string | null;
  };
  lot_id: string;
  lot_number: number;
}

const LotAIAnalysis = ({
  lotId,
  lotNumber,
  currentTitle,
  currentDescription,
  currentDimensions,
}: LotAIAnalysisProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Important: si on change de lot, on doit réinitialiser l'état, sinon on affiche
  // l'analyse du lot précédent (source du "l'IA voit un autre lot").
  useEffect(() => {
    setResult(null);
    setExpanded(true);
    setLoading(false);
  }, [lotId]);

  const analyzeWithAI = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-lot-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            lot_id: lotId,
            dry_run: true,
            analyze_images: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'analyse");
      }

      const data = await response.json();
      
      if (data.success) {
        setResult({
          analysis: data.analysis,
          image_analysis: data.image_analysis,
          original: data.original,
          lot_id: data.lot_id,
          lot_number: data.lot_number,
        });
        toast({
          title: "Analyse terminée",
          description: "L'IA a analysé le lot (et la photo si accessible)",
        });
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'analyse",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-brand-gold/30 rounded-lg bg-brand-gold/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-gold/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-gold" />
          <span className="text-sm font-medium text-brand-gold">Analyse IA</span>
        </div>
        
        {!result ? (
          <Button
            size="sm"
            variant="outline"
            onClick={analyzeWithAI}
            disabled={loading}
            className="border-brand-gold/50 text-brand-gold hover:bg-brand-gold/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Analyse...
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 mr-1.5" />
                Analyser ce lot
              </>
            )}
          </Button>
        ) : (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Results */}
      {result && expanded && (
        <div className="p-4 space-y-4 text-sm">
          {/* Safety: afficher le contexte pour éviter toute confusion */}
          <div className="flex items-start gap-2 rounded border border-border/40 bg-background/50 p-3">
            <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="leading-snug">
              <div className="text-xs text-muted-foreground">Analyse calculée pour :</div>
              <div className="text-sm font-medium text-foreground">
                Lot {result.lot_number} — {result.original.title}
              </div>
            </div>
          </div>

          {/* Image Analysis */}
          {result.image_analysis && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                <Eye className="w-3 h-3" />
                Ce que l'IA voit sur la photo
              </div>
              <p className="text-foreground leading-relaxed italic bg-background/50 p-3 rounded border border-border/30">
                {result.image_analysis.startsWith("⚠️")
                  ? result.image_analysis
                  : `"${result.image_analysis}"`}
              </p>
            </div>
          )}

          {/* Analysis */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Analyse du lot
            </div>

            <div className="grid gap-2">
              <div className="text-xs text-muted-foreground">Explication :</div>
              <div className="p-3 bg-muted/20 border border-border/30 rounded text-xs leading-relaxed">
                <p className="text-foreground">{result.analysis.explanation || "—"}</p>
              </div>
            </div>

            {result.analysis.creator_info && (
              <div className="grid gap-2">
                <div className="text-xs text-muted-foreground">À propos du créateur :</div>
                <div className="p-3 bg-muted/20 border border-border/30 rounded text-xs leading-relaxed">
                  <p className="text-foreground">{result.analysis.creator_info}</p>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <p className="text-[10px] text-muted-foreground italic">
            Mode aperçu — aucune modification n'a été appliquée à la base de données.
          </p>
        </div>
      )}
    </div>
  );
};

export default LotAIAnalysis;
