import { useState } from "react";
import {
  RefreshCw,
  Loader2,
  ChevronDown,
  Fingerprint,
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

/* ── Fiabilité 1→5 mapping ── */
const CONFIDENCE_SCORE: Record<string, number> = {
  "élevée": 5,
  "moyenne": 3,
  "faible": 1,
};

interface AnalysisPanelProps {
  ai: any;
  reanalyzing: boolean;
  onReanalyze: () => void;
}

export function AnalysisPanel({ ai, reanalyzing, onReanalyze }: AnalysisPanelProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (!ai) {
    return (
      <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
        Analyse en cours…
      </div>
    );
  }

  const interestStyle = getInterestStyle(ai.recommendation);
  const confidenceScore = ai.confidence_level
    ? CONFIDENCE_SCORE[ai.confidence_level as keyof typeof CONFIDENCE_SCORE] || 3
    : null;
  const confidenceConfig = ai.confidence_level
    ? CONFIDENCE_CONFIG[ai.confidence_level as keyof typeof CONFIDENCE_CONFIG]
    : null;

  const sourceCount =
    (ai.web_sources?.length || 0) +
    (ai.vision_detection?.matchingPages?.length || 0);

  const toggleSection = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  return (
    <div className="space-y-4">
      {/* ── Badges recommandation + fiabilité (même taille) + Re-analyze ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {interestStyle && (
            <Badge
              className={`${interestStyle.bg} ${interestStyle.text} ${interestStyle.border} border text-xs px-3 py-1`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${interestStyle.dot} mr-1.5`}
              />
              {interestStyle.label}
            </Badge>
          )}
          {confidenceScore !== null && confidenceConfig && (
            <Badge
              variant="outline"
              className={`text-xs px-3 py-1 ${confidenceConfig.color}`}
            >
              Fiabilité {confidenceScore}/5
            </Badge>
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

      {/* ── Synthèse ── */}
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

      {/* ── 3 boutons sur une ligne : Identité / État / Marché ── */}
      {(ai.authenticity_assessment || ai.condition_notes || ai.market_insights) && (
        <div className="space-y-0">
          <div className="grid grid-cols-3 gap-1.5">
            {ai.authenticity_assessment && (
              <DetailButton
                icon={<Fingerprint className="w-3.5 h-3.5" />}
                label="Identité"
                isOpen={openSection === "auth"}
                onClick={() => toggleSection("auth")}
              />
            )}
            {ai.condition_notes && (
              <DetailButton
                icon={<Wrench className="w-3.5 h-3.5" />}
                label="État"
                isOpen={openSection === "condition"}
                onClick={() => toggleSection("condition")}
              />
            )}
            {(ai.market_insights || sourceCount > 0) && (
              <DetailButton
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                label="Marché"
                count={sourceCount > 0 ? sourceCount : undefined}
                isOpen={openSection === "market"}
                onClick={() => toggleSection("market")}
              />
            )}
          </div>

          {/* Contenu dépliable sous les boutons */}
          {openSection === "auth" && ai.authenticity_assessment && (
            <DetailContent content={ai.authenticity_assessment} />
          )}
          {openSection === "condition" && ai.condition_notes && (
            <DetailContent content={ai.condition_notes} />
          )}
          {openSection === "market" && (
            <MarketContent ai={ai} />
          )}
        </div>
      )}

      {/* Limitations - discret */}
      {ai.limitations && (
        <p className="text-xs text-muted-foreground italic">
          {ai.limitations}
        </p>
      )}
    </div>
  );
}

/* ── Bouton de détail ── */
function DetailButton({
  icon,
  label,
  count,
  isOpen,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
        isOpen
          ? "bg-muted border-border text-foreground"
          : "border-border/50 text-muted-foreground hover:bg-muted/30"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0 font-semibold">
          {count}
        </span>
      )}
      <ChevronDown
        className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  );
}

/* ── Contenu texte dépliable ── */
function DetailContent({ content }: { content: string }) {
  return (
    <div className="mt-1.5 p-3 bg-muted/30 rounded-lg border border-border/30 animate-in slide-in-from-top-1 duration-200">
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
    </div>
  );
}

/* ── Section Marché avec sources ── */
function MarketContent({ ai }: { ai: any }) {
  const sourceCount =
    (ai.web_sources?.length || 0) +
    (ai.vision_detection?.matchingPages?.length || 0);

  return (
    <div className="mt-1.5 p-3 bg-muted/30 rounded-lg border border-border/30 space-y-3 animate-in slide-in-from-top-1 duration-200">
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
            (src: { title: string; url: string; relevance: string }, i: number) => (
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
                    <p className="text-xs text-muted-foreground">{src.relevance}</p>
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
    </div>
  );
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
