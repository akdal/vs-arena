"use client";

import { memo } from "react";
import type { DebateFlowNode } from "@/components/flow/utils/flow-types";
import { cn } from "@/lib/utils";
import { agentStyles } from "../constants";

interface ScoreDisplayProps {
  nodes: DebateFlowNode[];
  agentA: { name: string };
  agentB: { name: string };
}

interface AgentScores {
  opening?: number;
  rebuttal?: number;
  summary?: number;
  total: number;
}

export const ScoreDisplay = memo(function ScoreDisplay({
  nodes,
  agentA,
  agentB,
}: ScoreDisplayProps) {
  // Extract scores from score nodes
  const getAgentScores = (agent: "a" | "b"): AgentScores => {
    const scores: AgentScores = { total: 0 };

    nodes.forEach((node) => {
      if (node.type === "score" && node.data.scores) {
        const phase = node.data.phase;
        const total = node.data.scores.total;

        if (total !== undefined) {
          if (phase === `score_opening_${agent}`) {
            scores.opening = total;
            scores.total += total;
          } else if (phase === `score_rebuttal_${agent}`) {
            scores.rebuttal = total;
            scores.total += total;
          } else if (phase === `score_summary_${agent}`) {
            scores.summary = total;
            scores.total += total;
          }
        }
      }
    });

    return scores;
  };

  const scoresA = getAgentScores("a");
  const scoresB = getAgentScores("b");

  // Determine winner for visual indication
  const maxTotal = Math.max(scoresA.total, scoresB.total);
  const isATied = scoresA.total === scoresB.total && scoresA.total > 0;
  const isBTied = isATied;

  const ScoreBar = ({
    label,
    scoreA,
    scoreB,
  }: {
    label: string;
    scoreA?: number;
    scoreB?: number;
  }) => {
    const maxScore = Math.max(scoreA || 0, scoreB || 0);
    const widthA = maxScore > 0 ? ((scoreA || 0) / maxScore) * 100 : 0;
    const widthB = maxScore > 0 ? ((scoreB || 0) / maxScore) * 100 : 0;

    return (
      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          {/* Agent A Score */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  agentStyles.a.accent
                )}
                style={{ width: `${widthA}%` }}
              />
            </div>
            <span className="text-xs font-semibold min-w-[2rem] text-right">
              {scoreA !== undefined ? scoreA.toFixed(1) : "-"}
            </span>
          </div>

          {/* VS Divider */}
          <span className="text-xs text-muted-foreground">vs</span>

          {/* Agent B Score */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold min-w-[2rem] text-left">
              {scoreB !== undefined ? scoreB.toFixed(1) : "-"}
            </span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  agentStyles.b.accent
                )}
                style={{ width: `${widthB}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Scores</h3>
      </div>

      {/* Agent Names */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-sm font-medium">
        <div className={cn("text-center", agentStyles.a.text)}>
          {agentA.name}
        </div>
        <div className="text-muted-foreground"></div>
        <div className={cn("text-center", agentStyles.b.text)}>
          {agentB.name}
        </div>
      </div>

      {/* Individual Phase Scores */}
      <div className="space-y-3">
        <ScoreBar
          label="Opening"
          scoreA={scoresA.opening}
          scoreB={scoresB.opening}
        />
        <ScoreBar
          label="Rebuttal"
          scoreA={scoresA.rebuttal}
          scoreB={scoresB.rebuttal}
        />
        <ScoreBar
          label="Summary"
          scoreA={scoresA.summary}
          scoreB={scoresB.summary}
        />
      </div>

      {/* Total Score */}
      <div className="pt-3 border-t space-y-2">
        <div className="text-sm font-semibold text-center">Total Score</div>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={cn(
              "p-3 rounded-lg text-center border-2 transition-all",
              agentStyles.a.bg,
              agentStyles.a.border,
              scoresA.total > scoresB.total && scoresA.total > 0 && "ring-2",
              scoresA.total > scoresB.total && scoresA.total > 0 && agentStyles.a.ring
            )}
          >
            <div className={cn("text-2xl font-bold", agentStyles.a.text)}>
              {scoresA.total.toFixed(1)}
            </div>
            {scoresA.total > scoresB.total && scoresA.total > 0 && (
              <div className="text-xs font-medium mt-1 text-green-600">
                Leading
              </div>
            )}
            {isATied && (
              <div className="text-xs font-medium mt-1 text-yellow-600">Tied</div>
            )}
          </div>
          <div
            className={cn(
              "p-3 rounded-lg text-center border-2 transition-all",
              agentStyles.b.bg,
              agentStyles.b.border,
              scoresB.total > scoresA.total && scoresB.total > 0 && "ring-2",
              scoresB.total > scoresA.total && scoresB.total > 0 && agentStyles.b.ring
            )}
          >
            <div className={cn("text-2xl font-bold", agentStyles.b.text)}>
              {scoresB.total.toFixed(1)}
            </div>
            {scoresB.total > scoresA.total && scoresB.total > 0 && (
              <div className="text-xs font-medium mt-1 text-green-600">
                Leading
              </div>
            )}
            {isBTied && (
              <div className="text-xs font-medium mt-1 text-yellow-600">Tied</div>
            )}
          </div>
        </div>
      </div>

      {/* No scores message */}
      {scoresA.total === 0 && scoresB.total === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Scores will appear as the debate progresses
        </div>
      )}
    </div>
  );
});
