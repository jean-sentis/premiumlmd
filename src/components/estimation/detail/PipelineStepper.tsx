import { Check, Loader2 } from "lucide-react";

type StepStatus = "done" | "empty" | "pending" | "active";

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
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* ── Stade 1 : Première impression (toujours fait) ── */}
      <DoneBadge label="Première impression" />

      <Separator />

      {/* ── Stade 2 : Correspondances visuelles ── */}
      {analysisDepth >= 2 ? (
        <DoneBadge
          label={
            lensCount > 0
              ? `${lensCount} correspondance${lensCount > 1 ? "s" : ""}`
              : "Pas de correspondance"
          }
        />
      ) : (
        <PendingBadge label="Correspondances visuelles ?" />
      )}

      <Separator />

      {/* ── Stade 3 : Résultats sur le marché ── */}
      {analysisDepth >= 3 ? (
        <DoneBadge
          label={
            scrapedCount > 0
              ? `${scrapedCount} référence${scrapedCount > 1 ? "s" : ""} marché`
              : "Pas de référence"
          }
        />
      ) : canDeepen && onDeepen ? (
        <button
          onClick={onDeepen}
          disabled={deepening}
          className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
            deepening
              ? "bg-muted/40 text-muted-foreground border-border cursor-wait"
              : "bg-muted/30 text-foreground border-border hover:bg-muted/60 cursor-pointer"
          }`}
        >
          {deepening ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
          ) : (
            <span className="text-[9px]">?</span>
          )}
          {deepening ? "Recherche…" : "Résultats sur le marché ?"}
        </button>
      ) : (
        <PendingBadge label="Résultats sur le marché ?" />
      )}
    </div>
  );
}

/* ── Badge terminé (fond gris + check vert) ── */
function DoneBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-muted/50 text-foreground border border-border/50">
      <Check className="w-3 h-3 text-green-600 shrink-0" />
      {label}
    </span>
  );
}

/* ── Badge en attente (fond gris clair + ?) ── */
function PendingBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full bg-muted/30 text-muted-foreground border border-dashed border-border/50">
      <span className="text-[9px]">?</span>
      {label}
    </span>
  );
}

/* ── Séparateur discret ── */
function Separator() {
  return <span className="text-muted-foreground/30 text-[10px] shrink-0">›</span>;
}
