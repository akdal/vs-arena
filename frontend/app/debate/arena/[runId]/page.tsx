"use client";

/**
 * Debate Arena Page
 * Real-time debate streaming view
 */

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRun } from "@/hooks/use-debate";
import { DebateStreamView } from "@/components/debate/debate-stream-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function DebateArenaPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.runId as string;

  const { data: run, isLoading, error } = useRun(runId);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Debate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error.message}</p>
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
      <div className="max-w-6xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Debate Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The requested debate could not be found.</p>
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

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/debate">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Setup
            </Button>
          </Link>
          <Badge variant={run.status === "completed" ? "default" : "secondary"}>
            {run.status}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold mb-2">Debate Arena</h1>
        <p className="text-muted-foreground text-lg">{run.topic}</p>
      </div>

      {/* Run Details */}
      <Card className="mb-6">
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

      {/* Stream View */}
      <DebateStreamView runId={runId} autoStart={true} />
    </div>
  );
}
