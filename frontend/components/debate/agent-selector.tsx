"use client";

/**
 * AgentSelector Component
 * Dropdown for selecting agents with model badge
 */

import { useAgents } from "@/hooks/use-agents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface AgentSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

export function AgentSelector({
  value,
  onChange,
  label,
  disabled = false,
}: AgentSelectorProps) {
  const { data: agents, isLoading, error } = useAgents();

  return (
    <div className="space-y-2">
      <Label htmlFor={`agent-select-${label}`}>{label}</Label>

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={`agent-select-${label}`}>
          <SelectValue placeholder="Select an agent" />
        </SelectTrigger>
        <SelectContent>
          {isLoading && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Loading agents...
            </div>
          )}

          {error && (
            <div className="px-2 py-1.5 text-sm text-destructive">
              Failed to load agents: {error.message}
            </div>
          )}

          {agents && agents.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No agents available. Create one first.
            </div>
          )}

          {agents?.map((agent) => (
            <SelectItem key={agent.agent_id} value={agent.agent_id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{agent.name}</span>
                <Badge variant="outline" className="text-xs">
                  {agent.model}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
