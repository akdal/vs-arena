"use client";

/**
 * Arena Flow View
 * Integrates React Flow visualization with Turn Indicator and Action Side Panel
 *
 * IMPORTANT: This component must be wrapped in FlowProvider (ReactFlowProvider)
 * to use useReactFlow hooks. The parent component is responsible for providing this context.
 */

import { useState, useEffect, useRef, useCallback } from "react";
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
import { NODE_DIMENSIONS } from "./constants";

export interface ArenaFlowViewProps {
  run: RunDetail;
  autoStart?: boolean;
  header: React.ReactNode;
}

const STORAGE_KEY = "arena-panel-open";

/**
 * FlowContent component that uses React Flow hooks
 * Must be rendered within FlowProvider context
 */
function FlowContent({
  run,
  autoStart,
  header,
}: ArenaFlowViewProps) {
  const { fitView, setCenter, getNode } = useReactFlow();
  const prevPhaseRef = useRef<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Load panel state from localStorage with error handling
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState !== null) {
        setIsPanelOpen(savedState === "true");
      }
    } catch {
      // localStorage unavailable (private browsing, quota exceeded, etc.)
      // Use default state (panel open)
    }
  }, []);

  // Save panel state to localStorage with error handling
  const handlePanelToggle = useCallback(() => {
    const newState = !isPanelOpen;
    setIsPanelOpen(newState);
    try {
      localStorage.setItem(STORAGE_KEY, String(newState));
    } catch {
      // localStorage unavailable, silently ignore
    }
  }, [isPanelOpen]);

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
          const x = node.position.x + NODE_DIMENSIONS.width / 2;
          const y = node.position.y + NODE_DIMENSIONS.height / 2;
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
        <div className="min-h-[500px] h-[calc(100vh-400px)] max-h-[800px] w-full rounded-lg border bg-slate-50 dark:bg-slate-900">
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
