import { useState } from "react";
import {
  RefreshCw,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Image,
  FileText,
  MessageSquareQuote,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const RECOMMENDATION_COLORS: Record<string, string> = {
  "très_intéressant": "bg-green-100 text-green-800 border-green-300",
  "intéressant": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "à_examiner": "bg-amber-100 text-amber-800 border-amber-300",
  "peu_intéressant": "bg-orange-100 text-orange-800 border-orange-300",
  "hors_spécialité": "bg-gray-100 text-gray-800 border-gray-300",
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  "très_intéressant": "Très intéressant",
  "intéressant": "Intéressant",
  "à_examiner": "À examiner",
  "peu_intéressant": "Peu intéressant",
  "hors_spécialité": "Hors spécialité",
};

const CONFIDENCE_STYLES: Record<string, string> = {
  "élevée": "text-green-700 bg-green-50",
  "moyenne": "text-amber-700 bg-amber-50",
  "faible": "text-red-700 bg-red-50",
};

interface AnalysisSynthesisProps {
  ai: any;
  reanalyzing: boolean;
  onReanalyze: () => void;
}

export function AnalysisSynthesis({ ai, reanalyzing, onReanalyze }: AnalysisSynthesisProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  // Count available sources for the badge
  const sourceCount =
    (ai?.web_sources?.length || 0) +
    (ai?.vision_detection?.matchingPages?.length || 0);

  return (
    <div className="space-y-3 border border-border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Avis préliminaire</h3>
          {ai?.confidence_level && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CONFIDENCE_STYLES[ai.confidence_level] || "text-muted-foreground bg-muted"}`}>
              Fiabilité {ai.confidence_level}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReanalyze}
          disabled={reanalyzing}
          className="h-7 text-xs"
        >
          {reanalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          Ré-analyser
        </Button>
      </div>

      {!ai ? (
        <div className="text-sm text-muted-foreground italic flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyse en cours...
        </div>
      ) : (
        <div className="space-y-3 text-sm">

          {/* ── NIVEAU 1 : Synthèse rapide ── */}

          {/* Verdict : recommandation + estimation côte à côte */}
          <div className="flex items-start gap-3 flex-wrap">
            {ai.recommendation && (
              <Badge className={`${RECOMMENDATION_COLORS[ai.recommendation] || "bg-muted"} border text-xs`}>
                {RECOMMENDATION_LABELS[ai.recommendation] || ai.recommendation}
              </Badge>
            )}
            {ai.estimated_range && (
              <span className="text-base font-semibold">{ai.estimated_range}</span>
            )}
          </div>

          {/* Identification */}
          {ai.identified_object && (
            <div className="p-3 bg-muted/30 rounded border border-border/30">
              <p className="font-medium text-xs text-muted-foreground mb-1">Identification</p>
              <p>{ai.identified_object}</p>
            </div>
          )}

          {/* Résumé */}
          {ai.summary && (
            <p className="text-muted-foreground leading-relaxed">{ai.summary}</p>
          )}

          {/* Authenticité + État en 2 colonnes */}
          {(ai.authenticity_assessment || ai.condition_notes) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ai.authenticity_assessment && (
                <div className="p-3 bg-muted/30 rounded border border-border/30">
                  <p className="font-medium text-xs text-muted-foreground mb-1">Authenticité</p>
                  <p className="text-xs">{ai.authenticity_assessment}</p>
                </div>
              )}
              {ai.condition_notes && (
                <div className="p-3 bg-muted/30 rounded border border-border/30">
                  <p className="font-medium text-xs text-muted-foreground mb-1">État</p>
                  <p className="text-xs">{ai.condition_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Contexte marché */}
          {ai.market_insights && (
            <div className="p-3 bg-muted/30 rounded border border-border/30">
              <p className="font-medium text-xs text-muted-foreground mb-1">Contexte marché</p>
              <p className="text-xs">{ai.market_insights}</p>
            </div>
          )}

          {/* Questions suggérées pour le propriétaire */}
          {ai.questions_for_owner?.length > 0 && (
            <div className="p-3 bg-muted/30 rounded border border-border/30">
              <p className="font-medium text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                <MessageSquareQuote className="w-3.5 h-3.5" />
                Questions à poser au propriétaire
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                {ai.questions_for_owner.map((q: string, i: number) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Limitations */}
          {ai.limitations && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p>{ai.limitations}</p>
            </div>
          )}

          {/* ── NIVEAU 2 : Sources & références (collapsible) ── */}
          {sourceCount > 0 && (
            <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                >
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3 h-3" />
                    Voir les références & sources ({sourceCount})
                  </span>
                  {sourcesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                
                {/* Recommendation text (detailed) */}
                {ai.recommendation_text && ai.recommendation_text !== (RECOMMENDATION_LABELS[ai.recommendation] || ai.recommendation) && (
                  <p className="text-xs italic text-muted-foreground px-2">{ai.recommendation_text}</p>
                )}

                {/* Sources web */}
                {ai.web_sources?.length > 0 && (
                  <div className="p-3 bg-muted/30 rounded border border-border/30">
                    <p className="font-medium text-xs text-muted-foreground mb-2">Références marché</p>
                    <div className="space-y-1.5">
                      {ai.web_sources.map((src: { title: string; url: string; relevance: string }, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <ExternalLink className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-primary hover:underline truncate block"
                            >
                              {src.title || new URL(src.url).hostname}
                            </a>
                            {src.relevance && (
                              <p className="text-xs text-muted-foreground">{src.relevance}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching pages from vision (shown as "Pages correspondantes") */}
                {ai.vision_detection?.matchingPages?.length > 0 && (
                  <div className="p-3 bg-muted/30 rounded border border-border/30">
                    <p className="font-medium text-xs text-muted-foreground mb-2">Correspondances visuelles en ligne</p>
                    <div className="space-y-1">
                      {ai.vision_detection.matchingPages.map((page: { url: string; title: string }, i: number) => (
                        <a
                          key={i}
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {page.title || new URL(page.url).hostname}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visually similar images */}
                {ai.vision_detection?.visuallySimilarImages?.length > 0 && (
                  <div className="p-3 bg-muted/30 rounded border border-border/30">
                    <p className="font-medium text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      Objets similaires trouvés
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ai.vision_detection.visuallySimilarImages.map((imgUrl: string, i: number) => (
                        <a
                          key={i}
                          href={imgUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square rounded overflow-hidden border hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={imgUrl}
                            alt={`Similaire ${i + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  );
}