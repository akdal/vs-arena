"use client";

import { memo } from "react";
import type { DebatePhase, RunDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PHASE_ORDER,
  PHASE_LABELS,
  agentStyles,
  getPhaseAgent,
  getPhaseProgress,
} from "./constants";

interface TurnIndicatorProps {
  currentPhase: DebatePhase | null;
  isStreaming: boolean;
  run: RunDetail;
  mode?: "live" | "replay";
}

export const TurnIndicator = memo(function TurnIndicator({
  currentPhase,
  isStreaming,
  run,
  mode = "live",
}: TurnIndicatorProps) {
  const isReplay = mode === "replay";
  const progress = getPhaseProgress(currentPhase);
  const currentAgent = currentPhase ? getPhaseAgent(currentPhase) : null;
  const currentPhaseIndex = currentPhase
    ? PHASE_ORDER.indexOf(currentPhase)
    : -1;

  // Determine which agent is currently active
  const isAgentAActive = currentAgent === "a";
  const isAgentBActive = currentAgent === "b";
  const isJudgeActive = currentAgent === "judge";

  // Get agent initials
  const agentAInitial = run.agent_a.name.charAt(0).toUpperCase();
  const agentBInitial = run.agent_b.name.charAt(0).toUpperCase();

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-4">
        {/* Agent A Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg border-2 transition-all duration-300",
              agentStyles.a.border,
              agentStyles.a.bg,
              agentStyles.a.text,
              isAgentAActive && isStreaming && "ring-4 ring-offset-2",
              isAgentAActive && isStreaming && agentStyles.a.ring,
              isAgentAActive && isStreaming && "animate-node-glow-blue"
            )}
          >
            {agentAInitial}
          </div>
          <div className="text-xs font-medium text-center">
            <div className={cn(isAgentAActive && agentStyles.a.text)}>
              {run.agent_a.name}
            </div>
            {isAgentAActive && (
              <div className="text-muted-foreground mt-0.5">
                {isReplay ? "Playing..." : "Speaking..."}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {currentPhase ? PHASE_LABELS[currentPhase] : "Waiting to start"}
            </span>
            <span className="text-muted-foreground">
              {currentPhaseIndex >= 0 ? currentPhaseIndex + 1 : 0} /{" "}
              {PHASE_ORDER.length}
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            {/* Background segments */}
            <div className="absolute inset-0 flex">
              {PHASE_ORDER.map((phase, index) => {
                const agent = getPhaseAgent(phase);
                const styles = agentStyles[agent];
                const isCompleted = index < currentPhaseIndex;
                const isCurrent = index === currentPhaseIndex;

                return (
                  <div
                    key={phase}
                    className={cn(
                      "flex-1 border-r border-background/50 transition-all duration-300",
                      isCompleted && styles.accent,
                      isCurrent && styles.accent,
                      isCurrent && isStreaming && "opacity-80 animate-pulse"
                    )}
                    style={{ width: `${100 / PHASE_ORDER.length}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Agent B Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg border-2 transition-all duration-300",
              agentStyles.b.border,
              agentStyles.b.bg,
              agentStyles.b.text,
              isAgentBActive && isStreaming && "ring-4 ring-offset-2",
              isAgentBActive && isStreaming && agentStyles.b.ring,
              isAgentBActive && isStreaming && "animate-node-glow-red"
            )}
          >
            {agentBInitial}
          </div>
          <div className="text-xs font-medium text-center">
            <div className={cn(isAgentBActive && agentStyles.b.text)}>
              {run.agent_b.name}
            </div>
            {isAgentBActive && (
              <div className="text-muted-foreground mt-0.5">
                {isReplay ? "Playing..." : "Speaking..."}
              </div>
            )}
          </div>
        </div>

        {/* Judge Indicator (only show when judge is active) */}
        {isJudgeActive && (
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg border-2 transition-all duration-300",
                agentStyles.judge.border,
                agentStyles.judge.bg,
                agentStyles.judge.text,
                isStreaming && "ring-4 ring-offset-2",
                isStreaming && agentStyles.judge.ring,
                isStreaming && "animate-node-glow-purple"
              )}
            >
              J
            </div>
            <div className="text-xs font-medium text-center">
              <div className={agentStyles.judge.text}>Judge</div>
              {isStreaming && (
                <div className="text-muted-foreground mt-0.5">
                  {isReplay ? "Playing..." : "Deliberating..."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
