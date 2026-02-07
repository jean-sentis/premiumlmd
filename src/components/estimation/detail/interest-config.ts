export const INTEREST_LEVELS = {
  très_intéressant: {
    label: "Très intéressant",
    dot: "bg-green-500",
    text: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-400",
    borderLeft: "border-l-green-500",
  },
  intéressant: {
    label: "Intéressant",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    borderLeft: "border-l-emerald-500",
  },
  à_examiner: {
    label: "À examiner",
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-400",
    borderLeft: "border-l-amber-500",
  },
  peu_intéressant: {
    label: "Peu intéressant",
    dot: "bg-orange-500",
    text: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-400",
    borderLeft: "border-l-orange-500",
  },
  hors_spécialité: {
    label: "Hors spécialité",
    dot: "bg-gray-400",
    text: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-300",
    borderLeft: "border-l-gray-400",
  },
} as const;

export type InterestLevel = keyof typeof INTEREST_LEVELS;

export const CONFIDENCE_CONFIG = {
  élevée: { label: "Fiabilité élevée", color: "text-green-700 bg-green-50 border-green-200" },
  moyenne: { label: "Fiabilité moyenne", color: "text-amber-700 bg-amber-50 border-amber-200" },
  faible: { label: "Fiabilité faible", color: "text-red-700 bg-red-50 border-red-200" },
} as const;

export function getInterestStyle(level: string | null | undefined) {
  if (!level) return null;
  return INTEREST_LEVELS[level as InterestLevel] ?? null;
}

/** Returns the effective interest: CP decision overrides AI recommendation */
export function getEffectiveInterest(
  cpDecision: string | null | undefined,
  aiRecommendation: string | null | undefined
): string | null {
  return cpDecision || aiRecommendation || null;
}

/** Calculate overdue info for an estimation */
export function getOverdueInfo(createdAt: string, status: string) {
  if (status === "responded") return null;
  const hoursElapsed = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursElapsed <= 48) return null;
  const daysOverdue = Math.max(1, Math.ceil((hoursElapsed - 48) / 24));
  return { daysOverdue };
}
