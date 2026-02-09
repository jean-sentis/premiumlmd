import { useState, useEffect } from "react";
import { Check, Loader2, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Step {
  label: string;
  detail: string;
  estimatedSeconds: number;
}

const STEPS: Step[] = [
  { label: "Identification visuelle", detail: "Analyse des photos par l'IA…", estimatedSeconds: 5 },
  { label: "Correspondances visuelles", detail: "Recherche Google Lens…", estimatedSeconds: 8 },
  { label: "Recherche marché", detail: "Recherche de prix et références…", estimatedSeconds: 12 },
  { label: "Scraping approfondi", detail: "Extraction des données de prix…", estimatedSeconds: 20 },
  { label: "Synthèse finale", detail: "Rédaction de l'expertise…", estimatedSeconds: 40 },
];

const TOTAL_ESTIMATED = STEPS.reduce((sum, s) => sum + s.estimatedSeconds, 0);

export function AnalysisProgressStepper() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Determine current step based on elapsed time
  let cumulative = 0;
  let currentStepIndex = 0;
  for (let i = 0; i < STEPS.length; i++) {
    cumulative += STEPS[i].estimatedSeconds;
    if (elapsed < cumulative) {
      currentStepIndex = i;
      break;
    }
    if (i === STEPS.length - 1) {
      currentStepIndex = STEPS.length - 1;
    }
  }

  // Progress percentage (cap at 95% to avoid looking stuck)
  const rawProgress = Math.min((elapsed / TOTAL_ESTIMATED) * 100, 95);

  const remaining = Math.max(TOTAL_ESTIMATED - elapsed, 5);
  const remainingText =
    remaining >= 60
      ? `~${Math.ceil(remaining / 60)} min`
      : `~${remaining}s`;

  return (
    <div className="space-y-4 py-3">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyse en cours…
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {remainingText} restant
          </span>
        </div>
        <Progress value={rawProgress} className="h-2" />
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {STEPS.map((step, i) => {
          const isDone = i < currentStepIndex;
          const isActive = i === currentStepIndex;

          return (
            <div
              key={step.label}
              className={`flex items-center gap-2.5 text-xs py-1 px-2 rounded transition-colors ${
                isActive
                  ? "bg-primary/5 text-foreground"
                  : isDone
                  ? "text-muted-foreground"
                  : "text-muted-foreground/40"
              }`}
            >
              {isDone ? (
                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-current opacity-40 shrink-0" />
              )}
              <span className={isActive ? "font-medium" : ""}>
                {step.label}
              </span>
              {isActive && (
                <span className="text-muted-foreground ml-auto">{step.detail}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
