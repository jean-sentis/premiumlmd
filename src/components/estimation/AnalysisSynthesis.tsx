import { useState } from "react";
import {
  RefreshCw,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image,
  FileText,
  MessageSquareQuote,
  Search,
  Shield,
  Wrench,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/** Parse markdown links [text](url) into React elements */
function renderMarkdownLinks(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (match) {
      return (
        <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {match[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

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
    (ai?.lens_detection?.visualMatches?.length || 0);

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
              <p>{renderMarkdownLinks(ai.identified_object)}</p>
            </div>
          )}

          {/* Résumé */}
          {ai.summary && (
            <p className="text-muted-foreground leading-relaxed">{renderMarkdownLinks(ai.summary)}</p>
          )}

          {/* ── Détails (repliables) ── */}
          {(ai.authenticity_assessment || ai.condition_notes || ai.market_insights || ai.questions_for_owner?.length > 0) && (
            <DetailSection ai={ai} />
          )}

          {/* Limitations - discret */}
          {ai.limitations && (
            <p className="text-[11px] text-muted-foreground italic">{ai.limitations}</p>
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

                {/* Google Lens visual matches */}
                {ai.lens_detection?.visualMatches?.length > 0 && (
                  <div className="p-3 bg-muted/30 rounded border border-border/30">
                    <p className="font-medium text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      Correspondances visuelles ({ai.lens_detection.visualMatches.length})
                    </p>
                    <div className="space-y-1.5">
                      {ai.lens_detection.visualMatches.map((match: { title: string; link: string; source: string; thumbnail?: string; price?: string }, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          {match.thumbnail && (
                            <a href={match.link} target="_blank" rel="noopener noreferrer" className="shrink-0">
                              <img
                                src={match.thumbnail}
                                alt={match.title}
                                className="w-10 h-10 object-cover rounded border"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </a>
                          )}
                          <div className="min-w-0 flex-1">
                            <a
                              href={match.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-primary hover:underline line-clamp-1"
                            >
                              {match.title}
                            </a>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{match.source}</span>
                              {match.price && <span className="font-medium text-foreground">{match.price}</span>}
                            </div>
                          </div>
                        </div>
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

/* ── Section détails repliable ── */
function DetailSection({ ai }: { ai: any }) {
  const [open, setOpen] = useState(false);

  const items: Array<{ icon: React.ReactNode; title: string; content: string }> = [];
  if (ai.authenticity_assessment) items.push({ icon: <Shield className="w-3.5 h-3.5" />, title: "Authenticité", content: ai.authenticity_assessment });
  if (ai.condition_notes) items.push({ icon: <Wrench className="w-3.5 h-3.5" />, title: "État", content: ai.condition_notes });
  if (ai.market_insights) items.push({ icon: <TrendingUp className="w-3.5 h-3.5" />, title: "Contexte marché", content: ai.market_insights });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} />
          Voir le détail de l'analyse
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-muted/30 rounded border border-border/30">
            <p className="font-medium text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
              {item.icon}
              {item.title}
            </p>
            <p className="text-xs">{renderMarkdownLinks(item.content)}</p>
          </div>
        ))}
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
      </CollapsibleContent>
    </Collapsible>
  );
}