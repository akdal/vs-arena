"use client";

/**
 * Debate Flow Canvas
 * Main React Flow visualization component
 */

import { useEffect, useRef } from "react";
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
  autoStart?: boolean;
}

export function DebateFlowCanvas({
  run,
  autoStart = false,
}: DebateFlowCanvasProps) {
  const { fitView, setCenter, getNode } = useReactFlow();
  const prevPhaseRef = useRef<string | null>(null);

  const {
    nodes,
    edges,
    currentPhase,
    isStreaming,
    error,
    onNodesChange,
    onEdgesChange,
    startStream,
  } = useDebateFlow({
    run,
    onLayoutChange: () => {
      // Only fitView for the first node (topic), auto-scroll handles the rest
      if (nodes.length <= 1) {
        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
      }
    },
  });

  // Start streaming on mount if autoStart is true
  useEffect(() => {
    if (autoStart && run.run_id) {
      startStream(run.run_id);
    }
  }, [autoStart, run.run_id, startStream]);

  // Fit view on initial mount
  useEffect(() => {
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [fitView]);

  // Auto-scroll to current phase when it changes
  useEffect(() => {
    if (currentPhase && currentPhase !== prevPhaseRef.current) {
      prevPhaseRef.current = currentPhase;

      // Small delay to allow layout to settle
      setTimeout(() => {
        const node = getNode(currentPhase);
        if (node) {
          // Calculate node center (from layout.ts: default nodeWidth=320, nodeHeight=150)
          const nodeWidth = 320;
          const nodeHeight = 150;
          const x = node.position.x + nodeWidth / 2;
          const y = node.position.y + nodeHeight / 2;

          // Smooth pan to node center
          setCenter(x, y, { duration: 500, zoom: 1 });
        }
      }, 100);
    }
  }, [currentPhase, getNode, setCenter]);

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
          <Badge variant="outline">{formatPhase(currentPhase)}</Badge>
          {error && (
            <Badge variant="destructive" className="text-xs">
              Error: {error}
            </Badge>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}
