import { useState, useCallback, useEffect, useRef } from "react";
import {
  RefreshCw,
  Loader2,
  Check,
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
  onDeepen?: () => void;
  deepening?: boolean;
  estimationId: string;
  onSaveAnalysis: (updatedAi: any, decision?: string) => Promise<void>;
  photoUrls?: string[];
}

export function AnalysisPanel({
  ai,
  reanalyzing,
  onReanalyze,
  onDeepen,
  deepening,
  estimationId,
  onSaveAnalysis,
  photoUrls,
}: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable state — initialized from AI data
  const initialScore = getInitialFiabilite(ai);

  const [recommendation, setRecommendation] = useState<string>(ai?.recommendation || "");
  const [fiabilite, setFiabilite] = useState<number>(initialScore);
  const [identifiedObject, setIdentifiedObject] = useState<string>(ai?.identified_object || "");
  const [summary, setSummary] = useState<string>(ai?.summary || "");
  const [estimatedRange, setEstimatedRange] = useState<string>(ai?.estimated_range || "");
  const [authText, setAuthText] = useState<string>(ai?.identity_biography || ai?.authenticity_assessment || "");
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
      if (authText === (prev?.identity_biography || prev?.authenticity_assessment || "")) setAuthText(ai.identity_biography || ai.authenticity_assessment || "");
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
    authText !== (ai?.identity_biography || ai?.authenticity_assessment || "") ||
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
        identity_biography: authText,
        summary,
        estimated_range: estimatedRange,
        authenticity_assessment: authText, // keep legacy field in sync
        condition_notes: conditionText,
        market_insights: marketText,
      };
      await onSaveAnalysis(updatedAi, recommendation);
    } finally {
      setSaving(false);
    }
  }, [ai, recommendation, fiabilite, identifiedObject, summary, estimatedRange, authText, conditionText, marketText, onSaveAnalysis]);

  const interestStyle = getInterestStyle(recommendation);

  const lensCount = ai?.lens_detection?.visualMatches?.length || 0;
  const webCount = (ai?.web_sources?.length || 0);
  const scrapedCount = ai?.scraped_results_count || 0;
  const sourceCount = lensCount + webCount + scrapedCount;
  const analysisDepth = ai?.analysis_depth || 3;
  const canDeepen = ai?.can_deepen === true;

  // Tab definitions — always available, even before AI analysis
  const tabs = [
    { key: "identity", label: "IDENTITÉ / BIOGRAPHIE", hasContent: !!authText },
    { key: "lens", label: "CORRESPONDANCES VISUELLES", hasContent: lensCount > 0 },
    { key: "market", label: "RÉSULTATS MARCHÉ", hasContent: !!marketText || webCount > 0 },
    { key: "condition", label: "ÉTAT", hasContent: !!conditionText },
    { key: "questions", label: "QUESTIONS", hasContent: (ai?.questions_for_owner?.length || 0) > 0 },
  ];

  const analysisPending = !ai;

  return (
    <div className="space-y-4">
      {/* ── Ligne unique : Onglet Chrome "Première impression" + mentions intérêt/fiabilité au centre ── */}
      <div className="flex items-end gap-0">
        {/* Onglet Chrome — Première impression */}
        <button
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wide bg-background border border-border border-b-0 rounded-t-lg relative z-10"
          style={{ borderTopColor: "#22c55e", borderTopWidth: "3px" }}
        >
          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
          Première impression
        </button>

        {/* Mentions intérêt + fiabilité — au centre, même taille que les onglets */}
        <div className="flex-1 flex items-center justify-center gap-3 pb-2">
          {/* Intérêt */}
          <div className="relative">
            <button
              onClick={() => { setShowRecommendationPicker(!showRecommendationPicker); setShowFiabilitePicker(false); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${
                interestStyle
                  ? `${interestStyle.bg} ${interestStyle.text} ${interestStyle.border}`
                  : "bg-muted/40 border-border/60 text-muted-foreground"
              }`}
            >
              {interestStyle && <span className={`inline-block w-2 h-2 rounded-full ${interestStyle.dot} shrink-0`} />}
              <span>{interestStyle?.label || "Intérêt"}</span>
              <Pencil className="w-2.5 h-2.5 opacity-40 shrink-0" />
            </button>
            {showRecommendationPicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-20 bg-background border rounded-lg shadow-lg p-1.5 min-w-[160px]">
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

          {/* Fiabilité */}
          <div className="relative">
            <button
              onClick={() => { setShowFiabilitePicker(!showFiabilitePicker); setShowRecommendationPicker(false); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${
                FIABILITE_STYLES[fiabilite] || "bg-muted/40 border-border/60 text-muted-foreground"
              }`}
            >
              <span>{fiabilite === 0 ? "Erreur" : `Fiabilité ${fiabilite}/5`}</span>
              <Pencil className="w-2.5 h-2.5 opacity-40 shrink-0" />
            </button>
            {showFiabilitePicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-20 bg-background border rounded-lg shadow-lg p-1.5 min-w-[120px]">
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

        {/* Lancer / Ré-analyser */}
        <Button
          variant={analysisPending ? "default" : "ghost"}
          size="sm"
          onClick={onReanalyze}
          disabled={reanalyzing}
          className={`h-7 text-xs shrink-0 mb-0.5 ${analysisPending ? "gap-1.5" : "text-muted-foreground"}`}
        >
          {reanalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          {analysisPending ? "Lancer l'analyse" : "Ré-analyser"}
        </Button>
      </div>

      {/* ── Synthèse (contenu Première impression) — cadre connecté à l'onglet ── */}
      <div className="p-4 bg-background rounded-b-lg rounded-tr-lg border-2 border-border -mt-4 space-y-2">
        {analysisPending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyse en attente…
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* ── 5 onglets Chrome + cadre de contenu partagé ── */}
      <div>
        {/* Onglets style Chrome — bordures noires visibles, liseret vert sur 2 côtés si contenu */}
        <div className="flex items-end gap-0 -mb-px">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(isActive ? null : tab.key)}
                className={`relative flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all rounded-t-lg border ${
                  isActive
                    ? "bg-background text-foreground z-10 border-border border-b-background"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border-border/60"
                }`}
                style={tab.hasContent ? {
                  borderTopColor: "#22c55e",
                  borderTopWidth: "3px",
                  borderLeftColor: isActive ? "#22c55e" : undefined,
                  borderLeftWidth: isActive ? "3px" : undefined,
                  borderRightColor: isActive ? "#22c55e" : undefined,
                  borderRightWidth: isActive ? "3px" : undefined,
                } : {}}
              >
                {tab.hasContent && (
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                )}
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cadre de contenu */}
        {activeTab && (
          <div className="border-2 border-border rounded-b-lg p-4 bg-background">
            {activeTab === "identity" && (
              <EditableDetailContent
                value={authText}
                onChange={setAuthText}
                placeholder="Notes sur l'identité / biographie…"
              />
            )}
            {activeTab === "condition" && (
              <EditableDetailContent
                value={conditionText}
                onChange={setConditionText}
                placeholder="Notes sur l'état…"
              />
            )}
            {activeTab === "lens" && (
              <LensContent ai={ai} sellerPhotoUrls={photoUrls} />
            )}
            {activeTab === "market" && (
              <MarketContent ai={ai} marketText={marketText} onMarketTextChange={setMarketText} />
            )}
            {activeTab === "questions" && (
              <>
                {ai?.questions_for_owner?.length > 0 ? (
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {ai.questions_for_owner.map((q: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-foreground font-medium">{i + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucune question suggérée.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Limitations */}
      {ai?.limitations && (
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



/* ── Section Correspondances visuelles — Objet original + grille numérotée ── */
function LensContent({ ai, sellerPhotoUrls }: { ai: any; sellerPhotoUrls?: string[] }) {
  const matches = ai.lens_detection?.visualMatches || [];
  const comparisons: Array<{ match_index: number; verdict: string; details: string }> = ai.visual_comparisons || [];
  if (matches.length === 0) return null;

  const VERDICT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    "identique": { bg: "bg-green-100", text: "text-green-800", label: "✓ Identique" },
    "même_modèle": { bg: "bg-emerald-100", text: "text-emerald-800", label: "≈ Même modèle" },
    "similaire": { bg: "bg-amber-100", text: "text-amber-800", label: "~ Similaire" },
    "différent": { bg: "bg-red-100", text: "text-red-800", label: "✗ Différent" },
  };

  // Show at most 2 seller photos
  const visibleSellerPhotos = (sellerPhotoUrls || []).slice(0, 2);

  return (
    <div className="mt-1.5 space-y-4 animate-in slide-in-from-top-1 duration-200">
      {/* Original object photos */}
      {visibleSellerPhotos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">Objet à expertiser</p>
          <div className={`grid gap-2 ${visibleSellerPhotos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {visibleSellerPhotos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`Photo vendeur ${i + 1}`}
                  className="w-full max-h-48 object-contain rounded-lg border bg-muted/20"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Matches grid — numbered thumbnails with hover tooltip */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-muted-foreground">
          Correspondances trouvées ({matches.length})
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {matches.map(
            (match: { title: string; link: string; source: string; thumbnail?: string; price?: string }, i: number) => {
              const comparison = comparisons.find((c) => c.match_index === i);
              const verdictStyle = comparison ? VERDICT_STYLES[comparison.verdict] || VERDICT_STYLES["similaire"] : null;
              const tooltipText = [
                match.title,
                match.source ? `— ${match.source}` : "",
                match.price ? `Prix : ${match.price}` : "",
                comparison?.details || "",
              ].filter(Boolean).join("\n");

              return (
                <a
                  key={i}
                  href={match.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group rounded-lg border overflow-hidden bg-muted/20 hover:ring-2 hover:ring-primary/40 transition-all"
                  title={tooltipText}
                >
                  {/* Number badge */}
                  <span className="absolute top-1 left-1 z-10 bg-foreground/80 text-background text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {i + 1}
                  </span>

                  {/* Verdict badge */}
                  {verdictStyle && (
                    <span className={`absolute top-1 right-1 z-10 ${verdictStyle.bg} ${verdictStyle.text} text-[9px] font-semibold px-1.5 py-0.5 rounded-full`}>
                      {verdictStyle.label}
                    </span>
                  )}

                  {/* Thumbnail */}
                  {match.thumbnail ? (
                    <img
                      src={match.thumbnail}
                      alt={match.title}
                      className="w-full aspect-square object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center text-muted-foreground/30">
                      <Image className="w-6 h-6" />
                    </div>
                  )}

                  {/* Hover overlay with source text */}
                  <div className="absolute inset-0 bg-foreground/80 text-background opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                    <p className="text-[10px] leading-tight line-clamp-3 font-medium">
                      {match.title}
                    </p>
                    {match.price && (
                      <p className="text-[10px] font-bold mt-0.5">{match.price}</p>
                    )}
                    <p className="text-[9px] opacity-70 mt-0.5 truncate">{match.source}</p>
                  </div>
                </a>
              );
            }
          )}
        </div>
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
