import type { DebatePhase } from "@/lib/types";

/**
 * Ordered list of all 14 debate phases
 */
export const PHASE_ORDER: DebatePhase[] = [
  "judge_intro",
  "opening_a",
  "opening_b",
  "score_opening_a",
  "score_opening_b",
  "rebuttal_a",
  "rebuttal_b",
  "score_rebuttal_a",
  "score_rebuttal_b",
  "summary_a",
  "summary_b",
  "score_summary_a",
  "score_summary_b",
  "judge_verdict",
];

/**
 * Agent-specific styling for consistent theming across Arena UI
 */
export const agentStyles = {
  a: {
    border: "border-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-600",
    ring: "ring-blue-400",
    accent: "bg-blue-500",
  },
  b: {
    border: "border-red-500",
    bg: "bg-red-50",
    text: "text-red-600",
    ring: "ring-red-400",
    accent: "bg-red-500",
  },
  judge: {
    border: "border-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-600",
    ring: "ring-purple-400",
    accent: "bg-purple-500",
  },
} as const;

/**
 * Phase display names for UI
 */
export const PHASE_LABELS: Record<DebatePhase, string> = {
  judge_intro: "Judge Introduction",
  opening_a: "Opening Statement (A)",
  opening_b: "Opening Statement (B)",
  score_opening_a: "Opening Score (A)",
  score_opening_b: "Opening Score (B)",
  rebuttal_a: "Rebuttal (A)",
  rebuttal_b: "Rebuttal (B)",
  score_rebuttal_a: "Rebuttal Score (A)",
  score_rebuttal_b: "Rebuttal Score (B)",
  summary_a: "Summary (A)",
  summary_b: "Summary (B)",
  score_summary_a: "Summary Score (A)",
  score_summary_b: "Summary Score (B)",
  judge_verdict: "Final Verdict",
};

/**
 * Get agent type from phase
 */
export function getPhaseAgent(phase: DebatePhase): "a" | "b" | "judge" {
  if (phase.includes("_a")) return "a";
  if (phase.includes("_b")) return "b";
  return "judge";
}

/**
 * Calculate progress percentage for current phase
 */
export function getPhaseProgress(currentPhase: DebatePhase | null): number {
  if (!currentPhase) return 0;
  const index = PHASE_ORDER.indexOf(currentPhase);
  if (index === -1) return 0;
  return ((index + 1) / PHASE_ORDER.length) * 100;
}

/**
 * Get completed phases based on current phase
 */
export function getCompletedPhases(currentPhase: DebatePhase | null): DebatePhase[] {
  if (!currentPhase) return [];
  const index = PHASE_ORDER.indexOf(currentPhase);
  if (index === -1) return [];
  return PHASE_ORDER.slice(0, index);
}
