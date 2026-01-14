import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  currentStep: number; // Can be decimal for gradual progress (e.g., 3.5)
  totalSteps?: number;
  steps?: { label: string; path: string }[];
}

const DEFAULT_STEPS = [
  { label: 'Ma newsletter', path: '/compte/newsletter' },
  { label: 'Mes alertes', path: '/compte/alertes' },
  { label: 'Mes Like', path: '/compte/favoris' },
  { label: 'Dialogue avec Lia', path: '/compte/ce-que-jaime' },
];

const OnboardingProgress = ({ 
  currentStep, 
  totalSteps = 4,
  steps = DEFAULT_STEPS 
}: OnboardingProgressProps) => {
  return (
    <div className="mb-6">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-foreground">
          Étape {Math.ceil(currentStep)} sur {totalSteps}
        </span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-[hsl(var(--brand-gold))] transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Step labels - positioned at start of each segment */}
      <div className="relative h-4 text-xs text-muted-foreground">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCurrentStep = currentStep >= stepNumber && currentStep < stepNumber + 1;
          const isCompleted = currentStep >= stepNumber + 1;
          // Position each label at the start of its segment
          const leftPosition = ((stepNumber - 1) / totalSteps) * 100;
          
          return (
            <span 
              key={step.path}
              className={cn(
                "absolute transition-colors whitespace-nowrap",
                isCurrentStep && "text-foreground font-medium",
                isCompleted && "text-[hsl(var(--brand-gold))]"
              )}
              style={{ left: `${leftPosition}%` }}
            >
              {step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingProgress;
