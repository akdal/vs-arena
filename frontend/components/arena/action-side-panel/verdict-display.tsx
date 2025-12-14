"use client";

import { memo, useMemo } from "react";
import { Trophy, Scale, Minus } from "lucide-react";
import type { DebateFlowNode } from "@/components/flow/utils/flow-types";
import { cn } from "@/lib/utils";
import { agentStyles } from "../constants";

interface VerdictDisplayProps {
  nodes: DebateFlowNode[];
  agentAName?: string;
  agentBName?: string;
}

export const VerdictDisplay = memo(function VerdictDisplay({
  nodes,
  agentAName = "Agent A",
  agentBName = "Agent B",
}: VerdictDisplayProps) {
  // Extract verdict data from nodes
  const verdictData = useMemo(() => {
    const verdictNode = nodes.find((node) => node.type === "verdict");
    if (!verdictNode) return null;

    return {
      winner: verdictNode.data.winner as "a" | "b" | "tie" | undefined,
      analysis: verdictNode.data.analysis as string | undefined,
      isComplete: verdictNode.data.isComplete,
      isStreaming: verdictNode.data.isStreaming,
    };
  }, [nodes]);

  // Calculate final scores from score nodes
  const finalScores = useMemo(() => {
    let scoreA = 0;
    let scoreB = 0;

    nodes.forEach((node) => {
      if (node.type === "score" && node.data.scores?.total) {
        const phase = node.data.phase;
        const total = node.data.scores.total;

        if (phase.includes("_a")) {
          scoreA += total;
        } else if (phase.includes("_b")) {
          scoreB += total;
        }
      }
    });

    return { a: scoreA, b: scoreB };
  }, [nodes]);

  const hasScores = finalScores.a > 0 || finalScores.b > 0;

  if (!verdictData && !hasScores) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Verdict</h3>
        <div className="text-center py-6 text-sm text-muted-foreground">
          <Minus className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Verdict will appear after the debate concludes</p>
        </div>
      </div>
    );
  }

  const getWinnerIcon = () => {
    if (!verdictData?.winner) return Minus;
    return verdictData.winner === "tie" ? Scale : Trophy;
  };

  const getWinnerText = () => {
    if (!verdictData?.winner) {
      if (verdictData?.isStreaming) return "Deliberating...";
      return "Awaiting verdict";
    }
    if (verdictData.winner === "tie") return "Tie!";
    return verdictData.winner === "a" ? `${agentAName} Wins!` : `${agentBName} Wins!`;
  };

  const getWinnerStyle = () => {
    if (!verdictData?.winner) return "text-muted-foreground";
    if (verdictData.winner === "tie") return "text-yellow-600";
    return verdictData.winner === "a" ? agentStyles.a.text : agentStyles.b.text;
  };

  const WinnerIcon = getWinnerIcon();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Verdict</h3>

      {/* Winner Display */}
      <div
        className={cn(
          "rounded-lg p-4 text-center border",
          verdictData?.winner === "a" && agentStyles.a.bg,
          verdictData?.winner === "a" && agentStyles.a.border,
          verdictData?.winner === "b" && agentStyles.b.bg,
          verdictData?.winner === "b" && agentStyles.b.border,
          verdictData?.winner === "tie" && "bg-yellow-50 border-yellow-500 dark:bg-yellow-950",
          !verdictData?.winner && "bg-muted"
        )}
      >
        <WinnerIcon
          className={cn(
            "h-8 w-8 mx-auto mb-2",
            getWinnerStyle(),
            verdictData?.isStreaming && "animate-pulse"
          )}
        />
        <p className={cn("text-lg font-bold", getWinnerStyle())}>
          {getWinnerText()}
        </p>
      </div>

      {/* Final Scores */}
      {hasScores && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Final Scores
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div
              className={cn(
                "p-2 rounded text-center border",
                agentStyles.a.bg,
                agentStyles.a.border
              )}
            >
              <div className="text-xs text-muted-foreground">{agentAName}</div>
              <div className={cn("text-lg font-bold", agentStyles.a.text)}>
                {finalScores.a.toFixed(1)}
              </div>
            </div>
            <div
              className={cn(
                "p-2 rounded text-center border",
                agentStyles.b.bg,
                agentStyles.b.border
              )}
            >
              <div className="text-xs text-muted-foreground">{agentBName}</div>
              <div className={cn("text-lg font-bold", agentStyles.b.text)}>
                {finalScores.b.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Preview */}
      {verdictData?.analysis && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Analysis
          </div>
          <p className="text-xs text-muted-foreground line-clamp-4">
            {verdictData.analysis}
          </p>
        </div>
      )}
    </div>
  );
});
