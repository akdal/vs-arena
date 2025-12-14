"use client";

/**
 * AgentEditor Component
 * Form for creating and editing agents
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Agent, AgentCreate } from "@/lib/types";
import { useCreateAgent, useUpdateAgent } from "@/hooks/use-agents";
import { ModelSelector } from "./model-selector";
import { PersonaEditor } from "./persona-editor";
import { ParamsEditor } from "./params-editor";
import { AgentPreviewPanel } from "./agent-preview-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentEditorProps {
  mode: "create" | "edit";
  agent?: Agent;
}

const defaultAgentConfig: AgentCreate = {
  name: "",
  model: "",
  persona_json: {
    role: "Debater",
    style: "Analytical",
    tone: "Professional",
  },
  params_json: {
    temperature: 0.7,
    max_tokens: 1024,
    top_p: 0.9,
  },
};

export function AgentEditor({ mode, agent }: AgentEditorProps) {
  const router = useRouter();
  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();

  // Form state
  const [name, setName] = useState(agent?.name ?? "");
  const [model, setModel] = useState(agent?.model ?? "");
  const [personaJson, setPersonaJson] = useState<Record<string, unknown>>(
    agent?.persona_json ?? defaultAgentConfig.persona_json
  );
  const [paramsJson, setParamsJson] = useState<Record<string, unknown>>(
    agent?.params_json ?? defaultAgentConfig.params_json
  );

  // Update form when agent prop changes
  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setModel(agent.model);
      setPersonaJson(agent.persona_json);
      setParamsJson(agent.params_json);
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const agentData: AgentCreate = {
      name: name.trim(),
      model,
      persona_json: personaJson,
      params_json: paramsJson,
    };

    try {
      if (mode === "create") {
        await createMutation.mutateAsync(agentData);
      } else if (agent) {
        await updateMutation.mutateAsync({
          id: agent.agent_id,
          data: agentData,
        });
      }

      // Navigate back to agent list on success
      router.push("/agent");
    } catch (error) {
      console.error("Failed to save agent:", error);
    }
  };

  const handleCancel = () => {
    router.push("/agent");
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const canSubmit = name.trim().length > 0 && model.length > 0 && !isLoading;

  const currentConfig: AgentCreate = {
    name: name.trim() || "Unnamed Agent",
    model: model || "llama3",
    persona_json: personaJson,
    params_json: paramsJson,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {mode === "create" ? "Create Agent" : "Edit Agent"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  placeholder="e.g., Logical Larry"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  maxLength={50}
                  required
                />
              </div>

              {/* Model Selector */}
              <ModelSelector
                value={model}
                onChange={setModel}
                disabled={isLoading}
              />

              {/* Persona Editor */}
              <PersonaEditor
                value={personaJson}
                onChange={setPersonaJson}
                disabled={isLoading}
              />

              {/* Params Editor */}
              <ParamsEditor
                value={paramsJson}
                onChange={setParamsJson}
                disabled={isLoading}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="flex-1"
            >
              {isLoading
                ? "Saving..."
                : mode === "create"
                ? "Create Agent"
                : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>

          {/* Error Display */}
          {(createMutation.error || updateMutation.error) && (
            <div className="text-sm text-destructive">
              Error:{" "}
              {createMutation.error?.message || updateMutation.error?.message}
            </div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div>
          <AgentPreviewPanel
            agentConfig={currentConfig}
            disabled={isLoading}
          />
        </div>
      </div>
    </form>
  );
}
