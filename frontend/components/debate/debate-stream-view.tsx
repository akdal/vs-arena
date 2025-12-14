"use client";

/**
 * DebateStreamView Component
 * Displays real-time debate streaming with phase indicators
 */

import { useEffect } from "react";
import { useDebateStream } from "@/hooks/use-debate-stream";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DebateStreamViewProps {
  runId: string;
  autoStart?: boolean;
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
    // Cleanup on unmount
    return () => {
      stopStream();
    };
  }, [runId, autoStart, startStream, stopStream]);

  const formatPhase = (phase: string | null) => {
    if (!phase) return "Waiting...";
    return phase
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

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
      {Object.keys(scores).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm">
              {JSON.stringify(scores, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Verdict Display */}
      {verdict && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-lg">Final Verdict</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{verdict}</p>
          </CardContent>
        </Card>
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
