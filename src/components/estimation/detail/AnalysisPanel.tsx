import { useState } from "react";
import {
  RefreshCw,
  Loader2,
  ChevronRight,
  Shield,
  Wrench,
  TrendingUp,
  ExternalLink,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getInterestStyle, CONFIDENCE_CONFIG } from "./interest-config";

interface AnalysisPanelProps {
  ai: any;
  reanalyzing: boolean;
  onReanalyze: () => void;
}

export function AnalysisPanel({ ai, reanalyzing, onReanalyze }: AnalysisPanelProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);

  if (!ai) {
    return (
      <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
        Analyse en cours…
      </div>
    );
  }

  const interestStyle = getInterestStyle(ai.recommendation);
  const confidenceConfig = ai.confidence_level
    ? CONFIDENCE_CONFIG[ai.confidence_level as keyof typeof CONFIDENCE_CONFIG]
    : null;

  const sourceCount =
    (ai.web_sources?.length || 0) +
    (ai.vision_detection?.matchingPages?.length || 0);

  return (
    <div className="space-y-4">
      {/* ── Interest level + Reliability + Re-analyze ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {interestStyle && (
            <Badge
              className={`${interestStyle.bg} ${interestStyle.text} ${interestStyle.border} border text-sm px-3 py-1`}
            >
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${interestStyle.dot} mr-2`}
              />
              {interestStyle.label}
            </Badge>
          )}
          {confidenceConfig && (
            <span
              className={`text-xs px-2 py-1 rounded-full border ${confidenceConfig.color}`}
            >
              {confidenceConfig.label}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReanalyze}
          disabled={reanalyzing}
          className="h-7 text-xs text-muted-foreground"
        >
          {reanalyzing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1" />
          )}
          Ré-analyser
        </Button>
      </div>

      {/* ── Synthèse unifiée (3-5 lignes, une seule typo) ── */}
      <div className="p-4 bg-muted/30 rounded-lg border border-border/30 space-y-2">
        {ai.identified_object && (
          <p className="text-sm font-medium">{ai.identified_object}</p>
        )}
        {ai.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {ai.summary}
          </p>
        )}
        {ai.estimated_range && (
          <p className="text-sm">
            <span className="text-muted-foreground">Estimation :</span>{" "}
            <span className="font-semibold">{ai.estimated_range}</span>
          </p>
        )}
      </div>

      {/* ── Boutons collapsibles ── */}
      <div className="space-y-2">
        {ai.authenticity_assessment && (
          <CollapsibleCriterion
            open={authOpen}
            onOpenChange={setAuthOpen}
            icon={<Shield className="w-4 h-4" />}
            title="Authenticité"
            content={ai.authenticity_assessment}
          />
        )}

        {ai.condition_notes && (
          <CollapsibleCriterion
            open={conditionOpen}
            onOpenChange={setConditionOpen}
            icon={<Wrench className="w-4 h-4" />}
            title="État"
            content={ai.condition_notes}
          />
        )}

        {(ai.market_insights || sourceCount > 0) && (
          <MarketSection
            open={marketOpen}
            onOpenChange={setMarketOpen}
            ai={ai}
            sourceCount={sourceCount}
          />
        )}
      </div>

      {/* Limitations - discret */}
      {ai.limitations && (
        <p className="text-xs text-muted-foreground italic">
          {ai.limitations}
        </p>
      )}
    </div>
  );
}

/* ── Critère collapsible générique ── */
function CollapsibleCriterion({
  open,
  onOpenChange,
  icon,
  title,
  content,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors text-left">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-medium flex-1">{title}</span>
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pl-6">
        <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Section Contexte marché ── */
function MarketSection({
  open,
  onOpenChange,
  ai,
  sourceCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ai: any;
  sourceCount: number;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors text-left">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium flex-1">Contexte marché</span>
          {sourceCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {sourceCount} source{sourceCount > 1 ? "s" : ""}
            </span>
          )}
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pl-6 space-y-3">
        {ai.market_insights && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {ai.market_insights}
          </p>
        )}

        {/* Résultats de ventes référencés */}
        {ai.web_sources?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Résultats de ventes référencés
            </p>
            {ai.web_sources.map(
              (
                src: { title: string; url: string; relevance: string },
                i: number
              ) => (
                <div key={i} className="flex items-start gap-2">
                  <ExternalLink className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary hover:underline truncate block"
                    >
                      {src.title || safeHostname(src.url)}
                    </a>
                    {src.relevance && (
                      <p className="text-xs text-muted-foreground">
                        {src.relevance}
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Objets similaires trouvés visuellement */}
        {ai.vision_detection?.visuallySimilarImages?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
              <Image className="w-3 h-3" />
              Objets similaires identifiés
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {ai.vision_detection.visuallySimilarImages.map(
                (imgUrl: string, i: number) => (
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
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </a>
                )
              )}
            </div>
          </div>
        )}

        {/* Pages correspondantes */}
        {ai.vision_detection?.matchingPages?.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Pages correspondantes
            </p>
            {ai.vision_detection.matchingPages.map(
              (page: { url: string; title: string }, i: number) => (
                <a
                  key={i}
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  {page.title || safeHostname(page.url)}
                </a>
              )
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
