"use client";

/**
 * DebateSetupForm Component
 * Main form for setting up a new debate
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStartDebate } from "@/hooks/use-debate";
import { AgentSelector } from "./agent-selector";
import { PositionSelector } from "./position-selector";
import { DebateConfig } from "./debate-config";
import { RubricEditor } from "./rubric-editor";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DebateConfig as DebateConfigType,
  RubricConfig,
} from "@/lib/types";

export function DebateSetupForm() {
  const router = useRouter();
  const { mutate: startDebate, isPending, error } = useStartDebate();

  // Form state
  const [topic, setTopic] = useState("");
  const [agentAId, setAgentAId] = useState("");
  const [agentBId, setAgentBId] = useState("");
  const [judgeId, setJudgeId] = useState("");
  const [positionA, setPositionA] = useState<"FOR" | "AGAINST" | "">("");
  const [positionB, setPositionB] = useState<"FOR" | "AGAINST" | "">("");
  const [config, setConfig] = useState<DebateConfigType>({});
  const [rubric, setRubric] = useState<RubricConfig>({});

  // Validation
  const isPositionsValid =
    positionA &&
    positionB &&
    ((positionA === "FOR" && positionB === "AGAINST") ||
      (positionA === "AGAINST" && positionB === "FOR"));

  const isFormValid =
    topic.trim().length > 0 &&
    topic.trim().length <= 500 &&
    agentAId &&
    agentBId &&
    judgeId &&
    isPositionsValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    startDebate(
      {
        topic: topic.trim(),
        position_a: positionA as "FOR" | "AGAINST",
        position_b: positionB as "FOR" | "AGAINST",
        agent_a_id: agentAId,
        agent_b_id: agentBId,
        agent_j_id: judgeId,
        config: Object.keys(config).length > 0 ? config : undefined,
        rubric: Object.keys(rubric).length > 0 ? rubric : undefined,
      },
      {
        onSuccess: (response) => {
          // Navigate to arena page
          router.push(`/debate/arena/${response.run_id}`);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Topic */}
      <div className="space-y-2">
        <Label htmlFor="topic">Debate Topic</Label>
        <Textarea
          id="topic"
          placeholder="Enter the debate topic (1-500 characters)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
          maxLength={500}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {topic.length}/500 characters
        </p>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent A */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agent A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AgentSelector
              value={agentAId}
              onChange={setAgentAId}
              label="Select Agent"
              disabled={isPending}
            />
            <PositionSelector
              value={positionA}
              onChange={setPositionA}
              label="Position"
              disabled={isPending}
            />
          </CardContent>
        </Card>

        {/* Agent B */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agent B</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AgentSelector
              value={agentBId}
              onChange={setAgentBId}
              label="Select Agent"
              disabled={isPending}
            />
            <PositionSelector
              value={positionB}
              onChange={setPositionB}
              label="Position"
              disabled={isPending}
            />
          </CardContent>
        </Card>
      </div>

      {/* Position Validation Warning */}
      {positionA && positionB && !isPositionsValid && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
          Warning: Agents must take opposite positions (one FOR, one AGAINST)
        </div>
      )}

      {/* Agent Uniqueness Warning */}
      {agentAId && agentBId && agentAId === agentBId && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">
          Note: You've selected the same agent for both sides. This is allowed
          for testing purposes.
        </div>
      )}

      {/* Judge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Judge</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentSelector
            value={judgeId}
            onChange={setJudgeId}
            label="Select Judge Agent"
            disabled={isPending}
          />
        </CardContent>
      </Card>

      {/* Advanced Configuration */}
      <DebateConfig value={config} onChange={setConfig} disabled={isPending} />

      {/* Scoring Rubric */}
      <RubricEditor value={rubric} onChange={setRubric} disabled={isPending} />

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
          Error: {error.message}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!isFormValid || isPending}
      >
        {isPending ? "Starting Debate..." : "Start Debate"}
      </Button>
    </form>
  );
}
