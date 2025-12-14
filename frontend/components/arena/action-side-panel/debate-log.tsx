"use client";

import { memo } from "react";
import { Check, Loader2, Circle } from "lucide-react";
import type { DebatePhase } from "@/lib/types";
import type { DebateFlowNode } from "@/components/flow/utils/flow-types";
import { cn } from "@/lib/utils";
import { PHASE_ORDER, PHASE_LABELS, agentStyles, getPhaseAgent } from "../constants";

interface DebateLogProps {
  nodes: DebateFlowNode[];
  currentPhase: DebatePhase | null;
}

interface LogEntry {
  phase: DebatePhase;
  status: "pending" | "in_progress" | "completed";
  preview?: string;
}

export const DebateLog = memo(function DebateLog({
  nodes,
  currentPhase,
}: DebateLogProps) {
  // Build log entries from nodes
  const entries: LogEntry[] = PHASE_ORDER.map((phase) => {
    const node = nodes.find((n) => n.data.phase === phase);
    const isCurrent = currentPhase === phase;
    const isCompleted = node?.data.isComplete ?? false;

    let status: LogEntry["status"] = "pending";
    if (isCurrent) status = "in_progress";
    else if (isCompleted) status = "completed";

    // Get preview text (first 50 chars)
    let preview: string | undefined;
    if (node && "content" in node.data) {
      const content = node.data.content as string;
      if (content && typeof content === "string") {
        preview = content.slice(0, 50);
        if (content.length > 50) preview += "...";
      }
    }

    return { phase, status, preview };
  });

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold mb-3">Debate Log</h3>
      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
        {entries.map(({ phase, status, preview }) => {
          const agent = getPhaseAgent(phase);
          const styles = agentStyles[agent];
          const isCompleted = status === "completed";
          const isCurrent = status === "in_progress";
          const isPending = status === "pending";

          return (
            <div
              key={phase}
              className={cn(
                "flex items-start gap-2 p-2 rounded-md transition-colors",
                isCurrent && "bg-muted",
                isCompleted && "opacity-75 hover:opacity-100"
              )}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0 pt-0.5">
                {isCompleted && (
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center",
                      styles.accent,
                      "text-white"
                    )}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
                {isCurrent && (
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center",
                      styles.accent,
                      "text-white"
                    )}
                  >
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  </div>
                )}
                {isPending && (
                  <div className="w-4 h-4 rounded-full flex items-center justify-center border border-muted-foreground/30">
                    <Circle className="w-2 h-2 text-muted-foreground/40 fill-current" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-xs font-medium truncate",
                    isCurrent && styles.text,
                    isCompleted && "text-foreground",
                    isPending && "text-muted-foreground/60"
                  )}
                >
                  {PHASE_LABELS[phase]}
                </p>
                {preview && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {preview}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
