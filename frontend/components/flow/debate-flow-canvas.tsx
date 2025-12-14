"use client";

/**
 * Debate Flow Canvas
 * Main React Flow visualization component
 */

import { useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./nodes";
import { edgeTypes } from "./edges";
import { useDebateFlow } from "@/hooks/use-debate-flow";
import type { RunDetail, DebatePhase } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface DebateFlowCanvasProps {
  run: RunDetail;
  currentPhase: DebatePhase | null;
  isStreaming: boolean;
  onPhaseStart?: (phase: DebatePhase) => void;
  onToken?: (content: string) => void;
  onPhaseEnd?: (phase: DebatePhase) => void;
  onScore?: (data: Record<string, unknown>) => void;
  onVerdict?: (data: Record<string, unknown>) => void;
}

export function DebateFlowCanvas({
  run,
  currentPhase: externalCurrentPhase,
  isStreaming,
}: DebateFlowCanvasProps) {
  const { fitView } = useReactFlow();

  const { nodes, edges, currentPhase, onNodesChange, onEdgesChange } =
    useDebateFlow({
      run,
      onLayoutChange: () => {
        // Fit view after layout change
        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
      },
    });

  // Fit view on initial mount
  useEffect(() => {
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [fitView]);

  const formatPhase = (phase: string | null) => {
    if (!phase) return "Waiting...";
    return phase
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="h-[600px] w-full rounded-lg border bg-slate-50 dark:bg-slate-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "sequence",
        }}
      >
        <Background color="#e2e8f0" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.agent === "a") return "hsl(221, 83%, 53%)";
            if (n.data?.agent === "b") return "hsl(0, 84%, 60%)";
            if (n.data?.agent === "judge") return "hsl(258, 90%, 66%)";
            return "#94a3b8";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Panel position="top-right" className="flex gap-2 items-center">
          <Badge variant={isStreaming ? "default" : "secondary"}>
            {isStreaming ? "Live" : "Completed"}
          </Badge>
          <Badge variant="outline">
            {formatPhase(externalCurrentPhase || currentPhase)}
          </Badge>
        </Panel>
      </ReactFlow>
    </div>
  );
}
