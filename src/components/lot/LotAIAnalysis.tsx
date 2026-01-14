import { useState } from "react";
import { Sparkles, Eye, Loader2, ChevronDown, ChevronUp } from "lucide-react";
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
  enriched: {
    title: string;
    description: string;
    dimensions: string | null;
  };
  image_analysis: string | null;
  original: {
    title: string;
    description: string | null;
    dimensions: string | null;
  };
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
          enriched: data.enriched,
          image_analysis: data.image_analysis,
          original: data.original,
        });
        toast({
          title: "Analyse terminée",
          description: "L'IA a analysé le lot et les photos",
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
          {/* Image Analysis */}
          {result.image_analysis && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                <Eye className="w-3 h-3" />
                Ce que l'IA voit sur la photo
              </div>
              <p className="text-foreground leading-relaxed italic bg-background/50 p-3 rounded border border-border/30">
                "{result.image_analysis}"
              </p>
            </div>
          )}

          {/* Suggested improvements */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Restructuration suggérée
            </div>
            
            {/* Title comparison */}
            <div className="grid gap-2">
              <div className="text-xs text-muted-foreground">Titre :</div>
              <div className="grid md:grid-cols-2 gap-2">
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs">
                  <span className="text-red-400 font-medium">Avant :</span>
                  <p className="mt-1 text-foreground/70 line-through">{result.original.title}</p>
                </div>
                <div className="p-2 bg-green-500/10 border border-green-500/20 rounded text-xs">
                  <span className="text-green-400 font-medium">Après :</span>
                  <p className="mt-1 text-foreground font-medium">{result.enriched.title}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <div className="text-xs text-muted-foreground">Description extraite :</div>
              <div className="p-2 bg-muted/30 border border-border/30 rounded text-xs">
                <p className="text-foreground">{result.enriched.description || "—"}</p>
              </div>
            </div>

            {/* Dimensions */}
            {result.enriched.dimensions && (
              <div className="grid gap-2">
                <div className="text-xs text-muted-foreground">Dimensions extraites :</div>
                <div className="p-2 bg-muted/30 border border-border/30 rounded text-xs">
                  <p className="text-foreground">{result.enriched.dimensions}</p>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <p className="text-[10px] text-muted-foreground italic">
            Mode aperçu — Les modifications n'ont pas été appliquées à la base de données.
          </p>
        </div>
      )}
    </div>
  );
};

export default LotAIAnalysis;
