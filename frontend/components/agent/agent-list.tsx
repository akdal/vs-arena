"use client";

/**
 * AgentList Component
 * Grid display of agent cards with loading/empty states
 */

import { useAgents } from "@/hooks/use-agents";
import { AgentCard } from "./agent-card";
import { Skeleton } from "@/components/ui/skeleton";

export function AgentList() {
  const { data: agents, isLoading, error } = useAgents();

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load agents: {error.message}</p>
      </div>
    );
  }

  // Empty state
  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
        <p className="text-muted-foreground mb-6">
          Create your first agent to get started with VS Arena
        </p>
      </div>
    );
  }

  // Agent grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <AgentCard key={agent.agent_id} agent={agent} />
      ))}
    </div>
  );
}
