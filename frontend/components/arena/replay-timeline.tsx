"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Check, Circle, Loader2 } from "lucide-react";
import type { DebatePhase } from "@/lib/types";
import { PHASE_LABELS, getPhaseAgent, agentStyles } from "./constants";

export interface ReplayTimelineProps {
  phases: DebatePhase[];
  currentPhaseIndex: number;
  isPlaying: boolean;
  onPhaseClick: (index: number) => void;
  className?: string;
}

export const ReplayTimeline = memo(function ReplayTimeline({
  phases,
  currentPhaseIndex,
  isPlaying,
  onPhaseClick,
  className,
}: ReplayTimelineProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <h3 className="text-sm font-medium mb-2">Timeline</h3>
      <div className="space-y-0.5 max-h-[400px] overflow-y-auto pr-1">
        {phases.map((phase, index) => {
          const isCompleted = index < currentPhaseIndex;
          const isCurrent = index === currentPhaseIndex;
          const isPending = index > currentPhaseIndex;
          const agent = getPhaseAgent(phase);
          const styles = agentStyles[agent];

          return (
            <button
              key={phase}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left",
                "transition-all duration-200",
                "hover:bg-muted/50",
                isCurrent && "bg-muted",
                isPending && "opacity-60"
              )}
              onClick={() => onPhaseClick(index)}
            >
              {/* Status Icon */}
              <div
                className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                  isCompleted && styles.bg,
                  isCurrent && isPlaying && "animate-pulse",
                  isCurrent && styles.border,
                  isCurrent && "border-2 bg-background"
                )}
              >
                {isCompleted && (
                  <Check className={cn("h-3 w-3", styles.text)} />
                )}
                {isCurrent && isPlaying && (
                  <Loader2 className={cn("h-3 w-3 animate-spin", styles.text)} />
                )}
                {isCurrent && !isPlaying && (
                  <Circle className={cn("h-2 w-2 fill-current", styles.text)} />
                )}
                {isPending && (
                  <Circle className="h-2 w-2 text-muted-foreground" />
                )}
              </div>

              {/* Phase Label */}
              <span
                className={cn(
                  "text-xs truncate flex-1",
                  isCompleted && "text-muted-foreground",
                  isCurrent && "font-medium",
                  isPending && "text-muted-foreground"
                )}
              >
                {PHASE_LABELS[phase]}
              </span>

              {/* Phase Number */}
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {index + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
