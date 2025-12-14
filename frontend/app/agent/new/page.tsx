"use client";

import { AgentEditor } from "@/components/agent/agent-editor";

export default function NewAgentPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Agent</h1>
        <p className="text-muted-foreground">
          Configure your AI debate agent's personality and parameters
        </p>
      </div>

      <AgentEditor mode="create" />
    </div>
  );
}
