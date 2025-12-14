"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { agentStyles, PHASE_LABELS } from "./constants";
import type { DebatePhase } from "@/lib/types";

export interface ScoreData {
  argumentation?: number;
  rebuttal?: number;
  delivery?: number;
  strategy?: number;
  total?: number;
}

export interface ScoreCardProps {
  phase: DebatePhase;
  agent: "a" | "b";
  agentName?: string;
  scores?: ScoreData;
  isStreaming?: boolean;
  className?: string;
}

interface ScoreRowProps {
  label: string;
  value?: number;
  maxValue?: number;
  accentColor: string;
}

const ScoreRow = memo(function ScoreRow({
  label,
  value,
  maxValue = 10,
  accentColor,
}: ScoreRowProps) {
  const percentage = value !== undefined ? (value / maxValue) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value !== undefined ? value.toFixed(1) : "-"}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500 rounded-full", accentColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

export const ScoreCard = memo(function ScoreCard({
  phase,
  agent,
  agentName,
  scores,
  isStreaming,
  className,
}: ScoreCardProps) {
  const styles = agentStyles[agent];
  const phaseLabel = PHASE_LABELS[phase] || phase;

  // Extract phase type (opening, rebuttal, summary)
  const phaseType = phase.includes("opening")
    ? "Opening"
    : phase.includes("rebuttal")
    ? "Rebuttal"
    : phase.includes("summary")
    ? "Summary"
    : "Score";

  return (
    <Card
      className={cn(
        "transition-all",
        styles.border,
        isStreaming && "ring-2 ring-offset-2",
        isStreaming && styles.ring,
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {phaseType} Score
          </CardTitle>
          <Badge variant="outline" className={cn("text-xs", styles.text)}>
            {agentName || `Agent ${agent.toUpperCase()}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {scores ? (
          <>
            <div className="space-y-2">
              <ScoreRow
                label="Argumentation"
                value={scores.argumentation}
                accentColor={styles.accent}
              />
              <ScoreRow
                label="Delivery"
                value={scores.delivery}
                accentColor={styles.accent}
              />
              <ScoreRow
                label="Strategy"
                value={scores.strategy}
                accentColor={styles.accent}
              />
              {scores.rebuttal !== undefined && (
                <ScoreRow
                  label="Rebuttal"
                  value={scores.rebuttal}
                  accentColor={styles.accent}
                />
              )}
            </div>

            {/* Total Score */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className={cn("text-lg font-bold", styles.text)}>
                  {scores.total?.toFixed(1) || "-"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {isStreaming ? (
              <span className="animate-pulse">Calculating scores...</span>
            ) : (
              "Waiting for scores..."
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
