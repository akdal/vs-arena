"use client";

/**
 * DebateStreamView Component
 * Displays real-time debate streaming with phase indicators and verdict
 */

import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useDebateStream } from "@/hooks/use-debate-stream";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerdictPanel, type FinalScores } from "@/components/arena/verdict-panel";
import { ScoreCard, type ScoreData } from "@/components/arena/score-card";
import type { DebatePhase } from "@/lib/types";

interface DebateStreamViewProps {
  runId: string;
  autoStart?: boolean;
}

interface ParsedScores {
  agentA: {
    opening?: ScoreData;
    rebuttal?: ScoreData;
    summary?: ScoreData;
  };
  agentB: {
    opening?: ScoreData;
    rebuttal?: ScoreData;
    summary?: ScoreData;
  };
  final?: FinalScores;
}

interface ParsedVerdict {
  winner?: "a" | "b" | "tie";
  analysis?: string;
}

export function DebateStreamView({
  runId,
  autoStart = true,
}: DebateStreamViewProps) {
  const {
    isStreaming,
    currentPhase,
    content,
    scores,
    verdict,
    error,
    startStream,
    stopStream,
  } = useDebateStream();

  useEffect(() => {
    if (autoStart && runId) {
      startStream(runId);
    }
    return () => {
      stopStream();
    };
  }, [runId, autoStart, startStream, stopStream]);

  // Show toast notification for errors
  useEffect(() => {
    if (error) {
      toast.error(error, {
        duration: 5000,
      });
    }
  }, [error]);

  // Parse scores into structured format
  const parsedScores = useMemo((): ParsedScores => {
    const result: ParsedScores = {
      agentA: {},
      agentB: {},
    };

    Object.entries(scores).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        const scoreValue = value as Record<string, unknown>;
        const phase = (scoreValue.phase as string) || key;
        const scoreData = scoreValue.scores as ScoreData | undefined;

        if (phase.includes("opening_a") && scoreData) {
          result.agentA.opening = scoreData;
        } else if (phase.includes("opening_b") && scoreData) {
          result.agentB.opening = scoreData;
        } else if (phase.includes("rebuttal_a") && scoreData) {
          result.agentA.rebuttal = scoreData;
        } else if (phase.includes("rebuttal_b") && scoreData) {
          result.agentB.rebuttal = scoreData;
        } else if (phase.includes("summary_a") && scoreData) {
          result.agentA.summary = scoreData;
        } else if (phase.includes("summary_b") && scoreData) {
          result.agentB.summary = scoreData;
        }

        // Check for final scores in verdict event
        if (scoreValue.final_scores) {
          const finalScores = scoreValue.final_scores as Record<string, number>;
          result.final = {
            a: finalScores.a || 0,
            b: finalScores.b || 0,
          };
        }
      }
    });

    return result;
  }, [scores]);

  // Parse verdict into structured format
  const parsedVerdict = useMemo((): ParsedVerdict => {
    if (!verdict) return {};

    // Try to parse winner from verdict string
    const lowerVerdict = verdict.toLowerCase();
    let winner: "a" | "b" | "tie" | undefined;

    if (lowerVerdict.includes("agent a") && lowerVerdict.includes("win")) {
      winner = "a";
    } else if (lowerVerdict.includes("agent b") && lowerVerdict.includes("win")) {
      winner = "b";
    } else if (lowerVerdict.includes("tie") || lowerVerdict.includes("draw")) {
      winner = "tie";
    }

    return {
      winner,
      analysis: verdict,
    };
  }, [verdict]);

  const formatPhase = (phase: string | null) => {
    if (!phase) return "Waiting...";
    return phase
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const hasScores =
    parsedScores.agentA.opening ||
    parsedScores.agentA.rebuttal ||
    parsedScores.agentA.summary ||
    parsedScores.agentB.opening ||
    parsedScores.agentB.rebuttal ||
    parsedScores.agentB.summary;

  return (
    <div className="space-y-6">
      {/* Phase Indicator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Current Phase</CardTitle>
            <Badge variant={isStreaming ? "default" : "secondary"}>
              {isStreaming ? "Live" : "Completed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            {formatPhase(currentPhase)}
          </p>
        </CardContent>
      </Card>

      {/* Content Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Debate Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          {!content && isStreaming && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}

          {!content && !isStreaming && !error && (
            <p className="text-muted-foreground">
              Click &quot;Start Stream&quot; to begin watching the debate.
            </p>
          )}

          {content && (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {content}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scores Display */}
      {hasScores && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Scores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Agent A Scores */}
            {parsedScores.agentA.opening && (
              <ScoreCard
                phase={"score_opening_a" as DebatePhase}
                agent="a"
                scores={parsedScores.agentA.opening}
              />
            )}
            {parsedScores.agentA.rebuttal && (
              <ScoreCard
                phase={"score_rebuttal_a" as DebatePhase}
                agent="a"
                scores={parsedScores.agentA.rebuttal}
              />
            )}
            {parsedScores.agentA.summary && (
              <ScoreCard
                phase={"score_summary_a" as DebatePhase}
                agent="a"
                scores={parsedScores.agentA.summary}
              />
            )}

            {/* Agent B Scores */}
            {parsedScores.agentB.opening && (
              <ScoreCard
                phase={"score_opening_b" as DebatePhase}
                agent="b"
                scores={parsedScores.agentB.opening}
              />
            )}
            {parsedScores.agentB.rebuttal && (
              <ScoreCard
                phase={"score_rebuttal_b" as DebatePhase}
                agent="b"
                scores={parsedScores.agentB.rebuttal}
              />
            )}
            {parsedScores.agentB.summary && (
              <ScoreCard
                phase={"score_summary_b" as DebatePhase}
                agent="b"
                scores={parsedScores.agentB.summary}
              />
            )}
          </div>
        </div>
      )}

      {/* Verdict Display */}
      {(verdict || (isStreaming && currentPhase === "judge_verdict")) && (
        <VerdictPanel
          winner={parsedVerdict.winner}
          finalScores={parsedScores.final}
          analysis={parsedVerdict.analysis}
          isStreaming={isStreaming && currentPhase === "judge_verdict"}
        />
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-2 border-destructive">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isStreaming && !content && (
          <Button onClick={() => startStream(runId)} size="lg">
            Start Stream
          </Button>
        )}
        {isStreaming && (
          <Button onClick={stopStream} variant="destructive" size="lg">
            Stop Stream
          </Button>
        )}
      </div>
    </div>
  );
}
