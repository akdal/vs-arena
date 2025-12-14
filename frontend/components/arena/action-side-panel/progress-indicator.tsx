"use client";

import { memo } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import type { DebatePhase } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PHASE_ORDER,
  PHASE_LABELS,
  agentStyles,
  getPhaseAgent,
} from "../constants";

interface ProgressIndicatorProps {
  currentPhase: DebatePhase | null;
  completedPhases: DebatePhase[];
}

export const ProgressIndicator = memo(function ProgressIndicator({
  currentPhase,
  completedPhases,
}: ProgressIndicatorProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold mb-3">Progress</h3>
      <div className="space-y-0.5">
        {PHASE_ORDER.map((phase, index) => {
          const agent = getPhaseAgent(phase);
          const styles = agentStyles[agent];
          const isCompleted = completedPhases.includes(phase);
          const isCurrent = currentPhase === phase;
          const isPending = !isCompleted && !isCurrent;
          const isLast = index === PHASE_ORDER.length - 1;

          return (
            <div key={phase} className="relative flex items-start gap-2">
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-2.5 top-6 w-0.5 h-6 -ml-px",
                    isCompleted ? styles.accent : "bg-muted"
                  )}
                />
              )}

              {/* Status Icon */}
              <div className="relative flex-shrink-0 pt-0.5">
                {isCompleted && (
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center",
                      styles.accent,
                      "text-white"
                    )}
                  >
                    <Check className="w-3 h-3" />
                  </div>
                )}
                {isCurrent && (
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center",
                      styles.accent,
                      "text-white animate-pulse"
                    )}
                  >
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </div>
                )}
                {isPending && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-muted bg-background">
                    <Circle className="w-2 h-2 text-muted-foreground fill-current" />
                  </div>
                )}
              </div>

              {/* Phase Label */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p
                  className={cn(
                    "text-xs font-medium truncate",
                    isCurrent && styles.text,
                    isCompleted && "text-muted-foreground",
                    isPending && "text-muted-foreground/60"
                  )}
                >
                  {PHASE_LABELS[phase]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
