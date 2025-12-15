"use client";

/**
 * AgentDetailDrawer Component
 * Sheet-based drawer showing full agent details with preview capability
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentPreviewPanel } from "./agent-preview-panel";
import type { Agent } from "@/lib/types";
import Link from "next/link";

interface AgentDetailDrawerProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentDetailDrawer({
  agent,
  open,
  onOpenChange,
}: AgentDetailDrawerProps) {
  if (!agent) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {agent.name}
            <Badge variant="secondary">{agent.model}</Badge>
          </SheetTitle>
          <SheetDescription>
            Created {new Date(agent.created_at).toLocaleDateString()}
          </SheetDescription>
        </SheetHeader>

        {/* Persona Details */}
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold text-sm">Persona</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(agent.persona_json).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="text-muted-foreground capitalize">{key}</span>
                <span className="font-medium">
                  {Array.isArray(value) ? value.join(", ") : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold text-sm">Parameters</h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {Object.entries(agent.params_json).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="mt-6">
          <AgentPreviewPanel
            agentConfig={{
              name: agent.name,
              model: agent.model,
              persona_json: agent.persona_json,
              params_json: agent.params_json,
            }}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/agent/${agent.agent_id}/edit`}>Edit Agent</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/debate">Use in Debate</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
