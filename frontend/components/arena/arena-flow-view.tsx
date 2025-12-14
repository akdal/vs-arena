"use client";

/**
 * Arena Flow View
 * Integrates React Flow visualization with Turn Indicator and Action Side Panel
 */

import { useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "../flow/nodes";
import { edgeTypes } from "../flow/edges";
import { useDebateFlow } from "@/hooks/use-debate-flow";
import type { RunDetail } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { TurnIndicator } from "./turn-indicator";
import { ActionSidePanel } from "./action-side-panel";
import { ArenaLayout } from "./arena-layout";

interface ArenaFlowViewProps {
  run: RunDetail;
  autoStart?: boolean;
  header: React.ReactNode;
}

function FlowContent({
  run,
  autoStart,
  header,
}: ArenaFlowViewProps) {
  const { fitView, setCenter, getNode } = useReactFlow();
  const prevPhaseRef = useRef<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Load panel state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("arena-panel-open");
    if (savedState !== null) {
      setIsPanelOpen(savedState === "true");
    }
  }, []);

  // Save panel state to localStorage
  const handlePanelToggle = () => {
    const newState = !isPanelOpen;
    setIsPanelOpen(newState);
    localStorage.setItem("arena-panel-open", String(newState));
  };

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

      setTimeout(() => {
        const node = getNode(currentPhase);
        if (node) {
          const nodeWidth = 320;
          const nodeHeight = 150;
          const x = node.position.x + nodeWidth / 2;
          const y = node.position.y + nodeHeight / 2;
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
    <ArenaLayout
      header={header}
      turnIndicator={
        <TurnIndicator
          currentPhase={currentPhase}
          isStreaming={isStreaming}
          run={run}
        />
      }
      mainContent={
        <div className="h-[600px] w-full rounded-lg border bg-slate-50 dark:bg-slate-900">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === "topic") return "#94a3b8";
                if ("agent" in node.data) {
                  if (node.data.agent === "a") return "hsl(217, 91%, 60%)";
                  if (node.data.agent === "b") return "hsl(0, 84%, 60%)";
                  if (node.data.agent === "judge") return "hsl(271, 91%, 65%)";
                }
                return "#94a3b8";
              }}
              style={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Panel position="top-right" className="bg-background/95 backdrop-blur rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={isStreaming ? "default" : "secondary"}>
                  {isStreaming ? "Live" : "Ready"}
                </Badge>
                {currentPhase && (
                  <span className="text-sm font-medium">
                    {formatPhase(currentPhase)}
                  </span>
                )}
              </div>
              {error && (
                <div className="text-xs text-destructive">{error}</div>
              )}
            </Panel>
          </ReactFlow>
        </div>
      }
      sidePanel={
        <ActionSidePanel
          run={run}
          nodes={nodes}
          currentPhase={currentPhase}
          isOpen={isPanelOpen}
          onToggle={handlePanelToggle}
        />
      }
    />
  );
}

export function ArenaFlowView(props: ArenaFlowViewProps) {
  return <FlowContent {...props} />;
}
