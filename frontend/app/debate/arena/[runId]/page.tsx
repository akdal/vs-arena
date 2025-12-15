"use client";

/**
 * Debate Arena Page
 * Real-time debate streaming view with text/flow toggle
 */

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRun, useRunTurns } from "@/hooks/use-debate";
import { DebateStreamView } from "@/components/debate/debate-stream-view";
import { FlowProvider } from "@/components/flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, LayoutGrid, AlignLeft, Play } from "lucide-react";
import { ArenaFlowView, ArenaReplayView } from "@/components/arena";
import { SwapTestButton } from "@/components/arena/swap-test-button";
import { SwapComparisonView } from "@/components/arena/swap-comparison-view";

type ViewMode = "text" | "flow" | "replay";

export default function DebateArenaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const runId = params.runId as string;
  const originalRunId = searchParams.get("original"); // For swap test comparison
  const [viewMode, setViewMode] = useState<ViewMode>("text");

  const { data: run, isLoading, error } = useRun(runId);

  // Fetch turns for replay mode
  const { data: turns } = useRunTurns(viewMode === "replay" ? runId : null);
  const isCompleted = run?.status === "completed";

  // Show comparison when this is a swap test run and both runs are completed
  const showComparison = originalRunId && isCompleted;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
        <div className="mb-8 space-y-4">
          <Skeleton className="h-8 w-48 sm:w-64" />
          <Skeleton className="h-4 w-full sm:w-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 sm:h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Debate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm sm:text-base">{error.message}</p>
            <Link href="/debate">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Setup
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="max-w-6xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Debate Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm sm:text-base">The requested debate could not be found.</p>
            <Link href="/debate">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Setup
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const headerContent = (
    <div>
      {/* Header */}
      <div className="mb-4">
        {/* Top row: Back + Status + View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <Link href="/debate">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <Badge variant={run.status === "completed" ? "default" : "secondary"}>
              {run.status}
            </Badge>
            {/* Swap Test Button - only show for completed runs without original */}
            {isCompleted && !originalRunId && (
              <SwapTestButton runId={runId} isCompleted={isCompleted} />
            )}
          </div>

          {/* View Mode Toggle - Scrollable on mobile */}
          <div className="flex items-center gap-1 sm:gap-2 bg-muted rounded-lg p-1 overflow-x-auto">
            <Button
              variant={viewMode === "text" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("text")}
              className="shrink-0"
            >
              <AlignLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Text</span>
            </Button>
            <Button
              variant={viewMode === "flow" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("flow")}
              className="shrink-0"
            >
              <LayoutGrid className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Flow</span>
            </Button>
            {isCompleted && (
              <Button
                variant={viewMode === "replay" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("replay")}
                className="shrink-0"
              >
                <Play className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Replay</span>
              </Button>
            )}
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Debate Arena</h1>
        <p className="text-muted-foreground text-base sm:text-lg line-clamp-2 sm:line-clamp-none">{run.topic}</p>
      </div>

      {/* Run Details */}
      <Card>
        <CardHeader>
          <CardTitle>Debate Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Agent A */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Agent A</p>
              <p className="font-medium">{run.agent_a.name}</p>
              <Badge variant="outline" className="mt-1">
                {run.position_a}
              </Badge>
            </div>

            {/* Agent B */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Agent B</p>
              <p className="font-medium">{run.agent_b.name}</p>
              <Badge variant="outline" className="mt-1">
                {run.position_b}
              </Badge>
            </div>

            {/* Judge */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Judge</p>
              <p className="font-medium">{run.agent_j.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
      {/* View Content */}
      {viewMode === "text" && (
        <>
          {headerContent}
          <div className="mt-4 sm:mt-6">
            <DebateStreamView runId={runId} autoStart={true} />
          </div>
        </>
      )}
      {viewMode === "flow" && (
        <FlowProvider>
          <ArenaFlowView run={run} autoStart={true} header={headerContent} />
        </FlowProvider>
      )}
      {viewMode === "replay" && turns && (
        <FlowProvider>
          <ArenaReplayView run={run} turns={turns} header={headerContent} />
        </FlowProvider>
      )}
      {viewMode === "replay" && !turns && (
        <>
          {headerContent}
          <div className="mt-4 sm:mt-6 flex items-center justify-center h-48 sm:h-64">
            <div className="text-muted-foreground text-sm sm:text-base">Loading replay data...</div>
          </div>
        </>
      )}

      {/* Swap Test Comparison - shown when this is a swap test result */}
      {showComparison && (
        <div className="mt-4 sm:mt-6">
          <SwapComparisonView
            originalRunId={originalRunId}
            swapRunId={runId}
          />
        </div>
      )}
    </div>
  );
}
