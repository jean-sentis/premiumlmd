import { useState, useCallback, useEffect, useRef } from "react";
import {
  RefreshCw,
  Loader2,
  ChevronDown,
  Fingerprint,
  Wrench,
  TrendingUp,
  ExternalLink,
  Image,
  Save,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { getInterestStyle, INTEREST_LEVELS, type InterestLevel } from "./interest-config";

/** Parse markdown links [text](url) into clickable React elements */
function renderMarkdownLinks(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (match) {
      return (
        <a
          key={i}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {match[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}



/* ── Fiabilité options ── */
const FIABILITE_OPTIONS = [
  { value: 0, label: "0 — Faux" },
  { value: 1, label: "1 — Très incertain" },
  { value: 2, label: "2 — Hypothèse fragile" },
  { value: 3, label: "3 — Probable" },
  { value: 4, label: "4 — Forte convergence" },
  { value: 5, label: "5 — Confirmé" },
] as const;

const FIABILITE_STYLES: Record<number, string> = {
  5: "text-green-700 bg-green-50 border-green-200",
  4: "text-green-700 bg-green-50 border-green-200",
  3: "text-amber-700 bg-amber-50 border-amber-200",
  2: "text-orange-700 bg-orange-50 border-orange-200",
  1: "text-red-700 bg-red-50 border-red-200",
  0: "text-red-700 bg-red-50 border-red-300",
};

const CONFIDENCE_TO_SCORE: Record<string, number> = {
  "élevée": 5,
  "moyenne": 3,
  "faible": 1,
};

/** Map new confidence_score (1-4) from AI, or fallback to legacy confidence_level string */
function getInitialFiabilite(ai: any): number {
  if (typeof ai?.confidence_score === "number") return ai.confidence_score;
  if (ai?.confidence_level) return CONFIDENCE_TO_SCORE[ai.confidence_level] ?? 3;
  return 3;
}

interface AnalysisPanelProps {
  ai: any;
  reanalyzing: boolean;
  onReanalyze: () => void;
  estimationId: string;
  onSaveAnalysis: (updatedAi: any, decision?: string) => Promise<void>;
}

export function AnalysisPanel({
  ai,
  reanalyzing,
  onReanalyze,
  estimationId,
  onSaveAnalysis,
}: AnalysisPanelProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable state — initialized from AI data
  const initialScore = getInitialFiabilite(ai);

  const [recommendation, setRecommendation] = useState<string>(ai?.recommendation || "");
  const [fiabilite, setFiabilite] = useState<number>(initialScore);
  const [identifiedObject, setIdentifiedObject] = useState<string>(ai?.identified_object || "");
  const [summary, setSummary] = useState<string>(ai?.summary || "");
  const [estimatedRange, setEstimatedRange] = useState<string>(ai?.estimated_range || "");
  const [authText, setAuthText] = useState<string>(ai?.authenticity_assessment || "");
  const [conditionText, setConditionText] = useState<string>(ai?.condition_notes || "");
  const [marketText, setMarketText] = useState<string>(ai?.market_insights || "");

  const [showRecommendationPicker, setShowRecommendationPicker] = useState(false);
  const [showFiabilitePicker, setShowFiabilitePicker] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  // Re-sync state when AI data arrives (e.g. after polling fetches fresh results)
  const prevAiRef = useRef(ai);
  useEffect(() => {
    if (ai && ai !== prevAiRef.current) {
      // Only sync fields that haven't been manually edited (still at their old/empty value)
      const prev = prevAiRef.current;
      if (recommendation === (prev?.recommendation || "")) setRecommendation(ai.recommendation || "");
      if (fiabilite === getInitialFiabilite(prev)) setFiabilite(getInitialFiabilite(ai));
      if (identifiedObject === (prev?.identified_object || "")) setIdentifiedObject(ai.identified_object || "");
      if (summary === (prev?.summary || "")) setSummary(ai.summary || "");
      if (estimatedRange === (prev?.estimated_range || "")) setEstimatedRange(ai.estimated_range || "");
      if (authText === (prev?.authenticity_assessment || "")) setAuthText(ai.authenticity_assessment || "");
      if (conditionText === (prev?.condition_notes || "")) setConditionText(ai.condition_notes || "");
      if (marketText === (prev?.market_insights || "")) setMarketText(ai.market_insights || "");
      prevAiRef.current = ai;
    }
  }, [ai]);

  // Detect changes
  const hasChanges =
    recommendation !== (ai?.recommendation || "") ||
    fiabilite !== initialScore ||
    identifiedObject !== (ai?.identified_object || "") ||
    summary !== (ai?.summary || "") ||
    estimatedRange !== (ai?.estimated_range || "") ||
    authText !== (ai?.authenticity_assessment || "") ||
    conditionText !== (ai?.condition_notes || "") ||
    marketText !== (ai?.market_insights || "");

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const scoreToLevel: Record<number, string> = { 5: "élevée", 4: "élevée", 3: "moyenne", 2: "faible", 1: "faible", 0: "faux" };
      const updatedAi = {
        ...ai,
        recommendation,
        confidence_score: fiabilite,
        confidence_level: scoreToLevel[fiabilite] || "moyenne",
        identified_object: identifiedObject,
        summary,
        estimated_range: estimatedRange,
        authenticity_assessment: authText,
        condition_notes: conditionText,
        market_insights: marketText,
      };
      await onSaveAnalysis(updatedAi, recommendation);
    } finally {
      setSaving(false);
    }
  }, [ai, recommendation, fiabilite, identifiedObject, summary, estimatedRange, authText, conditionText, marketText, onSaveAnalysis]);

  if (!ai) {
    return (
      <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
        Analyse en cours…
      </div>
    );
  }

  const interestStyle = getInterestStyle(recommendation);

  const lensCount = ai.lens_detection?.visualMatches?.length || 0;
  const webCount = (ai.web_sources?.length || 0);
  const sourceCount = lensCount + webCount;

  const toggleSection = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  return (
    <div className="space-y-4">
      {/* ── Badges recommandation + fiabilité + Re-analyze ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 relative">
          {/* Recommendation badge - clickable */}
          <div className="relative">
            <Badge
              className={`${interestStyle?.bg || "bg-muted"} ${interestStyle?.text || ""} ${interestStyle?.border || ""} border text-xs px-3 py-1 cursor-pointer hover:opacity-80`}
              onClick={() => { setShowRecommendationPicker(!showRecommendationPicker); setShowFiabilitePicker(false); }}
            >
              {interestStyle && (
                <span className={`inline-block w-2 h-2 rounded-full ${interestStyle.dot} mr-1.5`} />
              )}
              {interestStyle?.label || "Cotation"}
              <Pencil className="w-2.5 h-2.5 ml-1.5 opacity-50" />
            </Badge>
            {showRecommendationPicker && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-background border rounded-lg shadow-lg p-1.5 min-w-[160px]">
                {Object.entries(INTEREST_LEVELS).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => { setRecommendation(key); setShowRecommendationPicker(false); }}
                    className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors ${
                      recommendation === key ? `${config.bg} ${config.text} font-medium` : "hover:bg-muted"
                    }`}
                  >
                    <span className={`inline-block w-2 h-2 rounded-full ${config.dot}`} />
                    {config.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fiabilité badge - clickable */}
          <div className="relative">
            <Badge
              variant="outline"
              className={`text-xs px-3 py-1 cursor-pointer hover:opacity-80 ${FIABILITE_STYLES[fiabilite] || ""}`}
              onClick={() => { setShowFiabilitePicker(!showFiabilitePicker); setShowRecommendationPicker(false); }}
            >
              {fiabilite === 0 ? "Erreur" : `Fiabilité ${fiabilite}/5`}
              <Pencil className="w-2.5 h-2.5 ml-1.5 opacity-50" />
            </Badge>
            {showFiabilitePicker && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-background border rounded-lg shadow-lg p-1.5 min-w-[120px]">
                {FIABILITE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setFiabilite(opt.value); setShowFiabilitePicker(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                      fiabilite === opt.value ? "bg-muted font-medium" : "hover:bg-muted/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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

      {/* ── Synthèse éditable ── */}
      <div className="p-4 bg-muted/30 rounded-lg border border-border/30 space-y-2">
        <EditableField
          value={identifiedObject}
          onChange={setIdentifiedObject}
          editing={editingField === "identified_object"}
          onEdit={() => setEditingField("identified_object")}
          onClose={() => setEditingField(null)}
          className="text-sm font-medium"
          placeholder="Identification de l'objet…"
        />
        <EditableField
          value={summary}
          onChange={setSummary}
          editing={editingField === "summary"}
          onEdit={() => setEditingField("summary")}
          onClose={() => setEditingField(null)}
          className="text-sm text-muted-foreground leading-relaxed"
          placeholder="Synthèse…"
          multiline
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Estimation :</span>
          <EditableField
            value={estimatedRange}
            onChange={setEstimatedRange}
            editing={editingField === "estimated_range"}
            onEdit={() => setEditingField("estimated_range")}
            onClose={() => setEditingField(null)}
            className="text-sm font-semibold"
            placeholder="Fourchette €…"
            inline
          />
        </div>
      </div>

      {/* ── Boutons détail ── */}
      {(authText || conditionText || marketText || sourceCount > 0) && (
        <div className="space-y-0">
          <div className="flex flex-wrap gap-1.5">
            <DetailButton
              icon={<Fingerprint className="w-3.5 h-3.5" />}
              label="Identité"
              isOpen={openSection === "auth"}
              onClick={() => toggleSection("auth")}
            />
            <DetailButton
              icon={<Wrench className="w-3.5 h-3.5" />}
              label="État"
              isOpen={openSection === "condition"}
              onClick={() => toggleSection("condition")}
            />
            {lensCount > 0 && (
              <DetailButton
                icon={<Image className="w-3.5 h-3.5" />}
                label="Correspondances"
                count={lensCount}
                isOpen={openSection === "lens"}
                onClick={() => toggleSection("lens")}
              />
            )}
            {(webCount > 0 || marketText) && (
              <DetailButton
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                label="Résultats"
                count={webCount > 0 ? webCount : undefined}
                isOpen={openSection === "market"}
                onClick={() => toggleSection("market")}
              />
            )}
          </div>

          {openSection === "auth" && (
            <EditableDetailContent
              value={authText}
              onChange={setAuthText}
              placeholder="Notes sur l'identité / authenticité…"
            />
          )}
          {openSection === "condition" && (
            <EditableDetailContent
              value={conditionText}
              onChange={setConditionText}
              placeholder="Notes sur l'état…"
            />
          )}
          {openSection === "lens" && (
            <LensContent ai={ai} />
          )}
          {openSection === "market" && (
            <MarketContent ai={ai} marketText={marketText} onMarketTextChange={setMarketText} />
          )}
        </div>
      )}

      {/* Limitations - discret */}
      {ai.limitations && (
        <p className="text-xs text-muted-foreground italic">{renderMarkdownLinks(ai.limitations)}</p>
      )}

      {/* ── Bouton sauvegarder ── */}
      {hasChanges && (
        <div className="sticky bottom-0 pt-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="w-full gap-2"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Enregistrer les modifications
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Champ éditable inline ── */
function EditableField({
  value,
  onChange,
  editing,
  onEdit,
  onClose,
  className,
  placeholder,
  multiline,
  inline,
}: {
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  inline?: boolean;
}) {
  if (editing) {
    return (
      <div className={`flex gap-1 ${inline ? "items-center" : "flex-col"}`}>
        {multiline ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="text-sm"
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 text-sm bg-background border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && onClose()}
          />
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClose}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  if (!value) {
    return (
      <button onClick={onEdit} className="text-xs text-muted-foreground/50 hover:text-muted-foreground italic">
        + {placeholder || "Ajouter…"}
      </button>
    );
  }

  return (
    <p
      onClick={onEdit}
      className={`${className || ""} cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors`}
      title="Cliquer pour modifier"
    >
      {renderMarkdownLinks(value)}
    </p>
  );
}

/* ── Contenu détail éditable ── */
function EditableDetailContent({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mt-1.5 p-3 bg-muted/30 rounded-lg border border-border/30 animate-in slide-in-from-top-1 duration-200">
      {editing ? (
        <div className="flex flex-col gap-1">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="text-sm"
            autoFocus
          />
          <Button variant="ghost" size="sm" className="self-end h-6 text-xs" onClick={() => setEditing(false)}>
            OK
          </Button>
        </div>
      ) : (
        <p
          onClick={() => setEditing(true)}
          className="text-sm text-muted-foreground leading-relaxed cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
          title="Cliquer pour modifier"
        >
          {value ? renderMarkdownLinks(value) : <span className="italic opacity-50">+ {placeholder}</span>}
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

/* ── Section Correspondances visuelles (Google Lens) ── */
function LensContent({ ai }: { ai: any }) {
  const matches = ai.lens_detection?.visualMatches || [];
  if (matches.length === 0) return null;

  return (
    <div className="mt-1.5 p-3 bg-muted/30 rounded-lg border border-border/30 animate-in slide-in-from-top-1 duration-200">
      <div className="space-y-1.5">
        {matches.map(
          (match: { title: string; link: string; source: string; thumbnail?: string; price?: string }, i: number) => (
            <div key={i} className="flex items-start gap-2">
              {match.thumbnail && (
                <a href={match.link} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <img
                    src={match.thumbnail}
                    alt={match.title}
                    className="w-10 h-10 object-cover rounded border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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
          )
        )}
      </div>
    </div>
  );
}

/* ── Section Résultats (marché + sources web) ── */
function MarketContent({
  ai,
  marketText,
  onMarketTextChange,
}: {
  ai: any;
  marketText: string;
  onMarketTextChange: (v: string) => void;
}) {
  const [editingMarket, setEditingMarket] = useState(false);

  return (
    <div className="mt-1.5 p-3 bg-muted/30 rounded-lg border border-border/30 space-y-3 animate-in slide-in-from-top-1 duration-200">
      {/* Editable market text */}
      {editingMarket ? (
        <div className="flex flex-col gap-1">
          <Textarea
            value={marketText}
            onChange={(e) => onMarketTextChange(e.target.value)}
            placeholder="Contexte marché…"
            rows={3}
            className="text-sm"
            autoFocus
          />
          <Button variant="ghost" size="sm" className="self-end h-6 text-xs" onClick={() => setEditingMarket(false)}>
            OK
          </Button>
        </div>
      ) : (
        <p
          onClick={() => setEditingMarket(true)}
          className="text-sm text-muted-foreground leading-relaxed cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
          title="Cliquer pour modifier"
        >
          {marketText || <span className="italic opacity-50">+ Contexte marché…</span>}
        </p>
      )}

      {/* Sources web */}
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
