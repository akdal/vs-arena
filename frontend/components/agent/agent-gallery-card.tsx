"use client";

/**
 * AgentGalleryCard Component
 * Click-focused card for the gallery/showcase view
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/lib/types";

interface AgentGalleryCardProps {
  agent: Agent;
  onClick: () => void;
}

export function AgentGalleryCard({ agent, onClick }: AgentGalleryCardProps) {
  const persona = agent.persona_json as Record<string, unknown>;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{agent.name}</CardTitle>
          <Badge variant="secondary">{agent.model}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground space-y-1">
          {persona.role ? <p>Role: {String(persona.role)}</p> : null}
          {persona.style ? <p>Style: {String(persona.style)}</p> : null}
          {persona.tone ? <p>Tone: {String(persona.tone)}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
