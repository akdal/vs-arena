"use client";

/**
 * AgentPreviewPanel Component
 * SSE streaming preview for agent testing
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAgentPreview } from "@/hooks/use-agent-preview";
import type { AgentCreate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentPreviewPanelProps {
  agentConfig: AgentCreate;
  disabled?: boolean;
}

export function AgentPreviewPanel({
  agentConfig,
  disabled = false,
}: AgentPreviewPanelProps) {
  const [topic, setTopic] = useState("");
  const [position, setPosition] = useState<"FOR" | "AGAINST">("FOR");

  const { isStreaming, content, error, startPreview, stopPreview } =
    useAgentPreview();

  // Show toast notification for errors
  useEffect(() => {
    if (error) {
      toast.error(error, {
        duration: 5000,
      });
    }
  }, [error]);

  const handlePreview = () => {
    if (isStreaming) {
      stopPreview();
    } else {
      startPreview({
        agent_config: agentConfig,
        topic,
        position,
      });
    }
  };

  const canPreview =
    !disabled &&
    topic.trim().length > 0 &&
    agentConfig.name &&
    agentConfig.model;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Agent</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Topic Input */}
        <div className="space-y-2">
          <Label htmlFor="preview-topic">Debate Topic</Label>
          <Input
            id="preview-topic"
            placeholder="e.g., Should AI be regulated?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={disabled || isStreaming}
          />
        </div>

        {/* Position Select */}
        <div className="space-y-2">
          <Label htmlFor="preview-position">Position</Label>
          <Select
            value={position}
            onValueChange={(val) => setPosition(val as "FOR" | "AGAINST")}
            disabled={disabled || isStreaming}
          >
            <SelectTrigger id="preview-position">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FOR">FOR (Supporting)</SelectItem>
              <SelectItem value="AGAINST">AGAINST (Opposing)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview Button */}
        <Button
          onClick={handlePreview}
          disabled={!canPreview}
          variant={isStreaming ? "destructive" : "default"}
          className="w-full"
        >
          {isStreaming ? "Stop Preview" : "Start Preview"}
        </Button>

        {/* Preview Output */}
        {(content || error || isStreaming) && (
          <div className="space-y-2">
            <Label>Preview Output</Label>
            <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-md border bg-muted/50 p-4">
              {error && (
                <div className="text-sm text-destructive">Error: {error}</div>
              )}
              {!error && (
                <div className="text-sm whitespace-pre-wrap">
                  {content || (isStreaming && "Generating...")}
                  {isStreaming && <span className="animate-pulse">▊</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
