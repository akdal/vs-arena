"use client";

import { memo } from "react";
import { Trophy, Scale, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { agentStyles } from "./constants";

export interface FinalScores {
  a: number;
  b: number;
}

export interface VerdictPanelProps {
  winner?: "a" | "b" | "tie";
  finalScores?: FinalScores;
  analysis?: string;
  agentAName?: string;
  agentBName?: string;
  isStreaming?: boolean;
  className?: string;
}

interface ScoreComparisonBarProps {
  scoreA: number;
  scoreB: number;
  agentAName: string;
  agentBName: string;
}

const ScoreComparisonBar = memo(function ScoreComparisonBar({
  scoreA,
  scoreB,
  agentAName,
  agentBName,
}: ScoreComparisonBarProps) {
  const total = scoreA + scoreB;
  const percentA = total > 0 ? (scoreA / total) * 100 : 50;
  const percentB = total > 0 ? (scoreB / total) * 100 : 50;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-medium">
        <span className={agentStyles.a.text}>{agentAName}</span>
        <span className={agentStyles.b.text}>{agentBName}</span>
      </div>
      <div className="flex h-4 rounded-full overflow-hidden bg-muted">
        <div
          className={cn(
            "transition-all duration-700",
            agentStyles.a.accent
          )}
          style={{ width: `${percentA}%` }}
        />
        <div
          className={cn(
            "transition-all duration-700",
            agentStyles.b.accent
          )}
          style={{ width: `${percentB}%` }}
        />
      </div>
      <div className="flex justify-between text-lg font-bold">
        <span className={agentStyles.a.text}>{scoreA.toFixed(1)}</span>
        <span className={agentStyles.b.text}>{scoreB.toFixed(1)}</span>
      </div>
    </div>
  );
});

export const VerdictPanel = memo(function VerdictPanel({
  winner,
  finalScores,
  analysis,
  agentAName = "Agent A",
  agentBName = "Agent B",
  isStreaming,
  className,
}: VerdictPanelProps) {
  const getWinnerDisplay = () => {
    if (!winner) return null;

    if (winner === "tie") {
      return {
        icon: Scale,
        text: "It's a Tie!",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950",
        borderColor: "border-yellow-500",
      };
    }

    const winnerName = winner === "a" ? agentAName : agentBName;
    const styles = winner === "a" ? agentStyles.a : agentStyles.b;

    return {
      icon: Trophy,
      text: `${winnerName} Wins!`,
      color: styles.text,
      bgColor: styles.bg,
      borderColor: styles.border,
    };
  };

  const winnerDisplay = getWinnerDisplay();

  return (
    <Card
      className={cn(
        "transition-all",
        winnerDisplay?.borderColor || "border-purple-500",
        "border-2",
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-purple-600" />
          Final Verdict
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Winner Announcement */}
        {winnerDisplay ? (
          <div
            className={cn(
              "rounded-lg p-4 text-center border-2",
              winnerDisplay.bgColor,
              winnerDisplay.borderColor
            )}
          >
            <winnerDisplay.icon
              className={cn("h-10 w-10 mx-auto mb-2", winnerDisplay.color)}
            />
            <p className={cn("text-2xl font-bold", winnerDisplay.color)}>
              {winnerDisplay.text}
            </p>
          </div>
        ) : (
          <div className="rounded-lg p-4 text-center bg-muted">
            {isStreaming ? (
              <div className="animate-pulse">
                <Scale className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">
                  Deliberating...
                </p>
              </div>
            ) : (
              <>
                <Minus className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">
                  Awaiting verdict
                </p>
              </>
            )}
          </div>
        )}

        {/* Score Comparison */}
        {finalScores && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Final Scores
            </h4>
            <ScoreComparisonBar
              scoreA={finalScores.a}
              scoreB={finalScores.b}
              agentAName={agentAName}
              agentBName={agentBName}
            />
          </div>
        )}

        {/* Analysis */}
        {analysis && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Judge's Analysis
            </h4>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {analysis}
              </p>
            </div>
          </div>
        )}

        {/* Streaming indicator for analysis */}
        {isStreaming && !analysis && winner && (
          <div className="text-center py-2">
            <Badge variant="secondary" className="animate-pulse">
              Writing analysis...
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
