"use client";

/**
 * AgentCard Component
 * Display card for a single agent with actions
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Agent } from "@/lib/types";
import { useCloneAgent, useDeleteAgent } from "@/hooks/use-agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const router = useRouter();
  const cloneMutation = useCloneAgent();
  const deleteMutation = useDeleteAgent();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    router.push(`/agent/${agent.agent_id}/edit`);
  };

  const handleClone = async () => {
    try {
      await cloneMutation.mutateAsync(agent.agent_id);
    } catch (error) {
      console.error("Failed to clone agent:", error);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }

    try {
      await deleteMutation.mutateAsync(agent.agent_id);
    } catch (error) {
      console.error("Failed to delete agent:", error);
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleting(false);
  };

  const temperature = (agent.params_json.temperature as number) ?? 0.7;
  const maxTokens = (agent.params_json.max_tokens as number) ?? 1024;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{agent.name}</CardTitle>
          <Badge variant="secondary">{agent.model}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Persona Info */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Persona</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {Object.entries(agent.persona_json).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium capitalize">{key}:</span>{" "}
                {String(value)}
              </div>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Parameters</h4>
          <div className="flex gap-3 text-sm text-muted-foreground">
            <span>Temp: {temperature}</span>
            <span>·</span>
            <span>Tokens: {maxTokens}</span>
          </div>
        </div>

        {/* Actions */}
        {!isDeleting ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClone}
              disabled={cloneMutation.isPending}
              className="flex-1"
            >
              {cloneMutation.isPending ? "Cloning..." : "Clone"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-destructive">
              Are you sure you want to delete this agent?
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1"
              >
                {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelDelete}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
