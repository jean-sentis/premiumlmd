import { Check, Search, TrendingUp, Loader2, ChevronRight } from "lucide-react";

type StepStatus = "done" | "empty" | "pending" | "unavailable";

const STATUS_STYLES: Record<StepStatus, string> = {
  done: "bg-green-50 text-green-700 border-green-200",
  empty: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-muted/50 text-muted-foreground border-dashed border-border",
  unavailable: "bg-muted/30 text-muted-foreground/50 border-border/30",
};

const DOT_STYLES: Record<StepStatus, string> = {
  done: "bg-green-500",
  empty: "bg-amber-500",
  pending: "bg-muted-foreground/30",
  unavailable: "bg-muted-foreground/20",
};

interface PipelineStepperProps {
  analysisDepth: number;
  lensCount: number;
  scrapedCount: number;
  canDeepen: boolean;
  onDeepen?: () => void;
  deepening?: boolean;
}

export function PipelineStepper({
  analysisDepth,
  lensCount,
  scrapedCount,
  canDeepen,
  onDeepen,
  deepening,
}: PipelineStepperProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* ── Stade 1 : Première impression (toujours fait quand l'IA a répondu) ── */}
      <StepBadge
        status="done"
        label="Première impression"
        icon={<Check className="w-2.5 h-2.5" />}
      />

      <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />

      {/* ── Stade 2 : Correspondances visuelles ── */}
      {analysisDepth >= 2 ? (
        <StepBadge
          status={lensCount > 0 ? "done" : "empty"}
          label={
            lensCount > 0
              ? `${lensCount} correspondance${lensCount > 1 ? "s" : ""}`
              : "Pas de correspondance"
          }
          icon={<Search className="w-2.5 h-2.5" />}
        />
      ) : (
        <StepBadge
          status="pending"
          label="Correspondances"
          icon={<Search className="w-2.5 h-2.5" />}
        />
      )}

      <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />

      {/* ── Stade 3 : Résultats / Marché ── */}
      {analysisDepth >= 3 ? (
        <StepBadge
          status={scrapedCount > 0 ? "done" : "empty"}
          label={
            scrapedCount > 0
              ? `${scrapedCount} résultat${scrapedCount > 1 ? "s" : ""}`
              : "Pas de résultat"
          }
          icon={<TrendingUp className="w-2.5 h-2.5" />}
        />
      ) : canDeepen && onDeepen ? (
        <button
          onClick={onDeepen}
          disabled={deepening}
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border border-dashed transition-colors ${
            deepening
              ? "border-primary/30 text-primary/70 cursor-wait"
              : "border-primary/40 text-primary hover:bg-primary/5 cursor-pointer"
          }`}
        >
          {deepening ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
          ) : (
            <TrendingUp className="w-2.5 h-2.5" />
          )}
          {deepening ? "Recherche…" : "Résultats / Marché"}
        </button>
      ) : (
        <StepBadge
          status="unavailable"
          label="Résultats / Marché"
          icon={<TrendingUp className="w-2.5 h-2.5" />}
        />
      )}
    </div>
  );
}

/* ── Badge individuel ── */
function StepBadge({
  status,
  label,
  icon,
}: {
  status: StepStatus;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border ${STATUS_STYLES[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_STYLES[status]}`} />
      {icon}
      {label}
    </span>
  );
}
