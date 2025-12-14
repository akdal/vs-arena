"use client";

import { use } from "react";
import { useAgent } from "@/hooks/use-agents";
import { AgentEditor } from "@/components/agent/agent-editor";
import { Skeleton } from "@/components/ui/skeleton";

interface EditAgentPageProps {
  params: Promise<{ agentId: string }>;
}

export default function EditAgentPage({ params }: EditAgentPageProps) {
  const { agentId } = use(params);
  const { data: agent, isLoading, error } = useAgent(agentId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load agent: {error.message}</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Agent not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Agent</h1>
        <p className="text-muted-foreground">
          Modify {agent.name}'s configuration
        </p>
      </div>

      <AgentEditor mode="edit" agent={agent} />
    </div>
  );
}
